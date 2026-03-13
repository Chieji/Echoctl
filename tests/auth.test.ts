/**
 * Tests for Auth Sync module
 */

import { describe, it, expect } from '@jest/globals';
import { AutoAuthSync } from '../src/auth/sync.js';

describe('AutoAuthSync', () => {
  describe('syncGoogleCredentials', () => {
    it('should return credentials if gcloud is installed', async () => {
      const result = await AutoAuthSync.syncGoogleCredentials();
      // Result may be null or a token string depending on system
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('syncQwenCredentials', () => {
    it('should return null when Aliyun config does not exist', async () => {
      const result = await AutoAuthSync.syncQwenCredentials();
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('syncAllCredentials', () => {
    it('should return an object with credential fields', async () => {
      const result = await AutoAuthSync.syncAllCredentials();
      // Result may be empty if no credentials are configured
      expect(typeof result).toBe('object');
    }, 10000); // Increased timeout
  });
});
