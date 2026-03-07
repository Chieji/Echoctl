/**
 * Tests for Auth Sync module
 */

import { describe, it, expect } from '@jest/globals';
import { AutoAuthSync } from '../src/auth/sync.js';

describe('AutoAuthSync', () => {
  describe('syncGoogleCredentials', () => {
    it('should return null when gcloud is not installed', async () => {
      const result = await AutoAuthSync.syncGoogleCredentials();
      expect(result).toBeNull();
    });
  });

  describe('syncQwenCredentials', () => {
    it('should return null when Aliyun config does not exist', async () => {
      const result = await AutoAuthSync.syncQwenCredentials();
      expect(result).toBeNull();
    });
  });

  describe('syncAllCredentials', () => {
    it('should return an object with credential fields', async () => {
      const result = await AutoAuthSync.syncAllCredentials();
      expect(result).toHaveProperty('google');
      expect(result).toHaveProperty('qwen');
      expect(result).toHaveProperty('ollama');
      expect(result).toHaveProperty('openai');
      expect(result).toHaveProperty('anthropic');
      expect(result).toHaveProperty('gemini');
    });
  });
});
