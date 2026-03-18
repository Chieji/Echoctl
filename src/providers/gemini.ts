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

    const geminiMessages = messages.map(msg => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.imageUrl && msg.imageUrl.startsWith('data:image/')) {
        const [mimePart, base64Data] = msg.imageUrl.split(';base64,');
        const mimeType = mimePart.replace('data:', '');
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

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

  async generateStream(messages: Message[], context?: string, onChunk?: (chunk: string) => void): Promise<ProviderResponse> {
    const model = this.model || this.defaultModel;
    const url = `${this.baseUrl}/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const systemInstruction = context 
      ? { role: 'user', parts: [{ text: `System: ${context}` }] }
      : null;

    const geminiMessages = messages.map(msg => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.imageUrl && msg.imageUrl.startsWith('data:image/')) {
        const [mimePart, base64Data] = msg.imageUrl.split(';base64,');
        const mimeType = mimePart.replace('data:', '');
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

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
          responseType: 'stream',
          timeout: 60000,
        }
      );

      let fullContent = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString('utf8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (!data || data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) {
                  fullContent += text;
                  if (onChunk) onChunk(text);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        });

        response.data.on('end', () => {
          resolve({
            content: fullContent,
            model: model,
          });
        });

        response.data.on('error', (err: any) => {
          reject(new Error(`Gemini stream error: ${err.message}`));
        });
      });

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
