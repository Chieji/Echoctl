/**
 * MCP (Model Context Protocol) Bridge for Echoctl
 * Enables compatibility with Claude Code and other MCP-compatible tools
 */

import { EventEmitter } from 'events';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
}

class MCPBridge extends EventEmitter {
  private serverName: string = 'echoctl-mcp-server';
  private serverVersion: string = '1.0.0';
  private capabilities: MCPCapabilities = {
    tools: true,
    resources: true,
    prompts: true,
    logging: true,
  };
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private prompts: Map<string, MCPPrompt> = new Map();

  constructor() {
    super();
    this.initializeServer();
  }

  /**
   * Initialize MCP server
   */
  private initializeServer() {
    console.log(`🔗 Initializing MCP Bridge: ${this.serverName}@${this.serverVersion}`);
  }

  /**
   * Register a tool as MCP-compatible
   */
  registerTool(tool: MCPTool) {
    this.tools.set(tool.name, tool);
    this.emit('tool:registered', tool);
    console.log(`✓ MCP Tool registered: ${tool.name}`);
  }

  /**
   * Register a resource
   */
  registerResource(resource: MCPResource) {
    this.resources.set(resource.uri, resource);
    this.emit('resource:registered', resource);
    console.log(`✓ MCP Resource registered: ${resource.uri}`);
  }

  /**
   * Register a prompt template
   */
  registerPrompt(prompt: MCPPrompt) {
    this.prompts.set(prompt.name, prompt);
    this.emit('prompt:registered', prompt);
    console.log(`✓ MCP Prompt registered: ${prompt.name}`);
  }

  /**
   * Get server info (MCP Protocol)
   */
  getServerInfo() {
    return {
      name: this.serverName,
      version: this.serverVersion,
      capabilities: this.capabilities,
    };
  }

  /**
   * List all available tools (MCP Protocol)
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute tool via MCP
   */
  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Validate arguments against schema
    this.validateArguments(args, tool.inputSchema);

    // Emit execution event
    this.emit('tool:executing', { toolName, args });

    try {
      // Execute the actual tool
      const result = await this.executeMCPTool(toolName, args);

      this.emit('tool:executed', { toolName, result });

      return {
        success: true,
        result,
      };
    } catch (error: any) {
      this.emit('tool:error', { toolName, error: error.message });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List all resources
   */
  listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Read resource content
   */
  async readResource(uri: string): Promise<string> {
    const resource = this.resources.get(uri);

    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return `Content of ${uri}`;
  }

  /**
   * List all prompts
   */
  listPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Get prompt by name
   */
  getPrompt(name: string): MCPPrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * Validate arguments against schema
   */
  private validateArguments(args: Record<string, any>, schema: any) {
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in args)) {
          throw new Error(`Missing required argument: ${required}`);
        }
      }
    }

    // Validate types
    for (const [key, value] of Object.entries(args)) {
      if (schema.properties && schema.properties[key]) {
        const propSchema = schema.properties[key];

        if (propSchema.type && typeof value !== propSchema.type) {
          throw new Error(`Invalid type for ${key}: expected ${propSchema.type}, got ${typeof value}`);
        }
      }
    }
  }

  /**
   * Execute MCP tool (placeholder for actual implementation)
   */
  private async executeMCPTool(toolName: string, args: Record<string, any>): Promise<any> {
    // This would be implemented by the actual tool
    return { message: `Executed ${toolName}`, args };
  }

  /**
   * Convert Echoctl plugin to MCP tool
   */
  convertPluginToMCP(pluginName: string, toolName: string, tool: any): MCPTool {
    return {
      name: `${pluginName}:${toolName}`,
      description: tool.description || `Tool: ${toolName}`,
      inputSchema: {
        type: 'object',
        properties: this.convertArgsToSchema(tool.args || {}),
        required: this.getRequiredArgs(tool.args || {}),
      },
    };
  }

  /**
   * Convert tool arguments to JSON schema
   */
  private convertArgsToSchema(args: Record<string, any>): Record<string, any> {
    const schema: Record<string, any> = {};

    for (const [key, arg] of Object.entries(args)) {
      schema[key] = {
        type: arg.type || 'string',
        description: arg.description || '',
      };

      if (arg.enum) {
        schema[key].enum = arg.enum;
      }

      if (arg.default !== undefined) {
        schema[key].default = arg.default;
      }
    }

    return schema;
  }

  /**
   * Get required arguments
   */
  private getRequiredArgs(args: Record<string, any>): string[] {
    return Object.entries(args)
      .filter(([_, arg]) => arg.required !== false)
      .map(([key]) => key);
  }

  /**
   * Export server configuration for MCP clients
   */
  exportMCPConfig() {
    return {
      server: this.getServerInfo(),
      tools: this.listTools(),
      resources: this.listResources(),
      prompts: this.listPrompts(),
    };
  }

  /**
   * Import MCP configuration from external server
   */
  async importMCPConfig(config: any) {
    if (config.tools) {
      for (const tool of config.tools) {
        this.registerTool(tool);
      }
    }

    if (config.resources) {
      for (const resource of config.resources) {
        this.registerResource(resource);
      }
    }

    if (config.prompts) {
      for (const prompt of config.prompts) {
        this.registerPrompt(prompt);
      }
    }

    console.log('✓ MCP configuration imported successfully');
  }
}

export const mcpBridge = new MCPBridge();
