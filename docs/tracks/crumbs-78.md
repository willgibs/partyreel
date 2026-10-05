---
track: crumbs-78
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e9b874eb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/export/phone-copies.server
  - src/lib/lifecycle/reclaim
  - src/lib/lifecycle/sweeps/expired-events
  - src/lib/lifecycle/sweeps/removed-media
  - src/lib/lifecycle/account-deletion
  - src/lib/db/mutations/social
  - src/components/guest/reel/live-reel-view
  - src/components/guest/reel/live-reel.test.tsx
  - src/components/shared/action-tooltip
  - src/app/error.tsx
  - src/app/global-error.tsx
  - src/lib/observability/sentry
  - src/components/shared/route-error
  - src/app/(dev)/design/(shell)/lab/tools/boom/
  - src/lib/r2/grid-items
  - src/components/admin/moderation-grid
  - src/app/admin/albums/
  - src/components/admin/mfa-enroll
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
  - src/lib/media/
---

# lp/crumbs-78

**Goal.** Nine small ROADMAP crumbs off the parked boards' surfaces: the media phone-key typed seams dropped now the types know the column; a person report records that its reporter was signed in; LiveReelView's two dead props removed; a tooltip comment that says the wrong delay; the root error boundary reported apart from the global one, with a probe for the global one; the admin moderation feed draws previews, never originals, and ModerationGrid takes its actions as props; the MFA secret in the sans face.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3132 is yours; 3000 is Will's desk, never touched; 3130 is the Orchestrator's gate.

**The fixes**, each pinned by a test that fails on the old code where behaviour changes (pure deletions and comments need none):
1. **Typed seams:** `src/lib/db/types.ts` knows `media.phone_key` now, so its seams go: the `.overrideTypes` on the `MEDIA_KEY_COLUMNS` reads (`reclaim.ts` with `readPhoneKeys`, the sweeps `expired-events.ts` and `removed-media.ts`, `account-deletion.ts`) and `phone-copies.server.ts`'s, with its 42703 fallback. Leave every other `.overrideTypes` (they narrow other things), and the args beside `rpc("create_media*")` in the upload routes (a later lane owns those routes).
2. **Reports:** a person report (`createProfileReport` in `src/lib/db/mutations/social.ts`) stores `reporter_signed_in = false` though only a signed-in person can send one: write true, so the field is right before anything reads it.
3. **Dead props:** `LiveReelView`'s `creatorAsked` and `onCreatorAskSpent` (`live-reel-view.tsx`) have no caller; remove them with their pins in `live-reel-view.test.tsx` and the stub in `live-reel.test.tsx`.
4. **A wrong comment:** `src/components/shared/action-tooltip.tsx` says the root tooltip delay is 200 ms; `providers.tsx` sets 0. Correct the comment.
5. **Errors:** the root `error.tsx` and `global-error.tsx` both report `render:global`; give the root its own `render:root` area (`observability/sentry.ts`'s `SentryArea`, `route-error.tsx`'s `HELP_BY_AREA`), so Sentry tells them apart without the stack.
6. **A probe for the global boundary:** `/design/lab/tools/boom` lands only on the root `error.tsx`; a `?boundary=global` mode that crashes the root layout exercises `global-error.tsx` (dev-only).
7. **Admin cost:** the moderation feed's tiles load originals (`toModerationFeedItems` in `src/lib/r2/grid-items.ts` mints no preview): mint each row's `preview_key`, as the album feeds do, the original only where no preview exists.
8. **Admin structure:** `ModerationGrid` (`src/components/admin/moderation-grid.tsx`) imports its server actions at module scope, so it mounts nowhere but its own page; take them as props, as `TriageStatusControl` does (its callers in `src/app/admin/albums/`).
9. **Admin type:** the MFA enrolment secret (`src/components/admin/mfa-enroll.tsx`) is a bare `<code>` in preflight's mono stack; give it `font-sans`, as the account page's code does.

Wiring rigor: the whole gate, and `lab:smoke` (the boom tool and the Library).

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
