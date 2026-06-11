# V1 perf baseline (pre-Phase-3)

> ROLE: the measured "before" that Phase 3+ wins are judged against, with the exact repeatable
> methodology. Re-run the same commands after each architecture phase and append a dated column to
> the tables (this file is the one exception to edit-in-place: baselines accrete by date so deltas
> stay visible).

**Baseline date:** 2026-06-11 · **commit:** `adc3f0c` (Phase 2 slices 1-4 live) ·
**deployment:** iad1, Next 16.2.6/Turbopack.

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
