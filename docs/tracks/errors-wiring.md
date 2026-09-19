---
track: errors-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "22438704"          # the launch-prep SHA the branch was cut from
board: none             # a wiring round: every failure page one grammar; the error-pages board retires with it
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/not-found-screen.tsx
  - src/components/shared/route-error.tsx
  - src/components/shared/error-digest.tsx
  - src/components/shared/failure-grammar.test.tsx
  - src/components/guest/guest-bar.tsx
  - src/components/admin/admin-not-found-screen.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/marketing/marketing-route-error.tsx
  - src/app/not-found.tsx
  - src/app/error.tsx
  - src/app/global-error.tsx
  - src/app/(app)/not-found.tsx
  - src/app/(guest)/error.tsx
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/admin/not-found.tsx
  - src/lib/surface/surface.test.ts
  - src/app/(dev)/design/sandbox/error-pages/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/error-pages.json
  - docs/systems/lifecycle-recovery.md
  - src/lib/surface/index.ts
  - src/proxy.ts
  - src/lib/observability/sentry.ts
  - src/app/globals.css
  - src/app/(app)/error.tsx
  - src/app/(auth)/error.tsx
  - src/app/admin/error.tsx
  - src/app/admin/layout.tsx
  - src/app/(guest)/layout.tsx
  - src/app/(marketing)/error.tsx
  - src/app/(marketing)/(cinema)/not-found.tsx
  - src/app/(marketing)/(paper)/not-found.tsx
  - src/components/guest/guest-header.tsx
  - src/components/admin/admin-shell.tsx
  - src/components/shared/trail/trail.tsx
  - src/lib/type-ladder-policy.test.ts
  - src/app/(marketing)/marketing-h1-policy.test.ts
---

# lp/errors-wiring

**Goal.** Land Will's eight verdicts on the `error-pages` board as production (2026-09-19, batch three, verbatim in
`docs/design/rulings.md`): `grammar=shared`, `ways-out=guided`, `picture=today` with his note ("it does look weird
beneath the content. It may look better as a replacement for the icon above. The page has one visual image plus the image
trail behind"), `code=always`, `surround=shell`, `private-event=family` with his note ("A simple link to Partyreel
homepage here would be nice"), `admin-404=portal`, `global-crash=home`. The board's pictures are the spec
(`sandbox/error-pages/spec.ts`, `templates.tsx`, `board.tsx`, `chrome.tsx`): land THOSE pictures. The board retires in
this lane (its directory deleted, its three registration lines gone, its RULINGS row in `touchpoints.ts` rewritten as
shipped the way `git show 73451c79 -- "src/app/(dev)/design/touchpoints.ts"` did for `image-trail`; `pnpm design:rules`
regenerates `docs/design/library.md`). Not in this round: the group 404s' fixed `min-h-[60vh]` box (a ROADMAP line, its
own small decision); a runbook page for the admin (the admin help line stays unlinked).

**The target API.** `src/components/shared/not-found-screen.tsx` stays a server component with NO Sentry import and gains
`visual?: ReactNode` (replaces the icon circle; type it as a union with `icon` so exactly one is present), `help?:
ReactNode` (the quiet line, its own stagger child) and `digest?: string` (renders a new client leaf
`src/components/shared/error-digest.tsx`: the sentence "This helps us find what happened if you tell us about it.", the
code, a Copy control whose clipboard write is guarded with `.catch(() => {})`). Stagger indices: visual 0, heading 1,
actions 2, help 3, footnote 4, digest 5; `globals.css`'s `[data-not-found]` rule needs no change.
`src/components/shared/route-error.tsx` keeps its name and its `captureError` effect (it IS the crash wrapper) and
renders `NotFoundScreen` inside `<main>` with a module-local `HELP_BY_AREA` so the four group `error.tsx` files stay one
line each. `captureError` never enters the shared primitive: every real 404 would report.

**The files, in build order.** 1. `error-digest.tsx` (new). 2. `not-found-screen.tsx` (the three props; the doc comment
lists nine call sites). 3. `route-error.tsx` (the fold; `digest={error.digest}`; the effect kept). 4.
`src/components/guest/guest-bar.tsx` (new, session-less: the logo row lifted verbatim from the bad-token 404). 5.
`(guest)/error.tsx` wrapped in `GuestBar` and a `flex min-h-dvh flex-col` column (a guest crash has no header today). 6.
`(guest)/e/[token]/not-found.tsx` on `GuestBar`, plus `help`. 7. the hand-rolled private lock in
`(guest)/e/[token]/page.tsx` becomes `NotFoundScreen` with `Lock`, its two sentences and ONE action to `/` labelled "What
is Partyreel?", under the real `GuestHeader` (it has a token there). 8. `marketing-not-found.tsx`: with `strip` true,
`visual={<MissingFrameStrip />}` and no icon, the strip out of the footnote, `help` to `/help`; with `strip` false (the
root 404) `Compass` stays and the trail is the one visual. 9. `marketing-route-error.tsx`: `visual` = the strip labelled
500, the "Still stuck?" line moved into `help`, `digest` shown. 10. `src/app/global-error.tsx`: an inline-styled
`<a href="/">Back home</a>` beside Try again and the digest with Copy, its own html and body and inline styles kept, the h1
untouched (the ladder test's sole unstyled exception). 11. a NEW root `src/app/error.tsx` (client, `{error, reset}`, no
html or body, renders `RouteError`; it catches a crash inside a group's OWN layout, which skips every branded boundary
today). 12. `src/components/admin/admin-not-found-screen.tsx` (new, session-less: a Logo and "Ops" badge bar in the
shape of `sandbox/error-pages/chrome.tsx`'s admin chrome minus nav and sign-out, then `NotFoundScreen` titled "This page
isn't part of the operations portal" with one action to `/admin`). 13. `src/app/not-found.tsx` branches on
`surface() === "admin"` (from `@/lib/surface`, inlined at build) to render it with no marketing chrome and no trail,
else today's tree unchanged: NO new route and NO proxy change, so `SURFACE_404_PATH` stays unmatched and
`surface.test.ts` stays green. 14. `admin/not-found.tsx` gains the unlinked help line. 15. `(app)/not-found.tsx` gains
`help` to `/help`. 16. retire the board. 17. `src/app/(dev)/design/rules/component-notes.ts` gains `for:` lines for the
three new files (an exception like the registration lines; not in `owns`). 18. `pnpm design:rules`.

**The copy.** The help line, "Still stuck? {link}.": the host app, the guest and the marketing 404 link "Visit the help
center." to `/help`; auth and the marketing 500 link "Tell us what happened." to `/contact`; the admin reads "Check the
runbook." unlinked. No em-dashes anywhere.

**Tests.** A new `src/components/shared/failure-grammar.test.tsx` opening with `// @contract-for:` lines for the three
shared files (function, never look): no `digest` renders no code and no Copy, a digest renders both and the sentence; the
Copy path survives a rejecting clipboard; a source scan that `not-found-screen.tsx` matches neither `@sentry` nor
`captureError`; a source scan that every crash file (`src/app/error.tsx`, `global-error.tsx`, the four group
`error.tsx`, `marketing-route-error.tsx`) contains `captureError`; every failure file passes `help`.
`src/lib/surface/surface.test.ts` gains one source pin: `src/app/not-found.tsx` imports `@/lib/surface`. The ladder test
stays green unchanged; any desk count pin adjusts for the retired board.

**Binds.** The bible; the existence rule (a deleted event and a missing one are one page); the Sentry rule above; the
type ladder on every h1; `marketing-h1-policy`; the copy is open (bible 21); reduced motion honoured; stage explicitly,
never `--no-verify`. Calls that stay Will's, stated in the Handoff: the strip as the icon on both marketing screens;
`Compass` kept on the root 404; the unlinked admin line; `/contact` on the auth crash.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3131` (the retired board gone from its
  table); `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Locally, every failure page at 1440 and 375: `/nope` (the root 404: Compass, the trail, the help line, the footnote
  links), `/contact/nope` and `/help/nope` (the strip where the icon was), `/e/zzzzzzzz` (the guest bar and the help
  line), a private event's link (the lock with the homepage action), a forced crash per group through a temporary
  throwing page NEVER committed, `/design/lab/tools/boom?key=` (the global crash: Back home and Copy), and with
  `NEXT_PUBLIC_SURFACE=admin` in a local build, `/features` and `/nope` (the portal screen, no marketing chrome,
  `/admin` the only link). The Orchestrator repeats the list on the alias and checks Sentry: one `render:*` event per
  crash and none per 404.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The marketing 404 is the one screen that gained NO help line.** The manifest's copy line gave it
  "Visit the help center." to `/help`, but that screen already carries the help center as its SECOND
  ACTION and `contact us` in its footnote, so the quiet line would have named `/help` twice, three
  lines apart. `ways-out=guided` reads "one quiet line to the help center or contact, worded for its
  surface", and the board drew it on the GUEST and ADMIN 404s only, because the marketing pages are
  what it was generalizing FROM ("today only the marketing pages point further"). **Recommended, and
  carried:** the marketing 404 keeps its pair and its footnote and gains no fourth pointer. It is one
  prop to reverse, and `failure-grammar.test.tsx` names the exception with its reason rather than
  omitting the file.
- **The root boundary took `render:global`, because no `render:root` exists.** `src/app/error.tsx` and
  `global-error.tsx` now both tag `render:global`: the `SentryArea` union is single-sourced in
  `src/lib/observability/sentry.ts`, which is in this lane's `reads` and not its `owns`. They are told
  apart by the stack, and the two are genuinely adjacent (both mean "the crash escaped every group").
  **Recommended:** add `render:root` in a lane that owns that file (a ROADMAP line below).
- **The boundary probe's contract changed, and its comment is now wrong.** `src/app/(dev)/design/(shell)/lab/tools/boom/page.tsx`
  says "the crash escalates past the root layout into global-error.tsx", which was true only while no
  root `error.tsx` existed. It now lands on the root boundary (verified locally). The probe still earns
  its keep, and the thing it verifies is arguably the more valuable of the two, since a real host can
  reach it. The file is outside this lane's paths, so nothing was edited. **Recommended:** the
  Orchestrator refreshes that comment in one line, and a probe for global-error follows on the ROADMAP.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (no `docs/systems/` line in this lane's paths stated a fact this round changed; `lifecycle-recovery.md`
  mentions the failure screens only through the deleted-event 404 it already describes correctly)

## Deferred (ROADMAP one-liners, bucket named)

- **Now** · A `render:root` Sentry area, so the root `error.tsx` and `global-error.tsx` stop sharing
  `render:global` (one line in `src/lib/observability/sentry.ts`, one in `route-error.tsx`).
- **Now** · A second boundary probe for `global-error`: the existing `/design/lab/tools/boom` now lands
  on the root boundary, so the last-resort screen has no production probe left (its comment needs the
  same edit). A `?boundary=global` that crashes the ROOT layout is the shape.
- **Now** · `/design/library/patterns`'s `RouteErrorMock` still draws the OLD digest chip ("Error code:",
  uncopyable) and no help line, so the Library's static mirror of the crash screen is a round behind.
- **Next** · One copy-with-a-receipt primitive: `marketing/press/copy-button.tsx` and
  `shared/error-digest.tsx` now solve the same three problems (the optional call plus the catch, the
  no-reflow label swap, the unconditional live region) in two places.
- **Next** · The group 404s' fixed `min-h-[60vh]` box (carried over from the manifest's "not in this round").
- **Next** · A runbook page for the operator, which is what turns `Check the runbook.` from an unlinked
  line into a link (`admin/not-found.tsx` and `HELP_BY_AREA`'s `render:admin` row, one href each).

## Handoff (replaces the chat report)

- Head `8bc78dd8`, pushed; synced with `launch-prep` at `b45f94fb` (it had moved by one record commit;
  merged, never rebased, and the whole gate re-run on the merged tree).
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok, the specimen collector ok,
  `pnpm typecheck` ok, `pnpm lint` ok (the 8 known warnings, 0 errors), `pnpm test` ok (2,566 in 242 files),
  `pnpm build` ok (254 pages), `pnpm lab:smoke --base http://localhost:3131` ok (456 checks, 0 failing,
  and `error-pages` gone from its reading table). ★ `rm -rf .next` before the typecheck: the deleted probe
  routes lived on in `.next/dev/types/validator.ts` and failed it on four phantom modules.
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: the 17 owned paths, the board's five
  deleted files, and four registration exceptions the goal names (`sandbox/registry.ts`,
  `(shell)/lab/boards.ts`, `touchpoints.ts`, `rules/component-notes.ts`), plus the two generated artifacts
  (`rules.generated.json`, `docs/design/library.md`) and this manifest. Nothing else.
- **The verdicts, one line each.**
  - `grammar=shared`: `NotFoundScreen` is the one primitive; `RouteError` folded into it and kept its
    `captureError` effect and its name, with a module-local `HELP_BY_AREA` so the five `error.tsx` files
    stay one line each. A source scan refuses `@sentry` or `captureError` inside the primitive, because a
    capture there files an issue for every real 404.
  - `ways-out=guided`: `help` is its own stagger slot (3) below the actions on the host 404, the guest 404,
    the admin portal 404 and all five crash screens; `HelpLine` is single-sourced beside the primitive.
  - `picture=today` + his note: `visual` replaces the icon circle, typed as a UNION with `icon` so a screen
    cannot draw both. The strip stands where the icon was on the group 404s and on the 500 screen; the root
    404 keeps `Compass`, because the trail behind it is already its one visual.
  - `code=always`: a new client leaf `error-digest.tsx` (the sentence, the code, a Copy control with a
    receipt), rendered only when a `digest` prop arrives, so a 404 cannot carry one. `global-error.tsx`
    rebuilds the same two ideas in inline styles.
  - `surround=shell`: the guest crash gained `GuestBar`, the session-less wordmark row lifted out of the
    bad-link 404 (the real `GuestHeader` resolves a session and fetches `/api/me/menu`, which a crash
    boundary must never do). Every other surface already wore its own chrome.
  - `private-event=family` + his note: the hand-rolled lock is a `NotFoundScreen` wearing `Lock`, under the
    REAL `GuestHeader` (it has a token there), with his homepage link as its one action.
  - `admin-404=portal`: `src/app/not-found.tsx` branches on `surface() === "admin"`, so the admin build
    ships `AdminNotFoundScreen` (the Ops chrome minus nav, sign-out and every session read) and the app
    build ships today's tree. NO new route and NO proxy change, so `SURFACE_404_PATH` stays unmatched.
  - `global-crash=home`: a plain inline-styled `<a href="/">` beside Try again (never `next/link`: the
    router is part of what crashed), with the digest and its Copy beneath.
- **The calls that stay his to overrule**, all stated in the goal plus one this round added:
  the strip as the icon on both marketing screens; `Compass` kept on the root 404; the admin's line
  unlinked; `/contact` on the auth crash; **and the marketing 404 gaining no help line** (the Question above).
- **Sentry, proved locally** (the DSN in `.env.local` reports to the real project). A production build with
  three temporary throwing pages, one per reachable group, never committed and deleted before the gate:
  nine crash RENDERS in a browser produced exactly nine `area:render:*` events, split
  `render:guest` 3 / `render:marketing` 2 / `render:auth` 1 / `render:global` 3, matching the visits
  one for one. Across the same window roughly twenty 404 loads (`/nope`, `/help/nope`, `/e/zzzzzzzz`, the
  forced paper 404, both admin-surface 404s) produced ZERO `render:*` events. The digest printed on screen
  matched the server log's (`1935716122`), which is the correlation the Copy control now makes usable.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Captures**, 1440 and 375 each, at
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/errors-wiring/captures/`:
  the root 404, the cinema group 404, the guest bad-link 404, the private lock, the three group crashes,
  the root boundary catching a GROUP-LAYOUT crash, `global-error` with its anchor and its code, the two
  admin-surface 404s from a real `NEXT_PUBLIC_SURFACE=admin` build, and the host/portal 404 pair drawn from
  a probe with their shipped props (both sit behind auth, so the signed-in half is the alias's to confirm).
- **Look at first:** the strip standing where the icon was, at 1440 and at 375, on paper and on cinema, and
  whether the marketing 404 wants the help line after all.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Will's eight verdicts on `error-pages` landed as
production and the board retired. `NotFoundScreen` became the one primitive every failure page draws
from, gaining a `visual` slot typed as a union with `icon` so no screen says the same thing twice, a
`help` slot and a `digest` slot; `RouteError` folded into it and kept the reporting effect that must
never move down. A new root `src/app/error.tsx` closed a gap nothing had caught, where a crash inside a
route group's OWN layout skipped every branded boundary and landed on the unstyled last-resort screen.
The strip took the icon's place on both marketing screens, the guest crash gained a session-less bar,
the private lock joined the family with a way home, the admin host answered as the portal through one
build-inlined `surface()` branch, and the last-resort screen gained a plain anchor and a copyable code.
