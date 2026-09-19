---
track: first-event
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board first-event` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
