---
track: crumbs-55
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8c2dce39"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/security-headers
  - src/lib/dashboard/next-step
  - src/app/(dev)/design/(shell)/library/foundations/
  - src/app/(marketing)/(cinema)/about/page.tsx
  - src/components/marketing/legal/legal-document.tsx
  - src/components/marketing/sections/how-it-works/host-pictures.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - src/lib/event/sections.ts
  - src/app/(as-guest)/
  - src/components/app/share/
  - src/components/app/create-event-wizard/
  - docs/systems/design-system.md
---

# lp/crumbs-55

**Goal.** Four crumbs from tonight's merges: the app refuses any other site's frame (clickjacking), the dashboard's next-step chip links its room directly, the brand kit names the five grounds and the new tokens, and How it works' Create picture draws the room.

## The brief

**Why.** Tonight's merges (round 13's `rooms-wiring`, `identity-wiring`, `wizard-wiring`) left these crumbs, each a ROADMAP line:
1. **Security** (from `rooms-wiring`): the app answers any site's frame (no `frame-ancestors`, no `X-Frame-Options`), so a page can be clickjacked. Add `Content-Security-Policy: frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` to every response through `next.config.ts`'s `headers()` (a root file no manifest may own: it is accepted outside your owns, for this alone), beside what it already sends (read it first; keep every existing header). See it as a guest (`/dashboard/<id>/as-guest`, `src/app/(as-guest)/`) frames the app's own pages and must keep working, so check how it draws before choosing. A test pins both headers on a page, an API route and the as-guest frame. Check the admin project too (same repo, its own config?): name what it sends in your Handoff.
2. **The dashboard's next-step chip** (from `rooms-wiring`): `lib/dashboard/next-step.ts` still links `/guests#at-the-door`, answered by the route's redirect. Link the room directly with `sections.ts`'s `roomHref`, the hop gone.
3. **The brand kit** (from `identity-wiring`): the Library's foundations list four grounds and no `--signal` or `--display*`. Add the fifth ground (`.surface-display`) and the new tokens, as `globals.css` now has them. Two comments still name the old room's `#040405` (`about/page.tsx`, `legal-document.tsx`): make them true, comments only (the legal text itself is never edited before launch).
4. **How it works' Create picture** (from `wizard-wiring`): `host-pictures.tsx`'s `CreatePicture` still draws a Details, Design, Share rail Create has not had since first-event. Draw the room as `create-event-wizard/` now has it: steppers on top, the question in one place, the answer in the centre, one button at the foot.

Retire the four ROADMAP lines in your Handoff (the Orchestrator deletes them). Red first where a test can hold it.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3131`; a `curl -sI` of your dev server's home, an API route and the as-guest page showing both headers; How it works' picture captured at 1440 and 375 in your Handoff.

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

## Where I am

- Booted in `partyreel-wt/crumbs-55` on `lp/crumbs-55` (cut `ed7b480d`), dev port 3131, scratch `partyreel-wt/_scratch/crumbs-55/`.
- DONE and green (typecheck, lint, test 827 files / 9751 tests, each its own exit 0): all four crumbs in code. 1: `src/lib/security-headers.ts` is the one home of the set and `next.config.ts` imports it; its test reads every page and route handler under `src/app` through Next's own path-to-regexp; live proof done on 3131 (curl of home, an API route, the as-guest redirect, a proxy 404 and the admin surface; a cross-origin frame refused and a same-origin one kept in the Browser pane; the deployed admin host sends the same four headers today). 2: `next-step.ts` links `roomHref(id, "guests")`. 3: the brand kit's Grounds and The display groups plus Signal (`foundations/ground-list.ts` held against `globals.css` by its test); the two `#040405` comments now say `#020202`. 4: `CreatePicture` is the room's look screen on `.surface-ink`; three quote pins added to `mock-parity.test.ts` (an exception outside `owns`, additive data). The `architecture.md` bullet is written.
- NOT DONE: `pnpm build` (through the lock), `lab:smoke` on 3131, final 1440 and 375 captures of the picture (the island tweak landed after the first 1440 one), the Handoff (lane check, the four ROADMAP lines to retire, findings below).
- Findings for the Handoff: `src/app/(app)/dashboard/new/page.tsx` and its test still set `themeColor: "#040405"` (the old room; the room's sRGB is `#020202`, verified by conversion), not mine; `src/lib/constants/how-it-works.ts` header still says the "Design step"; `NextStep`'s `label`/`short`/`href` have no reader but the tests (`attention.ts` reads only `kind`); the Elevation legend's menu (`foundations/elevation-legend.tsx`) is still the body's popover, the real menus are the display.
