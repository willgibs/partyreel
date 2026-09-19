---
track: error-pages
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "1feccb00"          # the launch-prep SHA the branch was cut from
board: error-pages      # round one: every failure page as one grammar
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/error-pages/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/lifecycle-recovery.md
  - src/app/not-found.tsx
  - src/app/global-error.tsx
  - src/app/(marketing)/(cinema)/not-found.tsx
  - src/app/(marketing)/(paper)/not-found.tsx
  - src/app/(marketing)/error.tsx
  - src/app/(app)/not-found.tsx
  - src/app/(app)/error.tsx
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/error.tsx
  - src/app/(auth)/error.tsx
  - src/app/admin/not-found.tsx
  - src/app/admin/error.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/marketing/marketing-route-error.tsx
  - src/components/shared/not-found-screen.tsx
  - src/components/shared/route-error.tsx
  - src/components/guest/guest-header.tsx
  - src/lib/events/gallery-access.ts
  - src/lib/db/queries/guest-events.ts
  - src/lib/observability/sentry.ts
  - src/lib/surface/index.ts
  - src/lib/demo.ts
  - src/app/globals.css
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
  - src/app/(dev)/design/sandbox/app-door/spec.ts
---

# lp/error-pages

**Goal.** Round one of `error-pages`: EVERY FAILURE PAGE AS ONE GRAMMAR, the six not-found pages and the six error
boundaries across the marketing site, the app, the guest pages, the auth group and the admin, reconceived from the
ground up. Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore every surface, everything
unprotected, "at worst, net neutral and fully deleted". Six to eight decisions with `defineExploration`, each drawn on
the REAL failure components (`NotFoundScreen`, `MarketingNotFound` and its `MissingFrameStrip`, `RouteError`,
`MarketingRouteError`, `GlobalError`'s inner content, the private-event lock block recreated) with fabricated `error`
and `reset` props, inside each surface's own chrome in a `Frame`, at 1440 and 375, a recommendation each, every number
measured; no preview throws, and Sentry never receives a lab error. **Not in this round:** any production byte; the ROOT
404 (wired on the image trail at Will's numbers; drawn only as the reference) and whether the group 404s gain the trail
(his open call from `trail-wiring`); the dead profile handle's page (`profile-page`, a sibling lane); the door and the
welcome sheet (`guest-shape`); the sign-in form's inline failure (`app-door`); a failed upload tile (`guest-upload`);
the chrome the failures sit in (`site-chrome`, a sibling lane; use today's).

**What is measured (the tree at the cut).** Eight templates for one act: `MarketingNotFound` in the trail (root) and
with the strip "404" (the cinema and paper groups: "We lost this page", Back home, Help center); `MarketingRouteError`
("That one didn't develop.", Try again, Back home, "Tell us what happened" to contact, a logo-only bar, the strip "500",
NO digest though it captures one); `NotFoundScreen` inline with two actions in the app ("We couldn't find that event",
Dashboard, New event, inside the shell) and with one action for a bad guest token ("This event link didn't work", a
logo bar, a demo-or-copy footnote) and for the admin ("We couldn't find that page", inside the admin shell);
`RouteError` ("Something went wrong", Try again, Back home, the digest shown) for the app, guest, auth and admin groups,
rendered inside the layout beneath the crash; `GlobalError` (Try again ONLY, no way home, inline styles, its own html and
body); and the private event's lock, a hand-rolled block with no action inside `GuestHeader`'s logo bar. A bad or deleted
token 404s; a soft-deleted event (30 days recoverable) 404s identically to one that never existed, by design ("don't leak
existence"), while a private event reveals its own existence with a distinct screen; a not-yet-unlocked or expired unlock
cookie renders inline through the entry modal, never a 404, and an expired cookie says nothing about expiring. There is
no root `error.tsx`, so a crash in a group's OWN layout skips that group's boundary and lands on the bare global page;
on the admin host a refused path is rewritten to the root 404 whose own links (help, pricing, features) 404 again on
that host. The group 404s render in a fixed 60 vh box, not full screen. The ROADMAP's line that the guest 404 says the
event "may have ended" is stale (no such string remains). The pins: `type-ladder-policy.test.ts` scans every template's
h1 (look; `global-error.tsx` the named unstyled exception); `surface.test.ts` pins the routing decisions (function);
nothing renders any of the screens; the `[data-not-found]` stagger is CSS only.

**The decisions (suggested; yours to recut, never forced apart).** ONE GRAMMAR (a voice per surface, eight templates,
as today; one system, the action pattern and the shape shared, the words and the picture per surface; one screen
everywhere); THE WAYS OUT (staged after ONE GRAMMAR: one or two depending on the page, as today; always two; two and a
line to help or contact); THE PICTURE (the strip on marketing's 404 and 500 and nothing elsewhere, as today; the strip
wherever a failure renders; nothing anywhere but the root's trail); THE CODE (a digest on some, as today; always, with
a Copy and a line saying what it is for; never, contact carrying it silently); THE SURROUND (three wrappers, as today:
the marketing header and footer, a logo bar, the surface's shell; the surface's own chrome always; bare always, one
calm page); THE PRIVATE EVENT (a hand-rolled lock, as today; the not-found family's screen wearing a lock and the door;
the same page as a missing event, revealing nothing); THE ADMIN'S 404 (the marketing page whose links 404 again, as
today; a portal-flavoured screen with no marketing links; a redirect to the portal's home); THE GLOBAL CRASH (Try again
alone, as today; Try again and a way home; a plain page with the code and contact). The missing root `error.tsx`, the
uncaught layout crash, the stale ROADMAP line and the 60 vh box go under Deferred as ROADMAP lines whichever option wins.

**Binds.** The bible; the existence rule (a deleted event and a missing one are one page, by design: draw inside it and
put any loosening under Questions); the Sentry rule (`RouteError`, `MarketingRouteError` and `GlobalError` call
`captureError` unconditionally on mount: a board never mounts them as shipped; recreate their JSX or wrap with the
capture neutralised, and prove in the Handoff that no event reached Sentry); the boundary facts (an error boundary is a
client component fed `error` and `reset`; a group's `not-found.tsx` renders inside that group's layout, the root's
outside all; `GlobalError` renders its own document, so only its inner content is drawn); the trail is wired and pinned
(reference only); the type ladder on every h1; the copy is open (bible 21), no em-dashes; reduced motion honoured.
Mobbin is encouraged, never required: 404 and error pages, "link expired" screens, private-content gates.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`,
  `pnpm lab:demo --board error-pages` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real components with fabricated props, nothing thrown, nothing reported; a
  capture of every option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **Is `grammar`'s fold a real code proposal or only illustrative?** `shared`'s app tile is drawn by calling the real
  `NotFoundScreen` with one added `footnote` (the digest) rather than mounting a standalone `RouteError`, which is the
  whole technical claim: RouteError's four call sites can fold into `NotFoundScreen` plus one optional `digest` prop,
  at no visual cost (the "shared" tile and "today" tile render pixel-identical). Recommended: read it as the real
  wiring proposal, not a mock-up; the wiring round can make the change directly.
- **What does the admin's "help line" under `ways-out` point at?** No runbook page exists today, so the admin tile's
  line reads "Still stuck? Check the runbook." with no working link, unlike the guest tile's real `/help`.
  Recommended: keep it a plain, unlinked line until a runbook page exists rather than inventing one now; a wiring
  round can decide whether it ever gets a destination at all.
- **How should `admin-404`'s `redirect` option be drawn, since a redirect has no screen of its own?** Its preview
  shows the destination it resolves to (the portal's own overview, inside `AdminChrome`), captioned as a landing
  rather than a transition. Recommended: keep that reading; a spinner or transitional frame would imply a delay the
  real redirect does not have.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- Now: the root layout has no `error.tsx`, so a crash inside `(app)`, `(guest)`, `(marketing)`, `(auth)` or admin's
  OWN layout (not a page beneath it) skips every branded boundary and lands bare on `GlobalError`; add a root
  `src/app/error.tsx` once a shape is picked (today it would be `RouteError`-shaped, or `NotFoundScreen`-shaped if
  `grammar`'s `shared` option lands first).
- Now: `docs/ROADMAP.md`'s line that the guest 404 says an event "may have ended" is stale — no such string remains
  in `src/app/(guest)/e/[token]/not-found.tsx` today; delete the line rather than re-adding one.
- Now: the group 404s (`(cinema)` and `(paper)`) render in a fixed `min-h-[60vh]` box rather than filling the
  screen; whether that should become full-height is untouched by this round's `surround` (which answers the
  *wrapper*, not this inner box) and is worth its own small decision in a future pass.

## Handoff (replaces the chat report)

- Head `1a4a9835`, pushed; synced with launch-prep at `b901282f` (two syncs mid-round: `origin/launch-prep` moved
  twice while this board was built, both merges resolved by keeping both sides' added lines in every registration
  file, splicing the closing `],`/`},`/`},`/`{` back in where the RULINGS array's two insertions shared one at the
  same anchor).
- Gates on the synced tree: typecheck ok, lint ok (8 known warnings, 0 errors), test ok (2545), build ok (254 pages);
  `pnpm lab:smoke --base http://localhost:3134` ok (477 checks, 0 failing; `error-pages` 537 words / 1200 budget);
  `pnpm lab:demo --board error-pages --base http://localhost:3134` ok (8 steps, 0 failing, every option's stage
  measurably moves: 2.7-100% across the eight decisions).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five files under
  `src/app/(dev)/design/sandbox/error-pages/`, the registration exception (`registry.ts`, `boards.ts`,
  `touchpoints.ts` — both unions plus one RULINGS row after `river-visual`'s), `docs/design/library.md`
  (regenerated by `pnpm design:rules`) and this manifest. Nothing else.
- Sentry proof: no file under `sandbox/error-pages/` imports `@sentry/nextjs` or `captureError` (`grep -rn
  "captureError\|@sentry" src/app/(dev)/design/sandbox/error-pages` matches only the doc comments explaining why
  not); `RouteError`, `MarketingRouteError` and `GlobalError` are never mounted — `templates.tsx` reproduces their
  JSX with the reporting effect removed, and the real `NotFoundScreen`/`MarketingNotFound`/`MissingFrameStrip` are
  imported and reused verbatim (neither calls Sentry).
- A lab-authoring gotcha found and fixed, worth another lane's attention if it recurs: stacking several real chromes
  (`AppChrome`/`GuestChrome`/`AdminChrome`/`MarketingChrome`/`Bare`) in one `Stack` inside a single `Frame` is
  dangerous with `min-h-screen` or `min-h-[NNvh]` classes, because `vh` resolves against the FRAME's own declared
  height: one stacked item demanding "at least the whole frame" compounds with every sibling, and raising the
  frame's height to fit only raises what each item demands next (measured: a three-item stack read 6002px against a
  2000px frame). Fixed here with a `standalone` prop (default true) that every chrome in `chrome.tsx` honours,
  dropping to no forced min-height when used inside a `Stack`; every `min-h-[60vh]` inside a stacked tile became a
  fixed `min-h-[420px]` for the same reason. Verified with a scripted sweep (`document.querySelectorAll('iframe')`,
  compare `body.scrollHeight` to the declared `height`) across all 24 (decision × option) combinations at both 1440
  and 375: zero clipped after the fix, confirmed non-elastic by forcing an iframe's `height` attribute up and down
  and checking the content's true bottom held still.
- The decisions, one line each:
  - `grammar`: should every dead end and crash share one grammar, or keep today's separate voices? kept apart / one
    primitive with per-surface words / one screen everywhere. Recommended `shared` (RouteError folds into
    NotFoundScreen for one added prop, at zero visual cost).
  - `ways-out` (after `grammar`): how many ways out should a dead end or a crash offer? one or two as today / always
    two / two plus a line to help. Recommended `guided` (a quiet help or contact line everywhere, on top of today's
    or a promoted second action).
  - `picture`: where should the tilted photo strip appear? marketing only as today / everywhere / nowhere but the
    trail. Recommended `today` (the strip is a marketing flourish; the app/admin icon already reads as calm and a
    host mid-upload does not need decoration).
  - `code`: should a crash show its digest, and how? a plain code as today / always with Copy and a line / never.
    Recommended `always` (the digest is the one correlation handle support has; Copy makes it usable).
  - `surround`: what should wrap a failure screen? today's mix / the surface's own chrome always / bare always.
    Recommended `shell` (closes the one real gap: a guest crash renders with no header at all today).
  - `private-event` (after `grammar`): should the private lock reuse the not-found family, or stay its own block?
    its own block as today / the not-found family wearing a lock / the same page as a missing event. Recommended
    `family` (pure de-duplication; changes nothing a guest sees).
  - `admin-404`: what should a refused path on the admin host show? the marketing 404 as today / a portal screen
    with no marketing links / a redirect straight to the portal's home. Recommended `portal` (today's rewrite target
    hands out three more dead-ending links on a host that serves none of them).
  - `global-crash`: what should render when the root layout itself crashes? Try again alone as today / Try again
    plus a way home / a code and an email. Recommended `home` (a plain inline `<Link>` costs nothing to add and
    needs no script to work).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `grammar` (it stages `ways-out` and `private-event`, and its `shared` option is the one with real
  follow-through code beyond this lab round), then `admin-404` (the largest single-option stage swing at 100%, and
  the one decision that is also a routing question, not only a look).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of `error-pages` returned eight decisions on every not-found
and error boundary across marketing, the app, the guest pages, auth and admin: whether the six-odd components
sharing this shape should fold further (recommended: yes, one prop closes the last real gap), how many ways out a
dead end offers, where the photo strip rides, whether a crash's digest is copyable, what wraps a failure screen
(recommended: the guest crash gains the header it lacks today), whether the private lock joins the not-found family,
what an admin 404 shows, and what the last-resort crash offers beyond Try again. Every option is the real
`NotFoundScreen`/`MarketingNotFound`/`MissingFrameStrip` or a recreation of `RouteError`/`MarketingRouteError`/
`GlobalError`'s JSX with the Sentry effect removed, so no lab press ever reported an event. Three findings landed on
the ROADMAP's Now list (no root `error.tsx`, a stale guest-404 line, the group 404s' fixed 60vh box); three
questions carried on their recommendations.
