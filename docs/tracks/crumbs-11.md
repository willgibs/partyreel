---
track: crumbs-11
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "277f31a3"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/constants/reserved-slugs
  - src/lib/constants/tiers-sql.test.ts
  - src/lib/validation/event
  - supabase/migrations/20260929110000_slug_family.sql
  - src/app/(auth)/
  - src/app/(app)/layout.tsx
  - src/components/app/pricing/return-path
  - src/lib/auth/
  - src/proxy                             # added (proxy.ts + its test): a layout cannot read its URL; the proxy hands the gate its path
  - src/app/(print)/layout.tsx            # added: the second gate, re-declared, redirected bare the same way
  - src/components/auth/login-form        # added: /login's form carries the path to both sign-in methods
  - src/lib/slug                          # added: suggestSlug and the slug field's "current" read the family too
  - src/lib/validation/profile            # added: the /u/ handle wears the same reserved words
  - src/components/social/handle-field    # added: a grandfathered handle reads as current, never as refused
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/auth-accounts.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - supabase/migrations/20260928130000_free_shift.sql
---

# lp/crumbs-11

**Goal.** Close two gaps before launch opens signups: the reserved words refuse only whole slugs (so any account can hold `partyreel-support` or `partyreel-demo`), and a signed-out host pressing a mail's button lands on the dashboard after sign-in instead of the page the button named.

## The brief

Two security-minded fixes before launch opens signups (it is off until then, so no stranger can act on either today):

1. **The `partyreel` slug family.** `RESERVED_SLUGS` (`src/lib/constants/reserved-slugs.ts`) and `set_event_slug`'s `= any(array[...])` refuse whole slugs only. Since the free/pro shift gave Free the custom link, any account on any plan can hold `partyreel-support`, `official-partyreel` or (once the demo is renamed) `partyreel-demo`: a phishing page at a URL our own domain vouches for.
   - Refuse any slug containing `partyreel`, in both the app's validation (`src/lib/validation/event.ts`) and the SQL setter, with the parity `tiers-sql.test.ts` holds.
   - Consider the obvious look-alikes (a digit for a letter, `party-reel`) and say which you took.
   - The migration restates `set_event_slug` from its newest definition (`20260928130000_free_shift.sql`), with drift md5s and a rolled-back proof at its foot. The Orchestrator applies it.
   - Read the live `events.custom_slug` column first. A live slug the new rule would refuse is grandfathered or named in your Handoff, never silently broken.
2. **A mail's button through sign-in.** A signed-out host pressing a mail's button (Renew Event Pass to `/account/renew`, Manage storage to `/dashboard`) lands on the dashboard after sign-in, not the button's page: `/login` takes no return path, and the `(app)` gate redirects bare.
   - Carry a return path through the gate, `/login`, both sign-in methods (Google OAuth through `/auth/callback`, and the email code) and back.
   - Validate it against an allow-list of same-origin app paths: the checkout's `src/components/app/pricing/return-path.ts` is the shape to reuse; move it to `src/lib/auth/` if it becomes shared.
   - It must never become an open redirect: no scheme, no `//`, no backslash tricks, no encoded escapes. Pin each refusal with a test.
   - Doc-check Supabase's `signInWithOAuth` `redirectTo` and this Next.js's redirect APIs first (`node_modules/next/dist/docs/`).

**Paths:** `crumbs-10` runs beside you, and none of its paths are yours. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for the slug rule on both sides, and for every open-redirect refusal.
- The rolled-back SQL proof.
- The gate's redirect, carrying its path, under `next start`.
- Sign-in itself is allow-listed and cannot run on localhost, so name exactly what the alias red-team walks: a signed-out Renew link and a Manage storage link, each through the account chooser, landing where they point.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

None is a one-way door; each is built as recommended and is Will's to overrule.

- **Which look-alikes does the family read?** Recommended and built: a hyphen anywhere (`party-reel`,
  `p-a-r-t-y-r-e-e-l`) and a digit for the letter it resembles (4 a, 3 e, 1 l, 7 t: `p4rtyreel`, `partyr33l`,
  `partyree1`, `par7yreel`). Left alone: a dropped or doubled letter (`partyrel`, `partyreeel`; folding it refuses
  `party-relay`, `party-release`) and letter confusables (`partyreei`). Pinned both ways in `reserved-slugs.test.ts`.
- **`party-reel` refuses the two plain words too.** "Our party reel" suggests no link, and `sams-party-reel` reads "The
  Partyreel name is reserved. Try another." Recommended: keep (the link already sits on partyreel.com, and
  `party-reel-support` reads as us). The other branch: drop the hyphen from the fold (`BRAND_FOLD.from`, and the
  migration's `'4317-'`) and keep the digits.
- **The `/u/` handle refuses the family too** (the same reserved list, the same phishing page by another path, and
  `profileSlugSchema` is the handle's only gate). Recommended: yes, built.
- **The live values the family refuses stay working, with no operator exception in the RPC.** Read live before
  writing (2026-09-29): event slugs `partyreel-demo` (2485e1e6, "Partyreel Demo", held by willg97's host account, not
  the operator's) and `testing`; handles `partyr33l` (88d50fe4, the operator's own, `is_admin`) and one other. `partyreel-demo` and `partyr33l` are
  grandfathered: no resolver re-validates a stored value (`get_event_by_qr_token` matches any stored slug, proved as
  anon in the rolled-back check), the rule refuses only the next SET (the demo's own re-set included), and both
  fields read a held value as current. A platform link on the brand is written with the service role, deliberately.
- **The return is a page, never its query or fragment.** `/account/renew?utm=x` lands on `/account/renew`; the renewal
  nudge's foot link `/account#event-pass-reminders` lands on `/account` unscrolled after a sign-in (the anchor never
  reaches the gate; Deferred below). Recommended: as built.
- **Every `next` the callback follows now meets the one allow-list,** the guest doors' too (`/e/<token|slug>`,
  `/u/<handle>` are on it), and a failed link or a provider refusal carries `next` back to `/login`, so the retry
  lands on the page. One test reshaped on purpose (`callback/route.test.ts`, "adopts nothing when the exchange
  fails"): a guest's dead link now lands `/login?error=expired_link&next=%2Fe%2Fqr-token`, not the bare page.
- **The checkout's return-path is shared at its core, not moved whole.** Its matcher (the control-character check and
  the anchored match) is `matchesPathShape` in `lib/auth/return-path.ts`; its list stays beside WelcomeToPro (which
  pages mount the modal is a pricing fact); its five importers are untouched. The other branch: move the module
  whole, editing five files outside the lane.

## System-doc edits (in place, owned facts only)

- `auth-accounts.md`, Sign-in: "A sign-in lands on the page that asked for it" (the gates, `x-pr-path`, both methods,
  the allow-list, `signInLanding`); dashboard settings: ★ the admin callback's allow-list entry is EXACT.
- `host-app.md`, The custom event link: ★ the brand refused as a part (the fold, both halves, the handle, held links).
- `profiles-social.md`, `profiles.slug`: `profileSlugSchema` is the handle's only reserved-word gate (both lists and
  the family); the stale "custom EVENT slugs are the paid ones" dropped (custom links are on every plan since the
  free/pro shift).

## Deferred (ROADMAP one-liners, bucket named)

- Host: six client-side 401 fallbacks still send a bare `/login` (in `src/components/app/`: `checkout-button.tsx:82,115`,
  `manage-billing-button.tsx:32`, `pricing/change-plan-button.tsx:51`, `storage/storage-list-body.tsx:267`,
  `renew-checkout.tsx:93`); each could carry its own page with `loginPath(location.pathname)`
  (`lib/auth/return-path.ts`) (from `crumbs-11`).
- Host: the renewal nudge's foot link (`/account#event-pass-reminders`) lands on `/account` unscrolled through a
  sign-in, because the anchor never reaches the gate; `/login` could carry `location.hash` into its landing for the
  in-page methods and the callback's `next` (from `crumbs-11`).

## Handoff (replaces the chat report)

- **Work commit, pushed:** `506af10c` on `lp/crumbs-11`. No sync commit: `origin/launch-prep` moved only by
  `60256d04`, a record commit (`docs/ROADMAP.md`, `docs/STATUS.md`, `docs/tracks/orchestrator.md`), none of it code
  or a `reads`.
- **Gates, on `506af10c`, each on its own exit code** (logs in `../partyreel-wt/_scratch/crumbs-11/`):
  `pnpm typecheck` 0 (`typecheck.log`); `pnpm lint` 0, four pre-existing warnings, none in a touched file
  (`lint.log`); `pnpm test` 0, 561 files / 6416 tests (`test-final.log`); `zsh scripts/build-lock.sh pnpm build` 0
  (`build-final.log`); `pnpm lab:smoke --base http://localhost:3132` 197 checks, 0 failing (`lab-smoke-dev.log`), and
  `--production --key` against `next start` 203 checks, 0 failing (`lab-smoke-final.log`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is the owned paths (six prefixes added to `owns`
  above, each with its reason, none another lane's: `crumbs-10`'s list checked), this file, and the three system docs
  Record subtractively names.
- **The items:**
  1. The slug family: `BRAND_STEM`, `BRAND_FOLD`, `isBrandSlug`, `isReservedSlug` and the two sentences in
     `reserved-slugs.ts` (the bare word leaves `RESERVED_SLUGS`); refused in `eventSlugSchema`, `profileSlugSchema`
     and `suggestSlug`, and in SQL by `supabase/migrations/20260929110000_slug_family.sql`; `tiers-sql.test.ts` reads
     the clause's stem, fold and sentence back and runs Postgres's semantics over the cases against `isBrandSlug`.
  2. Held values read as current before the rules: `evaluateSlugInput` (`lib/slug.ts`) and `useHandleStatus`
     (`handle-field.tsx`), pinned in `slug.test.ts` and `handle-field.test.tsx`.
  3. The return path: `lib/auth/return-path.ts` (the allow-list, `signInReturn`, `signInLanding`, `loginPath`,
     `withReturn`, `matchesPathShape`), `lib/auth/login-redirect.ts`, the proxy's `x-pr-path` (always overwritten,
     dropped past 128 characters), the `(app)` and `(print)` gates, `/login` (its signed-in redirect honours `next`),
     `LoginForm` (re-checks it; both methods) and `/auth/callback` (the allow-list replaces the prefix guard; failures
     carry `next`). Every refusal pinned in `return-path.test.ts` (47 hostile strings, and non-strings), `callback/route.test.ts`,
     `login-form.test.tsx`, `login-redirect.test.ts` and `proxy.test.ts`.
  4. ★ The admin host's callback stays bare: GoTrue answers `https://admin.partyreel.com/auth/callback?next=%2Fadmin`
     with the Site URL (probed: `auth.flow_state` `ad326593` read `https://partyreel.com/` while the bare `fa0eeba1`
     read the admin callback), so a `next` there would land the operator on the apex. `login-form.tsx`, pinned.
  5. `loginTarget` removed from `admin-host.ts` (its one caller asks `signInLanding`); the checkout's `return-path.ts`
     uses the shared matcher, its tests unchanged and green.
- **Live and local proof:**
  - Rolled-back SQL proof: held on the live schema, rows at the migration's foot (13 of 13 family slugs refused with
    23514 and the sentence; 4 whole words; 6 near misses written; `partyreel-demo` unchanged and resolving as anon,
    its re-set refused; md5 `1b1e914e…` inside, `89cb34de…` before and after; the control shows the live body writing
    `partyreel-support official-partyreel party-reel p4rtyr33l`).
  - The gate under `next start`: `../partyreel-wt/_scratch/crumbs-11/gate-next-start.txt` (a signed-out
    `/account/renew` is `307 /login?next=%2Faccount%2Frenew`; `/dashboard`, a hub room and `/print` carry theirs; a
    query is dropped; an off-list path, an encoded one and a forged `x-pr-path` fall to the bare or true page; the
    callback carries `next` through a refusal and never a hostile one).
  - The Supabase allow-list takes `?next=`: GoTrue's authorize endpoint stored the redirect as given for
    `https://partyreel-git-launch-prep-partyreel.vercel.app/auth/callback?next=%2Faccount%2Frenew` (`66169a8b`) and
    `https://partyreel.com/auth/callback?next=%2Faccount%2Frenew` (`8324de69`), and fell back to the Site URL for an
    unlisted host. The six probes left six inert `auth.flow_state` rows (no user, no code), GoTrue's own to expire.
- **What the alias red-team walks** (signed out each time, through the account chooser; never a typed code):
  1. `https://partyreel-git-launch-prep-partyreel.vercel.app/account/renew` (Renew Event Pass): the address bar
     shows `/login?next=%2Faccount%2Frenew`; Continue with Google, `willg97@gmail.com`: lands on `/account/renew`
     (Pro, so its refusal screen with Open your plan), never `/dashboard`.
  2. `…/dashboard` (Manage storage, Keep my event, Restore my event): `/login?next=%2Fdashboard`, Google, lands on
     `/dashboard`. Then one deep page (`/dashboard/<an event id>/settings`) the same way.
  3. Hostile: `/login?next=https://evil.example`, `/login?next=//evil.example`, `/login?next=%2F%5Cevil.example`,
     each through Google, land on `/dashboard`; `/auth/callback?next=//evil.example&error=access_denied` lands on
     `/login?error=google_failed` with no `next`.
  4. The admin door on `partyreel-admin-git-launch-prep-partyreel.vercel.app`: `/admin` signed out,
     `/login?next=%2Fadmin`, Google as `partyr33l@gmail.com`, lands on the portal on that host (the bare callback),
     MFA as before.
  5. The family: as willg97, a custom link of `partyreel-support`, `party-reel` or `p4rtyr33l` reads "The Partyreel
     name is reserved. Try another." with Save off, `sams-party` is available; the demo's Change field reads
     `partyreel-demo` as current, and `/e/partyreel-demo` still opens the demo.
  6. Optional, Will's ten seconds: the email code's half (Renew link signed out, Email me a code, type it) lands on
     `/account/renew` (`login-form.test.tsx` pins it; no agent types a code).
- **Assets requested from Will:** none.
- **Board ideas:**
  - Display names refuse only whole reserved names (`reserved-names.ts`), so "Partyreel Support" is a legal uploader
    credit and "Hosted by" byline; the family could reach names too (a words-level fold, since names have spaces).
  - The shift's impersonation words (`support`, `billing`, `verify`, `security`, `official`, `refund`) are refused only
    as whole slugs: `/e/billing-update`, `/e/verify-account` and `/e/support-team` stay claimable. Refusing them as any
    hyphen-separated part would take `staff-party` and `help-desk-bash` with them, which is his call.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** one migration,
  `supabase/migrations/20260929110000_slug_family.sql`, applied per its header: drift read `89cb34de…` (live =
  `20260928130000`), apply verbatim, `1b1e914e…` after, grants unchanged (authenticated, service_role, postgres; never
  anon, never PUBLIC), `get_advisors` expected delta none, no types to regenerate. The code is safe on either side of
  the apply (the app refuses the family already). No Worker, Vercel, Stripe, env or Supabase dashboard change.
- **Calls his to overrule:** the look-alike set (hyphens and four digits, no typos); `party-reel` refused as two plain
  words; the family on `/u/` handles; no operator exception in `set_event_slug` (held values grandfathered); the
  return carrying a page but no query or fragment; the checkout's module shared at its core rather than moved.
- **Look at first:** walk 4 (the admin door on its alias): the one place a `?next=` would have broken a working sign-in,
  kept bare by `login-form.tsx`; then walks 1 and 2.
