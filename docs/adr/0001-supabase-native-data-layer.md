# ADR-0001 — Supabase-native data layer (migrations + RLS + generated types)

- **Status:** Accepted (2026-05-28)
- **Phase:** 0

## Context

We need a Postgres data layer with row-level authorization, type-safe access from
TypeScript, and a migration story. The obvious alternative is an ORM/toolkit like
Drizzle or Prisma layered on top of Supabase's Postgres.

The security model (see ADR-0004) depends on **Row-Level Security policies** and
**`security definer` RPCs** being the real boundary — anonymous guests have no
JWT and must never get direct table access. An app-layer ORM can't enforce that;
only the database can.

## Decision

Treat **Supabase Postgres as the source of truth**, expressed in SQL:

- Schema changes are **SQL migrations** in `supabase/migrations/`.
- Authorization is **RLS policies** + **`security definer` functions**, written
  in SQL alongside the schema.
- TypeScript types are **generated** from the live schema into
  `src/lib/db/types.ts` (`supabase gen types`) — never hand-written.
- No ORM. App code calls the typed Supabase client; all DB access is centralized
  in `src/lib/db/*` (queries/mutations), never inline in components.

Because the Supabase CLI isn't installed in this environment, Phase 0 applied
migrations and generated types via the **Supabase MCP**. Repo migration files and
the live DB are kept in sync by filename = applied version.

## Consequences

- **+** The database enforces security, so it holds even if app code is wrong —
  essential for the no-account guest model.
- **+** Generated types stay honest to the real schema; `types.ts` is in
  `.prettierignore` so regeneration is churn-free.
- **+** One mental model (SQL) for schema + authz; advisors (`get_advisors`) lint
  it.
- **−** Tier limits must be expressed twice — TypeScript (`tiers.ts`) for UX and
  SQL (`tier_limits()`) for enforcement — and kept in lockstep by hand.
- **−** Contributors must be comfortable reading/writing SQL and RLS, not just an
  ORM DSL.
- Migrations are immutable history; never edit an applied migration — add a new
  one.
