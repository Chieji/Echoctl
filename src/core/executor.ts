import { ReActEngine } from './engine.js';
import { TaskNode } from './bdi-types.js';

/**
 * Executor - Responsible for the 'ACT' phase of the BDI loop.
 * It carries out the tasks in the plan using the ReAct loop.
 */
export class Executor {
  constructor(private engine: ReActEngine) {}

  /**
   * Execute a single task node and its subtasks
   */
  async execute(node: TaskNode): Promise<{ result: string; success: boolean }> {
    node.status = 'active';

    // Execute subtasks first
    if (node.subtasks.length > 0) {
      for (const sub of node.subtasks) {
        if (sub.status === 'pending') {
          const subResult = await this.execute(sub);
          if (!subResult.success) {
            node.status = 'failed';
            return { result: `Subtask failed: ${sub.task}`, success: false };
          }
        }
      }
    }

    // Now execute the main task
    try {
      const result = await this.engine.run(node.task);
      node.result = result.result;
      node.status = result.success ? 'completed' : 'failed';
      return { result: result.result, success: result.success };
    } catch (error: any) {
      node.status = 'failed';
      return { result: error.message, success: false };
    }
  }

  /**
   * Execute a full sequence of task nodes
   */
  async executeAll(nodes: TaskNode[]): Promise<{ result: string; success: boolean }> {
    let finalResult = 'All tasks completed successfully.';
    let success = true;

    for (const node of nodes) {
      if (node.status === 'pending') {
        const result = await this.execute(node);
        if (!result.success) {
          finalResult = `Task execution failed at: ${node.task}. Error: ${result.result}`;
          success = false;
          break;
        }
        finalResult = result.result;
      }
    }

    return { result: finalResult, success };
  }
}
