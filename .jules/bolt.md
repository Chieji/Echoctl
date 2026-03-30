
## 2026-03-22 - [Git Tool Performance & CI Fix]
**Learning:** Consolidating sequential shell commands into 'Promise.all' or batching arguments (like 'git add file1 file2') drastically reduces overhead from process spawning. Also discovered that CI can fail if 'package-lock.json' is out of sync or if required utility files (like 'BDIHaltingGuards.ts') are missing from the source tree.
**Action:** Always verify local builds and 'package-lock.json' consistency before submission. Ensure all referenced local modules are actually present in the 'src' directory.

## 2026-03-23 - [Semantic Memory Singleton & Cache Eviction]
**Learning:** Instantiating classes like 'LongTermMemory' multiple times leads to redundant disk I/O and fragmented caches. Also, in-memory caches (like 'embeddingCache') can cause memory leaks in long-running sessions if not capped.
**Action:** Use the Singleton pattern for shared resources and implement TTL or size-based eviction for in-memory caches.
