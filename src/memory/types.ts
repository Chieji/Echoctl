/**
 * Memory System Types
 */

export type MemoryType = 'working' | 'episodic' | 'semantic' | 'longterm';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  tags: string[];
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface WorkingMemory {
  activeTask: string;
  context: Record<string, any>;
  partialResults: any[];
}

export interface EpisodicMemory {
  episodes: MemoryEntry[];
}

export interface SemanticMemory {
  facts: MemoryEntry[];
}

export interface LongTermMemory {
  skills: string[];
  strategies: Record<string, any>;
}
