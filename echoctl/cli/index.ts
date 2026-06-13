#!/usr/bin/env node
/**
 * EchoCTL CLI Entry Point
 *
 * Commands:
 *   echoctl login <provider>
 *   echoctl logout <provider>
 *   echoctl auth status
 *   echoctl providers list
 *   echoctl provider use <provider>
 *   echoctl models list
 *   echoctl models refresh
 *   echoctl session
 *   echoctl chat [--provider <name>] [--model <name>]
 */

import { registerAllProviders } from "../providers/index.js";
import { AuthManager } from "../auth/manager.js";
import { ModelDiscovery } from "../models/discovery.js";
import { ChatRouter } from "../router/chat.js";
import { loadConfig, updateConfig } from "../config/index.js";
import { registry } from "../providers/registry.js";
import { createInterface } from "node:readline";

// Initialize
registerAllProviders();
const authManager = new AuthManager();
const modelDiscovery = new ModelDiscovery(authManager);
const chatRouter = new ChatRouter(authManager);

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];

  try {
    switch (command) {
      case "login":
        await handleLogin(subcommand);
        break;
      case "logout":
        await handleLogout(subcommand);
        break;
      case "auth":
        await handleAuth(subcommand);
        break;
      case "providers":
        await handleProviders(subcommand);
        break;
      case "provider":
        await handleProvider(subcommand, args[2]);
        break;
      case "models":
        await handleModels(subcommand);
        break;
      case "session":
        await handleSession();
        break;
      case "chat":
        await handleChat(args.slice(1));
        break;
      case "help":
      case "--help":
      case "-h":
        printHelp();
        break;
      case "version":
      case "--version":
      case "-v":
        console.log("echoctl v0.1.0");
        break;
      default:
        if (!command) {
          printHelp();
        } else {
          console.error(`Unknown command: ${command}`);
          console.error("Run 'echoctl help' for usage.");
          process.exit(1);
        }
    }
  } catch (err) {
    if (process.argv.includes("--debug")) {
      console.error(err);
    } else {
      console.error(`Error: ${(err as Error).message}`);
    }
    process.exit(1);
  }
}

// ─── Command Handlers ────────────────────────────────────────────────────────

async function handleLogin(providerName?: string) {
  if (!providerName) {
    console.error("Usage: echoctl login <provider>");
    console.error(`Available providers: ${registry.list().join(", ")}`);
    process.exit(1);
  }

  if (!registry.has(providerName)) {
    console.error(`Unknown provider: ${providerName}`);
    console.error(`Available providers: ${registry.list().join(", ")}`);
    process.exit(1);
  }

  const apiKey = await promptSecret(`Enter API Key for ${providerName}: `);
  if (!apiKey) {
    console.error("No API key provided.");
    process.exit(1);
  }

  console.log(`Validating credentials with ${providerName}...`);
  const result = await authManager.login(providerName, apiKey);

  if (result.success) {
    console.log(`✓ Successfully authenticated with ${providerName}`);
  } else if (result.isNetworkError) {
    console.error(`⚠ Could not validate: ${result.error}`);
    const save = await promptConfirm("Save anyway and validate later? (y/n): ");
    if (save) {
      authManager.forceStore(providerName, apiKey);
      console.log(`✓ Credentials saved for ${providerName} (unvalidated)`);
    } else {
      console.log("Credentials not saved.");
    }
  } else {
    console.error(`✗ Authentication failed: ${result.error}`);
    process.exit(1);
  }
}

async function handleLogout(providerName?: string) {
  if (!providerName) {
    console.error("Usage: echoctl logout <provider>");
    process.exit(1);
  }

  const removed = authManager.logout(providerName);
  if (removed) {
    console.log(`✓ Logged out from ${providerName}`);
  } else {
    console.log(`No stored credentials found for ${providerName}`);
  }
}

async function handleAuth(subcommand?: string) {
  if (subcommand !== "status") {
    console.error("Usage: echoctl auth status");
    process.exit(1);
  }

  const authenticated = authManager.listAuthenticated();
  const activeProvider = authManager.activeProvider();

  console.log("\n  Auth Status");
  console.log("  " + "─".repeat(50));

  if (authenticated.length === 0) {
    console.log("  No authenticated providers.");
    console.log(`\n  Run 'echoctl login <provider>' to authenticate.`);
    console.log(`  Available: ${registry.list().join(", ")}`);
    console.log("\n  Credential precedence: stored → env var → unauthenticated");
  } else {
    console.log(`  Active provider: ${activeProvider || "(none)"}\n`);
    console.log("  Provider        Source    Status");
    console.log("  " + "─".repeat(40));
    for (const { provider, source } of authenticated) {
      const isActive = provider === activeProvider ? " ← active" : "";
      const sourceLabel = source === "stored" ? "keychain" : "env var";
      console.log(`  ${provider.padEnd(16)} ${sourceLabel.padEnd(10)} ✓${isActive}`);
    }
    console.log("\n  Credential precedence: stored → env var → unauthenticated");
  }
  console.log("");
}

async function handleProviders(subcommand?: string) {
  if (subcommand !== "list") {
    console.error("Usage: echoctl providers list");
    process.exit(1);
  }

  const config = loadConfig();

  console.log("\n  Registered Providers");
  console.log("  " + "─".repeat(60));
  console.log("  Provider        Chat  Embed  Vision  Tools  Env Var");
  console.log("  " + "─".repeat(60));

  for (const name of registry.list()) {
    const provider = registry.get(name)!;
    const info = provider.info;
    const enabled = config.providers[name]?.enabled !== false;
    const status = enabled ? "" : " (disabled)";
    console.log(
      `  ${info.displayName.padEnd(16)} ${yn(info.supportsChat).padEnd(6)}${yn(info.supportsEmbeddings).padEnd(7)}${yn(info.supportsVision).padEnd(8)}${yn(info.supportsTools).padEnd(7)}${info.envVar}${status}`
    );
  }
  console.log("");
}

async function handleProvider(subcommand?: string, providerName?: string) {
  if (subcommand !== "use" || !providerName) {
    console.error("Usage: echoctl provider use <provider>");
    process.exit(1);
  }

  if (!registry.has(providerName)) {
    console.error(`Unknown provider: ${providerName}`);
    console.error(`Available: ${registry.list().join(", ")}`);
    process.exit(1);
  }

  updateConfig({ provider: providerName });
  authManager.getSession().setProvider(providerName);
  console.log(`✓ Active provider set to: ${providerName}`);
}

async function handleModels(subcommand?: string) {
  if (subcommand === "refresh") {
    console.log("Refreshing models from all authenticated providers...");
    const models = await modelDiscovery.refresh();
    console.log(`✓ Found ${models.length} models\n`);
    printModelsTable(models);
  } else if (subcommand === "list") {
    const models = await modelDiscovery.listModels();
    if (models.length === 0) {
      console.log("No models cached. Run 'echoctl models refresh' to fetch.");
      return;
    }
    printModelsTable(models);
  } else {
    console.error("Usage: echoctl models list|refresh");
    process.exit(1);
  }
}

async function handleSession() {
  const session = authManager.getSession();
  const state = session.getState();

  console.log("\n  Session");
  console.log("  " + "─".repeat(40));
  console.log(`  Provider:      ${state.provider || "(none)"}`);
  console.log(`  Model:         ${state.model || "(default)"}`);
  console.log(`  Authenticated: ${state.authenticated ? "yes" : "no"}`);
  console.log(`  Last login:    ${state.lastLoginAt || "never"}`);
  console.log("");
}

async function handleChat(args: string[]) {
  let provider: string | undefined;
  let model: string | undefined;

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--provider" && args[i + 1]) {
      provider = args[++i];
    } else if (args[i] === "--model" && args[i + 1]) {
      model = args[++i];
    }
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const activeProvider = provider || authManager.activeProvider() || "auto";
  console.log(`\n  EchoCTL Chat (provider: ${activeProvider}, model: ${model || "default"})`);
  console.log("  Type 'exit' or Ctrl+C to quit.\n");

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  const prompt = () => {
    rl.question("you> ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed === "exit" || trimmed === "quit") {
        rl.close();
        return;
      }

      messages.push({ role: "user", content: trimmed });

      try {
        const response = await chatRouter.chat(messages, { provider, model });
        messages.push({ role: "assistant", content: response.content });
        console.log(`\nassistant> ${response.content}\n`);
      } catch (err) {
        console.error(`\nError: ${(err as Error).message}\n`);
      }

      prompt();
    });
  };

  prompt();
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function printModelsTable(models: Array<{ provider: string; id: string; name: string }>) {
  console.log("  Provider        Model");
  console.log("  " + "─".repeat(50));
  for (const m of models.slice(0, 50)) {
    console.log(`  ${m.provider.padEnd(16)} ${m.name || m.id}`);
  }
  if (models.length > 50) {
    console.log(`  ... and ${models.length - 50} more`);
  }
  console.log("");
}

function yn(val: boolean): string {
  return val ? "✓" : "–";
}

function promptSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    // Note: In a real CLI, you'd hide input. For now, just prompt.
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith("y"));
    });
  });
}

function printHelp() {
  console.log(`
  EchoCTL — Multi-Provider AI CLI

  Usage: echoctl <command> [options]

  Authentication:
    login <provider>       Authenticate with a provider
    logout <provider>      Remove stored credentials
    auth status            Show authentication status

  Providers:
    providers list         List all registered providers
    provider use <name>    Set the active provider

  Models:
    models list            List cached models
    models refresh         Refresh models from all providers

  Chat:
    chat                   Start interactive chat
      --provider <name>    Override provider for this session
      --model <name>       Override model for this session

  Session:
    session                Show current session state

  Other:
    help                   Show this help message
    version                Show version

  Credential Precedence:
    stored (keychain/encrypted) → environment variable → unauthenticated

  Environment Variables:
    OPENAI_API_KEY         OpenAI
    ANTHROPIC_API_KEY      Anthropic
    GROQ_API_KEY           Groq
    OPENROUTER_API_KEY     OpenRouter
    GOOGLE_API_KEY         Google Gemini
    FIREWORKS_API_KEY      Fireworks AI
    TOGETHER_API_KEY       Together AI
    DEEPSEEK_API_KEY       DeepSeek
    MISTRAL_API_KEY        Mistral

  Examples:
    echoctl login openai
    echoctl provider use groq
    echoctl models list
    echoctl chat --provider anthropic --model claude-sonnet-4-20250514
`);
}

main();
