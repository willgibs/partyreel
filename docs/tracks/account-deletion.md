---
track: account-deletion
status: open
cut: "a7f48a3"
preview: false
owns:
  - src/lib/db/mutations/account.ts
  - src/lib/lifecycle/account-deletion.ts
  - src/app/(app)/account/
  - src/components/app/account-delete-card.tsx
  - src/components/app/notification-prefs-form.tsx
  - src/app/admin/accounts/
  - src/lib/stripe/account-cancel.ts
  - src/lib/constants/legal-privacy.tsx
  - src/lib/constants/legal-terms.tsx
  - src/lib/constants/legal.ts
  - content/help/your-data-and-deleting-your-account.mdx
  - content/help/notifications-and-emails.mdx
reads:
  - src/lib/db/types.ts
  - src/lib/stripe/client.ts
  - src/lib/r2/delete.ts
  - src/lib/social/notification-prefs.ts
---
# lp/account-deletion

**Goal.** Self-serve account deletion, hold-safe and R2-first, with an operator trigger, plus the
newsletter removal control the privacy policy promises. The request: re-verify (the password or an
email code) → cancel the Stripe subscription → soft-delete every hosted event into the existing bin →
anonymise the profile → sign out → mark `deletion_requested_at`. The sweep (`sweepDeletedAccounts`,
called from the purge cron; the Orchestrator wires that one line at integration) hard-deletes R2-first,
skips events under a forensic hold, and deletes the auth user only at zero remaining events. Surfaces:
the `/account` delete card, the operator trigger on `/admin/accounts/[id]`, a notification-prefs form
with the newsletter removal; the privacy policy's "Delete your account" choice and the help article's
"Deleting your account" section swap from the contact path to the self-serve path (bump the document
`version` per the documents' own rule). Size L; the routine half needs no ruling, the UI follows the
rulings below.

**Rulings in force.** (Will, 2026-09-02) **Immediate, no undo, an active plan auto-cancelled at the
request.** Defaults that hold unless he objects at review: a held account (a forensic hold on any of
its events) is anonymised at once and deleted when the hold lifts; non-account newsletter emails keep
the `privacy@` removal promise (this track ships the control for account holders only).

**Also touches, by ruling (explain in the lane check):** ONE additive migration file under
`supabase/migrations/` (`deletion_requested_at` and whatever the sweep needs; write the file only, the
Orchestrator applies it and regenerates `types.ts`).

**Verify on.** Locally, with disposable hosts against the real Supabase and R2: the request path end
to end (a seeded host with two events and a Stripe TEST subscription), the bin, the sweep with and
without a hold, the auth user gone at zero events; rolled-back RPC contract checks for every new RPC.
The signed-in `/account` card and the admin trigger need the launch-prep alias: list them under "Look
at first" for the Orchestrator's walk.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/auth-accounts.md`: the deletion lifecycle (request, sweep, hold, the auth-user rule).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff

- to be filled at handoff

## Record

- to be filled at integration
