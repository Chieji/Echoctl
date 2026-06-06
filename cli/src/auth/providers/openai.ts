import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class OpenAIProvider extends BaseProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly info: ProviderInfo = {
    id: 'openai',
    name: 'OpenAI (GPT)',
    description: 'GPT models by OpenAI',
    authType: 'api-key',
    requiresBaseUrl: false,
    defaultBaseUrl: 'https://api.openai.com/v1',
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'openai' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'o3-mini',
      'o1',
    ];
  }
}
