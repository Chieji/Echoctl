/**
 * Tool Execution Engine
 * Handles shell commands, file I/O, and code execution
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, readdir, stat, rm } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { existsSync } from 'fs';
import os from 'os';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

/**
 * Security: Dangerous command patterns to block
 * These patterns are checked before any command execution
 */
const DANGEROUS_PATTERNS = [
  // Disk destruction
  { pattern: /rm\s+(-[rf]+\s+)?\/\s*$/, reason: 'Cannot delete root directory' },
  { pattern: /rm\s+(-[rf]+\s+)?\/\s+--no-preserve-root/, reason: 'Cannot delete root directory' },
  { pattern: /rm\s+(-[rf]+\s+)?\*\s*$/, reason: 'Cannot delete all files in directory' },
  { pattern: /rm\s+-rf\s+\.\.\//, reason: 'Cannot delete parent directories recursively' },
  
  // Disk filling / zeroing
  { pattern: /dd\s+if=\/dev\/zero/, reason: 'Cannot write zeros to device' },
  { pattern: /dd\s+if=\/dev\/null/, reason: 'Cannot write null to device' },
  { pattern: /:\(\)\{:\|:&\};:/, reason: 'Fork bomb detected' },
  
  // Filesystem destruction
  { pattern: /mkfs/, reason: 'Cannot create filesystem' },
  { pattern: /mke2fs/, reason: 'Cannot create ext filesystem' },
  { pattern: /fdisk.*-d/, reason: 'Cannot delete partition' },
  
  // Permission escalation
  { pattern: /chmod\s+(-R\s+)?777\s+\/\s*$/, reason: 'Cannot set root to world-writable' },
  { pattern: /chmod\s+(-R\s+)?777\s+\*\s*$/, reason: 'Cannot set all files to world-writable' },
  { pattern: /chown\s+(-R\s+)?root:root\s+\/\s*$/, reason: 'Cannot change root ownership recursively' },
  
  // Download and execute (very dangerous)
  { pattern: /wget.*\|\s*(ba)?sh/, reason: 'Cannot download and execute script' },
  { pattern: /curl.*\|\s*(ba)?sh/, reason: 'Cannot download and execute script' },
  { pattern: /wget.*-O-.*\|/, reason: 'Cannot download and pipe output' },
  { pattern: /curl.*-s.*\|.*sh/, reason: 'Cannot download and execute script' },
  
  // History / audit tampering
  { pattern: /history\s+-c/, reason: 'Cannot clear command history' },
  { pattern: /rm\s+.*\.bash_history/, reason: 'Cannot delete bash history' },
  { pattern: /unset\s+HISTFILE/, reason: 'Cannot disable command history' },
  
  // Process killing
  { pattern: /kill\s+-9\s+1/, reason: 'Cannot kill init process' },
  { pattern: /killall\s+-9/, reason: 'Cannot kill all processes' },
  
  // Environment manipulation
  { pattern: /export\s+PATH=\/dev\/null/, reason: 'Cannot set PATH to null' },
  { pattern: /unset\s+PATH/, reason: 'Cannot unset PATH' },
];

/**
 * Check if a command is dangerous
 */
function isCommandDangerous(command: string): { safe: boolean; reason?: string } {
  const normalizedCommand = command.toLowerCase().trim();
  
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(normalizedCommand)) {
      return { safe: false, reason };
    }
  }
  
  // Additional heuristic: check for multiple dangerous operations chained
  const dangerousChains = ['&& rm -rf', '|| rm -rf', '; rm -rf'];
  for (const chain of dangerousChains) {
    if (normalizedCommand.includes(chain)) {
      return { safe: false, reason: 'Dangerous command chain detected' };
    }
  }
  
  return { safe: true };
}

/**
 * Execute a shell command
 */
export async function runCommand(
  command: string,
  options: { timeout?: number; cwd?: string } = {}
): Promise<ToolResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 30000; // 30s default
  const cwd = options.cwd || process.cwd();

  // Security: Check for dangerous commands
  const safetyCheck = isCommandDangerous(command);
  if (!safetyCheck.safe) {
    return {
      success: false,
      output: '',
      error: `Security: ${safetyCheck.reason}`,
    };
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      cwd,
      maxBuffer: 1024 * 1024 * 10, // 10MB
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
    // Ensure directory exists
    await runCommand(`mkdir -p "${dirname(absolutePath)}"`);
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


// Re-export git, web, and multi-file tools
export * from './git.js';
export * from './web.js';
export * from './multi-file.js';

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

export type ToolName = 
  | keyof typeof tools 
  | keyof typeof webTools 
  | keyof typeof gitTools 
  | keyof typeof multiFileTools 
  | keyof typeof lspTools 
  | keyof typeof browserTools;
