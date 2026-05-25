## 2026-04-23 - State Colocation for Performance
**Learning:** High-frequency state updates (e.g., 100ms interval) in a large React page component can trigger excessive re-renders of the entire page, impacting performance and frame rate.
**Action:** Isolate high-frequency state updates into dedicated sub-components. This ensures that only the relevant part of the UI re-renders, keeping the rest of the page static and efficient.
