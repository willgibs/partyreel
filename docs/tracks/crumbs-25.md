---
track: crumbs-25
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "07eec9ba"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/(marketing)/(cinema)/not-found.tsx
  - src/components/app/host-media-grid.tsx
  - src/lib/adopt-typed-value.ts
  - src/app/globals.css
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/crumbs-25

**Goal.** Four follow-ups from the latest lanes: the group 404s off their groups' pages, early typing kept in every field a person lands on, the host album's live arrival landing decoded, and the reduced-motion guard never making a measured size stale.

## The brief

Four items the latest lanes deferred (ROADMAP's lines), each fixed at its root with a test that fails on today's code where a test can hold it:

- **The group 404s ride their groups' pages**, as the root's did before `perf-404`. The guest link's own 404 (`src/app/(guest)/e/[token]/not-found.tsx`) costs every album load about 17.5 KB of HTML (6 KB gzipped, most of it `GuestBar`'s wordmark path), and the `(cinema)` one about 5 KB (1 KB gzipped) on every cinema page. `perf-404` measured both on `next start` against each drawing nothing. Give each the root's shape: one client boundary, as `app/not-found.site.tsx` is. Measure before and after, and keep each 404 drawn exactly as today.
- **Early typing kept everywhere a person lands and types at once.** About 32 files draw a bare `<input>`, and any that is controlled and drawn open on the server loses text typed before hydration, which `Input` and `Textarea` no longer do (`crumbs-23`). Route them through `useAdoptTypedValue` (`src/lib/adopt-typed-value.ts`), starting with the pages a person lands on and types into at once, and hold the rule with a policy test.
- **The host album's live arrival** still lands the way the guest's did before `crumbs-23`'s `use-arrival-gate.ts`: no link at push, so a shimmer and a fade. Put the same gate over `HostMediaGrid`, and fold `useArrivedIds` onto `useArrivalMarks`.
- **The reduced-motion guard.** In `globals.css` it sets `transition-duration: 0.01ms !important` on every element and leaves `transition-property` at `all`, so every script-written style becomes a transition, and a size read in the same task as its write is the old one. The lab's whole stage exempts its own boxes (`design.css`, `lab-focus`). A production measurer that writes then reads (the masonry, the lightbox's settle) may read stale sizes. Name the properties the guard covers, or exempt what measures, and prove a measurer reads the new size under reduced motion.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- the 404s and the fields driven in a browser on your dev server, with the numbers on `next start`.

The signed-in host album cannot run on localhost, so name its steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start (the fields you move onto the hook, a measurer you fix): add each to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
