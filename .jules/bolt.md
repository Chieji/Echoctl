
## 2026-03-22 - [Git Tool Performance & CI Fix]
**Learning:** Consolidating sequential shell commands into 'Promise.all' or batching arguments (like 'git add file1 file2') drastically reduces overhead from process spawning. Also discovered that CI can fail if 'package-lock.json' is out of sync or if required utility files (like 'BDIHaltingGuards.ts') are missing from the source tree.
**Action:** Always verify local builds and 'package-lock.json' consistency before submission. Ensure all referenced local modules are actually present in the 'src' directory.

## 2026-03-24 - [Cognitive Cycle Memory Optimization]
**Learning:** Instantiating stateful components like 'LongTermMemory' multiple times within a single cognitive cycle (Perception -> Action -> Reflection) leads to redundant disk I/O and inconsistent in-memory caches. Singleton patterns for these core services ensure cache unified and atomic persistence. Also, 'node_modules' might be tracked by Git in some environments; always verify 'git status' to avoid accidental inclusion in PRs.
**Action:** Use 'getLongTermMemory()' singleton to unify semantic memory access. Implement FIFO eviction on in-memory caches to prevent unbounded growth in long-running CLI sessions.

## 2026-04-12 - [Regex Race Conditions in Parallel I/O]
**Learning:** When parallelizing string searches (e.g., in `searchInFiles`) using `Promise.all`, sharing a `RegExp` instance with the global (`/g`) flag leads to inconsistent results due to the shared `lastIndex` state.
**Action:** Always recreate `RegExp` instances from source and flags (e.g., `new RegExp(pattern.source, pattern.flags)`) inside the parallelized map to ensure thread-safety.

## 2026-04-12 - [Handling Tracked node_modules]
**Learning:** In some environments, parts of `node_modules` may be tracked by Git. Standard `npm install` can cause accidental modifications to these files, leading to PR pollution.
**Action:** Always verify `git status` before committing and use `git restore --staged node_modules/ && git restore node_modules/` to clean up accidental changes to dependencies.
