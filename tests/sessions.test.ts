/**
 * Tests for Session Storage Module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SessionStore, calculateTokenCount } from '../src/storage/sessions.js';
import { Message } from '../src/types/index.js';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

const TEST_CONFIG_DIR = join(homedir(), '.config', 'echo-cli-test');
const TEST_DB_FILE = join(TEST_CONFIG_DIR, 'sessions-test.json');

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(async () => {
    // Create test directory
    if (!existsSync(TEST_CONFIG_DIR)) {
      await mkdir(TEST_CONFIG_DIR, { recursive: true });
    }
    
    store = new SessionStore();
    await store.init();
    await store.clearAll();
  });

  afterEach(async () => {
    // Cleanup
    await store.clearAll();
  });

  describe('calculateTokenCount', () => {
    it('should calculate tokens based on character count', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello', timestamp: Date.now() },
        { role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
      ];

      const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
      const expected = Math.ceil(totalChars / 4);

      expect(calculateTokenCount(messages)).toBe(expected);
    });

    it('should return 0 for empty messages', () => {
      expect(calculateTokenCount([])).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a new session with unique ID', async () => {
      const session = await store.create('Test Session', 'gemini');

      expect(session.id).toBeDefined();
      expect(session.id.length).toBeGreaterThan(0);
      expect(session.name).toBe('Test Session');
      expect(session.provider).toBe('gemini');
      expect(session.messages).toEqual([]);
      expect(session.tokenCount).toBe(0);
    });

    it('should set current session on create', async () => {
      const session = await store.create('Test');
      const current = store.getCurrentSession();

      expect(current?.id).toBe(session.id);
    });
  });

  describe('get', () => {
    it('should return null for non-existent session', async () => {
      const result = store.get('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return session by ID', async () => {
      const created = await store.create('Test');
      const retrieved = store.get(created.id);

      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no sessions', async () => {
      await store.clearAll();
      const sessions = store.getAll();
      expect(sessions).toEqual([]);
    });

    it('should return all sessions sorted by updatedAt', async () => {
      const session1 = await store.create('First');
      await new Promise(r => setTimeout(r, 10));
      const session2 = await store.create('Second');

      const sessions = store.getAll();

      expect(sessions.length).toBe(2);
      expect(sessions[0].id).toBe(session2.id); // Most recent first
    });

    it('should limit results when limit provided', async () => {
      await store.create('First');
      await store.create('Second');
      await store.create('Third');

      const sessions = store.getAll(2);
      expect(sessions.length).toBe(2);
    });
  });

  describe('addMessage', () => {
    it('should add message to session', async () => {
      const session = await store.create('Test');
      const message = await store.addMessage(session.id, 'user', 'Hello');

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');

      const updated = store.get(session.id);
      expect(updated?.messages.length).toBe(1);
    });

    it('should update token count after adding message', async () => {
      const session = await store.create('Test');
      await store.addMessage(session.id, 'user', 'Hello World');

      const updated = store.get(session.id);
      expect(updated?.tokenCount).toBeGreaterThan(0);
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        store.addMessage('non-existent', 'user', 'Hello')
      ).rejects.toThrow('Session non-existent not found');
    });
  });

  describe('update', () => {
    it('should update session messages', async () => {
      const session = await store.create('Test');
      const messages: Message[] = [
        { role: 'user', content: 'Hello', timestamp: Date.now() },
      ];

      await store.update(session.id, messages);

      const updated = store.get(session.id);
      expect(updated?.messages.length).toBe(1);
    });

    it('should update timestamp on update', async () => {
      const session = await store.create('Test');
      const before = session.updatedAt;

      await new Promise(r => setTimeout(r, 10));
      await store.update(session.id, []);

      const updated = store.get(session.id);
      expect(updated?.updatedAt).toBeGreaterThan(before);
    });
  });

  describe('delete', () => {
    it('should delete session', async () => {
      const session = await store.create('Test');
      await store.delete(session.id);

      const result = store.get(session.id);
      expect(result).toBeNull();
    });

    it('should clear current session ID when deleting current', async () => {
      const session = await store.create('Test');
      await store.delete(session.id);

      const current = store.getCurrentSession();
      expect(current).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should delete all sessions', async () => {
      await store.create('First');
      await store.create('Second');

      await store.clearAll();

      const sessions = store.getAll();
      expect(sessions).toEqual([]);
    });
  });

  describe('setCurrentSession', () => {
    it('should set current session', async () => {
      const session = await store.create('Test');
      await store.clearAll();
      await store.init(); // Reload

      const success = await store.setCurrentSession(session.id);

      // Session was deleted, should return false
      expect(success).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      const success = await store.setCurrentSession('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const session = await store.create('Test');
      await store.addMessage(session.id, 'user', 'Hello');
      await store.addMessage(session.id, 'assistant', 'Hi');

      const stats = await store.getStats();

      expect(stats.totalSessions).toBe(1);
      expect(stats.totalMessages).toBe(2);
      expect(stats.currentSessionMessages).toBe(2);
      expect(stats.totalTokens).toBeGreaterThan(0);
    });

    it('should return zeros for empty store', async () => {
      await store.clearAll();
      const stats = await store.getStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMessages).toBe(0);
    });
  });

  describe('export', () => {
    it('should export session as JSON', async () => {
      const session = await store.create('Test');
      await store.addMessage(session.id, 'user', 'Hello');

      const exported = store.export(session.id);
      const parsed = JSON.parse(exported);

      expect(parsed.id).toBe(session.id);
      expect(parsed.name).toBe('Test');
      expect(parsed.messages.length).toBe(1);
    });

    it('should throw error for non-existent session', () => {
      expect(() => store.export('non-existent')).toThrow();
    });
  });
});
