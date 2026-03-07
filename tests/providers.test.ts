/**
 * Tests for Provider Chain
 */

import { describe, it, expect } from '@jest/globals';
import { ProviderChain } from '../src/providers/chain.js';

describe('ProviderChain', () => {
  describe('constructor', () => {
    it('should initialize with empty providers when no configs provided', () => {
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
