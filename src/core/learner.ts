import { getBrainStore } from '../storage/brain.js';
import { getLongTermMemory } from '../memory/vector-memory.js';
import { TaskNode } from './bdi-types.js';

/**
 * Learner - Responsible for the 'LEARN' phase of the BDI loop.
 * Updates the knowledge base and strategy weights based on outcomes.
 */
export class Learner {
  private brainStore = getBrainStore();
  private semanticMemory = getLongTermMemory();

  /**
   * Consolidate results from tasks into memory
   */
  async learn(task: string, nodes: TaskNode[], result: string, success: boolean): Promise<void> {
    const memory = {
      task,
      outcome: success ? 'SUCCESS' : 'FAILURE',
      result: result.substring(0, 500),
      timestamp: Date.now(),
      steps: nodes.map(n => ({ task: n.task, status: n.status }))
    };

    // Store in brain store
    await this.brainStore.save(`learning_${Date.now()}`, JSON.stringify(memory), ['experience', success ? 'success' : 'failure']);

    // Commit to semantic memory
    const lesson = `Learned from task: ${task}. Outcome was ${success ? 'successful' : 'unsuccessful'}. Key Result: ${result.substring(0, 200)}`;
    await this.semanticMemory.commit(lesson, success ? 1 : 2, 'learning').catch(() => {});
  }
}
