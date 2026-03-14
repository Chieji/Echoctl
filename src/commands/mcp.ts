import { Command } from 'commander';
import chalk from 'chalk';
import { syncExternalMCPConfigs, listMCPServers } from '../mcp/sync.js';
import { mcpCommands } from '../storage/mcp.js';

/**
 * MCP Command setup
 */
export function setupMcpCommand(program: Command) {
  const mcp = program
    .command('mcp')
    .description('Manage Model Context Protocol (MCP) servers');

  mcp
    .command('sync')
    .description('Sync MCP configurations from Claude Code, Claude Desktop, and Cursor')
    .option('-f, --force', 'Overwrite existing servers with the same name')
    .action(async (options) => {
      console.log(chalk.cyan('⟳ Scanning for external MCP configurations...'));
      
      const result = await syncExternalMCPConfigs({ force: options.force });
      
      if (result.sources.length > 0) {
        console.log(chalk.green(`✓ Successfully synced servers from:`));
        result.sources.forEach(src => console.log(chalk.dim(`  • ${src}`)));
      } else {
        console.log(chalk.yellow('⚠ No external MCP configurations found.'));
      }
      
      await listMCPServers();
    });

  mcp
    .command('list')
    .description('List configured MCP servers')
    .action(async () => {
      try {
        const servers = await mcpCommands.list();
        console.log(chalk.bold('\n📡 Registered MCP Servers\n'));
        
        if (servers.length === 0) {
          console.log(chalk.dim('No MCP servers configured.\n'));
          console.log(chalk.dim('Run ') + chalk.cyan('echo mcp sync') + chalk.dim(' to import from other agents.'));
          return;
        }

        servers.forEach(server => {
          const status = server.enabled ? chalk.green('✓') : chalk.dim('○');
          console.log(`${status} ${chalk.bold(server.name)}`);
          console.log(chalk.dim(`  URL/CMD: ${server.command}`));
          if (server.description) console.log(chalk.dim(`  ${server.description}`));
          if (server.skills && server.skills.length > 0) {
            console.log(chalk.dim(`  Skills: ${server.skills.join(', ')}`));
          }
          console.log('');
        });
      } catch (error: any) {
        console.log(chalk.red('✗ Failed:'), error.message);
      }
    });

  mcp
    .command('add <name> <url>')
    .description('Add a new MCP server')
    .option('-d, --description <desc>', 'Server description')
    .action(async (name, url, options) => {
      try {
        await mcpCommands.add(name, url, options.description);
        console.log(chalk.green(`✓ Added MCP server: ${name}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed:'), error.message);
      }
    });

  mcp
    .command('remove <name>')
    .description('Remove an MCP server')
    .action(async (name) => {
      try {
        await mcpCommands.remove(name);
        console.log(chalk.green(`✓ Removed MCP server: ${name}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed:'), error.message);
      }
    });

  mcp
    .command('enable <name>')
    .description('Enable an MCP server')
    .action(async (name) => {
      try {
        await mcpCommands.enable(name);
        console.log(chalk.green(`✓ Enabled MCP server: ${name}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed:'), error.message);
      }
    });

  mcp
    .command('disable <name>')
    .description('Disable an MCP server')
    .action(async (name) => {
      try {
        await mcpCommands.disable(name);
        console.log(chalk.green(`✓ Disabled MCP server: ${name}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed:'), error.message);
      }
    });

  mcp
    .command('install <package>')
    .description('Install an MCP skill package')
    .action(async (pkg) => {
      try {
        await mcpCommands.install(pkg);
        console.log(chalk.green(`✓ Installed MCP skill: ${pkg}\n`));
      } catch (error: any) {
        console.log(chalk.red('✗ Failed:'), error.message);
      }
    });

  mcp
    .command('skills')
    .description('List installed MCP skills')
    .action(async () => {
      try {
        const skills = await mcpCommands.skills();
        console.log(chalk.bold('\n📦 Installed MCP Skills\n'));
        
        if (skills.length === 0) {
          console.log(chalk.dim('No skills installed.\n'));
          return;
        }

        skills.forEach(skill => console.log(`  • ${skill}`));
        console.log('');
      } catch (error: any) {
        console.log(chalk.red('✗ Failed:'), error.message);
      }
    });

  return mcp;
}
