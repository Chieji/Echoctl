/**
 * Token-Based Context Compaction
 * Automatically summarizes old messages when approaching token limits
 */

import { Message } from '../types/index.js';

/**
 * Estimate token count for a message (rough approximation)
 * Uses ~4 characters per token as a rule of thumb
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate total tokens for a list of messages
 */
export function estimateMessagesTokens(messages: Message[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
}

/**
 * Compact old messages by summarizing them
 */
export async function compactMessages(
  messages: Message[],
  targetTokenLimit: number,
  summarizeFn?: (messages: Message[]) => Promise<string>
): Promise<Message[]> {
  const currentTokens = estimateMessagesTokens(messages);
  
  // If under limit, no compaction needed
  if (currentTokens <= targetTokenLimit) {
    return messages;
  }

  // Keep the most recent messages, summarize the rest
  const recentMessagesCount = Math.max(3, Math.floor(messages.length * 0.3));
  const messagesToSummarize = messages.slice(0, -recentMessagesCount);
  const recentMessages = messages.slice(-recentMessagesCount);

  // Create summary message
  let summary: string;
  
  if (summarizeFn) {
    // Use AI to summarize
    summary = await summarizeFn(messagesToSummarize);
  } else {
    // Fallback: simple concatenation with truncation
    summary = `[Conversation Summary - ${messagesToSummarize.length} messages]\n` +
      messagesToSummarize
        .map(m => `${m.role}: ${m.content.substring(0, 100)}...`)
        .join('\n');
  }

  // Create compacted message list
  const summaryMessage: Message = {
    role: 'system',
    content: summary,
    timestamp: Date.now(),
  };

  return [summaryMessage, ...recentMessages];
}

/**
 * Token watcher class for automatic compaction
 */
export class TokenWatcher {
  private tokenLimit: number;
  private warningThreshold: number;
  private onCompactionNeeded?: (messages: Message[]) => Promise<Message[]>;

  constructor(
    tokenLimit: number = 100000,
    warningThreshold: number = 0.8,
    onCompactionNeeded?: (messages: Message[]) => Promise<Message[]>
  ) {
    this.tokenLimit = tokenLimit;
    this.warningThreshold = warningThreshold;
    this.onCompactionNeeded = onCompactionNeeded;
  }

  /**
   * Check if compaction is needed and perform it
   */
  async checkAndCompact(messages: Message[]): Promise<{
    messages: Message[];
    wasCompacted: boolean;
    tokenCount: number;
    tokenLimit: number;
  }> {
    const tokenCount = estimateMessagesTokens(messages);
    const threshold = this.tokenLimit * this.warningThreshold;

    if (tokenCount >= threshold && this.onCompactionNeeded) {
      const compacted = await this.onCompactionNeeded(messages);
      return {
        messages: compacted,
        wasCompacted: true,
        tokenCount: estimateMessagesTokens(compacted),
        tokenLimit: this.tokenLimit,
      };
    }

    return {
      messages,
      wasCompacted: false,
      tokenCount,
      tokenLimit: this.tokenLimit,
    };
  }

  /**
   * Get token usage percentage
   */
  getTokenUsage(messages: Message[]): number {
    const tokenCount = estimateMessagesTokens(messages);
    return (tokenCount / this.tokenLimit) * 100;
  }

  /**
   * Get remaining tokens
   */
  getRemainingTokens(messages: Message[]): number {
    const tokenCount = estimateMessagesTokens(messages);
    return Math.max(0, this.tokenLimit - tokenCount);
  }
}

/**
 * Provider-specific token limits
 */
export const PROVIDER_TOKEN_LIMITS: Record<string, number> = {
  // OpenAI
  'gpt-4': 128000,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16385,
  
  // Anthropic
  'claude-3-5-sonnet': 200000,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  
  // Google Gemini
  'gemini-1.5-pro': 2097152,
  'gemini-1.5-flash': 1048576,
  'gemini-1.0-pro': 32768,
  'gemini-pro': 32768,
  
  // Qwen
  'qwen-turbo': 6000,
  'qwen-plus': 32000,
  'qwen-max': 32000,
  
  // Ollama (varies by model)
  'llama3.1': 128000,
  'llama3': 8192,
  'mistral': 8192,
  'codellama': 16384,
};

/**
 * Get token limit for a specific model
 */
export function getModelTokenLimit(model: string): number {
  // Check exact match first
  if (PROVIDER_TOKEN_LIMITS[model]) {
    return PROVIDER_TOKEN_LIMITS[model];
  }
  
  // Check partial match
  for (const [key, limit] of Object.entries(PROVIDER_TOKEN_LIMITS)) {
    if (model.toLowerCase().includes(key.toLowerCase())) {
      return limit;
    }
  }
  
  // Default fallback
  return 128000;
}
