# Highlight Reel — V1 spec (the North Star feature)

> ROLE: the agreed PRODUCT spec for the Highlight Reel, written DURING discovery (2026-06-22). The feature
> has since shipped; [`../systems/host-app.md`](../systems/host-app.md) is the current truth for how it works.
> This doc is kept for the settled PRODUCT decisions (the experience, the customization model, video, tier).
> BELONGS HERE: the settled product shape, scope (v1 vs deferred). · NOT HERE: how it's built now (→ host-app.md),
> the build plan (a plan file). GROWS BY: refine the product shape in place.

> **STATUS (2026-07-08):** the reel SHIPPED. It runs entirely on a **canvas engine** (`src/lib/reel/engine/`):
> ONE draw function powers the live player (`CanvasReelPlayer`) AND the on-device WebCodecs `.mp4` export
> (mediabunny), uploaded via the host-authed `/api/reel/upload` begin→mint→finalize handshake ($0 at any scale).
> The **14-style catalog** (8 media-first moods + 6 stylized treatments) + portrait/landscape orientation are
> live. Current truth: [`../systems/host-app.md`](../systems/host-app.md) "Reel composer" / "The .mp4 EXPORT" +
> the `project_reel_generation_spec` memory + [`../systems/design-system.md`](../systems/design-system.md).

> **★ RENDER ARCHITECTURE — the Remotion/AWS-Lambda path was TORN DOWN 2026-07-08.** The reel originally rendered
> via a Remotion composition on AWS Lambda (an async trigger → webhook). That entire path (the Lambda trigger, the
> completion webhook, `@remotion/*` deps, `workers/reel-render/`, the AWS sub-account) is GONE: canvas + on-device
> client-encode is the only path now. The Lambda-era sections below (Architecture, Data flow, Cost model, the
> Lambda slices) are HISTORICAL — read them only for the reasoning that led here. Guest-surfacing product
> recommendations (still relevant): [`../decisions/t1-reel-guest-surfacing.md`](../decisions/t1-reel-guest-surfacing.md).

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
  brand). Free-vs-Pro **length**: RULED 30s / 60s ([ADR-0021](../adr/0021-pricing-numbers-reel-caps-ingress.md);
  `MAX_REEL_SECONDS` in `tiers.ts`).

## Architecture (as shipped — the render machinery below is historical)

The durable decision: the *experience* is client-side ($0, universal), and the *artifact* (the .mp4) comes from the
SAME source as the preview so preview == export by construction (WYSIWYG, no second divergent renderer). As shipped,
that source is a **canvas engine** (`src/lib/reel/engine/`): one draw function powers the live `CanvasReelPlayer` AND
the on-device WebCodecs `.mp4` encode (mediabunny). The host's browser encodes and uploads the mp4 via the host-authed
`/api/reel/upload` begin→mint→finalize handshake; it's cached in R2 (keyed by a config hash) and served to everyone
after, so a re-view or a re-download is $0. See [`../systems/host-app.md`](../systems/host-app.md) for the current build.

> **HISTORICAL — the original render platform (torn down 2026-07-08):** v1 was designed around **Remotion Lambda (AWS)**:
> ONE React composition drove both an `@remotion/player` preview and a server `renderMediaOnLambda` encode (async trigger
> → S3→R2 → completion webhook), ~1-2¢/render on a tiny AWS sub-account. AWS denied the 10→2000 concurrency case, and the
> canvas-engine spike proved on-device encode was fast enough (iPhone 13 Pro: 30s → 8.2s), so the whole Lambda path was
> replaced by client-rendered reels ($0 at any scale, no AWS). The cost model, the S3→R2 data flow, and the framesPerLambda
> tuning that lived here no longer apply.

## Schema notes (mostly scaffolded already)

- `highlight_reels(event_id, status [pending|processing|ready], output_key)` exists — **add** `theme`, `seed`,
  `length_seconds`, `cover_media_id` (the reel config).
- `reel_items(event_id, media_id, position)` exists (the order). **Trims** → the reserved `media.clip_start_seconds`
  / `clip_end_seconds` (or move onto `reel_items` if cleaner).
- `media.reel_eligible` / `highlight_score` stay dead scaffold (a FUTURE auto-scoring worker, not v1).

## Scope

**V1 (shipped):** curate (+ auto-fill) → live canvas player → style/orientation/cover/length (deterministic seed, no
shuffle) → on-device `.mp4` export (WebCodecs, cached in R2) → in-app watch + download/share · stills + Pro video
(preview + trim) · no music · 1 reel all tiers · free with watermark+length levers · a lab'd reveal.

**Deferred (logged, not lost):** multiple reels (a Pro upgrade via a `reel_id` FK + an "active reel" context that
keeps the one-tap add) · real video playing *in the live player* (true WYSIWYG for video; v1 shows clips by their
poster in the editor) if the spike says it's too heavy · auto-generated reels · finer trim niceties · beat-sync ·
music · an auto-scoring "best clips" worker.

## The style catalog (product data — still current)

The reel ships **14 styles**, all rendered by the canvas engine (`src/lib/reel/engine/`):
- **8 media-first "moods"** (styleId === its themeId): `classic`(Cinematic), `warm`(Film), `punchy`(Pulse),
  `kinetic`(Kinetic), `editorial`(Editorial), `golden`(Sunset), `mono`(Noir), `dreamy`(Float).
- **6 stylized "treatments"** (styleId → native themeId): `polaroid`→warm, `filmstrip`→classic, `scattered`→warm,
  `framed`→editorial, `carddeck`→punchy, `parallax`→classic.

The pure style catalog + resolver (`STYLE_CATALOG`/`resolveStyleEntry`/`styleThemeId`/`isTreatment`) lives in
`src/lib/reel/engine/style-registry.ts`; the canvas draw registry is `src/lib/reel/engine/registry.ts`. The free-tier
watermark is stamped by the engine for all styles. Current build detail: [`../systems/host-app.md`](../systems/host-app.md).

## Guest reel surfacing + download — RULED + SHIPPED (was the open product question)

Ruled in [ADR-0022](../adr/0022-reel-guest-surfacing.md) (host publish switch, adaptive placement,
guest downloads of the last-rendered mp4, hybrid source, no end-card) and shipped at milestone-2
(2026-08-06) per ADR-0004's capability-token architecture. Current build:
[`../systems/guest-flow.md`](../systems/guest-flow.md); the options analysis lives in git history
(`decisions/t1-reel-guest-surfacing.md`, tombstoned).

Remaining deferred product item: the legacy `highlight_reels.theme` column is vestigial (synced to
`style_id`; the R8 destructive batch drops it + the `?? theme` fallback).

Provenance: discovery 2026-06-22 (this session), grounded in the reel-curation foundation + the render-infra cost
workflow. The curation foundation's current truth: [`../systems/host-app.md`](../systems/host-app.md) "Reel curation".
