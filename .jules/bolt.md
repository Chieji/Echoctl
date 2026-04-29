## 2026-04-29 - Landing Page Re-render Bottleneck
**Learning:** High-frequency state updates in a large component (like the CLI demo simulation) trigger expensive reconciliation for the entire page, even if only a tiny part changes.
**Action:** Isolate high-frequency animations and simulations into dedicated sub-components and hoist static constants (variants, data lists) to the module level to minimize re-renders and memory churn.
