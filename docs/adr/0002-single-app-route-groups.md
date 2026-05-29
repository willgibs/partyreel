# ADR-0002 — Single Next.js app with route groups on one domain

- **Status:** Accepted (2026-05-28)
- **Phase:** 0

## Context

Partyreel has three audiences with different chrome and auth needs: a public
**marketing** site, an authenticated **host** app, and **guest** links opened
from a scanned QR. The growth loop depends on shared links being clean and
trustworthy — a guest who scans a QR or opens a shared album should stay on one
recognizable domain, and that surface should advertise "make your own."

Options considered: separate apps/domains (marketing site + app subdomain), or a
single app serving everything.

## Decision

**One Next.js app (App Router, `src/`) serving all three surfaces via route
groups on a single domain:**

```
src/app/
  layout.tsx     # the ONLY root layout (html/body, fonts, Providers, Toaster)
  (marketing)/   # public site
  (auth)/        # login + /auth/callback  — intentionally UNGATED
  (app)/         # host app — layout.tsx gates with getUser()
  (guest)/       # /e/[token], /a/[token] — token-addressed, mobile-first
```

- One minimal shared **root layout**; each group gets its own layout for distinct
  chrome without full reloads between groups.
- The `(app)` layout is the **single auth gate** (`getUser()` → redirect
  `/login`). It is convenience routing, **not** the security boundary (that's RLS
  / re-checks in Server Functions).
- **Login + callback live in `(auth)`, not `(app)`**, so the gate can redirect to
  `/login` without `/login` re-triggering the gate (an infinite loop).

## Consequences

- **+** Clean shared-domain links for QR/album surfaces; one deploy, one cookie
  domain, simple session handling.
- **+** Route groups give per-audience layouts while keeping a single codebase
  and shared design system.
- **−** All surfaces share one root layout and bundle baseline; keep the root
  layout minimal.
- **−** The gate-vs-public split must be respected when adding routes: anything
  requiring a logged-in host goes under `(app)`; any unauthenticated entry point
  must stay out of it.
