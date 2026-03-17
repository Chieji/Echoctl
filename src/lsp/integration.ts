/**
 * LSP (Language Server Protocol) Integration
 * Enables precise code operations like symbol renaming and refactoring
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export interface LSPSymbol {
  name: string;
  kind: number;
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface LSPReference {
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface LSPWorkspaceEdit {
  changes?: { [uri: string]: Array<{ range: any; newText: string }> };
  documentChanges?: any[];
}

/**
 * Find a language server binary
 */
async function findLanguageServer(language: string): Promise<string | null> {
  const servers: Record<string, string[]> = {
    typescript: ['typescript-language-server', 'tsserver'],
    javascript: ['typescript-language-server', 'tsserver'],
    python: ['pylsp', 'pyright-langserver', 'jedi-language-server'],
    rust: ['rust-analyzer'],
    go: ['gopls'],
    java: ['jdtls'],
    cpp: ['clangd'],
    c: ['clangd'],
  };

  const serverNames = servers[language.toLowerCase()] || [];
  
  for (const server of serverNames) {
    try {
      await execAsync(`which ${server}`);
      return server;
    } catch {
      continue;
    }
  }
  
  return null;
}

/**
 * Detect project language from files
 */
export async function detectProjectLanguage(cwd: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync('find . -maxdepth 3 -type f -name "*.*" | head -50', { cwd });
    const files = stdout.trim().split('\n');
    
    const extensions: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'cpp',
      '.hpp': 'cpp',
    };
    
    const counts: Record<string, number> = {};
    
    for (const file of files) {
      const ext = '.' + file.split('.').pop();
      const lang = extensions[ext];
      if (lang) {
        counts[lang] = (counts[lang] || 0) + 1;
      }
    }
    
    // Return language with most files
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Find symbol references using ripgrep (faster than LSP for simple cases)
 */
export async function findSymbolReferences(
  symbolName: string,
  cwd: string = process.cwd()
): Promise<LSPReference[]> {
  try {
    const { stdout } = await execAsync(
      `rg --json "${symbolName}" --glob "*.ts" --glob "*.tsx" --glob "*.js" --glob "*.py"`,
      { cwd, maxBuffer: 10 * 1024 * 1024 }
    );
    
    const lines = stdout.trim().split('\n').filter(l => l);
    const references: LSPReference[] = [];
    
    for (const line of lines) {
      try {
        const match = JSON.parse(line);
        if (match.type === 'match') {
          references.push({
            uri: join(cwd, match.path.text),
            range: {
              start: { line: match.line_number - 1, character: match.submatches[0]?.start || 0 },
              end: { line: match.line_number - 1, character: match.submatches[0]?.end || 0 },
            },
          });
        }
      } catch {
        continue;
      }
    }
    
    return references;
  } catch {
    return [];
  }
}

/**
 * Rename symbol across files
 */
export async function renameSymbol(
  oldName: string,
  newName: string,
  cwd: string = process.cwd()
): Promise<{ success: boolean; filesChanged: number; error?: string }> {
  try {
    const references = await findSymbolReferences(oldName, cwd);
    
    if (references.length === 0) {
      return { success: false, filesChanged: 0, error: 'Symbol not found' };
    }
    
    // Group by file
    const filesToChange = new Map<string, LSPReference[]>();
    for (const ref of references) {
      const existing = filesToChange.get(ref.uri) || [];
      existing.push(ref);
      filesToChange.set(ref.uri, existing);
    }
    
    // Apply changes
    for (const [uri, refs] of filesToChange.entries()) {
      const content = await readFile(uri, 'utf-8');
      const lines = content.split('\n');
      
      // Sort refs by position (reverse to not mess up line numbers)
      refs.sort((a, b) => b.range.start.line - a.range.start.line);
      
      for (const ref of refs) {
        const line = lines[ref.range.start.line];
        if (line) {
          lines[ref.range.start.line] = 
            line.substring(0, ref.range.start.character) +
            newName +
            line.substring(ref.range.end.character);
        }
      }
      
      await writeFile(uri, lines.join('\n'), 'utf-8');
    }
    
    return { success: true, filesChanged: filesToChange.size };
  } catch (error: any) {
    return { success: false, filesChanged: 0, error: error.message };
  }
}

/**
 * Get symbol definition (simplified using grep)
 */
export async function findSymbolDefinition(
  symbolName: string,
  cwd: string = process.cwd()
): Promise<LSPSymbol | null> {
  try {
    // Look for function/class definitions
    const patterns = [
      `function ${symbolName}\\s*\\(`,
      `class ${symbolName}\\s*`,
      `interface ${symbolName}\\s*`,
      `type ${symbolName}\\s*=`,
      `const ${symbolName}\\s*=`,
      `let ${symbolName}\\s*=`,
      `var ${symbolName}\\s*=`,
      `def ${symbolName}\\s*\\(`,  // Python
      `@${symbolName}`,            // Decorators
    ];
    
    for (const pattern of patterns) {
      try {
        const { stdout } = await execAsync(
          `rg --json "${pattern}" --glob "*.ts" --glob "*.tsx" --glob "*.js" --glob "*.py"`,
          { cwd }
        );
        
        const lines = stdout.trim().split('\n').filter(l => l);
        if (lines.length > 0) {
          const match = JSON.parse(lines[0]);
          return {
            name: symbolName,
            kind: pattern.includes('class') ? 5 : 12, // 5 = Class, 12 = Function
            uri: join(cwd, match.path.text),
            range: {
              start: { line: match.line_number - 1, character: 0 },
              end: { line: match.line_number - 1, character: 100 },
            },
          };
        }
      } catch {
        continue;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * LSP tool for agent execution
 */
export const lspTools = {
  findReferences: findSymbolReferences,
  renameSymbol,
  findDefinition: findSymbolDefinition,
  detectLanguage: detectProjectLanguage,
};
