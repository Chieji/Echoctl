## 2026-04-23 - State Isolation in Large Components
**Learning:** High-frequency state updates (e.g., 100ms interval in a terminal simulation) within a large landing page component can trigger excessive re-renders of the entire page, degrading performance.
**Action:** Isolate frequently updating state into dedicated sub-components to localize re-renders and maintain overall application responsiveness.

## 2026-04-23 - Component Unmounting in Async Loops
**Learning:** Async loops within components (like simulations) should check if the component is still mounted before updating state to avoid memory leaks or errors.
**Action:** Implement a mounting guard using `useRef` and `useEffect` cleanup to ensure safe state updates in asynchronous operations.
