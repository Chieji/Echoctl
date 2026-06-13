/**
 * Base Provider Interface
 *
 * Every provider implements this interface so model routing is provider-agnostic.
 * New providers can be added by implementing BaseProvider and registering via the registry.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  supportsChat: boolean;
  supportsEmbeddings: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  contextWindow?: number;
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  supportsChat: boolean;
  supportsEmbeddings: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  envVar: string;
  baseUrl: string;
  modelsEndpoint: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  isNetworkError?: boolean;
}

export abstract class BaseProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly info: ProviderInfo;

  /**
   * Authenticate with the provider using the given API key.
   * Returns true if authentication was successful.
   */
  abstract authenticate(apiKey: string): Promise<ValidationResult>;

  /**
   * List available models from this provider.
   */
  abstract listModels(): Promise<ModelInfo[]>;

  /**
   * Send a chat completion request.
   */
  abstract chat(
    messages: ChatMessage[],
    model?: string
  ): Promise<ChatResponse>;

  /**
   * Generate embeddings for the given input.
   * Throws if the provider does not support embeddings.
   */
  abstract embeddings(input: string[]): Promise<EmbeddingResponse>;

  /**
   * Validate stored credentials are still valid.
   */
  abstract validateCredentials(apiKey: string): Promise<ValidationResult>;

  /**
   * Refresh token — no-op for static API key providers.
   * Required for future OAuth-based providers (GitHub Models, Azure, Google OAuth).
   */
  async refreshToken(_apiKey: string): Promise<string | null> {
    // No-op for static-key providers
    return null;
  }
}
