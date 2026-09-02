---
track: account-deletion
status: handed-off
cut: "a7f48a3"
preview: true
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

- `docs/systems/auth-accounts.md`: the deletion lifecycle. Its ROLE line gains "account deletion";
  "Where it lives" gains the five files; Invariants gain three bullets (the immediate/no-undo model
  with the zero-events auth-user rule and the hold precedence; `deletion_requested_at` being
  service-role-write-only by construction; the re-verification living in the server action);
  Gotchas gain two MEASURED facts (a GoTrue ban invalidates an already-issued access token, because
  `getUser()` re-validates; Stripe RAISES `resource_missing` when you cancel an already-canceled
  subscription). Every one of those is a fact about this track's own files.

## Deferred (ROADMAP one-liners, bucket named)

- **QA / hardening bucket:** sweep the repo for the JSX landmine this round found and fixed on
  `/privacy` (a text node containing an HTML entity loses its own leading whitespace, so a bolded
  lead-in renders glued to the next word). The whole PRERENDERED surface is clean as of `26341a7`,
  checked by scanning every built page for a missing space after an inline tag; the dynamic app
  routes were not scanned, and no lint or test catches it.
- **Jobs / admin bucket:** `sweepDeletedAccounts` reports its counters in the cron response JSON like
  every sibling sweep, but has no card on `/admin/jobs` (that path belongs to `lp/ops-hardening`).
- **QA bucket:** an operator-triggered deletion is indistinguishable from a self-serve one after the
  fact. A `deletion_requested_by` column would record it; skipped as the larger change, and the
  operator action is Sentry-tagged on failure only.
- **Launch checkpoint:** the deletion request is not rate-limited beyond Supabase Auth's own OTP
  limits. It needs a live session plus a password or an emailed code, so the exposure is a borrowed
  session rather than a stranger, but a per-account throttle is cheap insurance.

## Handoff

- Head `26341a7`, pushed; preview `partyreel-git-lp-account-deletion-partyreel.vercel.app`
  (READY and walked at `a231b28`; `26341a7` is the sync merge plus the entity fix).
- Synced with `origin/launch-prep` at `4a092ea` (it had moved 9 commits: milestone-18, `demo-seed`,
  and the docs folds; no source overlap with this lane).
- Gates on the synced tree, each on its own exit code: typecheck ok, lint ok (0 errors; the one
  warning is the pre-existing `contact-form.tsx` React-Compiler notice), test ok (1549), build ok
  (244 static pages). CI green on every push (`gh run list --branch lp/account-deletion`).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:

  ```
  content/help/notifications-and-emails.mdx                owned
  content/help/your-data-and-deleting-your-account.mdx     owned
  docs/systems/auth-accounts.md                            listed under System-doc edits
  docs/tracks/account-deletion.md                          this manifest
  src/app/(app)/account/actions.ts                         owned
  src/app/(app)/account/page.tsx                           owned
  src/app/admin/accounts/[id]/delete-account-control.tsx   owned
  src/app/admin/accounts/[id]/page.tsx                     owned
  src/app/admin/accounts/actions.ts                        owned
  src/components/app/account-delete-card.tsx               owned
  src/components/app/notification-prefs-form.tsx           owned
  src/lib/constants/legal-privacy.tsx                      owned
  src/lib/constants/legal-terms.tsx                        owned
  src/lib/constants/legal.test.ts                          EXCEPTION (1)
  src/lib/constants/legal.ts                               owned
  src/lib/db/mutations/account.ts                          owned
  src/lib/lifecycle/account-deletion.test.ts               EXCEPTION (2)
  src/lib/lifecycle/account-deletion.ts                    owned
  src/lib/stripe/account-cancel.ts                         owned
  supabase/migrations/20260902130000_account_deletion.sql  EXCEPTION (3), named by the manifest
  ```

  **(1) `src/lib/constants/legal.test.ts`** — the manifest owns `legal.ts` but not its test, and the
  test's "status lines read as intended" case pinned the literal string `"Version 1.0 · …"`. Bumping
  either document, which the track was told to do, failed it. The two assertions now read `version`
  off `LEGAL_DOCUMENTS.privacy` and keep the FORMAT assertion that was the test's real intent, so a
  future bump does not teach anyone to edit the test. Nothing else in the file changed.

  **(2) `src/lib/lifecycle/account-deletion.test.ts`** — the test for an owned module, sitting beside
  it per repo convention (the prefix `…/account-deletion.ts` does not cover
  `…/account-deletion.test.ts`). It is a SOURCE-TEXT pin, like `request-auth-policy.test.ts`, because
  both modules are `server-only` and every property it guards is an ordering or a write scope.

  **(3)** the migration file, named by the manifest's "Also touches, by ruling". Written only, never
  applied.

- **Proposed migrations / cron / config changes:**
  - **Apply `supabase/migrations/20260902130000_account_deletion.sql`** (additive: one nullable
    `profiles.deletion_requested_at` plus a partial index; no function, no table, no policy).
    Expected `get_advisors` delta: NONE. The file's header carries the rolled-back contract check;
    it was RUN against prod inside an aborting transaction and passed, asserting via
    `has_column_privilege` that neither `anon` nor `authenticated` can UPDATE the new column, that
    the service role can stamp it, and that the index lands. ★ Never add the column to the
    `profiles` UPDATE grant allowlist: being outside it is what makes an un-request impossible.
    Then regenerate `src/lib/db/types.ts`; the two spots marked "the typing seam" in
    `lifecycle/account-deletion.ts` and `db/mutations/account.ts` can be tidied afterwards (they are
    correct either way).
  - **Wire ONE line into `src/app/api/cron/purge/route.ts`** (that path is `lp/ops-hardening`'s, so
    this track did not touch it), after `removed_media` so `handled` is populated and before the
    capacity sweeps so they never act on bytes this run is about to reclaim:

    ```ts
    await runSweep("deleted_accounts", () =>
      sweepDeletedAccounts(admin, now, handled),
    );
    ```

    Import from `@/lib/lifecycle/account-deletion`. Pre-apply the sweep returns
    `{ skipped: "not_provisioned" }` rather than throwing, so ordering the apply and the wire either
    way is safe. `docs/systems/lifecycle-recovery.md` says "10 sweeps"; that line becomes 11 when the
    call lands, and it was deliberately left alone here because the cron is another lane's file.
  - No Vercel, Worker, Stripe or env changes. No new secret.

- **Look at first** (the launch-prep alias; these need a signed-in session, which localhost cannot
  have, so they are genuinely unverified rather than skipped):
  1. `/account`, signed in as `willg97@gmail.com`: the new **Email preferences** card (five switches;
     toggling Product news off should also clear the newsletter row) and, at the very bottom, the
     **Delete account** card. Open the dialog and read it, but DO NOT confirm on the Pro host unless
     you mean it: it is immediate, it cancels the TEST subscription, and there is no undo. To
     exercise the whole path, make a throwaway host first.
  2. `/admin/accounts/[id]` as `partyr33l@gmail.com` at AAL2: the **Delete account** card, its
     consequence list, and the retyped-email guard (type a wrong address: the refusal is
     server-side). After a real deletion the card flips to **Deletion in progress** with the events
     left to purge and any hold count.
  3. `/privacy` "Your choices" and `/terms` "Ending things" both read Version 1.1 and describe the
     self-serve path; `/help/your-data-and-deleting-your-account` and
     `/help/notifications-and-emails` carry the new sections. All four were walked on this branch's
     preview and are correct there.

- **What WAS verified live**, against the real Supabase + R2 + Stripe TEST with disposable hosts
  created and deleted for it (prod left clean; a post-run sweep confirmed zero harness rows):
  - `purgeAccount` end to end: two hosted events, real R2 objects behind both keys of every media row
    plus a reel `.mp4`, one item under a legal hold. Run one purged the free event whole (rows, both
    objects, the reel key), skipped the held event ENTIRELY (its unheld sibling included), returned
    `held`, left the auth user standing and the profile anonymised with `tier` untouched. Hold
    released, run two purged the rest and deleted the auth user.
  - Cross-tenant: a bystander host's event and media untouched throughout, and the deleted account's
    guest upload to that host's event SURVIVED with `guests.user_id` and `media.guest_id` set null,
    which is the promise `/privacy` makes and is enforced by the FK, not by app code.
  - `cancelSubscriptionForDeletion` against a real TEST subscription: `trialing` to `canceled`
    immediately (`cancel_at_period_end` false), `none` for no subscription, `already_gone` for a
    missing one, and retry-safe.
  - The request path's pre-apply refusal: it returns `not_provisioned` at step 1, BEFORE Stripe is
    touched, and the seeded host's event and display name were verified unchanged afterwards.
  - Authz, by POSTing the server actions directly with their `Next-Action` ids and no session:
    `deleteMyAccountAction` (both proof shapes), `sendDeletionCodeAction`, `setMarketingEmailAction`
    and `updateNotificationPrefsAction` all refuse, and `deleteAccountAsOperatorAction` refuses
    anonymously even with a spoofed `Host: admin.partyreel.com`.
  - A GoTrue ban: sign-in refused, refresh refused, and an ALREADY-ISSUED access token stops
    validating. So there is no window between the request and the sweep.

## Record

Merged into `launch-prep` at `<sha>` (2026-09-02). Self-serve account deletion shipped end to end.
The `/account` danger zone deletes an account immediately and permanently: it cancels any Stripe
subscription FIRST and refuses the whole request if Stripe will not play, so "deleted but still
billed" is unreachable; then stamps `profiles.deletion_requested_at`, bins every hosted event through
the existing `softDeleteEvent`, takes the address off `newsletter_signups`, anonymises the profile
(email, display name, handle, avatar; never an entitlement column, which stays the webhook's) and bans
the auth user. The re-verification, a password or a fresh emailed code, is enforced inside the server
action rather than the dialog, because the attack it exists to stop is a borrowed session.
`sweepDeletedAccounts` finishes the job from the daily purge cron: legal-hold filter, then R2 objects
including the reel `.mp4`, then `purge_media_rows`, then the event rows, and the `auth.users` row only
at a `mustCount`-verified zero events, since that FK chain cascades. A forensic hold on any of the
account's own events outranks the request: the event is skipped whole and the account waits
anonymised. `/admin/accounts/[id]` gained the same trigger behind admin + AAL2 and a retyped-email
guard, plus the in-progress state. `/account` also gained an Email preferences card: the four tier-2
switches, and a marketing switch whose OFF state keeps both halves of the privacy policy's removal
promise. Privacy and Terms moved to version 1.1 to describe the control that now exists, including
that a deletion cancels a plan at that moment rather than at period end, and the two help articles
followed. Two measured facts came out of the round: a GoTrue ban invalidates an already-issued access
token (the `getUser()` landmine paying off), and Stripe raises `resource_missing` on an already-
canceled subscription. A third was a bug: an HTML entity eats the leading whitespace of its own JSX
text node, which had been rendering "Stay out of view.Hide" on `/privacy` since before this round.
