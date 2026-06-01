## 2025-05-14 - Isolate high-frequency state updates
**Learning:** High-frequency state updates (e.g., 100ms interval simulations) in a large React page component like Home.tsx can trigger 50+ unnecessary full-page re-renders, impacting performance.
**Action:** Isolate simulation state and logic into dedicated sub-components (e.g., CliDemo.tsx) to ensure high-frequency updates only affect the relevant UI fragment.
