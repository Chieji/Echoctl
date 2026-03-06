# CHANGELOG.md

All notable changes to Echo CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-03-06

### ✨ Added

#### Providers (14 Total)
- **OpenAI** - GPT-4, GPT-4o, GPT-4o-mini support
- **Gemini** - Google AI with free tier
- **Anthropic** - Claude 3.5 Sonnet, Opus, Haiku
- **Qwen** - Alibaba Cloud integration
- **Ollama** - Local LLM support
- **DeepSeek** - Cost-effective coding model
- **Kimi** - Moonshot AI (Chinese)
- **Groq** - Ultra-fast inference ⚡
- **OpenRouter** - Access to 100+ models
- **Together AI** - Open source models
- **ModelScope** - Alibaba model hub
- **Mistral** - European AI provider
- **Hugging Face** - Open source models
- **GitHub Models** - GitHub integrated

#### Core Features
- **ReAct Engine** - Reason + Act loop for autonomous agents
- **Auto-Auth Sync** - Zero-friction login from gcloud, aliyun, env vars
- **Provider Failover** - Automatic fallback on API errors
- **Smart Mode** - Auto-selects best provider based on task
- **Token Compaction** - Auto-summarize old messages near token limits
- **YOLO Mode** - Autonomous execution without confirmations
- **ECHO.md Context** - Project-specific rules and standards
- **LSP Integration** - Symbol rename, find references, refactoring
- **MCP Support** - Plugin architecture for extended capabilities

#### Tools (7)
- `run_command` - Shell command execution
- `readFile` / `writeFile` - File I/O
- `listFiles` / `deleteFile` - Directory operations
- `executePython` / `executeNode` - Code execution

#### CLI Commands
- `echo auth login` - Interactive API key setup
- `echo auth sync` - Auto-detect credentials
- `echo auth detect` - Show available credentials
- `echo chat` - Standard chat mode
- `echo chat --agent` - ReAct agent mode
- `echo chat --yolo` - Autonomous mode
- `echo mcp` - MCP server management
- `echo config` - Configuration management
- `echo clear` - History/session management
- `echo sessions` - Session listing

#### UI/UX
- **ASCII Startup Banner** - Gemini-style gradient logo
- **Provider Status Bar** - Real-time sync status
- **Gradient Theme** - Blue to purple gradient
- **Quick Tips** - Helpful hints on launch
- **Rich Output** - Colored, formatted responses

#### Documentation
- `SOUL.md` - AI personality and ethics
- `AGENTS.md` - How Echo operates
- `TOOLS.md` - Tool documentation
- `ECHO.md` - Project context template
- `CONTRIBUTING.md` - Contribution guidelines
- `README.md` - Comprehensive usage guide

### 🔧 Technical

#### Architecture
- TypeScript with ES2022 modules
- ESM-first package structure
- Modular provider system
- Pluggable tool architecture
- SQLite/JSON hybrid storage

#### Storage
- `~/.config/echo-cli/config.json` - Configuration
- `~/.config/echo-cli/history.json` - Conversation history
- `~/.config/echo-cli/mcp.json` - MCP servers

#### Security
- Command allowlisting
- Dangerous pattern blocking
- Confirmation prompts (unless --yolo)
- API key encryption
- Rate limiting awareness

#### Performance
- Groq for ultra-fast responses
- Local Ollama for privacy
- Token-based context management
- Auto-compaction near limits

### 📦 Dependencies
- `commander` - CLI framework
- `chalk` - Terminal colors
- `ora` - Loading spinners
- `enquirer` - Interactive prompts
- `conf` - Config storage
- `lowdb` - JSON database
- `axios` - HTTP client
- `figlet` - ASCII art
- `gradient-string` - Color gradients

---

## [Unreleased]

### Planned
- [ ] Test coverage > 60%
- [ ] More MCP server integrations
- [ ] Voice input support
- [ ] Image generation tools
- [ ] Multi-file editing
- [ ] Git integration
- [ ] Database tools
- [ ] Web scraping tools

---

## Version History

| Version | Date | Providers | Features |
|---------|------|-----------|----------|
| 1.0.0 | 2024-03-06 | 14 | Initial release |

---

_This changelog is auto-generated and updated on each release._
