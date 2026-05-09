## 2026-04-23 - State Isolation in Large Components

**Learning:** High-frequency state updates (e.g., 100ms interval for a CLI simulation) in a large React page component can trigger dozens of unnecessary full-page re-renders, causing significant CPU overhead and potential frame drops. Isolating such state into a small, dedicated sub-component reduces the re-render scope to only the necessary part of the DOM.

**Action:** Always identify high-frequency state updates and isolate them into leaf components. Implement mounting guards (via `useRef` and `useEffect` cleanup) for any asynchronous loops within these components to prevent memory leaks and state updates on unmounted components.
