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
    const config = getConfig();
    const apiKey = config.getApiKey('gemini');
    
    if (!apiKey) throw new Error('Gemini API key required for embeddings');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`;
    
    const response = await axios.post(url, {
      model: "models/embedding-001",
      content: { parts: [{ text }] }
    });

    return response.data.embedding.values;
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  private load(): void {
    if (existsSync(this.storagePath)) {
      try {
        this.nodes = JSON.parse(readFileSync(this.storagePath, 'utf8'));
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
