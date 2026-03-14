import { ReActEngine, EngineConfig } from './engine.js';
import { ProviderChain } from '../providers/chain.js';
import { Message } from '../types/index.js';
import chalk from 'chalk';
import { getBrainStore } from '../storage/brain.js';

/**
 * BDI Engine - Belief, Desire, Intention
 * A higher-level cognitive wrapper around the ReAct loop
 */

export interface Beliefs {
  memories: string[];
  capabilities: string[];
  context: string;
}

export interface Intention {
  goal: string;
  steps: string[];
  currentStepIndex: number;
}

export class BDIEngine {
  private engine: ReActEngine;
  private beliefs: Beliefs;
  private intentions: Intention[];
  private brainStore = getBrainStore();

  constructor(providerChain: ProviderChain, config?: Partial<EngineConfig>) {
    this.engine = new ReActEngine(providerChain, config);
    this.beliefs = {
      memories: [],
      capabilities: [
        'FileSystem Access',
        'Web Research',
        'Multi-Provider Failover',
        'Cloud-Synced Memory (Box.com)'
      ],
      context: ''
    };
    this.intentions = [];
  }

  /**
   * Run the BDI cognitive cycle
   */
  async execute(task: string): Promise<{ result: string; intentionSummary: string }> {
    console.log(chalk.bold.magenta('\n🧠 BDI Cognitive Cycle Initiated'));

    // 1. Update Beliefs (Retrieve relevant memories)
    await this.updateBeliefs(task);

    // 2. Formulate Intentions (High-level plan)
    const intention = await this.formulateIntention(task);
    this.intentions.push(intention);

    console.log(chalk.cyan(`\n🔹 Desire: ${intention.goal}`));
    console.log(chalk.dim('🔹 Proposed Intentions:'));
    intention.steps.forEach((step, i) => console.log(chalk.dim(`  ${i + 1}. ${step}`)));

    // 3. Execute Intentions (via ReAct loop)
    console.log(chalk.green('\n▶ Executing main intention path...'));
    const engineResult = await this.engine.run(task);

    // 4. Update long-term memory with new knowledge
    if (engineResult.success) {
      await this.learn(task, engineResult.result);
    }

    return {
      result: engineResult.result,
      intentionSummary: intention.steps.join(' -> ')
    };
  }

  private async updateBeliefs(task: string): Promise<void> {
    const relevantMemories = this.brainStore.search(task, ['experience', 'knowledge']);
    this.beliefs.memories = relevantMemories.map(m => `${m.key}: ${m.value}`);
    
    // Add persona beliefs (Preferences)
    const langPref = this.brainStore.get('user_language_preference');
    if (langPref) {
      this.beliefs.context = `User prefers ${langPref.value} response style.`;
    }
  }

  private async formulateIntention(task: string): Promise<Intention> {
    // For now, simple intention formulation
    // In a more advanced version, this would be an LLM call to plan
    return {
      goal: task,
      steps: ['Analyze requirements', 'Research context', 'Execute technical steps', 'Verify result'],
      currentStepIndex: 0
    };
  }

  private async learn(task: string, result: string): Promise<void> {
    // Store task results as new beliefs
    const summary = result.substring(0, 500);
    await this.brainStore.save(`task_${Date.now()}`, `Task: ${task}\nResult: ${summary}`, ['experience']);
    
    // Try to extract preferences or learned facts
    if (task.toLowerCase().includes('prefer') || task.toLowerCase().includes('use')) {
        await this.brainStore.save('user_preference_update', `Learned from: ${task}`, ['learning']);
    }
  }
}
