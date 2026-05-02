## 2026-05-02 - Isolate high-frequency state to dedicated sub-components
**Learning:** High-frequency state updates (like a CLI terminal simulation) in a large parent component cause expensive re-renders of the entire tree. Even if the actual DOM changes are small, React's reconciliation process for the whole page can be costly.
**Action:** Isolate high-frequency state and its associated logic into dedicated sub-components to limit the re-render scope. Hoist static data and configuration objects (like animation variants) to the module level to avoid recreation on every render.
