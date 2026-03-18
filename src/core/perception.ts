import { getBrainStore } from '../storage/brain.js';
import { LongTermMemory } from '../memory/vector-memory.ts';
import { loadEchoContext } from '../tools/context-loader.js';
import { getGitStatus } from '../tools/git.js';
import { Beliefs } from './bdi-types.js';

/**
 * Perceptor - Handles the 'Belief' update phase of the BDI cycle.
 * It gathers information from the environment, memory, and project context.
 */
export class Perceptor {
  private brainStore = getBrainStore();
  private semanticMemory = new LongTermMemory();

  /**
   * Update beliefs based on the current task and environment
   */
  async perceive(task: string, currentBeliefs: Beliefs): Promise<Beliefs> {
    const beliefs = { ...currentBeliefs };

    // 1. Retrieve relevant memories from Brain Store
    const relevantMemories = this.brainStore.search(task, ['experience', 'knowledge']);
    beliefs.memories = relevantMemories.map(m => `${m.key}: ${m.value}`);

    // 2. Gather Environment Info
    const env: any = {
      cwd: process.cwd()
    };

    // Try to get git status
    try {
      env.gitStatus = await getGitStatus();
    } catch (e) {
      // Not a git repo or git not installed
    }

    // 3. Load Project Context (ECHO.md)
    try {
      const echoContext = await loadEchoContext();
      if (echoContext) {
        env.projectContext = echoContext.rawContent;
      }
    } catch (e) {
      // No ECHO.md found
    }

    beliefs.environment = env;

    // 4. Check for User Preferences
    const langPref = this.brainStore.get('user_language_preference');
    if (langPref) {
      beliefs.context = `${beliefs.context} User prefers ${langPref.value} response style.`.trim();
    }

    // 5. Recall from Semantic layer (Vector memory)
    try {
      const recalled = await this.semanticMemory.recall(task, 3);
      if (recalled.length > 0) {
        beliefs.memories = [...beliefs.memories, ...recalled.map(m => `[RECALLED]: ${m}`)];
      }
    } catch {
      // Ignore if semantic layer is unavailable
    }

    return beliefs;
  }
}
