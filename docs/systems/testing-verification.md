# Testing & verification

Open this when:
- a browser check disagrees with what you expect (the tools misreport in known ways);
- you need a test account, a fixture or the 1,000-row scale probe;
- you run the gate, read CI or confirm a deploy;
- you soak-test a long-lived session;
- the dev server shows stale CSS.

The local-first-then-live policy, the gate's steps, the account chooser and the 10-second human look are
[CLAUDE.md](../../CLAUDE.md)'s.

## The gate, CI and deploys

- **`pnpm typecheck` reads the dev server's `.next/dev/types/validator.ts`,** which nothing cleans, so after a route
  moves or is deleted it fails naming a file no longer in the tree: `rm -rf .next/dev` and re-run.
- **A green gate is green for the tree it ran on:** a `pnpm format` over a file a parallel sub-agent is still writing
  splices it, so when work fans out inside one worktree, re-run typecheck after formatting and verify the commit.
- **CI** is [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), whose header says when it runs (an `lp/*`
  push only with `[ci]` in its head commit) and what its build needs.
- **No push deploys `launch-prep` or an `lp/*` branch** (`vercel.json`'s `git.deploymentEnabled`); the Orchestrator
  deploys the launch-prep alias by API (`usher/kit/alias-ensure.mjs`). An `lp/*` origin, where one exists, misleads:
  it is in no Supabase, R2 or Stripe allow-list, so sign-in, upload, email and checkout fail there by design; it builds
  with the unscoped preview env, so `NEXT_PUBLIC_SITE_URL` inlines to the production URL (QR, share and OG links point
  at partyreel.com); and it is a fresh origin with no stored theme.
- ★ **R2's CORS lists localhost only on 3000 and 3131 to 3139** (beside partyreel.com, admin and the alias): a script's
  read of R2 bytes (the reel's canvas, a clip's render) and a browser's presigned PUT work on those ports and fail on
  any other.
- **A signed-in walk runs locally** on a production build at port 3000 built with
  `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (sign-in prefers that variable over the page's origin, and Supabase
  allows `http://localhost:3000/**`): Google's chooser returns there. Will's desk is the same build in
  `../partyreel-wt/desk` (a detached worktree at launch-prep; refresh it by checking out, building and restarting
  `pnpm start -p 3000`).
- **Confirming a deploy is READY at a SHA:** `GET https://api.vercel.com/v6/deployments?projectId=…&teamId=…&limit=12`
  with `$VERCEL_TOKEN` (the ids are in `usher/kit/vercel-lib.mjs`; `&target=production` for production), match
  `meta.githubCommitSha` and wait for `READY`; `/v3/deployments/<uid>/events` is the build log, the Ignored Build
  Step's `[ignore-build]` line included.
- **A curl with a matching `If-None-Match` reads Vercel's edge, not the function:** the edge turns the 200 into a 304
  and strips its `Set-Cookie` ([guest-flow.md](guest-flow.md)), so check a header with no validator first.
- **The Vercel Toolbar** overlaps the UI only for a logged-in team member, never a guest or curl: not a layout bug.

## Test accounts and fixtures

- **Accounts:** `willg97@gmail.com` the host on Pro, `partyr33l@gmail.com` the operator (TOTP MFA),
  `hi@willgibs.com` the host on Free.
- ★ **An account-deletion walk ends in Cancel deletion** on the account's `/admin/accounts/<id>` before the next
  nightly purge (inside 04:00 to 05:00 UTC: [auth-accounts.md](auth-accounts.md)), or the account is gone for good:
  signups are off.
- ★ **A walk of the instant hide that ends in Dismiss spends a strike** of the reporting address (three bar its hide,
  each lapsing 180 days after its dismissal, and Undo takes one back while it counts:
  [admin-observability.md](admin-observability.md)). partyr33l's address is barred until 2027-03-28, willg97's holds
  two and hi@willgibs.com's none, so walk the hide from hi@willgibs.com on one of willg97's albums (it never hides on
  the reporter's own).
- **Seed through real uploads, never raw rows:** a `media` row with no R2 object renders broken and poisons later
  checks. The media fixtures are at `/Users/gibby/local/ai/partyreel-test-media`; `scripts/seed-demo-event.mjs`
  drives the real write path from Node (its header gives the flags; a run replaces the event's media). The demo
  event's own reseed is the Orchestrator's, since partyreel.com and the alias share it.
- **The scale probe, for anything that can outgrow 1,000 rows:** the event "Scale probe"
  (`14bb4318-80cd-4eed-b219-92c097ee16c7`, willg97's, name-only, live and open; its guest token is on the event row,
  never in a doc, because the link takes uploads) holds 1,200 photos, `p0001` (the oldest) to `p1200`, 320x240 without
  previews, 300 each from the host and three guests. Its oldest items carry disposable states: the first 20 pending,
  the next 30 removed by the host, the five guest-owned items after those withdrawn by their guest, and three liked by
  willg97 and hi@willgibs.com.
- **`src/lib/db/testing/fake-postgrest.ts`** is the in-memory PostgREST for unit-testing a read that can outgrow
  1,000 rows (`asSupabase(fake)` stands in for the client).

## When a browser check disagrees

★ **The Browser pane and the Chrome MCP's tab usually run hidden (`document.hidden`), and a hidden document behaves
differently, not only looks different.** Rendering is suspended between tool calls, so:
- rAF never runs (a canvas screenshots frozen; a frame sampler counts zero), and CSS transitions never progress (a
  mid-transition `getComputedStyle` returns the START value; read the end state from a fresh `cloneNode`);
- IntersectionObserver and ResizeObserver never deliver: a reveal-on-arrival stays at rest (one scroll delivers it in
  the Chrome MCP, nothing in the pane, so a lab board of mount-on-approach frames reads empty there), and a Radix
  NavigationMenu viewport stays 0×0;
- paint timing does not exist, so LCP and FCP observers return nothing: vitals come only from a human's foreground tab;
- `loading="lazy"` images below the fold never load (inside a lab frame too: lazy loading resolves against the top
  window), and `await img.decode()` on one hangs the evaluate for 45 seconds: race it against a timeout;
- `useAmbientPause` consumers report paused, and focus styles do not paint while `document.hasFocus()` is false (hand
  the keyboard pass to the human);
- `resize_window` reports success and changes nothing: measure a narrow layout in a same-origin `<iframe>` at that
  width (`contentDocument.documentElement.scrollWidth` against `clientWidth`).

What stays honest: the DOM, computed styles, `getBoundingClientRect`, attributes, real hovers and clicks, and a `data-*`
flipped by hand to read a state's styling. Assert the mechanism (durations, easings, `transition-property`, data
attributes), not the frames; motion feel and reduced motion are the human's session. A JS-driven loop written as a pure
function of elapsed time can be frozen at a chosen moment and shot.

- ★ **A screenshot is never proof of absence.** A capture can come back black, stale, dimmed or missing its text layer
  on a page that renders fine: after a programmatic scroll jump (a real scroll, -80 then +80, clears it), from a hidden
  pane, beyond the viewport (recomposited without a `backdrop-filter` layer) or past `scrollHeight`. Ask the DOM first:
  `document.visibilityState`, `elementFromPoint` at the centre, the target's rect, colour and opacity. Each screenshot
  forces one frame, so a panel may appear only on the second or third, and a Radix layer waiting on `animationend` can
  read as mounted at `data-state="closed"`; capture a transient animation inside one `browser_batch` (trigger, short
  wait, screenshot).
- **A click aimed during an enter animation lands at the mid-flight rect** (real Chrome too): wait for it to settle,
  re-read the rect, then click.
- **The Chrome MCP runs in an isolated world:** a `javascript_tool` DOM write never reaches the app's own
  `getComputedStyle` readers, so drive the real control instead of injecting a variable; a query string on the URL you
  navigate to makes the tool refuse page JavaScript; a short-lived `sonner` toast reads as "nothing happened", so
  assert the state change behind it.
- **The Browser pane's keyboard cannot edit a field** (End, Backspace and `cmd+a` do nothing; Return does not submit):
  set the value through `HTMLInputElement.prototype`'s native `value` setter, dispatch a bubbling `input` event, then
  click submit.
- **`read_console_messages` returns an accumulated buffer:** read the URLs inside the messages before blaming a page.
- **Two builds compared on one port measure the cached bundle** (a rebuilt chunk can keep its filename, and
  `next start` serves it `immutable`): serve each build on its own port and grep the served bundle. A `next start`
  launched from a tool call can be reaped mid-walk (exit 144), which shows as an iframe turned "cross-origin" or a
  board's error boundary: check the server before filing anything.
- **A browser extension in the Chrome profile manufactures a hydration mismatch** (an injected `<body>` attribute such
  as `cz-shortcut-listen`) on pages your change never touched: curl'd server HTML byte-identical to the live
  `className` means noise.
- **Downloads in Will's Chrome land in** `~/Library/Mobile Documents/com~apple~CloudDocs/cloud/downloads/`, not
  `~/Downloads`. For the export Worker the network panel shows phantom 503s while the stream succeeds: `wrangler tail
  partyreel-export` is the truth (a bad signature is a clean "Forbidden", never a 503).
- ★ **The desk's answers live in Will's Chrome:** `/design/lab` keeps his held picks, notes, verdicts and desk prefs in
  the alias origin's localStorage (`review-store.ts`, `lab-prefs.ts`), so an agent walks the desk only in a headless
  Chrome of its own; a pick, a note or a pref set in his Chrome reads as his.
- **The Preview MCP's `preview_start` runs the dev server in the shared git root,** the Orchestrator's checkout and
  branch, never your worktree (it resolves the project by git common dir; `preview_logs`' first line prints the cwd).
  From a worktree, run `pnpm dev -p <your port>` through Bash and drive it with `navigate`, `read_page` and
  `javascript_tool`.
- **A raw headless `--screenshot` cannot scroll** (a fragment URL paints black; a tall window stretches a 100vh hero),
  so a board is captured through `lab:demo` (`--save-shots`), whose scrolled capture is how subtle light is judged.
- **A dev server that never answers an image size** (`lab:demo`'s `Page.navigate did not answer`, or an `UNANSWERED`
  line under a step) is Next 16.2's image optimizer, not a hung page: a size whose first requester hung up is never
  answered again (`next dev` and `next start` alike; Vercel optimizes on its own platform), and six of them hold every
  connection Chrome opens to the server. `patches/next@16.2.6.patch` backports the fix, and
  `src/lib/next-image-optimizer.test.ts` says when it is red and when to delete the patch. A wedged server stays
  wedged whatever the tree: restart it (`rm -rf .next/dev`).

## The presign-roll soak

Soaking an album left open all evening (its links re-minted by id before they die, `src/lib/album/links.ts`) has two
traps that read as "broken":
- **A hidden tab stops polling, on purpose** (`useLivePoll`), and the album re-mints its aged links after each poll, so
  a soak tab backgrounded mid-run looks dead once its links expire (at most 90 minutes). Keep it in the foreground, as
  a host's album up on a screen is, and check mid-run with `performance.getEntriesByType("resource")` filtered to
  `/api/album/guest/sync`: zero entries means hidden, not broken. The refresh on return to visible is itself a recovery
  worth asserting.
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
  restart can serve a TRUNCATED sheet that reads exactly like a syntax error you just made. Scripts too, for a dev
  server moved between trees: a cache warmed on one tree and served on another whose client graph moved can hand a
  page a chunk naming a dynamic import's chunk list by the OLD tree's name; the HMR subscription to that name answers
  `restart`, and the page reloads itself for ever. Remove `.next/dev` (or all of `.next`) between the stop and the
  start, with no dev server of the checkout running (the removal takes its lock and its cache from under it). The
  lab's stale-sheet notice (`lab-css-generation.ts`) that survives a reload means the server's copy is stale, not the
  browser's.
- **The build is the ground truth:** grep `.next/static/chunks/*.css` for the escaped form (Tailwind escapes `[`, `]`,
  `.`, `%` and `/`); a new utility with no effect in dev is no proof the class is wrong. A lone modern value can vanish
  there: Lightning CSS drops a declaration no browser target supports (a bare `overflow-x: clip`; `design.css` ships
  its copy inside `@supports`).
- **`next dev` can paint paper surfaces DARK under a dark session theme** (its CSS order lets the dark token block
  beat `.surface-paper`); the production build is right, so theme CSS is judged on a preview or under an explicit light
  theme. A stored `theme` in an origin's localStorage masks system-theme behaviour for weeks.
