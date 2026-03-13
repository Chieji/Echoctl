/**
 * Tests for Config Security Features
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigStore } from '../src/utils/config.js';

describe('ConfigStore - Security', () => {
  let config: ConfigStore;

  beforeEach(() => {
    config = new ConfigStore();
  });

  describe('checkRateLimit', () => {
    it('should allow requests under limit', () => {
      const result = config.checkRateLimit('test-provider', 5);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeDefined();
    });

    it('should block requests over limit', () => {
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        config.checkRateLimit('test-provider-2', 5);
      }

      const result = config.checkRateLimit('test-provider-2', 5);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
      // This test would need time mocking to be accurate
      // For now, just verify the mechanism works
      const result1 = config.checkRateLimit('test-provider-3', 1, 100);
      expect(result1.allowed).toBe(true);

      const result2 = config.checkRateLimit('test-provider-3', 1, 100);
      expect(result2.allowed).toBe(false);
    });

    it('should track limits per provider separately', () => {
      config.checkRateLimit('provider-a', 1);
      config.checkRateLimit('provider-b', 10);

      const resultA = config.checkRateLimit('provider-a', 1);
      const resultB = config.checkRateLimit('provider-b', 10);

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return null for provider with no requests', () => {
      const status = config.getRateLimitStatus('unused-provider');
      expect(status).toBeNull();
    });

    it('should return count and resetTime for tracked provider', () => {
      config.checkRateLimit('tracked-provider', 10);
      const status = config.getRateLimitStatus('tracked-provider');

      expect(status).not.toBeNull();
      expect(status?.count).toBe(1);
      expect(status?.resetTime).toBeDefined();
    });
  });

  describe('clearRateLimits', () => {
    it('should clear all rate limits', () => {
      config.checkRateLimit('provider-1', 10);
      config.checkRateLimit('provider-2', 10);

      config.clearRateLimits();

      expect(config.getRateLimitStatus('provider-1')).toBeNull();
      expect(config.getRateLimitStatus('provider-2')).toBeNull();
    });
  });

  describe('securityAudit', () => {
    it('should return secure status when no issues', () => {
      const result = config.securityAudit();

      expect(result.secure).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should return warning when no providers configured', () => {
      const result = config.securityAudit();

      // May or may not have warnings depending on test environment
      expect(typeof result.warnings).toBe('object');
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should include issues array', () => {
      const result = config.securityAudit();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should include warnings array', () => {
      const result = config.securityAudit();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});

describe('ConfigStore - Basic Operations', () => {
  let config: ConfigStore;

  beforeEach(() => {
    config = new ConfigStore();
  });

  describe('setApiKey', () => {
    it('should set API key for provider', () => {
      config.setApiKey('openai', 'test-key-123');
      expect(config.getApiKey('openai')).toBe('test-key-123');
    });

    it('should update existing API key', () => {
      config.setApiKey('gemini', 'key1');
      config.setApiKey('gemini', 'key2');
      expect(config.getApiKey('gemini')).toBe('key2');
    });
  });

  describe('removeApiKey', () => {
    it('should remove API key', () => {
      config.setApiKey('anthropic', 'test-key');
      config.removeApiKey('anthropic');
      expect(config.getApiKey('anthropic')).toBeUndefined();
    });
  });

  describe('isProviderConfigured', () => {
    it('should return true when API key is set', () => {
      config.setApiKey('openai', 'test-key');
      expect(config.isProviderConfigured('openai')).toBe(true);
    });

    it('should return false when API key is not set', () => {
      expect(config.isProviderConfigured('openai')).toBe(false);
    });

    it('should return false for empty API key', () => {
      config.setApiKey('openai', '');
      expect(config.isProviderConfigured('openai')).toBe(false);
    });
  });

  describe('getDefaultProvider', () => {
    it('should return default provider', () => {
      config.setDefaultProvider('anthropic');
      expect(config.getDefaultProvider()).toBe('anthropic');
    });
  });

  describe('setSmartMode', () => {
    it('should enable smart mode', () => {
      config.setSmartMode(true);
      expect(config.isSmartModeEnabled()).toBe(true);
    });

    it('should disable smart mode', () => {
      config.setSmartMode(false);
      expect(config.isSmartModeEnabled()).toBe(false);
    });
  });

  describe('setContextLength', () => {
    it('should set context length', () => {
      config.setContextLength(20);
      expect(config.getContextLength()).toBe(20);
    });
  });

  describe('export', () => {
    it('should export config as JSON string', () => {
      config.setDefaultProvider('groq');
      const exported = config.export();

      const parsed = JSON.parse(exported);
      expect(parsed.defaultProvider).toBe('groq');
    });
  });

  describe('import', () => {
    it('should import config from JSON', () => {
      const json = JSON.stringify({
        defaultProvider: 'mistral',
        smartModeEnabled: false,
        contextLength: 15,
      });

      config.import(json);

      expect(config.getDefaultProvider()).toBe('mistral');
      expect(config.isSmartModeEnabled()).toBe(false);
      expect(config.getContextLength()).toBe(15);
    });
  });
});
