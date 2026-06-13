/**
 * DeepSeek Provider
 *
 * DeepSeek uses an OpenAI-compatible API format.
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

export class DeepSeekProvider extends BaseProvider {
  readonly name = "deepseek";
  readonly displayName = "DeepSeek";
  readonly info: ProviderInfo = {
    name: "deepseek",
    displayName: "DeepSeek",
    supportsChat: true,
    supportsEmbeddings: false,
    supportsVision: false,
    supportsTools: true,
    envVar: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com/v1",
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
      return this.getKnownModels();
    }

    const data = (await response.json()) as { data: Array<{ id: string }> };

    return data.data.map((m) => ({
      id: m.id,
      name: m.id,
      provider: this.name,
      supportsChat: true,
      supportsEmbeddings: false,
      supportsVision: false,
      supportsTools: true,
    }));
  }

  private getKnownModels(): ModelInfo[] {
    return [
      { id: "deepseek-chat", name: "DeepSeek Chat", provider: this.name, supportsChat: true, supportsEmbeddings: false, supportsVision: false, supportsTools: true },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner", provider: this.name, supportsChat: true, supportsEmbeddings: false, supportsVision: false, supportsTools: true },
    ];
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
        model: model || "deepseek-chat",
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

  async embeddings(_input: string[]): Promise<EmbeddingResponse> {
    throw new Error("DeepSeek does not currently support embeddings.");
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
