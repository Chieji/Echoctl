/**
 * CLI Synchronization Bridge for Echoctl
 * Enables sync with Gemini CLI, Qwen, and other AI CLI tools
 */

import { EventEmitter } from 'events';
import { spawnSync } from 'child_process';
import { runCommand } from '../tools/runCommand';

export interface CLITool {
  name: string;
  cli: string;
  command: string;
  description: string;
  args: Record<string, any>;
}

export interface CLIConfig {
  name: string;
  executable: string;
  version?: string;
  installed: boolean;
  configPath?: string;
}

class CLISyncBridge extends EventEmitter {
  private supportedCLIs: Map<string, CLIConfig> = new Map();
  private syncedTools: Map<string, CLITool> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.initializeSupportedCLIs();
  }

  private initializeSupportedCLIs() {
    const clis = [
      {
        name: 'Gemini CLI',
        executable: 'gemini',
        configPath: '~/.gemini/config.json',
      },
      {
        name: 'Qwen CLI',
        executable: 'qwen',
        configPath: '~/.qwen/config.json',
      },
      {
        name: 'Claude Code',
        executable: 'claude',
        configPath: '~/.claude/config.json',
      },
      {
        name: 'OpenAI CLI',
        executable: 'openai',
        configPath: '~/.openai/config.json',
      },
    ];

    for (const cli of clis) {
      this.supportedCLIs.set(cli.executable, {
        name: cli.name,
        executable: cli.executable,
        installed: this.checkCLIInstalled(cli.executable),
        configPath: cli.configPath,
      });
    }

    console.log('✓ CLI Sync Bridge initialized');
  }

  private checkCLIInstalled(executable: string): boolean {
    const r = spawnSync('which', [executable], { stdio: 'ignore' });
    return r.status === 0;
  }

  getInstalledCLIs(): CLIConfig[] {
    return Array.from(this.supportedCLIs.values()).filter((cli) => cli.installed);
  }

  async syncGeminiTools(): Promise<CLITool[]> {
    const config = this.supportedCLIs.get('gemini');

    if (!config || !config.installed) {
      console.warn('⚠️  Gemini CLI not installed');
      return [];
    }

    try {
      const res = await runCommand('gemini', ['tools', 'list', '--json']);
      if (!res.success) {
        console.warn('Failed to query gemini tools:', res.stderr);
        return [];
      }
      let tools = [];
      try { tools = JSON.parse(res.stdout || '[]'); } catch (e) { tools = []; }

      const syncedTools: CLITool[] = [];

      for (const tool of tools) {
        const cliTool: CLITool = {
          name: tool.name,
          cli: 'gemini',
          command: `gemini ${tool.command}`,
          description: tool.description,
          args: tool.args || {},
        };

        this.syncedTools.set(`gemini:${tool.name}`, cliTool);
        syncedTools.push(cliTool);
      }

      this.emit('gemini:synced', syncedTools);
      console.log(`✓ Synced ${syncedTools.length} tools from Gemini CLI`);

      return syncedTools;
    } catch (error: any) {
      console.error('Failed to sync Gemini tools:', error.message);
      return [];
    }
  }

  async syncQwenTools(): Promise<CLITool[]> {
    const config = this.supportedCLIs.get('qwen');

    if (!config || !config.installed) {
      console.warn('⚠️  Qwen CLI not installed');
      return [];
    }

    try {
      const res = await runCommand('qwen', ['list-tools', '--format=json']);
      if (!res.success) {
        console.warn('Failed to query qwen tools:', res.stderr);
        return [];
      }
      let tools = [];
      try { tools = JSON.parse(res.stdout || '[]'); } catch (e) { tools = []; }

      const syncedTools: CLITool[] = [];

      for (const tool of tools) {
        const cliTool: CLITool = {
          name: tool.name,
          cli: 'qwen',
          command: `qwen ${tool.path}`,
          description: tool.description,
          args: tool.parameters || {},
        };

        this.syncedTools.set(`qwen:${tool.name}`, cliTool);
        syncedTools.push(cliTool);
      }

      this.emit('qwen:synced', syncedTools);
      console.log(`✓ Synced ${syncedTools.length} tools from Qwen CLI`);

      return syncedTools;
    } catch (error: any) {
      console.error('Failed to sync Qwen tools:', error.message);
      return [];
    }
  }

  async syncClaudeTools(): Promise<CLITool[]> {
    const config = this.supportedCLIs.get('claude');

    if (!config || !config.installed) {
      console.warn('⚠️  Claude CLI not installed');
      return [];
    }

    try {
      const res = await runCommand('claude', ['tools', '--json']);
      if (!res.success) {
        console.warn('Failed to query claude tools:', res.stderr);
        return [];
      }
      let tools = [];
      try { tools = JSON.parse(res.stdout || '[]'); } catch (e) { tools = []; }

      const syncedTools: CLITool[] = [];

      for (const tool of tools) {
        const cliTool: CLITool = {
          name: tool.name,
          cli: 'claude',
          command: `claude ${tool.id}`,
          description: tool.description,
          args: tool.schema || {},
        };

        this.syncedTools.set(`claude:${tool.name}`, cliTool);
        syncedTools.push(cliTool);
      }

      this.emit('claude:synced', syncedTools);
      console.log(`✓ Synced ${syncedTools.length} tools from Claude Code`);

      return syncedTools;
    } catch (error: any) {
      console.error('Failed to sync Claude tools:', error.message);
      return [];
    }
  }

  async executeCliTool(toolId: string, args: Record<string, any>): Promise<any> {
    const tool = this.syncedTools.get(toolId);

    if (!tool) {
      throw new Error(`Synced tool not found: ${toolId}`);
    }

    try {
      let command = tool.command;

      for (const [key, value] of Object.entries(args)) {
        command += ` --${key}=${JSON.stringify(value)}`;
      }

      console.log(`Executing: ${command}`);

      const [cmd, ...cmdArgs] = command.split(' ');
      const res = await runCommand(cmd, cmdArgs);

      if (!res.success) {
        throw new Error(res.stderr || res.error);
      }

      this.emit('cli:tool:executed', { toolId, output: res.stdout });

      return {
        success: true,
        output: res.stdout,
      };
    } catch (error: any) {
      this.emit('cli:tool:error', { toolId, error: error.message });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  setupAutoSync(cli: string, intervalMinutes: number = 60) {
    if (this.syncIntervals.has(cli)) {
      clearInterval(this.syncIntervals.get(cli)!);
    }

    const interval = setInterval(async () => {
      console.log(`🔄 Auto-syncing ${cli} tools...`);

      if (cli === 'gemini') {
        await this.syncGeminiTools();
      } else if (cli === 'qwen') {
        await this.syncQwenTools();
      } else if (cli === 'claude') {
        await this.syncClaudeTools();
      }
    }, intervalMinutes * 60 * 1000);

    this.syncIntervals.set(cli, interval);

    console.log(`✓ Auto-sync enabled for ${cli} (every ${intervalMinutes} minutes)`);
  }

  disableAutoSync(cli: string) {
    const interval = this.syncIntervals.get(cli);

    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(cli);
      console.log(`✓ Auto-sync disabled for ${cli}`);
    }
  }

  getSyncedTools(): CLITool[] {
    return Array.from(this.syncedTools.values());
  }

  getSyncedToolsByCLI(cli: string): CLITool[] {
    return Array.from(this.syncedTools.values()).filter((tool) => tool.cli === cli);
  }

  exportAsPlugins() {
    const plugins: Record<string, any> = {};

    for (const [cliName, _] of this.supportedCLIs) {
      const tools = this.getSyncedToolsByCLI(cliName);

      if (tools.length > 0) {
        plugins[cliName] = {
          name: cliName,
          version: '1.0.0',
          description: `Synced tools from ${cliName}`,
          tools: {},
        };

        for (const tool of tools) {
          plugins[cliName].tools[tool.name] = {
            name: `${cliName}:${tool.name}`,
            description: tool.description,
            args: tool.args,
            execute: async (args: any) => {
              return this.executeCliTool(`${cliName}:${tool.name}`, args);
            },
          };
        }
      }
    }

    return plugins;
  }

  async syncAll(): Promise<void> {
    console.log('🔄 Syncing all available CLIs...');

    const installed = this.getInstalledCLIs();

    for (const cli of installed) {
      if (cli.executable === 'gemini') {
        await this.syncGeminiTools();
      } else if (cli.executable === 'qwen') {
        await this.syncQwenTools();
      } else if (cli.executable === 'claude') {
        await this.syncClaudeTools();
      }
    }

    console.log('✓ All CLIs synced successfully');
  }

  getSyncStatus() {
    return {
      installedCLIs: this.getInstalledCLIs(),
      syncedToolsCount: this.syncedTools.size,
      syncedTools: this.getSyncedTools(),
      autoSyncEnabled: Array.from(this.syncIntervals.keys()),
    };
  }
}

export const cliSyncBridge = new CLISyncBridge();
