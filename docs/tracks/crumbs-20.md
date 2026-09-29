---
track: crumbs-20
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2d2240a2"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/auth/email-sign-in.tsx
  - src/app/(marketing)/(cinema)/careers/[slug]/application-form.tsx
  - src/components/admin/announcement-compose.tsx
  - src/lib/constants/reserved-names.ts
  - src/components/app/checkout-button.tsx
  - src/components/app/manage-billing-button.tsx
  - src/components/app/pricing/change-plan-button.tsx
  - src/components/app/storage/storage-list-body.tsx
  - src/components/app/renew-checkout.tsx
  - src/lib/auth/return-path.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(app)/account/sign-out-everywhere-card.tsx
  # ── added: item 1, the forms sweep (every client form outside the lab, onto one guard in one home)
  - src/components/ui/client-form.tsx                         # the guard: `method="dialog"`, one home
  - src/components/ui/client-form.test.tsx
  - src/lib/client-form-policy.test.ts                        # refuses a `<form>` that names no native answer
  - src/app/(app)/account/email-section.tsx
  - src/app/admin/forensics/forensics-controls.tsx
  - src/components/app/account-security-form.tsx
  - src/components/auth/password-sign-in.tsx
  - src/components/guest/follow-moment-card.tsx
  - src/components/shared/set-name-step.tsx
  - src/components/social/profile-bio-form.tsx
  - src/app/(marketing)/(cinema)/contact/contact-form.tsx     # one line: its `useHydrated` comment named the leak the form now answers
  - src/components/guest/password-gate.tsx
  - src/components/guest/add-email-dialog.tsx
  - src/components/app/display-name-form.tsx
  - src/components/social/profile-setup-wizard.tsx
  - src/components/guest/guest-name-step.tsx
  - src/components/guest/report-answer-form.tsx
  - src/lib/guest/confirm-beat-name.tsx
  # ── added: item 2, the brand in display names (the schema every door reads, and its tests)
  - src/lib/constants/reserved-names.test.ts
  - src/lib/validation/profile.ts                             # `displayNameSchema` asks `isReservedName`
  - src/lib/validation/profile.test.ts
  # ── added: items 3 and 4, a sign-in carries its page (the six 401 fallbacks) and the mail's anchor
  - src/lib/auth/return-path.test.ts
  - src/components/auth/login-form.tsx                        # `location.hash` is client-only: the form reads it, the page cannot
  - src/components/auth/login-form.test.tsx
  - src/lib/bare-login-policy.test.ts                         # refuses a bare `/login` from client code
  - src/components/app/pricing/checkout-button.test.tsx       # tests `components/app/checkout-button.tsx`
  - src/components/app/renew-checkout.test.tsx
  - src/components/app/manage-billing-button.test.tsx         # new
  - src/components/app/pricing/change-plan-button.test.tsx    # new
  - src/components/app/storage/storage-list.test.tsx
  # ── added: item 5, a confirm announced as one (the role at its source, the layers that key on it, and every test that queried a confirm as a `dialog`)
  - src/components/ui/popup.tsx                               # the role, spread from the kind's row (never `role={undefined}`)
  - src/components/ui/popup-kinds.ts                          # `confirm` speaks as an alertdialog: one more column of its one row
  - src/components/ui/popup.test.tsx
  - src/components/ui/popup-kinds.test.ts
  - src/components/ui/confirm-switch.test.tsx
  - src/app/(app)/account/sign-out-everywhere-card.test.tsx
  - src/components/shared/media-lightbox-parts/actions.tsx    # the viewer's own two confirms are bare Dialogs: `role="alertdialog"` on each
  - src/components/shared/media-lightbox.test.tsx
  - src/components/app/event-feed/review-keys.ts              # "another layer is up" must see an alertdialog, or the keys judge under a confirm
  - src/components/app/event-feed/review-room.test.tsx
  - src/components/admin/report-queue.tsx                     # the same selector, the operator's keys
  - src/components/admin/report-queue.test.tsx
  - src/components/admin/moderation-grid.test.tsx
  - src/app/admin/reports/person-report-list.test.tsx
  - src/components/app/dashboard/claims-review.test.tsx
  - src/components/app/event-blocks/blocked-section.test.tsx
  - src/components/app/event-feed/bulk-bar.test.tsx
  - src/components/app/recently-deleted-grid.test.tsx
  - src/components/reel/clip-creator.test.tsx
  - src/components/social/profile-actions-menu.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/marketing-content.md
  - src/lib/constants/reserved-slugs.ts                       # `BRAND_STEM`, the brand's one home
  - src/lib/email/links.ts                                    # `PASS_REMINDERS_PATH`, the mail's anchor
---

# lp/crumbs-20

**Goal.** Five hardening items from the ROADMAP: no form sends its fields into the address before the page hydrates, the brand family reaching display names, every 401 fallback and the renewal nudge's anchor surviving a sign-in, and a confirm announced as one.

## The brief

Five items the ROADMAP holds, each fixed at its root with a test that fails on today's code:

- **A form pressed before hydration sends its fields into the address.** A client `<form onSubmit>` with no method or action (react-hook-form's among them: the sign-in email step `components/auth/email-sign-in.tsx`, the careers application, the admin announcement composer) submits as the browser's own GET to the current URL if pressed before React attaches, carrying every named field into the address, the history and a server log (the sign-in step carries an email address). /contact already waits for hydration (`useHydrated` in `contact-form.tsx`, kept per file). Sweep every client form outside the lab onto one guard in one home (a hook, a form wrapper, or `method="post"` with an action that answers harmlessly: pick the one with the fewest ways to go wrong and say why), and hold it with a policy test that refuses a new form without it. Drive it in a browser on your dev server: a slowed load, pressed before hydration, the address read after.
- **Display names take the brand.** `src/lib/constants/reserved-names.ts` refuses only whole reserved names, so "Partyreel Support" is a legal uploader credit and "Hosted by" byline. Let the brand family reach names as a words-level fold (a name that holds the brand with a staff word), in one home wherever names are checked (the client and the server: SQL cannot check them, as the identity migration's header says; find every door a name comes through). The slug impersonation words are not yours (a board asks Will).
- **Six client-side 401 fallbacks send a bare `/login`** (`checkout-button.tsx` twice, `manage-billing-button.tsx`, `pricing/change-plan-button.tsx`, `storage/storage-list-body.tsx`, `renew-checkout.tsx`): each carries its own page with `loginPath(location.pathname)` (`lib/auth/return-path.ts`). Their billing logic is not touched.
- **The renewal nudge's foot link** (`/account#event-pass-reminders`) lands on `/account` unscrolled through a sign-in, because the anchor never reaches the gate: `/login` carries `location.hash` into its landing.
- **A confirm is announced as a dialog.** Every confirm popup renders `role="dialog"` where a confirm is an `alertdialog`, and Sign out everywhere's confirm keeps its x enabled while "Signing out..." shows (it does nothing then).

**Verify:** the gate; each item's test red on today's code and green on yours; the form guard and the sign-in paths walked on your dev server where localhost reaches them (sign-in cannot complete there: name the signed-in steps for the next build's red-team in your Handoff).

**Paths:** your owns are a start (the forms sweep reaches more files: add each to `owns` in your manifest before editing). A path you need beyond them: add it, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
