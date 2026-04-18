import { getMCPManager } from './mcp.js';
import { getExtensionRegistry } from './registry.js';

export interface ExtensionToolDescriptor {
  name: string;
  description: string;
  source: 'mcp' | 'plugin';
  invoke: (args: any) => Promise<any>;
}

export interface ExtensionSnapshot {
  tools: Record<string, ExtensionToolDescriptor>;
  warnings: string[];
}

export async function buildExtensionSnapshot(): Promise<ExtensionSnapshot> {
  const snapshot: ExtensionSnapshot = {
    tools: {},
    warnings: [],
  };

  try {
    // 1. Load MCP tools
    const mcpManager = await getMCPManager();
    const mcpTools = await mcpManager.getAllTools();

    for (const [key, { tool, client }] of Object.entries(mcpTools)) {
      snapshot.tools[key] = {
        name: key,
        description: tool.description || '',
        source: 'mcp',
        invoke: (args) => client.callTool(tool.name, args),
      };
    }

    // 2. Load Plugin tools from Registry
    const registry = getExtensionRegistry();
    const plugins = registry.listBySource('plugin');

    for (const plugin of plugins) {
      if (plugin.enabled) {
        snapshot.tools[plugin.name] = {
          name: plugin.name,
          description: plugin.description,
          source: 'plugin',
          invoke: plugin.invoke,
        };
      }
    }
  } catch (error: any) {
    snapshot.warnings.push(`Failed to build extension snapshot: ${error.message}`);
  }

  return snapshot;
}
