---
track: crumbs-6
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4982f2ab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/password-gate
  - src/components/guest/upload/failure-sheet
  - src/components/guest/upload/stack-tile
  - src/components/guest/upload-step
  - src/components/guest/gallery-empty-state
  - src/components/guest/guest-header
  - src/components/guest/reel/live-reel
  - src/components/marketing/sections/features/privacy/access-switch
  - src/components/marketing/sections/features/album/how-much-fits
  - src/components/marketing/mock-parity.test.ts
  - src/components/marketing/chrome/marketing-footer
  - src/components/app/report-review
  - src/components/admin/moderation-grid
  - content/help/an-upload-wont-finish.mdx
  - content/help/how-guests-join-and-upload.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/voice-guest.json
  - docs/systems/guest-flow.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-6

**Goal.** Small, straight fixes: voice-guest round 1's three new lines and the mocks that quote them, the footer's demo link on a phone, the reel's approval toast told true beside `told=line`, the landscape head slot, a stale comment, and two admin fixes the triage audit found.

## The brief

**voice-guest round 1** (`docs/reviews/voice-guest.json`; the words are each option's own, in `git show e199f43f:"src/app/(dev)/design/sandbox/voice-guest/lines.ts"` and that board's r1 spec):
- `ask=warm`: the password step's sentence becomes "One password and you're in" in the shipped gate's own cadence (`password-gate.tsx`; the privacy feature page's `access-switch.tsx` mock quotes it).
- `failed=exact`: the failure sheet heads "2 of 8 didn't upload" (the whole run in its count), and its retry reads "Retry both" (or the count it retries) (`upload/failure-sheet.tsx`; the door's upload step shows the same list, `upload-step.tsx`; the album feature page's `how-much-fits.tsx` mock quotes it). His note: clear about the failure, clarity without coldness.
- `empty=warm`: under "The album starts with you", the one button says "Add the first photo" (`gallery-empty-state.tsx`).
- `welcome` and `landed` stay as today.
- `mock-parity.test.ts` holds the mocks to production's words; move it with them.

**Also:**
- The footer's demo link on a phone (`marketing-footer.tsx`, the `sm:hidden` "Open the demo album") is a same-tab `Link`. Every demo door on a phone opens the demo in a new tab (demo-doors `77cfdfe9`); make it one.
- `guest-header.tsx` carries a stale "open question" comment (the way back to a profile, answered by the peek card, `3e7952e3`); remove it.
- The reel's approval toast (`guest/reel/live-reel.tsx`'s `ApprovalToast`) says "The host added your uploads" when the first of her held uploads is approved, even when another of the same pick was left out and her uploads say so. Make it true beside `told=line` (e.g. "One of yours is in the album"), in the tracker's register.
- ROADMAP's landscape head-slot line (from `voice-r2`): `upload/stack-tile.tsx` draws a landscape file at its natural height inside the square head slot, leaving a grey band. Cover the square.
- Two admin fixes (ROADMAP, from `triage-refresh`):
  - The report's Remove (`report-review.tsx`'s `onAction`) acts at once, the one destructive act in the portal that skips `DestructiveSheet`. Route it through the confirm; whether that confirm carries a note is admin-triage's `verdict`, still on the desk, so add none.
  - Albums' Remove confirm (`moderation-grid.tsx`) says "Restorable for seven days" where the window is 30 (lifecycle-recovery.md), and "The guest who uploaded it is not told" where her uploads say Not in the album at an event that reviews uploads. Make both true.

- Help-sync (ROADMAP's guest-door line, as `help-refresh` refined it): the help articles that quote the failure sheet follow its new words (`help-ui-labels.test.ts` holds every `UiLabel` to the product's strings).
  - `how-guests-join-and-upload` also skips the chooser door-flow put before the name (How do you want to join?: Continue as guest, Create account, Log in) and puts Retry under the failure list where the sheet puts it above.
  - `an-upload-wont-finish` still heads "It's stuck or dimmed" and its bullets assume a tile.

  Retire those clauses of the line in your Handoff.

**Out:** the tracker's words (`TRACKER_WORDS`), the held tile's words and the keep's words, all voice-guest round 2's; `curation-wiring`'s review room.

**Verify:**
- Vitest where logic moved (the failure count's wording, the toast's truth).
- Each surface at 375 and 1440.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- `docs/systems/reel.md`'s approval-toast line refined in place: the words it quotes now match `told=line`'s truth ("One of yours is in the album", not "The host added your uploads"), with why (another of the same pick can still be left out at the moment the toast fires).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Work commit `59ccdce0`; sync commits `78197890` (`origin/launch-prep` had moved to `d2594b3f`, pointer-wiring's record, touching `docs/systems/guest-flow.md`, one of this lane's `reads`) and `ef0f0faf` (`origin/launch-prep` moved again to `f8b83bbc`, curation-wiring's record, touching `src/components/marketing/mock-parity.test.ts`, owned here — the Orchestrator flagged this one directly; `git merge` auto-merged cleanly, both lanes' entries kept, confirmed by reading the file after). All three pushed to `origin/lp/crumbs-6`; head `ef0f0faf` in the chat line, this manifest's own commit follows it.
- Gates, on `ef0f0faf` (the fully synced tree), each on its own exit code: `pnpm typecheck` clean, `pnpm lint` 0 errors and 5 pre-existing warnings (none in a file this lane touched), `pnpm test` 515 files / 5791 tests passed, `zsh scripts/build-lock.sh pnpm build` exit 0 ("Compiled successfully"), `pnpm lab:smoke --base http://localhost:3133` 223 checks / 0 failing.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 15 owned paths, plus this file, plus four exceptions:
  - `src/components/guest/guest-upload.tsx` (not owned): the exact register's failure heading needs the whole run's own count (`failed=exact`'s "the whole run in its count"), and only the queue's own owner sees a run's start for the ALBUM's failure sheet — `upload-step.tsx` (owned) tracks the identical baseline for the door's own inline view, but that ref/state dies when the door closes, and a run can still be going then (`suppressFailures` is proof both surfaces watch one queue live). Ref/state added, `<UploadFailureSheet>` handed a new `sent` prop; no other behavior touched.
  - `src/components/guest/guest-upload.test.tsx`, `src/components/guest/entry-modal.test.tsx` (not owned): mechanical string updates where these suites asserted the failure sheet's old rendered text ("1 file did not go", "Try again", "Retry all"), now "N of SENT didn't upload" / "Retry" / "Retry both". No behavior changed, only the literal expectations; one test's own premise ("offers ONE retry... `queryByRole(name:"Retry")` is null") was rewritten rather than patched, since my new single-failure label IS "Retry" now, making the old assertion's premise false rather than merely mis-worded.
  - `docs/systems/reel.md`: listed above.
- The items, one line each:
  - voice-guest r1 `ask=warm`: password-gate.tsx's reason is "This album is just for the guests. One password and you're in." (the shipped gate's own why-then-cost-then-"and you're in" cadence); access-switch.tsx's mock quotes the same tail, and a new mock-parity pin holds them together.
  - voice-guest r1 `failed=exact`: `uploadFailureHeading(failed, sent)` now reads "N of SENT didn't upload" (always, no more singular special case) in both failure-sheet.tsx and upload-step.tsx; the primary retry button is `uploadFailureRetryLabel(failed)` — "Retry" (1), "Retry both" (2), "Retry all N" (3+). `sent` is run-scoped (see the guest-upload.tsx exception above and the two sent-tracking notes in upload-step.tsx/guest-upload.tsx: a lagged baseline starting at 0, not `queue.length`, so a component that never witnessed its run's start — a direct mount, this file's own test pins, a `key={access}` remount — counts everything already there as this run rather than reading short). how-much-fits.tsx's mock now says "1 of 6 didn't upload"; mock-parity's pin for it moved to the apostrophe-free static tail ("upload"), since the heading is a template now and the app's straight `'` never matches a JSX mock's `&rsquo;`.
  - voice-guest r1 `empty=warm`: gallery-empty-state.tsx's button is "Add the first photo".
  - The footer's phone-only demo link now renders through `DemoDoor` (source `footer-mobile`, matching `FooterDemo`'s own desktop pile) instead of a bare `Link`: confirmed live at 375, `target="_blank" rel="noopener"`, styling unchanged.
  - guest-header.tsx's stale "the way back to a profile is an open question" comment is gone (answered by `popups-wiring`'s `peek=card`, `3e7952e3`).
  - live-reel.tsx's `ApprovalToast` says "One of yours is in the album" (was "The host added your uploads"); both the toast call and its docstring updated, plus docs/systems/reel.md and the two test files that pinned the old words.
  - upload/stack-tile.tsx: both `UploadStackTile` and `WaitingTile` now draw their `PickPreview` with `fit="cover"` inside `absolute inset-0` (was `fit="natural"`), covering the head slot's nominal square (`album-window-plan.ts`'s `HEAD_RATIO=1`, whose own comment says a head slot is "the one [ratio] that crops either orientation least" — cropping is the plan here) instead of leaving a grey band under a landscape file. Verified against the actual row-layout mechanism that forces this box's height (`album-window.tsx`'s `[&_[data-media-tile]]:h-full`); NOT visually verified locally — see "Look at first".
  - report-review.tsx's Remove now opens `DestructiveSheet` (`severity="reversible"`, no typed confirm, per admin-observability.md's rule and admin-triage's `verdict` still being open) instead of firing `actionReportAction` on click.
  - moderation-grid.tsx's Remove confirm: "Restorable for `RECENTLY_DELETED_WINDOW_DAYS` days" (imported from `lib/lifecycle/recently-deleted.ts`, was a hardcoded "seven"), and "At an event that reviews uploads, her uploads list already says Not in the album" (was "The guest who uploaded it is not told" — false at a moderated event since `TRACKER_TELLS_REFUSAL`, per `notice.tsx`'s own documented shipped truth).
  - Help-sync, two of the ROADMAP guest-door line's four clauses (the other two — `a-photo-is-missing-from-the-album`, `day-of-checklist-for-hosts` — are neither owned nor briefed here, left for whoever's line they're on): how-guests-join-and-upload.mdx gains a "Choose how to join, if you're new here" step (quoting chooser.tsx's real words) before the name step, and its "If one doesn't finish" paragraph now says the one retry-everything button comes first, the per-file list with its own Retry under it (was reversed); an-upload-wont-finish.mdx's "It's stuck or dimmed, no reason given" heading (promising a tile the failure sheet retired) is now "It can be retried".
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - report-review.tsx's no-media DestructiveSheet copy (title "Action this report?", lede "The report moves to Actioned; nothing else changes.", touches ["This report moves to Actioned", "The album itself is unchanged"]) has no brief to match; a plain, low-stakes fill-in for the album-level-report case.
  - how-much-fits.tsx's illustrative numbers ("1 of 6") are mine, not specified; easy to swap.
  - The new chooser-step help text ("Choose how to join, if you're new here"; the three ways summarized in one sentence) is my own condensation of chooser.tsx's fuller copy, for a step the article never had before.
- Look at first: upload/stack-tile.tsx's landscape crop, live — R2 rejects a PUT from `http://localhost:*` (testing-verification.md's own documented CORS limitation, confirmed twice this session: a presign always succeeded, the PUT always failed "Network error during upload" on two disposable test events, `Personal Testing Throwaway` and one fresh upload through the door), so I could reach and confirm the failure-sheet path live (heading, retry label, both code paths) but never got a real file to `done`/`held` locally to see the square actually covered. Static analysis and the existing test suite are the coverage; a 10-second look at a landscape upload on the alias would close it.
