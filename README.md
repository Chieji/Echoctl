# Echoctl - The Ultimate AI CLI Agent

> **Your thoughts. My echo. Infinite possibility.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/chieji/echoctl)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A resilient, multi-provider AI CLI tool with ReAct agent capabilities, automatic failover, and local code execution. Echo supports **14+ AI providers** and includes a Second Brain knowledge base, HITL approvals, and development track isolation.

---

## ✨ Features

### 🎯 Core Capabilities

| Feature | Description |
|---------|-------------|
| **BDI Engine** | Cognitive reasoning layer (Belief-Desire-Intention) for smarter goal planning |
| **Box.com Sync** | "Generous Memory" - Automatically sync your agent's brain to the cloud |
| **MCP Auto-Sync** | "The Master Thief" - Instantly harvest MCP tools from Claude and Cursor |
| **GitHub Collab** | Create PRs, Manage Issues, and Search Repos directly from chat |
| **Echo Doctor** | Interactive diagnostic & self-healing system ("The Fixer") |
| **ReAct Agent** | Reason → Act → Observe loop for autonomous task completion |
| **Second Brain** | Persistent knowledge base with tags and search |
| **HITL Approvals** | Human-in-the-loop for dangerous operations |
| **Track Isolation** | Separate contexts for different projects |
| **Interactive TUI** | Premium dashboard with live File Tree and boot animations |
| **Smart Mode** | Auto-selects best provider based on task type |
| **Security First** | Encrypted config, Plan Mode (Read-only), and self-healing storage |

### 🧠 ReAct Agent Mode

Echo follows the **Reason + Act** pattern:
1. **Reason** - Thinks about what needs to be done
2. **Act** - Executes tools (shell, files, code, web, browser)
3. **Observe** - Analyzes results
4. **Repeat** - Until task is complete

### 🛡️ Plan Mode
Echo can run in **Plan Mode** (`echo agent run "task" --plan`), where it only uses read-only tools to explore and propose a plan without making any changes.

### 📦 Box.com Cloud Memory
Echo uses Box.com to store its "Master Memory". It learns from your daily interactions across all devices.
```bash
echo auth box # Setup cloud memory sync
```

### 🐙 GitHub Collaboration
Echo can now interact with your GitHub repositories.
```bash
echo auth github # Setup GitHub Personal Access Token
```
Available tools: `githubCreatePullRequest`, `githubCreateIssue`, `githubSearchRepos`.

---

## 🚀 Quick Start

### Installation

```bash
# From npm (coming soon)
npm install -g @chieji/echo-ai-cli

# From source
git clone https://github.com/chieji/echoctl.git
cd echoctl
npm install
npm run build
npm link

# Now you can run 'echo' from anywhere
echo "Hello, Echo!"
```

### 1. Authenticate

```bash
# Auto-detect existing credentials (gcloud, aliyun, env vars)
echo auth sync

# Or interactive setup
echo auth login

# Configure GitHub
echo auth github

# View status
echo auth status
```

**Supported Providers:**
| Provider | Status | Free Tier |
|----------|--------|-----------|
| 🟩 Google Gemini | ✅ Configured | 60 req/min |
| 🟦 OpenAI | ✅ Configured | Paid |
| 🟪 Anthropic Claude | ✅ Configured | Paid |
| 🟥 Alibaba Qwen | ✅ Configured | Free via Aliyun |
| 🟢 Groq | ✅ Configured | Free tier |
| 🟨 Ollama | ✅ Configured | Free (local) |
| 🔵 DeepSeek | ✅ Configured | Paid |
| 🔴 Kimi | ✅ Configured | Paid |
| 🔷 OpenRouter | ✅ Configured | Varies |
| 🟠 Together AI | ✅ Configured | Free tier |
| 🔴 ModelScope | ✅ Configured | Free tier |
| 🟣 Mistral | ✅ Configured | Paid |
| 🟡 Hugging Face | ✅ Configured | Free tier |
| ⬛ GitHub Models | ✅ Configured | Free tier |

### 2. Standard Chat

```bash
# Quick message
echo "What is TypeScript?"

# With options
echo chat "Explain closures" --provider openai
```

### 3. Agent Mode (ReAct)

Echo can autonomously complete tasks using tools:

```bash
# Agent mode - Echo will execute tools to complete tasks
echo chat "Count the lines of code in all .ts files" --agent

# Git operations
echo chat "Check git status and commit changes" --agent

# Multi-file operations
echo chat "Rename all getUser() to fetchUser() in the project" --agent

# Web search (no API key needed!)
echo chat "Search for latest TypeScript news" --agent
echo chat "Get latest tech news" --agent

# YOLO mode - No confirmation prompts
echo chat "Create a new file called test.js with console.log('hello')" --agent --yolo

# Run diagnostic
echo agent doctor
```

**Available Tools:**
- 🛠️ **Shell**: `run_command` - Execute any shell command
- 📁 **Files**: `readFile`, `writeFile`, `listFiles`, `deleteFile`
- 💻 **Code**: `executePython`, `executeNode`
- 🌐 **Web**: `searchWeb`, `scrapeUrl`, `getNews`
- 🌍 **Browser**: `navigate`, `screenshot`, `click`, `type`, `extract`
- 📦 **Git**: `getGitStatus`, `gitAdd`, `gitCommit`, `gitPush`, `gitLog`
- 📝 **Multi-File**: `findAndReplace`, `searchInFiles`, `createFiles`
- 🔬 **LSP**: `findSymbolReferences`, `renameSymbol`, `findSymbolDefinition`

---

## 📚 Command Reference

### Agent Management

```bash
# Show agent health status
echo agent health

# List all available tools
echo agent tools

# Show agent memory and sessions
echo agent memory

# Run agent with a task
echo agent run "my task"

# Show current agent plan
echo agent plan

# View event logs
echo agent logs

# Configure settings
echo agent config --status        # Show current config
echo agent config --plan          # Enable plan mode
echo agent config --auto-accept   # Auto-confirm actions
```

### Authentication

```bash
echo auth login              # Interactive API key setup
echo auth sync               # Auto-detect from gcloud, aliyun, env
echo auth status             # Show configured providers
echo auth logout [provider]  # Remove a provider
```

### Chat & Sessions

```bash
# Standard chat
echo "message"
echo chat "message"

# Options:
#   -p, --provider    Specify provider (openai, gemini, anthropic)
#   -s, --smart       Use smart mode (auto-select provider)
#   --session <id>    Use specific session
#   -r, --raw         Raw output mode
#   -a, --agent       Agent mode (ReAct with tools)
#   --yolo            Execute without confirmation (use with --agent)

echo chat "Debug this" --provider openai
echo chat "Write a poem" --smart
echo chat "Analyze this codebase" --agent

# Session management
echo new-session "Project X"   # Start new session
echo sessions                  # List sessions
echo stats                     # Show statistics
```

### Second Brain (Knowledge Base)

```bash
# Save a memory
echo brain save "api-key" "sk-123456" --tag credentials --tag openai

# Retrieve a memory
echo brain get "api-key"

# Search memories
echo brain search "api"
echo brain search "credentials" --tag openai

# List all memories
echo brain list

# Delete a memory
echo brain delete "api-key"

# Statistics
echo brain stats

# Export/Import
echo brain export -o backup.json
echo brain import backup.json
```

### HITL Approvals

```bash
# List pending approvals
echo approve list

# Approve or deny
echo approve <id> --yes
echo approve <id> --no

# Statistics
echo approve stats

# Auto-approve rules
echo approve add-rule "readFile"
echo approve remove-rule "readFile"
echo approve enable-rule "readFile"
echo approve disable-rule "readFile"

# Clear pending
echo approve clear
```

### Development Tracks

```bash
# Create a new track
echo track new "project-x" --description "Project X development"

# List tracks
echo track list

# Switch to a track
echo track switch "project-x"

# Show current track
echo track status

# Configure track
echo track config "project-x" --provider openai --context-length 20

# Delete a track
echo track delete "project-x"

# Export/Import
echo track export "project-x" -o track.json
echo track import track.json
```

### Dashboard

```bash
# Launch interactive TUI dashboard
echo dashboard
```

### Clear History

```bash
echo clear history    # Clear current session
echo clear session    # Delete current session entirely
echo clear all        # Delete everything (irreversible!)
```

### MCP (Model Context Protocol) 📡

```bash
echo mcp sync                  # "The Master Thief" - Sync tools from Claude/Cursor
echo mcp list                  # List MCP servers
echo mcp add github https://...  # Add server
```

### Plugins

```bash
# Sync from other AI CLIs
echo plugin sync-all           # Sync from Claude, Gemini, Qwen
echo plugin sync-from claude   # Sync from Claude only
echo plugin sync-from gemini   # Sync from Gemini only
echo plugin sync-from qwen     # Sync from Qwen only

# Manage plugins
echo plugin list               # List installed plugins
echo plugin install <package>  # Install from npm
echo plugin uninstall <name>   # Remove a plugin
echo plugin enable <name>      # Enable a plugin
echo plugin disable <name>     # Disable a plugin
```

### Configuration

```bash
echo config show                    # Show config
echo config set default-provider gemini
echo config set smart-mode true
echo config set context-length 10
```

---

## 📁 ECHO.md Context

Place an `ECHO.md` file in your project root to define:
- Tech stack
- Coding standards
- Project rules
- Custom instructions

Echo reads this automatically and adapts its responses.

**Template:**
```markdown
## Project Name
My API Service

## Description
REST API with authentication

## Tech Stack
- Node.js
- Express
- PostgreSQL
- TypeScript

## Project Rules
- Always use async/await
- Write tests first
- Use ESLint

## Coding Standards
- 2 space indentation
- Single quotes
- Semicolons required
```

---

## 🔒 Security

### Command Execution Safety

Echo blocks these patterns by default:
- `rm -rf /`
- `rm -rf *`
- `dd if=/dev/zero`
- Fork bombs
- Format commands
- `wget | sh` (download and execute)

### Confirmation Prompts

By default, Echo asks for confirmation before:
- Running shell commands
- Writing files
- Deleting files
- Executing code

Use `--yolo` mode only when you trust the task completely.

### API Key Security

- Keys stored with machine-specific encryption
- Never logged or displayed in full
- Can be rotated anytime with `echo auth logout`

---

## 🏗 Architecture

```
echoctl/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/             # CLI commands
│   │   ├── auth.ts           # Authentication
│   │   ├── chat.ts           # Chat & sessions
│   │   ├── agent.ts          # Agent management
│   │   ├── brain.ts          # Second Brain
│   │   ├── approve.ts        # HITL approvals
│   │   ├── track.ts          # Development tracks
│   │   ├── plugin.ts         # Plugin sync
│   │   └── tui.ts            # Dashboard
│   ├── core/
│   │   └── engine.ts         # ReAct engine
│   ├── providers/            # AI providers (14)
│   ├── tools/                # Tool executors
│   ├── storage/              # Data persistence
│   │   ├── sessions.ts       # Session storage
│   │   ├── brain.ts          # Knowledge base
│   │   ├── approvals.ts      # HITL queue
│   │   ├── tracks.ts         # Track isolation
│   │   └── mcp.ts            # MCP servers
│   ├── utils/                # Utilities
│   │   ├── config.ts         # Config management
│   │   ├── smart-mode.ts     # Task classifier
│   │   └── security.ts       # Security checks
│   └── tui/                  # TUI components
│       └── dashboard.tsx     # Ink dashboard
├── tests/                    # Jest tests
└── ECHO.md.template          # Context template
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Current Coverage:** ~40% (target: 60%+)

---

## 🛠 Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Test
npm test

# Lint (coming soon)
npm run lint
```

---

## 📊 Roadmap

### Completed (v1.0.0)
- ✅ 14 provider implementations
- ✅ Session storage with persistence
- ✅ Second Brain knowledge base
- ✅ HITL approval system
- ✅ Development track isolation
- ✅ Interactive TUI dashboard
- ✅ Security hardening (encryption, rate limiting)
- ✅ Smart mode task classification
- ✅ Comprehensive test suite

### Planned (v2.0)
- [ ] Voice input support
- [ ] Image generation tools
- [ ] Database tools (SQL, NoSQL)
- [ ] Enhanced LSP integration
- [ ] Multi-agent collaboration
- [ ] WebSocket real-time updates
- [ ] Plugin marketplace

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- ReAct pattern inspired by [Google's ReAct paper](https://arxiv.org/abs/2210.03629)
- MCP integration following [Model Context Protocol spec](https://modelcontextprotocol.io/)
- TUI built with [Ink](https://github.com/vadimdemedes/ink) - React for CLI

---

<div align="center">
    <b>Built with ♥ by chieji</b><br>
    <i>Your thoughts. My echo. Infinite possibility.</i><br>
    <br>
    <sub>Questions? Open an issue on GitHub</sub>
</div>
