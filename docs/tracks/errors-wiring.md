---
track: errors-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The verdicts landed, one line each, and the calls his to overrule
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
