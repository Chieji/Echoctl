## 2026-04-23 - State Isolation for High-Frequency Updates

**Learning:** In large React pages (like landing pages), high-frequency state updates (e.g., CLI simulations, timers, or live data feeds) can cause significant performance degradation if kept at the page level, as they trigger re-renders of the entire component tree.

**Action:** Isolate high-frequency state and logic into dedicated leaf components. This ensures that only the relevant part of the UI re-renders, keeping the rest of the page static and responsive. Always hoist static objects like Framer Motion variants outside of the component body to avoid unnecessary re-allocations on every render.
