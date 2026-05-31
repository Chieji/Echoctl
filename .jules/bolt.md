## 2025-05-15 - State Isolation for High-Frequency Updates
**Learning:** High-frequency state updates (e.g., 100ms intervals for a CLI simulation) in a large page component like `Home.tsx` trigger expensive full-page re-renders. In this codebase, the CLI demo was causing 50+ unnecessary re-renders of the entire landing page.
**Action:** Isolate high-frequency simulation state into a dedicated sub-component (e.g., `CliDemo.tsx`). This restricts re-renders to the small UI fragment being updated, significantly improving main-thread availability and responsiveness for the rest of the application.
