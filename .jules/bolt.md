## 2026-05-04 - Isolated State for CLI Simulation
**Learning:** High-frequency state updates (like a CLI simulation) inside a large component like `Home.tsx` cause the entire page to re-render 50+ times in a few seconds, leading to significant CPU waste and UI lag.
**Action:** Isolate high-frequency state into dedicated sub-components and hoist static constants (variants, data lists) to the module level to minimize render scope and memory allocation.
