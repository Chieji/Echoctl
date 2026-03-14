import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import { loadMCPConfig, MCPServerConfig } from '../storage/mcp.js';
import chalk from 'chalk';
import axios from 'axios';

/**
 * MCP Tool representation
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: any;
}

/**
 * Simple JSON-RPC Client for MCP Servers (stdio or SSE)
 */
export class MCPServerClient {
  private process: ChildProcess | null = null;
  private rl: readline.Interface | null = null;
  private sseEndpoint: string | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (value: any) => void, reject: (reason?: any) => void }>();
  private isInitializing = false;
  private transport: 'stdio' | 'sse' = 'stdio';

  constructor(public name: string, private config: MCPServerConfig) {
    this.transport = this.config.command.startsWith('http') ? 'sse' : 'stdio';
  }

  /**
   * Start the server process or connect to SSE
   */
  async start(): Promise<void> {
    if (this.isInitializing) return;
    if (this.transport === 'stdio' && this.process) return;
    if (this.transport === 'sse' && this.sseEndpoint) return;

    this.isInitializing = true;

    try {
      if (this.transport === 'stdio') {
        await this.startStdio();
      } else {
        await this.startSSE();
      }

      // Initial handshake (initialize)
      await this.send('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'echo-cli', version: '1.0.0' }
      });

      await this.send('notifications/initialized', {});
    } catch (error: any) {
      this.cleanup();
      throw new Error(`Failed to start MCP server ${this.name}: ${error.message}`);
    } finally {
      this.isInitializing = false;
    }
  }

  private async startStdio(): Promise<void> {
    this.process = spawn(this.config.command, this.config.args || [], {
      env: { ...process.env, ...this.config.env },
      stdio: ['pipe', 'pipe', 'inherit'],
      shell: true
    });

    this.rl = readline.createInterface({
      input: this.process.stdout!,
      terminal: false
    });

    this.rl.on('line', (line) => this.handleMessage(line));

    this.process.on('error', (err) => {
      console.error(chalk.red(`[MCP:${this.name}] Process error:`), err.message);
      this.cleanup();
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(chalk.yellow(`[MCP:${this.name}] Process exited with code ${code}`));
      }
      this.cleanup();
    });
  }

  private async startSSE(): Promise<void> {
    try {
      console.log(chalk.dim(`[MCP:${this.name}] Connecting to SSE at ${this.config.command}...`));
      const response = await axios.get(this.config.command, {
        responseType: 'stream',
        headers: { Accept: 'text/event-stream' },
        timeout: 10000 // 10s timeout
      });

      response.data.on('data', (chunk: Buffer) => {
        const content = chunk.toString();
        const lines = content.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            const index = lines.indexOf(line);
            const eventType = line.substring(6).trim();
            const dataLine = lines.find((l, i) => i > index && l.startsWith('data:'));
            
            if (eventType === 'endpoint' && dataLine) {
              const url = dataLine.substring(5).trim();
              this.sseEndpoint = new URL(url, this.config.command).toString();
              console.log(chalk.dim(`[MCP:${this.name}] SSE Endpoint found: ${this.sseEndpoint}`));
            } else if (eventType === 'message' && dataLine) {
              this.handleMessage(dataLine.substring(5).trim());
            }
          }
        }
      });

      response.data.on('error', (err: Error) => {
        console.error(chalk.yellow(`[MCP:${this.name}] SSE Stream error: ${err.message}`));
        this.cleanup();
      });

      // Wait for endpoint or timeout
      let attempts = 0;
      while (!this.sseEndpoint && attempts < 100) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      if (!this.sseEndpoint) {
        throw new Error('Timed out waiting for SSE endpoint');
      }
    } catch (error: any) {
      throw new Error(`SSE Connection failed: ${error.message}`);
    }
  }

  private handleMessage(line: string): void {
    try {
      const response = JSON.parse(line);
      if (response.id !== undefined && this.pendingRequests.has(response.id)) {
        const { resolve, reject } = this.pendingRequests.get(response.id)!;
        this.pendingRequests.delete(response.id);
        if (response.error) {
          reject(new Error(response.error.message || 'Unknown JSON-RPC error'));
        } else {
          resolve(response.result);
        }
      }
    } catch (e) {
      // Skip non-JSON lines
    }
  }

  /**
   * Stop the server process
   */
  stop(): void {
    if (this.process) {
      this.process.stdin?.end();
      this.process.kill();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.process = null;
    this.rl = null;
    this.sseEndpoint = null;
    // Reject all pending requests
    for (const { reject } of this.pendingRequests.values()) {
      reject(new Error('MCP Server connection closed'));
    }
    this.pendingRequests.clear();
  }

  /**
   * Send JSON-RPC request
   */
  async send(method: string, params: any = {}): Promise<any> {
    if (this.transport === 'stdio' && !this.process) {
      await this.start();
    } else if (this.transport === 'sse' && !this.sseEndpoint) {
      await this.start();
    }

    const id = this.messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise(async (resolve, reject) => {
      // Set a timeout for requests
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP Request timed out: ${method}`));
        }
      }, 30000); // 30s timeout

      this.pendingRequests.set(id, {
        resolve: (val) => {
          clearTimeout(timeout);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        }
      });

      try {
        if (this.transport === 'stdio') {
          if (!this.process?.stdin?.writable) {
            return reject(new Error('MCP server stdin is not writable'));
          }
          this.process.stdin.write(JSON.stringify(request) + '\n');
        } else {
          // SSE transport - send via POST to endpoint
          await axios.post(this.sseEndpoint!, request);
        }
      } catch (error: any) {
        this.pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(new Error(`Failed to send MCP request ${method}: ${error.message}`));
      }
    });
  }

  /**
   * List tools provided by the server
   */
  async listTools(): Promise<MCPTool[]> {
    const result = await this.send('tools/list');
    return result.tools || [];
  }

  /**
   * Call a tool provided by the server
   */
  async callTool(name: string, args: any): Promise<any> {
    return this.send('tools/call', { name, arguments: args });
  }
}

/**
 * Global MCP Client Manager
 */
export class MCPManager {
  private clients = new Map<string, MCPServerClient>();

  /**
   * Initialize and start enabled MCP servers
   */
  async initialize(): Promise<void> {
    const config = await loadMCPConfig();
    for (const [name, cfg] of Object.entries(config.mcpServers)) {
      if (cfg.enabled !== false) {
        const client = new MCPServerClient(name, cfg);
        this.clients.set(name, client);
      }
    }
  }

  /**
   * Get all available tools from all active servers
   */
  async getAllTools(): Promise<Record<string, { tool: MCPTool, client: MCPServerClient }>> {
    const allTools: Record<string, { tool: MCPTool, client: MCPServerClient }> = {};
    
    for (const client of this.clients.values()) {
      try {
        const tools = await client.listTools();
        for (const tool of tools) {
          // Prefix tool name to avoid conflicts if needed, or just map them
          const toolKey = `mcp_${client.name}_${tool.name}`;
          allTools[toolKey] = { tool, client };
        }
      } catch (error) {
        console.error(chalk.yellow(`Warning: Could not list tools from MCP server ${client.name}`));
      }
    }
    
    return allTools;
  }

  /**
   * Shutdown all servers
   */
  shutdown(): void {
    for (const client of this.clients.values()) {
      client.stop();
    }
    this.clients.clear();
  }
}

// Singleton manager
let mcpManager: MCPManager | null = null;

export async function getMCPManager(): Promise<MCPManager> {
  if (!mcpManager) {
    mcpManager = new MCPManager();
    await mcpManager.initialize();
  }
  return mcpManager;
}
