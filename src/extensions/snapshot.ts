/**
 * Extension Snapshot Utility
 * Captures the current state of all enabled extensions for AI context.
 */

import { getExtensionRegistry, ExtensionSource } from './registry.js';
import { getMCPManager } from './mcp.js';

export interface ExtensionToolDescriptor {
  name: string;
  description: string;
  source: ExtensionSource;
  inputSchema?: any;
  invoke: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ExtensionSnapshot {
  tools: ExtensionToolDescriptor[];
  timestamp: number;
  warnings: string[];
}

/**
 * Build a snapshot of all currently available and enabled extensions.
 * This includes MCP tools, plugins, and skills.
 */
export async function buildExtensionSnapshot(): Promise<ExtensionSnapshot> {
  const registry = getExtensionRegistry();
  const mcpManager = await getMCPManager();

  const tools: ExtensionToolDescriptor[] = [];
  const warnings: string[] = [];

  // 1. Get tools from registry (plugins and skills)
  const registeredExtensions = registry.listEnabled();
  for (const ext of registeredExtensions) {
    tools.push({
      name: ext.name,
      description: ext.description,
      source: ext.source,
      inputSchema: ext.inputSchema,
      invoke: ext.invoke
    });
  }

  // 2. Get tools from MCP servers
  try {
    const mcpTools = await mcpManager.getAllTools();
    for (const [key, { tool, client }] of Object.entries(mcpTools)) {
      tools.push({
        name: key,
        description: tool.description,
        source: 'mcp',
        inputSchema: tool.inputSchema,
        invoke: async (args) => client.callTool(tool.name, args)
      });
    }
  } catch (error) {
    warnings.push('Failed to load MCP tools for snapshot');
  }

  return {
    tools,
    timestamp: Date.now(),
    warnings
  };
}
