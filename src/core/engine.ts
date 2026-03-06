/**
 * ReAct Engine - Reason + Act Loop
 * The core intelligence loop for Echo
 */

import { ProviderChain } from '../providers/chain.js';
import { Message, ProviderName } from '../types/index.js';
import { tools, ToolName } from '../tools/executor.js';
import { loadEchoContext, formatContextForPrompt } from '../tools/context-loader.js';
import chalk from 'chalk';
import ora from 'ora';
import Enquirer from 'enquirer';

export interface EngineConfig {
  yoloMode: boolean;
  maxIterations: number;
  contextLength: number;
}

export interface EngineState {
  messages: Message[];
  iteration: number;
  currentTask: string;
  completedActions: string[];
}

/**
 * System prompt for ReAct behavior
 */
const REACT_SYSTEM_PROMPT = `You are Echo, an autonomous AI agent with tool execution capabilities.

You follow the ReAct (Reason + Act) pattern:
1. REASON: Think about what needs to be done
2. ACT: Choose a tool to execute
3. OBSERVE: Analyze the result
4. REPEAT until the task is complete

Available tools:
- run_command: Execute shell commands
- readFile: Read file contents
- writeFile: Write to files
- listFiles: List directory contents
- deleteFile: Delete files/directories
- executePython: Run Python code
- executeNode: Run Node.js code

When you want to use a tool, respond with:
[TOOL: tool_name]
{"param1": "value1", "param2": "value2"}

For simple chat responses, just respond normally.

Be concise in your reasoning. Focus on action.`;

/**
 * Parse tool call from LLM response
 */
function parseToolCall(content: string): { tool: ToolName; params: any } | null {
  const toolMatch = content.match(/\[TOOL:\s*(\w+)\]\s*\n?({[\s\S]*})/);
  
  if (toolMatch) {
    try {
      const tool = toolMatch[1] as ToolName;
      const params = JSON.parse(toolMatch[2]);
      return { tool, params };
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * ReAct Engine Class
 */
export class ReActEngine {
  private providerChain: ProviderChain;
  private config: EngineConfig;
  private state: EngineState;
  private yoloMode: boolean;

  constructor(providerChain: ProviderChain, config?: Partial<EngineConfig>) {
    this.providerChain = providerChain;
    this.config = {
      yoloMode: false,
      maxIterations: 10,
      contextLength: 10,
      ...config,
    };
    this.yoloMode = this.config.yoloMode;
    this.state = {
      messages: [],
      iteration: 0,
      currentTask: '',
      completedActions: [],
    };
  }

  /**
   * Run the ReAct loop
   */
  async run(task: string): Promise<{ success: boolean; result: string; actions: string[] }> {
    const spinner = ora({ text: 'Thinking...', spinner: 'dots' }).start();
    
    this.state.currentTask = task;
    this.state.iteration = 0;
    this.state.completedActions = [];

    // Load ECHO.md context if available
    const echoContext = await loadEchoContext();
    const systemContext = echoContext 
      ? `${REACT_SYSTEM_PROMPT}\n\n${formatContextForPrompt(echoContext)}`
      : REACT_SYSTEM_PROMPT;

    // Add user message
    this.state.messages.push({
      role: 'user',
      content: task,
      timestamp: Date.now(),
    });

    try {
      while (this.state.iteration < this.config.maxIterations) {
        this.state.iteration++;
        spinner.text = `Thinking (iteration ${this.state.iteration})...`;

        // Get response from LLM
        const result = await this.providerChain.generateWithFailover(
          [
            { role: 'system', content: systemContext, timestamp: Date.now() },
            ...this.state.messages.slice(-this.config.contextLength),
          ]
        );

        const response = result.response.content;
        const toolCall = parseToolCall(response);

        if (toolCall) {
          spinner.stop();
          
          // Execute tool
          const actionResult = await this.executeTool(
            toolCall.tool,
            toolCall.params,
            result.provider
          );

          if (!actionResult) {
            // User cancelled (not in YOLO mode)
            this.state.messages.push({
              role: 'user',
              content: 'Action cancelled by user.',
              timestamp: Date.now(),
            });
            continue;
          }

          // Add observation to messages
          this.state.messages.push({
            role: 'user',
            content: `[TOOL RESULT: ${toolCall.tool}]\n${actionResult.output}`,
            timestamp: Date.now(),
          });

          this.state.completedActions.push(`${toolCall.tool}: ${actionResult.success ? '✓' : '✗'}`);

          spinner.start();
        } else {
          // No tool call - task is complete
          spinner.stop();
          
          // Remove tool call syntax from final response
          const cleanResponse = response.replace(/\[TOOL:\s*\w+\]\s*\n?{[\s\S]*}/g, '').trim();
          
          return {
            success: true,
            result: cleanResponse,
            actions: this.state.completedActions,
          };
        }
      }

      spinner.stop();
      return {
        success: false,
        result: 'Max iterations reached. Task may be incomplete.',
        actions: this.state.completedActions,
      };

    } catch (error: any) {
      spinner.stop();
      return {
        success: false,
        result: error.message || 'An error occurred',
        actions: this.state.completedActions,
      };
    }
  }

  /**
   * Execute a tool with optional confirmation
   */
  private async executeTool(
    tool: ToolName,
    params: any,
    provider: ProviderName
  ): Promise<{ success: boolean; output: string } | null> {
    const dangerousTools = ['runCommand', 'deleteFile', 'executePython', 'executeNode'];
    const needsConfirmation = dangerousTools.includes(tool) && !this.yoloMode;

    if (needsConfirmation) {
      const command = params.command || params.filePath || params.code;
      const preview = typeof command === 'string' 
        ? command.substring(0, 100) + (command.length > 100 ? '...' : '')
        : JSON.stringify(params);

      console.log(chalk.yellow('\n⚠️  Action requires confirmation:'));
      console.log(chalk.dim(`  Tool: ${tool}`));
      console.log(chalk.dim(`  Params: ${preview}\n`));

      const enquirer = new Enquirer();
      const confirm = await enquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Execute this action?',
        initial: false,
      }) as { confirm: boolean };

      if (!confirm.confirm) {
        return null; // Cancelled
      }
    }

    // Execute the tool
    const toolFn = tools[tool];
    if (!toolFn) {
      return {
        success: false,
        output: `Unknown tool: ${tool}`,
      };
    }

    try {
      const paramValues = Object.values(params) as any[];
      const result = await toolFn(...paramValues);
      return result;
    } catch (error: any) {
      return {
        success: false,
        output: error.message,
      };
    }
  }

  /**
   * Set YOLO mode
   */
  setYoloMode(enabled: boolean): void {
    this.yoloMode = enabled;
    this.config.yoloMode = enabled;
  }

  /**
   * Get current state
   */
  getState(): EngineState {
    return { ...this.state };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      messages: [],
      iteration: 0,
      currentTask: '',
      completedActions: [],
    };
  }
}

/**
 * Create engine instance
 */
export function createReActEngine(
  providerChain: ProviderChain,
  config?: Partial<EngineConfig>
): ReActEngine {
  return new ReActEngine(providerChain, config);
}
