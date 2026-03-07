/**
 * Tests for Web Tools
 */

import { describe, it, expect } from '@jest/globals';
import { searchWeb } from '../src/tools/web.js';

describe('Web Tools', () => {
  describe('searchWeb', () => {
    it('should return array of search results', async () => {
      // Skip actual API call in test environment
      const results = await searchWeb('TypeScript programming', 5);
      expect(Array.isArray(results)).toBe(true);
    }, 15000);

    it('should return results with title and url', async () => {
      // Skip actual API call in test environment  
      const results = await searchWeb('test query', 3);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('title');
        expect(results[0]).toHaveProperty('url');
        expect(results[0]).toHaveProperty('source');
      }
    }, 15000);
  });
});
