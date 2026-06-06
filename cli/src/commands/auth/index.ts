import { Command } from 'commander';
import chalk from 'chalk';
import { interactiveLogin, listProviders, removeProvider } from './login.js';
import { remoteAuthLogin } from './remote.js';

/**
 * Create the auth command and its subcommands
 */
export function createAuthCommand(): Command {
  const auth = new Command('auth');
  auth.description('Manage authentication providers');

  // auth login [provider]
  auth
    .command('login')
    .argument('[provider]', 'Provider ID (e.g., anthropic, openai)')
    .argument('[url]', 'URL for enterprise remote auth (.well-known)')
    .description('Configure a new authentication provider')
    .action(async (provider?: string, url?: string) => {
      if (url) {
        // Remote enterprise auth
        console.log(chalk.cyan('Enterprise Remote Authentication\n'));
        await remoteAuthLogin(url);
      } else {
        // Interactive local auth
        await interactiveLogin(provider);
      }
    });

  // auth list
  auth
    .command('list')
    .description('List all configured providers')
    .action(async () => {
      await listProviders();
    });

  // auth remove <provider>
  auth
    .command('remove')
    .argument('<provider>', 'Provider ID to remove')
    .description('Remove a configured provider')
    .action(async (provider: string) => {
      await removeProvider(provider);
    });

  return auth;
}
