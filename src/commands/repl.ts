/**
 * Interactive REPL Mode for Echo CLI
 * Continuous chat loop with built-in commands
 */

import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline/promises';
import { getConfig } from '../utils/config.js';
import { getMemory } from '../utils/memory.js';
import { getSessionStore } from '../storage/sessions.js';
import { ProviderChain, createDefaultChain } from '../providers/chain.js';
import { ProviderName, Message } from '../types/index.js';
import { createReActEngine } from '../core/engine.js';
import { loadEchoContext, formatContextForPrompt } from '../tools/context-loader.js';
import { displayMinimalBanner } from '../utils/banner.js';
import { highlightMarkdown } from '../utils/highlight.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * REPL State
 */
interface ReplState {
  isAgentMode: boolean;
  isYoloMode: boolean;
  planMode: boolean;
  autoCommit: boolean;
  provider: ProviderName;
  session: any;
}

/**
 * Start the Interactive REPL Mode
 */
export async function startRepl(options: {
  provider?: ProviderName;
  agent?: boolean;
  yolo?: boolean;
  session?: string;
  plan?: boolean;
}): Promise<void> {
  await displayMinimalBanner();

  const config = getConfig();
  const memory = getMemory();
  const sessionStore = getSessionStore();

  await memory.init();
  await sessionStore.init();

  if (config.getConfiguredProviders().length === 0) {
    console.log(chalk.yellow('⚠ No AI providers configured.'));
    console.log(chalk.dim('Run ') + chalk.cyan('echo auth login') + chalk.dim(' to set up your first provider.\n'));
    process.exit(1);
  }

  // Initial State Setup
  const state: ReplState = {
    isAgentMode: options.agent || false,
    isYoloMode: options.yolo || false,
    planMode: options.plan || false,
    autoCommit: false,
    provider: options.provider || config.getDefaultProvider(),
    session: null,
  };

  if (!config.isProviderConfigured(state.provider)) {
    console.log(chalk.red(`✗ Provider '${state.provider}' is not configured.`));
    console.log(chalk.dim('Falling back to default configured provider...'));
    const configured = config.getConfiguredProviders();
    if (configured.length > 0) {
      state.provider = configured[0];
    }
  }

  // Load Session
  if (options.session) {
    const success = await sessionStore.setCurrentSession(options.session);
    if (!success) {
      console.log(chalk.red(`✗ Session not found: ${options.session}`));
      state.session = await sessionStore.create('Interactive Session', state.provider);
      await sessionStore.setCurrentSession(state.session.id);
    } else {
      state.session = sessionStore.getCurrentSession();
      console.log(chalk.dim('📁 Resumed Session: ') + chalk.cyan(state.session.name));
    }
  } else {
    // Check if there is an active session
    let curr = sessionStore.getCurrentSession();
    if (!curr) {
      curr = await sessionStore.create('Interactive Session', state.provider);
      await sessionStore.setCurrentSession(curr.id);
    }
    state.session = curr;
  }

  // Print welcome info
  console.log(chalk.bold.cyan('Welcome to Echo REPL'));
  console.log(chalk.dim('Type /help for commands, or just start chatting. (Ctrl+C to exit)\n'));

  // Create Readline Interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Hotkey listener for Ctrl+Y (YOLO Toggle)
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'y') {
      state.isYoloMode = !state.isYoloMode;
      // Clear current line, print notification, then rewrite the prompt
      process.stdout.write('\x1b[2K\r'); 
      if (state.isYoloMode) {
        console.log(chalk.yellow.bold('⚠️  YOLO Mode Enabled (Tool prompts bypassed)'));
      } else {
        console.log(chalk.green('✓ YOLO Mode disabled (Safe mode)'));
      }
      rl.prompt(true);
    }
  });

  // Main REPL Loop
  while (true) {
    const promptPrefix = chalk.cyan('Echo ');
    
    let modeString = '';
    if (state.planMode) {
      modeString = chalk.green('[plan]');
    } else if (state.isAgentMode) {
      const yoloTag = state.isYoloMode ? chalk.red.bold('{YOLO}') : '';
      modeString = chalk.magenta('[agent]') + yoloTag;
    } else {
      modeString = chalk.blue('[chat]');
    }

    const providerString = chalk.dim(`{${state.provider}}`);
    const prompt = `\n${promptPrefix}${modeString} ${providerString} ${chalk.cyan('>')} `;

    const input = await rl.question(prompt);
    const trimmed = input.trim();

    if (!trimmed) continue;

    // --- Handle Slash Commands ---
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(' ');
      const cmd = parts[0].toLowerCase();
      
      switch (cmd) {
        case '/help':
          console.log(chalk.bold('\nAvailable Commands:'));
          console.log(`  ${chalk.cyan('/exit, /quit')}        Exit the REPL`);
          console.log(`  ${chalk.cyan('/clear')}             Clear screen and current session context`);
          console.log(`  ${chalk.cyan('/mode agent')}        Switch to tool-execution Agent Mode`);
          console.log(`  ${chalk.cyan('/mode chat')}         Switch to standard Chat Mode`);
          console.log(`  ${chalk.cyan('/mode plan')}         Switch to read-only exploration mode`);
          console.log(`  ${chalk.cyan('/yolo on|off')}       Toggle YOLO mode (no action confirmations - or use Ctrl+Y)`);
          console.log(`  ${chalk.cyan('/autocommit on|off')} Toggle Aider-style automatic git commits`);
          console.log(`  ${chalk.cyan('/provider <name>')}   Switch AI provider (gemini, claude, openai, groq, etc)`);
          console.log(`  ${chalk.cyan('/session new')}       Start a fresh conversation session`);
          break;

        case '/exit':
        case '/quit':
          console.log(chalk.dim('\nGoodbye!\n'));
          rl.close();
          return;

        case '/clear':
          console.clear();
          state.session = await sessionStore.create('Interactive Session', state.provider);
          await sessionStore.setCurrentSession(state.session.id);
          displayMinimalBanner();
          console.log(chalk.green('✓ Session cleared. Started fresh context.'));
          break;

        case '/mode':
          const newMode = parts[1]?.toLowerCase();
          if (newMode === 'agent') {
            state.isAgentMode = true;
            state.planMode = false;
            console.log(chalk.green('✓ Agent Mode enabled (Echo can run tools)'));
          } else if (newMode === 'chat') {
            state.isAgentMode = false;
            state.planMode = false;
            console.log(chalk.blue('✓ Chat Mode enabled (Text only)'));
          } else if (newMode === 'plan') {
            state.isAgentMode = true;
            state.planMode = true;
            console.log(chalk.green('✓ Plan Mode enabled (Read-only exploration)'));
          } else {
            console.log(chalk.yellow(`Unknown mode. Use: /mode agent | /mode chat | /mode plan`));
          }
          break;

        case '/yolo':
          const yoloOpt = parts[1]?.toLowerCase();
          if (yoloOpt === 'on') {
            state.isYoloMode = true;
            console.log(chalk.yellow.bold('⚠️  YOLO Mode Enabled (Tool prompts bypassed)'));
          } else if (yoloOpt === 'off') {
            state.isYoloMode = false;
            console.log(chalk.green('✓ YOLO Mode disabled (Safe mode)'));
          } else {
            console.log(chalk.dim(`Current YOLO status: ${state.isYoloMode ? 'ON' : 'OFF'}`));
          }
          break;

        case '/autocommit':
          const autocommitCmd = parts[1]?.toLowerCase();
          if (autocommitCmd === 'on') {
            state.autoCommit = true;
            console.log(chalk.green('✓ Auto-Git Commits enabled'));
          } else if (autocommitCmd === 'off') {
            state.autoCommit = false;
            console.log(chalk.yellow('✓ Auto-Git Commits disabled'));
          } else {
            console.log(chalk.dim(`Current Auto-Commit status: ${state.autoCommit ? 'ON' : 'OFF'}`));
          }
          break;

        case '/provider':
          const newProv = parts[1] as ProviderName;
          if (!newProv) {
            const configured = config.getConfiguredProviders();
            console.log(chalk.dim(`Current config providers: ${configured.join(', ')}`));
          } else if (config.isProviderConfigured(newProv)) {
            state.provider = newProv;
            console.log(chalk.green(`✓ Switched provider to: ${newProv}`));
          } else {
            console.log(chalk.red(`✗ Provider '${newProv}' is not configured.`));
          }
          break;

        case '/session':
          const sessCmd = parts[1];
          if (sessCmd === 'new') {
            state.session = await sessionStore.create('Interactive Session', state.provider);
            await sessionStore.setCurrentSession(state.session.id);
            console.log(chalk.green('✓ Started new named session: ') + chalk.cyan(state.session.id));
          } else {
            console.log(chalk.yellow(`Usage: /session new`));
          }
          break;

        default:
          console.log(chalk.yellow(`Unknown command: ${cmd} (type /help for list)`));
      }
      continue;
    }

    // --- End Slash Commands ---

    // Process actual message
    try {
      const echoContext = await loadEchoContext();
      const chain = createDefaultChain(config.getAllProviderConfigs());

      if (state.isAgentMode) {
        await processAgentTurn(trimmed, chain, state, echoContext);
      } else {
        await processChatTurn(trimmed, chain, state, echoContext, sessionStore);
      }
    } catch (error: any) {
      console.log(chalk.red(`\n✗ Error: ${error.message}`));
    }
  }
}

/**
 * Handle a generic Chat Turn
 */
async function processChatTurn(
  message: string, 
  chain: ProviderChain, 
  state: ReplState, 
  echoContext: any,
  sessionStore: any
): Promise<void> {

  const config = getConfig();
  const contextLength = config.getContextLength();
  
  // Save user message
  await sessionStore.addMessage(state.session.id, 'user', message);
  
  // Reload fresh from db
  const currentSession = sessionStore.get(state.session.id);
  const updatedHistory = currentSession!.messages.slice(-(contextLength || 10));

  let systemPrompt = 'You are Echo, a helpful autonomous AI assistant in REPL mode.';
  if (echoContext) {
    systemPrompt += '\n\n' + formatContextForPrompt(echoContext);
  }

  const messagesWithSystem = [
    { role: 'system' as const, content: systemPrompt, timestamp: Date.now() },
    ...updatedHistory,
  ];

  const spinner = ora({ text: chalk.dim('Thinking...'), spinner: 'dots' }).start();

  try {
    let firstChunk = true;
    
    const result = await chain.generateWithFailover(
      messagesWithSystem, 
      undefined, 
      state.provider,
      (chunk: string) => {
        if (firstChunk) {
          spinner.stop();
          console.log(''); // Newline before response starts
          firstChunk = false;
        }
        process.stdout.write(chunk);
      }
    );
    
    if (firstChunk) spinner.stop(); // In case no chunks arrived

    console.log('\n'); // Ensure final newline after stream ends

    await sessionStore.addMessage(state.session.id, 'assistant', result.response.content);
    
    // We don't call displayResponse here because we already streamed it live to stdout.
    // If failover occurred, let the user know.
    if (result.failoverOccurred) {
      console.log(chalk.dim(`\n(Failover: ${result.attempts.join(' → ')})\n`));
    }

  } catch (err: any) {
    spinner.stop();
    throw err;
  }
}

/**
 * Handle an Agent Turn
 */
async function processAgentTurn(
  message: string,
  chain: ProviderChain,
  state: ReplState,
  echoContext: any
): Promise<void> {

  const engine = createReActEngine(chain, {
    yoloMode: state.isYoloMode,
    planMode: state.planMode,
    maxIterations: 15,
    contextLength: getConfig().getContextLength(),
  });

  const spinner = ora({ text: chalk.dim('Thinking...'), spinner: 'dots' }).start();
  let firstChunk = true;

  const result = await engine.run(message, (chunk: string) => {
    if (firstChunk) {
      spinner.stop();
      console.log(''); // Newline
      firstChunk = false;
    }
    process.stdout.write(chunk);
  });

  if (firstChunk) spinner.stop();

  console.log('\n' + chalk.dim('─'.repeat(40)));
  console.log(chalk.bold(result.success ? '✓ Task Complete' : '⚠ Task Incomplete'));
  
  if (result.actions.length > 0) {
    console.log(chalk.dim('\nActions performed:'));
    result.actions.forEach(action => console.log(`  ${action}`));
  }
  
  console.log(chalk.dim('─'.repeat(40)) + '\n');
  console.log(highlightMarkdown(result.result));

  // Auto Commit Integration
  if (state.autoCommit && result.success && result.actions.length > 0) {
    try {
      const { stdout: gitStatus } = await execAsync('git status --porcelain');
      if (gitStatus.trim().length > 0) {
        console.log(chalk.dim('\n🤖 Changes detected. Generating contextual commit...'));
        
        // Generate commit message using the provider
        const pushPrompt = `You are an expert developer. The agent just made these changes: \n${result.actions.join('\n')}\nHere is the git status output:\n${gitStatus}\n\nWrite a concise 1-line commit message in the present tense (e.g. "Fix typo in parser" or "Add login button"). Output ONLY the commit message. No quotes, no markdown.`;
        
        const commitMsgResult = await chain.generateWithFailover([
          { role: 'user', content: pushPrompt, timestamp: Date.now() }
        ], undefined, state.provider);
        
        const commitMsg = commitMsgResult.response.content.replace(/['"]/g, '').trim();
        
        await execAsync(`git add . && git commit -m "${commitMsg}"`);
        console.log(chalk.green(`✓ Auto-committed: ${commitMsg}`));
      }
    } catch (e: any) {
      console.log(chalk.yellow(`⚠ Auto-commit failed: ${e.message}`));
    }
  }
}
