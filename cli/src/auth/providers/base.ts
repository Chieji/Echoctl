/**
 * Base provider interface that all authentication providers must implement.
 * Supports both API key and OAuth token-based authentication.
 */

export interface ProviderConfig {
  name: string;
  apiKey?: string;
  oauthToken?: string;
  baseUrl?: string;
  defaultModel?: string;
  [key: string]: string | undefined;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  authType: 'api-key' | 'oauth' | 'both';
  requiresBaseUrl: boolean;
  defaultBaseUrl?: string;
}

export abstract class BaseProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly info: ProviderInfo;

  constructor(protected config: ProviderConfig) {}

  /**
   * Validate the provider's credentials
   */
  abstract validateCredentials(): Promise<{ valid: boolean; error?: string }>;

  /**
   * Get available models for this provider
   */
  abstract getModels(): Promise<string[]>;

  /**
   * Get the effective base URL (config override or default)
   */
  getBaseUrl(): string | undefined {
    return this.config.baseUrl || this.info.defaultBaseUrl;
  }

  /**
   * Get the authentication credential (API key or OAuth token)
   */
  getAuthCredential(): string | undefined {
    return this.config.apiKey || this.config.oauthToken;
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    const hasApiKey = !!this.config.apiKey;
    const hasOauthToken = !!this.config.oauthToken;
    
    // For providers requiring baseUrl, check that too
    if (this.info.requiresBaseUrl && !this.config.baseUrl && !this.info.defaultBaseUrl) {
      return false;
    }
    
    return hasApiKey || hasOauthToken;
  }

  /**
   * Update provider configuration
   */
  updateConfig(newConfig: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
