/**
 * ReAct Engine - Reason + Act Loop
 * The core intelligence loop for Echo
 */

import { ProviderChain } from '../providers/chain.js';
import { Message, ProviderName } from '../types/index.js';
import { tools, webTools, gitTools, multiFileTools, lspTools, browserTools, ToolName } from '../tools/executor.js';
import { loadEchoContext, formatContextForPrompt } from '../tools/context-loader.js';
import chalk from 'chalk';
import ora from 'ora';
import Enquirer from 'enquirer';

// Build unified tool registry
const toolRegistry = {
  ...tools,
  ...webTools,
  ...gitTools,
  ...multiFileTools,
  ...lspTools,
  ...browserTools,
};

// Get all tool names for system prompt
const availableTools = Object.keys(toolRegistry);

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
- searchWeb: Search the web using DuckDuckGo (no API key needed)
- scrapeUrl: Scrape content from a URL
- getNews: Get latest news headlines
- getGitStatus: Get git repository status
- gitAdd: Stage files for commit
- gitAddAll: Stage all changes
- gitCommit: Commit staged changes
- gitPush: Push to remote repository
- gitLog: View commit history
- findAndReplace: Find and replace text across multiple files
- searchInFiles: Search for pattern in multiple files
- createFiles: Create multiple files at once
- updateFiles: Update multiple files
- deleteFiles: Delete multiple files
- findFiles: Find files by pattern
- getFileTree: Get directory tree structure
- findSymbolReferences: Find all references to a code symbol
- renameSymbol: Rename a symbol across the codebase
- findSymbolDefinition: Find where a symbol is defined
- detectProjectLanguage: Detect the programming language of a project
- browserNavigate: Navigate to a website URL
- browserScreenshot: Take a screenshot of current page
- browserClick: Click an element on the page
- browserType: Type text into an input field
- browserExtract: Extract text from the page
- browserGetLinks: Get all links from the page
- browserSearchGoogle: Search Google for a query

When you want to use a tool, respond with EXACTLY this format:
[TOOL: tool_name]
{"param1": "value1", "param2": "value2"}

IMPORTANT: 
- Use exact tool names from the list above
- Parameters must be valid JSON
- Do not add any text between [TOOL: ...] and the JSON

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

    // Add user message and prune if needed
    this.state.messages.push({
      role: 'user',
      content: task,
      timestamp: Date.now(),
    });
    
    // Prune messages to prevent unbounded growth (keep last 20)
    const MAX_MESSAGES = 20;
    if (this.state.messages.length > MAX_MESSAGES) {
      this.state.messages = this.state.messages.slice(-MAX_MESSAGES);
    }

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
    tool: string,
    params: any,
    provider: ProviderName
  ): Promise<{ success: boolean; output: string } | null> {
    const dangerousTools = ['runCommand', 'deleteFile', 'executePython', 'executeNode'];
    const needsConfirmation = dangerousTools.includes(tool as string) && !this.yoloMode;

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

    // Execute the tool using unified registry
    const toolFn = toolRegistry[tool as keyof typeof toolRegistry];
    if (!toolFn) {
      return {
        success: false,
        output: `Unknown tool: ${tool}. Available: ${availableTools.join(', ')}`,
      };
    }

    try {
      const paramValues = Object.values(params) as any[];
      const result: any = await (toolFn as any)(...paramValues);
      
      // Format web search results for display
      if (tool === 'searchWeb' || tool === 'getNews') {
        const results = result as any[];
        const formatted = results.map((r: any, i: number) => 
          `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet || ''}\n`
        ).join('\n');
        return { success: true, output: formatted };
      }
      
      // Format scrape results
      if (tool === 'scrapeUrl') {
        const scraped = result as any;
        return { 
          success: true, 
          output: `Title: ${scraped.title}\n\n${scraped.content.substring(0, 2000)}${scraped.content.length > 2000 ? '...' : ''}` 
        };
      }
      
      // Format git results
      if (tool === 'getGitStatus') {
        const status = result as any;
        return {
          success: true,
          output: `Branch: ${status.branch}\nAhead: ${status.ahead}, Behind: ${status.behind}\nChanged: ${status.changed.join(', ') || 'none'}\nStaged: ${status.staged.join(', ') || 'none'}\nUntracked: ${status.untracked.join(', ') || 'none'}`
        };
      }
      
      if (tool === 'gitLog') {
        const logs = result as any[];
        return {
          success: true,
          output: logs.map((l: any, i: number) => `${i + 1}. ${l.hash.substring(0, 8)} - ${l.message} (${l.author}, ${l.date})`).join('\n')
        };
      }
      
      // Format multi-file results
      if (tool === 'findAndReplace' || tool === 'createFiles' || tool === 'updateFiles' || tool === 'deleteFiles') {
        const resultData = result as any;
        return {
          success: resultData.success,
          output: `Edited: ${resultData.edited?.join(', ') || 'none'}\nCreated: ${resultData.created?.join(', ') || 'none'}\nDeleted: ${resultData.deleted?.join(', ') || 'none'}\nFailed: ${resultData.failed?.map((f: any) => f.path).join(', ') || 'none'}`
        };
      }
      
      if (tool === 'searchInFiles') {
        const results = result as any[];
        return {
          success: true,
          output: results.map((r: any) => `${r.path} (${r.matches} matches):\n${r.lines.map((l: any) => `  Line ${l.number}: ${l.content}`).join('\n')}`).join('\n\n')
        };
      }
      
      if (tool === 'getFileTree') {
        return { success: true, output: result as string };
      }
      
      // Format LSP results
      if (tool === 'findSymbolReferences' || tool === 'findSymbolDefinition') {
        const refs = result as any[];
        return {
          success: true,
          output: refs.length > 0 
            ? refs.map((r: any, i: number) => `${i + 1}. ${r.uri}:${r.range.start.line + 1}:${r.range.start.character + 1}`).join('\n')
            : 'No references found'
        };
      }
      
      if (tool === 'renameSymbol') {
        const renameResult = result as any;
        return {
          success: renameResult.success,
          output: renameResult.success 
            ? `Renamed symbol in ${renameResult.filesChanged} file(s)`
            : `Failed: ${renameResult.error}`
        };
      }
      
      if (tool === 'detectProjectLanguage') {
        return { success: true, output: `Detected language: ${result}` };
      }
      
      // Format browser results
      if (tool === 'navigate' || tool === 'searchGoogle') {
        const navResult = result as any;
        return {
          success: navResult.success,
          output: navResult.success 
            ? `Navigated to: ${navResult.url}\nTitle: ${navResult.title}`
            : `Navigation failed: ${navResult.error}`
        };
      }
      
      if (tool === 'screenshot') {
        const ssResult = result as any;
        return {
          success: ssResult.success,
          output: ssResult.success
            ? `Screenshot taken${ssResult.url ? ` and saved to ${ssResult.url}` : ''}`
            : `Screenshot failed: ${ssResult.error}`
        };
      }
      
      if (tool === 'extract' || tool === 'getLinks') {
        return { success: true, output: (result as any).content || result };
      }
      
      return result as { success: boolean; output: string };
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
