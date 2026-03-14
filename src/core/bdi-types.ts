/**
 * BDI Type Definitions
 */

export interface Beliefs {
  memories: string[];
  capabilities: string[];
  context: string;
  environment?: {
    cwd: string;
    gitStatus?: any;
    projectContext?: string;
  };
}

export interface Intention {
  goal: string;
  steps: string[];
  currentStepIndex: number;
}
