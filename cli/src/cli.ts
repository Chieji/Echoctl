#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createAuthCommand } from './commands/auth/index.js';
import { getProviderRegistry } from './auth/registry.js';

/**
 * Main CLI entry point for echoctl
 */
async function main() {
  const program = new Command();

  program
    .name('echoctl')
    .description('EchoCTL - AI-powered CLI agent')
    .version('1.0.0');

  // Register auth commands
  program.addCommand(createAuthCommand());

  // /connect command for TUI integration
  program
    .command('/connect')
    .description('Interactive provider setup (TUI command)')
    .action(async () => {
      const { interactiveLogin } = await import('./commands/auth/login.js');
      await interactiveLogin();
    });

  // Help message enhancement
  program.on('--help', () => {
    console.log();
    console.log(chalk.cyan('Quick Start:'));
    console.log(chalk.gray('  echoctl auth login          # Configure a new provider'));
    console.log(chalk.gray('  echoctl auth list           # View configured providers'));
    console.log(chalk.gray('  echoctl /connect            # Interactive TUI setup'));
    console.log();
    console.log(chalk.cyan('Enterprise Login:'));
    console.log(chalk.gray('  echoctl auth login <url>    # Fetch config from .well-known endpoint'));
    console.log();
  });

  // Parse arguments
  await program.parseAsync(process.argv);

  // If no arguments provided, show help
  if (process.argv.length <= 2) {
    program.help();
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\nUnexpected error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\nUnhandled promise rejection:'), reason);
  process.exit(1);
});

main().catch((error) => {
  console.error(chalk.red('\nError:'), error.message);
  process.exit(1);
});
