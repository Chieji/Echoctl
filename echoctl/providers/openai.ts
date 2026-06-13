/**
 * OpenAI Provider
 */

import {
  BaseProvider,
  type ChatMessage,
  type ChatResponse,
  type EmbeddingResponse,
  type ModelInfo,
  type ProviderInfo,
  type ValidationResult,
} from "./base.js";

export class OpenAIProvider extends BaseProvider {
  readonly name = "openai";
  readonly displayName = "OpenAI";
  readonly info: ProviderInfo = {
    name: "openai",
    displayName: "OpenAI",
    supportsChat: true,
    supportsEmbeddings: true,
    supportsVision: true,
    supportsTools: true,
    envVar: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    modelsEndpoint: "/models",
  };

  private apiKey: string | null = null;

  async authenticate(apiKey: string): Promise<ValidationResult> {
    this.apiKey = apiKey;
    return this.validateCredentials(apiKey);
  }

  async listModels(): Promise<ModelInfo[]> {
    if (!this.apiKey) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    const response = await fetch(`${this.info.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { data: Array<{ id: string }> };

    return data.data
      .filter((m) => m.id.startsWith("gpt") || m.id.startsWith("o"))
      .map((m) => ({
        id: m.id,
        name: m.id,
        provider: this.name,
        supportsChat: true,
        supportsEmbeddings: false,
        supportsVision: m.id.includes("vision") || m.id.includes("gpt-4"),
        supportsTools: true,
      }));
  }

  async chat(messages: ChatMessage[], model?: string): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    const response = await fetch(`${this.info.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat request failed: ${response.status} — ${error}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content || "",
      model: data.model,
      provider: this.name,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async embeddings(input: string[]): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    const response = await fetch(`${this.info.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Embeddings request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
      model: string;
    };

    return {
      embeddings: data.data.map((d) => d.embedding),
      model: data.model,
      provider: this.name,
    };
  }

  async validateCredentials(apiKey: string): Promise<ValidationResult> {
    try {
      const response = await fetch(`${this.info.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: "Invalid API key" };
      }

      return {
        valid: false,
        error: `Provider returned ${response.status}`,
        isNetworkError: response.status >= 500,
      };
    } catch (err) {
      return {
        valid: false,
        error: `Network error: ${(err as Error).message}`,
        isNetworkError: true,
      };
    }
  }
}
