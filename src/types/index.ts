/**
 * Core type definitions for Echo CLI
 */

/**
 * Supported AI providers
 */
export type ProviderName = 'openai' | 'gemini' | 'anthropic' | 'qwen' | 'ollama' | 'deepseek' | 'kimi' | 'groq' | 'openrouter' | 'together' | 'modelscope' | 'mistral' | 'huggingface' | 'github' | 'smart';

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Single message in conversation history
 */
export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

/**
 * Session representation
 */
export interface Session {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  provider: ProviderName;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Provider response structure
 */
export interface ProviderResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

/**
 * Provider interface - all providers must implement this
 */
export interface IProvider {
  name: ProviderName;
  
  /**
   * Generate a response from the provider
   */
  generateResponse(messages: Message[], context?: string): Promise<ProviderResponse>;
  
  /**
   * Check if provider is configured and available
   */
  isConfigured(): boolean;
  
  /**
   * Get the model name being used
   */
  getModel(): string;
}

/**
 * Provider chain result with failover info
 */
export interface ChainResult {
  response: ProviderResponse;
  provider: ProviderName;
  failoverOccurred: boolean;
  attempts: ProviderName[];
}

/**
 * Smart mode task classification
 */
export type TaskType = 'code' | 'creative' | 'nuance' | 'general';

/**
 * Configuration storage structure
 */
export interface AppConfig {
  providers: {
    openai?: ProviderConfig;
    gemini?: ProviderConfig;
    anthropic?: ProviderConfig;
  };
  defaultProvider: ProviderName;
  smartModeEnabled: boolean;
  contextLength: number;
}

/**
 * Database structure for lowdb
 */
export interface Database {
  sessions: Session[];
  currentSessionId: string | null;
}
