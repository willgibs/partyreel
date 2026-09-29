---
track: safety-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "69afdbc5"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260928120000_event_blocks.sql
  - src/lib/db/mutations/event-blocks
  - src/lib/db/queries/event-blocks
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/social/guest-peek
  - src/components/social/guest-list
  - src/components/app/event-settings/profile-social-card
  - src/components/app/share/event-sheets
  - src/app/(guest)/e/[token]/page.tsx
  - src/lib/db/mutations/social
  - src/lib/db/queries/social
  - content/help/profiles-guest-lists-and-following.mdx
  - src/app/(dev)/design/sandbox/event-safety/
  - src/components/app/event-blocks/
  - src/lib/events/closed-door
  - src/lib/events/event-blocks
  - src/lib/events/album-viewer.server
  - src/app/(guest)/e/[token]/card/route.tsx
  - src/app/api/guests/route.ts
  - src/app/api/guests/route.test.ts
  - src/app/api/guests/name/
  - src/app/api/guests/email/
  - src/app/api/guests/mine/
  - src/app/api/guests/remove/
  - src/app/api/guests/unlock/
  - src/app/api/export/guest/
  - src/app/api/album/guest/
  - src/lib/db/mutations/guest.ts
  - src/lib/db/mutations/guest.test.ts
  - src/components/shared/media-lightbox-parts/credit.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/app/(app)/dashboard/[eventId]/review/page.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/actions.ts
  - src/components/app/event-settings/event-settings-sheet.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/db/migration-guards.test.ts
  - src/lib/social/public-profile-visibility.test.ts
  - src/lib/db/queries/profile.private-count.test.ts
  - content/help/reporting-and-safety.mdx
  - content/help/what-guests-can-and-cant-see.mdx
  - content/help/display-name-and-profile-photo.mdx
  - content/help/your-event-page-explained.mdx
  - content/help/who-can-see-your-event.mdx
  - content/help/your-public-profile-following-and-blocking.mdx
  - content/help/event-settings-explained.mdx
  - src/components/app/event-settings-form.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-safety.json
  - docs/systems/trust-safety-forensics.md
  - docs/systems/profiles-social.md
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
---

# lp/safety-wiring

**Goal.** Build Will's event-safety answers: a per-event block (new, with a migration the Orchestrator applies), reachable softly from every person's look, invisible to the person blocked, listed at the Guests room's foot, undone with a choice to restore their uploads; and the guest list always on. Then retire event-safety.

## The brief

**His answers** (`docs/reviews/event-safety.json`, each note there in full), on the terms he set when the board opened (`src/app/(dev)/design/sandbox/event-safety/spec.ts`'s header):
- A block is "Out, uploads removed": per event, the host's to make and undo. The person cannot join, upload, open the album, like or claim, and every refusal is re-checked per request. Their uploads leave for Deleted in the same step. They meet a plain closed door, never the word "blocked".
- It keys on the account, the confirmed address or the guest row, never a device or an IP. On a names-only party it holds on one browser, so the block's confirmation offers Require verified emails.
- It is free on every plan.
- `entry=all`, with his note: every road opens the person's look (the viewer's face-led credit, a name in the Guests room, the uploader in Review), and the look stays social ("making this screen open into a block-heavy view feels far less social, more administrative"). Block is a minor, subtle action in it, for the host alone. Pressing Block opens the one block screen, a destructive confirm through `DestructiveSheet` or the popups' confirm kind.
- `door=private`: a blocked person meets the private album's lock screen (`src/app/(guest)/e/[token]/page.tsx`'s private branch). It must answer exactly as a private album does, in response and timing, so nobody can tell a block from a private album ("Sneaky block").
- `blocked=foot`: under the Guests room's guests, a quiet Blocked section: who, since when, Let back in.
- `restore=ask`: letting someone back in confirms, with "Also restore their uploads" off by default. His note: the likely case is a second chance with the offending uploads kept removed; the toggle covers an accidental block.
- `room=always`, his note: "make the guest list always on, so a host doesn't have to turn it on or learn special handling ... Always on for everyone."
  - Today it is `events.show_guest_list`, default false. The code and the guest list's reads treat it as always on (a function replacement where SQL reads it), and the switch leaves settings and the share sheets.
  - Dropping the column is a destructive migration, not yours: leave it unread and name it in your Handoff.
  - The Terms and Privacy lines about staying off a guest list (`legal-terms.tsx`, `legal-privacy.tsx`) change. Don't edit them: put your proposed wording under Questions, since legal words are Will's. The help follows (`profiles-guest-lists-and-following.mdx` and any other article that says the list is optional).
- `newcomer=same` and `unlisted=ask` are doors of join modes that don't exist yet. `event-settings` (a board) is asking how "who can join" is set, so build neither.

**The migration** (write it; the Orchestrator applies it and regenerates the types):
- A table for blocks, RLS on, the host's own events only. `anon` gets no table access. Every function created revokes EXECUTE from `public` AND `anon` explicitly. SECURITY DEFINER RPCs for block and let-back-in, re-checking the caller is the event's host.
- Every guest path's function re-checks the block: the album's read, the join, `create_media` and the upload's presign, likes, and both kinds of claim (`claim_anonymous_uploads` for this device's tokens, and the claims review's rows).
- A function you replace starts from its newest definition in `supabase/migrations/`.
- Exercise every refusal inside a rolled-back transaction: a blocked account, a blocked address and a blocked guest row each refused on every path; the host allowed; another host refused.
- Its file is `supabase/migrations/20260928120000_event_blocks.sql`. Add any further file to `owns` before writing it.

**Then retire `event-safety`** in one commit (its folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`, as named exceptions). Its `choose` and the four staged asks are moving to the new `event-settings` board, which ports them from git, so nothing is lost. The ledger is the Orchestrator's to delete.

**Paths:** your owns are a start. A path you need beyond them (the viewer's credit, Review's peek, the dashboard's actions, `event-experience.tsx`): add it to `owns` in your manifest before editing, or name a one-line exception. `pricing-wiring` will replace `tier_limits()`; never replace that function.

**Verify:**
- Vitest for every rule, and the rolled-back SQL checks above.
- The look, the block screen, the Blocked section and Let back in at 1440 and 375.
- `pnpm lab:smoke` whole.
- Build 16's red-team walks it live (partyr33l blocked at a willg97 test event).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Legal words for the list always on, and for the block** (Terms and Privacy are Will's; neither file is edited).
  Recommended, as written:
  - Terms `legal-terms.tsx:123`: "...attributed to your confirmed display name and, if the host shows a guest list,
    listed there by name;" → "...attributed to your confirmed display name and listed by name on the event's guest
    list;".
  - Terms :417 (the summary): "Guest lists are the host's call." → "Every event lists the guests who added photos."
  - Terms :422 and Privacy :311: drop "where the host also shows a guest list" / "where their hosts also show a guest
    list".
  - Terms :428: "Hosts may show a guest list on an event, which names every signed-in uploader to everyone who can
    see the album; the ways to stay off a guest list are described in the Privacy Policy." → "Every event shows a
    guest list, which names every guest who added photos to everyone who can see the album; the way to stay off one
    is described in the Privacy Policy." And, answering ROADMAP's legal line (a profile block covers following only):
    "Blocking someone removes each of you from the other's social surfaces across the Service." → "Blocking someone
    from their profile ends any follow between you, and neither of you can follow the other while it stands. A host
    may also block a person from their event: that person can no longer open its album or add to it from the account
    or device they used, and their uploads there are removed."
  - Privacy :311's last sentence the same way: "Blocking a person from their profile ends any follow between you."
  - Privacy :305: "Hosts can turn on a guest list for an event. When it is on, every guest who added photos is
    listed..." → "Every event has a guest list: every guest who added photos is listed..." (the rest as it is; :553's
    "Stay off an event's guest list by not uploading to it at all" stays true).
  - Privacy :165, the disclosure: "Likes, follows and blocks, if you use those features, and any reports you file." →
    "Likes, follows and blocks, if you use those features; the blocks a host makes at their own event (the account,
    confirmed email address or guest entry blocked, the name the host saw, and when), kept while the block stands and
    the event exists, even after the blocked person deletes their account; and any reports you file."
  The last clause is the real call: a block keeps a confirmed address after its account is deleted (so signing up
  again with it stays out; `event_blocks` has no FK to profiles on purpose), as guest rows' own addresses already
  outlive an account. The alternative is purging the blocks that name an account when it is deleted, which keeps
  "the remaining records are erased within days" to the letter and lets a deleted-and-back account in.
- **A standing block's removals purge like any removal**, after the recovery window, so her own Uploads feed
  (`get_my_uploads`, which keeps showing them meanwhile) loses them a month on, where a private album's live uploads
  would stay: a tell for someone who watches her own feed for a month. Recommended: keep (exempting them from the
  purge keeps a blocked person's bytes for ever); her Guest card and picker tile hold regardless, from the block row.
- **The claims review leaves a blocked person's unclaimed rows out** (list, claim and disown), where a private
  album's rows show locked with their count: a tell only for someone who knows she has unclaimed typed rows there.
  Recommended: keep (listing them needs a claim that pretends to work, and a disown would make the block's removals
  final and take the host's way back with it).

## System-doc edits (in place, owned facts only)

All in `20568bcb`:
- `profiles-social.md`: the list always on and the retired key read by nothing; the rows a block holds leave every
  list and count; her picker keeps a blocked event's tile, locked; the profile line and its covers never show where a
  block holds the owner or the viewer; the settings card's one switch.
- `guest-flow.md`: the private lock is also the blocked door (the one closed door, same answers, same work); the
  guest definition leaves the blocked out.
- `host-app.md`: a blocked event's Guest card stays, masked private; Block and Let back in under host moderation.
- `database-security.md`: 0029 at 29; the two acts, three reads and four predicates in the inventory;
  `event_blocks`' grant; `get_event_by_qr_token`'s mask.
- `trust-safety-forensics.md`: the host's DEFINER acts skip a held row, as the trigger does.

## Deferred (ROADMAP one-liners, bucket named)

- Database: drop `events.show_guest_list` and its host UPDATE grant (a destructive contract migration, Will's yes
  stacked); nothing reads or writes it after this lane (`social.guest-identity.test.ts` "the retired key...", and the
  guard "no winning function body reads show_guest_list").
- Marketing: the features page still says the list is a host switch ("One switch shows the guest list ... Until you
  flip it, the list is yours alone", `features/guests/guest-list-section.tsx:78`) and draws that switch
  (`guest-list-card.tsx:123,138`); the blog's FAQ says the same (`corporate-event-photo-sharing-pricing.mdx:11`, and
  `content/blog/AUTHORING.md:209`). All false once this merges.
- The lab and the kit: ROADMAP's lines on `event-safety`'s local pieces (`settings.tsx`'s old review line,
  `PopupQuote`, `Several`/`ScrollHere`, lab:demo's `event-safety.entry`) now point into git (`99510977`); the Guests
  line on the blocked Guest card is answered here (Handoff).

## Handoff (replaces the chat report)

- **Commits, pushed**: work `649eefac` (the migration), `7a6058d5` (the wiring), `99510977` (event-safety retired),
  `e484a3ed` (the migration's live proof), `20568bcb` (system docs), `4ccd7360` and `33790444` (fixes the captures and
  the copy asked for); owns `dc52d1d6`, `941189fd`, `c8b5ff4d`, `61331e91`; sync `9dec65d9` (merged
  origin/launch-prep at `be3758e1`; since then only the record `2d3f8a30`). Head: the chat line.
- **Gates on `33790444`** (the synced tree), each its own exit code, logs in `_scratch/safety-wiring/final-*.log`:
  `pnpm typecheck` 0; `pnpm lint` 0 (4 warnings, none in a lane file); `pnpm test` 0 (528 files, 5,992 tests);
  `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3134` 0 (195 checks, 0 failing).
  No board of mine stands, so no lab:demo.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` is 85 paths: owned prefixes, this file, the five
  system docs above, and the retirement's three named exceptions (`sandbox/registry.ts`, `(shell)/lab/boards.ts`,
  `touchpoints.ts`).
- **The block, SQL** (`20260928120000_event_blocks.sql`): `event_blocks` (RLS, the host's own rows, no client writes,
  nothing for anon), four predicates as the one rule, `block_from_event` (preview) and `let_back_in` (restore),
  three service-role reads, and fourteen guest-path bodies re-checking it; `get_event_by_qr_token` reads the event
  as private to a blocked account or address.
- **The block, app**: `lib/events/closed-door.server.ts` (page, metadata, card, join, unlock, export, album read,
  and the write routes on their body ticket alone); `components/app/event-blocks/` (the look's quiet Block, the one
  block screen, the Blocked foot with Let back in, the host's credit look); `guests/actions.ts`,
  `db/queries/event-blocks.ts`, `db/mutations/event-blocks.ts`; Block on the three roads (the Guests room's names,
  the host viewer's credit, Review's peek).
- **The locked-door finding** (the dashboard told a block from a private album): a blocked event's Guest card stays,
  word for word a private album's ("Private event", "The host made this event private", no link, no cover, no
  byline), placed at the newest upload the block removed, and her picker's tile stays locked
  (`getMyGuestEventCards`, `getMyAttendedEvents`, SQL `blocked_events_for`); pinned by
  `social.guest-identity.test.ts` "★ a blocked event's Guest card reads exactly as a private album's" (4 tests),
  beside the door's own (`closed-door.server.test.ts`, `album-viewer.server.test.ts`, each guest route's "held ticket
  answers exactly as a private album").
- **room=always**: `getEventGuestList` always lists (minus blocked rows); the switch left the settings card (now
  "Profile") and the share sheets; the hub's Guests card always counts; the retired key is named by no code (a test).
- **Help**: eight articles follow (the list always on; `reporting-and-safety` gains the block).
- **Retired** `event-safety` (`99510977`); its ledger is yours to delete.
- **Verified**: Vitest for every rule (the door, copy, targets, reads, acts, Server Functions, both confirms, the
  Blocked list, the credit look, Block in the room, every route's held ticket, the blocked card and tile); the local
  pre-flight 10/10 on the file verbatim; the live rolled-back proof 10/10 on the final text (quoted at the migration's
  foot; the fourteen before-md5s matched, and the table, the nine functions and the proof accounts were absent after);
  the look, the block screen, the Blocked section and Let back in at 1440 and 375, on an uncommitted fixture harness
  (18 PNGs, `_scratch/safety-wiring/shots/`). Not walkable live before the apply: the red-team (partyr33l blocked at a
  willg97 event) follows the apply and the deploy.
- Assets requested from Will: none.
- Board ideas: the Guests room, now always on and home to the Blocked foot, is still a flat chip list at 1440 (drawn
  when it was an opt-in); how it reads at 200 guests with blocks at its foot is a board.
- **Proposed migration**: `supabase/migrations/20260928120000_event_blocks.sql`, by its APPLY PROTOCOL: the drift
  md5s (held live 2026-09-28), its rolled-back check (held live), apply verbatim, the grants as restated, advisors
  (0029 +2: `block_from_event`, `let_back_in`; 0028 and rls_enabled_no_policy unchanged), then regenerate `types.ts`
  (the table and nine functions; the lane compiles on either side through its typed seam). An expand: apply and
  deploy in either order; the feature is live once both land. No Worker, Vercel, Stripe or env changes.
- Calls his to overrule:
  - The names-only offer ("Also require verified emails") starts off: turning it on mid-party changes every
    newcomer's door.
  - The block screen promises only the keys ("from the account or phone they used"): an open album still opens to
    anyone signed out with its link.
  - A confirmed guest's block holds their account and address (even after the account is deleted); a typed name's,
    its row, on the phone that keeps its ticket.
  - A held upload (legal hold) stays where it is, and Let back in never restores one: the host cannot move a held row.
  - Let back in's restore brings back newest first within the cap; what does not fit stays in Deleted, and the toast
    says so.
  - Her likes list keeps a blocked event's likes, as a private album's guest's does.
  - The write routes ask the door with their body ticket only, so no write route reads the cookie; the read routes
    ask with the cookie.
  - The hub's Guests card always reads "N guests", 0 included; the settings card is titled "Profile".
- Look at first: the marketing features page and a blog FAQ call the list a host switch, false once this merges
  (Deferred); the legal wording (Questions) likewise; `export-wiring` waits on this lane's export path
  (`src/app/api/export/guest/route.ts`, the closed door).
