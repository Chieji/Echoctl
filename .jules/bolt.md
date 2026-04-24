## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** Managed frequent state updates (100ms interval) in a large landing page component caused the entire page to re-render, leading to significant wasted work.
**Action:** Extract high-frequency state logic into dedicated sub-components to isolate re-renders and use module-level constants for static data to avoid re-allocations.
