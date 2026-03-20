import { Beliefs, Intention } from './bdi-types.js';
import { IntentExtractor } from '../nlu/intent.js';
import { ProviderChain } from '../providers/chain.js';

/**
 * Reasoner - Handles the 'Desire' and 'Intention' formation phase.
 * Uses NLU to decompose tasks into structured plans.
 */
export class Reasoner {
  private intentExtractor: IntentExtractor;

  constructor(chain: ProviderChain) {
    this.intentExtractor = new IntentExtractor(chain);
  }

  /**
   * Formulate a high-level plan (Intention) based on current beliefs
   */
  async formulateIntention(task: string, beliefs: Beliefs): Promise<Intention> {
    // 1. Extract structured intent using NLU
    const intent = await this.intentExtractor.extractIntent(task);
    
    // 2. Formulate steps based on action and entities
    const steps = ['Analyze current state'];
    
    if (intent.action === 'web-search') {
      steps.push(`Search web for: ${intent.goal}`);
      steps.push('Synthesize search results');
    } else if (intent.action === 'browser-automation') {
      steps.push(`Navigate to ${intent.entities.url || 'target URL'}`);
      steps.push('Perform browser actions');
    } else if (intent.action === 'create' || intent.action === 'refactor') {
      steps.push(`Identify target files: ${intent.entities.filename || 'context'}`);
      steps.push(`Execute ${intent.action} logic`);
    } else {
      steps.push('Execute technical steps');
    }
    
    steps.push('Verify final result');

    return {
      goal: intent.goal,
      steps,
      currentStepIndex: 0
    };
  }
}
