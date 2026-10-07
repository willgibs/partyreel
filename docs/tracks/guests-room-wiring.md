---
track: guests-room-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/app/event-blocks/blocked-section.tsx
  - src/components/app/event-blocks/blocked-section.test.tsx
  - src/components/social/guest-peek.tsx
  - src/components/social/guest-peek.test.tsx
  - src/components/app/event-blocks/credit-look.tsx
  - src/components/app/event-blocks/credit-look.test.tsx
  - src/lib/db/queries/guest-look.ts
  - src/lib/db/queries/guest-look.test.ts
  - supabase/migrations/20261008020000_guest_look.sql
  - src/app/(dev)/design/sandbox/guests-room/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/guests-room.json
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
  - docs/systems/database-security.md
  - src/components/social/guest-list.tsx
---

# lp/guests-room-wiring

**Goal.** The Guests room and a person's card as Will picked at guests-room r1: one calm row for every person, and a card from every name holding who they are, their photos and their standing tonight.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3134 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/guests-room.json` round 1; the board draws both on the room as wired):**
- **`rows=list`:** every person one row, wherever they stand (at the door, a guest, invited, blocked): face, name, how they stand, its one act at the end; the door's count wears the tally (`--needs-you`). With the card below, the door's Decline leaves the row, so each row keeps one act (Let in at the door).
- **`card=standing`:** the card every name opens (in the room, the album's guest list, a photo's credit): who they are, four of their photos and See all (the album filtered to that guest), Follow and their page kept quiet, Block last; plus, for the host, how they stand tonight and its act (Decline lives here now). A guest's own side of the card has no host lines. Your neighbour's note on the guest side's card: `guest-list.tsx` renders `GuestPeek`; keep `GuestPeek`'s props stable (account-moments-wiring-2's Connections opens it too) and `FollowButton` as account-moments-wiring-2 renders it.

**The board's carried calls, as taken:** among the guests, who added most first, eight then a page at a time; at a desk the card opens beside the room's panel, its top at the name; the people who added photos head their section GUESTS and their count.

**The look's read:** a guest's photo count and four of their pictures are not on the list today. Read them through RLS where the host's own read allows (a new `lib/db/queries/guest-look.ts`, never `social.ts`), chunked and counted as CLAUDE.md's PostgREST trap says; only where RLS cannot serve it, a SECURITY DEFINER read in `supabase/migrations/20261008020000_guest_look.sql`, checked host-of-this-event inside, granted exactly (database-security.md), proved RED then GREEN in a rolled-back `execute_sql`, never applied by you. The guest's side card shows only photos the album already shows her (approved, visible).

**ROADMAP lines you close (quoted by their opening words):** Immediate's "Design: the Guests room's focus stragglers"; "the look (`social/guest-peek.tsx`) puts the face in the sheet title"; "a look's Follow reads Follow again on reopen"; "a let-in guest who adds nothing is on no list" (say what the room now shows); "the guest list sorted by upload count" (in the room); "the look's strip".

**Retire the guests-room board:** delete `src/app/(dev)/design/sandbox/guests-room/` in your branch; the Orchestrator deletes its ledger at your record.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended, and is Will's to overrule.

- **The look's read: no migration?** Built: no. The person's tickets are the service role's behind each side's own
  gate (the host proven inside the read, as `guest-addresses.ts` does; a guest behind `resolveAlbumViewer` at `full`),
  the host's photographs her own RLS read, a guest's minted by the album's own gated minter. Why: today's grants and
  gates serve both sides, the advisor set gains no authenticated function, and the lane walked every path end to end
  before anything was applied. `supabase/migrations/20261008020000_guest_look.sql` is unused, its slot free.
- **See all: where?** Built: a panel of their photographs (the list kind: beside the screen at a desk, the whole
  screen in a hand, the phone's Back closing it), a page of 24, each one opening the shared viewer. Why: the album
  pages themselves are other lanes' (the hub's, the guest page's); the album filtered in place is a board idea below.
- **Which photographs, and "in since" what?** Built: what the album shows, approved and visible (never held, hidden or
  sealed), on the host's card too, newest first; "In since" is their first such photograph's landing, in her zone.
- **How does a guest's card know its album?** Built: from the page's own address (`/e/<token>`), so the album's list
  (`guest-list.tsx`) and the guest page (crumbs-91's) moved nothing; anywhere else (Account's Connections, her page's
  chips) a card shows no photographs. The explicit alternative is a provider around the list in `e/[token]/page.tsx`.
- **A let-in guest who adds nothing: what does the room show?** Built: she is held in a quiet fold at the guests' foot,
  "N in, nothing added yet", uncounted (the head keeps the one count), each a row whose card says "In · nothing in the
  album yet" with Block, until a photograph of hers lands. It holds anyone past the door with nothing the album shows
  (a typed name who joined too), since no record says whom the host let in herself.
- **Follow in the host's card?** Built: yes, the quiet pair's Follow where the guest has a page and no block stands
  either way (the room reads her own follows among the people it lists); a Follow landed from a card is kept for the
  page's life, one answer per person, and says her first follow's private line (account-moments r2, `follow=once`).
- **Blocked's when:** built as the block's time tonight ("9:12 PM") or its day ("Sep 28"), where the row said
  "Blocked Sep 28"; the card says "Declined at 9:12 PM · still asking" or "Blocked on Sep 28 · 4 uploads in Deleted".
- **A mixed person's column:** built as "N uploads" (Review's word for a mix); photos alone "N photos", videos "N videos".
- **A photograph opened from the card:** built to drop back into the name that opened the card (the card closes as
  the viewer opens), and from the panel into its own tile there, the keyboard with it.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the Guests room's read (what each person added, the quiet, her relations), every
  person one calm row, At the door's one act and its tally with Decline in the card, Invited's rows (4a98c37b2).
- `docs/systems/profiles-social.md`: a person's card shows nothing the album does not, where it reads its photographs,
  whose surfaces hand it the host lines, and the kept Follow (4a98c37b2).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming · Code hygiene: retire `blockedSince`, `blockedLineParts` and `LET_IN_LINE` (`lib/events/event-blocks.ts`),
  which the Guests room no longer calls (only their own tests do) (guests-room-wiring).
- Upcoming · Profiles: the album list's chip Follow (`social/guest-list.tsx`) is a second face of the relation beside a
  card's own; read the card's kept answer (`guest-peek.tsx`'s `kept`) there too, so a Follow from either reads
  Following on both (guests-room-wiring).
- Upcoming · Host: the Guests room reads the album's approved guest rows twice a read (`getEventGuests` for the list,
  `readHostGuestFacts` for the counts); one read could answer both (guests-room-wiring).
- Upcoming · Code hygiene: `guest-look.ts`'s `readQuietCards` restates the four public card columns because
  `social.ts`'s `getProfileCards` is private; export it and read through it (guests-room-wiring).
- Upcoming · Host: a Decline or a Let in from a card leaves focus on the room's panel once its row leaves; move it to
  the next row's name (as the row's own act did before) (guests-room-wiring).
- Upcoming · The Library: the "At the door and Invited" specimen's hint says "Let in · Decline, then Undo on its
  toast"; Decline is a name's card's now (`library/compositions/gallery-demos.tsx`) (guests-room-wiring).

## Handoff (replaces the chat report)

- **Commits, pushed:** the work 0dff04530 (the room, the card, the reads, the board retired), 4a98c37b2 (the panel's
  line while it reads; the two system docs), 9859ce2b3 (a card's panel and viewer mount on first use); syncs
  a942709d5 (launch-prep at 9086b48f5) and 5a3ba5957 (launch-prep at f0623106f, account-moments-wiring-2 merged:
  resolved in the card, whose own Follow now says her first follow's private line, and the chips' look test reads
  "Their page"). Head 5a3ba5957 before this manifest's commit.
- **Gates on 5a3ba5957, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (1,103 files,
  14,045 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3134` 0 (188
  checks, 0 failing). No board, so no `lab:demo`. The production build was also walked on port 3134: the card's
  lazily loaded Server Functions answer there, host side and album side.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is the owned paths (`dashboard/[eventId]/guests/`,
  `blocked-section*`, `guest-peek*`, `guest-look*`, the board's folder deleted), the two system docs and this file,
  and these exceptions: `components/app/event-feed/feed-section-header.tsx` (a `needs` prop: the door's count wears
  the tally, the room's one section header taking the tone rather than a second header); `components/app/
  event-settings/door-page.tsx` (two links take the house halo: the focus stragglers line this lane closes);
  `lib/events/event-blocks.ts` (one comment line: `since` is the room's short when now); `components/social/
  guest-list.test.tsx`, `app/(app)/account/page-connections.test.tsx` and `app/(guest)/u/[slug]/connection-chips.
  test.tsx` (the card's door reads "Their page"; the list's test stands the look's actions in);
  `library/components/popup-demos.test.tsx` (the profile actions stood in: the card's Follow runs `useRelation`);
  `lib/db/queries/social.guest-identity.test.ts` (two pins reshaped: no file hands the guest list an address or Block
  now, the room drawing its own rows; the card's host lines are pinned by `guests/room-rules.test.ts`).
- **The room (`rows=list`):** every person one calm row on Settings' card (`guests/room-rows.tsx`): At the door with
  one act, Let in, its count in the tally; the guests who added most first with their count as a column, eight then a
  page of 24, focus following the fold (`room-guests.tsx`); the people in with nothing added yet folded at the foot;
  Invited's not-yet rows beside empty seats and the joined folded with faces; Blocked unlit, dimmed faces, when beside
  the name and how they left under it.
- **The card (`card=standing`, `social/guest-peek.tsx`, props kept, new ones optional):** who they are as one block,
  the face out of the sheet's title; for the host how they stand tonight and its act (Decline and Let in at the door,
  the way back in Blocked, "In since" for a guest), four of their photographs and See all, Follow and their page as a
  quiet pair, Block last; at a desk beside the room's panel, its top at the name; a guest's side with no host lines.
- **The reads (`lib/db/queries/guest-look.ts`, `guests/look-actions.ts`, `guests/look.ts`):** the host's proven
  inside, a guest's behind the album's gate; antagonistic replays of both Server Functions on port 3134 answered
  `{ok:false}` for another host's guest, another host's event, a signed-out caller, a page past 24, a cursor that is a
  filter, a private album, a photograph as the person, an unknown token, the host as her own guest and another
  album's ticket, and a guest's answer carries no address (`guests/look-actions.test.ts` holds each).
- **ROADMAP lines closed:** "Design: the Guests room's focus stragglers" (the invite field is the house's well with the
  halo, a remove by keyboard keeps focus in the list, the door page's two Guests links take the halo); "the look puts
  the face in the sheet title"; "a look's Follow reads Follow again on reopen" (the card's own Follow, kept per
  person; the list's chip is a Deferred line); "a let-in guest who adds nothing is on no list" (the room now holds her
  in "N in, nothing added yet"); "the guest list sorted by upload count" (in the room); "the look's strip".
- **The board retired:** `src/app/(dev)/design/sandbox/guests-room/` deleted; its ledger `docs/reviews/guests-room.json`
  is the Orchestrator's.
- **Test data to delete:** the event "guests-room-wiring (disposable)" (0c69787d-e4ee-474d-a7ab-2d576cee7dfe,
  willg97's, Private with the invite list as the door): hi@willgibs.com's ticket there (5adf2d42-6c63-44b2-9777-
  45f5c0b416c2: inserted by SQL as a waiting ask, declined and let in through the room, set waiting again by SQL and
  let in from her card at a phone) and two invite addresses at example.com.
- **A slip in my cleanup, put right:** a `pkill -f "node drv.mjs"` at 21:31 UTC stopped no-signal-wiring's red-team
  driver (its own port 9971) along with mine; I restarted it at 21:33 with its own `RT_DIR` and port, its pid in its
  `drv.pid`, and re-attached its device H1 from its `ctx.json` (its Chrome never stopped). A call its walk made in
  those two minutes was refused. Never a process name again, only my own pid or port.
- Assets requested from Will: none.
- Board ideas: See all as the album itself filtered to one person (a dismissible chip over the hub's or the guest
  page's album, the viewer walking all of theirs), where this lane drew a panel; the card's strip leading with their
  most-liked photographs rather than the newest.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls for Will: none.
- Look at first: a name's card in the room at a desk and in a hand (`/dashboard/efdaa41e-6434-45d0-8061-d3be396833ca?room=guests`,
  "guest-requests attr probe (test)": See all, a photograph, back out), the same card from the album's guest list as a
  guest (`/e/f93280beb59f47d2ad104c55a7a5be60`), and the door, Blocked and the quiet fold on the disposable event.
