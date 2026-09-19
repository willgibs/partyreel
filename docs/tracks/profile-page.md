---
track: profile-page
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Does a person's own photograph belong on their page?** `made-of`'s third option (`wall`) gathers the frames one
  person added across open albums onto one indexable page. That is a NEW publication, not a redraw: today those frames
  are reachable only by someone holding the album's link, never by person. Drawn, and the recommendation is the middle
  option (`covers`) precisely because it does not cross this line. RECOMMENDED: do not wire `wall` on this round's
  answer alone. If he picks it, the gate is the attended arm's three (the host's `show_guest_list`, the guest's own
  hide, `visibility = 'open'`) plus `status = 'approved'`, and a profile-hide must hide that album's photographs too.
- **Does a cover from a party you attended belong on your page?** `covers` puts ONE frame from an album that is
  already open to anyone with the link onto the attendee's page, still with no link (attendance is not a capability
  grant). Smaller than the wall and still a loosening. RECOMMENDED: yes, and it is what the board recommends; the
  hosted arm already masks covers on gated events and this arm is open-only by the RPC.
- **Should claiming a handle still be a Pro feature?** `claim`'s two new options offer a handle to a GUEST at the
  moment their photographs land, and a guest at a wedding is almost never Pro, so an offer that ends at a paywall is
  worse than today's silence. Both options are drawn free to claim. RECOMMENDED: claiming becomes free (it is the
  consent act for a public page, and gating consent behind a payment is a strange shape); Pro keeps the album's
  custom slug and everything else it keeps today. Pricing is his and `app-pricing`'s, so this is carried, not assumed.
- **Which moves, the guest list or the marketing sentence?** `named`'s recommendation keeps his 2026-06-22 one-key
  ruling and rewrites `/features/guests`, whose current line promises "skip it and nothing about you is public at
  all" while the album names every signed-in uploader. RECOMMENDED: the sentence moves. The new wording is on the
  frame; it is a production copy edit for the wiring round, and `/privacy` should be read for the same promise.
- **A line of their own is a moderation surface.** `identity`'s recommendation adds free text a person writes to a
  public, indexable page. RECOMMENDED: ship it capped (about 120 characters, one line), render no links in it, and
  route it to the same operator inbox `admin-triage` is designing; if he would rather carry nothing typed, `counts`
  is the option with nothing to moderate.
- **`block`'s recommendation depends on an inbox that does not exist.** Reporting a PERSON has no table, no action
  and no operator queue; reported MEDIA has all three. It is drawn as a future and labelled as one. RECOMMENDED:
  answer the shape now and let `admin-triage` own the queue; if that is a year away, the quiet word is the smaller page.
- **NOT FOUND was cut from the round.** The manifest suggested a decision on where a dead handle lands. It is now the
  marketing 404, which since 2026-09-19 is where the Trail lives (his `home=notfound`), so the option "as today" had
  just become the best of the three. RECOMMENDED: leave it, and spend the eighth slot on the guest list's shape,
  which is a real defect at any wedding. Carried on that basis.
- **THE PHONE was cut too.** It was optional in the manifest and it stopped being a question once the round went
  phone-first: 375 is the default on every decision rather than a step of its own.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. Nothing outside `src/app/(dev)/design/sandbox/profile-page/` and the registration lines was touched, and every
  finding below is a ROADMAP line rather than a change to a `docs/systems/` fact.

## Deferred (ROADMAP one-liners, bucket named)

- **Now** - `/u/[slug]`'s identity block collapses at a phone: `flex flex-wrap items-center gap-5` puts the avatar, the
  name column and the actions on one row, leaving the column about 90px at 375, so "Joined June 2026" wraps to two
  lines and any longer fact to four. The board carries the shape to wire (`max-sm:basis-[calc(100%-6.25rem)]` on the
  column, `max-sm:w-full` on the actions; nothing at or above `sm` changes).
- **Now** - three hand-rolled toggles do one job with three different shapes: `FollowButton` (optimistic + refresh),
  `ProfileActionsMenu`'s block (transition + toast + refresh) and the Connections card's `UnfollowButton`/`UnblockButton`
  (transition + toast, no refresh). One control, one contract.
- **Now** - `notification_prefs` ships a live "Someone followed you" switch for a signal no code path ever sends; the
  card promises mail that cannot arrive.
- **Now** - there is no `loading.tsx` under `(guest)` while `/u/[slug]` awaits `get_public_profile`, `getUser()`, the
  avatar URL and a presign per cover, so a cold profile is a blank tab.
- **Now** - the profile overflow opens over the person's own name at 375 (drawn in the board's `block` step): the menu
  is anchored to a trigger sitting in a 335px row with nothing under it.
- **Major overhauls** - the follow graph has no consumer worth the graph: "Following" is one dashboard chip doing a
  full fetch of other people's events, and nothing else in the product reads a follow. Whatever `exists` returns, the
  graph's job is an open question of its own.

## Handoff (replaces the chat report)

- Head of the code `0aefba91` (the board itself at `267bcc7b`), pushed; synced with `launch-prep` at `0c651986` (it had moved 33 commits; merged at `0aefba91`, never rebased). The registration files all conflicted: both sides' added lines were kept, and the RULINGS hunk spanned a row boundary (my row's `],` `},` `},` `{` was below the hunk), so it was spliced back between the two sides; `docs/design/library.md` was regenerated rather than hand-merged.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok, `node src/app/(dev)/design/gallery/collect-specimens.mjs` ok (131 specimens on 94 entries, unchanged), typecheck ok, lint ok (8 warnings, none in this lane), test ok (2,545 on 241 files), build ok (254 pages); `pnpm lab:smoke --base http://localhost:3133` ok (432 checks, 0 failing; the board reads 474 words of the 1,200 budget); `pnpm lab:demo --board profile-page` ok (8 steps, 0 failing, every step draws its options, no "same picture" pair, the tallest step 1.6 screens).
- Lane check, pasted:
  ```
  docs/design/library.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/profile-page/album.tsx
  src/app/(dev)/design/sandbox/profile-page/board.tsx
  src/app/(dev)/design/sandbox/profile-page/fixtures.ts
  src/app/(dev)/design/sandbox/profile-page/profile.tsx
  src/app/(dev)/design/sandbox/profile-page/scene.tsx
  src/app/(dev)/design/sandbox/profile-page/spec.ts
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  Six owned files plus the four registration lines the exception allows (`library.md` is regenerated and committed as
  the generator writes it; `boards.ts` and `registry.ts` take one line each at the head; `touchpoints.ts` takes both
  unions and one RULINGS row placed after `river-visual`'s). This manifest is the eleventh path, committed separately.
  No exceptions.
- The decisions, one line each:
  - `exists`: should a person have a page of their own at all; a page at its own address as today / a card raised from a guest-list chip with no address / no person page at all; RECOMMEND **the page** (it is the only thing that turns one album into the next, and a card cannot be shared, indexed or put in a bio).
  - `head` (after `exists`): what stands above a person's page; the logo and one button as today / the album's own header with the account menu / nothing above them; RECOMMEND **the album's own header** (two headers doing one job is how one goes stale; a signed-in visitor should not lose the way back by tapping a name).
  - `made-of` (after `exists`): what a person's page is made of; hosted albums then a list of grey names as today / every party as a card with one cover and still no link / their photographs in place of the names; RECOMMEND **every party as a card** (measured: Priya's page goes from 2 percent of the first screen to 48; the wall reaches 136 and is a new publication, in Questions).
  - `identity` (after `exists`): what the top says about a person; the face, the name and the month they joined as today / with albums and parties counted / with one line of their own; RECOMMEND **one line of their own** ("Joined June 2026" is a record, not a person; the cost is a moderation surface, in Questions).
  - `block` (after `exists`): how a person blocks another person; a menu with one row as today / a quiet word under Follow / inside a Report menu drawn as a future; RECOMMEND **the Report menu** (someone who wants to block usually wants to tell somebody, and there is an inbox for reported photographs and none for reported people).
  - `named`: who an album names; everyone signed in with the marketing sentence corrected / only people with a handle / everyone with one switch that removes you; RECOMMEND **everyone, and fix the sentence** (his one-key ruling still holds because every photograph already carries its uploader's name on the same screen; picking handles turns this wedding's 24 into 5, on the frame).
  - `claim` (after `named`): when a handle is offered; at the account page as today / right after their photographs land / on their own chip in the list; RECOMMEND **right after their photographs land** (the only moment anyone cares about their name here is the moment it appears on an album, and that moment is silent; 19 of 24 chips are not links).
  - `list` (after `named`): how the guest list draws at a real wedding; every name wrapping as today / the first twelve then the rest / a row of faces and a count; RECOMMEND **a row of faces** (measured in the frame: 450px in 12 rows, 262px in 6, 24px in 1, on an 812px screen).
- Assets requested from Will: none. Every picture is one of the fourteen `MARKETING_IMAGES` stills, avatars included (square-cropped by `object-cover`, exactly as the shipped page crops a real one).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No production byte moved and no preview calls a Server Function: `FollowButton` and `ProfileActionsMenu` are forked to local state, `GuestHeader` and the handle control are quoted at rest, and both galleries have pointer events off.
- Captures: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/profile-page/sheets` (every decision at 375 and 1440, three options per picture) and `.../wide` (the 1440 stages in a 3400px window). Session-local; the board itself is the record.
- Look at first: **`made-of` at 375**, where the measured captions carry the whole round (2 percent of the first screen, then 48, then 136), and then **`named`**, where the album's 24 names and the marketing sentence that denies them are on one frame.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of `profile-page` asked what a person is on Partyreel as
eight decisions over one cast at one wedding, phone first at 375 with 1440 on a knob: two independent roots (whether a
person has a page at all, and who an album names) with four and two staged behind them, every option drawn on the
shipped profile and the shipped guest list with the two social controls forked so no press reaches a row. Reading each
capture against its own words caught four defects in the board itself (an overflow drawn open over the person's name,
the guest list and the unlinked chips below three frames' folds, and a desktop row that moved under a phone fix) and
one in the product: `/u/[slug]`'s identity block squeezes the name column to about 90px at 375, which the board fixes
below `sm` in all three options and the ROADMAP now carries. Three loosenings of the ruled privacy scope and the
handle's Pro gate went to Questions on their recommendations rather than into a picture that assumed them.
