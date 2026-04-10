
## 2026-03-22 - [Git Tool Performance & CI Fix]
**Learning:** Consolidating sequential shell commands into 'Promise.all' or batching arguments (like 'git add file1 file2') drastically reduces overhead from process spawning. Also discovered that CI can fail if 'package-lock.json' is out of sync or if required utility files (like 'BDIHaltingGuards.ts') are missing from the source tree.
**Action:** Always verify local builds and 'package-lock.json' consistency before submission. Ensure all referenced local modules are actually present in the 'src' directory.

## 2026-03-24 - [Cognitive Cycle Memory Optimization]
**Learning:** Instantiating stateful components like 'LongTermMemory' multiple times within a single cognitive cycle (Perception -> Action -> Reflection) leads to redundant disk I/O and inconsistent in-memory caches. Singleton patterns for these core services ensure cache unified and atomic persistence. Also, 'node_modules' might be tracked by Git in some environments; always verify 'git status' to avoid accidental inclusion in PRs.
**Action:** Use 'getLongTermMemory()' singleton to unify semantic memory access. Implement FIFO eviction on in-memory caches to prevent unbounded growth in long-running CLI sessions.

## 2026-04-10 - [TUI Streaming Optimization]
**Learning:** Frequent React updates during message streaming in a TUI (like character-by-character rendering) can cause significant CPU spikes if expensive operations like syntax highlighting or markdown parsing are not memoized. In Ink/React-based terminals, re-rendering the entire message list on every token is a major bottleneck.
**Action:** Always memoize components in the message history and use 'useMemo' for expensive transformations (highlighting, regex splitting) to ensure they only run when the content actually changes. Use stable keys (like timestamps) instead of array indices to prevent full list re-renders.

## 2026-04-10 - [Provider Chain CI Fix]
**Learning:** The 'ProviderChain' was auto-initializing 'ollama' even when all configs were undefined, causing test failures in CI environments where 'ollama' is not available or desired.
**Action:** Only initialize 'ollama' if its configuration is explicitly provided, ensuring consistent behavior across local and CI environments.
