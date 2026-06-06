import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class DeepSeekProvider extends BaseProvider {
  readonly id = 'deepseek';
  readonly name = 'DeepSeek';
  readonly info: ProviderInfo = {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek AI models',
    authType: 'api-key',
    requiresBaseUrl: false,
    defaultBaseUrl: 'https://api.deepseek.com/v1',
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'deepseek' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch('https://api.deepseek.com/v1/models', {
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
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner',
    ];
  }
}
