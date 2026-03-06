/**
 * ECHO.md Context File Loader
 * Loads project-specific context and rules
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface EchoContext {
  projectName?: string;
  description?: string;
  techStack?: string[];
  rules?: string[];
  codingStandards?: string[];
  customInstructions?: string;
  rawContent: string;
}

/**
 * Find ECHO.md file (searches up the directory tree)
 */
export async function findEchoMd(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = startDir;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    const echoPath = join(currentDir, 'ECHO.md');
    
    if (existsSync(echoPath)) {
      return echoPath;
    }

    const parentDir = join(currentDir, '..');
    if (parentDir === currentDir) {
      break; // Reached root
    }
    
    currentDir = parentDir;
    depth++;
  }

  return null;
}

/**
 * Parse ECHO.md content
 */
export function parseEchoMd(content: string): EchoContext {
  const context: EchoContext = {
    rawContent: content,
  };

  const lines = content.split('\n');
  let currentSection: string | null = null;
  let currentContent: string[] = [];

  const saveSection = () => {
    if (currentSection) {
      const text = currentContent.join('\n').trim();
      switch (currentSection.toLowerCase()) {
        case 'project':
        case 'project name':
          context.projectName = text;
          break;
        case 'description':
          context.description = text;
          break;
        case 'tech stack':
        case 'technologies':
          context.techStack = text.split('\n').map(l => l.replace(/^[-*]\s*/, '').trim());
          break;
        case 'rules':
        case 'project rules':
          context.rules = text.split('\n').map(l => l.replace(/^[-*]\s*/, '').trim());
          break;
        case 'coding standards':
        case 'standards':
          context.codingStandards = text.split('\n').map(l => l.replace(/^[-*]\s*/, '').trim());
          break;
        case 'custom instructions':
        case 'instructions':
          context.customInstructions = text;
          break;
      }
    }
  };

  for (const line of lines) {
    const headerMatch = line.match(/^##+\s*(.+)$/);
    
    if (headerMatch) {
      saveSection();
      currentSection = headerMatch[1].trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  saveSection();
  return context;
}

/**
 * Load and parse ECHO.md
 */
export async function loadEchoContext(startDir?: string): Promise<EchoContext | null> {
  const echoPath = await findEchoMd(startDir);
  
  if (!echoPath) {
    return null;
  }

  try {
    const content = await readFile(echoPath, 'utf-8');
    return parseEchoMd(content);
  } catch (error) {
    console.error('Error loading ECHO.md:', error);
    return null;
  }
}

/**
 * Format context for system prompt
 */
export function formatContextForPrompt(context: EchoContext): string {
  const parts: string[] = [];

  if (context.projectName) {
    parts.push(`Project: ${context.projectName}`);
  }

  if (context.description) {
    parts.push(`Description: ${context.description}`);
  }

  if (context.techStack && context.techStack.length > 0) {
    parts.push(`Tech Stack: ${context.techStack.join(', ')}`);
  }

  if (context.rules && context.rules.length > 0) {
    parts.push('\nProject Rules:');
    context.rules.forEach(rule => parts.push(`- ${rule}`));
  }

  if (context.codingStandards && context.codingStandards.length > 0) {
    parts.push('\nCoding Standards:');
    context.codingStandards.forEach(standard => parts.push(`- ${standard}`));
  }

  if (context.customInstructions) {
    parts.push(`\nCustom Instructions:\n${context.customInstructions}`);
  }

  return parts.join('\n');
}
