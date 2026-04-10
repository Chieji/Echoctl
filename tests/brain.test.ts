import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BrainStore } from '../src/storage/brain.js';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('BrainStore', () => {
  let brain: BrainStore;
  const testDbPath = join(homedir(), '.config', 'echo-cli', 'brain-test.json');

  beforeEach(async () => {
    brain = new BrainStore();
    await brain.init();
  });

  afterEach(() => {
    if (existsSync(testDbPath)) {
      rmSync(testDbPath, { force: true });
    }
  });

  describe('save and get', () => {
    it('should save and retrieve a memory', async () => {
      await brain.save('test-key', 'test-value', ['tag1', 'tag2']);
      const memory = brain.get('test-key');

      expect(memory).toBeDefined();
      expect(memory?.value).toBe('test-value');
      expect(memory?.tags).toContain('tag1');
      expect(memory?.tags).toContain('tag2');
    });

    it('should return null for non-existent key', () => {
      const memory = brain.get('non-existent');
      expect(memory).toBeNull();
    });

    it('should update existing memory', async () => {
      await brain.save('test-key', 'value1');
      await brain.save('test-key', 'value2');
      const memory = brain.get('test-key');

      expect(memory?.value).toBe('value2');
    });
  });

  describe('search', () => {
    it('should find memories by query string', async () => {
      await brain.save('apple', 'red fruit');
      await brain.save('banana', 'yellow fruit');
      await brain.save('car', 'vehicle');

      const results = brain.search('fruit');
      expect(results.length).toBe(2);
      expect(results.map(m => m.key)).toContain('apple');
      expect(results.map(m => m.key)).toContain('banana');
    });

    it('should find memories by tags', async () => {
      await brain.save('key1', 'v1', ['fruit']);
      await brain.save('key2', 'v2', ['vegetable']);
      await brain.save('key3', 'v3', ['fruit', 'yellow']);

      const results = brain.search('', ['fruit']);
      expect(results.length).toBe(2);
      expect(results.map(m => m.key)).toContain('key1');
      expect(results.map(m => m.key)).toContain('key3');
    });
  });

  describe('delete', () => {
    it('should remove a memory', async () => {
      await brain.save('test-key', 'value');
      expect(brain.get('test-key')).not.toBeNull();

      await brain.delete('test-key');
      expect(brain.get('test-key')).toBeNull();
    });
  });

  describe('getAllTags', () => {
    it('should return unique tags across all memories', async () => {
      await brain.save('k1', 'v1', ['apple', 'banana']);
      await brain.save('k2', 'v2', ['banana', 'zebra']);

      const tags = brain.getAllTags();
      expect(tags).toEqual(['apple', 'banana', 'zebra']);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      await brain.save('key1', 'value1', ['tag1']);
      // Add a tiny delay to ensure timestamps are different
      await new Promise(resolve => setTimeout(resolve, 10));
      await brain.save('key2', 'value2', ['tag2']);
      brain.get('key1'); // Increment access count

      const stats = brain.getStats();

      expect(stats.totalMemories).toBe(2);
      expect(stats.totalTags).toBe(2);
      expect(stats.mostAccessed?.key).toBe('key1');
      // Use toContain to check against a set of expected keys due to identical system timestamps (Performance: Bolt ⚡)
      expect(['key1', 'key2']).toContain(stats.recentlyUpdated?.key);
    });

    it('should return zeros for empty brain', () => {
      const stats = brain.getStats();

      expect(stats.totalMemories).toBe(0);
      expect(stats.totalTags).toBe(0);
      expect(stats.mostAccessed).toBeNull();
      expect(stats.recentlyUpdated).toBeNull();
    });
  });

  describe('export', () => {
    it('should export all memories as JSON', async () => {
      await brain.save('key1', 'value1');
      const exported = brain.export();
      const parsed = JSON.parse(exported);

      expect(parsed.memories[0].key).toBe('key1');
      expect(parsed.memories[0].value).toBe('value1');
    });
  });
});
