---
track: crumbs-73
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "63757567"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/event-hub-head-cover.tsx
  - src/components/app/event-feed/hub-develop
  - src/components/marketing/sections/how-it-works/host-pictures.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/gallery-empty-state-sheet.tsx
  - src/lib/disposable/contact-sheet-develop.ts
---

# lp/crumbs-73

**Goal.** Two ROADMAP crumbs: the host's hub develops too (her first open after the develop develops the cover in place, as her guests' album does), and how-it-works' Create picture draws four hairlines at the look.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours.

**The fixes:**
1. **The hub develops too.** This is the-wait board's carried `hub` call, deferred by arrival-wiring (merged). Her hub's cover is the guests' sheet, so her first open after the develop develops it in place.
   - Mount `DevelopSheet` (`src/components/guest/gallery-empty-state-sheet.tsx`, a read: import it, never fork it) over `event-hub-head-cover.tsx`, once per phone, with the same mark rules arrival-wiring wrote for guests (`docs/systems/disposable-mode.md`).
   - A host who opened the hub during the wait sees the develop on her next open after it, never twice.
   - Reduced motion lands developed at once.
   - Pin it with a test.
2. **Marketing:** how-it-works' Create picture (`host-pictures.tsx`) draws three hairlines at the look; the room has four since the add step (styles-wiring). Draw four.

Wiring rigor: the whole gate (`lab:smoke` covers the Library and marketing). Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is at its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does the hub's develop play live, when the develop time comes while her cover stands (the clock, or her own Develop
  now), or only on her next open?** Recommended and built: live, as the guests' does. The cover gives way to her rows with
  the develop's still sheet in the same place and plays it as it is seen, so Develop now plays her sheet into her album.
  Overrule: a live flip is spent unplayed and only a later open plays it.
- **Where does it play, her album standing below the head, the cards and the checklist?** Recommended and built: once the
  still sheet has been in view a beat (the rows held under it from the first byte). A scroll never ends it, since she
  scrolls to reach it; a press or key ends it anywhere while it plays and only inside her album while it waits, so a tap on
  a card above it never takes it from her. Overrule: the guests' rule (any press, scroll or key ends it, at any time),
  which would spend the develop on the first scroll toward the album.
- **A develop time that comes while she is looking early (Look)?** Recommended and built: it never plays over her rows
  (decided once, as the box mounts) and is owed her next open. Overrule: it plays when the time comes.
- **Which photographs develop on her sheet?** Recommended and built: the guests' roll (`rollOfEntries`: everything
  created at or before the develop time, after the one this phone last saw) read off her manifest, less her hidden and held
  photographs, so both sides count the same ones. An album turned disposable mid-party therefore also develops what showed
  before the switch (as for guests, the ROADMAP line on `sealed_from`). Overrule: the period's start as her floor now,
  which drops the held photographs a switch put in the roll (`joined`, read only while the develop is ahead).
- **`?reel` and reduced motion.** As the brief and the guests' rules say, built: `?reel` spends it unplayed (the reel was
  what she came for), and reduced motion lands developed at once (nothing held, the mark written).

## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`: "The host's cover" gained its sibling, **The hub develops too** (decided once as the
  box mounts, the guests' mark and gate, the roll off her manifest, seen before played, what ends it, the rows' one
  tree), and the header's "Open this before you" names her hub's develop.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Host: the hub's head comes up out of its house light with the develop, as the guests' cover does at 1.65 s
  (`[data-develop-cover]`, `gallery-empty-state.css`); the head is `event-hub-head.tsx`'s, so the hub's develop leaves it as
  it is.
- Now: Host: when the guest's read carries the period's start (the ROADMAP line on `sealed_from`), `hub-develop-roll.ts`
  takes the same floor so the hub's sheet and the guests' count one roll; the held photographs a switch put in the roll
  (`joined`) are readable only while the develop is ahead (`host-cover.server.ts`), so her side needs them kept first.

## Handoff (replaces the chat report)

- **Commits** on `lp/crumbs-73`, pushed: `57ef7bd78` (the marketing crumb), `06b16ddef` and `8ba2ec10c` and `74d3d214b` (the
  hub's develop, its tests, their polish), `8fe6d6db5` (the system doc), then the tests' three additions and this manifest
  (the head is the chat line). **No sync:** launch-prep moved to `a650a344e` (admin-uploads and records), whose changed
  files (`git diff --name-only 09ffde69a origin/launch-prep`: the admin Accounts pages and reads, `lib/db/queries/accounts.ts`,
  docs) touch none of my paths or reads and overlap none of them.
- **Gates**, each its own exit code, on `8fe6d6db5`'s tree (the later commits add only tests and this file, rerun below):
  `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (930 files, 11,482 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3131` 0 (145 checks, 0 failing; scope the Library and the shell, no board).
  After the tests' last additions (`7bbf70077`: `hub-develop.test.tsx` only, +3 tests): `pnpm typecheck` 0; `pnpm lint` 0;
  `pnpm test` 0 (930 files, 11,485 tests); the build and the smoke stand, the source tree being the one they ran on.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned prefixes (`hub-develop.tsx`,
  `hub-develop-roll.ts` and the three `hub-develop*.test` files, `event-hub-head-cover.tsx`, `host-pictures.tsx`) +
  `docs/systems/disposable-mode.md` (the System-doc edit) + this file. **One exception:**
  `src/components/app/event-feed/event-gallery.tsx`, an import and the rows' box wrapped in `HubDevelop` (five lines): the
  develop must stand over her rows when her cover gives way to them, and only the gallery draws that box; it is the one
  mount, and `hub-develop.gallery.test.tsx` pins it.
- **The items**
  1. The hub develops too: `src/components/app/event-feed/hub-develop.tsx` (the director, the stage, the growing tile;
     `HubDevelop` wraps the rows in `[data-develop-album]` and `[data-develop-rows]`, the stylesheet's own hooks, so no
     CSS of its own), `hub-develop-roll.ts` (the roll), and `event-hub-head-cover.tsx`, whose `useHerShots` (her own,
     lit) and `useLinksRevision` it now exports for both. Pinned by `hub-develop.test.tsx` (25), `hub-develop.gallery.test.tsx`
     (2) and `hub-develop-roll.test.ts` (6); five regressions were each seen failing against them (the mark never written,
     a wheel ending it, reduced motion playing, a press anywhere ending the waiting sheet, a decision re-made on every
     render).
  2. Marketing: how-it-works' Create picture draws the room's four hairlines at the look (`ROOM_STEPS` in
     `host-pictures.tsx`: the name and the add done, the look she is on, the beat to come); read on the local `/how-it-works`
     (four hairlines, filled 1, 1, 1, 0).
- **Verified locally.** The hub itself is signed in, so it cannot run on localhost; the live red-team is the alias's and is
  not run (local only). Instead the lab's host surface (`/design/album-scale?surface=host`, the real `EventGallery`,
  `HostAlbumProvider` and album over its fake store) carried a temporary develop prop and uuid ids (reverted, never
  committed), read in the Browser pane at 1398 px and in a 390 px frame: the page took up the gate's hold
  (`__prDevelop.claimed`); the still sheet held 60 squares with her seven lit; it played once it had been seen; eight
  first-screen tiles grew out of their squares, and the four read had each rectangle equal to its album tile's to the pixel
  at the play's last frame; a second open was plain (no gate, no hold, the rows visible); a sheet below the fold stood still
  and held until it was in view. Not seen: mobile Safari, and the reduced-motion preference on a real page (unit-pinned).
- **Assets requested from Will:** none.
- **Board ideas:** the hub's head developing with the album (Deferred); "See it as a guest" (`share/as-guest-view.tsx`)
  composes its own album and plays no develop (arrival-wiring's note, still open).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the five Questions above.
- **Look at first:** a Disposable album's hub the morning after, on a phone that has not seen it develop: her album's place
  is the still sheet ("Developing") where her cover stood; scroll to it and it develops into her rows once; reload and it is
  plain. Then, with the cover standing, press Develop now.
