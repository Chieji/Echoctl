/**
 * Tests for Provider Chain
 */

import { describe, it, expect } from '@jest/globals';
import { ProviderChain } from '../src/providers/chain.js';

describe('ProviderChain', () => {
  describe('constructor', () => {
    it('should initialize with providers that don\'t require API keys', () => {
      const chain = new ProviderChain({
        openai: undefined,
        gemini: undefined,
        anthropic: undefined,
        qwen: undefined,
        ollama: { apiKey: '', model: 'llama2' }, // Ollama doesn't need API key
        deepseek: undefined,
        kimi: undefined,
        groq: undefined,
        openrouter: undefined,
        together: undefined,
        modelscope: undefined,
        mistral: undefined,
        huggingface: undefined,
        github: undefined,
        smart: undefined,
      });

      // Ollama should be available since it doesn't need an API key
      expect(chain.isProviderAvailable('ollama')).toBe(true);
    });

    it('should return empty for all undefined providers', () => {
      const chain = new ProviderChain({
        openai: undefined,
        gemini: undefined,
        anthropic: undefined,
        qwen: undefined,
        ollama: undefined,
        deepseek: undefined,
        kimi: undefined,
        groq: undefined,
        openrouter: undefined,
        together: undefined,
        modelscope: undefined,
        mistral: undefined,
        huggingface: undefined,
        github: undefined,
        smart: undefined,
      });

      // All providers should be unavailable without API keys
      expect(chain.getConfiguredProviders()).toEqual([]);
    });
  });

  describe('isProviderAvailable', () => {
    it('should return false for unconfigured provider', () => {
      const chain = new ProviderChain({
        openai: undefined,
        gemini: undefined,
        anthropic: undefined,
        qwen: undefined,
        ollama: undefined,
        deepseek: undefined,
        kimi: undefined,
        groq: undefined,
        openrouter: undefined,
        together: undefined,
        modelscope: undefined,
        mistral: undefined,
        huggingface: undefined,
        github: undefined,
        smart: undefined,
      });

      expect(chain.isProviderAvailable('openai')).toBe(false);
    });
  });
});
