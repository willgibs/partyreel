---
track: crumbs-38
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- `docs/systems/guest-flow.md`: the tracker's read asks `tell` and answers her news (what a decision let in since she
  was last told), marked told as answered; the store hands it to the toast.
- `docs/systems/reel.md`: the approval toast's two sources (the queue, the server's news), never over the door; the
  "queue lives in memory, so only within the visit" clause retired.
- `docs/systems/uploads-and-r2.md`: the guest tuple carries a face where one may show; the credit's face follows the
  same cases (`uploader-faces.ts`); the retired "only the counter" clause cut from a nameless row's credit.
- `docs/systems/profiles-social.md`: the owner mode's two feeds page 200 at a time on a keyset, a Show more through a
  cursor-only Server Function.
- `docs/systems/database-security.md`: `media.let_in_at` comes from a trigger and is not granted.

## Deferred (ROADMAP one-liners, bucket named)

- Identity: an open album's credits take a new photograph or handle only at the link's next re-mint (an hour) or a
  reload, since the attribution version moves on a name (`profiles_album_note` watches `display_name` alone); adding
  `avatar_updated_at` and `slug` to that trigger's columns would move a face at once (from crumbs-38).
- Profile: a Likes page that Show more adds paints its hearts when `my_liked_media_ids` answers, since the likes store
  takes `initialLikedIds` once at mount (`likes-provider.tsx`, crumbs-40's now); a way to mark ids liked as they join
  would fill them at once (from crumbs-38).
- Host: Review reads the whole album's attribution (`getUploaderIdentities(event.id)`) to credit its queue alone;
  `readAlbumAttribution` by the pending ids would read only what it shows (from crumbs-38).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-38`:** work ec9fe824 (feeds past 200), 827b6733 (the credit's face and door),
  aa8ea67e (told on her return), 7c2e8acd (the system docs); sync 3e5d598b (a merge of launch-prep at 116d1555:
  crumbs-36 and crumbs-39 had landed, and guest-flow.md, one of this lane's reads, moved; no file touched on both
  sides); d7268af4 the one exception below. The head is in the chat line.
- **Gates on the synced tree at d7268af4, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (no warning);
  `pnpm test` 0 (687 files, 8,257 tests); `zsh scripts/build-lock.sh pnpm build` 0 (no warning in its log);
  `pnpm lab:smoke --base http://localhost:3133` 0 (132 checks, 0 failing; scope: the Library, the shell and
  `event-ready`, which imports `media-grid.tsx`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns`, the five system docs under
  System-doc edits, and this file, with ONE exception: `src/components/lab/words.test.ts` loses its one `NOT_YET` entry
  (d7268af4). Why: launch-prep's own records retired the ROADMAP line that said "numbered rulings" (e370430b), so the
  test's own rule ("a retired line takes its entry with it") failed the gate on launch-prep itself; any lane syncing
  meets it. `src/lib/db/queries/album-state.ts` (crumbs-37's) is untouched: the face is read by account after the
  attribution read, which already carried the account id the rule reads.
- **The items, one line each:**
  - **My uploads and My likes past 200** (ec9fe824): `get_my_uploads` / `get_my_likes` page on a keyset
    (`(created_at, id)`, `(liked_at, media_id)`), every arm filtered, clamped to the row cap (migration 20261001203800,
    unapplied); the feeds read 200 a page asking one past it, so `next` is a cursor exactly when more exist; a Show
    more (`my-feed-more.tsx`) through two cursor-only Server Functions (`feed-actions.ts`); an item is shown once when a
    delete's revalidation shifts the first page; the honest note retires; the owner mode reads her own events' uploads
    from the function's arm flag instead of `listEvents()` (so the ROADMAP line about `owner-mode.test.ts` naming
    `listEvents` is moot: retire it).
  - **The viewer's credit takes a face and a door** (827b6733): the one precedence rule names whose face
    (`faceOwner`), `uploader-faces.ts` resolves it server-side (the avatar's public URL, `seedFor`'s colour, `/u/<slug>`
    only for a published page), the album's who tuples carry it as an optional last field, the client mappers read it
    defensively onto `uploaderFace`, Review's items too. A typed name, nobody, the teaser and the personal feeds wear
    none; on a guest's view a person the event blocked keeps the plain disc and no door.
  - **The approval toast's server half and "the host added your uploads" across a reload, one answer** (aa8ea67e):
    `media.let_in_at` (a trigger stamps every move INTO approved) and `guests.let_in_told_at` (migration
    20261001203810, unapplied); her tracker's read asks `tell`, answers her news and moves each row's mark forward to
    the newest it told; the toast watches the news as it watches the queue, once a visit, by its old rules, and never
    over the door. A database without the columns reads as no news, captured (`let_in_schema_missing`).
- **Each item's test red on today's code** (checked by swapping in launch-prep's file, then restoring): the feeds'
  paging (5 of 9 in `my-uploads.test.ts`); the SQL guards without the migrations (8 in `row-cap-sql.test.ts` and
  `my-record-guards.test.ts`); the toast on a return (3 of 37 in `live-reel.test.tsx` with launch-prep's
  `live-reel.tsx`); the rest name exports today's code does not have (`readOwnUploads`, `withUploaderFaces`,
  `faceFromTuple`, `useFeedPages`, the `tell` body).
- **Rolled-back proofs on the live schema, red first** (each one `execute_sql` call, nothing persisted; the results are
  at each file's foot): 20261001203800 red 5 of 6 fail (step 5, the kept shape, holds), green 6/6 (376 uploads across
  both arms paged 7 at a time equal the whole feed; a tie splits on the id; a stranger reads 0; the three grants);
  20261001203810 red 6 of 6 fail, green 6/6 (pending, hidden and a restore to approved stamp; a restore that lands
  hidden does not; the told mark notes no album; no client role reads either column or runs the function).
- **Measured on localhost** (port 3133, the live database): the guest links route on the open album "guest-view-menu
  QA" answers the host's face with `/u/willg`, Partyreel's with `/u/partyr33l`, a confirmed name without a handle its
  colour alone, and the viewer's credit draws the seeded disc and the door; `/api/guests/mine` with `tell` on a
  moderated album answers the statuses and `news: []` against today's schema (the seam), and without `tell` no `news`
  key at all.
- **For the next build's red-team** (signed-in surfaces, after both migrations apply):
  1. Feeds: as willg97 (376 feed rows) open his own page: Your uploads shows 200 and Show more; press to the end (no
     duplicate, newest first, no button at the end); Trash one on a loaded page (it leaves and stays gone) and one on
     the first page (the page refills, nothing doubles); a host-arm item's confirm says Deleted, restorable. Likes need
     201 to page (seed them with `like_many` on the scale probe as a test account). A hand-made POST to the Server
     Function with another cursor reads only the caller's feed.
  2. Faces: signed out on an open album with a confirmed sender, the credit wears their face and their page's door; a
     typed name the plain disc; the host's credit the byline's face and page. Block a confirmed sender, restore one of
     their photos: a guest's credit for it keeps the plain disc; the host's album and Review show the face in the look.
  3. Told on her return: a moderated album with the reel on and two or more photos; as a ticket guest upload a photo
     (held), close the tab; the host approves; reopen: "One of yours is in the album", Watch reel, once; reload: no
     toast. Signed in, on a second device: told once across both. Hide then show it again: told on the next return.
     A fresh device signed in (the welcome owed): the toast after Continue, never over the door.
- **PREMISE lines** (lab:smoke named `disposable-mode`, 8 asks, and `locked-door`, 4 asks, through guest-flow.md,
  uploads-and-r2.md, reel.md and `event-experience.tsx`): their asks still hold. disposable-mode's (camera, waiting,
  wall, peek, create, video, cost, save) are the disposable roll's, hidden until it develops; this lane touched the
  held-upload tracker's read, the approval toast on a moderated album and the credit's face (its quoted viewer already
  draws a seeded face), none of which the roll's asks describe. locked-door's (family, shape, wait, lost) are the
  door's own screens; the toast now waits for the door and changes nothing in it, and `entry-modal.tsx` and the door
  are untouched.
- **Assets requested from Will:** none.
- **Board ideas:** the approval toast needs a reel to lead to ("Watch reel"), so on a moderated album under two photos
  or with the reel off she is never told one of hers was let in (her tracker says "In the album" if she opens it); a
  board could draw what she is told when there is no reel to watch.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** two migrations, both additive, apply in either
  order, each before the build that ships this branch (a Show more and the news need them; the first page and the
  statuses work either way): `20261001203800_my_feeds_cursor.sql` (md5 9866ebad88ce2d8f1cc02e0ef567462a) and
  `20261001203810_let_in_told.sql` (md5 5f3b0099b5c9887e08660a4cee39c482); each header holds its apply protocol
  (advisors: no delta), and after the regeneration the two typed seams go (`feedRpc`'s cast in
  `src/lib/db/queries/my-uploads.ts`, `untypedAdmin` in `src/lib/db/mutations/guest-media.ts`).
- **Calls his to overrule** (each built as recommended under Questions): the return is told with the same toast,
  once, marked on the server per guest row; an upload shown again or restored counts as let in; a Show more button,
  200 a press; the credit's face follows the guest list's rule (no face for a blocked person on a guest's view, none
  at the teaser). The avatar is the public avatar bucket's URL resolved server-side (`getAvatarUrl`), as every Guests
  list face is: avatars are no R2 object and have no presign.
- **Look at first:** the toast on a return (`live-reel.tsx`'s `ApprovalToast`, its second source) and the credit's
  face on an open album (`uploader-faces.ts`).

## Where I am

- Handed off: the Handoff above is the whole state. Nothing in progress; the dev server on 3133 is stopped and the
  Browser pane tab closed. The proof builder for a migration's commented foot is in the scratch dir
  (`../partyreel-wt/_scratch/crumbs-38/build-proof.py <file> red|green`).
