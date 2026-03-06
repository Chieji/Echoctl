/**
 * Memory/Brain - Session and History Management
 * Uses lowdb for JSON file storage
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';
import { Database, Session, Message, ProviderName } from '../types/index.js';

/**
 * Default database structure
 */
const defaultData: Database = {
  sessions: [],
  currentSessionId: null,
};

/**
 * Memory class - manages conversation history and sessions
 */
export class Memory {
  private db: Low<Database>;
  private configDir: string;
  private readonly CONTEXT_LENGTH = 10;

  constructor() {
    this.configDir = join(homedir(), '.config', 'echo-cli');
    
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }

    const dbPath = join(this.configDir, 'history.json');
    this.db = new Low<Database>(new JSONFile<Database>(dbPath), defaultData);
  }

  async init(): Promise<void> {
    await this.db.read();
    this.db.data ||= defaultData;
    await this.db.write();
  }

  async getCurrentSession(): Promise<Session> {
    await this.ensureInitialized();
    const currentId = this.db.data!.currentSessionId;
    
    if (currentId) {
      const session = this.db.data!.sessions.find(s => s.id === currentId);
      if (session) return session;
    }
    return this.createSession();
  }

  async createSession(name?: string, provider?: ProviderName): Promise<Session> {
    await this.ensureInitialized();
    const session: Session = {
      id: uuidv4(),
      name: name || `Session ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider: provider || 'gemini',
    };
    this.db.data!.sessions.push(session);
    this.db.data!.currentSessionId = session.id;
    await this.db.write();
    return session;
  }

  async addMessage(role: Message['role'], content: string): Promise<Message> {
    const session = await this.getCurrentSession();
    const message: Message = { role, content, timestamp: Date.now() };
    session.messages.push(message);
    session.updatedAt = Date.now();
    await this.db.write();
    return message;
  }

  async getContext(limit?: number): Promise<Message[]> {
    const session = await this.getCurrentSession();
    return session.messages.slice(-(limit || this.CONTEXT_LENGTH));
  }

  async getHistory(): Promise<Message[]> {
    const session = await this.getCurrentSession();
    return session.messages;
  }

  async clearCurrentSession(): Promise<void> {
    await this.ensureInitialized();
    const currentId = this.db.data!.currentSessionId;
    if (currentId) {
      const session = this.db.data!.sessions.find(s => s.id === currentId);
      if (session) {
        session.messages = [];
        session.updatedAt = Date.now();
        await this.db.write();
      }
    }
  }

  async deleteCurrentSession(): Promise<void> {
    await this.ensureInitialized();
    const currentId = this.db.data!.currentSessionId;
    if (currentId) {
      this.db.data!.sessions = this.db.data!.sessions.filter(s => s.id !== currentId);
      this.db.data!.currentSessionId = null;
      await this.db.write();
    }
  }

  async listSessions(): Promise<Session[]> {
    await this.ensureInitialized();
    return this.db.data!.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async switchSession(sessionId: string): Promise<Session | null> {
    await this.ensureInitialized();
    const session = this.db.data!.sessions.find(s => s.id === sessionId);
    if (session) {
      this.db.data!.currentSessionId = sessionId;
      await this.db.write();
      return session;
    }
    return null;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    await this.ensureInitialized();
    return this.db.data!.sessions.find(s => s.id === sessionId);
  }

  async clearAll(): Promise<void> {
    this.db.data = defaultData;
    await this.db.write();
  }

  async getStats(): Promise<{ totalSessions: number; totalMessages: number; currentSessionMessages: number }> {
    await this.ensureInitialized();
    const sessions = this.db.data!.sessions;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
    const currentSession = await this.getCurrentSession();
    return { totalSessions: sessions.length, totalMessages, currentSessionMessages: currentSession.messages.length };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db.data) await this.init();
  }

  getHistoryPath(): string {
    return join(this.configDir, 'history.json');
  }
}

let memoryInstance: Memory | null = null;
export function getMemory(): Memory {
  if (!memoryInstance) memoryInstance = new Memory();
  return memoryInstance;
}
