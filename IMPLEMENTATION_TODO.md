# ECHOMEN CLI - Master Implementation TODO

> **Status:** Active Development  
> **Current Phase:** Phase 1 (Foundation) - 80% Complete  
> **Target:** v2.0.0 Release

---

## Phase 1: Foundation (Weeks 1-2) - 80% Complete

### 1.1 Terminal UI Framework ✅

- [x] **1.1.1** Install Ink and React dependencies
  - `npm install ink react`
  - Status: ✅ Complete

- [x] **1.1.2** Create TUI directory structure
  - `src/tui/`, `src/tui/components/`, `src/hooks/`
  - Status: ✅ Complete

- [x] **1.1.3** Create startup sequence component
  - File: `src/tui/startup.tsx`
  - Features: ASCII logo, boot animation, system checks
  - Status: ✅ Complete

- [x] **1.1.4** Create Header component
  - File: `src/tui/components/Header.tsx`
  - Features: Logo, mode indicator
  - Status: ✅ Complete

- [x] **1.1.5** Create StatusBar component
  - File: `src/tui/components/StatusBar.tsx`
  - Features: System status, cognitive state, shortcuts
  - Status: ✅ Complete

- [x] **1.1.6** Create MessageHistory component
  - File: `src/tui/components/MessageHistory.tsx`
  - Features: Conversation display, auto-scroll
  - Status: ✅ Complete

- [x] **1.1.7** Create CommandInput component
  - File: `src/tui/components/CommandInput.tsx`
  - Features: Text input, mode-aware prompts
  - Status: ✅ Complete

- [x] **1.1.8** Create ContextPanel component
  - File: `src/tui/components/ContextPanel.tsx`
  - Features: Mode-specific context display
  - Status: ✅ Complete

- [x] **1.1.9** Create CommandPalette component
  - File: `src/tui/components/CommandPalette.tsx`
  - Features: Fuzzy search, command discovery
  - Status: ✅ Complete

- [x] **1.1.10** Create TUI types
  - File: `src/tui/types.ts`
  - Status: ✅ Complete

- [x] **1.1.11** Create main ECHOMEN app
  - File: `src/tui/echomen-app.tsx`
  - Features: Component integration, keyboard shortcuts
  - Status: ✅ Complete

- [x] **1.1.12** Create dashboard entry point
  - File: `src/tui/echomen-dashboard.tsx`
  - Status: ✅ Complete

- [x] **1.1.13** Create useEngine hook
  - File: `src/hooks/useEngine.ts`
  - Features: BDI state management, engine integration
  - Status: ✅ Complete

- [x] **1.1.14** Integrate with CLI entry point
  - File: `src/index.ts` - Add `echomen` command
  - Status: ✅ Complete

- [ ] **1.1.15** Add syntax highlighting for code blocks
  - Library: `cli-highlight` or `shiki`
  - Status: ⚪ Pending

- [ ] **1.1.16** Add streaming response support
  - Implement incremental rendering in MessageHistory
  - Status: ⚪ Pending

- [ ] **1.1.17** Add file tree component
  - File: `src/tui/components/FileTree.tsx`
  - Features: Directory navigation, file selection
  - Status: ⚪ Pending

### 1.2 Testing & Polish

- [ ] **1.2.1** Test startup sequence on various terminals
  - iTerm2, Terminal.app, Windows Terminal, Alacritty
  - Status: ⚪ Pending

- [ ] **1.2.2** Test keyboard shortcuts
  - Verify Ctrl+P, Ctrl+1-5, Ctrl+C work correctly
  - Status: ⚪ Pending

- [ ] **1.2.3** Add error boundaries
  - Catch and display TUI errors gracefully
  - Status: ⚪ Pending

- [ ] **1.2.4** Performance optimization
  - Reduce TUI re-renders
  - Status: ⚪ Pending

---

## Phase 2: BDI Cognitive Architecture (Weeks 3-4)

### 2.1 Core BDI Engine

- [ ] **2.1.1** Create BDI engine core
  - File: `src/core/bdi-engine.ts`
  - Implement CognitiveState enum (7 states)
  - Implement BDIEngine class
  - Status: ⚪ Pending

- [ ] **2.1.2** Implement state machine
  - State transitions: IDLE → PERCEIVE → REASON → PLAN → ACT → OBSERVE → REFLECT → LEARN → IDLE
  - Status: ⚪ Pending

- [ ] **2.1.3** Create Beliefs interface
  - File: `src/core/bdi-types.ts`
  - Environment state, memories, context, capabilities
  - Status: ⚪ Pending

- [ ] **2.1.4** Create Desires interface
  - Primary goal, subgoals, constraints
  - Status: ⚪ Pending

- [ ] **2.1.5** Create Intention interface
  - Current plan, current action, fallback plans
  - Status: ⚪ Pending

### 2.2 Perception Module

- [ ] **2.2.1** Create perception module
  - File: `src/core/perception.ts`
  - Status: ⚪ Pending

- [ ] **2.2.2** Implement environment gathering
  - Current directory, OS, shell
  - Status: ⚪ Pending

- [ ] **2.2.3** Implement file context gathering
  - Read ECHO.md, detect project structure
  - Status: ⚪ Pending

- [ ] **2.2.4** Implement git context
  - Git status, current branch, recent commits
  - Status: ⚪ Pending

- [ ] **2.2.5** Implement memory retrieval
  - Fetch relevant memories from brain
  - Status: ⚪ Pending

### 2.3 Reasoning Module

- [ ] **2.3.1** Create reasoning module
  - File: `src/core/reasoner.ts`
  - Status: ⚪ Pending

- [ ] **2.3.2** Implement goal analysis
  - Use LLM to understand user intent
  - Status: ⚪ Pending

- [ ] **2.3.3** Implement constraint identification
  - Safety, time, cost limits
  - Status: ⚪ Pending

- [ ] **2.3.4** Implement complexity estimation
  - Estimate tokens, time, tool calls needed
  - Status: ⚪ Pending

### 2.4 Planning Module

- [ ] **2.4.1** Create planner module
  - File: `src/core/planner.ts`
  - Status: ⚪ Pending

- [ ] **2.4.2** Implement task decomposition
  - Break goals into hierarchical task trees
  - Status: ⚪ Pending

- [ ] **2.4.3** Implement dependency tracking
  - TaskNode.dependencies array
  - Status: ⚪ Pending

- [ ] **2.4.4** Implement parallelization detection
  - Identify tasks that can run in parallel
  - Status: ⚪ Pending

- [ ] **2.4.5** Implement fallback planning
  - Generate alternative approaches
  - Status: ⚪ Pending

- [ ] **2.4.6** Create TaskTree data structure
  - File: `src/core/task-tree.ts`
  - Status: ⚪ Pending

### 2.5 Execution Module

- [ ] **2.5.1** Create executor module
  - File: `src/core/executor.ts`
  - Status: ⚪ Pending

- [ ] **2.5.2** Implement action execution
  - Execute tools with proper error handling
  - Status: ⚪ Pending

- [ ] **2.5.3** Implement progress tracking
  - Update task status in real-time
  - Status: ⚪ Pending

- [ ] **2.5.4** Implement retry logic
  - Configurable max retries per action
  - Status: ⚪ Pending

### 2.6 Observation Module

- [ ] **2.6.1** Create observer module
  - File: `src/core/observer.ts`
  - Status: ⚪ Pending

- [ ] **2.6.2** Implement result capture
  - Capture tool execution results
  - Status: ⚪ Pending

- [ ] **2.6.3** Implement success/failure detection
  - Analyze if action succeeded
  - Status: ⚪ Pending

- [ ] **2.6.4** Implement replanning trigger
  - Detect when replanning is needed
  - Status: ⚪ Pending

### 2.7 Reflection Module

- [ ] **2.7.1** Create reflector module
  - File: `src/core/reflector.ts`
  - Status: ⚪ Pending

- [ ] **2.7.2** Implement outcome evaluation
  - Compare results to success criteria
  - Status: ⚪ Pending

- [ ] **2.7.3** Implement strategy analysis
  - What worked, what didn't
  - Status: ⚪ Pending

- [ ] **2.7.4** Implement improvement suggestions
  - Generate lessons learned
  - Status: ⚪ Pending

### 2.8 Learning Module

- [ ] **2.8.1** Create learner module
  - File: `src/core/learner.ts`
  - Status: ⚪ Pending

- [ ] **2.8.2** Implement memory consolidation
  - Update episodic memory with execution
  - Status: ⚪ Pending

- [ ] **2.8.3** Implement strategy learning
  - Update strategy weights based on success
  - Status: ⚪ Pending

- [ ] **2.8.4** Implement provider performance tracking
  - Update provider metrics
  - Status: ⚪ Pending

### 2.9 Integration

- [ ] **2.9.1** Replace ReAct engine with BDI engine
  - Update `src/core/engine.ts` to use BDI
  - Status: ⚪ Pending

- [ ] **2.9.2** Update TUI to show BDI states
  - Display current cognitive state in StatusBar
  - Status: ⚪ Pending

- [ ] **2.9.3** Add task tree visualization
  - Show plan progress in ContextPanel
  - Status: ⚪ Pending

---

## Phase 3: Multi-Layer Memory System (Weeks 5-6)

### 3.1 Memory Architecture

- [ ] **3.1.1** Create memory directory
  - `src/memory/`
  - Status: ⚪ Pending

- [ ] **3.1.2** Define memory interfaces
  - File: `src/memory/types.ts`
  - WorkingMemory, EpisodicMemory, SemanticMemory, LongTermMemory
  - Status: ⚪ Pending

- [ ] **3.1.3** Create memory protocol
  - File: `src/memory/protocol.ts`
  - Unified memory access interface
  - Status: ⚪ Pending

### 3.2 Working Memory

- [ ] **3.2.1** Implement WorkingMemory
  - File: `src/memory/working.ts`
  - Current task context, volatile
  - Status: ⚪ Pending

- [ ] **3.2.2** Implement context tracking
  - Active goal, partial results
  - Status: ⚪ Pending

- [ ] **3.2.3** Implement clear on task completion
  - Status: ⚪ Pending

### 3.3 Episodic Memory

- [ ] **3.3.1** Implement EpisodicMemory
  - File: `src/memory/episodic.ts`
  - Past task executions
  - Status: ⚪ Pending

- [ ] **3.3.2** Implement execution recording
  - Store goal, plan, outcome, reflection
  - Status: ⚪ Pending

- [ ] **3.3.3** Implement similarity search
  - Find similar past experiences
  - Status: ⚪ Pending

- [ ] **3.3.4** Implement temporal indexing
  - Query by time range
  - Status: ⚪ Pending

### 3.4 Semantic Memory

- [ ] **3.4.1** Implement SemanticMemory
  - File: `src/memory/semantic.ts`
  - Concepts, facts, knowledge
  - Status: ⚪ Pending

- [ ] **3.4.2** Implement concept storage
  - Store concepts with relationships
  - Status: ⚪ Pending

- [ ] **3.4.3** Implement semantic search
  - Search by meaning, not just keywords
  - Status: ⚪ Pending

### 3.5 Long-Term Memory

- [ ] **3.5.1** Implement LongTermMemory
  - File: `src/memory/longterm.ts`
  - Skills, strategies, provider metrics
  - Status: ⚪ Pending

- [ ] **3.5.2** Implement strategy storage
  - Store successful strategies per task type
  - Status: ⚪ Pending

- [ ] **3.5.3** Implement provider performance tracking
  - Track success rate, latency per provider/task
  - Status: ⚪ Pending

### 3.6 Memory Retrieval

- [ ] **3.6.1** Create retrieval engine
  - File: `src/memory/retrieval.ts`
  - Status: ⚪ Pending

- [ ] **3.6.2** Implement similarity scoring
  - Cosine similarity for memory matching
  - Status: ⚪ Pending

- [ ] **3.6.3** Implement relevance ranking
  - Rank memories by recency, frequency, relevance
  - Status: ⚪ Pending

### 3.7 Memory Visualization

- [ ] **3.7.1** Create memory panel in TUI
  - File: `src/tui/components/MemoryPanel.tsx`
  - Status: ⚪ Pending

- [ ] **3.7.2** Implement memory browsing
  - View memories by type
  - Status: ⚪ Pending

- [ ] **3.7.3** Implement memory editing
  - Delete, update memories
  - Status: ⚪ Pending

### 3.8 Migration

- [ ] **3.8.1** Migrate from BrainStore to new memory system
  - Update all BrainStore usages
  - Status: ⚪ Pending

- [ ] **3.8.2** Data migration script
  - Convert existing brain data to new format
  - Status: ⚪ Pending

---

## Phase 4: Advanced Tools (Weeks 7-8)

### 4.1 WebHawk 2.0 Browser

- [ ] **4.1.1** Create WebHawk directory
  - `src/tools/webhawk/`
  - Status: ⚪ Pending

- [ ] **4.1.2** Implement WebHawk session
  - File: `src/tools/webhawk/session.ts`
  - Playwright page management
  - Status: ⚪ Pending

- [ ] **4.1.3** Implement visual navigation
  - Navigate + screenshot + AXTree extraction
  - Status: ⚪ Pending

- [ ] **4.1.4** Implement visual reasoning
  - Use LLM vision to understand pages
  - Status: ⚪ Pending

- [ ] **4.1.5** Implement element location
  - Find elements by description (not just selectors)
  - Status: ⚪ Pending

- [ ] **4.1.6** Implement form filling
  - Fill forms with validation
  - Status: ⚪ Pending

- [ ] **4.1.7** Implement workflow execution
  - Multi-step browser automation
  - Status: ⚪ Pending

### 4.2 GitHub Integration

- [ ] **4.2.1** Create GitHub tools
  - File: `src/tools/github.ts`
  - Status: ⚪ Pending

- [ ] **4.2.2** Implement repo operations
  - create, clone, fork
  - Status: ⚪ Pending

- [ ] **4.2.3** Implement PR operations
  - create, review, merge
  - Status: ⚪ Pending

- [ ] **4.2.4** Implement issue operations
  - create, search, analyze
  - Status: ⚪ Pending

- [ ] **4.2.5** Implement code search
  - Search GitHub codebase
  - Status: ⚪ Pending

### 4.3 LSP Enhancement

- [ ] **4.3.1** Enhance LSP tools
  - File: `src/tools/lsp-advanced.ts`
  - Status: ⚪ Pending

- [ ] **4.3.2** Implement codebase analysis
  - Build symbol graph, find dead code
  - Status: ⚪ Pending

- [ ] **4.3.3** Implement refactoring
  - Safe multi-file refactoring
  - Status: ⚪ Pending

- [ ] **4.3.4** Implement code generation
  - Generate implementations from interfaces
  - Status: ⚪ Pending

### 4.4 Tool Visualization

- [ ] **4.4.1** Create tool execution panel
  - File: `src/tui/components/ToolPanel.tsx`
  - Status: ⚪ Pending

- [ ] **4.4.2** Implement real-time tool feedback
  - Show tool progress, results
  - Status: ⚪ Pending

---

## Phase 5: Natural Language Interface (Weeks 9-10)

### 5.1 Intent Recognition

- [ ] **5.1.1** Create NLU directory
  - `src/nlu/`
  - Status: ⚪ Pending

- [ ] **5.1.2** Define intent types
  - File: `src/nlu/intent.ts`
  - CHAT, EXECUTE_TASK, BROWSE, CODE_EDIT, etc.
  - Status: ⚪ Pending

- [ ] **5.1.3** Implement intent recognizer
  - LLM + pattern matching
  - Status: ⚪ Pending

### 5.2 Entity Extraction

- [ ] **5.2.1** Implement entity extractor
  - File: `src/nlu/entities.ts`
  - Status: ⚪ Pending

- [ ] **5.2.2** Implement file path extraction
  - Status: ⚪ Pending

- [ ] **5.2.3** Implement command extraction
  - Status: ⚪ Pending

- [ ] **5.2.4** Implement parameter extraction
  - Status: ⚪ Pending

### 5.3 Context Management

- [ ] **5.3.1** Create context manager
  - File: `src/nlu/context.ts`
  - Status: ⚪ Pending

- [ ] **5.3.2** Implement conversation tracking
  - Track entities across turns
  - Status: ⚪ Pending

- [ ] **5.3.3** Implement follow-up resolution
  - Resolve "it", "that", "the file"
  - Status: ⚪ Pending

- [ ] **5.3.4** Implement clarification questions
  - Ask when input is ambiguous
  - Status: ⚪ Pending

---

## Phase 6: Provider Intelligence (Weeks 11-12)

### 6.1 Intelligent Selection

- [ ] **6.1.1** Create intelligent provider module
  - File: `src/providers/intelligent.ts`
  - Status: ⚪ Pending

- [ ] **6.1.2** Implement provider scoring
  - Score based on task type, history, cost
  - Status: ⚪ Pending

- [ ] **6.1.3** Implement task type analysis
  - Classify task: code, chat, analysis, etc.
  - Status: ⚪ Pending

### 6.2 Performance Tracking

- [ ] **6.2.1** Implement performance tracking
  - Track success rate, latency per provider
  - Status: ⚪ Pending

- [ ] **6.2.2** Implement degradation detection
  - Alert when provider quality drops
  - Status: ⚪ Pending

### 6.3 Cost Optimization

- [ ] **6.3.1** Implement cost tracking
  - Track tokens and cost per provider
  - Status: ⚪ Pending

- [ ] **6.3.2** Implement budget enforcement
  - Stay within user-defined budgets
  - Status: ⚪ Pending

---

## Phase 7: Security & Extensions (Weeks 13-14)

### 7.1 Fortress Security

- [ ] **7.1.1** Create security directory
  - `src/security/`
  - Status: ⚪ Pending

- [ ] **7.1.2** Implement Fortress
  - File: `src/security/fortress.ts`
  - Status: ⚪ Pending

- [ ] **7.1.3** Implement pattern blocking
  - Block dangerous command patterns
  - Status: ⚪ Pending

- [ ] **7.1.4** Implement behavior analysis
  - Detect anomalous behavior
  - Status: ⚪ Pending

- [ ] **7.1.5** Enhance audit logging
  - Log all actions with context
  - Status: ⚪ Pending

### 7.2 Plugin System

- [ ] **7.2.1** Create extensions directory
  - `src/extensions/`
  - Status: ⚪ Pending

- [ ] **7.2.2** Define plugin interface
  - File: `src/extensions/plugin.ts`
  - Status: ⚪ Pending

- [ ] **7.2.3** Implement plugin loader
  - Load plugins from `~/.echomen/plugins/`
  - Status: ⚪ Pending

- [ ] **7.2.4** Implement tool registration
  - Plugins can register new tools
  - Status: ⚪ Pending

- [ ] **7.2.5** Implement provider registration
  - Plugins can register new providers
  - Status: ⚪ Pending

### 7.3 MCP Integration

- [ ] **7.3.1** Implement MCP client
  - File: `src/extensions/mcp.ts`
  - Status: ⚪ Pending

- [ ] **7.3.2** Auto-discover MCP servers
  - Status: ⚪ Pending

- [ ] **7.3.3** Import MCP tools
  - Status: ⚪ Pending

---

## Phase 8: Polish & Launch (Weeks 15-16)

### 8.1 Testing

- [ ] **8.1.1** Write unit tests for BDI engine
  - Status: ⚪ Pending

- [ ] **8.1.2** Write integration tests
  - Status: ⚪ Pending

- [ ] **8.1.3** Write E2E tests
  - Status: ⚪ Pending

- [ ] **8.1.4** Achieve 60%+ code coverage
  - Status: ⚪ Pending

### 8.2 Documentation

- [ ] **8.2.1** Update README.md
  - Status: ⚪ Pending

- [ ] **8.2.2** Create user guide
  - File: `docs/USER_GUIDE.md`
  - Status: ⚪ Pending

- [ ] **8.2.3** Create developer guide
  - File: `docs/DEVELOPER_GUIDE.md`
  - Status: ⚪ Pending

- [ ] **8.2.4** Create plugin development guide
  - File: `docs/PLUGIN_GUIDE.md`
  - Status: ⚪ Pending

### 8.3 Examples

- [ ] **8.3.1** Create example directory
  - `examples/`
  - Status: ⚪ Pending

- [ ] **8.3.2** Add basic chat examples
  - Status: ⚪ Pending

- [ ] **8.3.3** Add agent mode examples
  - Status: ⚪ Pending

- [ ] **8.3.4** Add browser automation examples
  - Status: ⚪ Pending

### 8.4 Launch

- [ ] **8.4.1** Beta testing program
  - Recruit 100 beta testers
  - Status: ⚪ Pending

- [ ] **8.4.2** Product Hunt launch
  - Status: ⚪ Pending

- [ ] **8.4.3** npm publish v2.0.0
  - Status: ⚪ Pending

---

## Quick Reference: File Structure

```
src/
├── core/
│   ├── bdi-engine.ts          # Main BDI cognitive engine
│   ├── bdi-types.ts           # BDI type definitions
│   ├── perception.ts          # Context gathering
│   ├── reasoner.ts            # LLM reasoning
│   ├── planner.ts             # Task planning
│   ├── executor.ts            # Action execution
│   ├── observer.ts            # Result observation
│   ├── reflector.ts           # Outcome reflection
│   ├── learner.ts             # Learning from experience
│   └── task-tree.ts           # Task tree data structure
├── memory/
│   ├── types.ts               # Memory type definitions
│   ├── protocol.ts            # Memory access protocol
│   ├── working.ts             # Working memory
│   ├── episodic.ts            # Episodic memory
│   ├── semantic.ts            # Semantic memory
│   ├── longterm.ts            # Long-term memory
│   └── retrieval.ts           # Memory retrieval
├── nlu/
│   ├── intent.ts              # Intent recognition
│   ├── entities.ts            # Entity extraction
│   └── context.ts             # Context management
├── providers/
│   └── intelligent.ts         # Intelligent provider selection
├── security/
│   └── fortress.ts            # Security model
├── extensions/
│   ├── plugin.ts              # Plugin interface
│   ├── loader.ts              # Plugin loader
│   └── mcp.ts                 # MCP integration
├── tools/
│   └── webhawk/               # WebHawk browser
│       ├── session.ts
│       ├── navigate.ts
│       ├── extract.ts
│       └── interact.ts
├── tui/
│   ├── types.ts               # TUI types
│   ├── startup.tsx            # Startup sequence
│   ├── echomen-app.tsx        # Main app
│   ├── echomen-dashboard.tsx  # Dashboard entry
│   └── components/
│       ├── Header.tsx
│       ├── StatusBar.tsx
│       ├── MessageHistory.tsx
│       ├── CommandInput.tsx
│       ├── ContextPanel.tsx
│       ├── CommandPalette.tsx
│       ├── FileTree.tsx       # TODO
│       ├── MemoryPanel.tsx    # TODO
│       └── ToolPanel.tsx      # TODO
└── hooks/
    └── useEngine.ts           # Cognitive engine hook
```

---

## Priority Legend

- **P0**: Critical - Must have for v2.0
- **P1**: High - Should have for v2.0
- **P2**: Medium - Nice to have for v2.0
- **P3**: Low - Post v2.0

## Status Legend

- ✅ Complete
- 🟡 In Progress
- ⚪ Pending
- 🔴 Blocked

---

**Last Updated:** March 14, 2026  
**Next Review:** March 21, 2026
