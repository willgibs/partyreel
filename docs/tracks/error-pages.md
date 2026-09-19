---
track: error-pages
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board error-pages` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
