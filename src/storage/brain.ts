/**
 * Second Brain - Knowledge Base Storage
 * Persistent memory system for storing and retrieving knowledge
 * Uses lowdb for JSON file storage
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

/**
 * Memory item structure
 */
export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  accessCount: number;
}

/**
 * Brain database structure
 */
export interface BrainDatabase {
  memories: MemoryItem[];
}

/**
 * Configuration constants
 */
const CONFIG = {
  CONFIG_DIR: join(homedir(), '.config', 'echo-cli'),
  DB_FILE: 'brain.json',
} as const;

/**
 * Simple text search - finds memories containing the query
 */
function searchMemoriesByText(memories: MemoryItem[], query: string): MemoryItem[] {
  if (!query.trim()) return memories;
  
  const lowerQuery = query.toLowerCase();
  return memories.filter(memory => 
    memory.key.toLowerCase().includes(lowerQuery) ||
    memory.value.toLowerCase().includes(lowerQuery) ||
    memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Sort memories by relevance score
 */
function sortByRelevance(memories: MemoryItem[], query: string): MemoryItem[] {
  if (!query.trim()) {
    return memories.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  const lowerQuery = query.toLowerCase();
  
  return memories.map(memory => {
    let score = 0;
    
    // Exact key match gets highest score
    if (memory.key.toLowerCase() === lowerQuery) score += 100;
    // Key contains query
    else if (memory.key.toLowerCase().includes(lowerQuery)) score += 50;
    
    // Value contains query
    if (memory.value.toLowerCase().includes(lowerQuery)) score += 20;
    
    // Tag match
    if (memory.tags.some(tag => tag.toLowerCase() === lowerQuery)) score += 30;
    else if (memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) score += 10;
    
    // Access count bonus (frequently accessed = more relevant)
    score += Math.min(memory.accessCount, 10);
    
    return { memory, score };
  })
  .sort((a, b) => b.score - a.score)
  .map(({ memory }) => memory);
}

/**
 * BrainStore class - manages knowledge base
 */
export class BrainStore {
  private db: Low<BrainDatabase>;
  private initialized: boolean = false;

  constructor() {
    // Ensure config directory exists
    if (!existsSync(CONFIG.CONFIG_DIR)) {
      mkdirSync(CONFIG.CONFIG_DIR, { recursive: true });
    }

    const dbPath = join(CONFIG.CONFIG_DIR, CONFIG.DB_FILE);
    this.db = new Low<BrainDatabase>(new JSONFile<BrainDatabase>(dbPath), {
      memories: [],
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
        this.db.data = { memories: [] };
      }
      await this.db.write();
      this.initialized = true;
    } catch (error: any) {
      console.error('Warning: Brain database error, recreating...', error.message);
      this.db.data = { memories: [] };
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
   * Save a memory item
   */
  async save(key: string, value: string, tags: string[] = []): Promise<MemoryItem> {
    await this.ensureInitialized();

    // Check if key already exists
    const existing = this.db.data!.memories.find(m => m.key.toLowerCase() === key.toLowerCase());
    
    if (existing) {
      // Update existing memory
      existing.value = value;
      existing.tags = tags.length > 0 ? tags : existing.tags;
      existing.updatedAt = Date.now();
      await this.db.write();
      return existing;
    }

    // Create new memory
    const memory: MemoryItem = {
      id: uuidv4(),
      key,
      value,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessCount: 0,
    };

    this.db.data!.memories.push(memory);
    await this.db.write();

    return memory;
  }

  /**
   * Get a memory by key
   */
  get(key: string): MemoryItem | null {
    if (!this.db.data) return null;
    
    const memory = this.db.data.memories.find(
      m => m.key.toLowerCase() === key.toLowerCase()
    );
    
    if (memory) {
      // Increment access count
      memory.accessCount++;
      memory.updatedAt = Date.now();
      this.db.write(); // Fire and forget
    }
    
    return memory || null;
  }

  /**
   * Get memory value by key (shortcut)
   */
  getValue(key: string): string | null {
    const memory = this.get(key);
    return memory?.value || null;
  }

  /**
   * Search memories by query
   */
  search(query: string, tags?: string[]): MemoryItem[] {
    if (!this.db.data) return [];
    
    let results = searchMemoriesByText(this.db.data.memories, query);
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      results = results.filter(memory =>
        tags.some(tag => memory.tags.includes(tag))
      );
    }
    
    // Sort by relevance
    return sortByRelevance(results, query);
  }

  /**
   * Get memories by tag
   */
  getByTag(tag: string): MemoryItem[] {
    if (!this.db.data) return [];
    
    return this.db.data.memories
      .filter(memory => memory.tags.includes(tag))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * List all memories
   */
  list(limit?: number): MemoryItem[] {
    if (!this.db.data) return [];
    
    let memories = [...this.db.data.memories].sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (limit) {
      memories = memories.slice(0, limit);
    }
    
    return memories;
  }

  /**
   * Delete a memory by key
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureInitialized();

    const index = this.db.data!.memories.findIndex(
      m => m.key.toLowerCase() === key.toLowerCase()
    );

    if (index === -1) {
      return false;
    }

    this.db.data!.memories.splice(index, 1);
    await this.db.write();
    return true;
  }

  /**
   * Get all tags
   */
  getAllTags(): string[] {
    if (!this.db.data) return [];
    
    const tagSet = new Set<string>();
    for (const memory of this.db.data.memories) {
      for (const tag of memory.tags) {
        tagSet.add(tag);
      }
    }
    
    return Array.from(tagSet).sort();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalMemories: number;
    totalTags: number;
    mostAccessed: MemoryItem | null;
    recentlyUpdated: MemoryItem | null;
  } {
    if (!this.db.data || this.db.data.memories.length === 0) {
      return {
        totalMemories: 0,
        totalTags: 0,
        mostAccessed: null,
        recentlyUpdated: null,
      };
    }

    const memories = this.db.data.memories;
    const tags = new Set<string>();
    let mostAccessed = memories[0];
    let recentlyUpdated = memories[0];

    for (const memory of memories) {
      for (const tag of memory.tags) {
        tags.add(tag);
      }
      
      if (memory.accessCount > mostAccessed.accessCount) {
        mostAccessed = memory;
      }
      
      if (memory.updatedAt > recentlyUpdated.updatedAt) {
        recentlyUpdated = memory;
      }
    }

    return {
      totalMemories: memories.length,
      totalTags: tags.size,
      mostAccessed,
      recentlyUpdated,
    };
  }

  /**
   * Export all memories as JSON
   */
  export(): string {
    return JSON.stringify(this.db.data, null, 2);
  }

  /**
   * Import memories from JSON
   */
  async import(json: string): Promise<number> {
    await this.ensureInitialized();
    
    try {
      const data = JSON.parse(json) as BrainDatabase;
      
      if (!data.memories || !Array.isArray(data.memories)) {
        throw new Error('Invalid brain data format');
      }
      
      // Merge with existing memories (avoid duplicates by key)
      const existingKeys = new Set(
        this.db.data!.memories.map(m => m.key.toLowerCase())
      );
      
      let imported = 0;
      for (const memory of data.memories) {
        if (!existingKeys.has(memory.key.toLowerCase())) {
          this.db.data!.memories.push({
            ...memory,
            id: memory.id || uuidv4(),
            updatedAt: Date.now(),
          });
          imported++;
        }
      }
      
      await this.db.write();
      return imported;
    } catch (error: any) {
      throw new Error(`Import failed: ${error.message}`);
    }
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
let brainStoreInstance: BrainStore | null = null;

export function getBrainStore(): BrainStore {
  if (!brainStoreInstance) {
    brainStoreInstance = new BrainStore();
  }
  return brainStoreInstance;
}
