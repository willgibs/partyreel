---
track: crumbs-13
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a40310f1"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(auth)/actions.ts
  - src/app/(app)/account/
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
