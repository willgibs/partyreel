# Partyreel — Roadmap

Canonical "what's next." Phases ship in order; each builds on the last. Check
boxes as work lands and keep [`STATUS.md`](STATUS.md) pointing at the current
phase.

## ✅ Phase 0 — Foundation

A deployable skeleton with the full design system, complete database schema +
security, and the living docs that let future agents pick up each phase.
**No working end-user features by design** — it's a clean handoff point.

- [x] Next 16 app initialized (TS, App Router, `src/`, Tailwind v4, ESLint, `@/*`)
- [x] Clean/minimal design system (shadcn radix-nova, `@theme` tokens, primitives + shared composites)
- [x] Route-group shells: `(marketing)`, `(auth)`, `(app)` (getUser gate), `(guest)`; API 501 stubs
- [x] Supabase project created + clients wired (`client`/`server`/`middleware`/`admin`), proxy session refresh
- [x] Schema applied: enums, 6 tables, indexes, triggers, RLS, capability-token RPCs; advisors run; types generated
- [x] Constants + stubs: `tiers.ts`, `r2/*`, `media/*`
- [x] Agent docs: CLAUDE.md, PRD, ROADMAP, STATUS, ADRs 0001–0004

## ✅ Phase 1 — Host auth + event creation

Verified in production (magic-link + Google both reach the dashboard).

- [x] Supabase Auth (email magic-link + Google OAuth); signup → profile trigger already exists
- [x] Login UI (replace `(auth)/login` placeholder); `/auth/callback` already wired
- [x] `form` primitive (hand-authored — radix-nova has no `form` item) + `react-hook-form` + zod resolver
- [x] Create-event flow (Server Actions) — DB defaults generate qr/share tokens; `enforce_event_limit` trigger guards `maxEvents`
- [x] QR code render; event settings (moderation mode, visibility, upload lock, required fields)
- [x] Dashboard event list (replace placeholder)

## ✅ Phase 2 — Guest join + upload (the core loop) _(this round)_

Code complete + DB contract verified; the live browser→R2 round-trip is blocked on
human R2 setup (see [`STATUS.md`](STATUS.md) "Blocked on a human"). Caught + fixed a
Phase 0 `create_media` int4-overflow bug that blocked every upload.

- [x] `/e/[token]` join via `create_guest` RPC → issues `session_token`
- [x] Browser → R2 **direct multipart** upload (presign + complete); `create_media` RPC sets status + ledger + caps
- [x] Live host gallery + public `/a/[token]` album (approved-only, presigned reads)
- [x] New `get_upload_context` RPC (presign-time session→event + cap pre-check) + Vitest unit harness
- [ ] R2 bucket + CORS verified end-to-end (checksum `WHEN_REQUIRED`, ExposeHeaders ETag) — needs human R2 creds

## ⬜ Phase 3 — Moderation + lifecycle

- [ ] Approve / hide / remove; hold-for-approval queue
- [ ] Visibility + upload-lock toggles; host delete (soft-delete frees a slot, destroys media)
- [ ] `purge_at` / `deleted_at` Vercel Cron sweeper (R2 objects + rows; honors 90-day cold retention)

## ⬜ Phase 4 — Payments / tiers

- [ ] Stripe Checkout (subscription + one-time Event Pass) + Billing Portal
- [ ] Raw-body webhook → `profiles.tier` (source of truth); enforcement reads `tiers.ts`
- [ ] Watermark on free exports; upgrade prompts at limits

## ⬜ Phase 5 — Highlight reel (scaffold → real)

- [ ] External transcode/stitch worker (NOT Vercel functions); populate `highlight_score`/clip fields
- [ ] `highlight_reels.status` → ready; output to R2; tiered download

## ⬜ Phase 6 — Growth / polish

- [ ] Branded share pages + "make your own" CTA on guest/album surfaces
- [ ] Analytics; marketing SEO; onboarding polish
