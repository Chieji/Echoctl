/**
 * Universal Plugin Sync - Import skills from Claude, Gemini, Qwen, etc.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

export interface PluginSource {
  platform: 'claude' | 'gemini' | 'qwen' | 'github' | 'npm' | 'url';
  name: string;
  url?: string;
  package?: string;
}

export interface EchoPlugin {
  name: string;
  version: string;
  description: string;
  platform: string;
  originalSource?: string;
  tools: string[];
  prompts: string[];
  config?: Record<string, any>;
  installed: boolean;
}

const PLUGIN_DIR = join(homedir(), '.config', 'echo-cli', 'plugins');
const PLUGIN_INDEX = join(PLUGIN_DIR, 'index.json');

/**
 * Ensure plugin directory exists
 */
async function ensurePluginDir(): Promise<void> {
  if (!existsSync(PLUGIN_DIR)) {
    await mkdir(PLUGIN_DIR, { recursive: true });
  }
}

/**
 * Load plugin index
 */
async function loadPluginIndex(): Promise<EchoPlugin[]> {
  try {
    if (existsSync(PLUGIN_INDEX)) {
      const content = await readFile(PLUGIN_INDEX, 'utf-8');
      return JSON.parse(content) as EchoPlugin[];
    }
  } catch (error) {
    console.error('Error loading plugin index:', error);
  }
  return [];
}

/**
 * Save plugin index
 */
async function savePluginIndex(plugins: EchoPlugin[]): Promise<void> {
  await ensurePluginDir();
  await writeFile(PLUGIN_INDEX, JSON.stringify(plugins, null, 2));
}

// ============================================================================
// CLAUDE CODE SKILLS IMPORT
// ============================================================================

/**
 * Import Claude Code skills from ~/.claude directory
 */
export async function syncClaudeSkills(): Promise<EchoPlugin[]> {
  const imported: EchoPlugin[] = [];
  
  const claudeDir = join(homedir(), '.claude');
  if (!existsSync(claudeDir)) {
    console.log('○ Claude: No skills found (not logged in or no skills installed)');
    return [];
  }

  try {
    // Check for skills directory
    const skillsDir = join(claudeDir, 'skills');
    if (existsSync(skillsDir)) {
      const { readdir } = await import('fs/promises');
      const skills = await readdir(skillsDir);
      
      for (const skill of skills) {
        const skillPath = join(skillsDir, skill);
        const stat = await import('fs/promises').then(m => m.stat(skillPath));
        
        if (stat.isDirectory()) {
          // Try to read skill manifest
          const manifestPath = join(skillPath, 'skill.json');
          if (existsSync(manifestPath)) {
            const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
            
            const plugin: EchoPlugin = {
              name: manifest.name || skill,
              version: manifest.version || '1.0.0',
              description: manifest.description || `Imported from Claude: ${skill}`,
              platform: 'claude',
              originalSource: skillPath,
              tools: manifest.tools || [],
              prompts: manifest.prompts || [],
              config: manifest.config,
              installed: true,
            };
            
            imported.push(plugin);
          }
        }
      }
    }

    // Check for plugins
    const pluginsDir = join(claudeDir, 'plugins');
    if (existsSync(pluginsDir)) {
      const { readdir } = await import('fs/promises');
      const plugins = await readdir(pluginsDir);
      
      for (const plugin of plugins) {
        imported.push({
          name: plugin,
          version: '1.0.0',
          description: `Imported from Claude plugin: ${plugin}`,
          platform: 'claude',
          originalSource: join(pluginsDir, plugin),
          tools: [],
          prompts: [],
          installed: true,
        });
      }
    }

    if (imported.length > 0) {
      console.log(`✓ Claude: Imported ${imported.length} skill(s)`);
    } else {
      console.log('○ Claude: No skills found');
    }
  } catch (error: any) {
    console.log(`○ Claude: Error reading skills - ${error.message}`);
  }

  return imported;
}

// ============================================================================
// GEMINI EXTENSIONS IMPORT
// ============================================================================

/**
 * Import Gemini extensions from ~/.gemini directory
 */
export async function syncGeminiExtensions(): Promise<EchoPlugin[]> {
  const imported: EchoPlugin[] = [];
  
  const geminiDir = join(homedir(), '.gemini');
  if (!existsSync(geminiDir)) {
    console.log('○ Gemini: No extensions found (not logged in or no extensions)');
    return [];
  }

  try {
    // Check for extensions directory
    const extensionsDir = join(geminiDir, 'extensions');
    if (existsSync(extensionsDir)) {
      const { readdir } = await import('fs/promises');
      const extensions = await readdir(extensionsDir);
      
      for (const ext of extensions) {
        const extPath = join(extensionsDir, ext);
        const stat = await import('fs/promises').then(m => m.stat(extPath));
        
        if (stat.isDirectory()) {
          // Try to read extension manifest
          const manifestPath = join(extPath, 'extension.json');
          if (existsSync(manifestPath)) {
            const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
            
            const plugin: EchoPlugin = {
              name: manifest.name || ext,
              version: manifest.version || '1.0.0',
              description: manifest.description || `Imported from Gemini: ${ext}`,
              platform: 'gemini',
              originalSource: extPath,
              tools: manifest.tools || [],
              prompts: manifest.instructions ? [manifest.instructions] : [],
              config: manifest.config,
              installed: true,
            };
            
            imported.push(plugin);
          }
        }
      }
    }

    // Check for config with extensions
    const configPath = join(geminiDir, 'config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(await readFile(configPath, 'utf-8'));
      if (config.extensions) {
        for (const ext of config.extensions) {
          imported.push({
            name: ext.name || ext,
            version: '1.0.0',
            description: `Imported from Gemini config: ${ext.name || ext}`,
            platform: 'gemini',
            originalSource: configPath,
            tools: ext.tools || [],
            prompts: [],
            installed: true,
          });
        }
      }
    }

    if (imported.length > 0) {
      console.log(`✓ Gemini: Imported ${imported.length} extension(s)`);
    } else {
      console.log('○ Gemini: No extensions found');
    }
  } catch (error: any) {
    console.log(`○ Gemini: Error reading extensions - ${error.message}`);
  }

  return imported;
}

// ============================================================================
// QWEN PLUGINS IMPORT
// ============================================================================

/**
 * Import Qwen plugins from ~/.qwen directory
 */
export async function syncQwenPlugins(): Promise<EchoPlugin[]> {
  const imported: EchoPlugin[] = [];
  
  const qwenDir = join(homedir(), '.qwen');
  if (!existsSync(qwenDir)) {
    console.log('○ Qwen: No plugins found (not logged in or no plugins)');
    return [];
  }

  try {
    // Check for extensions directory (Qwen uses .qwen-extension.json)
    const { readdir } = await import('fs/promises');
    const entries = await readdir(qwenDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const extConfigPath = join(qwenDir, entry.name, 'qwen-extension.json');
        if (existsSync(extConfigPath)) {
          const manifest = JSON.parse(await readFile(extConfigPath, 'utf-8'));
          
          const plugin: EchoPlugin = {
            name: manifest.name || entry.name,
            version: manifest.version || '1.0.0',
            description: manifest.description || `Imported from Qwen: ${entry.name}`,
            platform: 'qwen',
            originalSource: join(qwenDir, entry.name),
            tools: manifest.tools || [],
            prompts: manifest.prompts || [],
            config: manifest.config,
            installed: true,
          };
          
          imported.push(plugin);
        }
      }
    }

    // Check for skills directory
    const skillsDir = join(qwenDir, 'skill');
    if (existsSync(skillsDir)) {
      const skills = await readdir(skillsDir, { withFileTypes: true });
      for (const skill of skills) {
        if (skill.isDirectory()) {
          imported.push({
            name: skill.name,
            version: '1.0.0',
            description: `Imported from Qwen skill: ${skill.name}`,
            platform: 'qwen',
            originalSource: join(skillsDir, skill.name),
            tools: [],
            prompts: [],
            installed: true,
          });
        }
      }
    }

    if (imported.length > 0) {
      console.log(`✓ Qwen: Imported ${imported.length} plugin(s)`);
    } else {
      console.log('○ Qwen: No plugins found');
    }
  } catch (error: any) {
    console.log(`○ Qwen: Error reading plugins - ${error.message}`);
  }

  return imported;
}

// ============================================================================
// MCP SERVER IMPORT
// ============================================================================

/**
 * Import MCP servers from other CLI configs
 */
export async function syncMCPServers(): Promise<EchoPlugin[]> {
  const imported: EchoPlugin[] = [];
  
  // Check various MCP config locations
  const mcpConfigs = [
    join(homedir(), '.claude', 'mcp.json'),
    join(homedir(), '.gemini', 'mcp.json'),
    join(homedir(), '.qwen', 'mcp.json'),
    join(homedir(), '.config', 'mcp.json'),
  ];

  for (const configPath of mcpConfigs) {
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(await readFile(configPath, 'utf-8'));
        const servers = config.mcpServers || config.servers || {};
        
        for (const [name, server] of Object.entries(servers as any)) {
          imported.push({
            name: `mcp-${name}`,
            version: '1.0.0',
            description: `MCP server imported: ${name}`,
            platform: 'mcp',
            originalSource: configPath,
            tools: [],
            prompts: [],
            config: server as Record<string, any>,
            installed: true,
          });
        }
        
        console.log(`✓ MCP: Imported ${Object.keys(servers).length} server(s) from ${configPath}`);
      } catch (error: any) {
        console.log(`○ MCP: Error reading ${configPath} - ${error.message}`);
      }
    }
  }

  return imported;
}

// ============================================================================
// UNIVERSAL SYNC
// ============================================================================

/**
 * Sync plugins from all platforms
 */
export async function syncAllPlugins(): Promise<EchoPlugin[]> {
  console.log('\n🔄 Syncing plugins from all platforms...\n');
  
  const allPlugins: EchoPlugin[] = [];
  
  // Sync from each platform
  const claude = await syncClaudeSkills();
  allPlugins.push(...claude);
  
  const gemini = await syncGeminiExtensions();
  allPlugins.push(...gemini);
  
  const qwen = await syncQwenPlugins();
  allPlugins.push(...qwen);
  
  const mcp = await syncMCPServers();
  allPlugins.push(...mcp);
  
  // Save to plugin index
  if (allPlugins.length > 0) {
    const existing = await loadPluginIndex();
    const merged = [...existing, ...allPlugins];
    
    // Remove duplicates
    const unique = merged.filter((p, i, arr) => 
      arr.findIndex(x => x.name === p.name) === i
    );
    
    await savePluginIndex(unique);
    console.log(`\n✓ Total: Synced ${allPlugins.length} plugin(s)\n`);
  } else {
    console.log('\n⚠ No plugins found to sync\n');
  }
  
  return allPlugins;
}

// ============================================================================
// PLUGIN MANAGEMENT
// ============================================================================

/**
 * List installed plugins
 */
export async function listPlugins(): Promise<EchoPlugin[]> {
  return loadPluginIndex();
}

/**
 * Install plugin from npm
 */
export async function installPlugin(packageName: string): Promise<void> {
  await ensurePluginDir();
  
  try {
    await execAsync(`npm install ${packageName}`, { cwd: PLUGIN_DIR });
    console.log(`✓ Installed plugin: ${packageName}`);
    
    // Add to index
    const existing = await loadPluginIndex();
    existing.push({
      name: packageName,
      version: 'latest',
      description: `NPM package: ${packageName}`,
      platform: 'npm',
      tools: [],
      prompts: [],
      installed: true,
    });
    await savePluginIndex(existing);
  } catch (error: any) {
    throw new Error(`Failed to install plugin: ${error.message}`);
  }
}

/**
 * Uninstall plugin
 */
export async function uninstallPlugin(name: string): Promise<void> {
  const plugins = await loadPluginIndex();
  const filtered = plugins.filter(p => p.name !== name);
  await savePluginIndex(filtered);
  console.log(`✓ Uninstalled plugin: ${name}`);
}

/**
 * Enable/disable plugin
 */
export async function setPluginEnabled(name: string, enabled: boolean): Promise<void> {
  const plugins = await loadPluginIndex();
  const plugin = plugins.find(p => p.name === name);
  
  if (!plugin) {
    throw new Error(`Plugin not found: ${name}`);
  }
  
  plugin.installed = enabled;
  await savePluginIndex(plugins);
  
  const action = enabled ? 'Enabled' : 'Disabled';
  console.log(`${action} plugin: ${name}`);
}
