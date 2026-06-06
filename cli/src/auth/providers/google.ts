import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class GoogleProvider extends BaseProvider {
  readonly id = 'google';
  readonly name = 'Google';
  readonly info: ProviderInfo = {
    id: 'google',
    name: 'Google (Gemini)',
    description: 'Gemini models by Google',
    authType: 'api-key',
    requiresBaseUrl: false,
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'google' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 400 || response.status === 403) {
        return { valid: false, error: 'Invalid API key' };
      } else {
        return { valid: false, error: `Validation failed: ${response.status}` };
      }
    } catch (error) {
      return { valid: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async getModels(): Promise<string[]> {
    return [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ];
  }
}
