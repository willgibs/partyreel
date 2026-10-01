---
track: crumbs-35
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "35f68175"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/guest-account-menu.tsx
  - src/components/app/dashboard/claims-card.tsx
  - src/components/app/dashboard/claims-review.tsx
  - src/components/app/media-grid.tsx
  - src/components/admin/admin-nav.tsx
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
