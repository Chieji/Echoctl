## 2025-04-26 - [Component State Isolation]
**Learning:** High-frequency state updates (e.g., simulations, timers) in a large parent component cause expensive re-renders of the entire subtree. Moving state down to the smallest possible child component isolates these updates and significantly improves performance.
**Action:** Always identify high-frequency state and encapsulate it in a dedicated sub-component to minimize re-render impact on large pages.

## 2025-04-26 - [Build Artifacts and Global Formatting]
**Learning:** Running global formatting or build commands can modify thousands of lines in minified assets or auto-generated files. Including these in a PR creates massive, unreviewable noise and violates "small change" constraints.
**Action:** Use `git status` and `git restore` religiously to ensure that ONLY the intended source files are modified and staged for commit. Avoid global `prettier --write .` if it touches `dist` or `node_modules`.
