/**
 * Provider Registry
 *
 * Central registry for all providers. Supports dynamic registration
 * for plugin providers without core changes.
 */

import { BaseProvider } from "./base.js";

class ProviderRegistry {
  private providers: Map<string, BaseProvider> = new Map();

  /**
   * Register a provider instance.
   */
  register(provider: BaseProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  /**
   * Get a provider by name (case-insensitive).
   */
  get(name: string): BaseProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * List all registered provider names.
   */
  list(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * List all registered provider instances.
   */
  listProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if a provider is registered.
   */
  has(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  /**
   * Unregister a provider.
   */
  unregister(name: string): boolean {
    return this.providers.delete(name.toLowerCase());
  }
}

// Singleton registry instance
export const registry = new ProviderRegistry();
export { ProviderRegistry };
