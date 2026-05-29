# Partyreel — Roadmap

Canonical "what's next." Phases ship in order; each builds on the last. Check
boxes as work lands and keep [`STATUS.md`](STATUS.md) pointing at the current
phase.

## ✅ Phase 0 — Foundation _(this round)_

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

## ⬜ Phase 1 — Host auth + event creation

- [ ] Supabase Auth (email magic-link + OAuth); signup → profile trigger already exists
- [ ] Login UI (replace `(auth)/login` placeholder); `/auth/callback` already wired
- [ ] Add the shadcn `form` primitive + `react-hook-form` + zod resolver (deferred from Phase 0 — first needed here for auth/event forms)
- [ ] Create-event flow (`POST /api/events`) — generates qr/share tokens; `enforce_event_limit` trigger guards `maxEvents`
- [ ] QR code render; event settings (moderation mode, visibility, upload lock, required fields)
- [ ] Dashboard event list (replace placeholder)

## ⬜ Phase 2 — Guest join + upload (the core loop)

- [ ] `/e/[token]` join via `create_guest` RPC → issues `session_token`
- [ ] Browser → R2 **direct multipart** upload (presign + complete); `create_media` RPC sets status + ledger + caps
- [ ] Live host gallery + public `/a/[token]` album (approved-only, presigned reads)
- [ ] R2 bucket + CORS verified end-to-end (checksum WHEN_REQUIRED, ExposeHeaders ETag)

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
