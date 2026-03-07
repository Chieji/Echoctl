# Echo CLI

> **Your thoughts. My echo. The Ultimate Agentic Terminal.**

A resilient, multi-provider AI CLI tool with ReAct agent capabilities, automatic failover, and local code execution. Echo mimics the Google Gemini CLI experience but supports 14+ providers.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🎨 Professional UI
- **ASCII Startup Banner** - Gemini-style gradient logo on launch
- **Provider Status Bar** - Real-time sync status for all providers
- **Gradient Colors** - Beautiful blue-to-purple gradient theme
- **Quick Tips** - Helpful hints on each launch

### 🧠 ReAct Agent Mode
Echo follows the **Reason + Act** pattern:
1. **Reason** - Thinks about what needs to be done
2. **Act** - Executes tools (shell commands, file I/O, code execution)
3. **Observe** - Analyzes results
4. **Repeat** - Until task is complete

### 🔄 Automatic Failover
If your primary provider fails (rate limit, API error), Echo automatically switches to your backup provider. No interrupted workflows.

### 🎯 Smart Provider Selection
Echo automatically selects the best provider based on your task:
- **Code/Logic** → OpenAI (best for programming)
- **Creative/Long-form** → Gemini (best for content)
- **Nuance/Ethics** → Claude (best for sensitive topics)

### 📄 ECHO.md Context
Place an `ECHO.md` file in your project root to define:
- Tech stack
- Coding standards
- Project rules
- Custom instructions

Echo reads this automatically and adapts its responses.

### 🔧 Tool Execution
Echo can execute:
- Shell commands (`run_command`)
- File operations (`readFile`, `writeFile`, `listFiles`, `deleteFile`)
- Code execution (`executePython`, `executeNode`)

### 🤖 YOLO Mode
Use `--yolo` flag for autonomous execution without confirmation prompts.

### 📡 MCP Integration
Connect to Model Context Protocol servers for extended capabilities:
- GitHub integration
- Enhanced filesystem operations
- Web search capabilities
- Custom skills

## Installation

```bash
# From source
git clone https://github.com/chieji/echoctl.git
cd echoctl
npm install
npm run build
npm link

# Now you can run 'echo' from anywhere
echo "Hello, Echo!"
```

## Quick Start

### 1. Authenticate

```bash
# Auto-detect existing credentials
echo auth sync

# Or interactive setup
echo auth login

# View status
echo auth status
```

**Supported Providers:**
- 🟩 **Google Gemini** - Free tier (60 requests/min)
- 🟦 **OpenAI** - GPT-4, GPT-4o
- 🟪 **Anthropic Claude** - Claude 3.5 Sonnet
- 🟥 **Alibaba Qwen** - Free tier via Aliyun
- 🟢 **Groq** - Ultra-fast inference
- 🟨 **Ollama** - Local models (free)

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
echo chat "Push to main branch" --agent

# Multi-file operations
echo chat "Rename all getUser() to fetchUser() in the project" --agent
echo chat "Find all references to UserService" --agent

# Browser automation
echo chat "Navigate to example.com and take a screenshot" --agent
echo chat "Search Google for TypeScript tutorials" --agent
echo chat "Extract all links from https://example.com" --agent

# Web search (no API key needed!)
echo chat "Search for latest TypeScript news" --agent
echo chat "Scrape the pricing from https://example.com/pricing" --agent
echo chat "Get latest tech news" --agent

# YOLO mode - No confirmation prompts
echo chat "Create a new file called test.js with console.log('hello')" --agent --yolo
```

**Available Tools:**
- 🛠️ **Shell**: `run_command` - Execute any shell command
- 📁 **Files**: `readFile`, `writeFile`, `listFiles`, `deleteFile`
- 💻 **Code**: `executePython`, `executeNode`
- 🌐 **Web**: `searchWeb`, `scrapeUrl`, `getNews`
- 🌍 **Browser**: `browserNavigate`, `browserScreenshot`, `browserClick`, `browserType`, `browserExtract`
- 📦 **Git**: `getGitStatus`, `gitAdd`, `gitCommit`, `gitPush`, `gitLog`
- 📝 **Multi-File**: `findAndReplace`, `searchInFiles`, `createFiles`
- 🔬 **LSP**: `findSymbolReferences`, `renameSymbol`, `findSymbolDefinition`

## Commands

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
```

### Authentication

```bash
echo auth login              # Interactive API key setup
echo auth status             # Show configured providers
echo auth logout [provider]  # Remove a provider
```

### Chat

```bash
# Standard chat
echo "message"
echo chat "message"

# Options:
#   -p, --provider    Specify provider (openai, gemini, anthropic)
#   -s, --smart       Use smart mode
#   --session <id>    Use specific session
#   -r, --raw         Raw output
#   -a, --agent       Agent mode (ReAct with tools)
#   --yolo            Execute without confirmation (use with --agent)

echo chat "Debug this" --provider openai
echo chat "Write a poem" --smart
echo chat "Analyze this codebase" --agent
echo chat "Fix all bugs" --agent --yolo  # ⚠️ Autonomous mode
```

### Sessions

```bash
echo new-session "Project X"   # Start new session
echo sessions                  # List sessions
echo stats                     # Show statistics
```

### Clear History

```bash
echo clear history    # Clear current session
echo clear session    # Delete current session
echo clear all        # Delete everything (irreversible!)
```

### MCP (Model Context Protocol)

```bash
echo mcp list                  # List MCP servers
echo mcp add github https://...  # Add server
echo mcp enable github         # Enable server
echo mcp disable github        # Disable server
echo mcp remove github         # Remove server
echo mcp install @echo/github  # Install skill package
echo mcp skills                # List installed skills
```

### Configuration

```bash
echo config show                    # Show config
echo config set default-provider gemini
echo config set smart-mode true
echo config set context-length 10
```

## ECHO.md Format

Create an `ECHO.md` file in your project root:

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

## Custom Instructions
When suggesting changes, consider backward compatibility.
```

Echo automatically loads this context and adapts its responses.

## Tool Execution

In **Agent Mode**, Echo can use these tools:

| Tool | Description | Requires Confirmation |
|------|-------------|----------------------|
| `run_command` | Execute shell commands | Yes (unless --yolo) |
| `readFile` | Read file contents | No |
| `writeFile` | Write to files | Yes |
| `listFiles` | List directory | No |
| `deleteFile` | Delete files/dirs | Yes |
| `executePython` | Run Python code | Yes |
| `executeNode` | Run Node.js code | Yes |

### Example Agent Tasks

```bash
# Code analysis
echo chat "Find all unused imports in src/" --agent

# File operations
echo chat "Create a README.md with project structure" --agent

# Data processing
echo chat "Calculate total lines of code across all .ts files" --agent

# Automated fixes
echo chat "Add error handling to all async functions" --agent --yolo
```

## Provider Failover

Echo tries providers in this order by default:
1. **Gemini** (default)
2. **OpenAI** (fallback)
3. **Anthropic** (last resort)

When a provider fails:
```
⚠️  GEMINI failed: Rate limit exceeded
→ Switching to OPENAI...

🟦 OpenAI
[Response continues seamlessly]
```

## Configuration

### Config Location
- **Config:** `~/.config/echo-cli-nodejs/config.json`
- **History:** `~/.config/echo-cli/history.json`
- **MCP:** `~/.config/echo-cli/mcp.json`

### Environment Variables

```bash
export ECHO_DEFAULT_PROVIDER=gemini
export ECHO_SMART_MODE=true
export ECHO_CONTEXT_LENGTH=10
```

## API Setup

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. `echo auth login` → Select Gemini

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create API key
3. `echo auth login` → Select OpenAI

### Anthropic
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create API key
3. `echo auth login` → Select Anthropic

## Project Structure

```
echoctl/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── core/
│   │   └── engine.ts         # ReAct engine loop
│   ├── commands/
│   │   ├── auth.ts           # Auth commands
│   │   ├── chat.ts           # Chat commands
│   │   └── clear.ts          # Clear commands
│   ├── providers/
│   │   ├── base.ts           # Abstract provider
│   │   ├── openai.ts         # OpenAI impl
│   │   ├── gemini.ts         # Gemini impl
│   │   ├── anthropic.ts      # Anthropic impl
│   │   └── chain.ts          # Failover chain
│   ├── tools/
│   │   ├── executor.ts       # Tool execution
│   │   └── context-loader.ts # ECHO.md loader
│   ├── utils/
│   │   ├── config.ts         # Config storage
│   │   ├── memory.ts         # Session management
│   │   └── smart-mode.ts     # Provider selection
│   ├── storage/
│   │   └── mcp.ts            # MCP integration
│   └── types/
│       └── index.ts          # TypeScript types
├── ECHO.md.template          # Template context file
├── package.json
├── tsconfig.json
└── build.sh                  # Build script
```

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Safety & Security

### Command Execution Safety

Echo blocks dangerous commands by default:
- `rm -rf /`
- `rm -rf *`
- `dd if=/dev/zero`
- Fork bombs
- Format commands

### Confirmation Prompts

By default, Echo asks for confirmation before:
- Running shell commands
- Writing files
- Deleting files
- Executing code

Use `--yolo` mode only when you trust the task completely.

### API Key Security

- Keys stored encrypted in local config
- Never logged or displayed in full
- Can be removed anytime with `echo auth logout`

## Troubleshooting

### "No providers configured"
Run `echo auth login` to set up API keys.

### Agent mode not executing tools
Make sure to use `--agent` flag. Standard chat mode doesn't execute tools.

### YOLO mode dangerous
⚠️ **Warning:** YOLO mode executes commands without confirmation. Only use with trusted tasks.

### Rate limits
Echo automatically fails over to other providers. Configure multiple providers for reliability.

### ECHO.md not loading
Ensure the file is named exactly `ECHO.md` (case-sensitive) in your project root or parent directories.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

---

<div align="center">
    <b>Built with ♥ by chieji</b><br>
    <i>Your thoughts. My echo. Infinite possibility.</i><br>
    <br>
    <sub>ReAct pattern inspired by Google's ReAct paper</sub><br>
    <sub>MCP integration following Model Context Protocol spec</sub>
</div>
