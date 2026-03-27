import { getMCPManager } from './mcp.js';
import { pluginManager } from '../services/PluginManager.js';

export type ExtensionSource = 'mcp' | 'plugin';

export interface ExtensionToolDescriptor {
  name: string;
  description: string;
  source: ExtensionSource;
  invoke: (args: any) => Promise<any>;
}

export interface ExtensionRegistrySnapshot {
  tools: Record<string, ExtensionToolDescriptor>;
  warnings: string[];
}

function mergeTool(
  target: Record<string, ExtensionToolDescriptor>,
  descriptor: ExtensionToolDescriptor,
  warnings: string[]
): void {
  if (target[descriptor.name]) {
    warnings.push(
      `Extension tool name collision for '${descriptor.name}' between ${target[descriptor.name].source} and ${descriptor.source}. Keeping first registration.`
    );
    return;
  }

  target[descriptor.name] = descriptor;
}

export async function buildExtensionSnapshot(): Promise<ExtensionRegistrySnapshot> {
  const tools: Record<string, ExtensionToolDescriptor> = {};
  const warnings: string[] = [];

  try {
    const mcpManager = await getMCPManager();
    const mcpTools = await mcpManager.getAllTools();

    for (const [toolKey, { tool, client }] of Object.entries(mcpTools)) {
      mergeTool(
        tools,
        {
          name: toolKey,
          description: tool.description || `MCP tool: ${tool.name}`,
          source: 'mcp',
          invoke: async (args: any) => client.callTool(tool.name, args),
        },
        warnings
      );
    }
  } catch (error: any) {
    warnings.push(`Failed to load MCP tools: ${error.message}`);
  }

  try {
    await pluginManager.loadAll();
    const pluginTools = pluginManager.getTools();

    for (const [toolName, toolHandler] of Object.entries(pluginTools)) {
      if (typeof toolHandler !== 'function') {
        warnings.push(`Skipping plugin tool '${toolName}': handler is not callable.`);
        continue;
      }

      mergeTool(
        tools,
        {
          name: toolName,
          description: `Plugin tool: ${toolName}`,
          source: 'plugin',
          invoke: async (args: any) => {
            if (Array.isArray(args)) {
              return toolHandler(...args);
            }

            try {
              return await toolHandler(args);
            } catch {
              if (args && typeof args === 'object') {
                return toolHandler(...Object.values(args));
              }
              throw new Error(`Plugin tool '${toolName}' invocation failed`);
            }
          },
        },
        warnings
      );
    }
  } catch (error: any) {
    warnings.push(`Failed to load plugin tools: ${error.message}`);
  }

  return { tools, warnings };
}
