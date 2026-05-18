## 2025-05-14 - Isolate high-frequency state to prevent full-page re-renders
**Learning:** High-frequency state updates (e.g., 100ms intervals in a simulation) within a large page component (like Home.tsx) trigger unnecessary re-renders of the entire component tree, including static sections and complex icons.
**Action:** Always isolate high-frequency state and side effects into dedicated leaf components. This ensures React's reconciliation only impacts the relevant UI fragment, keeping the rest of the page performant.
