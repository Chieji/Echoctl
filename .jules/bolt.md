## 2026-05-22 - Isolate high-frequency state to prevent full-page re-renders
**Learning:** In large React components, high-frequency state updates (like a 100ms simulation loop) trigger full-page re-renders, causing significant performance overhead and potential UI lag. Moving this state into a dedicated, memoized leaf component isolates the impact.
**Action:** Always identify components with frequent state updates and evaluate if that state can be moved to a smaller, more specialized component.
