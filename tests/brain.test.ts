/**
 * Tests for Brain (Second Brain) Storage Module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BrainStore } from '../src/storage/brain.js';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

const TEST_BRAIN_FILE = join(homedir(), '.config', 'echo-cli', 'brain-test.json');

describe('BrainStore', () => {
  let brain: BrainStore;

  beforeEach(async () => {
    brain = new BrainStore();
    await brain.init();
    // Clean up any test data from previous runs
    const testKeys = ['test-key', 'test-key-1', 'test-key-2', 'another-key', 'my-key', 
                      'javascript-tips', 'python-tips', 'general-knowledge', 'key1', 
                      'key2', 'key3', 'key4', 'to-delete', 'existing-key',
                      'imported1', 'imported2'];
    for (const key of testKeys) {
      await brain.delete(key);
    }
  });

  afterEach(async () => {
    // Cleanup after each test
    const testKeys = ['test-key', 'test-key-1', 'test-key-2', 'another-key', 'my-key', 
                      'javascript-tips', 'python-tips', 'general-knowledge', 'key1', 
                      'key2', 'key3', 'key4', 'to-delete', 'existing-key',
                      'imported1', 'imported2'];
    for (const key of testKeys) {
      await brain.delete(key);
    }
  });

  describe('save', () => {
    it('should save a new memory', async () => {
      const memory = await brain.save('test-key', 'test-value', ['tag1', 'tag2']);

      expect(memory.id).toBeDefined();
      expect(memory.key).toBe('test-key');
      expect(memory.value).toBe('test-value');
      expect(memory.tags).toEqual(['tag1', 'tag2']);
      expect(memory.accessCount).toBe(0);
    });

    it('should update existing memory with same key', async () => {
      await brain.save('test-key', 'value1');
      const updated = await brain.save('test-key', 'value2', ['new-tag']);

      expect(updated.value).toBe('value2');
      expect(updated.tags).toEqual(['new-tag']);

      const retrieved = brain.get('test-key');
      expect(retrieved?.value).toBe('value2');
    });

    it('should handle case-insensitive keys', async () => {
      await brain.save('Test-Key', 'value1');
      const updated = await brain.save('test-key', 'value2');

      expect(updated.value).toBe('value2');
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const result = brain.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return memory by key', async () => {
      await brain.save('my-key', 'my-value', ['my-tag']);
      const result = brain.get('my-key');

      expect(result?.key).toBe('my-key');
      expect(result?.value).toBe('my-value');
      expect(result?.tags).toEqual(['my-tag']);
    });

    it('should increment access count on get', async () => {
      await brain.save('test-key', 'value');
      
      brain.get('test-key');
      brain.get('test-key');

      const result = brain.get('test-key');
      expect(result?.accessCount).toBe(3);
    });
  });

  describe('getValue', () => {
    it('should return just the value string', async () => {
      await brain.save('key', 'the-value');
      const value = brain.getValue('key');

      expect(value).toBe('the-value');
    });

    it('should return null for non-existent key', () => {
      expect(brain.getValue('non-existent')).toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Clean up first
      await brain.delete('javascript-tips');
      await brain.delete('python-tips');
      await brain.delete('general-knowledge');
      
      await brain.save('javascript-tips', 'Use const for constants', ['javascript', 'coding']);
      await brain.save('python-tips', 'Use list comprehensions', ['python', 'coding']);
      await brain.save('general-knowledge', 'The sky is blue', ['general']);
    });

    afterEach(async () => {
      await brain.delete('javascript-tips');
      await brain.delete('python-tips');
      await brain.delete('general-knowledge');
    });

    it('should find memories by key match', () => {
      const results = brain.search('javascript');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].key).toContain('javascript');
    });

    it('should find memories by value match', () => {
      const results = brain.search('constants');
      expect(results.some(r => r.value.includes('constants'))).toBe(true);
    });

    it('should find memories by tag match', () => {
      const results = brain.search('coding');
      expect(results.length).toBe(2); // javascript and python both have coding tag
    });

    it('should filter by tags when provided', () => {
      const results = brain.search('', ['python']);
      expect(results.length).toBe(1);
      expect(results[0].key).toBe('python-tips');
    });

    it('should return empty array for no matches', () => {
      const results = brain.search('nonexistent-topic-xyz');
      expect(results).toEqual([]);
    });

    it('should sort by relevance', () => {
      const results = brain.search('javascript');
      // Exact key match should be first
      expect(results[0].key).toBe('javascript-tips');
    });
  });

  describe('getByTag', () => {
    beforeEach(async () => {
      await brain.delete('key1');
      await brain.delete('key2');
      await brain.delete('key3');
      
      await brain.save('key1', 'value1', ['tag-a']);
      await brain.save('key2', 'value2', ['tag-a', 'tag-b']);
      await brain.save('key3', 'value3', ['tag-b']);
    });

    afterEach(async () => {
      await brain.delete('key1');
      await brain.delete('key2');
      await brain.delete('key3');
    });

    it('should return all memories with specified tag', () => {
      const results = brain.getByTag('tag-a');
      expect(results.length).toBe(2);
    });

    it('should return empty array for non-existent tag', () => {
      const results = brain.getByTag('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Clean up first
      for (let i = 1; i <= 4; i++) await brain.delete(`key${i}`);
      await brain.save('key1', 'value1');
      await brain.save('key2', 'value2');
      await brain.save('key3', 'value3');
    });

    afterEach(async () => {
      for (let i = 1; i <= 4; i++) await brain.delete(`key${i}`);
    });

    it('should return all memories', () => {
      const results = brain.list();
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it('should limit results', () => {
      const results = brain.list(2);
      expect(results.length).toBe(2);
    });

    it('should sort by updatedAt descending', async () => {
      await new Promise(r => setTimeout(r, 10));
      await brain.save('key4', 'value4');

      const results = brain.list();
      expect(results[0].key).toBe('key4'); // Most recent first
    });
  });

  describe('delete', () => {
    it('should delete memory by key', async () => {
      await brain.save('to-delete', 'value');
      
      const result = await brain.delete('to-delete');
      expect(result).toBe(true);
      expect(brain.get('to-delete')).toBeNull();
    });

    it('should return false for non-existent key', async () => {
      const result = await brain.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should handle case-insensitive keys', async () => {
      await brain.save('Test-Key', 'value');
      const result = await brain.delete('test-key');
      expect(result).toBe(true);
    });
  });

  describe('getAllTags', () => {
    beforeEach(async () => {
      await brain.delete('key1');
      await brain.delete('key2');
    });

    afterEach(async () => {
      await brain.delete('key1');
      await brain.delete('key2');
    });

    it('should return all unique tags', async () => {
      await brain.save('key1', 'value1', ['tag1', 'tag2']);
      await brain.save('key2', 'value2', ['tag2', 'tag3']);

      const tags = brain.getAllTags();
      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should return empty array when no memories', async () => {
      // Delete all memories first
      const allTags = brain.getAllTags();
      for (const tag of allTags) {
        const memories = brain.getByTag(tag);
        for (const m of memories) {
          await brain.delete(m.key);
        }
      }
      
      const tags = brain.getAllTags();
      expect(tags).toEqual([]);
    });

    it('should return sorted tags', async () => {
      await brain.save('key1', 'value1', ['zebra', 'apple']);
      await brain.save('key2', 'value2', ['banana']);

      const tags = brain.getAllTags();
      expect(tags).toEqual(['apple', 'banana', 'zebra']);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      await brain.save('key1', 'value1', ['tag1']);
      brain.get('key1'); // Increment access count (also updates updatedAt)

      // Add delay to ensure key2 has a strictly later updatedAt
      await new Promise(r => setTimeout(r, 10));
      await brain.save('key2', 'value2', ['tag2']);

      const stats = brain.getStats();

      expect(stats.totalMemories).toBe(2);
      expect(stats.totalTags).toBe(2);
      expect(stats.mostAccessed?.key).toBe('key1');
      expect(stats.recentlyUpdated?.key).toBe('key2');
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
      await brain.save('key1', 'value1', ['tag1']);
      await brain.save('key2', 'value2');

      const exported = brain.export();
      const parsed = JSON.parse(exported);

      expect(parsed.memories).toBeDefined();
      expect(parsed.memories.length).toBe(2);
    });
  });

  describe('import', () => {
    it('should import memories from JSON', async () => {
      const json = JSON.stringify({
        memories: [
          { id: '1', key: 'imported1', value: 'value1', tags: ['tag1'], createdAt: Date.now(), updatedAt: Date.now(), accessCount: 0 },
          { id: '2', key: 'imported2', value: 'value2', tags: [], createdAt: Date.now(), updatedAt: Date.now(), accessCount: 0 },
        ],
      });

      const count = await brain.import(json);
      expect(count).toBe(2);
      expect(brain.get('imported1')).not.toBeNull();
      expect(brain.get('imported2')).not.toBeNull();
    });

    it('should not import duplicate keys', async () => {
      await brain.save('existing-key', 'original-value');

      const json = JSON.stringify({
        memories: [
          { id: '1', key: 'existing-key', value: 'new-value', tags: [], createdAt: Date.now(), updatedAt: Date.now(), accessCount: 0 },
        ],
      });

      const count = await brain.import(json);
      expect(count).toBe(0); // No new imports
      expect(brain.getValue('existing-key')).toBe('original-value');
    });

    it('should throw error for invalid JSON', async () => {
      await expect(brain.import('invalid json')).rejects.toThrow();
    });

    it('should throw error for invalid format', async () => {
      await expect(brain.import('{"not": "memories"}')).rejects.toThrow();
    });
  });
});
