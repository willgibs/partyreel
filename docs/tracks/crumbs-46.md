---
track: crumbs-46
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/me/
  - src/app/(app)/me/
  - src/app/(guest)/u/[slug]/
  - src/components/app/user-menu
  - src/components/app/dashboard/page-invite-card
  - src/lib/admin/reports.ts
  - src/lib/admin/reports.test.ts
  - src/components/marketing/sections/pricing/comparison-table
  - src/components/app/event-card.tsx
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - src/components/marketing/system/
---

# lp/crumbs-46

**Goal.** Four ROADMAP crumbs on surfaces nothing else touches tonight: /me for an account without a handle (Will's answer A), the closed strike line's repeated date, /pricing's sticky plan head at 1024 and up, and event-card's Open/Closed comment.

## The brief

Each item is a ROADMAP Now line. Read it there whole and retire it in your Handoff's list.

1. **`/me`** (ROADMAP: "Profile: `/me`, the owner mode at an address that needs no handle", Will's answer A to crumbs-44's question, 2026-10-01). A confirmed account without a handle keeps its likes and uploads at `/me`: `OwnerSections` takes no identity, so it is private by construction. `/me` redirects to `/u/<handle>` once a handle exists, and the user menu's handle-less "Your profile" opens it. `components/app/dashboard/page-invite-card.tsx:62` points at the same setup today: decide whether it moves too, and say so.
2. **The closed strike line's repeated date** (ROADMAP: "a dismissed child-abuse report's closed line says one date twice"), in `src/lib/admin/reports.ts`'s `closedStrikeWords`, red on today's code first.
3. **`/pricing` at 1024 and up** (ROADMAP: "when the header hides on scroll, the matrix's sticky plan head stays 64 px down"), in `components/marketing/sections/pricing/comparison-table.tsx`. The head should follow the header.
4. **`event-card.tsx:119`** documents `statusLabel` as "Open/Closed (hosted)"; the word is Open or Paused since crumbs-42 (`uploadsLabel`).

A board cut after your merge draws the dashboard (`page-invite-card`, `event-card`), so leave those screens as they look, beyond what each item needs.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3134`; a test red on the old code for items 1 and 2; /pricing read at 1024 and 1440 with the header hidden and shown, in a headless Chrome of your own; name /me's signed-in walk for build 40's red-team.

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
