## 2025-05-23 - Isolate high-frequency CLI demo state
**Learning:** High-frequency state updates (e.g., 100ms interval) in a large React page component (like Home.tsx) can trigger 50+ unnecessary full-page re-renders during a short interaction.
**Action:** Isolate high-frequency state updates into dedicated sub-components to ensure only relevant UI fragments are re-rendered, maintaining 60FPS on the main page.
