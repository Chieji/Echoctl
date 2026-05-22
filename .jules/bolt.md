## 2025-05-15 - Isolate High-Frequency State in Large React Components
**Learning:** High-frequency state updates (e.g., 100ms intervals in a CLI simulation) in a large parent component (Home.tsx, 600+ lines) trigger full-page re-renders, causing significant performance degradation and potential jank.
**Action:** Always isolate high-frequency state and its associated logic into dedicated, smaller sub-components to localize re-renders and maintain 60FPS in the rest of the application.
