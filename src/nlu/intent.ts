/**
 * NLU Intent Extraction - Leverages LLMs to parse structured intent from natural language
 */

import { ProviderChain } from '../providers/chain.js';
import { Message, Intent } from '../types/index.js';
import chalk from 'chalk';

export class IntentExtractor {
  constructor(private chain: ProviderChain) {}

  /**
   * Extract structured intent and entities from a natural language task string
   */
  async extractIntent(task: string): Promise<Intent> {
    console.log(chalk.dim(`[NLU] Extracting intent from: "${task}"...`));

    const prompt = `
Extract the structured intent and technical entities from this task: "${task}"

Return ONLY valid JSON.
Format example:
{
  "goal": "Brief restatement of the overall objective",
  "action": "Primary action category (create, fix, analyze, refactor, web-search, browser-automation, help)",
  "entities": {
     "filename": "path/to/file.ext",
     "url": "https://...",
     "selector": "#submit-btn",
     "language": "python",
     "command": "npm install"
  },
  "confidence": 0.0 to 1.0 (float)
}
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
      // Extract first JSON block
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
         throw new Error('No JSON found in NLU response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        goal: parsed.goal || task,
        action: parsed.action || 'unknown',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5
      };
    } catch (error: any) {
      console.error(chalk.red(`[NLU] Intent extraction failed: ${error.message}`));
      // Fallback
      return {
        goal: task,
        action: 'unknown',
        entities: {},
        confidence: 0.1
      };
    }
  }
}
