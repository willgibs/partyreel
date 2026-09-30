---
track: crumbs-27
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
