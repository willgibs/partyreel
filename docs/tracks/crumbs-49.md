---
track: crumbs-49
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "16f85a7f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/messages-guests-might-see.mdx
  - content/help/require-verified-emails-explained.mdx
  - content/help/what-guests-can-and-cant-see.mdx
  - src/components/shared/route-error.tsx
  - src/app/(dev)/design/gallery/gallery-ui.tsx
  - src/app/(dev)/design/(shell)/_shell/prefetch-policy.test.ts
  - src/lib/history-entry.test.tsx
  - src/lib/utils.test.ts
  - src/lib/test-utils/german-runtime
  - src/lib/content/help-ui-labels.test.ts
  - src/app/(guest)/u/[slug]/owner-mode.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - src/components/guest/door/
  - src/components/shared/not-found-screen.tsx
  - src/app/(dev)/design/(shell)/library/
  - src/lib/history-entry.ts
  - src/app/(guest)/u/[slug]/owner-sections.tsx
---

# lp/crumbs-49

**Goal.** Seven more off-board crumbs from the ROADMAP's Now list: three help articles brought to the doorway, a stale comment, the Library held by the prefetch policy (and the gallery's title link), a load-flaky history test, one German-runtime helper instead of two, the help-label test's source scan, and the owner-mode reader list.

## The brief

Each item is a ROADMAP Now line; read it there whole and name each in your Handoff for the record. Seven boards wait on Will's desk: touch nothing they draw (every file below is checked clear of every board's `lives`).

1. **Help** (ROADMAP: "`messages-guests-might-see.mdx` (\"The sheet says the host will let you in\")…"): the three articles still draw the door as it was before `door-wiring`. Read `guest-flow.md` and `src/components/guest/door/`, and say what a guest meets now: the doorway's page, the ask, the held door and its chooser. Keep the privacy exactly as built: the doors the host answers name her, a password door names the album, a shut door names nothing.
2. **Code hygiene** (ROADMAP: "`shared/route-error.tsx`'s comment counts `NotFoundScreen`'s 404s as six…"): say it as `not-found-screen.tsx`'s head now does, with no number.
3. **The lab** (ROADMAP: "`_shell/prefetch-policy.test.ts` scans the shell, the lab's pages and the kit but not the Library…"): the policy scans the Library too. Fix `gallery/gallery-ui.tsx`'s `EntryBlock` title link, and anything else the widened scan finds, to `prefetch={false}`.
4. **Tests** (ROADMAP: "`history-entry.test.tsx`'s \"lets go of the flag when the Back has landed\" failed once…"): steady it with its assertion kept. Prove it 20 times under a concurrent build, all green.
5. **Code hygiene** (ROADMAP: "`utils.test.ts`'s inline German-runtime helper … are one simulation twice"): one helper, both tests on it.
6. **Tests** (ROADMAP: "`help-ui-labels.test.ts` reads `src/app/(dev)/` as shipped source…"): the label check reads shipped source only, so a lab board quoting a retired string can no longer mask a stale help label. Name what it caught, if anything.
7. **Tests** (ROADMAP: "`owner-mode.test.ts`'s allowed-reader list could name `listEvents`"): name it, so the regexes hold the owner-RLS read `owner-sections.tsx` makes.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133` (the Library and the gallery); the history test 20 times under a concurrent build, all green; the three help pages read at 1440 and 375 in a headless Chrome of your own.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

- **Item 7: name `listEvents` in `owner-mode.test.ts`'s allow-list?** Recommended and built: no. The ROADMAP line is stale: `owner-sections.tsx` has made no `listEvents` read since `crumbs-38` (`ec9fe824` took the host arm off `get_my_uploads`' `is_host_upload`), so a name in the list would allow a read nobody makes, and unseen, since the old regexes see `get*` calls only and `listEvents` passed them with or without a name. Built instead: the test reads every name the file imports from `@/lib/db/` and `@/lib/supabase/` (a TypeScript parse, so an alias or a namespace import cannot hide) and the list is exact, so a re-added `listEvents` fails until it is named there, once it answers for the caller alone. Overrule: add `listEvents` to `ALLOWED`.
- **Item 6: skip `src/components/lab/` as well as `src/app/(dev)/`?** Recommended and built: yes. The kit is imported only by `(dev)` and `scripts/new-board.mjs` and speaks only of the lab, so it is as unshipped as a board; it masks nothing today either way. Overrule: drop `|\/components\/lab\/` from `SKIP` and its pins in `help-ui-labels.test.ts`.
- **Item 5: one function or two?** Recommended and built: `runAsGermanRuntime` (numbers and dates) beside `runAsGermanNumberRuntime`, both on one mechanism (`methodInGerman`, `formatterInGerman`). The three number tests that call the number-only name (`count.test.ts`, `tiers.test.ts`, `pricing-counts.test.tsx`) are outside `owns` and stay as they are; a count test wanting only numbers is a fair narrower simulation. Overrule: move those three imports to `runAsGermanRuntime` and drop the number-only entry.
- **Item 2: only the one comment?** Recommended and built: the same file's two other counts said the same way (`the five groups' and the root's` was wrong: four groups and the root; `five boundaries`). Comments only.

## System-doc edits (in place, owned facts only)

- none. `design-system.md`'s lab paragraph ("No keyless request may leave the lab's tab") is in `identity`'s `lives`; its clause rides the first Deferred line.

## Deferred (ROADMAP one-liners, bucket named)

- The lab: `design-system.md`'s lab paragraph ("No keyless request may leave the lab's tab") names `LabLink`, the step and the doc reader among the links that say `prefetch={false}`, and not the Library's front page and the gallery's entry links (`prefetch-policy.test.ts` has held both since `crumbs-49`); name them in that paragraph after `identity` leaves the desk, the doc being in its `lives` (from `crumbs-49`).
- Help: `why-an-event-asks-for-your-email.mdx` still says the album "sits behind the welcome screen" and that "the welcome screen stays in front of it" (its lines 22 and 48): the welcome is the doorway's page and the preview waits behind the steps' sheet, as `require-verified-emails-explained.mdx` says since `crumbs-49` (from `crumbs-49`).
- Tests: `src/lib/guest/reel-url-history.test.tsx`'s "comes back with a Forward, and that entry is still ours to close" waits a fixed 40 ms after `history.back()` and again after `history.forward()`, the mechanism that made `history-entry.test.tsx` flake (jsdom lands a traversal two timer hops after the call); wait for the popstate, as `pressAndWaitForPopstate` in the same file does (from `crumbs-49`).
- Code hygiene: `src/lib/guest/entry-steps.ts`'s head still calls the door "ONE HELD SHEET WITH NO EXIT" with the album blurred behind it the whole way; since `door-wiring` the welcome, the ask and the wait are the doorway's page and the other steps are the sheet (from `crumbs-49`).

## Handoff (replaces the chat report)

- **Commits, pushed** to `origin/lp/crumbs-49`: the work commit `bd3cf297` (all seven items; its message names each); the head adds only this manifest. launch-prep moved once since the cut, by a record commit (`2e8bffb8`, `usher/moltbook/README.md`, no code), so there is no sync commit.
- **Gates** on `bd3cf297`, a clean tree, each on its own exit code, logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-49/` (every other artifact named below, the shots, loops, scripts and measurements, is in that folder too, until the lane is pruned): `pnpm typecheck` 0 (`final-typecheck.log`); `pnpm lint` 0, no warnings (`final-lint.log`); `pnpm test` 0, 747 files and 8,906 tests (`final-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`final-build.log`); `pnpm lab:smoke --base http://localhost:3133` 0, 116 checks, 0 failing, scope Library and no board (`final-smoke.log`). The same ran green before the commit (`pre-typecheck.log`, `pre-lint.log`, `pre-test.log`, `smoke-1.log`).
- **Doc-check**: Next 16.2.6's `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` (App Router `prefetch={false}`: never on viewport, never on hover); vitest 4's `vi.spyOn` (Context7: a spied class needs `function` or `class`, an arrow's mock refuses `new`, which is why `utils.test.ts`'s date helper could not be `new`ed); jsdom 29.1.1's `lib/jsdom/living/window/SessionHistory.js` (`traverseByDelta` queues two 0 ms timeouts).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the twelve owned paths and this manifest, no exception: `content/help/{messages-guests-might-see,require-verified-emails-explained,what-guests-can-and-cant-see}.mdx` · `src/components/shared/route-error.tsx` · `src/app/(dev)/design/gallery/gallery-ui.tsx` · `src/app/(dev)/design/(shell)/_shell/prefetch-policy.test.ts` · `src/lib/history-entry.test.tsx` · `src/lib/utils.test.ts` · `src/lib/test-utils/german-runtime.ts` and its new `.test.ts` · `src/lib/content/help-ui-labels.test.ts` · `src/app/(guest)/u/[slug]/owner-mode.test.ts` · `docs/tracks/crumbs-49.md`.
- **The items** (each ROADMAP Now line named for the record):
  1. "Help: `messages-guests-might-see.mdx` ('The sheet says the host will let you in'), `require-verified-emails-explained.mdx` … and `what-guests-can-and-cant-see.mdx` ('behind the welcome screen')": the three say what a guest meets since `door-wiring`. The welcome is a door standing open on the album with its newest photos showing through; the ask is the door shut, the host's name over it; the wait is the door ajar with its chooser (`Choose what you'll add`, `Nothing is sent until you're let in.`, keep the tab open); every other step rises over it as a sheet and the preview waits behind that sheet. The privacy as built: a password door names the album and counts it, never the host; the doors the host answers name the album and the host, never the date; a shut door's message names nothing (the invite list's own foot names the host it asks). Checked against `door/*.tsx`, `guest-flow.md` and `page.redaction.test.tsx`, and against the help center's own pictures of the door (`shots/join-step-1.png`, `shots/join-wait.png`). The three read at 1440 and 375 in a headless Chrome of mine: no horizontal overflow, 0 console errors (`help-shots.mjs`, `shots/*-1440-*`, `shots/*-375-*`). `updated` 2026-10-02; one `description` made exact ("a gated album's photos before its door opens", since the doors the host answers also name her).
  2. "Code hygiene: `shared/route-error.tsx`'s comment counts `NotFoundScreen`'s 404s as six": the comment says the product's dead ends with no number, as `not-found-screen.tsx`'s head does; two more counted comments in the file said the same way (see Questions). Comments only.
  3. "The lab: `_shell/prefetch-policy.test.ts` scans the shell, the lab's pages and the kit but not the Library": it scans the Library's pages and the gallery's chrome now, and not the Library's `*-demos.tsx` specimens, which draw production as production draws them (the `PrefetchGuard` answers those; `lab/kit/kit-demos.tsx` stays read, a pin says so). Red first: it found exactly `gallery-ui.tsx:45` and `:50`, `EntryBlock`'s title and `open` links, now `prefetch={false}` with their why; nothing else; a mutation of `library/index-list.tsx` is caught too. Measured on a production build in my headless Chrome, scrolled once top to bottom (`prefetch-count.mjs`, `prefetch-before.txt`, `prefetch-after.txt`): `/design/library/components` sent 70 prefetch requests with the old file and 0 with the new, 0 console errors and no 4xx/5xx either way; the control `/` sent 96 on both builds, and `/design/library` sent 0 on the new one (crumbs-48's own fix). `/design/library/patterns` still sends 12, all specimens' own links (`/privacy` 7, `/terms` 4, a `href="#"` 1), which are the guard's.
  4. "Tests: `history-entry.test.tsx`'s 'lets go of the flag when the Back has landed' failed once": not a thin margin but a race. jsdom lands a Back two timer hops after the call, and `settle()` slept a fixed 40 ms: a loop starved past 40 ms once the sleep's timer existed ran the sleep before the second hop was due, and the address was read as `?open`. Reproduced with a busy wait standing in for the starved process (`expected '?open' to be ''`, the gate's own failure), then fixed at the helper every test in the file shares: `settle()` waits for the Back's popstate, with a 3 s budget and its own message, every assertion kept. Two pins: the starved loop (red on the old helper with that very message, `?open` where `''` was due) and a Back that never lands. Proof as asked: 20 of 20 green while the gate's build ran (`loop2/summary.txt`: build 1 exit 0, load average 6.0 to 7.1 on 14 cores, 40 tests each); the pre-fix copy also passed its 20 of 20 beside it, so real load did not separate old from new (an earlier window, 8 rounds each, the same: `proof-history-window1-summary.txt`); the starved-loop pin does.
  5. "Code hygiene: `utils.test.ts`'s inline German-runtime helper … one simulation twice": `german-runtime.ts` is the one home (`runAsGermanRuntime` for numbers and dates, `runAsGermanNumberRuntime` for the three count tests that keep it), `utils.test.ts` imports it, its inline copy is gone, and the date half is now `new`-able and covers `toLocaleTimeString`. The helper has its own test (`german-runtime.test.ts`, 6 tests: German where no locale is named, the named locale kept, `new` and bare calls, options through, the real runtime back after `vi.restoreAllMocks()`). A mutation of `formatEventDate` to a bare `toLocaleDateString` fails `utils.test.ts` under it ("1. Juni 2026").
  6. "Tests: `help-ui-labels.test.ts` reads `src/app/(dev)/` as shipped source": it skips the lab (`(dev)/` and `components/lab/`), with path pins that hold whatever the repo contains. **It caught nothing**: of 601 `<UiLabel>`s (the four this lane added included) none is matched only by the lab, its kit or the test utilities (`labels/report.txt`); an end-to-end mutation shows the point (a label only the lab quotes passes the old scope, fails the new one).
  7. "Tests: `owner-mode.test.ts`'s allowed-reader list could name `listEvents`": see Questions, the stale premise. The old guard stays green (9 of 9) with `listEvents` re-added to `owner-sections.tsx`; the new one fails and names it (mutation, restored byte for byte).
- **Assets requested from Will**: none
- **Board ideas**:
  - Tests: the history flake is reproduced with no load at all by a synchronous busy wait between the call that asks for an async landing and the wait for it (the first pin in `history-entry.test.tsx`); a line in `testing-verification.md` would let the next timer-order flake be pinned the same way instead of waited for (the chaos scheduler crumbs-48 suggested is the other half).
  - The lab: `prefetch-count.mjs` and `cdp.mjs` (about 110 lines, no dependency beyond Chrome and Node's WebSocket) in the scratch folder count a page's prefetch requests on `next start`; crumbs-48's "a prefetch count per Library page" board idea is that script, and would hold `/design/library/*` to a number.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none
- **Calls his to overrule**: the four under Questions (item 7's not naming `listEvents`; the lab kit skipped beside `(dev)/`; two German entry points; item 2's two extra comments).
- **Look at first**: item 7's call, then the three articles' door wording (`content/help/*.mdx`, the diffs are small), then `history-entry.test.tsx`'s two pins. ROADMAP's `route-error.tsx` line (22) carries a stray `## Handoff (replaces the chat report)` heading glued to its end; it retires with this lane.
