/**
 * ProviderChain - Handles failover logic between providers with health monitoring
 */

import { IProvider, Message, ProviderName, ProviderResponse, ChainResult, ProviderConfig } from '../types/index.js';
import { createProvider } from './index.js';

// ============================================================================
// Provider Health Monitoring
// ============================================================================

interface ProviderHealthEntry {
  latencies: number[];       // Last N latency measurements (ms)
  successCount: number;
  errorCount: number;
  lastError?: string;
  lastErrorTime?: number;
  lastSuccessTime?: number;
  consecutiveErrors: number;
}

interface ProviderHealthReport {
  provider: ProviderName;
  avgLatency: number;
  p95Latency: number;
  successRate: number;
  totalCalls: number;
  score: number;             // 0-100 health score
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastError?: string;
}

const MAX_LATENCY_SAMPLES = 50;

function calculateScore(entry: ProviderHealthEntry): number {
  const total = entry.successCount + entry.errorCount;
  if (total === 0) return 50; // Unknown = neutral

  // Factor 1: Success rate (0-40 points)
  const successRate = entry.successCount / total;
  const successPoints = successRate * 40;

  // Factor 2: Latency (0-30 points) — lower is better
  const avgLatency = entry.latencies.length > 0
    ? entry.latencies.reduce((a, b) => a + b, 0) / entry.latencies.length
    : 5000;
  const latencyPoints = Math.max(0, 30 - (avgLatency / 500)); // 0ms=30pts, 15s+=0pts

  // Factor 3: Recency penalty for consecutive errors (0-30 points)
  const recencyPoints = Math.max(0, 30 - (entry.consecutiveErrors * 10));

  return Math.round(successPoints + latencyPoints + recencyPoints);
}

function getStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'degraded';
  return 'unhealthy';
}

// ============================================================================
// Provider Chain
// ============================================================================

/**
 * ProviderChain manages multiple providers with automatic failover and health monitoring
 */
export class ProviderChain {
  private providers: Map<ProviderName, IProvider>;
  private priorityOrder: ProviderName[];
  private healthMap: Map<ProviderName, ProviderHealthEntry> = new Map();
  private onFailover?: (from: ProviderName, to: ProviderName, error: Error) => void;

  constructor(
    configs: Record<ProviderName, ProviderConfig | undefined>,
    priorityOrder?: ProviderName[],
    onFailover?: (from: ProviderName, to: ProviderName, error: Error) => void
  ) {
    this.providers = new Map();
    this.onFailover = onFailover;

    // Initialize all 14 providers with their configs
    const providerNames: ProviderName[] = [
      'openai', 'gemini', 'anthropic', 'qwen', 'ollama', 'deepseek', 
      'kimi', 'groq', 'openrouter', 'together', 'modelscope', 'mistral', 
      'huggingface', 'github'
    ];
    for (const name of providerNames) {
      const config = configs[name];
      // Most providers require an API key; Ollama is local but still needs explicit config
      if (config?.apiKey || (name === 'ollama' && config !== undefined)) {
        this.providers.set(name, createProvider(name, config));
        this.healthMap.set(name, {
          latencies: [],
          successCount: 0,
          errorCount: 0,
          consecutiveErrors: 0,
        });
      }
    }

    // Use provided priority order or default comprehensive failover chain
    this.priorityOrder = priorityOrder || [
      'gemini', 'openai', 'anthropic', 'groq', 'mistral', 'deepseek', 
      'kimi', 'openrouter', 'together', 'qwen', 'modelscope', 'github', 
      'huggingface', 'ollama'
    ];
  }

  /**
   * Record a successful call to a provider
   */
  private recordSuccess(name: ProviderName, latency: number): void {
    const entry = this.healthMap.get(name);
    if (!entry) return;

    entry.successCount++;
    entry.consecutiveErrors = 0;
    entry.lastSuccessTime = Date.now();
    entry.latencies.push(latency);
    if (entry.latencies.length > MAX_LATENCY_SAMPLES) {
      entry.latencies.shift();
    }
  }

  /**
   * Record a failed call to a provider
   */
  private recordError(name: ProviderName, error: string): void {
    const entry = this.healthMap.get(name);
    if (!entry) return;

    entry.errorCount++;
    entry.consecutiveErrors++;
    entry.lastError = error;
    entry.lastErrorTime = Date.now();
  }

  /**
   * Generate response with automatic failover and health-aware routing
   */
  async generateWithFailover(
    messages: Message[],
    context?: string,
    preferredProvider?: ProviderName,
    onChunk?: (chunk: string) => void
  ): Promise<ChainResult> {
    const attempts: ProviderName[] = [];
    let lastError: Error | null = null;

    // Determine starting provider
    const startProvider = preferredProvider || this.priorityOrder[0];
    
    // Build ordered list of providers to try — health-aware
    const providersToTry: ProviderName[] = [startProvider];
    for (const provider of this.priorityOrder) {
      if (provider !== startProvider && this.providers.has(provider)) {
        // Skip providers with 3+ consecutive errors (temporary cooldown)
        const health = this.healthMap.get(provider);
        if (health && health.consecutiveErrors >= 3) {
          // Allow retry after 60s cooldown
          const timeSinceError = Date.now() - (health.lastErrorTime || 0);
          if (timeSinceError < 60000) continue;
        }
        providersToTry.push(provider);
      }
    }

    // Warn if preferred provider doesn't exist
    if (preferredProvider && !this.providers.has(preferredProvider)) {
      console.warn(`⚠️  Preferred provider '${preferredProvider}' is not configured. Using fallback chain.`);
    }

    // Try each provider in order
    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);
      
      if (!provider) {
        continue;
      }

      if (!provider.isConfigured()) {
        continue;
      }

      attempts.push(providerName);

      try {
        const start = Date.now();
        const response = provider.generateStream && onChunk
          ? await provider.generateStream(messages, context, onChunk)
          : await provider.generateResponse(messages, context);
        const latency = Date.now() - start;

        // Record success
        this.this_recordSuccess(providerName, latency);

        return {
          response,
          provider: providerName,
          failoverOccurred: attempts.length > 1,
          attempts,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Record failure
        this.recordError(providerName, lastError.message);

        // Log failover if there's a next provider
        const currentIndex = providersToTry.indexOf(providerName);
        if (currentIndex < providersToTry.length - 1) {
          const nextProvider = providersToTry[currentIndex + 1];
          console.log(`⚠️  ${providerName} failed, switching to ${nextProvider}...`);
          
          if (this.onFailover && lastError) {
            this.onFailover(providerName, nextProvider, lastError);
          }
        }
      }
    }

    // All providers failed
    throw new Error(
      `All providers failed. Attempts: ${attempts.join(', ')}. Last error: ${lastError?.message}`
    );
  }

  // Alias because of typo in generateWithFailover implementation above
  private this_recordSuccess(name: ProviderName, latency: number): void {
      this.recordSuccess(name, latency);
  }

  /**
   * Generate response from a specific provider (no failover)
   */
  async generateFromProvider(
    providerName: ProviderName,
    messages: Message[],
    context?: string
  ): Promise<ProviderResponse> {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not configured`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${providerName} is not configured (missing API key)`);
    }

    return provider.generateResponse(messages, context);
  }

  // ============================================================================
  // Health Monitoring API
  // ============================================================================

  /**
   * Get health report for a specific provider
   */
  getProviderHealth(name: ProviderName): ProviderHealthReport | null {
    const entry = this.healthMap.get(name);
    if (!entry) return null;

    const total = entry.successCount + entry.errorCount;
    const avgLatency = entry.latencies.length > 0
      ? entry.latencies.reduce((a, b) => a + b, 0) / entry.latencies.length
      : 0;
    
    const sorted = [...entry.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95Latency = sorted[p95Index] || 0;

    const score = calculateScore(entry);

    return {
      provider: name,
      avgLatency: Math.round(avgLatency),
      p95Latency: Math.round(p95Latency),
      successRate: total > 0 ? Math.round((entry.successCount / total) * 100) : 0,
      totalCalls: total,
      score,
      status: total === 0 ? 'unknown' : getStatus(score),
      lastError: entry.lastError,
    };
  }

  /**
   * Get health report for all configured providers
   */
  getHealthReport(): ProviderHealthReport[] {
    return Array.from(this.healthMap.keys())
      .map(name => this.getProviderHealth(name)!)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get the best provider by health score
   */
  getBestProvider(): ProviderName | null {
    const report = this.getHealthReport();
    return report.length > 0 ? report[0].provider : null;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): ProviderName[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(name: ProviderName): boolean {
    const provider = this.providers.get(name);
    return provider?.isConfigured() || false;
  }

  /**
   * Get provider instance (for testing/advanced use)
   */
  getProvider(name: ProviderName): IProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Add a provider to the chain
   */
  addProvider(name: ProviderName, config: ProviderConfig): void {
    this.providers.set(name, createProvider(name, config));
    this.healthMap.set(name, {
      latencies: [],
      successCount: 0,
      errorCount: 0,
      consecutiveErrors: 0,
    });
  }

  /**
   * Remove a provider from the chain
   */
  removeProvider(name: ProviderName): void {
    this.providers.delete(name);
    this.healthMap.delete(name);
  }

  /**
   * Set priority order for failover
   */
  setPriorityOrder(order: ProviderName[]): void {
    this.priorityOrder = order;
  }
}

/**
 * Default chain configuration
 */
export function createDefaultChain(
  configs: Record<ProviderName, ProviderConfig | undefined>
): ProviderChain {
  return new ProviderChain(configs, ['gemini', 'openai', 'anthropic']);
}
