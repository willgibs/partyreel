---
track: calls-desk
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "3ec66b8f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/calls.json
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/calls/
  - scripts/lab-review.mjs
  - usher/kit/calls.py
  - src/lib/calls/
reads:                  # single-sources you depend on: never duplicate, never edit
  - usher/kit/README.md
  - docs/PROGRAM.md
---

# lp/calls-desk

**Goal.** The calls lab moved into the lab's desk, where Will sits: the few decisions built in that he cannot see by using the product, each answered in a press, its answer riding the one message he already pastes, and a door that keeps the list from ever running away again.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3133 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**Will's word (2026-10-07), the brief's point:** the calls doc had become a decision log, every choice and its alternative appended, days of reading. Its purpose: as the program works on its own, the calls hold only the important choices where his view of the product may differ, the ones that slip into systems invisibly (how an Event Pass renews, when the get-ready checklist disappears). Never a design, experience or wording call: he walks production and the marketing site and critiques what he sees, and most design passes through the lab anyway. If it stays, it must be used correctly (never the runaway append the old STATUS and ROADMAP had), and "probably just build it into the lab for easier handling". The Orchestrator reshaped the content at `3ec66b8fe`: `docs/calls.md` now holds the open questions (X1, X2, X3, X5, X6, X9 to X17) and 16 built calls by theme, and the runbook's "The calls lab" states the test, the cap of 30 and the same-day exit.

**What to build:**
1. **One home the lab can render:** `docs/calls.json` (beside `docs/reviews/`), the content of `docs/calls.md` at `3ec66b8fe` migrated word for word: each entry an id (kept, never reused), its kind (a question, or a call built and his to change), its theme, its title, its body (a call three lines at most) and its "Change it if", a question's recommended answer and alternatives, and a call's home (the `docs/systems/` doc that holds the fact, so a kept call can leave). A test holds the fields, unique ids and the cap of 30. Never edit `docs/calls.md` (the Orchestrator deletes it at your record).
2. **The Calls place on the desk** (`/design/lab`), beside the boards Will sits: open questions first, then calls by theme, each readable at a glance at 1440 and 375 and answered in a press: a call Keep (the default, sending nothing) or Change with his note; a question its recommended answer, an alternative, or his own note. Quiet, never dev-tool-ish, in the desk's own furniture.
3. **One message a sitting:** the answers ride the desk's existing message (`review-message.ts` composes, `scripts/lab-review.mjs` parses, `lab-review.test.ts` round-trips), one `calls:` line in the grammar's style; `pnpm lab:review` validates it and prints the routing list (each answered question's pick, each change with its note, each kept call that may now leave), writing nothing to `docs/calls.json` itself (the record does, through item 4). The grammar's one statement lives in `docs/reviews/README.md`, which no lane edits: write its new line in your Handoff for the Orchestrator to place.
4. **The record's door:** `usher/kit/calls.py` (add, retire), the only writer the record uses: it refuses an entry missing a field, a call past three lines, a duplicate or reused id, and the 31st entry, so a design call or a runaway append cannot get in.
5. **Retired ids cited in code and docs** (`calls lab's H1` in the create-wizard board's spec, `BE3` in `root-folder.test.ts`, `X7` in `capture-time.ts`, and any other): point each at the system doc line that holds the fact; list any outside your owns as an exception.

**At your record (the Orchestrator's):** `docs/calls.md` deleted; `track-manifests.test.ts`'s never-owned line moved to `docs/calls.json`; the runbook's bullet, the pickup and STATUS pointed at the lab's Calls place; your grammar line into `docs/reviews/README.md`. Say each in your Handoff.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does a call he leaves untouched count as kept?** Built: no. Keep is the default outcome (the call stays as built and
  nothing is sent for it), but only a press says "kept" and lets it leave the list; an untouched call waits for his
  next sitting, and one press, "Keep the other N", keeps every call still unanswered. Silence that counted as a keep
  would let calls he never read leave unseen, the one thing the list exists to prevent. Or: silence keeps (the
  transcript would list every call a paste does not change as free to leave).
- **The questions' themes.** `docs/calls.md` gave its questions none; each now wears the nearest of the calls' four,
  and a fifth, "What Partyreel is", holds the app-gaps walk's questions about the product's shape (X9 roles, X12 words,
  X13 language, X16 prints, X17 follows). Built: the five, listed in the file, and the door refuses any other. Or: the
  four only (those five forced into the nearest), or no theme on a question.
- **An entry's words never change under its id.** Built: `calls.py` has add and retire and no edit, so an answer he
  gives is always to the words he saw; an entry that must change is retired and added again under a new id. Or: an
  edit that keeps the id (easier for a typo, but an answer already in a paste would land on new words).

## System-doc edits (in place, owned facts only)

- `docs/systems/testing-verification.md`, "The desk's answers live in Will's Chrome": the store it names now holds his
  call answers too.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- `upcoming` · The lab and the kit: a lane's "Calls for Will" handed off as `usher/kit/calls.py` entries (the shape in
  `cut-lane.py`'s Handoff template), so the record adds them in one `calls.py add` and the door judges them as written.

## Handoff (replaces the chat report)

- **Commits**, pushed on `lp/calls-desk`: `6dc943faf` (the work), `0a0143196` (the walk's fixes); no sync:
  launch-prep moved only by crumbs-88's merge and records, none touching this lane's paths, and `git merge-tree` of the
  head against `origin/launch-prep` and against `origin/lp/crumbs-90` (which edits four files this lane comments in)
  is clean.
- **Gates on `0a0143196`**, each its own exit code (logs `../partyreel-wt/_scratch/calls-desk/gate-*.log`): typecheck 0;
  lint 0 (no warnings); test 0 (1,085 files, 13,731 tests); `build-lock.sh pnpm build` 0; `lab:smoke --base
  http://localhost:3133` 0 (scope all, for `lab-review.mjs`: 228 checks, 0 failing).
- **Lane check**: owned paths + this file, and `docs/systems/testing-verification.md` (the system-doc edit), and item
  5's pointers, comments and test titles only (one board string): `sandbox/create-wizard/spec.ts`;
  `api/host/r2/complete-upload/route.ts` and `.test.ts`; `api/r2/complete-upload/route.ts`, `.test.ts`,
  `.burst.test.ts`; `components/guest/camera/camera-panels.tsx`; `lib/content-policy.test.ts`;
  `lib/db/mutations/guest.ts`, `host-media.ts`; `lib/drive/lease-capture.test.ts`, `root-folder.test.ts`;
  `lib/events/album-sync.ts`, `.test.ts`, `album-wire.ts`, `.test.ts`; `lib/export/drive-names.ts`;
  `lib/guest/camera/words.ts`; `lib/media/capture-time.ts`, `.test.ts`, `strip-metadata-capture.test.ts`;
  `lib/shared/album-order.ts`, `.test.ts`, `use-live-poll.ts`, `.test.tsx`; `lib/upload/capture-time-migration.test.ts`,
  `server-pipeline.ts`, `uploader.capture.test.ts`, `uploader.ts`.
- **1. `docs/calls.json`**: `docs/calls.md` at `3ec66b8fe` word for word (a script checked every field against it): 14
  questions in its order, 16 calls by its themes, each call's `home` (the system doc that holds its fact), a question's
  "Or:" line split at its own semicolons into `alternatives` (X1 at its ", or"; X2's two ways kept as one, since both
  begin "keep Vercel out of the app"); `retired` holds the 327 ids ever used in the doc's history, never used again.
  Its rules (`src/lib/calls/calls.ts`, read at import): the cap of 30, unique ids, none retired, every field present,
  a line of 120 characters (a title and a "Change it if" one, a body and a recommendation three, an alternative two,
  at most four alternatives), questions first and then calls in the themes' order. `calls.test.ts` holds the file to
  them and checks every home exists.
- **2. The Calls place** (`/design/lab#calls`, `lab/calls/calls-place.tsx`), second on the desk after the boards'
  queue: open questions (each its recommendation, its alternatives, one press each, or his own words in its field),
  then calls by theme (Keep or Change, a Change's field taking his words and the focus); "Keep the other N" at the
  foot. A held answer is quiet (a muted fill and a check); a paste's mark reads "sent on <build>". Walked at 1440 and
  375, light and dark, by keyboard (the house halo on every control) in a headless Chrome of the lane's own.
- **3. One message a sitting**: the answers ride every composer as one `calls:` line (`composeSoFar`, so the desk's and
  each board spine's "Copy so far"; the end of the walk, never the dry run); `pnpm lab:review` checks each against the
  file (line and column; all or nothing with the boards' lines), writes nothing, and prints the routing list (each
  pick to build, his own words to weigh, a change to a ROADMAP line or a lane, a kept call free to leave with its home)
  and the one `python3 usher/kit/calls.py retire <ids>` once routed; a retired id is a re-send, printed and never
  refused; `--json` carries the list. `lab-review.test.ts` round-trips it.
- **4. `usher/kit/calls.py`** (`add <entry.json>`, `retire <id>...`, `check`; `--root`): the file's only writer. It
  refuses, writing nothing, a field missing, unknown or empty, a field past its lines, a theme not listed, a home that
  is not an existing `docs/systems/*.md`, an id malformed, open or used before, and the 31st entry; it places a new
  entry (a question after the questions, a call at the end of its theme) and writes what prettier writes.
  `calls.test.ts` runs it: each refusal, and its verdict equal to the desk's reader's on fourteen files.
- **5. Retired ids cited**: H1 (create-wizard's spec: the comment points at host-app.md's "The sole create path", the
  board's own line at "your calls' X1"), BE3 (drive-export.md, "Sending again never duplicates and never lies"), X7
  (twenty-four places; `capture-time.ts` at uploads-and-r2.md, "The capture time stays, never the place or the
  device"), X4 (guest-flow.md, "The conditional poll"), X8 (marketing-content.md's "No app required" line), BM1
  (disposable-mode.md, "Two doors take a shot back"). Left: `supabase/migrations/20261005200000_capture_time.sql`
  cites X7 (an applied migration is never edited: its md5 is the proof); Q5, E6, G4, H2, the reel engine's T1 and the
  mutations' "Server-mediated (H1)" are other lists' ids, never the calls'. Three open calls cite retired ids in their
  own words (L2 "AJ1, AR5", J2 "J4", M1 "M2"), kept word for word: they leave with the calls.
- **At the record** (yours): delete `docs/calls.md`; `track-manifests.test.ts`'s NEVER_OWNED `docs/calls.md` becomes
  `docs/calls.json` (written only through `usher/kit/calls.py`); point the runbook's "The calls lab"
  (`usher/kit/README.md`), the pickup (`orchestrator.md`'s two `docs/calls.md` lines) and STATUS's "calls lab's open
  questions" at the desk's Calls place; and place this in `docs/reviews/README.md`'s grammar, after `review library:`:
  `calls: <id>=<answer> "a note"; ...`: the answers at the desk's Calls place (`docs/calls.json`), no round, since an
  id is never used again. A call takes `keep`, or `change` with its note saying what instead; a question takes
  `recommended`, `alt<n>` (its n-th alternative) or `own` with his words as the note. `pnpm lab:review` checks each
  against the file and writes nothing: it prints where each goes and the `usher/kit/calls.py retire` to run once each
  is routed; an id already retired is a re-send, printed and never refused. (The glossary's "The desk" may name the
  calls too: `_data/glossary.ts`, one line.)
- Assets requested from Will: none
- Board ideas: the desk is long at a phone (the Calls place alone runs about 10,500 px at 375, the queue above it more):
  a desk whose answered sections fold to a line, or the calls walked as steps of the review like the boards' asks.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls for Will: none
- Test data: none (no account, event or row; the walk's browser profile is in the lane's scratch).
- Look at first: `/design/lab#calls` at 375 and 1440: keep a call, change one in your words, pick a question's
  alternative and answer one in your own words, press "Copy so far", then run the paste through `pnpm lab:review --dry`.
