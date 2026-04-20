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

export async function buildExtensionSnapshot(): Promise<ExtensionSnapshot> {
  const registry = getExtensionRegistry();
  const extensions = registry.listEnabled();
  const snapshot: ExtensionSnapshot = {
    tools: {},
    warnings: []
  };

  for (const ext of extensions) {
    snapshot.tools[ext.name] = {
      name: ext.name,
      description: ext.description,
      source: ext.source as any,
      invoke: ext.invoke
    };
  }

  return snapshot;
}
