/**
 * Google Gemini Provider
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

export class GeminiProvider extends BaseProvider {
  readonly name = "gemini";
  readonly displayName = "Google Gemini";
  readonly info: ProviderInfo = {
    name: "gemini",
    displayName: "Google Gemini",
    supportsChat: true,
    supportsEmbeddings: true,
    supportsVision: true,
    supportsTools: true,
    envVar: "GOOGLE_API_KEY",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
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

    const response = await fetch(
      `${this.info.baseUrl}/models?key=${this.apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = (await response.json()) as {
      models: Array<{
        name: string;
        displayName?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    return data.models
      .filter((m) =>
        m.supportedGenerationMethods?.includes("generateContent")
      )
      .map((m) => ({
        id: m.name.replace("models/", ""),
        name: m.displayName || m.name,
        provider: this.name,
        supportsChat: true,
        supportsEmbeddings: m.supportedGenerationMethods?.includes("embedContent") || false,
        supportsVision: true,
        supportsTools: true,
      }));
  }

  async chat(messages: ChatMessage[], model?: string): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    const modelId = model || "gemini-2.5-flash";

    // Convert messages to Gemini format
    const systemInstruction = messages.find((m) => m.role === "system");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = { contents };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
    }

    const response = await fetch(
      `${this.info.baseUrl}/models/${modelId}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat request failed: ${response.status} — ${error}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };

    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join("") || "";

    return {
      content: text,
      model: modelId,
      provider: this.name,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }

  async embeddings(input: string[]): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    const model = "text-embedding-004";
    const embeddings: number[][] = [];

    for (const text of input) {
      const response = await fetch(
        `${this.info.baseUrl}/models/${model}:embedContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${model}`,
            content: { parts: [{ text }] },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        throw new Error(`Embeddings request failed: ${response.status}`);
      }

      const data = (await response.json()) as { embedding: { values: number[] } };
      embeddings.push(data.embedding.values);
    }

    return {
      embeddings,
      model,
      provider: this.name,
    };
  }

  async validateCredentials(apiKey: string): Promise<ValidationResult> {
    try {
      const response = await fetch(
        `${this.info.baseUrl}/models?key=${apiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 400 || response.status === 401 || response.status === 403) {
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
