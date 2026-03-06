/**
 * TUI Commands - Simple text-based dashboard
 */

import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { getMemory } from '../utils/memory.js';

/**
 * Launch the text-based dashboard
 */
export async function launchDashboard(): Promise<void> {
  const config = getConfig();
  const memory = getMemory();
  
  await memory.init();
  const stats = await memory.getStats();
  
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
  
  // Clear screen
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
  
  const providerLines: string[] = [];
  for (let i = 0; i < providers.length; i += 2) {
    const p1 = providers[i];
    const p2 = providers[i + 1];
    const p1Status = p1.configured ? chalk.green('●') : chalk.gray('○');
    const p2Status = p2 ? (p2.configured ? chalk.green('●') : chalk.gray('○')) : '';
    const p1Name = p1.configured ? chalk.white(p1.name) : chalk.gray(p1.name);
    const p2Name = p2 ? (p2.configured ? chalk.white(p2.name) : chalk.gray(p2.name)) : '';
    const padding = ' '.repeat(50 - (p1.name.length + p2?.name.length || 0));
    providerLines.push(`${p1Status} ${p1Name}${padding}${p2Status} ${p2Name}`);
  }
  
  providerLines.forEach(line => {
    console.log(chalk.cyan('│') + ` ${line} ` + chalk.cyan('│'));
  });
  
  console.log(chalk.cyan.bold('└─────────────────────────────────────────────────────────┘'));
  console.log('');
  
  // Statistics
  console.log(chalk.magenta.bold('┌─────────────────────────────────────────────────────────┐'));
  console.log(chalk.magenta.bold('│') + chalk.magenta.bold(' Statistics ') + ' '.repeat(49) + chalk.magenta.bold('│'));
  console.log(chalk.magenta.bold('├─────────────────────────────────────────────────────────┤'));
  console.log(chalk.cyan('│') + chalk.gray(` Sessions:      ${chalk.white(stats.totalSessions.toString())}`) + ' '.repeat(33) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + chalk.gray(` Total Messages: ${chalk.white(stats.totalMessages.toString())}`) + ' '.repeat(32) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + chalk.gray(` Current Session: ${chalk.white(stats.currentSessionMessages.toString())}`) + ' '.repeat(31) + chalk.cyan('│'));
  console.log(chalk.magenta.bold('└─────────────────────────────────────────────────────────┘'));
  console.log('');
  
  // Quick Commands
  console.log(chalk.green.bold('Quick Commands:'));
  console.log(chalk.white('  echo chat "message"     - Start a conversation'));
  console.log(chalk.white('  echo chat --agent       - Agent mode with tools'));
  console.log(chalk.white('  echo plugin sync-all    - Sync plugins'));
  console.log(chalk.white('  echo auth sync          - Auto-detect credentials'));
  console.log(chalk.white('  echo dashboard          - Show this dashboard'));
  console.log('');
  console.log(chalk.gray('Press Ctrl+C to exit'));
  console.log('');
}
