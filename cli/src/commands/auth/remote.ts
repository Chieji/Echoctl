import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getProviderRegistry } from '../../auth/registry.js';
import { ProviderConfig } from '../../auth/providers/base.js';

/**
 * Remote authentication configuration fetched from .well-known endpoint
 */
interface RemoteAuthConfig {
  auth?: {
    command?: string;
    token?: string;
    provider?: string;
    baseUrl?: string;
  };
  providers?: Record<string, ProviderConfig>;
}

/**
 * Fetch remote auth configuration from .well-known endpoint
 * SECURITY: Requires explicit user confirmation before executing any command
 */
export async function remoteAuthLogin(url: string): Promise<boolean> {
  // Normalize URL and append .well-known/opencode
  let baseUrl = url;
  if (!baseUrl.endsWith('/')) {
    baseUrl += '/';
  }
  
  const wellKnownUrl = new URL('.well-known/opencode', baseUrl).href;
  
  console.log(chalk.cyan(`Fetching authentication configuration from ${wellKnownUrl}...`));
  
  let remoteConfig: RemoteAuthConfig;
  try {
    const response = await fetch(wellKnownUrl);
    if (!response.ok) {
      console.log(chalk.red(`Failed to fetch remote config: HTTP ${response.status}`));
      return false;
    }
    remoteConfig = await response.json() as RemoteAuthConfig;
  } catch (error) {
    console.log(chalk.red(`Failed to fetch remote config: ${error instanceof Error ? error.message : 'Unknown error'}`));
    return false;
  }

  // Check for auth.command - THIS REQUIRES EXPLICIT USER CONFIRMATION
  if (remoteConfig.auth?.command) {
    console.log(chalk.yellow('\n⚠️  SECURITY WARNING: Remote Code Execution Risk'));
    console.log(chalk.yellow('─'.repeat(50)));
    console.log(chalk.white('The remote configuration contains a command to execute:'));
    console.log(chalk.red(`\n  ${remoteConfig.auth.command}\n`));
    console.log(chalk.gray('This command could potentially access your system or credentials.'));
    console.log(chalk.gray('Only proceed if you trust the source of this configuration.\n'));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red('Do you want to execute this remote command?'),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Remote command execution cancelled.'));
      
      // Offer to use just the token if available
      if (remoteConfig.auth?.token) {
        console.log(chalk.cyan('However, a token is also provided. Would you like to configure that instead?'));
        const { useToken } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useToken',
            message: 'Configure using the provided token?',
            default: true,
          },
        ]);

        if (useToken) {
          return configureFromToken(
            remoteConfig.auth.token,
            remoteConfig.auth.provider || 'custom',
            remoteConfig.auth.baseUrl
          );
        }
      }
      
      return false;
    }

    // SECURITY NOTE: We do NOT automatically execute the remote command.
    // Instead, we display it for the user to run manually if they choose.
    console.log(chalk.cyan('\nTo complete authentication, please run the following command:'));
    console.log(chalk.white.bold(`\n  ${remoteConfig.auth.command}\n`));
    console.log(chalk.gray('After running the command, re-run "echoctl auth list" to verify configuration.\n'));
    return true;
  }

  // Check for direct token configuration
  if (remoteConfig.auth?.token) {
    return configureFromToken(
      remoteConfig.auth.token,
      remoteConfig.auth.provider || 'custom',
      remoteConfig.auth.baseUrl
    );
  }

  // Check for provider configurations
  if (remoteConfig.providers && Object.keys(remoteConfig.providers).length > 0) {
    const registry = getProviderRegistry();
    
    console.log(chalk.cyan('\nRemote configuration includes the following providers:\n'));
    
    for (const [providerId, config] of Object.entries(remoteConfig.providers)) {
      console.log(chalk.white(`  • ${providerId}`));
    }
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to save these provider configurations?',
        default: true,
      },
    ]);

    if (confirm) {
      for (const [providerId, config] of Object.entries(remoteConfig.providers)) {
        registry.saveProvider(providerId, config);
        console.log(chalk.green(`✓ Configured provider: ${providerId}`));
      }
      console.log(chalk.green('\nProviders configured successfully!'));
      return true;
    }
    
    return false;
  }

  console.log(chalk.yellow('No usable authentication configuration found in remote file.'));
  return false;
}

/**
 * Configure a provider from a token
 */
async function configureFromToken(
  token: string,
  providerId: string,
  baseUrl?: string
): Promise<boolean> {
  const registry = getProviderRegistry();
  
  const config: ProviderConfig = {
    name: providerId,
    oauthToken: token,
  };
  
  if (baseUrl) {
    config.baseUrl = baseUrl;
  }

  const spinner = ora('Validating token...').start();
  
  const provider = registry.createProvider(providerId);
  if (provider) {
    const result = await provider.validateCredentials();
    
    if (result.valid) {
      spinner.succeed(chalk.green('Token validated successfully!'));
      registry.saveProvider(providerId, config);
      registry.setDefaultProvider(providerId);
      console.log(chalk.green(`✓ ${provider.name} configured and set as default.`));
      return true;
    } else {
      spinner.fail(chalk.red(`Token validation failed: ${result.error}`));
      return false;
    }
  } else {
    // For unknown providers, save anyway with custom provider fallback
    spinner.succeed(chalk.green('Token saved (validation skipped for unknown provider)'));
    registry.saveProvider(providerId, config);
    console.log(chalk.yellow('Note: Token saved but provider type is unknown. You may need to configure a custom endpoint.'));
    return true;
  }
}
