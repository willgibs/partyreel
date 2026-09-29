---
track: crumbs-11
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "277f31a3"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/constants/reserved-slugs
  - src/lib/constants/tiers-sql.test.ts
  - src/lib/validation/event
  - supabase/migrations/20260929110000_slug_family.sql
  - src/app/(auth)/
  - src/app/(app)/layout.tsx
  - src/components/app/pricing/return-path
  - src/lib/auth/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/auth-accounts.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - supabase/migrations/20260928130000_free_shift.sql
---

# lp/crumbs-11

**Goal.** Close two gaps before launch opens signups: the reserved words refuse only whole slugs (so any account can hold `partyreel-support` or `partyreel-demo`), and a signed-out host pressing a mail's button lands on the dashboard after sign-in instead of the page the button named.

## The brief

Two security-minded fixes before launch opens signups (it is off until then, so no stranger can act on either today):

1. **The `partyreel` slug family.** `RESERVED_SLUGS` (`src/lib/constants/reserved-slugs.ts`) and `set_event_slug`'s `= any(array[...])` refuse whole slugs only. Since the free/pro shift gave Free the custom link, any account on any plan can hold `partyreel-support`, `official-partyreel` or (once the demo is renamed) `partyreel-demo`: a phishing page at a URL our own domain vouches for.
   - Refuse any slug containing `partyreel`, in both the app's validation (`src/lib/validation/event.ts`) and the SQL setter, with the parity `tiers-sql.test.ts` holds.
   - Consider the obvious look-alikes (a digit for a letter, `party-reel`) and say which you took.
   - The migration restates `set_event_slug` from its newest definition (`20260928130000_free_shift.sql`), with drift md5s and a rolled-back proof at its foot. The Orchestrator applies it.
   - Read the live `events.custom_slug` column first. A live slug the new rule would refuse is grandfathered or named in your Handoff, never silently broken.
2. **A mail's button through sign-in.** A signed-out host pressing a mail's button (Renew Event Pass to `/account/renew`, Manage storage to `/dashboard`) lands on the dashboard after sign-in, not the button's page: `/login` takes no return path, and the `(app)` gate redirects bare.
   - Carry a return path through the gate, `/login`, both sign-in methods (Google OAuth through `/auth/callback`, and the email code) and back.
   - Validate it against an allow-list of same-origin app paths: the checkout's `src/components/app/pricing/return-path.ts` is the shape to reuse; move it to `src/lib/auth/` if it becomes shared.
   - It must never become an open redirect: no scheme, no `//`, no backslash tricks, no encoded escapes. Pin each refusal with a test.
   - Doc-check Supabase's `signInWithOAuth` `redirectTo` and this Next.js's redirect APIs first (`node_modules/next/dist/docs/`).

**Paths:** `crumbs-10` runs beside you, and none of its paths are yours. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for the slug rule on both sides, and for every open-redirect refusal.
- The rolled-back SQL proof.
- The gate's redirect, carrying its path, under `next start`.
- Sign-in itself is allow-listed and cannot run on localhost, so name exactly what the alias red-team walks: a signed-out Renew link and a Manage storage link, each through the account chooser, landing where they point.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
