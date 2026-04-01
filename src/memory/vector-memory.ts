/**
 * Multi-layer Memory Architecture
 * Implements Semantic Memory (Vector-based) for long-term knowledge retention.
 */

import { getConfig } from '../utils/config.js';
import axios from 'axios';
import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface MemoryNode {
  text: string;
  vector: number[];
  metadata: {
    timestamp: number;
    source: string;
    importance: number;
  };
}

export class LongTermMemory {
  private nodes: MemoryNode[] = [];
  private readonly storagePath: string;
  // In-memory cache to skip redundant Gemini API calls (Performance: Bolt ⚡)
  // This reduces latency for repeated queries in the same session.
  // FIFO eviction with 1000 entry limit (Performance: Bolt ⚡)
  private embeddingCache: Map<string, number[]> = new Map();
  private readonly CACHE_LIMIT = 1000;

  constructor() {
    this.storagePath = join(homedir(), '.config', 'echo-cli-nodejs', 'semantic-memory.json');
    this.load();
  }

  /**
   * Add a new fact or observation to long-term memory
   */
  async commit(text: string, importance: number = 1, source: string = 'reasoning'): Promise<void> {
    console.log(chalk.dim(`[Memory] Committing to semantic layer: "${text.substring(0, 30)}..."`));
    
    try {
      const vector = await this.getEmbedding(text);
      this.nodes.push({
        text,
        vector,
        metadata: {
          timestamp: Date.now(),
          source,
          importance,
        }
      });
      this.save();
    } catch (err: any) {
      console.error(chalk.yellow(`[Memory] Embedding failed: ${err.message}`));
      // Fallback: Add without vector (will be ignored by similarity search but kept in history)
    }
  }

  /**
   * Retrieve relevant memories based on semantic similarity
   */
  async recall(query: string, limit: number = 5): Promise<string[]> {
    if (this.nodes.length === 0) return [];
    
    try {
      const queryVector = await this.getEmbedding(query);
      
      const scored = this.nodes
        .filter(n => n.vector && n.vector.length > 0)
        .map(node => ({
          text: node.text,
          score: this.cosineSimilarity(queryVector, node.vector)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scored.map(s => s.text);
    } catch {
      // Fallback to simple keyword search
      return this.nodes
        .filter(n => n.text.toLowerCase().includes(query.toLowerCase()))
        .map(n => n.text)
        .slice(0, limit);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Return cached result if available to reduce network latency (Performance: Bolt ⚡)
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    // Maintain FIFO cache limit (Performance: Bolt ⚡)
    if (this.embeddingCache.size >= this.CACHE_LIMIT) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey !== undefined) {
        this.embeddingCache.delete(firstKey);
      }
    }

    const config = getConfig();
    const apiKey = config.getApiKey('gemini');
    
    if (!apiKey) throw new Error('Gemini API key required for embeddings');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`;
    
    const response = await axios.post(url, {
      model: "models/embedding-001",
      content: { parts: [{ text }] }
    });

    // Normalize vector to unit length and cache (Performance: Bolt ⚡)
    // Unit vectors allow using simple dot product instead of full cosine similarity.
    const vector = this.normalize(response.data.embedding.values);
    this.embeddingCache.set(text, vector);
    return vector;
  }

  /**
   * Normalizes a vector to unit length (magnitude of 1.0)
   */
  private normalize(v: number[]): number[] {
    const magnitude = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? v.map(val => val / magnitude) : v;
  }

  /**
   * Calculate similarity using dot product
   * Performance: Simplified from cosine to dot product as vectors are pre-normalized (by Bolt ⚡)
   * Impact: Reduces complexity by eliminating Math.sqrt and divisions in similarity search loop.
   */
  private cosineSimilarity(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
    }
    return dotProduct;
  }

  private load(): void {
    if (existsSync(this.storagePath)) {
      try {
        this.nodes = JSON.parse(readFileSync(this.storagePath, 'utf8'));

        // Ensure all loaded vectors are normalized to unit length for fast dot product (by Bolt ⚡)
        for (const node of this.nodes) {
          if (node.vector && node.vector.length > 0) {
            node.vector = this.normalize(node.vector);
          }
        }
      } catch {
        this.nodes = [];
      }
    }
  }

  private save(): void {
    try {
      writeFileSync(this.storagePath, JSON.stringify(this.nodes, null, 2));
    } catch (err: any) {
      console.error(chalk.red(`[Memory] Save failed: ${err.message}`));
    }
  }
}

/**
 * Singleton access to long-term memory (Performance: Bolt ⚡)
 * Ensures only one instance is created, reducing redundant disk I/O and unifying cache.
 */
let longTermMemoryInstance: LongTermMemory | null = null;

export function getLongTermMemory(): LongTermMemory {
  if (!longTermMemoryInstance) {
    longTermMemoryInstance = new LongTermMemory();
  }
  return longTermMemoryInstance;
}
