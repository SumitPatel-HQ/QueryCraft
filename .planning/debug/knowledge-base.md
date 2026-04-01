# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## signout-loading-forever — Sign out shows infinite loading instead of redirecting
- **Date:** 2026-04-01T00:05:00Z
- **Error patterns:** Loading user information, sign out, redirect, authentication
- **Root cause:** Settings page called signOut() without redirecting, keeping user on protected route with null user state, causing infinite "Loading user information" display
- **Fix:** Added router.push("/") after signOut call in Settings page, matching the Navigation component pattern
- **Files changed:** frontend/src/app/dashboard/settings/page.tsx
---
