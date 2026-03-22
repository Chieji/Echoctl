/**
 * BDI Halting Guards - Safety mechanism to prevent infinite loops
 */
import { Beliefs } from '../core/bdi-types.js';

export class BDIHaltingGuards {
  private startTime: number = 0;
  private iterations: number = 0;
  private readonly MAX_ITERATIONS = 10;
  private readonly MAX_DURATION = 300000; // 5 minutes

  constructor() {
    this.reset();
  }

  reset(): void {
    this.startTime = Date.now();
    this.iterations = 0;
  }

  shouldHalt(beliefs: Beliefs): boolean {
    this.iterations++;

    // Check iteration limit
    if (this.iterations > this.MAX_ITERATIONS) {
      return true;
    }

    // Check duration limit
    if (Date.now() - this.startTime > this.MAX_DURATION) {
      return true;
    }

    return false;
  }
}
