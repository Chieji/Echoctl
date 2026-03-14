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
import { startRepl } from './commands/repl.js';
import { clearCommand } from './commands/clear.js';
import { brainCommand } from './commands/brain.js';
import { approveCommand } from './commands/approve.js';
import { trackCommand } from './commands/track.js';
import { agentRun, agentHealth, agentTools, agentMemory, agentPlan, agentLogs, agentConfig, agentDoctor } from './commands/agent.js';
import { pluginSync, pluginSyncPlatform, pluginList, pluginInstall, pluginUninstall, pluginEnable, pluginDisable } from './commands/plugin.js';
import { launchDashboard } from './commands/tui.js';
import { setupMcpCommand } from './commands/mcp.js';
import { setupMountCommand } from './commands/mount.js';
import { render } from 'ink';
import { StartupSequence } from './tui/startup.js';
import { Dashboard } from './tui/echomen-dashboard.js';
import React from 'react';
import { getConfig } from './utils/config.js';
import { ProviderName } from './types/index.js';
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
    .command('box')
    .description('Configure Box.com Cloud Memory sync')
    .action(async () => {
      try {
        await authCommand.box();
      } catch (error) {
        console.log(chalk.red('✗ Box setup failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  auth
    .command('github')
    .description('Configure GitHub collaboration (PAT)')
    .action(async () => {
      try {
        await authCommand.github();
      } catch (error) {
        console.log(chalk.red('✗ GitHub setup failed:'), error instanceof Error ? error.message : error);
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
  // AGENT COMMANDS
  // ============================================================================

  const agent = program.command('agent').description('Agent management and monitoring');

  agent
    .command('run <task>')
    .description('Run agent with a task')
    .option('-p, --provider <provider>', 'Specify provider')
    .option('--yolo', 'YOLO mode - no confirmations')
    .option('-v, --verbose', 'Verbose output')
    .action(async (task: string, options: { provider?: string; yolo?: boolean; verbose?: boolean }) => {
      try {
        await agentRun(task, options);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  agent
    .command('health')
    .description('Show agent health status')
    .action(async () => {
      try {
        await agentHealth();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  agent
    .command('tools')
    .description('List available agent tools')
    .action(async () => {
      try {
        await agentTools();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  agent
    .command('memory')
    .description('Show agent memory')
    .option('-s, --session <id>', 'Specific session')
    .option('-l, --limit <number>', 'Limit sessions shown')
    .option('-e, --export <file>', 'Export to file')
    .action(async (options: { session?: string; limit?: number; export?: string }) => {
      try {
        await agentMemory(options);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  agent
    .command('plan')
    .description('Show current agent plan')
    .action(async () => {
      try {
        await agentPlan();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  agent
    .command('logs')
    .description('Show agent event logs')
    .option('-l, --limit <number>', 'Number of events to show')
    .option('-t, --type <type>', 'Filter by event type')
    .action(async (options: { limit?: number; type?: string }) => {
      try {
        await agentLogs(options);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  agent
    .command('config')
    .description('Configure agent settings (plan mode, auto-accept)')
    .option('--plan', 'Enable plan mode (show plans before executing)')
    .option('--no-plan', 'Disable plan mode')
    .option('--auto-accept', 'Enable auto-accept (no confirmations)')
    .option('--no-auto-accept', 'Disable auto-accept')
    .option('--status', 'Show current configuration')
    .action(async (options: { plan?: boolean; noPlan?: boolean; autoAccept?: boolean; noAutoAccept?: boolean; status?: boolean }) => {
      try {
        await agentConfig(options);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  agent
    .command('doctor')
    .description('Diagnose all systems (config, providers, memory, state)')
    .action(async () => {
      try {
        await agentDoctor();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // REPL / CHAT COMMANDS
  // ============================================================================

  program
    .command('repl')
    .aliases(['r'])
    .description('Start interactive REPL mode (continuous chat loop)')
    .option('-p, --provider <provider>', 'Specify provider (openai, gemini, anthropic)')
    .option('-a, --agent', 'Start in Agent mode (can run tools)')
    .option('--yolo', 'Start with YOLO mode enabled (no confirmations)')
    .option('--session <id>', 'Resume specific session ID')
    .action(async (options: {
      provider?: ProviderName;
      agent?: boolean;
      yolo?: boolean;
      session?: string;
    }) => {
      try {
        await startRepl(options);
      } catch (error) {
        console.log(chalk.red('✗ REPL failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command('chat [message]')
    .description('Start a conversation with AI (starts REPL if no message provided)')
    .option('-p, --provider <provider>', 'Specify provider (openai, gemini, anthropic)')
    .option('-s, --smart', 'Use smart mode (auto-select provider based on task)')
    .option('--session <id>', 'Use specific session ID')
    .option('-r, --raw', 'Raw output mode (no formatting)')
    .option('-a, --agent', 'Agent mode - ReAct loop with tool execution')
    .option('--yolo', 'YOLO mode - Execute commands without confirmation (use with --agent)')
    .action(async (message: string | undefined, options: {
      provider?: ProviderName;
      smart?: boolean;
      session?: string;
      raw?: boolean;
      agent?: boolean;
      yolo?: boolean;
    }) => {
      try {
        if (!message) {
          // If simply `echo chat` is passed, launch the REPL
          await startRepl({
            provider: options.provider,
            agent: options.agent,
            yolo: options.yolo,
            session: options.session,
          });
        } else {
          await chatCommand.chat(message, options);
        }
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
  // BRAIN COMMANDS (Second Brain Knowledge Base)
  // ============================================================================

  const brain = program.command('brain').description('Second Brain - Manage knowledge base');

  brain
    .command('save <key> <value>')
    .description('Save a memory item')
    .option('-t, --tag <tag>', 'Add tags (can be used multiple times)', (val: string, prev: string[]) => [...prev, val], [])
    .action(async (key: string, value: string, options: { tag: string[] }) => {
      try {
        await brainCommand.save(key, value, options.tag);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  brain
    .command('get <key>')
    .description('Retrieve a memory by key')
    .action(async (key: string) => {
      try {
        await brainCommand.get(key);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  brain
    .command('search <query>')
    .description('Search memories')
    .option('-t, --tag <tag>', 'Filter by tags', (val: string, prev: string[]) => [...prev, val], [])
    .action(async (query: string, options: { tag: string[] }) => {
      try {
        await brainCommand.search(query, options.tag);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  brain
    .command('list')
    .description('List all memories')
    .option('-l, --limit <number>', 'Limit results', parseInt)
    .action(async (options: { limit?: number }) => {
      try {
        await brainCommand.list(options.limit);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  brain
    .command('delete <key>')
    .description('Delete a memory')
    .option('-f, --force', 'Skip confirmation')
    .action(async (key: string, options: { force?: boolean }) => {
      try {
        await brainCommand.delete(key, options.force);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  brain
    .command('stats')
    .description('Show brain statistics')
    .action(async () => {
      try {
        await brainCommand.stats();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  brain
    .command('export')
    .description('Export memories to JSON')
    .option('-o, --output <file>', 'Output file path')
    .action(async (options: { output?: string }) => {
      try {
        await brainCommand.export(options.output);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  brain
    .command('import <file>')
    .description('Import memories from JSON')
    .action(async (file: string) => {
      try {
        await brainCommand.import(file);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ============================================================================
  // APPROVE COMMANDS (HITL - Human in the Loop)
  // ============================================================================

  const approve = program.command('approve').description('HITL - Manage approval queue');

  approve
    .command('list')
    .description('List pending approvals')
    .action(async () => {
      try {
        await approveCommand.list();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  approve
    .command('<id>')
    .description('Submit approval decision')
    .option('-y, --yes', 'Approve the request')
    .option('-n, --no', 'Deny the request')
    .action(async (id: string, options: { yes?: boolean; no?: boolean }) => {
      try {
        const approved = options.yes ? true : options.no ? false : undefined;
        await approveCommand.submit(id, approved);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  approve
    .command('stats')
    .description('Show approval statistics')
    .action(async () => {
      try {
        await approveCommand.stats();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  approve
    .command('add-rule <tool-pattern>')
    .description('Add auto-approve rule')
    .option('-p, --param <pattern>', 'Parameter pattern')
    .action(async (toolPattern: string, options: { param?: string }) => {
      try {
        await approveCommand.addRule(toolPattern, options.param);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  approve
    .command('remove-rule <tool-pattern>')
    .description('Remove auto-approve rule')
    .action(async (toolPattern: string) => {
      try {
        await approveCommand.removeRule(toolPattern);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  approve
    .command('enable-rule <tool-pattern>')
    .description('Enable auto-approve rule')
    .action(async (toolPattern: string) => {
      try {
        await approveCommand.toggleRule(toolPattern, true);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  approve
    .command('disable-rule <tool-pattern>')
    .description('Disable auto-approve rule')
    .action(async (toolPattern: string) => {
      try {
        await approveCommand.toggleRule(toolPattern, false);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  approve
    .command('clear')
    .description('Clear all pending approvals')
    .action(async () => {
      try {
        await approveCommand.clear();
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

  setupMcpCommand(program);
  setupMountCommand(program);


  // ============================================================================
  // TRACK COMMANDS (Development Context Isolation)
  // ============================================================================

  const track = program.command('track').description('Development tracks - Isolate project contexts');

  track
    .command('new <name>')
    .description('Create a new development track')
    .option('-d, --description <desc>', 'Track description')
    .action(async (name: string, options: { description?: string }) => {
      try {
        await trackCommand.new(name, options.description);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  track
    .command('list')
    .description('List all tracks')
    .action(async () => {
      try {
        await trackCommand.list();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  track
    .command('switch <name>')
    .description('Switch to a track')
    .action(async (name: string) => {
      try {
        await trackCommand.switch(name);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  track
    .command('status')
    .description('Show current track status')
    .action(async () => {
      try {
        await trackCommand.status();
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  track
    .command('delete <name>')
    .description('Delete a track')
    .option('-f, --force', 'Skip confirmation')
    .action(async (name: string, options: { force?: boolean }) => {
      try {
        await trackCommand.delete(name, options.force);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  track
    .command('export <name>')
    .description('Export track to JSON')
    .option('-o, --output <file>', 'Output file path')
    .action(async (name: string, options: { output?: string }) => {
      try {
        await trackCommand.export(name, options.output);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  track
    .command('import <file>')
    .description('Import track from JSON')
    .action(async (file: string) => {
      try {
        await trackCommand.import(file);
      } catch (error) {
        console.log(chalk.red('✗ Failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  track
    .command('config <name>')
    .description('Configure track settings')
    .option('-p, --provider <provider>', 'Default provider')
    .option('-c, --context-length <number>', 'Context length', parseInt)
    .option('-a, --auto-approve <tools>', 'Comma-separated auto-approve tools')
    .action(async (name: string, options: { provider?: string; contextLength?: number; autoApprove?: string }) => {
      try {
        await trackCommand.config(name, {
          provider: options.provider,
          contextLength: options.contextLength,
          autoApprove: options.autoApprove,
        });
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
  // ECHOMEN COMMAND - The Full AI Terminal Experience (DEFAULT)
  // ============================================================================

  // When running just 'echo' or 'echomen', launch the TUI
  program
    .command('men', { isDefault: true })
    .alias('echomen')
    .alias('tui')
    .alias('ui')
    .description('Launch ECHOMEN - The Ultimate AI Terminal Interface')
    .action(async () => {
      try {
        const App = () => {
          const [booted, setBooted] = React.useState(false);

          if (!booted) {
            return React.createElement(StartupSequence, {
              onComplete: () => setBooted(true)
            });
          }

          return React.createElement(Dashboard);
        };

        const { waitUntilExit } = render(React.createElement(App));
        await waitUntilExit();
      } catch (error) {
        console.log(chalk.red('✗ ECHOMEN failed:'), error instanceof Error ? error.message : error);
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
  // DEFAULT ACTION (when no command is provided) - LAUNCH TUI
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
        // No message - launch ECHOMEN TUI
        try {
          const App = () => {
            const [booted, setBooted] = React.useState(false);

            if (!booted) {
              return React.createElement(StartupSequence, {
                onComplete: () => setBooted(true)
              });
            }

            return React.createElement(Dashboard);
          };

          const { waitUntilExit } = render(React.createElement(App));
          await waitUntilExit();
        } catch (error) {
          console.log(chalk.red('✗ ECHOMEN failed:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      }
    });

  return program;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const program = createCLI();

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.log(chalk.red('\n✗ Unexpected error:'), error.message);
    console.log(chalk.dim('\nIf this persists, try running: echo clear all\n'));
    process.exit(1);
  });

  // Handle unhandled promise rejections (critical for async CLI commands)
  process.on('unhandledRejection', (reason: any) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.log(chalk.red('\n✗ Unhandled async error:'), message);
    console.log(chalk.dim('\nThis is likely a bug. Please report it.\n'));
    process.exit(1);
  });

  await program.parseAsync(process.argv);
}

// Run the CLI
main().catch((error) => {
  console.log(chalk.red('✗ Fatal error:'), error);
  process.exit(1);
});
