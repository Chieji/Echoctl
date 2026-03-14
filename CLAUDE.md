# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Echoctl is a TypeScript/Node.js CLI tool providing a multi-provider AI agent with ReAct (Reason + Act) capabilities. It supports 14+ AI providers with automatic failover, tool execution, a Second Brain knowledge base, and plugin sync from Claude Code, Gemini CLI, and Qwen Code.

## Build Commands

```bash
# Install dependencies
npm install

# Build (runs build.sh which adds .js extensions for ESM compatibility)
npm run build

# Development mode (build + run)
npm run dev

# Run the CLI after building
node dist/index.js --help

# Or if linked globally
echo --help
```

## Test Commands

```bash
# Run all tests (uses experimental-vm-modules for ESM)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Run single test file
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/brain.test.ts

# Run tests matching a pattern
node --experimental-vm-modules node_modules/jest/bin/jest.js --testNamePattern="should save memory"
```

## Architecture

### Entry Point
- `src/index.ts` - CLI entry using Commander.js, registers all commands

### Core Directories

**src/commands/** - CLI command implementations
- `chat.ts` - Main chat with --agent mode for ReAct
- `auth.ts` - Provider authentication (auto-detects gcloud, aliyun, env vars)
- `agent.ts` - Agent health, tools, memory management
- `brain.ts` - Second Brain knowledge base (CRUD + tags)
- `approve.ts` - HITL (Human-in-the-Loop) approval queue
- `track.ts` - Development track isolation
- `plugin.ts` - Plugin sync from Claude/Gemini/Qwen
- `tui.ts` - Interactive dashboard using Ink

**src/core/**
- `engine.ts` - ReAct engine: Reason → Act → Observe loop, tool registry, confirmation prompts

**src/providers/** - 14 AI provider implementations
- `base.ts` - Abstract BaseProvider class all providers extend
- `index.ts` - Provider factory with createProvider()
- `chain.ts` - ProviderChain for automatic failover
- Individual providers: openai.ts, gemini.ts, anthropic.ts, qwen.ts, ollama.ts, deepseek.ts, kimi.ts, groq.ts, openrouter.ts, together.ts, modelscope.ts, mistral.ts, huggingface.ts, github-models.ts

**src/tools/** - Tool executors available to ReAct agent
- `executor.ts` - Tool registry exporting shell, file, code, web, git, multi-file, LSP, browser tools
- `browser.ts` - Playwright-based browser automation
- `git.ts` - Git operations wrapper
- `multi-file.ts` - Multi-file operations (find/replace across codebase)
- `context-loader.ts` - ECHO.md project context loading

**src/storage/** - Data persistence using lowdb (JSON files)
- `sessions.ts` - Chat session storage (~/.config/echo-cli/history.json)
- `brain.ts` - Knowledge base with tags
- `approvals.ts` - HITL approval queue
- `tracks.ts` - Development track isolation
- `mcp.ts` - MCP server configuration

**src/utils/**
- `config.ts` - Configuration management
- `smart-mode.ts` - Task classifier for auto-provider selection
- `security.ts` - Dangerous command blocking
- `token-watcher.ts` - Token usage tracking

**src/tui/** - React-based CLI UI
- `dashboard.tsx` - Interactive dashboard using Ink

### Type System
- `src/types/index.ts` - Shared TypeScript interfaces (Message, ProviderResponse, etc.)

### Build Process

1. TypeScript compiles `src/` to `dist/` (ES2022, ESM modules)
2. `build.sh` post-processes to add `.js` extensions to imports (required for ESM)
3. Output is native ESM with inline source maps

### Testing

- Jest with ts-jest/presets/default-esm
- Must use `--experimental-vm-modules` for ESM support
- Tests located in `tests/*.test.ts`
- Coverage target: 60%+

## Key Patterns

### Provider Implementation
All providers extend `BaseProvider` and implement:
- `generateResponse(messages, context?)` - Core generation method
- `extractContent(response)` - Parse provider-specific response format
- `extractUsage(response)` - Extract token usage
- `isConfigured()` - Check if API key is set

### Tool Registration
Tools are exported from `executor.ts` and registered in `engine.ts` toolRegistry. Tools must parse `[TOOL: name]\n{params}` format from LLM responses.

### ECHO.md Context
Projects can define `ECHO.md` files with tech stack, coding standards, and rules. Echo automatically loads these from current or parent directories (up to 10 levels).

## Security Considerations

- Dangerous commands (rm -rf /, dd, fork bombs) are blocked in `security.ts`
- HITL confirmations required for destructive operations (unless --yolo)
- API keys stored with machine-specific encryption
- 30s timeout on shell commands, 10MB output buffer limit

## Documentation

- `README.md` - User-facing documentation
- `AGENTS.md` - How the ReAct agent operates
- `TOOLS.md` - Tool capability reference
- `PLUGINS.md` - Plugin sync documentation
- `SOUL.md` - Project philosophy and boundaries
- `ECHO.md.template` - Template for project context files

## CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):
- Tests on Node 18.x, 20.x, 22.x
- Build and artifact upload
- NPM publish on releases
