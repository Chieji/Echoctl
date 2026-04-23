/**
 * Extension Snapshot Utility
 */

import { getExtensionRegistry } from './registry.js';

export interface ExtensionToolDescriptor {
  name: string;
  description: string;
  source: 'mcp' | 'plugin' | 'skill' | 'api';
  invoke: (args: any) => Promise<any>;
}

export interface ExtensionSnapshot {
  tools: Record<string, ExtensionToolDescriptor>;
  warnings: string[];
}

/**
 * Builds a snapshot of all enabled extension tools
 */
export async function buildExtensionSnapshot(): Promise<ExtensionSnapshot> {
  const registry = getExtensionRegistry();
  const enabledExtensions = registry.listEnabled();
  const tools: Record<string, ExtensionToolDescriptor> = {};
  const warnings: string[] = [];

  for (const ext of enabledExtensions) {
    tools[ext.name] = {
      name: ext.name,
      description: ext.description,
      source: ext.source as any,
      invoke: (args: any) => ext.invoke(args),
    };
  }

  return { tools, warnings };
}
