---
track: export-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e385f61"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/export/
  - src/lib/export/
  - src/app/api/export/
  - workers/export/
  - content/help/download-photos-videos-and-albums.mdx
  - content/help/browse-the-album.mdx
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/export-flow.json
  - docs/systems/uploads-and-r2.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
---

# lp/export-wiring

**Goal.** Build Will's six `export-flow` answers into Download: the Yours row, a toast that stays with a subtle cancel, a one-line refusal for an empty zip, a big album walked through as parts in plain words, and a phone's Download all saved to Files; then retire export-flow.

## The brief

**His answers** (`docs/reviews/export-flow.json`, each note there; the board's drawings in `src/app/(dev)/design/sandbox/export-flow/`):
- `means=mine`: a Yours row at the menu's top downloads her own uploads. His note: it "does support getting any pictures/videos you took live in-app". Yours is filtered on the server by her own capability token or account, never an id list from the browser.
- `wait=toast`: the toast keeps her in the loop where she is ("rather than at the top of the page"). The Orchestrator's read of his "flag this if bad call": a good call, so long as the toast stays until the zip is ready and carries the stuck state's cancel.
- `stuck=retry`, his note: "include a subtle x icon on the right side to cancel if desired. Interruptibility is a huge win in UX." A cancel stops the wait and, where the Worker can, the work.
- `hollow=refuse`: a wholly empty zip is refused, in one clean line (his note: "Copy should be cleaner and 1 line"). A short zip keeps his `failed=exact` style from the board.
- `cap=split`, his note: "Download all should be as easy as possible, even over 2000 items/20GB. Would hate for someone to think they downloaded everything then delete the event not knowing. However, rather than messily saying ', in 2 zips' that should just be made clear and walked through in the download flow. Nobody in my family would understand 'in 2 zips'."
  - Over the limit, Download all walks her through the parts in plain words ("Part 1 of 2") and says plainly when every part is saved.
- `phone=?`, his note, built as the answer (the board's `zip`): "Download all does not need to download straight into native photos the way individual media should. This can be catered toward the best big download path(s), like saving directly to files." A single photo keeps its Save to Photos.

**★ The export Worker** (`workers/export/`, `partyreel-export`) is one deployment that partyreel.com (milestone 29's app) uses too. Every change stays backward compatible with that app's requests: new parameters optional, old responses unchanged. Prove it with a test that replays milestone 29's request shapes (`git show milestone-29:src/lib/export/export-service.ts`). The Orchestrator deploys the Worker after your merge (`wrangler whoami` first). Name what the deploy needs (a secret, a route) in your Handoff; never deploy it yourself.

**Then retire `export-flow`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Paths:** the guest album's Download all entry lives in guest files (`live-gallery.tsx`, `gallery-skeleton.tsx`): add what you need to `owns`, or name a one-line exception. `help-wiring` holds the tracker and the guest's name menu this batch.

**★ The block's door stays on every export path.** `safety-wiring` merged the per-event block: `src/app/api/export/guest/route.ts` asks the closed door (`src/lib/events/closed-door.server.ts`), so a blocked person's export answers exactly as a private album's. Every path you add or reshape, Yours included, keeps that check, pinned by a test.

**Verify:**
- Vitest for the parts, the cancel, the empty refusal and Yours' server filter; the Worker's own tests, the compatibility replay included.
- The menu and the toast at 1440 and 375.
- `pnpm lab:smoke` whole.
- The next build's red-team walks it short of any download.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **"Saved" is not something the app can see.** Once the browser's download manager takes a zip, the page never
  hears from it again, so the walk cannot say when a part is saved. Built: after the last part, "All 3 parts are
  downloading. That's everything." (the words his note asks for, on what the app knows). Recommended: keep; a real
  "saved" needs the Worker to report a finished stream (a Deferred line).
- **A tap a part.** The walk offers "Get part 2" rather than starting every part at once: a browser holds back, or asks
  about, a second download a page starts on its own, and a token lives two minutes. Recommended: keep. Overrule: chain
  the parts automatically and accept Chrome's "download multiple files" prompt.
- **The Worker is asked before the file.** Every download makes one extra request (`POST /check`: 8 ms against the
  local Worker; two `list` calls for a wedding, a `head` each for a small set) so an empty zip is refused and a short
  one counted, and a Worker refusal is said in the toast instead of replacing the album with its bare "Forbidden".
  Recommended: keep. Overrule: drop the check and lose all three.
- **The one line.** "Nothing left to download." with Try again, one line at 375 and at 1440
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/shots/strip-375-toasts.png`). The board's "Nothing downloaded: the album changed." ran two lines beside its Try
  again, so "left" carries the reason. Recommended: keep. Overrule: "The album changed." (shorter, colder).
- **A short zip, `failed=exact`'s register with "download" for "zip"** (his "Nobody in my family would understand 'in 2
  zips'"): "142 of 148 are in your download." with "Try again for the 6", which asks again for exactly the missed ones
  (the Worker names them; the server intersects them with what she can see). Two lines at 375. Recommended: keep. A
  retry that finds them gone says "Those 6 aren't in the album anymore."; one whose files are still not there, "Those 6
  couldn't be downloaded."
- **The next part's button is "Get part 2",** because "Download part 2" pushed "Part 1 of 3 is downloading." onto two
  lines at both widths (measured on the toaster's own font). Recommended: keep.
- **Yours' identity is her account and this browser's ticket cookie,** the export route's own read identity (its upload
  gate and closed door use the same one), never the request. The page's View menu counts Yours from its local ticket, so
  in the moment a ticket and its cookie disagree (before the album's sync heals the cookie) the two counts can differ.
  Recommended: keep.
- **Where it lands, in words:** on an iPhone the menu says "Each saves to your Files app. To keep a photo in Photos, open
  it and tap Save." and the toast "Saving to your Files app."; on Android "Each saves to your Downloads." and "Saving to
  your Downloads."; a desk keeps "Each downloads as one file." (read by `share-save.ts`' `detectPlatform`, the viewer's
  own). A big album adds ", a big album in parts". Recommended: keep.
- **The quiet re-attempts' budget:** three tries at 10, 15 and 20 s, not the board's three seconds (a mint over a
  2,000-item guest album is honest work), so about 47 s before "Couldn't start that download." with Try again, the x
  there all along. Recommended: keep.
- **The zips' names:** `mia-and-theo.zip`, `mia-and-theo-yours.zip`, `mia-and-theo-part-2-of-3.zip`. Recommended:
  keep.
- **The marketing figure** (the board's `cap` said it "has to match"): /features/album's "Take all of it" plate read "Up
  to 2,000 items.", untrue once a big album comes in parts. Built: "A zip of the originals: everything, photos, or
  videos, however big the album." (`album-copy.ts`, a named exception). Recommended: keep.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md` (a read; its Download all section is this lane's system): the check before the
  file, parts from a position cursor with the old 413 kept for a request without a part, Yours by the server, one Worker
  deployment answering milestone 29's requests unchanged (and its entry module exporting the handler alone), the logs.
- `docs/systems/guest-flow.md` (a read): the Yours line, the Download menu's Yours row read by `/api/export/guest`.
- `docs/systems/host-app.md` (a read): the `live` slice's line (parts, no longer a refusal past 2,000).

## Deferred (ROADMAP one-liners, bucket named)

- Exports: a part's "saved" needs the Worker to report a finished stream (a signed call into `export_log`, or a status
  the walk polls); the walk says "downloading" meanwhile (from `export-wiring`).
- Admin: `/admin/exports` counts mints only; a check that found objects gone and a stream's skips live in the Worker's
  logs (`export-check`, `export-stream`), and a report back into `export_log` would put them on the page (from
  `export-wiring`).
- Exports: a walk lives in the page, so a reload mid-walk forgets it; its cursor in sessionStorage could offer the next
  part again (from `export-wiring`).
- The lab and the kit: the Browser pane is shared by every lane's session, and a call without `tabId` acts on whichever
  tab another lane last fronted (this lane's one such call navigated triage-wiring's harness tab, put straight back); a
  testing-verification.md line (from `export-wiring`).
- (Retire, not add: ROADMAP's "Exports: the album page states 'Up to 2,000 items' ..." is answered: the album page reads
  "however big the album", the menu names no limit, a big album comes in parts. And its "The lab and the kit:
  `ui/responsive-menu.tsx` cannot be drawn in a lab frame ..." loses its export-flow example with the board; the seam it
  asks for still stands.)

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/export-wiring`:** owns `7c29ba13` (the guest help's download line); the work `66472bac`; the
  retirement `b13caf14` (one commit: the folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`); a line
  break `e0c8a171`; this handoff on top. **No sync:** launch-prep moved only by records and `src/lib/db/types.ts`'s
  event_blocks additions, none of this lane's reads or paths, and `git merge-tree --write-tree HEAD
  origin/launch-prep` merges clean (exit 0, `/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/merge-tree.txt`).
- **Gates on `e0c8a171`, each on its own exit code:** `pnpm typecheck` 0 (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/final-typecheck.log`); `pnpm lint` 0, 4
  warnings, none in a file this lane touched (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/final-lint.log`); `pnpm test` 0, 533 files / 6,070 tests
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/final-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/final-build.log`); `pnpm lab:smoke --base
  http://localhost:3131` 197 checks, 0 failing (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/final-smoke.log`). No board, so no `lab:demo`. The Worker
  (`workers/export`): `tsc --noEmit` 0 (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/worker-typecheck.log`), `vitest` 3 files / 34 tests
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/worker-test.log`), `wrangler deploy --dry-run` 0, 16.46 KiB (`/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/worker-dryrun.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 41 paths): owned paths and this file, plus the named
  exceptions: `registry.ts`, `boards.ts`, `touchpoints.ts` (the retirement, named by the brief);
  `src/components/marketing/sections/features/album/album-copy.ts` (the one fact parts make false, /features/album's
  "Up to 2,000 items.", now "however big the album", and its import that fact alone used); the three system docs above.
- **Items:**
  - `means=mine`: Yours leads a guest's Download menu when she has something here, counted and zipped from the server's
    read of her account and this browser's ticket (`src/lib/export/yours.server.ts`); proved on the real route with a
    disposable guest's ticket (hers: 2 of 7; no ticket or a body ticket: none) and in the pane at 375.
  - `wait=toast` + `stuck=retry`: one toast (`export-toast.tsx`) carries a download until the file is handed over, with
    a subtle x on the right in every state that waits on her; a mint gets two quiet re-attempts; the x aborts the fetch
    in flight and nothing is posted after (`export-walk.test.ts`; a real tap on the x at 375 in the pane).
  - `hollow=refuse`: the Worker's `POST /check` (`workers/export/src/check.ts`) is asked first; nothing found is "Nothing
    left to download." and no file, a short zip is counted with a Try again for exactly its missed ids. Proved end to
    end under `wrangler dev` (real mints, a local bucket holding 12 of 14: "12 of 14 are in your download.", its retry
    minted with the 2 ids; a set with none: the one line; `unzip -t` clean on the streamed zips).
  - `cap=split`: past 2,000 items or 20 GB an album is parts, oldest first, from a position cursor
    (`build-manifest.ts`; `build-manifest.test.ts` walks deletions and arrivals mid-walk with every item in exactly one
    part; the host route walks 2,300 photographs as 2,000 and 300 on the clamping fake); a request without `part`
    keeps the 413.
  - `phone`: the menu's note and the done toast say Files (iPhone) or Downloads (Android); a single photo keeps the
    viewer's Save to Photos.
  - The Worker: `/check` is additive; `compat.test.ts` replays milestone 29's requests (its own signer's token, its
    form POST, its refusals) at the vendored milestone-29 Worker and at today's and holds status, headers and zip bytes
    equal. `wrangler dev` caught a named export in the entry module that stops workerd from starting (a dry-run build
    passes it); now pinned. The deploy window works: the new app against the deployed (old) Worker saw both checks
    blocked by CORS and went ahead with the zip (pane, 2.8 s).
  - Help: `download-photos-videos-and-albums.mdx` (Yours, the note and its x, the one line, parts, phones) and
    `browse-the-album.mdx`'s Download all line.
  - export-flow retired (`b13caf14`).
- **Disposable data:** the event "Export wiring probe (disposable)" (willg97, 7 items, 2.17 MB, guests "Yara Q." and
  "Omar K."), seeded through `scripts/seed-demo-event.mjs`; a few `minted` rows in `export_log` for it and for "Reel lane
  probe (disposable)". Nothing else was written.
- **Assets requested from Will:** none.
- **Board ideas:** a disposable-camera mode is already its own board (`disposable-mode`, from his `means` note). None new.
- **Proposed Worker change** (the Orchestrator deploys after the merge; `wrangler whoami` first): `cd workers/export &&
  npm ci && npm run typecheck && npm test && npm run deploy`. No new secret (`EXPORT_SIGNING_SECRET` unchanged), no route,
  no binding; one compatibility flag in `wrangler.jsonc`, `enable_request_signal` (a cancelled check stops reading). Until
  it deploys, the app's checks fail open and downloads go as before. **Migrations / Vercel / Stripe / env:** none.
- **Calls his to overrule:** "downloading" and "That's everything" for "saved"; a tap a part ("Get part 2"); the check
  before every file; "Nothing left to download."; "142 of 148 are in your download." with "Try again for the 6"; Yours by
  the account and the ticket cookie; the phones' words; the retry budget; the zips' names; /features/album's "however
  big the album" (all under Questions).
- **Look at first:** `/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/shots/strip-375-toasts.png` (every toast at 375, light then dark) and
  `/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/shots/strip-1440-toasts.png`; `/Users/gibby/local/ai/partyreel-wt/_scratch/export-wiring/shots/375-menu-yours.png` and `375-menu-parts.png`; then
  `src/components/app/export/export-walk.ts` and `workers/export/src/compat.test.ts`.
