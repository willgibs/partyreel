---
track: compute-levers
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e1818a3fc"           # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/proxy.ts
  - src/lib/supabase/middleware.ts
  - src/lib/shared/use-live-poll
  - src/app/manifest.ts
  - docs/systems/architecture.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/compute-model/model.mjs
  - scripts/compute-model/budget.json
---

# lp/compute-levers

**Goal.** Build the compute model's first two levers: the proxy runs only where a session matters, and an album's polls rest. Prove both with `pnpm compute:model` and a rebased budget.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why:** Will's foundational fix for Vercel's compute (2026-10-04). The compute model (merged; report `../partyreel-wt/_scratch/compute-model/report.md`, read "The levers" whole) found that a 100-guest wedding is 56,000 to 85,000 function calls. The proxy is half of every call count, and a lit album's safety-net poll is 13% of them.

**★ Local only:** Nothing of yours requests the alias, partyreel.com or any *.vercel.app: the team is at Hobby's Active CPU limit. `pnpm compute:model --port <yours>` measures everything locally.

**Lever 1: the proxy only where a session matters.**
- **The matcher** keeps the pages that render a session: `/dashboard`, `/account`, `/me`, `/welcome`, `/login`, `/auth`, `/e`, `/u`, `/report`, `/admin`, and `/design` for its key gate.
- **The admin host:** add a `has: host` entry so the admin host still sends every path through the surface rule (`src/lib/surface`, `decideBySurface`).
- **API routes leave the matcher.** Each refreshes its own session where it reads one (`setAll` works in a route handler). Prove every API route that reads a session still does, and that an expired access token is refreshed on the next page load.
- **Prefetches and static paths leave it.** That includes `/manifest.webmanifest`, one proxy run on every desktop page load.
- **The guest page's footer links take `prefetch={false}`:** 6 to 14 prefetches a join, each a proxy run. If that file is outside your list, it is an exception named in your Handoff.
- **Security first** (CLAUDE.md, RLS is the boundary): the proxy was never the boundary, but every Server Function and route handler must still re-verify with `getUser()`. Check that no route relied on the proxy for a cookie it then trusted.
- **The admin surface:** a path outside its surface must still 404 on the admin host, and the design gate must still refuse a missing key.
- Each of these is pinned by tests.

**Lever 2: polls that rest** (`use-live-poll.ts`; Will's call X4 in the calls lab, built as recommended and his to overrule):
- The 60 s safety net slows to every 5 minutes after 10 lit minutes, and stops after 2 hours without a touch. A press, a scroll, a key or a return to the tab wakes it.
- The doorbell still rings at once.
- The 12 s fallback (doorbell down) slows to 60 s while nothing changes, and returns to 12 s on a change.
- The reel's screen mode (`?reel=screen`, a TV at a party) keeps its live answers: a screen nobody touches is its whole point. Find how it reads changes and say what it does.

**Prove it:**
- `pnpm compute:model --port <yours>` before and after. Report the scenarios' calls and CPU side by side against the model's what-ifs (lever 1 about -52% of a heavy wedding's calls, lever 2 about -31%).
- Then rebase `budget.json` with `--write-budget` from the after-run. That file is the compute model's, so it is an exception named in your Handoff; its commit is your last.
- `docs/systems/architecture.md`'s "Compute budget" section takes the new headline.

Build none of the other levers (the CDN version is Will's privacy call X5; batched uploads are the next lane).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Do a session page's prefetches keep the proxy?** Recommended (built): yes. A prefetch renders the page's layout,
  whose `getUser()` would refresh inside a render, which cannot write the cookie: the rotated refresh token is spent
  and lost and the next request presents it again (`server.test.ts`'s second case). It keeps `/login`'s prefetch from
  the marketing bar (2 calls a visitor) and the host app's own links; every other prefetch left with its page. Or: no
  prefetch runs the proxy (the model's what-if), with rare sign-outs.
- **How does the admin deployment keep its allow-list?** Recommended (built, the brief's `has: host`): every path runs
  the proxy where the host is `admin.<domain>` or a `partyreel-admin` vercel.app host; a miss is reachability, never
  authorization (admin-observability.md says a new admin domain joins the pattern). Or: the full proxy on every host
  but the app's named ones, safe for a new admin domain and double-priced on a new app domain.
- **"The 12 s fallback slows to 60 s while nothing changes": after how long?** Recommended (built): after a minute
  with nothing new (five fast polls), back to 12 s at once on any change on screen (an album store's snapshot, the
  stage's wall). Or: after the first quiet poll, cheaper, and a minute stale between an event's bursts.
- **What does a touch do to a resting net?** Recommended (built): back to the minute, asking at once only when the
  last ask is over a minute old (one call a wake). Or: the cadence alone, the next ask within a minute.
- **The reel's screen posture.** Found: it reads the album's own store (`gallery-live.tsx`: the doorbell's rings in
  calm batches and `useLivePoll`), so it rings at once like any lit album. Recommended (built): its net rests at five
  minutes but never stops (`unattended`); on wifi refusing websockets its fallback keeps the quiet-minute rule. Or:
  the screen keeps the full minute (12 calls an hour more a screen).
- **A stopped net lets the links on screen age.** `refreshAged` rides each sync, so past two untouched hours a page's
  links live on its rings; once they die (about 90 minutes on), the next ring's or touch's sync re-mints them and a
  tile may redraw once. Recommended: accept (a phone sleeps long before; a party's screen is `?reel=screen`). Or: an
  ask an hour after two hours instead of the stop (one call an hour a page left lit), every link kept alive.
- **The way home on the demo.** Recommended (built): the demo's header keeps its home prefetch (a prospective host); a
  real album's header and the door's legal links never prefetch.

## System-doc edits (in place, owned facts only)

- `docs/systems/architecture.md` "Compute budget": what counts as a call now (and that an API route refreshes its own
  session), and the new headline.
- `docs/systems/guest-flow.md` "The conditional poll": how it rests; a stopped net's links age until the next sync.
- `docs/systems/testing-verification.md` "The presign-roll soak": an untouched foreground tab rests too.
- `docs/systems/admin-observability.md` "The perimeter": the surface rule reaches every path only on the admin hosts.

## Deferred (ROADMAP one-liners, bucket named)

- Now: `pnpm compute:model`'s first scenario after its warmup (guest-join-upload) timed out at the door's name step in
  both of compute-levers' full runs (base and lane) and passed run alone, and an errored scenario leaves its phones
  open, polling under the next scenarios' labels: harden the join's wait and close a scenario's devices on error
  (`scripts/compute-model/run.mjs`).

## Handoff (replaces the chat report)

Scratch: `../partyreel-wt/_scratch/compute-levers/` (every log and run named below).

- **Commits:** `51ce07c3a` (levers 1 and 2 and their pins), `81ba6917e` (system docs), `81fcf6de8` (budget.json, the
  last work commit); no sync: launch-prep had not moved from `e1818a3fc`.
- **Gates:** at `81fcf6de8` typecheck 0, lint 0, test 0 (908 files, 11,123 tests; `gate-*.log`, `gate-exits.txt`);
  build 0 at `51ce07c3a`, the after-run's own `zsh scripts/build-lock.sh pnpm build` (`after.log`;
  `NEXT_PUBLIC_SITE_URL=http://localhost:3131`), no code moved since (`git diff 51ce07c3a HEAD -- src` empty); `pnpm
  lab:smoke --production` 0 on that build (`lab-smoke.log`: SCOPE all, 193 checks, the closed door 404s); no board, so
  no lab:demo.
- **Lane check:** owned: `src/proxy.ts`, `src/lib/supabase/middleware.ts`,
  `src/lib/shared/use-live-poll{.ts,.test.tsx}`, `docs/systems/architecture.md`. Exceptions, no other lane's:
  `src/proxy.test.ts` and the new `src/lib/supabase/server.test.ts` (the pins of the owned files and of the refresh
  the lever rests on); `src/lib/supabase/server.ts` (comment only: it said the proxy refreshes on every request);
  `gallery-live.tsx`, `host-album.tsx`, `use-stage-live.ts` (the hook's three callers: each passes its change key, the
  guest album its screen rule); `shared/legal-consent-line{,.test}.tsx`, `guest/guest-header{,.test}.tsx` (the brief's
  links: `prefetch={false}`, pinned); `scripts/compute-model/budget.json` (the brief's rebase); three system docs
  above.
- **Lever 1:** `proxy.test.ts` reads `config` the build's way (swc and Next's `extractExportedConstValue`, held equal
  to the module's) and asks Next's own matcher (`unstable_doesMiddlewareMatch`: the docs' `unstable_doesProxyMatch` is
  not shipped in 16.2): session pages on every host with their RSC and prefetches, nothing else on the app's hosts,
  everything but static paths on the admin hosts. Mutations caught: the old matcher fails 2 pins, a host value read
  from a variable fails the build reading ("Unknown identifier"). The built manifest carries both matchers, `has:
  host` included (`.next/server/functions-config-manifest.json`).
- **The session, without the proxy:** `server.test.ts` (the real `@supabase/ssr` and `supabase-js`, only fetch stood
  in, over Next's own cookie stores): in a route handler an expired token is refreshed and the new session reaches the
  response's Set-Cookie through `appendMutableCookies`; in a Server Component it is spent and lost; a live token
  writes nothing (a no-write mutation of `server.ts` fails it). Every API route that reads a session does it through
  `lib/supabase/server.ts` (the one cookie-bound client besides the proxy's), and none reads a proxy-written header
  (`x-pr-path`, `x-design-key`: only the matched `/dashboard`, `/account`, `/me`, `/welcome`, `/admin`, `/design` read
  them).
- **Local red-team** (`pnpm start` on the after build; `next dev` with `NEXT_PUBLIC_SURFACE=admin`): a forged
  `x-pr-path` on `/dashboard`, `/account/renew`, the print sheet still lands `/login?next=<own path>`; `/design`
  keyless, wrong-keyed and a keyless RSC prefetch 404, keyed 200; `/` is 200 on the app host and 307 `/admin` on Host
  `admin.partyreel.com` (the host entry ran the proxy); `/api/me/menu` signed out is its own 401. Admin surface, Host
  `admin.partyreel.com`: `/pricing`, POST `/api/guests/door`, `/manifest.webmanifest`, `/e/x`, `/design` 404,
  `/robots.txt` 200, `/` to `/admin`, `/admin` to sign-in; on an unlisted host `/pricing` answers 200 (the pattern's
  reach, documented) and `/e/x` still 404s.
- **Lever 2:** `use-live-poll.ts` (20 pins; dropping the stop, the change wake, the touch wake or the drop's fast
  minute each fails at least one); the reel's screen passes `unattended` (`gallery-live.tsx`).
- **The compute model, before (`e1818a3fc`) and after (`51ce07c3a`)** (`compare.log`; each side its full run plus
  guest-join-upload alone, the errored join's open phones dropped by `merge.mjs`): calls join 130 to 61, lit hour 130
  to 23, down hour 610 to 67, download 2 to 1, visitor 32 to 4, crawler 50 to 0, lab demo 83 to 56 (its `/design`
  pages keep the gate; the manifest's 27 runs went). Polls an hour: lit 59 to 19 (the model's first-hour arithmetic:
  20), down 299 to 63 (a quiet hour: 64). No prefetch left in a join.
- **Against the model's what-ifs** (heavy wedding, the before mix's calibration x3.81): 80,599 calls, lever 1 alone
  -52%, lever 2 alone -32%, both -68% (25,929); built -66% (27,479; a 4-hour wedding 51,732 to 23,954, a month of 100
  events 5.41M to 2.43M). CPU 1.43 to 1.21 CPU-h built where the what-if says 1.06: a rested poll reopens its Supabase
  connection in a one-phone run (19 to 23 ms a poll within 4 s of the last, 26 past it, measured), which a warm
  instance at an event would not; the calls are exact.
- **budget.json** (`81fcf6de8`): every calls line falls; the join's CPU line kept at 5,430 ms rather than raised to
  the writer's 5,780 (noise: the base measured 2,982 ms this session), said in its commit.
- Assets requested from Will: none.
- Board ideas: the marketing bar's "Log in" prefetches `/login`, a session page whose prefetch keeps its proxy run (2
  calls a visitor), so `prefetch={false}` there ends a visitor's last one; the share card under `/e/<token>/card`
  reads no session yet runs the proxy (one call an unfurl), worth a narrower `/e` entry only if unfurls grow.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the seven Questions above, each built as recommended.
- Look at first: (1) on the alias after the merge, the live auth red-team: signed in through the chooser, set the
  `sb-…-auth-token` cookie's `expires_at` an hour back (base64url JSON after `base64-`), then load `/dashboard`, and
  on an album call a session-reading route (`/api/me/menu`): each response sets a fresh cookie and a reload stays
  signed in (no local host here holds a session, and none was minted); (2) admin.partyreel.com and its alias:
  `/pricing`, `/api/guests/door`, `/manifest.webmanifest` 404, `/` to `/admin`; (3) PRICING.md's atlas still says a
  page open indefinitely polls every 60 s and "Nothing ends it" (line 236), and lists the proxy lever as open: the
  record's to refine.
