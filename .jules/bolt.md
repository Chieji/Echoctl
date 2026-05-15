## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (e.g., 100ms interval simulation) in a large page component like Home.tsx trigger full-page re-renders, causing significant performance overhead and potential frame drops.
**Action:** Isolate high-frequency simulation state into dedicated sub-components to restrict re-renders to only the relevant UI fragments.
