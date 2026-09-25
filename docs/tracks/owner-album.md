---
track: owner-album
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4840c3c6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/album-guest
  - src/lib/events/gallery-access
  - src/app/api/album/guest/
  - src/app/(guest)/e/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
---

# lp/owner-album

**Goal.** The host opening their own password event's guest page (the album, `?reel`, `?reel=screen`, so "Play on a screen" too) reads it as the owner it is, instead of crashing: the one blocker build 10's red-team found, fixed before milestone 29.

## The brief

**The failure** (build 10's red-team, reproduced three times, the only server errors on the deployment): signed in as the host, `/e/e0b1f5fcb4754992b02850b46644126a` ("Alias red-team (disposable)", a password event, one photo) answers "Something went wrong" plain, with `?reel` and with `?reel=screen`; the server logs `Error: album: the guest read refused a full-access viewer` as an unhandled rejection and the process exits 128. The page resolves the owner to full access (`isEventOwner`, `gallery-access.server.ts`), but the album's reads gate on `albumReadable()` (`src/lib/db/queries/album-guest.ts`), which lets a password album through only with the unlock cookie, which the owner never holds; `gallery-access.server.ts:336` then throws, and `/api/album/guest/sync` throws the same way at line 171, while the sync and media routes answer the owner `locked` / `access: none`. The page and the routes disagree about the owner.

**The fix:** one idea of the owner across the page and the three routes (`sync`, `media`, `manifest`): the owner passes every gate, as the rest of the guest page already does, decided server-side from `getUser()` (never `getSession()`) against the event's `host_id` through the existing `isEventOwner` (fail closed on a failed read). A refusal must never throw into an unhandled rejection: a read that is refused answers as locked, never a 500. Nothing widens for anyone else: a signed-in non-owner without the unlock cookie, an anonymous viewer and a stale cookie stay refused exactly as today, and the unlock-cookie path is unchanged.

**Tests** (the security boundary is the point): the owner reads a password album through the page's seed and all three routes; a signed-in stranger, an anonymous viewer and a wrong event's cookie are refused through each; an open event is unchanged; a thrown read becomes a locked answer. Verify locally with the routes and the page's seed; the alias's check is the Orchestrator's on build 11 (the Chrome account chooser as willg97). Put any `guest-flow.md` or `database-security.md` line the fix changes in your Handoff for the Orchestrator.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- The same page's "Download all" had the same bug one surface over: `getApprovedMediaForUnlock`
  (`guest-events-admin.ts`, outside this lane's owns), the password album's whole read behind
  `/api/export/guest`, kept the cookie-only gate, so the host's own export of a password album counted
  0 files. Fix it here? Recommended: yes, built as its own commit `01bafd0f` (the gate line, its import
  and comment, two tests in `guest-events-admin.test.ts`, the Download-all block of
  `owner-gate.test.ts`); `git revert 01bafd0f` drops it whole and the rest stands (the full suite was
  green at `49a9d455`, before it; a revert of it on `2d5ed248` applies cleanly with its four affected
  test files green).
- The brief's "a thrown read becomes a locked answer": built as a REFUSAL becomes locked (the throw
  that crashed the page was the refusal's). A read that genuinely FAILS (a database error) still
  fails: the routes answer 500 (the client store keeps what it had, `store.ts`) and the seed reaches
  the guest error screen, now reported and never a crash. Recommended: keep; a failure answered as a
  locked album would draw a full viewer an empty album and a 0 count until the next poll (up to 60 s)
  and would hide an outage from monitoring.

## System-doc edits (in place, owned facts only)

- none: `guest-flow.md` and `database-security.md` are this lane's `reads`; the lines the fix changes
  are in the Handoff, for the Orchestrator.

## Deferred (ROADMAP one-liners, bucket named)

- Code hygiene: `mayUploadPastLock` (`src/lib/events/upload-lock.ts`) and `resolveAlbumViewer`
  (`src/lib/events/album-viewer.server.ts`) still ask the owner inline (`getUser()` + `isEventOwner`);
  moving both onto `isRequestOwner` (`gallery-access-owner.server.ts`) makes every gate on the guest
  page one owner answer (from owner-album).

## Handoff (replaces the chat report)

- Work commits on `lp/owner-album`, pushed: `49a9d455` (the fix, owned paths only), `01bafd0f` (the
  export exception, Question 1), `2d5ed248` (stale comments: the gallery poll and `/api/reel/download`
  are gone). No sync commit: `origin/launch-prep` moved to `ca663d55` (reel-and-copy's merge `749d5f33`
  and records), which shares no file with this lane, and `git merge-tree --write-tree HEAD
  origin/launch-prep` is clean (exit 0); the head is in the chat line.
- Gates, all on `2d5ed248` (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/owner-album/gate-*.log`):
  `pnpm typecheck` exit 0; `pnpm lint` exit 0 (0 errors; 6 warnings, all in files this lane never
  touched); `pnpm test` exit 0 (484 files, 5,433 tests); `zsh scripts/build-lock.sh pnpm build` exit 0;
  `pnpm lab:smoke --base http://localhost:3131` exit 0 (272 checks, 0 failing). No board, so no
  `lab:demo`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, except
  `src/lib/db/queries/guest-events-admin.ts` and its test (`01bafd0f`, Question 1: the export's read
  gate is the same owner rule; no lane in flight owns either file).
- The items:
  - The gate (`albumReadable`, `src/lib/db/queries/album-guest.ts`): a password album reads for the
    unlock cookie OR the request's owner (`isRequestOwner`: `getUser()`, then `isEventOwner`'s explicit
    `host_id` match, failing closed), the cookie asked first so an unlocked guest pays no auth read;
    open and private unchanged (a private album reads nothing, even for its host).
  - The owner idea's home: `src/lib/events/gallery-access-owner.server.ts` (`isEventOwner` moved
    verbatim and re-exported from `gallery-access.server.ts`, so its five importers are untouched and
    the album's reads import no loader that reads through them; `isRequestOwner` is `cache()`d, so the
    page's owner flag and every read its seed makes are one answer per render).
  - A refusal is a null, never an exception: `planGuestAlbumSync` (replaces `readGuestAlbum`) asks the
    gate once for the whole plan; the seed and the sync, media and manifest routes answer a refusal
    after a `teaser`/`full` decision as locked behind the password (`ALBUM_REFUSED`) and report it
    (`reportAlbumRefused`: Sentry `security`, "album: the reads refused a viewer the decision let in").
  - The manifest route no longer answers a refused page as an empty `full` page, which the client
    adopts as the album's last page (`store.ts`), cutting the album short.
  - The crash itself: the page streams `streamGallerySeed` (`loadGallerySeed` with a handler attached
    the moment it exists), and the seed reads its plan and the reel's facts together (`Promise.all`),
    so a failing seed is never an unhandled rejection (the exit 128). The page asks the owner through
    `getRequestAuth` + `isRequestOwner`.
  - Tests: `album-guest.test.ts` (12: the host through all five reads, stranger, anonymous, unlocked,
    open, private, one gate per plan, a failed read still throws); `gallery-access-owner.server.test.ts`
    (6, on the fake PostgREST with every row readable to everyone); `gallery-access.server.test.ts` (+4:
    a refused plan is locked and reported, the reel read never left unheld, the stream guard); each
    route's test (a refusal is locked and reported; media and manifest: a decision's refusal is not
    reported; sync: a failed read still fails, and a refusal keeps a pending heal with no validator);
    `src/app/api/album/guest/owner-gate.test.ts` (12, end to end through the real
    resolver, decision, owner, gate, unlock cookies signed for real, routes, seed and export).
  - Mutants run and caught: the cookie-only gate, the original bug (5 failing); the owner check without
    its `host_id` match (7, the stranger cases among them); the seed without its handler and the reel
    read apart from the plan (each an "Unhandled Rejection" error failing the run); the export gate
    cookie-only (3).
  - Local on :3131 against the real Supabase and R2
    (`/Users/gibby/local/ai/partyreel-wt/_scratch/owner-album/live-check-2d5ed248.log`): the red-team
    password event as an anonymous viewer, with a forged unlock cookie and with a forged session
    cookie: the page 200 with the locked seed and no error screen, sync `locked`/`password`, media no
    links, manifest `none`/`password`, Download all 403; an open event (Reel lane probe, anonymous):
    the page's seed a manifest, sync 18 of 18, links, the next manifest page, Download all 14 photos
    and 4 videos; malformed input 400; the dev log shows no unhandled rejection. Not run locally: the
    host's own path (sign-in is allow-listed; `owner-gate.test.ts` covers it end to end), and no valid
    unlock cookie was minted for the red-team event.
  - For build 11's alias check (willg97 through the account chooser): `/e/e0b1f5fcb4754992b02850b46644126a`,
    with `?reel` and `?reel=screen`, paints the album and polls it (sync answers `manifest`/`full`), a
    photograph opens, "Download all" counts 1 photo; signed out, the same URL shows the password door.
- Doc lines for the Orchestrator (`guest-flow.md`, this lane's `reads`; line numbers at `ca663d55`):
  - L277-279, "`hasContributed` and `canContribute` have NO defaults, ...: two callers hand out real
    bytes" → "one caller (`/api/export/guest`) hands out real bytes" (`/api/reel/download` is gone).
  - L489-492, the anon media RPCs bullet: "served ONLY via the server admin-read
    (`getApprovedMediaForUnlock`, self-guarded by the unlock cookie) after `/api/guests/unlock`
    verifies the password" → "served ONLY via the server admin-reads (`getApprovedMediaForUnlock` and
    the paged album's reads, `album-guest.ts`), each self-guarded by the unlock cookie or the host
    (`isRequestOwner`): after `/api/guests/unlock` verifies the password, or for the host, who never
    meets that door" (the `getApprovedMediaForUnlock` half rides `01bafd0f`).
  - L503-507: "the owner check (`isEventOwner`, an explicit `host_id = uid` match) runs ONLY when
    signed in" → "the owner check (`isRequestOwner` → `isEventOwner`, an explicit `host_id = uid` match,
    `gallery-access-owner.server.ts`) runs ONLY when signed in, and the album's own reads ask the same
    one-per-render answer, so the page and its seed never disagree about the host".
  - L680-682: "(the RSC passes [`loadGallerySeed`](../../src/lib/events/gallery-seed.ts) down
    UN-awaited;" → "(the RSC passes [`streamGallerySeed`](../../src/lib/events/gallery-access.server.ts)
    down UN-awaited, `loadGallerySeed` with a handler attached the moment it exists: a seed that failed
    before React held it was an unhandled rejection, and Vercel exits the function on one;".
  - New ★ in "Gallery access", after the ONE server entry paragraph: "★ **THE ALBUM'S READS KEEP A
    SECOND GATE, AND ITS REFUSAL IS LOCKED, NEVER A THROW.** `album-guest.ts` lets a password album
    through for the unlock cookie or the host (the page's own owner answer), so a null after a
    `teaser`/`full` decision is the two gates disagreeing: the seed and the sync, links and manifest
    routes answer it locked behind the password (`ALBUM_REFUSED`) and report it (`reportAlbumRefused`,
    Sentry `security`); an empty manifest page never says `full`; a read that fails is still a
    failure."
  - `database-security.md`: no line changes.
- Assets requested from Will: none.
- Board ideas: a real seed failure (a read error, not a refusal) takes the whole guest page to the
  error screen; an album-level boundary with a retry would keep the header, the door and the upload
  working while only the album says it could not load.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The export exception (`01bafd0f`), built and droppable whole (Question 1).
  - A genuine read failure is still a failure, never a locked answer (Question 2).
  - A refusal after the decision answers the password door (`gate: "password"`), not the decision's own
    gate: the password is the only lock the reads keep.
  - The refusal warning is Sentry `security` (a legitimate viewer locked out by two gates disagreeing,
    like `unlock_password_state_unreadable`).
  - `isEventOwner` moved to its own module (re-exported, importers untouched) rather than leaving an
    import cycle between the album's reads and the loaders that read through them.
- Look at first: `albumReadable` in `src/lib/db/queries/album-guest.ts` (the boundary), then
  `src/app/api/album/guest/owner-gate.test.ts` (the boundary end to end), then `01bafd0f`.
