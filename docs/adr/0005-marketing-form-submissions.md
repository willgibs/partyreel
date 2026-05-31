# ADR-0005 — Marketing form submissions: deny-all table + best-effort email

- **Status:** Accepted (2026-05-31)
- **Phase:** Marketing build-out (Round 4 — Contact; reused by Careers)

## Context

The marketing site needs public, unauthenticated forms (Contact, later Careers).
A submission must **never be lost**, and the operator wants a notification — but the
email path may be unconfigured (sending keys/inbox land separately) and must not be
able to drop or block a submission. Anonymous visitors have no JWT, and we must never
give the `anon` role direct table access (same rule as the guest flow, ADR-0004) — but
unlike guests, marketing forms carry **no capability token**, and the work happens
server-side.

## Decision

- **Persist to a deny-all Supabase table, written server-side.** Each form gets a table
  (`contact_submissions`, later `job_applications`) with **RLS enabled and NO policies**
  (deny-all) — the accepted `rls_enabled_no_policy` class shared with `newsletter_signups`
  / `reports` / `sent_emails`. Written ONLY by a **Server Action** via the service-role
  **admin client** (`service_role` bypasses RLS). No anon RPC, no anon/authenticated
  grants → **no new anon-executable surface**.
- **The DB row is authoritative; email is best-effort.** The action inserts the row
  first, then attempts a Resend notification inside a `try/catch` (`sendOnce`,
  `dedupeKey = row.id` for double-submit idempotency, `replyTo` = the submitter). A
  missing/unconfigured/failed email is logged and swallowed — it never changes the
  user-facing success.
- **Anti-spam: a honeypot.** A hidden `website` field; any value → the action returns
  success without storing (silently drops bots). zod re-validates server-side.
- **Display vs. routing are separate.** The shown address is a fixed constant
  (`SUPPORT_EMAIL = help@partyreel.com`); the actual destination is the optional
  `CONTACT_NOTIFY_EMAIL` env (default `SUPPORT_EMAIL`) — so changing where mail goes is
  an env swap, not a code change.

## Consequences

- Submissions survive any email outage / pre-config gap (captured + queryable in the DB).
- No new anonymous attack surface — the table is server-write-only.
- Resend **Inbound** is explicitly NOT used (webhook-only programmatic ingestion, no
  inbox); the destination is a real receiving inbox set via env.
- The pattern is reused verbatim for Careers (`job_applications`), amortizing the cost.
