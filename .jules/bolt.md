## 2025-05-14 - Isolate high-frequency state updates in large components
**Learning:** High-frequency state updates (e.g., 100ms timers or simulation logs) in a large landing page component (Home.tsx) trigger expensive full-page re-renders, causing significant VDOM overhead even if only a small UI fragment changes.
**Action:** Extract high-frequency state logic into dedicated leaf components to ensure re-renders are isolated to the smallest possible sub-tree.
