---
track: crumbs-80
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a35d07a4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/drive/
  - src/app/api/drive/status/
  - src/components/guest/upload/
  - src/components/guest/upload-step
  - src/components/guest/guest-upload
  - src/lib/guest/use-upload-queue
  - src/lib/upload/uploader
  - src/components/guest/entry-modal
  - content/help/notifications-and-emails.mdx
  - src/components/marketing/help/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(app)/layout.tsx
  - src/components/ui/sonner.tsx
---

# lp/crumbs-80

**Goal.** Red-team 55's MEDIUM and the two red-teams' small findings before milestone 37: the Drive return toast shows on a full page load; a lost-answer retry clears its failure row once recorded; a hung presign stops holding its siblings; Drive's not-set-up words come before a choice; the door names the refused files; the help page's subject chips fit at 375; the whole-failed run's row Retry, the door's Sending step and a lingering Stop question as each call says.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3134 is yours; 3000 is Will's desk.

Read red-team 55's and 54b's ledgers (`../partyreel-wt/_scratch/redteam-55/ledger.txt`, `../redteam-54b/ledger.txt`) for each finding's exact steps. Each fix pinned by a test that fails on the old code:
1. **MEDIUM:** the Drive return message (`?drive=` handled by `drive-flag.tsx`) never shows on a full page load: it fires on mount, before the root Toaster subscribes, so `/account?drive=unavailable` cleans the address with no toast (a client navigation shows it). Fire it once the Toaster can hear it (crumbs-78's boom probe met the same timing: the toast waits a beat after mount), and never lose it: Account's Connect and every Reconnect depend on it.
2. **LOW:** after a lost answer resolves on retry as `recorded`, the album shows the photos while the failure sheet (or the host's row) still says "didn't upload… Retry": settle the row as landed.
3. **NITs:** a hung presign holds its sibling files for the whole 30 s ceiling (let the rest go on); Your events' send list lets her pick albums before saying Drive isn't set up (say it first); What's using space reads `/api/drive/status` without the hint-cookie check the others make; Account shows no Drive card while not set up, where env.ts's comment and the brief expected "not set up yet" (recommended: the card with its not-set-up line; a Question if you judge otherwise).
4. **Red-team 54b's:** at the door, when every file is refused for itself, the step names no file and no reason (name them, as the failure sheet does); `/help/notifications-and-emails` cuts two email-subject chips mid-word at 375 (wrap or shrink them); a whole-failed run's row Retry says "Everything else is in… album" before anything landed (say nothing of the rest until something lands); the door's Sending step closes at the first recorded group while files still go, and an unanswered "Stop this upload?" lingers 7 s after its Stop is gone: each a call, built as you recommend under Questions.

Wiring rigor: the whole gate, and each finding re-walked at 375 and 1440 on your port (the Drive toast by `/account?drive=unavailable` loaded whole).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door.

1. **Account's Drive card while Drive is not set up** (red-team 55's NIT; env.ts's note and the brief expect "not set up
   yet" in words). *Recommended, built:* the card stands with the three doors' own sentence ("Send to Google Drive isn't
   set up yet. It's on its way. Download keeps every original meanwhile.") and no Connect, since a press there could only
   come back as that sentence; the five places that say it share one home (`not-set-up.ts`). The other answer: nothing
   on Account until Drive is set up (what it did): then env.ts's note is the line to change.
2. **A whole-failed run's row Retry says "Everything else is in the album" before anything landed** (red-team 54b's
   NIT). *Recommended, built, stricter than the call as worded:* the sheet says nothing of the rest until every file it
   does not list has landed, not "until something has": with one of three landed and a second in the air, "something
   landed" would still say the rest is in the album over a file that is not. Where a run has just ended the two rules
   are one, so only a Retry in flight meets the difference.
3. **The door's Sending step closes at the first recorded group while files still go** (red-team 54b's NIT, a call).
   *Recommended: leave it, and pin it* (one assertion in `entry-modal.test.tsx`; nothing else built). The first landing
   is what the step asked for, so she is let into the album, where the stack carries the rest with its count and its x
   (the one place a file can be stopped: the standing direction's "potential interruptibility"), and the keep waits for
   the whole count (red-team 54's fix). Holding her at a sheet with no exit for the whole run would make the album's
   reveal wait for it (minutes on a slow line with videos) to close a gap that already says "N to go". *The other
   answer:* hold the step while files go and the keep is due, so a signed-out guest's door is one continuous sheet
   (Sending, then the keep, as `guest-capture` r1 drew it before the keep learned to wait): in `entry-modal.tsx`,
   `contributed` and `hasContributed` read false while `filesGoing && keepDue`; a signed-in guest, who has no keep, still
   goes in at the first landing.
4. **An unanswered "Stop this upload?" outlives its x by the complete's length** (red-team 54b's NIT, a call).
   *Recommended, built:* the question goes the moment the x does (its bytes are up, its complete is coming), saying
   nothing, since the Stop it offers could only answer too late and the file landing is the answer.

Calls made inside the lane that the Orchestrator may want in front of Will (each built; each one line to undo):

- **A hung presign is taken back at 8 s and asked again beside the files waiting behind it** (`PRESIGN_REASK_MS`), where
  the alternatives were failing the stuck file at 8 s or letting a second presign go beside it and sending bytes out of
  order. Once a file, only with a prepared file waiting behind it; a presign nobody waits behind keeps the whole 30 s;
  a phantom presign stores nothing and tallies the hour breaker (20,000) once more.
- **A lost answer heals itself through the owner's own runner** (5, 20 and 60 s on, the moment the browser says the line
  is back, when the page is looked at again, none while it says it is offline; three asks a File), where the
  alternative, settling a row when the album's sync draws its photograph, needs the page's files
  (`event-experience.tsx`, `gallery-live.tsx`), which this lane does not own. One generic hook
  (`use-upload-queue.heal.ts`) serves the guest's queue and the host panel's rows (`host-upload.tsx`: about ten lines
  and its test, the lane check's second exception beside `gallery-rows.tsx` and `spec-shared.tsx`).
- **A chip over 44 characters wraps on a phone, whole from `sm` up** (`UI_LABEL_WRAPS_FROM`): the fix is in the shared
  `UiLabel`, so the five more messages `/help/messages-guests-might-see` cut at 375 (one 173 px off) are mended too.
- **Your events' list reads Drive's status once when it opens** (hint or no), to say "not set up" before any choice and to
  ask for no album for nothing: one small read a press, beside the albums' own.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the stack's x and its question; the failure sheet's rest line and the lost-answer heal;
  the door's failure view naming the files; the door's step not held for the run (a call).
- `docs/systems/uploads-and-r2.md`: the presign's re-ask; the queue's heal of a kept complete.
- `docs/systems/drive-export.md`: the doors say "not set up" first (Account's card included); the hint's reach; the
  return word taken on the first commit and said a beat later.
- `docs/systems/design-system.md`: a toast published from a mount effect on a full load is never seen (the recurring one).
- `docs/systems/marketing-content.md`: a chip over 44 characters wraps on a phone.

## Deferred (ROADMAP one-liners, bucket named)

- Now: if Will overrules Question 3, hold the door's Sending step while files go and the keep is due (the entry-modal
  line is in the Question).

## Handoff (replaces the chat report)

Walk tooling, logs and shots sit in `../partyreel-wt/_scratch/crumbs-80/` (`tools/` below is that folder's: the CDP
scripts, `stand375.log`, `stand1440.log`, `shots/`). The walks' 25 MB event log and the headless profile were deleted
with the cleanup; the scripts, the two logs and the shots stay.

- **Commits, all pushed** (`origin/lp/crumbs-80` = `fc4b73c04` before this file's own commit; the head is in the chat
  line): `acd962a23` the return word · `05863cf46` Drive says "not set up" first · `1735248b9` the door names the
  files, the rest line, the stack's question · `cf3f4daf9` the hung presign · `f876f8d37` the lost answer heals ·
  `4fa4ce485` the chips · `dce5b9155` docs, Questions, the door's pin · `fd376c905` the heal waits out an offline line
  · `fc4b73c04` the host panel heals too. **No sync:** launch-prep moved by one record commit (`8f9c9a23b`,
  `docs/tracks/orchestrator.md` alone), nothing under `owns` or `reads` (PROGRAM.md, "Sync").
- **Gates on `fc4b73c04`**, each on its own exit code (`../partyreel-wt/_scratch/crumbs-80/gate.log`, a log per step
  beside it): `pnpm typecheck` 0 · `pnpm lint` 0 (the log holds no warning) · `pnpm test` 0 (987 files, 12,238 tests:
  `gate-test.log`) · `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`) · `pnpm lab:smoke --base
  http://localhost:3134` 0 (170 checks, 0 failing: `gate-smoke.log`). Each new test was also run against the old file
  and failed there. This file's commit changes no code.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 37 paths): 26 under `owns` (their tests included),
  this file, the five `docs/systems/` files listed above, and five outside `owns`, each small and each the one place
  its fix could live: `gallery-rows.tsx` + its test (the stack's Stop question leaves with its x: a 6-line effect),
  `host-upload.tsx` + its test (the host panel's rows heal a lost answer through the same hook: a dozen lines of code
  and their comment), `marketing/mdx/spec-shared.tsx` (`UiLabel`, the one chip every help article shares).
- **The items** (numbers are the brief's):
  - 1 **MEDIUM, the Drive return word on a full load** · `acd962a23` · `DriveReturnWord` (`drive-flag.tsx`) takes the
    word on the first commit and says it a beat later, once the Toaster has subscribed; only an intent staged for this
    very page withholds it (`intentIsHere`) · `drive-flag.test.tsx` (the real Toaster, Strict Mode, the hint cookie, a
    stale intent) · walked `/account?drive=unavailable` loaded whole, at 375 and 1440.
  - 2 **LOW, a lost answer** · `f876f8d37`, `fd376c905`, `fc4b73c04` · `use-upload-queue.heal.ts` asks again, through
    the owner's own runner, for a file whose complete is kept, so the sheet or the host's row lets it go when the
    server answers · `use-upload-queue.heal.test.tsx` and the heal cases in `use-upload-queue.test.tsx`,
    `guest-upload.test.tsx`, `host-upload.test.tsx` · walked with `tools/healwalk.mjs` (CDP cuts the complete's
    answer) at 375 and 1440: the sheet let go 3 to 36 ms after the line came back.
  - 3 **NITs** · the hung presign (`cf3f4daf9`: `uploader.ts`, `PRESIGN_REASK_MS`; `uploader.presign.test.ts`, 7
    cases; walked with `tools/cutcomplete.mjs --hold-presign`) · Drive says "not set up" first in the send list,
    What's using space (its status read now waits for the hint cookie) and Account's card, from one home (`05863cf46`:
    `not-set-up.ts`, `not-set-up.test.tsx`, `drive-account-card.test.tsx`) · walked at 375 and 1440:
    `/account?drive=unavailable`, Your events > Send to Drive (the notice, no list, no choice), What's using space >
    an album > Send to Drive (no `/api/drive` request until the press, then one, and the notice).
  - 4 **Red-team 54b's** (`1735248b9`, `4fa4ce485`) · the door's failed view names every refused file and its reason
    (`upload-step.tsx`, `upload-step.test.tsx`; `tools/shots/door-375-refused.png`, `door-1440-refused.png`) · a chip
    over 44 characters wraps on a phone (`spec-shared.tsx`, `ui-label-wrap.test.tsx`; both help pages walked at 375
    and 1440) · the row Retry says nothing of the rest until every file it does not list has landed
    (`failure-sheet.tsx`, `failure-sheet.test.tsx`, `guest-upload.test.tsx`; Question 2) · the Stop question leaves
    with its x (`gallery-rows.tsx`, `gallery-rows.test.tsx`; `tools/stand375.log`, `tools/stand1440.log`: gone within
    0.3 s of the complete being asked, 3.8 s before the held complete was released; Question 4) · the door's Sending
    step left as it is and pinned (`entry-modal.test.tsx`; Question 3).
- **Assets requested from Will:** none.
- **Board ideas:** (a) `UiLabel` is the one chip for the ~100 quoted labels in `content/help`; a long one now wraps on
  a phone with each line boxed, the value plate's way: a small look could confirm that over a quote block or a smaller
  chip. (b) One host presign answered 401 during the host-row walk (an expired access token on a request no page load
  had refreshed); the row's Retry then worked: seen once, no log kept, not chased.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Test data left:** the event "CR80 live" (`4208ea18-f7d4-41bc-9d63-7fe9390f87ff`, host account) moved to Deleted
  through its Settings on 2026-10-05 (read back by SQL: `deleted_at` set, `purge_at` 2026-11-04); its uploads count
  under Deleted until it is emptied (never pressed: Empty Deleted, Delete for good). No other data; nothing requested
  of the Vercel alias, partyreel.com or any `*.vercel.app`.
- **For the next cut:** a ledger path belongs in the brief's text, not in `reads` (the guard resolves `reads` from the
  cwd, where `../partyreel-wt/...` does not exist: `pnpm test` was red on it until the two paths left the front
  matter).
- **Calls his to overrule:** Questions 1 to 4 above, and the four calls made inside the lane (the presign's 8 s
  re-ask, the heal's timing and triggers, the 44-character chip rule, Your events' one status read at opening).
- **Look at first:** `/account?drive=unavailable` loaded whole (the toast, then the card's not-set-up line, no
  Connect); Your events > Send to Drive (the notice, no albums); a failure sheet over a lost answer closing itself
  when the line is back; `/help/notifications-and-emails` at 375 (both subjects whole, wrapped).
