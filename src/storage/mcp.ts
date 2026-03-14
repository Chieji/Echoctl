import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean; // Echo-specific extension
  description?: string; // Echo-specific extension
}

export interface MCPRegistry {
  mcpServers: Record<string, MCPServerConfig>;
}

const MCP_CONFIG_PATH = join(homedir(), '.config', 'echo-cli', 'mcp.json');

/**
 * Load MCP configuration
 */
export async function loadMCPConfig(): Promise<MCPRegistry> {
  try {
    if (existsSync(MCP_CONFIG_PATH)) {
      const content = await readFile(MCP_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.mcpServers) {
        return parsed as MCPRegistry;
      }
    }
  } catch (error) {
    // Ignore parse errors
  }

  return { mcpServers: {} };
}

/**
 * Save MCP configuration
 */
export async function saveMCPConfig(config: MCPRegistry): Promise<void> {
  const configDir = join(homedir(), '.config', 'echo-cli');
  
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }

  await writeFile(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Add an MCP server
 */
export async function addMCPServer(
  name: string,
  url: string,
  description?: string
): Promise<void> {
  const config = await loadMCPConfig();
  
  // For 'add', we assume it's a command/URL
  config.mcpServers[name] = {
    command: url, // In simple 'add', URL is the command
    args: [],
    enabled: true,
    description,
  };

  await saveMCPConfig(config);
}

/**
 * Remove an MCP server
 */
export async function removeMCPServer(name: string): Promise<void> {
  const config = await loadMCPConfig();
  delete config.mcpServers[name];
  await saveMCPConfig(config);
}

/**
 * Enable/disable an MCP server
 */
export async function setMCPServerEnabled(
  name: string,
  enabled: boolean
): Promise<void> {
  const config = await loadMCPConfig();
  if (config.mcpServers[name]) {
    config.mcpServers[name].enabled = enabled;
    await saveMCPConfig(config);
  } else {
    throw new Error(`Server '${name}' not found`);
  }
}

/**
 * List available MCP servers
 */
export async function listMCPServers(): Promise<any[]> {
  const config = await loadMCPConfig();
  return Object.entries(config.mcpServers).map(([name, cfg]) => ({
    name,
    ...cfg,
    enabled: cfg.enabled !== false, // default to true
  }));
}

/**
 * Install an MCP skill (npm package)
 */
export async function installMCPSkill(packageName: string): Promise<void> {
  const cwd = join(homedir(), '.config', 'echo-cli', 'skills');
  
  if (!existsSync(cwd)) {
    await mkdir(cwd, { recursive: true });
  }

  try {
    await execAsync(`npm install ${packageName}`, { cwd });
  } catch (error: any) {
    throw new Error(`Failed to install skill: ${error.message}`);
  }
}

/**
 * List installed MCP skills
 */
export async function listMCPSkills(): Promise<string[]> {
  const cwd = join(homedir(), '.config', 'echo-cli', 'skills');
  
  if (!existsSync(cwd)) return [];

  try {
    const { stdout } = await execAsync('npm list --depth=0', { cwd });
    const lines = stdout.split('\n').slice(1);
    return lines
      .filter(line => line.trim() && !line.includes('empty'))
      .map(line => {
        const parts = line.split(' ');
        const pkg = parts[parts.length - 1];
        return pkg.split('@')[0].trim();
      });
  } catch {
    return [];
  }
}

/**
 * MCP command handlers boilerplate
 */
export const mcpCommands = {
  list: listMCPServers,
  add: addMCPServer,
  remove: removeMCPServer,
  enable: (name: string) => setMCPServerEnabled(name, true),
  disable: (name: string) => setMCPServerEnabled(name, false),
  install: installMCPSkill,
  skills: listMCPSkills,
};
