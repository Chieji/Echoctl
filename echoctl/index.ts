/**
 * EchoCTL — Multi-Provider AI CLI
 *
 * Main entry point for programmatic usage.
 */

export { registerAllProviders, registry } from "./providers/index.js";
export { BaseProvider } from "./providers/base.js";
export type {
  ChatMessage,
  ChatResponse,
  EmbeddingResponse,
  ModelInfo,
  ProviderInfo,
  ValidationResult,
} from "./providers/base.js";

export { AuthManager } from "./auth/index.js";
export { CredentialStorage } from "./auth/index.js";
export { SessionManager } from "./auth/index.js";

export { ModelDiscovery } from "./models/index.js";
export { ChatRouter } from "./router/index.js";
export { loadConfig, saveConfig, updateConfig } from "./config/index.js";
