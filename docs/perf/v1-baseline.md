# V1 perf baseline (pre-Phase-3) + the Phase-3 after-column

> ROLE: the measured "before" that Phase 3+ wins are judged against, with the exact repeatable
> methodology. Re-run the same commands after each architecture phase and append a dated column to
> the tables (this file is the one exception to edit-in-place: baselines accrete by date so deltas
> stay visible).

**Baseline date:** 2026-06-11 · **commit:** `adc3f0c` (Phase 2 slices 1-4 live) ·
**deployment:** iad1, Next 16.2.6/Turbopack.

## PHASE 4.5 NOTE (2026-06-12, the arrival experience)

`/e/[token]` wire JS: **571 KB br** (vs 562 KB at the Phase-4 close, +9 KB): the Vaul drawer +
the arrival machinery (shell, step container, beat/hold hooks, reveal curtain). The heavy entry
content stays in the lazy entry chunk; the steady-state poll numbers are untouched (no
gallery-route changes this phase).

## PHASE 4 NOTE (2026-06-11, the guest redesign)

The guest page was rebuilt to the ratified spec (masonry, in-gallery upload tiles, adaptive entry
sheet, floating-pill lightbox, empty state). Bundle impact is essentially FLAT — `/e/[token]` wire
JS is **562 KB br** (vs 561 KB at the Phase-3 close): the redesign's new code (masonry, the upload
bridge, the entry sheet) roughly offsets, and the heavy chunks (lightbox, entry modal) were already
interaction-deferred in Phase 3. The empty-state ghost mosaic adds ~60 KB of one-time WebP only on
0-media events (9 purpose-sized grayscale tiles). The doorbell/ETag/poll machinery is unchanged, so
the section-2 poll numbers below still hold. No new blocking awaits on the page (stats is a single
cheap column select; the gallery still streams).

## PHASE 3 AFTER-COLUMN (2026-06-11, commit `2322299` live)

Same methodologies as below; the seeded event carried 3 fake rows + 1 real uploaded photo (4 items)
vs the baseline's 60, so absolute payloads aren't comparable — the structural deltas are.

| Metric | Pre-Phase-3 | Post-Phase-3 | Note |
| --- | --- | --- | --- |
| Steady-state poll (no change) | 200, 74.6 KB, 120 presigns, p50 509 ms, every 12 s | **304, 0 B, 0 presigns, p50 331 ms / p90 427 ms, every 60 s** | the structural win: ~25× fewer polls, each free of payload+presigns; the residual 331 ms is the DB roundtrips (event + access + rows), as predicted — the ≤150 ms aspiration was optimistic |
| Change propagation | next 12 s poll | **doorbell <1 s** (live upload → open tab 1.0 s; local moderation flip 840 ms) | Realtime broadcast + leading-edge coalescer |
| Full-payload cadence | every poll | once per 30-min presign bucket (the ETag rolls with it) | URLs stay browser-cacheable within the bucket |
| `/e/[token]` wire JS (br) | 567 KB | **561 KB** | the lightbox (~700-line gesture machine), entry modal, and admin recharts now load OFF the critical path (interaction-deferred chunks); the eager-set byte drop itself is small — the win is when work happens, not total bytes |
| `/e/[token]` TTFB / DCL / load (med, n=5) | 56 / 776 / 1055 ms | **51 / 496 / 703 ms** | streaming shell (gallery no longer blocks first byte on 2-per-item presigns) + splits |
| `/` wire JS | 439 KB | 439 KB | untouched, as expected |

Doorbell-to-render methodology: a MutationObserver inside the open page timestamps the DOM change;
the trigger time comes from the DB (`now()` on the mutating statement) or the upload `complete`
response time — immune to the observer's own polling latency.

## 1. First-load JS per route (brotli wire bytes, live)

Turbopack's `pnpm build` no longer prints the webpack-era First Load JS table, so the baseline is
real wire bytes from production.

Methodology: fetch the route HTML, collect `<script src="/_next/static/...">` URLs (dedup), fetch
each with `Accept-Encoding: br` and sum `%{size_download}`. Anonymous curl (no Vercel toolbar, no
auth).

```bash
# repeatable: zsh; while-read because zsh doesn't word-split
measure() {
  local route="$1"; local total=0 n=0
  while IFS= read -r c; do
    [ -z "$c" ] && continue
    local sz=$(curl -s -o /dev/null -w "%{size_download}" -H "Accept-Encoding: br" "https://partyreel.com$c")
    total=$((total + sz)); n=$((n + 1))
  done < <(curl -s --compressed "https://partyreel.com$route" \
    | grep -o 'src="/_next/static/[^"]*\.js"' | sed 's/src="//;s/"$//' | sort -u)
  echo "$route scripts=$n wireJS=$((total / 1024))KB"
}
```

| Route | Scripts | Wire JS (br) |
| --- | --- | --- |
| `/` (marketing home) | 20 | 439 KB |
| `/pricing` | 20 | 438 KB |
| `/help` | 20 | 439 KB |
| `/login` | 23 | 528 KB |
| `/e/[token]` (guest event) | 27 | 567 KB |

Reading: the ~439 KB marketing floor is the shared app baseline (React 19 + the root client tree);
the guest page adds ~128 KB (gallery + lightbox + upload machinery). Phase 3 (delivery
architecture) and Phase 4 (guest decomposition) target the guest column first.

## 2. Guest gallery poll (`POST /api/guests/gallery`)

The hot loop of a live event (today: the page polls; Phase 3 replaces this with the doorbell +
gated refetch — these numbers are the comparison base).

Methodology: seeded event `Test Wedding` (qr `2eac1ae8...`) with **60 approved photo rows**
(disposable, canonical keys, no real R2 objects; presigning doesn't verify existence). n=21 curls,
first dropped as warm-up, p50/p90 over the remaining 20.

```bash
for i in $(seq 1 21); do
  curl -s -o /tmp/g.json -w "%{time_total} %{size_download}\n" \
    -X POST https://partyreel.com/api/guests/gallery \
    -H "content-type: application/json" \
    -d '{"qr_token":"<token>"}'
done | tail -20 | sort -n
```

| Leg | p50 | p90 | min | max | Payload |
| --- | --- | --- | --- | --- | --- |
| Local dev → real Supabase/R2 | 601 ms | 695 ms | 493 ms | 763 ms | 74,576 B |
| Live (partyreel.com, iad1) | 509 ms | 632 ms | 415 ms | 843 ms | 74,576 B |

Per poll at 60 items: **120 presigns** (url + downloadUrl per item), ~74.6 KB JSON, full payload
re-sent every poll regardless of changes. All URLs carry `X-Amz-Signature`; zero raw keys
(invariant re-verified at measurement time). This is exactly the waste the doorbell + ETag/304
design removes: the Phase 3 target is a ~0-byte 304 on the no-change path and presigns only on
actual refetch.

## 3. Live page metrics (Chrome, signed-in profile)

Methodology: Chrome MCP on partyreel.com, `PerformanceNavigationTiming` after each of n=5
`location.reload()` cycles, medians reported. Guest event page = the seeded event above;
`/dashboard` = the signed-in test host.

**LCP caveat:** the Chrome MCP executes in an isolated world where buffered
`largest-contentful-paint` entries don't replay, so LCP is NOT in this baseline (tool limitation,
verified empirically). It would also be unrepresentative here: the seeded tiles have no real image
bytes. When Phase 3 needs LCP, measure with DevTools/Lighthouse on a gallery seeded with real
objects.

| Page | TTFB (med, n=5) | DCL (med) | loadEventEnd (med) |
| --- | --- | --- | --- |
| `/e/[token]` (60 items) | 56 ms | 776 ms | 1055 ms |
| `/dashboard` | 56 ms | 600 ms | 834 ms |

Raw runs, `/e/[token]`: ttfb 56/109/49/55/106 · dcl 956/776/777/693/658 · load
1271/1066/1055/966/905. `/dashboard`: ttfb 51/52/58/73/56 · dcl 640/600/544/600/524 · load
1201/834/809/801/1293. (Warm CDN connection; TTFB here is connection-reuse best case, the curl
poll numbers in section 2 include full connection setup.)

## Cleanup contract

The 60 seeded media rows were deleted after measurement
(`delete from media where event_id = ... and file_size_bytes = 800000`) and
`profiles.storage_used_bytes` verified back at 0 (rows were inserted directly, bypassing the
accounting RPCs). Re-seed per the section-2 methodology when re-baselining.

## 4. Marketing nav interaction (2026-08-28, the nav round)

**Why this section is styles, not frame times.** The intended measurement was a `requestAnimationFrame`
frame-time sampler around each nav interaction. It is not possible from an agent session: the in-app
Browser pane runs with `document.hidden === true`, so rAF never fires and the sampler records zero frames
(ResizeObserver/IntersectionObserver delivery and CSS transition progress are suspended for the same
reason — see [`../systems/testing-verification.md`](../systems/testing-verification.md)). Rather than
invent numbers, the round measured the MECHANISM: the computed styles that decide whether a frame can be
cheap, read on the cinema home at 1440x900 against the dev server, before and after. Every row below is a
`getComputedStyle` reading on the live page, not an estimate.

| What | BEFORE (`cb7d421`) | AFTER |
| --- | --- | --- |
| Panel box transition | `all` / **100ms** / `ease` (nothing set `transition-property`; only `duration-100` was present, so it sat at the CSS initial value `all`) | `none`, armed to `width, height` / **200ms** / `--ease-emphasis` only on a panel→panel swap |
| Panel enter animation | `enter` **250ms** `ease` | `enter` **200ms** `cubic-bezier(0.23,1,0.32,1)` (= `--ease-emphasis`) |
| Panel enter opacity | `--tw-enter-opacity: 1` (**no fade** — a large opaque panel popped in) | `0` |
| Panel exit | 150ms, `--tw-exit-opacity: 1` (**no fade** — it snapped away) | 130ms, `--tw-exit-opacity: 0` |
| `transform-origin` | `50% 50%` (`origin-top-center` is not a Tailwind utility) | `calc(50% + <trigger delta>) top` — measured per open, so the panel grows out of the hovered label |
| Radius / shadow | `2px` (= `--radius`, the SHARP general-UI radius) / a raw `shadow` **drawn in dark mode** | `8px` (`rounded-float`) / `shadow-float`, which resolves to none in dark |
| Cross-slide | 208px (`slide-in-from-right-52`), 150ms, no blur | 32px token (`--mkt-dropdown-swap-distance`), 200ms — the SAME clock and curve as the box — plus a 3px blur |
| Panel-row hover | `all` / 150ms / `cubic-bezier(0.4,0,0.2,1)` (~64ms to half-visible, which is why a fast skim missed rows) | `color, background-color` / **90ms in, 180ms out** / `--ease-emphasis` |
| Ancestors with `backdrop-filter` above a panel row | `[HEADER]` — every hover repaint happened inside a `blur(8px)` region | **none** — the glass moved to an inert `-z-10` sibling layer |
| Header state change | `background-color, border-color` 200ms **with `backdrop-filter` snapping outside the transition** | `opacity` 200ms on the glass layer; the bar itself is `backdrop-filter: none` |
| Hover-open delay | Radix default **200ms**, never overridden | `--mkt-nav-intent-ms` **100ms**, then instant while open (`skipDelayDuration` 500) |
| First open | viewport `0×0` for a frame (the size vars arrive from a ResizeObserver a beat late), then a snap | unchanged 0→N, but the size transition is DISARMED there, so it snaps in one frame instead of animating a wipe |

**Wire JS:** unchanged at the 439 KB marketing floor (no new dependency; the indicator is ~40 lines of
measuring in an existing client component).

**Still owed to a human session:** actual frame timings and motion FEEL, and a
`prefers-reduced-motion: reduce` pass — none of the three are judgeable from an agent session.

## 5. CSS: the library round (2026-09-02, `launch-prep`)

Method: `pnpm build` at each commit; the stylesheet hrefs read from the built home
(`.next/server/app/index.html`); per chunk the raw bytes (`wc -c`), gzip bytes (`gzip -9c | wc -c`) and
the rule count (`tr '}' '\n' | grep -c '{'`); selector deltas from `sort -u` of the split rules. The home
loads three chunks and the largest is the production entry (`globals.css`); the other two (5,097 and
25,858 bytes: the root and marketing sheets) did not change across the round. Repeat with the same
commands; the numbers are the built files, not the deployed (brotli) wire bytes.

| the home's main stylesheet | raw bytes | gzip -9 | rules | lab-only marker (`-inset-14`) |
| --- | --- | --- | --- | --- |
| base `e45efea` (before the round) | 304,277 | 42,084 | 3,150 | 1 |
| after the cut `3e0dfa7` (26 boards, the screens mirror, the event-feed prototype, the sample pack gone) | 275,472 | 39,143 | 2,803 | 1 (the name quoted in ROADMAP, scanned as a class) |
| after `@source not` for the lab and docs, with the theme split (`globals.css` + `theme.css`) | 265,358 | 37,790 | 2,664 | 0 |

On the wire (brotli, `curl -H 'Accept-Encoding: br'` against the built chunks): the same stylesheet
went from 42,402 bytes on prod at milestone-16 to 38,287 at milestone-17.

Selectors: the cut removed 354 and added 7; the scan exclusions removed a further 144 and added 5
(regrouped rules). Net for the round: **38,919 raw bytes (12.8 percent) and 4,294 gzipped bytes (10.2
percent) off every production page.** The lab now carries its own sheet, compiled from a scan of the
lab alone and loaded only under `/design`: 48,511 raw, 8,357 gzipped, 637 rules. Why the theme split:
a lab entry that `@reference`s `globals.css` inherits its `@source not` and compiles 19 rules; against
`theme.css` alone it compiles 695 (PostCSS probe before landing).

## 6. Vercel storage: the cost round (2026-09-11, `launch-prep`)

Method: `node scripts/design-rules/..`-style measurement of the real trace files, not an estimate.
For each `.next/server/app/**/*.nft.json`, resolve every listed path against the trace's own
directory, `stat` it once, and union the results across all 113 route bundles; that union is what one
deployment stores, since the project runs Fluid compute and Vercel reports a single lambda. Build with
`NOW_BUILDER=1 pnpm build` to reproduce Vercel's own build conditions, because Next's trace ignores
branch on that variable. Repeat with the same commands.

| one deployment's traced union | files | bytes | sharp and `@img` |
| --- | --- | --- | --- |
| before, either build | 2,212 | 51.1 MB | 36 files, 16.6 MB |
| after `outputFileTracingExcludes` (`4abfa60`) | 2,150 | 34.4 MB | 2 symlinks, 288 bytes each |

**Net: 16.6 MB (32.7 percent) off every deployment.** Why it was there at all: Next already ignores
`**/node_modules/sharp/**` and `**/@img/sharp-libvips*/**` when `hasNextSupport` is true (that is
`NOW_BUILDER`, i.e. a Vercel build), but only in `serverIgnores`, which builds the `next-server`
trace. The per-route `.nft.json` files are filtered by `routesIgnores`, which does NOT carry those two
entries, so a Vercel build still traced every byte into all 113 bundles. An
`outputFileTracingExcludes` key that matches the literal string `next-server` is folded into
`sharedIgnores` and therefore reaches both, which is why the key is `"**"` rather than `"/**"`.

What was NOT a problem, measured so nobody re-derives it: the design lab's 13 routes cost 2.5 MB
marginal and admin's 16 cost 1.5 MB, because the traces overlap almost entirely (moving either to its
own subdomain is an architecture decision, not a saving). Server source maps never ship: `serverIgnores`
carries `**/*.map` unconditionally, and Sentry's `deleteSourcemapsAfterUpload` defaults to true with the
upload credentials set on Vercel, so the 79.6 MB of maps in a local `.next` is a local-only artifact.

Deployment COUNT dominated all of it: 381 retained, 183 on branches deleted weeks earlier and 176 on
`launch-prep`, which built on every push. The gate now builds `launch-prep` only on `[preview]` and
`scripts/prune-vercel-deployments.mjs` deletes what no branch can reach. Retention was cut the same
day to 7 days for previews, 1 day for canceled and 1 day for errored, with production left at 30 (the
instant-rollback window) and 10 kept per branch. **44 deployments remain**, 22 of them production
history on `main`, and a dry run classifies every one as keep.

