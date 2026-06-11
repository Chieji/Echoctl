## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (e.g., 100ms interval in a CLI simulation) in a large parent component trigger full-page re-renders, impacting FPS and performance. Isolating this state into a dedicated sub-component reduces re-renders of the parent from 50+ to 0 during the interaction.
**Action:** Always check for high-frequency state updates in large page components and extract them into isolated sub-components.

## 2026-04-24 - Performance Gains from State Isolation and Data Hoisting
**Learning:** Isolating UI-only state (like mobile menu toggles and theme switching) into a dedicated `Header` component prevents the entire page from re-rendering during these frequent interactions. Additionally, hoisting static animation variants and data lists outside the component prevents redundant object allocation on every render.
**Action:** Isolate global UI state from content-heavy pages and hoist static configurations to module level.
