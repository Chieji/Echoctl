/**
 * Chat Command - Main conversation interface
 */

import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import gradient from 'gradient-string';
import { getConfig } from '../utils/config.js';
import { getMemory } from '../utils/memory.js';
import { ProviderChain, createDefaultChain } from '../providers/chain.js';
import { selectProviderForTask, getProviderSelectionReason } from '../utils/smart-mode.js';
import { ProviderName, Message } from '../types/index.js';
import { createReActEngine } from '../core/engine.js';
import { loadEchoContext, formatContextForPrompt } from '../tools/context-loader.js';

/**
 * Format and display the AI response
 */
function displayResponse(content: string, provider: ProviderName, tokens?: {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}): void {
  console.log('\n' + chalk.dim('─'.repeat(60)) + '\n');
  
  // Provider badge
  const providerBadges: Record<ProviderName, string> = {
    openai: chalk.blue('🟦 OpenAI'),
    gemini: chalk.green('🟩 Gemini'),
    anthropic: chalk.magenta('🟪 Claude'),
    smart: chalk.cyan('🧠 Smart'),
    qwen: chalk.red('🟥 Qwen'),
    ollama: chalk.yellow('🟨 Ollama'),
    deepseek: chalk.blueBright('🔵 DeepSeek'),
    kimi: chalk.rgb(255, 100, 100)('🔴 Kimi'),
    groq: chalk.greenBright('🟢 Groq'),
    openrouter: chalk.rgb(100, 100, 255)('🔷 OpenRouter'),
    together: chalk.rgb(255, 150, 0)('🟠 Together'),
    modelscope: chalk.rgb(255, 50, 50)('🔴 ModelScope'),
    mistral: chalk.rgb(255, 100, 255)('🟣 Mistral'),
    huggingface: chalk.rgb(255, 200, 50)('🟡 HF'),
    github: chalk.white('⬛ GitHub'),
  };

  console.log(`  ${providerBadges[provider]}`);
  console.log('');

  // Display response with proper formatting
  const lines = content.split('\n');
  for (const line of lines) {
    // Code blocks
    if (line.trim().startsWith('```')) {
      console.log(chalk.dim(line));
    } else if (line.startsWith('#')) {
      console.log(chalk.bold.cyan(line));
    } else if (line.startsWith('##')) {
      console.log(chalk.bold(line));
    } else if (line.startsWith('-') || line.startsWith('*')) {
      console.log(chalk.dim('  •') + ' ' + line.slice(1));
    } else if (line.match(/^\d+\./)) {
      console.log(chalk.dim('  ' + line));
    } else {
      console.log(line);
    }
  }

  // Token usage if available
  if (tokens) {
    console.log('\n' + chalk.dim('─'.repeat(60)));
    console.log(
      chalk.dim(`  Tokens: ${tokens.promptTokens} → ${tokens.completionTokens} (total: ${tokens.totalTokens})`)
    );
  }

  console.log('');
}

/**
 * Display smart mode selection info
 */
function displaySmartModeInfo(input: string, selectedProvider: ProviderName): void {
  const reason = getProviderSelectionReason(input);
  console.log(chalk.dim(`  ${reason}`));
  console.log('');
}

/**
 * Main chat function
 */
export async function chat(message: string, options: {
  provider?: ProviderName;
  smart?: boolean;
  session?: string;
  raw?: boolean;
  yolo?: boolean;
  agent?: boolean;
}): Promise<void> {
  const config = getConfig();
  const memory = getMemory();

  // Initialize memory
  await memory.init();

  // Check if any providers are configured
  const configuredProviders = config.getConfiguredProviders();
  
  if (configuredProviders.length === 0) {
    console.log(chalk.yellow('⚠ No AI providers configured.'));
    console.log(chalk.dim('Run ') + chalk.cyan('echo auth login') + chalk.dim(' to set up your first provider.\n'));
    process.exit(1);
  }

  // Determine which provider to use
  let providerToUse: ProviderName;
  let isSmartMode = options.smart ?? config.isSmartModeEnabled();

  if (options.provider) {
    providerToUse = options.provider;
    isSmartMode = false;
    
    if (!config.isProviderConfigured(providerToUse)) {
      console.log(chalk.red(`✗ ${providerToUse.toUpperCase()} is not configured.`));
      console.log(chalk.dim('Run ') + chalk.cyan('echo auth login') + chalk.dim(' to configure it.\n'));
      process.exit(1);
    }
  } else if (isSmartMode) {
    providerToUse = selectProviderForTask(message);
    if (!config.isProviderConfigured(providerToUse)) {
      providerToUse = config.getDefaultProvider();
    }
  } else {
    providerToUse = config.getDefaultProvider();
  }

  // Switch session if specified
  if (options.session) {
    const session = await memory.switchSession(options.session);
    if (!session) {
      console.log(chalk.red(`✗ Session not found: ${options.session}`));
      process.exit(1);
    }
  }

  // Load ECHO.md context
  const echoContext = await loadEchoContext();
  if (echoContext && !options.raw) {
    console.log(chalk.dim('📄 Using ECHO.md context: ') + chalk.cyan(echoContext.projectName || 'Project'));
    console.log('');
  }

  // Create provider chain
  const providerConfigs = config.getAllProviderConfigs();
  const chain = createDefaultChain(providerConfigs);

  // Check if using ReAct agent mode
  if (options.agent) {
    await runAgentMode(message, chain, config, options);
    return;
  }

  // Standard chat mode
  await runStandardChat(message, chain, providerToUse, memory, config, options, echoContext);
}

/**
 * Run ReAct agent mode
 */
async function runAgentMode(
  message: string,
  chain: ProviderChain,
  config: any,
  options: { yolo?: boolean; raw?: boolean }
): Promise<void> {
  const engine = createReActEngine(chain, {
    yoloMode: options.yolo || false,
    maxIterations: 15,
    contextLength: config.getContextLength(),
  });

  console.log(chalk.bold('\n🤖 Agent Mode'));
  console.log(chalk.dim('Echo will reason and execute tools to complete your task\n'));

  if (options.yolo) {
    console.log(chalk.yellow.bold('⚠️  YOLO MODE: Executing commands without confirmation\n'));
  }

  const result = await engine.run(message);

  if (!options.raw) {
    console.log('\n' + chalk.dim('─'.repeat(60)));
    console.log(chalk.bold(result.success ? '✓ Task Complete' : '⚠ Task Incomplete'));
    
    if (result.actions.length > 0) {
      console.log('\n' + chalk.dim('Actions performed:'));
      result.actions.forEach(action => console.log(`  ${action}`));
    }
    
    console.log('\n' + chalk.dim('─'.repeat(60)) + '\n');
    console.log(result.result);
  } else {
    console.log(result.result);
  }
}

/**
 * Run standard chat mode
 */
async function runStandardChat(
  message: string,
  chain: ProviderChain,
  provider: ProviderName,
  memory: any,
  config: any,
  options: { raw?: boolean },
  echoContext: any
): Promise<void> {
  const contextLength = config.getContextLength();
  const history = await memory.getContext(contextLength);

  // Build system prompt with ECHO.md context
  let systemPrompt = 'You are Echo, a helpful AI assistant.';
  if (echoContext) {
    systemPrompt += '\n\n' + formatContextForPrompt(echoContext);
  }

  const messagesWithSystem = [
    { role: 'system' as const, content: systemPrompt, timestamp: Date.now() },
    ...history,
  ];

  // Add user message
  await memory.addMessage('user', message);

  const spinner = ora({ text: chalk.dim('Thinking...'), spinner: 'dots' }).start();

  try {
    const result = await chain.generateWithFailover(messagesWithSystem, undefined, provider);
    spinner.stop();

    await memory.addMessage('assistant', result.response.content);

    if (!options.raw) {
      displayResponse(result.response.content, result.provider, result.response.usage);
    } else {
      console.log(result.response.content);
    }

    if (result.failoverOccurred) {
      console.log(chalk.dim(`  (Failover: ${result.attempts.join(' → ')})\n`));
    }
  } catch (error: any) {
    spinner.stop();
    console.log(chalk.red(`✗ Error: ${error.message}`));
    console.log(chalk.dim('\nTip: Check your API key and credits.\n'));
    process.exit(1);
  }
}

/**
 * Continue conversation (uses last session)
 */
export async function continueChat(message: string): Promise<void> {
  return chat(message, {});
}

/**
 * Start a new session
 */
export async function newSession(name?: string): Promise<void> {
  const memory = getMemory();
  await memory.init();

  const session = await memory.createSession(name);
  
  console.log(chalk.green('✓ New session started'));
  console.log(chalk.dim(`  ID: ${session.id}`));
  console.log(chalk.dim(`  Name: ${session.name}`));
  console.log(chalk.dim(`  Created: ${new Date(session.createdAt).toLocaleString()}`));
  console.log('');
  console.log(chalk.dim('Start chatting with: ') + chalk.cyan(`echo "Your message"`));
  console.log('');
}

/**
 * List sessions
 */
export async function listSessions(): Promise<void> {
  const memory = getMemory();
  await memory.init();

  const sessions = await memory.listSessions();

  if (sessions.length === 0) {
    console.log(chalk.yellow('⚠ No sessions found. Start one with: ') + chalk.cyan('echo chat "Hello"') + '\n');
    return;
  }

  const table = new Table({
    head: [chalk.cyan('ID'), chalk.cyan('Name'), chalk.cyan('Messages'), chalk.cyan('Last Activity')],
    colWidths: [10, 30, 12, 25],
  });

  for (const session of sessions.slice(0, 10)) {
    table.push([
      session.id.substring(0, 8) + '...',
      session.name.substring(0, 28),
      session.messages.length.toString(),
      new Date(session.updatedAt).toLocaleString(),
    ]);
  }

  console.log('\n' + chalk.bold('Recent Sessions') + '\n');
  console.log(table.toString());
  console.log('');
  console.log(chalk.dim('Switch to a session: ') + chalk.cyan('echo chat "msg" --session <id>') + '\n');
}

/**
 * Show session stats
 */
export async function showStats(): Promise<void> {
  const memory = getMemory();
  await memory.init();

  const stats = await memory.getStats();
  const config = getConfig();

  console.log('\n' + gradient.pastel('╔════════════════════════════════════════╗'));
  console.log(gradient.pastel('║        📊 Echo CLI Statistics        ║'));
  console.log(gradient.pastel('╚════════════════════════════════════════╝\n'));

  const table = new Table({
    colWidths: [25, 15],
  });

  table.push(
    [chalk.cyan('Total Sessions'), stats.totalSessions.toString()],
    [chalk.cyan('Total Messages'), stats.totalMessages.toString()],
    [chalk.cyan('Current Session'), stats.currentSessionMessages.toString()],
    [chalk.cyan('Default Provider'), config.getDefaultProvider().toUpperCase()],
    [chalk.cyan('Smart Mode'), config.isSmartModeEnabled() ? chalk.green('On') : chalk.yellow('Off')],
  );

  console.log(table.toString());
  console.log('');
  console.log(chalk.dim(`History file: ${memory.getHistoryPath()}`) + '\n');
}

/**
 * Chat command group
 */
export const chatCommand = {
  chat,
  continueChat,
  newSession,
  listSessions,
  showStats,
};
