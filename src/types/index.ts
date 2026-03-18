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
  imageUrl?: string; // Base64 or URL for vision tasks
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
  tokenCount?: number;
}

/**
 * Database structure for session storage
 */
export interface SessionDatabase {
  sessions: Session[];
  currentSessionId: string | null;
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
   * Generate a streaming response from the provider
   */
  generateStream?(messages: Message[], context?: string, onChunk?: (chunk: string) => void): Promise<ProviderResponse>;
  
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
 * External storage configuration (Box.com)
 */
export interface BoxConfig {
  developerToken?: string;
  clientId?: string;
  clientSecret?: string;
  folderId?: string;
  enabled: boolean;
}

/**
 * GitHub configuration for collaboration
 */
export interface GithubConfig {
  token?: string;
  username?: string;
  enabled: boolean;
}

/**
 * Mount source (local folder or URL)
 */
export interface MountSource {
  id: string;
  name: string;
  type: 'local' | 'web';
  path: string;
  enabled: boolean;
  description?: string;
  lastIndexedAt?: number;
}

/**
 * Configuration storage structure
 */
export interface AppConfig {
  providers: {
    openai?: ProviderConfig;
    gemini?: ProviderConfig;
    anthropic?: ProviderConfig;
    qwen?: ProviderConfig;
    ollama?: ProviderConfig;
    deepseek?: ProviderConfig;
    kimi?: ProviderConfig;
    groq?: ProviderConfig;
    openrouter?: ProviderConfig;
    together?: ProviderConfig;
    modelscope?: ProviderConfig;
    mistral?: ProviderConfig;
    huggingface?: ProviderConfig;
    github?: ProviderConfig;
  };
  box?: BoxConfig;
  github?: GithubConfig;
  mounts?: MountSource[];
  defaultProvider: ProviderName;
  smartModeEnabled: boolean;
  contextLength: number;
}

/**
 * Structured NLU Intent
 */
export interface Intent {
  goal: string;
  action: string;
  entities: Record<string, string>;
  confidence: number;
}

// Note: SessionDatabase is now the primary database interface (see above)
// Database interface kept for backward compatibility with memory.ts
export type Database = SessionDatabase;
