/**
 * Anthropic Provider
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

export class AnthropicProvider extends BaseProvider {
  readonly name = "anthropic";
  readonly displayName = "Anthropic";
  readonly info: ProviderInfo = {
    name: "anthropic",
    displayName: "Anthropic",
    supportsChat: true,
    supportsEmbeddings: false,
    supportsVision: true,
    supportsTools: true,
    envVar: "ANTHROPIC_API_KEY",
    baseUrl: "https://api.anthropic.com/v1",
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
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Fallback to known models if the endpoint isn't available
      return this.getKnownModels();
    }

    const data = (await response.json()) as { data: Array<{ id: string; display_name?: string }> };

    return data.data.map((m) => ({
      id: m.id,
      name: m.display_name || m.id,
      provider: this.name,
      supportsChat: true,
      supportsEmbeddings: false,
      supportsVision: true,
      supportsTools: true,
    }));
  }

  private getKnownModels(): ModelInfo[] {
    const models = [
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-3-5-haiku-20241022",
    ];
    return models.map((id) => ({
      id,
      name: id,
      provider: this.name,
      supportsChat: true,
      supportsEmbeddings: false,
      supportsVision: true,
      supportsTools: true,
    }));
  }

  async chat(messages: ChatMessage[], model?: string): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    // Anthropic uses a different message format — separate system from messages
    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const body: Record<string, unknown> = {
      model: model || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: chatMessages,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch(`${this.info.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat request failed: ${response.status} — ${error}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      model: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const textContent = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");

    return {
      content: textContent,
      model: data.model,
      provider: this.name,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  async embeddings(_input: string[]): Promise<EmbeddingResponse> {
    throw new Error("Anthropic does not support embeddings.");
  }

  async validateCredentials(apiKey: string): Promise<ValidationResult> {
    try {
      // Use a minimal messages request to validate the key
      const response = await fetch(`${this.info.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
        signal: AbortSignal.timeout(10000),
      });

      // 200 or 400 (bad request but authenticated) means key is valid
      if (response.ok || response.status === 400) {
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
