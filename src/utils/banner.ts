/**
 * Echo CLI Banner - Professional Startup Display
 * Shows ASCII art logo with gradient colors and provider status
 */

import figlet from 'figlet';
import gradient from 'gradient-string';
import { getConfig } from './config.js';
import { AutoAuthSync } from '../auth/sync.js';

/**
 * Display the Echo ASCII banner with gradient
 */
export async function displayBanner(): Promise<void> {
  // Generate ASCII art
  const bannerText = figlet.textSync('E C H O', {
    font: 'Slant',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  // Gemini-style gradient (blue to purple to pink)
  const echoGradient = gradient(['#4285F4', '#9b72cb', '#d96570']);
  
  // Display banner
  console.log(echoGradient(bannerText));
  console.log(echoGradient.multiline('   ⚡ The Resilient Agentic Terminal\n'));
}

/**
 * Display provider sync status bar
 */
export async function displayProviderStatus(): Promise<void> {
  const config = getConfig();
  const creds = await AutoAuthSync.syncAllCredentials();
  
  const providers = [
    { name: 'Gemini', key: 'gemini', env: 'google' },
    { name: 'Qwen', key: 'qwen', env: 'qwen' },
    { name: 'OpenAI', key: 'openai', env: 'openai' },
    { name: 'Claude', key: 'anthropic', env: 'anthropic' },
    { name: 'Groq', key: 'groq', env: null },
    { name: 'Ollama', key: 'ollama', env: 'ollama' },
  ];

  const status: string[] = [];
  
  for (const provider of providers) {
    const isConfigured = config.isProviderConfigured(provider.key as any) || 
                         (provider.env && (creds as any)[provider.env]);
    
    const icon = isConfigured ? '●' : '○';
    const color = isConfigured ? 'green' : 'dim';
    
    status.push(`${icon} ${provider.name}`);
  }

  // Display status bar
  const statusBar = gradient(['#4285F4', '#9b72cb'])(
    `   ${status.join(' | ')}`
  );
  
  console.log(statusBar);
  console.log('');
}

/**
 * Display quick help tip
 */
export function displayQuickTip(): void {
  const tips = [
    'Use --agent mode for autonomous task completion',
    'Add ECHO.md to your project for custom context',
    'Run echo auth sync to auto-detect credentials',
    'Use --yolo for autonomous execution (be careful!)',
    'Try --provider groq for ultra-fast responses',
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  console.log(gradient(['#666', '#999'])(`   💡 Tip: ${randomTip}`));
  console.log('');
}

/**
 * Full startup sequence
 */
export async function displayStartupSequence(): Promise<void> {
  await displayBanner();
  await displayProviderStatus();
  displayQuickTip();
  console.log('─'.repeat(60));
  console.log('');
}
