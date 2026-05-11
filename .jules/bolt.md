## 2025-05-15 - [High-frequency state isolation]
**Learning:** High-frequency state updates (e.g., 100ms intervals for simulations) in large page components (like Home.tsx) trigger expensive full-page re-renders, impacting performance significantly.
**Action:** Always isolate high-frequency state updates into dedicated sub-components to localize re-renders and maintain 60FPS.
