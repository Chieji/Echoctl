# Unused Scaffolding / Dead Code

> This document identifies template/scaffold code that is **not currently referenced**
> by the active application surface (`App.tsx`, `Home.tsx`, routes). These files are
> retained intentionally for potential future use but should NOT be considered part of
> the production feature set.

## Files

| File | Purpose | Status |
|------|---------|--------|
| `client/src/components/Map.tsx` | Google Maps integration component | NOT IMPORTED — Manus template leftover |
| `client/src/components/ManusDialog.tsx` | OAuth login dialog UI | NOT IMPORTED — Manus template leftover |
| `client/src/const.ts` → `getLoginUrl()` | OAuth/PKCE login URL builder | NOT CALLED — references `VITE_OAUTH_PORTAL_URL` / `VITE_APP_ID` |
| `__manus__/debug-collector.js` | Browser debug log collector script | Dev-only (injected only when `NODE_ENV !== "production"`) |
| `vite.config.ts` → `vitePluginStorageProxy` | Signed-URL proxy via Forge API | Dev-only (now guarded with production check) |

## Recommendations

- If these features are planned for future releases, leave them in place but do not
  expose their endpoints/routes in production builds.
- If they are confirmed unnecessary, remove them to reduce bundle size and attack surface.
- The `getLoginUrl()` export in `const.ts` and `ManusDialog.tsx` together form an OAuth
  flow that is currently non-functional (no `VITE_OAUTH_PORTAL_URL` configured).

## Security Notes

- `vitePluginStorageProxy` previously had no production guard — now fixed (returns early
  if `NODE_ENV === "production"`).
- `Map.tsx` references `VITE_FRONTEND_FORGE_API_KEY` which, if set, would be bundled
  into client-side code. Ensure this variable is never set in production `.env` files
  unless the Maps feature is intentionally enabled.
