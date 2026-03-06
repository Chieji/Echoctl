/**
 * Configuration Storage
 * Uses 'conf' for encrypted API key storage
 */

import Conf from 'conf';
import { AppConfig, ProviderConfig, ProviderName } from '../types';

/**
 * Default configuration
 */
const defaultConfig: AppConfig = {
  providers: {
    openai: undefined,
    gemini: undefined,
    anthropic: undefined,
  },
  defaultProvider: 'gemini',
  smartModeEnabled: true,
  contextLength: 10,
};

/**
 * Config class - manages API keys and settings
 */
export class ConfigStore {
  private store: Conf<AppConfig>;

  constructor() {
    this.store = new Conf<AppConfig>({
      projectName: 'echo-cli',
      defaults: defaultConfig,
      // Enable encryption for sensitive data
      encryptionKey: 'echo-cli-encryption',
    });
  }

  /**
   * Get API key for a provider
   */
  getApiKey(provider: ProviderName): string | undefined {
    const providerConfig = this.store.get(`providers.${provider}`) as ProviderConfig | undefined;
    return providerConfig?.apiKey;
  }

  /**
   * Set API key for a provider
   */
  setApiKey(provider: ProviderName, apiKey: string): void {
    const existing = this.store.get(`providers.${provider}`) as ProviderConfig | undefined;
    this.store.set(`providers.${provider}`, {
      ...existing,
      apiKey,
    } as ProviderConfig);
  }

  /**
   * Remove API key for a provider
   */
  removeApiKey(provider: ProviderName): void {
    this.store.set(`providers.${provider}`, undefined);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider: ProviderName): ProviderConfig | undefined {
    return this.store.get(`providers.${provider}`);
  }

  /**
   * Set provider configuration
   */
  setProviderConfig(provider: ProviderName, config: ProviderConfig): void {
    this.store.set(`providers.${provider}`, config);
  }

  /**
   * Get all provider configs
   */
  getAllProviderConfigs(): Record<ProviderName, ProviderConfig | undefined> {
    return {
      openai: this.store.get('providers.openai'),
      gemini: this.store.get('providers.gemini'),
      anthropic: this.store.get('providers.anthropic'),
      qwen: this.store.get('providers.qwen'),
      ollama: this.store.get('providers.ollama'),
      deepseek: this.store.get('providers.deepseek'),
      kimi: this.store.get('providers.kimi'),
      groq: this.store.get('providers.groq'),
      openrouter: this.store.get('providers.openrouter'),
      together: this.store.get('providers.together'),
      modelscope: this.store.get('providers.modelscope'),
      mistral: this.store.get('providers.mistral'),
      huggingface: this.store.get('providers.huggingface'),
      github: this.store.get('providers.github'),
      smart: undefined,
    };
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: ProviderName): boolean {
    const config = this.store.get(`providers.${provider}`) as ProviderConfig | undefined;
    return !!config?.apiKey && config.apiKey.length > 0;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): ProviderName[] {
    const providers: ProviderName[] = ['openai', 'gemini', 'anthropic'];
    return providers.filter(p => this.isProviderConfigured(p));
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): ProviderName {
    return this.store.get('defaultProvider');
  }

  /**
   * Set default provider
   */
  setDefaultProvider(provider: ProviderName): void {
    this.store.set('defaultProvider', provider);
  }

  /**
   * Check if smart mode is enabled
   */
  isSmartModeEnabled(): boolean {
    return this.store.get('smartModeEnabled');
  }

  /**
   * Set smart mode
   */
  setSmartMode(enabled: boolean): void {
    this.store.set('smartModeEnabled', enabled);
  }

  /**
   * Get context length
   */
  getContextLength(): number {
    return this.store.get('contextLength');
  }

  /**
   * Set context length
   */
  setContextLength(length: number): void {
    this.store.set('contextLength', length);
  }

  /**
   * Get full configuration
   */
  getAll(): AppConfig {
    return this.store.store;
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.store.clear();
  }

  /**
   * Export configuration (for backup)
   */
  export(): string {
    return JSON.stringify(this.store.store, null, 2);
  }

  /**
   * Import configuration (from backup)
   */
  import(json: string): void {
    const config = JSON.parse(json) as AppConfig;
    this.store.store = config;
  }

  /**
   * Get config file path
   */
  get configPath(): string {
    return this.store.path;
  }
}

/**
 * Singleton instance
 */
let configInstance: ConfigStore | null = null;

export function getConfig(): ConfigStore {
  if (!configInstance) {
    configInstance = new ConfigStore();
  }
  return configInstance;
}
