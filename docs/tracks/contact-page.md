---
track: contact-page
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e442fc55"         # the launch-prep SHA the branch was cut from
board: contact-page     # round one: how someone reaches a person at Partyreel
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/contact-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/marketing-content.md
  - src/app/(marketing)/(paper)/contact/page.tsx
  - src/app/(marketing)/(paper)/contact/contact-form.tsx
  - src/app/(marketing)/(paper)/contact/actions.ts
  - src/app/(marketing)/(paper)/layout.tsx
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/lib/constants/contact.ts
  - src/lib/validation/contact.ts
  - src/lib/constants/site.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/email/templates.ts
  - src/lib/security/public-form-limit.ts
  - src/components/marketing/help/help-palette.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/app/(marketing)/(cinema)/press/page.tsx
  - src/app/(marketing)/(cinema)/careers/page.tsx
---

# lp/contact-page

**Goal.** Round one of `contact-page`: HOW SOMEONE REACHES A PERSON AT PARTYREEL, reconceived from the ground up.
Will (2026-09-19, `docs/design/rulings.md`, "stack the lab"): "/contact" is one of the surfaces he named,
"absolutely everything is up for relitigation or reconcepting from the ground up"; a board that keeps nothing is
deleted at no cost. Five to seven decisions with `defineExploration`, each drawn on the REAL page pieces
(`PageHero`, the form's fields and controls, the facts card, the self-serve directory) with fixtures (a host
mid-event with something broken, a planner weighing a plan, a reporter), at 1440 and 375, a recommendation each,
every number measured; a form is not assumed. **Not in this round:** any production byte; the email path, the
rate limiter and the honeypot (they stay as they are; an option that changes what is sent says so in Questions);
the careers form (a finding, below).

**What is measured (the tree at the cut).** `/contact` is the last `(paper)` page, forced light under the light
header, while every sibling utility page reads cinema hero, paper body, ink footer (`marketing-content.md`:
"`(paper)` holds only `/contact` and retires with it"; the ROADMAP: "/contact onto the cinema rhythm... the identity
revisit rides with it", unruled). A `lg` hero ("Contact", "Talk to Partyreel.", "An event you're planning, a plan
you're weighing, something that broke. Every note gets a reply, usually within a day."), then a 5xl grid: the
"Send a note" heading and a facts card (the plain address with a copy button, "Reply time: usually within a
day") beside a stationery card with a rotated postage-stamp photograph overhanging its corner (Will's composite
ruling of 2026-08-28 on the retired `contact-identity` board: "the desk: its structure and form, the note's stamp
and letterhead, the Polaroid spread dropped, the chips collapsed to a dropdown"), a REQUIRED topic select of seven
whose pick reveals a deflection hint with a link, Name, Email, an optional Subject, Message, a `cta` submit
beside the reply line; below, a three-column self-serve directory and a close band. On submit the row is written
first (deny-all RLS), then one email to the operator with Reply-To the sender; success swaps the card for a drawn
check, "Message sent", "Send another" and a help link; the sender gets NO receipt of any kind; failure is one
generic toast; eight notes an hour per network, failing closed. Every door into the page (the header's
Resources panel, the footer, every help article's "Contact us" with `?about=<slug>`, the palette's empty state,
the 404 and 500 footnotes, the press and careers pages) lands on the same form. Nine seams are listed in the
Orchestrator's map (`docs/tracks/orchestrator.md`, "The app round's map", the contact paragraph); read them. The
behaviour pins: `contact.test.ts` (the topic values mirror the migration's CHECK, every hint href resolves),
`validation/contact.test.ts` (the schema's rejections and their lines), `marketing-nav.test.ts` (Contact in both
the header panel and the footer column), `analytics/events.test.ts` (`contact_submit`); they guard function, the
look is open, and `actions.ts` itself has no end-to-end test.

**The decisions (suggested; yours to recut, never forced apart).** THE WAY IN (does reaching a person require a
form: the routed form with the address as its footnote, as today; the plain address alone, no form; both at equal
weight, the address as a first-class door); THE RECEIPT (what the sender holds afterwards: the on-page card
only; a receipt email carrying their note back; a reference line they can quote, with or without a status page);
URGENCY (an event that is going wrong right now: one queue for everything; a separate "something's wrong now"
door with its own promise; a promise per topic, the reply time stated where the topic is picked); THE TOPIC (the
required picker: required as today; gone, one message and central sorting; optional and prefilled from where the
visitor came, asked only when unknown); THE PAGE (the identity against the site's rhythm: the desk as today; the
plain cinema rhythm with a paper body; the desk as a paper CHAPTER inside a cinema-framed page, the ROADMAP's own
phrasing); BESIDE THE FORM (what stands next to it: the address and the reply time; the self-serve directory
promoted above the form, help first; a person, one named line). Optional if it fits the budget: THE PHONE (the
card at 375 as today; one field at a time; the form as a sheet the help palette can open). The `guest-shape`
and `app-shape` boards are the worked examples for a board on real components with fixtures; `loose-ends` for
a board on marketing pieces; copy their approach, import nothing from another board's directory.

**Binds.** The bible; bible 16's utility-page rhythm as precedent to judge, not a wall; the composite ruling of
2026-08-28 is precedent the goal reopens by name; the form's contract (the topic values, the schema, the honeypot
named `website`, the fail-closed limiter, `sendOnce`) stays unless an option says what it changes and why; a
receipt email is a send to a visitor-supplied address (an abuse surface: the wiring needs a limit and a
verification story, stated in Questions if the option wins); cost frugality (no chat or phone SaaS pre-revenue,
so live chat is not an option); no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required:
contact and support pages, help centres, "message sent" states.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`,
  `pnpm lab:demo --board contact-page` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real pieces with fixtures, no submit from a preview; a capture of every
  option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- Now: the desk's naming trap: `contact-sheet.tsx` and `press-sheet.tsx` are photography proof sheets, not contact surfaces; a cheap rename whenever either is next touched.
- Now: the 2026-08-28 composite ruling on the desk (`contact-identity`, touchpoints.ts) predates `docs/design/rulings.md` and has no entry there; worth backfilling verbatim next time a ruling is appended.
- Now: the honeypot field is named `website` (collides with a real field name elsewhere in the app) and `actions.ts` has no end-to-end test, only the schema and topic-value pins; both cheap fixes whenever the form is next touched.

## Handoff (replaces the chat report)

- Head `bf9e3b12`, pushed; synced with launch-prep at `bf9e3b12` (merged `f2cfa26f`, docs-only: two `[skip ci]` track/record commits, no owned-path overlap)
- Gates on the synced tree: typecheck ok, lint ok (8 known warnings), test ok (2517), build ok (254 pages); `pnpm lab:smoke` ok (296 checks, 0 failing; contact-page reads at 346/1200 words); `pnpm lab:demo --board contact-page` ok (6 steps, 0 failing, every option draws and moves the stage)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths (`src/app/(dev)/design/sandbox/contact-page/`) + the registration exceptions (`registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`, `docs/design/library.md` regenerated) + this file; no exceptions
- The decisions, one line each:
  - `reach`: does reaching a person have to go through a form; the form leads as today / the address alone, no form / both at equal weight; recommend the form leads (the topic picker is what a raw address cannot do, and the honeypot plus the fail-closed limiter cost more against a bare public address than a gated insert)
  - `page`: should /contact leave paper for the site's cinema rhythm; the desk as today / the plain cinema rhythm / the desk inside a cinema frame; recommend the desk inside a cinema frame (the ROADMAP's own fix, and it costs the page nothing it has: the desk moves into a PaperChapter exactly like /press's sheet)
  - `topic`: should picking a topic stay required; required as today / gone, sorted centrally / optional, skippable; recommend required (one tap, and it is what routes a note today; the admin support chip reads it)
  - `urgency`: should something going wrong right now get its own path; one queue as today / a separate door / a promise per topic; recommend a promise per topic (one line per topic, already-real content, no promise the team cannot keep)
  - `receipt`: what should the sender hold after they send a note; the on-page card only / a receipt email / a reference line; recommend the on-page card only (a second email is a send to an address nobody verified, a real abuse surface that needs its own limit and a bounce story)
  - `beside`: what should stand beside the form; the address and reply time / the directory promoted / one warmer line first; recommend the directory promoted (a visitor with a faster path meets it today only after scrolling past the whole form)
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: `reach` (the foundational fork everything else assumes), then `page` (the tallest, most transformative: the real dark hero and the desk inside a PaperChapter)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of `contact-page` asked how someone reaches a person at Partyreel from the ground up, six decisions on the real desk (PageHero, ContactForm, ContactFacts, MarketingHeader, PaperChapter, or a small labelled copy of one piece the real component took no prop for): whether reaching a person needs a form at all, what the sender holds afterward, whether something urgent earns its own path, whether the topic picker stays required, the page's identity against the site's cinema rhythm, and what stands beside the form. Drawn on a host mid-event with something broken, a planner weighing a plan, and a reporter on background, at 1440 and 375. No production byte shipped; the email path, the rate limiter and the honeypot stayed as they are. Three small findings deferred to the ROADMAP's Now bucket (a naming trap, a ruling with no ledger entry, a shared honeypot field name).
