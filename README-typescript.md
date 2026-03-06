# Echo CLI

> **Your thoughts. My echo. Multi-provider AI with smart failover.**

A resilient, multi-provider AI CLI tool distributed via NPM. Echo automatically fails over between AI providers (Gemini, OpenAI, Anthropic) and intelligently selects the best provider for your task.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- 🔄 **Automatic Failover** - If Gemini fails, Echo seamlessly switches to OpenAI or Anthropic
- 🧠 **Smart Mode** - Automatically selects the best provider based on task type:
  - Code/Logic → OpenAI
  - Creative/Long-form → Gemini  
  - Nuance/Ethics → Claude
- 💾 **Persistent Memory** - Conversation history stored locally with session management
- 🔐 **Secure Storage** - API keys encrypted in local config
- 🎨 **Beautiful UI** - Colorful output with chalk and gradient-string
- ⚡ **Fast & Lightweight** - Minimal dependencies, quick startup

## Installation

```bash
# Install globally from npm (coming soon)
npm install -g echo-ai-cli

# Or install from source
git clone https://github.com/chieji/echoctl.git
cd echoctl
npm install
npm run build
npm link
```

## Quick Start

### 1. Authenticate

```bash
# Interactive setup - choose provider and enter API key
echo auth login

# View current auth status
echo auth status
```

### 2. Start Chatting

```bash
# Simple chat (uses smart mode by default)
echo "Write a haiku about coding"

# Explicit chat command
echo chat "Explain quantum computing"

# Specify provider
echo chat "Debug this code" --provider openai

# Smart mode (auto-selects provider)
echo chat "Write a poem" --smart
```

## Commands

### Authentication

```bash
# Interactive API key setup
echo auth login

# Show configured providers
echo auth status

# Remove a provider
echo auth logout openai
```

### Chat

```bash
# Quick chat (default)
echo "What is the meaning of life?"

# Full chat command
echo chat "Explain recursion"

# Options:
#   -p, --provider <provider>  Specify provider (openai, gemini, anthropic)
#   -s, --smart               Use smart mode
#   --session <id>            Use specific session
#   -r, --raw                 Raw output (no formatting)

echo chat "Write a function" --provider openai
echo chat "Write a story" --smart
```

### Sessions

```bash
# Start new session
echo new-session "Project Alpha"

# List sessions
echo sessions

# Stats
echo stats
```

### Clear History

```bash
# Clear current session
echo clear history

# Delete session
echo clear session

# Nuclear option (all data)
echo clear all
```

### Configuration

```bash
# Show config
echo config show

# Set default provider
echo config set default-provider gemini

# Enable smart mode
echo config set smart-mode true

# Set context length
echo config set context-length 10
```

## Smart Mode

Echo's smart mode automatically selects the best provider based on your task:

| Task Type | Keywords | Provider | Why |
|-----------|----------|----------|-----|
| **Code** | function, class, debug, API, bug, implement | OpenAI | Best for programming logic |
| **Creative** | write, story, poem, brainstorm, ideas | Gemini | Best for long-form content |
| **Nuance** | ethical, advice, opinion, sensitive | Claude | Best for nuanced topics |
| **General** | everything else | Gemini | Fast and capable |

Example:
```bash
# These will auto-select the best provider:
echo "Debug this Python function"        # → OpenAI
echo "Write a fantasy story"             # → Gemini
echo "Give me relationship advice"       # → Claude
```

## Failover Logic

By default, Echo tries providers in this order:
1. **Gemini** (default - free tier available)
2. **OpenAI** (fallback)
3. **Anthropic** (last resort)

If a provider fails (API error, rate limit, etc.), Echo automatically switches to the next available provider and logs the failover.

```bash
$ echo "Complex task..."
🟩 Gemini
[Response from Gemini]

# If Gemini fails:
⚠️  GEMINI failed: Rate limit exceeded
→ Switching to OPENAI...

🟦 OpenAI  
[Response from OpenAI]
```

## Configuration

### Config File Location
- **Linux/Mac:** `~/.config/echo-cli-nodejs/config.json`
- **History:** `~/.config/echo-cli/history.json`

### Available Settings

| Key | Values | Default |
|-----|--------|---------|
| `default-provider` | gemini, openai, anthropic | gemini |
| `smart-mode` | true, false | true |
| `context-length` | 1-100 | 10 |

### Environment Variables

```bash
export ECHO_DEFAULT_PROVIDER=gemini
export ECHO_SMART_MODE=true
```

## Project Structure

```
echoctl/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── auth.ts           # Auth commands
│   │   ├── chat.ts           # Chat commands
│   │   └── clear.ts          # Clear commands
│   ├── providers/
│   │   ├── base.ts           # Base provider class
│   │   ├── openai.ts         # OpenAI implementation
│   │   ├── gemini.ts         # Gemini implementation
│   │   ├── anthropic.ts      # Anthropic implementation
│   │   └── chain.ts          # Failover chain
│   ├── utils/
│   │   ├── config.ts         # Config storage
│   │   ├── memory.ts         # Session management
│   │   └── smart-mode.ts     # Smart provider selection
│   └── types/
│       └── index.ts          # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## API Provider Setup

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Run `echo auth login` and select Gemini

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create API key
3. Run `echo auth login` and select OpenAI

### Anthropic
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create API key
3. Run `echo auth login` and select Anthropic

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

## Troubleshooting

### "No providers configured"
Run `echo auth login` to set up your first API key.

### API Key errors
- Verify your API key is correct: `echo auth status`
- Check API key has available credits
- Try removing and re-adding: `echo auth logout <provider>` then `echo auth login`

### Rate limits
Echo automatically fails over to other providers when rate limited. Configure multiple providers for best reliability.

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
    <i>Your thoughts. My echo. Infinite possibility.</i>
</div>
