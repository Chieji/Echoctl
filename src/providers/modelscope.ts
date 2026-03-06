/**
 * ModelScope Provider (Alibaba)
 * https://modelscope.cn
 */

import axios, { AxiosError } from 'axios';
import { BaseProvider } from './base.js';
import { Message, ProviderName, ProviderResponse } from '../types/index.js';

export class ModelScopeProvider extends BaseProvider {
  readonly name: ProviderName = 'modelscope';
  private readonly defaultModel = 'qwen-turbo';

  constructor(apiKey: string, model?: string) {
    super(apiKey, model || 'qwen-turbo', 'https://dashscope.aliyuncs.com/api/v1');
  }

  async generateResponse(messages: Message[], context?: string): Promise<ProviderResponse> {
    const url = `${this.baseUrl}/services/aigc/text-generation/generation`;

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
          input: { messages: formattedMessages },
          parameters: {
            result_format: 'message',
          },
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
        model: response.data.output?.model || this.model,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`ModelScope API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  protected extractContent(response: unknown): string {
    const data = response as {
      output?: {
        choices?: Array<{
          message?: { content?: string };
        }>;
      };
    };
    
    return data.output?.choices?.[0]?.message?.content || '';
  }

  protected extractUsage(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined {
    const data = response as {
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
      };
    };
    
    if (!data.usage) return undefined;
    
    return {
      promptTokens: data.usage.input_tokens || 0,
      completionTokens: data.usage.output_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    };
  }
}
