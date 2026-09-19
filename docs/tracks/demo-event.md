---
track: demo-event
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2ab79dba"         # the launch-prep SHA the branch was cut from
board: demo-event       # round one: the demo as the product's first impression
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-event/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/guest-flow.md
  - docs/systems/marketing-content.md
  - src/lib/demo.ts
  - src/app/demo/route.ts
  - src/lib/constants/marketing-voice.ts
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/chrome/footer-demo.tsx
  - src/components/marketing/chrome/footer-qr.tsx
  - src/components/marketing/system/demo-cta-link.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/entry-modal.tsx
  - src/lib/guest/entry-steps.ts
  - src/components/guest/live-gallery.tsx
  - src/components/guest/guest-upload.tsx
  - src/lib/guest/use-upload-queue.ts
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/guest-share.tsx
  - src/components/guest/save-event-button.tsx
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
---

# lp/demo-event

**Goal.** Round one of `demo-event`: the demo as the product's FIRST IMPRESSION, reconceived from the ground up.
Will (2026-09-19, `docs/design/rulings.md`, "stack the lab"): the demo event is unprotected, "absolutely everything
is up for relitigation or reconcepting from the ground up"; a board that keeps nothing is deleted at no cost. Six
to eight decisions with `defineExploration`, each drawn on the REAL guest components with a demo fixture (one
wedding with placeholder photographs; the curated media comes in the Higgsfield month and no ask waits on it),
at 375 first and at 1440, a recommendation each, every number measured. The audience is a prospective HOST who
followed a "try the live demo" door, never a guest. **Not in this round:** any production byte; the guest
experience's own shape (`guest-shape`, on the desk: its `door`, `chrome`, `live` and `yours` decisions are the
ground you draw on); the marketing site's "Live demo" animation section ("Maya and Jay", ruled decoupled).

**What is measured (the tree at the cut).** Four doors with four idioms resolve to one `/e/<DEMO_QR_TOKEN>` page:
the home hero's static QR plate (128 / 144 px), the footer's photo-pile QR on desktop and a text link on a phone,
`DemoCtaLink`'s text line on the feature and event pages ("Try the live demo, no signup."), and the nav
mega-panel's `DemoTicket` (whose `row` variant is dead code); `/demo` 307s to the same page for a printed code. On
arrival `isDemo` forces `access="full"` (a password on the row is bypassed; only `private` still locks) and
`computeEntry` returns no steps, so the demo visitor NEVER sees the welcome, the byline, the legal line or a gate:
they land on the gallery under the ordinary header (its "Start for free" is the whole growth hook) with one grey
banner, "You're trying a live demo. Photos you add here aren't saved." Save is blanked to an empty span; Invite
shares the demo link itself; Download all is hidden; per-tile Save and Share work against real presigned URLs.
Adding a photo "joins" locally, `simulateUpload()` ramps fake progress for about 480 ms and always answers
"approved", an optimistic blob tile gets the green check, nothing persists and nothing follows. No door says
"demo" before arrival; the nudge toward making an event exists nowhere but the header. Ten seams are listed in the
Orchestrator's map (`docs/tracks/orchestrator.md`, "The app round's map", the demo paragraph); read them. The
behaviour pins: `entry-modal.test.tsx` ("owner and demo never see the surface"), `guest-upload.test.tsx` ("demo
mode": no fetch, synthetic approved, no save prompt), `gallery-empty-state.test.tsx` (bible 4: no demo code inside
a host's own album), `footer-contract.test.ts` (the pile's contrast). They guard function; the look is open, and
a pin that blocks a better demo is a finding for this manifest, never a wall.

**The decisions (suggested; yours to recut, never forced apart).** ARRIVAL (what the demo visitor meets in the
first seconds: straight onto the gallery as today; the real welcome the host's guests get, since this is the
audience it was written for; a demo frame of its own that names the party and hands them a role); FRAMING (how
the album admits it is a demo: the grey banner; a tag on the header that follows them; a narrated frame around
the album, "this is what your guests see"); TRY (the upload as the demo's moment: the simulated upload as today;
the simulated upload followed by the turn, "that is what your guests would see, make yours"; no upload at all,
the demo is a look); NEXT (the way from the demo to an event of their own: the ambient header CTA only; the
blanked Save slot becomes "Start your own"; a close card at the album's foot, the reel's spot); DOORS (four
idioms for one destination: kept as four, each wearing a "Demo" tag; two, the code and the line; one object
skinned per place); SHARE (what Invite does in a demo: shares the demo as today; shares it as "look at this" with
copy for a friend; hidden); THE PHONE (the demo scanned off a laptop screen: what the phone shows first, the scan
as the demo's own door). Optional, if it fits the budget: HOW MANY DEMOS (one wedding; a switcher across two or
three event types; one event whose photographs change with the door you came through). The `guest-shape` board
is the worked example for a shape board on real guest components with fixtures (its fixtures, its quoted
portal-bound shells, its measured captions); copy its approach, import nothing from another board's directory.

**Binds.** The bible; bible 4 (the guest page is the host's event, and no demo code appears inside a real album);
the demo's definition in the rulings (2026-09-16: "a fake event we're creating, and does not accept new uploads,
only simulate the experience... the existing demo content will be completely replaced prior to launch"); the
Easter-egg ruling on the river's code (no "scan it" label; other places point at the demo directly); the security
pieces out of frame (the capability token, presigned URLs, the limiters); no em-dashes; the copy is open (bible
21). Mobbin is encouraged, never required: product demos, sandbox modes, "try it" flows, onboarding tours.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3131`,
  `pnpm lab:demo --board demo-event` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 375 and 1440 on the real components with the demo fixture; a capture of every option beside its
  words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **A behaviour pin is in the way of two of the `arrival` options, and it should be, so it is a
  question rather than a wall.** `entry-modal.test.tsx` pins "owner and demo never see the surface"
  and `computeEntry` returns `{ steps: [], autoOpen: false }` for `isOwner || isDemo`. That is right
  for an OWNER, who wrote the event; the demo inherited it, and its visitor is the one person on the
  site who has never seen any of it. Both `welcome` and `role` change that behaviour.
  **Recommended:** the pin narrows to the owner at the wiring, and the demo gets whichever arrival
  Will picks; `album` keeps it exactly as it is, so a "no" costs nothing. Carried on the
  recommendation: the board draws all three.
- **`phone=pair` needs a transport, and the demo's own contract says it cannot be the media table.**
  Nothing in the demo persists, so a photograph crossing from a phone to the laptop it scanned would
  ride a Supabase Realtime broadcast on a channel keyed by the scanned code, with both screens
  forgetting it on close: one channel, no rows, no R2 objects, the demo event still pristine.
  **Recommended:** ask him to answer the decision on whether the MOMENT is worth it and leave the
  transport to the wiring lane, which is how the board is written (`scan.tsx` names the cost).
- **The demo's server side is UI-only today, which is a finding the round turned up rather than a
  decision.** Per-tile Save and Share and the bulk export routes skip only `getUser()` for the demo;
  no `isDemo` enforcement exists server-side, so the hiding is a UI decision a request can walk past.
  Nothing on this board depends on it and no option changes it. **Recommended:** a ROADMAP line under
  Security rather than a question; recorded in Deferred below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. Every fact this round touched belongs to a decision Will has not made yet; the round's
  system-doc edits come with the wiring, in `docs/systems/guest-flow.md` ("Demo mode") and
  `docs/systems/marketing-content.md` (the doors).

## Deferred (ROADMAP one-liners, bucket named)

- **Security:** the demo's per-tile Save / Share and the bulk export routes enforce no `isDemo`
  server-side (the UI hides them; a request does not have to). Decide whether the demo's capability
  token should carry a read-only claim.
- **Now:** `DemoTicket`'s `row` variant is dead code and its comment contradicts `cinema-hero.tsx`'s
  (each says the other renders it). Whatever `doors` answers, one of the two comments is wrong today.
- **Launch checkpoint:** the demo event's photographs are placeholders and the `event` decision
  decides how many albums the Higgsfield month has to produce (one, or three).

## Handoff (replaces the chat report)

- **Head:** the code at `dad855b8` on `lp/demo-event`, with this Handoff commit on top; synced with
  `origin/launch-prep` at `f2cfa26f` (one merge, which brought `app-vocabulary`).
- **The gate on the synced tree**, each on its own exit code: `pnpm design:rules` 0 and the specimen
  collector 0 (123 components, 733 contracts, 18 policies; both artifacts committed) · `pnpm
  typecheck` 0 · `pnpm lint` 0 (the 8 known warnings, none in this lane) · `pnpm test` 0 (2,517
  passing, 241 files) · `pnpm build` 0 (254 pages) · `pnpm lab:smoke --base http://localhost:3131` 0
  (297 checks, 0 failing; the board reads 581 words of a 1,200 budget) · `pnpm lab:demo --board
  demo-event` 0 (7 steps, 0 failing, every step draws its options; tallest 1.6 screens, wordiest 199
  words). The dev server ran on 3131 only and was killed by port before every build and test run.
- **The lane check** (`git diff --name-only origin/launch-prep...HEAD`):
  ```
  docs/design/library.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/demo-event/arrival.tsx
  src/app/(dev)/design/sandbox/demo-event/board.tsx
  src/app/(dev)/design/sandbox/demo-event/demo-event.css
  src/app/(dev)/design/sandbox/demo-event/doors.tsx
  src/app/(dev)/design/sandbox/demo-event/fixtures.ts
  src/app/(dev)/design/sandbox/demo-event/page-parts.tsx
  src/app/(dev)/design/sandbox/demo-event/scan.tsx
  src/app/(dev)/design/sandbox/demo-event/spec.ts
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  Eight files are the board's own directory (`owns`). Three are the registration exception, one line
  each at the head of `BOARDS`, `BOARD_COMPONENTS` and both `touchpoints.ts` unions plus one RULINGS
  row after `river-visual`'s; **both sides were kept at the merge** (`app-vocabulary` arrived on the
  same three lines and is present in all of them). `docs/design/library.md` is the generator's.
- **The decisions, one line each** (every option drawn on the shipped demo over one wedding, at 1440
  by 900 by default and 375 by 812 on the knob; ★ LAPTOP FIRST, the inverse of `guest-shape`, because
  everyone who opens the demo followed a door that said "try the live demo"):
  1. `arrival` — what someone meets in the demo's first seconds: straight into the album (today), the
     welcome a guest gets, or a screen that hands them a role. **role.**
  2. `framing` — how the demo keeps saying it is a demo once they are in the album: the grey line
     (today), a mark in a header that stays, or a strip along the foot. **tag.** (after `arrival`)
  3. `try` — what happens when they add a photo: it lands and nothing is said (today), it lands and
     then the turn, or no upload at all. **turn.**
  4. `next` — where the way out into an event of their own sits: the header's CTA (today), the
     blanked Save slot, or a closing card under the album. **slot.** (after `try`)
  5. `doors` — what a door promises before anyone opens it: nothing (today), the party named, or the
     party shown. **named.**
  6. `phone` — what happens when the demo is scanned off the laptop screen: the same demo in a hand
     (today), the phone naming the scan, or the two screens as one session. **pair.**
  7. `event` — how many parties the demo is: one curated once, three chosen at the door, or one album
     with a switcher. **one.** (after `arrival`)
- **Mobbin** (guidance's encouragement, cited): [Sentry](https://mobbin.com/screens/b74cbcc7-12b5-4b98-be43-027a776e6ef3)
  is the reference for two of these at once. Its hero puts "Explore the sandbox" beside "Try Sentry
  for free", a door that NAMES what is behind it (decision 5's `named`); and inside, a small
  "Marketing Mode / On" chip is pinned to the corner of every screen, which is decision 2's `tag`
  built by somebody who had the same problem: a visitor in a sandbox needs a mark that does not
  scroll away.
- **Captures** (21 options plus the knob positions a default pass never reaches: the laptop half of
  a scanned demo, the footer and the feature line for the doors, a second party; at BOTH screens,
  every option at 1:1 with the stage head naming it): `/private/tmp/partyreel-captures/demo-event/1440/<decision>-<option>[-<knob>].png`
  and `.../375/...`, with `captions.txt` holding every caption beside its head. Reading them against
  their own words before handoff caught seven real defects and fixed every one: the `tag` option's
  mark carried no `data-de-say`, so the caption under the one picture that proves it read
  'nothing says "demo"'; the door measurement counted words only, so `pile` — whose whole promise is
  photographs — measured as saying nothing; the shipped `FooterDemo` drew as a bare plate with four
  photographs hidden under it, because its REST POSE lives in `marketing.css` under `[data-mkt]` and
  a lab frame loads neither (quoted into `demo-event.css`); the captions claimed a green check that
  fades 2.5 seconds before the moment being drawn; the added photograph was a still the album already
  held three copies of (the twelfth is now reserved for it, and the album runs on eleven); the
  three-party door borrowed the guest welcome's Terms line, which is a dark pattern on a screen where
  nothing is being agreed to; and the party cards drew `items[0]`, so the wedding's card was balloons
  and the company party's was a wedding arch (each party names its own cover now).
- **What is the shipped component and what is quoted.** Imported and wrapped, never edited:
  `GuestMasonry` (and through it `MediaTile`, the shared `GALLERY_COLUMNS` rule and the lightbox),
  `FooterQr`, `FooterDemo`, `Logo`, `Button`, `LegalConsentLine`, and the page's own COLUMN and BLEED
  rules. QUOTED, with the reason in each file's header: `entry-shell.tsx` portals to `document.body`,
  which inside a lab frame is the BOARD's body, so the sheet would leave the picture entirely (the
  landmine `guest-shape`, `admin` and `glass` all hit); `guest-header.tsx` resolves the visitor's
  Supabase session on mount and would draw whatever the author is signed in as; `event-experience.tsx`
  wants a gallery promise, four imperative handles and a router; `WelcomeStep` is module-local to
  `entry-modal.tsx`; and `DemoCtaLink` and `DemoTicket` both read `DEMO_EVENT_URL` and return null
  when no demo is configured, so the board hands every door its URL as a fixture and never depends on
  a live demo existing. **Nothing touched the live demo event, any real row, or any production byte.**
- **One thing the pictures say that no option does.** With `try=turn` and `next=slot` both taken, two
  buttons reading "Start your own" sit a hundred pixels apart on the first screen. The board draws it
  and the caption says it, so it is a cost he can see rather than one the wiring discovers.
- Assets requested from Will: **one, and only if `event` comes back `pick` or `switch`** — two more
  curated demo albums (a birthday and a company party) at the same shape as the wedding: about 33
  photographs each, mostly 3:4 portraits with a few landscapes, a 9:16 and a square, plus one cover
  per album · replaces the stand-ins in `sandbox/demo-event/fixtures.ts` (`PARTIES.birthday`,
  `PARTIES.office`), which are the same twelve marketing stills offset and read as weddings. With
  `one`, the Higgsfield month's existing demo-album slot covers the round and nothing new is asked.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Look at first:** `/design/lab/demo-event`, step 1, at the default 1440. The three arrivals are the
  whole round in one picture: today's album with a grey line doing all the explaining, the invitation
  written for a guest, and a screen that says whose party this is and what to try. Then step 4 at the
  same width, where the empty half of the action row that the demo draws today is filled in.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). `demo-event` asked the demo as the product's first
impression from the ground up: seven decisions on the shipped guest page in demo mode and on the real
marketing doors, LAPTOP first at 1440 by 900 with 375 on a knob, because everyone who opens the demo
followed a link that said "try the live demo". The fixture was one wedding of 33 tiles drawn from
eleven of the twelve marketing stills in an order searched against a model of the CSS column
balancing at both layouts, with the twelfth reserved for the photograph a visitor adds. Reading every
capture against its own words caught seven defects, among them a measurement that reported the one
option proving itself as saying nothing, and the shipped footer pile drawing flat because its rest
pose lives in a stylesheet no lab frame loads. Three questions were carried on their recommendations
and one security finding went to the ROADMAP.
