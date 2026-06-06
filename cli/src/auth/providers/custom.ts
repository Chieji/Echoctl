import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class CustomProvider extends BaseProvider {
  readonly id = 'custom';
  readonly name = 'Custom';
  readonly info: ProviderInfo = {
    id: 'custom',
    name: 'Custom Endpoint',
    description: 'Enterprise or custom API endpoints',
    authType: 'both',
    requiresBaseUrl: true,
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'custom' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const baseUrl = this.config.baseUrl;
    if (!baseUrl) {
      return { valid: false, error: 'Base URL is required for custom provider' };
    }

    const credential = this.getAuthCredential();
    if (!credential) {
      return { valid: false, error: 'API key or OAuth token is required' };
    }

    try {
      // Try to call the models endpoint (OpenAI-compatible)
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid credentials' };
      } else {
        return { valid: false, error: `Validation failed: ${response.status}` };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: `Cannot connect to custom endpoint at ${baseUrl}. (${error instanceof Error ? error.message : 'Unknown error'})` 
      };
    }
  }

  async getModels(): Promise<string[]> {
    const baseUrl = this.config.baseUrl;
    const credential = this.getAuthCredential();
    
    if (!baseUrl || !credential) {
      return [];
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });

      if (response.ok) {
        const data: unknown = await response.json();
        // Support both OpenAI format ({data: [{id}]}) and direct array
        if (Array.isArray(data)) {
          return data.map((m: { id?: string; name?: string }) => m.id || m.name || '').filter(Boolean);
        }
        const typedData = data as { data?: Array<{ id: string }> };
        return typedData.data?.map((m: { id: string }) => m.id) || [];
      }
    } catch {
      // Return empty on error
    }
    
    return [];
  }
}
