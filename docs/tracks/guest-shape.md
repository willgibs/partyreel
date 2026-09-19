---
track: guest-shape
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "236cc03f"            # the launch-prep SHA the branch was cut from
board: guest-shape      # round one: the guest experience's SHAPE from the scan
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-shape/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/u/[slug]/page.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/entry-shell.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/guest/password-gate.tsx
  - src/components/guest/enter-event-prompt.tsx
  - src/components/guest/ghost-grid.tsx
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/guest-share.tsx
  - src/components/guest/save-event-button.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/guest/report-dialog.tsx
  - src/components/shared/media-lightbox.tsx
  - src/lib/guest/entry-steps.ts
  - src/app/(dev)/design/sandbox/admin/spec.ts
---

# lp/guest-shape

**Goal.** Round one of `guest-shape`: the guest experience reconceived from the SCAN, its shape first. Will
(2026-09-19, `docs/design/rulings.md`): "Let's treat the full app experience as well as guest pages as
unprotected. Anything and everything is open to relitigate or reconcept from the ground up to begin establishing
a better system from its foundation." Six to eight decisions with `defineExploration`, each drawn on the real
guest components with FIXTURES (an open event with photographs, the same event gated by a password, an event
that requires an account, the empty album) PHONE FIRST at 375 and also at 1440, a recommendation each, every
number measured. The guest pages are the host's event, minimally branded (the ruling of 2026-05-31), and the
galleries now run to the window at 240 px tiles with the header on the gallery's left line (`gallery-wiring`,
2026-09-19): draw on that shape. **Not in this round:** any production byte; the host app (`app-shape`); the
tile grammar and controls (`app-vocabulary`).

**What is measured (the tree at the cut).** One landing (`/e/[token]`) that resolves visibility and access on the
server and wraps whatever it earns in an entry shell (a Vaul drawer on a phone, a centred dialog above) whose
steps (welcome, password, account) are four mechanisms stacked (the adaptive shell, the honest-affordance table,
the arrival beat, the success hold); a locked backdrop drawn as a ghost grid while the empty album is drawn as the
river (two languages for "photos are coming"); the album page as a left editorial shell (name, byline, a stats
line, three buttons, Download all, the masonry, a Report footer) with the product's "Start for free" in the
guest's header; every other guest dialog (Invite, Save, Report, Download all) a plain centred dialog on a phone;
two tones for one "create an account" moment (the warm gate versus the Save dialog's form); no way for a guest to
take a photo back once it lands (the lightbox has the affordance, the guest surface never passes it); no Live
indicator rendered (the doorbell's `live` only steers the poll); `/u/[slug]` with its own thinner header and a 404
that falls through to the marketing chrome; two footers with no rule; reading copy at 15 to 16 px on the happy
path and `text-xs`/`text-sm` on the sentences a guest most needs (the hold-for-approval banner, the gate's error
rows). Eleven seams are listed in the Orchestrator's exploration of 2026-09-19 (`docs/tracks/orchestrator.md`,
"The app round's map"); read them. The behaviour pins in `entry-modal.test.tsx`, `guest-upload.test.tsx` and
`password-gate.test.tsx` guard function, never look: the step order, the dismiss rules, the queue's
one-at-a-time and retry, the five strikes and the cooldown survive whatever shell you draw them on.

**The decisions (suggested; yours to recut, never forced apart).** The DOOR (one continuous door that never swaps
shell type, phone first even on a laptop; the adaptive shell kept with the locked backdrop in the river's
language; welcome and gate collapsed into one screen for the open event, the drama kept for gated ones); NOTHING
HERE YET (one language for locked and empty; two on purpose, each redrawn with the reason; the locked backdrop
folded into the door); the ALBUM'S CHROME (what the header carries and where the actions sit once the album runs
to the edge; the Live signal designed from zero; the growth hook's place, a whisper or a header link); every guest
DIALOG one object (the adaptive sheet promoted to all of them; inline panels instead of modals; modals kept with
the two account moments merged); what a guest can DO about their own upload (a time-boxed remove in the lightbox's
pill; never, said plainly at upload time; a "yours" view inside the album); the ARC to owner (one account surface
reachable from the event and the profile; the profile as the reward screen; light-touch as today in one language);
the FOOTER and the profile's chrome (one rule). The `admin` board is the worked example for a shape board on real
components with fixtures; `gallery-width` for the spec's form.

**Binds.** The bible; the guest rulings (the host's event, minimal branding; guest reading copy at 15 to 16 px);
the anti-abuse pieces out of frame and untouched (the capability token, the presigned URLs, the limiters, the
signed unlock cookie); no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required: shared
albums, event apps, RSVP and invitation flows.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3136`,
  `pnpm lab:demo --board guest-shape` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment.
- Every option at 375 and 1440 on the real components with fixtures; a capture of every option beside its words,
  the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The growth hook's place.** "Start for free" sits in the guest header on every event page, and it is
  the whole of Partyreel's exposure on a host's album. Bible 4 says that page is the host's event; the
  QR loop says a guest who becomes a host is the business. The board holds it CONSTANT across all
  twenty-one options on purpose, so no decision here secretly answers it. **Recommended:** leave it
  exactly where it is for this round and cut it as its own question once the shape is settled, drawn
  against the footer (which today carries only Report) as one "where Partyreel appears" decision.
- **`/u/[slug]` and the two footers.** The profile page hand-rolls a thinner header than
  `guest-header.tsx`, its 404 falls through to the marketing chrome, and the guest surface has two
  footers with no rule between them (seams 7, 8 and 11 of the map). Not drawn here: none of the three
  is a shape a guest meets on the way through an album. **Recommended:** fold them into the same
  "where Partyreel appears" board above rather than a round of their own.
- **A guest remove is a new capability, not only a look.** `yours=window` and `yours=mine` both need a
  server path a guest can reach (the `session_token` already identifies the uploader, and the host's
  own moderation is untouched). **Recommended:** if either wins, the wiring round writes the RPC with
  the window enforced SERVER-side, never in the pill, and the limiter set is extended before it ships.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None (lab-only; no production byte).

## Deferred (ROADMAP one-liners, bucket named)

- **Lab:** `defineExploration` could dedupe `configs` by id itself; every board that shares a knob
  across decisions now writes the same `controls.filter(...)` line at the end of its spec
  (`gallery-width` first, `guest-shape` second).
- **Lab:** `lab:demo`'s "same picture" warning is not stable on a board whose frames load photographs
  and a dynamically imported QR: three different pairs were reported across four runs of this board,
  and every one of them was visibly different in a capture. Its settle could wait on the frames'
  images rather than a fixed 1,600 ms.

## Handoff (replaces the chat report)

- **Head:** `540ef7cc` on `lp/guest-shape`, synced with `origin/launch-prep` at `161a01a5` (two merges:
  the first brought `gallery-wiring`, `app-shape` and three retirements, the second `album-motion`).
- **The gate on the synced tree**, each on its own exit code: `pnpm typecheck` 0 · `pnpm lint` 0 (the 8
  known warnings) · `pnpm test` 0 (2,506 passing) · `pnpm build` 0 · `pnpm design:rules` 0 and the
  specimen collector 0 (both artifacts committed) · `pnpm lab:smoke --base http://localhost:3136` 0
  (275 checks, 0 failing; the board reads 600 words of a 1,200 budget) · `pnpm lab:demo --board
  guest-shape` 0 (7 steps, 0 failing, every step draws its options; tallest 1.6 screens, wordiest 306
  words). The dev server ran on 3136 only and was killed by port before each build and test run.
- **The lane check** (`git diff --name-only origin/launch-prep...HEAD`):
  ```
  docs/design/library.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/guest-shape/account.tsx
  src/app/(dev)/design/sandbox/guest-shape/board.tsx
  src/app/(dev)/design/sandbox/guest-shape/dialogs.tsx
  src/app/(dev)/design/sandbox/guest-shape/door.tsx
  src/app/(dev)/design/sandbox/guest-shape/fixtures.ts
  src/app/(dev)/design/sandbox/guest-shape/guest-shape.css
  src/app/(dev)/design/sandbox/guest-shape/page-parts.tsx
  src/app/(dev)/design/sandbox/guest-shape/spec.ts
  src/app/(dev)/design/sandbox/guest-shape/yours.tsx
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  Eight files are the board's own directory (`owns`). Three are the registration exception, one line
  each at the head of `BOARDS`, `BOARD_COMPONENTS` and both `touchpoints.ts` unions plus one RULINGS
  row after `river-visual`'s; **both sides were kept at every merge** (`album-motion` and `app-shape`
  arrived on the same lines and are all present). `docs/design/library.md` is the generator's, from
  `pnpm design:rules`.
- **The decisions, one line each** (every option drawn on the real guest components over one wedding
  in its four access states, at 375 by 812 by default and 1440 by 900 on the knob):
  1. `door` — what a guest meets in the first seconds after a scan: today's welcome-then-gate, ONE
     screen with the gate carrying the invitation's promises, or the door as the whole page. **one.**
  2. `nothing` — how an album with no photographs speaks: two pictures made a family, one picture (the
     river) on both screens, or no picture at all. **river.**
  3. `chrome` — what sits above an album that runs to the window: today's column, a row at the album's
     right edge, or the event alone with the actions docked at the foot. **dock.**
  4. `live` — whether a guest sees the album filling: nothing (today), a line that counts, or the
     photograph announcing itself as it lands. **land.** (after `chrome`)
  5. `dialogs` — Invite, Save, Report and Download all: four centred dialogs, one sheet, or no overlay
     at all. **sheet.**
  6. `yours` — what a guest can do about the photograph they just added: nothing said at the act, a
     few-minute window in the viewer, or a "yours" strip in the album. **window.**
  7. `account` — how many voices ask for an account: two (today), one voice on one surface, or one
     voice with Save moved to an offer after the first photograph. **one.** (after `dialogs`)
- **Mobbin** (guidance's encouragement, cited): [Cosmos](https://mobbin.com/screens/8a7c0788-5f18-4671-a214-f4c514978c4d)
  (a floating bar of actions at the foot of a photo grid) is the shape behind decision 3's `dock`;
  [Google Maps](https://mobbin.com/screens/60711a1c-af85-47a9-ab76-653bcad9c31e) is the same idea on a
  public album; [Paired](https://mobbin.com/screens/91704cb3-7e3b-4529-ae9d-aef80ea31868) marks each
  photograph in a shared album "Added by you", which is the cheap half of decision 6 and the thing the
  wiring round should add under `window` so a guest can tell which tiles are theirs without opening one.
- **Captures** (21 options plus 7 question heads, at BOTH screens, every option at 1:1 with the stage
  head naming it): `/private/tmp/partyreel-captures/guest-shape/375/<decision>-<option>.png` and
  `.../1440/...`, with `<decision>-0-question.png` for the heads. Reading them against their own words
  before handoff caught five real defects and fixed every one: the `page` door printed the event name
  twice (the gate already carries it, and on a locked page it is the only name the server sends); the
  previews arrived wearing the board's OWN recommendations rather than today's product, so a decision
  could be answered before it was asked; `bar` fell back to the column at 375 and `lab:demo` called the
  two the same picture; the fixture's order put one photograph at the top of both phone columns (the
  order is now searched against a model of the CSS column balancing at both layouts); and the locked
  river at 25 percent measured 1.35 percent different from drawing no picture at all, which made the
  option the `words` option with a river's cost.
- **What is the shipped component and what is quoted.** Imported and wrapped, never edited:
  `GuestMasonry`, `GalleryEmptyState` and its `River`, `GhostGrid`, `PasswordGate`, `EnterEventPrompt`,
  `EmailSignIn`, `StyledQr`, `MediaTile`, `Logo`, `Button`, `Textarea`, `Label`, `Switch`, `Separator`,
  `LegalConsentLine`, `GoogleIcon`, and the page's own `GALLERY_COLUMNS`, COLUMN and BLEED rules.
  QUOTED, with the reason in each file's header: `entry-shell.tsx`, `GuestShare`, `SaveEventButton`,
  `ReportDialog` and `MediaLightbox` all portal to `document.body`, which inside a lab frame is the
  BOARD's body, so the surface leaves the picture entirely (the landmine `admin/destructive.tsx` and
  `glass/surfaces.tsx` both hit); `guest-header.tsx` resolves the visitor's Supabase session on mount
  and would draw whatever the author is signed in as; `event-experience.tsx` wants a gallery promise,
  four imperative handles and a router; and `WelcomeStep` is module-local to `entry-modal.tsx`. Every
  quoted className is copied from its source and nothing quoted re-decides a token, a corner or a step.
  No behaviour pin was touched: the step order, the dismiss rules, the queue and the five strikes are
  where they were, and the capability token, the presigned URLs, the limiters and the unlock cookie are
  out of frame.
- **A known flake, not a finding:** `lab:demo`'s "same picture" warning moved between three different
  pairs across four runs of this board (`river`=`words`, `line`=`land`, `sheet`=`inline`), and every
  one of them is visibly different in the captures. Its 1,600 ms settle does not wait for the frames'
  photographs or the QR's dynamic import. Deferred above.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Look at first:** `/design/lab/guest-shape`, step 1, at the default 375. The gated arrival is the
  screen most guests actually meet, and the three doors on it are the whole round in one picture; flip
  the Screen knob to 1440 on the same step to see the shell change type at 640, which is the half of
  the question a phone cannot show.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of the guest experience came back as seven
decisions rather than a plan: the door after the scan, how an album with nothing in it speaks, what sits
above an album that runs to the window, whether the album admits it is filling, one object or four for
Invite and Save and Report, what a guest may do about the photograph they just sent, and how many voices
ask for an account. Every option is the shipped guest components over one wedding in its four access
states, phone first at 375 by 812 with 1440 by 900 on a knob, with each caption measured out of the
frame's own document. Reading the 42 captures against their own words caught five defects and fixed them,
including a locked river so faint it measured the same as drawing no picture at all.
