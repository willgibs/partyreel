# RPC contract suite: blocked locally (2026-07-03)

> STATUS: the committed, rolled-back RPC contract suite (a third vitest project exercising the
> security-bearing RPCs inside a transaction) is NOT buildable from this machine today. This doc
> names exactly what is missing and the cheapest unblock, so the next agent can go straight to
> building. Delete this file when the suite lands.

## What we wanted

A small committed suite that opens a Postgres transaction, exercises the 5-8 most security-bearing
RPC contracts (`upsert_reel_config` auth, `add_to_reel` access checks, `reorder_reel` set-equality
guard, `get_event_media_by_qr_token` visibility gating, `claim_anonymous_uploads` /
`remove_my_upload` ownership), asserts outcomes, and ROLLS BACK, proving nothing persisted by
asserting row counts unchanged. Today that check exists only as ad-hoc Supabase-MCP
`DO $$ ... RAISE EXCEPTION $$` blocks run by whichever agent touches SQL; it is correct but
uncommitted and unrepeatable.

## What is missing, exactly

1. **A locally readable direct Postgres connection string.** `.env.local` has only the PostgREST
   surface (`NEXT_PUBLIC_SUPABASE_URL`, publishable key, `SUPABASE_SECRET_KEY`); the service-role
   key is an HTTP API key, not a pg wire connection, and PostgREST cannot open a transaction that
   spans multiple statements from a test. A `SUPABASE_DB_URL` **does** exist as a GitHub Actions
   secret (`.github/workflows/db-backup.yml` uses it for `supabase db dump`), but GitHub secrets
   are write-only: the value is not retrievable locally.
2. **A pg wire driver.** No `pg` / `postgres` package in `package.json`.
3. **A vitest slot.** `vitest.config.ts` defines only `unit` (`src/**/*.test.ts`) and `component`
   (`src/**/*.test.tsx`).

## Cheapest unblock: Path A (tests the PROD schema, ~15 min of Will's time + one small PR)

1. Will copies the **session/direct connection string (port 5432, NOT the 6543 transaction
   pooler)** from Supabase dashboard -> Project Settings -> Database -> Connection string, into
   `.env.local` as `SUPABASE_DB_URL` (same name the backup workflow uses). Apply the three-place
   secrets rule: `.env.local` + Vercel (non-sensitive) + `src/lib/env.ts` (zod `.optional()`).
2. Add `postgres` (postgres.js) as a devDependency.
3. Add a third vitest project `contract` with a DISTINCT include (`src/**/*.contract.test.ts` or
   `tests/contract/**`) so the unit project's `src/**/*.test.ts` glob does not swallow it, wired to
   **skip cleanly when `SUPABASE_DB_URL` is unset** (mirror the backup workflow's guard-step
   pattern) so `pnpm test`, the commit gate, stays green for agents without the secret.
4. Every test: `BEGIN` -> exercise the RPC as the right role (`set local role authenticated` +
   `set local request.jwt.claims`) -> assert -> `ROLLBACK` -> assert row counts unchanged.

CAUTION: Path A runs against production data (the same DB the MCP DO-block practice already
targets). Keep the suite to rolled-back contract assertions; never seed outside the transaction.

## Alternative: Path B (fully isolated, heavier)

Install the Supabase CLI + Docker local stack. `supabase/config.toml` is already pre-wired (db
54322, `major_version = 17` matching prod, seed hook); the local URL is then the well-known
`postgres://postgres:postgres@127.0.0.1:54322/postgres`. Requires the repo migrations to apply
cleanly locally (they should: repo file = applied version, per CLAUDE.md). Pick this if prod-DB
test traffic ever becomes uncomfortable; it is more moving parts (Docker, CLI install, keeping the
local stack migrated) for the same assertions.
