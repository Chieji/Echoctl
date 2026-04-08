/**
 * ReAct Engine - Reason + Act Loop
 * The core intelligence loop for Echo
 */

import { ProviderChain } from '../providers/chain.js';
import { Message, ProviderName } from '../types/index.js';
import { tools, webTools, gitTools, multiFileTools, lspTools, browserTools, githubTools, voiceTools, imageTools, ToolName } from '../tools/executor.js';
import { loadEchoContext, formatContextForPrompt } from '../tools/context-loader.js';
import chalk from 'chalk';
import ora from 'ora';
import Enquirer from 'enquirer';
import { buildExtensionSnapshot } from '../extensions/registry.js';
import { BDIEngine } from './bdi-engine.js';

// Initial static tool registry
const staticToolRegistry = {
  ...tools,
  ...webTools,
  ...gitTools,
  ...multiFileTools,
  ...lspTools,
  ...browserTools,
  ...githubTools,
  ...voiceTools,
  ...imageTools,
};

export interface EngineConfig {
  yoloMode: boolean;
  maxIterations: number;
  contextLength: number;
  planMode?: boolean;
}

export interface EngineState {
  messages: Message[];
  iteration: number;
  currentTask: string;
  completedActions: string[];
}

// Define read-only tools for Plan Mode
export const READ_ONLY_TOOLS: ToolName[] = [
  'readFile', 
  'listFiles', 
  'searchWeb', 
  'scrapeUrl', 
  'getNews', 
  'getGitStatus', 
  'gitLog', 
  'searchInFiles', 
  'findFiles', 
  'getFileTree', 
  'findSymbolReferences', 
  'findSymbolDefinition', 
  'detectProjectLanguage', 
  'getLinks', 
  'searchGoogle'
];

/**
 * System prompt generator for ReAct behavior
 */
export function getSystemPrompt(planMode: boolean = false, dynamicTools: Record<string, string> = {}): string {
  let basePrompt = `You are Echo, an autonomous AI agent with tool execution capabilities.

You follow the ReAct (Reason + Act) pattern:
1. REASON: Think about what needs to be done
2. ACT: Choose a tool to execute
3. OBSERVE: Analyze the result
4. REPEAT until the task is complete

Available tools (use EXACT names below):\n`;

  if (planMode) {
    // In plan mode, only show read-only tools
    const toolDescriptions: Record<string, string> = {
      'readFile': 'readFile(filePath): Read file contents',
      'listFiles': 'listFiles(dirPath): List directory contents',
      'searchWeb': 'searchWeb(query, limit?): Search the web using DuckDuckGo',
      'scrapeUrl': 'scrapeUrl(url): Scrape content from a URL',
      'getNews': 'getNews(query?, limit?): Get latest news headlines',
      'getGitStatus': 'getGitStatus(cwd?): Get git repository status',
      'gitLog': 'gitLog(limit?, cwd?): View commit history',
      'searchInFiles': 'searchInFiles(pattern, glob, options?): Search for pattern in files',
      'findFiles': 'findFiles(glob, baseDir?): Find files by pattern',
      'getFileTree': 'getFileTree(dir?, depth?): Get directory tree structure',
      'findSymbolReferences': 'findSymbolReferences(symbol, dir?): Find all references to a code symbol',
      'findSymbolDefinition': 'findSymbolDefinition(symbol, dir?): Find where a symbol is defined',
      'detectProjectLanguage': 'detectProjectLanguage(dir?): Detect the programming language',
      'getLinks': 'getLinks(): Get all links from the page',
      'searchGoogle': 'searchGoogle(query): Search Google for a query'
    };

    for (const t of READ_ONLY_TOOLS) {
      if (toolDescriptions[t]) {
        basePrompt += `- ${toolDescriptions[t]}\n`;
      }
    }

    basePrompt += `\nCRITICAL: You are currently running in PLAN MODE. You CANNOT execute shell commands, edit files, or perform any mutating actions. Your job is ONLY to explore the codebase, research the user's request, and formulate a step-by-step PLAN of what should be done. When you are done exploring, summarize your concrete plan.\n`;
  } else {
    // Show all tools
    basePrompt += `- runCommand(command, options?): Execute shell commands
- readFile(filePath): Read file contents
- writeFile(filePath, content): Write to files
- listFiles(dirPath): List directory contents
- deleteFile(filePath): Delete files/directories
- executePython(code): Run Python code
- executeNode(code): Run Node.js code
- searchWeb(query, limit?): Search the web using DuckDuckGo (no API key)
- scrapeUrl(url): Scrape content from a URL
- getNews(query?, limit?): Get latest news headlines
- searchWikipedia(query, limit?): Search Wikipedia articles (no API key)
- getWikipediaSummary(title): Get Wikipedia page summary
- getRedditPosts(subreddit, limit?, sort?): Get Reddit posts from subreddit
- searchReddit(subreddit, query, limit?): Search Reddit posts
- getHackerNewsTop(limit?): Get top Hacker News stories
- getHackerNewsNew(limit?): Get newest Hacker News stories
- getWebArchive(url): Check if URL is archived on Archive.org
- getWeatherByCity(cityName): Get current weather for city
- getGitStatus(cwd?): Get git repository status
- gitAdd(files, cwd?): Stage files for commit
- gitAddAll(cwd?): Stage all changes
- gitCommit(message, cwd?): Commit staged changes
- gitPush(remote?, branch?, cwd?): Push to remote repository
- gitLog(limit?, cwd?): View commit history
- findAndReplace(pattern, replacement, glob, options?): Find and replace text across files
- searchInFiles(pattern, glob, options?): Search for pattern in files
- createFiles(files): Create multiple files at once (files: [{path, content}])
- updateFiles(files): Update multiple files (files: [{path, content}])
- deleteFiles(paths): Delete multiple files (paths: string[])
- findFiles(glob, baseDir?): Find files by pattern
- getFileTree(dir?, depth?): Get directory tree structure
- findSymbolReferences(symbol, dir?): Find all references to a code symbol
- renameSymbol(oldName, newName, dir?): Rename a symbol across the codebase
- findSymbolDefinition(symbol, dir?): Find where a symbol is defined
- detectProjectLanguage(dir?): Detect the programming language of a project
- navigate(url): Navigate to a website URL
- screenshot(path?): Take a screenshot of current page
- click(selector): Click an element on the page
- type(selector, text): Type text into an input field
- extract(selector?): Extract text from the page
- getLinks(): Get all links from the page
- searchGoogle(query): Search Google for a query
- githubCreatePullRequest(owner, repo, title, head, base?, body?): Create a GitHub PR
- githubCreateIssue(owner, repo, title, body?, labels?): Create a GitHub issue
- githubSearchRepos(query): Search for GitHub repositories
- githubGetUser(): Get information about the linked GitHub user
- transcribe(audioPath): Transcribe audio from a file
- speak(text, voice?): Convert text to speech
- generate(prompt, size?): Generate an image from a prompt
- analyze(imageUrl, prompt?): Analyze an image (Vision)\n`;

    // Add dynamic (MCP) tools
    Object.entries(dynamicTools).forEach(([name, description]) => {
      if (!staticToolRegistry.hasOwnProperty(name)) {
        basePrompt += `- ${name}: ${description}\n`;
      }
    });
  }

  basePrompt += `
When you want to use a tool, respond with EXACTLY this format:
[TOOL: tool_name]
{"param1": "value1", "param2": "value2"}

IMPORTANT: 
- Use EXACT tool names from the list above (they are case-sensitive)
- Parameters must be valid JSON with the correct parameter names shown in parentheses above
- Do not add any text between [TOOL: ...] and the JSON

For simple chat responses, just respond normally.

Be concise in your reasoning. Focus on action.`;

  return basePrompt;
}

/**
 * Parse tool call from LLM response.
 * Resilient to common LLM output variations:
 *   - Tool call inside markdown code fences
 *   - Extra whitespace or newlines between [TOOL:] and JSON
 *   - Surrounding text before/after the tool call
 */
function parseToolCall(content: string): { tool: ToolName; params: any } | null {
  // Strip markdown code fences if the LLM wraps the tool call in them
  let cleaned = content.replace(/```(?:json|text|plaintext)?\s*/gi, '').replace(/```/g, '');

  // Match [TOOL: toolName] followed by a JSON object (possibly with whitespace/newlines)
  const toolMatch = cleaned.match(/\[TOOL:\s*(\w+)\]\s*\n?\s*(\{[\s\S]*?\})\s*(?:\n|$)/);
  
  if (toolMatch) {
    try {
      const tool = toolMatch[1] as ToolName;
      const params = JSON.parse(toolMatch[2]);
      return { tool, params };
    } catch {
      // JSON parse failed — try to extract just the first valid JSON object
      const jsonStart = toolMatch[2].indexOf('{');
      const jsonEnd = toolMatch[2].lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        try {
          const params = JSON.parse(toolMatch[2].substring(jsonStart, jsonEnd + 1));
          return { tool: toolMatch[1] as ToolName, params };
        } catch {
          return null;
        }
      }
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
  private toolRegistry: any = staticToolRegistry;

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
    const spinner = ora({ text: 'Starting engine...', spinner: 'dots' }).start();
    
    // 1. Initialize tool registry with extension tools (MCP + plugins)
    const dynamicToolDescriptions: Record<string, string> = {};
    try {
      spinner.text = 'Initializing extension tools...';
      const snapshot = await buildExtensionSnapshot();
      const dynamicTools: Record<string, any> = {};

      for (const descriptor of Object.values(snapshot.tools)) {
        if (Object.prototype.hasOwnProperty.call(staticToolRegistry, descriptor.name)) {
          snapshot.warnings.push(
            `Extension tool '${descriptor.name}' collides with built-in tool name. Built-in tool kept.`
          );
          continue;
        }

        dynamicTools[descriptor.name] = async (args: any) => (descriptor as any).invoke(args);
        dynamicToolDescriptions[descriptor.name] = (descriptor as any).description;
      }

      this.toolRegistry = {
        ...staticToolRegistry,
        ...dynamicTools,
      };

      for (const warning of snapshot.warnings) {
        console.warn(chalk.yellow(`⚠ ${warning}`));
      }
    } catch {
      spinner.warn('Extension initialization failed. Proceeding with static tools only.');
    }

    spinner.text = 'Thinking...';
    
    this.state.currentTask = task;
    this.state.iteration = 0;
    this.state.completedActions = [];

    // Load ECHO.md context if available
    const echoContext = await loadEchoContext();
    const systemPromptText = getSystemPrompt(this.config.planMode, dynamicToolDescriptions);
    const systemContext = echoContext 
      ? `${systemPromptText}\n\n${formatContextForPrompt(echoContext)}`
      : systemPromptText;

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
          
          if (this.config.planMode && !READ_ONLY_TOOLS.includes(toolCall.tool)) {
            // Block tool execution securely at the engine level if LLM ignores prompt
            this.state.messages.push({
              role: 'user',
              content: `[TOOL RESULT: ${toolCall.tool}]\nError: Cannot execute mutating tool '${toolCall.tool}' in Plan Mode. You are in read-only mode to explore and plan.`,
              timestamp: Date.now(),
            });
            this.state.completedActions.push(`${toolCall.tool}: ✗ (Blocked by Plan Mode)`);
            spinner.start();
            continue;
          }

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
          const label = actionResult.success ? 'TOOL RESULT' : 'TOOL ERROR';
          const recoveryAdvice = actionResult.success 
            ? '' 
            : '\nAnalyze why this failed and suggest a fix or a different approach.';

          this.state.messages.push({
            role: 'user',
            content: `[${label}: ${toolCall.tool}]\n${actionResult.output}${recoveryAdvice}`,
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
    // Dangerous tools that require HITL confirmation
    // Covers both naming conventions the LLM might use
    const dangerousTools = [
      'runCommand', 'run_command',
      'deleteFile', 'delete_file',
      'executePython', 'execute_python',
      'executeNode', 'execute_node',
      'deleteFiles', 'delete_files',
    ];
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

    // Execute the tool using dynamic registry
    const toolFn = this.toolRegistry[tool as keyof typeof this.toolRegistry];
    if (!toolFn) {
      return {
        success: false,
        output: `Unknown tool: ${tool}. Available: ${Object.keys(this.toolRegistry).join(', ')}`,
      };
    }

    try {
      // Pass parameters as a single object so tools can extract by name,
      // OR spread in correct order for tools expecting positional args.
      // We try the object-style first; if the tool expects positional args
      // we fall back to spreading values in the order the LLM provided.
      let result: any;
      try {
        // Most tools accept positional params — spread in declaration order
        const paramValues = Object.values(params) as any[];
        result = await (toolFn as any)(...paramValues);
      } catch (err: any) {
        // If positional call fails, try passing the entire params object
        result = await (toolFn as any)(params);
      }
      
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
      
      // Format GitHub results
      if (tool === 'githubCreatePullRequest' || tool === 'githubCreateIssue') {
        const ghResult = result as any;
        return {
          success: ghResult.success,
          output: ghResult.success 
            ? `Successfully created! URL: ${ghResult.url}`
            : `Failed: ${ghResult.error}`
        };
      }
      
      if (tool === 'githubSearchRepos') {
        const repos = result as any[];
        return {
          success: true,
          output: repos.map((r: any) => `- ${r.full_name} (${r.stars} stars): ${r.description || 'No description'}\n  URL: ${r.url}`).join('\n')
        };
      }
      
      if (tool === 'githubGetUser') {
        const user = result as any;
        return {
          success: true,
          output: `User: @${user.login} (${user.name || 'No name'})\nBio: ${user.bio || 'No bio'}\nPublic Repos: ${user.public_repos}`
        };
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

/**
 * Create BDI engine instance
 */
export function createBDIEngine(
  providerChain: ProviderChain,
  config?: Partial<EngineConfig>
): BDIEngine {
  return new BDIEngine(providerChain, config);
}
