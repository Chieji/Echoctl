/**
 * Tool Execution Engine
 * Handles shell commands, file I/O, and code execution
 *
 * SECURITY: Uses execFile() with explicit policies.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, readdir, stat, rm } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { existsSync } from 'fs';
import os from 'os';

const execFileAsync = promisify(execFile);

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

const READ_ONLY_COMMANDS = new Set([
  'git', 'npm', 'node', 'python3', 'ls', 'cat', 'grep', 'find', 'pwd', 'whoami', 'date',
  'echo', 'wc', 'head', 'tail', 'sort', 'uniq', 'cut', 'sed', 'awk', 'tr', 'file', 'stat',
  'du', 'df', 'ps', 'top', 'which', 'whereis', 'type', 'command',
]);

const MUTATING_COMMANDS = new Set([
  'mkdir', 'touch', 'cp', 'mv',
]);

const ALLOWED_COMMANDS = new Set([...READ_ONLY_COMMANDS, ...MUTATING_COMMANDS]);

const ALLOWED_FLAGS: Record<string, Set<string>> = {
  git: new Set(['status', 'log', 'diff', 'clone', 'pull', 'branch', 'checkout', 'add', 'init', 'remote', 'fetch', 'merge', 'rebase', 'show']),
  npm: new Set(['install', 'run', 'test', 'build', 'start', 'list', 'info', 'outdated', 'audit', 'ci']),
  node: new Set(['--version', '--help']),
  python3: new Set(['--version', '--help']),
  ls: new Set(['-la', '-l', '-a', '-h', '-R']),
  grep: new Set(['-r', '-i', '-n', '-l', '-c', '-v', '-E']),
  find: new Set(['.', '-name', '-type', '-path']),
  mkdir: new Set(['-p', '-m']),
  cp: new Set(['-r', '-f', '-v']),
  mv: new Set(['-f', '-v']),
  wc: new Set(['-l', '-w', '-c']),
  head: new Set(['-n']),
  tail: new Set(['-n']),
  sort: new Set(['-r', '-n', '-u']),
  uniq: new Set(['-c', '-d', '-u']),
  cut: new Set(['-d', '-f']),
  sed: new Set(['-e', '-n']),
  awk: new Set(['-F', '-v']),
  tr: new Set(['-d', '-s', '-c']),
  du: new Set(['-h', '-s', '-a']),
  df: new Set(['-h']),
  ps: new Set(['aux', '-ef']),
  top: new Set(['-b', '-n']),
};

const FORBIDDEN_TOKENS = new Set(['-exec', '-delete', '--delete', '--preserve-root', 'sudo']);

function parseCommand(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escaping = false;

  for (const char of input.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaping || quote) {
    throw new Error('Invalid command: unterminated escape or quote');
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

function resolveCommand(cmd: string): string {
  const allowedPaths = ['/usr/bin', '/bin', '/usr/local/bin', '/usr/sbin', '/sbin'];

  for (const dir of allowedPaths) {
    const fullPath = join(dir, cmd);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  throw new Error(`Command not found in allowed paths: ${cmd}`);
}

function validateArgument(command: string, arg: string): boolean {
  if (FORBIDDEN_TOKENS.has(arg)) {
    return false;
  }

  const allowedFlags = ALLOWED_FLAGS[command];
  if (!allowedFlags || allowedFlags.size === 0) {
    return !arg.startsWith('-') || arg === '-';
  }

  if (!arg.startsWith('-')) {
    return true;
  }

  return allowedFlags.has(arg);
}

function validateTokenSafety(token: string): string | null {
  if (token.includes('..') || token.includes('~')) {
    return `Security: Path traversal detected in argument: ${token}`;
  }

  if (token.includes('\0')) {
    return `Security: Null byte detected in argument: ${token}`;
  }

  return null;
}

export async function runCommand(
  command: string,
  options: { timeout?: number; cwd?: string; allowMutations?: boolean } = {}
): Promise<ToolResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 30000;
  const cwd = options.cwd || process.cwd();

  try {
    const parts = parseCommand(command);
    const [cmd, ...args] = parts;

    if (!cmd) {
      return {
        success: false,
        output: '',
        error: 'Security: Empty command',
      };
    }

    if (!ALLOWED_COMMANDS.has(cmd)) {
      return {
        success: false,
        output: '',
        error: `Security: Command not allowed: ${cmd}`,
      };
    }

    if (MUTATING_COMMANDS.has(cmd) && !options.allowMutations) {
      return {
        success: false,
        output: '',
        error: `Security: Mutating command requires explicit approval: ${cmd}`,
      };
    }

    for (const arg of args) {
      const tokenError = validateTokenSafety(arg);
      if (tokenError) {
        return {
          success: false,
          output: '',
          error: tokenError,
        };
      }

      if (!validateArgument(cmd, arg)) {
        return {
          success: false,
          output: '',
          error: `Security: Argument not allowed for ${cmd}: ${arg}`,
        };
      }
    }

    const resolvedCwd = resolve(cwd);
    const homeDir = os.homedir();
    const allowedBase = resolve(homeDir);

    if (!resolvedCwd.startsWith(allowedBase) && !resolvedCwd.startsWith('/tmp')) {
      return {
        success: false,
        output: '',
        error: `Security: Working directory outside allowed base: ${resolvedCwd}`,
      };
    }

    const cmdPath = resolveCommand(cmd);

    const { stdout, stderr } = await execFileAsync(cmdPath, args, {
      cwd,
      timeout,
      maxBuffer: 1024 * 1024 * 10,
      killSignal: 'SIGTERM',
    });

    return {
      success: true,
      output: stdout || stderr,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Read a file
 */
export async function readFileTool(filePath: string): Promise<ToolResult> {
  try {
    const absolutePath = resolve(filePath);
    const content = await readFile(absolutePath, 'utf-8');
    return {
      success: true,
      output: content,
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

/**
 * Write to a file
 */
export async function writeFileTool(
  filePath: string,
  content: string
): Promise<ToolResult> {
  try {
    const absolutePath = resolve(filePath);
    // Use Node.js mkdir instead of shell command to avoid injection
    const { mkdir } = await import('fs/promises');
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, 'utf-8');
    return {
      success: true,
      output: `Successfully wrote to ${filePath}`,
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

/**
 * List files in a directory
 */
export async function listFilesTool(dirPath: string = '.'): Promise<ToolResult> {
  try {
    const absolutePath = resolve(dirPath);
    const files = await readdir(absolutePath);

    const details = await Promise.all(
      files.map(async (file) => {
        const filePath = join(absolutePath, file);
        const stats = await stat(filePath);
        const type = stats.isDirectory() ? 'dir' : 'file';
        const size = stats.size;
        return `${type.padEnd(4)} ${size.toString().padStart(10)} ${file}`;
      })
    );

    return {
      success: true,
      output: details.join('\n'),
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

/**
 * Delete a file or directory
 */
export async function deleteFileTool(
  filePath: string,
  recursive: boolean = false
): Promise<ToolResult> {
  try {
    const absolutePath = resolve(filePath);
    await rm(absolutePath, { recursive, force: true });
    return {
      success: true,
      output: `Successfully deleted ${filePath}`,
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

/**
 * Execute Python code
 */
export async function executePython(code: string): Promise<ToolResult> {
  // Write code to OS temp directory (not project cwd) for safety
  const tempFile = join(os.tmpdir(), `echo_temp_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);

  try {
    await writeFile(tempFile, code);
    const result = await runCommand(`python3 "${tempFile}"`);

    // Cleanup
    try {
      await rm(tempFile);
    } catch {}

    return result;
  } catch (error: any) {
    // Ensure cleanup even on error
    try { await rm(tempFile); } catch {}
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

/**
 * Execute Node.js code
 */
export async function executeNode(code: string): Promise<ToolResult> {
  // Write code to OS temp directory (not project cwd) for safety
  const tempFile = join(os.tmpdir(), `echo_temp_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);

  try {
    await writeFile(tempFile, code);
    const result = await runCommand(`node "${tempFile}"`);

    // Cleanup
    try {
      await rm(tempFile);
    } catch {}

    return result;
  } catch (error: any) {
    // Ensure cleanup even on error
    try { await rm(tempFile); } catch {}
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

/**
 * Tool registry
 */
export const tools = {
  runCommand,
  readFile: readFileTool,
  writeFile: writeFileTool,
  listFiles: listFilesTool,
  deleteFile: deleteFileTool,
  executePython,
  executeNode,
};

// Re-export tools explicitly to avoid collisions
export { githubTools } from './github.js';
export {
  getGitStatus,
  gitAdd,
  gitAddAll,
  gitCommit,
  gitPush,
  gitLog,
  createPullRequest as gitCreatePullRequest,
} from './git.js';
export * from './multi-file.js';
export * from './voice.js';
export * from './image.js';

// Add web tools to the tools object for ReAct engine
import { 
  searchWeb, 
  scrapeUrl, 
  getNews,
  searchWikipedia,
  getWikipediaSummary,
  getRedditPosts,
  searchReddit,
  getHackerNewsTop,
  getHackerNewsNew,
  getWebArchive,
  getWeatherByCity,
} from './web.js';
import { getGitStatus, gitAdd, gitAddAll, gitCommit, gitPush, gitLog } from './git.js';
import { findAndReplace, searchInFiles, createFiles, updateFiles, deleteFiles, findFiles, getFileTree } from './multi-file.js';

export const webTools = {
  searchWeb,
  scrapeUrl,
  getNews,
  // Zero-config APIs
  searchWikipedia,
  getWikipediaSummary,
  getRedditPosts,
  searchReddit,
  getHackerNewsTop,
  getHackerNewsNew,
  getWebArchive,
  getWeatherByCity,
};

export const gitTools = {
  getGitStatus,
  gitAdd,
  gitAddAll,
  gitCommit,
  gitPush,
  gitLog,
};

export const multiFileTools = {
  findAndReplace,
  searchInFiles,
  createFiles,
  updateFiles,
  deleteFiles,
  findFiles,
  getFileTree,
};

// Add LSP tools for code intelligence
import { findSymbolReferences, renameSymbol, findSymbolDefinition, detectProjectLanguage } from '../lsp/integration.js';
import { browserNavigate, browserScreenshot, browserClick, browserType, browserExtract, browserGetLinks, browserSearchGoogle } from './browser.js';
import { githubTools } from './github.js';
import { voiceTools } from './voice.js';
import { imageTools } from './image.js';

export const lspTools = {
  findSymbolReferences,
  renameSymbol,
  findSymbolDefinition,
  detectProjectLanguage,
};

export const browserTools = {
  navigate: browserNavigate,
  screenshot: browserScreenshot,
  click: browserClick,
  type: browserType,
  extract: browserExtract,
  getLinks: browserGetLinks,
  searchGoogle: browserSearchGoogle,
};

export { voiceTools, imageTools };

export type ToolName =
  | keyof typeof tools
  | keyof typeof webTools
  | keyof typeof gitTools
  | keyof typeof multiFileTools
  | keyof typeof lspTools
  | keyof typeof browserTools
  | keyof typeof githubTools
  | keyof typeof voiceTools
  | keyof typeof imageTools;
