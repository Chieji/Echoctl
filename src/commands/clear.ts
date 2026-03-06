/**
 * Clear Command - Manage conversation history
 */

import chalk from 'chalk';
import Enquirer from 'enquirer';
import { getMemory } from '../utils/memory.js';

/**
 * Clear current session history
 */
export async function clearHistory(): Promise<void> {
  const memory = getMemory();
  await memory.init();
  const enquirer = new Enquirer();

  const confirm = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: chalk.yellow('Clear current session history?'),
    initial: false,
  }) as { confirm: boolean };

  if (!confirm.confirm) {
    console.log(chalk.dim('Cancelled.\n'));
    return;
  }

  await memory.clearCurrentSession();
  console.log(chalk.green('✓ Current session history cleared.\n'));
}

/**
 * Clear all data (nuclear option)
 */
export async function clearAll(): Promise<void> {
  const memory = getMemory();
  await memory.init();
  const enquirer = new Enquirer();

  console.log(chalk.red.bold('\n⚠️  WARNING: This will delete ALL sessions and history!\n'));

  const confirm = await enquirer.prompt({
    type: 'input',
    name: 'confirm',
    message: chalk.red('Type "DELETE EVERYTHING" to confirm:'),
    validate: (value: string) => {
      if (value === 'DELETE EVERYTHING') {
        return true;
      }
      return 'You must type "DELETE EVERYTHING" exactly';
    },
  }) as { confirm: boolean };

  if (confirm.confirm) {
    await memory.clearAll();
    console.log(chalk.red.bold('\n✓ All data has been deleted.\n'));
  }
}

/**
 * Delete current session entirely
 */
export async function clearSession(): Promise<void> {
  const memory = getMemory();
  await memory.init();
  const enquirer = new Enquirer();

  const confirm = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: chalk.yellow('Delete current session entirely?'),
    initial: false,
  }) as { confirm: boolean };

  if (!confirm.confirm) {
    console.log(chalk.dim('Cancelled.\n'));
    return;
  }

  await memory.deleteCurrentSession();
  console.log(chalk.green('✓ Current session deleted. A new session will be created on next message.\n'));
}

/**
 * Clear command group
 */
export const clearCommand = {
  history: clearHistory,
  all: clearAll,
  session: clearSession,
};
