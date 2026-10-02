---
track: disposable-foundation
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/queries/album-guest
  - src/lib/db/queries/album-state
  - src/lib/db/queries/guest-events
  - src/lib/db/queries/guest-gate
  - src/lib/db/queries/social
  - src/lib/db/queries/my-uploads
  - src/lib/db/queries/likes
  - src/lib/db/queries/reports
  - src/lib/db/queries/media
  - src/lib/db/queries/exports
  - src/lib/db/mutations/
  - src/lib/events/gallery-access
  - src/lib/events/guest-experience-summary
  - src/lib/validation/event
  - src/lib/media/limits
  - src/lib/disposable/
  - src/app/api/album/guest/
  - src/app/api/guests/mine/
  - src/app/api/export/guest/
  - src/app/api/reports/
  - src/app/api/r2/
  - src/app/api/cron/purge/
  - src/lib/jobs/
  - src/lib/lifecycle/sweeps/
  - src/app/admin/jobs/
  - src/app/(guest)/e/[token]/card/
  - src/app/(guest)/e/[token]/actions
  - src/app/(app)/dashboard/[eventId]/actions
  - src/components/app/event-settings/adds-page
  - src/components/app/event-settings/settings-state
  - src/components/app/event-settings/camera-settings
  - docs/systems/disposable-mode.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
  - docs/SYSTEMS.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/disposable-mode.json
  - src/app/(dev)/design/sandbox/disposable-mode/
  - docs/systems/guest-flow.md
  - docs/systems/billing-caps.md
  - docs/systems/reel.md
  - src/lib/constants/tiers.ts
---

# lp/disposable-foundation

**Goal.** Build disposable mode's foundation: an event's mode and reveal, a per-row seal every guest read path honours from one predicate, a develop that is a write so a parked phone learns it, the server-counted roll, and the host's control in Settings; no camera or waiting-room UI yet.

## The brief

**Why.** Every product decision for a disposable-camera event is taken (`docs/reviews/disposable-mode.json`, rounds 1 to 3; the board `src/app/(dev)/design/sandbox/disposable-mode/` draws them):
- The reveal is the host's setting: straight away, or a develop time guests can see (9 am the next day by default), with Develop now (r1, his note: "This should be a host config so they can either choose immediate uploads/visibility or set a 'develop' time guests can see to get them excited and in the loop. It creates that 'return' payoff moment where everyone sees the final album.").
- The mode switches both ways at any time (r1: "Ideally, it's very streamlined for hosts to switch between if they'd like, so if a host changes their mind last minute despite having everything set up ... we don't tell them 'sorry, have to make a new event from scratch'.").
- 24 shots a guest, counted by the server, at full size; videos on paid plans with Videos on, up to 10 s; a video is one shot (`cost=one`); a deleted shot never gives its frame back; no look (`look=none`: the originals, untouched).
- Before develop a guest sees and deletes her own shots and everyone's only as a count and their minutes (the contact sheet, `waiting=sheet`, wave 2's); the host's album waits under a cover she can lift (`peek=covered`, UI later); the room's screen plays the live slideshow until develop (`wall=slideshow`, UI later); at develop the reel premieres the roll.

**The model** (the Advisor's read of the live catalog, Q8; build it or say plainly where you found better):
1. **The event**: its mode (album or disposable), its reveal, its develop time, and `sealed_from` (when a disposable period starts). The new columns join BOTH the INSERT and the UPDATE column grants on `events` (live: 16 columns each; `authenticated` holds no table-level write), so the wizard's later wiring needs no migration. `get_event_by_qr_token` returns the mode and the develop time by the Q7 pattern (DROP and CREATE, the four holders restated).
2. **The seal is per row**: `media.sealed_until timestamptz`, null meaning visible. One predicate, `sealed_until > now() and e.host_id is distinct from (select auth.uid())` (the host exempt), applied inside every SQL home (`event_covers`, `event_stills`, `event_card_stats`, the album functions) and as a column filter on the guest path's four PostgREST reads (`album-guest.ts:144` and `:211`, `guest-events-admin.ts:178` and `:469`), or those reads move into SQL. `sealed_until` joins no client UPDATE grant (today only `removed_at, status`). Not `pending`: `create_media` derives status from `moderation_mode` alone, `pending` feeds the host's Review and its counts, and a mass flip would stamp `let_in_at` on every row.
3. **Sealed ids never leave the server.** The album's scope (`album_changes_since`) carries no sealed row; the sync's answer carries `sealed: {count, minutes[]}`, hashed into its ETag; her own sealed shots ride her tracker's read (`/api/guests/mine`); the links route refuses every sealed id. `countApprovedMedia` takes the same predicate, or every poll heals forever.
4. **Develop is a write.** The guest poll's quiet path never reads media or the clock (`src/app/api/album/guest/sync/route.ts:110-126` builds its validator from `album_state` and the count, `165-167` answers 304), so a lazy predicate alone reaches nobody until a reload. The first guest or host read after the develop time runs an idempotent `develop_due(event)` (one guarded UPDATE clearing the due rows); the album triggers (`notify_gallery_change`, `media_album_note`, `media_album_stamp`) and `album_scope` learn `sealed_until`, so the unseal versions the album and rings the doorbell, and never stamps `let_in_at`; a daily `develop_due` sweep joins the purge cron with its own card on `/admin/jobs` (a job ships its health signal), so an album nobody reads still converges. Develop now and disposable to album are the same UPDATE by hand. (If you find `pg_cron` available and better, propose it in your Questions; don't install it.)
5. **Switching**: album to disposable seals only what comes after; disposable to album unseals everything at once; a new develop time rewrites the event's sealed rows; a second disposable period restarts the roll from `sealed_from`.
6. **The roll**: refused early at presign through `get_upload_gate`'s answer (`roll: {used, cap}`) and enforced in `create_media` under `pg_advisory_xact_lock` on the guest (two concurrent completes otherwise both count 23), counting the guest's rows of any status since `sealed_from`; `create_media_as_host` exempt. Presign stays stateless (`uploads-and-r2.md`). Two gaps, accepted and written down: a signed-out guest who clears her storage mints a new ticket and a new roll; a video's length is the client's word, so a disposable video also carries a byte ceiling (`src/lib/media/limits.ts`).
7. **Every id-keyed route is a matrix cell by name**: the links route, the card route (`/e/[token]/card?photo=`), `like_media`, `create_report`, the export's `ids` (`src/app/api/export/guest/route.ts:65`), plus the reel and `event_stills`, covers on cards, profiles and OG images, faces and credits, likes, the doorbell and every count.

**Questions with my recommendations** (build the recommendation, write each under Questions):
- A sealed uploader joins the Guests list and the credits at develop, not before (the two attribution reads: `guest-events-admin.ts:322`, `social.ts:945`).
- Her own sealed shots are in her own download (`set = "yours"`).
- "The room's screen" is the host's own signed-in session only; a screen link anyone could open is Will's question for the rooms lane, never built here.

**Settings and the guest's Add.** The mode and the reveal are one mountable component (`camera-settings`) on Settings' "what guests add" page (`adds-page`, yours), so the create wizard's later wiring mounts the same control. Until the camera lands (wave 2), Add in disposable mode is today's sheet with its photos counted against the roll; the 25th is the server's sentence, which the queue already surfaces. `event-experience.tsx` and the queue are `header-wiring`'s: never touched.

**Migrations.** Files in `supabase/migrations/`, each with a rolled-back Supabase MCP check of every new or changed RPC in your Handoff; the Orchestrator applies them by protocol after the Advisor reads them and regenerates `src/lib/db/types.ts` (never hand-edited: write a seam for the new columns, named in the Handoff, dropped at the regeneration). A new enum value cannot be used in the transaction that adds it, should you add one. ★ Prod (milestone 33) and the alias share the database: a sealed test album is readable through partyreel.com's older app-side reads until milestone 34; that is accepted for test data and written into build 43's red-team brief.

**Tests.** The leak matrix in Vitest (every SQL home and the four app-side reads, a guest never reaching another's sealed shot by any route above), the develop reaching a parked poll (the 304 path), the roll's 25th refused and its race held by the lock, the switches both ways. System docs: a new `docs/systems/disposable-mode.md` (registered in `docs/SYSTEMS.md`), `uploads-and-r2.md`, `database-security.md`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; a rolled-back Supabase MCP check of every new or changed RPC, its output in the Handoff; the leak matrix green; signed-in and upload steps localhost cannot drive named for build 43's red-team.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

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
