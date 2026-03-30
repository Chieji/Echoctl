/**
 * Unified Extension Registry
 * 
 * Unifies three extension sources:
 * 1. MCP Servers (Model Context Protocol)
 * 2. Plugins (local scripts/modules)
 * 3. Skills (AI-defined capabilities)
 * 
 * All extensions conform to a common interface for easy discovery and invocation
 */

/**
 * Extension source type
 */
export type ExtensionSource = 'mcp' | 'plugin' | 'skill' | 'api';

/**
 * Unified Extension Descriptor
 */
export interface Extension {
  id: string;
  name: string;
  description: string;
  source: ExtensionSource;
  
  // Tool schema
  inputSchema?: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      required?: boolean;
    }>;
    required?: string[];
  };
  
  // Invocation
  invoke: (args: Record<string, unknown>) => Promise<unknown>;
  
  // Metadata
  enabled: boolean;
  version?: string;
  author?: string;
  url?: string;
  
  // Source-specific config
  mcpConfig?: {
    serverName: string;
    command?: string;
    url?: string;
  };
  
  pluginConfig?: {
    path: string;
    entryPoint: string;
  };
  
  skillConfig?: {
    ecosystem: 'claude' | 'gemini' | 'qwen' | 'echo';
    promptTemplate?: string;
  };
}

/**
 * Extension Registry - central store for all extensions
 */
export class ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();
  private persistedExtensions: Map<string, any> = new Map();

  /**
   * Load extensions from persistence
   */
  async loadFromPersistence(): Promise<void> {
    const { loadExtensions, loadExtensionAuth } = await import('../storage/extensions.js');
    
    const stored = await loadExtensions();
    this.persistedExtensions = stored;
    
    // Note: We store metadata only, invoke functions must be restored by source-specific logic
    for (const [id, ext] of stored) {
      // Create placeholder extension
      const extension: Extension = {
        ...ext,
        invoke: async () => {
          throw new Error(`Extension ${id} not initialized - invoke function not restored`);
        },
      } as Extension;
      
      this.extensions.set(id, extension);
    }
    
    // Load auth credentials
    for (const [id] of stored) {
      const auth = await loadExtensionAuth(id);
      if (auth) {
        const ext = this.extensions.get(id);
        if (ext) {
          (ext as any)._auth = auth;
        }
      }
    }
  }

  /**
   * Save extensions to persistence
   */
  async saveToPersistence(): Promise<void> {
    const { saveExtensions } = await import('../storage/extensions.js');
    
    // Convert to stored format
    const stored = new Map();
    for (const [id, ext] of this.extensions) {
      stored.set(id, {
        id: ext.id,
        name: ext.name,
        description: ext.description,
        source: ext.source,
        enabled: ext.enabled,
        version: ext.version,
        author: ext.author,
        url: ext.url,
        mcpConfig: ext.mcpConfig,
        pluginConfig: ext.pluginConfig,
        skillConfig: ext.skillConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    await saveExtensions(stored);
  }

  /**
   * Register a new extension
   */
  async register(extension: Extension): Promise<void> {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension ${extension.id} already registered`);
    }
    this.extensions.set(extension.id, extension);
    await this.saveToPersistence();
  }

  /**
   * Unregister an extension
   */
  async unregister(id: string): Promise<void> {
    this.extensions.delete(id);
    await this.saveToPersistence();
    
    // Also delete auth
    const { deleteExtensionAuth } = await import('../storage/extensions.js');
    await deleteExtensionAuth(id);
  }

  /**
   * Get extension by ID
   */
  get(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  /**
   * List all extensions
   */
  list(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * List extensions by source
   */
  listBySource(source: ExtensionSource): Extension[] {
    return this.list().filter(ext => ext.source === source);
  }

  /**
   * List enabled extensions
   */
  listEnabled(): Extension[] {
    return this.list().filter(ext => ext.enabled);
  }

  /**
   * Enable extension
   */
  async enable(id: string): Promise<void> {
    const ext = this.get(id);
    if (ext) {
      ext.enabled = true;
      await this.saveToPersistence();
    }
  }

  /**
   * Disable extension
   */
  async disable(id: string): Promise<void> {
    const ext = this.get(id);
    if (ext) {
      ext.enabled = false;
      await this.saveToPersistence();
    }
  }

  /**
   * Search extensions by name or description
   */
  search(query: string): Extension[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(ext =>
      ext.name.toLowerCase().includes(lowerQuery) ||
      ext.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get tool descriptor for AI prompt
   */
  getToolDescriptor(id: string): string | null {
    const ext = this.get(id);
    if (!ext) return null;

    const params = ext.inputSchema?.properties || {};
    const paramList = Object.entries(params)
      .map(([name, schema]) => `${name}: ${schema.type}${schema.required === false ? '?' : ''}`)
      .join(', ');

    return `${ext.name}(${paramList}): ${ext.description}`;
  }

  /**
   * Get all tool descriptors for system prompt
   */
  getAllToolDescriptors(): string[] {
    return this.listEnabled()
      .map(ext => this.getToolDescriptor(ext.id))
      .filter((desc): desc is string => desc !== null);
  }

  /**
   * Invoke extension by name
   */
  async invoke(name: string, args: Record<string, unknown>): Promise<unknown> {
    const ext = this.get(name);
    if (!ext) {
      throw new Error(`Extension ${name} not found`);
    }
    if (!ext.enabled) {
      throw new Error(`Extension ${name} is disabled`);
    }
    return ext.invoke(args);
  }

  /**
   * Export registry to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      extensions: this.list().map(ext => ({
        id: ext.id,
        name: ext.name,
        description: ext.description,
        source: ext.source,
        enabled: ext.enabled,
        version: ext.version,
        author: ext.author,
      })),
      total: this.extensions.size,
      enabled: this.listEnabled().length,
    };
  }
}

/**
 * Global registry instance
 */
let globalRegistry: ExtensionRegistry | null = null;

export function getExtensionRegistry(): ExtensionRegistry {
  if (!globalRegistry) {
    globalRegistry = new ExtensionRegistry();
  }
  return globalRegistry;
}

export function setExtensionRegistry(registry: ExtensionRegistry): void {
  globalRegistry = registry;
}
