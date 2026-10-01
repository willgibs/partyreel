---
track: crumbs-43
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "07277c23"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/media-lightbox-parts/
  - src/lib/history-entry.ts
  - src/components/ui/popup-back.ts
  - src/lib/guest/
  - src/components/guest/
  - src/components/likes/
  - src/components/social/guest-list.tsx
  - src/lib/db/queries/guest-events.ts
  - src/lib/upload/device-id.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/profiles-social.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
---

# lp/crumbs-43

**Goal.** Nine guest-side lines: the phone's Back closing an open photograph, the welcome and its consent line for each new person on a shared phone, one row for a name-only guest who re-joins, the host's own upload cap on the upload sheet, a credit's face moving at once, the Likes page's Show-more hearts, a returning guest's waiting uploads on an empty album, the retired "A guest" label, and the photo viewer's own loading state.

## The brief

Nine ROADMAP lines (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **Back closes the photograph**: "the phone's Back closes the open photograph (pushState and popstate) instead of leaving the album; `?photo=` rides replaceState today". The hub, the popups and the reel already share one rule for which history entry is ours (`lib/history-entry.ts`, `ui/popup-back.ts`; `host-app.md`): the viewer joins it rather than growing its own. A shared `?photo=` link still opens its photograph, and its close still lands in the album. The code card's own Back is a question still open with Will: leave it as it is.
- **The welcome on a shared phone**: "the next person on a shared phone skips the welcome, and with it the legal consent line (`pr_welcome_<qr>` survives every sign-out and the ticket drop); decide whether it goes with the tickets". Recommend under Questions and build it; the consent line is the point, so each person who joins should meet it once. `src/lib/constants/legal-privacy.tsx` names the key and no lane edits the legal pages: name any word there your change leaves stale in your Handoff.
- **One row for a re-join**: "a name-only guest whose session drops re-joins on the same device as a second guest row with the same name, so the guest list shows one person twice; key the re-join on `pr_device_id` (the same row) or de-dupe the list by name and device (Will's to pick)". Recommend one under Questions with its gain and cost and build it, keeping crumbs-29's rule (one account keeps one ticket per album) and the shared phone's claims (`shared-claims`) whole: two different people on one phone who type the same name are the case to prove against.
- **The host's own cap on the upload sheet**: "`get_event_by_qr_token` does not return `events.max_upload_bytes`, so the upload sheet's terms line states the product's limits rather than the host's own cap; add the column (with the types and `queries/guest-events.ts`) and `uploadTermsLine`'s `capBytes` seam takes it". `get_event_by_qr_token` is an anon capability read (`database-security.md`, 0028 by design): the new column is returned last, as `reel_hold_sec` was, so the deployed build reads what it reads today, and the drop and create re-grants exactly what it grants now.
- **A face moves at once** (from `crumbs-38`): "an open album's credits take a new photograph or handle only at the link's next re-mint (an hour) or a reload, since the attribution version moves on a name (`profiles_album_note` watches `display_name` alone); adding `avatar_updated_at` and `slug` to that trigger's columns would move a face at once". A migration; prove the trigger fires on each new column and on nothing else.
- **The Likes page's Show-more hearts** (from `crumbs-38`): "a Likes page that Show more adds paints its hearts when `my_liked_media_ids` answers, since the likes store takes `initialLikedIds` once at mount (`likes-provider.tsx`, crumbs-40's); a way to mark ids liked as they join would fill them at once".
- **Her waiting uploads on an empty album** (from `voice-wiring`): "a returning guest whose only uploads wait on an empty held album meets the empty state's \"Add the first photo\" with her badge beside Invite, since the row's Add returns only for this visit's files (`galleryEmpty`); counting her waiting rows would move the Add a beat after they load, so it wants a layout that does not jump".
- **"A guest" retired**: "`social/guest-list.tsx:216` draws \"A guest\" for a null `displayName`, a label the product retired (a nameless credit shows nothing)".
- **The viewer's own loading state**: "the media viewer's own image and video have no loading state (a tile has a skeleton; the opened photograph pops in when the full-size presign lands, the slowest picture in the product on venue Wi-Fi)". The tile's own picture can stand in until the full size lands; the motion follows the viewer's open (`media-viewer-wiring`'s origin), and reduced motion is honoured.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition and the live body (md5-check it, as crumbs-38's headers do); a new object grants `anon` and `authenticated` nothing by default. Put your migrations' guard tests in a test file of your own, never `src/lib/db/migration-guards.test.ts`: two lanes write migrations beside you.

**Verify:**
- the gate;
- each item's test red on today's code;
- the rolled-back proofs on the live schema, red first;
- on localhost, the public demo album and a guest album signed out, at 375 and 1440: Back with a photograph open, the viewer on a throttled network, the upload sheet's terms line.

The signed-in surfaces cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door` describes the door (its family, shape, wait and lost screens) and `disposable-mode` the disposable roll on the guest page (the camera, the wall, the peek, the viewer's Save and Share). Change no word or behaviour their asks describe: the welcome's look and `entry-modal.tsx`'s screens stay as they are (only when the welcome shows may move), and so do the viewer's Save and Share. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Two lanes run beside you, so don't touch their files:
- `crumbs-41` owns the admin portal (`src/app/admin/`, `lib/admin/`, `components/admin/`), billing (`api/stripe/webhook/`, `lib/stripe/`), `queries/reports.ts`, and `report_strikes` and the reports' SQL;
- `crumbs-42` owns the host app: `src/app/(app)/dashboard/`, the hub's rooms (`components/app/event-feed/`), `host-add-provider.tsx`, `host-upload.tsx`, `restore-event-button.tsx`, the create wizard, `ui/popup.tsx`, `queries/events.ts`, `mutations/media.ts`, and `restore_event`;

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
