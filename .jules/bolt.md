## 2025-05-14 - Isolate CLI demo state to prevent full-page re-renders
**Learning:** High-frequency state updates (e.g., 100ms interval in a simulation) in a large parent component (Home.tsx, 600+ lines) trigger full-page re-renders, causing significant performance overhead and potential jank.
**Action:** Isolate frequently updating state into dedicated sub-components to localize re-renders and maintain overall application performance.
