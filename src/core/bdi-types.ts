/**
 * BDI Type Definitions
 */

export enum CognitiveState {
  IDLE = 'IDLE',
  PERCEIVE = 'PERCEIVE',
  REASON = 'REASON',
  PLAN = 'PLAN',
  ACT = 'ACT',
  OBSERVE = 'OBSERVE',
  REFLECT = 'REFLECT',
  LEARN = 'LEARN'
}

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

export interface Desire {
  goal: string;
  constraints: string[];
}

export interface TaskNode {
  id: string;
  task: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  dependencies: string[];
  result?: any;
  subtasks: TaskNode[];
}

export interface Intention {
  goal: string;
  plan: TaskNode[];
  steps: string[];
  currentTaskIndex: number;
}
