---
track: app-shape
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6acf34e8"            # the launch-prep SHA the branch was cut from
board: app-shape        # round one: the host app's SHAPE from the foundation
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/app-shape/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
  - src/components/shared/app-shell.tsx
  - src/components/shared/page-heading.tsx
  - src/components/shared/container.tsx
  - src/components/app/dashboard/dashboard-feed.tsx
  - src/components/app/dashboard/filter-chips.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-feed/event-feed.tsx
  - src/components/app/event-feed/event-filter-pills.tsx
  - src/components/app/event-feed/event-feed-action-bar.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/components/app/user-menu.tsx
  - src/components/reel/reel-studio.tsx
  - src/lib/dashboard/filters.ts
  - src/lib/event/sections.ts
  - src/app/(dev)/design/sandbox/admin/spec.ts
---

# lp/app-shape

**Goal.** Round one of `app-shape`: the host app reconceived from the FOUNDATION, its shape first, the way the
`admin` board rethought the portal. Will (2026-09-19, `docs/design/rulings.md`): "Let's treat the full app
experience as well as guest pages as unprotected. Anything and everything is open to relitigate or reconcept from
the ground up to begin establishing a better system from its foundation. The existing version is closer to a
Frankenstein's monster as we were trying to integrate new features ideas 1 by 1, rather than having a complete
idea of the full app from the beginning." Six to eight decisions with `defineExploration`, each drawn on the real
components with FIXTURES (a host with three events, one waiting review queue, one reel, a few guests, an at-cap
storage meter) at 1440 AND 375 (a host is on a phone as often as a laptop), a recommendation each, every number
measured. **Not in this round:** any production byte, the vocabulary under the shape (empty states, skeletons,
the tile grammar and bulk toolbars: `app-vocabulary`), the guest pages (`guest-shape`).

**What is measured (the tree at the cut).** Seven routes (`/dashboard`, `/dashboard/new`, `/dashboard/[eventId]`,
its `/settings` and `/reel`, `/account`, `/welcome`) behind one sticky header with a logo and a user menu and no
navigation; the host's home is one continuous feed switched by six chips (All, Events, Following, Uploads, Likes,
Deleted) that mixes their events with their own uploads, likes, follows and a bin; the event page is the same
feed shape switched by five pills (All, Review, Gallery, Reel, Guests), urgency-ordered, with a command strip
(Share as a modal, Add photos, Settings as a route) and a floating action bar; settings is one long column of
cards ending in a second, unrelated "Deleted" bin (media, with a purge-now the events bin lacks); the reel is a
full-bleed studio with its own X; billing has no home (a popover on the storage strip); social is scattered over
four places with an unlinked "go to Account settings"; three back-navigation idioms; four query-parameter names for
"which tab"; two `?filter=`/`?section=` legacy tables; no `@contract-for` test under `src/components/app`.
`docs/systems/host-app.md` describes the shape as it was one feature ago. Fourteen seams are listed in the
Orchestrator's exploration of 2026-09-19 (`docs/tracks/orchestrator.md`, the app round's announce); read them.

**The decisions (suggested; yours to recut, never forced apart).** The host's HOME (their events only; an inbox
of everything as today; a front page that says what needs them); the EVENT as a place (the urgency feed as
today; a hub of rooms; the studio's model generalised, one full-bleed room per job); the CHROME and navigation
(a header with a menu as today; a rail on a laptop and a bar on a phone; breadcrumbs that replace the three back
idioms); where SHARING lives (the modal; a room; the event's front); where SETTINGS live (the column of cards; a
sheet beside the event; sections in the hub); where MONEY and the ACCOUNT live (a plan card in Account; the storage
strip as a real destination; as today); the PHONE (the same shape narrowed; a different shape for a thumb);
DENSITY (cards; lists; the operator's answer from the admin board). The `admin` board is the worked example for a
shape board on real components with fixtures; `gallery-width` for the spec's form.

**Binds.** The bible (media is the colour, one token set, the ladders); the guest pages' rulings do not bind the
host app but the app is one brand with the marketing site (bible 2); the `type-ladder-policy` keeps `PageHeading`
on one class; the security seams (RLS, `getUser()`) are out of frame; no em-dashes; the copy is open (bible 21).
Mobbin (the MCP) is encouraged, never required: photo apps, event apps, creator dashboards.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135`,
  `pnpm lab:demo --board app-shape` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment.
- Every option at 1440 and 375 on the real components with fixtures; the reading budget; a capture of every option
  beside its words, the picture checked against the words.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
