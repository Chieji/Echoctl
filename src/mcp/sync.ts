import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPRegistry {
  mcpServers: Record<string, MCPServerConfig>;
}

const ECHO_CONFIG_DIR = join(homedir(), '.config', 'echo-cli');
const ECHO_MCP_PATH = join(ECHO_CONFIG_DIR, 'mcp.json');

/**
 * List of known external MCP configuration paths
 */
const EXTERNAL_CONFIG_PATHS = [
  // Claude Code CLI
  join(homedir(), '.claude.json'),
  join(homedir(), '.config', 'claude', 'mcp.json'),
  
  // Claude Desktop (Linux/Mac/Win)
  join(homedir(), '.config', 'Claude', 'claude_desktop_config.json'),
  join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),

  // Cursor / Roo-Cline
  join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'),
  join(homedir(), '.config', 'Cursor', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'),
];

/**
 * Syncs external MCP configurations into Echo's registry
 */
export async function syncExternalMCPConfigs(options: { force?: boolean } = {}): Promise<{
  importedCount: number;
  sources: string[];
}> {
  const mergedRegistry: MCPRegistry = { mcpServers: {} };
  const sources: string[] = [];

  // 1. Try to load existing Echo MCP config first
  if (existsSync(ECHO_MCP_PATH)) {
    try {
      const data = await readFile(ECHO_MCP_PATH, 'utf-8');
      const existing = JSON.parse(data);
      if (existing.mcpServers) {
        mergedRegistry.mcpServers = { ...existing.mcpServers };
      }
    } catch (e) {
      // Ignore parse errors from our own config
    }
  }

  // 2. Scrape external paths
  for (const path of EXTERNAL_CONFIG_PATHS) {
    if (existsSync(path)) {
      try {
        const content = await readFile(path, 'utf-8');
        const parsed = JSON.parse(content);
        
        let foundServers = false;

        // Claude configs usually have a top-level mcpServers object
        if (parsed.mcpServers) {
          for (const [name, config] of Object.entries(parsed.mcpServers)) {
            if (!mergedRegistry.mcpServers[name] || options.force) {
              mergedRegistry.mcpServers[name] = config as MCPServerConfig;
              foundServers = true;
            }
          }
        } 
        // Some might be flat or under different keys, add logic as discovered
        
        if (foundServers) {
          sources.push(path);
        }
      } catch (e) {
        // Skip files that can't be read or parsed
      }
    }
  }

  // 3. Save the merged registry
  if (Object.keys(mergedRegistry.mcpServers).length > 0) {
    if (!existsSync(ECHO_CONFIG_DIR)) {
      await mkdir(ECHO_CONFIG_DIR, { recursive: true });
    }
    await writeFile(ECHO_MCP_PATH, JSON.stringify(mergedRegistry, null, 2));
  }

  return {
    importedCount: Object.keys(mergedRegistry.mcpServers).length,
    sources,
  };
}

/**
 * Displays the current MCP status in the CLI
 */
export async function listMCPServers(): Promise<void> {
  if (!existsSync(ECHO_MCP_PATH)) {
    console.log(chalk.yellow('⚠ No MCP servers configured. Run ') + chalk.cyan('echo mcp sync') + chalk.yellow(' to import settings.'));
    return;
  }

  try {
    const data = await readFile(ECHO_MCP_PATH, 'utf-8');
    const registry = JSON.parse(data);
    const servers = registry.mcpServers || {};

    if (Object.keys(servers).length === 0) {
      console.log(chalk.yellow('⚠ 0 MCP servers active.'));
      return;
    }

    console.log(chalk.bold('\nRegistered MCP Servers:'));
    for (const [name, config] of Object.entries(servers)) {
      console.log(`  ${chalk.green('•')} ${chalk.cyan(name.padEnd(15))} ${chalk.dim((config as MCPServerConfig).command)}`);
    }
    console.log('');
  } catch (e) {
    console.log(chalk.red('✗ Failed to read MCP configuration.'));
  }
}
