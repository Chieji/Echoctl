import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getProviderRegistry } from '../../auth/registry.js';
import { BaseProvider, ProviderConfig } from '../../auth/providers/base.js';

/**
 * Interactive login flow for configuring a provider
 */
export async function interactiveLogin(providerId?: string): Promise<boolean> {
  const registry = getProviderRegistry();

  // If no provider specified, show available providers
  if (!providerId) {
    const available = registry.getAvailableProviderTypes();
    
    if (available.length === 0) {
      console.log(chalk.yellow('All providers are already configured. Use "auth list" to see them.'));
      return false;
    }

    const { selectedProvider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedProvider',
        message: 'Select a provider to configure:',
        choices: available.map((p) => ({
          name: `${p.name} - ${p.description}`,
          value: p.id,
        })),
      },
    ]);

    providerId = selectedProvider;
  }

  const provider = registry.createProvider(providerId!);
  if (!provider) {
    console.log(chalk.red(`Unknown provider: ${providerId}`));
    return false;
  }

  console.log(chalk.cyan(`\nConfiguring ${provider.name}...`));
  console.log(chalk.gray(provider.info.description));
  console.log();

  const config: ProviderConfig = { name: providerId! };

  // Check if provider requires baseUrl
  if (provider.info.requiresBaseUrl || provider.info.defaultBaseUrl) {
    const defaultUrl = provider.info.defaultBaseUrl || '';
    const { baseUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Base URL:',
        default: defaultUrl,
        when: () => provider.info.requiresBaseUrl && !defaultUrl,
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Base URL (press Enter for default):',
        default: defaultUrl,
        when: () => provider.info.requiresBaseUrl && !!defaultUrl,
      },
    ]);

    if (baseUrl) {
      config.baseUrl = baseUrl;
    }
  }

  // Get API key or OAuth token based on auth type
  if (provider.info.authType === 'api-key' || provider.info.authType === 'both') {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'API Key:',
        mask: '*',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'API key is required';
          }
          return true;
        },
      },
    ]);

    config.apiKey = apiKey.trim();
  }

  // Validate credentials
  const spinner = ora('Validating credentials...').start();
  try {
    const result = await provider.validateCredentials();
    
    if (result.valid) {
      spinner.succeed(chalk.green('Credentials validated successfully!'));
      
      // Save configuration
      registry.saveProvider(providerId!, config);
      
      // Ask if this should be the default provider
      const configuredProviders = registry.getConfiguredProviders();
      if (configuredProviders.length > 1) {
        const { setDefault } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'setDefault',
            message: 'Set as default provider?',
            default: false,
          },
        ]);

        if (setDefault) {
          registry.setDefaultProvider(providerId!);
          console.log(chalk.green(`✓ ${provider.name} is now the default provider`));
        }
      } else {
        registry.setDefaultProvider(providerId!);
      }

      // Optionally set default model
      const models = await provider.getModels();
      if (models.length > 0) {
        const { useDefaultModel } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useDefaultModel',
            message: `Use ${models[0]} as default model?`,
            default: true,
          },
        ]);

        if (useDefaultModel) {
          config.defaultModel = models[0];
          registry.saveProvider(providerId!, config);
          console.log(chalk.green(`✓ Default model set to ${models[0]}`));
        }
      }

      console.log(chalk.green(`\n✓ ${provider.name} configured successfully!`));
      return true;
    } else {
      spinner.fail(chalk.red(`Validation failed: ${result.error}`));
      console.log(chalk.yellow('Please check your credentials and try again.'));
      return false;
    }
  } catch (error) {
    spinner.fail(chalk.red('Validation error'));
    console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    return false;
  }
}

/**
 * List all configured providers
 */
export async function listProviders(): Promise<void> {
  const registry = getProviderRegistry();
  const providers = registry.getConfiguredProviders();
  const defaultProvider = registry.getDefaultProviderId();

  if (providers.length === 0) {
    console.log(chalk.yellow('No providers configured. Run "echoctl auth login" to add one.'));
    return;
  }

  console.log(chalk.cyan('\nConfigured Providers:\n'));
  console.log(chalk.gray('─'.repeat(60)));

  for (const provider of providers) {
    const isDefault = provider.id === defaultProvider;
    const status = provider.isConfigured() 
      ? chalk.green('✓ Configured') 
      : chalk.red('✗ Incomplete');
    
    const defaultMarker = isDefault ? chalk.yellow(' [DEFAULT]') : '';
    
    console.log(chalk.white.bold(`\n${provider.name}${defaultMarker}`));
    console.log(chalk.gray(`  ID: ${provider.id}`));
    console.log(chalk.gray(`  Status: ${status}`));
    
    if (provider.getBaseUrl()) {
      console.log(chalk.gray(`  Base URL: ${provider.getBaseUrl()}`));
    }
    
    const config = registry.getProviderConfig(provider.id);
    if (config?.defaultModel) {
      console.log(chalk.gray(`  Default Model: ${config.defaultModel}`));
    }

    console.log(chalk.gray('─'.repeat(60)));
  }

  console.log();
}

/**
 * Remove a provider
 */
export async function removeProvider(providerId: string): Promise<boolean> {
  const registry = getProviderRegistry();
  
  if (!registry.hasProvider(providerId)) {
    console.log(chalk.red(`Provider "${providerId}" is not configured.`));
    return false;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove ${providerId}?`,
      default: false,
    },
  ]);

  if (confirm) {
    registry.removeProvider(providerId);
    console.log(chalk.green(`✓ Provider "${providerId}" removed.`));
    return true;
  }

  console.log('Operation cancelled.');
  return false;
}
