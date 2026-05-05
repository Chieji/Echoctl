
## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (like a 100ms CLI simulation) in a large page component cause expensive re-renders of the entire page, including static sections and third-party components (Framer Motion, Radix UI).
**Action:** Isolate high-frequency state into dedicated sub-components and hoist static configuration (like animation variants) to the module level to minimize the render scope.
