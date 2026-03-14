/**
 * Auth Command - Interactive API key setup
 */

import chalk from 'chalk';
import ora from 'ora';
import Enquirer from 'enquirer';
import { getConfig } from '../utils/config.js';
import { ProviderName } from '../types/index.js';
import { AutoAuthSync } from '../auth/sync.js';

interface AuthAnswers {
  provider: ProviderName;
  apiKey: string;
}

/**
 * Auto-sync credentials from existing CLI tools
 */
export async function authAutoSync(): Promise<void> {
  console.log(chalk.bold('\n🔄 Auto-Syncing Credentials from CLI Tools...\n'));
  
  const creds = await AutoAuthSync.syncAllCredentials();
  const config = getConfig();
  let synced = 0;

  console.log(chalk.bold('Detected Credentials:\n'));

  // Google Cloud -> Gemini
  if (creds.google) {
    config.setApiKey('gemini', creds.google);
    console.log(chalk.green('✓') + ' Google Cloud (Gemini) - Synced from gcloud');
    synced++;
  } else {
    console.log(chalk.dim('○') + ' Google Cloud (gcloud) - Not logged in');
    console.log(chalk.dim('   Run: gcloud auth application-default login'));
  }

  // Aliyun -> Qwen
  if (creds.qwen) {
    config.setApiKey('qwen', creds.qwen.accessKeyId);
    config.setProviderConfig('qwen', {
      apiKey: creds.qwen.accessKeyId,
      baseUrl: creds.qwen.accessKeySecret,
      model: 'qwen-turbo',
    });
    console.log(chalk.green('✓') + ' Qwen (Aliyun) - Synced from ~/.aliyun/config.json');
    synced++;
  } else {
    console.log(chalk.dim('○') + ' Qwen (Aliyun) - Not found');
    console.log(chalk.dim('   Install: npm install -g aliyun-cli'));
    console.log(chalk.dim('   Login:   aliyun configure'));
  }

  // Ollama
  if (creds.ollama) {
    config.setProviderConfig('ollama', {
      apiKey: '',
      baseUrl: creds.ollama,
    });
    console.log(chalk.green('✓') + ' Ollama (Local) - Detected at ' + creds.ollama);
    synced++;
  }

  // Environment variables
  if (creds.openai) {
    config.setApiKey('openai', creds.openai);
    console.log(chalk.green('✓') + ' OpenAI - Synced from OPENAI_API_KEY env');
    synced++;
  }

  if (creds.anthropic) {
    config.setApiKey('anthropic', creds.anthropic);
    console.log(chalk.green('✓') + ' Anthropic - Synced from ANTHROPIC_API_KEY env');
    synced++;
  }

  if (creds.gemini) {
    config.setApiKey('gemini', creds.gemini);
    console.log(chalk.green('✓') + ' Gemini - Synced from GEMINI_API_KEY env');
    synced++;
  }

  if (synced === 0) {
    console.log(chalk.yellow('\n⚠ No credentials found to sync.\n'));
    console.log(chalk.dim('Run ') + chalk.cyan('echo auth login') + chalk.dim(' to configure manually.\n'));
  } else {
    console.log(chalk.green(`\n✅ Successfully synced ${synced} provider(s)\n`));
    console.log(chalk.dim('Run ') + chalk.cyan('echo "Hello!"') + chalk.dim(' to start chatting\n'));
  }
}

/**
 * Show available credentials from auto-sync
 */
export async function authAutoDetect(): Promise<void> {
  await AutoAuthSync.printAvailableCredentials();
}

/**
 * Interactive auth flow
 */
export async function authLogin(): Promise<void> {
  const config = getConfig();
  
  const enquirer = new Enquirer();

  // Step 1: Select provider
  const providerPrompt = await enquirer.prompt({
    type: 'select',
    name: 'provider',
    message: chalk.blue('Which AI provider would you like to configure?'),
    choices: [
      { name: 'gemini', message: 'Google Gemini (Recommended - Free tier available)' },
      { name: 'openai', message: 'OpenAI (GPT-4, GPT-4o)' },
      { name: 'anthropic', message: 'Anthropic (Claude 3.5 Sonnet)' },
      { name: 'qwen', message: 'Alibaba Qwen (Aliyun - Free tier available)' },
      { name: 'groq', message: 'Groq (Ultra-fast inference)' },
      { name: 'ollama', message: 'Ollama (Local models - Free)' },
    ],
  }) as { provider: ProviderName };

  const provider = providerPrompt.provider;

  // Step 2: Get API key
  const apiKeyPrompt = await enquirer.prompt({
    type: 'password',
    name: 'apiKey',
    message: chalk.blue(`Enter your ${provider.toUpperCase()} API key:`),
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'API key cannot be empty';
      }
      if (value.length < 10) {
        return 'API key seems too short';
      }
      return true;
    },
  }) as { apiKey: string };

  const spinner = ora('Saving API key...').start();

  try {
    // Save the API key
    config.setApiKey(provider, apiKeyPrompt.apiKey.trim());

    // Set as default if it's the first provider
    const configuredProviders = config.getConfiguredProviders();
    if (configuredProviders.length === 1) {
      config.setDefaultProvider(provider);
    }

    spinner.succeed(chalk.green(`✓ ${provider.toUpperCase()} API key saved successfully!`));

    console.log('\n' + chalk.dim('Your API key is stored securely in:'));
    console.log(chalk.dim(config.configPath) + '\n');

    // Ask if they want to set as default
    if (configuredProviders.length > 1) {
      const setDefaultPrompt = await enquirer.prompt({
        type: 'confirm',
        name: 'setDefault',
        message: chalk.blue('Set this as your default provider?'),
        initial: true,
      }) as { setDefault: boolean };

      if (setDefaultPrompt.setDefault) {
        config.setDefaultProvider(provider);
        console.log(chalk.green(`✓ ${provider.toUpperCase()} is now your default provider\n`));
      }
    }

    // Show configured providers
    const allConfigured = config.getConfiguredProviders();
    console.log(chalk.dim('Configured providers: ') + chalk.green(allConfigured.join(', ')));

  } catch (error) {
    spinner.fail(chalk.red('Failed to save API key'));
    throw error;
  }
}

/**
 * Box.com authentication flow
 */
export async function authBox(): Promise<void> {
  const config = getConfig();
  const enquirer = new Enquirer();

  console.log(chalk.bold('\n📦 Box.com Cloud Memory Setup\n'));
  console.log(chalk.dim('To get started, create a developer token at:'));
  console.log(chalk.cyan('https://developer.box.com/console\n'));

  const answers = await enquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: 'Enter your Box Developer Token:',
      validate: (v: string) => v.length > 5 || 'Invalid token',
    },
    {
      type: 'input',
      name: 'folderId',
      message: 'Enter Box Folder ID (optional, leave empty for root):',
      initial: '0',
    }
  ]) as { token: string; folderId: string };

  const spinner = ora('Verifying Box connection...').start();

  try {
    // Temporarily set and test Box config
    config.setBoxConfig({
      developerToken: answers.token,
      folderId: answers.folderId,
      enabled: true,
    });

    const { getBoxStore } = await import('../storage/external/box.js');
    const box = getBoxStore();
    const success = await box.init();

    if (success) {
      spinner.succeed(chalk.green('✓ Box.com Cloud Memory linked successfully!'));
      console.log(chalk.dim('\nEcho will now sync your brain to Box in the background.\n'));
    } else {
      throw new Error('Connection test failed');
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`✗ Box link failed: ${error.message}`));
    // Revert config on failure
    config.setBoxConfig({ enabled: false });
  }
}

/**
 * Show current auth status
 */
export async function authStatus(): Promise<void> {
  const config = getConfig();
  const configuredProviders = config.getConfiguredProviders();
  const defaultProvider = config.getDefaultProvider();

  console.log(chalk.bold('\n🔐 Echo CLI Authentication Status\n'));

  if (configuredProviders.length === 0) {
    console.log(chalk.yellow('⚠ No providers configured. Run ') + chalk.cyan('echo auth login') + chalk.yellow(' to get started.\n'));
    return;
  }

  console.log(chalk.dim('Configured Providers:'));

  for (const provider of ['gemini', 'openai', 'anthropic', 'qwen', 'groq', 'ollama'] as ProviderName[]) {
    const isConfigured = config.isProviderConfigured(provider);
    const isDefault = provider === defaultProvider;

    const status = isConfigured
      ? chalk.green('✓')
      : chalk.dim('○');

    const defaultMark = isDefault && isConfigured
      ? chalk.cyan(' (default)')
      : '';

    const keyPreview = isConfigured
      ? chalk.dim(`Key: ${config.getApiKey(provider)?.substring(0, 8)}...`)
      : chalk.dim('Not configured');

    console.log(`  ${status} ${chalk.bold(provider)}${defaultMark}`);
    console.log(`    ${keyPreview}`);
  }

  console.log('\n' + chalk.dim(`Config file: ${config.configPath}`) + '\n');
}

/**
 * Remove API key for a provider
 */
export async function authLogout(provider?: ProviderName): Promise<void> {
  const config = getConfig();
  const enquirer = new Enquirer();

  const configuredProviders = config.getConfiguredProviders();

  if (configuredProviders.length === 0) {
    console.log(chalk.yellow('⚠ No providers configured.\n'));
    return;
  }

  let selectedProvider: ProviderName = provider || configuredProviders[0];

  if (!provider && configuredProviders.length > 1) {
    const providerPrompt = await enquirer.prompt({
      type: 'select',
      name: 'provider',
      message: chalk.blue('Which provider would you like to remove?'),
      choices: configuredProviders.map((p: ProviderName) => ({ name: p, message: p.toUpperCase() })),
    }) as { provider: ProviderName };
    selectedProvider = providerPrompt.provider;
  }

  if (!config.isProviderConfigured(selectedProvider)) {
    console.log(chalk.yellow(`⚠ ${selectedProvider.toUpperCase()} is not configured.\n`));
    return;
  }

  const confirmPrompt = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: chalk.red(`Remove ${selectedProvider.toUpperCase()} API key?`),
    initial: false,
  }) as { confirm: boolean };

  if (!confirmPrompt.confirm) {
    console.log(chalk.dim('Cancelled.\n'));
    return;
  }

  config.removeApiKey(selectedProvider);
  console.log(chalk.green(`✓ ${selectedProvider.toUpperCase()} API key removed.\n`));

  // If we removed the default provider, set a new default
  const defaultProvider = config.getDefaultProvider();
  if (!config.isProviderConfigured(defaultProvider)) {
    const remaining = config.getConfiguredProviders();
    if (remaining.length > 0) {
      config.setDefaultProvider(remaining[0]);
      console.log(chalk.dim(`Default provider changed to ${remaining[0].toUpperCase()}\n`));
    }
  }
}

/**
 * Auth command group
 */
export const authCommand = {
  login: authLogin,
  status: authStatus,
  logout: authLogout,
  box: authBox,
};
