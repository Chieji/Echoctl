
## 2026-03-22 - [Git Tool Performance & CI Fix]
**Learning:** Consolidating sequential shell commands into 'Promise.all' or batching arguments (like 'git add file1 file2') drastically reduces overhead from process spawning. Also discovered that CI can fail if 'package-lock.json' is out of sync or if required utility files (like 'BDIHaltingGuards.ts') are missing from the source tree.
**Action:** Always verify local builds and 'package-lock.json' consistency before submission. Ensure all referenced local modules are actually present in the 'src' directory.

## 2026-03-23 - [Semantic Memory Optimization & SharedArrayBuffer Fix]
**Learning:** Normalizing vectors to unit length at ingestion/load time allows replacing expensive cosine similarity (Math.sqrt/divisions) with high-performance dot product. Caching embeddings in-memory eliminates redundant API calls during sessions. Also, 'SharedArrayBuffer' errors (TS2345) in this environment require wrapping Node.js 'Buffer' objects with 'new Uint8Array()' when calling 'fs/promises' methods.
**Action:** Use pre-normalization for vector operations. Wrap Buffers with Uint8Array for file operations in this specific Node.js environment.
