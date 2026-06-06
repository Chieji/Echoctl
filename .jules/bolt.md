## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (e.g., 100ms interval in a CLI simulation) in a large parent component trigger full-page re-renders, impacting FPS and performance. Isolating this state into a dedicated sub-component reduces re-renders of the parent from 50+ to 0 during the interaction.
**Action:** Always check for high-frequency state updates in large page components and extract them into isolated sub-components.

## 2026-06-06 - State Isolation for UI Fragments
**Learning:** Managing UI fragment state (like a mobile menu toggle) in a large page component causes the entire page to re-render, even if the change is localized. Extracting these fragments into isolated components prevents unnecessary re-renders of the main content.
**Action:** Isolate UI-specific states (toggles, menus, form fields) into sub-components to protect the main page from redundant render cycles.
