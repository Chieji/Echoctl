/**
 * MCP Client - Connect to and invoke MCP servers
 * 
 * This module provides the runtime for connecting to MCP servers
 * and registering their tools in the ExtensionRegistry
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import chalk from 'chalk';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
    }>;
    required?: string[];
  };
}

export interface MCPServerConnection {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  process?: ChildProcess;
  tools: MCPTool[];
  connected: boolean;
  messageId: number;
}

/**
 * MCP Client Manager
 * Handles connections to multiple MCP servers
 */
export class MCPClientManager extends EventEmitter {
  private connections: Map<string, MCPServerConnection> = new Map();
  private pendingRequests: Map<number, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeout?: NodeJS.Timeout;
  }> = new Map();

  /**
   * Add an MCP server connection
   */
  addServer(config: {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }): void {
    if (this.connections.has(config.name)) {
      throw new Error(`MCP server ${config.name} already exists`);
    }

    const connection: MCPServerConnection = {
      ...config,
      tools: [],
      connected: false,
      messageId: 0,
    };

    this.connections.set(config.name, connection);
    console.log(chalk.cyan(`MCP server added: ${config.name}`));
  }

  /**
   * Connect to an MCP server
   */
  async connect(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (!connection) {
      throw new Error(`MCP server ${name} not found`);
    }

    if (connection.connected) {
      console.log(chalk.green(`MCP server ${name} already connected`));
      return;
    }

    console.log(chalk.cyan(`Connecting to MCP server: ${name}...`));

    try {
      // Spawn the MCP server process
      const [command, ...args] = connection.command.split(' ');
      
      connection.process = spawn(command, args || connection.args || [], {
        env: { ...process.env, ...connection.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle server output
      connection.process.stdout?.on('data', (data) => {
        this.handleServerMessage(name, data.toString());
      });

      connection.process.stderr?.on('data', (data) => {
        console.log(chalk.yellow(`MCP ${name} stderr:`, data.toString()));
      });

      connection.process.on('error', (error) => {
        console.log(chalk.red(`MCP ${name} process error:`, error.message));
        connection.connected = false;
        this.emit('disconnected', name);
      });

      connection.process.on('exit', (code) => {
        console.log(chalk.yellow(`MCP ${name} exited with code ${code}`));
        connection.connected = false;
        this.emit('disconnected', name);
      });

      // Wait for connection confirmation
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        const onConnect = (serverName: string) => {
          if (serverName === name) {
            clearTimeout(timeout);
            this.off('connected', onConnect);
            resolve();
          }
        };

        this.once('connected', onConnect);
      });

      connection.connected = true;
      console.log(chalk.green(`✓ MCP server connected: ${name}`));

      // List available tools
      const tools = await this.listTools(name);
      connection.tools = tools;
      console.log(chalk.dim(`  Available tools: ${tools.length}`));

    } catch (error: any) {
      console.log(chalk.red(`✗ Failed to connect to MCP server ${name}:`, error.message));
      throw error;
    }
  }

  /**
   * Handle incoming messages from MCP server
   */
  private handleServerMessage(name: string, data: string): void {
    try {
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const message = JSON.parse(line);
        
        // Handle response to our request
        if (message.id && this.pendingRequests.has(message.id)) {
          const request = this.pendingRequests.get(message.id)!;
          clearTimeout(request.timeout);
          this.pendingRequests.delete(message.id);
          
          if (message.error) {
            request.reject(new Error(message.error.message || message.error));
          } else {
            request.resolve(message.result);
          }
        }
        
        // Handle server notifications
        if (message.method) {
          this.handleNotification(name, message);
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`Failed to parse MCP message from ${name}:`, error));
    }
  }

  /**
   * Handle server notifications
   */
  private handleNotification(name: string, message: any): void {
    switch (message.method) {
      case 'notifications/tools/list_changed':
        console.log(chalk.cyan(`MCP ${name}: Tools list changed`));
        this.refreshTools(name);
        break;
        
      default:
        console.log(chalk.dim(`MCP ${name} notification:`, message.method));
    }
  }

  /**
   * Send a JSON-RPC request to MCP server
   */
  private async sendRequest(
    name: string,
    method: string,
    params?: Record<string, unknown>
  ): Promise<any> {
    const connection = this.connections.get(name);
    if (!connection || !connection.process) {
      throw new Error(`MCP server ${name} not connected`);
    }

    const id = ++connection.messageId;
    
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for ${method}`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      
      connection.process?.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * List available tools from MCP server
   */
  async listTools(name: string): Promise<MCPTool[]> {
    const result = await this.sendRequest(name, 'tools/list');
    return result.tools || [];
  }

  /**
   * Call a tool on MCP server
   */
  async callTool(
    name: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<any> {
    const result = await this.sendRequest(name, 'tools/call', {
      name: toolName,
      arguments: args,
    });
    return result;
  }

  /**
   * Refresh tools list for a server
   */
  async refreshTools(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (connection) {
      connection.tools = await this.listTools(name);
      this.emit('tools_refreshed', name, connection.tools);
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (!connection) return;

    console.log(chalk.cyan(`Disconnecting from MCP server: ${name}...`));

    if (connection.process) {
      connection.process.kill();
    }

    connection.connected = false;
    connection.process = undefined;
    
    this.emit('disconnected', name);
    console.log(chalk.green(`✓ MCP server disconnected: ${name}`));
  }

  /**
   * Get connection status
   */
  getStatus(name: string): { connected: boolean; tools: number } | undefined {
    const connection = this.connections.get(name);
    if (!connection) return undefined;

    return {
      connected: connection.connected,
      tools: connection.tools.length,
    };
  }

  /**
   * List all servers
   */
  listServers(): Array<{
    name: string;
    connected: boolean;
    tools: number;
    command: string;
  }> {
    return Array.from(this.connections.values()).map(conn => ({
      name: conn.name,
      connected: conn.connected,
      tools: conn.tools.length,
      command: conn.command,
    }));
  }
}

/**
 * Global MCP client manager instance
 */
let globalMCPClient: MCPClientManager | null = null;

export function getMCPClient(): MCPClientManager {
  if (!globalMCPClient) {
    globalMCPClient = new MCPClientManager();
  }
  return globalMCPClient;
}
