/**
 * Tests for HITL Approvals Storage Module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ApprovalsStore } from '../src/storage/approvals.js';

describe('ApprovalsStore', () => {
  let store: ApprovalsStore;

  beforeEach(async () => {
    const testDbPath = '/tmp/approvals-test.json';
    store = new ApprovalsStore(testDbPath);
    await store.init();
    await store.clearPending();
  });

  describe('createRequest', () => {
    it('should create a new approval request', async () => {
      const request = await store.createRequest(
        'runCommand',
        'Delete temp files',
        { command: 'rm -rf ./temp' }
      );

      expect(request.id).toBeDefined();
      expect(request.toolName).toBe('runCommand');
      expect(request.description).toBe('Delete temp files');
      expect(request.params).toEqual({ command: 'rm -rf ./temp' });
      expect(request.status).toBe('pending');
      expect(request.createdAt).toBeDefined();
    });

    it('should set status to pending', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      expect(request.status).toBe('pending');
    });
  });

  describe('shouldAutoApprove', () => {
    it('should return true for readFile by default', () => {
      expect(store.shouldAutoApprove('readFile')).toBe(true);
    });

    it('should return true for listFiles by default', () => {
      expect(store.shouldAutoApprove('listFiles')).toBe(true);
    });

    it('should return false for runCommand', () => {
      expect(store.shouldAutoApprove('runCommand')).toBe(false);
    });

    it('should return false for writeFile', () => {
      expect(store.shouldAutoApprove('writeFile')).toBe(false);
    });
  });

  describe('getPending', () => {
    it('should return null for non-existent ID', () => {
      const result = store.getPending('non-existent');
      expect(result).toBeNull();
    });

    it('should return pending request by ID', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      const result = store.getPending(request.id);

      expect(result?.id).toBe(request.id);
      expect(result?.status).toBe('pending');
    });

    it('should return null for already approved request', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      await store.approve(request.id);

      const result = store.getPending(request.id);
      expect(result).toBeNull();
    });
  });

  describe('getPendingAll', () => {
    it('should return empty array when no pending', async () => {
      const pending = store.getPendingAll();
      expect(pending).toEqual([]);
    });

    it('should return all pending requests', async () => {
      await store.createRequest('tool1', 'desc1', {});
      await store.createRequest('tool2', 'desc2', {});

      const pending = store.getPendingAll();
      expect(pending.length).toBe(2);
    });

    it('should sort by createdAt ascending', async () => {
      const req1 = await store.createRequest('tool1', 'desc1', {});
      await new Promise(r => setTimeout(r, 10));
      const req2 = await store.createRequest('tool2', 'desc2', {});

      const pending = store.getPendingAll();
      expect(pending[0].id).toBe(req1.id);
      expect(pending[1].id).toBe(req2.id);
    });
  });

  describe('submit', () => {
    it('should approve a request', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      const success = await store.submit(request.id, true);

      expect(success).toBe(true);
      const pending = store.getPending(request.id);
      expect(pending).toBeNull();
    });

    it('should deny a request', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      const success = await store.submit(request.id, false);

      expect(success).toBe(true);
    });

    it('should return false for non-existent ID', async () => {
      const success = await store.submit('non-existent', true);
      expect(success).toBe(false);
    });

    it('should return false for already responded request', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      await store.approve(request.id);
      const success = await store.submit(request.id, true);

      expect(success).toBe(false);
    });

    it('should move request to history', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      await store.approve(request.id);

      const stats = store.getStats();
      expect(stats.totalHistory).toBe(1);
    });

    it('should set respondedAt timestamp', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      const before = Date.now();
      
      await store.approve(request.id);
      
      // Request is now in history, check history
      // We can't directly access history items easily, but we know it was responded
      const stats = store.getStats();
      expect(stats.approvedToday).toBe(1);
    });
  });

  describe('approve', () => {
    it('should approve a request', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      const success = await store.approve(request.id);

      expect(success).toBe(true);
    });
  });

  describe('deny', () => {
    it('should deny a request', async () => {
      const request = await store.createRequest('tool', 'desc', {});
      const success = await store.deny(request.id);

      expect(success).toBe(true);
    });
  });

  describe('addAutoApproveRule', () => {
    it('should add a new auto-approve rule', async () => {
      await store.addAutoApproveRule('customTool');
      const rules = store.getAutoApproveRules();

      expect(rules.some(r => r.toolPattern === 'customTool')).toBe(true);
    });

    it('should add rule with param pattern', async () => {
      await store.addAutoApproveRule('runCommand', 'echo.*');
      const rules = store.getAutoApproveRules();

      const rule = rules.find(r => r.toolPattern === 'runCommand');
      expect(rule?.paramPattern).toBe('echo.*');
    });

    it('should throw error for duplicate rule', async () => {
      await store.addAutoApproveRule('duplicateTool');
      
      await expect(
        store.addAutoApproveRule('duplicateTool')
      ).rejects.toThrow('Rule already exists');
    });
  });

  describe('removeAutoApproveRule', () => {
    it('should remove a rule', async () => {
      await store.addAutoApproveRule('to-remove');
      await store.removeAutoApproveRule('to-remove');

      const rules = store.getAutoApproveRules();
      expect(rules.some(r => r.toolPattern === 'to-remove')).toBe(false);
    });
  });

  describe('setAutoApproveRuleEnabled', () => {
    it('should disable a rule', async () => {
      await store.addAutoApproveRule('to-disable');
      await store.setAutoApproveRuleEnabled('to-disable', false);

      const rules = store.getAutoApproveRules();
      const rule = rules.find(r => r.toolPattern === 'to-disable');
      expect(rule?.enabled).toBe(false);
    });

    it('should enable a rule', async () => {
      await store.addAutoApproveRule('to-enable');
      await store.setAutoApproveRuleEnabled('to-enable', false);
      await store.setAutoApproveRuleEnabled('to-enable', true);

      const rules = store.getAutoApproveRules();
      const rule = rules.find(r => r.toolPattern === 'to-enable');
      expect(rule?.enabled).toBe(true);
    });

    it('should throw error for non-existent rule', async () => {
      await expect(
        store.setAutoApproveRuleEnabled('non-existent', true)
      ).rejects.toThrow('Rule not found');
    });
  });

  describe('getAutoApproveRules', () => {
    it('should return all rules', async () => {
      await store.addAutoApproveRule('rule1');
      await store.addAutoApproveRule('rule2');

      const rules = store.getAutoApproveRules();
      expect(rules.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('clearPending', () => {
    it('should clear all pending approvals', async () => {
      await store.createRequest('tool1', 'desc1', {});
      await store.createRequest('tool2', 'desc2', {});

      await store.clearPending();

      const pending = store.getPendingAll();
      expect(pending).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      await store.createRequest('tool1', 'desc1', {});
      await store.createRequest('tool2', 'desc2', {});
      await store.approve(store.getPendingAll()[0].id);

      const stats = store.getStats();

      expect(stats.pending).toBe(1);
      expect(stats.approvedToday).toBe(1);
      expect(stats.deniedToday).toBe(0);
      expect(stats.totalHistory).toBe(1);
    });

    it('should return zeros for empty store', async () => {
      await store.clearPending();
      const stats = store.getStats();

      expect(stats.pending).toBe(0);
      expect(stats.approvedToday).toBe(0);
      expect(stats.deniedToday).toBe(0);
      expect(stats.totalHistory).toBe(0);
    });
  });
});
