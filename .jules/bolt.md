## 2026-05-26 - Isolate High-Frequency State in Large Components
**Learning:** High-frequency state updates (e.g., 100ms intervals for a CLI simulation) in a large page component like `Home.tsx` can cause noticeable performance degradation and battery drain even if the DOM diffing is efficient, because the entire component tree is re-reconciled on every tick.
**Action:** Always isolate high-frequency or localized state into dedicated sub-components to keep the render scope as small as possible.
