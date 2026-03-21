import { Beliefs, TaskNode } from './bdi-types.js';
import { ProviderChain } from '../providers/chain.js';

/**
 * Planner - Decomposes goals into a hierarchical task tree.
 */
export class Planner {
  constructor(private chain: ProviderChain) {}

  /**
   * Decompose a goal into a series of tasks (Intention)
   */
  async plan(task: string, beliefs: Beliefs): Promise<TaskNode[]> {
    const prompt = `
Task: "${task}"
Current Context: ${beliefs.context}
Capabilities: ${beliefs.capabilities.join(', ')}

Decompose this task into a step-by-step plan for an AI agent.
Break it down into granular subtasks that can be executed with tools.

Return ONLY valid JSON in this format:
[
  {
    "id": "1",
    "task": "Description of the first subtask",
    "dependencies": [],
    "subtasks": []
  },
  {
    "id": "2",
    "task": "Description of the second subtask",
    "dependencies": ["1"],
    "subtasks": []
  }
]
`;

    try {
      const result = await this.chain.generateWithFailover([
        {
          role: 'user',
          content: prompt,
          timestamp: Date.now()
        }
      ]);

      const content = result.response.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
         throw new Error('No JSON array found in Planner response');
      }

      const parsed: any[] = JSON.parse(jsonMatch[0]);

      return parsed.map(node => this.mapToTaskNode(node));
    } catch (error) {
      // Fallback: simple linear plan
      return [
        {
          id: '1',
          task: `Execute: ${task}`,
          status: 'pending',
          dependencies: [],
          subtasks: []
        }
      ];
    }
  }

  private mapToTaskNode(node: any): TaskNode {
    return {
      id: node.id || Math.random().toString(36).substr(2, 9),
      task: node.task || 'Unknown task',
      status: 'pending',
      dependencies: node.dependencies || [],
      subtasks: (node.subtasks || []).map((sn: any) => this.mapToTaskNode(sn))
    };
  }
}
