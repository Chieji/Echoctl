## 2026-04-23 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (e.g., a 100ms simulation loop) in a large parent component cause expensive full-page re-renders, even if the updated state is only used in a small UI fragment. React's diffing still runs for the entire tree.
**Action:** Always isolate high-frequency state into dedicated sub-components ("pushing state down") to localize re-renders and maintain 60FPS.
