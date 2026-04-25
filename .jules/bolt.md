## 2025-05-14 - [Optimize CLI Demo by isolating frequent state updates]
**Learning:** In large React components, high-frequency state updates (e.g., simulations updating every 100ms) trigger expensive full-tree re-renders if not isolated. "Pushing state down" to a dedicated sub-component is a simple and effective way to restrict the scope of re-renders.
**Action:** Always identify parts of the UI with frequent updates and consider extracting them into standalone components to prevent unnecessary parent re-renders.
