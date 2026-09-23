# Testing & verification: live-testing tool gotchas

> ROLE: the ways the test TOOLING (not the product) lies during a check, plus the gate and the test accounts. Read when a live (Chrome-MCP) or dev-server result disagrees with what you expect.
> BELONGS HERE: the gate's traps and CI; the test accounts and fixtures; tool blind spots (Chrome MCP, the Browser pane, `next dev`, the Vercel preview chrome); the "hand the human the look" pattern. · NOT HERE: the local-first-then-live POLICY (→ [`CLAUDE.md`](../../CLAUDE.md) "Local dev vs. live testing"), unit-test infra and Vitest mocks (→ [design-system.md](design-system.md)).
> GROWS BY: a note when a new tool blind spot burns a loop, refined in place (never a dated block).

Once you are driving a real browser, these are the ways the *test tooling* misreports, so a working change
looks broken. The meta-rule:

> **When a result smells like a tooling limitation rather than a product bug, STOP before you build
> instrumentation or "fix" working code: hand the human the 10-second look ("does X actually show on your
> screen?").** A human eyeball confirms reality far cheaper than more tooling, and chasing a tool-blindness
> ghost ships a fix for a bug that never existed.

## The gate

★ **Three ways the gate lies when it is run carelessly.**
(1) `pnpm typecheck` reads `.next/dev/types/validator.ts`, which the DEV server generates and the build
never cleans; after a route file moves or is deleted, that stale validator fails `tsc` with a "Cannot find
module …/page.js" naming a file no longer in the tree: `rm -rf .next/dev` and re-run (`next build`
regenerates its own types and is not fooled). (2) A pipeline like `pnpm typecheck 2>&1 | tail -1 && …`
reports `tail`'s exit code, so a failing step prints one line and the chain COMMITS anyway: run each step
to a log and test its own exit code (`pnpm typecheck > /tmp/tc.log 2>&1 || { …; exit 1; }`). (3) **A green
gate is only green for the tree that existed when it ran.** `pnpm format` rewriting a file a parallel
sub-agent is still writing splices it, and the splice rides a gate that passed minutes earlier: when work
fans out inside one worktree, re-run typecheck after formatting and verify the commit rather than the run.

**CI runs the same four steps on `main` and `launch-prep` pushes that touch code and on every PR to
`main`** ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)), each command its own named step;
an `lp/*` push runs it only when its head commit message carries `[ci]`. The local four steps are the gate:
the remote run on every agent push would spend the month's runner minutes in days. Read a failed run with
`gh run list --branch launch-prep`, then `gh run view <id> --log-failed`. The `pnpm build` step needs the
repository variables `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the only env
`next build` requires) and skips with an annotation naming them until they are set; the other three always run.

**Confirming a deploy is READY at a SHA** (a `main` push deploys both projects; a `launch-prep` deployment
exists only when the Orchestrator creates it by API at a record, `usher/kit/alias-ensure.mjs`), faster than
the Vercel MCP and scriptable: `curl -s -H "Authorization: Bearer $VERCEL_TOKEN"
"https://api.vercel.com/v6/deployments?projectId=prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB&teamId=team_ht9qAVBQVZf60dpGNJUwmaj5&limit=12"`
(add `&target=production` for prod; the admin project, `partyreel-admin`, is `prj_gJhEa7ul4ehpQljDI1EIm6d9jd9D`),
match `meta.githubCommitSha` to the SHA and wait for `state` READY; `/v3/deployments/<uid>/events` carries
the build log, including the build gate's own `[ignore-build]` line. Never echo the token.

**Shell gotcha (zsh):** `for h in $VAR` does NOT word-split an unquoted variable, so a multi-line variable
becomes one iteration (a curl of a three-line "URL" returns 0 bytes); pipe into `while read h` or use `${(f)VAR}`.

## Test accounts + fixtures (live testing runs on disposable test data ONLY)

- **Accounts:** `willg97@gmail.com` = the host (Pro) · `hi@willgibs.com` = a Free host ·
  `partyr33l@gmail.com` = the operator/admin (TOTP MFA). Google sign-in via the account CHOOSER is
  authorized for switching; typing a password or OTP never is: stop and ask Will.
- **Media fixtures:** real images and videos live at `/Users/gibby/local/ai/partyreel-test-media`. Seed
  through REAL uploads via the product, never raw DB rows: a `media` row with no R2 object renders broken
  images and poisons later checks.
- **Reseeding an album from a folder:** `node scripts/seed-demo-event.mjs <folder> [--host <email>]
  [--name <event>] [--guests "Maya J.,Tom R.,Priya S."] [--dry-run]` drives that same write path from
  Node (`mediaObjectKey`, the EXIF strip, a ~640px WebP preview or video poster, an R2-HEAD size,
  `create_media_as_host`), replaces the event's media on every run, and prints the event's
  `NEXT_PUBLIC_DEMO_QR_TOKEN`; it defaults to the "Partyreel Demo" event and its host, and needs ffmpeg
  and ffprobe on PATH. `--guests` gives the album guests (the host never counts as one): the folder's
  files, in name order, go to the host and each named guest in turn, each name through ONE name-only row
  (`create_guest`, reused by name on every re-run) and its files through `create_media` under that row's
  session token; it refuses an event that is not name-only, live, open and taking uploads. The demo's
  own reseed is the Orchestrator's (the demo is shared by partyreel.com and the alias).

## Chrome MCP blind spots

- ★ **Paint timing does not exist in a hidden document.** The Browser pane and the Chrome MCP tab can
  both report `document.visibilityState === "hidden"` even after fronting, and a hidden document records
  NO paint timing: a `PerformanceObserver` for `largest-contentful-paint` / `first-contentful-paint`
  returns zero entries, not a slow number. Measure vitals only from a tab a human has in the foreground;
  an LCP read from either tool, or from the MCP's isolated world, is meaningless.
- ★ **The Chrome MCP's tab is usually a BACKGROUND tab (`document.hidden === true`), and that changes
  what the page does, not just what you see.** Three consequences look like product bugs: (1) every
  `useAmbientPause` consumer reports `data-paused="true"`, so lamps sit on their base and marquees
  freeze; (2) `loading="lazy"` images below the fold **never load**, so a DOM palette sampler or a
  contrast measurement silently gets nothing (set `img.loading = "eager"` before measuring); (3)
  `await img.decode()` on an image that never loads **hangs the CDP evaluate for the full 45s timeout**
  and reports the renderer frozen (race every decode against a timeout). **A screenshot right after a
  programmatic scroll jump can capture a stale, all-black frame**: a 2px nudge does not clear it, a real
  scroll (`scrollBy(-80)` then `scrollBy(80)`, ~300ms apart, then ~700ms) does, and a lab page scrolled
  past the fold comes back black too (move the content under scroll position zero with a negative body
  margin, or measure the DOM). Trust no single black frame until a second read agrees. `matchMedia` is
  the honest read of the profile's motion setting, never an animation reading `none`. Never append a
  query string to the URL you navigate to: the tool then refuses to run page JavaScript at all
  ("Cookie/query string data").

- **Ephemeral `sonner` toasts are invisible.** The Chrome MCP reads the DOM in an isolated world and toasts
  are short-lived, so a *working* toast reads as "nothing happened." Assert off the underlying state change
  (the RPC's effect, a new row, a redirect, a network response), or hand the human the look. (Unit tests
  mock `sonner` globally: [design-system.md](design-system.md).)
- **Three instrument traps:** (1) the in-app Browser pane's `resize_window` reports success and changes
  nothing (innerWidth stays about 1456), so a "375 walk" driven that way is a desktop walk: use a
  375-wide same-origin iframe (below) or real Chrome, and assert `innerWidth` in the same call as the
  measurement; (2) a rebuilt chunk can keep its filename and `next start` serves it `immutable`, so an
  A/B against a previous build on the SAME port measures the cached bundle: serve each build on its own
  port and grep the served bundle for the change; (3) a `next start` launched from a tool call can be
  reaped mid-walk (exit 144), which shows as a same-origin iframe turning "cross-origin" or the board's
  error boundary: check the server before filing anything.
- ★ **Vercel's edge, not the function, decides a conditional response on the alias.** A curl whose
  `If-None-Match` matches the function's ETag comes back `304` with `Set-Cookie` stripped even when the
  function answered `200` with both headers set: the edge rewrites a matching `200` into a `304` in
  transit and drops `Set-Cookie` in the rewrite. A header on a matching conditional response is never
  proof of what the function sent; curl the SAME route with a non-matching validator (or none) first.
- **The in-app Browser pane runs with `document.hidden === true`, which suspends the rendering loop.** In
  a non-interactive session the pane is never visible, and `tabs_select` does not change that, so the
  spec's "update the rendering" steps never run between tool calls: **rAF** (a playing canvas
  screenshots frozen; a rAF frame-time sampler records ZERO frames, so it cannot measure jank),
  **ResizeObserver** and **IntersectionObserver** delivery (a Radix NavigationMenu viewport stays 0×0; a
  scroll-sentinel header never flips to `stuck`), and **CSS transition progress** (a mid-transition
  `getComputedStyle` returns the START value forever). Each `screenshot` call forces ONE frame: a panel
  may appear only on the second or third screenshot after the hover that opened it, and a Radix layer
  whose unmount waits on `animationend` (Sheet, Dialog) can read as STILL MOUNTED at
  `data-state="closed"`, so force a frame or two before judging presence. What stays honest: computed
  styles, `getBoundingClientRect`, DOM and attribute assertions, real hovers and clicks, and flipping a
  `data-*` attribute by hand to read a state's styling. Assert the MECHANISM (durations, easings,
  `transition-property`, `--tw-enter-*`, ancestor `backdrop-filter`), not the frames. The exception
  inside "computed styles work": an element with a TRANSITION on the probed property keeps returning its
  PRE-change value (its `transition-colors` frozen at progress 0) while a fresh `cloneNode` resolves the
  end state, so clone-probe or drive real Chrome. Motion FEEL and `prefers-reduced-motion` (not emulable
  here) are the human's session.
- **Focus states do not paint while `document.hasFocus()` is false**, and `matches(':focus')` returns
  false with them, even though `document.activeElement` is correct. Any `:focus-*` styling is
  unverifiable from a backgrounded seat (an `!important` `a:focus{outline}` control refuses to paint
  too, which proves it is the seat, not the CSS): hand a keyboard pass to the human rather than "fixing"
  working CSS. (The `:focus-within` twin is in [design-system.md](design-system.md).)
- **Browser downloads land in an iCloud dir, and the network panel can lie about them.** Will's Chrome
  saves to `~/Library/Mobile Documents/com~apple~CloudDocs/cloud/downloads/`, NOT `~/Downloads`. For the
  export Worker the network panel shows phantom 503s while the stream succeeds; `wrangler tail
  partyreel-export` is ground truth for whether the Worker ran and what it returned (a bad HMAC is a
  clean "Forbidden", never a 503).
- **Isolated-world DOM + timing artifacts.** The MCP executes in an isolated world, so buffered or
  just-painted state can be missing and timing or race effects can read as failures.
  - **Clicks aimed during an ENTER animation miss (real Chrome too).** `find`/ref clicks and coordinates
    read while a menu or panel is still animating in aim at the MID-FLIGHT rect (a cross-slide can leave
    a nav link 250px right of its settled spot, and the click "dismisses the menu, no navigation"). Wait
    for the enter to settle, re-read `getBoundingClientRect`, then click.
  - **`javascript_tool` writes don't cross into the app's world.** A
    `document.documentElement.style.setProperty('--x', …)` (or any DOM mutation) from `javascript_tool`
    does NOT reach the app's MAIN-world `getComputedStyle` readers (e.g. a hook's runtime `readMs`), so
    you cannot inject a CSS var to slow a JS-read animation; only the cross-world app read is blind
    (inline style read back in the SAME call, and CSS-read vars, do reflect it). Drive the real control
    instead (a slider, a click).
  - **Capturing a transient animation: use ONE `browser_batch`.** A sub-second beat or exit is gone
    before a SEPARATE screenshot call lands (each round-trip is ~1.5-2s). Put the trigger, a short `wait`
    and the `screenshot` in a SINGLE `browser_batch`, or assert the MECHANISM (computed
    `transition-delay`/`-duration`, the data attribute per element) instead of chasing the frame.
  - **An animated route can SCREENSHOT as dimmed or empty while the DOM is fully visible.** The capture
    shows a faded header over black and `getBoundingClientRect` on a control returns `0,0,0,0`, yet
    computed styles up the tree are `display:block/flex`, `opacity:1`, `visible`, with real heights: the
    page renders for a real user, the CAPTURE lies, and "clicks" land on nothing. Verify visibility by
    computed style on the element and its ancestors, and hand the human the 10-second look for the
    interaction. Frames can also come back with the TEXT LAYER missing (or all black, or all white) while
    `elementsFromPoint`, `getComputedStyle` and `getBoundingClientRect` agree the type is painted and
    topmost; any style write or a SECOND screenshot returns the true frame, so one screenshot never
    proves absence.
    ★ A HIDDEN pane breaks the second-screenshot trick: `innerWidth` reads 0, every capture comes back
    black, and `resize_window` silently no-ops while reporting success. It ALSO no-ops for the Chrome MCP
    whenever the tab is a background tab, its normal state (`innerWidth` never changes). To measure a
    narrow layout, append a same-origin `<iframe>` at the width you need and read its
    `contentDocument.documentElement.scrollWidth` against `clientWidth`; to reproduce Windows, where
    `100vw` includes a classic scrollbar, inject `::-webkit-scrollbar{width:17px}` into the iframe (it
    forces classic scrollbars even on macOS Chrome). DOM reads stay honest in both browsers; when neither
    will paint, verify geometry and computed style by hand, then look at the DEPLOYED preview.

- ★ **A BROWSER EXTENSION IN THE CHROME PROFILE MANUFACTURES A HYDRATION MISMATCH.**
  The dev overlay reports "1 Issue" on every marketing page and React's report points at a component's
  `className` with a `+`/`-` pair, which reads as a real SSR/client divergence on a file you just edited.
  The actual mismatch is an attribute like `cz-shortcut-listen="true"` an extension injects on `<body>`
  (React's own message lists this cause last), and once ANY mismatch occurs React marks nodes in the
  surrounding subtree that never differed. **The 10-second disproof**: compare the curl'd server HTML
  against the live `element.className`; byte-identical means the diff is display noise. The other tell
  is that it reproduces on pages your change never touched; a clean console on the deployed preview
  (production build, extension-free) closes it.

- ★ **A HIDDEN PANE CAN ALSO SCREENSHOT SOLID BLACK, on a page that is rendering perfectly.**
  Same `document.hidden === true` cause: on a dark surface the forced single frame can come back as a
  uniform fill of the body background. **Do not diagnose from the image**; ask the DOM, which settles it
  in one call: read `document.visibilityState`, then
  `document.elementFromPoint(innerWidth/2, innerHeight/2)` plus the target's `getBoundingClientRect()`,
  `color` and `opacity`. If elementFromPoint returns the element you scrolled to, with a real colour and
  opacity 1, the page is fine.
  ★ An empty frame can also be your own bug: a scroll past `document.documentElement.scrollHeight`
  yields one that looks identical. Check `scrollY` against `scrollHeight - innerHeight` before blaming
  the pane; both can be true at once, and the overshoot is the one worth fixing.
- ★ **AN OCCLUDED TAB NEVER DELIVERS THE FIRST IntersectionObserver CALLBACK.**
  With `document.hidden === true`, anything revealed ON ARRIVAL stays at its hidden rest state forever: a
  hero's h1 reads `opacity: 0` with `.is-shown` absent, minutes after load, on a page that renders
  perfectly for a human. It is indistinguishable from the arrival-default bug
  ([design-system.md](design-system.md), bible 13). **One scroll disproves it** (a scroll forces a
  delivery, and `.is-shown` lands immediately); reveals further down fire normally, because scrolling to
  them IS the nudge, which makes the symptom more convincing, not less. Check `document.hidden` before
  believing it or the suspended-rAF trap.

- **A lazy tile inside a lab frame can never load.** `MediaTile` carries `loading="lazy"`, and Blink
  resolves it against the TOP window even inside a same-origin iframe, so a tile used as chrome below the
  fold of a lab frame stays unloaded however the frame scrolls.
- **`read_console_messages` returns an ACCUMULATED buffer, not the current page's.** Read right after
  navigating to a second origin, it returns the FIRST origin's errors ("the bug followed me to prod").
  Check the URLs inside the messages before believing which page they came from.

**A JS-driven loop photographs as an empty stage in a driven tab.** An occluded real-Chrome window
suspends `requestAnimationFrame` completely (0 frames in 2.9 s), so a rAF-driven animation never leaves
its first frame; the Browser pane's screenshots go stale and desync from the page's own scroll; and a
hidden tab sets a lab board's `data-paused`, so its loops and clips pause by design. None of it is a
product bug. Make the loop a pure function of elapsed time so it can be frozen at a chosen elapsed and
the still shot, verify the DOM (the nodes, their rest-state declarations, the h1), and hand the human the
foreground look for the motion.
- ★ **The Browser pane delivers no IntersectionObserver callbacks** (an observer on a plainly
  intersecting element never fires), so every lab frame that mounts on approach (`useMountOnApproach`,
  `Frame`'s `onApproach`) stays unmounted there and a board of such frames reads as empty. Judge those
  boards in Chrome or on a real screen; the smoke's route half is unaffected (it reads server HTML).
- ★ **The Browser pane's keyboard cannot edit a field.** In a controlled text input, `End`, `Backspace`
  (even repeated forty times) and `cmd+a` do nothing, `type` appends wherever the caret sits, and a
  Return does not submit. To replace a value, call the native setter
  (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, v)`), dispatch
  a bubbling `input` event, then click the submit button by coordinate.

## Long-lived-session tests (the presign-roll soak)

Testing "the album survives the evening" (refreshed presigns adopted as the 30-min stable bucket rolls)
has TWO setup traps that both produce a false "broken" reading:

- **A tab that GOES hidden stops polling, on purpose.** The fallback poll `live-gallery.tsx` runs
  (`useLivePoll`, `src/lib/shared/use-live-poll.ts`) stops on the `visibilitychange` to hidden (frugality
  and correctness) and polls again the moment the tab is visible; a tab that LOADS hidden, as the Chrome
  MCP's usually does, keeps its interval at the browser's throttled background rate until it is shown and
  hidden again. A soak tab backgrounded mid-run collects ZERO polls, never adopts refreshed URLs, and looks dead once its presigned URLs expire (at most 90
  minutes, `STABLE_DOWNLOAD_TTL_SECONDS`). Keep the soak tab **foregrounded** for the whole window (the
  real scenario: a host leaving the album up on a screen), and verify the setup mid-run with
  `performance.getEntriesByType("resource")` filtered to `/api/guests/gallery`: zero entries means the
  tab was hidden, not that the poll is broken. The return-to-visible refresh is itself the recovery path
  worth asserting: a phone that sleeps past the expiry repaints on wake.
- **The DEMO event cannot test it at all.** `liveEnabled` is false in demo mode (the curated media is
  static and the simulated tiles are local-only), so the demo `/e/` link never polls. Run the soak on a
  REAL test event's link.

## Dev-server CSS (localhost only)

- ★ **`next dev` can serve STALE Tailwind CSS, and there are THREE causes. The first is that TURBOPACK
  REUSES CHUNK FILENAMES.** Dev chunk URLs are not content-hashed (`[root-of-the-server]__0l0bs12._.css`),
  so a browser holding that URL in cache, even from a DIFFERENT WORKTREE on the same port, serves another
  tree's stylesheet, or a truncated one. The symptoms are all "correct code against a stale bundle": a
  brand-new utility with no effect (every class that "works" pre-exists elsewhere in the repo, which is
  what hides it), "the class is in the DOM, the breakpoint matches, and no rule exists", a hydration
  mismatch, and `w-[52%]` computing to `0px` while a `grid-cols-[repeat(auto-fill,…)]` collapses to one
  full-width column. It reaches the SERVED PAGE too: correct markup in `curl` while the browser renders
  the previous layout, fixed by a `?v=2` on the URL. **It bites the CLIENT JS the same way: the Chrome
  MCP tab keeps serving its cached page chunk (`…_src_<hash>._.js`, path-hashed, so the name survives an
  `.next` wipe + restart) while the server's HTML is fresh, and React reports a hydration mismatch whose
  `+` (client) lines carry the OLD classes and whose `-` (server) lines carry the NEW ones.** Read that
  diff direction before touching code; `curl` the page and the chunk to prove the server right (or check
  the Browser pane, its own cache), then in the tab `fetch(url, {cache: "reload"})` every
  `/_next/static/chunks/*.js|css` the HTML references and `location.reload()`.
  **The second cause is an ORPHANED SERVER.** `preview_stop` does not reliably reap `next-server`, so an
  orphan can keep winning the port and serve a bundle compiled before your files existed, which is why
  restarts and even an `.next` wipe can appear not to help. Its ugliest face is a page with NO stylesheet
  at all: the prerendered HTML references chunk hashes the running server no longer has (they 404/500).
  **The third cause is TURBOPACK'S PERSISTENT CACHE (`.next/dev`):** a rule added to `globals.css` while
  the dev server runs never reaches the served stylesheet, and a `preview_stop` + `preview_start` restart
  serves the SAME hashed chunk without it (Tailwind's own compiler emits the rule fine). `rm -rf .next/dev`
  between the stop and the start is the fix; do it after any edit to `globals.css`, `theme.css` or the
  lab's `design.css` before trusting what the pane shows (a `touch` on the sheet does not clear it).
  **The fixes, cheapest first:** a unique query param on the URL (or on each `<link rel=stylesheet>`
  href), which needs no restart; exactly ONE server on the port (`ps aux | grep "[n]ext-server"` and
  `lsof -nP -iTCP -sTCP:LISTEN | grep 3000`, else `pkill -f next-server` and start one); a port no
  sibling worktree has used; or the preview deploy. **Never run `pnpm build` while any server is up**: it
  rewrites `.next` underneath it and produces the same stale-hash 404s. **The 5-second ground truth** is
  the build, not the dev server: `grep -r "<value>" .next/static/chunks/*.css` (CSS escapes `%` as `\%`
  and `/` as `\/`, so grep the escaped form or you will "prove" a present class missing). A
  new-to-the-repo utility with no effect in dev is NOT proof the class is wrong; never rewrite working
  classes chasing dev.
  **The lab guards itself** (`src/components/lab/lab-chrome.tsx`): `design.css` declares
  `--lab-css-generation: N` on `.lab-shell` and `lab-css-generation.ts` holds the same N; the chrome
  reads it after mount, reloads once in development when it is old (a `sessionStorage` flag stops a
  loop) and otherwise shows a `role="alert"` strip. The strip after a reload means the SERVER's copy is
  stale (the `.next/dev` cause), not the browser's. Bump both numbers together when a shell rule
  changes; `pnpm lab:smoke` also refuses a lab page whose stylesheet set lacks the shell.
  **A stage that ignores its tiles is invisible to the smoke** (it answers 200 and weighs the same
  words): `pnpm lab:demo` (`scripts/lab-demo.mjs`, real Chrome over its DevTools protocol) presses every
  open step's pictured options and fails a stage that moves less than 0.1 percent, measuring the FRAME
  rather than the label over it (the label names the pressed option, so it moves on a frozen stage too)
  and a motion-only step by the animations it declares. It also fails a step whose stage starts below
  `--reach-limit` (0.6 of a 900px screen), is clipped, is unlabelled or has its dock off screen, and
  prints each step's height and word count (the reviewer's unit of work is the STEP; the smoke weighs
  only the whole board page). ★ A headless `--screenshot` cannot scroll (a fragment URL paints black, a
  tall window stretches a 100vh hero); the same protocol gives a scrolled, lossless capture, which is how
  subtle light is judged.

- ★ **`rm -rf .next/cache` is NOT enough, and the tell is a stylesheet that is TRUNCATED rather than
  stale.** Turbopack's dev output lives in **`.next/dev/`**, which the `cache` wipe does not touch, so a
  restart can serve a chunk that is minutes old (its mtime looks fresh) and still missing part of your
  CSS: the first thousand lines of `globals.css` present and a whole later engine block absent, so
  `[data-glw]` computes `position: static` and every lamp, the shipped footer one included, renders as
  an unstyled div. It reads exactly like a CSS syntax error you just introduced. **Rule it out in 30
  seconds before touching source:** the production build is ground truth (`grep -c data-glw` in
  `.next/static/chunks/*.css`), and the source's brace balance is checkable in a few lines of python.
  Then `rm -rf .next` (the whole directory, not `cache`) and restart.

- ★ **A capture that reaches BEYOND the viewport is recomposited, and a backdrop-filter layer does not
  survive it.** Chrome resizes its render surface to take it, so a frame can come back black and a glass
  pane without its blur: a harness that measures glass scrolls the box into the window and clips there
  (`scripts/lab-demo.mjs`, whose 3000px window holds any stage whole). Headless Chrome also does not
  always rasterise a composited `backdrop-filter` scene, so lab:demo reports a capture with no variance at
  all as UNPAINTED, to be judged by eye, never as a frozen stage.
- ★ **A bare modern CSS value can be DROPPED by the build's minifier, so read the compiled chunk
  rather than the source.** Lightning CSS (via Tailwind v4) compiles against the configured browser
  targets and removes a declaration no target supports: a bare `overflow-x: clip` does not survive, and
  only the copy inside `@supports (overflow: clip)` reaches the chunk. The `@supports` block in
  `design.css` is therefore load-bearing; deleting it as a duplicate removes the rule with no error and
  no failing test. Grep the compiled chunk before believing a lone modern value shipped
  (`grep -r "overflow-x:clip" .next/static/chunks/*.css`).

- **The Preview MCP starts the dev server in the SHARED git root, not your worktree.** `preview_start`
  resolves the project by git common dir, which every worktree shares, so from `../partyreel-wt/<track>`
  it runs `pnpm dev` in `/Users/gibby/local/ai/partyreel` (the Orchestrator's checkout) and serves THAT
  branch. The tell is a 404 on a route you just wrote, or a page missing your change (the first line of
  `preview_logs` prints the cwd); verifying against it is worse than not verifying, because it looks like
  a pass. **From a worktree, run `pnpm dev -p <unused port>` via Bash instead** (the one standing
  exception to "never use Bash for dev servers") on a port no sibling worktree owns, then drive it with
  `navigate` / `read_page` / `javascript_tool`.

- **`next dev` can render paper surfaces DARK under a dark session theme.** With `html.dark` present
  (system-dark and no stored theme), Turbopack's dev CSS ordering lets the dark token block beat the
  `.surface-paper` re-light, so a PaperChapter (and the whole `(paper)` route group) shows dark tokens
  and the pricing pair's ink inversion flips white. **The production build resolves correctly**: this is
  a dev-only capture lie, so never "fix" theme CSS chasing it; verify paper surfaces on the preview
  deploy, or set an explicit light theme on the localhost origin first. Its companion trap: a STORED
  `theme` in an origin's localStorage (from past app testing) masks system-theme behavior entirely, and
  an origin can carry one for weeks.

## Vercel preview chrome

- **The dev Toolbar overlaps the UI and does not exist for real guests.** Vercel injects a dev **Toolbar**
  for logged-in team members (a floating circle on the right-middle edge) that overlaps app UI but is
  invisible to real, logged-out guests and to anonymous curl. Never treat it as a layout bug or let it
  block a click: navigate by keyboard, or dismiss it.

- **No push builds an `lp/*` preview, and an `lp/*` origin misleads in three ways; none are product
  bugs.** vercel.json's `git.deploymentEnabled` turns off `lp/*` (and `launch-prep`) push deployments,
  so an Agent verifies on its own dev server and the allow-list-gated flows run on the launch-prep
  alias. Where an `lp/*` origin exists: (1) it is in NO Supabase/R2/Stripe allow-list, so sign-in,
  upload, email round-trips and checkout fail there BY DESIGN (the policy home is CLAUDE.md "Local dev
  vs. live testing"); (2) it builds with the UNSCOPED preview env: `NEXT_PUBLIC_SITE_URL` inlines to the
  prod URL (absolute QR, share and OG links point at partyreel.com), while `DESIGN_PREVIEW_KEY` (a light
  guard, not a secret; the value is in `.env.local`) is set on the unscoped `preview` target as well as the
  `launch-prep`-scoped one, so the `/design` lab opens there with `?key=` (200 with the key, 404 without);
  confirm scope with `GET /v9/projects/partyreel/env` rather than assuming; (3) it is a FRESH origin with no stored `theme` in localStorage, so system-theme
  behavior can differ from the long-lived launch-prep origin (the stored-theme trap above).
