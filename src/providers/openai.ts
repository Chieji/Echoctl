/**
 * OpenAI Provider Implementation
 */

import axios, { AxiosError } from 'axios';
import { BaseProvider } from './base.js';
import { Message, ProviderName, ProviderResponse } from '../types/index.js';

export class OpenAIProvider extends BaseProvider {
  readonly name: ProviderName = 'openai';
  private readonly defaultModel = 'gpt-4o-mini';

  constructor(apiKey: string, model?: string) {
    super(apiKey, model || 'gpt-4o-mini', 'https://api.openai.com/v1');
  }

  async generateResponse(messages: Message[], context?: string): Promise<ProviderResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const systemPrompt = context 
      ? `You are a helpful AI assistant. ${context}`
      : 'You are a helpful AI assistant.';

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...this.formatMessages(messages),
    ];

    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
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
        throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  protected formatMessages(messages: Message[]): unknown[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
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
