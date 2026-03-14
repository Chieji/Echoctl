import { ReActEngine, EngineConfig } from './engine.js';
import { ProviderChain } from '../providers/chain.js';
import chalk from 'chalk';
import { Beliefs, Intention } from './bdi-types.js';
import { Perceptor } from './perception.js';
import { Reasoner } from './reasoner.js';
import { Reflector } from './reflector.js';

/**
 * BDI Engine - Belief, Desire, Intention
 * A higher-level cognitive wrapper around the ReAct loop
 */
export class BDIEngine {
  private engine: ReActEngine;
  private beliefs: Beliefs;
  private intentions: Intention[];
  
  // Cognitive Modules
  private perceptor = new Perceptor();
  private reasoner = new Reasoner();
  private reflector = new Reflector();

  constructor(providerChain: ProviderChain, config?: Partial<EngineConfig>) {
    this.engine = new ReActEngine(providerChain, config);
    this.beliefs = {
      memories: [],
      capabilities: [
        'FileSystem Access',
        'Web Research',
        'Browser Automation (WebHawk)',
        'MCP Tool Integration',
        'Knowledge Mounting',
        'Multi-Provider Failover',
        'Cloud-Synced Memory (Box.com)',
        'GitHub Collaboration (Issues/PRs)'
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

    // 1. PERCEIVE: Update Beliefs (Retrieve memories, environment, context)
    this.beliefs = await this.perceptor.perceive(task, this.beliefs);

    // 2. REASON: Formulate Intentions (High-level plan)
    const intention = await this.reasoner.formulateIntention(task, this.beliefs);
    this.intentions.push(intention);

    console.log(chalk.cyan(`\n🔹 Desire: ${intention.goal}`));
    console.log(chalk.dim('🔹 Proposed Intentions:'));
    intention.steps.forEach((step, i) => console.log(chalk.dim(`  ${i + 1}. ${step}`)));

    // 3. ACT: Execute Intentions (via ReAct loop)
    console.log(chalk.green('\n▶ Executing main intention path...'));
    const engineResult = await this.engine.run(task);

    // 4. REFLECT: Update long-term memory with new knowledge
    await this.reflector.reflect(task, engineResult.result, engineResult.success);

    return {
      result: engineResult.result,
      intentionSummary: intention.steps.join(' -> ')
    };
  }
}
