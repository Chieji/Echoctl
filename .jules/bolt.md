
## 2026-03-22 - [Git Tool Performance & CI Fix]
**Learning:** Consolidating sequential shell commands into 'Promise.all' or batching arguments (like 'git add file1 file2') drastically reduces overhead from process spawning. Also discovered that CI can fail if 'package-lock.json' is out of sync or if required utility files (like 'BDIHaltingGuards.ts') are missing from the source tree.
**Action:** Always verify local builds and 'package-lock.json' consistency before submission. Ensure all referenced local modules are actually present in the 'src' directory.

## 2026-03-24 - [Cognitive Cycle Memory Optimization]
**Learning:** Instantiating stateful components like 'LongTermMemory' multiple times within a single cognitive cycle (Perception -> Action -> Reflection) leads to redundant disk I/O and inconsistent in-memory caches. Singleton patterns for these core services ensure cache unified and atomic persistence. Also, 'node_modules' might be tracked by Git in some environments; always verify 'git status' to avoid accidental inclusion in PRs.
**Action:** Use 'getLongTermMemory()' singleton to unify semantic memory access. Implement FIFO eviction on in-memory caches to prevent unbounded growth in long-running CLI sessions.

## 2026-03-25 - [Multi-file Batch Operations Optimization]
**Learning:** Parallelizing file I/O with 'Promise.all' and using native Node.js methods ('fs/promises.cp', 'fs/promises.rm') instead of 'child_process.exec' significantly reduces latency and overhead. Also, avoiding shared 'RegExp' instances across concurrent tasks prevents inconsistent 'lastIndex' states.
**Action:** Always prefer native async Node.js FS methods for batch operations. Re-create 'RegExp' per-file in parallel loops if they are stateful (global flag).
