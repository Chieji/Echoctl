# Echo CLI (ECHOMEN) - Way Forward & Implementation Guidelines
**Version**: 2.0-Alpha
**Last Updated**: 2026-03-15

## 1. Overview
- **Project Name**: Echoctl (ECHOMEN)
- **Description**: A resilient, multi-provider AI CLI agent featuring a BDI cognitive engine, multi-layer memory, and advanced tool automation.
- **Objectives**: 
  - Elevate the CLI from a "chat wrapper" to a fully autonomous "Agentic Operating System".
  - Achieve sub-second provider failover and context-aware tool selection.
  - Implement the "Generous Memory" architecture (Local + Cloud Sync).
- **Success Metrics**:
  - Task success rate > 85% for multi-step engineering tasks.
  - 60%+ code coverage for core engine and tool modules.
  - Deployment of WebHawk 2.0 with visual reasoning capabilities.

---

## 2. Implementation Planned Guidelines

### 2.1. The BDI Cognitive Upgrade
The current `BDIEngine` is a prototype. The way forward requires a decoupled state machine.

**Guidelines**:
- **Modularization**: Break `src/core/bdi.ts` into individual components: `perception.ts`, `reasoner.ts`, `planner.ts`, and `reflector.ts`.
- **Hierarchical Tasks**: Plans must be trees, not lists. Use the `TaskTree` structure to allow for parallel execution and sub-task dependencies.
- **Reflective Loop**: After every tool execution, a "Reflection" step must analyze the output before deciding the next "Intention".

### 2.2. Multi-Layer Memory (Semantic & Episodic)
Replace the simple JSON-based `BrainStore` with a multi-layered system.

**Guidelines**:
- **Working Memory**: Transient state for the current session (fast access).
- **Episodic Memory**: Log of past experiences (to avoid repeating mistakes).
- **Semantic Memory**: Persistent facts about the user and project.
- **Protocol**: Use a unified `MemoryProtocol` in `src/memory/protocol.ts` to query all layers simultaneously.

### 2.3. WebHawk 2.0 (Visual Browsing)
Upgrade standard Playwright tools to a visual-first approach.

**Guidelines**:
- **Screen-to-Cognition**: For complex sites, capture screenshots and pipe them to a Vision-capable LLM.
- **AXTree Extraction**: Prioritize accessibility trees over raw DOM for better "agent understanding".

---

## 3. Way Forward: Critical Path (Next 4 Weeks)

### [Phase 2.1] Core BDI Module Extraction (P0)
- **Action**: Extract perception and reasoning logic from the monolith into `src/core/perception.ts` and `src/core/reasoner.ts`.
- **Guidelines**: Ensure `perception.ts` automatically gathers `ECHO.md` and `git status` on every cycle.

### [Phase 3.1] Memory Tier Implementation (P1)
- **Action**: Implement `src/memory/episodic.ts` to record task outcomes.
- **Guidelines**: Store a "Success Score" with each episode to help the `reflector` module in future tasks.

### [Phase 8.1] Test Coverage Sprint (P0)
- **Action**: Target `src/extensions/mcp.ts` and `src/commands/mount.ts` for unit tests.
- **Goal**: Reach 50% coverage by the end of Week 1.

---

## 4. Technical Requirements
- **Runtime**: Node.js 18+ (ESM only).
- **State Management**: React/Ink for TUI, Custom BDI State Machine for Agent logic.
- **Integrations**: Playwright (Web), Octokit (GitHub), Box SDK (Cloud Memory).

## 5. Open Questions
1. **Model Cost**: Should we implement a local embedding model for memory to save tokens/cost?
2. **Offline Mode**: How does the BDI engine behave when no provider is reachable? (Fallback to Ollama auto-start).
3. **Safety**: Do we need a "Sandbox" container for `run_command` in YOLO mode?

## 6. Appendix
- **Glossary**: 
  - *BDI*: Belief-Desire-Intention cognitive model.
  - *MCP*: Model Context Protocol.
  - *WebHawk*: Echo's proprietary browser automation module.
- **References**: [PRD.md](file:///home/lastborn/Echoctl/PRD.md), [IMPLEMENTATION_TODO.md](file:///home/lastborn/Echoctl/IMPLEMENTATION_TODO.md)
