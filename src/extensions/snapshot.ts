import { getExtensionRegistry, ExtensionSource } from './registry.js';

/**
 * Build a snapshot of currently enabled extensions for tool discovery
 */
export async function buildExtensionSnapshot() {
  const registry = getExtensionRegistry();
  await registry.loadFromPersistence();

  const tools: Record<string, {
    id: string;
    name: string;
    description: string;
    source: ExtensionSource;
    inputSchema?: any;
    invoke: (args: Record<string, unknown>) => Promise<unknown>;
  }> = {};

  const warnings: string[] = [];

  const enabledExtensions = registry.listEnabled();

  for (const ext of enabledExtensions) {
    tools[ext.id] = {
      id: ext.id,
      name: ext.name,
      description: ext.description,
      source: ext.source,
      inputSchema: ext.inputSchema,
      invoke: ext.invoke.bind(ext),
    };
  }

  return {
    tools,
    warnings,
  };
}
