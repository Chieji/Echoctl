import { MemoryEntry, EpisodicMemory } from './types.js';
import { getBrainStore } from '../storage/brain.js';

/**
 * Episodic Memory - Records experience over time
 */
export class EpisodicMemoryManager implements EpisodicMemory {
  episodes: MemoryEntry[] = [];
  private brainStore = getBrainStore();

  /**
   * Save a new episode (task execution)
   */
  async recordEpisode(task: string, outcome: string, success: boolean): Promise<void> {
    const entry: MemoryEntry = {
      id: `episode_${Date.now()}`,
      type: 'episodic',
      content: outcome,
      tags: success ? ['success'] : ['failure'],
      timestamp: Date.now(),
      metadata: { task, success }
    };

    this.episodes.push(entry);
    
    // Also persist to long-term brain store
    await this.brainStore.save(entry.id, `Task: ${task}\nOutcome: ${outcome}`, entry.tags);
  }

  /**
   * Find similar past episodes to inform current reasoning
   */
  async findSimilar(task: string): Promise<MemoryEntry[]> {
    // Current simple search via BrainStore
    const results = this.brainStore.search(task, ['success', 'failure']);
    return results.map(r => ({
      id: r.key,
      type: 'episodic',
      content: r.value,
      tags: r.tags || [],
      timestamp: Date.now(), // Estimate
      metadata: { task: r.key }
    }));
  }
}
