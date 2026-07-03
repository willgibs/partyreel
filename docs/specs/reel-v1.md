# Highlight Reel — V1 spec (the North Star feature)

> ROLE: the agreed product + architecture spec for the Highlight Reel, written DURING discovery (2026-06-22),
> BEFORE the build. The source of truth until the feature ships, after which [`../systems/host-app.md`](../systems/host-app.md)
> + an ADR become the current truth and this becomes historical.
> BELONGS HERE: the settled product shape, the architecture + data-flow, the cost model, scope (v1 vs deferred),
> the open spike items. · NOT HERE: the build plan (a plan file), implementation detail.
> GROWS BY: refine in place during planning; supersede when the feature ships.

> **STATUS (2026-07-02):** Slices 1-3 (spike / composer / `.mp4` export) ✅ 2026-06-22, **AND Phase 2 — the STYLE
> CATALOG (8 media-first moods + 6 stylized treatments) + a portrait/landscape ORIENTATION, wired into the composer,
> DB, and export — ✅ SHIPPED + live-verified 2026-07-02** (`923457b`/`0cfcc4f` + render fixes `b6d1767`/`fafba3c`;
> shuffle REMOVED). **Current truth lives in [`../systems/host-app.md`](../systems/host-app.md) "Reel composer" + the
> `project_reel_generation_spec` memory + [`../systems/design-system.md`](../systems/design-system.md)** — read those
> for how it works now. **The NEXT slices, fully specified for a fresh agent, are in ["Next slices — roadmap"](#next-slices--roadmap-for-the-next-agent-2026-07-02) below.** The older sections (Customization, Open items) are HISTORICAL
> (they predate the catalog + describe the removed shuffle); the roadmap section supersedes them.

> **★ ARCHITECTURE SUPERSEDED (2026-07-03, Will's ruling after AWS denied the Lambda concurrency case):** the
> RENDER architecture below (Remotion Lambda, the cost model, Slice A blur-downscale, the framesPerLambda
> gotchas) is being REPLACED by **client-rendered reels**: the 14 styles rebuilt on a canvas engine (one draw
> fn = live player AND export), mp4 encoded on-device via WebCodecs + mediabunny, host uploads the artifact →
> **$0 renders at any scale; AWS tears down at the end**. The styling DIRECTIONS (the 14 looks) are sacred and
> port with per-style parity gating. Spike PASSED on iPhone 13 Pro (30s → 8.2s, 3.6× realtime) + desktop
> (2.9s, 10.4×) at `/design/reel-spike`. The Remotion path keeps working UNTOUCHED until the port completes.
> Design + phasing: the elevation-program plan (`~/.claude/plans/you-are-the-standing-humble-unicorn.md`,
> "R2 revised design") + the `project_elevation_program` memory. Do NOT build new work against the Lambda
> pipeline. Guest-surfacing product recommendations: [`../decisions/t1-reel-guest-surfacing.md`](../decisions/t1-reel-guest-surfacing.md).

## What it is + why

The reel is **core-loop step 5** and the product's North Star: a host curates their event's best moments and gets
an **auto-magical, shareable highlight reel** that makes the event "get likes on social." The positioning Will
ratified: the **"wow in between."** NOT a pro video editor (serious editors export to CapCut), NOT a toy — an
*everyone* tool (incl. low-savvy + old devices) whose value is the **wow**, not pro control. Reel curation already
shipped (R1-R3 + bulk-select + drag-reorder); this spec is the **generation** that was always "scaffold-only in v1,
real pipeline later."

## The experience (product)

1. **Curate** — the host's ordered media (the shipped add-system: tile/lightbox/bulk `Add to reel` → `reel_items`),
   OR a one-tap **empty-state auto-fill** that seeds the reel with a *random batch from the gallery* (shown only
   when the gallery has enough). Zero-to-reel in one tap, then refine.
2. **Compose** — a **live in-browser player** renders the reel from **preview images** ($0, instant, universal).
   Customization is **theme + shuffle + cover + length** (below) — auto-magic first take, no timeline, no knobs.
3. **Watch** — that *same* live player is the in-app viewing surface for host *and guests*. $0 per view, any device.
   (For reels with video, see "Video" — the encoded mp4 may serve as the in-app video once it exists.)
4. **Export** — **lazy** server encode to a vertical `.mp4` on the **first** download (full quality, watermark on
   free), cached in R2 + served to everyone after. Reuses a reel-flavored **Download-all modal** for context +
   progress + confirm; the encode is a background job, so the host can leave and **return to download anytime**
   ("Stitching your reel…").
5. **Reveal** — the create→watch "wow" moment. **To be concepted in the design lab** (instinct: a brief "weaving
   your highlights…" beat, then the reel autoplays full-bleed as the centerpiece — the first watch IS the wow).

## Customization = shuffle, not a timeline (the magic-and-cheap convergence)

Customization is **curated randomness**, never sliders:
- **Theme** (host-selectable — a wedding can pick elegant *or* hype; we never auto-assume) · **Shuffle**
  (re-roll the auto-magic take) · **Cover** (opening shot) · **Length** (auto, capped by tier).
- Every **shuffle = a new seed** → the live player instantly re-renders a genuinely different take. **Infinite
  takes at $0**, because nothing encodes until a download — the host rolls the perfect version for free, forever;
  only the one they export costs an encode. Fewer knobs ⇒ fewer distinct versions ⇒ less encoding ⇒ cheaper AND a
  better first experience (Will's insight: cheaper and better pull the same way).

### Themes + per-reel uniqueness

A **theme is a style kit**, not a single look: a motion vocabulary (Ken-Burns directions/speeds), a transition set,
a pacing rhythm, a color grade/overlay, an intro/outro treatment. A **per-reel seed deterministically samples
within the kit** (which transition between each pair, each shot's pan direction, the pacing accents). Same theme +
different seed = a distinctly different reel — so a weekly "Run Club NYC / Hype" reel never feels like a copy.
Deterministic so the live player and the encoder match and a re-view is stable; **"shuffle" rolls a new seed.**

## Video (Pro-only, self-bounding)

Only Pro can upload video, so **"video in the reel" is automatically Pro-only and revenue-backed** (free reels are
stills-only with zero special-casing). Will's bar: video must make the reel feel *more* alive, NOT be an excuse to
play it safe creatively.
- **Video preview + custom trim in v1** — the host sees the real clip and sets BOTH the in-point (which part) and
  the duration (how long it plays). Clean, clear, not janky. Trim home: the dead-scaffold `clip_start_seconds` /
  `clip_end_seconds` columns (reserved for exactly this).
- **Render:** the theme applies **motion to stills, transitions + grade to clips** (the clip plays, it isn't
  Ken-Burns'd). Stills sourced from previews; **video clips sourced from the originals** at export (no new asset).

## No music

Dropped (too personal per event to guess; timing visuals to music is a trap). The export is a clean **silent
motion-montage** — which matches Reels/TikTok culture (users add trending audio on-platform when they post). The
in-app wow is carried entirely by **visual** polish.

## Tier

Reel **generation is FREE for everyone** (the shareable growth loop; free hosts taste the full app → upgrade for
video + storage + customization, which feed *richer* reels). **One reel, all tiers** (the highlight pinnacle; keeps
the add-system clean).
- **Free:** full generation · all themes · shuffle · in-app player · **full-quality export** (NOT gated — a janky
  free reel reads as a mediocre product, hurting upgrades) · **corner watermark** · shorter max length.
- **Pro:** **no watermark** · **longer length** · video clips in the reel.
- The **watermark pulls double duty**: an upgrade nudge AND free marketing (every shared free reel carries the
  brand). Exact free-vs-Pro **length** values land pre-launch.

## Architecture

**Pole A hybrid** (decided): the *experience* is client-side ($0, universal); the *artifact* (the .mp4) is a bounded
server encode. **Remotion** is the engine: **ONE React composition** drives both the in-browser `@remotion/player`
preview AND the server `renderMediaOnLambda` encode, so **preview = export by construction** (WYSIWYG, no second
divergent renderer). Remotion's license is **free** for our team size (scales on team size, not users/revenue).

**Render platform = Remotion Lambda (AWS)** (ratified after a render-infra cost workflow: cost is a rounding error
on every platform, so the choice was maturity/effort vs ecosystem-purity; Will okayed introducing AWS, so the
first-party/blessed/lowest-build-risk/fastest-cold-start path wins). AWS Lambda is now a sanctioned tool for any
workload where it's the clear winner — kept minimal + justified.

### Data flow (where everything lives — AWS stays tiny)

```
OUR STACK (unchanged)                          AWS (render engine only)
R2  ├ preview WebPs ───── pull (FREE: R2 zero egress) ──► Lambda (Remotion + Chromium)
    ├ original videos (Pro clips) ─ pull (FREE) ────────►   renders frames → stitches → writes .mp4
    └ reel.mp4 (output_key) ◄──── copy S3→R2 (~$0.001) ── S3 ◄┘  (+ S3 holds the Remotion "site" bundle)
Supabase: reel config (order · theme · seed · length · cover · status · output_key)
App (CF Worker, off Vercel): triggers the render, copies S3→R2, flips status=ready
Guests/host: download reel.mp4 from R2 (presigned, FREE egress) — same path as Save / Download-all
```

The only AWS pieces: **the Lambda** + a **small S3 bucket** (the Remotion site bundle + the *transient* .mp4,
deleted after the copy to R2). Everything user-facing — media, the final reel, the config, the app — stays in our
stack. **R2's zero egress** means the Lambda pulls all source media for free; only the finished ~5-15 MB mp4 makes
one cheap hop back to R2, so every subsequent guest/host download is free.

### Encode timing

**Lazy on first export, cached** (re-encode only when the reel config CHANGES). Reels watched-in-app-but-never-
exported cost **$0 to encode, ever**. The encode is async (kick `renderMediaOnLambda` → store `{renderId, status:
processing}` → respond "generating, come back anytime"); completion lands the .mp4 in R2 + flips `status: ready`
(poll, or an S3-event → copy-Lambda → internal callback mirroring the backup-prune handshake). **Gated on the spike:**
if a real encode can't be reliably fast, video reels can fall back to encode-on-finalize (eager) while stills stay
lazy — the spike decides per type.

## Cost model

- **Per reel render:** ~$0.008-0.015 compute + ~$0.001 S3→R2 egress + fractions (S3/CloudWatch) ≈ **~1-2¢.**
  Inputs pulled from R2 = **free** (R2 zero egress).
- **Monthly:** ~**$5/mo @ 500 reels**, ~**$40/mo @ 5,000** (AWS's 400k GB-s/mo free tier absorbs much at low volume).
- **The key lever insight:** cost ≈ frame-count × per-frame work (≈ fixed); Lambda's **fan-out trades wall-clock for
  parallel compute at the same total cost**, so renders can be *fast for the user* (~15-25s) almost for free —
  speed and cost are decoupled. Real cost knobs: **length** (free cap), **fps** (24 for a montage), and **video
  clips** (the only "expensive" frames — bounded by short trims + Pro-only). Resolution 1080×1920, not gated.
- Predictable + bounded by construction; profitability guard = lazy + cache-on-unchanged-config + a re-encode rate
  limit + the length/input bounds, all behind paid revenue for video.

## Schema notes (mostly scaffolded already)

- `highlight_reels(event_id, status [pending|processing|ready], output_key)` exists — **add** `theme`, `seed`,
  `length_seconds`, `cover_media_id` (the reel config).
- `reel_items(event_id, media_id, position)` exists (the order). **Trims** → the reserved `media.clip_start_seconds`
  / `clip_end_seconds` (or move onto `reel_items` if cleaner).
- `media.reel_eligible` / `highlight_score` stay dead scaffold (a FUTURE auto-scoring worker, not v1).

## Scope

**V1:** curate (+ auto-fill) → live player → theme/shuffle/cover/length → lazy `.mp4` export (Remotion Lambda) →
in-app watch + download/share · stills + Pro video (preview + trim) · no music · 1 reel all tiers · free with
watermark+length levers · a lab'd reveal.

**Deferred (logged, not lost):** multiple reels (a Pro upgrade via a `reel_id` FK + an "active reel" context that
keeps the one-tap add) · real video playing *in the live player* (true WYSIWYG for video; v1 shows clips by their
poster in the editor) if the spike says it's too heavy · auto-generated reels · finer trim niceties · beat-sync ·
music · an auto-scoring "best clips" worker.

## Next slices — roadmap for the next agent (2026-07-02)

Everything below is written so a fresh agent can start cold. **Current shipped state** (read these for how it works
now, then start a slice): the reel is host-side complete — curate → live `@remotion/player` composer with a **14-style
picker + portrait/landscape orientation** (shuffle removed; deterministic seed) → lazy `.mp4` export on Remotion Lambda.
Truth: [`../systems/host-app.md`](../systems/host-app.md) "Reel curation … composer … export", the
`project_reel_generation_spec` memory, [`../systems/design-system.md`](../systems/design-system.md) (the treatment craft +
the lab).

### The style catalog (the 14 styles + the dispatcher — you WILL touch these)
- **8 media-first "moods"** (styleId === its themeId, all render via the shared `<Reel>`): `classic`(Cinematic),
  `warm`(Film), `punchy`(Pulse), `kinetic`(Kinetic), `editorial`(Editorial), `golden`(Sunset), `mono`(Noir),
  `dreamy`(Float). **6 stylized "treatments"** (own component; styleId → native themeId): `polaroid`→warm,
  `filmstrip`→classic, `scattered`→warm, `framed`→editorial, `carddeck`→punchy, `parallax`→classic.
- **The dispatcher (respects a LOAD-BEARING import boundary):** `src/lib/reel/composition/style-registry.ts` is **PURE**
  (`STYLE_CATALOG`/`resolveStyleEntry`/`styleThemeId`/`isTreatment`, no `remotion`) so SERVER code
  (`build-reel-props.ts`, `render-service.ts`) resolves `styleId`→theme + validates without dragging `remotion` into the
  Next server build (which breaks it — `React.createContext` undefined). `src/lib/reel/composition/style-render.tsx` is
  the **REMOTION** half (`styleComponent` + `styleDuration` + `StyleDispatch`) — client/worker only. `Root.tsx` +
  `reel-player.tsx` both render `StyleDispatch` + `styleDuration` (WYSIWYG). The `<Watermark/>` is hoisted into
  `StyleDispatch` (so ALL 14 styles stamp the free-tier mark). NEVER import the `composition/index.ts` barrel or any
  treatment `.tsx` from server code.

### Slice A — treatment render OPTIMIZATION (blur-downscale) · RECOMMENDED FIRST · small-medium
- **Why:** a treatment renders ≈ **$0.024 / ~3 min** vs a mood's ≈ **$0.006 / ~72s** (measured live: Layered parallax
  landscape 30s). The bottleneck is heavy full-frame CSS blur re-rasterized every frame — parallax's `blur(px(46))`
  wash sits right at the Lambda ceiling (it TIMED OUT at 120s; the stopgap was bumping the function to 240s). Slow UX +
  ~4× cost + free-tier abuse surface. This makes treatments render fast+cheap like a mood.
- **The technique (downscale-blur-upscale):** a gaussian blur costs ~ pixels × radius. Instead of `<Img cover
  filter:blur(46px)>` on a full 1920×1080 frame, render the `<Img>` into a container sized ~⅓–¼ with a proportionally
  smaller blur (`blur(~12–15px)` at ⅓) then `transform: scale(3–4)` it back to full-frame — ~10–16× cheaper for the
  blur pass, visually near-identical (a heavy blur has no fine detail to lose). Watch the container-edge artifact
  (oversize the downscaled element a hair + `overflow:hidden` a parent, or feather).
- **Where:** primarily `src/lib/reel/composition/treatments/layered-parallax.tsx` (the `Slide` bg wash `<Img>` with
  `blur(px(46))`, and the fg emerge/melt `blur`). Then audit the other heavy per-frame passes: `framed-gallery.tsx`
  (large layered box-shadows/gradients), the moods' halation in `clip-media.tsx` (a screen-blended blurred copy of the
  clip). **Measure first:** trigger a render per style and read `reel_render_log.duration_sec` / `render_cost_usd` to
  see which actually need it (moods are fine; likely just parallax + maybe framed).
- **Constraints:** it's the SAME composition code for the player + Lambda, so the optimization applies to both (stays
  WYSIWYG). Keep it deterministic. Confirm the visual is unchanged (compare the live player to the downloaded mp4).
- **Ship:** `pnpm typecheck && lint && test && build` → commit → deploy → **`deploy-site`** (it's a composition change!)
  → re-verify a treatment render is faster + looks identical. Then optionally drop the function back toward 120s (the
  240s can revert once treatments are cheap) — or keep 240 as headroom (a successful render bills by actual duration, so
  the higher ceiling costs nothing on success).

### Slice B — GUEST reel surfacing + download · the next FEATURE · medium-large · needs a planning round with Will first
- **Why:** the reel is host-only today. Guests reach the album via `/e/[qr_token]` but can't see/share the reel — the
  growth loop wants them to. This is the headline "NEXT" slice.
- **Product decisions to SETTLE WITH WILL up front (some are one-way doors — plan before building):** (1) is the reel
  guest-visible **always**, or **host-toggled** (a "publish/share reel" switch on `highlight_reels`)? (2) WHERE on
  `/e/[qr]` — a hero at the top, a tab, or a section in the stacked feed? (3) can guests **download the mp4**, or only
  watch the live player? (4) if download: serve the **last host-rendered mp4** (cheap, recommended) vs let a guest
  **trigger a render** (needs anon rate-limiting + cost control — riskier). (5) confirm no host-only metadata leaks (the
  reel is the host-approved album subset, so it should be safe, but verify).
- **Architecture (follow ADR-0004):** anon guests use **capability tokens validated INSIDE security-definer RPCs** —
  NEVER direct table access. So add a new **anon-safe RPC** (mirror `get_event_media_by_qr_token`) that takes the
  `qr_token`, resolves guest access (visibility/password, reuse the existing resolution), and returns the reel config
  (`style_id`/`orientation`/`seed`/`length`/`cover`) + the ordered approved reel media → the guest builds the same
  `ReelProps` via `build-reel-props.ts` and plays the same `StyleDispatch` composition ($0, client-side, WYSIWYG). For
  **download**: the mp4 lives at the stable `reelOutputKey` `events/<id>/reel/reel.mp4`; add an anon-safe route that,
  after resolving qr_token access, presigns + serves it (only if `status='ready'`; else prompt "not ready yet" or,
  per decision (4), trigger a tightly-limited render). Reuse the existing `/e/` access resolution — the reel inherits
  the album's visibility/password gate.
- **Where:** `src/app/e/[qr_token]/` (the guest surface + a new guest reel component reusing `ReelPlayer` +
  `build-reel-props` + `StyleDispatch`), a migration for the anon capability-token RPC, an anon-safe download route.
- **Ship:** planning round (the decisions above) → build → the rolled-back anon-RPC contract test + `get_advisors` (the
  3-anon-read-RPC set is expected; the new one must be in it by design) → deploy → live-verify LOGGED-OUT at `/e/[qr]`.

### Smaller follow-ups (each a quick optional slice)
- **Lab → StyleDispatch DRY:** `src/app/(dev)/design/reel/reel-lab.tsx` still has its own `TREATMENTS` array + a
  `THEME_IDS` loop + a dev-only Shuffle button (parallel to the production catalog). Refactor it to render through
  `STYLE_CATALOG` + `StyleDispatch` so the lab shares the exact production dispatch; drop the lab shuffle. Low-risk.
- **Style-popover mini-previews:** Will's stated preference was a popover *with mini previews*, but 14 live
  `@remotion/player` instances jank hard, so the shipped popover is **labels grouped by family** and the main player is
  the live preview. Lighter path if wanted: render ONE still frame per style once → tiny webp thumbnails in the popover.
- **Drop the legacy `theme` column:** `highlight_reels.theme` is now vestigial (kept synced = `style_id`; only a
  pre-migration fallback reads it, and backfill left none). A future migration can drop it + remove the `?? theme`
  fallback in `render-service.ts`/`getReelConfig`. Low priority.
- **AWS concurrency 10→2000** (support case `178216366300642`, still pending): the wall-clock speed lever for ALL
  renders — helps both slices. Independent of Slice A's per-frame optimization.

### ★ Gotchas the next agent MUST know (so nothing lives only in chat)
- **deploy-site coupling:** ANY composition change (a treatment edit, a new style, `StyleDispatch`) MUST be followed by
  `npm run deploy-site` in `workers/reel-render/` — it rebundles the app's `Root.tsx` into the Lambda serve bundle. Skip
  it and Lambda renders the OLD composition (e.g. a treatment silently renders as its base mood). The serve URL is
  stable (`--site-name=partyreel-reel`), so no env change on redeploy. The AWS creds are in `workers/reel-render/.env`.
- **RENDER_VERSION:** bump `src/lib/reel/render-hash.ts` `RENDER_VERSION` when a composition change alters output for the
  same inputs (it's folded into `rendered_hash` → invalidates cached mp4s + forces a one-time re-render of every reel).
  Currently **2**. Style + orientation are already in the hash.
- **Two render fixes (DONE — don't regress):** `renderMediaOnLambda` has **`overwrite: true`** (the output key is stable
  per event → without it the 2nd render errors "output file already exists"). The Lambda function is **240sec**
  (`REMOTION_LAMBDA_FUNCTION_NAME` on Vercel + `workers/reel-render/.env`; the box in `scripts/render-lambda.ts` + the
  `deploy-fn` npm script). Both were caught by the live red-team when the RENDER_VERSION bump forced re-renders.
- **DB:** `highlight_reels.style_id` + `orientation` (+ legacy `theme` synced). RPC = `upsert_reel_config(p_event_id,
  p_style_id, p_orientation, p_seed, p_length_seconds?, p_cover_media_id?)`, authenticated-only (old p_theme overload
  dropped). `getReelConfig`/`ReelConfig` carry `styleId`+`orientation`. Migrations apply via the Supabase MCP
  `apply_migration` (no repo migration files; recorded in Supabase's history). After DDL: `get_advisors` + regenerate
  `src/lib/db/types.ts` (via the MCP `generate_typescript_types`, then hand-merge — `types.ts` is `.prettierignore`d).
- **Verifying a render:** the demo event is **`2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f`** (host `willg97@gmail.com`, 9
  items). Trigger via the composer's **Download** (host-authed). Verify in the DB: `highlight_reels`
  (status/style_id/orientation/render_cost_usd/render_error/rendered_at) + `reel_render_log` (outcome/duration_sec).
- **★ The composer's `@remotion/player` renders BLACK in screenshots after scroll/HMR** (a paint blind-spot) — do NOT
  trust a black player screenshot as "broken"; verify treatments via DOM inspection (the composition renders to DOM) or
  a live human look. A render takes ~1–3 min; if the Chrome MCP won't hold a stable session (2 flapping extensions
  happened this session), hand the human the Download click + verify the OUTCOME via the DB.
- **Cost frugality** ([[feedback-cost-frugality]]): treatments cost ~4× moods — Slice A directly addresses this, which
  is why it's recommended first.

## Open items before/while building

1. **Render-pipeline spike (v1 slice 1): ✅ DONE 2026-06-22** (`workers/reel-render/`, separate pkg, not in the
   Vercel build; see its `SPIKE-NOTES.md`). PROVEN: one Remotion composition (Ken-Burns stills + crossfades + CSS
   grade + trimmed `@remotion/media` video) renders on **Remotion Lambda (AWS, us-east-1)** reading R2 presigned
   URLs and writing the `.mp4` **directly back to R2** via `outName.s3OutputProvider` (**no S3→R2 copy step**;
   output verified in R2: h264 1080×1920, 502 frames, 21.0s, plays, WYSIWYG == local render). **Cost ≈ $0.01/render**
   (Remotion-accrued; `estimatePrice` ~$0.002) → the cost model holds (rounding error). AWS = a **sub-account of an
   org** under `partyr33l@gmail.com`; least-priv IAM (`remotion-lambda-role`/`-policy`, `remotion-user`/`-policy`).
   - **Measured (new account, 2048MB, ORIGINAL media, video via OffthreadVideo fallback):** with-video reel cold
     **88.6s** / warm **76.7s**; photos-only warm **62.2s**. Bottleneck = **per-Lambda CPU** (software-rendering
     large *original* JPEGs + the CSS filter), throttled by the **new-account 10-concurrency cap** (only 7 renderers;
     ~0.95 fps/Lambda vs ~6.5 fps/core locally) — NOT the architecture, NOT cost, NOT mainly the video.
   - **Levers for production speed (all fixable):** (a) **preview-sized media** (we already generate previews) not
     originals; (b) **concurrency quota 10→2000 REQUESTED** (pending AWS; sub-account so requested via console);
     (c) **memory 2048→3008MB** (more vCPU); (d) **video CORS** → `@remotion/media` fast path (or proxy/predownload)
     instead of the OffthreadVideo fallback (R2 presigned URLs hit CORS in headless Chrome).
   - **Lazy-vs-eager verdict:** lazy-on-download stays the **target** but is **GATED on a re-measure** next slice with
     previews + the raised quota + 3008MB. If that lands in the comfortable few-to-low-tens of seconds → lazy stands;
     else eager-on-finalize for video reels. The encode is **cached** either way, so first-view cost is paid once.
   - **Box sizing:** `framesPerLambda` ≈ frames ÷ available concurrency (200 = too-big chunks hit the 120s timeout; 80
     was fine). Bump function `--timeout` if chunks stay large. Confirmed: amd64 deploys cleanly from arm64 Mac;
     re-deploy the "site" (`npm run deploy-site`) on every composition change.
2. **The reveal moment** — a design-lab concept.
3. **Exact free/Pro length caps** — pre-launch.
4. **Build gotchas to validate early** (from research): amd64 image (M-series build arm64), S3-SDK-against-R2 inside
   the container/Lambda, `REMOTION_CHROME_EXECUTABLE_PATH`, re-deploy the Remotion "site" on composition change.

Provenance: discovery 2026-06-22 (this session), grounded in the reel-curation foundation + the render-infra cost
workflow. The curation foundation's current truth: [`../systems/host-app.md`](../systems/host-app.md) "Reel curation".
