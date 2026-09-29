---
track: unfence
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Item 16, the dropdown's third-level throw, is NOT removed: Will's to decide.** The edit that removes it
  (`DropdownMenuDepthContext`, the throw in `DropdownMenuSub`, the throw's test, a comment that two levels read simpler
  and a third branch flattens into a named group) was refused in this session by the permission classifier, so I
  stopped: `src/components/ui/dropdown-menu.tsx` and `dropdown-menu.test.tsx` are exactly as on launch-prep and the
  second ("production fence") commit does not exist. Recommended: remove it as the disposition says (production nests
  one level, `user-menu.tsx`; the refusal blocks nothing real), where Will allows it. Until then `design-system.md`'s
  submenu bullet ("a third throws"), the Library's menu specimen comment and the test all stay true.
- **Bible #10, "never promise 'no account'" (item 11).** Recommended: keep it as written. It is a truth, not a hardened
  note (a host may require an account and Require verified emails defaults on), #10's why already says so, and
  `content-policy.test.ts` guards the truth whatever the wording (its header now leads with it).
- **Bible #10's "The voice is won one line at a time in its real place" (item 12).** It came from brand-voice's R6
  notes (judge copy where it is used), given on that board and filed board-less, so it is encoded twice. Recommended:
  drop the sentence; the openness it carries is #1's and #10's own "treat every line as open to a better one". The
  proposed why is under item 13.
- **The three clauses he ratified on 2026-09-12 (item 13): #8's one type ladder, #9's never stock, #10's not defining
  us against someone else.** Recommended: keep all three, since his ratification made them program-wide by his own
  word. #8 and #9 carry their reasons; #10's clause has none in its why, so give it his from the /about round ("who we
  are, not who we are not"). Proposed #10 `why`, word for word, its `statement` unchanged:

  ```text
  It is about who we are, not who we are not, and a use we fence off is one a host might have found. Many events ask for an account, so "no account" would be untrue, and an em-dash reads as an AI tell; `marketing-voice.ts` is the one home for the lines that ship.
  ```
- **Item 9, "None of these" on every pick-one catalog.** Built: `registry.test.ts` no longer requires a winner ask to
  offer `none` (it caught no bug: `GalleryStep` draws the cards alone and draws `none` only when offered), and the
  reason stays as guidance in the test and `board-spec.ts`. Recommended as built; no standing board declares a catalog.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md` (`1ee57367`): gallery arrivals leave "Light never goes" for a line of their own with
  album-motion-wiring's reason (the Orchestrator's relay); the halo's "never a button" became its reason; the Aurora on
  a light ground is "not yet, and why", pointing at ROADMAP's light-mode line (the `globals.css` fence and its drift
  note unchanged); the heading-weight line leads with the trap, 700 the current preference with its escape; "Glass is
  media chrome" is "not yet a popover's", and the floating layer "carries no backdrop filter until the Glass
  exploration" where the doc said it "refuses" one (the code never did), in the glass section and the floating-layer
  contract.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits.** The work commit `1ee57367` (the docs and lab), pushed. The production-fence commit does not exist
  (item 16 refused; Questions). No sync commit: the lane fast-forwarded to `816d3e11` before its first commit
  (album-motion-wiring had just merged into the Library's components demos and the specimens artifact item 16 was to
  touch); launch-prep moved since (`cba704dd` crumbs-17, then records to `50dd94fc`), touching none of this lane's
  paths or `reads`, so no second sync.
- **Gates on `1ee57367`**, each on its own exit code (logs in `../partyreel-wt/_scratch/unfence/`): typecheck 0
  (`gate-typecheck.log`); lint 0 (`gate-lint.log`); test 0, 614 files, 7189 tests (`gate-test.log`); build 0
  (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3132` 0, "172 checks, 0 failing", scope all because
  `lab-smoke.mjs` changed (`lab-smoke.log`); `pnpm lab:smoke --all` 0, "172 checks, 0 failing" (`lab-smoke-all.log`).
  No board, so no `lab:demo`.
- **Lane check.** `git diff --name-only origin/launch-prep...HEAD` = the 13 owned paths below + this manifest; no
  exceptions: `docs/systems/design-system.md`, `scripts/lab-smoke.mjs`, `library/foundations/gallery-demos.tsx`,
  `library/foundations/type-ladder.tsx`, `library/marketing/gallery-demos.tsx`, `sandbox/registry.test.ts`,
  `lab/before-after.tsx`, `lab/board-spec.ts`, `lab/catalog.tsx`, `ui/floating-layer.ts`,
  `constants/marketing-voice.ts`, `lib/content-policy.test.ts`, `lib/type-ladder-policy.test.ts`.
- **Seen on the dev server (3132).** `/design/library/glow`: the lede's "for now it lives on dark grounds", the shape
  note's halo reason, the halo hint "objects, not buttons"; `/design/library/section-light`: its lede;
  `/design/library/marketing`: the row "on dark grounds for now". The user menu's sub-menu was not re-walked, since
  `dropdown-menu.tsx` did not change. Live: no product behaviour changed (the Library's text under `/design`,
  comments, docs and test headers), so the alias has nothing new to exercise until item 16 lands.
- **The items.**
  1. PROGRAM.md's "never force them apart": guidance with its reason (the line below).
  2. The review before round 2 (`registry.test.ts`): the test stays; its header states the loop and its scar
     (brand-voice at round seven, unreviewed), not the quote; the empty grandfather list goes with its paid debt.
  3. PROGRAM.md's relative note: guidance with its reason (below).
  4. PROGRAM.md's placeholder copy: its condition back (below).
  5. PROGRAM.md's fix at its source: guidance with its reason (below).
  6. An agent's find, not his note: untouched.
  7. `LIMITS.readingWords`: the kit's default with its escape; his "PhD" note named the failure (`board-spec.ts`,
     `lab-smoke.mjs`).
  8. `lab-demo.mjs`: untouched (a bug-catcher).
  9. "None of these" optional, its reason kept (`registry.test.ts`, `board-spec.ts`); `catalog.tsx`'s verbatim brief
     and page-wide switch are their reasons; `before-after.tsx`'s "the only thing worth showing" is its reason.
  10. The kit's traps: untouched.
  11-13. Proposed under Questions; `bible.ts` untouched; `content-policy.test.ts`'s no-account header leads with the
      truth.
  14. `marketing-voice.ts`, comments only: the subhead's shape is the reference a new subhead is graded against, his
      sentence kept; the empty state's reference keeps its reason; the Pro line's order is his ranking of the pair,
      enforced by nothing; and two stale claims that the copy is byte-pinned (the pins went in `91606e9d`).
  15. The Aurora on a light ground is "not yet, and why" in `design-system.md` and both Library entries (the
      `globals.css` fence stays); the halo carries a reason, not his quote; the arrivals clause is guidance with
      album-motion-wiring's reason (the relay); the Aurora entry's stale "still open on the light board" (that board
      retired) now names the banked shimmer.
  16. The floating layer's "refuses a backdrop filter" is "carries none until the Glass exploration"
      (`design-system.md` twice, `floating-layer.ts`'s comment). The dropdown's throw: NOT removed (Questions).
  17. One heading weight: guard 3 stays and leads with the trap; 700 is the current preference with its escape
      (`type-ladder-policy.test.ts`, `design-system.md`, `type-ladder.tsx`).
  18. `type-ladder.tsx`'s clip-not-scale: his quote kept as that file's reason, the "NEVER" gone.
- **PROGRAM.md, word for word**, for the Orchestrator's record: lines 91-99 ("Options are real contenders" through
  "Placeholder copy is judged") become the block below, items 1, 5, 3 and 4 in their places and "Measure every tile
  before it ships" (item 6) unchanged:

  ```md
  - Options are real contenders for one decision, as far apart as the real answers are: pushed apart for the
    exploration's sake, each turns into a caricature nobody would ship, and two that land on the same answer are a
    finding. Ask nothing an open ask on another standing board already asks (your brief names the nearest).
  - **Offer the fix at its source**: when a question is a symptom of the system (a token is wrong), an option that fixes
    the system is worth drawing beside the page's own, since a fix to one page leaves the next page asking the same
    question.
  - **Measure every tile before it ships**: a preview shows what its option's words claim, read on screen, never
    computed.
  - **Answer a relative note against a reference**: a note like "a bit more calm" is best answered by options graded
    against something he already likes, since a cap that made every option calm by construction would leave him nothing
    to choose between.
  - A board that is not about the words judges its placeholder copy for size and wrapping; the words are the voice's
    (`marketing-voice.ts`).
  ```
- **Relay, `docs/reviews/README.md`** (about line 70), with item 9: "whose options are its card ids plus `none`, so"
  becomes "whose options are its card ids, usually with `none` beside them, so".
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule.** "None of these" optional on a pick-one catalog (item 9). The halo's reason in the
  system's own words, "decoration on a control rather than light from a thing", where his note gave none (item 15).
  The three bible proposals (Questions).
- **Look at first:** the first Question (item 16, his to decide); then the four PROGRAM.md lines; then
  `/design/library/glow`.
