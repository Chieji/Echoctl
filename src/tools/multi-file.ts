/**
 * Multi-file Editing Tools
 * Batch file operations for efficient codebase modifications
 */

import { readFile, writeFile, mkdir, stat, readdir, copyFile, rm, access } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';

const execAsync = promisify(exec);

/**
 * Helper to check if a file exists asynchronously
 * Performance: Replaces synchronous existsSync to avoid blocking the event loop (by Bolt ⚡)
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export interface FileEdit {
  path: string;
  oldContent?: string;
  newContent: string;
  operation: 'create' | 'update' | 'delete' | 'rename';
  newPath?: string;
}

export interface BatchEditResult {
  success: boolean;
  edited: string[];
  created: string[];
  deleted: string[];
  failed: Array<{ path: string; error: string }>;
  backupPath?: string;
}

export interface FileSearchResult {
  path: string;
  matches: number;
  lines: Array<{
    number: number;
    content: string;
  }>;
}

/**
 * Create backup of files before editing
 * Performance: Parallelized file copying and used native fs.copyFile (by Bolt ⚡)
 */
export async function createBackup(files: string[], cwd: string = process.cwd()): Promise<string> {
  const timestamp = Date.now();
  const backupDir = join(cwd, `.echo-backup-${timestamp}`);
  await mkdir(backupDir, { recursive: true });

  await Promise.all(files.map(async (file) => {
    const absPath = join(cwd, file);
    if (await fileExists(absPath)) {
      const relativePath = relative(cwd, absPath);
      const backupPath = join(backupDir, relativePath);
      await mkdir(join(backupPath, '..'), { recursive: true });
      await copyFile(absPath, backupPath);
    }
  }));

  return backupDir;
}

/**
 * Find and replace across multiple files
 * Performance: Parallelized file operations using Promise.all (by Bolt ⚡)
 */
export async function findAndReplace(
  pattern: string | RegExp,
  replacement: string,
  files: string[],
  cwd: string = process.cwd()
): Promise<BatchEditResult> {
  const edited: string[] = [];
  const failed: Array<{ path: string; error: string }> = [];

  await Promise.all(files.map(async (file) => {
    try {
      const absPath = join(cwd, file);
      const content = await readFile(absPath, 'utf-8');
      // Recreate regex to ensure thread-safety with /g flag in parallel operations
      const regex = typeof pattern === 'string' 
        ? new RegExp(pattern, 'g')
        : new RegExp(pattern.source, pattern.flags);
      
      const newContent = content.replace(regex, replacement);
      
      if (newContent !== content) {
        await writeFile(absPath, newContent, 'utf-8');
        edited.push(file);
      }
    } catch (error: any) {
      failed.push({ path: file, error: error.message });
    }
  }));

  return {
    success: failed.length === 0,
    edited,
    created: [],
    deleted: [],
    failed,
  };
}

/**
 * Search for pattern in multiple files
 * Performance: Parallelized file reading using Promise.all (by Bolt ⚡)
 */
export async function searchInFiles(
  pattern: string | RegExp,
  files: string[],
  cwd: string = process.cwd()
): Promise<FileSearchResult[]> {
  const results: FileSearchResult[] = [];

  await Promise.all(files.map(async (file) => {
    try {
      const absPath = join(cwd, file);
      const content = await readFile(absPath, 'utf-8');
      const lines = content.split('\n');
      // Create a new regex instance per file to avoid shared state issues (lastIndex)
      // when parallelizing searches with global/sticky flags.
      const regex = typeof pattern === 'string' 
        ? new RegExp(pattern, 'gi')
        : new RegExp(pattern.source, pattern.flags);

      const matches: Array<{ number: number; content: string }> = [];
      
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          matches.push({
            number: index + 1,
            content: line.trim(),
          });
        }
      });

      if (matches.length > 0) {
        results.push({
          path: file,
          matches: matches.length,
          lines: matches,
        });
      }
    } catch {
      // Skip files that can't be read
    }
  }));

  return results;
}

/**
 * Batch create files
 * Performance: Parallelized file creation using Promise.all (by Bolt ⚡)
 */
export async function createFiles(
  files: Array<{ path: string; content: string }>,
  cwd: string = process.cwd()
): Promise<BatchEditResult> {
  const created: string[] = [];
  const failed: Array<{ path: string; error: string }> = [];

  await Promise.all(files.map(async ({ path: filePath, content }) => {
    try {
      const absPath = join(cwd, filePath);
      await mkdir(join(absPath, '..'), { recursive: true });
      await writeFile(absPath, content, 'utf-8');
      created.push(filePath);
    } catch (error: any) {
      failed.push({ path: filePath, error: error.message });
    }
  }));

  return {
    success: failed.length === 0,
    edited: [],
    created,
    deleted: [],
    failed,
  };
}

/**
 * Batch update files
 * Performance: Parallelized file updates using Promise.all (by Bolt ⚡)
 */
export async function updateFiles(
  edits: Array<{ path: string; content: string }>,
  cwd: string = process.cwd()
): Promise<BatchEditResult> {
  const edited: string[] = [];
  const failed: Array<{ path: string; error: string }> = [];

  await Promise.all(edits.map(async ({ path: filePath, content }) => {
    try {
      const absPath = join(cwd, filePath);
      if (!(await fileExists(absPath))) {
        failed.push({ path: filePath, error: 'File not found' });
        return;
      }
      
      await writeFile(absPath, content, 'utf-8');
      edited.push(filePath);
    } catch (error: any) {
      failed.push({ path: filePath, error: error.message });
    }
  }));

  return {
    success: failed.length === 0,
    edited,
    created: [],
    deleted: [],
    failed,
  };
}

/**
 * Batch delete files
 * Performance: Parallelized deletions and used native fs.rm (by Bolt ⚡)
 */
export async function deleteFiles(
  files: string[],
  cwd: string = process.cwd()
): Promise<BatchEditResult> {
  const deleted: string[] = [];
  const failed: Array<{ path: string; error: string }> = [];

  await Promise.all(files.map(async (file) => {
    try {
      const absPath = join(cwd, file);
      if (!(await fileExists(absPath))) {
        return;
      }
      
      await rm(absPath, { recursive: true, force: true });
      deleted.push(file);
    } catch (error: any) {
      failed.push({ path: file, error: error.message });
    }
  }));

  return {
    success: failed.length === 0,
    edited: [],
    created: [],
    deleted,
    failed,
  };
}

/**
 * Find files by pattern (glob-like)
 */
export async function findFiles(
  pattern: string,
  cwd: string = process.cwd()
): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`find . -name "${pattern}" -type f`, { cwd });
    return stdout.trim().split('\n').filter(Boolean).map(f => f.startsWith('./') ? f.slice(2) : f);
  } catch {
    return [];
  }
}

/**
 * Get file tree structure
 */
export async function getFileTree(
  dir: string = '.',
  cwd: string = process.cwd(),
  maxDepth: number = 3
): Promise<string> {
  const result: string[] = [];
  
  async function walk(currentDir: string, depth: number, prefix: string = '') {
    if (depth > maxDepth) return;
    
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      const sorted = entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        const isLast = i === sorted.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const childPrefix = prefix + (isLast ? '    ' : '│   ');

        if (entry.name.startsWith('.') && entry.name !== '.' && depth > 0) continue;
        
        result.push(prefix + connector + entry.name + (entry.isDirectory() ? '/' : ''));
        
        if (entry.isDirectory()) {
          await walk(join(currentDir, entry.name), depth + 1, childPrefix);
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  const absDir = join(cwd, dir);
  result.push(join(dir, '/'));
  await walk(absDir, 0);
  
  return result.join('\n');
}

/**
 * Calculate file hash
 */
export async function getFileHash(filePath: string, cwd: string = process.cwd()): Promise<string> {
  const absPath = join(cwd, filePath);
  const content = await readFile(absPath, 'utf-8');
  return createHash('sha256').update(content).digest('hex').substring(0, 12);
}

/**
 * Multi-file edit tools export
 */
export const multiFileTools = {
  createBackup,
  findAndReplace,
  searchInFiles,
  createFiles,
  updateFiles,
  deleteFiles,
  findFiles,
  getFileTree,
  getFileHash,
};
