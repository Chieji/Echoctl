/**
 * TUI Commands - Launch interactive dashboard
 */

import { launchDashboard as launchInteractiveDashboard } from '../tui/echomen-dashboard.js';
import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { getSessionStore } from '../storage/sessions.js';

/**
 * Launch the text-based dashboard
 * Uses interactive Ink dashboard if available, falls back to static
 */
export async function launchDashboard(): Promise<void> {
  try {
    // Try to launch interactive dashboard
    await launchInteractiveDashboard();
  } catch (error: any) {
    // Fallback to static dashboard if Ink fails
    await launchStaticDashboard();
  }
}

/**
 * Static dashboard fallback
 */
async function launchStaticDashboard(): Promise<void> {
  const config = getConfig();
  const sessions = getSessionStore();
  await sessions.init();
  const stats = await sessions.getStats();

  const providers = [
    { name: 'Gemini', configured: config.isProviderConfigured('gemini') },
    { name: 'OpenAI', configured: config.isProviderConfigured('openai') },
    { name: 'Claude', configured: config.isProviderConfigured('anthropic') },
    { name: 'Qwen', configured: config.isProviderConfigured('qwen') },
    { name: 'Ollama', configured: config.isProviderConfigured('ollama') },
    { name: 'Groq', configured: config.isProviderConfigured('groq') },
    { name: 'DeepSeek', configured: config.isProviderConfigured('deepseek') },
    { name: 'Kimi', configured: config.isProviderConfigured('kimi') },
    { name: 'OpenRouter', configured: config.isProviderConfigured('openrouter') },
    { name: 'Together', configured: config.isProviderConfigured('together') },
    { name: 'ModelScope', configured: config.isProviderConfigured('modelscope') },
    { name: 'Mistral', configured: config.isProviderConfigured('mistral') },
    { name: 'HuggingFace', configured: config.isProviderConfigured('huggingface') },
    { name: 'GitHub', configured: config.isProviderConfigured('github') },
  ];

  console.clear();

  // Header
  console.log(chalk.cyan.bold('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║') + chalk.white.bold('  ECHO DASHBOARD - The Resilient Agentic Terminal    ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════╝'));
  console.log('');

  // Time
  console.log(chalk.gray('Time: ') + chalk.white(new Date().toLocaleString()));
  console.log(chalk.gray('Status: ') + chalk.green('● Online'));
  console.log('');

  // Provider Status
  console.log(chalk.cyan.bold('┌─────────────────────────────────────────────────────────┐'));
  console.log(chalk.cyan.bold('│') + chalk.cyan.bold(' Provider Status ') + ' '.repeat(48) + chalk.cyan.bold('│'));
  console.log(chalk.cyan.bold('├─────────────────────────────────────────────────────────┤'));

  const configuredCount = providers.filter(p => p.configured).length;
  console.log(chalk.cyan('│') + chalk.white(`  Configured: ${configuredCount}/14 providers`) + ' '.repeat(20) + chalk.cyan('│'));
  console.log(chalk.cyan.bold('└─────────────────────────────────────────────────────────┘'));
  console.log('');

  // Statistics
  console.log(chalk.magenta.bold('┌─────────────────────────────────────────────────────────┐'));
  console.log(chalk.magenta.bold('│') + chalk.magenta.bold(' Statistics ') + ' '.repeat(49) + chalk.magenta.bold('│'));
  console.log(chalk.magenta.bold('├─────────────────────────────────────────────────────────┤'));
  console.log(chalk.cyan('│') + chalk.gray(` Sessions:        ${chalk.white(stats.totalSessions.toString())}`) + ' '.repeat(32) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + chalk.gray(` Total Messages:  ${chalk.white(stats.totalMessages.toString())}`) + ' '.repeat(31) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + chalk.gray(` Total Tokens:    ${chalk.white(stats.totalTokens.toString())}`) + ' '.repeat(31) + chalk.cyan('│'));
  console.log(chalk.magenta.bold('└─────────────────────────────────────────────────────────┘'));
  console.log('');

  // Quick Commands
  console.log(chalk.green.bold('Quick Commands:'));
  console.log(chalk.white('  echo chat "message"     - Start a conversation'));
  console.log(chalk.white('  echo chat --agent       - Agent mode with tools'));
  console.log(chalk.white('  echo brain save         - Save to Second Brain'));
  console.log(chalk.white('  echo approve list       - View pending approvals'));
  console.log(chalk.white('  echo plugin sync-all    - Sync plugins'));
  console.log(chalk.white('  echo auth sync          - Auto-detect credentials'));
  console.log(chalk.white('  echo dashboard          - Show this dashboard'));
  console.log('');
  console.log(chalk.gray('Press Ctrl+C to exit'));
  console.log('');
}
