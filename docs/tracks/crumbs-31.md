---
track: crumbs-31
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2cc62130"            # the launch-prep SHA the branch was cut from (a39b0129 plus two record commits)
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/album-return
  - src/lib/guest/session-tokens
  - src/lib/guest/claim-uploads
  - src/app/api/guests/mine/
  - src/lib/db/mutations/guest-media
  - src/components/app/event-feed/selectable-media-grid
  - src/components/guest/door/switch-email.ts
  - src/app/(auth)/sign-out-scope.test.ts
  - src/components/app/host-media-grid
  - src/lib/validation/uuid-shape
  - src/lib/db/queries/events.ts
  - src/lib/db/queries/events.test.ts
  - src/app/admin/albums/[eventId]/page.tsx
  - src/app/admin/accounts/[id]/page.tsx
  - src/app/admin/record-not-found.test.tsx
  - src/lib/guest/use-upload-queue
  - src/components/guest/event-experience
  - src/components/guest/door-settles.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-31

**Goal.** Build 33's red-team finds and one deferred bug: the follow moment after a keep through Google, the review peek holding Shift+Tab, a malformed id drawing each surface's not-found, the door's switch signing out this device only, a Like on liked items saying so, and the host's own Add at her gated door going through.

## The brief

Build 33's red-team finds (`../partyreel-wt/_scratch/redteam-33/ledger.txt`; grep it for the steps) and one of `crumbs-29`'s deferred bugs. Fix each at its root, with a test that fails on today's code:

- **No follow moment after the keep through Google** (MEDIUM; already on partyreel.com since `crumbs-27`).
  - Steps: signed out, type "Partyreel Fan" (a name matching the account's first word), add a photo, then Keep this event → Confirm your email → Continue with Google → partyr33l.
  - What happens: the photo is claimed, but no moment plays and no toast shows.
  - The likely cause: the album page's server render claims the ticket first (`sortTickets` → `claim_anonymous_uploads`, through the door's and the gallery's readers). The client's mount claim then moves nothing, and it spends the `pr_pending_offer` marker without playing the moment (`claim-handle-prompt.tsx`, `lib/guest/album-return.ts`, `lib/guest/session-tokens.ts`). A magic-link return should meet the same.
  - The moment should play once for a keep the server's read already claimed. Build 30's ask path, which played, must still play.
- **Shift+Tab escapes the review peek** (LOW, from `crumbs-28`'s focus trap): open the Review peek (focus lands on the dialog itself) and press Shift+Tab as the first key. Focus moves to the tile behind while the peek stays up. The likely cause: the grid's own effect focuses the dialog before the trap has a focused element to return to (`event-feed/selectable-media-grid.tsx`).
- **An id that isn't a uuid** (LOW; already on partyreel.com): `/dashboard/<x>` and its rooms answer 200 with "Something went wrong" and no title. The portal's `/admin/albums/<x>` and `/admin/accounts/<x>` answer 500. Each hit files 22P02 errors to Sentry. Check the id's shape before any read, and draw each surface's not-found, as a missing uuid already does since `crumbs-28`.
- **"Use a different email" ends every session** (LOW; read in the code; already on partyreel.com): `src/components/guest/door/switch-email.ts:16` calls `signOut()` with no scope, which is global, so an operator using it at a door loses her portal session. `(auth)/actions.ts` holds the rule that every sign-out names its scope. Name it `local`, and make a test refuse an unscoped `signOut(`, if the lint or a policy test doesn't already.
- **Like on an already-liked selection says nothing** (NIT): the selection closes with no toast (`host-media-grid.tsx`). Say what happened, in the words its other toasts use.
- **The host's own Add on her gated album's guest page never goes** (a bug, from `crumbs-29`'s Deferred). The host's upload there goes through the guest queue, and `create_guest` never counts the host as in. So at a gated door her upload never goes, proved rolled back on `55bcdbe0`:
  - approve mints her a waiting ticket her picks wait on for good;
  - invite refuses "Ask the host to let you in.";
  - closed says "This event is private.".
  - Count the host in (`create_guest`'s `v_in`, on the live body `498aba39…` from `20260930140000`), or send the owner's Add through the host routes its own note promises; your call, under Questions.

**SQL.** If you change `create_guest`, write the migration with its rolled-back proof at the file's foot, in the shape of `20260930140000_one_account_one_ticket.sql`.
- Run the proof yourself with the Supabase MCP's `execute_sql`, inside `begin; … rollback;`. Otherwise your SQL is read-only, and you never call `apply_migration`: the Orchestrator applies by protocol.
- Keep the signature and grants: partyreel.com (milestone 31) calls it.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The Google return, the hub and the portal cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk may be up:** change no word or behaviour the desk's boards describe, beyond these fixes. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. `crumbs-30` is running and owns `src/lib/auth/admin-context.ts`, the five route `error.tsx` files, the print page, `lib/guest/reconcile-album-items.ts` and `lib/events/event-blocks.ts`: don't touch them.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The host's own Add on her album's guest page rides the host's routes (built), rather than `create_guest` counting
  her in.** The page's one queue sends her files through `/api/host/r2/*` (`create_media_as_host`, as the hub's Add and
  the reel's Add to event already do) with no ticket, no join and no door. **Recommended**, because every note already
  promised it (`create_guest`'s own "owner uploads ride the host routes", the presign route, `upload-lock.ts`, the
  abuse limiter, `clip-add.ts`), it needs no migration, and it answers every door at once, Only me included (there
  every ticket reads private, so counting her in would need `get_upload_context` and `create_media` changed too). What
  it changes for her, **his to overrule**: that Add is her host upload wherever she makes it, so it goes up approved at
  once even where the album holds guests' uploads for review (it waited in her own Review before), is credited as the
  host, mints no guest row of hers at her own album, and its Delete there works (it was refused before:
  `remove_my_upload`'s guest arm leaves the host out). Overrule → count the host in `create_guest`'s `v_in` (a
  migration on the live body `498aba39…`) and leave the queue alone; Only me then still refuses her.
- **The follow moment after a keep whose ticket the page's read claimed first (built).** While a confirm door opened
  here waits (its marker) and the album's own claim moved nothing, the claim asks `/api/guests/mine` (`kept`: the live
  uploads on this phone's ticket here, counted only when its row is the signed-in account's) and counts the ticket as
  moved if so. **Recommended** over handing the page render's claim down as a prop: it also covers a poll that claims
  between an in-page code and the claim, and costs one request only after a keep. With it, **his to overrule**: a claim
  that runs for another album's ticket (a sign-in on the dashboard, another album's page, her yes to the ask) now
  spends that album's marker, so a door opened and abandoned there never plays its moment weeks later off a sign-in
  made elsewhere (the marker was spent silently on her next visit before; now the question above would find the photos
  hers). Overrule → that late moment plays on her next visit there.
- **A bulk Like that added nothing says so (built):** "Already liked 2 photos" (by kind, as the success; a plain toast,
  since nothing changed) when every selected item was liked already, and the heart's own words when the server refused
  them, "Couldn't save that like." / "Couldn't save those likes." (that press said nothing either). **Recommended.**
  Overrule → other words.
- **Shift+Tab from the peek's look itself comes round to its last control, Close preview (built)**, the loop's own
  direction, where the trap alone would leave focus resting on the look. **Recommended.** Overrule → drop the key
  handler; the root fix alone keeps focus inside.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: THE RETURN (a read on the page may move her photos first; the `kept` read; a claim
  spends the marker of the albums it ran for, wherever it runs); the upload act (the owner is never her own guest:
  the host's pair); `ask {invite}` ("Use a different email" signs out this device, `local`).
- `docs/systems/host-app.md`: the hub's not-found (a malformed id, `getEvent` before any read); Review's peek (the trap
  takes the opening focus; Shift+Tab from the look); Bulk Like (a press that added nothing says so).

## Deferred (ROADMAP one-liners, bucket named)

- Guests (words): the owner's Delete on a photo she just added on her album's guest page says the guest's "can't be
  recovered" until the album's next sync hands the tile its `isHost`, though `remove_my_upload`'s host arm puts it in
  her Deleted; and after a reload that page offers her no Delete on her own uploads at all (`canDeleteIds` reads guest
  rows only), where the hub is (from `crumbs-31`).

## Handoff (replaces the chat report)

- **Work `b3e6f3a4`, sync `f463db31`** (merge of `origin/launch-prep` at `2e3beb3d`: crumbs-30 had landed in
  `event-experience.tsx`, the not-found policy test, `requireAdmin` and both my docs; one conflict, `host-app.md`'s
  not-found line, resolved keeping both facts: the print sheet's and the malformed id's). Both pushed to
  `origin/lp/crumbs-31`.
- **Gates on the synced tree `f463db31`**, each on its own exit code (logs `../partyreel-wt/_scratch/crumbs-31/`):
  typecheck 0 (`typecheck-sync.log`), lint 0 (`lint-sync.log`), test 0 (`test-sync.log`: 671 files, 8,031 tests), build
  0 (`build-sync.log`), `pnpm lab:smoke --base http://localhost:3133` 0 (`smoke-sync.log`: 140 checks, 0 failing; its
  `/design/lab/tools/boom` 500 is that tool's own intentional crash). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + `docs/systems/guest-flow.md` and
  `docs/systems/host-app.md` (Record subtractively) + this file. `door-settles.test.tsx` joined `owns` for the page's
  owner pin; `claim-handle-prompt.tsx` left them untouched (the moment card needed no change).
- **PREMISE** (smoke): `disposable-mode` (guest-flow.md, event-experience.tsx), `event-ready` (host-app.md) and
  `locked-door` (guest-flow.md). Their asks still hold: no word, step or design they draw moved. The page's change is
  whose route the owner's own files ride; guest-flow.md's are the follow moment's evidence, that route and the
  switch's sign-out scope; host-app.md's are the not-found, the peek's focus and the Like's toast. The camera, the
  waiting room, the wall, disposable's "host's peek" (the roll before it develops, not Review's peek), the checklist
  and the locked door's family, shape, wait and lost read none of it.
- **The items**, each test red on `origin/launch-prep` (run before the fix, or with the old files swapped back):
  - The follow moment after a keep through Google (or a magic link) → `claim-uploads.ts` asks `/api/guests/mine`
    `kept` (`route.ts`; `countKeptTicketUploads`, `guest-media.ts`) while a door's marker waits and its claim moved
    nothing here, and spends other albums' markers (`album-return.ts`'s `hasPendingOffer`, `session-tokens.ts`'s
    `storedTicketFor`). Red: `claim-uploads.test.tsx` "★ a Google return whose ticket the page's read had claimed: the
    moment plays, once, and nothing toasts" (the old three files swapped back: no moment, 6 red); "★ build 30's ask
    path still plays" green on both; `route.test.ts` "kept: …" (3 red on the old route), `guest-media.test.ts` "the
    live uploads on this device's ticket, once it is hers" (a new read).
  - Shift+Tab escaping the peek → the trap takes the opening focus (`focusOnOpen`), Shift+Tab from the look comes round
    to Close preview (`selectable-media-grid.tsx`). Red: "★ Shift+Tab as the first key…" and "★ hands focus back to the
    look…". Local, a real browser on the Library's Review room (`_scratch/crumbs-31/local-peek-walk.txt`): the first
    Shift+Tab lands on Close preview, the loop holds both ways, a script's focus behind it is refused, Escape returns to
    the tile, no console error.
  - A malformed id → `isUuidShape` (`lib/validation/uuid-shape.ts`, zod's `guid`); `getEvent` answers it null before any
    read (the hub, every room and the print sheet draw their not-found); the portal's album and account pages ask it
    after the gate, before any read. Red: `events.test.ts` "★ answers a malformed id as no event, without a request" (6
    requests), `record-not-found.test.tsx` "the portal, for … whose id is not an id" (16).
  - "Use a different email" signing out everywhere → `signOut({ scope: "local" })` (`switch-email.ts`), and
    `src/app/(auth)/sign-out-scope.test.ts` refuses any bare `signOut(` in `src` by the AST. Red:
    `src/components/guest/door/switch-email.ts:16`.
  - Like on liked items → "Already liked N kind" (plain) or "Couldn't save that like." / "…those likes."
    (`host-media-grid.tsx`). Red: `host-media-grid.bulk-like.test.tsx`, 4 (the old "says nothing" test reshaped, its
    scar kept and said).
  - The host's own Add at her gated door → `useUploadQueue`'s `ownerEventId` sends her files through the host's pair
    (`HOST_CLIP_ENDPOINTS`) with no join; the page passes `event.id` for the owner (`event-experience.tsx`). Red:
    `use-upload-queue.test.tsx` "the album's owner, adding to her own album" (4) and `door-settles.test.tsx` "the page's
    one queue, for the album's owner" (2, with the old page swapped back).
  - Local probes on `localhost:3133`: `POST /api/guests/mine` `{kept:true}` signed out → 200 `{"ok":true,"kept":0}`,
    `private, no-store`; without a ticket → 400; the plain `mine` answer unchanged.
- **For the next build's red-team** (what localhost cannot sign in to; one device, serial sign-outs and sign-ins):
  - The red-team's own C28-3: signed out at a names-only album K, "Partyreel Fan", 1 photo, Keep this event → Confirm
    your email → Continue with Google → partyr33l: back on K the moment plays ("Your photos are safe", "You're on as
    Partyreel. Change", Will Gibson, Follow/Following), no toast; Network: one `POST /api/guests/mine` `{kept:true}` →
    `kept` ≥ 1; `pr_pending_offer_<K>` gone; a reload plays nothing and asks nothing. Build 30's ask path ("Dee" at
    odds) still asks, and It's mine still plays the moment.
  - Abandoned: signed out at K2, 1 photo, Keep → Confirm your email → close the sheet; `/login` → Google → partyr33l →
    `/dashboard` (its toast); open K2: no moment, no `kept` request, no `pr_pending_offer_<K2>` left.
  - A magic-link return (Will's 10 seconds: the confirm door's email link, tapped in the same browser): as the first.
  - The owner's Add: willg97 on his album G at each private door ("You let each person in", "Only people you invite",
    "Only people already in", Only me) and at an open album with review on: `/e/<G>` → Add photos → Send 1 → the tile
    lands at once, credited as the host; Network `/api/host/r2/presign-upload` and `/complete-upload` 200, no
    `/api/guests`; SQL the media `guest_id` null and `approved`, no new guests row of his at G. Its Delete there moves
    it to Deleted.
  - Malformed ids: `/dashboard/not-a-uuid` (+ `/review`, `/guests`, `/reel`, `/settings`, `/print`) → "Event not
    found · Partyreel", noindex, the not-found drawn; `/admin/albums/not-a-uuid`, `/admin/accounts/12345` → 200 "Page
    not found · Partyreel Ops"; no new 22P02 events in Sentry for those hits.
  - "Use a different email": partyr33l's AAL2 portal tab open; at an invite-only album that does not list her, the shut
    door's Use a different email → this tab signed out; the portal tab still in, no MFA asked (SQL `auth.sessions`:
    her admin session unchanged).
  - Bulk Like: select a photo already liked → Like → "Already liked 1 photo", the selection closes. The Review peek:
    open it, Shift+Tab first → Close preview, never the tile behind.
- **Assets requested from Will:** none.
- **Board ideas:** the follow moment after a Google or magic-link return speaks of her photos without a number (nothing
  was uploaded this visit); the `kept` read now counts this phone's photos there, so it could say "Your 3 photos are
  safe".
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (`create_guest` untouched: the owner's Add left
  the guest routes instead).
- **Calls his to overrule:** the owner's Add rides the host's routes (approved at once where review is on, credited as
  the host, no guest row of hers); a claim that ran for another album's ticket spends that album's marker (no late
  moment); "Already liked N kind" and the refusal's words; Shift+Tab from the look comes round to Close preview (the
  four Questions above).
- **Look at first:** `claim-uploads.ts`'s `runClaim` (the `kept` fold and `spendOffersOf`) with `route.ts`'s
  `answerKept`; `use-upload-queue.ts`'s `ownerEventId` route; `selectable-media-grid.tsx`'s `focusOnOpen`.
