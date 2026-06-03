## 2026-06-03 - [Component Isolation for High-Frequency State]
**Learning:** High-frequency state updates (e.g., a 100ms interval simulation) in a large parent component (Home.tsx) trigger expensive full-page re-renders. Even if the DOM diff is small, React's reconciliation of a massive component tree on every tick can cause noticeable frame drops and CPU spikes.
**Action:** Always isolate high-frequency state updates into the smallest possible leaf component. Hoist static data (like simulation steps) and animation variants to the module level to avoid re-allocation on render.
