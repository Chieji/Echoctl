import { getBrainStore } from '../storage/brain.js';
import { LongTermMemory } from '../memory/vector-memory';

/**
 * Reflector - Handles the 'Reflection' and 'Learning' phase.
 * It analyzes the outcome of a task and updates the brain store.
 */
export class Reflector {
  private brainStore = getBrainStore();
  private semanticMemory = new LongTermMemory();

  /**
   * Reflect on the task result and store learned knowledge
   */
  async reflect(task: string, result: string, success: boolean): Promise<void> {
    if (!success) {
      // Record failure as a lesson
      await this.brainStore.save(`failure_${Date.now()}`, `Task: ${task}\nResult: FAILED - ${result.substring(0, 200)}`, ['experience', 'failure']);
    } else {
      // Store successful task results
      const summary = result.substring(0, 500);
      await this.brainStore.save(`task_${Date.now()}`, `Task: ${task}\nResult: ${summary}`, ['experience', 'success']);
    }

    // Commit to Semantic layer (Long-term)
    try {
      const content = `Task: ${task}\nResult: ${result.substring(0, 500)}`;
      await this.semanticMemory.commit(content, success ? 1 : 2, 'reflection');
    } catch {
      // Ignore
    }
  }
}
