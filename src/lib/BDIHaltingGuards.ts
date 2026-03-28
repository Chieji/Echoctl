/**
 * BDI Halting Guards - Safety mechanism to prevent infinite loops
 */
import { Beliefs } from '../core/bdi-types.js';

export interface HaltingGuardConfig {
  maxIterations: number;
  maxDurationMs: number;
}

export const DEFAULT_CONFIGS = {
  BALANCED: { maxIterations: 10, maxDurationMs: 300000 },
  CONSERVATIVE: { maxIterations: 5, maxDurationMs: 60000 },
  AGGRESSIVE: { maxIterations: 20, maxDurationMs: 600000 },
};

export class BDIHaltingGuards {
  private startTime: number = 0;
  private iterations: number = 0;
  private maxIterations: number;
  private maxDurationMs: number;

  constructor(config: HaltingGuardConfig = DEFAULT_CONFIGS.BALANCED) {
    this.maxIterations = config.maxIterations;
    this.maxDurationMs = config.maxDurationMs;
    this.reset();
  }

  reset(): void {
    this.startTime = Date.now();
    this.iterations = 0;
  }

  incrementIteration(): void {
    this.iterations++;
  }

  shouldContinue(beliefs?: Beliefs): boolean {
    this.iterations++;

    // Check iteration limit
    if (this.iterations > this.maxIterations) {
      return false;
    }

    // Check duration limit
    if (Date.now() - this.startTime > this.maxDurationMs) {
      return false;
    }

    return true;
  }

  shouldHalt(beliefs: Beliefs): boolean {
    return !this.shouldContinue(beliefs);
  }
}
