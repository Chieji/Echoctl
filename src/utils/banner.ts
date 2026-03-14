/**
 * Echo CLI Banner - Premium Startup Display
 * Hand-crafted ASCII art with rich multi-color gradients
 * Inspired by Gemini CLI / Claude Code / Qwen aesthetics
 */

import gradient from 'gradient-string';
import chalk from 'chalk';
import os from 'os';
import { getConfig } from './config.js';
import { AutoAuthSync } from '../auth/sync.js';

// ─── Premium Color Palettes ─────────────────────────────────────────────────

/** Main logo gradient: deep blue → electric blue → cyan → violet → magenta */
const echoGradient = gradient([
  '#0D47A1',  // deep blue
  '#1565C0',  // royal blue
  '#42A5F5',  // electric blue
  '#26C6DA',  // cyan
  '#7E57C2',  // violet
  '#AB47BC',  // magenta
]);

/** Accent gradient for tagline and decorations */
const accentGradient = gradient([
  '#42A5F5',  // electric blue
  '#7E57C2',  // violet
  '#E040FB',  // pink
]);

/** Subtle gradient for tips and secondary text */
const subtleGradient = gradient([
  '#616161',  // grey
  '#9E9E9E',  // lighter grey
  '#78909C',  // blue grey
]);

/** Success gradient for status indicators */
const statusGradient = gradient([
  '#26C6DA',  // cyan
  '#66BB6A',  // green
]);

// ─── Hand-Crafted ASCII Art ─────────────────────────────────────────────────

const ECHO_LOGO = `
   ███████╗  ██████╗ ██╗  ██╗  ██████╗ 
   ██╔════╝ ██╔════╝ ██║  ██║ ██╔═══██╗
   █████╗   ██║      ███████║ ██║   ██║
   ██╔══╝   ██║      ██╔══██║ ██║   ██║
   ███████╗ ╚██████╗ ██║  ██║ ╚██████╔╝
   ╚══════╝  ╚═════╝ ╚═╝  ╚═╝  ╚═════╝`;

const ECHO_LOGO_COMPACT = `
   ╔══════════════════════════════════════╗
   ║  ███████╗ ██████╗██╗  ██╗ ██████╗   ║
   ║  ██╔════╝██╔════╝██║  ██║██╔═══██╗  ║
   ║  █████╗  ██║     ███████║██║   ██║  ║
   ║  ██╔══╝  ██║     ██╔══██║██║   ██║  ║
   ║  ███████╗╚██████╗██║  ██║╚██████╔╝  ║
   ║  ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ║
   ╚══════════════════════════════════════╝`;

// ─── Provider Display Config ────────────────────────────────────────────────

interface ProviderDisplay {
  name: string;
  key: string;
  env: string | null;
  icon: string;
  color: (text: string) => string;
}

const PROVIDERS: ProviderDisplay[] = [
  { name: 'Gemini',    key: 'gemini',    env: 'google',    icon: '◆', color: chalk.hex('#4285F4') },
  { name: 'Claude',    key: 'anthropic', env: 'anthropic', icon: '◆', color: chalk.hex('#E39B6E') },
  { name: 'OpenAI',    key: 'openai',    env: 'openai',    icon: '◆', color: chalk.hex('#10A37F') },
  { name: 'Groq',      key: 'groq',      env: null,        icon: '◆', color: chalk.hex('#F55036') },
  { name: 'DeepSeek',  key: 'deepseek',  env: null,        icon: '◆', color: chalk.hex('#4FC3F7') },
  { name: 'Mistral',   key: 'mistral',   env: null,        icon: '◆', color: chalk.hex('#FF7000') },
  { name: 'Ollama',    key: 'ollama',    env: 'ollama',    icon: '◆', color: chalk.hex('#FFFFFF') },
  { name: 'Qwen',      key: 'qwen',      env: 'qwen',      icon: '◆', color: chalk.hex('#6C5CE7') },
];

// ─── Tips ───────────────────────────────────────────────────────────────────

const TIPS = [
  'Use  echo chat "msg" --agent  for autonomous task execution',
  'Add  ECHO.md  to your project for custom context rules',
  'Run  echo auth sync  to auto-detect all provider credentials',
  'Use  --yolo  for full autonomy (commands run without asking)',
  'Try  --provider groq  for ultra-fast inference',
  'Use  echo brain save <key> <value>  to teach Echo something',
  'Run  echo agent doctor  to diagnose system health',
  'Use  echo track new <name>  to isolate project contexts',
  'Try  echo plugin sync-all  to import your AI configs',
  'Use  echo approve list  to review pending HITL decisions',
];

// ─── Display Functions ──────────────────────────────────────────────────────

/**
 * Display the premium Echo ASCII banner with rich gradients
 */
export async function displayBanner(): Promise<void> {
  console.log('');

  // Render the logo with multi-color gradient
  console.log(echoGradient.multiline(ECHO_LOGO));

  // Tagline with accent gradient
  console.log('');
  console.log(accentGradient('   ⚡ The Resilient Agentic Terminal') + chalk.dim('  v2.0.0'));
  console.log('');
}

/**
 * Display provider sync status with colored indicators
 */
export async function displayProviderStatus(): Promise<void> {
  try {
    const config = getConfig();
    let creds: any = {};

    try {
      creds = await AutoAuthSync.syncAllCredentials();
    } catch {
      // Credential sync may fail silently
    }

    const statusParts: string[] = [];

    for (const provider of PROVIDERS) {
      const isConfigured = config.isProviderConfigured(provider.key as any) ||
                           (provider.env && (creds as any)[provider.env]);

      if (isConfigured) {
        statusParts.push(provider.color(`● ${provider.name}`));
      } else {
        statusParts.push(chalk.dim(`○ ${provider.name}`));
      }
    }

    // Display on one or two lines depending on terminal width
    const termWidth = process.stdout.columns || 80;
    const statusLine = statusParts.join(chalk.dim('  '));

    if (termWidth >= 100) {
      console.log(`   ${statusLine}`);
    } else {
      // Split into two rows
      const half = Math.ceil(statusParts.length / 2);
      console.log(`   ${statusParts.slice(0, half).join(chalk.dim('  '))}`);
      console.log(`   ${statusParts.slice(half).join(chalk.dim('  '))}`);
    }

    console.log('');
  } catch (error) {
    // Provider status is non-critical, fail silently
  }
}

/**
 * Display a random helpful tip
 */
export function displayQuickTip(): void {
  const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
  console.log(subtleGradient(`   💡 ${randomTip}`));
  console.log('');
}

/**
 * Display system info line
 */
export function displaySystemInfo(): void {
  const nodeVersion = process.version;
  const platform = `${os.type()} ${os.arch()}`;
  const shell = process.env.SHELL?.split('/').pop() || 'unknown';

  console.log(chalk.dim(`   Node ${nodeVersion}  •  ${platform}  •  ${shell}  •  37 tools`));
  console.log('');
}

/**
 * Display the separator line with gradient
 */
export function displaySeparator(): void {
  const termWidth = Math.min(process.stdout.columns || 60, 64);
  const line = '─'.repeat(termWidth);
  console.log(subtleGradient(`   ${line}`));
  console.log('');
}

/**
 * Full premium startup sequence
 */
export async function displayStartupSequence(): Promise<void> {
  await displayBanner();
  await displayProviderStatus();
  displaySystemInfo();
  displayQuickTip();
  displaySeparator();
}

/**
 * Minimal banner for non-TUI commands (e.g., `echo chat`)
 * Shows logo + provider status only, no tips/system info
 */
export async function displayMinimalBanner(): Promise<void> {
  console.log(echoGradient.multiline(ECHO_LOGO));
  console.log('');
  console.log(accentGradient('   ⚡ Echo') + chalk.dim('  v2.0.0'));
  console.log('');
  displaySeparator();
}

/**
 * Export the logo constant for use in TUI startup
 */
export { ECHO_LOGO, ECHO_LOGO_COMPACT, echoGradient, accentGradient, subtleGradient, statusGradient };
