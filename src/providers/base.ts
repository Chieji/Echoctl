/**
 * Base Provider interface and abstract class
 */

import { IProvider, Message, ProviderName, ProviderResponse } from '../types/index.js';

/**
 * Abstract base class for all AI providers
 */
export abstract class BaseProvider implements IProvider {
  abstract readonly name: ProviderName;
  protected apiKey: string;
  protected model: string;
  protected baseUrl?: string;

  constructor(apiKey: string, model: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  abstract generateResponse(messages: Message[], context?: string): Promise<ProviderResponse>;

  /**
   * Optional streaming response implementation.
   * If not overridden, falls back to standard generateResponse and fires chunk once.
   */
  async generateStream(messages: Message[], context?: string, onChunk?: (chunk: string) => void): Promise<ProviderResponse> {
    const response = await this.generateResponse(messages, context);
    if (onChunk) {
      onChunk(response.content);
    }
    return response;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  getModel(): string {
    return this.model;
  }

  /**
   * Format messages for API consumption
   */
  protected formatMessages(messages: Message[]): unknown[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Extract content from provider-specific response
   */
  protected abstract extractContent(response: unknown): string;

  /**
   * Extract usage from provider-specific response
   */
  protected abstract extractUsage(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined;
}
