
## 2026-03-22 - [Git Tool Performance & CI Fix]
**Learning:** Consolidating sequential shell commands into 'Promise.all' or batching arguments (like 'git add file1 file2') drastically reduces overhead from process spawning. Also discovered that CI can fail if 'package-lock.json' is out of sync or if required utility files (like 'BDIHaltingGuards.ts') are missing from the source tree.
**Action:** Always verify local builds and 'package-lock.json' consistency before submission. Ensure all referenced local modules are actually present in the 'src' directory.

## 2026-03-24 - [Cognitive Cycle Memory Optimization]
**Learning:** Instantiating stateful components like 'LongTermMemory' multiple times within a single cognitive cycle (Perception -> Action -> Reflection) leads to redundant disk I/O and inconsistent in-memory caches. Singleton patterns for these core services ensure cache unified and atomic persistence. Also, 'node_modules' might be tracked by Git in some environments; always verify 'git status' to avoid accidental inclusion in PRs.
**Action:** Use 'getLongTermMemory()' singleton to unify semantic memory access. Implement FIFO eviction on in-memory caches to prevent unbounded growth in long-running CLI sessions.

## 2026-03-26 - [TUI Rendering & Scope Management]
**Learning:** In terminal UIs built with Ink/React, expensive operations like syntax highlighting (`cli-highlight`) within streaming message components can cause significant CPU spikes and lag if not memoized. Each new token in a stream triggers a re-render of the entire message history. Also discovered that 'npm install' can modify tracked 'node_modules' files in this environment, which must be reverted to avoid polluting PRs.
**Action:** Use 'React.memo' and 'useMemo' for components performing non-trivial string processing or rendering in the TUI. Always check 'git status' after 'npm install' to ensure 'node_modules' or lockfiles haven't been unexpectedly modified.
