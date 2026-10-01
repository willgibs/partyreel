---
track: crumbs-45
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c326bde9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/my-uploads-gallery.tsx
  - src/components/app/my-uploads-gallery.test.tsx
  - src/components/app/my-feed-more.tsx
  - src/components/app/my-feed-more.test.tsx
  - src/components/app/my-likes-gallery.tsx
  - src/components/app/my-likes-gallery.test.tsx
  - src/lib/media/uploader-faces.ts
  - src/lib/media/uploader-faces.test.ts
  - src/lib/db/queries/my-uploads.ts
  - src/lib/db/queries/my-uploads.test.ts
  - src/lib/db/queries/my-likes.test.ts
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

- **His own upload's credit in Your uploads: "You" or his name?** Recommended and built: "You", beside his face and
  the Host badge, the viewer's word for your own upload (his own guest page already credits his upload "You"); the
  hub says his name, since nothing there is a delete-your-own surface. His to overrule: his name, as the byline reads.
- **His uploads to other people's events: a face too?** Recommended and built: no, they keep the event alone, as the
  credit was drawn for the personal feed ("shows only the event they came from"); only his own events' uploads carry
  the Host badge, and so a face beside it. A face on every item would be a new look for the feed, not a fix.
- **A door on his own face?** Recommended and built: none; he is on his page, and a door to it would only reload it
  under the open viewer.
- **A credit with no name: the "?" disc anywhere?** Recommended and built: no disc at all; a host with no name (whose
  byline already hides) is credited by the Host badge alone, since "?" is the invented stand-in the identity rule
  refuses.

## System-doc edits (in place, owned facts only)

- `profiles-social.md`, the owner mode's feeds line: a delete or an unlike leaves every page, the first one too, on
  the page's own word (`drop`), never on the action's revalidation, and why that can land late.
- `uploads-and-r2.md`, the faces line: the owner's own events' uploads in her Uploads wear her own name and face, no
  door, credited "You" (`ownUploadCredit`); a host with no name wears no disc.

## Deferred (ROADMAP one-liners, bucket named)

- Now · Viewer: an address write (Next's patched `replaceState`) in the same tick just before a revalidating Server
  Action drops the action's answer until the next router action, which then applies it (Next 16.2.6, measured by
  crumbs-45 in a bare app, `_scratch/crumbs-45/probe`: a write before it drops it, one after it or long before it
  lands); `lib/history-entry.ts`'s matrix lacks the row, and a viewer verb that closes then acts (`masonry.tsx`'s
  Delete, Remove, Restore, Purge) meets it whenever its close writes in place (a photograph opened from its
  address); the personal feeds hold their own drop since crumbs-45, and a verb that leans on its revalidation
  should too (from `crumbs-45`).

## Handoff (replaces the chat report)

- **Commits, pushed:** `6227d367` (owns and the questions), `5f757b79` (the work), `c976fdff` (the system docs), and
  this manifest commit. No sync: launch-prep moved only by record commits since the cut (`a3b03c59`..`e94bef13`:
  `docs/ROADMAP.md`, `docs/tracks/orchestrator.md`).
- **Gates on `c976fdff`**, each on its own exit code (logs `_scratch/crumbs-45/gate-*.log`): `pnpm typecheck` 0,
  `pnpm lint` 0 (no warnings), `pnpm test` 0 (698 files, 8,366 tests), `zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3134` 0 (138 checks, 0 failing; SCOPE `event-ready`, which imports
  `reel-card.tsx`), `pnpm lab:demo --board event-ready --base http://localhost:3134` 0 (5 steps, 0 failing).
- **Each fix red on today's code:** the new tests against launch-prep's sources fail 13 times across six files, each
  with the finding's own symptom (`_scratch/crumbs-45/red-on-launch-prep.log`, by `_scratch/crumbs-45/red-check.sh`):
  the first-page drop (`['a','b','c']` for `['a','c']`), the gallery's delete coming back, a never-answered round
  trip, `canDelete` absent, the reel card's `focus()` without `preventScroll`, the faces read missing, the "?" disc.
  The likes guard is green on both, as the check found.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths above, this file, the two system
  docs, and four files by named exception, each in a handed-off lane's folder and untouched by its branch (checked
  again at handoff): `src/components/app/event-feed/reel-card.tsx` and its `reel-card.test.tsx` (`crumbs-42`), and
  `src/components/shared/media-lightbox-parts/credit.tsx` and a new `credit.test.tsx` beside it (`crumbs-43`). The
  brief's third exception, `u/[slug]/owner-sections.tsx`, went unused: the face rides the feed's own query
  (`my-uploads.ts`), so the owner mode's signature and its gate test stand as they were.
- **MEDIUM, a first-page Delete came back:** the viewer's close writes the address in the same tick just before the
  Delete's revalidating action, and Next commits that write over the answer, so the old first page stood (reproduced
  in a bare Next 16.2.6 app, visible headless Chrome: `_scratch/crumbs-45/probe`, `s-scenario*.js`; the next router
  action applies the held tree, `s-catchup.js`). `useFeedPages`' `drop` now takes an item out of every page for the
  page's life (`my-feed-more.tsx`), joined to the action's transition, a never-answered round trip toasts instead
  of falling to an error boundary, and My likes leaves through the same `drop` (it held already, on its own set).
- **LOW, Add photos stopped short:** Radix's close auto-focus is a plain `trigger.focus()` (read in
  `@radix-ui/react-popover` 1.1.15), which cancels the smooth scroll; Add photos' close now focuses the card with
  `preventScroll` (`reel-card.tsx`), every other close unchanged. Chrome probe: a plain `focus()` 150 ms into the
  scroll left the page at 81 px of 981, `preventScroll` landed it (`_scratch/crumbs-45/scroll-probe.html`,
  `s-scroll.js`). No Library specimen draws Add photos (the `event-ready` hub has no add provider); its reel card's
  guidance still opens, closes on Escape and hands focus home in a real browser (`s-reel.js`).
- **NIT, a "?" disc on his own upload:** his own events' uploads carry `isHost` and no name, so the credit drew a host
  with "?" for an initial; they now wear his own name and face (`ownUploadCredit` in `uploader-faces.ts`, his row
  through his own client, no door), the gallery tells the viewer every item is his (`canDelete`, so "You"), and a
  host credit with no name draws no disc anywhere (`credit.tsx`).
- **PREMISE `disposable-mode`** (its 8 asks describe `uploads-and-r2.md`, which this lane touched): they still hold;
  the edit refines only the viewer credit's face line (the owner's own face in her Uploads, a nameless host's disc),
  and none of camera, waiting, wall, peek, create, video, cost or save turns on a credit.
- Assets requested from Will: none. Board ideas: none. Proposed migrations / Worker / Vercel / Stripe / env: none.
- **Calls his to overrule:** "You" on his own events' uploads in Your uploads (or his name, as the byline reads); his
  uploads to other people's events keep the event alone; no door on his own face; a nameless host's credit draws no
  disc (the Host badge alone).
- **Look at first, the owner-mode and hub steps for the alias** (a visible tab; signed in as willg97; disposable
  rows, restored after): (1) `/u/willg` Your uploads, a FIRST-page tile opened from the grid, Delete: it leaves and
  stays gone, with no reload, for ten seconds and through a Show more, which adds the next page with nothing doubled
  or skipped; (2) the same from a photograph opened by its address (`/u/willg?photo=<first-page id>`), whose close
  writes in place, the exact drop case once `crumbs-43`'s Back-closes-the-photograph lands; (3) a Delete on a
  Show-more item; (4) Your likes, an unlike on the first page, still gone after an Uploads Delete re-renders the
  page; (5) the viewer on his own event's upload in Your uploads: "You", his face (photo or tint, initial W), the
  Host badge, no link on face or name, and an upload to someone else's event: the event alone; (6) the hub at
  375x667, an event with 0 or 1 photo, reel card, Add photos from the top and from scrolled to the end: the page
  scrolls until the dropzone's foot is in view and the panel clears the band, focus rests on the reel card, and
  reduced motion still lands at once.
