## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (e.g., 100ms interval in a CLI simulation) in a large parent component trigger full-page re-renders, impacting FPS and performance. Isolating this state into a dedicated sub-component reduces re-renders of the parent from 50+ to 0 during the interaction.
**Action:** Always check for high-frequency state updates in large page components and extract them into isolated sub-components.

## 2026-04-24 - Surgical Refactoring of Large Components
**Learning:** Overwriting large components (e.g., Home.tsx) with `write_file` risks deleting elided features (literal '...') or complex logic like clipboard handling. Using `replace_with_git_merge_diff` ensures optimizations are applied without regressions.
**Action:** Prefer surgical diffs over full-file overwrites for refactoring large, feature-rich components.
