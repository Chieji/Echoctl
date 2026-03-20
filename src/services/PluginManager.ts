/**
 * Plugin Manager for Echoctl
 * Enables modular, extensible architecture for tools and providers
 */

import { join, resolve } from 'path';
import { readdirSync, statSync } from 'fs';
import { homedir } from 'os';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  tools?: Record<string, any>;
  providers?: Record<string, any>;
  hooks?: Record<string, Function[]>;
}

export interface PluginMetadata {
  name: string;
  version: string;
  main: string;
  description: string;
  author?: string;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginPaths: string[] = [];
  private hooks: Map<string, Function[]> = new Map();

  constructor() {
    // Default plugin paths
    this.pluginPaths = [
      join(homedir(), '.echo', 'plugins'),
      join(process.cwd(), 'plugins'),
      join(__dirname, '../plugins'),
    ];
  }

  /**
   * Discover plugins in plugin directories
   */
  async discover(): Promise<string[]> {
    const discovered: string[] = [];

    for (const pluginPath of this.pluginPaths) {
      try {
        const entries = readdirSync(pluginPath);

        for (const entry of entries) {
          const fullPath = join(pluginPath, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            const packageJsonPath = join(fullPath, 'package.json');
            try {
              const packageJson = require(packageJsonPath);

              if (packageJson.echo?.plugin) {
                discovered.push(fullPath);
              }
            } catch (error) {
              // Not a valid plugin
            }
          }
        }
      } catch (error) {
        // Plugin path doesn't exist
      }
    }

    return discovered;
  }

  /**
   * Load a plugin
   */
  async load(pluginPath: string): Promise<Plugin> {
    try {
      const packageJsonPath = join(pluginPath, 'package.json');
      const packageJson = require(packageJsonPath);

      // Load plugin module
      const mainPath = join(pluginPath, packageJson.main || 'index.js');
      const pluginModule = require(mainPath);

      const plugin: Plugin = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        ...pluginModule,
      };

      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize();
      }

      // Register hooks
      if (plugin.hooks) {
        for (const [hookName, handlers] of Object.entries(plugin.hooks)) {
          if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
          }

          const hookHandlers = this.hooks.get(hookName)!;
          hookHandlers.push(...(Array.isArray(handlers) ? handlers : [handlers]));
        }
      }

      this.plugins.set(plugin.name, plugin);

      console.log(`✓ Loaded plugin: ${plugin.name}@${plugin.version}`);

      return plugin;
    } catch (error: any) {
      throw new Error(`Failed to load plugin from ${pluginPath}: ${error.message}`);
    }
  }

  /**
   * Load all discovered plugins
   */
  async loadAll(): Promise<Plugin[]> {
    const discovered = await this.discover();
    const loaded: Plugin[] = [];

    for (const pluginPath of discovered) {
      try {
        const plugin = await this.load(pluginPath);
        loaded.push(plugin);
      } catch (error: any) {
        console.warn(`⚠ Failed to load plugin: ${error.message}`);
      }
    }

    return loaded;
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all tools from plugins
   */
  getTools(): Record<string, any> {
    const tools: Record<string, any> = {};

    for (const plugin of this.plugins.values()) {
      if (plugin.tools) {
        for (const [toolName, tool] of Object.entries(plugin.tools)) {
          tools[`${plugin.name}:${toolName}`] = tool;
        }
      }
    }

    return tools;
  }

  /**
   * Get all providers from plugins
   */
  getProviders(): Record<string, any> {
    const providers: Record<string, any> = {};

    for (const plugin of this.plugins.values()) {
      if (plugin.providers) {
        for (const [providerName, provider] of Object.entries(plugin.providers)) {
          providers[`${plugin.name}:${providerName}`] = provider;
        }
      }
    }

    return providers;
  }

  /**
   * Execute hook
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const handlers = this.hooks.get(hookName) || [];
    const results: any[] = [];

    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error: any) {
        console.error(`Error executing hook ${hookName}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Unload a plugin
   */
  async unload(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    // Destroy plugin
    if (plugin.destroy) {
      await plugin.destroy();
    }

    // Remove hooks
    if (plugin.hooks) {
      for (const hookName of Object.keys(plugin.hooks)) {
        const handlers = this.hooks.get(hookName) || [];
        this.hooks.set(
          hookName,
          handlers.filter((h) => !plugin.hooks![hookName]?.includes(h))
        );
      }
    }

    this.plugins.delete(name);

    console.log(`✓ Unloaded plugin: ${name}`);
  }

  /**
   * Unload all plugins
   */
  async unloadAll(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());

    for (const name of pluginNames) {
      await this.unload(name);
    }
  }
}

export const pluginManager = new PluginManager();
