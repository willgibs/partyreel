---
track: crumbs-17
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5a027e53"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929220000_door_invite_admits.sql
  - src/components/app/event-settings/settings-rows.
  - src/lib/events/event-blocks.
  - src/components/admin/report-queue.
  - src/lib/admin/reports.
  - src/app/admin/forensics/page.tsx
  # BUG-2: the guard, the answer's reader, the room's two lists (their answered and removed sets: NIT-4's shape)
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/mutations/event-doors.
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/lib/db/queries/event-blocks.
  - src/components/app/event-blocks/blocked-section.
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  - src/lib/event/door/words.
  - src/components/app/event-settings/door-page.tsx
  # BUG-3 and NIT-6: the album's report form and its one mount
  - src/components/guest/report-dialog.
  - src/components/guest/event-experience.tsx
  # LOW-2, NIT-7, NIT-8: the reports' reads and the closed log
  - src/lib/db/queries/reports.
  - src/components/app/report-review.
  # NIT-11's shape, swept
  - src/lib/jsx-text-escape-policy.test.ts
  # NIT-1, NIT-2, NIT-9: the guest's door and upload
  - src/components/guest/door/unlisted-ask.
  - src/components/guest/door/doors.test.tsx
  - src/lib/guest/use-welcome-seen.
  - src/components/guest/upload/failure-sheet.
  - src/components/guest/upload-step.
  - src/components/guest/guest-upload.
  - src/lib/guest/upload-refusal.
  - src/components/guest/entry-modal.
  # The two dead seams (crumbs-15's ROADMAP lines)
  - src/lib/lifecycle/account-deletion.
  - src/lib/db/mutations/account.
  - src/app/api/cron/purge/route.
  - src/lib/db/queries/claims.
  - src/lib/social/notification-prefs.
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/guest-events.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/trust-safety-forensics.md
---

# lp/crumbs-17

**Goal.** Fix what build 23's red-team found on the doors and the reports: the invited guest left waiting at the door, the host's Report on her own album, the operator's host-or-guest line, the uncovered dismissed worst kind, and eleven small nits; plus two dead seams crumbs-15 found.

## The brief

**Build 23's live red-team** (2026-09-29; its ledger, with every step and id, is `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-23/ledger.txt`) found these on settings-wiring's doors and triage-r2-wiring's reports. Fix each at its root, with a test that fails on today's code:

- **BUG-2, MEDIUM: an invited guest who had asked stays at the door after she joins.** On the invite-list door she asks and waits; the host adds her address to the list; she comes in and adds a photo. Her waiting row is never admitted (neither the invite nor her join touches it; the join mints a new `in` row), so the Guests room shows her At the door (Let in, Decline) beside her guest-list entry and her "Joined" address, the pulse and the bell keep counting "1 person at the door", and Decline there would block a guest already in. Listing an address that waits at the door should let that person in, once, everywhere the door counts. This likely replaces a SQL function: start from its newest definition in `supabase/migrations/`, keep its grants exactly (revoke EXECUTE from `anon` explicitly unless guests must call it: CLAUDE.md's landmine), write the migration file, and prove it inside one rolled-back transaction through the Supabase MCP. You never apply it: the Orchestrator does, by protocol.
- **BUG-3, LOW: the host sees Report on her own album through its `/e/` link.** Every photo, her own uploads included, shows "Report this photo", and the page's foot shows Report; the "never on the host's own album" rule rests on `viewerIsHost`, which only the dashboard grids pass.
- **LOW-2: the operator cannot tell a host's report from a guest's**: the host's own report reads "Signed-in guest, can be asked" on its tile (`components/admin/report-queue.tsx`, `lib/admin/reports.ts`).
- **NIT-7: a dismissed child-abuse report's photo shows uncovered** in the Dismissed list. The worst kind stays covered wherever it appears; treat this one as safety, not polish.
- **NIT-8:** after Dismiss then Undo, the reopened report reads "no confirmed email", because the close wipes the address; say what is true after a reopen.
- **NIT-6:** the report form promises "It's hidden … the moment you send this" before a child report the daily limit stops from hiding; promise only what will happen.
- **NIT-1:** after the ask at the invite list's shut door, one extra welcome step comes before the held door.
- **NIT-2:** the upload-failure sheet offers Retry for "This event accepts photos only", which can never pass.
- **NIT-3:** Let back in for a declined newcomer says "able to open … and add photos again" and "can join again", yet she returns to the held door and still needs Let in (`lib/events/event-blocks.ts`).
- **NIT-4:** after Let back in, the Guests room shows her nowhere until a reload.
- **NIT-5:** "The 1 person waiting at the door stay out" should read "stays" (`event-settings/settings-rows.tsx`).
- **NIT-9:** on a Free event (photos only) the welcome says "photos and videos".
- **NIT-10:** "1 uploads".
- **NIT-11:** the Forensics holds table prints a literal `…` after each media id (`app/admin/forensics/page.tsx`).
- **Two dead seams** `crumbs-15` found (ROADMAP, Lifecycle and Guest): `isDeletionSchemaMissing` and the account deletion's `not_provisioned` answers; `queries/claims.ts`'s untyped reads, `NotificationPrefsRow` declared by hand (`schema-pass` has since touched `social/notification-prefs.ts`: check before you cut) and `queries/guest-events.ts`'s reel defaults. Remove what is dead, each test reshaped with its scar; change no behaviour there.

**Verify:** the gate; each fix walked on your dev server where localhost can reach it (the signed-in host and the operator's portal cannot run there: name what the next build's red-team must walk, as its steps, in your Handoff).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception. Three files belong to running lanes and stay theirs: `components/app/share/event-share-provider.tsx`, `app/(app)/account/email-section.tsx` and `components/marketing/help/help-search-signal.ts` (`crumbs-16`).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended, and each is his to overrule.

- **Q1. Does listing a waiting newcomer let her in at every door, or only while the list is the door?** Recommended
  and built: only while it is the door (`gate = 'invite'`). At "you let each person in" the host lets each one in
  herself, and Invited already tells her the list "lets these addresses in while the invite list is the way in";
  turning the door to the list then lets in everyone waiting whom it names, as turning Public lets everyone in.
- **Q2. Let back in for a newcomer declined at the door: back to the door, or straight into the album?**
  Recommended and built: back to the door, where she still needs Let in, as the decline's own Undo does (Let back
  in lifts a block; Let in stays the host's yes), and the confirm and the toast now say so. The one exception is
  the list's own yes: while the invite list is the door and names her, Let back in lets her in.
- **Q3. NIT-6: word the child-kind line so it never promises, or ask the server first?** Recommended and built:
  the words ("Your confirmed email can hide it from everyone the moment you send this, while we look."; the toast
  after the send still says what happened). A pre-check route would be exact, but it is new machinery on the report
  path, and it would tell a barred address that it is barred.
- **Q4. LOW-2: read the host from what the report keeps, or store it?** Recommended and built: read it. The open
  queue compares the report's kept address (and, on the worst kind, the kept hash that outlives the close) with the
  host's own. A stored `reports` flag would keep "The host" on a non-worst report reopened after its close, but it
  costs a migration and `create_report`; BUG-3's fix removes the host's only way to report her own album in the
  product, so such a report now comes only from a direct call.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`, "The door, the host's side": At the door (either way back returns a declined newcomer
  to the door, unless the list being the door names her; `BlockedPerson.atDoor`) and Invited (★ while the list is
  the door, a waiting person it names is in: `event_door_admit_listed`, its three acts, the ticket that adds).
- `docs/systems/admin-observability.md`, Reports: the reporter bullet (the queue names the host's own report, and
  keeps a reopened report's words true) and the open queue bullet (a covered kind stays covered on every closed line,
  unsigned).
- Proposed, not made (a `reads` doc): `docs/systems/guest-flow.md` line 171, the failure sheet's "a line per file
  (name, the SERVER's sentence, Retry) over one `Retry all`", is now "a line per file (name, the SERVER's sentence,
  and a Retry only where a retry could pass: a refusal of the file itself, `retryCanPass`, has none) over one Retry
  of the rest".

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a newcomer waiting at `approve` or the invite list whose door then becomes a password keeps her waiting
  ticket, so once she unlocks, `get_upload_context` and `create_media` still refuse it as a private album's, and the
  host's At the door still lists her; the door's move could settle her rows (from `crumbs-17`).
- Admin: `/admin/albums/[eventId]` draws every item uncovered, one a child-abuse or sexual-content report names
  included; the reports inbox covers that set on its open and closed lines (`listReports`' covered read), and the
  album grid could cover the same set (from `crumbs-17`).

## Handoff (replaces the chat report)

- **Commits:** the work at `14ca7df7` (pushed), then this manifest alone. **No sync:** launch-prep moved (crumbs-16,
  window-notes, album-motion-wiring and their records), with nothing in my owns or reads, and the merge is clean
  (`git merge-tree HEAD origin/launch-prep`; the one shared file, `docs/systems/host-app.md`, differs in another
  section). No escape my new policy refuses exists in the components launch-prep changed.
- **Gates on `14ca7df7`**, each on its own exit code (logs in `_scratch/crumbs-17/`): `pnpm typecheck` 0
  (`gate-typecheck.log`), `pnpm lint` 0 with no warning (`gate-lint.log`), `pnpm test` 0, 610 files and 7,117 tests
  (`gate-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`), `pnpm lab:smoke --base
  http://localhost:3135` 0, 142 checks and 0 failing (`gate-labsmoke.log`). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths, this file and the two system
  docs of "System-doc edits" (Record subtractively). `owns` grew before each edit, with its reason in a comment.
- **The migration** (`supabase/migrations/20260929220000_door_invite_admits.sql`, never applied here): one new
  helper, `event_door_admit_listed(uuid)` (INVOKER, service role only), and `add_event_invites`, `set_event_door`
  and `let_back_in` carried verbatim but for the admission and an `admitted` key. Drift checked clean: the three live
  bodies read `bd0a6940…`, `40b5b778…` and `587368cd…`, each its file's. Its rolled-back check held on the live
  schema: grants, the listing, the door becoming the list, the block and Let back in, the refusals and the door
  opening, all seven steps `t`, with the rows quoted at the file's foot. A second rolled-back call hashed the
  verbatim bodies to the four md5s in its header, and afterwards nothing persisted (the helper absent, the three
  hashes unchanged, the probe event untouched, no `admits-*` account). An expand in both directions: signatures,
  RETURNS and grants are unchanged, and the answers only grow a key the code reads as 0 when absent, so apply and
  push go in either order. Expected advisors delta: none. Regenerate the types after the apply.
- **The items**, each with a test that fails on the old code:
  - BUG-2: the migration above; the room's line says who came in (`invited-section.tsx`, `cameInLine`, the one
    sentence the door's toasts now share in `lib/event/door/words.ts`); the seam reads `admitted`
    (`mutations/event-doors.ts`); guards in `db/migration-guards.test.ts` §20.
  - BUG-3: the report form mounts only for a non-host (`ReportFoot` in `report-dialog.tsx`, used by
    `event-experience.tsx`), so her own album offers Report neither at the foot nor on any photo
    (`useReportDoorOpen` answers no).
  - LOW-2: `reporterWho` / `reporterWords` say "The host" (`lib/admin/reports.ts`), from `sentByHost` in
    `queries/reports.ts` (the kept address, or the worst kind's kept hash, against the host's).
  - NIT-7: `listReports` signs no picture for an item any report names as a covered kind (read whole across open
    and closed reports), and the closed line draws the cover (`report-review.tsx`).
  - NIT-8: the worst kind's "email confirmed" reads the kept hash (`EntryReport.confirmed`), so a reopened report
    stays true; it still can't be asked, and says so.
  - NIT-6: the child-kind lines say what a confirmed email can do, never that it will (`instantHideLine`).
  - NIT-1: the unlisted ask marks the welcome seen (`markWelcomeSeen` in `use-welcome-seen.ts`), so the held door
    comes with no welcome in front of it.
  - NIT-2: the failure list offers Retry only where a retry could pass (`retryCanPass`, the refusal ladder moved
    to `lib/guest/upload-refusal.ts`, which the door's step reads too); with nothing retryable the footer reads Done.
  - NIT-3: `BlockedPerson.atDoor` (the rows' admission and the list, in `getEventBlocks`) picks Let back in's words:
    "They'll be back at the door, and you can let them in from there." / "Wren is back at the door."
  - NIT-4: At the door's answered rows stay hidden only until the room's next read. The same shape is swept in
    Invited: an address removed and added again used to stay hidden all visit.
  - NIT-5: "The 1 person waiting at the door stays out." NIT-9: `welcomeAddLine` gives a photos-only album
    "Add your photos in seconds." NIT-10: "1 upload". NIT-11: the id's ellipsis now sits inside a string, and
    `src/lib/jsx-text-escape-policy.test.ts` refuses an escape in JSX text anywhere (it caught only this one).
  - The dead seams: `isDeletionSchemaMissing`, the `not_provisioned` answers and `skipped` are gone
    (`account-deletion.ts`, `mutations/account.ts`, the purge route's comment); the claims list reads its two columns
    typed; `NotificationPrefsRow` is a `Pick` of the generated row (schema-pass had touched only its comment); the
    guest reads drop the pre-expand reel defaults, keeping the honest NULLs. Each reshaped test says so, with its
    scar kept.
- **Local walk** (dev server on 3135): a Free album's welcome reads "Add your photos in seconds. No app required."
  (Test Wedding, `2eac1ae8…`), a Pro album's still says photos and videos (Reel lane probe, `bbc32914…`), and a
  visitor still gets the Report foot. The rest needs a signed-in host or the portal.
- **Build 26's red-team walks (these steps):**
  1. BUG-2: on an invite-list album, partyr33l, not listed, asks and waits on the held door and stays signed in on
     that device. willg97 lists partyr33l@gmail.com under Guests → Invited. The line under the field reads "1 added.
     1 person waiting at the door came in."; At the door, the pulse and the bell drop her; her held door opens by
     itself; she adds a photo on the same device, and it lands (not "This event is private."); her address reads
     Joined. SQL: every row of hers is `in`.
  2. BUG-2, the other acts: at "you let each person in", with her waiting, listing her moves nothing; switching the
     door to "Private: your invite list" toasts "1 person waiting at the door came in." and lets her in. Declined,
     then listed, then Let back in, she comes straight in.
  3. NIT-3 and NIT-4: decline a waiting newcomer (not listed), then Let back in from Blocked. The confirm reads
     "They'll be back at the door, and you can let them in from there.", the toast "<name> is back at the door.",
     and she shows At the door at once, with no reload.
  4. NIT-5: with one person waiting, the door menu's "Only people already in" reads "The 1 person waiting at the door
     stays out."
  5. BUG-3: willg97 opens his own album by its `/e/` link: no Report at the foot, and no "Report this photo" on any
     photo, his uploads or a guest's; the same album, seen as a guest, keeps both.
  6. NIT-1: at an invite-list album, partyr33l (not listed) presses Ask at the shut door and lands on the held door
     with no welcome step first.
  7. NIT-2: at a photos-only album (a Free host's, or a Pro one with Videos off), a guest sends a video: the sheet
     reads "This event accepts photos only." with no Retry and a Done.
  8. NIT-6: reporting a photo, the child kind's line reads "Your confirmed email can hide it from everyone the moment
     you send this, while we look."
  9. LOW-2: willg97 POSTs `/api/reports` for his own event (a direct call now, since his album shows no Report): the
     portal's tile reads "The host, can be asked", never "Signed-in guest".
  10. NIT-7 and NIT-8: in the portal, dismiss a child-abuse report: its closed line shows the cover, and no picture
      loads. Undo: the reopened report reads "Signed-in guest, email confirmed".
  11. NIT-10: a peek of a one-upload album reads "1 upload". NIT-11: Forensics' holds table prints the id and an
      ellipsis.
  12. The dead seams: /account's Delete account card reads; `/admin/jobs` shows the deleted_accounts sweep green; the
      dashboard's claim card shows its previews; a guest album's highlight reel shows.
- **Assets requested from Will:** none.
- **Board ideas:** a host who finds harm in her own album has no way in the product to reach the operator (BUG-3
  closes her Report there, and the runbook counts "a host's email" as a trigger). A Report to Partyreel beside
  Remove in her own viewer, one that holds rather than deletes, would bring the operator in without losing the
  evidence.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the migration above, by protocol; nothing else.
- **Calls his to overrule:** Q1 to Q4 as built; the failure sheet's "Done" where nothing can be retried (the door's
  step keeps its own "Choose other photos"); NIT-1 marks the welcome seen on the ask itself, so a visitor who asks at
  the shut door never meets the invitation's welcome on that device.
- **Look at first:** the migration's three acts and the helper (the one SQL change, proved but never applied), then
  `ReportFoot` (BUG-3) and `getEventBlocks`' door read (NIT-3).
