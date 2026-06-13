# EchoCTL — Multi-Provider AI CLI

An OpenCode-compatible provider & auth system for the ECHOMEN ecosystem. Supports multi-provider authentication, secure credential storage, dynamic model discovery, and provider-agnostic chat routing.

## Quick Start

```bash
cd echoctl
npm install   # or pnpm install
npm run build

# Login to a provider
npx echoctl login openai

# Start chatting
npx echoctl chat
```

## Architecture

```
echoctl/
├── providers/       # Provider implementations (OpenAI, Anthropic, Groq, etc.)
│   ├── base.ts      # Abstract base provider interface
│   ├── registry.ts  # Provider registry (supports plugins)
│   ├── openai.ts    # OpenAI implementation
│   ├── anthropic.ts # Anthropic implementation
│   ├── groq.ts      # Groq implementation
│   ├── openrouter.ts
│   ├── gemini.ts
│   ├── mistral.ts
│   ├── fireworks.ts
│   ├── together.ts
│   ├── deepseek.ts
│   └── index.ts     # Registers all providers
│
├── auth/            # Authentication & credential management
│   ├── manager.ts   # Login/logout/switch/validate
│   ├── storage.ts   # AES-256-GCM encrypted credential storage
│   └── session.ts   # Session state tracking
│
├── models/          # Model discovery & caching
│   └── discovery.ts # Fetch & cache models (24h TTL)
│
├── config/          # Configuration (~/.echoctl/config.yaml)
│   └── index.ts
│
├── router/          # Unified request routing
│   └── chat.ts      # Provider-agnostic chat/embeddings dispatcher
│
└── cli/             # CLI commands
    └── index.ts     # Entry point with all command handlers
```

## Commands

| Command | Description |
|---------|-------------|
| `echoctl login <provider>` | Authenticate with a provider |
| `echoctl logout <provider>` | Remove stored credentials |
| `echoctl auth status` | Show authentication status |
| `echoctl providers list` | List all registered providers |
| `echoctl provider use <name>` | Set the active provider |
| `echoctl models list` | List cached models |
| `echoctl models refresh` | Refresh models from all providers |
| `echoctl chat` | Start interactive chat |
| `echoctl session` | Show current session state |

## Credential Precedence

1. **Stored credential** (encrypted in `~/.echoctl/credentials.enc`)
2. **Environment variable** (read-only fallback)
3. **Unauthenticated** (command fails with helpful error)

## Supported Providers

| Provider | Chat | Embeddings | Vision | Tools | Env Var |
|----------|------|-----------|--------|-------|---------|
| OpenAI | ✓ | ✓ | ✓ | ✓ | `OPENAI_API_KEY` |
| Anthropic | ✓ | – | ✓ | ✓ | `ANTHROPIC_API_KEY` |
| Groq | ✓ | – | ✓ | ✓ | `GROQ_API_KEY` |
| OpenRouter | ✓ | – | ✓ | ✓ | `OPENROUTER_API_KEY` |
| Google Gemini | ✓ | ✓ | ✓ | ✓ | `GOOGLE_API_KEY` |
| Mistral | ✓ | ✓ | ✓ | ✓ | `MISTRAL_API_KEY` |
| DeepSeek | ✓ | – | – | ✓ | `DEEPSEEK_API_KEY` |
| Fireworks AI | ✓ | ✓ | ✓ | ✓ | `FIREWORKS_API_KEY` |
| Together AI | ✓ | ✓ | ✓ | ✓ | `TOGETHER_API_KEY` |

## Security

- Credentials are encrypted with AES-256-GCM using a machine-derived key
- Per-credential nonces (never reused)
- File permissions set to `0600` on credential files
- Stack traces hidden by default (use `--debug` flag)
- Invalid credentials are never persisted

## Plugin Support

Add custom providers without modifying core code:

```typescript
import { BaseProvider } from "echoctl/providers/base";
import { registry } from "echoctl/providers/registry";

class MyProvider extends BaseProvider {
  // ... implement the interface
}

registry.register(new MyProvider());
```

## Development

```bash
# Run in development mode (no build needed)
npx tsx cli/index.ts help

# Type check
npm run check

# Build for production
npm run build
```
