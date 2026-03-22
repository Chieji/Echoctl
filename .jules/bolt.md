## 2024-05-15 - [MCP Tool Loading Optimization]
**Learning:** MCP tool loading in `getAllTools` was sequential, causing linear latency growth with the number of servers. Parallelization and caching significantly reduce this.
**Action:** Always consider parallelizing independent network/IPC calls and implement caching for frequently accessed data that changes infrequently. Keep internal state encapsulation (private/protected) unless public access is strictly necessary.

## 2026-03-22 - [Git Tool Performance Optimization]
**Learning:** Sequential child process spawning for related Git operations (status, diff, add) creates significant cumulative latency. Consolidating into parallel 'Promise.all' calls or batching into single commands (like 'git add file1 file2') reduces latency from O(sum) to O(max).
**Action:** Always look for opportunities to parallelize independent shell commands or batch multiple arguments into a single process execution to minimize the overhead of process creation.
