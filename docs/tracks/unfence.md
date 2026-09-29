---
track: unfence
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "09c1b56f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/components/lab/board-spec.ts
  - scripts/lab-smoke.mjs
  - src/components/lab/catalog.tsx
  - src/components/lab/before-after.tsx
  - src/app/(dev)/design/(shell)/library/foundations/type-ladder.tsx
  - src/app/(dev)/design/(shell)/library/foundations/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/marketing/gallery-demos.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/dropdown-menu.test.tsx
  - src/components/ui/floating-layer.ts
  - src/lib/constants/marketing-voice.ts
  - docs/systems/design-system.md
  - src/lib/type-ladder-policy.test.ts
  - src/lib/content-policy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PROGRAM.md
  - src/app/(dev)/design/rules/bible.ts
  - docs/reviews/README.md
---

# lp/unfence

**Goal.** Turn every note Will gave one board that hardened into a program-wide law back into guidance with its reason in its one home, removing the one runtime fence that blocks nothing real, keeping every test that also catches a real bug, and proposing (never editing) the bible's lines.

## The brief

**Why** (Will, 2026-09-29). Notes he gave ONE board kept hardening into program-wide laws: the lab merged three brand-voice notes into every board for twelve days (fixed by `window-notes`, merged at `7bc9d418`), and its lane's read-only audit found the same shape across the program (`git show 7bc9d418^2:docs/tracks/window-notes.md`, "The audit", items 1 to 18). His principles are the lens: nothing is protected at any age; a pick is the best of what was drawn, never a rule; design and past decisions are guidance with their reason, never law; a note binds only what it was given on; his exact words stay only where the wording is the point. The Advisor has weighed each item; its dispositions are your starting point, yours to improve with evidence.

**The dispositions:**
- `docs/PROGRAM.md`'s round rules (about lines 86-99; the doc is the Orchestrator's, so write each reworded line word for word in your Handoff and he applies them at your record): 1 "never force options apart", 3 "answer a relative note against a reference" and 5 "offer the fix at its source" stay as guidance with their reasons, "never" dropped; 4 gets its condition back ("a board that is not about the words judges its placeholder for size and wrapping; the words are the voice's", since `marketing-voice.ts` is now the voice's home).
- Item 2 (a review on record before round 2, `registry.test.ts:328-381`) is the program's own loop, not a hardened note: the test stays; reword its header to the rule and its reason, not the long quote.
- Item 7, `LIMITS.readingWords` (`board-spec.ts`, measured by `lab-smoke.mjs`): already a default with an escape (`reading: { words, why }`); reword both headers so the number is the kit's and his "PhD" note only named the failure. Item 8 (`lab-demo.mjs`) is a bug-catcher: leave it.
- Item 9 (`registry.test.ts:498-512`'s "None of these", `catalog.tsx:29-35`, `before-after.tsx`): guidance; turn "THE SHAPE IS WILL'S BRIEF, VERBATIM" into its reason.
- Item 14, `src/lib/constants/marketing-voice.ts`, comments only: "That ORDER is the rule every subhead takes" becomes the reference a new subhead is graded against, keeping his sentence on why it works; the empty-state voice keeps its reason; "VIDEO FIRST" becomes his ranking of the four siblings, enforced by nothing.
- Item 15, the Aurora on a light ground: the CSS fence in `globals.css` STAYS (a measured rendering reason: a media-less lamp paints the dark register on white); move only the wording from "never" to "not yet, and why" (`design-system.md` about 180-182, `library/foundations/gallery-demos.tsx:20-23`, `library/marketing/gallery-demos.tsx:231-237`), pointing at its ROADMAP line (the app's light mode). The halo "never a button" (`foundations/gallery-demos.tsx:188-193`): guidance, reason not quote.
- Item 16: `src/components/ui/dropdown-menu.tsx`'s third-level throw GOES (production nests one level, `user-menu.tsx`; refusing blocks nothing real): reshape `dropdown-menu.test.tsx` to drop the throw's assertion with its scar and expired reason, KEEP the sub-menu's portal test, and leave a comment that two levels read simpler and a third branch flattens into a named group. `design-system.md` about 307 and 447 claims the floating layer "refuses a backdrop filter", which the code never did (`floating-layer.ts` is a comment; its test never mentions one): say instead that it carries none until the Glass exploration (ROADMAP's line).
- Item 17, one heading weight: the TEST STAYS (`type-ladder-policy.test.ts` guard 3 catches a real trap: `font-heading font-medium` paints 500 because the custom utility is emitted ahead of the stock weights, and shadcn's generator writes a weight onto every title); lead its header and `design-system.md` about 213-215 and `type-ladder.tsx:41-45` with the trap, and state 700 as the current preference with its escape (a heading that should weigh otherwise changes the utility).
- Item 18 (`type-ladder.tsx:24-30`): guidance; the quote is that one file's reason.
- Items 11 to 13 are the bible's (`src/app/(dev)/design/rules/bible.ts`): Will's words. Propose each line under Questions (11: #10's "never promise 'no account'" is a truth `content-policy.test.ts` guards, so the test stays whatever its wording; 12: #10's "the voice is won one line at a time in its real place" came from the misfiled brand-voice notes; 13: the three clauses he ratified on 2026-09-12). Edit none.

**The rule for every item:** delete fences, never reasons; a test that also catches a real bug stays and its header names the bug; each reshaped test keeps its scar and says which reason expired; two commits, the docs and lab first, the production fence second.

**Not yours:** `bible.ts` (propose); `docs/reviews/`, `usher/`, `docs/ROADMAP.md` (relay lines in your Handoff); `design-system.md` about 107-109 ("light never goes on gallery arrivals": `album-motion-wiring` is building under it; relay its rewording); `docs/systems/marketing-content.md`, `src/components/shared/album-stream/` and the album hero (`album-motion-wiring`); `hero-stream.ts`, `cinema-hero*` and the `SITE_*` values of `marketing-voice.ts` (`demo-framing` r2: comments only there); `settings-rows.tsx`, `event-blocks.ts`, the report queue, `app/admin/forensics/` and the doors' SQL (`crumbs-17`); `globals.css` (the fence stays); `content-policy.test.ts`'s em-dash, fenced-claims and human-promise tests (legal and truth fences).

**Verify:** the gate whole; `pnpm lab:smoke --all` (the Library renders the changed components); the user menu's sub-menu on your dev server, opening and portalling as before.

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
