---
track: crumbs-35
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the bulk-select line ("the 28px band the header holds never grows") and the claims-review line (the silent claim's refresh).
- `docs/systems/guest-flow.md`: "Auth-aware header island" (the header follows the device's session) and "The blob re-key" (what the measurement says).
- `docs/systems/admin-observability.md`: the portal's chrome links never prefetch (one line, with its reason).

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

(Rewritten at each push; deleted at the handoff. Scratch: `../partyreel-wt/_scratch/crumbs-35/`, read it before re-measuring anything.)

**Done, each green on its own gate (typecheck, lint, `pnpm test`), pushed**
- Portal prefetch, `fecfda1b`: `prefetch={false}` on the rail, the below-lg dropdown, the bar's wordmark / health chips / Security row; `admin-chrome-prefetch.test.tsx` (red on the old code, 4 failing). Prefetch runs only in a production build, so no local number: name the auth-log count for the next red-team.
- Dashboard claims, `19efab5e`: `ClaimsReview` subscribes to `onClaimed` and `router.refresh()`es when a claim carried uploads; 4 new tests red before.
- Guest header, `075662f3` (+ manifest `d484ba33` for `foreign-ticket.test.tsx`): the header looks again on the SDK's sign-in and sign-out, the Cookie Store API's `change`, focus / visibility / pageshow, and the door writing a name or ticket (this last asks the server: only a 401 drops an account). 9 new tests red before. Real Chrome + real SDK + a fake session cookie: `header-follow-cookiestore.log`, `header-follow-nocookiestore.log` (PASS), `header-follow-OLD-code.log` (FAIL on the old header). The page MUST load signed out there: a bogus JWT in the cookie 500s the server's own PostgREST reads.
- Hub select height, `8db2e7e9`: `FeedSectionHeader` (now `"use client"`) measures its row while the tools are there and holds that as `minHeight` while `actionFills`. Real Chrome on `/design/album-scale?surface=host&key=fiesta` through the real Select and Cancel: `select-jump-BEFORE.log` (375: first tile 88, 54, 88; 320: 68px) and `select-jump-AFTER.log` (still at 320 to 1440). Doc line in `host-app.md` refined.

**Not started / left**
1. Item 4, a guest's own upload landing: MEASURE FIRST in a visible headless Chrome (the Browser pane is hidden and cannot tell): does a fresh `<img src="blob:…">` (the re-keyed `MediaTile`, `loading=lazy`, `decoding=async`) answer `complete` at mount after the stack tile showed the same blob? Harness idea: a temporary uncommitted page (never staged) mounting the real `MediaTile`, swapped from a plain `<img>` of one blob; read `data-instant` and per-frame opacity. If it fades: fix the root in `media-grid.tsx` (a blob src is the device's own picture, drawn straight) with a test; if not: retire it in the Handoff with the measurement. Then refine `guest-flow.md` "The blob re-key".
2. Item 6, Escape on the keep sheet: HELD ON PURPOSE, no code. The keep sheet is the door's own last step (`KeepOffer` / `KeepConfirm` inside `EntryShell`, `held`: `onEscapeKeyDown` prevented), pinned by `entry-modal.test.tsx` ("is HELD like every step: no X, Escape inert…"); the WHY already stands in `entry-shell.tsx` and `entry-modal.tsx` ("★ NO EXIT"), and in `guest-flow.md` ("THE AFFORDANCE TABLE IS ONE ROW"). The door is untouched by order. Say so in the Handoff.
3. `docs/systems/host-app.md`'s claims-review line (the silent claim's refresh) and `admin-observability.md`'s one line on the chrome's links never prefetching.
4. The whole gate on the final tree: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `zsh scripts/build-lock.sh pnpm build`, then `pnpm lab:smoke --base http://localhost:3131` (the lab crawl's PREMISE line: if it names `locked-door`, `event-ready` or `disposable-mode`, say in the Handoff why its asks still hold: `event-ready/hub.tsx` and `disposable-mode/host.tsx` draw `FeedSectionHeader`, which now only holds a height while `actionFills`, which their drawings never set).
5. The Handoff: fill it, set `status: handed-off`, delete this section, lane check (`git diff --name-only origin/launch-prep...HEAD`), push, one line in chat.

**Running state**: my dev server is on port 3131 (started from this worktree; kill by port, never by name, before a build and at the end). No headless Chrome left open between runs (each script closes its own).

**Calls that are his to overrule (carry to the Handoff)**: the header now also picks up an in-page sign-in (the confirm door's code) without a reload, the symmetric half of the same fix; the select bar sits centred in the held band (62px at 375) rather than at its top; the portal's chrome links never prefetch (one click now waits for its own route).
