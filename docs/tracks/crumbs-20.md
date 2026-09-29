---
track: crumbs-20
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  - src/app/(auth)/auth/callback/route.test.ts                # the callback follows the anchored pair and no other fragment
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
  # ── added: the facts this lane made true, refined in place in their one home
  - docs/systems/auth-accounts.md                             # the return path, the anchor, the 401 fallbacks, the name rule
  - docs/systems/architecture.md                              # a press before hydration
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

None is a one-way door; each is built as recommended and is Will's to overrule.

- **Which guard for a form pressed before hydration?** Built: `method="dialog"` in one `ClientForm`. Outside a
  `<dialog>` the browser's native submit does nothing at all (no request, no navigation, Enter included), so
  there is no state to get wrong and it holds when the script never loads. Not built: a `useHydrated` flag on
  each submit button (every button found and disabled, a flash on every load, a form with no button or one Enter
  reaches submits anyway) and `method="post"` (the page answers a POST it did not ask for, or an endpoint kept to
  answer 204). /contact keeps its per-file `useHydrated` on top, so a note that took a minute to write never
  meets a silent press. The lab and Library (`src/app/(dev)`) are outside the sweep, as the brief said.
- **Which names does the brand rule refuse?** Built: the brand alone in any disguise, or beside a staff word
  from `RESERVED_NAMES` itself (no new words): "Partyreel Support", "The Party-Reel Team", "P4rtyr33l Adm1n".
  Left legal: the brand beside a name or a fan's word ("Sam Partyreel", "Partyreel Fan"), and any name that merely
  contains a staff word ("Adminah"). Not built: the slug's rule (the brand anywhere), which would refuse a
  photographer's "Party Reel Studios". The staff words are English; a script homoglyph is not folded.
- **Which fragment rides a sign-in?** Built: one exact pair, `/account#event-pass-reminders` (the mail's own,
  `ANCHORED_RETURNS`, named once beside the mail in `lib/email/links.ts`); any other fragment, or that one on
  another page, drops and the page stands. Not built: any fragment on any app page (a wider door: a `#` a page
  reads as a mode).
- **A signed-out press on /pricing still lands the dashboard after signing in:** the public pricing page is not on
  the return list, so `loginPath("/pricing")` is the bare login it always was. Returning a visitor to pricing
  widens the allow-list to a marketing page; not built.
- **A confirm is an `alertdialog` by role, not by Radix's `AlertDialog` behaviours.** An outside press still
  cancels it and focus still lands on its first control (the safe answer), so only the announcement changed.
  Not built: blocking the outside press on every confirm.
- **The viewer's own two confirms** ("Delete this upload?", "Remove this item?") are bare `DialogContent`s the
  kind table does not reach (`popup-kinds.test.ts`'s `LEFT_ALONE`), so each says `role="alertdialog"` on its
  element.
- **Sign out everywhere's corner x is hidden while "Signing out..." shows**, not disabled: the popup's x has no
  disabled state, and the guest door hides its own x the same way while held.

## System-doc edits (in place, owned facts only)

- `auth-accounts.md`: the sign-in landing bullet refined (a fragment only as one of the mail's named anchors);
  a new bullet under it (a fragment rides `location.hash`, and every client 401 fallback carries its page); Names
  and photos gains the one home of the name rule (`isReservedName`, every door, SQL cannot check).
- `architecture.md`, Host-page hydration: a press before hydration is the browser's own submit, `ClientForm` is the
  answer, and how to walk it.
- **For the Orchestrator, in `design-system.md` (menu-depth's file until its merge; not this lane's), the popup
  bullet ("Every popup names its kind"):** a confirm speaks as an `alertdialog` (`role` is one more column of the
  kind's row in `popup-kinds.ts`, spread by `PopupContent` only when the row names one, never as `role={undefined}`,
  which would erase Radix's own; the viewer's two bare-Dialog confirms say it on the element), so anything asking
  whether a layer is up selects `[role="dialog"], [role="alertdialog"]` (the review room's keys and the report
  queue's did not until now), and a test asserting a confirm's absence asks for `alertdialog`, or it passes for
  nothing.

## Deferred (ROADMAP one-liners, bucket named)

- Host: `useHydrated` has four per-file copies (`contact-form.tsx`, `event-feed/bulk-bar.tsx`,
  `share/event-share-provider.tsx`, the lab's `theme-toggle.tsx`); one `useSyncExternalStore` hook in one home would
  end them (from `crumbs-20`).
- Accessibility: "another layer is up" is hand-rolled as a role selector three times (`review-keys.ts`,
  `report-queue.tsx`, `masonry.tsx`) and two of them missed `alertdialog`; one `layerIsUp()` in one home would keep
  them in step (from `crumbs-20`).

## Handoff (replaces the chat report)

- **Work commits, pushed on `lp/crumbs-20`:** `14df1846` (forms, names), `aca6face` (the sign-in's page and anchor,
  confirms), `ead2b090` (the callback's anchor test, the system docs), `4d948c74` (two comments, no behaviour).
  **No sync commit:** launch-prep moved by `2becfa60` (menu-depth's merge) and its records; its files (`dropdown-menu`, the Library's `gallery-demos.tsx` and
  its specimens artifact, `design-system.md`, the tracks and STATUS) meet none of this lane's diff or `reads`
  (`comm` of the two `--name-only` lists is empty), and a trial `git merge --no-commit origin/launch-prep` was clean.
  The chat line's sha is this manifest's commit, which changes no code.
- **Gates, each on its own exit code** (logs in `../partyreel-wt/_scratch/crumbs-20/`): on `ead2b090`, `pnpm
  typecheck` 0 (`final-typecheck.log`), `pnpm lint` 0 with no warning anywhere (`final-lint.log`), `pnpm test` 0, 625
  files and 7,351 tests, from a baseline of 619 and 7,251 (`final-test.log`, `test-baseline.log`), `zsh
  scripts/build-lock.sh pnpm build` 0 (`final-build.log`) and `pnpm lab:smoke --base http://localhost:3135` 0, 143
  checks (`final-lab-smoke.log`; its scope was the boards `event-ready` and `locked-door`, which import a changed
  file; no `lab:demo`, this is no board's lane); on the head work commit `4d948c74`, which changes two comments,
  typecheck, lint and test again, 0, 0 and 0, 625 files and 7,351 tests (`c4-typecheck.log`, `c4-lint.log`,
  `c4-test.log`). The smoke's PREMISE line: `disposable-mode`'s eight open asks describe
  `media-lightbox-parts/actions.tsx`, which this lane touched by one attribute on two confirms (`role="alertdialog"`),
  no drawing changed.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 65 files, every one under `owns` above but this
  manifest. `src/app/(auth)/login/page.tsx` is owned and unchanged: the fragment is client-only, so the form reads it
  and the page needed nothing. The paths the brief did not list were added to `owns` before their first edit, each
  with its reason in the front matter (the sweep's 18 form files, the tests that queried a confirm as a `dialog`,
  `popup.tsx` and `popup-kinds.ts`, `login-form.tsx`, `review-keys.ts` and `report-queue.tsx`, and two system docs).
- **Each item's test is red on today's code and green on this lane's,** proved by reverting the sources through a
  patch (never the shared stash) and running the new tests: item 1's policy lists 20 raw forms in 18 files; item 2's
  three door tests accept "Party Reel Team" and "Official Partyreel"; items 3 and 4 fail 17 tests in 8 files; item 5
  fails 36 in 14. Tests reshaped on purpose, each keeping its scar and dropping its expired reason: every test that
  queried a confirm popup as `dialog` now says `alertdialog` (12 files), `person-report-list.test.tsx` gains the
  `alertdialog` absence beside `dialog` (a one-press act means no popup of either), and `renew-checkout.test.tsx`'s
  signed-out case expected the bare `["/login"]` that was the bug.
- **The items:**
  1. **Forms:** `src/components/ui/client-form.tsx` (`method="dialog"`), 20 forms in 18 files swept, held by
     `src/lib/client-form-policy.test.ts` (JSX, not text; an `action`, `method="get"` or `method="dialog"` names a
     native answer, else refused) and `client-form.test.tsx` (the server's own markup). **Walked in Chrome on the dev
     server with the page's scripts held at the network, pressed before hydration, the address read after:**
     `before-1280.log` (`/login?email=walk-test`; the careers form's name, address and honeypot in its GET) against
     `after-1280.log` and `after-375.log` (the address unchanged, no navigation, and once released the same press is
     the page's own handler); `enter-after.log` (Enter after hydration still the page's); `console-after.log` (no
     hydration warning); `mech-chrome.log` and `mech-firefox.log` (the mechanism alone: the plain form reaches the
     server, `method="dialog"` reaches nothing, in Chrome and headless Firefox). WebKit is not run here (no iOS
     simulator on this machine); it is by the HTML Standard's form submission algorithm ("if form does not have an
     ancestor dialog element, then return"), which Safari 15.4 shipped.
  2. **Names:** `isReservedName` (`src/lib/constants/reserved-names.ts`) is the one home, asked by
     `displayNameSchema`, so every door reads it; `reserved-names.test.ts` pins what it takes and what it leaves both
     ways, names every writer of `display_name` with the gate it asks first (the account action, the door's adopted
     name, the join and rename routes through `parseGuestDisplayName`; the ask-to-join route sends no name), and
     the browser's `checkDisplayName`. **Read live (Supabase MCP, read-only, 2026-09-29):** 3 profile names and 89
     guest names; the one that holds the brand is the operator's own "Partyreel" (`88d50fe4`, `is_admin`), the brand
     alone and a whole reserved name today, which nothing re-reads; no stored name is newly refused.
  3. **Six 401 fallbacks:** `checkout-button.tsx` (twice), `manage-billing-button.tsx`, `change-plan-button.tsx`,
     `storage-list-body.tsx`, `renew-checkout.tsx` each send `loginPath(window.location.pathname)`; billing logic
     untouched; `src/lib/bare-login-policy.test.ts` refuses the literal from client code.
  4. **The anchor:** `lib/auth/return-path.ts` (`ANCHORED_RETURNS` from `lib/email/links.ts`, `returnWithAnchor`),
     `login-form.tsx` (reads `location.hash`, `""` on the server), the callback's redirect keeping the fragment.
     **Walked (`anchorwalk.mjs`, the authorize request failed at the network so nothing left the machine):**
     `/account#event-pass-reminders` answers `307 Location: /login?next=%2Faccount`, the browser lands
     `/login?next=%2Faccount#event-pass-reminders`, and the Google door's `redirect_to` carries
     `next=%2Faccount%23event-pass-reminders` (`anchor-after.log`), where today's code carried `next=/account`
     (`anchor-before.log`); `#plan` and `/dashboard#event-pass-reminders` drop.
  5. **Confirms:** `role` is a column of the kind's row (`popup-kinds.ts`), spread by `PopupContent`
     (`popup.tsx`); the viewer's two bare-Dialog confirms; `review-keys.ts` and `report-queue.tsx` select
     `alertdialog` too (each pinned: a confirm up, the keys do nothing); Sign out everywhere's x hidden while
     pressed and back on a refusal. **Read from Chrome's own accessibility tree on the Library's ConfirmSwitch demo:**
     `alert-before.log` (`dialog`) against `alert-after.log` (`alertdialog`, name and description intact).
- **Doc-check:** React's `<form>` (a function `action` forces POST, else `method` is a plain attribute), Radix's
  Dialog and AlertDialog (the installed `DialogContentImpl` writes `role: "dialog"` before the props it is handed;
  AlertDialog's extra behaviours are the outside-press block and Cancel focus, neither adopted), and Next's
  `redirect()` (307, the fragment inherited by the browser) against `node_modules/next/dist/docs`.
- **Assets requested from Will:** none.
- **Board ideas:** the sign-in email step's press before hydration is now safe but says nothing (a visible "waiting"
  cue on its button would); whether a signed-out visitor pressing Get Pro on /pricing should return to /pricing
  (the return list is the app's pages).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the seven Questions above.
- **The signed-in steps for the next build's red-team (none can complete on localhost):** (1) signed out, open the
  renewal nudge's foot link `/account#event-pass-reminders` on the alias, and sign in through the Google chooser,
  through the email code and through the emailed link: each lands `/account` scrolled to the Email preferences row,
  and `#plan` lands `/account` unscrolled; (2) let a session lapse under `/account` (sign out in another tab), then
  press Manage billing, a plan switch, the storage list's switch and `/account/renew`'s page: each goes to
  `/login?next=<that page>` and back to it; (3) "Partyreel Support" and "P4rtyr33l Team" are refused with "That name
  isn't available." at `/welcome`'s name step, `/account`'s display name, a name-only event's door (join and
  rename) and through the magic link's adopted name, while "Sam Partyreel" is accepted and the operator's held
  "Partyreel" keeps working; (4) one confirm each (Sign out everywhere, delete an event, block a guest, the viewer's
  Delete this upload and Remove this item, the admin's Remove this photo) reads `alertdialog` in the accessibility
  tree, Sign out everywhere's x is gone while "Signing out..." shows, and with a confirm up over the host review
  room and the admin report queue their keys do nothing; (5) forms before hydration on the pages localhost cannot
  reach (`/account`'s three, `/welcome`, the guest name step and password gate, the admin composer on the admin
  host): hold the scripts (DevTools request blocking on the phone-width tab), press, read the address; and once on an
  iPhone's Safari and a desktop Firefox, the two engines this lane could not run itself except headless Firefox.
- **Look at first:** `src/components/ui/client-form.tsx` and the walk logs; `src/lib/constants/reserved-names.ts` with
  its table test; `src/lib/auth/return-path.ts` (`ANCHORED_RETURNS`, `returnWithAnchor`); `popup-kinds.ts`'s `role`.
