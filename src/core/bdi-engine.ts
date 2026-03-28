import { ReActEngine, EngineConfig } from './engine.js';
import { ProviderChain } from '../providers/chain.js';
import chalk from 'chalk';
import { Beliefs, Intention, CognitiveState, TaskNode } from './bdi-types.js';
import { Perceptor } from './perception.js';
import { Reasoner } from './reasoner.js';
import { Planner } from './planner.js';
import { Executor } from './executor.js';
import { Observer } from './observer.js';
import { Reflector } from './reflector.js';
import { Learner } from './learner.js';
import { BDIHaltingGuards, DEFAULT_CONFIGS } from '../lib/BDIHaltingGuards.js';

export interface BDIResult {
  result: string;
  success: boolean;
  plan: TaskNode[];
  intentSummary: string;
}

/**
 * BDI Engine - Belief, Desire, Intention
 * A higher-level cognitive architecture for Echoctl
 */
export class BDIEngine {
  private engine: ReActEngine;
  private beliefs: Beliefs;
  private intentions: Intention[];
  private currentState: CognitiveState = CognitiveState.IDLE;
  private guards = new BDIHaltingGuards(DEFAULT_CONFIGS.BALANCED);

  // Cognitive Modules
  private perceptor = new Perceptor();
  private reasoner: Reasoner;
  private planner: Planner;
  private executor: Executor;
  private observer = new Observer();
  private reflector = new Reflector();
  private learner = new Learner();

  constructor(providerChain: ProviderChain, config?: Partial<EngineConfig>) {
    this.engine = new ReActEngine(providerChain, config);
    this.reasoner = new Reasoner(providerChain);
    this.planner = new Planner(providerChain);
    this.executor = new Executor(this.engine);
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
   * Run the full BDI cognitive cycle
   */
  async execute(task: string, onStateChange?: (state: CognitiveState, progress: number) => void): Promise<BDIResult> {
    const updateState = (state: CognitiveState, progress: number) => {
      this.currentState = state;
      if (onStateChange) {
        onStateChange(state, progress);
      }
    };

    updateState(CognitiveState.IDLE, 0);
    this.guards.reset();
    this.guards.incrementIteration();
    console.log(chalk.bold.magenta('\n🧠 BDI Cognitive Cycle Initiated'));

    // 1. PERCEIVE: Update Beliefs
    updateState(CognitiveState.PERCEIVE, 0.1);
    this.beliefs = await this.perceptor.perceive(task, this.beliefs);

    if (!this.guards.shouldContinue()) {
      return this.haltResult('Halted during perception');
    }

    // 2. REASON: Identify Desire and formulate Intention
    updateState(CognitiveState.REASON, 0.2);
    const intent = await this.reasoner.formulateIntention(task, this.beliefs);

    // 3. PLAN: Decompose intention into a Task Tree
    updateState(CognitiveState.PLAN, 0.3);
    const plan = await this.planner.plan(intent.goal, this.beliefs);
    const intention: Intention = {
      goal: intent.goal,
      plan: plan,
      steps: plan.map(p => p.task),
      currentTaskIndex: 0
    };
    this.intentions.push(intention);

    console.log(chalk.cyan(`\n🔹 Desire: ${intention.goal}`));
    console.log(chalk.dim('🔹 Current Plan:'));
    plan.forEach((node, i) => console.log(chalk.dim(`  ${i + 1}. ${node.task}`)));

    // 4. ACT: Execute the plan using ReAct
    updateState(CognitiveState.ACT, 0.4);
    const executionResult = await this.executor.executeAll(plan);

    // 5. OBSERVE: Capture and analyze results
    updateState(CognitiveState.OBSERVE, 0.8);
    const observation = await this.observer.observe(plan);

    // 6. REFLECT: Evaluate outcomes and strategies
    updateState(CognitiveState.REFLECT, 0.9);
    await this.reflector.reflect(task, observation.result, observation.success);

    // 7. LEARN: Consolidate experience and update memory
    updateState(CognitiveState.LEARN, 1.0);
    await this.learner.learn(task, plan, observation.result, observation.success);

    updateState(CognitiveState.IDLE, 0);

    return {
      result: observation.result,
      success: observation.success,
      plan: plan,
      intentSummary: intention.goal
    };
  }

  private haltResult(reason: string): BDIResult {
    return {
      result: `Engine halted: ${reason}`,
      success: false,
      plan: [],
      intentSummary: 'Halted'
    };
  }

  getCurrentState(): CognitiveState {
    return this.currentState;
  }

  getBeliefs(): Beliefs {
    return { ...this.beliefs };
  }

  getLatestIntention(): Intention | undefined {
    return this.intentions[this.intentions.length - 1];
  }
}
