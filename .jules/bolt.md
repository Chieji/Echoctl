## 2026-05-01 - Isolate high-frequency state updates
**Learning:** High-frequency state updates (like a 100ms CLI simulation) in a large parent component cause expensive re-renders of the entire page, including static sections and complex animations.
**Action:** Isolate such updates into dedicated leaf components and use mounting guards to safely handle asynchronous state updates after unmount.
