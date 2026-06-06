import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class LMStudioProvider extends BaseProvider {
  readonly id = 'lmstudio';
  readonly name = 'LM Studio';
  readonly info: ProviderInfo = {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    description: 'Local LLM models via LM Studio',
    authType: 'api-key',
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://localhost:1234/v1',
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'lmstudio' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const baseUrl = this.getBaseUrl() || 'http://localhost:1234/v1';

    try {
      const response = await fetch(`${baseUrl}/models`);

      if (response.ok) {
        return { valid: true };
      } else {
        return { valid: false, error: `Validation failed: ${response.status}` };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: `Cannot connect to LM Studio at ${baseUrl}. Ensure LM Studio is running. (${error instanceof Error ? error.message : 'Unknown error'})` 
      };
    }
  }

  async getModels(): Promise<string[]> {
    const baseUrl = this.getBaseUrl() || 'http://localhost:1234/v1';
    
    try {
      const response = await fetch(`${baseUrl}/models`);
      if (response.ok) {
        const data: unknown = await response.json();
        const typedData = data as { data?: Array<{ id: string }> };
        return typedData.data?.map((m: { id: string }) => m.id) || [];
      }
    } catch {
      // Return empty as fallback
    }
    
    return [];
  }
}
