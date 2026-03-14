import { WorkingMemory } from './types.js';

/**
 * Working Memory - Fast, volatile memory for the current cycle
 */
export class WorkingMemoryManager implements WorkingMemory {
  activeTask: string = '';
  context: Record<string, any> = {};
  partialResults: any[] = [];

  setTask(task: string) {
    this.activeTask = task;
    this.context = {};
    this.partialResults = [];
  }

  addContext(key: string, value: any) {
    this.context[key] = value;
  }

  addResult(result: any) {
    this.partialResults.push(result);
  }

  clear() {
    this.activeTask = '';
    this.context = {};
    this.partialResults = [];
  }
}
