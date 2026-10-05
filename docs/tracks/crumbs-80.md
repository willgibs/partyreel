---
track: crumbs-80
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
- **A lost answer heals itself through the queue's own runner** (5, 20 and 60 s on, when the browser says the line is
  back, when the page is looked at again; three asks a File), where the alternative, settling a row when the album's
  sync draws its photograph, needs the page's files (`event-experience.tsx`, `gallery-live.tsx`), which this lane does
  not own. The host panel's row is not covered (Deferred).
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

- Now: the host panel's rows (`host-upload.tsx`) have the same lost-answer gap (a dropped row over a tile the hub's album
  already drew); `use-upload-queue.heal.ts` is generic over its rows and is the rule, wired in about ten lines of the
  panel (its items keep `cause`, its retry re-queues).
- Now: if Will overrules Question 3, hold the door's Sending step while files go and the keep is due (the entry-modal
  line is in the Question).

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
