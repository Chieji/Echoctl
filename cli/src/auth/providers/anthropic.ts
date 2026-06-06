import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class AnthropicProvider extends BaseProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic';
  readonly info: ProviderInfo = {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Claude AI models by Anthropic',
    authType: 'api-key',
    requiresBaseUrl: false,
    defaultBaseUrl: 'https://api.anthropic.com',
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'anthropic' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 401) {
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
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
    ];
  }
}
