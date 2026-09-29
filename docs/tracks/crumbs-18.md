---
track: crumbs-18
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "37d0b23f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/reporting-and-safety.mdx
  - content/help/hide-remove-and-restore.mdx
  - src/components/marketing/help/step-screens/phone-document.tsx
  - src/components/app/share/event-share-provider.tsx
  - src/components/app/share/event-share-provider.test.tsx
  - src/components/ui/popup-back.ts
  - src/components/app/media-grid.tsx
  - src/components/marketing/help/step-screens/phone-document.test.tsx   # new: the pin for item 2
  - src/components/ui/popup-back.test.tsx                                # new: the pin for item 4
  - src/components/app/media-grid.test.tsx                               # new: the pin for item 5
  - content/help/AUTHORING.md                                            # one line: rule 6 still taught "no per-photo reports"
  - content/help/report-a-problem-as-a-guest.mdx                         # two words: the form now says a confirmed email "can" hide (crumbs-17's NIT-6)
  - docs/systems/host-app.md                                             # the two places bullet (item 3)
  - docs/systems/design-system.md                                        # two facts (items 4 and 5); its lane, unfence, has merged
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
---

# lp/crumbs-18

**Goal.** Five small app items found this session: the host's report help article brought to what shipped, the help's phone screens mounting once, the hub's sheet history on a double tap and a reload, phone popups after a refresh, and a pushed arrival that no longer fades in.

## The brief

Five small app items this session's lanes found, each fixed at its root with a test that fails on today's code:

- **Help tracks shipped reality: the host's report article.** `content/help/reporting-and-safety.mdx` still describes the report before triage's rebuild: the form "covers the event as a whole", "Reports are anonymous", "nothing is taken down automatically the moment one arrives" (a confirmed child-abuse report now hides at once), and "never reaches your Deleted" against `hide-remove-and-restore.mdx`'s "It shows in Deleted" (settle which is true in production and make both say it). A photo has its own Report now, and the guest article (`report-a-problem-as-a-guest.mdx`, rewritten by `crumbs-16`) links to it. Check every claim against what shipped (`git show 1b29be3a^2:docs/tracks/triage-r2-wiring.md` names it); run the help tests and every policy since (the capitalized-phrase guard among them). Marketing and legal words are not yours.
- **The help's phone screens mount twice.** `src/components/marketing/help/step-screens/phone-document.tsx` mounts the phone's children into the iframe's first `about:blank` document at once and again on `load`: the shape the lab's `Frame` had (`src/components/lab/frame.tsx`, fixed by `crumbs-16`: wait for the first `load` unless the document already reads `about:srcdoc`, pinned by `frame.test.tsx`). Drive it in a browser to confirm, then give it the same fix and a test of the same kind.
- **The host's hub: a double tap on Settings (or Share) pushes two history entries** (`openSheet` in `src/components/app/share/event-share-provider.tsx` never checks the sheet is already open), so the first close goes Back to the panel still open; and a reload drops the sheet's marker, so a panel reloaded onto closes by replace and leaves a duplicate entry. The provider's `pushedRef` (crumbs-16) is the start of "this entry is ours" outliving what holds it today.
- **Phone popups after a refresh.** `src/components/ui/popup-back.ts` keeps a marker on the entry that a `router.refresh()` rewrites away (Next's refresh commits the entry with its own state alone), so by reading, a phone's place-shaped popup closed after a refresh skips its `history.back()` and leaves a dead entry. Drive it at 375 (a popup that refreshes while open) before you fix it; `pushedRef` is the fix's shape.
- **A pushed arrival fades in anyway.** `MediaTile` (`src/components/app/media-grid.tsx`) runs its 300 ms load fade even on a photograph that is complete at mount (`loaded` lands a render late), so a pushed arrival whose bytes are already there wipes in over a photograph fading in, against the album's `arrival=push` ("only its glow fades"). A photograph already complete at mount shows at once.

The history API is Next 16's patched one: read `docs/systems/host-app.md`'s bullet on the two places and `src/lib/history-state-policy.test.ts` before touching any history call, and use `src/lib/test-utils/next-history.ts`'s stand-in in tests.

**Verify:** the gate; each item walked on your dev server where localhost reaches it (the signed-in hub cannot run there: name its steps for the next build's red-team in your Handoff).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommended answer is BUILT and his to overrule; none is a one-way door.

- **Does the host's article tell a host about the instant hide?** Built: yes, one sentence ("can hide it from everyone the
  moment it's sent, while we look, and it comes back if the report doesn't hold up"), the words the guest article and
  the form already print, so a host whose photograph vanishes finds why in her own article. The overrule: drop the
  exception from the host's article and let it say only what a host controls.
- **Should `closeSheet` refuse a second call before the first Back lands?** Not built (the brief names the open side, and a
  closing flag that a missing popstate never cleared would strand the panel open): two same-tick clicks on the X call
  `history.back()` twice and leave the hub (measured), a person's double tap needs a slow popstate. Recommended: a
  small follow-up that clears the flag when the sheet leaves the URL, with a timeout as its floor.

## System-doc edits (in place, owned facts only)

- `host-app.md`, the two places' bullet (`b2ba5205`): opening leaves an open sheet alone, and "a reload drops the marker"
  is corrected (a reload keeps it and forgets what the page pushed; the refresh takes it; an effect now remembers a
  marker it finds and gives it back to an entry this page pushed).
- `design-system.md` (`4d9c1a9b`; its lane, unfence, has merged): a tile's photograph already complete at mount shows at
  once (`data-instant`), and a phone's place takes its entry back after a refresh by the address it pushed at.
- Relayed: none.

## Deferred (ROADMAP one-liners, bucket named)

- Shared: three places keep "this history entry is ours" each their own way (the provider's `?room=`, `ui/popup-back.ts`,
  `guest/reel-url.ts`); the reel's `prReelPushed` marker is stripped by a `router.refresh()` too (measured on the demo
  album: the `?reel` entry's state was `{}` after a refresh), so its close would replace in place and leave a dead entry
  (by reading of `close()`); one helper (marker, restamp, address witness) would serve all three (from `crumbs-18`).
- Host hub: `closeSheet` called twice before the first Back's popstate lands calls `history.back()` twice and leaves the
  hub (measured with two same-tick clicks; a person needs a slow popstate); a closing flag cleared when the sheet leaves
  the URL would close it (from `crumbs-18`).
- Host: `share/event-share.test.tsx` pins `openSheet` by text distance (`openSheet` within 400 characters of
  `history.pushState`, which the guard's three lines broke until the address moved into a helper); `event-share-provider.test.tsx`
  holds the behavior, so the scan can go (from `crumbs-18`).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/crumbs-18`:** `1e660287` owns widened · `e1072dde` item 5 (MediaTile) · `ae6cc7f0` item 2
  (PhoneDocument) · `b2ba5205` item 3 (the provider, and host-app.md) · `db020a1c` item 4 (popup-back) · `8b507c79`
  item 1 (the articles, AUTHORING's line) · `1b51b15b` **the sync**: `git merge origin/launch-prep` at `c7a50adc`
  (crumbs-17's report and door fixes touch the report words, unfence, records; a clean merge, `git merge-tree` first)
  · `e20e9c34` both report articles say "can hide" (crumbs-17's NIT-6 made the form say it) · `4d9c1a9b`
  design-system.md's two facts · and this manifest. launch-prep has since moved by records alone (CLAUDE.md, PROGRAM.md,
  the bible, tracks: `git diff --name-only HEAD...origin/launch-prep`), so no second sync.
- **Gates, each on its own exit code, on `e20e9c34`** (docs-only commits after it; logs in
  `../partyreel-wt/_scratch/crumbs-18/gate-*.log`): typecheck 0; lint 0, no warnings; test 0 (618 files, 7,235 tests;
  and 0 again on the tree with this manifest, `gate-test-final.log`, the same counts); `zsh scripts/build-lock.sh pnpm build`
  0 (rebuilt after a temporary old-code build, tree clean); `pnpm lab:smoke --base http://localhost:3131` 0 (136 checks,
  0 failing; its scope was the `event-ready` board that imports `media-grid.tsx`, the Library and the shell). No board,
  so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths and this file, and these named
  exceptions, each in `owns`: `content/help/AUTHORING.md` (rule 6 taught "no per-photo reports", the line that made the
  old article), `content/help/report-a-problem-as-a-guest.mdx` (two words, "can be hidden", the form's own since
  crumbs-17's NIT-6; it also answers the queued NIT-b, the callout's promise with no limit), and
  `docs/systems/design-system.md` (two facts, its lane merged).
- **Items:**
  - Help (`8b507c79`, `e20e9c34`): `reporting-and-safety.mdx` now says a photo or video has its own Report, the form asks
    what it is, nothing tells the host or the poster who reported, and one kind can hide at once; "nothing is taken
    down automatically" and "covers the event as a whole" are gone. **Deleted is settled: an operator's removal never
    reaches the host's Deleted** (`media_host_all` reads `not (status = 'removed' and removed_by_admin)`, the live policy
    read 2026-09-29 through the Supabase MCP; `20260928140000_operator_removal_purge.sql`'s header is Will's word), so
    `hide-remove-and-restore.mdx`'s "It shows in Deleted, and Restore answers ..." is replaced by the guest-delete
    bullet's words. Help tests, `content-policy` and the UiLabel fidelity test green.
  - Phone screens (`ae6cc7f0`): `phone-document.tsx` waits for the frame's first `load` unless the document reads
    `about:srcdoc`; `phone-document.test.tsx` fails on HEAD (mounts into the first document). **Driven in a browser:
    at natural timing the srcdoc commits before the effect, dev or production, so it mounted once (0 sheets in the
    first document); with the srcdoc held back 120ms the OLD code cloned all six sheets into the doomed document and
    mounted twice (dev, and the old code's production build), the fix leaves the first document empty (dev and
    production).** So the race is real and timing-dependent, not seen at natural timing here.
  - Hub sheet (`b2ba5205`): `openSheet` reads the bar and leaves an open sheet alone (a double tap now pushes one
    entry; HEAD pushed two, idx 5 -> 7, and the first close left the panel open); an effect remembers a marker it finds
    and gives an entry this page pushed its marker back after a refresh, so a refresh and a reload in either order
    close by Back (HEAD left a duplicate entry). **The brief's "a reload drops the marker" measured false on this
    Next** (`create-initial-router-state.js` preserves the first commit's state; a reload closed by Back on HEAD),
    so the header comment that said so is corrected. Four new provider tests fail on HEAD.
  - Phone popups (`db020a1c`): `useBackCloses` keeps the entry's address beside its marker and takes an entry back
    when the marker is gone and the address is the same; never at another address, never over another entry's marker
    (`popup-back.test.tsx`: the refresh case fails on HEAD; the phone's Back and the two navigation guards pass on both). **Driven at 375
    in the real router: HEAD opened at entry 4, refreshed, closed by its arrow, stood on entry 5; now it returns to
    4, and a link inside the popup after a refresh keeps its navigation.**
  - Arrival fade (`e1072dde`): `MediaTile` reads `complete` in a callback ref (layout phase) and marks
    `data-instant`, which switches the transition off in that commit; a photograph that lands later still fades
    (`media-grid.test.tsx`: 5 of 6 fail on HEAD). **Driven in a browser with a forced layout in the mount commit (as the
    rows do): HEAD leaves a live opacity transition on a preloaded photograph; now none, opacity 1, transition none.**
- **Assets requested from Will:** none.
- **Board ideas:** none beyond the Deferred lines. `lab:smoke` printed a PREMISE line: the `event-ready` board's five open
  asks (list, guide, create, needs, door) describe `host-app.md`, which this change touched (the two-places bullet, a
  sentence about sheet history that no ask decides); re-read them before his next sitting.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the host article's instant-hide sentence (Questions); the entry's marker is given back by an
  effect after each render (a `replaceState` with no address, so the router hears nothing) rather than a
  `sessionStorage` record, because only the entry itself can say whose it is; `popup-back` treats a marker-less entry
  at the same address as its own; the tile's no-fade state is the attribute `data-instant`; AUTHORING's rule 6 now says
  what a report names; the guest callout's "can be hidden".
- **Look at first:** the provider's effect (`event-share-provider.tsx`, after `pushedRef`) and `stillOurs` in
  `popup-back.ts`. **For build 26's live red-team (the signed-in hub cannot run on localhost; the Navigation API,
  `navigation.currentEntry.index` and `navigation.entries().length`, reads the stack in Chrome):** (1) on the
  hub at 375, double-tap the Settings card and the Share door: one new entry each, and the X returns to the hub in one
  press; (2) open Settings, flip the reel switch (a refresh), close by the X: one Back, `history.state` keeps
  `prEventSheet` after the refresh; (3) open Settings, reload, flip a switch, close; and open, flip a switch, reload,
  close: one Back each way, no duplicate hub entry; (4) `/dashboard/<id>?room=settings` in a fresh tab: no marker
  gained, the X replaces in place; (5) at 375, the dashboard's claims review (a claimable guest row) and the storage
  list: open, act (each refreshes the page behind itself), close by the arrow: the stack returns to where it opened,
  and Open album after a refresh still navigates; (6) a guest album in the rows layout with the host's album open
  on another device: upload one photograph and the pushed arrival wipes in with only its glow fading (`data-instant` on
  its `<img>`, no running opacity transition); (7) `/help/report-a-problem-as-a-guest` at 375: each phone screen is
  drawn once; the two host articles read as the diff. Measurements: `../partyreel-wt/_scratch/crumbs-18/log.txt`.
