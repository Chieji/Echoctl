import { TaskNode } from './bdi-types.js';

/**
 * Observer - Responsible for the 'OBSERVE' phase of the BDI loop.
 * Analyzes the result of an action to determine success or failure.
 */
export class Observer {
  /**
   * Observe and analyze the results of all tasks
   */
  async observe(nodes: TaskNode[]): Promise<{ success: boolean; result: string; failureReason?: string }> {
    const failedNode = nodes.find(n => n.status === 'failed');
    if (failedNode) {
       return {
         success: false,
         result: failedNode.result || 'Task failed without a clear result',
         failureReason: `Task failed: ${failedNode.task}`
       };
    }

    if (nodes.length === 0) {
      return { success: true, result: 'No tasks were executed.' };
    }

    const lastResult = nodes[nodes.length - 1].result || 'No task result captured.';
    return {
      success: true,
      result: lastResult
    };
  }
}
