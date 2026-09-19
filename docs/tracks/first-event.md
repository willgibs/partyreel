---
track: first-event
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "060dfdf4"          # the launch-prep SHA the branch was cut from
board: first-event      # round one: a host's first event, from "Create" to a code on the table
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/first-event/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - src/app/(app)/welcome/page.tsx
  - src/components/app/dashboard/events-empty-teaser.tsx
  - src/app/(app)/dashboard/new/page.tsx
  - src/components/app/create-event-wizard.tsx
  - src/app/(app)/dashboard/actions.ts
  - src/lib/validation/event.ts
  - src/lib/constants/tiers.ts
  - src/lib/constants/qr-presets.ts
  - src/components/app/styled-qr.tsx
  - src/components/app/qr-preset-picker.tsx
  - src/components/app/event-qr.tsx
  - src/components/app/copy-share-link.tsx
  - src/components/app/event-slug-control.tsx
  - src/components/app/event-password-control.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/host-command-strip.tsx
  - src/components/app/event-share-dialog.tsx
  - src/components/app/event-card-qr.tsx
  - src/components/app/qr-designer-dialog.tsx
  - src/components/app/event-uploads.tsx
  - src/lib/events/share-urls.ts
  - src/lib/constants/how-it-works.ts
  - src/components/marketing/sections/features/qr/print-shop.tsx
  - src/components/shared/river/qr-plate.tsx
  - src/app/(dev)/design/sandbox/app-shape/spec.ts
---

# lp/first-event

**Goal.** Round one of `first-event`: A HOST'S FIRST EVENT, from "Create my first event" to a code on a table at
the venue, the activation moment, reconceived from the ground up. Will (2026-09-19, `docs/design/rulings.md`,
"two more areas at the Orchestrator's discretion"): the host app is unprotected, "absolutely everything is up for
relitigation or reconcepting from the ground up"; a board that keeps nothing is deleted at no cost. Six to eight
decisions with `defineExploration`, each drawn on the REAL app components with fixtures (a host who just finished
the welcome; a Free host already at their one event; an event with zero photographs; the first guest photograph
landing), at 1440 and 375, a recommendation each, every number measured; no preview creates a row. **Not in this
round:** any production byte; the event page's overall shape, where sharing and settings live and the home
(`app-shape`, on the desk: its `event`, `share` and `settings` decisions are drawn on, never re-asked); the plan's
door (`app-pricing`, building); the QR style presets' scanner-safety rules.

**What is measured (the tree at the cut).** Three doors ("Create my first event" at the welcome's end, "Create
your first event" on the empty dashboard, "New event") reach one route, `/dashboard/new`: a 576 px card afloat in
the shell at 1440 and the 343 px column at 375, three steps swapped as plain JSX with none of the app's motion.
Only the name is required; the defaults are open, accepting uploads, accounts required, live moderation, the
classic style. Step two picks one of four QR styles against a PLACEHOLDER token; step three is where the event is
actually created and renders a 200 px code on a white plate with Open, Download (SVG "best for print", PNG "best
for screens"), a copy-link and the slug control; "Go to your event" lands on the event page and "No uploads yet".
There is no print sheet, table card, sign or poster anywhere in the product (the marketing page `/features/qr`
mocks a table card and a poster the app never generates; the ROADMAP's "share studio" names the generator as the
real feature), no native share host-side (the guest's share sheet has it), no email-to-self, and nothing for a
host standing at the venue with only a phone. A Free host at their one event still gets the row inserted, then a
toast ("Event limit reached on the Free plan.") and a bounce to the dashboard that discards the style they just
chose. The host has no live signal: the first guest photograph appears on a manual reload (only the guest gallery
has the doorbell). The product's QR plates are fixed pixel sizes (200, 96, 232) with no guarantee of a scan-safe
module size for the link's length, while the marketing river's plate computes one. Eight seams are listed in the
Orchestrator's map (`docs/tracks/orchestrator.md`, "The app round's map", the first-event paragraph); read them.
The behaviour pins: `qr-presets.test.ts` (the preset keys, white plate, error correction M or better, the default),
`event.test.ts` (the slug's 3 to 50 chars, no 32-hex, reserved words; the password), `slug.test.ts`,
`share-urls.test.ts`, `welcome.test.ts`; they guard function, the look is open; the wizard's UI, the limit refusal
and the event page's first render have no test at all.

**The decisions (suggested; yours to recut, never forced apart).** WHAT IT ASKS (creating an event: a name alone,
as today; the name with a date and a line, since the album's header shows them; nothing, a name proposed from the
moment and changed later); THE STYLE'S PLACE (the code's style: a wizard step against a placeholder, as today;
after creation, on the real event; out of the wizard, one style until a host wants another); THE LIMIT (a Free
host at their one event: created, then bounced with a toast; refused before the wizard opens, the plan's door
beside it; the wizard proceeds and offers delete-and-continue or the plan in place); OUT OF THE SCREEN (how the
code reaches the venue: files as today; a generated print sheet, a table card, a sign and a poster on one page;
send it to yourself, the native share and an email with the sheet attached); THE LANDING (where a just-created
host lands: the event page and "No uploads yet"; a beat of its own, the code, the sheet and the venue options
before the ongoing chrome; the dashboard with the new event lit); THE FIRST PHOTOGRAPH (what marks a guest's
first photograph for the host: nothing until a reload; a live badge or toast on the event page; a push or an email,
drawn as the message itself); THE EMPTY EVENT (the event page before any photograph: "No uploads yet"; a launch
list, is the code placed, is the link shared, has a test photo landed; the code itself, full-bleed, ready to show a
phone). Optional if it fits the budget: IN A HAND (the host at the venue with only a phone: the same screens at
375; the code full-screen at maximum size and brightness, "show this to guests"). The `app-shape` board is the
worked example for a board on real app components with fixtures; copy its approach, import nothing from another
board's directory.

**Binds.** The bible; the security pieces out of frame (the 32-hex `qr_token` as the sole capability, the slug
a mutable alias never a second capability, the password's signed cookie); the QR scanner-safety rules (a white
plate, error correction M or better) and the marketing plate's module-size guard as the reference a product plate
should meet (a finding for Questions whichever option wins); the ROADMAP's share studio (the board draws the print
sheet as an option; the wiring builds it); app-shape's `share=front` recommendation ("A host shares at the door, at
the table and again at the speeches") and the `qr-card` ruling (the chip opening the code) as precedent; a push or
an email is a product-defining capability (drawn, flagged in Questions); no em-dashes; the copy is open (bible
21). Mobbin is encouraged, never required: event creation, onboarding checklists, QR sharing and print flows,
"show this code" screens.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135`,
  `pnpm lab:demo --board first-event` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real components with fixtures, no row created and no email sent from a
  preview; a capture of every option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **This board WEARS app-shape's recommendations, which Will has not ruled.** The event page is drawn with
  `event=album` and `share=front`, so the code is already in the event's own header on every landing, empty and
  first-photograph option, and the board says so in its own context. RECOMMENDED: carry on. None of the three
  decisions depends on the album being the page; if he rules app-shape differently they redraw inside whatever he
  picked, and the alternative (drawing today's feed page) would have made every option argue with a page he is
  already replacing.
- **A push or an email is a capability, not a look** (`first=tell`). Web push needs a permission prompt, a service
  worker and a subscription store; an unrequested email needs a preference and an unsubscribe. RECOMMENDED: the
  option is DRAWN so he can judge the moment and the sentence, and if it wins the capability is his call first
  (product-defining work is researched before it is built), with `live` shipping meanwhile since the guest
  doorbell already exists.
- **If `venue=sheet` wins, the wiring is the ROADMAP's share studio**, not a tail on this round: paper sizes, cut
  marks, a print stylesheet and a PDF path. RECOMMENDED: cut it as its own track with its own scope.
- **The product's QR plates meet the scan floor by luck, and one of them misses it.** Measured on this board
  against the real 56-character link: the create wizard's and the QR designer's preset swatches render at 96 px,
  which is 2.30 px a module (2.05 for the two presets on error level Q), UNDER the 3 px floor the marketing
  river's plate enforces and computes for itself (`qrPlateFloorPx`, shared/river/qr-plate.tsx). The 200 px plates
  are 4.85 and the event card's 232 is 5.64. RECOMMENDED: the wiring gives the product's plates the river's
  `max()` treatment rather than a typed pixel number, and the swatches either grow past the floor or stop reading
  as codes a host could test.
- **The style step previews a link that 404s.** `previewJoinUrl` is `/e/` plus 32 zeroes: the right module density
  on purpose (share-urls.ts), and a URL no event has, so a host who test-scans the style they are choosing lands
  on a not-found. RECOMMENDED: whichever option wins, the swatches encode the real token (which exists only after
  creation, which is `style=after`'s whole argument) or say plainly that they are samples.
- **Three CTA labels for one act** ("Create my first event", "Create your first event", "New event") is not a
  decision here because copy is open (bible 21) and the `voice` board owns the words. RECOMMENDED: one label for
  the act once voice rules, with "first" kept for a host who has none; the board already uses "New event" on the
  surface where the host has an event already.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (a lab-only round: no shipped fact changed, and the two product findings above belong to the wiring, not to
  a doc this lane owns)

## Deferred (ROADMAP one-liners, bucket named)

- Share studio: the product's QR plates take the river's module-size floor (`qrPlateFloorPx`) rather than a typed
  pixel number; the preset swatches at 96 px are 2.3 px a module, under the 3 px floor.
- Now: the create wizard's style step previews `/e/` plus 32 zeroes, so a host who test-scans the style they are
  choosing gets a 404.
- Now: one CTA label for creating an event (three today), once the `voice` board rules the words.

## Handoff (replaces the chat report)

- Code at `5a16d192` (the board), with `43135633` repairing a row boundary a merge resolution swallowed; synced
  with `origin/launch-prep` TWICE, because it moved under the lane mid-handoff: `f394e8db` merged `e486afc8`
  (`app-pricing`) and `fc842266` merged `f863bc23` (`pricing-page`). Branch tip is this manifest's commit.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok · specimen collector ok (123
  components, 733 contracts, 18 policies) · `pnpm typecheck` ok · `pnpm lint` ok (the 8 known warnings, 0 errors) ·
  `pnpm test` ok (2,521 in 241 files) · `pnpm build` ok (254 static pages) · `pnpm lab:smoke --base
  http://localhost:3135` ok (341 checks, 0 failing; first-event reads 464 words of a 1,200 budget) ·
  `pnpm lab:demo --board first-event` ok (8 steps, 0 failing; every step draws its options, tallest 1.6 screens).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: `src/app/(dev)/design/sandbox/first-event/`
  (7 files, the owned path) + the three registration exceptions (`sandbox/registry.ts`, `(shell)/lab/boards.ts`,
  `touchpoints.ts`: one line each at the head of BOARDS, BOARD_COMPONENTS, both unions, and one RULINGS row right
  after `river-visual`'s) + `docs/design/library.md` as `pnpm design:rules` wrote it + this file.
- ★ THE MERGE TRAP, for the next lane: the RULINGS conflict hunk SPANS A ROW BOUNDARY, because this lane's row and
  the other lane's row share the same four closing lines. Keeping "both sides' added lines" literally drops them
  and the array never closes (it cost this lane two commits). Put `],\n},\n},\n{` back between the two sides.
- The decisions, one line each (`<id>: the question; the options; the recommendation`):
  - `asks`: what should creating an event ask for? three fields as today / one field, the name / no field, a name
    from the day · RECOMMEND **one**.
  - `style` (after `asks`): where should the code's style be chosen? a wizard step against a dead link as today /
    on the real code once it exists / out of the flow, Classic until asked · RECOMMEND **after**.
  - `limit` (after `asks`): what should a Free host at their one event meet? created then refused as today /
    refused before the form opens / the form opens and says so, both exits in it · RECOMMEND **inplace**.
  - `venue`: how should the code get from the screen to the venue? two files and a link as today / stock the app
    prints, cards, a sign, a poster / send it to yourself · RECOMMEND **sheet**.
  - `landing` (after `venue`): where should a host land the moment the event exists? straight into the event / a
    beat of its own, then the event / the dashboard, the new event lit · RECOMMEND **beat**.
  - `hand` (after `venue`, drawn at 375 only): what should a host hold out to a guest at the door? the share
    dialog as today, 200 px / the code alone, full screen, full brightness, 343 px / the phone becomes the table
    card, 264 px · RECOMMEND **show**.
  - `empty`: what should an event's page say before any photograph? No uploads yet as today / a launch list of
    what is left / the code, full size, in the album's room · RECOMMEND **list**.
  - `first` (after `empty`): what should mark a guest's first photograph? nothing until she reloads as today / it
    lands while she is looking / the app goes and finds her, drawn as the message · RECOMMEND **live**.
- Mobbin citations: none (it was consulted for nothing this round; the options came from the shipped surfaces and
  from the seams in the Orchestrator's map).
- Captures: 48 PNGs, every option at 1440 and at 375, at
  `/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/first-event-captures/`.
  Reading them against their own words caught seven real defects, all fixed before the handoff: the style step's
  four codes reported as "no code on the screen" (the shipped picker renders its own `StyledQr`, so the
  measurement now reaches it by a wrapper); the print sheet's scaled paper mocks flagged as failing a scan floor
  written for screens; the toast drawn halfway up a 1440 page and landing on the empty card at 375; the in-place
  refusal still drawing a form in the world where the first question had removed every field; the empty event
  drawing the code twice, 232 in the header and 420 in the album; the first photograph drawn with four faint
  future ones behind it, which is five photographs on the step asking about the first; and the message option
  drawn under the event's own header, quietly saying she was at her laptop the whole time.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `venue` (the app has no paper at all and the marketing site sells three pieces of it), then
  `hand` at 375, where the three options are 200, 343 and 264 px of code and the caption under each says what a
  module ends up being.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of a host's first event asked eight decisions in
three beats, staged so three openers depended on nothing and five questions waited on them: what creating asks
for, where the code's style is chosen, what a Free host at their one event meets, how the code reaches a table,
where a new host lands, what she holds out at the door, what the page says before the first photograph, and what
marks it when it comes. Every option was drawn on the real create card, the shipped preset picker and real code
plates over one first-time host at 1440 and 375, with nothing able to write a row, and every caption reported the
code's module edge read off the frame against the 3 px floor the river's plate enforces. That measurement found
the product's own miss (the preset swatches sit at 2.3 px a module, under the floor) and the capture pass found
seven defects in the board itself, all fixed before the handoff.
