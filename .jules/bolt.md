## 2026-05-17 - Component Isolation for High-Frequency State
**Learning:** High-frequency state updates (100ms interval) in a large page component like Home.tsx (600+ lines) trigger expensive full-page re-renders. Isolating this state into a dedicated sub-component (CliDemo.tsx) prevents unnecessary re-renders of the rest of the page, maintaining 60FPS during simulations.
**Action:** Always identify high-frequency state updates and isolate them into the smallest possible component scope to minimize render impact.
