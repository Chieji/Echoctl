/**
 * Auth Manager
 *
 * Manages authentication lifecycle: login, logout, switch provider,
 * credential validation, and active session tracking.
 */

import { registry } from "../providers/registry.js";
import type { BaseProvider, ValidationResult } from "../providers/base.js";
import { CredentialStorage } from "./storage.js";
import { SessionManager } from "./session.js";

export interface LoginResult {
  success: boolean;
  provider: string;
  error?: string;
  isNetworkError?: boolean;
}

export class AuthManager {
  private storage: CredentialStorage;
  private session: SessionManager;

  constructor() {
    this.storage = new CredentialStorage();
    this.session = new SessionManager();
  }

  /**
   * Login to a provider with an API key.
   * Validates the key immediately — does not persist invalid keys.
   */
  async login(providerName: string, apiKey: string): Promise<LoginResult> {
    const provider = registry.get(providerName);
    if (!provider) {
      return {
        success: false,
        provider: providerName,
        error: `Unknown provider: ${providerName}. Available: ${registry.list().join(", ")}`,
      };
    }

    // Validate credentials
    const result = await provider.validateCredentials(apiKey);

    if (!result.valid) {
      // If it's a network error, offer to save anyway
      if (result.isNetworkError) {
        return {
          success: false,
          provider: providerName,
          error: result.error,
          isNetworkError: true,
        };
      }
      return {
        success: false,
        provider: providerName,
        error: result.error || "Authentication failed — Invalid API key",
      };
    }

    // Store the credential
    this.storage.store(providerName, apiKey);

    // Update session
    this.session.setProvider(providerName);
    this.session.setAuthenticated(true);

    return { success: true, provider: providerName };
  }

  /**
   * Force-store a credential without validation (for network-error cases).
   */
  forceStore(providerName: string, apiKey: string): void {
    this.storage.store(providerName, apiKey);
    this.session.setProvider(providerName);
    this.session.setAuthenticated(true);
  }

  /**
   * Logout from a provider.
   */
  logout(providerName: string): boolean {
    const removed = this.storage.remove(providerName);
    if (removed && this.session.getProvider() === providerName.toLowerCase()) {
      this.session.setAuthenticated(false);
    }
    return removed;
  }

  /**
   * Get the active provider name.
   */
  activeProvider(): string | null {
    return this.session.getProvider();
  }

  /**
   * Get the API key for a provider (from storage or env).
   */
  getApiKey(providerName: string): string | null {
    const provider = registry.get(providerName);
    if (!provider) return null;
    return this.storage.get(providerName, provider.info.envVar);
  }

  /**
   * Get the credential source for a provider.
   */
  getCredentialSource(providerName: string): "stored" | "env" | "none" {
    const provider = registry.get(providerName);
    if (!provider) return "none";
    return this.storage.getSource(providerName, provider.info.envVar);
  }

  /**
   * Check if a provider is authenticated (has valid credentials).
   */
  isAuthenticated(providerName: string): boolean {
    const provider = registry.get(providerName);
    if (!provider) return false;
    return this.storage.has(providerName, provider.info.envVar);
  }

  /**
   * List all authenticated providers with their credential sources.
   */
  listAuthenticated(): Array<{ provider: string; source: "stored" | "env" }> {
    const result: Array<{ provider: string; source: "stored" | "env" }> = [];

    for (const name of registry.list()) {
      const provider = registry.get(name)!;
      const source = this.storage.getSource(name, provider.info.envVar);
      if (source !== "none") {
        result.push({ provider: name, source });
      }
    }

    return result;
  }

  /**
   * Get the session manager.
   */
  getSession(): SessionManager {
    return this.session;
  }

  /**
   * Get the credential storage.
   */
  getStorage(): CredentialStorage {
    return this.storage;
  }
}
