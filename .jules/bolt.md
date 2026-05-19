## 2026-05-22 - [Isolate High-Frequency State]
**Learning:** High-frequency state updates (like a 100ms interval CLI simulation) in a large page component like `Home.tsx` cause the entire page to re-render, including heavy SVG icons and complex UI sections. This resulted in 53 full-page re-renders for a single simulation run.
**Action:** Always isolate high-frequency state updates into dedicated sub-components. Hoist static objects like animation variants outside the component to avoid re-allocation.
