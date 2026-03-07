/**
 * Agent Commands - Manage agent execution and monitoring
 */

import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { getMemory } from '../utils/memory.js';
import { ProviderChain } from '../providers/chain.js';
import { getStateManager } from '../state/manager.js';

/**
 * Run agent mode with a task
 */
export async function agentRun(task: string, options: {
  provider?: string;
  yolo?: boolean;
  verbose?: boolean;
}): Promise<void> {
  console.log(chalk.bold('\n🤖 Agent Run Mode\n'));
  console.log(chalk.dim(`Task: ${task}`));
  console.log(chalk.dim(`Provider: ${options.provider || 'auto'}`));
  console.log(chalk.dim(`YOLO Mode: ${options.yolo ? '✓' : '✗'}`));
  console.log(chalk.dim(`Verbose: ${options.verbose ? '✓' : '✗'}\n`));
  
  console.log(chalk.yellow('⚠️  This is a placeholder - full agent run requires ReAct engine integration\n'));
  console.log(chalk.dim('Use: ') + chalk.cyan('echo chat "' + task + '" --agent') + chalk.dim('\n'));
}

/**
 * Show agent health status
 */
export async function agentHealth(): Promise<void> {
  const config = getConfig();
  const memory = getMemory();
  const stateManager = getStateManager();
  
  await memory.init();
  await stateManager.init();
  
  const providers = config.getConfiguredProviders();
  const stats = await memory.getStats();
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
  console.log(`  Current Session: ${stats.currentSessionMessages}`);
  console.log(`  Storage: ~/.config/echo-cli/history.json`);
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
  const memory = getMemory();
  await memory.init();
  
  console.log(chalk.bold('\n🧠 Agent Memory\n'));
  
  const stats = await memory.getStats();
  
  console.log(chalk.bold('Memory Statistics:'));
  console.log(`  Total Sessions: ${stats.totalSessions}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
  console.log(`  Current Session Messages: ${stats.currentSessionMessages}`);
  console.log(`  Storage: ~/.config/echo-cli/history.json`);
  console.log('');
  
  // List recent sessions
  const sessions = await memory.listSessions();
  if (sessions.length > 0) {
    console.log(chalk.bold('Recent Sessions:'));
    sessions.slice(0, options.limit || 10).forEach((session, i) => {
      console.log(`  ${i + 1}. ${session.name}`);
      console.log(`     ID: ${session.id}`);
      console.log(`     Messages: ${session.messages.length}`);
      console.log(`     Updated: ${new Date(session.updatedAt).toLocaleString()}`);
      console.log('');
    });
  }
  
  if (options.export) {
    console.log(chalk.dim(`Export to ${options.export} - coming soon\n`));
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
 * Doctor command - diagnose all systems
 */
export async function agentDoctor(): Promise<void> {
  const config = getConfig();
  const memory = getMemory();
  const stateManager = getStateManager();
  
  await memory.init();
  await stateManager.init();
  
  console.log(chalk.bold('\n👨\u200d⚕️  Echo Doctor - System Diagnostic\n'));
  
  let allHealthy = true;
  
  // Check configuration
  console.log(chalk.bold('Configuration:'));
  const configPath = config.configPath;
  console.log(`  ${existsSync(configPath) ? chalk.green('✓') : chalk.red('✗')} Config file exists`);
  console.log(`  ${config.getDefaultProvider() ? chalk.green('✓') : chalk.red('✗')} Default provider set`);
  console.log('');
  
  // Check providers
  console.log(chalk.bold('Provider Status:'));
  const providers = [
    { name: 'Gemini', key: 'gemini', env: 'GEMINI_API_KEY' },
    { name: 'OpenAI', key: 'openai', env: 'OPENAI_API_KEY' },
    { name: 'Anthropic', key: 'anthropic', env: 'ANTHROPIC_API_KEY' },
    { name: 'Groq', key: 'groq', env: 'GROQ_API_KEY' },
    { name: 'Qwen', key: 'qwen', env: null },
  ];
  
  for (const provider of providers) {
    const hasKey = config.isProviderConfigured(provider.key as any) || process.env[provider.env!];
    const icon = hasKey ? chalk.green('✓') : chalk.yellow('○');
    const status = hasKey ? 'Configured' : `Set ${provider.env} or run: echo auth login`;
    console.log(`  ${icon} ${provider.name}: ${status}`);
  }
  console.log('');
  
  // Check memory
  console.log(chalk.bold('Memory System:'));
  const memoryPath = memory.getHistoryPath();
  console.log(`  ${existsSync(memoryPath) ? chalk.green('✓') : chalk.yellow('○')} History file`);
  const stats = await memory.getStats();
  console.log(`  ${stats.totalSessions >= 0 ? chalk.green('✓') : chalk.red('✗')} Sessions: ${stats.totalSessions}`);
  console.log(`  ${stats.totalMessages >= 0 ? chalk.green('✓') : chalk.red('✗')} Messages: ${stats.totalMessages}`);
  console.log('');
  
  // Check state
  console.log(chalk.bold('State System:'));
  const paths = stateManager.getPaths();
  console.log(`  ${existsSync(paths.state) ? chalk.green('✓') : chalk.yellow('○')} State file`);
  console.log(`  ${existsSync(paths.ledger) ? chalk.green('✓') : chalk.yellow('○')} Event ledger`);
  const state = stateManager.getState();
  console.log(`  ${chalk.cyan('Status')}: ${state.status}`);
  console.log(`  ${chalk.cyan('Tasks')}: ${state.totalTasks} total, ${state.completedTasks} completed, ${state.failedTasks} failed`);
  console.log('');
  
  // Check directories
  console.log(chalk.bold('Directories:'));
  const dirs = [paths.data, paths.docs, paths.logs];
  for (const dir of dirs) {
    console.log(`  ${existsSync(dir) ? chalk.green('✓') : chalk.red('✗')} ${dir}`);
  }
  console.log('');
  
  // Overall health
  const health = await stateManager.getHealth();
  console.log(chalk.bold('Overall Health:'));
  console.log(`  ${health.state === 'ok' && health.ledger === 'ok' && health.directories === 'ok' ? chalk.green('✓ All systems operational') : chalk.red('✗ Issues detected')}`);
  console.log('');
  
  if (!allHealthy) {
    console.log(chalk.yellow('Recommendation: Run ') + chalk.cyan('echo auth login') + chalk.yellow(' to configure providers\n'));
  }
}

// Helper function
function existsSync(path: string): boolean {
  try {
    const { existsSync: es } = require('fs');
    return es(path);
  } catch {
    return false;
  }
}
