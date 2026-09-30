---
track: crumbs-23
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2049e1ea"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-rows.tsx
  - src/components/shared/album-window.tsx
  - src/components/app/media-grid.tsx
  - src/components/ui/popup.tsx
  - src/components/app/event-settings/door-page.tsx
  - src/app/(dev)/design/gallery/specimen.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/crumbs-23

**Goal.** Build 26's red-team finds: a live pushed arrival landing without its fade, a double tap at a phone never landing inside the sheet it opened, the door menu's invite list saying it lets in whom it names, the first keystroke or click after a load never lost, and the Library's album-stream page held to its width.

## The brief

Build 26's red-team (`../partyreel-wt/_scratch/redteam-26/ledger.txt`) found these; each is fixed at its root with a test that fails on today's code where a test can hold it:

- **A live pushed arrival still fades.** `crumbs-18`'s `data-instant` shows a photograph at once only when it is complete at mount, but nothing fetches or decodes an arrival before the album pushes it, so a live arrival on the guest album mounted with `complete:false` and a 0.3 s opacity fade, against the album's `arrival=push` (only its glow fades). The marketing stage pre-decodes and there every arrival was instant. Decode an arrival before it mounts where the album pushes it (`gallery-rows.tsx`, `album-window.tsx`), so it lands complete; one that fails to decode, or takes long, still mounts and fades.
- **A double tap at 375 lands inside the sheet it opened.** The sheet fades in under the finger, so the second tap hits a row: on the hub's Settings card it opened the "This event" page (on the Share door it would land near "Save link"). A layer a tap opened takes no tap until it has settled, at the popup's one home (`ui/popup.tsx`), so every sheet holds it.
- **The door menu doesn't preview the invite list's effect.** Public's line says it lets in the person waiting; the invite list's says nothing, even when the list names her and choosing it lets her in (`crumbs-17`'s admit). Say it when it would, in the menu's own words.
- **The first keystroke or click after a page load is often lost** on the alias: the new event's name, the Guests room's Invited field, and Continue with Google. Find why (a controlled input reset at hydration, a handler attached late, a remount), and fix it at its root. `crumbs-20`'s `ClientForm` answers only a submit before hydration. Measure it on your dev server with a slowed load.
- **The Library's album-stream page scrolls sideways at 1440** (2,019 px wide, 579 px of sideways scroll): the specimen caption in `src/app/(dev)/design/gallery/specimen.tsx` (`max-w-[24ch] truncate sm:max-w-none` inside a `shrink-0` span) runs 1,089 and 1,607 px wide on that page, and the tabs' screen-reader labels spill past the specimen's clip.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- each driven on your dev server where localhost reaches it.

The signed-in hub and the guest album's live push cannot run there, so name their steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception. Never a path `crumbs-22` owns (its manifest).

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
