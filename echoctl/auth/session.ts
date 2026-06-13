/**
 * Session Manager
 *
 * Tracks current provider, selected model, auth status, and login timestamp.
 * Persists session state to ~/.echoctl/session.json.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ECHOCTL_DIR = join(homedir(), ".echoctl");
const SESSION_FILE = join(ECHOCTL_DIR, "session.json");

interface SessionState {
  provider: string | null;
  model: string | null;
  authenticated: boolean;
  lastLoginAt: string | null;
}

export class SessionManager {
  private state: SessionState;

  constructor() {
    this.state = this.load();
  }

  private load(): SessionState {
    const defaultState: SessionState = {
      provider: null,
      model: null,
      authenticated: false,
      lastLoginAt: null,
    };

    if (!existsSync(SESSION_FILE)) {
      return defaultState;
    }

    try {
      const data = readFileSync(SESSION_FILE, "utf8");
      return { ...defaultState, ...JSON.parse(data) };
    } catch {
      return defaultState;
    }
  }

  private save(): void {
    if (!existsSync(ECHOCTL_DIR)) {
      mkdirSync(ECHOCTL_DIR, { recursive: true, mode: 0o700 });
    }
    writeFileSync(SESSION_FILE, JSON.stringify(this.state, null, 2), "utf8");
  }

  getProvider(): string | null {
    return this.state.provider;
  }

  setProvider(provider: string): void {
    this.state.provider = provider.toLowerCase();
    this.save();
  }

  getModel(): string | null {
    return this.state.model;
  }

  setModel(model: string): void {
    this.state.model = model;
    this.save();
  }

  isAuthenticated(): boolean {
    return this.state.authenticated;
  }

  setAuthenticated(authenticated: boolean): void {
    this.state.authenticated = authenticated;
    if (authenticated) {
      this.state.lastLoginAt = new Date().toISOString();
    }
    this.save();
  }

  getLastLoginAt(): string | null {
    return this.state.lastLoginAt;
  }

  getState(): Readonly<SessionState> {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      provider: null,
      model: null,
      authenticated: false,
      lastLoginAt: null,
    };
    this.save();
  }
}
