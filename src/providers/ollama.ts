/**
 * Ollama Provider (Local LLM)
 */

import axios, { AxiosError } from 'axios';
import { BaseProvider } from './base.js';
import { Message, ProviderName, ProviderResponse } from '../types/index.js';

export class OllamaProvider extends BaseProvider {
  readonly name: ProviderName = 'ollama';
  private readonly defaultModel = 'llama3.1';

  constructor(baseUrl: string = 'http://localhost:11434', model?: string) {
    super('', model || 'llama3.1', baseUrl);
  }

  async generateResponse(messages: Message[], context?: string): Promise<ProviderResponse> {
    const url = `${this.baseUrl}/api/chat`;

    const systemPrompt = context 
      ? `You are a helpful AI assistant. ${context}`
      : 'You are a helpful AI assistant.';

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({ role: msg.role, content: msg.content })),
    ];

    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          messages: formattedMessages,
          stream: false,
          options: {
            temperature: 0.7,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // Local models can be slower
        }
      );

      return {
        content: this.extractContent(response.data),
        usage: this.extractUsage(response.data),
        model: response.data.model || this.model,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Ollama is not running. Start it with: ollama serve');
        }
        throw new Error(`Ollama API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/api/tags`;
      const response = await axios.get(url);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  protected extractContent(response: unknown): string {
    const data = response as {
      message?: {
        content?: string;
      };
    };
    
    return data.message?.content || '';
  }

  protected extractUsage(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined {
    const data = response as {
      prompt_eval_count?: number;
      eval_count?: number;
    };
    
    if (!data.prompt_eval_count && !data.eval_count) return undefined;
    
    const promptTokens = data.prompt_eval_count || 0;
    const completionTokens = data.eval_count || 0;
    
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }
}
