/**
 * Extension Storage - Persistence layer for ExtensionRegistry
 * 
 * Saves/loads extensions to/from config file
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import type { Extension, ExtensionSource } from '../extensions/registry.js';

const ECHO_CONFIG_DIR = join(homedir(), '.config', 'echo-cli');
const EXTENSIONS_CONFIG_PATH = join(ECHO_CONFIG_DIR, 'extensions.json');
const EXTENSIONS_AUTH_PATH = join(ECHO_CONFIG_DIR, 'extensions.auth.json');

/**
 * Serialized extension format for storage
 */
interface StoredExtension {
  id: string;
  name: string;
  description: string;
  source: ExtensionSource;
  enabled: boolean;
  version?: string;
  author?: string;
  url?: string;
  mcpConfig?: {
    serverName: string;
    command?: string;
    url?: string;
  };
  pluginConfig?: {
    path: string;
    entryPoint: string;
  };
  skillConfig?: {
    ecosystem: 'claude' | 'gemini' | 'qwen' | 'echo';
    promptTemplate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Config file format
 */
interface ExtensionsConfig {
  extensions: Record<string, StoredExtension>;
  version: string;
  lastUpdated: string;
}

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  if (!existsSync(ECHO_CONFIG_DIR)) {
    await mkdir(ECHO_CONFIG_DIR, { recursive: true });
    console.log(chalk.dim(`Created config directory: ${ECHO_CONFIG_DIR}`));
  }
}

/**
 * Convert Extension to StoredExtension
 */
function toStoredExtension(ext: Extension): StoredExtension {
  return {
    id: ext.id,
    name: ext.name,
    description: ext.description,
    source: ext.source,
    enabled: ext.enabled,
    version: ext.version,
    author: ext.author,
    url: ext.url,
    mcpConfig: ext.mcpConfig,
    pluginConfig: ext.pluginConfig,
    skillConfig: ext.skillConfig,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert StoredExtension to Extension (without invoke function)
 * Note: invoke function must be restored by the loading code
 */
function toExtension(stored: StoredExtension): Omit<Extension, 'invoke'> {
  return {
    id: stored.id,
    name: stored.name,
    description: stored.description,
    source: stored.source,
    enabled: stored.enabled,
    version: stored.version,
    author: stored.author,
    url: stored.url,
    mcpConfig: stored.mcpConfig,
    pluginConfig: stored.pluginConfig,
    skillConfig: stored.skillConfig,
    inputSchema: undefined, // Will be restored by source-specific logic
  };
}

/**
 * Load extensions from config file
 */
export async function loadExtensions(): Promise<Map<string, StoredExtension>> {
  const extensions = new Map<string, StoredExtension>();
  
  try {
    if (!existsSync(EXTENSIONS_CONFIG_PATH)) {
      console.log(chalk.dim('No existing extensions config found'));
      return extensions;
    }
    
    const content = await readFile(EXTENSIONS_CONFIG_PATH, 'utf-8');
    const config: ExtensionsConfig = JSON.parse(content);
    
    for (const [id, stored] of Object.entries(config.extensions)) {
      extensions.set(id, stored);
    }
    
    console.log(chalk.green(`✓ Loaded ${extensions.size} extension(s) from config`));
    
  } catch (error: any) {
    console.log(chalk.yellow(`⚠ Failed to load extensions: ${error.message}`));
  }
  
  return extensions;
}

/**
 * Save extensions to config file
 */
export async function saveExtensions(extensions: Map<string, StoredExtension>): Promise<void> {
  try {
    await ensureConfigDir();
    
    const config: ExtensionsConfig = {
      extensions: Object.fromEntries(extensions),
      version: '1.0',
      lastUpdated: new Date().toISOString(),
    };
    
    await writeFile(
      EXTENSIONS_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    
    console.log(chalk.dim(`Saved ${extensions.size} extension(s) to config`));
    
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed to save extensions: ${error.message}`));
    throw error;
  }
}

/**
 * Save auth credentials for an extension
 */
export async function saveExtensionAuth(
  extensionId: string,
  credentials: Record<string, string>
): Promise<void> {
  try {
    await ensureConfigDir();
    
    let authConfig: Record<string, Record<string, string>> = {};
    
    if (existsSync(EXTENSIONS_AUTH_PATH)) {
      const content = await readFile(EXTENSIONS_AUTH_PATH, 'utf-8');
      authConfig = JSON.parse(content);
    }
    
    authConfig[extensionId] = credentials;
    
    await writeFile(
      EXTENSIONS_AUTH_PATH,
      JSON.stringify(authConfig, null, 2),
      'utf-8'
    );
    
    console.log(chalk.dim(`Saved auth credentials for: ${extensionId}`));
    
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed to save auth: ${error.message}`));
    throw error;
  }
}

/**
 * Load auth credentials for an extension
 */
export async function loadExtensionAuth(
  extensionId: string
): Promise<Record<string, string> | null> {
  try {
    if (!existsSync(EXTENSIONS_AUTH_PATH)) {
      return null;
    }
    
    const content = await readFile(EXTENSIONS_AUTH_PATH, 'utf-8');
    const authConfig: Record<string, Record<string, string>> = JSON.parse(content);
    
    return authConfig[extensionId] || null;
    
  } catch (error: any) {
    console.log(chalk.yellow(`⚠ Failed to load auth: ${error.message}`));
    return null;
  }
}

/**
 * Delete auth credentials for an extension
 */
export async function deleteExtensionAuth(extensionId: string): Promise<void> {
  try {
    if (!existsSync(EXTENSIONS_AUTH_PATH)) {
      return;
    }
    
    const content = await readFile(EXTENSIONS_AUTH_PATH, 'utf-8');
    const authConfig: Record<string, Record<string, string>> = JSON.parse(content);
    
    delete authConfig[extensionId];
    
    await writeFile(
      EXTENSIONS_AUTH_PATH,
      JSON.stringify(authConfig, null, 2),
      'utf-8'
    );
    
  } catch (error: any) {
    console.log(chalk.yellow(`⚠ Failed to delete auth: ${error.message}`));
  }
}
