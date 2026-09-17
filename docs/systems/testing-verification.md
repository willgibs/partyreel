# Testing & verification: live-testing tool gotchas

> ROLE: the home for the ways the test TOOLING (not the product) lies during a LIVE check. Read when a live (Chrome-MCP) result disagrees with what you expect.
> BELONGS HERE: live-testing tool blind-spots (Chrome MCP, the Vercel preview chrome) + the "hand the human the look" pattern. · NOT HERE: the local-FIRST-then-live POLICY (→ [`../../CLAUDE.md`](../../CLAUDE.md) "Local dev vs live testing"), unit-test infra / Vitest mocks (→ [design-system.md](design-system.md)).
> GROWS BY: integrate-in-place; add a note when a new tool blind-spot burns a loop, refine in place, don't append dated blocks.

The **policy** (test locally first, then deploy for the allow-list-gated flows + a final adversarial pass)
lives in [`CLAUDE.md`](../../CLAUDE.md). This doc is the **downstream** half: once you ARE driving the live
site, these are the ways the *test tooling* misreports, so a working change looks broken. The meta-rule:

> **When a live result smells like a tooling limitation rather than a real product bug, STOP before you
> build instrumentation or "fix" working code: hand the human the 10-second look ("does X actually show on
> your screen?").** Chasing a tool-blindness ghost is how you burn a loop and ship a change for a bug that
> never existed; a human eyeball confirms reality far cheaper than more tooling.

## The gate

★ **Three ways the gate lies when it is run carelessly.**
(1) `pnpm typecheck` reads `.next/dev/types/validator.ts`, a file the DEV server generates and the
build never cleans; after a route file moves or is deleted, that stale validator fails `tsc` with a
"Cannot find module …/page.js"
that names a file no longer in the tree. `rm -rf .next/dev` and re-run; `next build` regenerates
its own types and is not fooled. (2) A pipeline like `pnpm typecheck 2>&1 | tail -1 && …` reports
`tail`'s exit code, not the gate's, so a failing step prints one line and the chain COMMITS anyway.
Run each gate step to a log and test its own exit code: `pnpm typecheck > /tmp/tc.log 2>&1 || { …; exit 1; }`.
(3) **A green gate is only green for the tree that existed when it ran.** `pnpm format` reading and
writing a file that a parallel sub-agent is still writing splices it, and the splice rides a gate that
passed minutes earlier. When a round
fans work out inside one worktree, re-run typecheck after formatting whenever anything else might hold
the file, and verify the commit rather than the run.

**CI runs the same four steps on `main` and `launch-prep` pushes that touch code and on every PR to
`main`** ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)), each command its own named step;
an `lp/*` push runs it only when its commit message carries `[ci]`. The local four steps are the gate:
a dozen tracks running the remote one on every push spends a month of
minutes in two days. Read a failed run with `gh run list --branch launch-prep` then `gh run view <id>
--log-failed`. Its `pnpm build` step needs the repository variables
`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the only env `next build` requires)
and skips with an annotation naming them until they are set; the other three always run.

**Confirming a deploy is READY at the SHA you pushed** (the Vercel MCP lists deployments, but a
one-line poll is faster and scriptable): `curl -s -H "Authorization: Bearer $VERCEL_TOKEN"
"https://api.vercel.com/v6/deployments?projectId=prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB&teamId=team_ht9qAVBQVZf60dpGNJUwmaj5&limit=12"`
(add `&target=production` for prod), match `meta.githubCommitSha` to your SHA and wait for `state`
READY; `/v3/deployments/<uid>/events` carries the build log, including the build gate's own
`[ignore-build]` line. Never echo the token.

**Shell gotcha (zsh):** `for h in $VAR` does NOT word-split an unquoted variable in zsh, so a
multi-line variable becomes one iteration (a curl of a three-line "URL" returns 0 bytes);
pipe into `while read h` or use `${(f)VAR}`.

## Test accounts + fixtures (live testing runs on disposable test data ONLY)

- **Accounts:** `willg97@gmail.com` = the host (Pro) · `hi@willgibs.com` = a Free host ·
  `partyr33l@gmail.com` = the operator/admin (TOTP MFA). Google sign-in via the account CHOOSER is
  authorized for switching; typing a password/OTP is never allowed — stop and ask Will (CLAUDE.md
  "Local dev vs. live testing").
- **Media fixtures:** real images/videos live at `/Users/gibby/local/ai/partyreel-test-media`. Seed
  via REAL uploads through the product, never raw DB rows: a `media` row with no R2 object renders
  broken images and poisons later checks.
- **Reseeding an album from a folder:** `node scripts/seed-demo-event.mjs <folder> [--host <email>]
  [--name <event>] [--dry-run]` drives that same write path from Node (`mediaObjectKey`, the EXIF
  strip, a ~640px WebP preview or video poster, an R2-HEAD size, `create_media_as_host`), replaces
  the event's media on every run, and prints the event's `NEXT_PUBLIC_DEMO_QR_TOKEN`; it defaults to
  the "Partyreel Demo" event and its host, and needs ffmpeg on PATH.

## Chrome MCP blind spots

- ★ **Paint timing does not exist in a hidden document.** Both
  the Browser pane and the Chrome MCP tab can report `document.visibilityState === "hidden"` even
  after fronting them, and a hidden document records NO paint timing at all: a `PerformanceObserver`
  for `largest-contentful-paint` / `first-contentful-paint` returns zero entries, not a slow number.
  An LCP read from either is meaningless; measure vitals from a tab a human has in the foreground.
- ★ **The Chrome MCP's tab is usually a BACKGROUND tab (`document.hidden === true`), and that changes
  what the page does, not just what you see.** Three consequences, all of which
  read as product bugs and are not: (1) every `useAmbientPause` consumer reports `data-paused="true"`,
  so lamps sit on their base and marquees freeze; (2) `loading="lazy"` images below the fold **never
  load**, so anything that reads them (the DOM palette sampler, a contrast measurement) silently gets
  nothing; force `img.loading = "eager"` before measuring, which is legitimate for a measurement; and
  (3) `await img.decode()` on an image that is never going to load **hangs the CDP evaluate for the
  full 45s timeout** and reports the renderer as frozen. Always race a decode against a timeout.
  Alongside them: **a screenshot taken right after a programmatic scroll jump can capture a
  stale, all-black frame** even when computed styles say everything is visible. A 2px nudge does not
  clear it; a real scroll (`scrollBy(-80)` then `scrollBy(80)`, ~300ms apart, then ~700ms) does. Treat a
  single black frame as a capture artifact until a second read agrees. A lab page scrolled past the fold
  comes back all black too: read a long board by moving the content under
  a scroll position of zero (a negative body margin) or by measuring the DOM; a blank frame is not a broken board. `matchMedia` is the honest way
  to know the profile's motion setting; do not infer it from an animation reading
  `none`. And do not append a query string to the URL you navigate to: the tool then refuses to run
  page JavaScript at all ("Cookie/query string data").

- **Ephemeral `sonner` toasts are invisible.** The Chrome MCP reads the DOM in an isolated world and toasts
  are short-lived, so a *working* success/error toast reads as "nothing happened." Don't chase it: assert
  off the underlying state change instead (the RPC's effect, a new row, a redirect, a network response),
  screenshot off that, or hand the human the look. (Unit tests mock `sonner` globally — see
  [design-system.md](design-system.md).)
- **Three instrument traps around builds and ports:** (1) the in-app Browser pane's
  `resize_window` reports success and changes nothing (innerWidth stays about 1456 whatever is asked),
  so a "375 walk" driven that way is a desktop walk: load the page in a 375-wide
  same-origin iframe, or drive real Chrome, and assert `innerWidth` in the same call as the measurement;
  (2) a rebuilt chunk can keep its filename and `next start` serves it `immutable`, so an A/B against a
  previous build on the SAME port measures the cached bundle and "disproves" a real defect:
  serve each build on its own port and grep the served bundle for the change before trusting
  a reading; (3) a `next start` launched from a tool call can be reaped mid-walk (exit 144), and the
  symptom is a same-origin iframe turning "cross-origin" or the board's error boundary, not a product bug:
  check the server before filing anything.
- **Two costumes of the hidden-tab trap, both on lab boards:** (1) the
  lab shell's nav is a Suspense boundary that does not resolve while `document.hidden`, so a board read
  in a driven background tab lays out inside the 232px sidebar cell and every width measured off it is
  wrong; (2) the Chrome tooling returns a flat black screenshot of any lab page scrolled past the fold.
  Read a lab page in a FOREGROUND tab, measure the DOM rather than the pixels, or move the content under
  scroll position zero (a negative body margin); a board that looks blank in a screenshot is not broken.
- **The in-app Browser pane runs with `document.hidden === true`, which suspends the whole rendering
  loop.** In a non-interactive session the pane is never actually visible, and `tabs_select` does not change
  that. Everything the spec ties to the "update the rendering" steps therefore never runs between tool
  calls: **rAF** (so a playing canvas screenshots frozen, and any rAF frame-time sampler records ZERO
  frames — do not try to measure jank this way), **ResizeObserver** and **IntersectionObserver** delivery
  (so a Radix NavigationMenu viewport stays 0×0 because its measured size vars never arrive, and a
  scroll-sentinel header never flips to `stuck`), and **CSS transition progress** (a mid-transition
  `getComputedStyle` returns the START value forever, so an element reads as "never animated"). Each
  `screenshot` call forces ONE frame, which is why a panel often appears only on the second or third
  screenshot after the hover that opened it, and why a Radix layer whose unmount waits on
  `animationend` (Sheet, Dialog) can read as STILL MOUNTED at `data-state="closed"` long after a
  close: force a frame or two (screenshots), then re-probe, before judging presence. What still works, and is the right thing to lean on: computed
  styles, `getBoundingClientRect`, DOM/attribute assertions, real hovers/clicks, and reading a state's
  styling by flipping its `data-*` attribute by hand. Assert the MECHANISM (durations, easings,
  `transition-property`, `--tw-enter-*`, ancestor `backdrop-filter`), not the frames. The trap hiding
  inside "computed styles work": an element with a TRANSITION on the probed property. A label whose
  className provably flipped keeps returning its PRE-change computed
  background through forced reflows, its `transition-colors` frozen at progress 0, while a fresh
  `cloneNode` (no running transition) resolves the end state correctly. For a state-driven restyle on a
  transitioning element: clone-probe, or drive real Chrome. Motion FEEL and
  `prefers-reduced-motion` (not emulable here) are never tooling-judgeable; those are the human's session.
- **Focus states do not paint while `document.hasFocus()` is false**, and `matches(':focus')` returns
  false with them, even though `document.activeElement` is correct. Any `:focus-*` styling is therefore
  unverifiable from a backgrounded seat: an `!important` `a:focus{outline}` control refuses to paint
  too, which is the check that proves it is the seat and not the CSS. Hand a keyboard pass to the human
  rather than "fixing" working CSS. (The `:focus-within` twin of this is in
  [design-system.md](design-system.md).)
- **Browser downloads land in an iCloud dir, and the network panel can lie about them.** In Will's Chrome,
  downloads save to `~/Library/Mobile Documents/com~apple~CloudDocs/cloud/downloads/`, NOT `~/Downloads`,
  which is where a "missing" export zip is. For the export Worker specifically, the
  network panel shows phantom/transient 503s while the stream actually succeeds; `wrangler tail
  partyreel-export` is ground truth for whether the Worker was invoked and what it returned (a bad HMAC is
  a clean "Forbidden", never a 503).
- **Isolated-world DOM + timing artifacts.** Because the MCP executes in an isolated world, buffered or
  just-painted state can be missing and timing/race effects can read as failures. Perf measurement hits the
  same caveat: an LCP read from the isolated world is not the LCP the page actually painted.
  - **Clicks aimed during an ENTER animation miss (real Chrome too).** `find`/ref clicks and any
    coordinates read while a menu/panel is still animating in aim at the MID-FLIGHT rect (a
    cross-slide can leave a nav link 250px right of its settled spot, and the click then "dismisses
    the menu, no navigation", which looks exactly like a product bug). Wait for the enter to settle, re-read
    `getBoundingClientRect`, then click.
  - **`javascript_tool` writes don't cross into the app's world.** A `document.documentElement.style.set
    Property('--x', …)` (or any DOM mutation) from `javascript_tool` does NOT reach the app's MAIN-world
    `getComputedStyle` readers (e.g. a hook's runtime `readMs`), so you cannot inject a CSS var to widen or
    slow a JS-read animation for easier capture. Reading inline style back
    in the SAME call + CSS-read vars DO reflect; only the cross-world *app* read is blind. Drive the real
    control instead (a slider, a click).
  - **Capturing a transient animation: use ONE `browser_batch`.** A sub-second beat/exit is gone before a
    SEPARATE screenshot tool call lands (each round-trip is ~1.5-2s, so it overshoots even a 1s window). Put
    the trigger + a short `wait` + the `screenshot` in a SINGLE `browser_batch` (in-browser-sequential →
    minimal latency) to land mid-animation; or assert the MECHANISM deterministically (computed
    `transition-delay`/`-duration`/the data-attr per element) instead of chasing the frame.
  - **An animated route can SCREENSHOT as dimmed/empty while the DOM is fully visible.** The MCP
    screenshot shows only a faded header (form area black) AND `getBoundingClientRect`
    on a control returns `0,0,0,0`, yet the computed styles up the whole tree are `display:block/flex`,
    `opacity:1`, `visible`, with real heights. So the page IS rendered for a real user; the CAPTURE is the
    liar, and "clicks" land on nothing because the tool's view is off. Verify visibility via computed style on
    the element + ancestors (not the screenshot), and for the interaction itself hand the human the 10-second
    look. Don't "fix" working UI chasing the dimmed frame.
    A third costume: frames come back with the page's TEXT LAYER
    missing entirely (also all-black and all-white frames) while `elementsFromPoint`, `getComputedStyle`
    and `getBoundingClientRect` all agree the type is painted, opaque and topmost. Forcing a repaint
    (any style write) or simply taking a SECOND screenshot returns the true frame, so never treat one
    screenshot as evidence that something is absent.
    ★ A FOURTH costume: the second-screenshot trick stops working entirely once the pane is HIDDEN
    (`innerWidth` reads 0 and every capture comes back black) and `resize_window` silently no-ops on
    the Chrome side while reporting success. It ALSO no-ops for the Chrome MCP whenever the tab is a
    background tab, which is its normal state (`innerWidth` never changes). To measure a narrow
    layout anyway, append a same-origin `<iframe>` at the width you need and read its
    `contentDocument.documentElement.scrollWidth` against `clientWidth`; to reproduce Windows, where
    `100vw` includes a classic scrollbar, inject `::-webkit-scrollbar{width:17px}` into the iframe,
    which forces classic scrollbars even on macOS Chrome. That is how a sideways-scroll defect is
    found and how its fix is verified. DOM reads stay honest in both. When neither browser will
    paint, stop fighting them and verify geometry + computed style by hand, then look at the
    DEPLOYED preview, where both have always worked.

- ★ **A BROWSER EXTENSION IN THE CHROME PROFILE MANUFACTURES A HYDRATION MISMATCH.**
  The dev overlay reports "1 Issue" on every marketing page and React's
  report points at a component's `className` with a `+`/`-` pair, which reads as a real SSR/client
  divergence on SHARED CHROME, on a file you just edited. It is neither. The actual
  mismatch is something like `cz-shortcut-listen="true"` injected on `<body>` by an extension (React's own message
  lists this cause last, and it is easy to skim past), and once ANY mismatch occurs React prints the
  surrounding subtree with markers on nodes that never differed. **The 10-second disproof**: compare
  the curl'd server HTML against the live `element.className`. Byte-identical means the diff is
  display noise. The other tell is that it reproduces on pages your change never touched. Confirm on
  the deployed preview (production build, extension-free): a clean console there closes it.

- ★ **A HIDDEN PANE CAN ALSO SCREENSHOT SOLID BLACK, on a page that is rendering perfectly.**
  Same `document.hidden === true` root cause as the entries above, one more costume:
  on a dark surface the forced single frame can come back as a uniform fill of the body background, so
  it looks like the page failed to render rather than like the capture failed. **Do not diagnose from
  the image.** Ask the DOM instead, which settles it in one call: read `document.visibilityState`, then
  `document.elementFromPoint(innerWidth/2, innerHeight/2)` plus the target's `getBoundingClientRect()`,
  `color` and `opacity`. If elementFromPoint returns the element you scrolled to, with a real colour and
  opacity 1, the page is fine and the capture is not.
  ★ Rule the OTHER cause out first, because it looks
  identical and it is your own bug: a scroll past `document.documentElement.scrollHeight` also yields an
  empty frame. Check `scrollY` against `scrollHeight - innerHeight` before blaming the pane; both can
  be true at once, and the overshoot is the one worth fixing.
- ★ **AN OCCLUDED TAB NEVER DELIVERS THE FIRST IntersectionObserver CALLBACK.**
  With `document.hidden === true`, anything revealed ON ARRIVAL stays at its hidden rest
  state forever: a hero's h1 reads `opacity: 0` with `.is-shown` absent, minutes after load,
  on a page that renders perfectly for a human. This is the NASTIEST of the family, because it is
  indistinguishable from the arrival-default bug (design-system.md, bible 13), and the honest
  reading of the measurement is "the H1 never paints." **One scroll disproves it** (a scroll forces a
  delivery, and `.is-shown` lands immediately). Reveals further down the page fire normally, because
  scrolling to them IS the nudge, so the symptom is oddly selective, which makes it more convincing,
  not less. Sibling of the suspended-rAF trap; check `document.hidden` before believing either.

- **`read_console_messages` returns an ACCUMULATED buffer, not the current page's.** Reading it right
  after navigating to a second origin returns the FIRST origin's errors, which reads as "the bug
  followed me to prod." Check the URLs inside the messages before
  believing what page they came from.

**A JS-driven loop photographs as an empty stage in a driven tab.** An occluded real-Chrome window
suspends `requestAnimationFrame` completely (measured:
0 frames in 2.9 s), so a rAF-driven animation never leaves its first frame there; the Browser pane
keeps ticking rAF while hidden but its screenshots go stale and desync from the page's own scroll;
and a hidden tab sets a lab board's `data-paused`, so the loops and the clips pause by design. None
of it is a product bug. The way through: make the loop a pure function of elapsed time so it can be
frozen at a chosen elapsed and the still shot, verify the DOM (the nodes, their rest-state
declarations, the h1), and hand the human the foreground look for the motion itself.
- ★ **The Browser pane delivers no IntersectionObserver callbacks** (measured 2026-09-16: an observer on a
  plainly intersecting element never fired), so every lab frame that mounts on approach
  (`useMountOnApproach`, `Frame`'s `onApproach`) stays unmounted under that tool and a board with such
  frames reads as empty there. Judge those boards in Chrome or on a real screen; the smoke's route
  half is unaffected (it reads server HTML).

## Long-lived-session tests (the presign-roll soak)

Testing "the album survives the evening" (refreshed presigns adopted as the 30-min stable bucket rolls)
has TWO setup traps that both produce a false "broken" reading, and neither is a product bug:

- **A HIDDEN tab never polls, on purpose.** `live-gallery.tsx` stops the fallback poll interval on
  `visibilitychange` (frugality + correctness) and calls `refresh()` immediately when the tab returns to
  visible. So a backgrounded soak tab collects ZERO polls, never adopts refreshed URLs, and looks dead after
  ~90 min. The soak tab must stay **foregrounded** for the whole window (which is also the real scenario:
  a host leaving the album up on a screen). Verify the setup mid-run with
  `performance.getEntriesByType("resource")` filtered to `/api/guests/gallery` — zero entries means the tab
  was hidden, not that the poll is broken. The return-to-visible refresh is itself the recovery path worth
  asserting: a phone that sleeps past the expiry repaints on wake.
- **The DEMO event cannot test it at all.** `liveEnabled` is false in demo mode ("the curated media is static
  and the simulated tiles are local-only, so skip it entirely"), so the demo `/e/` link never polls no matter
  what. Run the soak on a REAL test event's link.

## Dev-server CSS (localhost only)

- ★ **`next dev` can serve STALE Tailwind CSS, and there are THREE causes. The first is that TURBOPACK
  REUSES CHUNK FILENAMES.** Dev chunk URLs are not content-hashed
  (`[root-of-the-server]__0l0bs12._.css`), so any browser holding that URL in cache, including one
  that last saw it from a DIFFERENT WORKTREE on the same port, happily serves you another tree's
  stylesheet, or a truncated one. The symptoms are all "correct code
  against a stale bundle": a brand-new utility with no effect (every class that "works" pre-exists
  elsewhere in the
  repo, which is what makes it invisible), "the class is in the DOM, the breakpoint matches, and no
  rule exists", a hydration mismatch, and
  `w-[52%]` computing to `0px` while a `grid-cols-[repeat(auto-fill,…)]` collapses to one full-width
  column. It reaches the SERVED PAGE too, not just CSS: correct markup in
  `curl` while the browser renders the previous layout, fixed instantly by a `?v=2` on the URL.
  **It bites the CLIENT JS the same way: the Chrome MCP tab keeps
  serving its cached page chunk (`…_src_<hash>._.js`, path-hashed, so the name survives an `.next`
  wipe + restart) while the server's HTML is fresh, and React reports a hydration mismatch whose
  `+` (client) lines carry the OLD classes and whose `-` (server) lines carry the NEW ones. Read
  that diff direction before touching code: `+` client / `-` DOM. `curl` the page + the chunk to
  prove the server is right, or check the Browser pane (its own cache); then in the tab
  `fetch(url, {cache: "reload"})` every `/_next/static/chunks/*.js|css` referenced in the HTML and
  `location.reload()`.**
  **A third cause is TURBOPACK'S PERSISTENT CACHE (`.next/dev`):** a rule added to
  `globals.css` while the dev server runs never reaches the served stylesheet, and a `preview_stop` +
  `preview_start` restart serves the SAME hashed chunk without it (Tailwind's own compiler emits the
  rule fine). `rm -rf .next/dev` between the stop and the start is the fix; do that after any
  edit to `globals.css`, `theme.css` or the lab's `design.css` before trusting what the pane shows.
  A `touch` on the sheet does not clear it.
  **The lab guards itself** (`src/components/lab/lab-chrome.tsx`): `design.css` declares
  `--lab-css-generation: N` on `.lab-shell` and `lab-css-generation.ts` holds the same N; the chrome
  reads it after mount, reloads once in development when it is old (a `sessionStorage` flag stops a
  loop) and otherwise shows a `role="alert"` strip. The strip after a reload means the SERVER's copy
  is stale (the `.next/dev` cause above), not the browser's. Bump both numbers together when a
  shell rule changes; `pnpm lab:smoke` also refuses a lab page whose stylesheet set lacks the shell.
  **A stage that ignores its tiles is invisible to the smoke** (it answers 200 and weighs the same
  words): `pnpm lab:demo` (`scripts/lab-demo.mjs`, real Chrome over its DevTools protocol, no new
  dependency) presses every open step's pictured options and fails a stage that moves less than 0.1
  percent, reading the FRAME rather than the label over it (the label names the pressed option, so it
  moves on a frozen stage too) and re-reading a motion-only step by the animations it declares. ★ A
  headless `--screenshot` cannot scroll (a fragment URL paints black, a tall window stretches a 100vh
  hero); the same protocol gives a scrolled, lossless capture, which is how subtle light is judged.
  **The second cause is an ORPHANED SERVER.** `preview_stop` does not reliably reap `next-server`,
  so an orphan can keep winning the port and serve a bundle compiled before your files existed,
  which is why restarts and even an `.next` wipe can appear not to help. Its ugliest face is a page
  that renders with NO stylesheet at all, because the prerendered HTML references chunk hashes the
  running server no longer has (they 404/500).
  **The fixes, cheapest first:** add a unique query param to the URL (or to each
  `<link rel=stylesheet>` href), which is a fresh URL with no restart and works mid-session; confirm exactly ONE
  server owns the port (`ps aux | grep "[n]ext-server"` and
  `lsof -nP -iTCP -sTCP:LISTEN | grep 3000`, else `pkill -f next-server` and start one); use a port
  no sibling worktree has used; or verify on the preview deploy. **Never run `pnpm build` while any
  server is up**, because it rewrites `.next` underneath it and produces the same stale-hash 404s.
  **The 5-second ground truth** is the build, not the dev server:
  `grep -r "<value>" .next/static/chunks/*.css` (CSS escapes `%` as `\%` and `/` as `\/`, so grep
  the escaped form or you will "prove" a class is missing when it is there). A new-to-the-repo
  utility with no effect in dev is NOT proof the class is wrong; never rewrite working classes
  chasing dev.

- ★ **`rm -rf .next/cache` is NOT enough, and the tell is a stylesheet that is TRUNCATED rather than
  stale.** Turbopack's dev output lives in **`.next/dev/`**, which the `cache`
  wipe does not touch, so a restart can serve a chunk that is minutes old (its mtime looks
  fresh) and still be missing part of your CSS. The symptom is surgical: the first thousand lines of
  `globals.css` present in the served chunk and a whole later engine block absent, so `[data-glw]`
  computes `position: static` and every lamp, including the
  SHIPPED footer one, silently renders as an unstyled div. It reads exactly like a CSS syntax error
  you just introduced. **Rule it out in 30 seconds before touching source:** the production build is
  ground truth (`grep -c data-glw` in `.next/static/chunks/*.css`), and
  the source's own brace balance is checkable in a few lines of python. Then `rm -rf .next` (the whole
  directory, not `cache`) and restart.

- ★ **A bare modern CSS value can be DROPPED by the build's minifier, so read the compiled chunk
  rather than the source.** Lightning CSS (via Tailwind v4) compiles against the configured browser
  targets and removes a declaration no target supports: a bare `overflow-x: clip` does not survive,
  and only the copy inside `@supports (overflow: clip)` reaches the chunk. The `@supports` block in
  `design.css` is therefore load-bearing, not belt-and-braces; deleting it as a duplicate removes the
  rule entirely, with no error and no failing test. Before believing a lone modern value shipped,
  grep the compiled chunk for it (`grep -r "overflow-x:clip" .next/static/chunks/*.css`), never the
  source.

- **The Preview MCP starts the dev server in the SHARED git root, not your worktree.** `preview_start`
  resolves the project by git common dir, which every worktree shares, so from `../partyreel-wt/<track>`
  it runs `pnpm dev` in `/Users/gibby/local/ai/partyreel` (the Orchestrator's checkout) and serves
  THAT branch. The tell is a 404 on a route you just wrote, or a page missing your change; confirm with
  the first line of `preview_logs`, which prints the cwd. Verifying against it is worse than not
  verifying, because it looks like a pass. **From a worktree, run `pnpm dev -p <unused port>` via Bash
  instead** (the one standing exception to "never use Bash for dev servers": the managed path cannot
  reach your tree), then drive it with `navigate` / `read_page` / `javascript_tool` as usual, and pick a
  port no sibling worktree owns (the orphaned-server trap above).

- **`next dev` can render paper surfaces DARK under a dark session theme.** With `html.dark` present
  (system-dark + no stored theme), Turbopack's dev CSS ordering lets the dark token block beat the
  `.surface-paper` re-light, so a PaperChapter (and the whole `(paper)` route group) shows dark tokens
  and the pricing pair's ink inversion flips white. **The production build resolves correctly**
  (a preview with `html.dark` gives paper `lab(98.84)`), so this is a dev-only capture lie, not a
  product bug; do NOT "fix" theme CSS chasing it. Verify paper surfaces on the preview deploy, or set
  an explicit light theme on the localhost origin first. Its companion trap: a STORED
  `theme` in an origin's localStorage (from past app testing) masks system-theme behavior entirely,
  and an origin can carry one for weeks of walks.

## Vercel preview chrome

- **The dev Toolbar overlaps the UI and does not exist for real guests.** Vercel injects a dev **Toolbar**
  for logged-in team members (a floating circle on the right-middle edge) that overlaps app UI but is
  invisible to real, logged-out guests. Don't treat it as a layout bug or let it block a click: navigate by
  keyboard, or dismiss it. Anonymous curl / real guest sessions never see it.

- **Agent `lp/*` preview origins mislead in three ways; none are product bugs.** (1) They are in NO
  Supabase/R2/Stripe allow-list, so sign-in, upload, email round-trips, and checkout fail there BY DESIGN;
  the policy home is CLAUDE.md "Local dev vs. live testing", and those flows are red-teamed on the
  launch-prep alias.
  (2) They build with the UNSCOPED preview env: `NEXT_PUBLIC_SITE_URL` inlines to the prod URL (absolute
  QR/share/OG links point at partyreel.com) but `DESIGN_PREVIEW_KEY` IS present on the UNSCOPED
  `preview` target as well as the `@launch-prep`-scoped one, so **the `/design` lab opens on any `lp/*`
  alias** with `?key=` (200 with the key, 404 without) and an Agent can hand Will a
  lab round for a ruling straight off its own branch preview. Confirm scope with
  `GET /v9/projects/partyreel/env` rather than assuming. (3) Each alias is a FRESH origin with no stored
  `theme` in localStorage, so system-theme behavior can differ from the long-lived launch-prep origin
  (the stored-theme trap above).
