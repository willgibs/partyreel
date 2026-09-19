---
track: demo-event
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "391c40e9"         # the launch-prep SHA the branch was cut from
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board demo-event` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
