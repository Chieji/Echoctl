/**
 * MCP (Model Context Protocol) Integration
 * Allows Echo to connect to MCP servers for extended capabilities
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MCPServer {
  name: string;
  url: string;
  description?: string;
  skills: string[];
  enabled: boolean;
}

export interface MCPConfig {
  servers: MCPServer[];
}

const MCP_CONFIG_PATH = join(homedir(), '.config', 'echo-cli', 'mcp.json');

/**
 * Default MCP servers
 */
const DEFAULT_SERVERS: MCPServer[] = [
  {
    name: 'github',
    url: 'https://api.github.com',
    description: 'GitHub API integration',
    skills: ['search_repos', 'get_issues', 'create_pr'],
    enabled: false,
  },
  {
    name: 'filesystem',
    url: 'local',
    description: 'Enhanced filesystem operations',
    skills: ['search_files', 'watch_directory', 'sync_folders'],
    enabled: true,
  },
  {
    name: 'web-search',
    url: 'https://api.example.com/search',
    description: 'Web search capabilities',
    skills: ['search_web', 'get_news', 'fetch_url'],
    enabled: false,
  },
];

/**
 * Load MCP configuration
 */
export async function loadMCPConfig(): Promise<MCPConfig> {
  try {
    if (existsSync(MCP_CONFIG_PATH)) {
      const content = await readFile(MCP_CONFIG_PATH, 'utf-8');
      return JSON.parse(content) as MCPConfig;
    }
  } catch (error) {
    console.error('Error loading MCP config:', error);
  }

  // Return default config
  return { servers: DEFAULT_SERVERS };
}

/**
 * Save MCP configuration
 */
export async function saveMCPConfig(config: MCPConfig): Promise<void> {
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
  
  // Check if already exists
  const existing = config.servers.find(s => s.name === name);
  if (existing) {
    throw new Error(`Server '${name}' already exists`);
  }

  config.servers.push({
    name,
    url,
    description,
    skills: [],
    enabled: true,
  });

  await saveMCPConfig(config);
}

/**
 * Remove an MCP server
 */
export async function removeMCPServer(name: string): Promise<void> {
  const config = await loadMCPConfig();
  config.servers = config.servers.filter(s => s.name !== name);
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
  const server = config.servers.find(s => s.name === name);
  
  if (!server) {
    throw new Error(`Server '${name}' not found`);
  }

  server.enabled = enabled;
  await saveMCPConfig(config);
}

/**
 * List available MCP servers
 */
export async function listMCPServers(): Promise<MCPServer[]> {
  const config = await loadMCPConfig();
  return config.servers;
}

/**
 * Get enabled MCP servers
 */
export async function getEnabledMCPServers(): Promise<MCPServer[]> {
  const config = await loadMCPConfig();
  return config.servers.filter(s => s.enabled);
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
    console.log(`✓ Installed MCP skill: ${packageName}`);
  } catch (error: any) {
    throw new Error(`Failed to install skill: ${error.message}`);
  }
}

/**
 * List installed MCP skills
 */
export async function listMCPSkills(): Promise<string[]> {
  const cwd = join(homedir(), '.config', 'echo-cli', 'skills');
  
  if (!existsSync(cwd)) {
    return [];
  }

  try {
    const { stdout } = await execAsync('npm list --depth=0', { cwd });
    const lines = stdout.split('\n').slice(1); // Skip first line
    return lines
      .filter(line => line.trim() && !line.includes('empty'))
      .map(line => line.split('@')[0].trim());
  } catch {
    return [];
  }
}

/**
 * MCP command handlers
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
