---
track: voice
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "fe55dee8"         # the launch-prep SHA the branch was cut from
board: voice            # round one of the board Will asked for by name (2026-09-17)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/voice/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-voice.ts
  - src/lib/content-policy.test.ts
  - docs/systems/marketing-content.md
  - docs/systems/guest-flow.md
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/voice

**Goal.** Round one of the `voice` board: the brand voice DERIVED from won lines, never declared and then
applied. Six to eight decisions, each ONE real line in its real place with three or four close candidates
and one winner, spanning the marketing site, the host app and a guest's phone, so a voice cannot pass in a
silo. Authored with `defineExploration` (`src/components/lab/exploration.ts`). **Not in this round:** any
production byte (copy is open, bible 21, and this lane still changes none: the wiring lands his wins), a
voice guide or `docs/specs/voice.md` (written at the round's close from what his wins share, by the
Orchestrator), more than one voice, any line the three shipped picks already settled.

**Binds.** The bible (20 and 21 both point at this board), the contracts, the policies: bible 20's two
fences in `src/lib/content-policy.test.ts` (no human-response or human-moderation promise, no automation
absolutes) and the em-dash policy; `docs/systems/marketing-content.md`'s promise-neutralization doctrine
(published language commits to outcomes only); `docs/design/rulings.md` 2026-09-17 (the kill and the form);
`docs/PROGRAM.md` "A round returns DECISIONS", including: options are never forced apart, and two candidates
that land on the same answer is a finding, not a debt.

## What he said (verbatim, rulings.md 2026-09-17)

On the kill: "feels like the agent worked too hard trying to generate multiple unique voices rather one
that's perfect, then we kept running in through unreviewed rounds to dig deeper into each without shaping
along the way. Now we have a massive amount of ideas, but it feels like the best version would've been a
mesh of examples from multiple voices at different points (today's, keepsake, live, plain) rather than
forcing each to have a very specific tone so it felt differentiated for the sake of the exploration."

On the form: "The better strategy would likely be to give me tighter comparisons of copy in real cases, one
at a time, and use my winning selections to build the brand voice, rather than presenting two options."
And: "Starting with just a few spot example statements may make a voice sound good in a silo, but not
perform well in actual usage. I'd rather shape it as we see the voice applied in real cases."

On the home counts, which he already ruled: "I think it'd be nice to make that the first line, then stacked
center under, 'Created for you.'"

## What is settled, so build rather than ask

- **The three picks stand** and are not re-asked: `noun=album` (a guest's word is "album"; the code's word
  "gallery" stays, `docs/systems/guest-flow.md`), `unfurl=join` (one invitation for every open event),
  `counts=hero` ("312 photos and 48 videos" on one line, "Created for you." under it).
- **Bible 20's open question is this board's FIRST ask, drawn rather than debated**: "say who we are, never
  who we are not" either forbids NAMING an absence ("no app, no account") or only the negative SHAPE of a
  sentence. Find a real line where the site says who it is not today (the home hero's ruled block, a feature
  page's line, the guest door) and offer close candidates on that line: the naming kept, the same fact
  affirmed, a shape between. Its `lands` is bible 20's statement, rewritten from the win.
- **The one home of marketing copy** is `src/lib/constants/marketing-voice.ts`; guest copy lives in
  `src/components/guest/`; the host app's in its components; emails in `src/lib/email/templates.ts`. Read
  them to find real lines; edit none of them.
- **Every real place is drawn at its real size**: a preview is the real surface with the candidate line in
  it, at 1440 for the site and the app, in a 375 column (`tile: "phone"`) for a guest's phone. Inject the
  line through a prop where the component takes one; where it does not, copy the section into your
  directory to vary the line, and say which in the Handoff. The home hero's band (`cinema-hero.tsx`,
  shipped and ruled) is a legitimate place for its own line.
- **Candidates are close, not differentiated for the sake of it**: three or four lines a careful writer would
  actually consider for that place, each with a `means` that says what it does differently in words, one
  recommended. A candidate must clear both fences and the doctrine; a line that cannot is not a candidate.
- **Every other board's copy is placeholder until this board rules** (Will's `copy=page`): this is the one
  board where the words themselves are judged, so its stage must let him read them at true size.

## The decisions (six to eight; independent unless a later line depends on an earlier win)

1. Bible 20's question, on a real line (above).
2. to 8. One real line each, your choice, so that together they span: the home hero's ruled block or its
   sub-line; a feature page's hero line (`feature-pages.ts`); the pricing page's Pro line; a host's first-run
   empty state or a moment toast in the app; the guest entry sheet's prompt (`entry-modal.tsx`,
   `enter-event-prompt.tsx`); the guest album's empty-state title ("This is where it all lands",
   `gallery-empty-state.tsx`); the upload prompt (`guest-upload.tsx`, `file-dropzone.tsx`); an email's
   subject or first line (`templates.ts`). Prefer lines a stranger meets in the first minute. Each step's
   `context` says where the line lives and who reads it; each `lands` says what the win becomes.

## The lab you are building for

The step is the page with a dock: every option mounted once at true size, flipped or side by side, a sticky
head naming what is shown and at what scale, the answer in a sticky dock. `pnpm lab:smoke` refuses a board
over 1,200 words outside closed folds and specimens; `pnpm lab:demo` fails a step that is CLIPPED, UNLABELLED,
NO DOCK, frozen, or whose stage starts lower than 0.6 of a screen. The worked example of the authoring
shape is `src/app/(dev)/design/sandbox/gallery-width/spec.ts`.

**Register your board under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the import, and the member at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the import, and the entry at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the id at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row at the END of `RULINGS` (after river-visual's; copy its shape,
  `board` block included);
- `touchpoints.test.ts` takes NO line (it derives the standing list from the registry).
Three other lanes add theirs at the same places, so the Orchestrator merges those lines keep-both. Never
reorder, re-sort or reformat the lists; if `pnpm format` touches a hunk outside your lines, revert it.
`pnpm design:rules` regenerates `docs/design/library.md` and `rules.generated.json` (generated; allowed in
the lane check).

## Verify, and the gate

The board at 1440 and 375, reduced motion honoured; every candidate read at true size on its real surface.
Dev server on port 3135, stopped by port (`lsof -ti tcp:3135 | xargs -I{} kill {}`), never an unscoped kill.
The gate, each step on its own exit code: `pnpm design:rules`, `node
"src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`,
`pnpm build`, `pnpm lab:smoke --base http://localhost:3135` (0 failing; the board under the reading budget),
`pnpm lab:demo --board voice --base http://localhost:3135` (0 failing).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **Does the first win bind the other seven?** Decision 1 rules on whether a line may name an absence, and two other
  winners could contradict it (the home hero's `today` keeps "No more chasing group chats", and the host's blurb, held
  fixed under every option, still says "No app, no account"). **Recommended:** treat `absence` as binding, land the
  other seven as picked, and re-ask in round two only the won lines that break it, redrafted in the shape he chose. It
  needs no answer before the sitting; it decides what round two is made of.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

- **The guest dropzone's second line is half wrong on a phone** (bucket: the guest flow): `file-dropzone.tsx` reads
  "Tap to choose, or drag them here", and nothing drags on the surface almost every guest meets it on. Found while
  drawing the upload panel; not asked on this board, which had no room for a ninth line.

## Handoff (replaces the chat report)

- Head is the tip of `origin/lp/voice` (this commit); the board is `cd5b7ed0` and the merge `1ad62757`. Synced with
  `launch-prep` at `707d99a2` (it had moved 25 commits; merged, never rebased,
  keep-both on all four registration conflicts: `BOARDS`, `BOARD_COMPONENTS`, `RulingId`, `SandboxId`, with
  `docs/design/library.md` taken from launch-prep and regenerated).
- Gates on the synced tree, each on its own exit code: `design:rules` 0 · specimens 0 (120 specimens) · `typecheck` 0 ·
  `lint` 0 (the 8 known warnings, 0 errors) · `test` 0 (233 files, 2197 tests) · `build` 0 (124 routes, 254 static
  pages) · `lab:smoke` 0 (234 checks, 0 failing; the board reads 461 words of its 1,200 budget) · `lab:demo --board
  voice` 0 (8 steps, 0 failing, every step draws its options).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:
  `docs/design/library.md` · `src/app/(dev)/design/(shell)/lab/boards.ts` · `src/app/(dev)/design/sandbox/registry.ts` ·
  `src/app/(dev)/design/sandbox/voice/{board.tsx,fixtures.ts,lines.ts,spec.ts,surfaces.tsx,voice.css}` ·
  `src/app/(dev)/design/touchpoints.ts`. Owned paths, the registration lines and one generated file; nothing else.
- **The eight decisions**, each the place, today's line, the candidates and the recommendation:
  1. `absence` (the guest sheet's first benefit row, 375) is bible 20's open question drawn rather than debated.
     Today: "Add your photos and videos in seconds. No app, no account." Against it: the same absences said as actions
     ("Nothing to install, nothing to sign up for"), the same fact affirmed ("Your phone is all you need") and the
     mechanism affirmed ("straight from your camera roll"). **Recommends the affirmed fact**, because it says the same
     thing as a promise about what the guest already has, and every other line on the board can then be written that way.
  2. `hero-sub` (the home hero's sentence, 1440). Today: "...with one QR code. No more chasing group chats the morning
     after." Against it: the same morning turned affirmative, one sentence code-to-album, and a version opening on the
     guests. **Recommends the affirmed morning**, the half a stranger repeats back, and the smallest change to a line
     that works.
  3. `feature-h1` (/features/curation's H1, 1440). Today: "Your guests only see the good part." Against it: "You decide
     what everyone sees.", "Every photo lands. You choose which ones stay." and "The album everyone remembers is the one
     you shaped." **Recommends "Every photo lands. You choose which ones stay."**, the only one that answers what
     happens to the photos a host does not pick.
  4. `pro-line` (the Pro card's line, read beside Free's, 1440). Today: "For hosts who host again." Against it: a mirror
     of the Free card ("Every event after that, covered."), a what-you-buy line, and today's idea as a sentence.
     **Recommends the mirror**: the cards are read as a pair and nothing else on the page pairs them.
  5. `host-empty` (the dashboard with no events, 1440). Today: "Your events land here." Against it: "One event, one code,
     one album", "Start with one event" and "Your first album starts here". **Recommends the teaching line**: the button
     under it is already asking, and an empty screen is the one moment an app has a host's whole attention.
  6. `gate` (the account step, 375). Today: reason, then cost, then reassurance. Against it: cost first then reason, two
     short sentences, and a five-word purpose. **Recommends cost first**, because a guest at a party reads one line and
     the reason has to survive being skipped.
  7. `empty` (the guest album's empty title, 375). Today: "This is where it all lands." Against it: "The album starts
     with you", "This album fills up fast" and "Every photo from today lands here". **Recommends "The album starts with
     you"**, the only one that asks for the first photo without repeating the button.
  8. `moment` (the toast after an upload into a reviewed album, 375). Today: "Sent, waiting for host approval." Against
     it: "Sent to the host", "Sent. It appears once the host waves it through." and "Got it. The host adds it to the
     album." **Recommends the third**, the only one that says why the photo is not in the album yet before the guest
     goes looking for it.
  6 and 5 are deliberately the same question on two surfaces, so his two answers say whether the app and a guest's phone
  are meant to speak with one voice.
- **How each surface takes its line.** Through a PROP of a shipped component, untouched: `/features/curation`'s hero is
  the real `PageHero` with the real `FeatureHeroEyebrow` and the registry's own subhead wearing the candidate `heading`;
  the guest album's gallery is the real `GuestMasonry`. COPIED into `surfaces.tsx` because the component has no prop for
  the line (nothing under `src/components` is edited): the entry sheet's welcome and account steps (`entry-modal.tsx`,
  `enter-event-prompt.tsx`, inside `entry-shell.tsx`'s phone drawer, with the real `EmailSignIn` and
  `LegalConsentLine`), the pricing pair (`plan-cards.tsx`, both cards so the Pro line is read beside Free's), the host's
  empty events screen (`events-empty-teaser.tsx`, its blurb held at today's wording under every option) and the guest
  album's empty state (`gallery-empty-state.tsx`). The home hero is the SHIPPED composition standing still: its band is
  built from `hero-stream.ts`'s own tables at their rest phase and wears `cinema-hero.css`, so the corridor, the mask,
  the perspective and the frame shadows are the page's; `voice.css` only puts the rest state back for a reader who did
  not ask for less motion, and releases the hero's `100svh` floor inside a stage.
- **Captures**, every candidate on its surface at true size, from headless Chrome over its DevTools protocol (reduced
  motion emulated, one fresh load per option through the board's own URL state): `/private/tmp/partyreel-captures/voice/`
  as `<decision>--<option>.png` (32 files; 1440x930 the hero, 1440x485-712 the site and app sections, 375 phone stages
  drawn in a 1440 column), plus `_375-step-absence.png`, the first step at a phone.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Look at first:** step 1. It is bible 20's ruling, it is the only step whose answer can contradict another's, and it
  is the one place on the board where today's line and its affirmative twin sit a blink apart.
- **Two lab findings for the kit, neither blocking.** (1) A production hero mounted on a board arrives INVISIBLE until
  `Reveal` sees it: `PageHero`'s subhead and actions ride `data-mkt-cut`, whose `animation-fill-mode: both` holds their
  backwards state, so the board drew a headline with nothing under it and every capture photographed an empty hero. The
  board carries its own settled-state rule (`voice.css`); the kit could offer one. (2) `FitStage`'s `swapKey` remounts
  its child, and for one frame afterwards the stage reports a small box; the type ladder's `vw` clamps resolved at their
  phone end inside it, so an 80px headline photographed at 34px. Dropping `swapKey` where nothing replays fixes it, and
  the captures are taken one-load-per-option rather than by pressing. (3) `lab:demo` warns that two `moment` candidates
  draw the same picture ("Sent, waiting for host approval" against "Sent to the host"): they differ by under 0.1 percent
  of a phone stage. That is the finding, not a defect: a four-second toast is a small target and two of its candidates
  are nearly indistinguishable at a glance.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of the `voice` board landed in the form Will asked for after
killing `brand-voice` unruled: no voice is declared anywhere, only eight real lines in the places they are read, each
with three or four candidates a careful writer would weigh, one recommended. Bible 20's open question is the first ask,
drawn on the guest sheet's own "No app, no account" with the same fact affirmed beside it. The eight span the marketing
site (the home hero's sentence, a feature page's headline, the Pro card's line beside Free's), the host app (an empty
dashboard) and a guest's phone (the welcome row, the email ask, an empty album, an upload's toast), each at 1440 or in a
375 column; two of them ask the same question on two surfaces on purpose. No production byte moved: the surfaces take
their line through a prop where one exists and are copied into the board where none does.
