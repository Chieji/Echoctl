import { getBrainStore } from '../storage/brain.js';
import { LongTermMemory } from '../memory/vector-memory.js';

/**
 * Reflector - Handles the 'Reflection' phase.
 * It analyzes the outcome of a task and updates the brain store.
 */
export class Reflector {
  private brainStore = getBrainStore();
  private semanticMemory = new LongTermMemory();

  /**
   * Reflect on the task result and store learned knowledge
   */
  async reflect(task: string, result: string, success: boolean): Promise<void> {
    const storageTasks: Promise<any>[] = [];

    if (!success) {
      storageTasks.push(this.brainStore.save(`failure_${Date.now()}`, `Task: ${task}\nResult: FAILED - ${result.substring(0, 200)}`, ['experience', 'failure']));
    } else {
      const summary = result.substring(0, 500);
      storageTasks.push(this.brainStore.save(`task_${Date.now()}`, `Task: ${task}\nResult: ${summary}`, ['experience', 'success']));
    }

    const content = `Task: ${task}\nResult: ${result.substring(0, 500)}`;
    storageTasks.push(this.semanticMemory.commit(content, success ? 1 : 2, 'reflection').catch(() => {}));

    await Promise.all(storageTasks);
  }
}
