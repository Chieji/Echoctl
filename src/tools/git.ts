/**
 * Git Integration Tools
 * Git operations for Echo CLI
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  changed: string[];
  staged: string[];
  untracked: string[];
  clean: boolean;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface CommitResult {
  success: boolean;
  hash?: string;
  message?: string;
  error?: string;
}

/**
 * Check if git is installed
 */
export async function isGitInstalled(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if directory is a git repo
 */
export async function isGitRepo(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir', { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git status
 */
export async function getGitStatus(cwd: string = process.cwd()): Promise<GitStatus> {
  try {
    // Get current branch
    const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd });
    const branch = branchOut.trim();

    // Get ahead/behind
    const { stdout: remoteOut } = await execAsync(
      'git rev-list --left-right --count origin/HEAD...HEAD 2>/dev/null || echo "0\t0"',
      { cwd }
    );
    // git rev-list --left-right returns [remote_count, local_count]
    // remote_count = commits on remote not in local = behind
    // local_count = commits on local not in remote = ahead
    const [behind, ahead] = remoteOut.trim().split('\t').map(Number);

    // Get changed files
    const { stdout: changedOut } = await execAsync('git diff --name-only', { cwd });
    const changed = changedOut.trim().split('\n').filter(Boolean);

    // Get staged files
    const { stdout: stagedOut } = await execAsync('git diff --cached --name-only', { cwd });
    const staged = stagedOut.trim().split('\n').filter(Boolean);

    // Get untracked files
    const { stdout: untrackedOut } = await execAsync('git ls-files --others --exclude-standard', { cwd });
    const untracked = untrackedOut.trim().split('\n').filter(Boolean);

    return {
      branch,
      ahead: ahead || 0,
      behind: behind || 0,
      changed,
      staged,
      untracked,
      clean: changed.length === 0 && staged.length === 0 && untracked.length === 0,
    };
  } catch (error: any) {
    throw new Error(`Failed to get git status: ${error.message}`);
  }
}

/**
 * Get diff for a file
 */
export async function getGitDiff(file?: string, cwd: string = process.cwd()): Promise<GitDiff[]> {
  try {
    const files = file ? [file] : (await getGitStatus(cwd)).changed;
    const diffs: GitDiff[] = [];

    for (const f of files) {
      const { stdout } = await execAsync(`git diff "${f}"`, { cwd });
      
      const additions = (stdout.match(/^\+[^+]/gm) || []).length;
      const deletions = (stdout.match(/^-[^-]/gm) || []).length;

      diffs.push({
        file: f,
        additions,
        deletions,
        patch: stdout,
      });
    }

    return diffs;
  } catch (error: any) {
    throw new Error(`Failed to get git diff: ${error.message}`);
  }
}

/**
 * Stage files
 */
export async function gitAdd(files: string | string[], cwd: string = process.cwd()): Promise<void> {
  const fileList = Array.isArray(files) ? files : [files];
  
  for (const file of fileList) {
    await execAsync(`git add "${file}"`, { cwd });
  }
}

/**
 * Stage all changes
 */
export async function gitAddAll(cwd: string = process.cwd()): Promise<void> {
  await execAsync('git add -A', { cwd });
}

/**
 * Commit changes
 */
export async function gitCommit(message: string, cwd: string = process.cwd()): Promise<CommitResult> {
  try {
    // Escape double quotes in commit message to prevent shell injection
    const safeMessage = message.replace(/"/g, '\\"');
    const { stdout } = await execAsync(`git commit -m "${safeMessage}"`, { cwd });
    const hashMatch = stdout.match(/\[([^\]]+)\s+([a-f0-9]+)/);
    
    return {
      success: true,
      hash: hashMatch?.[2],
      message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Push to remote
 */
export async function gitPush(branch?: string, cwd: string = process.cwd()): Promise<void> {
  const branchArg = branch ? `origin ${branch}` : '';
  await execAsync(`git push ${branchArg}`, { cwd });
}

/**
 * Pull from remote
 */
export async function gitPull(cwd: string = process.cwd()): Promise<void> {
  await execAsync('git pull', { cwd });
}

/**
 * Create branch
 */
export async function gitCreateBranch(branch: string, cwd: string = process.cwd()): Promise<void> {
  // Sanitize branch name: only allow alphanumeric, hyphens, underscores, slashes, dots
  const safeBranch = branch.replace(/[^a-zA-Z0-9\-_\/.]/g, '');
  await execAsync(`git checkout -b ${safeBranch}`, { cwd });
}

/**
 * Switch branch
 */
export async function gitCheckout(branch: string, cwd: string = process.cwd()): Promise<void> {
  const safeBranch = branch.replace(/[^a-zA-Z0-9\-_\/.]/g, '');
  await execAsync(`git checkout ${safeBranch}`, { cwd });
}

/**
 * Get commit history
 */
export async function gitLog(limit: number = 10, cwd: string = process.cwd()): Promise<Array<{
  hash: string;
  message: string;
  author: string;
  date: string;
}>> {
  try {
    const { stdout } = await execAsync(
      `git log -${limit} --pretty=format:'%H|%s|%an|%ad' --date=short`,
      { cwd }
    );

    return stdout.split('\n').map(line => {
      const [hash, message, author, date] = line.split('|');
      return { hash, message, author, date };
    });
  } catch (error: any) {
    throw new Error(`Failed to get git log: ${error.message}`);
  }
}

/**
 * Create GitHub PR (via gh CLI)
 */
export async function createPullRequest(
  title: string,
  body?: string,
  base?: string,
  cwd: string = process.cwd()
): Promise<{ url?: string; error?: string }> {
  try {
    // Check if gh is installed
    try {
      await execAsync('gh --version');
    } catch {
      return { error: 'GitHub CLI (gh) not installed. Install from: https://cli.github.com' };
    }

    // Escape double quotes in title and body to prevent shell injection
    const safeTitle = title.replace(/"/g, '\\"');
    const bodyArg = body ? `-b "${body.replace(/"/g, '\\"')}"` : '';
    const baseArg = base ? `-B ${base.replace(/[^a-zA-Z0-9\-_\/.]/g, '')}` : '';
    
    const { stdout } = await execAsync(
      `gh pr create --title "${safeTitle}" ${bodyArg} ${baseArg}`,
      { cwd }
    );

    const urlMatch = stdout.match(/(https:\/\/github\.com\/[^\s]+)/);
    
    return { url: urlMatch?.[1] };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Git tools export
 */
export const gitTools = {
  isGitInstalled,
  isGitRepo,
  getGitStatus,
  getGitDiff,
  gitAdd,
  gitAddAll,
  gitCommit,
  gitPush,
  gitPull,
  gitCreateBranch,
  gitCheckout,
  gitLog,
  createPullRequest,
};
