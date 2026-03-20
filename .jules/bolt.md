## 2024-05-15 - [MCP Tool Loading Optimization]
**Learning:** MCP tool loading in `getAllTools` was sequential, causing linear latency growth with the number of servers. Parallelization and caching significantly reduce this.
**Action:** Always consider parallelizing independent network/IPC calls and implement caching for frequently accessed data that changes infrequently. Keep internal state encapsulation (private/protected) unless public access is strictly necessary.
