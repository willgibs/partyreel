---
track: crumbs-48
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f4b045b3"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/library/page.tsx
  - src/app/(dev)/design/(shell)/library/index-list
  - src/components/social/relation-toggle.test.tsx
  - src/components/guest/password-gate.test.tsx
  - src/components/shared/not-found-screen.tsx
  - content/help/how-guests-join-and-upload.mdx
  - content/help/create-your-first-event.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - src/components/guest/door/
  - src/components/app/create-event-wizard.tsx
  - src/components/guest/password-gate.tsx
  - src/components/social/relation-toggle.tsx
  - src/components/lab/step.tsx
---

# lp/crumbs-48

**Goal.** Five ROADMAP crumbs from the night's lanes, none on a surface a waiting board draws: the Library's own links stop prefetching, two load-flaky tests steadied with their intent kept, two help articles brought up to the doorway and the wizard as built, and a stale comment.

## The brief

Each item is a ROADMAP Now line; read it there whole and name each in your Handoff for the record. Seven boards wait on Will's desk: touch nothing they draw (the files below are checked clear of every board's `lives`).

1. **The Library's links** (ROADMAP: "The lab: the Library's own links prefetch by default"): `library/page.tsx` (twice) and `library/index-list.tsx` take `prefetch={false}`, as `LabLink` and the step page's links have since `lab-prefetch`, so a Library index visit stops sending about 226 keyed prefetches.
2. **Two tests that flake under load:**
   - `src/components/social/relation-toggle.test.tsx`'s "every other flip acts at once" (no call to the follow spy at 1,048 ms in a loaded full run);
   - `src/components/guest/password-gate.test.tsx`'s "a stalled hold turns the button into Retry" (no "Open the album" button found in a loaded run).

   Both pass alone. Steady each with fake timers or a wait that matches what it waits for, keeping exactly what each asserts. Prove it by running each 20 times under load, with a build running beside it through `zsh scripts/build-lock.sh`, all green.
3. **Help: `how-guests-join-and-upload.mdx`** (ROADMAP: "still says one sheet over the blurred album"). Since door-wiring, the welcome, the ask and the wait are the doorway's page, and the waiting door has a photo chooser. Read `guest-flow.md` and `src/components/guest/door/`, and say what a guest sees now, in the help's voice.
4. **Help: `create-your-first-event.mdx`** (ROADMAP: "still names the wizard's steps Details, Design and Share"). They are Name, Style and the beat with Get it ready since ready-wiring; its Step 3 paragraph is current.
5. **`shared/not-found-screen.tsx`'s head comment** (ROADMAP: "counts the guest's bad-link 404 and its private lock among its call sites"). Both wear the doorway now. Change the comment only.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131` (the Library); the two tests 20 times each under a concurrent build, all green; the two help pages read at 1440 and 375 in a headless Chrome of your own.

## Questions (a recommended answer each; the Orchestrator relays them)

- none

## System-doc edits (in place, owned facts only)

- none. `docs/systems/design-system.md`'s lab paragraph ("No keyless request may leave the lab's tab") wants the Library's front page named beside `LabLink` among the links that say `prefetch={false}`, but the doc is in the `identity` board's `lives` (`lab:smoke`'s premise line named it), so the edit was made in `188623cf` and put back in `bd7e812e`; the clause rides the first Deferred line.

## Deferred (ROADMAP one-liners, bucket named)

- The lab: `_shell/prefetch-policy.test.ts` scans the shell, the lab's pages and the kit but not the Library, so `library/page.tsx` and `library/index-list.tsx` (three links, now `prefetch={false}`) are unheld, and `gallery/gallery-ui.tsx`'s `EntryBlock` still draws a prefetching title link and `open` link per entry, so a family page (`/design/library/components`) sends 70 keyed prefetch requests a visit on a production build; scan those three files, set the last two links to `prefetch={false}`, and name the front page in design-system.md's lab paragraph in the same change, after `identity` leaves the desk (from `crumbs-48`).
- Help: `messages-guests-might-see.mdx` ("The sheet says the host will let you in"), `require-verified-emails-explained.mdx` ("the welcome screen with the newest photos blurred behind it") and `what-guests-can-and-cant-see.mdx` ("behind the welcome screen") still draw the door as it was before `door-wiring`: the welcome and the wait are the doorway's page (from `crumbs-48`).
- Code hygiene: `shared/route-error.tsx`'s comment counts `NotFoundScreen`'s 404s as six and the crashes as five; `not-found-screen.tsx`'s head now lists its call sites with no number, so say it that way there (from `crumbs-48`).

## Handoff (replaces the chat report)

- **Commits, pushed** to `origin/lp/crumbs-48`: `188623cf` (the six ROADMAP lines), `bd7e812e` (design-system.md back as it was, see System-doc edits), `2ff4d050` (two wording fixes in the join help and the Library comment's count). launch-prep had not moved (`fac83f3c` at the last fetch), so there is no sync commit. The head is in the chat line and adds only this manifest.
- **Gates** on `2ff4d050`, each on its own exit code, logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-48/`: `pnpm typecheck` 0 (`final2-typecheck.log`); `pnpm lint` 0, no warnings (`final2-lint.log`); `pnpm test` 0, 746 files and 8,884 tests (`final2-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`final2-build.log`); `pnpm lab:smoke --base http://localhost:3131` 0, 116 checks, 0 failing, scope Library and no board, no premise line (`final2-smoke.log`). The same five ran green on `188623cf` first (`gate-*.log`, `gate-build-1.log`, `gate-smoke.log`); `gate-smoke.log` is the run whose premise line sent design-system.md back.
- **Doc-check**: Next 16.2.6's own prefetching guide (`node_modules/next/dist/docs/01-app/02-guides/prefetching.md`: viewport prefetch is the default, production only, `prefetch={false}` ends it) and React 19.2.4's `act` (`node_modules/react/cjs/react.development.js`, `flushActQueue` and the sync exit).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the seven owned files and this manifest, no exception:
  `content/help/create-your-first-event.mdx` · `content/help/how-guests-join-and-upload.mdx` · `src/app/(dev)/design/(shell)/library/index-list.tsx` · `src/app/(dev)/design/(shell)/library/page.tsx` · `src/components/guest/password-gate.test.tsx` · `src/components/shared/not-found-screen.tsx` · `src/components/social/relation-toggle.test.tsx` · `docs/tracks/crumbs-48.md`
- **The items** (each ROADMAP Now line, named for the record):
  1. "The lab: the Library's own links prefetch by default": `prefetch={false}` on `library/page.tsx`'s two links (the four family cards, the recipe's links) and `library/index-list.tsx`'s row link, each with its why (`188623cf`). Measured on a production build in a headless Chrome of mine, scrolled once top to bottom: `/design/library` sent 230 prefetch requests (all keyed) with the old files and 0 with the new; controls on the same builds did not move (`/design/library/components` 70 both times, `/design/library/patterns` 38, the marketing home 96); 0 console errors, no 4xx or 5xx (`proof-summary.txt` E, `before-build.log`, `final2-build.log`).
  2. "Tests: `relation-toggle.test.tsx`'s every other flip acts at once": the failing call was the unfollow spy, not the follow spy the line names. The test pressed Following the moment its optimistic label showed, while the Follow flip was still in flight, and a flip in flight takes no second press (the file's next test), so a loaded run lost the press. It now waits for the flip to land (the control's busy state going) before pressing; every assertion kept (`188623cf`). The same race sat in "a refused flip springs back" (the spring-back read the instant the toast was heard), which waits for it too.
  3. "Tests: `password-gate.test.tsx`'s a stalled hold turns the button into Retry": not slow but stuck. The unlock's transition still had its last render due when the stall's plain-`act` rerender ran; React ended that act with work left over (its own warning, "A component suspended inside an `act` scope, but the `act` call was not awaited") and the Retry was never drawn, absent after ten seconds, so the line's wider wait or fake timers would not have steadied it. The stall is now rendered through an awaited `act`; every assertion kept (`188623cf`).
     - Proof as asked: 24 green of 24 for each of the two while the gate's build ran (`underload2.log`), and 20 of 20 beside the whole suite at load average 15 on 14 cores (`underload3.log`). The pre-fix copies also passed all of those, so real load did not separate old from new in these windows (the flake is rare). A scratch scheduler does, with no CPU burned: 40 of 40 failed before and 0 of 60 after for relation-toggle (P=1 MS=15 Q=0.5 JUMP=60), 14 of 100 failed before and 0 of 100 after for password-gate (P=0.5 MS=6 Q=0.2 JUMP=30), and 240 of 240 green under two harsher settings (`proof-summary.txt` A to F, failing outputs in `logs/*-fail-*.log`). Before the fix, 40 of 40 root states read `pendingLanes=256` at the stall and the 6 of 40 that failed ended `pendingLanes=32` with 4 callbacks left on the act queue (D).
  4. "Help: `how-guests-join-and-upload.mdx`": the welcome, `Ask to join` and the wait are the door's own page (a door open on the album's photos; shut, with no photos and perhaps no host named, where the album stays out of sight; ajar at the wait), every other step a sheet over the blurred album or the shut door; the waiting door's `Choose what you'll add` (it goes in the moment you are let in; keep the tab open); a signed-in guest's `Ask to join` and the invite list's shut door in a paragraph under the steps (a `<Step>` body shows its paragraphs with no gap, so the rare cases sit outside it); the password step says the door stays shut; `updated` 2026-10-02 (`188623cf`, `2ff4d050`). Read at 1440 and 375 in a headless Chrome of mine against the picture beside each step, no horizontal overflow (`shots/join-*`).
  5. "Help: `create-your-first-event.mdx`": the description and the three headings name Name, Style and Ready as the wizard's stepper reads (`STEP_LABELS`); the paragraphs untouched, Step 3's already current (`188623cf`). Read at 1440 and 375 (`shots/cfe-*`).
  6. "Code hygiene: `shared/not-found-screen.tsx`'s head": the comment lists the call sites that exist (the site's and the cinema group's 404 through `MarketingNotFound`, the host app's, the operations portal's, a guest profile's, the admin host's refused path, the renewal's two dead ends, every render crash) and says the guest link's two dead ends wear the doorway; the count and "two marketing group 404s" are gone. Comment only (`188623cf`).
- **Assets requested from Will**: none
- **Board ideas**:
  - Tests: the scratch scheduler reproduced both flakes in minutes with no CPU burned, and found a third race in relation-toggle. A setup file that runs before react-dom loads (React's scheduler captures `setImmediate` at load), turns a fraction of `setImmediate` calls into 1 to 7 ms timers so React's flushes land after due timers, and makes `performance.now()` jump forward on some calls (a starved process's clock), run with `vitest --config` on a copy of the component project: about 30 lines, in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-48/chaos.setup.ts` and `chaos.config.ts` until the lane is pruned. A line in `testing-verification.md` or a kit script would let the next load flake be reproduced instead of waited for.
  - The lab: a prefetch count per Library page on `next start` (headless Chrome, requests carrying Next's prefetch header, `prefetch.mjs` in the same folder), beside the ROADMAP's "lab:demo against a locked build" line: it found 230 and 70 in minutes and would hold a page to a number.
  - Help: a `<Step>` body of two paragraphs renders with no gap between them (`spec-shared.tsx`'s `not-prose` wrapper zeroes the margins), so a long step reads as one block; give the paragraphs a gap, or say one paragraph a step in `content/help/AUTHORING.md`.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none
- **Calls his to overrule**:
  - The create article's third step is "Ready", the stepper's own label, where the brief says "the beat" (the code's word); its first heading "The name" is "Name" to match (no article links to either anchor).
  - The join article draws the door in the pictures' terms ("a door, standing open", "ajar", "shut") and keeps the secondary cases in a paragraph under the steps, not in the wait step.
  - The not-found head comment also adds a guest profile's 404 and the renewal's two dead ends (call sites its old list never had) and drops its count, beyond the two entries the ROADMAP named.
  - "A refused flip springs back" is steadied with the two the ROADMAP named: the same race, one `waitFor`.
  - No pin test for the Library's links: the scan that holds the lab's is another lane's file, and a second scan beside it would be two homes (first Deferred line).
- **Look at first**: `/help/how-guests-join-and-upload` (steps 2, 3 and 7, and the two paragraphs under the steps) and `/help/create-your-first-event` (the lead and the three headings); then `git show 188623cf -- src/components/guest/password-gate.test.tsx` for the act finding.
