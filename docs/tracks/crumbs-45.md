---
track: crumbs-45
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c326bde9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/my-uploads-gallery.tsx
  - src/components/app/my-feed-more.tsx
  - src/lib/media/uploader-faces.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/profiles-social.md
  - docs/systems/host-app.md
  - docs/systems/reel.md
---

# lp/crumbs-45

**Goal.** Build 36's red-team finds, the milestone's last gate: a first-page Delete in My uploads that holds on screen (the MEDIUM), the reel card's Add photos landing where it aims, and the owner's own upload credited with his face.

## The brief

Build 36's red-team (`../partyreel-wt/_scratch/redteam-36/ledger.txt`, grep it for the steps and ids) found one MEDIUM, which blocks milestone 32, and two smaller things beside it. Each is fixed at its root with a test that fails on today's code:

- **MEDIUM, a first-page Delete in My uploads comes back** (crumbs-38's paging): on a person's own page (`/u/<handle>`, Your uploads), Delete on an item of the FIRST page: the tile leaves at once, the action answers 200 with `x-action-revalidated: 1`, and about 20 ms later the tile comes back and stays until a reload (three items, three times; forced frames, so not a hidden-tab effect; SQL shows each removed; a `router.refresh()` draws the right page). The red-team's read: `my-uploads-gallery.tsx` leans on the action's revalidation to bring back a first page without the item, while `drop()` only edits the pages a Show more loaded. Make a delete hold on screen in both kinds of page, in either order of the revalidation and the local edit, nothing doubled when the first page refills, and My likes checked for the same shape.
- **LOW, the reel card's Add photos stops short** (crumbs-36's scroll): the reel card's popover closes over 150 ms and then returns focus to the reel card without `preventScroll`, which cancels the smooth scroll toward the upload panel mid-way (at 375x667 the dropzone ends 9 to 21 px below the fold; reduced motion lands exactly). Fix it where the focus returns (`event-feed/reel-card.tsx`: the popover's close auto-focus when Add photos was pressed, or the scroll begun once it has closed). Leave `host-add-provider.tsx` alone: `crumbs-42` changed it and merges after you. Three files are yours by named exception, never an `owns` line, since a handed-off lane's manifest claims each one's folder while its branch never touched the file (checked 2026-10-01): `event-feed/reel-card.tsx` (`crumbs-42`), `u/[slug]/owner-sections.tsx` (`crumbs-44`) and `media-lightbox-parts/credit.tsx` (`crumbs-43`); name each in your Handoff.
- **NIT, a "?" disc on the owner's own upload:** in the owner's own feed viewer, his own upload is credited with a "?" disc ("? Host · ..."); the host's credit wears the byline's face everywhere else (`media/uploader-faces.ts`, `media-lightbox-parts/credit.tsx`).

The red-team's other NIT, the closed strike line saying one date twice, is not yours: `crumbs-41` rewrote that line and merges after you; it waits for that merge.

**Verify:**
- the gate;
- each fix's test red on today's code;
- on localhost, what runs signed out (the reel card's scroll through its Library specimen, if one draws it).

Your owner-mode and hub steps go to the alias, where the Orchestrator proves them before the milestone: name them in your Handoff.

**Will's desk is up** with six boards, `locked-door`, `event-ready` (the hub's cards among its frames), `privacy-hero`, `disposable-mode`, `demo-framing` and `about-press`. If the lab crawl's PREMISE line names one, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Six handed-off lanes merge after you: leave their files to them. `crumbs-41` has the admin portal and billing, `crumbs-42` the hub's rooms, the dashboard, `host-add-provider.tsx` and the create wizard, `crumbs-43` the guest pages, the viewer's loading ring and `lib/history-entry.ts`, `crumbs-44` the profile's cards, toggles and setup, `strip-gaps` the EXIF strip, `export-ends` the download. Two lanes run beside you: `lab-sitting` (the lab) and `mkt-polish` (marketing).

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
