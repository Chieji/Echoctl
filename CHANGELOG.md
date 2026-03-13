# CHANGELOG.md

All notable changes to Echo CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-03-13

### ✨ Added

#### Providers (14 Total - All Implemented)
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

#### Tools (20+)
- `run_command` - Shell command execution with security filtering
- `readFile` / `writeFile` - File I/O
- `listFiles` / `deleteFile` - Directory operations
- `executePython` / `executeNode` - Code execution
- `searchWeb` / `scrapeUrl` / `getNews` - Web tools
- `getGitStatus` / `gitAdd` / `gitCommit` / `gitPush` / `gitLog` - Git tools
- `findAndReplace` / `searchInFiles` / `createFiles` - Multi-file tools
- `findSymbolReferences` / `renameSymbol` / `findSymbolDefinition` - LSP tools
- `browserNavigate` / `browserScreenshot` / `browserClick` / `browserType` - Browser tools

#### Second Brain (NEW)
- `echo brain save` - Save knowledge with tags
- `echo brain get` - Retrieve by key
- `echo brain search` - Full-text search
- `echo brain list` - List all memories
- `echo brain delete` - Remove memories
- `echo brain stats` - View statistics
- `echo brain export` / `import` - Backup and restore

#### HITL Approvals (NEW)
- `echo approve list` - View pending approvals
- `echo approve <id> --yes/--no` - Submit decisions
- `echo approve stats` - View statistics
- `echo approve add-rule` - Add auto-approve rules
- `echo approve remove-rule` - Remove rules
- `echo approve clear` - Clear pending queue

#### Development Tracks (NEW)
- `echo track new` - Create isolated contexts
- `echo track list` - List all tracks
- `echo track switch` - Switch between tracks
- `echo track status` - Show current track
- `echo track delete` - Remove tracks
- `echo track export` / `import` - Backup and share
- `echo track config` - Configure per-track settings

#### Interactive TUI (NEW)
- Real-time dashboard with Ink (React for CLI)
- Tab-based navigation (Overview, Providers, Sessions, Brain, Approvals)
- Live statistics updates
- Keyboard shortcuts (Tab to switch, Q to exit)

#### Security Hardening (NEW)
- Machine-specific encryption key derivation
- Rate limiting tracking per provider
- Enhanced dangerous command detection (20+ patterns)
- Security audit function
- Command chain detection

#### Session Management
- Persistent session storage with lowdb
- Token count tracking
- Auto-pruning of old sessions
- Session export/import

#### Plugin System
- Universal sync from Claude, Gemini, Qwen
- npm-based plugin installation
- Enable/disable without uninstall

#### Testing
- Jest test suite with 150+ tests
- Tests for sessions, brain, approvals, config, smart-mode, executor
- Coverage reporting (~40% baseline)

### 🔧 Technical

#### Architecture
- TypeScript with ES2022 modules
- ESM-first package structure
- Modular provider system
- Pluggable tool architecture
- lowdb for JSON persistence

#### Storage
- `~/.config/echo-cli/config.json` - Configuration (encrypted)
- `~/.config/echo-cli/sessions.json` - Session storage
- `~/.config/echo-cli/brain.json` - Second Brain
- `~/.config/echo-cli/approvals.json` - HITL queue
- `~/.config/echo-cli/tracks.json` - Development tracks
- `~/.config/echo-cli/mcp.json` - MCP servers

#### Security
- Command allowlisting with pattern detection
- Dangerous pattern blocking (20+ patterns)
- Confirmation prompts (unless --yolo)
- Machine-specific API key encryption
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
- `conf` - Config storage with encryption
- `lowdb` - JSON database
- `axios` - HTTP client
- `figlet` - ASCII art
- `gradient-string` - Color gradients
- `ink` - React for CLI (TUI)
- `playwright` - Browser automation
- `uuid` - Unique IDs

### 📝 Documentation
- `SOUL.md` - AI personality and ethics
- `AGENTS.md` - How Echo operates
- `TOOLS.md` - Tool documentation
- `ECHO.md` - Project context template
- `CONTRIBUTING.md` - Contribution guidelines
- `README.md` - Comprehensive usage guide
- `SECURITY.md` - Security practices
- `DEPLOYMENT.md` - Publishing guide
- `CHANGELOG.md` - This file

### 🐛 Bug Fixes
- Fixed provider chain initialization (was only 3, now all 14)
- Added tokenCount to Session type
- Fixed brain.test.ts test isolation
- Fixed auth.test.ts flaky tests
- Fixed providers.test.ts edge cases

### ⚠️ Breaking Changes
- None (first release)

---

## [Unreleased]

### Planned
- [ ] Test coverage > 60%
- [ ] More MCP server integrations
- [ ] Voice input support
- [ ] Image generation tools
- [ ] Multi-file editing
- [ ] Git integration enhancements
- [ ] Database tools
- [ ] Web scraping enhancements
- [ ] Multi-agent collaboration
- [ ] WebSocket real-time updates

---

## Version History

| Version | Date | Providers | Features | Tests |
|---------|------|-----------|----------|-------|
| 1.0.0 | 2024-03-13 | 14 | Initial release | 150+ |

---

## Migration Guide

### From Beta to v1.0.0

No migration needed - first stable release!

### Upgrading from v0.x

If you were using the beta version:

1. Backup your config:
   ```bash
   cp ~/.config/echo-cli/config.json ~/.config/echo-cli/config.json.backup
   ```

2. Reinstall:
   ```bash
   npm uninstall -g echo-ai-cli
   npm install -g @chieji/echo-ai-cli
   ```

3. Re-authenticate:
   ```bash
   echo auth sync
   ```

---

_This changelog is auto-generated and updated on each release._
