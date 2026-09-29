---
track: triage-r2-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "92334b26"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929140000_triage_r2.sql
  - src/app/admin/reports/
  - src/app/admin/forensics/
  - src/app/admin/albums/
  - src/components/admin/
  - src/components/app/report-review
  - src/components/guest/report-dialog
  - src/components/guest/report-answer-form
  - src/app/api/reports/
  - src/app/(guest)/report/
  - src/lib/validation/report
  - src/lib/db/queries/reports.ts
  - src/lib/db/mutations/report
  - src/lib/db/mutations/media
  - src/lib/db/triage-seam.ts
  - src/lib/reports/
  - src/lib/admin/reports
  - src/lib/admin/pending.ts
  - src/lib/admin/nav.ts
  - src/lib/guest/report-door.ts
  - src/lib/email/templates
  - src/components/shared/media-lightbox-parts/
  - src/lib/lifecycle/
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
  - src/app/(dev)/design/sandbox/admin-triage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/admin-triage.json
  - docs/systems/database-security.md
  - docs/systems/billing-caps.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - docs/systems/lifecycle-recovery.md
  - content/help/report-a-problem-as-a-guest.mdx
---

# lp/triage-r2-wiring

**Goal.** Wire admin-triage r2 (the reports queue as the review grid, five kinds with harm in front, a reporter's confirmed email, both acts on a phone) and rebuild the hold on Will's word: Hold takes it down by default and preserves, an operator's removal stops counting against the host's storage, an open report protects its item from every permanent delete, and a child-abuse report from a confirmed address hides the item at once pending review.

## The brief

**His r2 answers** (`docs/reviews/admin-triage.json`, build 19's sitting, 2026-09-29): `look=grid` (the review grid, words on every tile: the host queue's 4:5 tiles and keys, each reason, who reported and who sent it under its tile, Space opens it whole), `harm=kinds` (the form asks one of five kinds or Something else; harm arrives in front, worst first, the worst covered; Something else joins the sweep), `proof=confirm` (the form offers Confirm your email with the door's own code, so a signed-out reporter can be asked too, on the address kept until the report closes), and `phone=stop` with his note: "What's the functional difference between \"take it down\" and \"start a hold\"? May help to have both on mobile in case critical review items need one or the other instead of just taking it down." So a phone gets both acts, each one press (the board's `hold` option); sweeps, notes and proof wait for a desk.

**The hold, rebuilt on his word in chat (2026-09-29).** A hold is for what police should see (child sexual abuse material first), so nothing held stays visible by default:
- **Two acts, no third.** Take it down stays as it is (the item leaves the album and the host's Deleted at once, the 30-day window, then the purge). Hold for forensics' confirm carries "Take it down too", ON by default: the reported item and the same uploader's other items the hold covers leave the album and the host's Deleted at once and are preserved (the original and its forensic record to the preservation store, past every purge), each restorable by an operator after review. Unticking it is the quiet hold, for a police preservation request about content that is not harmful to show, where removing it would tip someone off: nothing is removed, the host's own delete of a quietly held item looks like any delete (her Deleted takes it, restore refused, every purge skips it).
- **An operator's removal stops counting against the host's storage at once**, a takedown and a hold alike (they are not hers to manage any more, and then no number tells the two apart: today `profiles.storage_used_bytes` keeps a hold's bytes for ever where a removal's drop). Keep the storage-abuse invariants whole: a host cannot trigger an operator's removal, and the monthly upload meter never refunds.
- **An open report protects its item from every permanent delete** (the host's Delete permanently, the uploader's own delete, an event's deletion, an account's) until the report closes: the item leaves view as the deleter expects, its bytes wait for the review. Do it at the media table's guard, where a hold's protection already lives, so every path is covered at once.

**The child-abuse kind's instant hide** (his yes in chat, with the anti-abuse): the report itself is never gated (anyone, signed in or not, and it heads the queue). A report of that kind from an address confirmed in the form (the door's own code) hides the item from every viewer at once pending review, as a takedown would, restorable; an unconfirmed one heads the queue without hiding, and the form says a confirmed email hides it right away. Limits per address and per event; an address whose child-abuse report is dismissed as false loses the instant hide; and the operator is alerted at once (the portal's own signal, and a mail to the operator's inbox, internal and not a product mail) so a false hide lasts minutes. His words: "implemented poorly this becomes a gate to someone attempting to report real abuse, but the flip side would allow anyone to effectively takedown other photos knowing CA reports are immediate takedown."

**A photo can be reported** (ROADMAP's line: `/api/reports` accepts a `media_id` the report dialog never sends): the viewer's photo gets its own Report into the same dialog with that photo named, since a grid of reported items and the instant hide both need the item.

**Ask for proof** is a new mail to the reporter, and his rule holds every new product mail for the email exploration: build the ask and its record whole, the mail behind a switch left OFF, his yes flips it (a Question). The reporter's closing note (`reporter=note`) stays banked.

**Security (non-negotiable):** every Server Function re-verifies with `getUser()`; the operator's acts stay `is_admin` plus MFA; RLS is the boundary; `anon` gets no table access and every function created revokes EXECUTE from `public` AND `anon`; a host never learns a hold exists (no count, no state, no error that differs); a report never tells the host or the person reported who filed it; the reporter's confirmed address is kept only until the report closes. Replace no function `settings-wiring` replaces this batch (the join, the album's reads, the upload's gate and presign, likes and both claims): an instant hide and a takedown share the operator's removal, which every read already leaves out. The report path's own functions, the media guard and the purge's are yours; a function you replace starts from its newest definition in `supabase/migrations/`.

**The migration** (write it; the Orchestrator applies it and regenerates the types): `supabase/migrations/20260929140000_triage_r2.sql`; add any further file to `owns` before writing it. Exercise inside a rolled-back transaction: a hold with and without "Take it down too"; the host's delete of each; the storage figure at each removal; every permanent-delete path refused on an item an open report names, and allowed once it closes; the instant hide's limits and its loss after a false report; another host and `anon` refused everywhere.

**Legal:** none. The Terms and the Privacy Policy are rewritten once, right before launch (Will, 2026-09-29): neither edit nor draft them.

**Then retire `admin-triage`** in one commit (its folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`, as named exceptions); the ledger is the Orchestrator's to delete.

**The help article** `content/help/report-a-problem-as-a-guest.mdx` sits inside `settings-wiring`'s owns (`content/help/`) this batch: if `settings-wiring` has merged before your handoff, sync and add the article to your owns then; otherwise put its new words in your Handoff as a relay, and the Orchestrator carries them.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Verify:** Vitest for every rule and the rolled-back SQL checks above; the grid at 1440 and 375 with the worst kind covered; the phone's two acts; the form's five kinds, its confirm and its instant-hide line; a photo's own Report; `pnpm lab:smoke` whole. Name in the Handoff the walks the live red-team should take (a staged report of each kind; the hold's two ways; the host's view after each).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommended answer is BUILT and his to overrule; none is a one-way door (each is a function, a rule or a
component a later change reverts).

- **The kinds, their words and their order** (`lib/reports/kinds.ts`, the SQL enum's order under a parity test):
  A child in sexual or abusive content · Nudity or sexual content · Violence, a threat or hate · Someone's private
  details on show · Me or my child, and I want it down · Something else. The first two arrive covered in the queue;
  only the first hides at once. The overrule: other words or another split.
- **The instant hide's limits and its bar.** Built: at most 3 hides an address and 5 an event in any 24 hours, the
  event's host never, and ANY dismissed child-abuse report from an address bars its instant hide for good (the
  report itself is always filed and heads the queue). The overrule: other numbers, or a bar that lapses.
- **A false report's hide comes back at its dismissal**, and the dismissal's Undo hides it again (`hideUndoOf`); a
  held item stays down whatever the dismissal says.
- **An album report keeps every item of its album** from every permanent delete until it closes (an album report
  names no item, and "protects its item" read as the thing reported). The overrule: an album report keeps nothing.
- **A child-abuse reporter's keyed hash outlives the report** (`reporter_hash`, an HMAC under
  `UNLOCK_COOKIE_SECRET`, never the address), because the limits and the bar must know the address after the close
  forgets it. For the legal pass: the Privacy Policy's reports line names it beside the confirmed address.
- **Confirming on the form makes a free account** (the account door's own code; Google would leave the page and lose
  the form) and claims nothing. **A proof answer is words only**: asking a stranger for pictures would invite what
  must never be sent, and Ask for proof is never offered on the worst kind.
- **The proof mail's switch** (`ops_flags.report_proof_mail_enabled`, seeded OFF): his yes flips it, `update
  public.ops_flags set enabled = true where key = 'report_proof_mail_enabled'`; until then Ask for proof says so and
  writes nothing.
- **A phone's Take it down leaves the reports open** (`phone=stop`: the verdict and its note are a desk's); a phone's
  Hold for forensics is one press, Take it down too on, the report's reference as the reason.
- **The host's block takes a quietly held upload like any other** (event-safety r1 skipped one: under a quiet hold
  the photograph stayed in the emptied album and the confirm counted one fewer than she could see); let back in
  leaves it in Deleted, as restore_media refuses it; the list's count of what can come back leaves it out, as it
  leaves out a withdrawal.
- **An expired event an open report keeps** stays in the bin past its window (unseen by the host, off both of her
  figures) and its bytes stay on the physical meter (`storage_used_bytes`, which gates nothing) until the report
  closes; an item's kept delete leaves that meter at once (`purge_asked_at`).
- **The worst kind's reporter line** reads "email confirmed" or "no confirmed email" (what decided the hide) where
  every other kind reads "can be asked" or "can't be asked".

## System-doc edits (in place, owned facts only)

- `admin-observability.md` "Reports" (`9ea9919b`): the reporter the session's; the kinds' home; the instant hide
  and its alerts; the review grid and a phone's two acts; a verdict over its whole entry; a dismissal's way back for
  a hide; Hold for forensics with Take it down too on; Ask for proof behind its switch.
- `trust-safety-forensics.md` (`9ea9919b`): a hold is for what police should see and the quiet hold is the unticked
  one; what an open report keeps (`kept_media_ids`) and a kept delete deferred (`purge_asked_at`); a quietly held
  row takes the host's own acts; an operator's removal leaves her storage at once; the runbook's steps 1, 2 and 5.
- Relayed, not mine to edit (each a line the merge makes stale):
  - `billing-caps.md` "Three counters": `storage_used_bytes` goes down at an operator's removal or a deferred delete
    (`media_release_meter`, back up at an operator's restore) and in `purge_media_rows` only for a row not yet
    released; still gates nothing.
  - `lifecycle-recovery.md`: `purge_media_rows` never deletes a row `kept_media_ids` names (a hold, an open report);
    "Held media is excluded" becomes held media and anything an open report names; the standby bin and the Deleted
    figure also leave out an asked row (`purge_asked_at`); `purge_media_now` asks a kept row instead of deleting it
    (gone from her view and meter, purged the night its keeper lets go); an expired or deleted account's event with
    an open report is kept whole.
  - `database-security.md` (schema-pass's this batch): the triggers bullet's "A held row is skipped, never refused"
    is gone (a quietly held row takes the host's writes; leaving `removed` is still the restore RPC's alone);
    `create_report`'s new signature stays in the service-role list; the new functions (`kept_media_ids`,
    `defer_kept_due_media`, `report_queue_facts`: service role; `media_release_meter`, `reports_forget_reporter`:
    triggers) and `media.purge_asked_at` ungranted like the hold columns.
  - `host-app.md` (settings-wiring's) Block: "(a held one stays, as every host write leaves it)" becomes "(a quietly
    held one too, as every host write takes it)".

## Deferred (ROADMAP one-liners, bucket named)

- Admin: the reporter's closing note (`reporter=note`, admin-triage r2) stays banked: the report's close could tell a
  reporter who confirmed an address what became of it (from `triage-r2-wiring`).
- Admin: the People lane still wears round one's card inside the review grid; a person report in the grid's own look
  (the reported profile, its reasons, Mark actioned) is a round of its own (from `triage-r2-wiring`).
- Legal: the legal pass's reports line gains a child-abuse reporter's keyed hash, kept past the close for the instant
  hide's limits and bar (from `triage-r2-wiring`).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/triage-r2-wiring`:** `a154be1b` owns widened · `e3d8a53b` the wiring and migration
  `20260929140000_triage_r2.sql` · `120e701f` admin-triage retired · `0f7cfeea` the rules pinned and the
  rolled-back check at the migration's foot · `3d84447a` the block takes a quietly held upload · `9ea9919b` the two
  system docs · `d4357d5a` the local walk's fixes · `07f5d5f5` a checkpoint · and this manifest. **No sync:**
  launch-prep moved (crumbs-13 `3d2cfbd6`, lab-revamp stage one `a17725c3`, disposable-mode r2 `5c152977`, records)
  but nothing in my reads; the one shared path, `touchpoints.ts`, merges clean (`git merge-tree`: no conflict).
- **Gates, each on its own exit code, on `07f5d5f5`** (its code is `d4357d5a`'s; logs in
  `../partyreel-wt/_scratch/triage-r2-wiring/gate-*.log`): typecheck 0; lint 0 (3 warnings, none in a file I
  touched: crumbs-13 removed them on launch-prep); test 0 (578 files, 6,584 tests); `build-lock.sh pnpm build` 0
  (`/report/[token]` built); `lab:smoke --base http://localhost:3134` 0 (156 checks, 0 failing; admin-triage gone
  from the lab). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths + the two system docs + this
  file, and these exceptions, each with its why:
  - `lab/boards.ts`, `sandbox/registry.ts`, `touchpoints.ts` (lab-revamp's): the board's retirement lines, as the
    brief names them; `admin-bar.tsx`'s comment that named the board is owned.
  - `library/compositions/composition-demos.tsx` and `gallery-demos.tsx`: the Library's Reports specimen mounts the
    real `ReportQueue` over writes that change nothing (the card it redrew is gone); the portal's one local eye.
  - `marketing/help/step-screens/door-screens.tsx` and `step-screens.test.ts`: the help's picture of the report form
    quotes the form, so it wears the kinds and the new lede.
  - `lib/billing/storage-summary.test.ts`: her Deleted figure leaves an asked row out (reshaped, scar kept).
  - `lib/db/migration-guards.test.ts` (schema-pass's): the guards on functions this migration replaces
    (held_event_ids, standby_hosts, purge_media_now, restore_event, block_from_event, get_my_uploads,
    remove_my_upload), each reshaped with its scar; `lib/db/queries/media.ts` (schema-pass's): one Omit line,
    `purge_asked_at` ungranted like the hold columns.
  - `lib/forensics/migration-guards.test.ts` and `legal-hold.ts`: `purge_asked_at` joins the ungranted columns; the
    hard-delete path list names `kept_media_ids`.
- **Items:**
  - `look=grid`: `components/admin/report-queue.tsx`, harm in front (split cards, the two sexual kinds covered until
    View once), People between, the sweep (4:5 tiles, X ticks, Enter or the bar dismisses, Undo); Space opens a
    report whole with every reason, the proof thread and the verbs; the rail's and the bell's urgent count.
  - `harm=kinds`: the form asks the kind before Submit can send; `reports.kind`; the queue sorts and covers by it.
  - `proof=confirm`: Confirm your email on the form (the door's code only); the address the session's, kept only
    while the report is open; Ask for proof's record (`proof_*`, `/report/<token>`, the answer route), the mail
    behind its switch, OFF.
  - `phone=stop` with his note: Take it down now and Hold for forensics on a phone, one press each.
  - The hold rebuilt: Take it down too, on by default, takes everything the hold reaches down before any copy
    starts; unticked is the quiet hold; an operator's removal leaves her meter at once (and the backfill takes the
    standing ones off); an open report keeps its item, its album's items and its event from every permanent delete,
    a kept delete deferred (`purge_asked_at`); a quietly held row takes her own acts and her block.
  - The instant hide: a confirmed child-abuse report of a photo hides it at once as an operator's removal, with its
    limits, its bar and the host's exception; the ops inbox mailed and the portal signalled at once; a dismissal
    puts it back.
  - A photo's own Report in the viewer (only where the album's form listens), opening the form with it named.
  - A verdict answers its whole entry; the sweep's one press; the phone takedown's Undo.
  - Retired: the admin-triage board (the ledger `docs/reviews/admin-triage.json` is yours to delete).
- **Proposed migration:** `supabase/migrations/20260929140000_triage_r2.sql`, its APPLY PROTOCOL in its header
  (the md5 read before and after, advisors: no delta expected). Proved on the live schema 2026-09-29 as one
  `begin … rollback` with the file whole: setup and steps 1 to 10 ok, nothing left behind (no `report_kind`, no
  `purge_asked_at`, the old `create_report`, no switch row, the updated_at trigger on); live md5 of every replaced
  body equals its source migration's. **Deploy right after the apply** (the old build's purge would delete a kept
  item's object). Then regenerate `src/lib/db/types.ts` and drop the seams: `src/lib/db/triage-seam.ts`
  (`seamFrom`/`seamRpc` to typed calls), `createReport`'s three-argument fallback, `purgeMediaNow`'s hold fallback
  (`readKeptForPurge`), and the two 42703 maps (`readProofAsk`, `answerProof`). Env: none new
  (`UNLOCK_COOKIE_SECRET`, `CONTACT_NOTIFY_EMAIL` exist). No Worker, Vercel or Stripe change.
- **Relay, `content/help/report-a-problem-as-a-guest.mdx`** (settings-wiring's `content/help/`): the whole new
  article is `../partyreel-wt/_scratch/triage-r2-wiring/report-a-problem-as-a-guest.mdx`, checked against the help
  tests in place (labels, compile, links, screens: 271 passed) and restored. What changes: the description (report
  the photo from the viewer, or the album from the foot); keywords "report a photo" and "child safety"; the two
  doors (the photo's own Report first); the steps (Tap Report; Pick what it is, and say what's wrong; Submit); "the
  host is never told who reported" and Confirm your email in place of "Reports are anonymous"; What happens next
  without "Nothing is removed the instant a report arrives"; the callout "The report covers the event" replaced by
  one on the worst kind (a confirmed email hides the photo at once, while we look).
- **Live red-team walks (after the apply and the deploy), on disposable events:** (1) a report of each kind: the
  grid's lanes, the covered front, the sweep's ticks and one Dismiss with its Undo; (2) a child-abuse report of a
  photo from a confirmed test account: hidden at once, the ops-inbox mail and the urgent count; its Dismiss puts it
  back and the Undo hides it again; a fourth from one address and a report after a false dismissal hide nothing;
  (3) Hold both ways, desk and phone: with Take it down too the host's album, her Deleted and her storage figure
  drop at once; quiet, the item stays and her Remove, Hide, Delete permanently and block of its uploader read like
  any other, her restore refused in the vague words; (4) an open report: her Delete permanently of a reported
  removal leaves her view and meter, the row waits for the close; (5) the photo's Report on a guest album, and none
  on her own album, on her own upload or in the bin; (6) Ask for proof refused while off; after his yes, the mail,
  the answer on the report, the link dead after one use and at the close; (7) anon and another host refused:
  `create_report`, `kept_media_ids`, `report_queue_facts` not executable by `anon` or `authenticated`.
- **Verified locally on :3134** (the portal cannot sign in locally): the Library's grid at 1440 and 375 (the covered
  front with View once and the runbook line, the peek's verbs, Hold's confirm with Take it down too on and its quiet
  words unticked, a phone's one-press acts with Undo, no horizontal scroll); the guest form on a disposable event
  (six kinds, Submit waiting for one, the instant-hide lines for the album and a photo, Confirm your email's code
  door and back with the kind kept); a video's own Report opening the form over the viewer and closing back to it;
  `/report/<token>`'s spent page.
- **Assets requested from Will:** none.
- **Board ideas:** the People lane in the grid's own look (Deferred above); a lapse or an appeal for a barred
  address (the Question on the bar).
- **Look at first:** Hold for forensics' confirm (Take it down too, and the quiet words), the form's instant-hide
  line, and the grid's front at 375.
