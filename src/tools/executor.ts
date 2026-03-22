/**
 * Tool Execution Engine
 * Handles shell commands, file I/O, and code execution
 * 
 * SECURITY FIX 1.3: Replaced exec() with execFile() + allowlist
 * - No shell interpretation
 * - Explicit argument validation
 * - Bypassable blocklist replaced with strict allowlist
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

/**
 * SECURITY FIX 1.3: Allowlist-based command validation
 * Only explicitly permitted commands and arguments are allowed
 */
const ALLOWLISTED_COMMANDS = {
  'git': ['status', 'log', 'diff', 'clone', 'pull', 'push', 'commit', 'branch', 'checkout', 'add', 'init', 'remote', 'fetch', 'merge', 'rebase'],
  'npm': ['install', 'run', 'test', 'build', 'start', 'list', 'info', 'outdated', 'audit', 'ci'],
  'node': ['--version', '--help'],
  'python3': ['--version', '--help'],
  'ls': ['-la', '-l', '-a', '-h', '-R'],
  'cat': [],
  'grep': ['-r', '-i', '-n', '-l', '-c', '-v', '-E'],
  'find': ['.', '-name', '-type', '-path', '-exec', '-delete'],
  'mkdir': ['-p', '-m'],
  'touch': [],
  'cp': ['-r', '-f', '-v'],
  'mv': ['-f', '-v'],
  'pwd': [],
  'whoami': [],
  'date': [],
  'echo': [],
  'wc': ['-l', '-w', '-c'],
  'head': ['-n'],
  'tail': ['-n', '-f'],
  'sort': ['-r', '-n', '-u'],
  'uniq': ['-c', '-d', '-u'],
  'cut': ['-d', '-f'],
  'sed': ['-e', '-i', '-n'],
  'awk': ['-F', '-v'],
  'tr': ['-d', '-s', '-c'],
  'file': [],
  'stat': [],
  'du': ['-h', '-s', '-a'],
  'df': ['-h'],
  'ps': ['aux', '-ef'],
  'top': ['-b', '-n'],
  'which': [],
  'whereis': [],
  'type': [],
  'command': [],
};

/**
 * Resolve command path from allowed locations
 */
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

/**
 * Validate that an argument is in the allowed list for the command
 */
function validateArgument(command: string, arg: string): boolean {
  // Block common dangerous patterns
  const dangerousPatterns = [/^\/$/, /^\/\*$/, /^\/home\/?$/, /^\/etc\/?$/, /^\/root\/?$/, /^\/boot\/?$/];
  if (dangerousPatterns.some(pattern => pattern.test(arg))) {
    return false;
  }

  const allowedArgs = ALLOWLISTED_COMMANDS[command as keyof typeof ALLOWLISTED_COMMANDS];
  
  if (!allowedArgs) {
    return false;
  }
  
  // If command has no restrictions (empty array), allow any argument
  if (allowedArgs.length === 0) {
    return true;
  }
  
  // Check if argument is in the allowed list
  if ((allowedArgs as string[]).includes(arg)) {
    return true;
  }
  
  // Allow file paths (don't start with -)
  if (!arg.startsWith('-')) {
    return true;
  }
  
  return false;
}

/**
 * Execute a shell command safely using execFile (no shell interpretation)
 * SECURITY: Uses allowlist + execFile to prevent command injection
 */
export async function runCommand(
  command: string,
  options: { timeout?: number; cwd?: string } = {}
): Promise<ToolResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 30000; // 30s default
  const cwd = options.cwd || process.cwd();

  try {
    // Parse command and arguments
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // 1. Validate command is in allowlist
    if (!(cmd in ALLOWLISTED_COMMANDS)) {
      return {
        success: false,
        output: '',
        error: `Security: Command not allowed: ${cmd}`,
      };
    }

    // 2. Validate each argument
    for (const arg of args) {
      // Check for command injection characters in arguments
      const injectionChars = [';', '&', '|', '>', '<', '$', '(', ')', '`', '*', '?', '[', ']', '{', '}', '\\'];
      for (const char of injectionChars) {
        if (arg.includes(char)) {
          return {
            success: false,
            output: '',
            error: `Security: Potential command injection detected in argument: ${arg}`,
          };
        }
      }

      if (!validateArgument(cmd, arg)) {
        return {
          success: false,
          output: '',
          error: `Security: Argument not allowed for ${cmd}: ${arg}`,
        };
      }

      // Prevent path traversal in arguments
      if (arg.includes('..') || arg.includes('~')) {
        return {
          success: false,
          output: '',
          error: `Security: Path traversal detected in argument: ${arg}`,
        };
      }
    }

    // 3. Validate working directory (prevent path traversal)
    if (cwd) {
      const resolvedCwd = resolve(cwd);
      const homeDir = os.homedir();
      const allowedBase = resolve(homeDir);
      const appRoot = resolve('/app');
      
      if (!resolvedCwd.startsWith(allowedBase) && !resolvedCwd.startsWith('/tmp') && !resolvedCwd.startsWith(appRoot)) {
        return {
          success: false,
          output: '',
          error: `Security: Working directory outside allowed base: ${resolvedCwd}`,
        };
      }
    }

    // 4. Execute with execFile (no shell interpretation)
    const cmdPath = resolveCommand(cmd);
    
    const { stdout, stderr } = await execFileAsync(cmdPath, args, {
      cwd,
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB
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
import { searchWeb, scrapeUrl, getNews } from './web.js';
import { getGitStatus, gitAdd, gitAddAll, gitCommit, gitPush, gitLog } from './git.js';
import { findAndReplace, searchInFiles, createFiles, updateFiles, deleteFiles, findFiles, getFileTree } from './multi-file.js';

export const webTools = {
  searchWeb,
  scrapeUrl,
  getNews,
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
