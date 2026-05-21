## 2025-05-22 - State Isolation for High-Frequency Updates

**Learning:** In large React components (like `Home.tsx`), local state updates triggered by high-frequency intervals (e.g., a CLI simulation updating every 100ms) cause the entire component tree to reconcile. This can lead to dozens of unnecessary re-renders of static sections (Hero, Features, FAQ), impacting performance and battery life.

**Action:** Identify sections with high-frequency state updates and isolate them into dedicated sub-components. This ensures that the frequent re-renders are scoped only to the relevant UI fragment, maintaining a stable 60FPS for the rest of the application.
