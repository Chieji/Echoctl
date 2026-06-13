/**
 * Configuration Manager
 *
 * Manages ~/.echoctl/config.yaml for persistent settings.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ECHOCTL_DIR = join(homedir(), ".echoctl");
const CONFIG_FILE = join(ECHOCTL_DIR, "config.yaml");

export interface EchoctlConfig {
  provider: string | null;
  model: string | null;
  providers: Record<string, { enabled: boolean }>;
}

const DEFAULT_CONFIG: EchoctlConfig = {
  provider: null,
  model: null,
  providers: {
    openai: { enabled: true },
    anthropic: { enabled: true },
    groq: { enabled: true },
    openrouter: { enabled: true },
    gemini: { enabled: true },
    mistral: { enabled: true },
    deepseek: { enabled: true },
    fireworks: { enabled: true },
    together: { enabled: true },
  },
};

/**
 * Load config from ~/.echoctl/config.yaml
 * Uses a simple key:value parser since we don't want to add a YAML dependency.
 */
export function loadConfig(): EchoctlConfig {
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = readFileSync(CONFIG_FILE, "utf8");
    return parseSimpleYaml(content);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save config to ~/.echoctl/config.yaml
 */
export function saveConfig(config: EchoctlConfig): void {
  if (!existsSync(ECHOCTL_DIR)) {
    mkdirSync(ECHOCTL_DIR, { recursive: true, mode: 0o700 });
  }

  const yaml = serializeSimpleYaml(config);
  writeFileSync(CONFIG_FILE, yaml, "utf8");
}

/**
 * Update a specific config value.
 */
export function updateConfig(updates: Partial<EchoctlConfig>): EchoctlConfig {
  const config = loadConfig();
  const updated = { ...config, ...updates };
  saveConfig(updated);
  return updated;
}

/**
 * Simple YAML-like parser (handles our flat config format).
 */
function parseSimpleYaml(content: string): EchoctlConfig {
  const config: EchoctlConfig = { ...DEFAULT_CONFIG };
  const lines = content.split("\n");

  let currentSection: string | null = null;
  let currentProvider: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Top-level key
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      const [key, ...valueParts] = trimmed.split(":");
      const value = valueParts.join(":").trim();

      if (key === "provider") {
        config.provider = value || null;
        currentSection = null;
      } else if (key === "model") {
        config.model = value || null;
        currentSection = null;
      } else if (key === "providers") {
        currentSection = "providers";
      }
    } else if (currentSection === "providers") {
      // Provider entry
      const match = trimmed.match(/^(\w+):$/);
      if (match) {
        currentProvider = match[1];
        if (!config.providers[currentProvider]) {
          config.providers[currentProvider] = { enabled: true };
        }
      } else if (currentProvider) {
        const enabledMatch = trimmed.match(/^enabled:\s*(true|false)$/);
        if (enabledMatch) {
          config.providers[currentProvider].enabled = enabledMatch[1] === "true";
        }
      }
    }
  }

  return config;
}

/**
 * Serialize config to simple YAML format.
 */
function serializeSimpleYaml(config: EchoctlConfig): string {
  const lines: string[] = [];

  lines.push(`provider: ${config.provider || ""}`);
  lines.push(`model: ${config.model || ""}`);
  lines.push("");
  lines.push("providers:");

  for (const [name, settings] of Object.entries(config.providers)) {
    lines.push(`  ${name}:`);
    lines.push(`    enabled: ${settings.enabled}`);
  }

  return lines.join("\n") + "\n";
}

export { ECHOCTL_DIR, CONFIG_FILE };
