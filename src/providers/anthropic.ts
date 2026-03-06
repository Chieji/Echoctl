/**
 * Anthropic Claude Provider Implementation
 */

import axios, { AxiosError } from 'axios';
import { BaseProvider } from './base.js';
import { Message, ProviderName, ProviderResponse } from '../types/index.js';

export class AnthropicProvider extends BaseProvider {
  readonly name: ProviderName = 'anthropic';
  private readonly defaultModel = 'claude-3-5-sonnet-20241022';
  private readonly apiVersion = '2023-06-01';

  constructor(apiKey: string, model?: string) {
    super(apiKey, model || 'claude-3-5-sonnet-20241022', 'https://api.anthropic.com/v1');
  }

  async generateResponse(messages: Message[], context?: string): Promise<ProviderResponse> {
    const url = `${this.baseUrl}/messages`;

    // Extract system message if present, otherwise use context
    let systemPrompt = context || 'You are a helpful AI assistant.';
    
    // Filter out system messages from the messages array for Anthropic
    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          max_tokens: 8192,
          system: systemPrompt,
          messages: anthropicMessages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
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
        const errorData = error.response?.data;
        const errorMessage = typeof errorData === 'object' 
          ? errorData?.error?.message || error.message
          : error.message;
        throw new Error(`Anthropic API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  protected extractContent(response: unknown): string {
    const data = response as {
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    };
    
    // Anthropic returns an array of content blocks
    if (data.content && Array.isArray(data.content)) {
      return data.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('');
    }
    
    return '';
  }

  protected extractUsage(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined {
    const data = response as {
      usage?: {
        input_tokens: number;
        output_tokens: number;
      };
    };
    
    if (!data.usage) return undefined;
    
    return {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    };
  }
}
