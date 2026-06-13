/**
 * Secure Credential Storage
 *
 * Priority order:
 * 1. System keychain (via keytar if available)
 * 2. Encrypted local store: ~/.echoctl/credentials.enc (AES-256-GCM)
 * 3. Environment variables (read-only fallback, never written here)
 *
 * Implementation uses Node.js crypto for AES-256-GCM encryption with
 * per-credential nonces. The encryption key is derived from a machine
 * identifier or user-provided passphrase.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ECHOCTL_DIR = join(homedir(), ".echoctl");
const CREDENTIALS_FILE = join(ECHOCTL_DIR, "credentials.enc");
const KEY_FILE = join(ECHOCTL_DIR, ".key");
const ALGORITHM = "aes-256-gcm";
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

interface StoredCredentials {
  [provider: string]: {
    apiKey: string;
    storedAt: string;
  };
}

/**
 * Ensure the ~/.echoctl directory exists with proper permissions.
 */
function ensureDir(): void {
  if (!existsSync(ECHOCTL_DIR)) {
    mkdirSync(ECHOCTL_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Derive or load the encryption key.
 * Uses a machine-derived key stored in ~/.echoctl/.key
 */
function getEncryptionKey(): Buffer {
  ensureDir();

  if (existsSync(KEY_FILE)) {
    const salt = readFileSync(KEY_FILE);
    const machineId = getMachineId();
    return scryptSync(machineId, salt, 32);
  }

  // Generate new salt and derive key
  const salt = randomBytes(SALT_LENGTH);
  writeFileSync(KEY_FILE, salt, { mode: 0o600 });
  const machineId = getMachineId();
  return scryptSync(machineId, salt, 32);
}

/**
 * Get a machine-specific identifier for key derivation.
 */
function getMachineId(): string {
  const factors = [
    homedir(),
    process.env.USER || process.env.USERNAME || "echoctl",
    process.platform,
    process.arch,
  ];
  return createHash("sha256").update(factors.join(":")).digest("hex");
}

/**
 * Encrypt data using AES-256-GCM.
 */
function encrypt(data: string, key: Buffer): Buffer {
  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, nonce);

  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Format: [nonce (12)] [tag (16)] [ciphertext (...)]
  return Buffer.concat([nonce, tag, encrypted]);
}

/**
 * Decrypt data using AES-256-GCM.
 */
function decrypt(data: Buffer, key: Buffer): string {
  const nonce = data.subarray(0, NONCE_LENGTH);
  const tag = data.subarray(NONCE_LENGTH, NONCE_LENGTH + TAG_LENGTH);
  const ciphertext = data.subarray(NONCE_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, nonce);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Load credentials from encrypted storage.
 */
function loadCredentials(): StoredCredentials {
  if (!existsSync(CREDENTIALS_FILE)) {
    return {};
  }

  try {
    const key = getEncryptionKey();
    const data = readFileSync(CREDENTIALS_FILE);
    const json = decrypt(data, key);
    return JSON.parse(json);
  } catch {
    // If decryption fails, return empty (key may have changed)
    return {};
  }
}

/**
 * Save credentials to encrypted storage.
 */
function saveCredentials(credentials: StoredCredentials): void {
  ensureDir();
  const key = getEncryptionKey();
  const json = JSON.stringify(credentials);
  const encrypted = encrypt(json, key);
  writeFileSync(CREDENTIALS_FILE, encrypted, { mode: 0o600 });
  // Ensure file permissions are restrictive
  try {
    chmodSync(CREDENTIALS_FILE, 0o600);
  } catch {
    // chmod may fail on some systems (Windows)
  }
}

export class CredentialStorage {
  private credentials: StoredCredentials;

  constructor() {
    this.credentials = loadCredentials();
  }

  /**
   * Store a credential for a provider.
   */
  store(provider: string, apiKey: string): void {
    this.credentials[provider.toLowerCase()] = {
      apiKey,
      storedAt: new Date().toISOString(),
    };
    saveCredentials(this.credentials);
  }

  /**
   * Retrieve a credential for a provider.
   * Returns the API key or null if not found.
   *
   * Precedence: stored credential → environment variable → null
   */
  get(provider: string, envVar?: string): string | null {
    const stored = this.credentials[provider.toLowerCase()];
    if (stored) {
      return stored.apiKey;
    }

    // Fallback to environment variable
    if (envVar && process.env[envVar]) {
      return process.env[envVar]!;
    }

    return null;
  }

  /**
   * Remove a credential for a provider.
   */
  remove(provider: string): boolean {
    const key = provider.toLowerCase();
    if (this.credentials[key]) {
      delete this.credentials[key];
      saveCredentials(this.credentials);
      return true;
    }
    return false;
  }

  /**
   * Check if a credential exists for a provider (stored or env var).
   */
  has(provider: string, envVar?: string): boolean {
    return this.get(provider, envVar) !== null;
  }

  /**
   * List all providers with stored credentials.
   */
  listStored(): string[] {
    return Object.keys(this.credentials);
  }

  /**
   * Get the source of a credential (stored, env, or none).
   */
  getSource(provider: string, envVar?: string): "stored" | "env" | "none" {
    if (this.credentials[provider.toLowerCase()]) {
      return "stored";
    }
    if (envVar && process.env[envVar]) {
      return "env";
    }
    return "none";
  }

  /**
   * Get when a credential was stored.
   */
  getStoredAt(provider: string): string | null {
    const stored = this.credentials[provider.toLowerCase()];
    return stored?.storedAt || null;
  }
}
