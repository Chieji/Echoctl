import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class XAIProvider extends BaseProvider {
  readonly id = 'xai';
  readonly name = 'xAI';
  readonly info: ProviderInfo = {
    id: 'xai',
    name: 'xAI (Grok)',
    description: 'Grok models by xAI',
    authType: 'api-key',
    requiresBaseUrl: false,
    defaultBaseUrl: 'https://api.x.ai/v1',
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'xai' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch('https://api.x.ai/v1/models', {
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
      'grok-3',
      'grok-3-mini',
      'grok-2-latest',
    ];
  }
}
