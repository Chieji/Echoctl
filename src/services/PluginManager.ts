/**
 * Plugin Manager for Echoctl
 * Enables modular, extensible architecture for tools and providers
 */

import { join, resolve } from 'path';
import { readdirSync, statSync, realpathSync, existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { pathToFileURL } from 'url';

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
    const localPlugins = join(process.cwd(), 'plugins');
    const bundledPlugins = join(__dirname, '../plugins');

    this.pluginPaths = [localPlugins, bundledPlugins];

    // Optional explicit opt-in for user plugins.
    if (process.env.ECHO_ENABLE_HOME_PLUGINS === 'true') {
      this.pluginPaths.unshift(join(homedir(), '.echo', 'plugins'));
    }
  }

  private isWithinTrustedRoot(path: string): boolean {
    const pluginRealPath = realpathSync(path);

    return this.pluginPaths.some((root) => {
      if (!existsSync(root)) {
        return false;
      }

      const rootRealPath = realpathSync(root);
      return pluginRealPath === rootRealPath || pluginRealPath.startsWith(`${rootRealPath}/`);
    });
  }

  private validatePluginDirectory(pluginPath: string): void {
    if (!this.isWithinTrustedRoot(pluginPath)) {
      throw new Error(`Plugin path is outside trusted roots: ${pluginPath}`);
    }

    const pathStats = statSync(pluginPath);
    if (!pathStats.isDirectory()) {
      throw new Error(`Plugin path is not a directory: ${pluginPath}`);
    }

    if (typeof process.getuid === 'function' && process.env.ECHO_ALLOW_UNSAFE_PLUGIN_OWNERSHIP !== 'true') {
      const ownerUid = pathStats.uid;
      const currentUid = process.getuid();
      if (ownerUid !== currentUid) {
        throw new Error(`Plugin owner UID (${ownerUid}) does not match current user UID (${currentUid})`);
      }
    }
  }

  private readPackageJson(pluginPath: string): PluginMetadata & { echo?: { plugin?: boolean } } {
    const packageJsonPath = join(pluginPath, 'package.json');
    const packageJsonRaw = readFileSync(packageJsonPath, 'utf-8');
    return JSON.parse(packageJsonRaw);
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
          try {
            this.validatePluginDirectory(fullPath);
            const packageJson = this.readPackageJson(fullPath);

            if (packageJson.echo?.plugin) {
              discovered.push(resolve(fullPath));
            }
          } catch {
            // Skip invalid or untrusted plugin directories
          }
        }
      } catch {
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
      this.validatePluginDirectory(pluginPath);
      const packageJson = this.readPackageJson(pluginPath);

      if (!packageJson.echo?.plugin) {
        throw new Error('package.json missing echo.plugin=true marker');
      }

      const existing = this.plugins.get(packageJson.name);
      if (existing) {
        return existing;
      }

      const mainPath = resolve(pluginPath, packageJson.main || 'index.js');
      if (!this.isWithinTrustedRoot(mainPath)) {
        throw new Error(`Plugin entrypoint is outside trusted roots: ${mainPath}`);
      }

      const pluginModuleImport = await import(pathToFileURL(mainPath).href);
      const pluginModule = pluginModuleImport.default ?? pluginModuleImport;

      const plugin: Plugin = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        ...pluginModule,
      };

      if (!plugin.name || !plugin.version) {
        throw new Error('Invalid plugin metadata: name and version are required');
      }

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
