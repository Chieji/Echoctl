/**
 * Model Discovery & Caching
 *
 * Fetches available models from all authenticated providers,
 * caches results with a configurable TTL (default 24h).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { registry } from "../providers/registry.js";
import { AuthManager } from "../auth/manager.js";
import type { ModelInfo } from "../providers/base.js";

const ECHOCTL_DIR = join(homedir(), ".echoctl");
const CACHE_FILE = join(ECHOCTL_DIR, "models_cache.json");
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedModels {
  models: ModelInfo[];
  fetchedAt: string;
  ttlMs: number;
}

export class ModelDiscovery {
  private authManager: AuthManager;
  private ttlMs: number;

  constructor(authManager: AuthManager, ttlMs: number = DEFAULT_TTL_MS) {
    this.authManager = authManager;
    this.ttlMs = ttlMs;
  }

  /**
   * List models from cache or fetch fresh if expired/missing.
   */
  async listModels(forceRefresh = false): Promise<ModelInfo[]> {
    if (!forceRefresh) {
      const cached = this.loadCache();
      if (cached) {
        return cached.models;
      }
    }

    return this.refresh();
  }

  /**
   * Force refresh models from all authenticated providers.
   */
  async refresh(): Promise<ModelInfo[]> {
    const allModels: ModelInfo[] = [];
    const errors: Array<{ provider: string; error: string }> = [];

    for (const providerName of registry.list()) {
      const provider = registry.get(providerName)!;
      const apiKey = this.authManager.getApiKey(providerName);

      if (!apiKey) {
        continue; // Skip unauthenticated providers
      }

      try {
        await provider.authenticate(apiKey);
        const models = await provider.listModels();
        allModels.push(...models);
      } catch (err) {
        errors.push({
          provider: providerName,
          error: (err as Error).message,
        });
      }
    }

    // Cache results
    this.saveCache(allModels);

    return allModels;
  }

  /**
   * List models for a specific provider.
   */
  async listModelsForProvider(providerName: string): Promise<ModelInfo[]> {
    const provider = registry.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    const apiKey = this.authManager.getApiKey(providerName);
    if (!apiKey) {
      throw new Error(`Not authenticated with ${providerName}`);
    }

    await provider.authenticate(apiKey);
    return provider.listModels();
  }

  /**
   * Load cached models if still valid.
   */
  private loadCache(): CachedModels | null {
    if (!existsSync(CACHE_FILE)) {
      return null;
    }

    try {
      const data = readFileSync(CACHE_FILE, "utf8");
      const cached: CachedModels = JSON.parse(data);

      const fetchedAt = new Date(cached.fetchedAt).getTime();
      const now = Date.now();

      if (now - fetchedAt > (cached.ttlMs || this.ttlMs)) {
        return null; // Cache expired
      }

      return cached;
    } catch {
      return null;
    }
  }

  /**
   * Save models to cache.
   */
  private saveCache(models: ModelInfo[]): void {
    if (!existsSync(ECHOCTL_DIR)) {
      mkdirSync(ECHOCTL_DIR, { recursive: true, mode: 0o700 });
    }

    const cache: CachedModels = {
      models,
      fetchedAt: new Date().toISOString(),
      ttlMs: this.ttlMs,
    };

    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  }

  /**
   * Clear the model cache.
   */
  clearCache(): void {
    if (existsSync(CACHE_FILE)) {
      writeFileSync(CACHE_FILE, "{}", "utf8");
    }
  }
}
