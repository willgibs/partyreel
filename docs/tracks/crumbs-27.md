---
track: crumbs-27
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0f267164"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue.ts
  - src/lib/events/event-blocks.ts
  - src/components/app/host-media-grid.tsx
  - src/lib/guest/reconcile-album-items.ts
  # added by the lane, each with its reason:
  - src/lib/guest/use-upload-queue.test.tsx            # item 2's test: a silent join that lands waiting
  - src/lib/shared/arrival.ts                          # item 4: the one pure diff, beside arrivalMarks
  - src/lib/shared/arrival.test.ts                     # item 4: the diff's own pins
  - src/lib/guest/reconcile-album-items.test.ts        # item 4: newArrivalIds reads it, and keeps the guest's seed rule
  - src/components/app/host-media-grid.test.tsx        # item 4: the host album reads it
  - src/components/app/event-feed/launch-list.test.tsx # item 4: its "arrival diff" describe imported newItemIds, which goes
  - src/lib/db/queries/event-blocks.ts                 # item 3: the door is read for everyone in the list (Only me changes a landing for someone who was in)
  - src/lib/events/event-blocks.test.ts                # item 3's words and landing
  - src/lib/db/queries/event-blocks.test.ts            # item 3: "everyone was in: the door is never read" is reshaped
  - src/lib/guest/session-owner.server.ts              # item 1: the read side of the owner rule, beside the write side's check
  - src/lib/guest/session-owner.test.ts                # item 1's pins
  - src/lib/events/closed-door.server.ts               # item 1: the door's caller carries only tickets that are hers
  - src/lib/events/closed-door.server.test.ts          # item 1's pins
  - src/lib/db/queries/event-doors.ts                  # item 1: a block on a ticket she may not speak through still holds the phone (event_ticket_blocked, the one-browser hold)
  - src/lib/events/gallery-access.server.ts            # item 1: A photo first reads her tickets
  - src/lib/events/gallery-access.server.test.ts       # item 1's pins
  - src/lib/export/yours.server.ts                     # item 1: the export's own ids
  - src/lib/export/yours.server.test.ts                # (new) item 1: the export's Yours over a shared phone
  - src/app/api/guests/mine/route.ts                   # item 1: the tracker's statuses and the ids read only tickets that are hers
  - src/app/api/guests/mine/route.test.ts              # item 1's pins
  - src/lib/events/album-viewer.server.test.ts         # item 1: its door runs the real `doorCallerFor`, which now imports `session-owner.server`: stood in for, and the album routes' door pinned
  - src/components/guest/live-gallery.test.tsx         # item 1: the album's own Yours already read the account alone; pinned so the four readers agree
  - src/components/app/event-blocks/blocked-section.test.tsx  # item 3: the confirm and the toast at Only me, through the component
  - src/components/guest/event-experience.tsx          # ONE-LINE EXCEPTION (a few lines): hands the queue `doorOpen` (access not `none`), which resumes files held for the door, and its silent join no longer adopts a waiting ticket
  - src/lib/guest/join.ts                              # item 2: `passedTicket`, a join's token only when the door passed it (the page's silent join reads it)
  - src/lib/guest/join.test.ts                         # item 2: its pins
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/crumbs-27

**Goal.** Four follow-ups from the latest lanes: a signed-in account's own reads on a shared phone as the upload now reads them, a silent join that lands waiting handed to the door's ask, Let back in's words true at Only me, and the arrival diff written once.

## The brief

Four items the latest lanes deferred (ROADMAP's lines), each fixed at its root with a test that fails on today's code:

- **A signed-in account's own reads on a shared phone.** Her Yours (the album's filter and the export's `ownMediaIds`), the door's standing and A photo first still read the name-only ticket the phone holds for the album, until her own replaces it at her first upload there. Read them as the upload now does since `crumbs-26`: her own row, or one the claim takes.
- **A silent join that lands waiting.** On a gated album, after another guest's ticket went down, the queue's silent join lands waiting, sends the file on, and fails it with "This event is private.". Hand her to the door's ask instead (`acquireTicket`; this was pre-existing for an account's own ticket too, and is reachable more now).
- **Let back in at Only me.** On someone who was in, while the album is Only me, Let back in still promises "They'll be able to open X and add photos again", which is true only once the host opens it. Say what happens at Only me, in the product's voice, beside `crumbs-24`'s four landings (`BlockedPerson.lands`).
- **The arrival diff, written once.** "An id in this render that was not in the last" is written twice: `newItemIds` in `host-media-grid.tsx` and `newArrivalIds` in `lib/guest/reconcile-album-items.ts`, which also answers nothing for an empty first snapshot. Put one pure function in `lib/shared/arrival.ts` beside `arrivalMarks`, and have both read it.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours.

The shared phone and the signed-in hub cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start (the Yours readers, the door's standing, `lib/shared/arrival.ts`): add each to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

1. **Does a block on a ticket the phone holds still shut out a signed-in account that is not its owner?** **Recommended, built: yes, as today.** A typed name's block holds the phone that used it (`event_ticket_blocked`), and the upload's own context still reads a blocked ticket as private, so the door keeps saying so: only what a ticket ADMITS (let in, waiting, contributed, Yours) is hers alone now. Sorting every ticket out of a signed-in door would have let the phone's block go while presign still refused it (the album in view, every upload "This event is private."). The cost is one more read (`event_ticket_blocked`), only when a ticket was set aside.
2. **What does a silent join that lands waiting do with her files?** **Recommended, built: hand her to the door, hold the files, resume them at the door's opening.** The files wait `queued` (nothing sent, nothing failed), the page refreshes onto the held door (the join's cookie is the ticket it reads), and they go up the moment the page's door opens (`doorOpen`, a new queue parameter: `access` not `none`) on a fresh join, which mints her ticket `in`. The queue adopts no waiting ticket, and neither does the page's own silent join (`EventExperience`'s "past the door is a ticket" effect, which fires the moment the queue puts a ticket down and so races the queue's join: it reads `passedTicket`). Not built: failing the files in place with a truer sentence and Retry (simpler, but a failure sheet for someone the host simply has not answered).
3. **Does the guest's seed rule (an empty last snapshot names no arrival) go with the diff written once?** **Recommended, built: no.** `newIds` is the pure sentence; the host seeds its own state from its first render, so an empty album's first photograph arrives there, and the guest's `newArrivalIds` keeps its one line, since its snapshot is empty BY DESIGN at a teaser and a locked page and the album that opens under a mounted provider is not an arrival. The two still differ on a real empty album's first photograph (the host glows it, the guest does not): a Deferred line, not built.
4. **What does Let back in say at Only me for someone who was in?** **Recommended, built: a fifth landing, `only_me`.** The confirm: "Maya's 30th is Only me right now, so they'll meet a closed album until you open it. Then they can add photos again."; the toast says only that the block is lifted ("Sam is no longer blocked.") and what came back. The door is now read once for everyone in the Blocked list, not only for a newcomer.
5. **May a read run the claim?** **Recommended, built: yes, as the upload does, for a signed-in viewer and a name-only ticket only.** `sortTickets` asks `claim_anonymous_uploads` as her about those tickets, so a ticket she typed before she signed in speaks for her from the first read instead of after her next upload; it changes exactly what her sign-in's claim would. A failed read or claim sets every ticket aside and is captured, never thrown (a read must not fail a page; the writes keep throwing).

## System-doc edits (in place, owned facts only)

Three `docs/systems/` files, each fact refined in its one home (none is under `owns`; they are the lane check's listed exception):
- `guest-flow.md`: the door's caller carries only her tickets (with the block that still holds the phone); the owner rule's read side (`sortTickets`, what read the ticket, and that the album's own filter never did); the queue's waiting join (the files wait, `doorOpen` resumes them); the arrival's one diff and the guest's seed rule; Yours' read of the ticket.
- `host-app.md`: Let back in's landing at Only me, and the door read once for the whole list.
- `uploads-and-r2.md`: the export's Yours reads the ticket as far as it is hers.

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a real empty album's first photograph glows for a host and not for a guest (`newArrivalIds` answers nothing for an empty last snapshot, a seed rule that exists for a teaser's and a locked page's empty answers); knowing the difference (the store's `status` is `ready` for a real album) would let the guest glow it too (from `crumbs-27`).

## Handoff (replaces the chat report)

- **Commits, pushed** (`git log origin/lp/crumbs-27`): the manifest's claims and the four items with their tests and docs `7a4b8b7e`; the hardening `52aa5bce` (a string that is not a token never reaches a filter list, a waiting join lets go of the spent ticket, two docs read as facts); then this manifest alone. launch-prep had not moved (`eec87a8a` is the tip and the merge base), so there is no sync commit.
- **Gates on `52aa5bce`, each on its own exit code** (logs in `../partyreel-wt/_scratch/crumbs-27/gate/`, `final-*`): `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (656 files, 7,851 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (139 checks, 0 failing; scope: the Library, `event-ready` and `locked-door`, which import `event-blocks.ts` and `join.ts`). No board of mine, so no `lab:demo`. The PREMISE lines name `disposable-mode`, `event-ready` and `locked-door`, whose asks describe the system docs and files this lane refined: re-read them before his next sitting.
- **Red on launch-prep, green here** (`../partyreel-wt/_scratch/crumbs-27/red-run.log`: the lane's test files copied over a throwaway worktree at `eec87a8a`, 45 failing across 14 files; the same files green in the gate). By item: 1, 23 (`session-owner.test.ts` 10, `closed-door.server.test.ts` 4, `mine/route.test.ts` 3, `gallery-access.server.test.ts` 2, `yours.server.test.ts` 2, `album-viewer.server.test.ts` 2); 2, 7 (`use-upload-queue.test.tsx` 4, `join.test.ts` 3); 3, 6 (`event-blocks.test.ts` 3, `db/queries/event-blocks.test.ts` 2, `blocked-section.test.tsx` 1); 4, 9 (`arrival.test.ts` 6, `host-media-grid.test.tsx` 2, `reconcile-album-items.test.ts` 1). The one green file, `live-gallery.test.tsx`, is the album's own filter, which never read the ticket (below). One assertion came after that run and was seen red with its line removed: the spent ticket the waiting hold lets go of (`use-upload-queue.test.tsx`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 34 files): every file is under `owns`, this manifest, or the three `docs/systems/` files above. Paths added to `owns` beyond the four (each with its reason in the frontmatter): 26 files, the frontmatter's list being the record; a few were added as I reached them rather than before the first edit (`event-experience.tsx`, `blocked-section.test.tsx`, `album-viewer.server.test.ts`, `yours.server.test.ts`, `live-gallery.test.tsx`, `join.ts` and `join.test.ts`). The one exception is `event-experience.tsx` (a few lines: `doorOpen`, and its silent join reads `passedTicket`).
- **The items, one line each:**
  1. **A signed-in account's own reads on a shared phone** (`7a4b8b7e`): `sortTickets` (`session-owner.server.ts`) sorts the tickets a request carries into the ones that may speak for her (her own row, or a name-only one the claim takes, asked as her) and the rest; the door's caller (`doorCallerFor`), A photo first (`resolveViewerDecision`), the export's `ownMediaIds` and `/api/guests/mine` (ids and her tracker's statuses) read only hers, so another guest's ticket can neither let her in, hold her nor wait for her at the door, count its contribution as hers, nor list its photographs as hers. A block on a ticket set aside still holds the phone (`event_ticket_blocked`, live: `readTicketsBlocked`). **The album's own filter needed no fix**: `LiveGallery` asks `/api/guests/mine` only while signed out, so a signed-in account's Yours there was already her account's; pinned (`live-gallery.test.tsx`).
  2. **A silent join that lands waiting** (`7a4b8b7e`, `52aa5bce`): the join is the ask, so the queue (`takeJoin`) adopts nothing, sends nothing and fails nothing; the files wait `queued` (a first Add's picks, a clip and the verified re-join hold the same way), `onDoorNeeded` refreshes onto the held door, and they go up on a fresh join the moment the page's door opens (`doorOpen`, `access` not `none`). `passedTicket` (`join.ts`) keeps the page's own silent join from adopting a waiting ticket too.
  3. **Let back in at Only me** (`7a4b8b7e`): a fifth landing, `only_me`; the confirm reads "Maya's 30th is Only me right now, so they'll meet a closed album until you open it. Then they can add photos again." and the toast "Sam is no longer blocked." (plus what came back); the door is read once for everyone in the Blocked list. Looked at in the confirm at 1373 and 375 (a scratch page, deleted, never committed).
  4. **The arrival diff, written once** (`7a4b8b7e`): `newIds` in `lib/shared/arrival.ts`, read by the host's grid (`newItemIds` is gone) and by `newArrivalIds`, which keeps the guest's seed rule as its one line.
- **Reshaped tests, each with its scar** (marked in the files): `event-blocks.test.ts` "someone who was in comes back in at every door" now stops at the gates (a gate never stops someone already in; Only me has its own test); `db/queries/event-blocks.test.ts` "everyone was in: the door is never read" now reads it once as the host (the door decides Only me for someone who was in), and that describe's fixture gains its `events` row; `launch-list.test.tsx` loses its "arrival diff" describe to `arrival.test.ts`.
- **Verified on localhost, signed out** (the signed-in hub and the shared phone cannot run there): the demo album's Add end to end on :3131 (two files through the door's upload step and Send: two `blob:` tiles beside the nine, no app error; the console's only errors are R2's CORS refusal of localhost, the same on any localhost load); `/api/guests/mine` ids and statuses (an unknown ticket, a malformed one with a comma and quotes, none: each `ok` with an empty list, `{}` 400) and `/api/export/guest`'s summary on the real database. Against the live schema (read only): `event_ticket_blocked(uuid,text[])` and `claim_anonymous_uploads(text[])` exist with the grants the code assumes (`service_role`; `authenticated`), and `sortTickets`' read runs (`_scratch/crumbs-27/readowners-shape.mjs`, made-up tickets: no rows, no error).
- **For the next build's red-team, the shared phone first** (disposable albums by willg97; restore by deleting them; SQL reads `guests` and `media` by id; `partyr33l` is the account, whose profile name's first word is not "Sam"):
  1. *A photo first, the ticket that is not hers.* Album A: Public, names-only, Require an upload to view ON. Signed out with 0 tickets on the browser: type "Sam Partyreel", add one photo (M1, Sam's row, `user_id` null). Sign in as partyr33l (chooser) and open A: she meets the door's upload step ("add a photo") and not the album (before this lane Sam's contribution let her in). Add one photo: it goes up on a NEW row of hers (`user_id` partyr33l), the album opens, and View, Showing, Yours (1) lists only hers; Download's Yours row says 1 file and its zip holds her photograph alone, never M1.
  2. *The door's standing, the ticket that is not hers.* Album C: Public, names-only. Signed out, "Sam" adds a photo. willg97 then sets C to "You let each person in" (Private, the gate; An email first comes on). Sign in as partyr33l on that phone and open C: the door's ask ("lets each guest in", Ask to join), never the album (before this lane she read it through Sam's ticket, and her first Add landed waiting and failed "This event is private."). Ask to join: the held door; willg97 Lets in from At the door: hers opens by itself onto the album.
  3. *A block still holds the phone.* Album B: Public, names-only. Signed out, type "X", add a photo; willg97 blocks X (a typed name). Sign in as partyr33l in that browser and open B without adding: the shut screen, as before this lane; sign out (every ticket goes down) and in again: her own standing.
  4. *A silent join that lands waiting, held.* Album E: Public, names-only. Signed out, "Sam" adds a photo; sign in as partyr33l and open E (the album opens; she has no row of her own yet). In another tab willg97 sets E to "You let each person in". In her open E tab, without reloading, Add and Send one photo: no failure sheet and no "This event is private."; the page refreshes onto the held door; willg97 Lets in; her door opens by itself and the photograph goes up under her name (`media.guest_id` a row with `user_id` partyr33l, `admission` in) and shows in the album.
  5. *Let back in at Only me.* Album F: Public. A guest "Sam" (typed) adds a photo; willg97 blocks Sam from the Guests room, then sets F to Only me. Blocked, Let back in: the confirm says the album is Only me and stays closed until he opens it, then the toast "Sam is no longer blocked."; F back to Public and Sam's phone opens it and adds. Controls: at Public Let back in still says "They'll be able to open F and add photos again." ("Sam can join again."); a declined newcomer at "You let each person in" still says "They'll be back at the door".
  6. *The arrival diff.* Unchanged behaviour, so a glance: the hub's album takes a guest's live upload with its glow (build 29's walk), and the guest album takes another guest's photograph the same way.
- **Assets requested from Will:** none.
- **Board ideas:** a Library specimen for `BlockedSection` (the Guests room's foot) at each landing (in, only me, door, password, out), so `lab:demo` holds the confirm's words, which three lanes have now moved and only unit tests hold; a real empty guest album's first photograph glowing as the host's does (Deferred, above).
- **ROADMAP lines this retires** (`docs/ROADMAP.md` at `eec87a8a`): 21 (the arrival diff), 23 (the shared phone's own reads), 24 (the silent join that lands waiting) and 26 (Let back in at Only me); it adds the one Deferred line above.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - A block on a ticket a signed-in account may not speak through still holds her phone (Q1): the door keeps reading it, one more read (`event_ticket_blocked`) only when a ticket was set aside.
  - A join that lands waiting holds her files for the door and resumes them at its opening, where the alternative was failing them in place with a truer sentence (Q2); if the host answers before the refresh lands the door never shuts and the files wait for her next Add.
  - The guest's seed rule stays, so a real empty album's first photograph glows for a host and not for a guest (Q3).
  - The confirm's words at Only me and the toast that promises only that the block is lifted (Q4).
  - A read runs the claim for a signed-in viewer's name-only ticket, as the upload does (Q5): a ticket she typed before she signed in speaks for her from the first read; a failed sort sets every ticket aside and is captured, never thrown.
- **Look at first:** `src/lib/guest/session-owner.server.ts` (`sortTickets`), then `src/lib/guest/use-upload-queue.ts` (`takeJoin` and the `doorOpen` effect).
