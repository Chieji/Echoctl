import { BaseProvider, ProviderConfig } from '../providers/base.js';

/**
 * OAuth Plugin Interface for extensible authentication
 * Allows users to leverage consumer subscriptions (ChatGPT Plus/Pro, Claude Max) via OAuth
 */
export interface OAuthPlugin {
  /**
   * Unique identifier for the plugin
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(): string;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number }>;

  /**
   * Validate current access token
   */
  validateToken(accessToken: string): Promise<boolean>;

  /**
   * Get provider-specific configuration
   */
  getProviderConfig(token: string): ProviderConfig;
}

/**
 * Base class for OAuth plugins
 */
export abstract class BaseOAuthPlugin implements OAuthPlugin {
  abstract readonly id: string;
  abstract readonly name: string;

  protected clientId?: string;
  protected clientSecret?: string;
  protected redirectUri?: string;

  constructor(options?: { clientId?: string; clientSecret?: string; redirectUri?: string }) {
    this.clientId = options?.clientId;
    this.clientSecret = options?.clientSecret;
    this.redirectUri = options?.redirectUri;
  }

  abstract getAuthorizationUrl(): string;

  abstract exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }>;

  abstract refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number }>;

  abstract validateToken(accessToken: string): Promise<boolean>;

  abstract getProviderConfig(token: string): ProviderConfig;

  /**
   * Set plugin credentials
   */
  setCredentials(clientId: string, clientSecret: string, redirectUri: string): void {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }
}

/**
 * Registry for OAuth plugins
 */
export class OAuthPluginRegistry {
  private static instance: OAuthPluginRegistry;
  private plugins: Map<string, OAuthPlugin> = new Map();

  private constructor() {}

  static getInstance(): OAuthPluginRegistry {
    if (!OAuthPluginRegistry.instance) {
      OAuthPluginRegistry.instance = new OAuthPluginRegistry();
    }
    return OAuthPluginRegistry.instance;
  }

  register(plugin: OAuthPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  get(pluginId: string): OAuthPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  list(): OAuthPlugin[] {
    return Array.from(this.plugins.values());
  }

  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }
}
