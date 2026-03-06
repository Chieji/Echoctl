/**
 * Tool Execution Engine
 * Handles shell commands, file I/O, and code execution
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, readdir, stat, rm } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
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

  // Security: Block dangerous commands
  const dangerousPatterns = [
    'rm -rf /',
    'rm -rf *',
    'dd if=/dev/zero',
    ':(){:|:&};:',
    'mkfs',
    'chmod -R 777 /',
    'wget.*\\|.*sh',
    'curl.*\\|.*sh',
  ];

  for (const pattern of dangerousPatterns) {
    if (new RegExp(pattern).test(command)) {
      return {
        success: false,
        output: '',
        error: `Security: Blocked dangerous command pattern`,
      };
    }
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
  // Write code to temp file
  const tempFile = join(process.cwd(), `echo_temp_${Date.now()}.py`);
  
  try {
    await writeFile(tempFile, code);
    const result = await runCommand(`python3 "${tempFile}"`);
    
    // Cleanup
    try {
      await rm(tempFile);
    } catch {}
    
    return result;
  } catch (error: any) {
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
  const tempFile = join(process.cwd(), `echo_temp_${Date.now()}.js`);
  
  try {
    await writeFile(tempFile, code);
    const result = await runCommand(`node "${tempFile}"`);
    
    // Cleanup
    try {
      await rm(tempFile);
    } catch {}
    
    return result;
  } catch (error: any) {
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

export type ToolName = keyof typeof tools;

// Re-export git, web, and multi-file tools
export * from './git.js';
export * from './web.js';
export * from './multi-file.js';
