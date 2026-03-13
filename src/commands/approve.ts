/**
 * Approve Command - HITL Approval Management
 * Commands for managing human-in-the-loop approvals
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import Enquirer from 'enquirer';
import { getApprovalsStore } from '../storage/approvals.js';

/**
 * List pending approvals
 */
export async function approveList(): Promise<void> {
  const approvals = getApprovalsStore();
  await approvals.init();

  const pending = approvals.getPendingAll();

  if (pending.length === 0) {
    console.log(chalk.green('✓ No pending approvals\n'));
    return;
  }

  console.log(chalk.bold.yellow('\n⚠️  Pending Approvals\n'));

  const table = new Table({
    head: [chalk.cyan('ID'), chalk.cyan('Tool'), chalk.cyan('Description'), chalk.cyan('Created')],
    colWidths: [10, 15, 35, 20],
  });

  for (const request of pending) {
    table.push([
      request.id.substring(0, 8) + '...',
      request.toolName,
      request.description.substring(0, 33) + (request.description.length > 33 ? '...' : ''),
      new Date(request.createdAt).toLocaleString(),
    ]);
  }

  console.log(table.toString());
  console.log('\n' + chalk.dim('Approve: ') + chalk.cyan('echo approve <id> --yes'));
  console.log(chalk.dim('Deny: ') + chalk.cyan('echo approve <id> --no\n'));
}

/**
 * Submit approval decision
 */
export async function approveSubmit(
  id: string,
  approved?: boolean
): Promise<void> {
  const approvals = getApprovalsStore();
  await approvals.init();

  const request = approvals.getPending(id);

  if (!request) {
    console.log(chalk.red(`✗ Approval not found: ${id}`));
    console.log(chalk.dim('Use ') + chalk.cyan('echo approve list') + chalk.dim(' to see pending approvals.\n'));
    return;
  }

  // If not specified, prompt user
  if (approved === undefined) {
    const enquirer = new Enquirer();
    const response = await enquirer.prompt({
      type: 'select',
      name: 'action',
      message: `Approval request for: ${request.toolName}`,
      choices: [
        { name: 'approve', message: '✓ Approve' },
        { name: 'deny', message: '✗ Deny' },
        { name: 'cancel', message: 'Cancel' },
      ],
    }) as { action: 'approve' | 'deny' | 'cancel' };

    if (response.action === 'cancel') {
      console.log(chalk.dim('Cancelled.\n'));
      return;
    }

    approved = response.action === 'approve';
  }

  const success = await approvals.submit(id, approved);

  if (success) {
    console.log(chalk.green(`✓ ${approved ? 'Approved' : 'Denied'}: ${request.toolName}`));
    console.log(chalk.dim(`  ${request.description}\n`));
  } else {
    console.log(chalk.red('✗ Failed to submit approval\n'));
    process.exit(1);
  }
}

/**
 * Show approval statistics
 */
export async function approveStats(): Promise<void> {
  const approvals = getApprovalsStore();
  await approvals.init();

  const stats = approvals.getStats();
  const rules = approvals.getAutoApproveRules();

  console.log('\n' + chalk.bold.cyan('🔐 HITL Approval Statistics\n'));

  const table = new Table({
    colWidths: [20, 15],
  });

  table.push(
    [chalk.cyan('Pending'), stats.pending.toString()],
    [chalk.cyan('Approved Today'), stats.approvedToday.toString()],
    [chalk.cyan('Denied Today'), stats.deniedToday.toString()],
    [chalk.cyan('Total History'), stats.totalHistory.toString()],
  );

  console.log(table.toString());

  if (rules.length > 0) {
    console.log('\n' + chalk.bold('Auto-Approve Rules:\n'));
    for (const rule of rules) {
      const status = rule.enabled ? chalk.green('✓') : chalk.dim('○');
      console.log(`  ${status} ${rule.toolPattern}${rule.paramPattern ? ` (${rule.paramPattern})` : ''}`);
    }
  }

  console.log('\n' + chalk.dim(`Storage: ${approvals.getDbPath()}`) + '\n');
}

/**
 * Add auto-approve rule
 */
export async function approveAddRule(
  toolPattern: string,
  paramPattern?: string
): Promise<void> {
  const approvals = getApprovalsStore();
  await approvals.init();

  try {
    await approvals.addAutoApproveRule(toolPattern, paramPattern);
    console.log(chalk.green('✓ Auto-approve rule added'));
    console.log(chalk.dim(`  Tool: ${toolPattern}`));
    if (paramPattern) {
      console.log(chalk.dim(`  Param: ${paramPattern}`));
    }
    console.log('');
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Remove auto-approve rule
 */
export async function approveRemoveRule(toolPattern: string): Promise<void> {
  const approvals = getApprovalsStore();
  await approvals.init();

  await approvals.removeAutoApproveRule(toolPattern);
  console.log(chalk.green(`✓ Rule removed: ${toolPattern}\n`));
}

/**
 * Enable/disable auto-approve rule
 */
export async function approveToggleRule(
  toolPattern: string,
  enabled: boolean
): Promise<void> {
  const approvals = getApprovalsStore();
  await approvals.init();

  try {
    await approvals.setAutoApproveRuleEnabled(toolPattern, enabled);
    console.log(chalk.green(`✓ Rule ${enabled ? 'enabled' : 'disabled'}: ${toolPattern}\n`));
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Clear all pending approvals
 */
export async function approveClear(): Promise<void> {
  const approvals = getApprovalsStore();
  await approvals.init();

  const enquirer = new Enquirer();
  const confirm = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: chalk.yellow('Clear all pending approvals?'),
    initial: false,
  }) as { confirm: boolean };

  if (!confirm.confirm) {
    console.log(chalk.dim('Cancelled.\n'));
    return;
  }

  await approvals.clearPending();
  console.log(chalk.green('✓ All pending approvals cleared\n'));
}

/**
 * Approve command group
 */
export const approveCommand = {
  list: approveList,
  submit: approveSubmit,
  stats: approveStats,
  addRule: approveAddRule,
  removeRule: approveRemoveRule,
  toggleRule: approveToggleRule,
  clear: approveClear,
};
