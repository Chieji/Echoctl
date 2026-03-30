import { getBrainStore } from '../storage/brain.js';
import { getLongTermMemory } from '../memory/vector-memory.js';
import { loadEchoContext } from '../tools/context-loader.js';
import { getGitStatus } from '../tools/git.js';
import { Beliefs } from './bdi-types.js';

/**
 * Perceptor - Handles the 'Belief' update phase of the BDI cycle.
 * It gathers information from the environment, memory, and project context.
 */
export class Perceptor {
  private brainStore = getBrainStore();
  private semanticMemory = getLongTermMemory();

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

    // Gather Environment Info and Recall memories in parallel
    const [gitStatus, echoContext, recalled] = await Promise.all([
      getGitStatus().catch(() => null),
      loadEchoContext().catch(() => null),
      this.semanticMemory.recall(task, 3).catch(() => [] as string[])
    ]);

    if (gitStatus) env.gitStatus = gitStatus;
    if (echoContext) env.projectContext = echoContext.rawContent;
    beliefs.environment = env;

    // 4. Check for User Preferences
    const langPref = this.brainStore.get('user_language_preference');
    if (langPref) {
      beliefs.context = `${beliefs.context} User prefers ${langPref.value} response style.`.trim();
    }

    // 5. Add recalled memories if any
    if (recalled && recalled.length > 0) {
      beliefs.memories = [...beliefs.memories, ...recalled.map(m => `[RECALLED]: ${m}`)];
    }

    return beliefs;
  }
}
