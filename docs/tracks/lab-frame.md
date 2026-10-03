---
track: lab-frame
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4ff5c0ab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/frame
  - src/components/lab/portal-container
  - src/lib/use-media-query
  - src/components/lab/frame-window
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/PROGRAM.md
  - docs/systems/design-system.md
  - src/components/ui/popup.tsx
  - src/components/ui/sheet.tsx
  - src/app/(dev)/design/sandbox/identity/scene/page.tsx
---

# lp/lab-frame

**Goal.** Make the lab's portalled Frame a faithful window for production's own components: a frame-scoped window the media hooks read, Radix layers that live inside the frame (their popper wrapper, scroll lock and focus guards), and the glow filter host, so a board can mount production's layers at any width without quoting them.

## The brief

**Why.** Five ROADMAP lines ("The lab and the kit", quoted there) describe one fault: a board's portalled `Frame` is not a window of its own.
- A production hook that reads the window (`useMediaQuery`, `matchMedia`) inside a frame reads the LAB's window, so a frame at 375 draws a component's desk branch (event-ready had to quote Settings for it; identity solved it with a scene route of its own, `sandbox/identity/scene/page.tsx`, a document per frame).
- Radix in a frame reads the lab's window and document: a popper's wrapper takes `z-index: auto` (a menu mounted open paints under the page beside it, host-dashboard r2 repaired its own frames in `shell.tsx`), a Dialog's Title check warns falsely, and an open layer locks the LAB's page scroll and puts its two focus guards in the lab's body.
- A frame carries no glow filter host (`GlowFilter` mounts once, in the root layout), so a board cannot draw production's `Glow`, `SectionLight` or `ScreenLamp`.

**Do:** a frame-scoped window that production's media hooks read when they render inside a frame (a context the Frame provides, read by `src/lib/use-media-query.ts`; the product's behaviour outside the lab byte for byte unchanged, pinned), Radix's popper wrapper, scroll lock and focus guards kept inside the frame, and a glow filter host mounted per frame. Change nothing under `src/components/ui/` (identity's board styles those atoms and sits on Will's desk now): the fix lives in the lab's Frame and the hooks. Prove each with a test that is red on today's Frame (a frame at 375 answering a phone's media query; a menu painting above the page beside it; the lab's body scroll untouched with a frame's layer open; a Glow drawn in a frame). Then say which boards' quotes this frees (the ROADMAP's line on boards that quote a Radix layer) without changing any board: each board moves on to production's own layers in its own next round.

**Boundaries.** No board folder (`src/app/(dev)/design/sandbox/`) is yours; the lab's shell beyond the Frame only where the frame's context must be provided. The bible (`src/app/(dev)/design/rules/`) is the Orchestrator's.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --all --base http://localhost:3131` and `pnpm lab:demo --base http://localhost:3131` on every board (the whole lab, since the Frame is under every board); the four faults reproduced before and gone after in a headless Chrome of your own at 375 and 1440.

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
