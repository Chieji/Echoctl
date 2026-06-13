/**
 * Provider Index
 *
 * Registers all built-in providers with the registry.
 */

export { BaseProvider } from "./base.js";
export type {
  ChatMessage,
  ChatResponse,
  EmbeddingResponse,
  ModelInfo,
  ProviderInfo,
  ValidationResult,
} from "./base.js";
export { registry, ProviderRegistry } from "./registry.js";

// Provider implementations
export { OpenAIProvider } from "./openai.js";
export { AnthropicProvider } from "./anthropic.js";
export { GroqProvider } from "./groq.js";
export { OpenRouterProvider } from "./openrouter.js";
export { GeminiProvider } from "./gemini.js";
export { MistralProvider } from "./mistral.js";
export { DeepSeekProvider } from "./deepseek.js";
export { FireworksProvider } from "./fireworks.js";
export { TogetherProvider } from "./together.js";

// Register all built-in providers
import { registry } from "./registry.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { GroqProvider } from "./groq.js";
import { OpenRouterProvider } from "./openrouter.js";
import { GeminiProvider } from "./gemini.js";
import { MistralProvider } from "./mistral.js";
import { DeepSeekProvider } from "./deepseek.js";
import { FireworksProvider } from "./fireworks.js";
import { TogetherProvider } from "./together.js";

export function registerAllProviders(): void {
  registry.register(new OpenAIProvider());
  registry.register(new AnthropicProvider());
  registry.register(new GroqProvider());
  registry.register(new OpenRouterProvider());
  registry.register(new GeminiProvider());
  registry.register(new MistralProvider());
  registry.register(new DeepSeekProvider());
  registry.register(new FireworksProvider());
  registry.register(new TogetherProvider());
}
