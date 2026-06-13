## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (e.g., 100ms interval in a CLI simulation) in a large parent component trigger full-page re-renders, impacting FPS and performance. Isolating this state into a dedicated sub-component reduces re-renders of the parent from 50+ to 0 during the interaction.
**Action:** Always check for high-frequency state updates in large page components and extract them into isolated sub-components.

## 2026-04-24 - Root Page State Bloat
**Learning:** Placing global UI state (like mobile menu toggle or theme selection) in the root page component (e.g., Home.tsx) causes the entire page tree to re-render on every interaction, even if the rest of the content is static.
**Action:** Isolate UI-specific state into dedicated leaf or shell components (like Header.tsx) to keep root component renders to a minimum.
