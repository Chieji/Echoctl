/**
 * Gemini Extension Importer
 * 
 * Imports extensions from Gemini CLI
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { getExtensionRegistry, type Extension } from '../extensions/registry.js';

/**
 * Gemini extension format
 */
interface GeminiExtension {
  name: string;
  description?: string;
  version?: string;
  endpoint?: string;
  apiKey?: string;
  instructions?: string;
}

/**
 * Gemini config format
 */
interface GeminiConfig {
  extensions?: GeminiExtension[];
  customExtensions?: GeminiExtension[];
}

/**
 * Known Gemini config paths
 */
const GEMINI_CONFIG_PATHS = [
  join(homedir(), '.gemini', 'extensions.json'),
  join(homedir(), '.config', 'gemini', 'extensions.json'),
  join(homedir(), 'Library', 'Application Support', 'Gemini', 'extensions.json'),
  join(process.env.APPDATA || '', 'Gemini', 'extensions.json'),
];

/**
 * Import extensions from Gemini
 */
export async function importGeminiExtensions(): Promise<number> {
  const registry = getExtensionRegistry();
  let importedCount = 0;
  
  console.log(chalk.cyan('\n🔍 Searching for Gemini extensions...\n'));
  
  // Find Gemini config
  let geminiConfig: GeminiConfig | null = null;
  let configPath: string | null = null;
  
  for (const path of GEMINI_CONFIG_PATHS) {
    if (existsSync(path)) {
      try {
        const content = await readFile(path, 'utf-8');
        geminiConfig = JSON.parse(content);
        configPath = path;
        console.log(chalk.dim(`Found Gemini config: ${path}`));
        break;
      } catch (error: any) {
        console.log(chalk.dim(`Failed to read ${path}: ${error.message}`));
      }
    }
  }
  
  if (!geminiConfig || !configPath) {
    console.log(chalk.yellow('⚠ No Gemini extensions found\n'));
    return 0;
  }
  
  // Get extensions from config
  const extensions = [...(geminiConfig.extensions || []), ...(geminiConfig.customExtensions || [])];
  
  if (extensions.length === 0) {
    console.log(chalk.yellow('⚠ No extensions defined in Gemini config\n'));
    return 0;
  }
  
  console.log(chalk.green(`Found ${extensions.length} Gemini extension(s)\n`));
  
  // Import each extension
  for (const ext of extensions) {
    try {
      const extensionId = `gemini-${ext.name}`;
      
      // Skip if already exists
      if (registry.get(extensionId)) {
        console.log(chalk.dim(`  ⊘ Skipping ${ext.name} (already exists)`));
        continue;
      }
      
      // Create extension
      const extension: Extension = {
        id: extensionId,
        name: ext.name,
        description: ext.description || `Gemini extension: ${ext.name}`,
        source: 'skill',
        enabled: true,
        version: ext.version,
        skillConfig: {
          ecosystem: 'gemini',
          promptTemplate: ext.instructions,
        },
        url: ext.endpoint,
        invoke: async (args) => {
          // Gemini extensions can be API endpoints or prompt templates
          if (ext.endpoint) {
            // API endpoint - would need to make HTTP call
            return {
              endpoint: ext.endpoint,
              variables: args,
              source: 'gemini',
            };
          } else {
            // Prompt template
            return {
              prompt: ext.instructions || '',
              variables: args,
              source: 'gemini',
            };
          }
        },
      };
      
      // Register
      await registry.register(extension);
      importedCount++;
      
      console.log(chalk.dim(`  ✓ Imported: ${ext.name}`));
      
    } catch (error: any) {
      console.log(chalk.red(`  ✗ Failed to import ${ext.name}: ${error.message}`));
    }
  }
  
  console.log(chalk.green(`\n✓ Imported ${importedCount} Gemini extension(s)\n`));
  
  return importedCount;
}

/**
 * Add Gemini sync to extension sync command
 */
export async function syncGeminiExtensions(): Promise<void> {
  const count = await importGeminiExtensions();
  
  if (count > 0) {
    console.log(chalk.green(`✓ Gemini extension sync complete: ${count} extension(s) imported\n`));
  } else {
    console.log(chalk.yellow('⚠ No Gemini extensions to sync\n'));
  }
}
