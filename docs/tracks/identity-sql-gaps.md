---
track: identity-sql-gaps
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ceaee403"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/migration-guards.test.ts
  - docs/systems/database-security.md
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
  - docs/systems/guest-flow.md
  - src/app/(guest)/e/[token]/page.tsx
  - src/lib/events/gallery-access.ts
---

# lp/identity-sql-gaps

**Goal.** Two identity leaks against Will's guest-identity ruling closed in SQL: an unconfirmed sign-up's address never reaches the host through `guests.email`, and `get_public_profile`'s attended arm applies the album's own confirmed-email gate. A migration file, its guards, a rolled-back proof and the two system docs; the Orchestrator applies it.

## The brief

**The rule (Will's guest-identity ruling, now in `docs/systems/guest-flow.md` and `database-security.md`):** a guest is a typed name ("Unverified"), a typed name with an address nobody proved (`guests.pending_email`: never shown to the host, never attributed, never mailed on its own), or a confirmed account. The host sees a badge, never an unproven address. `database-security.md`'s landmine "TWO EMAIL COLUMNS, AND ONLY `verified_at` IS PROOF" states it, and names the first gap below.

**Gap 1: an unconfirmed address in `guests.email`.** `create_guest` (newest definition: `supabase/migrations/20260922120000_guest_pending_email.sql`) reads `auth.users.email` for the session and inserts it into `guests.email` even when `email_confirmed_at` is null, and `guests.email` is inside the host's column-scoped SELECT grant (`grant select (id, event_id, user_id, email, created_at) on public.guests to authenticated`, `20260729180000_qa_q3_escalation_guards.sql:328`), so a host can read it through PostgREST. Close it: (a) `create_guest` writes `email` only for a confirmed session (start from the newest definition; keep the signature, so no caller changes and `types.ts` stays as generated); (b) existing rows: find out how `verified_at` was populated for rows older than the identity round before touching data; null `email` only on rows whose address was never proved, and say in the Handoff exactly which rows (a count on the live database, read-only) and why; (c) the grant: grep every authenticated, non-service-role read of `guests` (`git grep -n 'from("guests")'` and the RPCs that return guest columns); if nothing host-facing selects `email`, revoke `email` from the host's grant (the narrower the host's view the better: the guest list and the credit already run on the admin client) and say so; if something does, keep the column, narrow what it returns, and explain.

**Gap 2: `get_public_profile`'s attended arm** (`20260922122000_profile_shown_events.sql:129`) admits any signed-in viewer to an attended event's photos where the album itself asks for a confirmed email (`src/app/(guest)/e/[token]/page.tsx:232`, `src/lib/events/gallery-access.ts`). Make the arm apply the album's own gate: on a `require_verified_email` event, only a confirmed viewer (and the host) passes. Start from the newest definition of the function.

**How:** one new migration file in `supabase/migrations/` (a timestamp after every existing file). Replacing a function starts from its NEWEST definition in the folder, never an older one. A function dropped and re-created through the MCP inherits an `anon` EXECUTE grant (`database-security.md`): revoke it again where the old one had none. Prove both fixes with a ROLLED-BACK check through the Supabase MCP (`execute_sql` wrapping `begin; ... rollback;`) on disposable test data only: an unconfirmed session's mint leaves `email` null, a confirmed one keeps it; the host's PostgREST read of `guests.email` is refused (if revoked) or null for an unconfirmed row; the attended arm refuses a signed-in unconfirmed viewer on a verified-required event and admits a confirmed one and the host. Pin both in `src/lib/db/migration-guards.test.ts`. Refine the two system docs in place (the landmine's "a gap ... on the ROADMAP" clause goes; `profiles-social.md`'s attended arm states the gate). **Never apply the migration yourself** (`apply_migration` is the Orchestrator's): write the file, prove it rolled back, hand off, and name in the Handoff the exact order the Orchestrator applies it in, plus whether `get_advisors` should change.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code (`pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke`); the rolled-back proof's statements and results pasted in the Handoff (no secret, no real address).

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
