
## 2026-03-22 - [Git Tool Performance & CI Fix]
**Learning:** Consolidating sequential shell commands into 'Promise.all' or batching arguments (like 'git add file1 file2') drastically reduces overhead from process spawning. Also discovered that CI can fail if 'package-lock.json' is out of sync or if required utility files (like 'BDIHaltingGuards.ts') are missing from the source tree.
**Action:** Always verify local builds and 'package-lock.json' consistency before submission. Ensure all referenced local modules are actually present in the 'src' directory.

## 2026-03-24 - [Cognitive Cycle Memory Optimization]
**Learning:** Instantiating stateful components like 'LongTermMemory' multiple times within a single cognitive cycle (Perception -> Action -> Reflection) leads to redundant disk I/O and inconsistent in-memory caches. Singleton patterns for these core services ensure cache unified and atomic persistence. Also, 'node_modules' might be tracked by Git in some environments; always verify 'git status' to avoid accidental inclusion in PRs.
**Action:** Use 'getLongTermMemory()' singleton to unify semantic memory access. Implement FIFO eviction on in-memory caches to prevent unbounded growth in long-running CLI sessions.

## 2026-04-14 - [TUI Streaming & Reconciliation Optimization]
**Learning:** React TUI components (via Ink) suffer from major performance degradation during AI response streaming if the entire message history re-renders on every new token. Memoizing message items and content, using stable keys (timestamps) instead of array indices, and hoisting static resources (Regex, maps) out of the render loop significantly reduces CPU usage and flickering. Also, 'node_modules' tracking can lead to accidental dirty patches during environment syncs; always verify 'git status' before commit.
**Action:** Wrap TUI message components in 'React.memo', use 'useMemo' for expensive string parsing, and ensure stable React keys for list items. Always 'git restore' untracked changes in 'node_modules'.
