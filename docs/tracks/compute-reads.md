---
track: compute-reads
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ddf8dd7e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/album/host/[eventId]/sync/
  - src/lib/events/album-wire-carry
  - src/components/app/event-feed/host-album
  - src/components/guest/reel/live-reel
  - src/lib/guest/reel-tile
  - src/lib/db/queries/events
  - src/app/(app)/welcome/
  - src/components/guest/guest-header
  - scripts/compute-model/budget.json
  - docs/systems/host-app.md
  - docs/systems/reel.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/api/album/guest/sync/route.ts
  - src/components/marketing/chrome/chrome-link.tsx
  - scripts/compute-model/
---

# lp/compute-reads

**Goal.** Fewer calls and cheaper reads, five ROADMAP cost crumbs: the hub's delta carries its new items' links as the guest's does, the cover keeps the stills it is playing, the profile's cover previews presign stable, /welcome counts instead of building every card, and the guest header's links prefetch only on intent; each measured before and after.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3135 is yours; 3000 is Will's desk and red-team 54's, never touched; 3130 is the Orchestrator's gate.

**Why this lane:** every call multiplies by every lit phone at every party; the compute model (`../partyreel-wt/_scratch/compute-model/report.md`, `pnpm compute:model`) prices them. Behaviour stays exactly as it is: same pictures, same moments, fewer calls.

**The fixes**, each pinned by a test that fails on the old code:
1. **The hub's delta** (`/api/album/host/[eventId]/sync`) returns new items without their links, so a batch on the hub costs a links call after it; carry the new items' links as the guest's delta does (`album-wire-carry.ts`), so a batch is one call on the hub too (`event-feed/host-album.tsx`).
2. **The cover re-deals its six stills on every arrival** (`useCoverStills` in `live-reel.tsx`, `tileStills`' `planTake` over the whole album in `lib/guest/reel-tile.ts`), and a new still with no link costs a links call. A deal that keeps the stills still playing makes every batch one call.
3. **The profile's cover previews** (`readCoverUrls`, `db/queries/events.ts`) presign without `stable`, so every visit re-downloads each card's cover: a stable presign, as `getEventCardStills` uses, lets the browser serve them from cache.
4. **`/welcome`** (`(app)/welcome/page.tsx`) builds every Guest card, covers presigned, only to count them, and calls `getUser()` beside the cached `getRequestAuth`: a count read and the cached viewer.
5. **The guest header's logo** (`guest-header.tsx`) and its body links to `/features/album`, `/features` and `/features/curation` prefetch sheets their page never draws: give them `prefetchOnIntent` (`chrome-link.tsx`).

**Measure:** the calls a guest's ten-photo burst and a host's hub batch cost, before and after, from the network (your own headless Chrome on your port) or `pnpm compute:model --port 3135`; lower `scripts/compute-model/budget.json`'s lines your levers move, never raise one. Wiring rigor: the whole gate.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

- **Which of the hub's upserts carry links?** Recommended, built: the APPROVED ones, newest first, at most
  `ALBUM_DELTA_LINKS_MAX` (48, the guest's own cap); a held upload and a hidden one carry none (the hub draws nothing for
  the first, and the host's own Hide is an upsert whose tile already holds its link). The guest's `carriedIds` as it
  stands would have minted a link for every moderated arrival and every Hide that nobody draws.
- **Does the cover keep its six through a visit?** Recommended, built: yes. The first deal is the take's, after it a still
  stays until the album loses it (the take's next takes its place), her own newest upload leads, and a reload deals
  afresh (`keepStills`, `reel.md`). The cost: late in a party the cover can show stills the take's first pass no longer
  opens on (the reel's own view is untouched). The alternative, a re-deal per arrival, is the call behind every delta.
- **Where does the Guest cards' count live?** Recommended, built: `countMyGuestEventCards` in `db/queries/social.ts`
  beside `getMyGuestEventCards`, the two sharing one private candidates read (`myGuestEventLatest`) so the cards and their
  count cannot disagree. `social.ts` is outside this lane's `owns` (no live lane claims it): the alternative was a
  second copy of `myLiveUploads` in `events.ts`, a second home for "which events a person has put something into".
- **The guest header's links.** Recommended, built: the demo's two home links (wordmark, Start for free) fetch the home
  on INTENT, a real album's stay at `prefetch={false}` (never, even on a hover: stricter than the crumb's
  `prefetchOnIntent`, so the change adds no call for a guest who touches the logo; compute-levers had already stopped a
  real album's prefetch). The crumb's "body links to `/features/album`, `/features` and `/features/curation`" are
  drawn nowhere in the guest page, its header or the demo (the built pages hold none, Handoff), so nothing was changed
  for them. ★ The demo still fetches `/` on sight: three "Start your own" links in its body (`event-experience.tsx` twice,
  `door/welcome.tsx`, and `guest-upload.tsx`'s turn card) are plain links, outside this lane.
- **Covers presign `stable`.** Recommended, built: `readCoverUrls` (the profile's hosted and attended cards, the Guest
  cards, the Deleted tab) takes the album links' stable presign, so a leaked cover URL lives up to a half hour longer
  (90 minutes, not 60), the trade-off `presign-bucket.ts` records for every album link, for a cover the browser serves
  from its cache inside the half hour.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the hub is live (its delta carries the approved arrivals' links and counts, the transport
  under the seeding one answers the ask) and the first-time welcome (it counts the Guest cards and reads the cached
  viewer).
- `docs/systems/reel.md`: the take (the cover's six are dealt once and kept while they play).

## Deferred (ROADMAP one-liners, bucket named)

- Host: the hub's delta carries a link for an approval or a Show of an item the hub already holds (the server cannot tell
  an arrival from a status flip, and mints a link the hub will not use); send the newest `t` the hub's manifest holds
  (a header on the sync, set by `HostAlbumProvider`'s fetch) so only an upsert newer than it carries.
- Guests: the demo fetches the marketing home on sight (six requests a load, its three sheets preloaded and unused)
  from its three "Start your own" links (`event-experience.tsx` twice, `door/welcome.tsx`, `guest-upload.tsx`'s turn
  card), since the header's two are intent-only now; draw them through `ChromeLink` with `prefetchOnIntent` (a CDN hit
  each, so bytes and console warnings, not a function call).
- Marketing: the prefetch crumb's "body links to `/features/album`, `/features` and `/features/curation`" are drawn in
  no guest page; find the page that draws them (the marketing nav's are `marketing-nav.ts`'s) and give them
  `prefetchOnIntent` there, or delete the crumb.
- Guests and host: on an event whose `attr_version` is above 0, the first poll after a page opens re-asks every link the
  seed answered its first asks with (a `/api/album/guest/media` call of up to a window's ids): those asks go out at the
  link store's attribution 0 (children's effects run before the provider's first sync adopts the seed's `attr`) and
  read as stale once it does; set `store.links.setAttr(seed.sync.attr)` where the store is built (`gallery-live.tsx`'s
  initializer, and likely `host-album.tsx`'s `createHubAlbum`, unproven there). Reproduced in `live-reel.test.tsx`'s
  harness (a seed carrying links and attr 1: no links call at mount, one after the first idle poll); the compute
  model's test event has `attr_version` 0, so no run has ever shown it: seed an event whose attribution moved.

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/compute-reads`:** the work `b3554aec6` (the five items, the budget line, the two system
  docs) and `981f795d3` (the kept cover asks for its six again as the album moves: found in review, and pinned by a test whose cover
  reads empty without it), then `6f2bf074e` (the two system docs' new lines rewrapped, docs only); the manifest's own
  commit follows. launch-prep moved since the cut (records and dev-only boards): `git diff
  --name-only 68608d665 origin/launch-prep` holds none of this lane's paths or reads and a `git merge --no-commit
  origin/launch-prep` dry run was clean, so there is no sync commit.
- **Gates**, each on its own exit code, on `981f795d3` (plus this manifest in the working tree): typecheck 0 · lint 0 · test 0 (937 files, 11,639 tests) · build 0 (Compiled successfully, 266 static pages) · lab:smoke 0 (166 checks, 0 failing, against my dev server on 3135; scope: the event-header, host-dashboard, identity and the-wait boards, the Library, the shell). The docs-only commit `6f2bf074e` after it re-ran every test that reads a doc (14 files, 435 tests, green). Logs in `_scratch/compute-reads/` (`final-typecheck.log`, `final-lint.log`, `final-test.log`, `final-build.log`, `gate-smoke.log`), pruned with the lane.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path is an owned prefix or this file except
  `src/lib/db/queries/social.ts` and `social.test.ts`: item 4's count read sits beside `getMyGuestEventCards` and shares
  its candidates read, so the cards and their count cannot disagree (the third Question; no live lane claims the file).
  Everything else is `docs/systems/host-app.md` and `reel.md` (listed above), `scripts/compute-model/budget.json`, and
  the owned `src/` prefixes, the new tests under them (`sync/batch.test.ts`, `welcome/page.test.tsx`) included.
- **The items**, each pinned by a test that fails on the old code (verified by reverting the source and re-running):
  1. Hub delta carries its approved arrivals' links and like counts: `sync/route.ts` (`hostCarriedIds`,
     `readHostLinksBody`), `album-wire-carry.ts` (the layer carries and hands on the counts), `host-album.tsx` (`createHubAlbum`
     composes it under the seeding transport). A batch on the hub is **2 calls to 1**, counted through the real routes,
     store and transport in `sync/batch.test.ts` (old route: `{sync: 1, media: 1}`; now `{sync: 1, media: 0}`; Review's
     queue still one ask; a failed carry falls back to the two; 3 of its 7 fail on the old route and 2 without the client
     half). `route.test.ts` has 5 pins that fail on the old route, `album-wire-carry.test.ts` 5 that fail without the counts.
     Not measurable on a network from this port: sign-in returns only to localhost:3000.
  2. The cover keeps its six: `reel-tile.ts` (`keepStills`), `live-reel.tsx` (`useCoverStills`); 4 pins in
     `live-reel.test.tsx` fail on the old controller (an arrival, a batch after a batch, a lost still, her own lead) and
     the re-mint pin fails without the cover's ask on every album move. Compute model, `guest-join-upload` (production build on port 3135,
     `--scenarios guest-join-upload`; `_scratch/compute-reads/before`, `after`, `after-final`): **17 calls, 1,014 ms
     before; 14 calls twice after** (772 ms, then 954 ms on the final tree under a machine load above 20); the three links
     calls behind the burst are gone in both (listener 1 to 0, uploader 2 to 0; the sync count moves by the poll's phase). A real album in headless
     Chrome (`_scratch/compute-reads/cover-check.json`, three photos): the listener's six stills identical before and
     after, 0 links calls, and the uploader's cover leads with her own upload and keeps the five.
  3. Covers presign `stable`: `events.ts` (`readCoverUrls`); `events.test.ts` pins every presign of both readers.
  4. /welcome counts and reads the cached viewer: `social.ts` (`countMyGuestEventCards`), `welcome/page.tsx`;
     `page.test.tsx` has 2 pins that fail on the old page; the count equals the list's length for every real account
     with uploads in the live database (3 read, `count-check.mjs`: head counts through the real PostgREST).
  5. The guest header's two home links: the demo's on intent (`guest-header.tsx`, `guest-header.test.tsx` reshaped from a
     source-text pin to a rendered one, scar kept: a real album never prefetches the home). Production build, headless
     Chrome (`_scratch/compute-reads/demo-prefetch.json`): a real album fetches the home neither on sight nor with a
     pointer on the wordmark (0 and 0, as compute-levers left it). The demo's header no longer fetches it on sight, but
     the demo still does (6 requests): three "Start your own" body links do, outside this lane (Deferred). The crumb's
     `/features` body links are in no guest page (read at load, both pages).
  - `scripts/compute-model/budget.json`: `guest-join-upload` 18 calls and 2,620 ms lowered to 16 and 1,550 (the harness's
    own rule on the 14 and 772 measured: calls +10% or +2, CPU x2); no line raised.
  - ROADMAP lines this lane builds, for the merge to delete: `Host: the hub's delta`, `Guests: the cover re-deals`, `Routes: /welcome`,
    `Profile: readCoverUrls`; and `Guests and marketing: the guest header's logo` is replaced by this manifest's two
    Deferred lines for it.
- **Assets requested from Will:** none.
- **Board ideas:** (1) the compute model cannot hold a signed-in surface (the hub, the dashboard, /welcome) because sign-in
  returns only to localhost:3000 and no password or code is typed: a dev-only way to give `--host-cookie-env` a session
  would let the standing budget see the host's side; (2) the attribution finding in Deferred is the next call lever on
  every page load of an event whose attribution moved (it needs a test event with `attr_version` above 0 to measure).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule** (the Questions, each built as recommended): the hub carries approved arrivals only; the cover
  keeps its six through a visit; the Guest cards' count lives in `social.ts`; the demo's header links go on intent and a
  real album's stay at never; covers presign stable (a leaked cover URL lives a half hour longer).
- **Look at first:** `src/app/api/album/host/[eventId]/sync/batch.test.ts` (the hub's batch counted, 2 to 1) and the
  `live-reel.test.tsx` describe "the cover keeps the photographs it is dealing"; then `reel.md`'s landmine (the kept six are
  asked for again as the album moves, or a busy party's cover empties when its presigns die). On the desk build, with a
  signed-in host and a phone adding photos, the hub's Network panel should show one `/sync` answer and no `/media` after it.
