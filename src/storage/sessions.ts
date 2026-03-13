/**
 * Session Storage Module
 * Uses lowdb for JSON file storage with CRUD operations
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync, renameSync } from 'fs';
import { Session, Message, ProviderName, SessionDatabase } from '../types/index.js';

/**
 * Configuration constants
 */
const CONFIG = {
  CONFIG_DIR: join(homedir(), '.config', 'echo-cli'),
  DB_FILE: 'sessions.json',
  MAX_SESSIONS: 20,
  SESSION_TTL_DAYS: 30,
  TOKENS_PER_CHAR_ESTIMATE: 4,
} as const;

/**
 * Calculate token count for messages
 * Uses rough estimate: ~4 characters per token
 */
export function calculateTokenCount(messages: Message[]): number {
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.ceil(totalChars / CONFIG.TOKENS_PER_CHAR_ESTIMATE);
}

/**
 * Generate session ID (UUID format)
 */
function generateSessionId(): string {
  return uuidv4();
}

/**
 * Check if session is expired
 */
function isSessionExpired(session: Session, ttlDays: number = CONFIG.SESSION_TTL_DAYS): boolean {
  const expiryTime = session.updatedAt + (ttlDays * 24 * 60 * 60 * 1000);
  return Date.now() > expiryTime;
}

/**
 * SessionStore class - manages session persistence with lowdb
 */
export class SessionStore {
  private db: Low<SessionDatabase>;
  private initialized: boolean = false;

  constructor() {
    // Ensure config directory exists
    if (!existsSync(CONFIG.CONFIG_DIR)) {
      mkdirSync(CONFIG.CONFIG_DIR, { recursive: true });
    }

    const dbPath = join(CONFIG.CONFIG_DIR, CONFIG.DB_FILE);
    this.db = new Low<SessionDatabase>(new JSONFile<SessionDatabase>(dbPath), {
      sessions: [],
      currentSessionId: null,
    });
  }

  /**
   * Initialize database (load from disk)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.db.read();
      // Handle corrupted or missing data
      if (!this.db.data) {
        this.db.data = { sessions: [], currentSessionId: null };
      }
      // Prune old sessions on init
      this.pruneExpiredSessions();
      await this.db.write();
      this.initialized = true;
    } catch (error: any) {
      // Handle corrupted JSON - backup and recreate
      console.error('Warning: Session database corrupted, recreating...', error.message);
      this.backupCorruptedDb();
      this.db.data = { sessions: [], currentSessionId: null };
      await this.db.write();
      this.initialized = true;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Backup corrupted database file
   */
  private backupCorruptedDb(): void {
    const dbPath = join(CONFIG.CONFIG_DIR, CONFIG.DB_FILE);
    const backupPath = join(CONFIG.CONFIG_DIR, `sessions.corrupted.${Date.now()}.json`);
    try {
      renameSync(dbPath, backupPath);
      console.log(`Backed up corrupted database to: ${backupPath}`);
    } catch {
      // Ignore backup errors
    }
  }

  /**
   * Prune expired sessions (older than TTL)
   */
  private pruneExpiredSessions(): void {
    if (!this.db.data) return;

    const originalCount = this.db.data.sessions.length;
    this.db.data.sessions = this.db.data.sessions.filter(
      session => !isSessionExpired(session)
    );
    const removed = originalCount - this.db.data.sessions.length;

    if (removed > 0) {
      console.log(`Pruned ${removed} expired session(s)`);
    }

    // Also enforce max sessions limit
    if (this.db.data.sessions.length > CONFIG.MAX_SESSIONS) {
      // Sort by updatedAt descending and keep only MAX_SESSIONS
      this.db.data.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      this.db.data.sessions = this.db.data.sessions.slice(0, CONFIG.MAX_SESSIONS);
    }

    // Clear current session ID if it points to a deleted session
    if (this.db.data.currentSessionId) {
      const currentSessionExists = this.db.data.sessions.some(
        s => s.id === this.db.data.currentSessionId
      );
      if (!currentSessionExists) {
        this.db.data.currentSessionId = null;
      }
    }
  }

  /**
   * Create a new session
   */
  async create(name: string, provider: ProviderName = 'gemini'): Promise<Session> {
    await this.ensureInitialized();

    const session: Session = {
      id: generateSessionId(),
      name: name || `Session ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider,
      tokenCount: 0,
    };

    this.db.data!.sessions.push(session);
    this.db.data!.currentSessionId = session.id;
    await this.db.write();

    return session;
  }

  /**
   * Get a session by ID
   */
  get(id: string): Session | null {
    if (!this.db.data) return null;
    return this.db.data.sessions.find(s => s.id === id) || null;
  }

  /**
   * Get all sessions (optionally limited)
   */
  getAll(limit?: number): Session[] {
    if (!this.db.data) return [];

    let sessions = [...this.db.data.sessions];
    // Sort by updatedAt descending (most recent first)
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    if (limit) {
      sessions = sessions.slice(0, limit);
    }

    return sessions;
  }

  /**
   * Update session messages
   */
  async update(id: string, messages: Message[]): Promise<void> {
    await this.ensureInitialized();

    const session = this.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    session.messages = messages;
    session.updatedAt = Date.now();
    session.tokenCount = calculateTokenCount(messages);

    await this.db.write();
  }

  /**
   * Add a message to a session
   */
  async addMessage(sessionId: string, role: Message['role'], content: string): Promise<Message> {
    await this.ensureInitialized();

    const session = this.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const message: Message = {
      role,
      content,
      timestamp: Date.now(),
    };

    session.messages.push(message);
    session.updatedAt = Date.now();
    session.tokenCount = calculateTokenCount(session.messages);

    await this.db.write();

    return message;
  }

  /**
   * Delete a session
   */
  async delete(id: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.db.data) return;

    this.db.data.sessions = this.db.data.sessions.filter(s => s.id !== id);

    // Clear current session ID if deleting the current session
    if (this.db.data.currentSessionId === id) {
      this.db.data.currentSessionId = null;
    }

    await this.db.write();
  }

  /**
   * Clear all sessions
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    this.db.data = { sessions: [], currentSessionId: null };
    await this.db.write();
  }

  /**
   * Export session as JSON string
   */
  export(id: string): string {
    const session = this.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    return JSON.stringify(session, null, 2);
  }

  /**
   * Get current active session
   */
  getCurrentSession(): Session | null {
    if (!this.db.data || !this.db.data.currentSessionId) {
      return null;
    }
    return this.get(this.db.data.currentSessionId);
  }

  /**
   * Set current session
   */
  async setCurrentSession(id: string): Promise<boolean> {
    await this.ensureInitialized();

    const session = this.get(id);
    if (!session) {
      return false;
    }

    this.db.data!.currentSessionId = id;
    await this.db.write();
    return true;
  }

  /**
   * Get or create current session
   */
  async getOrCreateCurrentSession(provider?: ProviderName): Promise<Session> {
    await this.ensureInitialized();

    let session = this.getCurrentSession();
    if (!session) {
      session = await this.create('New Session', provider);
    }
    return session;
  }

  /**
   * Clear messages in current session (keep session, remove messages)
   */
  async clearCurrentSessionMessages(): Promise<void> {
    await this.ensureInitialized();

    const session = this.getCurrentSession();
    if (session) {
      session.messages = [];
      session.updatedAt = Date.now();
      session.tokenCount = 0;
      await this.db.write();
    }
  }

  /**
   * Delete current session entirely
   */
  async deleteCurrentSession(): Promise<void> {
    await this.ensureInitialized();

    const currentId = this.db.data?.currentSessionId;
    if (currentId) {
      await this.delete(currentId);
    }
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    currentSessionMessages: number;
    totalTokens: number;
  }> {
    await this.ensureInitialized();

    if (!this.db.data) {
      return { totalSessions: 0, totalMessages: 0, currentSessionMessages: 0, totalTokens: 0 };
    }

    const sessions = this.db.data.sessions;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokenCount || 0), 0);

    const currentSession = this.getCurrentSession();
    const currentSessionMessages = currentSession?.messages.length || 0;

    return {
      totalSessions: sessions.length,
      totalMessages,
      currentSessionMessages,
      totalTokens,
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
let sessionStoreInstance: SessionStore | null = null;

export function getSessionStore(): SessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new SessionStore();
  }
  return sessionStoreInstance;
}

/**
 * Default export for convenience
 */
export const sessionStore = new SessionStore();
