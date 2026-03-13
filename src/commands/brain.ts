/**
 * Brain Command - Second Brain Knowledge Base
 * Commands for managing persistent memory
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { getBrainStore } from '../storage/brain.js';

/**
 * Save a memory item
 */
export async function brainSave(
  key: string,
  value: string,
  tags: string[] = []
): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const memory = await brain.save(key, value, tags);

  console.log(chalk.green('✓ Memory saved'));
  console.log(chalk.dim(`  Key: ${memory.key}`));
  console.log(chalk.dim(`  Tags: ${tags.length > 0 ? tags.join(', ') : 'none'}`));
  console.log(chalk.dim(`  Updated: ${new Date(memory.updatedAt).toLocaleString()}`));
  console.log('');
}

/**
 * Get a memory by key
 */
export async function brainGet(key: string): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const memory = brain.get(key);

  if (!memory) {
    console.log(chalk.yellow(`⚠ Memory not found: ${key}`));
    console.log(chalk.dim('Use ') + chalk.cyan('echo brain search <query>') + chalk.dim(' to search.\n'));
    return;
  }

  console.log(chalk.bold.cyan(`\n🧠 ${memory.key}\n`));
  console.log(memory.value);
  
  if (memory.tags.length > 0) {
    console.log('\n' + chalk.dim(`Tags: ${memory.tags.join(', ')}`));
  }
  
  console.log(chalk.dim(`\nAccessed: ${memory.accessCount} times`));
  console.log(chalk.dim(`Updated: ${new Date(memory.updatedAt).toLocaleString()}`));
  console.log('');
}

/**
 * Search memories
 */
export async function brainSearch(
  query: string,
  tags: string[] = []
): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const results = brain.search(query, tags);

  if (results.length === 0) {
    console.log(chalk.yellow('⚠ No memories found'));
    
    if (tags.length > 0) {
      console.log(chalk.dim(`  (filtered by tags: ${tags.join(', ')})`));
    }
    
    console.log('');
    return;
  }

  console.log(chalk.bold.green(`\n📚 Found ${results.length} memory/memories\n`));

  for (const memory of results) {
    const preview = memory.value.substring(0, 150).replace(/\n/g, ' ') + 
                    (memory.value.length > 150 ? '...' : '');
    
    console.log(chalk.bold.cyan(`  ${memory.key}`));
    console.log(chalk.dim(`    ${preview}`));
    
    if (memory.tags.length > 0) {
      console.log(chalk.dim(`    Tags: ${memory.tags.join(', ')}`));
    }
    
    console.log('');
  }
}

/**
 * List all memories
 */
export async function brainList(limit: number = 20): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const memories = brain.list(limit);

  if (memories.length === 0) {
    console.log(chalk.yellow('⚠ No memories saved yet.'));
    console.log(chalk.dim('Use ') + chalk.cyan('echo brain save <key> <value>') + chalk.dim(' to save your first memory.\n'));
    return;
  }

  const table = new Table({
    head: [chalk.cyan('Key'), chalk.cyan('Tags'), chalk.cyan('Accessed'), chalk.cyan('Updated')],
    colWidths: [25, 20, 10, 20],
  });

  for (const memory of memories) {
    table.push([
      memory.key.substring(0, 23),
      memory.tags.slice(0, 3).join(', ').substring(0, 18) || '-',
      memory.accessCount.toString(),
      new Date(memory.updatedAt).toLocaleDateString(),
    ]);
  }

  console.log('\n' + chalk.bold('🧠 Second Brain Memories') + '\n');
  console.log(table.toString());
  console.log(`\n${chalk.dim(`Showing ${memories.length} of ${brain.getStats().totalMemories} memories`)}`);
  console.log(chalk.dim('Search: ') + chalk.cyan('echo brain search <query>') + '\n');
}

/**
 * Delete a memory
 */
export async function brainDelete(key: string, force: boolean = false): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const memory = brain.get(key);
  
  if (!memory) {
    console.log(chalk.yellow(`⚠ Memory not found: ${key}\n`));
    return;
  }

  if (!force) {
    const Enquirer = (await import('enquirer')).default;
    const enquirer = new Enquirer();
    
    const confirm = await enquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow(`Delete memory "${key}"?`),
      initial: false,
    }) as { confirm: boolean };

    if (!confirm.confirm) {
      console.log(chalk.dim('Cancelled.\n'));
      return;
    }
  }

  const deleted = await brain.delete(key);
  
  if (deleted) {
    console.log(chalk.green(`✓ Memory deleted: ${key}\n`));
  }
}

/**
 * Show brain statistics
 */
export async function brainStats(): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const stats = brain.getStats();
  const allTags = brain.getAllTags();

  console.log('\n' + chalk.bold.cyan('🧠 Second Brain Statistics\n'));

  const table = new Table({
    colWidths: [20, 15],
  });

  table.push(
    [chalk.cyan('Total Memories'), stats.totalMemories.toString()],
    [chalk.cyan('Total Tags'), stats.totalTags.toString()],
    [chalk.cyan('Most Accessed'), stats.mostAccessed?.key || '-'],
    [chalk.cyan('Recently Updated'), stats.recentlyUpdated?.key || '-'],
  );

  console.log(table.toString());

  if (allTags.length > 0) {
    console.log('\n' + chalk.dim('Tags: ') + allTags.slice(0, 20).join(', '));
    if (allTags.length > 20) {
      console.log(chalk.dim(`  ... and ${allTags.length - 20} more`));
    }
  }

  console.log('\n' + chalk.dim(`Storage: ${brain.getDbPath()}`) + '\n');
}

/**
 * Export memories
 */
export async function brainExport(output?: string): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const json = brain.export();

  if (output) {
    const { writeFile } = await import('fs/promises');
    await writeFile(output, json, 'utf-8');
    console.log(chalk.green(`✓ Memories exported to: ${output}\n`));
  } else {
    console.log(json);
  }
}

/**
 * Import memories
 */
export async function brainImport(input: string): Promise<void> {
  const brain = getBrainStore();
  await brain.init();

  const { readFile } = await import('fs/promises');
  
  try {
    const json = await readFile(input, 'utf-8');
    const imported = await brain.import(json);
    
    console.log(chalk.green(`✓ Imported ${imported} memories from: ${input}\n`));
  } catch (error: any) {
    console.log(chalk.red(`✗ Import failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Brain command group
 */
export const brainCommand = {
  save: brainSave,
  get: brainGet,
  search: brainSearch,
  list: brainList,
  delete: brainDelete,
  stats: brainStats,
  export: brainExport,
  import: brainImport,
};
