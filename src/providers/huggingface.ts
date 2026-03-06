/**
 * Hugging Face Inference API Provider
 * https://huggingface.co
 */

import axios, { AxiosError } from 'axios';
import { BaseProvider } from './base.js';
import { Message, ProviderName, ProviderResponse } from '../types/index.js';

export class HuggingFaceProvider extends BaseProvider {
  readonly name: ProviderName = 'huggingface';
  private readonly defaultModel = 'mistralai/Mistral-7B-Instruct-v0.3';

  constructor(apiKey: string, model?: string) {
    super(apiKey, model || 'mistralai/Mistral-7B-Instruct-v0.3', 'https://api-inference.huggingface.co');
  }

  async generateResponse(messages: Message[], context?: string): Promise<ProviderResponse> {
    const modelUrl = `${this.baseUrl}/models/${this.model}`;

    // Format messages for HF chat template
    const formattedPrompt = this.formatChatPrompt(messages, context);

    try {
      const response = await axios.post(
        modelUrl,
        {
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 4096,
            temperature: 0.7,
            return_full_text: false,
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
        usage: this.extractUsage(),
        model: this.model,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Hugging Face API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  private formatChatPrompt(messages: Message[], context?: string): string {
    let prompt = '';
    
    if (context) {
      prompt += `System: ${context}\n`;
    }
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }
    
    prompt += 'Assistant:';
    return prompt;
  }

  protected extractContent(response: unknown): string {
    const data = response as Array<{ generated_text?: string }>;
    return data?.[0]?.generated_text || '';
  }

  protected extractUsage(): undefined {
    // HF Inference API doesn't return token usage
    return undefined;
  }
}
