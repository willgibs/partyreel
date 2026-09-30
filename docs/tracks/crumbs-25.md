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
  # added by the lane, each with its reason:
  - src/app/(guest)/e/[token]/not-found.lazy.tsx     # (new) the guest link's 404: its one client boundary, as app/not-found.lazy.tsx is the root's
  - src/app/(guest)/e/[token]/not-found.screen.tsx   # (new) the screen that was the file's body, loaded only through the boundary
  - src/app/(marketing)/(cinema)/not-found.lazy.tsx    # (new) the cinema group's boundary
  - src/app/(marketing)/(cinema)/not-found.screen.tsx  # (new) the cinema group's screen
  - src/app/not-found.test.ts                        # perf-404's eager-import walk, widened to every group 404 (its walker lives here)
  - src/app/group-not-found.lazy.test.tsx            # (new) each group's 404 draws through its boundary, whole
  - src/lib/adopt-typed-value-policy.test.ts         # (new) the policy: a text field adopts early typing or says why it need not
  - src/app/reduced-motion-guard.test.ts             # (new) the guard's shape: it clamps what declares a transition and creates none
  - src/components/app/host-media-grid.test.tsx      # (new) the host album holds a live arrival at the door
  - src/components/app/event-uploads.tsx             # the hub hands the grid the way to ask for a held arrival's link (`onNeedLinks`)
  - src/components/shared/use-arrival-gate.ts        # (moved from components/guest/: two surfaces, one gate)
  - src/components/shared/use-arrival-gate.test.tsx  # (moved with it)
  - src/components/guest/use-arrival-gate.ts         # the move's other half (deleted)
  - src/components/guest/use-arrival-gate.test.tsx   # the move's other half (deleted)
  - src/components/guest/gallery-rows.tsx            # its one import path
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

Each is built as recommended and is Will's to overrule.

1. **How does a group's 404 come off its group's pages?** **Recommended, built: the root's shape, per group.** The group's `not-found.tsx` keeps its metadata and renders one reference into a client module beside it (`not-found.lazy.tsx`, `next/dynamic`, a real split, SSR on), the screen moves to `not-found.screen.tsx`, and `not-found.test.ts` refuses a component, a client island or a stylesheet among a group 404's eager imports, as it does the root's. The alternative, one boundary file shared by every group, would put each group's screen in every page's shared chunk.
2. **Does the typing rule cover the design lab, and every text field?** **Recommended, built: yes, all of `src/`.** A policy test (`adopt-typed-value-policy.test.ts`) reads the JSX: a text-like `<input>` or a `<textarea>` adopts through the hook or is listed with why it need not (a honeypot nobody types in, a palette that mounts on a press, so its DOM is written from its state); the fields that are drawn open on the server and were bare (the Library's search and its sidebar filter, the specimen knobs, the reel harness's seed, the desk's notes) move onto the hook.
3. **Does the host's album hold an arrival at the door as the guest's does?** **Recommended, built: yes, the same gate, the same numbers** (2 s at most, 12 at once, never the seed, never under reduced motion), and the gate moves to `components/shared/` since two surfaces now read it. The host's own upload is an arrival to her album as it was (it glowed before): no sweep is added.
4. **How does the reduced-motion guard stop making measured sizes stale?** **Recommended, built: the guard stops creating transitions nobody declared**, rather than naming a property list (which would override a declared `height` or `width` transition and starve its `transitionend`) or exempting each measurer (which leaves the next one to be found by a bug). The unimportant `transition-property: none` default under reduced motion, in the base layer, leaves every declared transition clamped to `0.01ms` as before (its `transitionend` still fires) and turns the undeclared `all` into none; the lab's own exemption in `design.css`, a patch for the same cause, goes when it is proven redundant.

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
