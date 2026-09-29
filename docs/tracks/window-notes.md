---
track: window-notes
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "57b17ace"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/review/ledger.ts
  - src/app/(dev)/design/review/ledger.test.ts
  - src/app/(dev)/design/review/status.ts
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/queue.ts
  - src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts
  - scripts/lab-review.mjs
  - src/app/(dev)/design/(shell)/lab/_desk/lab-review.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/_window.json
  - docs/reviews/README.md
  - docs/PROGRAM.md
---

# lp/window-notes

**Goal.** A note of Will's binds only the board it was given on: stop the lab merging board-less window notes into every board, let window notes expire with their sitting, and leave program-wide notes to the Orchestrator's synthesis.

## The brief

**What went wrong** (Will, 2026-09-29). The desk shows three notes as "Your notes this window … what you said this round that binds every board", and the lab merges them into every board's notes: `review/status.ts` builds a board's `notes` from its own round plus `windowNotesFor(board)`, and `review/ledger.ts`'s `windowNotesFor` returns every `on: null` note of the window's latest round ("the lines a board must still be answering"); the desk's rows (`_desk/queue.ts`) render them. Those three were his notes on the brand-voice board (round 6 of `docs/reviews/_window.json`, 2026-09-17), transcribed with `on: null`; and since no sitting opened a newer window round, round 6 has stayed "latest" for twelve days, so they have bound every board since, pushing lanes toward a form he never asked of them. His principle, which the fix must hold: a note binds only what it was given on, and nothing he says is a standing rule; a note meant for the whole program is the Orchestrator's to fold into the doc it refines, synthesized, never a quote stacked on every board.

**Do:**
1. A board's notes are its own: stop merging board-less window notes into each board's status and its desk row.
2. The desk's window section shows only the latest sitting's board-less notes, framed as what he said at that sitting (never "binds every board"), and nothing once a newer sitting has come or the Orchestrator has folded them in. Pick the cleanest signal (the window round's date against the board rounds opened since, or a `folded` mark the record sets) and say which in your README relay.
3. Transcription (`scripts/lab-review.mjs`): a note with no board prints a line telling the Orchestrator to fold it into the program's docs or file it on its board; it never becomes a rule by default.
4. Tests on fixtures, never on the live ledger's contents (today's `ledger.test.ts` asserts the real window holds board-less notes); each reshaped test keeps its scar.
5. Relays in your Handoff, since `docs/reviews/` is the Orchestrator's: the `_window.json` data (the three voice notes to `on: "brand-voice"`, their true board; every other stale board-less note either folded or deleted, with where its lesson already lives), and the `docs/reviews/README.md` lines on the window, word for word.
6. A read-only audit: list every other place a note of Will's about one board became a program-wide rule (the lab kit's traps on `/design/lab/kit`, PROGRAM.md's round rules, the bible's ten, the glossary), each with where it came from, for the Orchestrator to judge; change none of them.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

All four are built as recommended and are his to overrule.

- **When does a sitting end?** Built: the window's latest round is the current sitting until any board ledger has a
  round opened on a later day (`ledger.ts` `sittingIn`); the ledgers are the clock, so nothing is marked or forgotten,
  and folding a note into its doc is deleting it from `_window.json`. The other signal, a `folded` mark the record
  sets, makes persistence the default, which is the failure itself (nothing was marked, so three notes stood for twelve
  days). Recommended: as built.
- **Do notes filed on a board (`on: <board>`) outlive the sitting?** Built: no, the whole latest round expires
  together; a note meant to outlast a sitting belongs in the board's own ledger (`review <board> r<n>: note: "..."`).
  The alternative, named notes following their board until it retires from any window round, would let an old id's notes
  greet a new board of the same name; no standing board has a named note today. Recommended: as built.
- **What does the transcript do with a note that names no board?** Built: a line of only `note: "..."` parses, is
  recorded nowhere and prints where it goes (before, it was a parse error that threw away the whole paste). The
  alternatives are to keep refusing it, or to file it in `_window.json`, which is the bug. Recommended: as built.
- **The desk's section is retitled "What you said at your last sitting"** (was "Your notes this window": "window" is
  in no glossary and the blurb said the notes bind every board). `usher/kit/desk-sections.mjs:6` names the old head
  (relay 3); until it changes the tool omits that section. Recommended: as built.

## System-doc edits (in place, owned facts only)

- none: no `docs/systems/` doc owns the review ledgers, and `docs/reviews/README.md` is the Orchestrator's (relay 2).

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `/design/lab/kit` (`kit/page.tsx:125-127`) says `lab:demo` "refuses two options that draw the same
  picture", but `scripts/lab-demo.mjs` (`:1001`) only notes `same picture:` in a step's row and fails a frozen stage, and
  PROGRAM.md calls a same-answer pair "a finding" (from `window-notes`).
- The lab and the kit: `src/components/lab/dock.tsx` exports `AppliedBadge` (`:322`), `ReplayButton` (`:351`) and
  `MotionToggle` (`:373`), imported nowhere (from `window-notes`).
- Docs: `kit/README.md:40` sets Urbanist 600 for card and subsection titles while `docs/systems/design-system.md:213-217`
  says one heading weight, 700 (from `window-notes`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/window-notes`:** work `463a24c9`; sync `b352ed22` (launch-prep had moved to `c3b7d76d`:
  event-ready r1 merged, a new board the registry and the desk now list; nothing in this lane's `owns` or `reads`
  changed, and it had not moved again at the handoff); one wording follow-up `3e14db98` (the transcript's advice line);
  this manifest is the head, named in the chat line.
- **Gates on the synced tree at `3e14db98`** (logs in `../partyreel-wt/_scratch/window-notes/`, `gate3.txt` and
  `h-*.log`, one step at a time through `scripts/build-lock.sh`): `pnpm typecheck` exit 0; `pnpm lint` exit 0 (no
  warnings); `pnpm test` exit 0 (609 files, 7113 tests); `pnpm build` exit 0; `pnpm lab:smoke --base
  http://localhost:3132` exit 0 (174 checks, 0 failing; scope `all`, since `scripts/lab-review.mjs` is the lab's own
  tool). The same four steps and the smoke were green on `b352ed22` before the wording follow-up. `lab:demo` is a
  board lane's step and this is `board: none`. Live: not run: the routes are the key-gated lab and nothing of this lane
  is on the alias until the Orchestrator's `[preview]`.
- **Lane check** `git diff --name-only origin/launch-prep...HEAD` = the eight owned files + this manifest, no exceptions.
- **The items**
  - `src/app/(dev)/design/review/ledger.ts`: `windowNotesFor(board)` hands a board only the notes filed on it
    (`on` names it); `currentSitting()` / `sittingIn` derive the window's current sitting from the ledgers by day;
    `saidOnNoBoard` / `saidOnBoard`; `readLedger` and `windowNotesFor` take a `root`, so a test builds its own tree.
  - `src/app/(dev)/design/review/status.ts` and `.../lab/_desk/queue.ts`: a board's status and row carry its own notes and
    those filed on it, never a board-less one (the row keeps its filter as a second layer).
  - `src/app/(dev)/design/(shell)/lab/page.tsx`: the window section is "What you said at your last sitting", shows the
    current sitting's board-less notes with its date and "It binds nothing", and is absent once the sitting has ended.
  - `scripts/lab-review.mjs`: a bare `note: "..."` line is reported (`unfiledAdvice`, `run().unfiled`, `--json`) and never
    recorded; an empty note is refused on board lines too (it wrote a row the ledger schema then refuses to read).
  - Tests, 107 across the three files (was 80): `ledger.test.ts` no longer asserts on the live window (it required
    board-less notes to exist); the sitting, a board's own notes and the directory listing are proved on fixtures and
    scratch trees, each reshaped test keeping its scar and saying which reason expired; the live ledgers are held to
    their shape, their day dates and an invariant that holds for any contents. Each new test was made to fail on the
    change it guards (mutation runs, unshipped).
- **Verified on the desk** (dev server on 3132, then killed): with the live ledgers the section is gone, the sitting of
  2026-09-17 being superseded by the 2026-09-29 board rounds; with a scratch window round dated 2026-09-29 it shows
  only its board-less notes (`../partyreel-wt/_scratch/window-notes/desk-1440-notes.png`), the note filed on
  `privacy-hero` rides only that board's row, at 375 nothing overflows, and dated 2026-09-28 everything disappears. The
  ledger was restored after each check (`git status` clean).
- **Assets requested from Will:** none
- **Board ideas:** the desk's end-of-walk message has no place for a note about the whole program; it reaches the
  Orchestrator only through chat. A "for the whole program" note at the end of the review, composing `note: "..."`,
  would give the transcript's new bare line a producer (`_desk/review-message.ts`, `review-session.tsx`).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none
- **Calls his to overrule:** the four Questions above; an empty note is refused on board lines too (found beside this
  change); relay 1 re-files the three voice notes on `brand-voice` as the brief says, though that board is retired, so they
  read as dead rows (deleting them is the alternative).
- **Look at first:** relay 1 and relay 2 below (the record edits that finish the fix), then `/design/lab` on the alias
  after the `[preview]`: no window section until a fresh window round is dated on or after the newest board round.

### Relays (`docs/reviews/` and `usher/` are the Orchestrator's; nothing here was applied)

**1. `docs/reviews/_window.json`.** Nine notes are board-less (`on: null`), and all sit in rounds 4 to 6. Re-file the
three of round 6 on their true board and delete the other six, each lesson already living elsewhere:

| note (first words) | disposition | where its lesson lives now |
| --- | --- | --- |
| R6 "A form that yields many fine notes" | `on: "brand-voice"` | `docs/PROGRAM.md:73-76` (one question, one winner) and `:91` (never force options apart) |
| R6 "Judge copy where it is used" | `on: "brand-voice"` | `src/app/(dev)/design/rules/bible.ts:99-100` (#10, "won one line at a time in its real place") |
| R6 "Build up from the ground up" | `on: "brand-voice"` | `docs/PROGRAM.md:89-90,104-107` (progressive, iterate), `bible.ts:99-100` |
| R4 "Page-wide controls always on screen" | delete | built: `src/components/lab/dock.tsx:19-36` (sticky dock), `step.tsx` (sticky stage head, config strip) |
| R4 "Pixel-perfect previews" | delete | built: `src/components/lab/lab-prefs.ts:3-35` (1:1 by default), `frame.tsx` (a real viewport), `library/foundations/type-ladder.tsx:24-30`; the clause "never zoom, scale or transform" is not in his recorded words (the retired rulings log, "the review surface", `git show 3f052961^:docs/design/rulings.md`) |
| R4 "More real UI" | delete | `docs/PROGRAM.md:73-75` (options "previewed whole on the real surface") |
| R4 "The app's UI is open" | delete | moot: no dedicated app agents remain; `docs/PROGRAM.md:8-11` (every surface, the app included) |
| R5 "A question carries its context" | delete | `docs/PROGRAM.md:78-83`, held by `src/app/(dev)/design/sandbox/registry.test.ts:735-888` |
| R5 "Each exploration page feels like a small research paper" | delete | `docs/PROGRAM.md:71-76`; the reading budget `src/components/lab/board-spec.ts:489` and `scripts/lab-smoke.mjs:12-19` |

Every other row of the file is on a board that no longer stands (palette, light, media-kit, brand-voice, app-shape,
glass, guest-verify, guest-shape, app-door, pricing-page, app-vocabulary, app-pricing, and a typo, `VOCABULARY_`), so no
reader can show one: 32 of them are the "overridden by ..." echoes whose writer (lab-review's override echo, `7f0ca050`)
left with the overtaken mechanism at `b542965d`. The whole file may be emptied to `rounds: []` (git keeps it:
`13899ba7`, `4a4067b1`, `ece02b97`, `40e2c2c1`). This script does the re-file and delete from the repo root;
`--empty` also empties the file. Both variants were run on scratch copies and on the worktree (then restored): the ledger
schema, day-date, queue and manifest tests stay green and the desk serves with no window section.

```python
# The window-notes relay for docs/reviews/_window.json (run from the repo root).
#   python3 relay-window.py            -> re-file the three voice notes, delete the six other board-less notes
#   python3 relay-window.py --empty    -> also delete every row on a board that no longer stands (all of them)
import json, pathlib, sys
p = pathlib.Path("docs/reviews/_window.json")
d = json.loads(p.read_text())
VOICE = ("A form that yields many fine notes", "Judge copy where it is used", "Build up from the ground up")
for r in d["rounds"]:
    keep = []
    for n in r["notes"]:
        if n.get("on") is None:
            if n["text"].startswith(VOICE):
                n["on"] = "brand-voice"
                keep.append(n)
            # the other six board-less notes are deleted: each lesson already lives elsewhere
        else:
            keep.append(n)
    r["notes"] = keep
if "--empty" in sys.argv:
    d["rounds"] = []
p.write_text(json.dumps(d, indent=2) + "\n")
```

**2. `docs/reviews/README.md`, word for word** (`git apply`; the paragraphs read as they will stand):

```diff
--- a/docs/reviews/README.md	2026-09-29 15:57:05
+++ b/docs/reviews/README.md	2026-09-29 15:57:05
@@ -1,7 +1,7 @@
 # The review ledgers
 
 > **ROLE:** Will's answers and notes on the boards, one JSON file per board plus `_window.json` for
-> a round's notes that apply to every board and `_library.json` for his verdicts on Library entries.
+> what he said at a sitting outside any board's own review and `_library.json` for his verdicts on Library entries.
 > **BELONGS HERE:** ask ids, choices (an option id, or `null` for "not clear to me"), catalog item
 > verdicts (`keep | refine | kill`), Library entry verdicts (`keep | redesign | retire`), notes, who and when.
 > **NOT HERE:** the questions themselves (a board's `spec.ts` is the one home; a ledger stores ask
@@ -32,14 +32,23 @@
 }
 ```
 
+In a board's own ledger a note's `on` is `null`: the ledger is the board, so the note is the board's.
+
 One answer per ask per round; answering again in the same round overwrites (git keeps the first).
 A `choice` of `null` is Will's "this question is not clear to me" (`<ask>=? "why"` in the grammar;
 the note is required): the ask stays open on the desk, flagged as waiting on a clearer question,
 and the board rewrites it before he is asked again.
-A new round is opened by the Orchestrator when it spawns it. `_window.json` holds notes whose `on`
-is a board id or `null` for the whole window. The desk derives "Waiting on Will" as every ask on a
-standing board with no answer in its latest round; a board whose asks are all answered shows what
-its answers decide. When a board leaves the lab (its picks built) its ledger is deleted with it.
+A new round is opened by the Orchestrator when it spawns it. `_window.json` logs what he said at a
+sitting outside any board's own review, a round per sitting (`opened` is its date); a note's `on` is
+the board it was given on, or `null` when it was given on none. Nothing in it binds anything, because
+a note binds only what it was given on: a board's row carries the notes filed on it, and the desk
+shows the latest sitting's notes on no board, as what he said at that sitting, until a board opens a
+round on a later day (his next sitting), after which nothing reads that round at all. A note meant
+for the whole program is the Orchestrator's to fold into the doc it refines, synthesized and never
+quoted, and folding it is deleting it here: there is no mark to set. The desk derives "Waiting on
+Will" as every ask on a standing board with no answer in its latest round; a board whose asks are
+all answered shows what its answers decide. When a board leaves the lab (its picks built) its ledger
+is deleted with it, and so are the notes filed on it in `_window.json`.
 
 ## The message grammar
 
@@ -65,6 +74,12 @@
 `review <board> r<n>: <ask>=? "what was unclear"` records "not clear to me" (the note is required).
 An option is its id (one token); the board's spec carries the label and the meaning a reviewer reads.
 
+A line that is only `note: "..."` names no board, so `pnpm lab:review` records nothing for it and
+prints where it goes: if it is meant for the whole program, fold it into the doc it refines
+(synthesized, never quoted); if it was given on a board, file it there with
+`review <board> r<n>: note: "..."`. The rest of the paste records as ever. A note with no words is
+refused on any line.
+
 `item:<id>=keep|refine|kill` gives ONE card of a board's catalog its verdict, where
 `<id>` is a candidate id from the board's spec. The `item:` prefix keeps the two namespaces apart: an
 ask id and a candidate id are both one token and a board may use the same word for both. A board that
```

**3. `usher/`.** `usher/kit/desk-sections.mjs:6` becomes
`const heads = ["Waiting on you", "Every standing board", "What you said at your last sitting"];`. In
`usher/kit/README.md`, the "His sitting" bullet gains, after "and ask the follow-ups in chat.": "A note he gives on no
board binds nothing: fold it into the doc it refines (synthesized, never quoted) or file it on its board, and file it in
`_window.json` as a round dated that day only if he should see his own words on the desk that sitting." The pickup's
relay to board lanes (`orchestrator.md`, "every board lane until `window-notes` merges") can go at the merge. PROGRAM.md's
round step 4 already says "nothing records a pick as a rule"; a companion clause (a note binds only what it was given
on) is the Orchestrator's to place, if it wants one beyond the README's.

### The audit (read-only; nothing changed)

A = one board's note (or one sitting's answer to one board) that became a rule, limit, test or fence beyond it. Three
read-only helper passes (process docs; lab code, tests and scripts; the bible, glossary and Library) gathered these
from `git log -S` and the retired ledgers; I checked the lines and commits behind 1 to 6, 11, 16 and 17 myself; the rest
stand on the helpers' evidence, and anything they could not prove says so. His words survive in git: the retired ledgers
and `docs/design/rulings.md` (`git show 3f052961^:docs/design/rulings.md`).

*PROGRAM.md's round rules*
1. `docs/PROGRAM.md:91` "Options are real contenders ... never force them apart" · brand-voice R6 note, 2026-09-17
   ("forcing each to have a very specific tone so it felt differentiated for the sake of the exploration") · `13899ba7`
   (its message adds "its corollary: never force a board's options apart") · A; no test enforces it.
2. `docs/PROGRAM.md:35-36` + `src/app/(dev)/design/sandbox/registry.test.ts:328-381`, a board past round 1 must have a
   ledger · brand-voice kill note, "unreviewed rounds", 2026-09-17 · `13899ba7` · A, and a test (its header quotes him);
   it holds only that some round is on record.
3. `docs/PROGRAM.md:97-98` "Answer a relative note against a reference" · album-hero r2 "a bit more calm", answered by
   r3 `composition=none` · `d62dac22`, 2026-09-18 · A.
4. `docs/PROGRAM.md:99` "Placeholder copy is judged for its size and wrapping" · album-hero r3 `copy=page` · `d62dac22`;
   its first wording ended "until the voice board rules the words", dropped in `8f68e749`, leaving a standing rule · A.
5. `docs/PROGRAM.md:93-94` "Offer the fix at its source" · type-phone r1 `subhead=?` note, "fix the ... ladder" ·
   `00e82dba`, 2026-09-18; his remedy was about the type ladder · A.
6. `docs/PROGRAM.md:95-96` "Measure every tile before it ships" · `00e82dba` calls it a lesson of that batch: an agent's
   find (a type-phone tile drawn with its formula's sign backwards), not a note of his · C.

*Lab code, tests and gates*
7. `LIMITS.readingWords: 1200` (`src/components/lab/board-spec.ts:489`), measured in every lane's gate by
   `scripts/lab-smoke.mjs:12-19` · palette r5 "a PhD on color theory" · `1bdaf3c1`, 2026-09-16; the number has no source
   in his words · A.
8. `scripts/lab-demo.mjs`, the gate on every open step (frozen stage, reach, clip, label, dock) · floating-surfaces
   "clicking the configs didn't seem to change anything" (`871f650b`, 2026-09-17) and his ninth batch's answer on
   river-visual `proportion=?`, about the lab itself (`d37be90e`, `d62dac22`, 2026-09-18); the thresholds are the
   lanes' · A.
9. Code no standing board reaches (none declares a `catalog`), from his catalog descriptions: `registry.test.ts:498-512`
   "None of these" on every pick-one catalog (`02c409b4`, `4e3ebd13`, 2026-09-16), `src/components/lab/catalog.tsx:29-35` (a
   card never holds its own selection, from the R4 palette note), `before-after.tsx:10-16` (light's depth ask) · A.
10. The 14 kit traps (`src/components/lab/traps.ts`, `/design/lab/kit`): none traces to a note of his; they are
    engineering finds (`stale-lab-stylesheet` was occasioned by his general "lab UI is broken" report, `5cdebfe0`, its
    cause the agent's) · C.

*The bible's ten* (`bible.ts`; provenance was stripped in `fc63a199`, so origins come from git)
11. #10 `:99-100` "never promise 'no account'" · `voice` r1 `absence=named`, 2026-09-19 (his swap to "No app required.":
    many events need accounts) · `a81275ac`, swept in `046f2955`, enforced by `src/lib/content-policy.test.ts:239-278` · A.
12. #10 `:99-100` "The voice is won one line at a time in its real place" · the brand-voice R6 notes ("Judge copy where it
    is used", "build up from the ground up") · `1257ee63`, 2026-09-17; `fc63a199` dropped "meanwhile" and the board's name
    · A: his notes are encoded twice, as window notes and as this clause.
13. Three clauses began as one board's review and were ratified into the bible by him on 2026-09-12 (`f79a711c`), so B by
    ratification: #9 never stock (the press page's first cut, `63cc5641`), #10 not defining us against someone else (the
    /about round, `1aadcf86`), #8 one type ladder (careers, `ca658d68`). The other principles are his own program-wide
    writing (the 2026-09-14 review; the 2026-09-24 writeup, `f912bb94`) or engineering (#5's "arrives hidden" is a hero LCP
    find).

*The glossary* (`src/app/(dev)/design/_data/glossary.ts`): no entry is a board's note. "Will owns the wording" is
2026-09-12 and the retired words are his 2026-09-24 message (`2bac8693`, `7a6438d9`). Nothing in it says a note binds
only what it was given on: `:135` says only that a pick is "never a rule".

*Production code, the Library and system docs, each from one board*
14. `voice` r1 (2026-09-19, `046f2955`): `src/lib/constants/marketing-voice.ts:38-42` "That ORDER is the rule every
    subhead takes" (hero-sub), `:44-51` an empty state never describes the void (host-empty), `:121-125` "VIDEO FIRST"
    imposed on four sibling surfaces (pro-line) · A.
15. `light` r7 (2026-09-17, `dc4530df`): the Aurora never on a light ground and composed for its place
    (`.../library/foundations/gallery-demos.tsx:20-23,43`, `.../library/marketing/gallery-demos.tsx:231-237`,
    `docs/systems/design-system.md:176-186`; his "may not ... for now" became "never"); the halo "never a button"
    (`foundations/gallery-demos.tsx:188-193`), his verdict on one card; `light` r8 `sweep=skip` (`2535ba4e`): "Light never
    goes ... on gallery arrivals" (`design-system.md:107-109`), a note about one shimmer · A.
16. `floating-surfaces` r7 (2026-09-17): menus stop at two levels and a third throws at render
    (`src/components/ui/dropdown-menu.tsx:379-386`, `5160682a`, `b8e77444`) from a `submenu=keep` note ("gets too
    complicated"); the floating layer refuses translucency (`design-system.md:306-307,447`,
    `src/components/ui/floating-layer.ts:22-26`, `b2887f43`) where he asked for a dedicated Glass exploration, a deferral
    that became a fence · A.
17. `contact-page` r1 `beside` (2026-09-29, ledger at `31de6aa0`): one heading weight, 700, refused by
    `src/lib/type-ladder-policy.test.ts` (guard 3), `design-system.md:213-217` and
    `library/foundations/type-ladder.tsx:41-45` (`e353af4f`, `91033d0d`), from a note he called a side note about the
    app's thin heading weights · A.
18. The R4 window note "Pixel-perfect previews" as a file's rule, `library/foundations/type-ladder.tsx:24-30` · A; confined
    to that file.

*B, not listed one by one:* his asks about the lab itself, none about one board: the sticky dock and 1:1 stages
(2026-09-15), asks in plain words (`registry.test.ts:570-631`), decisions not pages (`exploration.ts:21-60`, PROGRAM.md
`:71-76`), the stepped review, context before options (2026-09-29; `registry.test.ts:735-888`, PROGRAM.md `:78-83`), the
desk by leverage, no repeated asks and merge repeats (`usher/kit/README.md:45-58`, PROGRAM.md `:92`), "Copy so far".
One clause is not in his quoted words: `usher/kit/README.md:64-66`, "a lab lane is sized in days and never delays a board"
(unverified).

*The container itself.* `docs/reviews/README.md:3-4,39-40` defined `_window.json` as "a round's notes that apply to every
board" (`2644310d`, 2026-09-15, "round four's global notes", the Orchestrator's, for four lab-UI and app notes). That
wording, not a note of his, is what let board-less notes bind; relay 2 rewrites it.
