/**
 * ECHOMEN TUI Types
 */

export type ViewMode = 'chat' | 'agent' | 'code' | 'browser' | 'memory';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
