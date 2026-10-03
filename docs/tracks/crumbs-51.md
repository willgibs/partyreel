---
track: crumbs-51
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f85e3b9d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/the-highlight-reel.mdx
  - content/help/make-your-own-clip.mdx
  - content/help/browse-the-album.mdx
  - content/help/play-the-reel-on-a-screen.mdx
  - src/app/admin/exports/live-reel-kill-switch
  - src/lib/constants/careers
  - src/components/marketing/sections/features/album/album-fill-grid
  - src/components/marketing/sections/features/album/everywhere-stage
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - docs/systems/dashboard.md
  - content/help/AUTHORING.md
---

# lp/crumbs-51

**Goal.** Make the words true of today's product where round 12's merges moved it: the help articles and the admin switch that still describe the retired reel tile and the welcome as a screen, the careers line, two stale hero comments, and host-app.md's "pulse".

## The brief

**Why.** Round 12's merges moved the product under these words (ROADMAP's lines, quoted there; retire each you finish by naming it in your Handoff, never by editing the ROADMAP, which is the Orchestrator's):
1. **Help:** `the-highlight-reel.mdx` (lines 22 and 52), `make-your-own-clip.mdx` (line 23) and `browse-the-album.mdx` describe the Highlight reel tile above the album; since `header-wiring` the reel lives in the album's cover (its stills dissolving under the name, and its round beside Add and Invite; deep in the album the shutter's right-hand round plays it). And `browse-the-album.mdx` (:22, "behind a blurred welcome screen") and `play-the-reel-on-a-screen.mdx` (:24) still draw the welcome as a screen in front of the album; it is the doorway's page, and the steps rise over it as sheets. Quote the controls as the source names them (`help-ui-labels.test.ts` holds them).
2. **Admin:** the live-reel kill switch's sheet says every event "loses its reel tile" (`src/app/admin/exports/live-reel-kill-switch.tsx`); it now takes the cover's reel round and the shutter's.
3. **Careers:** `careers.ts`'s "the tile at the top of the album" is the cover now.
4. **Code hygiene:** `album-fill-grid.tsx`'s and `everywhere-stage.tsx`'s comments still say "the hero's grid" and "the hero's three" columns, a table the hero kept until the live stream replaced it.
5. **Docs:** `host-app.md` (:319, :333) still names "the pulse" where a waiting newcomer or a restore shows; it is the dashboard's stage, its week and its tiles' marks now (`docs/systems/dashboard.md`). `guest-flow.md`'s line (:721) is `door-reveal`'s doc while it runs: name the line as it should read in your Handoff.

Read `docs/systems/guest-flow.md`'s album head and `reel.md` for the facts. Words only where a test can hold them; no product behaviour changes. Will's standard for every word: far less text, never a tool's voice.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; each changed help article read on your dev server at 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: no product, UX or scope decision opened; the wordings I chose are the Handoff's calls, built as recommended.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md` (:319, :333): "the pulse" is "the dashboard", where a waiting newcomer shows as the stage's or the week's step (opening `#at-the-door`) or else a mark on the event's tile (`dashboard.md`, `lib/dashboard/attention.ts`'s `itemFor`).

## Deferred (ROADMAP one-liners, bucket named)

- Help: `how-partyreel-works.mdx` (:40), `day-of-checklist-for-hosts.mdx` (:53), `share-the-album-after-the-event.mdx` (:29) and `turn-off-uploads-or-cap-file-size.mdx` (:41) still play the reel "at the top" of the album, where the cover's round play button opens it, and `print-or-display-your-qr.mdx` (:50) has guests land on a "welcome screen", which is the doorway's page (from `crumbs-51`).
- Marketing: `how-it-works.ts` (:130), `album-copy.ts` (:37) and `getting-in-stage.tsx` (:21) say a guest lands on "a welcome screen" that asks for a name; the welcome is the doorway's page and the name rises over it as a sheet (from `crumbs-51`).
- Tests: `help-ui-labels.test.ts` also scans `src/components/marketing/` and comments, so a label only a marketing mock or a comment still carries passes (the retired tile's "Make your own clip to share", quoted until now by `make-your-own-clip.mdx`, lives only in `sections/reel/live-tile.tsx` and a `poster-card.tsx` comment); `help-product-doors.test.ts` could hold where the reel's button is as the reel articles say it (the cover's row and the shutter's twin, `event-experience.tsx` :1336 and :1586) and refuse "tile" there (from `crumbs-51`).
- Tests: `no-em-dash-policy.test.ts` walks the tree inside vitest's 5 s default and timed out once with the machine at a load average of 20 (passes alone in 1 s, and in the rerun); it could take its own timeout (from `crumbs-51`).
- Docs: `reel.md` still draws the retired tile (:4, :9, :17, :50, :74, :144, :171, :187) and links Settings' `highlight-reel-card.tsx` (:152), now `event-settings/reel-page.tsx`; `guest-flow.md`'s header (:4) says "the tile" too; the cover and its round are `guest-flow.md`'s album head (from `crumbs-51`).
- Code hygiene: the retired hero fill and the pulse live on in `everywhere-peek.test.tsx` (:239, a test's name), `everywhere-section.tsx` (:14), `src/app/(app)/dashboard/page.tsx` (:109, :295), `gated-sites.test.ts` (:94, :139) and `route-skeleton.test.tsx` (:45); `docs/ASSETS.md` row 22 still names the hero's live album as the reader of `album-fill-fixtures.ts`, which only the Everywhere pair reads (from `crumbs-51`).

## Handoff (replaces the chat report)

- **Commits.** The work commit is `4fac8337` on `lp/crumbs-51`; the sync commit is `d52f172d` (a merge of
  `origin/launch-prep` at `219cec81`: `door-reveal` merged at `d3d172fd` while the lane ran, moving `guest-flow.md`, the
  door and four help articles under my words, with no conflict and none of my paths touched; before it, `take-home`'s
  lab-only board landed at `303c6e82`); this manifest is the commit on top. All pushed.
- **Gates**, each on its own exit code, on the synced tree `d52f172d` (clean): `pnpm typecheck` 0
  (`_scratch/crumbs-51/typecheck2.log`); `pnpm lint` 0, no warning (`lint2.log`); `pnpm test` 0, 789 files and 9,336
  tests (`test2.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build2.log`); `pnpm lab:smoke --base
  http://localhost:3133` 0 on my dev server, 138 checks and 0 failing (`smoke2.log`; scope: the Library and the shell, no
  boards; its two PREMISE lines name `create-wizard` and `event-header`, whose open asks `describe` `host-app.md`: my two
  edits there are the pulse's words only). No `lab:demo`: board none. The same five were green before the sync on the
  working tree that became `4fac8337` (`typecheck.log`, `lint.log`, `test.log` 9,261 tests, `build.log`, `smoke.log` 139
  checks). A second full `pnpm test` with this manifest in the tree is 0 (789 files, 9,336 tests; `test4.log`); the first
  failed one test, `no-em-dash-policy.test.ts`, on vitest's 5 s timeout with the machine at a load average of 20
  (`test3.log`; it passes alone in 1 s: the Tests line under Deferred). The dev server is stopped and my Browser tab
  closed.
- **Read at 375** on my dev server: all four articles, no horizontal overflow (`scrollWidth` 375 on each). The control
  names are read off the product: on the local demo album (`/e/` the public demo token) the cover's row is `Add photos`,
  `Watch the highlight reel` (a round, `title` and `aria-label`), `Invite` (a round), and the shutter's group is `Invite`,
  `Add photos`, `Watch the highlight reel`; after the sync the server's HTML carries the same two rounds
  (`_scratch/crumbs-51/demo.html`; `event-experience.tsx` :1336 and :1586).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD` at the handoff head), every line under `owns`, a
  `docs/systems/` file listed above, or this manifest; no exception:
  ```
  content/help/browse-the-album.mdx
  content/help/make-your-own-clip.mdx
  content/help/play-the-reel-on-a-screen.mdx
  content/help/the-highlight-reel.mdx
  docs/systems/host-app.md
  docs/tracks/crumbs-51.md
  src/app/admin/exports/live-reel-kill-switch.tsx
  src/components/marketing/sections/features/album/album-fill-grid.tsx
  src/components/marketing/sections/features/album/everywhere-stage.tsx
  src/lib/constants/careers.ts
  ```
- **Held by tests, and not.** The articles' quoted labels are held by `help-ui-labels.test.ts` (it passes `Watch the
  highlight reel`, `Add photos`, `Invite`, `Make your own`), their frontmatter, links and em-dashes by the help suites (the
  descriptions are 197, 196, 187 and 191 characters against the 200 cap), `careers.ts`'s shape by `careers.test.ts`. The
  kill switch's sheet, the two comments and `host-app.md` are held by none, and I added none: a test on those words
  would pin one phrase (the Tests line under Deferred is the guard worth having). No Context7 pass: no library is touched.
- **The items**, each retiring its ROADMAP line (named by its words; the ROADMAP stays the Orchestrator's):
  1. Help, "`the-highlight-reel.mdx` (lines 22 and 52), `make-your-own-clip.mdx` (line 23) and `browse-the-album.mdx`
     describe the Highlight reel tile" and "`browse-the-album.mdx` (:22 ...) and `play-the-reel-on-a-screen.mdx` (:24)
     still draw the welcome as a screen": `the-highlight-reel.mdx` (description, the first "Where it plays" bullet, :45, the
     callout), `make-your-own-clip.mdx` (:23, and the tile's retired line `Make your own clip to share` gone),
     `browse-the-album.mdx` (description, :22, the reel section, Invite), `play-the-reel-on-a-screen.mdx` (:24, step 2);
     `updated` is 2026-10-02 on all four. The cover's round is "its round play button, `Watch the highlight reel`", and
     deep in the album "the same button waits beside the floating `Add photos`"; the welcome is "the door (the welcome, a
     password, the wait for the host)" and a preview under "a sheet", in the words `door-reveal`'s articles use.
  2. Admin, "the live-reel kill switch's sheet says every event 'loses its reel tile'": `live-reel-kill-switch.tsx` (the
     lede names "the cover's play button and the shutter's"; the paused line reads "No reel, screen or Make your own").
  3. Careers, HALF of "Marketing: the reel section's live tile (...) and `careers.ts`'s 'the tile at the top of the album'
     draw the retired tile, and `reel/poster-card.tsx` has no app consumer left": strike only the `careers.ts` clause
     (`careers.ts` :61, "from the album's cover to the screen at the front of the room"); the reel section's live tile
     (`sections/reel/live-tile.tsx`, `live-section.tsx`) and `poster-card.tsx` stay open.
  4. Code hygiene, "`album-fill-grid.tsx`'s and `everywhere-stage.tsx`'s comments still say 'the hero's grid'": the grid's
     `peek` note (:39-45) and its columns note (:228-229), the stage's header (:26-29) and its JSX note (:66-67).
  5. Docs, HALF of "host-app.md (:303, :317) and guest-flow.md (:721) still name 'the pulse'": strike `host-app.md`
     (:319, :333, done); `guest-flow.md`'s half stays and is the Orchestrator's to place, since `door-reveal` has merged and
     no live lane owns the doc now. The line is now :808, the bullet "A withdrawal is final for the host", and it should
     read "... no host surface shows or restores it (the album and its viewer, Review, Deleted and `restore_media`, the
     dashboard's stage, week and tiles (their counts, wall and covers), the exports, the live reel), ...", in place of
     "the home's pulse and the events list's counts and covers". It holds: the dashboard's reads count only
     `status = approved` with `removed_at` null (`lib/dashboard/stage-action.ts` :27, `event_covers`' newest approved).
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The help names the cover's icon-only round by its own name in `<UiLabel>` (a tooltip and a screen-reader name, not
    visible text) beside a plain description ("its round play button"); the alternative is the glyph alone.
  - Beyond the quoted lines, from the same merges: `browse-the-album.mdx` calls Invite "the round QR button on the
    cover" and the grid "a grid" (it said "two-column"; the album lays one to eight a row by width, `ROW_CLASSES` in
    `lib/shared/album-rows.ts`); `the-highlight-reel.mdx` :45 ("the welcome screen") and the callout ("The tile is already
    playing") are reworded.
  - The kill switch's "The reel's own guidance and screen disappear" line is left as it was (it is the host's Reel
    card, which reads Off); the paused line drops "tile, view" for "No reel".
  - In the two comments, the phone album "lays two a row at its default step" (it said `columns-2`, retired with the
    masonry) and the stage's "no lamp, no Replay" is gone (neither exists in the code).
- **Look at first:** `/help/the-highlight-reel` at 375, "Where it plays" (the cover's button and the shutter's), then
  `/help/browse-the-album`'s "The reel". `crumbs-52` owns `event-experience` and `reel/` this round: the help names the
  buttons, never their place in code.
