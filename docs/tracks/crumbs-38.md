---
track: crumbs-38
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3925f9f0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/my-uploads.ts
  - src/lib/db/queries/my-uploads.test.ts
  - src/lib/db/queries/my-likes.ts
  - src/lib/db/queries/my-likes.test.ts
  - src/lib/db/mutations/my-uploads.ts
  - src/app/(guest)/u/[slug]/owner-sections.tsx
  - src/app/(guest)/u/[slug]/feed-actions.ts
  - src/app/(guest)/u/[slug]/feed-actions.test.ts
  - src/components/app/my-uploads-gallery.tsx
  - src/components/app/my-likes-gallery.tsx
  - src/components/app/my-feed-more.tsx
  - src/components/app/my-feed-more.test.tsx
  - src/lib/db/row-cap-sql.test.ts
  - src/lib/db/my-record-guards.test.ts
  - supabase/migrations/20261001203800_my_feeds_cursor.sql
  - supabase/migrations/20261001203810_let_in_told.sql
  - src/components/shared/media-lightbox-parts/credit.tsx
  - src/lib/media/uploader-identity.ts
  - src/lib/media/uploader-identity.test.ts
  - src/lib/media/uploader-faces.ts
  - src/lib/media/uploader-faces.test.ts
  - src/components/app/media-grid.tsx
  - src/lib/events/album-wire.ts
  - src/lib/events/album-guest-links.ts
  - src/lib/events/album-host-links.ts
  - src/lib/events/album-links.test.ts
  - src/lib/db/queries/album-guest.ts
  - src/lib/db/queries/album-guest.test.ts
  - src/lib/db/queries/album-host.ts
  - src/lib/guest/reconcile-album-items.ts
  - src/lib/guest/reconcile-album-items.test.ts
  - src/lib/event/hub-album.ts
  - src/lib/event/hub-album.test.ts
  - src/lib/event/gallery-items.ts
  - src/app/(app)/dashboard/[eventId]/review/page.tsx
  - src/lib/r2/grid-items.email-safety.test.ts
  - src/lib/db/mutations/guest-media.ts
  - src/lib/db/mutations/guest-media.test.ts
  - src/app/api/guests/mine/route.ts
  - src/app/api/guests/mine/route.test.ts
  - src/lib/guest/let-in-news.ts
  - src/lib/guest/let-in-news.test.ts
  - src/components/guest/upload-tracker.tsx
  - src/components/guest/upload-tracker.test.tsx
  - src/components/guest/reel/live-reel.tsx
  - src/components/guest/reel/live-reel.test.tsx
  - src/components/guest/event-experience.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/profiles-social.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
---

# lp/crumbs-38

**Goal.** Four ROADMAP lines on a person's own record: the upload approval toast's server half, the host's "added your uploads" toast across a reload, My uploads and My likes past 200 with a cursor, and the viewer's credit taking a face and a door from a resolved uploader identity.

## The brief

Four lines the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **The approval toast's server half** (guest): "so an upload approved after the visit that made it is told on the next visit (the queue lives in memory)".
- **"The host added your uploads" across a reload** (guests): the toast "ends with the visit (the upload queue lives in memory); the tracker's own-rows read (`/api/guests/mine` `{statuses: true}`) could carry it across a reload or a return". This and the line above are one question, what she is told on her return, so answer them as one: what she is told, once, and how it is marked told.
- **My uploads and My likes past 200** (profile): they "stop at 200 with an honest note (`get_my_uploads`, `get_my_likes`); a cursor and a load-more". Keyset, never offset; PostgREST's 1,000-row cut is a trap (CLAUDE.md).
- **The viewer's credit** (identity): it "takes a face and a door from an `uploaderFace` (`avatarUrl`, `seed` from `seedFor`, `href` `/u/<slug>`) that `getUploaderIdentities` and the item mappers do not resolve yet; `src/components/shared/media-lightbox-parts/credit.tsx` is the seam (today every credit draws the plain disc and none is a door)". ★ What a guest may learn of another guest is `profiles-social.md`'s consent line: a door only to a page its owner published, a face only where the album already shows one, never an address, and presigned server-side like every other picture.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition; a new object grants `anon` and `authenticated` nothing by default. Put your migrations' guard tests in a test file of your own, never `src/lib/db/migration-guards.test.ts`: another lane writes migrations beside you.

**Verify:**
- the gate;
- each item's test red on today's code;
- the rolled-back proofs on the live schema, red first;
- on localhost, drive what runs there.

The signed-in surfaces cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `disposable-mode` describes the guest page (the camera, the wall, the peek, the viewer's Save and Share) and `locked-door` the door. Change no word or behaviour their asks describe, and leave `entry-modal.tsx` and the door untouched. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Three lanes run beside you, so don't touch their files:
- `crumbs-36` owns `lib/lifecycle/inactivity.ts`, the pricing sections, the marketing copy files, `host-add-provider.tsx`, `host-upload.tsx`, `report-queue.tsx` and `lib/admin/reports.ts`;
- `crumbs-37` owns the album's sync (`lib/events/album-sync.ts`, `album-state.ts`), the purge cron and the admin album drill-in;
- `crumbs-39` owns a hygiene sweep (dead components, comments, `ui/dialog.tsx`, the portal's content links).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door (every schema change here is additive).

- **What she is told on her return, once (the approval toast's server half and the host-added toast, one answer).**
  Recommended: the same toast, "One of yours is in the album" with "Watch reel", the first time she opens the album
  after a decision let one or more of hers in since she was last told, under the in-visit rules unchanged (a moderated
  event, a reel showing, the view not already open, never for a clip, spent either way). Marked told ON THE SERVER, per
  guest row: `guests.let_in_told_at`, the newest let-in she has been told of, stamped by her tracker's own-rows read
  (`/api/guests/mine` `{statuses, tell}`) as it answers the news; the moment a decision lets an upload in is
  `media.let_in_at`, stamped by a trigger. So a reload, a return, or her account on another device tells it once, and
  an approval she watched arrive is told by that visit's read. Not drawn: a counted line ("3 of yours are in the
  album"), which crumbs-6's "no number" rules out.
- **Does an upload shown again (hidden, then approved) or restored from Deleted count as let in?** Recommended yes: a
  decision put it in the album, and "One of yours is in the album" is true of it. An upload that went straight in on an
  unmoderated album never does (`let_in_at` stays null).
- **My uploads and My likes past 200: a "Show more" button under each feed, or an endless scroll?** Recommended the
  button (the storage list's own control and words: "Show more", "Loading…", "Try again"), 200 a press, keyset on
  `(created_at, id)` and `(liked_at, media id)`; the honest note retires.
- **Whose face and door the viewer's credit carries.** Recommended the guest list's own rule, so the credit shows
  nothing the album does not already: a confirmed uploader whose account stands wears its face (photo and colour), and
  a door only where a handle published a page; a typed name keeps the plain disc and no door; a person the event
  blocked is on no list, so their restored photograph's credit keeps the plain disc and no door; the host's credit
  wears the byline's face, and the host's page as its door. The teaser's nine carry no face (its album shows no Guests
  list). For the host's own viewer and Review every confirmed sender's face rides (the host's look already reads it).

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

## Where I am

- Booted at 58b359e8 (launch-prep; the manifest says cut 3925f9f0, the records since touch no code of this lane).
- The plan, in build order (each item committed and pushed as its tests go green):
  1. **Feeds past 200** (item 3): migration `20261001203800_my_feeds_cursor.sql` (get_my_uploads / get_my_likes take
     `p_before_*` and clamp; drop + create, grants restated), `getMyUploadCards` / `getMyLikeCards` take a cursor and
     answer `next` (asking one past the page), `feed-actions.ts` (two Server Functions), the galleries' Show more
     (`my-feed-more.tsx`), the owner sections reading `is_host_upload` instead of `listEvents()`.
  2. **The credit's face and door** (item 4): no migration. `resolveUploaderIdentity` names the face's owner
     (internal), `uploader-faces.ts` hydrates it server-side (profiles by account id, the host's, the event's blocked
     rows for a guest), the wire's who tuples gain an optional face tuple, the client mappers copy it onto
     `uploaderFace`, Review's items too. `album-state.ts` (crumbs-37's) untouched: the face is read by account, after it.
  3. **Told on her return** (items 1 and 2): migration `20261001203810_let_in_told.sql` (`media.let_in_at` + its
     trigger, `guests.let_in_told_at`), `readOwnUploads` with `tell`, the route's `{statuses, tell}` answering `news`,
     the tracker sending `tell` and handing the news to the toast through its store.
- Done:
  - Item 3 at ec9fe824: migration 20261001203800 proved red then green on the live schema (its foot holds the
    result and the new bodies' md5s: get_my_uploads 21068680e6eb9a8d1d2f16fe17aac9c2, get_my_likes
    648daea282e9ef5c82dac6ef405e9198); the queries, feed-actions.ts, my-feed-more.tsx, the galleries, the owner
    sections; tests green, each new one red on today's code (checked by swapping in launch-prep's file).
- In progress: item 4 (the credit's face and door).
- The proof builder for a migration's commented foot is in the scratch dir (`build-proof.py <file> red|green`).
