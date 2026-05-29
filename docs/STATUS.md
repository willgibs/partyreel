# Partyreel — Status

> **First file to read each session.** Short and frequently updated: where we
> are, what's done, what's next, and what's blocked on a human.

**Updated:** 2026-05-28
**Current phase:** Phase 0 — Foundation (complete)
**Next phase:** Phase 1 — Host auth + event creation

## What exists now

A deployable Next 16 skeleton with the full design system, the complete database
schema (applied to the live Supabase project) with RLS + capability-token RPCs,
and these agent docs. All route groups render; `pnpm typecheck` and `pnpm lint`
are clean. **No working end-user features yet — by design.**

- Routes verified rendering: `/`, `/pricing`, `/privacy`, `/terms`, `/login`,
  `/e/[token]`, `/a/[token]`; `/dashboard` correctly redirects anon → `/login`;
  API routes return `501 { not_implemented }`.
- Supabase project: ref **`ddafaemglzmuekbtjwzn`** (org "Will Gibson",
  us-east-1, Postgres 17). Schema = 2 migrations in `supabase/migrations/`.

## Next action (Phase 1)

Start with **host auth**: wire Supabase Auth (email magic-link + OAuth) into the
`(auth)/login` placeholder. The signup→profile trigger (`handle_new_user`) and
the `/auth/callback` code-exchange route already exist — you're connecting UI to
them. Then build create-event (`POST /api/events`). See [`ROADMAP.md`](ROADMAP.md)
Phase 1 for the full checklist; read [`../CLAUDE.md`](../CLAUDE.md) for gotchas.

## Blocked on a human ("manual instrument") before later phases

`.env.local` exists with the public Supabase vars. Still needed (the user adds
these to `.env.local`; see [`.env.example`](../.env.example) for shape):

- **`SUPABASE_SECRET_KEY`** — service-role key. Needed for the Stripe webhook
  (Phase 4) and the purge cron (Phase 3). Grab from Supabase dashboard → Project
  Settings → API keys → secret.
- **R2 credentials** (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET`) + bucket CORS — needed for Phase 2 uploads.
- **Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) — Phase 4.
- **Supabase CLI** not installed locally. Migrations were applied via the
  Supabase MCP. To use `pnpm db:types` / `pnpm db:push`, install the CLI and
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.

## Known / accepted

- **`get_advisors` reports 4 WARNs that are accepted by design** — the four
  capability-token RPCs are SECURITY DEFINER + executable by `anon` on purpose
  (the token is the auth; ADR-0004). Do **not** revoke their EXECUTE grant.
- Vercel deploy of the skeleton was an optional stretch — not yet done.

## Open questions (deferred, decide before relevant phase)

- NSFW / safety scanning service (Rekognition vs Vision SafeSearch vs OSS) —
  before public launch.
- Transcoding pipeline choice — Phase 5.
- Presigned read-URL expiry strategy for large galleries — Phase 2.
- Whether to add an inactivity-based purge for free events (currently none).
- Returning-guest display-name persistence (localStorage) — Phase 2 UX detail.
