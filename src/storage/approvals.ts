/**
 * HITL (Human-in-the-Loop) Approval System
 * Manages approval queue for dangerous actions
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

/**
 * Approval request structure
 */
export interface ApprovalRequest {
  id: string;
  toolName: string;
  description: string;
  params: Record<string, any>;
  createdAt: number;
  status: 'pending' | 'approved' | 'denied';
  respondedAt?: number;
}

/**
 * Auto-approve rule
 */
export interface AutoApproveRule {
  toolPattern: string;
  paramPattern?: string;
  enabled: boolean;
}

/**
 * Approvals database structure
 */
export interface ApprovalsDatabase {
  requests: ApprovalRequest[];
  autoApproveRules: AutoApproveRule[];
  history: ApprovalRequest[];
}

/**
 * Configuration constants
 */
const CONFIG = {
  CONFIG_DIR: join(homedir(), '.config', 'echo-cli'),
  DB_FILE: 'approvals.json',
  MAX_PENDING: 100,
  HISTORY_TTL_DAYS: 7,
} as const;

/**
 * ApprovalsStore class - manages HITL approvals
 */
export class ApprovalsStore {
  private db: Low<ApprovalsDatabase>;
  private initialized: boolean = false;

  constructor() {
    // Ensure config directory exists
    if (!existsSync(CONFIG.CONFIG_DIR)) {
      mkdirSync(CONFIG.CONFIG_DIR, { recursive: true });
    }

    const dbPath = join(CONFIG.CONFIG_DIR, CONFIG.DB_FILE);
    this.db = new Low<ApprovalsDatabase>(new JSONFile<ApprovalsDatabase>(dbPath), {
      requests: [],
      autoApproveRules: [
        // Default safe rules
        { toolPattern: 'readFile', enabled: true },
        { toolPattern: 'listFiles', enabled: true },
      ],
      history: [],
    });
  }

  /**
   * Initialize database (load from disk)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.db.read();
      if (!this.db.data) {
        this.db.data = {
          requests: [],
          autoApproveRules: [
            { toolPattern: 'readFile', enabled: true },
            { toolPattern: 'listFiles', enabled: true },
          ],
          history: [],
        };
      }
      // Prune old history
      this.pruneOldHistory();
      await this.db.write();
      this.initialized = true;
    } catch (error: any) {
      console.error('Warning: Approvals database error, recreating...', error.message);
      this.db.data = {
        requests: [],
        autoApproveRules: [],
        history: [],
      };
      await this.db.write();
      this.initialized = true;
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Prune old history entries
   */
  private pruneOldHistory(): void {
    if (!this.db.data) return;

    const cutoff = Date.now() - (CONFIG.HISTORY_TTL_DAYS * 24 * 60 * 60 * 1000);
    this.db.data.history = this.db.data.history.filter(r => r.createdAt > cutoff);
  }

  /**
   * Create a new approval request
   */
  async createRequest(
    toolName: string,
    description: string,
    params: Record<string, any>
  ): Promise<ApprovalRequest> {
    await this.ensureInitialized();

    const request: ApprovalRequest = {
      id: uuidv4(),
      toolName,
      description,
      params,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.db.data!.requests.push(request);

    // Enforce max pending limit
    if (this.db.data!.requests.length > CONFIG.MAX_PENDING) {
      this.db.data!.requests = this.db.data!.requests.slice(-CONFIG.MAX_PENDING);
    }

    await this.db.write();
    return request;
  }

  /**
   * Check if a tool action should be auto-approved
   */
  shouldAutoApprove(toolName: string, params?: Record<string, any>): boolean {
    if (!this.db.data) return false;

    for (const rule of this.db.data.autoApproveRules) {
      if (!rule.enabled) continue;

      // Check tool pattern
      const toolRegex = new RegExp(rule.toolPattern, 'i');
      if (!toolRegex.test(toolName)) continue;

      // Check param pattern if specified
      if (rule.paramPattern && params) {
        const paramRegex = new RegExp(rule.paramPattern, 'i');
        const paramString = JSON.stringify(params);
        if (!paramRegex.test(paramString)) continue;
      }

      return true;
    }

    return false;
  }

  /**
   * Get a pending approval by ID
   */
  getPending(id: string): ApprovalRequest | null {
    if (!this.db.data) return null;

    const request = this.db.data.requests.find(r => r.id === id);
    return (request && request.status === 'pending') ? request : null;
  }

  /**
   * Get all pending approvals
   */
  getPendingAll(): ApprovalRequest[] {
    if (!this.db.data) return [];

    return this.db.data.requests
      .filter(r => r.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Submit approval decision
   */
  async submit(id: string, approved: boolean): Promise<boolean> {
    await this.ensureInitialized();

    const request = this.db.data!.requests.find(r => r.id === id);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = approved ? 'approved' : 'denied';
    request.respondedAt = Date.now();

    // Move to history
    this.db.data!.history.push(request);

    // Remove from pending
    this.db.data!.requests = this.db.data!.requests.filter(r => r.id !== id);

    await this.db.write();
    return true;
  }

  /**
   * Approve a request
   */
  async approve(id: string): Promise<boolean> {
    return this.submit(id, true);
  }

  /**
   * Deny a request
   */
  async deny(id: string): Promise<boolean> {
    return this.submit(id, false);
  }

  /**
   * Add auto-approve rule
   */
  async addAutoApproveRule(toolPattern: string, paramPattern?: string): Promise<void> {
    await this.ensureInitialized();

    // Check if rule already exists
    const exists = this.db.data!.autoApproveRules.some(
      r => r.toolPattern === toolPattern && r.paramPattern === paramPattern
    );

    if (exists) {
      throw new Error('Rule already exists');
    }

    this.db.data!.autoApproveRules.push({
      toolPattern,
      paramPattern,
      enabled: true,
    });

    await this.db.write();
  }

  /**
   * Remove auto-approve rule
   */
  async removeAutoApproveRule(toolPattern: string): Promise<void> {
    await this.ensureInitialized();

    this.db.data!.autoApproveRules = this.db.data!.autoApproveRules.filter(
      r => r.toolPattern !== toolPattern
    );

    await this.db.write();
  }

  /**
   * Enable/disable auto-approve rule
   */
  async setAutoApproveRuleEnabled(toolPattern: string, enabled: boolean): Promise<void> {
    await this.ensureInitialized();

    const rule = this.db.data!.autoApproveRules.find(r => r.toolPattern === toolPattern);
    if (!rule) {
      throw new Error('Rule not found');
    }

    rule.enabled = enabled;
    await this.db.write();
  }

  /**
   * Get all auto-approve rules
   */
  getAutoApproveRules(): AutoApproveRule[] {
    return this.db.data?.autoApproveRules || [];
  }

  /**
   * Clear all pending approvals
   */
  async clearPending(): Promise<void> {
    await this.ensureInitialized();
    this.db.data!.requests = [];
    await this.db.write();
  }

  /**
   * Get statistics
   */
  getStats(): {
    pending: number;
    approvedToday: number;
    deniedToday: number;
    totalHistory: number;
  } {
    if (!this.db.data) {
      return { pending: 0, approvedToday: 0, deniedToday: 0, totalHistory: 0 };
    }

    const now = Date.now();
    const todayStart = now - (24 * 60 * 60 * 1000);

    const todayHistory = this.db.data.history.filter(r => 
      r.respondedAt && r.respondedAt > todayStart
    );

    return {
      pending: this.db.data.requests.length,
      approvedToday: todayHistory.filter(r => r.status === 'approved').length,
      deniedToday: todayHistory.filter(r => r.status === 'denied').length,
      totalHistory: this.db.data.history.length,
    };
  }

  /**
   * Get database file path
   */
  getDbPath(): string {
    return join(CONFIG.CONFIG_DIR, CONFIG.DB_FILE);
  }
}

/**
 * Singleton instance
 */
let approvalsStoreInstance: ApprovalsStore | null = null;

export function getApprovalsStore(): ApprovalsStore {
  if (!approvalsStoreInstance) {
    approvalsStoreInstance = new ApprovalsStore();
  }
  return approvalsStoreInstance;
}
