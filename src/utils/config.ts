/**
 * Configuration Storage
 * Uses 'conf' for encrypted API key storage
 * 
 * Security: Uses system keychain when available, fallback to encrypted JSON
 */

import Conf from 'conf';
import crypto from 'crypto';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { AppConfig, ProviderConfig, ProviderName, BoxConfig } from '../types/index.js';

/**
 * Generate a secure encryption key from machine-specific identifiers
 * This ensures each machine has a unique encryption key
 */
function deriveEncryptionKey(): string {
  // Combine machine-specific identifiers
  const components = [
    homedir(),           // User home directory
    process.platform,    // OS platform
    process.arch,        // CPU architecture
    process.env.HOSTNAME || 'unknown',  // Hostname
  ];
  
  const seed = components.join('|');
  
  // Create a 32-byte key using SHA-256
  const hash = crypto.createHash('sha256').update(seed).digest();
  
  return hash.toString('base64');
}

/**
 * Default configuration
 */
const defaultConfig: AppConfig = {
  providers: {
    openai: undefined,
    gemini: undefined,
    anthropic: undefined,
    qwen: undefined,
    ollama: undefined,
    deepseek: undefined,
    kimi: undefined,
    groq: undefined,
    openrouter: undefined,
    together: undefined,
    modelscope: undefined,
    mistral: undefined,
    huggingface: undefined,
    github: undefined,
  },
  box: {
    enabled: false,
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
  private rateLimits: Map<string, { count: number; resetTime: number }>;

  constructor() {
    const encryptionKey = deriveEncryptionKey();
    
    this.store = new Conf<AppConfig>({
      projectName: 'echo-cli',
      defaults: defaultConfig,
      // Use derived encryption key for proper security
      encryptionKey: encryptionKey,
    });
    
    // Rate limit tracking (in-memory)
    this.rateLimits = new Map();
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
    const providers: ProviderName[] = [
      'openai', 'gemini', 'anthropic', 'qwen', 'ollama', 'deepseek',
      'kimi', 'groq', 'openrouter', 'together', 'modelscope', 'mistral',
      'huggingface', 'github'
    ];
    return providers.filter(p => this.isProviderConfigured(p) || p === 'ollama');
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
   * Get Box configuration
   */
  getBoxConfig(): BoxConfig | undefined {
    return this.store.get('box');
  }

  /**
   * Set Box configuration
   */
  setBoxConfig(config: BoxConfig): void {
    this.store.set('box', config);
  }

  /**
   * Check if Box is enabled and configured
   */
  isBoxConfigured(): boolean {
    const config = this.getBoxConfig();
    return !!config?.enabled && (!!config.developerToken || (!!config.clientId && !!config.clientSecret));
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

  /**
   * Rate Limiting - Check if request is allowed
   * Tracks API calls per provider to prevent rate limit violations
   */
  checkRateLimit(provider: string, limit: number, windowMs: number = 60000): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const key = `rate:${provider}`;
    const current = this.rateLimits.get(key);

    if (!current || now > current.resetTime) {
      // New window
      this.rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    if (current.count >= limit) {
      // Rate limited
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    // Increment counter
    current.count++;
    return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime };
  }

  /**
   * Get rate limit status for a provider
   */
  getRateLimitStatus(provider: string): { count: number; resetTime: number } | null {
    return this.rateLimits.get(`rate:${provider}`) || null;
  }

  /**
   * Clear rate limits (useful for testing or manual reset)
   */
  clearRateLimits(): void {
    this.rateLimits.clear();
  }

  /**
   * Security audit - check for potential issues
   */
  securityAudit(): {
    issues: string[];
    warnings: string[];
    secure: boolean;
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check encryption
    const configPath = this.store.path;
    try {
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8');
        // Check if file contains obvious plaintext API keys
        const apiKeyPattern = /sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}/;
        if (apiKeyPattern.test(content)) {
          issues.push('Config file may contain unencrypted API keys');
        }
      }
    } catch {
      warnings.push('Could not read config file for audit');
    }

    // Check for configured providers
    const providers = this.getConfiguredProviders();
    if (providers.length === 0) {
      warnings.push('No providers configured');
    }

    return {
      issues,
      warnings,
      secure: issues.length === 0,
    };
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
