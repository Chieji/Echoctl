/**
 * Unified Request Router
 *
 * The caller never talks directly to providers — only the router, which:
 * identifies provider → loads credentials → loads model → dispatches request.
 */

import { registry } from "../providers/registry.js";
import { AuthManager } from "../auth/manager.js";
import type { ChatMessage, ChatResponse, EmbeddingResponse } from "../providers/base.js";

export interface RouterOptions {
  provider?: string;
  model?: string;
}

export class ChatRouter {
  private authManager: AuthManager;

  constructor(authManager: AuthManager) {
    this.authManager = authManager;
  }

  /**
   * Route a chat request to the appropriate provider.
   *
   * Resolution order:
   * 1. Explicit provider/model from options
   * 2. Active provider from session
   * 3. First authenticated provider
   */
  async chat(messages: ChatMessage[], options?: RouterOptions): Promise<ChatResponse> {
    const { provider, apiKey } = this.resolveProvider(options?.provider);

    await provider.authenticate(apiKey);
    return provider.chat(messages, options?.model);
  }

  /**
   * Route an embeddings request to the appropriate provider.
   */
  async embeddings(input: string[], options?: RouterOptions): Promise<EmbeddingResponse> {
    const { provider, apiKey } = this.resolveProvider(options?.provider);

    if (!provider.info.supportsEmbeddings) {
      throw new Error(
        `Provider "${provider.name}" does not support embeddings. ` +
        `Try: ${registry.list().filter((n) => registry.get(n)?.info.supportsEmbeddings).join(", ")}`
      );
    }

    await provider.authenticate(apiKey);
    return provider.embeddings(input);
  }

  /**
   * Resolve which provider to use based on options and session state.
   */
  private resolveProvider(providerName?: string): { provider: ReturnType<typeof registry.get> & object; apiKey: string } {
    // 1. Explicit provider
    if (providerName) {
      const provider = registry.get(providerName);
      if (!provider) {
        throw new Error(
          `Unknown provider: "${providerName}". Available: ${registry.list().join(", ")}`
        );
      }
      const apiKey = this.authManager.getApiKey(providerName);
      if (!apiKey) {
        throw new Error(
          `Not authenticated with "${providerName}". Run: echoctl login ${providerName}`
        );
      }
      return { provider, apiKey };
    }

    // 2. Active provider from session
    const activeProvider = this.authManager.activeProvider();
    if (activeProvider) {
      const provider = registry.get(activeProvider);
      const apiKey = provider ? this.authManager.getApiKey(activeProvider) : null;
      if (provider && apiKey) {
        return { provider, apiKey };
      }
    }

    // 3. First authenticated provider
    const authenticated = this.authManager.listAuthenticated();
    if (authenticated.length > 0) {
      const first = authenticated[0];
      const provider = registry.get(first.provider)!;
      const apiKey = this.authManager.getApiKey(first.provider)!;
      return { provider, apiKey };
    }

    throw new Error(
      "No authenticated providers. Run: echoctl login <provider>\n" +
      `Available providers: ${registry.list().join(", ")}`
    );
  }
}
