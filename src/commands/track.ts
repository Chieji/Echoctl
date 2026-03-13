/**
 * Track Command - Development Track Management
 * Commands for managing isolated development contexts
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import Enquirer from 'enquirer';
import { getTracksStore } from '../storage/tracks.js';

/**
 * Create a new track
 */
export async function trackNew(name: string, description?: string): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const track = await tracks.create(name, description);

  console.log(chalk.green('✓ Track created'));
  console.log(chalk.dim(`  ID: ${track.id.substring(0, 8)}...`));
  console.log(chalk.dim(`  Name: ${track.name}`));
  if (track.description) {
    console.log(chalk.dim(`  Description: ${track.description}`));
  }
  console.log(chalk.dim('  Use ') + chalk.cyan(`echo track switch ${name}`) + chalk.dim(' to activate\n'));
}

/**
 * List all tracks
 */
export async function trackList(): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const allTracks = tracks.list();
  const currentTrack = tracks.getCurrentTrack();

  if (allTracks.length === 0) {
    console.log(chalk.yellow('⚠ No tracks found.'));
    console.log(chalk.dim('Create one with: ') + chalk.cyan('echo track new <name>\n'));
    return;
  }

  const table = new Table({
    head: [chalk.cyan('Name'), chalk.cyan('Description'), chalk.cyan('Active'), chalk.cyan('Updated')],
    colWidths: [20, 30, 8, 20],
  });

  for (const track of allTracks) {
    const isActive = currentTrack && track.id === currentTrack.id ? chalk.green('✓') : '';
    table.push([
      track.name.substring(0, 18),
      (track.description || '-').substring(0, 28),
      isActive,
      new Date(track.updatedAt).toLocaleDateString(),
    ]);
  }

  console.log('\n' + chalk.bold('📁 Development Tracks\n'));
  console.log(table.toString());
  console.log(`\n${chalk.dim(`Total: ${allTracks.length} tracks`)}`);
  console.log(chalk.dim('Switch: ') + chalk.cyan('echo track switch <name>') + '\n');
}

/**
 * Switch to a track
 */
export async function trackSwitch(name: string): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const success = await tracks.switchByName(name);

  if (success) {
    const track = tracks.getCurrentTrack();
    console.log(chalk.green(`✓ Switched to track: ${name}`));
    console.log(chalk.dim(`  ID: ${track?.id.substring(0, 8)}...`));
    if (track?.description) {
      console.log(chalk.dim(`  Description: ${track.description}`));
    }
    console.log('');
  } else {
    console.log(chalk.red(`✗ Track not found: ${name}`));
    console.log(chalk.dim('Use ') + chalk.cyan('echo track list') + chalk.dim(' to see available tracks.\n'));
    process.exit(1);
  }
}

/**
 * Show current track status
 */
export async function trackStatus(): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const currentTrack = tracks.getCurrentTrack();
  const stats = tracks.getStats();

  if (!currentTrack) {
    console.log(chalk.yellow('⚠ No active track.\n'));
    return;
  }

  console.log('\n' + chalk.bold.cyan('📁 Current Track\n'));

  const table = new Table({
    colWidths: [20, 30],
  });

  table.push(
    [chalk.cyan('Name'), currentTrack.name],
    [chalk.cyan('ID'), currentTrack.id.substring(0, 8) + '...'],
    [chalk.cyan('Description'), currentTrack.description || '-'],
    [chalk.cyan('Total Tracks'), stats.totalTracks.toString()],
  );

  console.log(table.toString());

  if (currentTrack.config) {
    console.log('\n' + chalk.dim('Config:'));
    if (currentTrack.config.defaultProvider) {
      console.log(chalk.dim(`  Default Provider: ${currentTrack.config.defaultProvider}`));
    }
    if (currentTrack.config.contextLength) {
      console.log(chalk.dim(`  Context Length: ${currentTrack.config.contextLength}`));
    }
    if (currentTrack.config.autoApproveTools?.length) {
      console.log(chalk.dim(`  Auto-approve: ${currentTrack.config.autoApproveTools.join(', ')}`));
    }
  }

  console.log('\n' + chalk.dim(`Storage: ${tracks.getDbPath()}`) + '\n');
}

/**
 * Delete a track
 */
export async function trackDelete(name: string, force: boolean = false): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const track = tracks.list().find(t => t.name.toLowerCase() === name.toLowerCase());

  if (!track) {
    console.log(chalk.red(`✗ Track not found: ${name}\n`));
    return;
  }

  if (!force) {
    const enquirer = new Enquirer();
    const confirm = await enquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow(`Delete track "${name}"?`),
      initial: false,
    }) as { confirm: boolean };

    if (!confirm.confirm) {
      console.log(chalk.dim('Cancelled.\n'));
      return;
    }
  }

  try {
    await tracks.delete(track.id);
    console.log(chalk.green(`✓ Track deleted: ${name}\n`));
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Export a track
 */
export async function trackExport(name: string, output?: string): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const track = tracks.list().find(t => t.name.toLowerCase() === name.toLowerCase());

  if (!track) {
    console.log(chalk.red(`✗ Track not found: ${name}\n`));
    return;
  }

  const json = tracks.export(track.id);

  if (output) {
    const { writeFile } = await import('fs/promises');
    await writeFile(output, json, 'utf-8');
    console.log(chalk.green(`✓ Track exported to: ${output}\n`));
  } else {
    console.log(json);
  }
}

/**
 * Import a track
 */
export async function trackImport(file: string): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const { readFile } = await import('fs/promises');

  try {
    const json = await readFile(file, 'utf-8');
    const track = await tracks.import(json);

    console.log(chalk.green(`✓ Track imported: ${track.name}`));
    console.log(chalk.dim(`  ID: ${track.id.substring(0, 8)}...\n`));
  } catch (error: any) {
    console.log(chalk.red(`✗ Import failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Set track configuration
 */
export async function trackConfig(
  name: string,
  options: {
    provider?: string;
    contextLength?: number;
    autoApprove?: string;
  }
): Promise<void> {
  const tracks = getTracksStore();
  await tracks.init();

  const track = tracks.list().find(t => t.name.toLowerCase() === name.toLowerCase());

  if (!track) {
    console.log(chalk.red(`✗ Track not found: ${name}\n`));
    return;
  }

  const config: any = {};
  if (options.provider) config.defaultProvider = options.provider;
  if (options.contextLength) config.contextLength = options.contextLength;
  if (options.autoApprove) {
    config.autoApproveTools = options.autoApprove.split(',').map(s => s.trim());
  }

  await tracks.setConfig(track.id, config);

  console.log(chalk.green('✓ Track configuration updated'));
  console.log(chalk.dim(`  Track: ${name}`));
  if (config.defaultProvider) {
    console.log(chalk.dim(`  Default Provider: ${config.defaultProvider}`));
  }
  if (config.contextLength) {
    console.log(chalk.dim(`  Context Length: ${config.contextLength}`));
  }
  if (config.autoApproveTools) {
    console.log(chalk.dim(`  Auto-approve: ${config.autoApproveTools.join(', ')}`));
  }
  console.log('');
}

/**
 * Track command group
 */
export const trackCommand = {
  new: trackNew,
  list: trackList,
  switch: trackSwitch,
  status: trackStatus,
  delete: trackDelete,
  export: trackExport,
  import: trackImport,
  config: trackConfig,
};
