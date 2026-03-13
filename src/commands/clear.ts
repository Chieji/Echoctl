/**
 * Clear Command - Manage conversation history
 */

import chalk from 'chalk';
import Enquirer from 'enquirer';
import { getSessionStore } from '../storage/sessions.js';

/**
 * Clear current session history
 */
export async function clearHistory(): Promise<void> {
  const sessionStore = getSessionStore();
  await sessionStore.init();
  const enquirer = new Enquirer();

  const currentSession = sessionStore.getCurrentSession();
  if (!currentSession) {
    console.log(chalk.yellow('⚠ No active session to clear.\n'));
    return;
  }

  const confirm = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: chalk.yellow(`Clear history for session "${currentSession.name}"?`),
    initial: false,
  }) as { confirm: boolean };

  if (!confirm.confirm) {
    console.log(chalk.dim('Cancelled.\n'));
    return;
  }

  await sessionStore.clearCurrentSessionMessages();
  console.log(chalk.green('✓ Current session history cleared.\n'));
}

/**
 * Clear all data (nuclear option)
 */
export async function clearAll(): Promise<void> {
  const sessionStore = getSessionStore();
  await sessionStore.init();
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
    await sessionStore.clearAll();
    console.log(chalk.red.bold('\n✓ All data has been deleted.\n'));
  }
}

/**
 * Delete current session entirely
 */
export async function clearSession(): Promise<void> {
  const sessionStore = getSessionStore();
  await sessionStore.init();
  const enquirer = new Enquirer();

  const currentSession = sessionStore.getCurrentSession();
  if (!currentSession) {
    console.log(chalk.yellow('⚠ No active session to delete.\n'));
    return;
  }

  const confirm = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: chalk.yellow(`Delete session "${currentSession.name}" entirely?`),
    initial: false,
  }) as { confirm: boolean };

  if (!confirm.confirm) {
    console.log(chalk.dim('Cancelled.\n'));
    return;
  }

  await sessionStore.deleteCurrentSession();
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
