import { Beliefs, Intention } from './bdi-types.js';

/**
 * Reasoner - Handles the 'Desire' and 'Intention' formation phase.
 * In advanced mode, this uses an LLM to decompose tasks into a steps.
 */
export class Reasoner {
  /**
   * Formulate a high-level plan (Intention) based on current beliefs
   */
  async formulateIntention(task: string, beliefs: Beliefs): Promise<Intention> {
    // Current simple implementation
    // Future: This will be an LLM call considering capabilities and environment
    
    //Heuristic: If task involves git, add git-specific steps
    const steps = ['Analyze requirements'];
    
    if (beliefs.environment?.gitStatus) {
      steps.push('Check repository status');
    }
    
    steps.push('Research context');
    steps.push('Execute technical steps');
    steps.push('Verify result');

    return {
      goal: task,
      steps,
      currentStepIndex: 0
    };
  }
}
