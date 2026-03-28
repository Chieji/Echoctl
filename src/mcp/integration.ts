/**
 * MCP Integration with ExtensionRegistry
 * 
 * Automatically registers MCP server tools as extensions
 */

import { getExtensionRegistry, type Extension } from '../extensions/registry.js';
import { getMCPClient, type MCPTool } from './client.js';
import chalk from 'chalk';

/**
 * Register all tools from an MCP server as extensions
 */
export async function registerMCPServerTools(serverName: string): Promise<void> {
  const registry = getExtensionRegistry();
  const mcpClient = getMCPClient();
  
  // Connect to the MCP server
  await mcpClient.connect(serverName);
  
  // Get the tools
  const tools = await mcpClient.listTools(serverName);
  
  console.log(chalk.green(`\n✓ Registering ${tools.length} tools from MCP server: ${serverName}\n`));
  
  // Register each tool as an extension
  for (const tool of tools) {
    const extensionId = `mcp-${serverName}-${tool.name}`;
    
    // Check if already registered
    if (registry.get(extensionId)) {
      console.log(chalk.dim(`  ⊘ Skipping ${tool.name} (already registered)`));
      continue;
    }
    
    // Create extension
    const extension: Extension = {
      id: extensionId,
      name: tool.name,
      description: tool.description || `MCP tool from ${serverName}`,
      source: 'mcp',
      inputSchema: tool.inputSchema,
      enabled: true,
      mcpConfig: {
        serverName,
      },
      invoke: async (args: Record<string, unknown>) => {
        // Invoke the MCP tool
        const result = await mcpClient.callTool(serverName, tool.name, args);
        return result;
      },
    };
    
    // Register
    registry.register(extension);
    console.log(chalk.dim(`  ✓ Registered: ${tool.name}`));
  }
  
  console.log('');
}

/**
 * Unregister all tools from an MCP server
 */
export async function unregisterMCPServerTools(serverName: string): Promise<void> {
  const registry = getExtensionRegistry();
  
  const extensions = registry.listBySource('mcp')
    .filter(ext => ext.mcpConfig?.serverName === serverName);
  
  for (const ext of extensions) {
    registry.unregister(ext.id);
  }
  
  console.log(chalk.green(`\n✓ Unregistered ${extensions.length} tools from MCP server: ${serverName}\n`));
}

/**
 * Sync all MCP servers and register their tools
 */
export async function syncAllMCPServers(): Promise<void> {
  const mcpClient = getMCPClient();
  const servers = mcpClient.listServers();
  
  console.log(chalk.bold('\n🔄 Syncing MCP Servers\n'));
  
  for (const server of servers) {
    try {
      if (!server.connected) {
        await registerMCPServerTools(server.name);
      }
    } catch (error: any) {
      console.log(chalk.red(`✗ Failed to sync ${server.name}: ${error.message}`));
    }
  }
  
  console.log(chalk.green('\n✓ MCP server sync complete\n'));
}

/**
 * Initialize MCP integration
 * Called from main CLI startup
 */
export async function initializeMCPIntegration(): Promise<void> {
  console.log(chalk.cyan('\n🔌 Initializing MCP integration...\n'));
  
  try {
    await syncAllMCPServers();
  } catch (error: any) {
    console.log(chalk.yellow(`⚠ MCP initialization skipped: ${error.message}\n`));
  }
}
