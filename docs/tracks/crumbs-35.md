---
track: crumbs-35
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "35f68175"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/event-feed/bulk-bar.test.tsx
  - src/components/app/event-feed/feed-section-header.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/guest-header.test.tsx
  - src/components/guest/foreign-ticket.test.tsx
  - src/components/guest/guest-account-menu.tsx
  - src/components/app/dashboard/claims-card.tsx
  - src/components/app/dashboard/claims-review.tsx
  - src/components/app/dashboard/claims-review.test.tsx
  - src/components/app/media-grid.tsx
  - src/components/app/media-grid.test.tsx
  - src/components/admin/admin-nav.tsx
  - src/components/admin/admin-rail.tsx
  - src/components/admin/admin-bar.tsx
  - src/components/admin/admin-chrome-prefetch.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/admin-observability.md
  - docs/systems/design-system.md
---

# lp/crumbs-35

**Goal.** Build 34's red-team finds: the hub's album held still through Select and Cancel at a phone's width, the guest header dropping an account whose session ended elsewhere, the dashboard's claims dropping a row the silent claim took, a guest's own upload landing with no second fade, the portal's sidebar prefetches costing an auth read each, and Escape on the keep sheet.

## The brief

Build 34's red-team finds (`../partyreel-wt/_scratch/redteam-34/ledger.txt`; grep it for the steps), each fixed at its root with a test that fails on today's code:

- **LOW, the hub's select mode at 375** (and the ROADMAP's line "the hub's select mode changes the header's height on a phone"): open the hub at 375, Select, Cancel, and the album jumps 34 px up and back (its first tile at y 494, 460, 494). The resting tool row wraps to 62 px and the selecting row is 28 px, so crumbs-32's "nothing bounces" holds only where the tools fit on one line. The album's top stays put through Select and Cancel at every width. ★ `event-ready`'s `list` ask owns what that row says ("Before the first photo", the ROADMAP's line on its wrap): change its height's behaviour, never its words or content.
- **NIT, the guest header after a session ends elsewhere**: the page renders signed in, the session ends in another tab, and the door asks her name, but the header still shows partyr33l's avatar and account menu until a reload. The header follows the viewer the door settles on.
- **NIT, the dashboard's claims after the silent claim**: when the dashboard's own claim takes a row, the claims banner and the review card still offer it, and Claim then answers "All sorted". Both drop what was claimed.
- **LOOK, a guest's own upload landing** (the red-team could not confirm it in a hidden tab): when her tile is re-keyed to the stored media id, a fresh `<img>` mounts at opacity 0 and fades in on load, where `guest-flow.md` promises the tile turns optimistic "with zero flicker" (crumbs-32 made the link swap seamless; the re-key may undo it). Measure it, then fix the root if it is real, or retire it with the measurement if it is not.
- **OBS, the portal's prefetches**: each portal page view prefetches the sidebar's links, about 30 `GET /auth/v1/user` a view (the proxy's refresh on each). Cut that cost without weakening a page's own `getUser()`, which stays the boundary.
- **OBS, Escape on the keep sheet**: Escape did not close the "Keep your photos" sheet. If the popup kinds' rule closes every sheet on Escape, this one does too. If it is held on purpose, say why in a WHY-comment and the Handoff.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The hub, the signed-in guest page, the dashboard's claims and the portal cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door`, `event-ready` and `disposable-mode` describe the door, the hub and the guest page. Change no word or behaviour their asks describe beyond these fixes, and leave `entry-modal.tsx` and the door untouched. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- None open. Every call the brief left is built on its recommended answer and listed under the Handoff's "Calls his to overrule".

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the bulk-select line ("the 28px band the header holds never grows") and the claims-review line (the silent claim's refresh).
- `docs/systems/guest-flow.md`: "Auth-aware header island" (the header follows the device's session) and "The blob re-key" (what the measurement says).
- `docs/systems/admin-observability.md`: the portal's chrome links never prefetch (one line, with its reason).

## Deferred (ROADMAP one-liners, bucket named)

- Admin: the portal's page-content links (`queue-list.tsx`, `inbox-pane.tsx`, `moderation-grid.tsx`, `triage-filter.tsx`, `health-band.tsx`, `operator-alerts.tsx`) still prefetch, two auth reads a distinct route, and a long inbox adds one per row; the chrome's one-word `prefetch={false}` applies to them too (measured on the Library's compositions page, production build: 10 `_rsc` requests to 4 routes, `prefetch-count-AFTER.log`) (from `crumbs-35`).
- Guest: a guest's own upload landing is measured in Chrome only (visible and hidden: the re-keyed tile is `complete` at mount, no fade); walk one upload landing on an iPhone in Safari for a flash between the stack tile leaving and her tile showing (from `crumbs-35`).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-35`** (the head is in the chat line): `fecfda1b` portal prefetch · `19efab5e` dashboard claims · `075662f3` guest header (+ `d484ba33`, the manifest claiming `foreign-ticket.test.tsx`) · `8db2e7e9` hub select height · `12a6ecf5` the own upload retired with its measurement, its pin and the three system-doc lines · `5b5f216b` the manifest's owns. launch-prep moved since the cut by record commits only (`crumbs-36`'s manifest, the pickup): no sync owed, and `crumbs-36`'s `owns` overlap none of mine (read from `origin/launch-prep:docs/tracks/crumbs-36.md`).
- **Gates, each on its own exit code** (logs in `../partyreel-wt/_scratch/crumbs-35/`): `pnpm typecheck` 0 (`typecheck-4.log`), `pnpm lint` 0 (`lint-4.log`), `pnpm test` 0 (`test-4.log`, 681 files, 8,152 tests, from a baseline of 8,126 in `baseline-test.log`), all at `12a6ecf5`, whose code the head carries (the later commits are the manifest alone); `zsh scripts/build-lock.sh pnpm build` 0 (`build.log`) and `pnpm lab:smoke --base http://localhost:3131 --production` 0, 149 checks, 0 failing (`lab-smoke-prod.log`; the key from `.env.local`, the closed-door checks included), both at `c84e6786`; and `pnpm test` once more on the tree of the handoff commit itself, 0, 681 files, 8,152 tests (`test-final.log`, run after this manifest was last edited). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `admin-bar.tsx`, `admin-nav.tsx`, `admin-rail.tsx`, `admin-chrome-prefetch.test.tsx`, `claims-review.tsx`, `claims-review.test.tsx`, `bulk-bar.tsx`, `bulk-bar.test.tsx`, `feed-section-header.tsx`, `media-grid.test.tsx`, `foreign-ticket.test.tsx`, `guest-header.tsx`, `guest-header.test.tsx` (every one in `owns`), the three `docs/systems/` files listed above, and this manifest. Untouched though claimed: `event-gallery.tsx`, `gallery-actions.tsx`, `guest-account-menu.tsx`, `claims-card.tsx`, `media-grid.tsx`.
- **The items**
  1. **The hub's select mode at a phone's width** (`8db2e7e9`): `FeedSectionHeader` (now `"use client"`) measures its row while the tools are there and holds that as its `minHeight` while `actionFills`, so the band keeps the height its tools had at rest at every width and the bar sits centred in it. Real Chrome on the hub's own album (`/design/album-scale?surface=host`), the real Select and Cancel pressed: before, 375 first tile y 88, 54, 88 (the red-team's 34px) and 320 moved 68 (`select-jump-BEFORE.log`); after, still at 320 to 1440 (`select-jump-AFTER.log`) and on the production build (`select-jump-AFTER-production-build.log`). Four tests in `bulk-bar.test.tsx` red on the old header. `event-ready`'s `list` words and content are untouched.
  2. **The guest header after a session ends elsewhere** (`075662f3`): the header now follows the session the device holds (the SDK's sign-in and sign-out, the Cookie Store API's `change` which reaches a hidden tab, focus, visibility and pageshow, and the door writing a name or ticket while an account stands, which asks the server: only a 401 drops an account). Nine tests in `guest-header.test.tsx` red on the old header. Real Chrome and the real SDK with a fake session cookie: the account draws within 65ms of a session cookie appearing and is gone by the first poll after the cookie is cleared from outside the page (`header-follow-cookiestore.log`), the focus fallback without the Cookie Store API passes (`header-follow-nocookiestore.log`), and the same script FAILS on the old header (`header-follow-OLD-code.log`).
  3. **The dashboard's claims after the silent claim** (`19efab5e`): `ClaimsReview` subscribes to `onClaimed` and refreshes the page behind itself when a claim carried uploads, so the banner and the card drop what it took (and the Guest cards join Your events). Four tests in `claims-review.test.tsx` red before.
  4. **A guest's own upload landing**: RETIRED WITH ITS MEASUREMENT, no code change. A real `MediaTile` swapped in for a plain `<img>` of the same blob, in a visible headless Chrome and in a hidden one, with the stack tile leaving 0, 16, 50, 200, 1000 and 3000 ms before the tile mounts: the fresh `<img>` answers `complete` at mount, takes `data-instant` in the mount's own commit and shows at opacity 1 on its first frame, never the fade (`own-upload-visible.log`, `own-upload-gap-visible.log`, `own-upload-gap-hidden.log`, the harness in `harness/`, never committed). The red-team's hidden-tab trace does not reproduce in either. Pinned by one green test in `media-grid.test.tsx`; WebKit is unmeasured (Deferred above).
  5. **The portal's prefetches** (`fecfda1b`): `prefetch={false}` on the rail's 13 links, the below-lg dropdown's, the bar's wordmark, health chips and Security row; every page's own `getUser()` untouched. Four tests in `admin-chrome-prefetch.test.tsx` red before. On a production build of the Library's compositions page (prefetch is on there: 50 `_rsc` requests) the nine rail-only routes took 0 prefetches (`prefetch-count-AFTER.log`); the 10 that remain are the page content's own links (Deferred above).
  6. **Escape on the keep sheet**: HELD ON PURPOSE, no code. The keep sheet is the door's own last step (`KeepOffer` and `KeepConfirm` inside `EntryShell`), and every step of the door is held: `onEscapeKeyDown` and the outside press prevented, no X (`entry-shell.tsx`'s `held`), the one free surface being the album menu's "Change name". The WHY already stands in `entry-shell.tsx`, in `entry-modal.tsx`'s "★ NO EXIT" and in `guest-flow.md`'s "THE AFFORDANCE TABLE IS ONE ROW", and `entry-modal.test.tsx` pins it ("is HELD like every step: no X, Escape inert, and no chevron back into a finished upload"). The keep step's own ways out are Maybe later on the offer and the back chevron on the account door. The door is untouched, as ordered.
- **The lab crawl's PREMISE lines** (`lab-smoke-prod.log`): all three desk boards are named, and their asks still hold. `disposable-mode` (8 asks) and `locked-door` (4) describe `guest-flow.md`, where I refined two lines (the header island's following, and a measured clause on the blob re-key): neither changes a word or a behaviour their asks describe (the door, the shut door, the camera, the wall, the peek: all untouched; `entry-modal.tsx` and the door's files are not in the diff), and `disposable-mode/host.tsx` draws `FeedSectionHeader` with no `actionFills`, which is all the hold keys on. `event-ready` (5 asks) describes `host-app.md`, where I refined the bulk-select line and the claims-review line: its `list` ask owns the row's words ("Before the first photo") and I changed only how the band's height behaves while the bulk bar fills it, never a word or the row's content; `hub.tsx` draws the header with no `actionFills`.
- **For the next build's red-team** (what runs only signed in or on a real host; each with its expected):
  - *Hub select, at 375, 320 and 430* (an iframe at that width, willg97's hub on an album of a few dozen items): Select, then Cancel; the first `[data-media-tile]` top is the same at rest, while selecting and after Cancel (the band reads 62px at 375 in all three, the bar centred in it); a bulk Delete then leaving select mode moves nothing. Local proof: `select-jump-AFTER.log`.
  - *Guest header, two tabs* (tab 3 on a guest album signed in, tab 2 the dashboard): sign out in tab 2, and in tab 3 WITHOUT reloading the avatar drops to "Start for free" within about a second in Chrome even while the tab is hidden; then Continue, let the door ask a name, type it: the header wears the name menu ("Your name on this album"). The in-page code sign-in (confirm door, then the header shows the account with no reload) needs an emailed code: Will's. A session revoked on another device is not drivable.
  - *The dashboard's claims*: stage as RT34 did (signed out at an album, Continue as guest, a name and willg97's address in the optional email field, upload; then sign in as willg97 and open /dashboard): the toast "We added your uploads to your account." and, within about a second, no "waiting for you" banner and no Review offering the claimed row; the Guest card is in Your events.
  - *The portal*, as partyr33l (AAL2): open a surface and read the auth log for her portal session's `GET /auth/v1/user` (the red-team's own method, `edge_logs` filtered by her session id): a page view should cost the 2 reads of the page itself plus 2 for each distinct route its own content links to (the triage chips and queue rows still prefetch: Deferred above), where the rail alone added about 26; every rail item and the bar's wordmark still navigate.
  - *A guest's own upload landing, on a visible phone (Will's)*: one photo through the album's Add; watch for a flash or a second fade between the in-flight tile and hers.
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. No SQL.
- **ROADMAP lines this lane retires** (the Orchestrator's to edit): "Host: the hub's select mode changes the header's height on a phone …" (its anchor clause, "the album's anchor could own a change above the album too", stays an idea: nothing above the album changes height now). The line "Host: at 375 the album's 'Before the first photo' wraps to two lines …" does NOT retire (the wrap stands; the band holds its height through it).
- **Calls his to overrule:**
  - the header also picks up an in-page sign-in (the confirm door's code) with no reload, the symmetric half of the same fix: after confirming, her avatar replaces the name menu at once (it used to wait for a reload);
  - the select bar sits centred in the held band (62px at 375) rather than at its top, leaving the 17px above and below it empty;
  - the portal's chrome links never prefetch: a click on the rail waits for its own route, a beat the prefetch used to hide;
  - the header keeps an account through a server that stumbles (a 500 or a network blip on `/api/me/menu`); only a 401 drops it to the CTA or her name (it used to drop on any non-OK answer, at mount too);
  - Escape stays inert on the keep sheet, as the held door rules; if he wants Escape to be a way out of that one step, it is one row in `entry-shell.tsx` and the door's own ask.
- **Look at first:** `feed-section-header.tsx` (the held height, one hook), then `guest-header.tsx`'s `look` (the one function every trigger calls), then the select-jump and header-follow logs.
