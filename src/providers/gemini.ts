/**
 * Google Gemini Provider Implementation
 */

import axios, { AxiosError } from 'axios';
import { BaseProvider } from './base.js';
import { Message, ProviderName, ProviderResponse } from '../types/index.js';

export class GeminiProvider extends BaseProvider {
  readonly name: ProviderName = 'gemini';
  private readonly defaultModel = 'gemini-1.5-flash';

  constructor(apiKey: string, model?: string) {
    super(apiKey, model || 'gemini-1.5-flash', 'https://generativelanguage.googleapis.com');
  }

  async generateResponse(messages: Message[], context?: string): Promise<ProviderResponse> {
    const model = this.model || this.defaultModel;
    const url = `${this.baseUrl}/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    // Convert messages to Gemini format
    const systemInstruction = context 
      ? { role: 'user', parts: [{ text: `System: ${context}` }] }
      : null;

    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const contentParts = systemInstruction 
      ? [systemInstruction, ...geminiMessages]
      : geminiMessages;

    try {
      const response = await axios.post(
        url,
        {
          contents: contentParts,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      return {
        content: this.extractContent(response.data),
        usage: this.extractUsage(response.data),
        model: model,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        const errorMessage = typeof errorData === 'object' 
          ? errorData?.error?.message || error.message
          : error.message;
        throw new Error(`Gemini API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  protected extractContent(response: unknown): string {
    const data = response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  protected extractUsage(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined {
    const data = response as {
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };
    
    if (!data.usageMetadata) return undefined;
    
    return {
      promptTokens: data.usageMetadata.promptTokenCount || 0,
      completionTokens: data.usageMetadata.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata.totalTokenCount || 0,
    };
  }
}
