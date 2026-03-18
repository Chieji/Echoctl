/**
 * BDI Type Definitions
 */

export type CognitiveState =
  | 'IDLE'
  | 'PERCEIVE'
  | 'REASON'
  | 'PLAN'
  | 'ACT'
  | 'OBSERVE'
  | 'REFLECT'
  | 'LEARN';

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
