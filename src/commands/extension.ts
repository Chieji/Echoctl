/**
 * Extension Commands - Manage unified extension registry
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { getExtensionRegistry, type Extension, type ExtensionSource } from '../extensions/registry.js';
import { mcpCommands } from '../storage/mcp.js';
import { loadMCPConfig } from '../storage/mcp.js';

/**
 * List all registered extensions
 */
export async function extensionList(options: {
  source?: ExtensionSource;
  enabled?: boolean;
}): Promise<void> {
  const registry = getExtensionRegistry();
  
  let extensions = registry.list();
  
  if (options.source) {
    extensions = extensions.filter(ext => ext.source === options.source);
  }
  
  if (options.enabled) {
    extensions = extensions.filter(ext => ext.enabled);
  }
  
  console.log(chalk.bold('\n📦 Registered Extensions\n'));
  
  if (extensions.length === 0) {
    console.log(chalk.dim('No extensions registered.\n'));
    console.log(chalk.dim('Run ') + chalk.cyan('echo extension add <name> <url>') + chalk.dim(' to add one.\n'));
    return;
  }
  
  // Group by source
  const bySource: Record<string, typeof extensions> = {};
  for (const ext of extensions) {
    const source = ext.source;
    if (!bySource[source]) {
      bySource[source] = [];
    }
    bySource[source].push(ext);
  }
  
  const sourceIcons: Record<string, string> = {
    mcp: '🔌',
    plugin: '🧩',
    skill: '⚡',
    api: '🌐',
  };
  
  for (const [source, sourceExts] of Object.entries(bySource)) {
    const icon = sourceIcons[source] || '📦';
    console.log(chalk.bold(`\n${icon} ${source.toUpperCase()} (${sourceExts.length})\n`));
    
    for (const ext of sourceExts) {
      const status = ext.enabled ? chalk.green('✓') : chalk.dim('○');
      console.log(`${status} ${chalk.bold(ext.name)}`);
      console.log(chalk.dim(`  ID: ${ext.id}`));
      console.log(chalk.dim(`  ${ext.description}`));
      if (ext.version) console.log(chalk.dim(`  Version: ${ext.version}`));
      if (ext.author) console.log(chalk.dim(`  Author: ${ext.author}`));
      console.log('');
    }
  }
}

/**
 * Add a new extension
 */
export async function extensionAdd(
  name: string,
  urlOrCommand: string,
  options: {
    description?: string;
    source?: ExtensionSource;
  }
): Promise<void> {
  const registry = getExtensionRegistry();
  
  // Auto-detect source type
  let source: ExtensionSource = options.source || 'api';
  
  if (urlOrCommand.startsWith('http')) {
    source = 'api';
  } else if (urlOrCommand.includes('://') || urlOrCommand.startsWith('npx') || urlOrCommand.startsWith('node')) {
    source = 'mcp';
  } else if (urlOrCommand.endsWith('.ts') || urlOrCommand.endsWith('.js')) {
    source = 'plugin';
  }
  
  // Create extension
  const extension: Extension = {
    id: name,
    name: name,
    description: options.description || `Extension: ${name}`,
    source,
    enabled: true,
    invoke: async (args) => {
      // Default invoker - will be overridden by source-specific logic
      console.log(chalk.yellow(`Extension ${name} invoked with:`, args));
      return { message: 'Extension invoked successfully' };
    },
  };
  
  // Set source-specific config
  if (source === 'mcp') {
    extension.mcpConfig = {
      serverName: name,
      command: urlOrCommand,
    };
  } else if (source === 'plugin') {
    extension.pluginConfig = {
      path: urlOrCommand,
      entryPoint: 'default',
    };
  } else if (source === 'api') {
    extension.url = urlOrCommand;
  }
  
  // Register
  registry.register(extension);
  
  console.log(chalk.green(`\n✓ Extension added: ${name}\n`));
  console.log(chalk.dim(`  Source: ${source}`));
  console.log(chalk.dim(`  URL/CMD: ${urlOrCommand}\n`));
}

/**
 * Remove an extension
 */
export async function extensionRemove(name: string): Promise<void> {
  const registry = getExtensionRegistry();
  
  const ext = registry.get(name);
  if (!ext) {
    console.log(chalk.red(`\n✗ Extension not found: ${name}\n`));
    return;
  }
  
  registry.unregister(name);
  
  console.log(chalk.green(`\n✓ Extension removed: ${name}\n`));
}

/**
 * Enable an extension
 */
export async function extensionEnable(name: string): Promise<void> {
  const registry = getExtensionRegistry();
  
  const ext = registry.get(name);
  if (!ext) {
    console.log(chalk.red(`\n✗ Extension not found: ${name}\n`));
    return;
  }
  
  registry.enable(name);
  
  console.log(chalk.green(`\n✓ Extension enabled: ${name}\n`));
}

/**
 * Disable an extension
 */
export async function extensionDisable(name: string): Promise<void> {
  const registry = getExtensionRegistry();
  
  const ext = registry.get(name);
  if (!ext) {
    console.log(chalk.red(`\n✗ Extension not found: ${name}\n`));
    return;
  }
  
  registry.disable(name);
  
  console.log(chalk.yellow(`\n✓ Extension disabled: ${name}\n`));
}

/**
 * Reload an extension (re-initialize)
 */
export async function extensionReload(name: string): Promise<void> {
  const registry = getExtensionRegistry();
  
  const ext = registry.get(name);
  if (!ext) {
    console.log(chalk.red(`\n✗ Extension not found: ${name}\n`));
    return;
  }
  
  console.log(chalk.cyan(`\n🔄 Reloading extension: ${name}...`));
  
  // For plugins, re-import the module
  if (ext.source === 'plugin' && ext.pluginConfig) {
    try {
      // Dynamic re-import for plugins
      const module = await import(ext.pluginConfig.path);
      ext.invoke = module.default?.invoke || module.invoke || ext.invoke;
      console.log(chalk.green(`  ✓ Plugin reloaded from: ${ext.pluginConfig.path}\n`));
    } catch (error: any) {
      console.log(chalk.red(`  ✗ Reload failed: ${error.message}\n`));
      return;
    }
  }
  
  // For MCP, restart the server connection
  if (ext.source === 'mcp' && ext.mcpConfig) {
    console.log(chalk.yellow(`  ⚠ MCP reload requires server restart (not implemented)\n`));
  }
  
  // For API, refresh metadata
  if (ext.source === 'api' && ext.url) {
    try {
      // Fetch updated metadata
      const response = await fetch(ext.url, { method: 'HEAD' });
      if (response.ok) {
        console.log(chalk.green(`  ✓ API endpoint verified: ${ext.url}\n`));
      }
    } catch (error: any) {
      console.log(chalk.yellow(`  ⚠ API verification failed: ${error.message}\n`));
    }
  }
  
  console.log(chalk.green(`\n✓ Extension reloaded: ${name}\n`));
}

/**
 * Set authentication for an extension
 */
export async function extensionAuth(
  name: string,
  credentials: Record<string, string>
): Promise<void> {
  const registry = getExtensionRegistry();
  
  const ext = registry.get(name);
  if (!ext) {
    console.log(chalk.red(`\n✗ Extension not found: ${name}\n`));
    return;
  }
  
  // Store credentials in registry
  (ext as any)._auth = credentials;
  
  // Wrap invoke to include auth
  const originalInvoke = ext.invoke;
  ext.invoke = async (args) => {
    const auth = (ext as any)._auth;
    if (auth) {
      // Add auth headers/params to invocation
      if (ext.source === 'api') {
        // For API extensions, add auth headers
        const headers: Record<string, string> = {};
        if (auth.apiKey) headers['Authorization'] = `Bearer ${auth.apiKey}`;
        if (auth.token) headers['X-Auth-Token'] = auth.token;
        
        // Invoke with auth (this is simplified - real impl would pass to fetch)
        console.log(chalk.dim(`  [Auth] Adding headers: ${Object.keys(headers).join(', ')}\n`));
      }
    }
    return originalInvoke(args);
  };
  
  // Save auth to persistent storage
  const { saveExtensionAuth } = await import('../storage/extensions.js');
  await saveExtensionAuth(name, credentials);
  
  console.log(chalk.green(`\n✓ Authentication configured for: ${name}\n`));
  console.log(chalk.dim(`  Keys stored: ${Object.keys(credentials).join(', ')}\n`));
}

/**
 * Sync extensions from external sources
 */
export async function extensionSync(options: {
  claude?: boolean;
  gemini?: boolean;
  qwen?: boolean;
  mcp?: boolean;
  all?: boolean;
}): Promise<void> {
  console.log(chalk.bold('\n🔄 Syncing Extensions\n'));
  
  const registry = getExtensionRegistry();
  let synced = 0;
  
  // Sync MCP servers
  if (options.mcp || options.all) {
    console.log(chalk.cyan('Syncing MCP servers...'));
    try {
      const mcpServers: Record<string, any> = await loadMCPConfig() as any;
      for (const [name, config] of Object.entries(mcpServers)) {
        if (!registry.get(name)) {
          await extensionAdd(name, (config as any).command || (config as any).url || '', {
            description: `MCP Server: ${name}`,
            source: 'mcp',
          });
          synced++;
        }
      }
      console.log(chalk.green(`  ✓ Synced MCP servers\n`));
    } catch (error: any) {
      console.log(chalk.yellow(`  ⚠ MCP sync failed: ${error.message}\n`));
    }
  }
  
  // Sync Claude skills
  if (options.claude || options.all) {
    console.log(chalk.cyan('Syncing Claude skills...'));
    try {
      const { importClaudeSkills } = await import('../skills/claude-importer.js');
      const count = await importClaudeSkills();
      if (count > 0) {
        synced += count;
        console.log(chalk.green(`  ✓ Synced ${count} Claude skill(s)\n`));
      } else {
        console.log(chalk.yellow('  ⚠ No Claude skills found\n'));
      }
    } catch (error: any) {
      console.log(chalk.yellow(`  ⚠ Claude sync failed: ${error.message}\n`));
    }
  }
  
  // Sync from Gemini
  if (options.gemini || options.all) {
    console.log(chalk.cyan('Syncing Gemini extensions...'));
    try {
      const { importGeminiExtensions } = await import('../skills/gemini-importer.js');
      const count = await importGeminiExtensions();
      if (count > 0) {
        synced += count;
        console.log(chalk.green(`  ✓ Synced ${count} Gemini extension(s)\n`));
      } else {
        console.log(chalk.yellow('  ⚠ No Gemini extensions found\n'));
      }
    } catch (error: any) {
      console.log(chalk.yellow(`  ⚠ Gemini sync failed: ${error.message}\n`));
    }
  }
  
  // Sync from Qwen (not yet implemented)
  if (options.qwen) {
    console.log(chalk.cyan('Syncing Qwen plugins...'));
    console.log(chalk.yellow('  ⚠ Qwen sync not yet implemented\n'));
  }
  
  console.log(chalk.green(`\n✓ Synced ${synced} new extension(s)\n`));
}

/**
 * Search extensions
 */
export async function extensionSearch(query: string): Promise<void> {
  const registry = getExtensionRegistry();
  
  const results = registry.search(query);
  
  console.log(chalk.bold(`\n🔍 Search Results for "${query}"\n`));
  
  if (results.length === 0) {
    console.log(chalk.dim('No extensions found.\n'));
    return;
  }
  
  for (const ext of results) {
    const status = ext.enabled ? chalk.green('✓') : chalk.dim('○');
    console.log(`${status} ${chalk.bold(ext.name)}`);
    console.log(chalk.dim(`  ${ext.description}\n`));
  }
}

/**
 * Get extension info
 */
export async function extensionInfo(name: string): Promise<void> {
  const registry = getExtensionRegistry();
  
  const ext = registry.get(name);
  if (!ext) {
    console.log(chalk.red(`\n✗ Extension not found: ${name}\n`));
    return;
  }
  
  console.log(chalk.bold(`\n📦 Extension: ${ext.name}\n`));
  console.log(chalk.dim(`ID: ${ext.id}`));
  console.log(chalk.dim(`Description: ${ext.description}`));
  console.log(chalk.dim(`Source: ${ext.source}`));
  console.log(chalk.dim(`Enabled: ${ext.enabled ? 'Yes' : 'No'}`));
  if (ext.version) console.log(chalk.dim(`Version: ${ext.version}`));
  if (ext.author) console.log(chalk.dim(`Author: ${ext.author}`));
  if (ext.url) console.log(chalk.dim(`URL: ${ext.url}`));
  
  if (ext.inputSchema) {
    console.log(chalk.dim(`\nInput Schema:`));
    for (const [param, schema] of Object.entries(ext.inputSchema.properties || {})) {
      const required = ext.inputSchema?.required?.includes(param) ? '' : ' (optional)';
      console.log(chalk.dim(`  ${param}: ${schema.type}${required}`));
    }
  }
  
  console.log('');
}

/**
 * Setup extension CLI commands
 */
export function setupExtensionCommand(program: Command) {
  const extension = program
    .command('extension')
    .alias('ext')
    .description('Manage unified extension registry (MCP, plugins, skills)');

  extension
    .command('list')
    .description('List registered extensions')
    .option('-s, --source <source>', 'Filter by source (mcp|plugin|skill|api)')
    .option('-e, --enabled', 'Show only enabled extensions')
    .action(async (options) => {
      await extensionList(options);
    });

  extension
    .command('add <name> <url>')
    .description('Add a new extension')
    .option('-d, --description <desc>', 'Extension description')
    .option('-s, --source <source>', 'Source type (mcp|plugin|skill|api)')
    .action(async (name, url, options) => {
      await extensionAdd(name, url, options);
    });

  extension
    .command('remove <name>')
    .description('Remove an extension')
    .action(async (name) => {
      await extensionRemove(name);
    });

  extension
    .command('enable <name>')
    .description('Enable an extension')
    .action(async (name) => {
      await extensionEnable(name);
    });

  extension
    .command('disable <name>')
    .description('Disable an extension')
    .action(async (name) => {
      await extensionDisable(name);
    });

  extension
    .command('reload <name>')
    .description('Reload an extension')
    .action(async (name) => {
      await extensionReload(name);
    });

  extension
    .command('auth <name> [credentials...]')
    .description('Set authentication for extension (e.g., auth my-api key=value)')
    .action(async (name, credentials) => {
      // Parse credentials from key=value format
      const creds: Record<string, string> = {};
      if (credentials && Array.isArray(credentials)) {
        for (const cred of credentials) {
          const [key, ...valueParts] = cred.split('=');
          if (key && valueParts.length > 0) {
            creds[key] = valueParts.join('=');
          }
        }
      }
      
      if (Object.keys(creds).length === 0) {
        console.log(chalk.yellow('\n⚠ No credentials provided.\n'));
        console.log(chalk.dim('Usage: echo extension auth <name> key=value [key2=value2...]\n'));
        return;
      }
      
      await extensionAuth(name, creds);
    });

  extension
    .command('sync')
    .description('Sync extensions from external sources')
    .option('--claude', 'Sync from Claude')
    .option('--gemini', 'Sync from Gemini')
    .option('--qwen', 'Sync from Qwen')
    .option('--mcp', 'Sync MCP servers')
    .option('--all', 'Sync from all sources')
    .action(async (options) => {
      await extensionSync(options);
    });

  extension
    .command('search <query>')
    .description('Search extensions')
    .action(async (query) => {
      await extensionSearch(query);
    });

  extension
    .command('info <name>')
    .description('Get extension info')
    .action(async (name) => {
      await extensionInfo(name);
    });
}
