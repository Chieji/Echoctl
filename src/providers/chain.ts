/**
 * ProviderChain - Handles failover logic between providers
 */

import { IProvider, Message, ProviderName, ProviderResponse, ChainResult, ProviderConfig } from '../types/index.js';
import { createProvider } from './index.js';

/**
 * ProviderChain manages multiple providers with automatic failover
 */
export class ProviderChain {
  private providers: Map<ProviderName, IProvider>;
  private priorityOrder: ProviderName[];
  private onFailover?: (from: ProviderName, to: ProviderName, error: Error) => void;

  constructor(
    configs: Record<ProviderName, ProviderConfig | undefined>,
    priorityOrder?: ProviderName[],
    onFailover?: (from: ProviderName, to: ProviderName, error: Error) => void
  ) {
    this.providers = new Map();
    this.onFailover = onFailover;
    
    // Initialize providers with their configs
    const providerNames: ProviderName[] = ['openai', 'gemini', 'anthropic'];
    for (const name of providerNames) {
      const config = configs[name];
      if (config?.apiKey) {
        this.providers.set(name, createProvider(name, config));
      }
    }

    // Use provided priority order or default to: gemini -> openai -> anthropic
    this.priorityOrder = priorityOrder || ['gemini', 'openai', 'anthropic'];
  }

  /**
   * Generate response with automatic failover
   */
  async generateWithFailover(
    messages: Message[],
    context?: string,
    preferredProvider?: ProviderName
  ): Promise<ChainResult> {
    const attempts: ProviderName[] = [];
    let lastError: Error | null = null;

    // Determine starting provider
    const startProvider = preferredProvider || this.priorityOrder[0];
    
    // Build ordered list of providers to try
    const providersToTry: ProviderName[] = [startProvider];
    for (const provider of this.priorityOrder) {
      if (provider !== startProvider && this.providers.has(provider)) {
        providersToTry.push(provider);
      }
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
        const response = await provider.generateResponse(messages, context);
        
        return {
          response,
          provider: providerName,
          failoverOccurred: attempts.length > 1,
          attempts,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
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
  }

  /**
   * Remove a provider from the chain
   */
  removeProvider(name: ProviderName): void {
    this.providers.delete(name);
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
