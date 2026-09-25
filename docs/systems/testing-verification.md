# Testing & verification

Open this when:
- a browser check disagrees with what you expect (the tools misreport in known ways);
- you need a test account, a fixture or the 1,000-row scale probe;
- you run the gate, read CI or confirm a deploy;
- you soak-test a long-lived session;
- the dev server shows stale CSS.

The local-first-then-live policy, and the 10-second human look before building tooling around a result that smells
like the tool rather than the product, are [CLAUDE.md](../../CLAUDE.md)'s.

## The gate, CI and deploys

- ★ **The gate misleads when run carelessly.** `pnpm typecheck` reads `.next/dev/types/validator.ts`, which the dev
  server writes and nothing cleans, so after a route moves or is deleted it fails naming a file no longer in the tree:
  `rm -rf .next/dev` and re-run (`next build` regenerates its own). Each step is judged on its own exit code, never
  through a pipe. And a green gate is green only for the tree it ran on: a `pnpm format` that rewrites a file a
  parallel sub-agent is still writing splices it, so when work fans out inside one worktree, re-run typecheck after
  formatting and verify the commit rather than the run.
- **CI** (`.github/workflows/ci.yml`) runs the four steps on `main` and `launch-prep` pushes that touch code and on
  every PR to `main`; an `lp/*` push runs it only when its head commit carries `[ci]`, because a run per agent push
  would spend the month's runner minutes in days. Its build step needs the repository variables
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and skips with an annotation naming them until
  they are set.
- **No push deploys an `lp/*` branch** (`git.deploymentEnabled` in `vercel.json` turns off `lp/*` and `launch-prep`
  pushes), so a lane verifies on its own dev server and the allow-list-gated flows on the launch-prep alias, whose
  deployment the Orchestrator creates by API (`usher/kit/alias-ensure.mjs`). An `lp/*` origin, where one exists,
  misleads three ways: it is in no Supabase, R2 or Stripe allow-list, so sign-in, upload, email and checkout fail there
  by design; it builds with the unscoped preview env, so `NEXT_PUBLIC_SITE_URL` inlines to the production URL (QR,
  share and OG links point at partyreel.com) while `DESIGN_PREVIEW_KEY` is set on the unscoped preview target too (the
  lab opens with `?key=`; check scope with `GET /v9/projects/partyreel/env`); and it is a fresh origin with no stored
  theme.
- ★ **The reel's canvas cannot draw on localhost**: R2's CORS answers `http://localhost:*` with no
  Allow-Origin, so every image request the live reel's canvas needs is refused there; the launch-prep alias
  and partyreel.com are both in R2's CORS allow-list, so the reel's drawing (the tile, the view, a clip's
  render) is proven on the alias, never locally.
- **Confirming a deploy is READY at a SHA:** `GET https://api.vercel.com/v6/deployments?projectId=prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB&teamId=team_ht9qAVBQVZf60dpGNJUwmaj5&limit=12`
  with `$VERCEL_TOKEN` (add `&target=production` for production; the admin project is
  `prj_gJhEa7ul4ehpQljDI1EIm6d9jd9D`), match `meta.githubCommitSha` and wait for `READY`;
  `/v3/deployments/<uid>/events` is the build log, the build gate's `[ignore-build]` line included.
- ★ **Vercel's edge, not the function, decides a conditional response on the alias:** a curl whose `If-None-Match`
  matches comes back 304 with `Set-Cookie` stripped even when the function answered 200 with both. Check a header
  with a non-matching validator, or none, first.
- **The Vercel Toolbar** (a floating circle on the right edge, for logged-in team members) overlaps the UI but does not
  exist for guests or curl: never a layout bug; dismiss it or use the keyboard.

## Test accounts and fixtures

Live testing uses disposable test data only.
- **Accounts:** `willg97@gmail.com` the host on Pro, `hi@willgibs.com` a host on Free, `partyr33l@gmail.com` the
  operator (TOTP MFA). Google through the account chooser is authorized; typing a password or a code never is.
- **Seed through real uploads, never raw rows:** a `media` row with no R2 object renders broken and poisons later
  checks. The media fixtures are at `/Users/gibby/local/ai/partyreel-test-media`, and
  `node scripts/seed-demo-event.mjs <folder> [--host <email>] [--name <event>] [--guests "Maya J.,Tom R."] [--dry-run]`
  drives the real write path from Node (it needs ffmpeg and ffprobe), replaces the event's media each run and prints
  its `NEXT_PUBLIC_DEMO_QR_TOKEN`; with `--guests`, the files go in turn to the host and to one name-only row per
  guest. The demo event's own reseed is the Orchestrator's, since partyreel.com and the alias share it.
- **The scale probe, for anything that can outgrow 1,000 rows:** the event "Scale probe"
  (`14bb4318-80cd-4eed-b219-92c097ee16c7`, willg97's, name-only, live and open; its guest token is on the event row,
  never in a doc, because the link takes uploads) holds 1,200 photos, `p0001` (the oldest) to `p1200`, 320x240 without
  previews, 300 each from the host and three guests. Its oldest items carry disposable states: the first 20 pending,
  the next 30 removed by the host, the five guest-owned items after those withdrawn by their guest, and three liked by
  willg97 and hi@willgibs. It shows the platform's behaviour: an unbounded read answers 1,000 rows with
  `Content-Range: 0-999/*` and no error; a `count=exact` HEAD answers 206 with the true total (so the row-cap tripwire
  ignores a HEAD); a write returns every row it touched.
- **`fake-postgrest`** (`src/lib/db/testing/fake-postgrest.ts`) is the in-memory PostgREST for unit-testing a read
  that can outgrow 1,000 rows: it clamps reads at `MAX_ROWS` as the platform does (never a write), fails a URL past
  8,000 characters the way postgrest-js does, and records every request; `asSupabase(fake)` stands in for the client.

## When a browser check disagrees

★ **The Browser pane and the Chrome MCP's tab usually run hidden (`document.hidden === true`), and a hidden document
behaves differently, not only looks different.** Rendering is suspended between tool calls, so:
- rAF never runs (a canvas screenshots frozen; a frame sampler counts zero), and CSS transitions never progress (a
  mid-transition `getComputedStyle` returns the START value; read the end state from a fresh `cloneNode`);
- IntersectionObserver and ResizeObserver never deliver: a reveal-on-arrival stays at its rest state (one scroll
  delivers it in the Chrome MCP; the pane delivers none at all, so a lab board of mount-on-approach frames reads empty
  there), and a Radix NavigationMenu viewport stays 0×0;
- paint timing does not exist, so LCP and FCP observers return nothing: vitals come only from a human's foreground tab;
- `loading="lazy"` images below the fold never load (inside a lab frame too, since lazy loading resolves against the
  top window), and `await img.decode()` on one hangs the evaluate for the full 45 seconds: race it against a timeout;
- `useAmbientPause` consumers report paused, and focus styles do not paint while `document.hasFocus()` is false (hand
  the keyboard pass to the human);
- `resize_window` reports success and changes nothing: measure a narrow layout in a same-origin `<iframe>` at that
  width (its `contentDocument.documentElement.scrollWidth` against `clientWidth`; inject
  `::-webkit-scrollbar{width:17px}` to reproduce a Windows classic scrollbar).

What stays honest: the DOM, computed styles, `getBoundingClientRect`, attributes, real hovers and clicks, and a `data-*`
flipped by hand to read a state's styling. Assert the mechanism (durations, easings, `transition-property`, data
attributes), not the frames; motion feel and reduced motion are the human's session. A JS-driven loop written as a pure
function of elapsed time can be frozen at a chosen moment and shot.

- ★ **A screenshot is never proof of absence.** A capture can come back black, stale, dimmed or missing its text layer
  on a page that renders fine: after a programmatic scroll jump (a real scroll, -80 then +80, clears it), from a hidden
  pane (a solid fill of the body colour), for a capture beyond the viewport (recomposited, which drops a
  `backdrop-filter` layer), or past `scrollHeight` (your own overshoot). Ask the DOM first: `document.visibilityState`,
  `elementFromPoint` at the centre, the target's rect, colour and opacity. Each screenshot forces one frame, so a panel
  may appear only on the second or third, and a Radix layer waiting on `animationend` can read as mounted at
  `data-state="closed"`. A transient animation is captured inside ONE `browser_batch` (trigger, short wait,
  screenshot).
- **A click aimed during an enter animation lands at the mid-flight rect** (real Chrome too): wait for it to settle,
  re-read the rect, then click.
- **The Chrome MCP runs in an isolated world:** a `javascript_tool` DOM write never reaches the app's own
  `getComputedStyle` readers, so drive the real control instead of injecting a variable; a query string on the URL you
  navigate to makes the tool refuse page JavaScript altogether; a short-lived `sonner` toast reads as "nothing
  happened", so assert the state change behind it.
- ★ **The Browser pane's keyboard cannot edit a field** (End, Backspace and `cmd+a` do nothing; Return does not submit):
  set the value through the native setter
  (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, v)`), dispatch a bubbling
  `input` event, then click submit by coordinate.
- **`read_console_messages` returns an accumulated buffer:** read the URLs inside the messages before blaming a page.
- **Two builds compared on one port measure the cached bundle** (a rebuilt chunk can keep its filename, and
  `next start` serves it `immutable`): serve each build on its own port and grep the served bundle. A `next start`
  launched from a tool call can be reaped mid-walk (exit 144), which shows as an iframe turned "cross-origin" or a
  board's error boundary: check the server before filing anything.
- ★ **A browser extension in the Chrome profile manufactures a hydration mismatch** (an injected attribute such as
  `cz-shortcut-listen` on `<body>`): the overlay reports "1 Issue" even on pages your change never touched. Compare the
  curl'd server HTML with the live `className`; byte-identical means noise, and a clean console on the deployed
  preview closes it.
- **Downloads in Will's Chrome land in** `~/Library/Mobile Documents/com~apple~CloudDocs/cloud/downloads/`, not
  `~/Downloads`. For the export Worker the network panel shows phantom 503s while the stream succeeds: `wrangler tail
  partyreel-export` is the truth (a bad signature is a clean "Forbidden", never a 503).
- **The Preview MCP's `preview_start` runs the dev server in the shared git root,** the Orchestrator's checkout and
  branch, never your worktree (it resolves the project by git common dir; `preview_logs`' first line prints the cwd).
  From a worktree, run `pnpm dev -p <your port>` through Bash and drive it with `navigate`, `read_page` and
  `javascript_tool`.
- **Lab boards:** `lab:smoke` weighs whole board pages, so a stage that ignores its tiles still passes; `lab:demo`
  (real Chrome over its DevTools protocol) presses every open step's options and fails a stage that does not move,
  measuring the frame rather than its label. ★ A headless `--screenshot` cannot scroll (a fragment URL paints black; a
  tall window stretches a 100vh hero), so `lab:demo`'s own scrolled capture is how subtle light is judged, and a
  capture with no variance at all is reported UNPAINTED, to be judged by eye (headless Chrome does not always
  rasterize a composited `backdrop-filter`).

## The presign-roll soak

Testing that an album survives the evening (refreshed presigns adopted as the 30-minute bucket rolls) has two traps
that read as "broken":
- **A tab that goes hidden stops polling, on purpose** (`useLivePoll` stops on the change to hidden and polls again
  the moment the tab is visible; a tab that LOADS hidden keeps the browser's throttled background interval). A soak
  tab backgrounded mid-run never adopts refreshed URLs and looks dead once its presigns expire (at most 90 minutes).
  Keep it in the foreground, the real scenario being a host's album up on a screen, and check mid-run with
  `performance.getEntriesByType("resource")` filtered to `/api/album/guest/sync`: zero entries means hidden, not broken.
  The refresh on return to visible is itself a recovery worth asserting.
- **The demo event cannot test it:** demo mode never polls (`liveEnabled` is false). Soak a real test event's link.

## Stale CSS on the dev server

- ★ **Worktrees on one port serve each other's CSS.** Turbopack's dev chunk URLs are not content-hashed, so a browser
  that cached a chunk URL (from another worktree on the same port, even) serves that tree's stylesheet, or a truncated
  one; the page's JS chunk too, so React reports a hydration mismatch whose `+` (client) lines carry the OLD classes
  and `-` (server) lines the NEW. The symptoms are correct code against a stale bundle: a new utility with no effect, a
  class in the DOM with no rule, an arbitrary value computing to 0. The fixes, cheapest first: a unique query param on
  the URL or on each stylesheet `href`; `fetch(url, { cache: "reload" })` for every chunk the HTML references, then
  `location.reload()`; a port no sibling worktree has used.
- **One server per port:** `preview_stop` does not reliably reap `next-server`, and an orphan keeps serving a bundle
  from before your files existed (`ps aux | grep "[n]ext-server"`, `lsof` on the port). A `pnpm build` while a
  server runs rewrites `.next` under it and 404s the chunks.
- ★ **Turbopack's persistent cache is `.next/dev`,** which `rm -rf .next/cache` does not touch: a rule added to
  `globals.css`, `theme.css` or the lab's `design.css` while the server runs never reaches the served sheet, and a
  restart can serve a TRUNCATED sheet that reads exactly like a syntax error you just made. Remove `.next/dev` (or all
  of `.next`) between the stop and the start.
- **The build is the ground truth:** grep `.next/static/chunks/*.css` for the escaped form (Tailwind escapes `[`, `]`,
  `.`, `%` and `/`). A new utility with no effect in dev is no proof the class is wrong.
- **The lab's stylesheet guard:** `design.css` and `lab-css-generation.ts` hold one generation number, bumped together
  when a shell rule changes; the strip that survives a reload means the server's copy is stale (`.next/dev`), not the
  browser's.
- **`next dev` can paint paper surfaces DARK under a dark session theme** (its CSS order lets the dark token block
  beat `.surface-paper`); the production build is right, so theme CSS is judged on a preview or under an explicit light
  theme. A stored `theme` in an origin's localStorage masks system-theme behaviour for weeks.
- ★ **A bare modern CSS value can vanish in the build:** Lightning CSS drops a declaration no browser target supports,
  so a bare `overflow-x: clip` does not survive and only the copy inside `@supports (overflow: clip)` ships (that block
  in `design.css` is load-bearing, not a duplicate). Grep the compiled chunk before believing a lone modern value
  shipped.
