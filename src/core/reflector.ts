import { getBrainStore } from '../storage/brain.js';
import { LongTermMemory } from '../memory/vector-memory.js';

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
    // Parallelize storage operations for better performance
    // Performance: Parallelized by Bolt ⚡
    const storageTasks: Promise<any>[] = [];

    if (!success) {
      // Record failure as a lesson
      storageTasks.push(this.brainStore.save(`failure_${Date.now()}`, `Task: ${task}\nResult: FAILED - ${result.substring(0, 200)}`, ['experience', 'failure']));
    } else {
      // Store successful task results
      const summary = result.substring(0, 500);
      storageTasks.push(this.brainStore.save(`task_${Date.now()}`, `Task: ${task}\nResult: ${summary}`, ['experience', 'success']));
    }

    // Commit to Semantic layer (Long-term)
    const content = `Task: ${task}\nResult: ${result.substring(0, 500)}`;
    storageTasks.push(this.semanticMemory.commit(content, success ? 1 : 2, 'reflection').catch(() => {
      // Ignore semantic layer errors
    }));

    await Promise.all(storageTasks);
  }
}
