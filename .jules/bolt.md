## 2026-04-28 - Isolate frequently updating state to prevent full-page re-renders

**Learning:** In the ECHOMEN Landing Page (`Home.tsx`), the CLI demo was updating state (`cliOutput`) every 100ms. Because this state was defined at the top-level `Home` component, every line added to the CLI caused the entire page (Hero, Features, FAQ, etc.) to re-render. This is a common React performance anti-pattern.

**Action:** Isolated the frequently updating state and its associated logic/JSX into a dedicated sub-component (`CliDemo.tsx`). This restricts re-renders to only the terminal portion of the page, significantly reducing the CPU load during the demo. Also hoisted static animation variants outside the component to avoid object re-creation.
