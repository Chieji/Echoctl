/**
 * Provider factory and exports
 */

export { BaseProvider } from './base.js';
export { OpenAIProvider } from './openai.js';
export { GeminiProvider } from './gemini.js';
export { AnthropicProvider } from './anthropic.js';
export { QwenProvider } from './qwen.js';
export { OllamaProvider } from './ollama.js';
export { DeepSeekProvider } from './deepseek.js';
export { KimiProvider } from './kimi.js';
export { GroqProvider } from './groq.js';
export { OpenRouterProvider } from './openrouter.js';
export { TogetherAIProvider } from './together.js';
export { ModelScopeProvider } from './modelscope.js';
export { MistralProvider } from './mistral.js';
export { HuggingFaceProvider } from './huggingface.js';
export { GitHubModelsProvider } from './github-models.js';
export { ProviderChain, createDefaultChain } from './chain.js';

import { IProvider, ProviderName, ProviderConfig } from '../types/index.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { AnthropicProvider } from './anthropic.js';
import { QwenProvider } from './qwen.js';
import { OllamaProvider } from './ollama.js';
import { DeepSeekProvider } from './deepseek.js';
import { KimiProvider } from './kimi.js';
import { GroqProvider } from './groq.js';
import { OpenRouterProvider } from './openrouter.js';
import { TogetherAIProvider } from './together.js';
import { ModelScopeProvider } from './modelscope.js';
import { MistralProvider } from './mistral.js';
import { HuggingFaceProvider } from './huggingface.js';
import { GitHubModelsProvider } from './github-models.js';

/**
 * Create a provider instance by name
 */
export function createProvider(name: ProviderName, config?: ProviderConfig): IProvider {
  const apiKey = config?.apiKey || '';
  const model = config?.model;
  const baseUrl = config?.baseUrl;

  switch (name) {
    case 'openai':
      return new OpenAIProvider(apiKey, model);
    case 'gemini':
      return new GeminiProvider(apiKey, model);
    case 'anthropic':
      return new AnthropicProvider(apiKey, model);
    case 'qwen':
      return new QwenProvider(apiKey, baseUrl || '', model);
    case 'ollama':
      return new OllamaProvider(baseUrl || 'http://localhost:11434', model);
    case 'deepseek':
      return new DeepSeekProvider(apiKey, model);
    case 'kimi':
      return new KimiProvider(apiKey, model);
    case 'groq':
      return new GroqProvider(apiKey, model);
    case 'openrouter':
      return new OpenRouterProvider(apiKey, model);
    case 'together':
      return new TogetherAIProvider(apiKey, model);
    case 'modelscope':
      return new ModelScopeProvider(apiKey, model);
    case 'mistral':
      return new MistralProvider(apiKey, model);
    case 'huggingface':
      return new HuggingFaceProvider(apiKey, model);
    case 'github':
      return new GitHubModelsProvider(apiKey, model);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

/**
 * Get available providers
 */
export function getAvailableProviders(): ProviderName[] {
  return ['openai', 'gemini', 'anthropic', 'qwen', 'ollama', 'deepseek', 'kimi', 'groq', 'openrouter', 'together', 'modelscope', 'mistral', 'huggingface', 'github'];
}
