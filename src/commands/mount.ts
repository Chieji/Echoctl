import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { MountSource } from '../types/index.js';
import crypto from 'crypto';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Mount Command setup
 */
export function setupMountCommand(program: Command) {
  const mount = program
    .command('mount')
    .description('Manage knowledge sources (local folders or URLs)');

  mount
    .command('add <path>')
    .description('Add a new knowledge source (local path or URL)')
    .option('-n, --name <name>', 'Custom name for the source')
    .option('-d, --description <desc>', 'Short description of the source')
    .action(async (path, options) => {
      try {
        const config = getConfig();
        const type = path.startsWith('http') ? 'web' : 'local';
        
        let absolutePath = path;
        if (type === 'local') {
          absolutePath = resolve(path);
          if (!existsSync(absolutePath)) {
            console.log(chalk.yellow(`⚠ Warning: Path ${absolutePath} does not exist.`));
          }
        }

        const name = options.name || (type === 'local' ? absolutePath.split('/').pop() : new URL(path).hostname);
        const id = crypto.randomBytes(4).toString('hex');

        const newMount: MountSource = {
          id,
          name: name || 'unnamed',
          type,
          path: absolutePath,
          enabled: true,
          description: options.description,
        };

        config.addMount(newMount);
        console.log(chalk.green(`✓ Successfully mounted: ${chalk.bold(newMount.name)}`));
        console.log(chalk.dim(`  ID: ${id}`));
        console.log(chalk.dim(`  Path: ${absolutePath}`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed to add mount:'), error.message);
      }
    });

  mount
    .command('list')
    .description('List all mounted sources')
    .action(async () => {
      try {
        const config = getConfig();
        const mounts = config.getMounts();

        console.log(chalk.bold('\n🏔 Mounted Knowledge Sources\n'));

        if (mounts.length === 0) {
          console.log(chalk.dim('No sources mounted.\n'));
          console.log(chalk.dim('Use ') + chalk.cyan('echo mount add <path>') + chalk.dim(' to add one.'));
          return;
        }

        mounts.forEach(m => {
          const status = m.enabled ? chalk.green('✓') : chalk.dim('○');
          const typeIcon = m.type === 'web' ? '🌐' : '📁';
          console.log(`${status} ${chalk.bold(m.name)} ${chalk.dim(`(${m.id})`)}`);
          console.log(chalk.dim(`  ${typeIcon} ${m.path}`));
          if (m.description) console.log(chalk.dim(`  📝 ${m.description}`));
          if (m.lastIndexedAt) {
            console.log(chalk.dim(`  🕒 Last indexed: ${new Date(m.lastIndexedAt).toLocaleString()}`));
          }
          console.log('');
        });
      } catch (error: any) {
        console.log(chalk.red('✗ Failed to list mounts:'), error.message);
      }
    });

  mount
    .command('remove <id>')
    .description('Remove a mounted source by ID or name')
    .action(async (id) => {
      try {
        const config = getConfig();
        config.removeMount(id);
        console.log(chalk.green(`✓ Removed mount source: ${id}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed to remove mount:'), error.message);
      }
    });

  mount
    .command('enable <id>')
    .description('Enable a mounted source')
    .action(async (id) => {
      try {
        const config = getConfig();
        config.toggleMount(id, true);
        console.log(chalk.green(`✓ Enabled mount source: ${id}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed to enable mount:'), error.message);
      }
    });

  mount
    .command('disable <id>')
    .description('Disable a mounted source')
    .action(async (id) => {
      try {
        const config = getConfig();
        config.toggleMount(id, false);
        console.log(chalk.green(`✓ Disabled mount source: ${id}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed to disable mount:'), error.message);
      }
    });

  return mount;
}
