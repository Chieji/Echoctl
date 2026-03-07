/**
 * State Management System
 * Manages agent state, history, and event logging
 */

import { readFile, writeFile, mkdir, appendFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

export interface AgentState {
  status: 'idle' | 'running' | 'paused' | 'error';
  currentTask?: string;
  currentPlan?: string[];
  lastActivity: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  provider: string;
  yoloMode: boolean;
}

export interface StateEvent {
  timestamp: number;
  type: 'task_start' | 'task_complete' | 'task_error' | 'tool_call' | 'provider_switch' | 'health_check';
  data: any;
}

export interface EchoConfig {
  dataRoot: string;
  statePath: string;
  docsRoot: string;
  logsRoot: string;
  defaultProvider: string;
  autoSave: boolean;
}

const DEFAULT_CONFIG: EchoConfig = {
  dataRoot: join(process.cwd(), 'out', 'data'),
  statePath: join(homedir(), '.config', 'echo-cli'),
  docsRoot: join(process.cwd(), 'docs'),
  logsRoot: join(homedir(), '.config', 'echo-cli', 'logs'),
  defaultProvider: 'gemini',
  autoSave: true,
};

/**
 * State Manager Class
 */
export class StateManager {
  private config: EchoConfig;
  private state: AgentState;
  private stateFile: string;
  private ledgerFile: string;

  constructor(config?: Partial<EchoConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stateFile = join(this.config.statePath, 'state.json');
    this.ledgerFile = join(this.config.logsRoot, 'events.log');
    
    this.state = {
      status: 'idle',
      lastActivity: Date.now(),
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      provider: this.config.defaultProvider,
      yoloMode: false,
    };
  }

  /**
   * Initialize state directories and load state
   */
  async init(): Promise<void> {
    // Create directories
    await mkdir(this.config.statePath, { recursive: true });
    await mkdir(this.config.logsRoot, { recursive: true });
    await mkdir(this.config.dataRoot, { recursive: true });
    await mkdir(this.config.docsRoot, { recursive: true });

    // Load existing state
    await this.loadState();
  }

  /**
   * Load state from file
   */
  async loadState(): Promise<void> {
    try {
      if (existsSync(this.stateFile)) {
        const data = await readFile(this.stateFile, 'utf-8');
        this.state = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  /**
   * Save state to file
   */
  async saveState(): Promise<void> {
    try {
      this.state.lastActivity = Date.now();
      await writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Log an event to the ledger
   */
  async logEvent(event: StateEvent): Promise<void> {
    try {
      const line = JSON.stringify(event) + '\n';
      await appendFile(this.ledgerFile, line);
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Update state
   */
  async updateState(updates: Partial<AgentState>): Promise<void> {
    Object.assign(this.state, updates);
    if (this.config.autoSave) {
      await this.saveState();
    }
  }

  /**
   * Start a task
   */
  async startTask(task: string, plan?: string[]): Promise<void> {
    await this.updateState({
      status: 'running',
      currentTask: task,
      currentPlan: plan,
      totalTasks: this.state.totalTasks + 1,
    });

    await this.logEvent({
      timestamp: Date.now(),
      type: 'task_start',
      data: { task, plan },
    });
  }

  /**
   * Complete a task
   */
  async completeTask(success: boolean): Promise<void> {
    await this.updateState({
      status: 'idle',
      completedTasks: success ? this.state.completedTasks + 1 : this.state.completedTasks,
      failedTasks: !success ? this.state.failedTasks + 1 : this.state.failedTasks,
      currentTask: undefined,
      currentPlan: undefined,
    });

    await this.logEvent({
      timestamp: Date.now(),
      type: success ? 'task_complete' : 'task_error',
      data: { task: this.state.currentTask },
    });
  }

  /**
   * Log a tool call
   */
  async logToolCall(tool: string, params: any, result?: any): Promise<void> {
    await this.logEvent({
      timestamp: Date.now(),
      type: 'tool_call',
      data: { tool, params, result },
    });
  }

  /**
   * Get config
   */
  getConfig(): EchoConfig {
    return { ...this.config };
  }

  /**
   * Get paths
   */
  getPaths(): { state: string; ledger: string; data: string; docs: string; logs: string } {
    return {
      state: this.stateFile,
      ledger: this.ledgerFile,
      data: this.config.dataRoot,
      docs: this.config.docsRoot,
      logs: this.config.logsRoot,
    };
  }

  /**
   * Get recent events from ledger
   */
  async getRecentEvents(limit: number = 50): Promise<StateEvent[]> {
    try {
      if (!existsSync(this.ledgerFile)) {
        return [];
      }

      const data = await readFile(this.ledgerFile, 'utf-8');
      const lines = data.trim().split('\n').filter(Boolean);
      const events = lines.map(line => JSON.parse(line) as StateEvent);
      
      return events.slice(-limit);
    } catch {
      return [];
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<{
    state: 'ok' | 'error';
    ledger: 'ok' | 'error';
    directories: 'ok' | 'error';
    message: string;
  }> {
    const health = {
      state: 'ok' as 'ok' | 'error',
      ledger: 'ok' as 'ok' | 'error',
      directories: 'ok' as 'ok' | 'error',
      message: 'All systems operational',
    };

    try {
      await readFile(this.stateFile, 'utf-8');
    } catch {
      health.state = 'error';
      health.message = 'State file error';
    }

    try {
      await readFile(this.ledgerFile, 'utf-8');
    } catch {
      health.ledger = 'error';
      health.message = 'Ledger file error';
    }

    const dirs = [this.config.dataRoot, this.config.docsRoot, this.config.logsRoot];
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        health.directories = 'error';
        health.message = `Directory missing: ${dir}`;
        break;
      }
    }

    return health;
  }
}

// Singleton instance
let stateManager: StateManager | null = null;

export function getStateManager(): StateManager {
  if (!stateManager) {
    stateManager = new StateManager();
  }
  return stateManager;
}
