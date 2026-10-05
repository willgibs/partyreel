---
track: crumbs-79
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d7405e3f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/faq-data
  - src/components/marketing/sections/features/album/album-copy
  - src/components/marketing/sections/features/album/album-faq
  - src/components/marketing/sections/features/album/how-much-fits
  - src/components/marketing/sections/pricing/comparison-table
  - src/lib/r2/stored-copies-policy.test.ts
  - src/lib/guest/use-gallery-doorbell.sql.test.ts
  - src/lib/db/queries/profile.private-count.test.ts
  - src/lib/jobs/spend-watch-migration.test.ts
  - src/lib/forensics/migration-guards.test.ts
  - src/lib/disposable/migration-guards.test.ts
  - src/app/(dev)/design/(shell)/lab/tools/
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/testing/migrations.ts
  - src/lib/events/dates.ts
  - src/lib/constants/marketing-voice.ts
---

# lp/crumbs-79

**Goal.** Four small ROADMAP crumbs: five marketing lines that say events have "no end date" say an end date only says when; the tests that read the migrations by hand read each function's winning body through testing/migrations.ts; the stored-copies policy stops reading comments as code; the boom tool's callout names its global-boundary probe; the camera's paragraphs move from guest-flow.md to disposable-mode.md.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3133 is yours; 3000 is Will's desk, never touched; 3130 is the Orchestrator's gate.

**The fixes:**
1. **Words:** five lines still say events have "no end date" (`faq-data.ts:47`, claim-fenced, its comment at :43; `features/album/album-copy.ts:156`; `features/album/album-faq.ts:48`; `features/album/how-much-fits.tsx:132`; `pricing/comparison-table.tsx:148`) where Settings offers "Add an end date": an end date only says when and never ends anything (an event never expires; deletion is the only exit). The voice is `marketing-voice.ts`'s; change only the fact, and keep any claim fence's test true.
2. **One migration reader:** `use-gallery-doorbell.sql.test.ts` and `profile.private-count.test.ts`'s `latestBody`, `spend-watch-migration.test.ts`'s `bodyOf`, and the forensics and disposable `migration-guards.test.ts` keep readers of their own: read each function's winning body through `src/lib/db/testing/migrations.ts`'s `liveFunction`, so a dropped function never reads as defined. Every assertion they make still runs.
3. **A scanner that reads comments as code:** `r2/stored-copies-policy.test.ts` loses its parse context after a template literal with a `${}` in it, so a comment naming `preview_key` reads as a reader of it; give it a real parse (the TypeScript compiler API the repo already has) or walk the AST.
4. **The boom tool:** its callout on `/design/lab/tools` and its nav entry name the bare probe only; say `?boundary=global` reaches `global-error.tsx`, as the probe's own page does.
5. **Docs:** the camera's asking (it asks a closed album again at 10 s, 20, 40, then each minute) and the door's camera paragraphs in `guest-flow.md` belong in `disposable-mode.md` (the camera's one home): move them, one home each.

Wiring rigor: the whole gate, and `lab:smoke` (the tools page).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed under the Handoff's calls as his to overrule; none is a one-way door.

- **What does the Free column say in place of "No end date"?** Recommended: "Never expires" (`how-much-fits.tsx`), the
  product's own sentence (Settings: "events never expire"; the help plan article: the free plan "never expires on its
  own"), with the idle rule carried by the same page's "Free albums need a visit" note. The alternative is the pricing
  table's Free word, "Kept while in use", which is truer in the column and says less to a host comparing plans.
- **"Never expires" or "no date ever ends it" in the pricing tip?** Recommended: "no date ever ends it" there only
  (`comparison-table.tsx`), since the sentence before it is the idle removal and "never expires" beside it reads as a
  contradiction; everywhere else the short line is "never expires" (the marketing-content doc's own).
- **The nav entry sits in `_data/nav.ts`, which `owns` does not list.** Recommended: one line there (the boom entry's
  `note`), the exception PROGRAM allows, named in the lane check.
- **Should the lab's Tools section link to its index?** Recommended: yes, one `href` on the section (nothing links to
  `/design/lab/tools` today and `lab:smoke` never visits it). Deferred, not done: it is a second line in `nav.ts`.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the camera's asking (a sub-bullet of "The upload act") and the door's camera paragraph
  (the tail of "The upload step lives in this sheet", with its wait-chooser sentence) are gone from it; the keep's
  "below" now points to `disposable-mode.md`, the door step keeps one signpost sentence, and the NOT HERE line names
  the camera's home.
- `docs/systems/disposable-mode.md`, "The guest's camera": three bullets, the asking, the door's first photograph
  (never chosen from the library; the door holds the camera; the held door's wait chooser still offers it), and the
  page half, which merges the one short bullet that said part of it with the door paragraph's rest.

## Deferred (ROADMAP one-liners, bucket named)

- Engineering: the rest of the tests that read `supabase/migrations/` by hand (`grep -l "supabase/migrations" src`, less
  `testing/migrations.*`, the six this lane moved and the three guard tests that already use it) read each function's
  winning body through `testing/migrations.ts`'s `liveFunction`, so a dropped function never reads as defined.
  (Replaces the line that names the five.)
- Lab: nothing links to `/design/lab/tools` (the nav's Tools section has no `href`), so the index is reached by its URL
  alone and `lab:smoke` never visits it; give the section the index as its `href`.
- Code hygiene: comments in `constants/tiers.ts` (the anti-abuse why), `event-settings/delete-event-row.tsx`,
  `constants/events.test.ts`, `content/blog-keep-lines.test.ts` and `app/group-not-found.lazy.test.tsx` still say events
  have "no end date" in the lifecycle sense; say "never expires", since Settings' end date only says when.
- Marketing: the album page's Free bullet, its Stays step and FAQ and the pricing table's Kept row each say the keep
  rule by hand (the five stale lines were that drift); one home lets a lifecycle change land once.

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-79`:** the work is `0821c0a27`; this manifest is the commit after it (the head,
  in the chat line). No sync: `launch-prep` moved by two record commits since the base `102f64379` (`3cfd7ae27`, only
  `docs/tracks/orchestrator.md`: `git diff --name-only HEAD...origin/launch-prep`), which PROGRAM says never need one.
- **Gates on `0821c0a27`'s tree** (this manifest changes nothing else), each its own exit code, logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-79/`: typecheck 0 (`final-typecheck2.log`); lint 0, no warning
  (`final-lint.log`); test 0, 952 files and 11,908 tests (`final-test.log`); build 0 through the lock (`final-build.log`);
  `lab:smoke --base http://localhost:3133` 0, 198 checks, 0 failing (`final-smoke.log`; scope all, since `nav.ts`
  changed). ★ The smoke never visits `/design/lab/tools` (nothing links to it; Deferred), so the page was fetched
  directly: 200, the callout and the Error boundary card name both probes, the bare probe answers 500 and
  `?boundary=global` 200 as the smoke expects. `lab:smoke` also prints a PREMISE: `customize`'s four open asks (roll,
  home, mine, order) describe `disposable-mode.md`, which this change touched, so re-read them before his next
  sitting (only prose moved and merged there; no behaviour changed).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths, the two new tests in
  `lab/tools/` and this file, plus ONE exception: `src/app/(dev)/design/_data/nav.ts`, one line (the Error boundary
  entry's `note`, line 94), because fix 4 names "its nav entry" and `owns` lists only the `lab/tools/` folder.
  (`pnpm format` rewrites another hunk of that file, `buildSearchIndex`'s board entry, which is not prettier-clean: it
  was put back by hand, so the diff is the one line.)
- **1 Words** (`faq-data.ts`, `album-copy.ts`, `album-faq.ts`, `how-much-fits.tsx`, `comparison-table.tsx`): the five
  lines say "never expires" ("no date ever ends it" in the pricing tip); the FAQ's comment says why; `faq-data.test.ts`
  gained "no end date" in the fence it already holds beside "expiry clock" (mutation: the old words fail it). Rendered
  locally: `/` (accordion and JSON-LD), `/features/album` (Free column, Stays step, FAQ JSON-LD), `/pricing` (the tip),
  none says "no end date" now.
- **2 One migration reader** (the five files): every function body is `liveFunction(name).code`, and their file-level
  text is `executableMigrations()`, so none of the five reads `supabase/migrations/` by hand any more (the reader is
  `testing/migrations.ts`, untouched). Same tests by name before and after (40, 11, 5, 5, 4; baseline
  `_scratch/crumbs-79/baseline-names.json`), the reshaped one named: spend-watch's seed pin is whitespace-collapsed
  (`insert into ... values (...), (...), (...) on conflict (key) do nothing;`), same facts. Proof the old readers and
  `liveFunction` agree on the real set: `node --no-warnings _scratch/crumbs-79/compare-readers.mjs` compares the 33
  function bodies the five files read with what each old reader returned, ALL AGREE (the same text and winning file
  for 29; for the other four, spend-watch's two, the profile body and `restore_media`'s block, the old slice or the
  phrases its tests look for). ★ Proof of the point: a scratch migration (deleted, never committed) dropping seven of
  those functions made the five files fail with "public.X is not live: 99999999999999_scratch_drops.sql drops it" (13
  tests, and `profile.private-count` at collection), while HEAD's versions of the same five files passed all 65.
- **3 The scanner** (`stored-copies-policy.test.ts`): `codeOfText` parses with `ts.createSourceFile` (the ScriptKind
  idiom of `row-cap-policy.test.ts`) and walks the tokens, skipping JSDoc; the bare `createScanner` is gone. Measured
  over the 1,690 files the policy walks (`_scratch/crumbs-79/leak-count.mjs`): the scanner read a comment's words as
  code in at least 453 (a comment word of ten letters or more in its stream and not in the real code; after any
  template with a `${}`, or a regex holding a backtick), and no policy verdict changes with the parse (only
  `r2/keys.ts` stops counting as a reader: its `preview_key` and `phone_key` were comment text); no token of the walked
  tree overlaps a comment now (28,046 comment ranges, `leak-check.mjs`). End to end: a scratch source whose comment names `preview_key` after a
  template made the OLD reader fail rule B naming it, and the new one stays green. Five tests pin the reader (a comment
  after a `${}` template, nested templates, a regex with a backtick, JSDoc in ts, tsx and mjs, and what still counts); the
  first four fail on the old scanner and the JSDoc one fails without its skip. Its SQL half (rule C) reads
  `liveFunctions()` per overload where it kept its own by-name replay (same 9 readers of `preview_key`).
- **4 The boom tool:** `/design/lab/tools`' callout and the nav note name `?boundary=global` and `global-error.tsx`
  beside the bare probe; the index draws a `?query` or hyphenated name in one piece (`Words`: before it a line broke
  after the `?` or after `global-`, whichever the width chose), measured at 375, 640, 768, 1024 and 1280 in the Browser
  pane (both names whole at each; the callout's too, at 375);
  `tools-index.test.tsx` and `page.test.tsx` pin the held names and the callout's three names in order (mutation: plain
  notes fail the first).
- **5 Docs:** the camera's asking and the door's camera paragraphs live in `disposable-mode.md` (see System-doc edits),
  every fact checked against the code on the way (`REASK_MS`, `LIFTABLE_REFUSALS` in `album-camera.tsx`;
  `keepDue && !cameraOpen` in `entry-modal.tsx`); the ROADMAP's own line on the wait chooser still offering the library
  stays true and its sentence moved with them.
- **ROADMAP lines this lane retires** (the Orchestrator deletes them): the Docs one (the camera's asking), the Errors
  one (the boom tool), the Tests one (`stored-copies-policy`), the Marketing one (five lines), and the Engineering line
  that names the five tests, replaced by the Deferred one above.
- Assets requested from Will: none
- Board ideas: none beyond the Deferred lines
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule: "Never expires" on the Free column and the Stays step (his alternative: "Kept while in use"); "no
  date ever ends it" in the pricing tip; the scope extras, each small and each reversible (file-level reads on
  `executableMigrations()`, rule C on `liveFunctions()`, `Words` and the two lab tests, the FAQ fence's new clause).
- Look at first: `/design/lab/tools?key=...` at a desk and at a phone (the Error boundary card, then "It throws on
  purpose"); then `src/lib/r2/stored-copies-policy.test.ts` (the last describe is the reader's contract) and the drop
  proof above (a file that drops `public.album_doorbell(uuid)` fails `use-gallery-doorbell.sql.test.ts`).
