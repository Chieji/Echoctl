/**
 * Agent Commands - Manage agent execution and monitoring
 */

import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { getMemory } from '../utils/memory.js';
import { getSessionStore } from '../storage/sessions.js';
import { ProviderChain } from '../providers/chain.js';
import { getStateManager } from '../state/manager.js';
import { BDIEngine } from '../core/bdi.js';
import Enquirer from 'enquirer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Run agent mode with a task
 */
export async function agentRun(task: string, options: {
  provider?: string;
  yolo?: boolean;
  verbose?: boolean;
  plan?: boolean;
}): Promise<void> {
  console.log(chalk.bold('\n🤖 Agent BDI Run Mode\n'));
  
  const config = getConfig();
  const providerChain = new ProviderChain(config.getAllProviderConfigs());
  
  const bdi = new BDIEngine(providerChain, {
    yoloMode: options.yolo || false,
    planMode: options.plan || false,
  });

  try {
    const { result, intentionSummary } = await bdi.execute(task);
    
    console.log(chalk.bold.green('\n✅ Task Finalized'));
    console.log(chalk.dim(`Intention Path: ${intentionSummary}\n`));
    console.log(result);
  } catch (error: any) {
    console.log(chalk.red(`\n✗ Agent failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Show agent health status
 */
export async function agentHealth(): Promise<void> {
  const config = getConfig();
  const sessionStore = getSessionStore();
  const stateManager = getStateManager();

  await sessionStore.init();
  await stateManager.init();

  const providers = config.getConfiguredProviders();
  const stats = await sessionStore.getStats();
  const health = await stateManager.getHealth();
  const state = stateManager.getState();
  const paths = stateManager.getPaths();

  console.log(chalk.bold('\n🏥 Agent Health Status\n'));

  // System health
  console.log(chalk.bold('System Health:'));
  const healthIcon = health.state === 'ok' && health.ledger === 'ok' && health.directories === 'ok'
    ? chalk.green('✓')
    : chalk.red('✗');
  console.log(`  ${healthIcon} Overall: ${health.message}`);
  console.log(`  ${health.state === 'ok' ? chalk.green('✓') : chalk.red('✗')} State file: ${paths.state}`);
  console.log(`  ${health.ledger === 'ok' ? chalk.green('✓') : chalk.red('✗')} Event ledger: ${paths.ledger}`);
  console.log(`  ${health.directories === 'ok' ? chalk.green('✓') : chalk.red('✗')} Directories`);
  console.log('');

  // Agent state
  console.log(chalk.bold('Agent State:'));
  console.log(`  Status: ${chalk.cyan(state.status)}`);
  console.log(`  Current Task: ${state.currentTask || 'None'}`);
  console.log(`  Total Tasks: ${state.totalTasks}`);
  console.log(`  Completed: ${chalk.green(state.completedTasks)}`);
  console.log(`  Failed: ${chalk.red(state.failedTasks)}`);
  console.log(`  Provider: ${state.provider}`);
  console.log(`  YOLO Mode: ${state.yoloMode ? chalk.yellow('ON') : chalk.dim('OFF')}`);
  console.log('');

  // Provider health
  console.log(chalk.bold('Providers:'));
  const allProviders = ['gemini', 'openai', 'anthropic', 'qwen', 'groq', 'ollama', 'deepseek', 'kimi', 'openrouter', 'together', 'modelscope', 'mistral', 'huggingface', 'github'];

  for (const provider of allProviders) {
    const isConfigured = providers.includes(provider as any);
    const icon = isConfigured ? chalk.green('✓') : chalk.dim('○');
    console.log(`  ${icon} ${provider}`);
  }

  console.log('');

  // Memory health
  console.log(chalk.bold('Memory:'));
  console.log(`  Sessions: ${stats.totalSessions}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
  console.log(`  Total Tokens: ${stats.totalTokens}`);
  console.log(`  Current Session: ${stats.currentSessionMessages}`);
  console.log(`  Storage: ${sessionStore.getDbPath()}`);
  console.log('');

  // System info
  console.log(chalk.bold('System:'));
  console.log(`  Node: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log('');

  // Overall status
  const isHealthy = health.state === 'ok' && health.ledger === 'ok' && health.directories === 'ok';
  console.log(isHealthy ? chalk.green('✓ Agent Healthy') : chalk.red('✗ Agent Issues Detected'));
  console.log('');
}

/**
 * List available agent tools
 */
export async function agentTools(): Promise<void> {
  console.log(chalk.bold('\n🔧 Available Agent Tools\n'));
  
  const tools = [
    { category: 'Shell', tools: ['run_command'] },
    { category: 'Files', tools: ['readFile', 'writeFile', 'listFiles', 'deleteFile'] },
    { category: 'Code', tools: ['executePython', 'executeNode'] },
    { category: 'Web', tools: ['searchWeb', 'scrapeUrl', 'getNews'] },
    { category: 'Browser', tools: ['browserNavigate', 'browserScreenshot', 'browserClick', 'browserType', 'browserExtract', 'browserGetLinks'] },
    { category: 'Git', tools: ['getGitStatus', 'gitAdd', 'gitAddAll', 'gitCommit', 'gitPush', 'gitLog'] },
    { category: 'Multi-File', tools: ['findAndReplace', 'searchInFiles', 'createFiles', 'updateFiles', 'deleteFiles', 'findFiles', 'getFileTree'] },
    { category: 'LSP', tools: ['findSymbolReferences', 'renameSymbol', 'findSymbolDefinition', 'detectProjectLanguage'] },
  ];
  
  for (const category of tools) {
    console.log(chalk.bold(category.category + ':'));
    for (const tool of category.tools) {
      console.log(`  • ${tool}`);
    }
    console.log('');
  }

  // MCP Tools
  try {
    const { getMCPManager } = await import('../extensions/mcp.js');
    const mcpManager = await getMCPManager();
    const mcpTools = await mcpManager.getAllTools();
    
    if (Object.keys(mcpTools).length > 0) {
      console.log(chalk.bold('MCP (Remote):'));
      for (const toolKey of Object.keys(mcpTools)) {
        console.log(`  • ${toolKey}`);
      }
      console.log('');
    }
  } catch (error) {
    // Ignore MCP errors in tools listing
  }
  
  console.log(chalk.dim('Total: 30+ tools available to agent\n'));
}

/**
 * Show agent memory
 */
export async function agentMemory(options: {
  session?: string;
  limit?: number;
  export?: string;
}): Promise<void> {
  const sessionStore = getSessionStore();
  await sessionStore.init();

  console.log(chalk.bold('\n🧠 Agent Memory\n'));

  const stats = await sessionStore.getStats();

  console.log(chalk.bold('Memory Statistics:'));
  console.log(`  Total Sessions: ${stats.totalSessions}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
  console.log(`  Total Tokens: ${stats.totalTokens}`);
  console.log(`  Current Session Messages: ${stats.currentSessionMessages}`);
  console.log(`  Storage: ${sessionStore.getDbPath()}`);
  console.log('');

  // List recent sessions
  const sessions = sessionStore.getAll(options.limit || 10);
  if (sessions.length > 0) {
    console.log(chalk.bold('Recent Sessions:'));
    sessions.forEach((session, i) => {
      console.log(`  ${i + 1}. ${session.name}`);
      console.log(`     ID: ${session.id}`);
      console.log(`     Messages: ${session.messages.length}`);
      console.log(`     Tokens: ${session.tokenCount || 0}`);
      console.log(`     Updated: ${new Date(session.updatedAt).toLocaleString()}`);
      console.log('');
    });
  }

  if (options.export) {
    const currentSession = sessionStore.getCurrentSession();
    if (currentSession) {
      const exported = sessionStore.export(currentSession.id);
      const { writeFileSync } = require('fs');
      writeFileSync(options.export, exported);
      console.log(chalk.green(`✓ Exported session to ${options.export}\n`));
    } else {
      console.log(chalk.yellow('⚠ No current session to export\n'));
    }
  }
}

/**
 * Show agent plan (current task progress)
 */
export async function agentPlan(): Promise<void> {
  console.log(chalk.bold('\n📋 Agent Plan\n'));
  console.log(chalk.yellow('⚠️  Agent planning is handled by ReAct engine during execution\n'));
  console.log(chalk.dim('Use: ') + chalk.cyan('echo chat "your task" --agent') + chalk.dim(' to start agent mode\n'));
}

/**
 * Show agent logs/events
 */
export async function agentLogs(options: {
  limit?: number;
  type?: string;
  follow?: boolean;
}): Promise<void> {
  const stateManager = getStateManager();
  await stateManager.init();
  
  console.log(chalk.bold('\n📜 Agent Event Logs\n'));
  
  const events = await stateManager.getRecentEvents(options.limit || 20);
  
  if (events.length === 0) {
    console.log(chalk.dim('No events logged yet\n'));
    return;
  }
  
  for (const event of events) {
    const icon = {
      task_start: '🚀',
      task_complete: '✅',
      task_error: '❌',
      tool_call: '🔧',
      provider_switch: '🔄',
      health_check: '🏥',
    }[event.type] || '•';
    
    const time = new Date(event.timestamp).toLocaleTimeString();
    console.log(`${icon} [${time}] ${event.type}`);
    
    if (event.data?.task) {
      console.log(chalk.dim(`   Task: ${event.data.task}`));
    }
    if (event.data?.tool) {
      console.log(chalk.dim(`   Tool: ${event.data.tool}`));
    }
    console.log('');
  }
  
  const paths = stateManager.getPaths();
  console.log(chalk.dim(`Ledger: ${paths.ledger}\n`));
}

/**
 * Configure agent settings
 */
export async function agentConfig(options: {
  plan?: boolean;
  noPlan?: boolean;
  autoAccept?: boolean;
  noAutoAccept?: boolean;
  status?: boolean;
}): Promise<void> {
  const stateManager = getStateManager();
  await stateManager.init();
  const state = stateManager.getState();
  
  console.log(chalk.bold('\n⚙️  Agent Configuration\n'));
  
  // Handle toggles
  if (options.plan) {
    await stateManager.setPlanMode(true);
    console.log(chalk.green('✓') + ' Plan mode ENABLED - Agent will show plans before executing\n');
  }
  
  if (options.noPlan) {
    await stateManager.setPlanMode(false);
    console.log(chalk.green('✓') + ' Plan mode DISABLED - Agent will execute immediately\n');
  }
  
  if (options.autoAccept) {
    await stateManager.setAutoAccept(true);
    console.log(chalk.green('✓') + ' Auto-accept ENABLED - No confirmation prompts\n');
  }
  
  if (options.noAutoAccept) {
    await stateManager.setAutoAccept(false);
    console.log(chalk.green('✓') + ' Auto-accept DISABLED - Confirmations required\n');
  }
  
  // Show current config
  const newState = stateManager.getState();
  console.log(chalk.bold('Current Settings:'));
  console.log(`  Plan Mode:      ${newState.planMode ? chalk.green('ON') : chalk.dim('OFF')}`);
  console.log(`  Auto-Accept:    ${newState.autoAccept ? chalk.green('ON') : chalk.dim('OFF')}`);
  console.log(`  YOLO Mode:      ${newState.yoloMode ? chalk.yellow('ON') : chalk.dim('OFF')}`);
  console.log(`  Provider:       ${newState.provider}`);
  console.log(`  Status:         ${chalk.cyan(newState.status)}`);
  console.log('');
  
  console.log(chalk.dim('Usage:'));
  console.log(chalk.dim('  echo agent config --plan        # Enable plan mode'));
  console.log(chalk.dim('  echo agent config --auto-accept # Enable auto-accept'));
  console.log(chalk.dim('  echo agent config --status      # Show current config'));
  console.log('');
}

/**
 * Doctor command - diagnose all systems and offer fixes
 */
export async function agentDoctor(): Promise<void> {
  const config = getConfig();
  const sessionStore = getSessionStore();
  const stateManager = getStateManager();
  const enquirer = new Enquirer();

  await sessionStore.init();
  await stateManager.init();

  console.log(chalk.bold('\n👨‍⚕️  Echo Doctor - System Diagnostic\n'));

  const issues: Array<{ name: string; description: string; fix: () => Promise<void> }> = [];

  // --- Diagnostic Checks ---

  // 1. Check Configuration
  const configPath = config.configPath;
  if (!existsSyncLocal(configPath)) {
    issues.push({
      name: 'Missing Config',
      description: 'Configuration file does not exist.',
      fix: async () => {
        config.reset();
        console.log(chalk.green('✓ Created default configuration.'));
      }
    });
  }

  // 2. Check Providers
  const providers = config.getConfiguredProviders();
  if (providers.length === 0) {
    issues.push({
      name: 'No Providers',
      description: 'No AI providers are configured. Echo cannot chat.',
      fix: async () => {
        const { authLogin } = await import('./auth.js');
        await authLogin();
      }
    });
  }

  // 3. Check Directories
  const paths = stateManager.getPaths();
  const dirs = [paths.data, paths.docs, paths.logs];
  for (const dir of dirs) {
    if (!existsSyncLocal(dir)) {
      issues.push({
        name: `Missing Directory: ${dir.split('/').pop()}`,
        description: `Required directory ${dir} is missing.`,
        fix: async () => {
          mkdirSync(dir, { recursive: true });
          console.log(chalk.green(`✓ Created directory: ${dir}`));
        }
      });
    }
  }

  // 4. Check GitHub
  const githubConfig = config.getGithubConfig();
  if (githubConfig?.enabled && !githubConfig.token) {
    issues.push({
      name: 'GitHub Config Incomplete',
      description: 'GitHub is enabled but no Personal Access Token is set.',
      fix: async () => {
        const { authGithub } = await import('./auth.js');
        await authGithub();
      }
    });
  }

  // 5. Check Box.com
  const boxConfig = config.getBoxConfig();
  if (boxConfig?.enabled && !boxConfig.developerToken) {
    issues.push({
      name: 'Box Config Incomplete',
      description: 'Box.com sync is enabled but no developer token is set.',
      fix: async () => {
        const { authBox } = await import('./auth.js');
        await authBox();
      }
    });
  }

  // --- Display Report ---
  
  if (issues.length === 0) {
    console.log(chalk.green('✓ All systems operational. Your Echo is in peak condition!\n'));
    return;
  }

  console.log(chalk.yellow(`⚠ Found ${issues.length} potential issue(s):\n`));
  
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    console.log(`${chalk.bold(i + 1 + '.')} ${chalk.yellow(issue.name)}`);
    console.log(chalk.dim(`   ${issue.description}\n`));
  }

  // --- Interactive Fixing ---

  const { applyFixes } = await enquirer.prompt({
    type: 'confirm',
    name: 'applyFixes',
    message: 'Would you like to try fixing these issues?',
    initial: true
  }) as { applyFixes: boolean };

  if (applyFixes) {
    for (const issue of issues) {
      const { fixIt } = await enquirer.prompt({
        type: 'confirm',
        name: 'fixIt',
        message: `Fix "${issue.name}"?`,
        initial: true
      }) as { fixIt: boolean };

      if (fixIt) {
        try {
          await issue.fix();
        } catch (error: any) {
          console.log(chalk.red(`✗ Failed to fix "${issue.name}": ${error.message}`));
        }
      }
    }
    console.log(chalk.bold.green('\n🎉 Diagnostic and repair complete!\n'));
  } else {
    console.log(chalk.dim('\nDiagnostic complete. No changes made.\n'));
  }
}

// Helper function (local version for clarity)
function existsSyncLocal(path: string): boolean {
  return existsSync(path);
}
