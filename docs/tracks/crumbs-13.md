---
track: crumbs-13
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a40310f1"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(auth)/actions.ts
  - src/app/(auth)/actions.test.ts
  - src/app/(app)/account/
  - src/components/auth/account-door.test.tsx
  - src/components/guest/foreign-ticket.test.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/components/shared/backdrop/photo-section.test.tsx
  - src/components/auth/account-door.tsx
  - src/components/guest/guest-header.tsx
  - src/app/api/guests/leave/route.ts
  - src/components/app/user-menu.tsx
  - src/components/app/user-menu.test.tsx
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/home/cinema-hero-card.tsx
  - src/components/marketing/sections/home/cinema-hero.test.tsx
  - src/components/marketing/sections/features/album/album-fill-grid.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx
  - docs/systems/auth-accounts.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-13

**Goal.** Sign out signs out this device only, with Sign out everywhere deeper in the account's settings (Will's call); the home's golden photograph loaded once at 1440; pnpm lint's three standing warnings cleared.

## The brief

Two findings from build 20's red-team (`../partyreel-wt/_scratch/redteam-20/ledger.txt`) and a ROADMAP line.

**1. Sign out signs out this device only** (Will, 2026-09-29: "I like the idea of device sign-out rather than everywhere. Especially considering how helpful it is to use both a desktop and a mobile device across our app for different purposes. Sign out everywhere can be deeper in settings."). Today every sign-out calls `supabase.auth.signOut()` with no scope, and auth-js then signs the account out everywhere: when partyr33l signed out on the main alias, her admin portal session ended too, and the operator had to pass Google and the authenticator again. Audit every call (`src/app/(auth)/actions.ts`'s `signOutAction`, `src/app/(app)/account/actions.ts`, `src/components/auth/account-door.tsx`, `src/components/guest/guest-header.tsx`, `src/app/api/guests/leave/route.ts`, and any other) and give each the scope its job wants: an ordinary Sign out is `{ scope: 'local' }`; deleting an account ends every session. Add **Sign out everywhere** deeper in the account's settings (a security corner of `/account`, not the menu), with a confirm that says it signs out every device, this one included. Check Supabase's current docs (Context7) for `signOut` scopes and what `local` leaves on the server. A test per call site pins its scope.

**2. The home's golden photograph loads twice at 1440 on a pixel-ratio-1 screen.** It is preloaded with two `sizes` (the print's 272px picks the `w=384` copy; a full-width band's 100vw picks `w=1920`), and Chrome shows the cached 1920 copy in every golden image, so the 384 copy goes unused whenever it arrives second (2 of 4 cold loads warned "preloaded but not used"); at pixel ratio 2 three copies are fetched (640, 3840, 384). One copy should serve every place that paints it, or the second preload should go. Measure cold loads at 1440×900 at pixel ratios 1 and 2 before and after (`usher/kit/page-console.mjs` or your own headless Chrome): at most the one known warning (the root 404's `trail.css`).

**3. `pnpm lint`'s three standing warnings** (ROADMAP): the unused `useEffect`/`useState` in `src/components/marketing/sections/features/album/album-fill-grid.tsx`, the unused `step` in `src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx`. Clear them, and retire the ROADMAP line in your Handoff's Deferred.

**Not yours:** `settings-wiring` owns the guest door (`src/components/guest/door/`, `entry-shell.tsx`) and `triage-r2-wiring` owns the admin portal's pages and components; if a sign-out lives in one of those, name it as a relay in your Handoff rather than editing it.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where does Sign out everywhere live on `/account`, and how does it read?** Recommended (built): its own card
  closing the security corner (after Password and the flagged Passkeys, before Email preferences), named by its act
  as Delete account is: "Sign out everywhere" / "Signing out from your account menu signs out only this device. If a
  phone goes missing or a shared computer is still signed in, sign out of every device at once." / one outline button
  wearing the menu's sign-out icon. Its confirm (`kind="confirm"`): "Sign out everywhere?" / "You'll be signed out on
  every device, this one included. You can sign back in on any of them." / Stay signed in, Sign out everywhere.
  Alternatives: a row inside the Password card (lighter, but that card is the password's), or a Devices card that
  lists each session to end one at a time (the board idea below).

## System-doc edits (in place, owned facts only)

- `docs/systems/auth-accounts.md`: a new "Signing out" section (every sign-out names its scope and why; the `local`
  ones and the two `global` ones, the deletion's as the ban's belt; what no scope reaches, an access token already
  issued, and why `getUser()` closes it; which sign-outs put the guest tickets down and why the door's "Not you?"
  keeps them); "Open this before you" gains the sign-out line.

## Deferred (ROADMAP one-liners, bucket named)

- Retire (done here): "Code hygiene: `pnpm lint`'s three standing warnings…" (`pnpm lint` reads 0 warnings at
  1e03663f).
- Retire (done here): "Marketing (performance): the home's `full-quality` section (`PhotoSection`, …, `priority`…)
  preloads a `w=1920` photograph for a section far below the fold" (every frame lazy now, pinned by
  `photo-section.test.tsx` and `cinema-hero.test.tsx`).
- Auth: the device Sign out ignores a refused GoTrue call (the network, the auth server) and still leaves for
  `/login`, which sends a still-signed-in host back to `/dashboard` as if nothing had happened; Sign out everywhere
  answers the same refusal (`src/app/(auth)/actions.ts`) (from `crumbs-13`).

## Handoff (replaces the chat report)

- **Commits:** work `1e03663f` (pushed to `origin/lp/crumbs-13`), this handoff commit on top. No sync: launch-prep
  moved to `bad59db0` with records and the disposable-mode r2 board, none of it in this lane's files or `reads`
  (`git diff --name-only e2b4d59e origin/launch-prep`), and `git merge-tree --write-tree origin/launch-prep HEAD`
  is clean.
- **Gates on 1e03663f**, each its own exit code (logs in `../partyreel-wt/_scratch/crumbs-13/gate-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0, with 0 warnings; `pnpm test` 0 (570 files, 6486 tests); `zsh
  scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (161 checks, 0 failing).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file. Five paths joined
  `owns` before they were edited: `src/app/(auth)/actions.test.ts` (new, the actions' scope pins),
  `src/components/auth/account-door.test.tsx` and `src/components/guest/foreign-ticket.test.tsx` (their call sites'
  scope pins), and `src/components/shared/backdrop/photo-section.tsx` with its test (the preload's source).
- **1. Sign out is this device's.** The four `.signOut(` calls in `src/` (grep) each name their scope:
  `signOutAction` `local` (the account menu's and the admin bar's), the guest header's `local`, the door's "Not you?"
  `local`, `deleteMyAccountAction` `global` (after an accepted deletion only: the ban is best-effort, and after it
  GoTrue answers 403 `user_banned`, which auth-js counts as done). `src/app/api/guests/leave/route.ts` signs nobody
  out: it expires only `pr_guest_*`, and `route.test.ts` already pins exactly those two with an `sb-*` auth cookie
  in the jar. The new `signOutEverywhereAction` (`global`, the guest tickets down too) answers a refusal instead of
  redirecting; its card is `src/app/(app)/account/sign-out-everywhere-card.tsx`. Pins:
  `src/app/(auth)/actions.test.ts`, `src/app/(app)/account/actions.test.ts` (and no sign-out on a refused deletion
  or a failed proof), `account-door.test.tsx`, `foreign-ticket.test.tsx`, `user-menu.test.tsx` (each menu's one
  sign-out row, never everywhere), `sign-out-everywhere-card.test.tsx` (asks first, names this device, the safe
  answer sends nothing, the tickets are down before the action, a refusal toasts and keeps the confirm). Each scope
  pin fails when its call loses its scope (mutated by hand: the three bare calls back and the device sign-out made
  `global`; 4 of 4 failed, then restored). Supabase's docs (Context7): `local` ends this session and its refresh
  token and keeps every other; an issued access token stays valid until its expiry under any scope, and only
  `getUser()` sees the revocation.
- **1, local walk (signed out, on a temporary page deleted before the commit):** the confirm's press showed
  "Signing out…" with both buttons disabled, the action answered 303 `x-action-redirect: /login;push`, the page landed
  on `/login`, and the seeded ticket's localStorage half and its cookie were gone (`../partyreel-wt/_scratch/crumbs-13/press.mjs`).
  Screens at 1440 light and dark and 375: `../partyreel-wt/_scratch/crumbs-13/look-*.png` (a centred confirm, 384 wide at a desk and
  343 at 375 with the act stacked on top; focus on Stay signed in at a desk; no overflow).
- **1, live: not run by this lane.** Sign-in cannot run on localhost (the allow-list) and no `lp/*` push deploys, so
  the merge's alias red-team walks it: (a) willg97 signed in in two browsers, the menu's Sign out in one, the other
  reloads `/dashboard` still signed in; (b) partyr33l with the admin portal open (AAL2) signs out of the main alias,
  and `/admin` reloads to the portal with no Google and no TOTP again (build 20's side effect gone), then the reverse
  from the admin bar; (c) `/account` Sign out everywhere, the confirm, `/login` here, and the other browser's next
  navigation lands on `/login`; (d) an album's guest-header Sign out keeps the page and leaves the other browser
  signed in.
- **2. The golden photograph.** The home's switching photograph section (`PhotoSection`) loads every frame lazily:
  it is never a first screen, and its eager rest frame was the golden photograph's second preload (100vw, `w=1920`,
  beside the hero's `w=384`). `cinema-hero.test.tsx` renders the whole page and pins no photograph preloaded twice and
  nothing preloaded but the hero's (both fail on the old code, the first naming `mkt-wedding-golden-01.jpg`). Cold
  loads, 1440×900, a fresh browser profile each, a local production build with the server's image cache warmed
  (`../partyreel-wt/_scratch/crumbs-13/preload-probe.mjs`): before (this branch built before the section's change,
  `before-dpr1.log`, `before-dpr2.log`), golden copies 384 + 1920 + 256 at DPR 1 (4 of 4) and 640 + 3840 + 384 at DPR
  2 (2 of 2); after on 1e03663f (`after-1e03663f-dpr1.log`, `-dpr2.log`), 384 + 256 at DPR 1 and 640 + 384 at DPR 2,
  the full-bleed copy waiting for its section. One warning a load in both, the known `trail.css`, beside the
  `/_vercel/*` 404s that exist only under `next start`. The local "before" never reproduced the alias's unused-preload
  warning (its timing), but after the fix it cannot recur: the hero's is the one golden preload left, and its images
  are parsed before any other golden copy is asked for. The second copy left is the lazy thumbnails' own slot
  (decomposition at 140px, the film strip at 176px), about 3 KB, until the stand-ins become each slot's own
  photograph. The section still paints on arrival (`scroll-probe.mjs`: the rest photograph loaded once scrolled to,
  at 1440 on `/` and `/features/album` and at 375 DPR 3; `shot-home-1440.png`, `shot-home-375.png`).
- **3. Lint:** `album-fill-grid.tsx`'s unused `useEffect`/`useState` and `review-session.tsx`'s unused `step` are
  gone; `pnpm lint` reads 0 warnings.
- **Relays:** `triage-r2-wiring`: the admin bar's Sign out (`src/components/admin/admin-bar.tsx`) posts
  `signOutAction`, so it is this device's now with no edit there. `settings-wiring`: no sign-out lives in the guest
  door or `entry-shell.tsx`, and guest-flow.md's header paragraph stays true (the scope's home is auth-accounts.md).
- Assets requested from Will: none.
- Board ideas: a Devices card on `/account` listing each signed-in session (device, browser, last active, this one
  marked) with Sign out on each above Sign out everywhere; the browser gets no session list from GoTrue, so it needs
  a SECURITY DEFINER read of the caller's own `auth.sessions` and a revoke scoped to them.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:** Sign out everywhere includes this device (`global`, the brief's words; `others` would
  keep this one signed in, one word in `signOutEverywhereAction`); the card's place and words (the Question); a
  refusal is a toast with the confirm left open for another try; the switching photograph's rest frame is lazy now
  (it was eager so it would never wait on a lazy load; lazy loading starts before the section arrives); the home
  preloads nothing below its hero, pinned (a section that someday opens above the fold moves that pin); the door's
  "Not you?" signs out this device and keeps the guest tickets, since the same person carries on.
- **Look at first:** the alias walk (b), partyr33l's admin portal surviving a main-site sign-out; then `/account`'s
  new card and its confirm at 1440 and 375.
