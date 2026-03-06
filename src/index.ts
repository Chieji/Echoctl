#!/usr/bin/env node

/**
 * Echo CLI - Main Entry Point
 * A resilient, multi-provider AI CLI tool
 */

import { Command } from 'commander';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { authCommand, authAutoSync, authAutoDetect } from './commands/auth.js';
import { chatCommand } from './commands/chat.js';
import { clearCommand } from './commands/clear.js';
import { pluginSync, pluginSyncPlatform, pluginList, pluginInstall, pluginUninstall, pluginEnable, pluginDisable } from './commands/plugin.js';
import { launchDashboard } from './commands/tui.js';
import { getConfig } from './utils/config.js';
import { ProviderName } from './types/index.js';
import { mcpCommands } from './storage/mcp.js';
import { displayStartupSequence } from './utils/banner.js';

const packageJson = {
  name: 'echo-ai-cli',
  version: '1.0.0',
};

/**
 * Display welcome banner
 */
function showBanner(): void {
  const banner = gradient.pastel.multiline(`
╔═══════════════════════════════════════════╗
║   ECHO - Your AI Assistant CLI            ║
║   Multi-provider with smart failover      ║
╚═══════════════════════════════════════════╝
  `);
  console.log(banner);
}

/**
 * Create and configure the CLI
 */
function createCLI(): Command {
  const program = new Command();

  program
    .name('echo')
    .description('Echo - Resilient multi-provider AI CLI')
    .version(packageJson.version, '-v, --version', 'Display version number');

  // ============================================================================
  // AUTH COMMANDS
  // ============================================================================

  const auth = program.command('auth').description('Manage authentication and API keys');

  auth
    .command('login')
    .description('Interactive setup for API keys')
    .action(async () => {
      try {
        await authCommand.login();
      } catch (error) {
        console.log(chalk.red('✗ Auth failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  auth
    .command('sync')
    .description('Auto-sync credentials from gcloud, aliyun, env vars')
    .action(async () => {
      try {
        await authAutoSync();
      } catch (error) {
        console.log(chalk.red('✗ Sync failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  auth
    .command('detect')
    .description('Show auto-detected credentials')
    .action(async () => {
      try {
        await authAutoDetect();
      } catch (error) {
        console.log(chalk.red('✗ Detect failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  auth
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      try {
        await authCommand.status();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  auth
    .command('logout [provider]')
    .description('Remove API key for a provider')
    .action(async (provider?: ProviderName) => {
      try {
        await authCommand.logout(provider);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // CHAT COMMANDS
  // ============================================================================

  program
    .command('chat <message>')
    .description('Start a conversation with AI')
    .option('-p, --provider <provider>', 'Specify provider (openai, gemini, anthropic)')
    .option('-s, --smart', 'Use smart mode (auto-select provider based on task)')
    .option('--session <id>', 'Use specific session ID')
    .option('-r, --raw', 'Raw output mode (no formatting)')
    .option('-a, --agent', 'Agent mode - ReAct loop with tool execution')
    .option('--yolo', 'YOLO mode - Execute commands without confirmation (use with --agent)')
    .action(async (message: string, options: {
      provider?: ProviderName;
      smart?: boolean;
      session?: string;
      raw?: boolean;
      agent?: boolean;
      yolo?: boolean;
    }) => {
      try {
        await chatCommand.chat(message, options);
      } catch (error) {
        console.log(chalk.red('✗ Chat failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command('new-session [name]')
    .description('Start a new conversation session')
    .action(async (name?: string) => {
      try {
        await chatCommand.newSession(name);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command('sessions')
    .description('List all conversation sessions')
    .action(async () => {
      try {
        await chatCommand.listSessions();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command('stats')
    .description('Show usage statistics')
    .action(async () => {
      try {
        await chatCommand.showStats();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // CLEAR COMMANDS
  // ============================================================================

  const clear = program.command('clear').description('Clear conversation history');

  clear
    .command('history')
    .description('Clear current session history')
    .action(async () => {
      try {
        await clearCommand.history();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  clear
    .command('all')
    .description('Delete all sessions and history (irreversible)')
    .action(async () => {
      try {
        await clearCommand.all();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  clear
    .command('session')
    .description('Delete current session entirely')
    .action(async () => {
      try {
        await clearCommand.session();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // PLUGIN COMMANDS (Universal Sync)
  // ============================================================================

  const plugin = program.command('plugin').description('Manage plugins (sync from Claude, Gemini, Qwen)');

  plugin
    .command('sync-all')
    .description('Sync plugins from all platforms (Claude, Gemini, Qwen, MCP)')
    .action(async () => {
      try {
        await pluginSync();
      } catch (error) {
        console.log(chalk.red('✗ Sync failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  plugin
    .command('sync-from <platform>')
    .description('Sync from specific platform (claude, gemini, qwen, mcp)')
    .action(async (platform: 'claude' | 'gemini' | 'qwen' | 'mcp') => {
      try {
        await pluginSyncPlatform(platform);
      } catch (error) {
        console.log(chalk.red('✗ Sync failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  plugin
    .command('list')
    .description('List installed plugins')
    .action(async () => {
      try {
        await pluginList();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  plugin
    .command('install <package>')
    .description('Install plugin from npm')
    .action(async (pkg: string) => {
      try {
        await pluginInstall(pkg);
      } catch (error) {
        console.log(chalk.red('✗ Install failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  plugin
    .command('uninstall <name>')
    .description('Uninstall a plugin')
    .action(async (name: string) => {
      try {
        await pluginUninstall(name);
      } catch (error) {
        console.log(chalk.red('✗ Uninstall failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  plugin
    .command('enable <name>')
    .description('Enable a plugin')
    .action(async (name: string) => {
      try {
        await pluginEnable(name);
      } catch (error) {
        console.log(chalk.red('✗ Enable failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  plugin
    .command('disable <name>')
    .description('Disable a plugin')
    .action(async (name: string) => {
      try {
        await pluginDisable(name);
      } catch (error) {
        console.log(chalk.red('✗ Disable failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // MCP COMMANDS
  // ============================================================================

  const mcp = program.command('mcp').description('Manage MCP (Model Context Protocol) servers');

  mcp
    .command('list')
    .description('List configured MCP servers')
    .action(async () => {
      try {
        const servers = await mcpCommands.list();
        console.log(chalk.bold('\n📡 MCP Servers\n'));
        
        if (servers.length === 0) {
          console.log(chalk.dim('No MCP servers configured.\n'));
          return;
        }

        servers.forEach(server => {
          const status = server.enabled ? chalk.green('✓') : chalk.dim('○');
          console.log(`${status} ${chalk.bold(server.name)}`);
          console.log(chalk.dim(`  URL: ${server.url}`));
          if (server.description) console.log(chalk.dim(`  ${server.description}`));
          if (server.skills.length > 0) {
            console.log(chalk.dim(`  Skills: ${server.skills.join(', ')}`));
          }
          console.log('');
        });
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mcp
    .command('add <name> <url>')
    .description('Add a new MCP server')
    .option('-d, --description <desc>', 'Server description')
    .action(async (name: string, url: string, options: { description?: string }) => {
      try {
        await mcpCommands.add(name, url, options.description);
        console.log(chalk.green(`✓ Added MCP server: ${name}\n`));
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mcp
    .command('remove <name>')
    .description('Remove an MCP server')
    .action(async (name: string) => {
      try {
        await mcpCommands.remove(name);
        console.log(chalk.green(`✓ Removed MCP server: ${name}\n`));
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mcp
    .command('enable <name>')
    .description('Enable an MCP server')
    .action(async (name: string) => {
      try {
        await mcpCommands.enable(name);
        console.log(chalk.green(`✓ Enabled MCP server: ${name}\n`));
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mcp
    .command('disable <name>')
    .description('Disable an MCP server')
    .action(async (name: string) => {
      try {
        await mcpCommands.disable(name);
        console.log(chalk.green(`✓ Disabled MCP server: ${name}\n`));
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mcp
    .command('install <package>')
    .description('Install an MCP skill package')
    .action(async (pkg: string) => {
      try {
        await mcpCommands.install(pkg);
        console.log(chalk.green(`✓ Installed MCP skill: ${pkg}\n`));
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  mcp
    .command('skills')
    .description('List installed MCP skills')
    .action(async () => {
      try {
        const skills = await mcpCommands.skills();
        console.log(chalk.bold('\n📦 Installed MCP Skills\n'));
        
        if (skills.length === 0) {
          console.log(chalk.dim('No skills installed.\n'));
          return;
        }

        skills.forEach(skill => console.log(`  • ${skill}`));
        console.log('');
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // DASHBOARD COMMAND
  // ============================================================================

  program
    .command('dashboard')
    .description('Launch interactive TUI dashboard')
    .action(async () => {
      try {
        await launchDashboard();
      } catch (error) {
        console.log(chalk.red('✗ Dashboard failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // CONFIG COMMANDS
  // ============================================================================

  const configCmd = program.command('config').description('Manage configuration');

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const config = getConfig();
      const allConfig = config.getAll();

      console.log(chalk.bold('\n📋 Echo CLI Configuration\n'));
      console.log(JSON.stringify(allConfig, null, 2));
      console.log(chalk.dim(`\nConfig file: ${config.configPath}\n`));
    });

  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      const config = getConfig();

      try {
        switch (key) {
          case 'default-provider':
            config.setDefaultProvider(value as ProviderName);
            console.log(chalk.green(`✓ Default provider set to ${value.toUpperCase()}`));
            break;
          case 'smart-mode':
            config.setSmartMode(value === 'true' || value === 'on');
            console.log(chalk.green(`✓ Smart mode set to ${value}`));
            break;
          case 'context-length':
            config.setContextLength(parseInt(value, 10));
            console.log(chalk.green(`✓ Context length set to ${value}`));
            break;
          default:
            console.log(chalk.yellow('Unknown config key. Available keys:'));
            console.log('  - default-provider');
            console.log('  - smart-mode');
            console.log('  - context-length');
            process.exit(1);
        }
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // DEFAULT ACTION (when no command is provided)
  // ============================================================================

  program
    .argument('[message]', 'Message to send to AI')
    .action(async (message?: string) => {
      if (message) {
        // If a message is provided without a command, treat it as chat
        try {
          await chatCommand.continueChat(message);
        } catch (error) {
          console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      } else {
        // Show help
        showBanner();
        program.help();
      }
    });

  return program;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const program = createCLI();

  // Display startup banner if no command provided (interactive mode)
  if (!process.argv.slice(2).length) {
    await displayStartupSequence();
    program.help();
  }

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.log(chalk.red('\n✗ Unexpected error:'), error.message);
    console.log(chalk.dim('\nIf this persists, try running: echo clear all\n'));
    process.exit(1);
  });

  await program.parseAsync(process.argv);
}

// Run the CLI
main().catch((error) => {
  console.log(chalk.red('✗ Fatal error:'), error);
  process.exit(1);
});
