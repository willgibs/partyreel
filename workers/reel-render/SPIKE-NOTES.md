# Reel V1 · Slice 1 spike — live state (for resume across context compaction)

Plan: `~/.claude/plans/great-can-we-include-cheerful-yao.md`. Spec: `docs/specs/reel-v1.md`.
Goal: prove a Remotion reel renders on **Remotion Lambda (AWS)** ↔ R2; measure render-time/cold-start/cost;
settle lazy-vs-eager. NOT app-integrated. Render = ONE composition for `@remotion/player` preview + `renderMediaOnLambda`.

## DONE (Phase A local proof — all green)
- Scaffold `workers/reel-render/` (Remotion **4.0.482**, `@remotion/media`, `@remotion/lambda`, `@remotion/player`,
  aws-sdk, tsx). Node 22. `npm install` done. Remotion **agent skill installed** at `~/.claude/skills/remotion-best-practices/`
  (use the `remotion-best-practices` Skill; key rules: `<Video>` from `@remotion/media` w/ `trimBefore`/`trimAfter` in
  FRAMES + `muted`; animate via `interpolate(useCurrentFrame())`; individual `scale`/`translate` props NOT a transform
  string; **CSS transitions FORBIDDEN**; `calculateMetadata` for duration; `<Img>` for stills; rules in that dir).
- Composition: `src/reel-types.ts` (ReelClip/ReelTheme/ReelProps + THEME_CLASSIC), `src/layout.ts` (pure timeline:
  crossfade overlap, total = sum(active)+crossfade), `src/seed.ts` (mulberry32 → per-clip variation), `src/Reel.tsx`
  (stills=Ken-Burns push-in+seeded pan, base zoom 1.1 for cover-margin, crossfade=overlapping Sequence + opacity
  fade-in, grade=CSS filter; video=`<Video muted objectFit:cover>` trimmed), `src/Root.tsx` (Composition id=Reel,
  24fps, 1080x1920, calculateMetadata derives duration, picsum SAMPLE defaultProps for studio).
- `scripts/build-props.ts` presigns REAL demo-event R2 media → `out/props.json` (8 clips: 6 photos + 2 videos
  trimmed to 3s; ORIGINALS since demo has no previews). Spike `.env` = R2_* copied from main `.env.local` (gitignored).
- `typecheck` clean. `npx remotion compositions` → Reel 12.5s (picsum sample) / 20.9s (real props). Presigned R2 URLs
  fetch (photo 200, video 206).
- **★ Local render (real R2 media, 8 clips incl. 2 video): ~11-13s wall-clock for a ~21s reel = ~0.5x real-time.**
  Output `out/reel.mp4` ~33MB h264 (~12Mbps; CRF-tunable later). Strong signal for **lazy-on-download** (short "Stitching" wait).
- **★ Benchmark profile** (`out/props.json`, 502 frames @ 24fps, `runs=2`): concurrency 4 = 12.91s ±0.75 · 7 = 11.10s ±0.02
  · 10 = 10.89s ±0.05. Diminishing returns past ~7 on this Mac's cores; the Lambda equivalent to tune is `framesPerLambda`.

## RESOLVED
- ✅ **Video cover-crop** (was letterboxed): `@remotion/media`'s `<Video>` reads `objectFit` from a DEDICATED PROP, not
  from `style` (it has a `warnAboutObjectFitInStyleOrClassName` helper; the style/default objectFit is `"contain"` =
  letterbox). FIX = pass `objectFit="cover"` as a PROP (Reel.tsx), keep only width/height/filter in `style`. Both video
  clips now crop-to-fill the 9:16 frame (`out/vid-frame-fixed.png` frame 140, `out/vid-frame2.png` frame 320). Photos already fine.

## FINDING to carry to the client-player slice (NOT a render blocker)
- ⚠️ **`@remotion/media` `<Video>` `fetch()` hits CORS on R2 presigned URLs** (browser Origin `localhost`/our domain not in
  R2 bucket CORS) → the SERVER render silently falls back to OffthreadVideo (FFmpeg, no CORS) so renders fine, but the
  in-browser `@remotion/player` WYSIWYG preview will NOT show video clips until R2 CORS allows our origin for GET. Photos
  unaffected (`<Img>` display isn't CORS-gated). Action for the player slice: add a GET CORS rule for our origin to the R2
  bucket (or proxy video through our domain). Local benchmark above already pays the fallback cost = conservative upper bound.

## STAGED + READY (done while waiting on the AWS account — no creds needed)
- IAM policy JSONs saved: `iam/remotion-lambda-policy.role.json` (the ROLE policy) + `iam/remotion-user-policy.user.json`
  (the USER inline policy). Generated via `npx remotion lambda policies role|user`. Not secret; committed for the console paste.
- Deploy scripts wired: `npm run deploy-fn` (= `functions deploy --region=us-east-1 --memory=2048 --disk=2048 --timeout=120`)
  + `npm run deploy-site` (= `sites create src/index.ts --site-name=partyreel-reel --region=us-east-1`). Flags verified vs the doc.
- Render harness written: `scripts/render-lambda.ts` (`npm run render-lambda`), typechecks. Does `renderMediaOnLambda` →
  **direct-to-R2** via `outName.s3OutputProvider {endpoint,accessKeyId,secretAccessKey}` (confirmed shape, virtual-hosted,
  no copy step) → polls `getRenderProgress` → prints wall-clock + `costs` + `estimatePrice` + the R2 outKey. Box = memory/disk
  2048, timeout 120 (BOX const → `speculateFunctionName`, MUST match the deploy flags). serveUrl from REMOTION_SERVE_URL env.

## IAM setup sequence (from remotion.dev/docs/lambda/setup — exact names matter)
1. IAM → Policies → create policy, paste `iam/remotion-lambda-policy.role.json`, name EXACTLY `remotion-lambda-policy`.
2. IAM → Roles → create role, use-case **Lambda**, attach `remotion-lambda-policy`, name EXACTLY `remotion-lambda-role`.
3. IAM → Users → create user `remotion-user`, NO console access.
4. User → Security credentials → create access key ("Application running on AWS compute") → **Will pastes the SECRET** into
   `.env` as `REMOTION_AWS_ACCESS_KEY_ID` / `REMOTION_AWS_SECRET_ACCESS_KEY` (I never see the secret).
5. Add INLINE policy to the user, paste `iam/remotion-user-policy.user.json`, name `remotion-user-policy`.
6. `npx remotion lambda policies validate` to confirm.

## ✅ DONE — Lambda render proven (2026-06-22)
- **AWS account** `Partyreel` (562923010969) under `partyr33l@gmail.com` — a **SUB-ACCOUNT of an org** (free-tier
  signup auto-enrolled it; matters: CLI quota-increase fails → use the console). Paid plan (full service access; $200
  credits). IAM all created + `policies validate` = all ✅: `remotion-lambda-role`+`remotion-lambda-policy`,
  `remotion-user`+inline `remotion-user-policy`. Creds in `.env` (REMOTION_AWS_*, gitignored; ID non-secret, Will set the secret).
- **Deployed:** fn `remotion-render-4-0-482-mem2048mb-disk2048mb-120sec` (`npm run deploy-fn`); site `partyreel-reel`
  → serveUrl in `.env` (`npm run deploy-site`). Re-deploy the SITE on any composition change.
- **Direct-to-R2 WORKS** (`scripts/render-lambda.ts`, `npm run render-lambda`): `outName.s3OutputProvider {endpoint,
  accessKeyId,secretAccessKey}` writes the mp4 straight to R2 — **NO copy step**. Verified via `npm run verify-r2 -- <key>`:
  h264 1080×1920, 502 frames, 21.0s, plays, frame == local render (WYSIWYG). outputFile URL is S3-shaped, ignore it; the
  `output: R2 …` line (outBucket/outKey) is the truth.
- **Measured (2048MB, ORIGINAL media, video=OffthreadVideo fallback, 7 renderers under the cap):** with-video cold
  **88.6s** / warm **76.7s**; photos-only warm **62.2s**. **Cost ≈ $0.01/render** (accrued; estimate ~$0.002).
- **★ Bottleneck = per-Lambda CPU** (software-rendering big original JPEGs + CSS filter), NOT video/architecture/cost.
  Throttled by the **new-account 10-concurrency cap** (`npx remotion lambda quotas` → 10). Levers: preview-sized media
  (not originals) · quota **10→2000 REQUESTED** (pending; console, since sub-account) · memory 3008MB · video CORS fix.
- **★ framesPerLambda landmine:** default (~20) → ~25 lambdas → "Rate Exceeded" (>10 cap). 200 → big chunks → main
  **120s timeout**. **80** (~7 renderers) = the sweet spot here. Set via `REMOTION_FRAMES_PER_LAMBDA` env (drop it once
  the quota is raised). PHOTOS_ONLY=1 on build-props drops videos (isolates the video cost).

## REMAINING (record + ship)
- [done] docs/specs/reel-v1.md open-item #1 rewritten with results + the lazy-vs-eager verdict.
- [todo] CHANGELOG spike note + reel memory update; stage REMOTION_AWS_* in `.env.example` + `src/lib/env.ts`
  (`assertReelRenderEnv`). Commit this package to main (gate first — separate pkg, not in the Vercel build).
- **Lazy-vs-eager = GATED:** re-measure next slice with previews + raised quota + 3008MB before committing to lazy.

## Test media (demo event 2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f, real R2 keys)
photos: eea04b91, 21285cf7, df9894b2, 11234cd7, dc3d53e5, 90908db2 · videos: dc2540eb (5.8s), bccd26cd (10.2s).
