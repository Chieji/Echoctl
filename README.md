# 🎙️ Echo CLI - Infinite Echoes of Intelligence

<div align="center">

  <img src="https://raw.githubusercontent.com/chieji/echoctl/main/assets/logo.png" alt="Echo Logo" width="200" />
  
  <p><i>"Your thoughts. My echo. Infinite possibility."</i></p>

  [![Version](https://img.shields.io/badge/version-1.1.0-FF69B4.svg?style=for-the-badge)](https://github.com/chieji/echoctl)
  [![License](https://img.shields.io/badge/license-MIT-61dafb.svg?style=for-the-badge)](LICENSE)
  [![BuiltWithLove](https://img.shields.io/badge/built%20with-❤️-red.svg?style=for-the-badge)](#-built-with-love)
  [![PRsWelcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
  
  [![ECHOMEN](https://img.shields.io/badge/Web%20UI-ECHOMEN-06b6d4?style=for-the-badge&logo=react)](https://github.com/Chieji/ECHOMEN)

</div>

---

## 🎯 What is Echoctl?

**Echoctl** is the **CLI brain** of the **ECHO Platform** - a complete AI agent orchestration system.

### ECHO Platform Components

| Component | Description | Repository |
|-----------|-------------|------------|
| **Echoctl** | CLI brain with BDI engine, 14+ AI providers, multi-layer memory | ← You are here |
| **ECHOMEN** | Web dashboard for visual agent management, real-time monitoring | [→ View ECHOMEN](https://github.com/Chieji/ECHOMEN) |

```
┌─────────────────────────────────────────────────────────────┐
│                    ECHO Platform                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐         ┌──────────────────────┐ │
│  │   ECHOMEN (Web UI)   │◄───────►│   Echoctl (CLI)      │ │
│  │  - Dashboard         │  WebSocket│  - BDI Engine      │ │
│  │  - Agent Management  │  Bridge  │  - 14+ Providers   │ │
│  │  - Browser Automation│          │  - Multi-layer Mem │ │
│  │  - Knowledge Graph   │          │  - Tool Execution  │ │
│  └──────────────────────┘         └──────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

> 💡 **Tip:** Use Echoctl standalone for CLI workflows, or connect to ECHOMEN for a visual web dashboard with real-time monitoring, browser automation, and knowledge graph management.

---

## 🌟 What is Echo?

Echo is not just another CLI; it's a **Resilient Agentic Terminal** designed to be your ultimate cognitive partner. Built on a sophisticated **BDI (Belief-Desire-Intention)** engine, Echo reasons, acts, and observes like a true autonomous agent.

Whether you're debugging complex code, generating stunning visuals, or transcribing audio on the fly, Echo echoes your intent with surgical precision.

### ❤️ Built with Love & Big Heart
This project was born out of a passion for making AI accessible, transparent, and collaborative. Echo is an open ecosystem—a "big heart" project where every contributor is a part of the soul. **It's not just mine; it belongs to everyone.**

---

## ✨ Features that WOW

### 🤖 The ReAct Engine
The heart of Echo. A continuous loop of **Reason → Act → Observe**. Echo doesn't just guess; it investigates your codebase, searches the web, and executes code to give you the truth.

### 🍱 Multi-Provider Mastery (14+ Models)
Switch instantly between Gemini, OpenAI, Claude, Qwen, Groq, Ollama, and more. Echo even includes **Smart Mode** which auto-selects the best model for your specific task (Coding, Creative, or Nuance).

### 🛠️ New: Multimedia Tools
- **🎙️ Voice**: High-fidelity transcription (`transcribe`) and crystal-clear text-to-speech (`speak`).
- **🎨 Image**: State-of-the-art image generation (`generate`) and vision-based analysis (`analyze`).

### 📦 The Master Thief (MCP & Plugin Sync)
Instantly harvest and sync tools from **Model Context Protocol (MCP)** servers and other AI extensions. If Claude can do it, Echo can steal... er, *sync* it!

---

## 🚀 Quick Start

### Option 1: Echoctl Only (CLI Mode)

```bash
# Clone the repository
git clone https://github.com/chieji/echoctl.git
cd echoctl

# Install & Build
npm install
npm run build
npm link

# Launch the Magic
echo "What's the meaning of life?"
```

### Option 2: Echoctl + ECHOMEN (Full Platform)

For the complete experience with web dashboard, real-time monitoring, and browser automation:

```bash
# 1. Install Echoctl (CLI Brain)
git clone https://github.com/Chieji/Echoctl.git
cd Echoctl
npm install
npm link

# 2. Install ECHOMEN (Web Dashboard)
cd ..
git clone https://github.com/Chieji/ECHOMEN.git
cd ECHOMEN
pnpm install

# 3. Configure ECHOMEN
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# 4. Initialize database
pnpm db:push

# 5. Start Echoctl Server (in separate terminal)
echoctl serve --ws-port 8080

# 6. Start ECHOMEN Web Server
pnpm dev
```

Open `http://localhost:3000` to access the web dashboard.

**→ See [ECHOMEN README](https://github.com/Chieji/ECHOMEN#readme) for detailed setup instructions.**

### 🏎️ Pro Usage

```bash
# Agent Mode: Autonomous task completion
echo chat "Fix the broken tests in my auth module" --agent

# Browser Power: Autonomous web research
echo chat "Find the latest trends in React 19" --agent

# Multimedia: Speak my thoughts
echo "Hello World" --agent --speak
```

---

## 🛠️ Tool Inventory

| Category | Tools |
|----------|-------|
| 💻 **Code** | `runCommand`, `executeNode`, `executePython`, `lspTools` |
| 🌍 **Web** | `searchWeb`, `scrapeUrl`, `browserTools` (Playwright) |
| 🗄️ **Storage** | `brain` (Second Brain), `mount` (Knowledge Sources) |
| 🐙 **GitHub** | `githubCreatePullRequest`, `githubCreateIssue`, `githubSearchRepos` |
| 🎙️ **Media** | `transcribe`, `speak`, `generateImage`, `analyzeImage` |

---

## 🤝 Join the Movement (Contributing)

We believe in the power of the open heart. Echo thrives on your contributions!

- **Got an idea?** Open a Feature Request.
- **Found a bug?** Submit an Issue.
- **Want to code?** Check out [CONTRIBUTING.md](CONTRIBUTING.md).

> "No be only me get am." — This is a community project. Let's build the future of agentic computing together.

---

## 📄 License

MIT © [chieji](https://github.com/chieji) - See [LICENSE](LICENSE) for more details.

<div align="center">
    <b>Your thoughts. Our echo. Infinite possibility.</b><br>
    <sub>built with love by the community</sub>
</div>
