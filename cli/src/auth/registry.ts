import { AuthStore, getAuthStore } from './store.js';
import { BaseProvider, ProviderConfig } from './providers/base.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OpenAIProvider } from './providers/openai.js';
import { GoogleProvider } from './providers/google.js';
import { DeepSeekProvider } from './providers/deepseek.js';
import { XAIProvider } from './providers/xai.js';
import { OllamaProvider } from './providers/ollama.js';
import { LMStudioProvider } from './providers/lmstudio.js';
import { CustomProvider } from './providers/custom.js';

/**
 * Provider factory and registry
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private store: AuthStore;
  private providerClasses: Map<string, new (config: ProviderConfig) => BaseProvider> = new Map();

  private constructor() {
    this.store = getAuthStore();
    this.registerBuiltInProviders();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register built-in provider types
   */
  private registerBuiltInProviders(): void {
    this.registerProviderClass(AnthropicProvider);
    this.registerProviderClass(OpenAIProvider);
    this.registerProviderClass(GoogleProvider);
    this.registerProviderClass(DeepSeekProvider);
    this.registerProviderClass(XAIProvider);
    this.registerProviderClass(OllamaProvider);
    this.registerProviderClass(LMStudioProvider);
    this.registerProviderClass(CustomProvider);
  }

  /**
   * Register a provider class
   */
  registerProviderClass<T extends BaseProvider>(ProviderClass: new (config: ProviderConfig) => T): void {
    const instance = new ProviderClass({ name: 'temp' });
    this.providerClasses.set(instance.id, ProviderClass as unknown as new (config: ProviderConfig) => BaseProvider);
  }

  /**
   * Create a provider instance from stored configuration
   */
  createProvider(providerId: string): BaseProvider | null {
    const config = this.store.getProvider(providerId);
    if (!config) {
      return null;
    }

    const ProviderClass = this.providerClasses.get(providerId);
    if (ProviderClass) {
      return new ProviderClass(config);
    }

    // Fallback to custom provider for unknown types with baseUrl
    if (config.baseUrl) {
      return new CustomProvider(config);
    }

    return null;
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): BaseProvider[] {
    const providers = this.store.listProviders();
    return Object.entries(providers)
      .map(([id, config]) => this.createProvider(id))
      .filter((p): p is BaseProvider => p !== null);
  }

  /**
   * Get available provider types (not yet configured)
   */
  getAvailableProviderTypes(): Array<{ id: string; name: string; description: string }> {
    const configured = new Set(Object.keys(this.store.listProviders()));
    const available: Array<{ id: string; name: string; description: string }> = [];

    for (const [id, ProviderClass] of this.providerClasses.entries()) {
      if (!configured.has(id)) {
        const instance = new ProviderClass({ name: id });
        available.push({
          id: instance.id,
          name: instance.name,
          description: instance.info.description,
        });
      }
    }

    return available;
  }

  /**
   * Get all provider types (including configured ones)
   */
  getAllProviderTypes(): Array<{ id: string; name: string; description: string; configured: boolean }> {
    const configuredProviders = this.store.listProviders();
    const all: Array<{ id: string; name: string; description: string; configured: boolean }> = [];

    for (const [id, ProviderClass] of this.providerClasses.entries()) {
      const instance = new ProviderClass({ name: id });
      all.push({
        id: instance.id,
        name: instance.name,
        description: instance.info.description,
        configured: id in configuredProviders,
      });
    }

    return all;
  }

  /**
   * Save provider configuration
   */
  saveProvider(providerId: string, config: ProviderConfig): void {
    this.store.setProvider(providerId, config);
  }

  /**
   * Remove a provider
   */
  removeProvider(providerId: string): void {
    this.store.removeProvider(providerId);
  }

  /**
   * Set default provider
   */
  setDefaultProvider(providerId: string): void {
    this.store.setDefaultProvider(providerId);
  }

  /**
   * Get default provider ID
   */
  getDefaultProviderId(): string | undefined {
    return this.store.getDefaultProvider();
  }

  /**
   * Check if a provider is configured
   */
  hasProvider(providerId: string): boolean {
    return !!this.store.getProvider(providerId);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerId: string): ProviderConfig | undefined {
    return this.store.getProvider(providerId);
  }

  /**
   * Get default provider instance
   */
  getDefaultProvider(): BaseProvider | null {
    const defaultId = this.getDefaultProviderId();
    if (defaultId) {
      return this.createProvider(defaultId);
    }

    // If no default is set but there's only one provider, use that
    const configured = this.getConfiguredProviders();
    if (configured.length === 1) {
      return configured[0];
    }

    return null;
  }
}

// Singleton instance
let providerRegistryInstance: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!providerRegistryInstance) {
    providerRegistryInstance = ProviderRegistry.getInstance();
  }
  return providerRegistryInstance;
}
