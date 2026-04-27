# Bolt's Performance Journal

## 2025-05-15 - Isolate High-Frequency State in Large Components
**Learning:** In large page components (like `Home.tsx` with 600+ lines), high-frequency state updates (e.g., terminal simulations, timers) can cause significant performance degradation due to unnecessary re-renders of the entire tree. Hoisting static data and isolating these updates into leaf components measurably improves responsiveness.
**Action:** Always identify interactive elements with frequent state changes and encapsulate them in dedicated sub-components to minimize the re-render scope.
