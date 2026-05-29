# Partyreel — Status

> **First file to read each session.** Short and frequently updated: where we
> are, what's done, what's next, and what's blocked on a human.

**Updated:** 2026-05-28
**Current phase:** Phase 1 — Host auth + event creation (code complete; end-to-end
auth verification blocked on human OAuth/URL config — see below)
**Next phase:** Phase 2 — Guest join + upload (the core loop)

## What exists now

The Phase 0 skeleton **plus the full host surface**: sign in → create an event →
get a shareable QR code. `pnpm typecheck`, `pnpm lint`, and `pnpm build` are all
clean (18 routes compile). What landed this phase:

- **Auth UI** wired to Supabase Auth — magic-link + "Continue with Google" on
  `(auth)/login` (`src/components/auth/login-form.tsx`); the existing
  `/auth/callback` code-exchange handles both. Sign-out via Server Action in the
  header `UserMenu`.
- **Event CRUD through Server Actions** (the `/api/events` 501 stub was deleted):
  `(app)/dashboard/actions.ts` → `src/lib/db/{queries,mutations}/events.ts`,
  RLS-scoped (no RPCs — those are anon-guest only). Create / update / soft-delete;
  `enforce_event_limit` (`error.code === '23514'`) → `limit_reached`.
- **Dashboard list** with "X of N events used" tier gating (`TIER_LIMITS`); the
  create dialog disables + points to `/pricing` at cap. **Event detail page** with
  a scannable QR (`qrcode.react`), copy share-link, settings toggles, and a
  soft-delete danger zone. Tokens come from DB defaults — the app never supplies
  `qr_token`/`share_token`.
- Supabase project unchanged: ref **`ddafaemglzmuekbtjwzn`**, schema = 2
  migrations in `supabase/migrations/` (no schema change this phase).

**Verified:** typecheck/lint/build clean; `/login` renders; logged-out
`/dashboard` → `/login` (gate intact). **Not yet verified** (needs the human
config below): the magic-link round-trip, Google OAuth, create→redirect,
QR/share resolution, settings persistence, soft-delete, cap behavior, sign-out.

## Next action

**Finish verifying Phase 1, then start Phase 2.** First do the human config tasks
below so the auth flows can be exercised end-to-end (locally and on
`partyreel.vercel.app`). Then Phase 2 — the core loop: guest join via
`create_guest` RPC at `/e/[token]`, browser→R2 direct multipart upload, and the
live host gallery + public `/a/[token]` album. See [`ROADMAP.md`](ROADMAP.md)
Phase 2; read [`../CLAUDE.md`](../CLAUDE.md) for gotchas (esp. the R2 checksum
trap) and run the per-phase Context7 doc check first.

## Blocked on a human ("manual instrument")

**To finish Phase 1 verification (do these next):**

- **Supabase → Auth → URL Configuration:** Site URL = `https://partyreel.vercel.app`;
  redirect allow-list += `http://localhost:3000/**` and
  `https://partyreel.vercel.app/**` (must cover `/auth/callback`, else
  magic-link/OAuth redirects are rejected).
- **Google Cloud Console:** OAuth **Web** client; authorized redirect URI =
  `https://ddafaemglzmuekbtjwzn.supabase.co/auth/v1/callback` (the Supabase URL,
  not the app's); JS origins `http://localhost:3000` + `https://partyreel.vercel.app`.
- **Supabase → Auth → Providers → Google:** enable + paste the Client ID/Secret.
- **`NEXT_PUBLIC_SITE_URL`** — set locally (`http://localhost:3000`); still needs
  setting on **Vercel** (`https://partyreel.vercel.app`) so QR/share URLs and
  redirects are absolute per environment.

**For later phases:**

- **R2 credentials** (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET`) + bucket CORS — needed for Phase 2 uploads.
- **Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) — Phase 4.
  (`SUPABASE_SECRET_KEY` is now set in `.env.local` + Vercel.)
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
