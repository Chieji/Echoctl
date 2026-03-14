# ECHOMEN CLI - Product Requirements Document

> **Your thoughts. My echo. Infinite possibility.**

**Version:** 2.0.0  
**Status:** In Development  
**Last Updated:** March 14, 2026  
**Author:** ECHOMEN Team

---

## Executive Summary

ECHOMEN CLI is a **terminal-native AI Operating System** that transforms the command-line into a living, cognitive agent interface. It combines the power of 14+ AI providers with a Belief-Desire-Intention (BDI) cognitive architecture, multi-layer memory systems, and advanced tool execution to create an AI assistant that rivals and exceeds Claude Code, Gemini CLI, and OpenClaw.

### Vision Statement

> "The Terminal Comes Alive" - When a user types `echomen`, they don't just get a chat interface. They enter a **cognitive workspace** where the AI understands context, learns from experience, plans complex tasks, and continuously improves its capabilities.

### Key Differentiators

| Feature | Competitors | ECHOMEN CLI |
|---------|-------------|-------------|
| Architecture | ReAct (simple loop) | BDI (Belief-Desire-Intention) |
| Memory | Session-based only | Multi-layer (Working/Episodic/Long-term) |
| Browser | Basic or none | WebHawk 2.0 (Visual + AXTree reasoning) |
| Providers | Single (vendor-locked) | 14+ with intelligent selection |
| UI | Simple TUI or none | Rich dashboard with real-time visualization |
| Startup | None | Cinematic boot sequence |
| Self-Improvement | Limited/None | Explicit learning from outcomes |
| Extensibility | MCP only | MCP + Native Plugin System |
| Context Awareness | Per-session | Cross-session + Project-level (ECHO.md) |

---

## Problem Statement

### Current Limitations in AI CLI Tools

1. **No Memory Beyond Session** - Claude Code, Gemini CLI forget everything when you close the terminal
2. **No Strategic Planning** - Current tools react to prompts but don't plan complex multi-step tasks
3. **No Self-Improvement** - They don't learn from past successes/failures
4. **Vendor Lock-in** - Tied to single provider (Anthropic, Google, etc.)
5. **Limited Tool Intelligence** - Tools are executed but not reasoned about
6. **No Visual Browser Understanding** - Web automation is brittle without visual reasoning
7. **Poor Context Management** - Don't understand project structure, conventions, or rules

### User Pain Points

- "I have to re-explain my project every session"
- "The AI makes the same mistakes repeatedly"
- "I can't trust it with complex multi-file changes"
- "When the API is down, I'm stuck"
- "It doesn't understand how I like to work"

---

## Solution Overview

### ECHOMEN Cognitive Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECHOMEN TERMINAL UI                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Header     │  │   Status     │  │    Memory Stats      │  │
│  │   (Logo)     │  │   (Health)   │  │    (Brain Status)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Main Interaction Area                        │ │
│  │  User: "Build a React app with auth"                      │ │
│  │  ─────────────────────────────────────                    │ │
│  │  🤖 ECHO: Analyzing context...                            │ │
│  │      ├─ Planning phase...                                │ │
│  │      ├─ Executing: Create project structure               │ │
│  │      └─ ✓ Complete                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Context Panel (Files/Git/Browser)            │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   BDI COGNITIVE      │
                    │     ENGINE           │
                    ├──────────────────────┤
                    │ 1. PERCEIVE          │
                    │ 2. REASON (LLM)      │
                    │ 3. PLAN (Task Tree)  │
                    │ 4. ACT (Tools)       │
                    │ 5. OBSERVE           │
                    │ 6. REFLECT           │
                    │ 7. LEARN             │
                    └──────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │  Memory  │        │  Tools   │        │Providers │
   │  System  │        │  (30+)   │        │  (14+)   │
   └──────────┘        └──────────┘        └──────────┘
```

### Core Capabilities

1. **BDI Cognitive Engine** - Belief-Desire-Intention architecture for strategic reasoning
2. **Multi-Layer Memory** - Working, Episodic, Semantic, and Long-term memory
3. **Intelligent Provider Selection** - Auto-choose best provider with learned preferences
4. **WebHawk 2.0 Browser** - Visual + semantic web understanding
5. **30+ Tools** - Shell, files, code, git, browser, LSP, GitHub, and more
6. **Plugin System** - Extend with custom tools and providers
7. **ECHO.md Context** - Project-specific rules and conventions

---

## User Personas

### 1. Developer Dan
- **Role:** Full-stack developer
- **Goals:** Build features faster, automate repetitive tasks
- **Pain Points:** Context switching, explaining project structure repeatedly
- **ECHOMEN Value:** Remembers project conventions, automates multi-step workflows

### 2. DevOps Olivia
- **Role:** DevOps engineer
- **Goals:** Automate infrastructure, monitor systems
- **Pain Points:** Complex multi-tool workflows, brittle automation
- **ECHOMEN Value:** Plans and executes complex deployment pipelines

### 3. Researcher Rita
- **Role:** Data scientist / ML researcher
- **Goals:** Literature review, experiment tracking, code prototyping
- **Pain Points:** Information overload, losing track of experiments
- **ECHOMEN Value:** Multi-layer memory tracks experiments, browser automation gathers research

### 4. Security Sam
- **Role:** Security engineer
- **Goals:** Audit code, find vulnerabilities, enforce policies
- **Pain Points:** Manual security reviews, inconsistent enforcement
- **ECHOMEN Value:** Security Fortress with HITL approvals, audit trails

---

## Functional Requirements

### FR-1: Terminal User Interface

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | Cinematic startup sequence with ECHO logo | P0 | ✅ Complete |
| FR-1.2 | Main dashboard with header, status bar, message area | P0 | ✅ Complete |
| FR-1.3 | Mode-specific views (Chat/Agent/Code/Browser/Memory) | P0 | 🟡 In Progress |
| FR-1.4 | Command palette (Ctrl+P) with fuzzy search | P1 | 🟡 In Progress |
| FR-1.5 | Real-time cognitive state visualization | P1 | 🟡 In Progress |
| FR-1.6 | Context panel showing files/git/browser state | P1 | 🟡 In Progress |
| FR-1.7 | Syntax highlighting for code blocks | P2 | ⚪ Pending |
| FR-1.8 | File tree navigation | P2 | ⚪ Pending |
| FR-1.9 | Streaming responses | P2 | ⚪ Pending |

### FR-2: BDI Cognitive Architecture

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | PERCEIVE: Gather context from environment | P0 | ⚪ Pending |
| FR-2.2 | REASON: Analyze goals with LLM | P0 | ⚪ Pending |
| FR-2.3 | PLAN: Create hierarchical task trees | P0 | ⚪ Pending |
| FR-2.4 | ACT: Execute tools with observation | P0 | ⚪ Pending |
| FR-2.5 | OBSERVE: Capture execution results | P0 | ⚪ Pending |
| FR-2.6 | REFLECT: Evaluate success/failure | P0 | ⚪ Pending |
| FR-2.7 | LEARN: Update memory and strategies | P0 | ⚪ Pending |
| FR-2.8 | State machine with transitions | P0 | ⚪ Pending |
| FR-2.9 | Replanning on unexpected outcomes | P1 | ⚪ Pending |
| FR-2.10 | Parallel task execution | P2 | ⚪ Pending |

### FR-3: Multi-Layer Memory System

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | Working Memory: Current task context | P0 | ⚪ Pending |
| FR-3.2 | Episodic Memory: Past executions | P0 | ⚪ Pending |
| FR-3.3 | Semantic Memory: Concepts and knowledge | P0 | ⚪ Pending |
| FR-3.4 | Long-term Memory: Skills and strategies | P0 | ⚪ Pending |
| FR-3.5 | Memory retrieval by similarity | P1 | ⚪ Pending |
| FR-3.6 | Memory consolidation (sleep mode) | P2 | ⚪ Pending |
| FR-3.7 | Forgetfulness (decay over time) | P3 | ⚪ Pending |
| FR-3.8 | Memory visualization and editing | P1 | ⚪ Pending |

### FR-4: Tool System

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | Shell command execution | P0 | ✅ Complete |
| FR-4.2 | File operations (read/write/delete) | P0 | ✅ Complete |
| FR-4.3 | Multi-file operations | P0 | ✅ Complete |
| FR-4.4 | Git operations | P0 | ✅ Complete |
| FR-4.5 | Web search and scraping | P0 | ✅ Complete |
| FR-4.6 | Browser automation (Playwright) | P0 | ✅ Complete |
| FR-4.7 | LSP code intelligence | P1 | ⚪ Pending |
| FR-4.8 | GitHub integration | P1 | ⚪ Pending |
| FR-4.9 | Python/Node.js execution | P0 | ✅ Complete |
| FR-4.10 | WebHawk 2.0 visual reasoning | P1 | ⚪ Pending |
| FR-4.11 | Tool execution visualization | P1 | ⚪ Pending |
| FR-4.12 | Tool composition (chain tools) | P2 | ⚪ Pending |

### FR-5: Provider Intelligence

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | Support 14+ providers | P0 | ✅ Complete |
| FR-5.2 | Smart mode with task classification | P0 | ✅ Complete |
| FR-5.3 | Automatic failover | P0 | ✅ Complete |
| FR-5.4 | Provider health monitoring | P1 | ⚪ Pending |
| FR-5.5 | Learned provider preferences | P1 | ⚪ Pending |
| FR-5.6 | Cost optimization | P2 | ⚪ Pending |
| FR-5.7 | Latency-based selection | P2 | ⚪ Pending |
| FR-5.8 | Provider specialization tracking | P2 | ⚪ Pending |

### FR-6: Natural Language Interface

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | Intent recognition | P0 | ⚪ Pending |
| FR-6.2 | Entity extraction | P0 | ⚪ Pending |
| FR-6.3 | Context tracking across turns | P0 | ⚪ Pending |
| FR-6.4 | Clarification questions | P1 | ⚪ Pending |
| FR-6.5 | Follow-up resolution | P1 | ⚪ Pending |
| FR-6.6 | Multi-modal input (text, files, images) | P2 | ⚪ Pending |

### FR-7: Security & Safety

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-7.1 | HITL for dangerous operations | P0 | ✅ Complete |
| FR-7.2 | Dangerous command pattern blocking | P0 | ⚪ Pending |
| FR-7.3 | Rate limiting | P1 | ⚪ Pending |
| FR-7.4 | Audit logging | P0 | ⚪ Pending |
| FR-7.5 | Encrypted configuration | P0 | ✅ Complete |
| FR-7.6 | Quarantine for unknown operations | P2 | ⚪ Pending |
| FR-7.7 | Behavior anomaly detection | P3 | ⚪ Pending |

### FR-8: Extension System

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-8.1 | Plugin architecture | P1 | ⚪ Pending |
| FR-8.2 | Custom tool registration | P1 | ⚪ Pending |
| FR-8.3 | Custom provider registration | P1 | ⚪ Pending |
| FR-8.4 | MCP server integration | P1 | ⚪ Pending |
| FR-8.5 | UI component registration | P2 | ⚪ Pending |
| FR-8.6 | Lifecycle hooks | P2 | ⚪ Pending |
| FR-8.7 | Plugin marketplace | P3 | ⚪ Pending |

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-1.1 | Launch time | < 3 seconds | Time to interactive TUI |
| NFR-1.2 | First response | < 5 seconds | Input to first token |
| NFR-1.3 | Memory usage | < 500MB | RSS during idle |
| NFR-1.4 | Tool execution latency | < 100ms | Tool call overhead |
| NFR-1.5 | Concurrent operations | 10+ | Parallel tool execution |

### NFR-2: Reliability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-2.1 | Uptime | 99.9% | Session stability |
| NFR-2.2 | Error recovery | Automatic | Self-healing rate |
| NFR-2.3 | Data persistence | 100% | Memory durability |
| NFR-2.4 | Failover success | > 95% | Provider failover rate |

### NFR-3: Security

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-3.1 | Credential storage | Encrypted | AES-256 |
| NFR-3.2 | Audit trail | Complete | All actions logged |
| NFR-3.3 | Dangerous operation blocking | 100% | HITL enforcement |
| NFR-3.4 | Rate limiting | Configurable | Per-provider limits |

### NFR-4: Usability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-4.1 | Learnability | < 10 minutes | Time to first success |
| NFR-4.2 | Error messages | Actionable | User comprehension |
| NFR-4.3 | Documentation | Complete | API reference + guides |
| NFR-4.4 | Accessibility | Terminal-friendly | Screen reader support |

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  TUI (Ink/React)  │  CLI Commands  │  Plugin UI Components     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cognitive Layer (BDI)                       │
├─────────────────────────────────────────────────────────────────┤
│  Perception  │  Reasoning  │  Planning  │  Reflection  │  Learning │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Intelligence Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Provider Chain  │  Intent Recognition  │  Context Management  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Memory Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Working  │  Episodic  │  Semantic  │  Long-term  │  Retrieval  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Tool Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Shell  │  Files  │  Git  │  Web  │  Browser  │  LSP  │  GitHub │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Security Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Fortress  │  HITL  │  Audit  │  Rate Limit  │  Encryption    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → TUI captures input
2. **Intent Recognition** → NLU classifies intent
3. **Perception** → Gather context (files, git, memory)
4. **Reasoning** → LLM analyzes goal and context
5. **Planning** → Create hierarchical task tree
6. **Execution** → Act → Observe loop with tools
7. **Reflection** → Evaluate outcomes
8. **Learning** → Update memory and strategies
9. **Response** → Stream result to TUI

### Key Design Patterns

- **BDI (Belief-Desire-Intention)** - Cognitive architecture
- **ReAct (Reason + Act)** - Tool execution loop
- **Observer Pattern** - State changes and events
- **Strategy Pattern** - Provider selection
- **Command Pattern** - Tool execution
- **Repository Pattern** - Memory access

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅

**Goal:** Working TUI with basic cognitive loop

- [x] TUI framework with Ink
- [x] Startup sequence
- [x] Dashboard layout
- [x] Mode switching
- [x] Command palette
- [ ] Message history with streaming
- [ ] Context panel integration

**Deliverable:** `echomen` command launches interactive TUI

### Phase 2: BDI Engine (Weeks 3-4)

**Goal:** Full cognitive architecture

- [ ] Create `src/core/bdi-engine.ts`
- [ ] Implement state machine (7 states)
- [ ] Build perception module
- [ ] Create reasoning bridge to LLM
- [ ] Implement task planning
- [ ] Build execution loop with observation
- [ ] Add reflection engine
- [ ] Implement learning module

**Deliverable:** BDI engine replaces ReAct engine

### Phase 3: Memory System (Weeks 5-6)

**Goal:** Multi-layer memory architecture

- [ ] Create `src/memory/` directory
- [ ] Implement WorkingMemory
- [ ] Implement EpisodicMemory
- [ ] Implement SemanticMemory
- [ ] Implement LongTermMemory
- [ ] Build memory retrieval (similarity search)
- [ ] Create memory visualization in TUI
- [ ] Migrate from BrainStore to new system

**Deliverable:** Multi-layer memory with retrieval

### Phase 4: Advanced Tools (Weeks 7-8)

**Goal:** WebHawk 2.0 and GitHub integration

- [ ] Port WebHawk from ECHOMEN
- [ ] Implement visual reasoning (screenshot + AXTree)
- [ ] Add GitHub tools (repo, PR, issues)
- [ ] Enhance LSP tools
- [ ] Build tool execution visualization

**Deliverable:** 30+ tools with visual browser

### Phase 5: Natural Language (Weeks 9-10)

**Goal:** Intent recognition and context management

- [ ] Create `src/nlu/` directory
- [ ] Implement intent recognition
- [ ] Build entity extraction
- [ ] Create context manager
- [ ] Add clarification questions
- [ ] Implement follow-up resolution

**Deliverable:** Natural, context-aware conversations

### Phase 6: Provider Intelligence (Weeks 11-12)

**Goal:** Smart provider selection with learning

- [ ] Create `src/providers/intelligent.ts`
- [ ] Implement provider scoring
- [ ] Add performance tracking
- [ ] Build cost optimization
- [ ] Create provider specialization
- [ ] Implement predictive failover

**Deliverable:** Intelligent provider selection

### Phase 7: Security & Extensions (Weeks 13-14)

**Goal:** Fortress security model and plugin system

- [ ] Create `src/security/fortress.ts`
- [ ] Implement pattern blocking
- [ ] Add behavior analysis
- [ ] Create plugin architecture
- [ ] Build MCP integration
- [ ] Add lifecycle hooks

**Deliverable:** Secure, extensible platform

### Phase 8: Polish & Launch (Weeks 15-16)

**Goal:** Production-ready release

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Tutorial and examples
- [ ] Beta testing
- [ ] npm publish v2.0.0

**Deliverable:** ECHOMEN CLI v2.0.0 on npm

---

## Success Metrics

### User Adoption

- **Week 1:** 100 beta users
- **Month 1:** 1,000 active users
- **Month 3:** 10,000 active users
- **Month 6:** 50,000 active users

### Technical Metrics

- **NPS Score:** > 50
- **Session Duration:** > 30 minutes
- **Retention (D7):** > 40%
- **Error Rate:** < 1%
- **Response Time:** < 5 seconds (p95)

### Business Metrics

- **GitHub Stars:** > 5,000 in 6 months
- **npm Downloads:** > 10,000/month
- **Plugin Ecosystem:** > 50 community plugins
- **Enterprise Interest:** > 10 inbound inquiries

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| BDI engine too slow | Medium | High | Optimize with caching, parallel execution |
| Memory system too complex | Medium | Medium | Start simple, iterate based on usage |
| Provider API changes | High | Medium | Abstraction layer, automated testing |
| Browser automation brittle | High | Medium | WebHawk visual reasoning, retry logic |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Competitor releases similar feature | High | Medium | Focus on differentiation (BDI, memory) |
| AI CLI market saturation | Medium | Medium | Target niche (developers, power users) |
| Provider cost increases | Medium | Low | Multi-provider strategy, cost optimization |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Security vulnerability | Medium | High | Security audit, bug bounty program |
| Performance regression | High | Medium | CI/CD with performance tests |
| User data loss | Low | High | Backup strategy, encryption |

---

## Go-to-Market Strategy

### Pre-Launch (Weeks 1-14)

- Build in public on Twitter/GitHub
- Share progress updates weekly
- Recruit beta testers from developer communities
- Create waitlist for v2.0 launch

### Launch (Week 15-16)

- Product Hunt launch
- Hacker News Show HN
- Twitter thread with demo video
- Reddit posts (r/programming, r/devops, r/MachineLearning)
- Discord/Slack community announcements

### Post-Launch (Week 17+)

- Weekly feature highlights
- Community plugin showcase
- User success stories
- Conference talks and meetups
- YouTube tutorial series

---

## Appendix A: Competitive Analysis

### Claude Code (Anthropic)

**Strengths:**
- High-quality responses from Claude models
- Good tool execution
- Strong brand recognition

**Weaknesses:**
- Vendor lock-in (Claude only)
- No memory beyond session
- No self-improvement
- Simple ReAct loop

**ECHOMEN Advantage:**
- 14+ providers with failover
- Multi-layer memory
- BDI cognitive architecture
- Self-improvement through learning

### Gemini CLI (Google)

**Strengths:**
- Gemini model integration
- Google ecosystem
- Free tier available

**Weaknesses:**
- Google vendor lock-in
- Limited tool set
- No strategic planning

**ECHOMEN Advantage:**
- Provider agnostic
- 30+ tools
- Hierarchical task planning

### OpenClaw

**Strengths:**
- Open source
- Customizable

**Weaknesses:**
- Limited provider support
- Basic features
- Small community

**ECHOMEN Advantage:**
- Comprehensive feature set
- Plugin ecosystem
- Active development

---

## Appendix B: User Stories

### US-1: Developer Workflow

> As a developer, I want ECHOMEN to remember my project structure and conventions, so I don't have to re-explain them every session.

**Acceptance Criteria:**
- ECHOMEN loads ECHO.md on startup
- Project conventions are applied automatically
- File structure is understood contextually
- Coding style preferences are remembered

### US-2: Complex Task Execution

> As a user, I want ECHOMEN to plan and execute complex multi-step tasks, so I can delegate entire features.

**Acceptance Criteria:**
- Task is decomposed into hierarchical subtasks
- Dependencies are identified and respected
- Progress is visualized in real-time
- Failures trigger replanning

### US-3: Learning from Experience

> As a user, I want ECHOMEN to learn from its successes and failures, so it gets better at helping me over time.

**Acceptance Criteria:**
- Successful strategies are remembered
- Failed approaches are avoided in future
- Provider performance is tracked per task type
- User preferences are learned implicitly

### US-4: Browser Automation

> As a user, I want ECHOMEN to automate web tasks reliably, so I can delegate scraping, form filling, and workflows.

**Acceptance Criteria:**
- Visual understanding of web pages
- Robust element location (not just CSS selectors)
- Multi-step workflow execution
- Screenshot verification of actions

### US-5: Security and Control

> As a user, I want to maintain control over dangerous operations, so I can trust ECHOMEN with sensitive tasks.

**Acceptance Criteria:**
- HITL required for dangerous commands
- Audit trail of all actions
- Rate limiting prevents abuse
- Encryption protects credentials

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **BDI** | Belief-Desire-Intention cognitive architecture |
| **ReAct** | Reason + Act execution pattern |
| **HITL** | Human-In-The-Loop approval workflow |
| **WebHawk** | ECHOMEN's browser automation engine |
| **ECHO.md** | Project-specific context file |
| **Second Brain** | Persistent knowledge base |
| **Fortress** | ECHOMEN security model |
| **MCP** | Model Context Protocol for extensions |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 14, 2026 | ECHOMEN Team | Initial PRD |

---

**Next Steps:**
1. Review PRD with team
2. Prioritize Phase 2-3 features
3. Create detailed technical specifications
4. Begin BDI engine implementation
