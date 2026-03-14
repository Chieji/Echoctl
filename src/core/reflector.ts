import { getBrainStore } from '../storage/brain.js';

/**
 * Reflector - Handles the 'Reflection' and 'Learning' phase.
 * It analyzes the outcome of a task and updates the brain store.
 */
export class Reflector {
  private brainStore = getBrainStore();

  /**
   * Reflect on the task result and store learned knowledge
   */
  async reflect(task: string, result: string, success: boolean): Promise<void> {
    if (!success) {
      // Record failure as a lesson
      await this.brainStore.save(`failure_${Date.now()}`, `Task: ${task}\nResult: FAILED - ${result.substring(0, 200)}`, ['experience', 'failure']);
      return;
    }

    // Store successful task results
    const summary = result.substring(0, 500);
    await this.brainStore.save(`task_${Date.now()}`, `Task: ${task}\nResult: ${summary}`, ['experience', 'success']);
    
    // Extract potential preferences or habits
    if (task.toLowerCase().includes('prefer') || task.toLowerCase().includes('always')) {
        await this.brainStore.save('user_learned_preference', `Learned from success: ${task}`, ['learning', 'preference']);
    }
  }
}
