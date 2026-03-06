/**
 * Plugin Commands - Sync from Claude, Gemini, Qwen
 */

import chalk from 'chalk';
import { 
  syncAllPlugins, 
  syncClaudeSkills, 
  syncGeminiExtensions, 
  syncQwenPlugins,
  listPlugins,
  installPlugin,
  uninstallPlugin,
  setPluginEnabled 
} from '../plugins/sync.js';

/**
 * Sync all plugins from all platforms
 */
export async function pluginSync(): Promise<void> {
  await syncAllPlugins();
}

/**
 * Sync from specific platform
 */
export async function pluginSyncPlatform(platform: 'claude' | 'gemini' | 'qwen' | 'mcp'): Promise<void> {
  console.log(chalk.bold(`\n🔄 Syncing from ${platform}...\n`));
  
  let plugins: any[] = [];
  
  switch (platform) {
    case 'claude':
      plugins = await syncClaudeSkills();
      break;
    case 'gemini':
      plugins = await syncGeminiExtensions();
      break;
    case 'qwen':
      plugins = await syncQwenPlugins();
      break;
    case 'mcp':
      plugins = await syncAllPlugins(); // MCP is included in universal sync
      break;
  }
  
  if (plugins.length > 0) {
    console.log(chalk.green(`\n✓ Synced ${plugins.length} plugin(s) from ${platform}\n`));
  } else {
    console.log(chalk.yellow(`\n⚠ No plugins found for ${platform}\n`));
  }
}

/**
 * List installed plugins
 */
export async function pluginList(): Promise<void> {
  const plugins = await listPlugins();
  
  console.log(chalk.bold('\n📦 Installed Plugins\n'));
  
  if (plugins.length === 0) {
    console.log(chalk.dim('No plugins installed.\n'));
    console.log(chalk.dim('Run ') + chalk.cyan('echo plugin sync') + chalk.dim(' to import from Claude, Gemini, Qwen\n'));
    return;
  }
  
  // Group by platform
  const byPlatform: Record<string, typeof plugins> = {};
  for (const plugin of plugins) {
    const platform = plugin.platform || 'unknown';
    if (!byPlatform[platform]) {
      byPlatform[platform] = [];
    }
    byPlatform[platform].push(plugin);
  }
  
  for (const [platform, platformPlugins] of Object.entries(byPlatform)) {
    const platformIcon: Record<string, string> = {
      claude: '🟦',
      gemini: '🟩',
      qwen: '🟥',
      mcp: '🟪',
      npm: '🟨',
      github: '⬛',
      url: '🔗',
    };
    
    console.log(chalk.bold(`${platformIcon[platform] || '○'} ${platform.toUpperCase()}`));
    
    for (const plugin of platformPlugins) {
      const status = plugin.installed ? chalk.green('●') : chalk.dim('○');
      console.log(`  ${status} ${plugin.name} ${chalk.dim(`v${plugin.version}`)}`);
      if (plugin.description) {
        console.log(chalk.dim(`     ${plugin.description}`));
      }
    }
    
    console.log('');
  }
}

/**
 * Install plugin from npm
 */
export async function pluginInstall(packageName: string): Promise<void> {
  try {
    await installPlugin(packageName);
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed to install: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Uninstall plugin
 */
export async function pluginUninstall(name: string): Promise<void> {
  try {
    await uninstallPlugin(name);
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed to uninstall: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Enable plugin
 */
export async function pluginEnable(name: string): Promise<void> {
  try {
    await setPluginEnabled(name, true);
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed to enable: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Disable plugin
 */
export async function pluginDisable(name: string): Promise<void> {
  try {
    await setPluginEnabled(name, false);
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed to disable: ${error.message}`));
    process.exit(1);
  }
}
