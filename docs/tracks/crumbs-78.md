---
track: crumbs-78
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and is Will's to overrule.

- **Item 7 needs four files this lane does not own.** The operator's rows never carried `preview_key`: both reads in `lib/db/queries/moderation.ts` select `original_key` alone and `ModerationMediaItem` (`lib/moderation/operator-actions.ts`) has no field for it, so `toModerationFeedItems` had nothing to sign; and `r2/stored-copies-policy.test.ts` refuses any new reader of `preview_key` not on its display-only list. *Recommended: edit them, minimally (a select column and a map line in each of the two reads, one type field, one list entry, a pin for the reads) and list them in the lane check; no live lane claims any.* Built so. Item 8 adds a fifth, one mock line: `app/admin/record-not-found.test.tsx` imports the album page, which now imports its Server Actions to hand the grid, and a jsdom test cannot resolve that module's `server-only` chain.
- **Item 6, how a page crashes the root layout.** `src/app/layout.tsx` is not this lane's, and the only thing in it that draws what a page hands it, outside `{children}`, is the `<Toaster />`: `?boundary=global` publishes a toast whose element throws (`toast.custom`, documented API), so no segment boundary stands between the crash and `global-error`. *Recommended over the alternative (the root `error.tsx` rethrowing a magic message, which ships a test hook inside a production boundary).* It waits a beat after mount because the Toaster subscribes after the page's effect (measured in `root-layout-crash.test.tsx` on real sonner: published in the effect itself, nothing crashes). Like the bare probe it needs a production build; dev shows Next's overlay.
- **Item 5 narrows `RouteErrorArea`** to every `render:*` but `render:global`: `global-error` draws its own screen in inline styles and never passes through `RouteError`, so a `render:global` row in `HELP_BY_AREA` would be a dead one that invites the next person to route the last resort through the kit. *Recommended.*
- **Item 2 does not backfill** the person reports already filed: they keep `reporter_signed_in = false` (their queue line reads "Signed-out guest" until closed). Pre-launch test rows, no migration in this lane. *Recommended.*
- **Item 8 names the props `removeAction` and `restoreAction`**, flat and required (`TriageStatusControl`'s `action`, twice), not an `actions` object: nothing to build in a page and a swap is a type error at the prop. *Recommended.*
- **Item 9 is `font-sans` alone.** The account page's code also has `tabular-nums select-all`; a base32 key has no figures to align, and one-press select is a behaviour nobody asked for here. *Recommended.*

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, "Errors: the taxonomy and the boundaries": the root `error.tsx` is `render:root` and `global-error` `render:global`; the boom probe's two modes and how `?boundary=global` reaches `global-error`.

## Deferred (ROADMAP one-liners, bucket named)

- Now, UI: the Library's tooltip specimen (`library/components/gallery-demos.tsx`, its comment above "Tooltip") also says the root provider's delay is 200 ms; it is 0 (not this lane's file: `library-specimens-3` is live there).
- Now, Admin: the Library can draw the operator's `ModerationGrid` now that it takes its writes as props (a specimen on fixture items with no-op writes, as `ReportQueue`'s `writes` already allows).
- Now, Errors: the boom tool's callout on `/design/lab/tools` (and its nav entry) name the bare probe only; `?boundary=global` is described on the probe's own page.
- Now, Tests: `r2/stored-copies-policy.test.ts` reads comment text as code after a template literal with a `${}` in it (its scanner has no parse context): a comment naming `preview_key` in `lib/moderation/operator-actions.ts` read as a reader of it, so a comment can fail the policy; give the scanner a real parse, or have the policy walk the AST.

## Handoff (replaces the chat report)

- **Commits.** The work is `0032b34d0` (pushed), then this manifest alone. Cut at launch-prep `524f39386` (its code is the spec's `e9b874eb`: only record commits sit between). launch-prep has since moved to `3089985dd` (help-words' content, blog and two marketing sections, and records): nothing under `owns` or `reads` changed and `git merge-tree --write-tree HEAD origin/launch-prep` is clean, so there is no sync commit.
- **Gates on `0032b34d0`, each on its own exit code** (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-78/`, pruned with the lane): `pnpm typecheck` 0 (`typecheck-final.log`); `pnpm lint` 0 with no warning (`lint-final.log`); `pnpm test` 0, 949 files and 11,814 tests (`test-full-1.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build-1.log`); `pnpm lab:smoke --base http://localhost:3138 --production` 0, 205 checks and 0 failing, its scope "all" because `src/app/error.tsx` changed, so the boom tool (a 500, as its table expects) and the whole Library were crawled with the closed-door checks (`lab-smoke-prod.log`). Not run: `lab:demo` (no board here) and a second `lab:smoke` against `pnpm dev` (the production run is the stricter one). The smoke printed "PREMISE identity: 8 open asks describe design-system.md, which this change touched": my edit there is the Errors bullets only.
- **Port.** 3138 throughout (the Orchestrator's correction: the brief's 3132 is crumbs-76's): `next start -p 3138` for the production checks and `pnpm dev -p 3138` for the live harness, both killed by port; the Browser pane's tabs are closed, no headless Chrome was started, and 3138 is free.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): 30 owned paths, `docs/systems/design-system.md` (under System-doc edits), this file, and five outside `owns`, each said under Questions: `src/lib/db/queries/moderation.ts`, `src/lib/db/queries/moderation.test.ts`, `src/lib/moderation/operator-actions.ts` and `src/lib/r2/stored-copies-policy.test.ts` (item 7: the rows had to carry `preview_key`), and `src/app/admin/record-not-found.test.tsx` (item 8: one mock line). No live lane claims any.
- **The items** (each pin fails on the old code where behaviour changed: `test-social-old.log`, `test-oldcode.log`, `test-mfa-old.log`):
  1. *Typed seams gone:* the four `MEDIA_KEY_COLUMNS` reads (`lifecycle/reclaim.ts`' `readPhoneKeys`, `sweeps/expired-events.ts`, `sweeps/removed-media.ts` twice, `account-deletion.ts`) and `export/phone-copies.server.ts` with its 42703 fallback and capture; the `rpc("create_media*")` args and every other `.overrideTypes` stay. Forced error case: with `phone_key` dropped from `MEDIA_KEY_COLUMNS`, `tsc` now fails at all four typed reads (`typecheck-break.log`; the overrides hid exactly that). A deletion needs no test; the purge, reclaim, account-deletion and export suites ran unchanged.
  2. *Person report:* `createProfileReport` writes `reporter_signed_in: true` (`db/mutations/social.ts`); `social.test.ts` (new, 5 tests; the two row-shape ones fail on the old code). The route's tests mock the function whole, so nothing held the row before.
  3. *Dead props:* `creatorAsked`, `onCreatorAskSpent` and the `askRef` effect only they fed are out of `live-reel-view.tsx`, with their two pins and a header line in `live-reel-view.test.tsx` and the stub's field in `live-reel.test.tsx`.
  4. *Comment:* `shared/action-tooltip.tsx` says the root provider's delay is 0.
  5. *`render:root`:* `SentryArea` (`observability/sentry.ts`), `RouteErrorArea` narrowed to exclude `render:global` with `HELP_BY_AREA`'s row renamed (`route-error.tsx`), `app/error.tsx` reports it; `global-error.tsx` keeps `render:global`. Pins: `route-error.areas.test.tsx` (new, 3 tests; the root's area one fails on the old code).
  6. *The probe:* `?boundary=global` (`boom/page.tsx`) mounts `boom/root-layout-crash.tsx`, which publishes a toast whose element throws, drawn by the layout's own Toaster (Questions says why). `root-layout-crash.test.tsx` runs real sonner and real boundaries laid out as the root layout lays them (the crash lands on the outer boundary and a page's own on the inner; a toast published in the effect itself never crashes) and `page.test.tsx` the two modes with the gate first: 14 tests. Live on the production build at 3138: no key and a wrong key are 404 in both modes; bare is a 500 into the branded root screen, with its digest and "Still stuck?"; `?boundary=global` is a 200, then `global-error`'s plain screen (system font, #fcfcfc, no digest, no help line), the console says "design-lab boundary probe: intentional root-layout crash", Try again crashes it again and Back home is a document load of `/`.
  7. *Previews:* `toModerationFeedItems` signs each row's `preview_key` beside the original (stably, none for a covered item, none where the row has none), so the grid's own `previewUrl ?? url` draws it; the rows carry it from `queries/moderation.ts`' two selects and `ModerationMediaItem.previewKey`. 7 tests fail on the old code. Live (a throwaway harness page on `pnpm dev -p 3138`, deleted and never committed: the real feed read, signer and grid, writes that change nothing): 60 tiles, 59 drew `preview.webp` and the one row with no preview drew its 242,438-byte original; those 60 originals total 20,836,079 bytes (a read-only SQL count on `ddafaemglzmuekbtjwzn`) against about 1.5 MB of previews (28 measured by range request at 712,048 bytes, about 25 KB each, the rest scaled).
  8. *Writes as props:* `ModerationGrid` takes `removeAction` and `restoreAction` (`moderation-grid.tsx`, `ModerationActions` exported) and imports no Server Action; both pages in `app/admin/albums/` pass `removeMediaByOperatorAction` and `restoreMediaAction`. `moderation-grid.test.tsx` mocks no actions module now and presses both through the props (11 tests); `albums/page.test.tsx` (new) and `[eventId]/page.test.tsx` pin that each page hands the right action to the right prop. On the old source the grid test cannot even load (its `server-only` chain). Live (the harness, with the real Server Actions as props, pressed with no admin session): the toast reads "Not authorized.", the dialog stays open and the six rows still read `approved` afterwards (SQL), so the gate behind the new path holds.
  9. *MFA:* the secret's `<code>` is `font-sans` (`mfa-enroll.tsx`); `mfa-enroll.test.tsx` (new, 2 tests; the face one fails on the old markup).
- **Assets requested from Will:** none.
- **Board ideas:** the four Deferred lines above.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. A heads-up, not a change: a Sentry alert or saved search keyed on `area:render:global` for the root boundary needs `render:root` beside it (nothing in the repo does).
- **ROADMAP lines this closes** (the Orchestrator's to delete at the merge): "Code hygiene: `types.ts` knows `media.phone_key` now..." (keep only its `rpc("create_media*")` args tail), "Code hygiene: `LiveReelView`'s `creatorAsked`...", "Reports: a person report...", "Admin: the moderation feed's tiles load originals...", "Admin: `ModerationGrid`...", "Admin: the MFA enrolment secret...", "UI: `shared/action-tooltip.tsx`'s comment...", and both "Errors:" lines.
- **Calls his to overrule** (each is a Questions line, built as recommended): the four files and one mock line outside `owns`; the toast as the probe's way into `global-error`; `RouteErrorArea` without `render:global`; no backfill of old person reports; flat `removeAction` and `restoreAction` props; `font-sans` alone on the secret.
- **Look at first:** the probe on a production build (`pnpm build`, `pnpm start`, then `/design/lab/tools/boom?key=...&boundary=global`), then the five files outside `owns` (`git diff origin/launch-prep...HEAD -- src/lib/db/queries/moderation.ts src/lib/moderation/operator-actions.ts`).
