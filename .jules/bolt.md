## 2025-05-15 - Isolate High-Frequency State Updates
**Learning:** In large React page components (like `Home.tsx`), hosting high-frequency state updates (e.g., a 100ms interval simulation) triggers a full-page re-render for every tick. This is extremely inefficient as the component grows.
**Action:** Always isolate interactive simulations or frequently updating UI fragments into dedicated sub-components. This "lifts state down," ensuring that React's reconciliation only touches the relevant fragment, keeping the rest of the page stable and performant.
