/**
 * OpenRouter Provider - Access to 100+ models
 * https://openrouter.ai
 */

import axios, { AxiosError } from 'axios';
import { BaseProvider } from './base.js';
import { Message, ProviderName, ProviderResponse } from '../types/index.js';

export class OpenRouterProvider extends BaseProvider {
  readonly name: ProviderName = 'openrouter';
  private readonly defaultModel = 'meta-llama/llama-3.1-405b-instruct';

  constructor(apiKey: string, model?: string) {
    super(apiKey, model || 'meta-llama/llama-3.1-405b-instruct', 'https://openrouter.ai/api/v1');
  }

  async generateResponse(messages: Message[], context?: string): Promise<ProviderResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    const formattedMessages = context 
      ? [
          { role: 'system', content: `You are a helpful AI assistant. ${context}` },
          ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        ]
      : messages.map(msg => ({ role: msg.role, content: msg.content }));

    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 8192,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://github.com/chieji/echoctl',
            'X-Title': 'Echo CLI',
          },
          timeout: 60000,
        }
      );

      return {
        content: this.extractContent(response.data),
        usage: this.extractUsage(response.data),
        model: response.data.model,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  protected extractContent(response: unknown): string {
    const data = response as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }

  protected extractUsage(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined {
    const data = response as { usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    }};
    
    if (!data.usage) return undefined;
    
    return {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    };
  }
}
