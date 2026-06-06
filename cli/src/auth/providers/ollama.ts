import { BaseProvider, ProviderConfig, ProviderInfo } from './base.js';

export class OllamaProvider extends BaseProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama';
  readonly info: ProviderInfo = {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Local LLM models via Ollama',
    authType: 'api-key',
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://localhost:11434',
  };

  constructor(config: ProviderConfig) {
    super({ ...config, name: 'ollama' });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const baseUrl = this.getBaseUrl() || 'http://localhost:11434';

    try {
      const response = await fetch(`${baseUrl}/api/tags`);

      if (response.ok) {
        return { valid: true };
      } else {
        return { valid: false, error: `Validation failed: ${response.status}` };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: `Cannot connect to Ollama at ${baseUrl}. Ensure Ollama is running. (${error instanceof Error ? error.message : 'Unknown error'})` 
      };
    }
  }

  async getModels(): Promise<string[]> {
    const baseUrl = this.getBaseUrl() || 'http://localhost:11434';
    
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (response.ok) {
        const data: unknown = await response.json();
        const typedData = data as { models?: Array<{ name: string }> };
        return typedData.models?.map((m: { name: string }) => m.name) || [];
      }
    } catch {
      // Return common model names as fallback
    }
    
    return [
      'llama3.1',
      'llama3.2',
      'mistral',
      'gemma2',
      'qwen2.5',
    ];
  }
}
