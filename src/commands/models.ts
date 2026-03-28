/**
 * Model Commands - List and switch between AI models
 */

import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { ProviderName } from '../types/index.js';

/**
 * List available models/providers
 */
export async function modelList(options: {
  available?: boolean;
  configured?: boolean;
}): Promise<void> {
  const config = getConfig();
  
  console.log(chalk.bold('\n🤖 Available AI Models/Providers\n'));
  
  const providers: Array<{
    name: string;
    displayName: string;
    icon: string;
    color: string;
    configured: boolean;
    models: string[];
  }> = [
    { 
      name: 'gemini', 
      displayName: 'Google Gemini', 
      icon: '🔵',
      color: 'blue',
      configured: config.isProviderConfigured('gemini'),
      models: ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro']
    },
    { 
      name: 'openai', 
      displayName: 'OpenAI GPT', 
      icon: '🟢',
      color: 'green',
      configured: config.isProviderConfigured('openai'),
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    { 
      name: 'anthropic', 
      displayName: 'Anthropic Claude', 
      icon: '🟠',
      color: 'orange',
      configured: config.isProviderConfigured('anthropic'),
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    },
    { 
      name: 'qwen', 
      displayName: 'Alibaba Qwen', 
      icon: '🟣',
      color: 'purple',
      configured: config.isProviderConfigured('qwen'),
      models: ['qwen2.5-72b-instruct', 'qwen2-72b-instruct']
    },
    { 
      name: 'deepseek', 
      displayName: 'DeepSeek', 
      icon: '🔷',
      color: 'blue',
      configured: config.isProviderConfigured('deepseek'),
      models: ['deepseek-chat', 'deepseek-coder']
    },
    { 
      name: 'kimi', 
      displayName: 'Moonshot Kimi', 
      icon: '🌙',
      color: 'white',
      configured: config.isProviderConfigured('kimi'),
      models: ['kimi-latest', 'kimi-chat']
    },
    { 
      name: 'groq', 
      displayName: 'Groq', 
      icon: '⚡',
      color: 'cyan',
      configured: config.isProviderConfigured('groq'),
      models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
    },
    { 
      name: 'ollama', 
      displayName: 'Ollama (Local)', 
      icon: '🦙',
      color: 'gray',
      configured: config.isProviderConfigured('ollama'),
      models: ['llama3.2', 'mistral', 'codellama']
    },
    { 
      name: 'openrouter', 
      displayName: 'OpenRouter', 
      icon: '🌐',
      color: 'blue',
      configured: config.isProviderConfigured('openrouter'),
      models: ['openai/gpt-4o', 'anthropic/claude-3-sonnet', 'google/gemini-pro']
    },
    { 
      name: 'together', 
      displayName: 'Together AI', 
      icon: '🚀',
      color: 'red',
      configured: config.isProviderConfigured('together'),
      models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1']
    },
    { 
      name: 'modelscope', 
      displayName: 'ModelScope', 
      icon: '🔴',
      color: 'red',
      configured: config.isProviderConfigured('modelscope'),
      models: ['qwen-max', 'qwen-plus']
    },
    { 
      name: 'mistral', 
      displayName: 'Mistral AI', 
      icon: '🌪️',
      color: 'blue',
      configured: config.isProviderConfigured('mistral'),
      models: ['mistral-large-latest', 'mistral-medium']
    },
    { 
      name: 'huggingface', 
      displayName: 'Hugging Face', 
      icon: '🤗',
      color: 'yellow',
      configured: config.isProviderConfigured('huggingface'),
      models: ['meta-llama/Llama-3.2-3B-Instruct']
    },
    { 
      name: 'github', 
      displayName: 'GitHub Models', 
      icon: '🐙',
      color: 'gray',
      configured: config.isProviderConfigured('github'),
      models: ['gpt-4o', 'claude-3-5-sonnet', 'llama-3.1-405b-instruct']
    },
  ];
  
  // Filter if needed
  let filtered = providers;
  if (options.configured) {
    filtered = providers.filter(p => p.configured);
  }
  
  for (const provider of filtered) {
    const status = provider.configured 
      ? chalk.green('✓') 
      : chalk.dim('○');
    
    console.log(`${status} ${provider.icon} ${chalk.bold(provider.displayName)}`);
    console.log(chalk.dim(`   ID: ${provider.name}`));
    
    if (provider.models.length > 0) {
      console.log(chalk.dim(`   Models: ${provider.models.slice(0, 3).join(', ')}${provider.models.length > 3 ? '...' : ''}`));
    }
    
    if (!provider.configured) {
      console.log(chalk.dim(`   Setup: echo auth ${provider.name} <api-key>`));
    }
    
    console.log('');
  }
  
  console.log(chalk.dim('\n💡 Tip: Use "echo models set <provider>" to switch provider\n'));
}

/**
 * Set default model/provider (CLI command version)
 */
export async function modelSet(provider: string, options: {
  model?: string;
}): Promise<void> {
  const config = getConfig();
  
  // Validate provider
  const validProviders = ['gemini', 'openai', 'anthropic', 'qwen', 'deepseek', 'kimi', 'groq', 'ollama', 'openrouter', 'together', 'modelscope', 'mistral', 'huggingface', 'github'];
  
  if (!validProviders.includes(provider)) {
    console.log(chalk.red(`\n✗ Invalid provider: ${provider}\n`));
    console.log(chalk.dim(`Valid providers: ${validProviders.join(', ')}\n`));
    return;
  }
  
  // Check if configured
  if (!config.isProviderConfigured(provider as any)) {
    console.log(chalk.yellow(`\n⚠ Provider ${provider} is not configured\n`));
    console.log(chalk.dim(`Run: echo auth ${provider} <api-key>\n`));
    return;
  }
  
  // Get model list or use provided
  const models = getModelList(provider);
  const selectedModel = options.model || models[0];
  
  await setDefaultProvider(provider, selectedModel);
  
  console.log(chalk.green(`\n✓ Default provider set to: ${provider}\n`));
  
  if (options.model) {
    console.log(chalk.dim(`Default model: ${options.model}\n`));
  }
}

/**
 * Interactive Model Picker
 * Shows a menu to select model during CLI session
 */
export async function showModelPicker(): Promise<string | null> {
  const config = getConfig();
  const Enquirer = (await import('enquirer')).default;
  
  // Get configured providers only
  const providers = [
    { name: 'gemini', message: '🔵 Google Gemini' },
    { name: 'openai', message: '🟢 OpenAI GPT' },
    { name: 'anthropic', message: '🟠 Anthropic Claude' },
    { name: 'qwen', message: '🟣 Alibaba Qwen' },
    { name: 'deepseek', message: '🔷 DeepSeek' },
    { name: 'kimi', message: '🌙 Moonshot Kimi' },
    { name: 'groq', message: '⚡ Groq (Fast)' },
    { name: 'ollama', message: '🦙 Ollama (Local)' },
    { name: 'openrouter', message: '🌐 OpenRouter (100+ models)' },
    { name: 'together', message: '🚀 Together AI' },
    { name: 'modelscope', message: '🔴 ModelScope' },
    { name: 'mistral', message: '🌪️ Mistral AI' },
    { name: 'huggingface', message: '🤗 Hugging Face' },
    { name: 'github', message: '🐙 GitHub Models' },
  ].filter(p => config.isProviderConfigured(p.name as any));
  
  if (providers.length === 0) {
    console.log(chalk.yellow('\n⚠ No providers configured\n'));
    console.log(chalk.dim('Run: echo auth <provider> <api-key>\n'));
    return null;
  }
  
  const enquirer = new Enquirer();
  
  const result: any = await enquirer.prompt({
    type: 'select',
    name: 'provider',
    message: 'Select AI Provider',
    choices: providers.map(p => ({
      name: p.name,
      message: p.message,
    })),
  });
  
  // Get models for selected provider
  const models = getModelList(result.provider);
  
  if (models.length > 1) {
    const modelResult: any = await enquirer.prompt({
      type: 'select',
      name: 'model',
      message: `Select ${result.provider} model`,
      choices: models.map(m => ({ name: m, message: m })),
    });
    
    // Update config
    await setDefaultProvider(result.provider, modelResult.model);
    
    console.log(chalk.green(`\n✓ Switched to: ${result.provider}/${modelResult.model}\n`));
    return modelResult.model;
  } else {
    // Only one model, use it
    await setDefaultProvider(result.provider, models[0]);
    console.log(chalk.green(`\n✓ Switched to: ${result.provider}\n`));
    return models[0];
  }
}

/**
 * Get model list for provider
 */
function getModelList(provider: string): string[] {
  const models: Record<string, string[]> = {
    gemini: ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    qwen: ['qwen2.5-72b-instruct', 'qwen2-72b-instruct'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    kimi: ['kimi-latest', 'kimi-chat'],
    groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    ollama: ['llama3.2', 'mistral', 'codellama'],
    openrouter: ['openai/gpt-4o', 'anthropic/claude-3-sonnet', 'google/gemini-pro'],
    together: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    modelscope: ['qwen-max', 'qwen-plus'],
    mistral: ['mistral-large-latest', 'mistral-medium'],
    huggingface: ['meta-llama/Llama-3.2-3B-Instruct'],
    github: ['gpt-4o', 'claude-3-5-sonnet', 'llama-3.1-405b-instruct'],
  };
  
  return models[provider] || [];
}

/**
 * Set default provider
 */
async function setDefaultProvider(provider: string, model: string): Promise<void> {
  const { join } = await import('path');
  const { homedir } = await import('os');
  const { readFile, writeFile } = await import('fs/promises');
  
  const configPath = join(homedir(), '.config', 'echo-cli', 'config.json');
  
  let currentConfig: any = {};
  try {
    currentConfig = JSON.parse(await readFile(configPath, 'utf-8'));
  } catch {
    // File doesn't exist, create new
  }
  
  currentConfig.defaultProvider = provider;
  currentConfig.defaultModel = model;
  
  await writeFile(configPath, JSON.stringify(currentConfig, null, 2));
}

/**
 * Show current model/provider
 */
export async function modelInfo(): Promise<void> {
  const config = getConfig();
  
  console.log(chalk.bold('\n📊 Current AI Model Configuration\n'));
  
  // Show all configured providers
  const configuredProviders = ['gemini', 'openai', 'anthropic', 'qwen', 'deepseek', 'kimi', 'groq', 'ollama', 'openrouter', 'together', 'modelscope', 'mistral', 'huggingface', 'github']
    .filter(p => config.isProviderConfigured(p as any));
  
  console.log(chalk.green(`✓ Configured: ${configuredProviders.length} provider(s)\n`));
  
  for (const provider of configuredProviders) {
    console.log(chalk.dim(`  • ${provider}`));
  }
  
  console.log(chalk.dim('\n💡 Use "echo models set <provider>" to switch\n'));
}

/**
 * Setup model CLI commands
 */
import { Command } from 'commander';

export function setupModelCommand(program: Command) {
  const models = program
    .command('models')
    .alias('model')
    .alias('m')
    .description('List and switch between AI models/providers');

  models
    .command('list')
    .description('List available AI models/providers')
    .option('-c, --configured', 'Show only configured providers')
    .action(async (options) => {
      await modelList(options);
    });

  models
    .command('set <provider>')
    .description('Set default model/provider')
    .option('-m, --model <model>', 'Specific model name')
    .action(async (provider, options) => {
      await modelSet(provider, options);
    });

  models
    .command('info')
    .description('Show current model/provider configuration')
    .action(async () => {
      await modelInfo();
    });
}
