## 2025-05-14 - Isolate High-Frequency State Updates

**Learning:** High-frequency state updates (e.g., 100ms intervals for a CLI simulation) in a large page component like `Home.tsx` trigger unnecessary full-page re-renders. This is particularly expensive when the page contains many complex sub-components and Framer Motion animations.

**Action:** Isolate high-frequency state and its associated logic into a dedicated, small sub-component (e.g., `CliDemo.tsx`). This restricts re-renders to only the affected UI segment, significantly improving overall frame rate and responsiveness during the simulation. Always hoist static objects like animation variants to the module level to avoid redundant object creation.
