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
    const projectRoot = process.cwd();
    // In CI environments, we allow /home/runner/work as a base directory (Performance: Bolt ⚡)
    const allowedBase = resolve(homeDir);

    if (
      !resolvedCwd.startsWith(allowedBase) &&
      !resolvedCwd.startsWith('/tmp') &&
      !resolvedCwd.startsWith('/home/runner/work') &&
      !resolvedCwd.startsWith(projectRoot)
    ) {
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


export const tools = {
  runCommand,
};

export const webTools = {};
export const gitTools = {};
export const multiFileTools = {};
export const lspTools = {};
export const browserTools = {};
export const githubTools = {};
export const voiceTools = {};
export const imageTools = {};

export type ToolName = keyof typeof tools | 'readFile' | 'writeFile' | 'listFiles' | 'deleteFile' | 'executePython' | 'executeNode' | 'searchWeb' | 'scrapeUrl' | 'getNews' | 'getGitStatus' | 'gitLog' | 'searchInFiles' | 'findFiles' | 'getFileTree' | 'findSymbolReferences' | 'findSymbolDefinition' | 'detectProjectLanguage' | 'getLinks' | 'searchGoogle';
