import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { runCommand } from '../tools/runCommand';
import { isValidPackageName } from '../utils/packageNameValidator';

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
  description?: string;
}

export interface MCPRegistry {
  mcpServers: Record<string, MCPServerConfig>;
}

const MCP_CONFIG_PATH = join(homedir(), '.config', 'echo-cli', 'mcp.json');

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

export async function saveMCPConfig(config: MCPRegistry): Promise<void> {
  const configDir = join(homedir(), '.config', 'echo-cli');

  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }

  await writeFile(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function addMCPServer(
  name: string,
  url: string,
  description?: string
): Promise<void> {
  const config = await loadMCPConfig();

  config.mcpServers[name] = {
    command: url,
    args: [],
    enabled: true,
    description,
  };

  await saveMCPConfig(config);
}

export async function removeMCPServer(name: string): Promise<void> {
  const config = await loadMCPConfig();
  delete config.mcpServers[name];
  await saveMCPConfig(config);
}

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

export async function listMCPServers(): Promise<any[]> {
  const config = await loadMCPConfig();
  return Object.entries(config.mcpServers).map(([name, cfg]) => ({
    name,
    ...cfg,
    enabled: cfg.enabled !== false,
  }));
}

export async function installMCPSkill(packageName: string): Promise<void> {
  const cwd = join(homedir(), '.config', 'echo-cli', 'skills');

  if (!existsSync(cwd)) {
    await mkdir(cwd, { recursive: true });
  }

  if (!isValidPackageName(packageName)) {
    throw new Error(`Invalid package name: ${packageName}`);
  }

  const res = await runCommand('npm', ['install', packageName], { cwd });
  if (!res.success) {
    throw new Error(`npm install failed: ${res.stderr || res.error}`);
  }
}

export async function listMCPSkills(): Promise<string[]> {
  const cwd = join(homedir(), '.config', 'echo-cli', 'skills');

  if (!existsSync(cwd)) return [];

  try {
    const res = await runCommand('npm', ['list', '--depth=0'], { cwd });
    if (!res.success) return [];
    
    const lines = res.stdout.split('\n').slice(1);
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

export async function removeMCPSkill(packageName: string): Promise<void> {
  const cwd = join(homedir(), '.config', 'echo-cli', 'skills');

  if (!existsSync(cwd)) {
    return;
  }

  if (!isValidPackageName(packageName)) {
    throw new Error(`Invalid package name: ${packageName}`);
  }

  const res = await runCommand('npm', ['uninstall', packageName], { cwd });
  if (!res.success) {
    throw new Error(`npm uninstall failed: ${res.stderr || res.error}`);
  }
}

export const mcpCommands = {
  list: listMCPServers,
  add: addMCPServer,
  remove: removeMCPServer,
  enable: (name: string) => setMCPServerEnabled(name, true),
  disable: (name: string) => setMCPServerEnabled(name, false),
  install: installMCPSkill,
  skills: listMCPSkills,
};
