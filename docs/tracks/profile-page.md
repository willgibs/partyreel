---
track: profile-page
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c74a509d"          # the launch-prep SHA the branch was cut from
board: profile-page     # round one: what a person is on Partyreel beyond one album
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/profile-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/profiles-social.md
  - docs/systems/notifications-analytics-growth.md
  - src/app/(guest)/u/[slug]/page.tsx
  - src/app/(guest)/u/[slug]/actions.ts
  - src/app/(guest)/layout.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/not-found.tsx
  - src/components/social/guest-list.tsx
  - src/components/social/follow-button.tsx
  - src/components/social/profile-actions-menu.tsx
  - src/components/social/connection-buttons.tsx
  - src/components/social/profile-slug-control.tsx
  - src/components/social/attended-events-visibility.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/guest-account-menu.tsx
  - src/components/app/event-settings/profile-social-card.tsx
  - src/components/app/dashboard/following-section.tsx
  - src/components/app/event-card.tsx
  - src/components/shared/empty-state.tsx
  - src/lib/db/queries/social.ts
  - src/lib/validation/profile.ts
  - src/lib/constants/marketing-media.ts
  - src/components/marketing/sections/features/guests/profiles-section.tsx
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
  - src/app/(dev)/design/sandbox/app-shape/spec.ts
---

# lp/profile-page

**Goal.** Round one of `profile-page`: WHAT A PERSON IS ON PARTYREEL beyond one album, the public profile at `/u/<slug>`
and the social layer around it (follow, block, the guest list on an album, the handle), reconceived from the ground up.
Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore every surface, everything unprotected, "at
worst, net neutral and fully deleted". Six to eight decisions with `defineExploration`, each drawn on the REAL profile
pieces with fixtures (one recurring cast: Maya with a handle, an avatar and two hosted events, one open and one
password-locked; Priya with a handle, one attended event shown and one hidden, seen as herself and as a stranger; Jay
with no handle; Sam in a mutual block with the viewer; a profile with no events; a dead handle), phone first at 375 with
1440 on a knob, a recommendation each, every number measured; no preview calls a server action or touches Supabase.
**Not in this round:** any production byte; which voice the profile inherits when it asks a guest to sign up
(`guest-shape`'s `account`); where the account's pieces are reached from and whether they unify (`app-shape`'s `you`);
the account-creation surfaces (`app-door`); the host's loading and empty treatments (`app-vocabulary`).

**What is measured (the tree at the cut).** `/u/[slug]` has two states, a 404 or the card (no "private profile" exists;
a profile is public by existing): a `size-20` avatar or an initial, the name and `@slug`, "Joined <Month Year>" and
never a count, the hosted events as `EventCard`s (Password and Private badges; covers only for open events), an "Also
at" list of names and dates with no links, a shared `EmptyState` at zero events. Seen as oneself the actions become "Edit
profile" to `/account`; a signed-in stranger gets Follow ("Follow" / "Following") and a one-item overflow holding Block
behind a confirm ("You'll stop following each other... They won't be notified, and they can't see that you blocked
them"); a blocked pair gets neither. Editing lives only at `/account`: the avatar cropper (circular, WebP), the required
display name, the Pro-gated handle with a debounced availability check, per-event "show on my profile" switches, a private
Connections card, a notification card with "Someone followed you" (a live switch for a signal that no code path ever
sends). The guest list is ONE component for the host's event page and the guest's album ("so the two can never drift"):
avatar-and-name chips, linked only when the person has a handle, wrapping without a cap; the host sees it even empty ("No
signed-in guests have added photos yet"), the guest album hides it at zero, the demo never shows it. The page's header is
a logo and one button (the guest paragraph's seam 11); a dead handle falls through to the marketing 404 with the trail
(seam 7); no `loading.tsx` under `(guest)` while the page awaits an RPC and two presign rounds. Marketing promises "skip
it and nothing about you is public at all" while a signed-in uploader with no handle is named and pictured, unlinked, on
an open album's guest list. Three hand-rolled toggles do one job (follow, block, connection). The pins: none on the page
or any social component; `public-profile-visibility.test.ts` guards the RPC's gates in SQL text; `profile.test.ts` the
schema; `notification-prefs.test.ts` the column defaults. Every rendered state is unpinned.

**The decisions (suggested; yours to recut, never forced apart).** EXISTS (should a public page exist at all: keep it,
as today, the follow graph's only home; a card that opens from a guest-list chip and has no address; none, the handle
and the list gone with it); THE HEAD (today's logo and one button; the shared guest header; a profile variant of it with
the account menu and no event items); NOT FOUND (a dead handle: the marketing 404 with the trail, as today; a quiet guest
404 like the album's; home); THE NAMED (who appears on an album's guest list: everyone signed in, as today; only people
with a handle, so the marketing sentence is true; only with a per-event opt-in) ; THE CLAIM (staged after THE NAMED: when
a handle is offered: only at `/account`, as today; inline where the event's "show on my profile" switch is; at the moment
of the first save); WHAT A PERSON IS (avatar, name and "Joined", as today; with counts, hosted and attended; with one line
of their own); BLOCK (a one-item overflow behind a confirm, as today; an inline quiet button; folded into a Report menu
that does not exist yet, drawn as a future); THE LIST (chips wrapping forever, as today, with the host's empty line and
the guest's silence; capped with "+N more", one rule for both surfaces; a row of faces that opens the list). Optional if
it fits the budget: THE PHONE (one centred column at 375, as today; the album's own phone rhythm). The three toggles, the
dead follower switch and the missing `loading.tsx` go under Deferred as ROADMAP lines whichever option wins.

**Binds.** The bible; the guest rulings (the host's event, minimal branding; a guest's reading copy at 15 to 16 px); the
privacy doctrine in `profiles-social.md` (what a stranger may read is ruled: state it, draw inside it, and put any
loosening under Questions); the never-mutate rule (every real social component calls a server action against Supabase:
capture every press as a no-op the way `app-door`'s stills do, or draw the state); the page is a server component with
three server-only calls (fork it to fixtures, never import it); the avatar cropper needs Canvas and pointer capture (draw
its result, never mount it); reduced motion honoured; no em-dashes; the copy is open (bible 21). Pictures from
`MARKETING_IMAGES`, square-cropped for avatars, as `guest-shape` did. Mobbin is encouraged, never required: public
profiles in photo and event apps, follow and block affordances, attendee lists.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`,
  `pnpm lab:demo --board profile-page` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 375 and 1440 on the real pieces with fixtures, no server action from a preview; a capture of every
  option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board profile-page` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
