---
track: cdn-version
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5ed23311"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/album/guest/sync/
  # The client's ask on its cadence (claimed at boot): the store's poll, the transport, the cadence, the provider.
  - src/lib/album/edge-version.ts
  - src/lib/album/edge-version.test.ts
  - src/lib/album/store.ts
  - src/lib/album/store.test.ts
  - src/lib/album/transport.ts
  - src/lib/album/transport.test.ts
  - src/lib/shared/use-live-poll.ts
  - src/lib/shared/use-live-poll.test.tsx
  - src/components/guest/gallery-live.tsx
  - src/components/guest/gallery-live.test.tsx
  # The event read with no identity (anon.ts), beside the request read it mirrors.
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/guest-events.test.ts
  # One line: the new route stays outside the proxy (a proxy run is an invocation before the CDN).
  - src/proxy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/architecture.md
  - docs/systems/database-security.md
  - docs/PRD.md
---

# lp/cdn-version

**Goal.** Will's yes to X5: an open album's "has anything changed?" answer cached at the CDN for a few seconds, so a room of lit phones costs one call, never a private answer; and AB5's cadence livelier where the cache makes that free.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**X5, Will's yes (2026-10-07, the Calls place):** cache an open album's "has anything changed?" answer at the CDN for a few seconds: only an open album at full access, never a password album, a gated door or a blocked viewer, and the answer a version number alone, never photos or links. Today every lit phone asks the function itself (`src/app/api/album/guest/sync/route.ts`, the client's ask on its cadence: find it and claim it in your manifest at boot), so 100 phones cost 100 calls, on a Vercel Hobby plan near its CPU line.

**Doc-check before you build (Context7, Vercel's and Next 16's own docs):** how Vercel's CDN caches a route handler's response (`Cache-Control`'s `s-maxage` and `stale-while-revalidate`, `CDN-Cache-Control`, `Vercel-CDN-Cache-Control`), what keys the cache (the full URL, which carries the album's capability), and what a cached response must never carry (a `Set-Cookie`, anything per viewer). A capability URL cached for one viewer is served to every holder of it: prove antagonistically that no response which depends on the viewer (her door, a block, a password, a host's preview) is ever cached, and that an album turning private stops serving the cached open answer within its few seconds.

**AB5, kept with an invitation (Will: "if there's an even better version of this that helps us while providing a clean live experience, I'd love to hear it"):** where the live line is blocked an album asks every 12 s, slowing to a minute when quiet, stopping past two untouched hours until a touch; a party screen rests at 5 minutes. With the answer cached, a tighter cadence may cost nothing at the function: build it where the cache absorbs it, and name the numbers in your Handoff (calls a day at a 100-guest party, before and after, and what reaches the function).

**Record:** guest-flow.md's AB5 lines refined in place, with the cache's rule and its proof; the cost named against `usher/kit/cost-model/`'s per-call lines where they meet it.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), crumbs-91 (the album's order, the guest page `e/[token]/page.tsx`, `event-experience.tsx`, `as-guest*`, `settings-state*`, `lib/db/mutations/events.ts`), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **How long a cached "nothing changed" may stand in for the album's own answer** (what a version cannot say: a
  block on her, her ticket's heal). Built: **5 minutes** (`ALBUM_EDGE_TRUST_MS`, the resting net's step). A blocked
  guest's lit page on an album that does not change learns the block within it (today: within the attended net's
  minute); any change asks the album, which shuts her at once. 100 lit phones, quiet: about 1,920 calls an hour at 5
  minutes, 1,120 at 15, 720 with none. Will's to overrule (a Call: moderation).
- **The window: 5 s** (`ALBUM_EDGE_WINDOW_MS`). Built: at most 12 fills a minute an album a region; 3 s would be 20,
  10 s six, and the window is the staleness a quiet check can carry.
- **The capability stays out of the URL.** Built: the URL names the album by a digest key (`k`, handed over by the
  sync's `x-album-edge`), the token rides `x-album-token`, and the route checks the two agree before it fills. The
  token in the query is simpler, but every poll would write it into the CDN's and Vercel's request logs.
- **AB5's livelier version.** Built: a quiet blocked fallback asks every **20 s** while someone is looking (a touch in
  ten minutes, or the party screen) **and** the CDN answered its last ask from its cache (`x-vercel-cache: HIT`, a room
  asking too); otherwise today's minute; moving, today's 12 s (each such ask finds a change, the function's however it
  is asked); the net under a live doorbell unchanged. Not always: a lone phone's 20 s asks each fill a window (three
  times today's calls; simulated). The price is CDN requests, not calls: a quiet blocked room of 100 lit phones makes
  about 16,500 an hour against 6,000 ($2 a million; 40 s would match today's dollars).

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`, "Live gallery: the hybrid doorbell": the conditional poll's fallback line gains the
  20 s step and its condition (`refreshAged` rides each quiet answer too), and one new bullet beside it: an open
  album's "has anything changed?" at the CDN, its rule (who may be cached, the key, the window, nothing per viewer, the
  trust window), its proof (the walk) and its cost against `usher/kit/cost-model/`'s `sync304` and `cdnReq`.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Safety · album: a block moves an open album's CDN answer (a blocks fingerprint beside the validator, or the block
  rings the doorbell as a moment), so a blocked guest's lit page shuts at the next window and `ALBUM_EDGE_TRUST_MS`
  can lengthen (cdn-version; needs a migration or a ring from the block's RPC).
- Cost · kit: `usher/kit/cost-model/model.mjs`'s `liveEvent` counts every net poll as a `sync304`; since X5 a lit
  room's polls are CDN requests plus at most 12 fills a minute an album plus one real ask a phone each 5 minutes, and
  `vercelCall` still charges the sync a proxy invocation it no longer pays (`NO_PROXY`).

## Handoff (replaces the chat report)

- **Commits, pushed:** the work `890c33f3d`; the sync `2c4edb98b` (a merge of `origin/launch-prep` at `e239105ea`:
  crumbs-91, no-signal-wiring, crumbs-92 and brand-marks-r2 had landed, `guest-flow.md` among my reads; clean); the
  claim at boot `92344f1c7`; this manifest is the head.
- **Gates on the synced tree (`2c4edb98b`), each its own exit code** (logs `_scratch/cdn-version/gate2-*.log`):
  typecheck 0, lint 0, test 0 (1,126 files, 14,454 tests), build 0, `lab:smoke --base http://localhost:3131` 0 (189
  checks, 0 failing). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths (claimed at boot: the client's
  ask, the anon event read, `proxy.test.ts`'s one line) + this file + `docs/systems/guest-flow.md` (the record).
- **X5, built:** `GET /api/album/guest/sync/version?k=&w=`, the token in `x-album-token`
  (`src/app/api/album/guest/sync/version/route.ts`): an album everyone with the link sees whole
  (`albumIsOpenToAnyone`, `sync/edge.server.ts`) answers its full-access validator alone, the sync's ETag by one recipe
  (`fullAlbumEtag`), `Vercel-CDN-Cache-Control: max-age=5`; everything else `ask`/`clock` or a 400, `private, no-store`.
  It reads the event with no identity (`getEventByQrTokenForAnyone`), no cookie or session, writes no `Set-Cookie`.
- **The sync names the key** (`x-album-edge`, a digest of the token) on every full answer of such an album, 304s
  included; never on a teaser, lock, refusal, password, gated door, email or upload asked first (`route.test.ts`).
- **The client:** the store's `poll()` (`lib/album/store.ts`) asks the CDN first where named and vouched for within 5
  minutes; the held validator is the whole answer, anything else asks the album; rings, her upload, Try again and the
  return's catch-up stay exact (`use-live-poll.ts`'s `onPoll({ exact })`). The browser sends no cookie
  (`credentials: "omit"`) and no `Pragma` (`cache: "default"`: a `no-store` fetch's `Pragma: no-cache` sends the CDN
  back to the function). Each window is its own URL, since Vercel serves an expired entry stale.
- **AB5, built:** a quiet blocked fallback asks every 20 s while someone looks and the CDN answered its last ask from
  its cache (`x-vercel-cache: HIT`); otherwise as today. A lone phone's 20 s asks would each fill a window (simulated:
  three times today's calls), hence the condition.
- **Proof, local** (`_scratch/cdn-version/walk-{dev,prod,synced}.log`, the real database, disposable events): the
  version equals the POST's ETag and the POST 304s against it; password, email-first and unknown answer `ask`
  no-store; another album's token under a key 400; a far window `clock`; the production build keeps the handler's
  headers, no `Set-Cookie`. Headless Chrome at 375 and 1440: the first poll a POST naming the key, the net's next a
  version GET with the token header and no cookie (a probe cookie rode the POST, never the GET) and no POST after;
  the album turned private, the next ask answered `ask` and the sync locked at once; a tab's return asked the POST.
- **Numbers, a 100-guest party of 5 hours** (`_scratch/cdn-version/scripts/{cost,sim}.mjs`; model per-call lines):
  doorbell live, 10 lit phones: 3,000 calls before, ~2,350 after, 3,000 CDN requests either way; 100 lit: 30,000
  before, ~9,600 after (3,600 window fills + 6,000 real asks of the 5-minute trust). Blocked and quiet, 100 lit:
  30,000 before, ~9,600 after, CDN requests ~82,500 against 30,000 (the 20 s step); 10 lit: 3,000 before, ~2,850
  after. Blocked and moving: unchanged (every 12 s ask is the album's). One phone alone: 60 an hour, as today.
- **Test data, listed for deletion** (willg97's, no media; tokens only in my scratch): events
  `3f9d0520-24c1-4e3e-8758-008e48e088d4`, `32d25011-b5e9-493a-b9ae-68d7aff6cbc0`,
  `5b3f209d-c286-400e-8c53-8f403ba467b6`, named "cdn-version (disposable) …".
- Assets requested from Will: none.
- Board ideas: a block shuts a lit page at once (the block rings the album's doorbell as a moment, or moves its CDN
  answer), rather than at the album's next change or within the trust window.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the CDN rule is the response's own header).
- Calls for Will: how soon a block reaches a lit page whose album does not change: within 5 minutes, built (today the
  attended net's minute; 15 minutes or never would save more calls: the first Question).
- **Look at first:** the live check after the merge (two asks inside one window on the alias: `x-vercel-cache` MISS
  then HIT; Next adds `Vary: rsc, next-router-*` to every response, absent on these fetches, so it should key once);
  ROADMAP's X5 line (22) is done; the kit's cost model still counts a net poll as a `sync304` (Deferred).
