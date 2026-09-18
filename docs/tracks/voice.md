---
track: voice
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: design:rules, specimens, typecheck, lint, test (N), build (M pages), lab:smoke, lab:demo
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines + the generated files
- Each decision, one line: the place, the line today, the candidates, the recommendation and why
- How each real surface takes its candidate line (a prop, or a copied section and where)
- Captures (paths): every candidate on its surface at its true size
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
