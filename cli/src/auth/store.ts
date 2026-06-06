import fs from 'node:fs';
import path from 'node:path';
import { AUTH_CONFIG_PATH, DATA_DIR } from '../config/paths.js';
import { ProviderConfig } from './providers/base.js';

export interface AuthConfig {
  providers: Record<string, ProviderConfig>;
  defaultProvider?: string;
}

const DEFAULT_AUTH_CONFIG: AuthConfig = {
  providers: {},
};

/**
 * Credential storage manager
 * Handles reading/writing auth configuration to local storage
 */
export class AuthStore {
  private configPath: string;
  private config: AuthConfig | undefined = undefined;

  constructor(configPath: string = AUTH_CONFIG_PATH) {
    this.configPath = configPath;
  }

  /**
   * Ensure the config directory exists
   */
  private ensureDir(): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Set secure file permissions (600 - owner read/write only)
   */
  private setSecurePermissions(): void {
    try {
      fs.chmodSync(this.configPath, 0o600);
    } catch (error) {
      // Ignore on Windows where chmod may not work
      console.debug('Could not set file permissions:', error);
    }
  }

  /**
   * Load configuration from disk
   */
  load(): AuthConfig {
    if (this.config !== undefined) {
      return this.config;
    }

    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(content);
      } else {
        this.config = { ...DEFAULT_AUTH_CONFIG };
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.config!;
    } catch (error) {
      console.error('Failed to load auth config:', error);
      this.config = { ...DEFAULT_AUTH_CONFIG };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.config!;
    }
  }

  /**
   * Save configuration to disk
   */
  save(config: AuthConfig): void {
    this.ensureDir();
    this.config = config;
    
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    this.setSecurePermissions();
  }

  /**
   * Get a specific provider's configuration
   */
  getProvider(providerId: string): ProviderConfig | undefined {
    const config = this.load();
    return config.providers[providerId];
  }

  /**
   * Set or update a provider's configuration
   */
  setProvider(providerId: string, providerConfig: ProviderConfig): void {
    const config = this.load();
    config.providers[providerId] = {
      ...providerConfig,
      name: providerId,
    };
    this.save(config);
  }

  /**
   * Remove a provider's configuration
   */
  removeProvider(providerId: string): void {
    const config = this.load();
    delete config.providers[providerId];
    this.save(config);
  }

  /**
   * List all configured providers
   */
  listProviders(): Record<string, ProviderConfig> {
    const config = this.load();
    return { ...config.providers };
  }

  /**
   * Get the default provider ID
   */
  getDefaultProvider(): string | undefined {
    const config = this.load();
    return config.defaultProvider;
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(providerId: string): void {
    const config = this.load();
    config.defaultProvider = providerId;
    this.save(config);
  }

  /**
   * Check if any providers are configured
   */
  hasProviders(): boolean {
    const config = this.load();
    return Object.keys(config.providers).length > 0;
  }

  /**
   * Clear all authentication data
   */
  clear(): void {
    this.config = { ...DEFAULT_AUTH_CONFIG };
    this.save(this.config);
  }
}

// Singleton instance
let authStoreInstance: AuthStore | null = null;

export function getAuthStore(): AuthStore {
  if (!authStoreInstance) {
    authStoreInstance = new AuthStore();
  }
  return authStoreInstance;
}
