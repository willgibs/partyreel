---
track: brand-voice
status: handed-off
cut: "ab45b03"
merged_round_2: "b574cda"
merged_round_1: "d988c88"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/brand-voice/
  - docs/specs/brand-voice.md
reads:
  - src/lib/constants/marketing-voice.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/feature-pages.ts
  - src/lib/content-policy.test.ts
  - src/lib/no-em-dash-policy.test.ts
  - docs/systems/marketing-content.md
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/sandbox/variant-frame.tsx
  - src/lib/email/templates.ts
  - content/help/AUTHORING.md
---

# lp/brand-voice

## Round 3 (Will, 2026-09-14: one more iteration cycle before his review)

**Round 3 (the goal): the last mile, walked first by you.** Two rounds built the board; this one is the
walk Will will take, taken before him. (1) **Walk it cold**, the way he will: the board on the launch-prep
alias (round 2 is integrated there) and then on your preview, in a foreground tab, at 1440 and then
375, every toggle, every candidate, and every "Apply to the site" block on the pages you listed (the home
arc, `/pricing`, `/help`, `/contact`, the dashboard and an event page with `?key=`, the demo guest page).
Note every place a stranger would stumble: an unexplained toggle, two candidates that read the same, a
stage that needs a caption or has one too many, a slow first paint, a layout that breaks at 375, a
control that does nothing visible. Fix each. (2) **Re-read the reviewer's findings** on your round-2
handoff (below) and the other boards' latest Handoffs in `docs/tracks/` and proposals in `docs/specs/`:
anything there that changes your answer changes your board. (3) **Make the decision easy**: the strongest
candidate first; a candidate cut if it no longer earns its column (say so); every ask a one-word answer
and no more asks than Will must answer; the departures only the ones he must rule on. (4) **Honesty and
cost**: every number on the board is measured or labelled a stand-in; measure what runs (frame time, layer
count) and cut what does not earn its cost; reduced motion gets the settled composition. (5) **The
record**: "Handoff (round 3)" and "Record (round 3)" below; the Record is the paragraph the CHANGELOG
carries for rounds 2 and 3 together, so write it as the whole story of what the board became.

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The guide exists and three voices were argued on headers; now argue them on
whole pages, since a voice is judged in a paragraph and a page, not a line. (1) **The home arc, top
to bottom**, in A and in B (the recommended two; keep C only if it still earns a column): every
section's eyebrow, header, supporting text and CTA on the real section shells in order, so the arc
reads as one voice. (2) **Two feature pages whole** (`/features/album` and one more): the h1, the
hero sub, the cards and their titles, the nav label and description, the directory line, in the
chosen voice, beside today's; and the 30 feature-page strings in B as a table the infusion round can
paste. (3) **The quiet register on real app copy**: the dashboard's empty state, an error, a
notification line, an email subject and its first line, the account page's labels, in the voice.
(4) **The guest register**: the demo guest page's real lines (the door, the upload prompt, the
account-required unfurl both ways) with Partyreel nearly silent. (5) **The spec's do's tightened**
so each sentence shape has one example per surface written in the voice, and the fences read as
do's; the bible-20 replacement stated in one sentence. (6) The unfurl line and the five headers stay
on the board as the asks Will answers with a word. No "Apply to the site" (copy is not CSS); the
board is the surface. Read at 375 as well as 1440.

### The rules of round two (every track)

- **Why a second round.** Will (2026-09-14, after the first wave integrated): "They all seemed to be
  making progress in their directions, but a single round of context didn't seem to be enough for
  any of them to reach enough of their full potential for a real review." Read your round-1 Handoff
  and Record below as your own notes, look at the board as it stands on the launch-prep alias, and
  judge it from the ground up (bible 22): what would the perfect version of THIS board be, as a
  surface Will can rule on in a few words after walking it? Elevate what points there, rework what
  does not. Every candidate should be complete enough to ship as a paste; every ask a one-word answer.
- **The other boards are inputs now.** Every proposal from the first wave is in `docs/specs/`
  (`palette.md`, `light.md`, `type-scale.md`, `floating-surfaces.md`, `brand-voice.md`,
  `media-kit.md`). Use what sharpens your board (the palette's ramps under your surfaces, the light
  spec's shadow family on your cards, the type tables on your headings) and say so in BoardMeta; you
  still own only your lane, so read those boards' files, never edit them.
- **"Apply to the site".** The shell now lets a board hand the WHOLE site a CSS block, the same paste
  its ruling would land, so Will judges a candidate on the real pages and not only on a stage:
  `setCandidateCss(label, css)`, `clearCandidate()` and `useTunerCandidate()` from
  `@/components/dev/board`. One block at a time (the newest replaces the last); it renders as a
  `<style>` after every stylesheet on every lab page, every marketing page and the host app (all with
  `?key=`), persists in the browser until cleared (the tuner panel shows it with a clear button; your
  board shows a badge and its own clear). A block must be real CSS with the real selectors
  (`:root, .surface-paper`, `.dark`, `.surface-ink`, `.dark[data-mkt-skin="cinema"]`, a primitive's
  own class), never a stage-local class. Where your candidate is a CSS paste, offer it per candidate
  ("Apply A to the site") and list in BoardMeta the pages to walk with it on: `/`, `/pricing`,
  `/help`, `/contact`, `/dashboard` and an event page (the app needs the signed-in host), the demo
  guest page. The knobs are reachable too: `setTunerValue(control, value)` from
  `@/components/dev/tuner-store` with a control from `motion-tuner-config.ts`.
- **The same lane, the same wave rules.** You own exactly what your front matter says; never
  `touchpoints.ts`, `bible.ts`, the shell, `docs/ASSETS.md`, CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS. No mono (there is no mono face in the product now; `two-faces-policy.test.ts`
  refuses a `font-mono` class), no em-dashes, keyframes under your prefix, sheets never import
  tailwindcss, `<Glow>` only. Unlimited design resources: ask for exactly what the design needs, one
  bullet per asset in the fixed shape. Light QA: the board on your preview at 1440 and 375, reduced
  motion honoured, the gate green on the synced tree.
- **Boot.** Round one's branch and worktree are gone; cut fresh: `git fetch origin`, then
  `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`, install, copy
  `.env.local`, fill `cut` below with the SHA you branched from, commit this manifest alone
  (`docs(tracks): reopen <track> for round two`), push `-u`; `pnpm test` green. Sync only per
  PROGRAM.md.
- **Handoff.** Fill "Handoff (round 2)" and "Record (round 2)" below (round 1's stay as history),
  `status: handed-off`, push; the chat report is one line, "handed off at <sha>".

## Round 1, for reference (integrated; the brief it was built to)

**Goal.** The brand-voice exploration of the review wave (2026-09-14). Bible 20 (affirmative only) was "messy: don'ts without do's" and bible 21 (ruled copy) was killed: all copy is open until the voice exists. This track writes the voice guide as a proposal (`docs/specs/brand-voice.md`) and shows it on a board: sample headings and lines beside today's on real section shells, with the home arc's seven provisional section headers rewritten in the proposed voice as the worked example. A later round, `voice-infusion`, carries the ruled voice site-wide; not this one. Lab and spec only: no production copy changes on this track.
**Rulings in force.** The bible's second edition: rule 20 as rewritten (affirmative only; the two fences that are product truth stand: no human-response or human-moderation promise, no automation absolutes; `content-policy.test.ts` assertion 3), rule 21 (copy is open), rule 19 (no em-dashes), rule 4 (a guest surface belongs to the host's event: the guest register is the host's voice, Partyreel nearly silent), rule 6 (a masthead is one or two words).
**Verify on.** `/design/c/brand-voice?key=` on your preview at 1440 and 375; `docs/specs/brand-voice.md` reads whole; the gate green.

## The brief

### The question

If Partyreel's voice were written down today, what is it (in one paragraph and three registers), what are its sentence shapes with an example per surface, and what do the home arc's seven provisional headers sound like in it?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **There is no voice doc anywhere.** `grep -rn -i "voice\|tone" docs/systems/marketing-content.md docs/PRD.md`
  finds two false positives; the written copy rule is one line (CLAUDE.md "Copy": the em-dash ban).
- **The ruled lines** (`src/lib/constants/marketing-voice.ts`): `SITE_THESIS` ("The whole event, in one
  album.") and `SITE_SUBHEAD` (ruled 2026-08-25), `SECTION_HEADERS.howItWorks` and `.pricing`,
  `DECOMPOSITION_FACTS`, `FAILURE_MODE_LINE`; `GOLDEN_LINES` (`:17-26`) are the eight lines Will ratified
  verbatim in the voice round of 2026-07-08 (the closest thing to a corpus of his taste). Ruled means
  "a change is a ruling", not "protected": all copy is open (bible 21).
- **The seven provisional headers** (`SECTION_HEADERS`, `:51-85`), each with Will's appetite in its
  `note`: `noApp` and `fullQuality` (his lines, ruling pending), `liveDemo` ("entertains other ideas"),
  `album` ("more distinctness from the live demo before it and curation after it"), `curation`
  ("guest-side benefits in the frame"), `privacy` ("cleaner"), `reel` ("a share-the-highlights framing
  that feels more alive"). The "pin update" clause at `:38-42` is dead: no copy is pinned by a test since
  `91606e9` (2026-09-12), as `:104-106` says.
- **The rest of the inventory** (the infusion round's surface, not yours to rewrite): `marketing-nav.ts`
  (44 labels, 15 descriptions, mirror-tested against `feature-pages.ts`), `feature-pages.ts` (30
  provisional strings; `navDescription` ~45 chars; `directoryLine` in one length band, Will's own
  2026-09-02 rewrite), 59 help MDX (2,959 lines) with `content/help/AUTHORING.md` as the content
  agent's brief, 23 blog MDX, legal (`legal-privacy.tsx`, `legal-terms.tsx`, 1,366 lines), ten email
  templates (`src/lib/email/templates.ts`, subjects inline), and app UI copy inline with no module
  (`help-ui-labels.test.ts` requires every `<UiLabel>` the help centre quotes to exist in the app
  source, so an app-control rename is a two-file change).
- **The fences that stay** (`src/lib/content-policy.test.ts`): assertion 2 (fabricated social proof,
  CSAM/law-enforcement language, ingress numbers; `:126-142`), assertion 3 (no human-response or
  human-moderation promise, no "business day", no automation absolutes; `:160-175`; scope: all MDX +
  `CLAIM_FILES` + every non-test `.ts(x)` under `(marketing)`, `components/marketing`, `lib/constants`,
  whole-file with whitespace collapsed; the deliberate carve-outs "every upload has a real person
  behind it" and careers' "We read every application"); `no-em-dash-policy.test.ts` (AST-based over
  `app`, `components`, `lib`; comments exempt). The ruling behind assertion 3: copy commits to OUTCOMES,
  never to WHO or WHAT delivers them.
- **Two copy rulings parked in STATUS ride this board:** the account-required unfurl line ("This event
  asks guests for an email." against "...asks guests to sign in with an email."; one word settles it)
  and the five copy-alternative picks with the two provisional home headers.
- **The three registers you name** (bible 2 and 4): marketing loud, the app quiet, the guest surface in
  the host's voice with Partyreel nearly silent.

### The board

Sample headings and lines beside today's on real section shells (`PageHero`, `SectionShell`, a
feature card, a help article head, an app label, an email subject, an error), on cinema and paper, at
1440 and 375: the seven provisional home headers rewritten in the proposed voice as the worked
example, the unfurl line both ways, the five copy-alternative picks. The candidates span the range: a
tuning of the ratified lines' register; a voice rebuilt from the product's one idea (the QR becoming
the album) with new sentence shapes; one that questions a ruled line (flagged). The asks: the voice
(the guide's paragraph and its three registers); the seven headers; the unfurl line; the five picks.
### The deliverable

`docs/specs/brand-voice.md` (a proposal until Will rules, then promoted to `docs/systems/brand-voice.md` by the Orchestrator): a ROLE blockquote; the voice in one paragraph; the three registers; the do's as sentence shapes, each with an example per surface (hero, section header, feature card, help article, app label, email subject, error); what it never does, folded from the fences; a rewrite procedure for the infusion round (how a line is judged, what it keeps, how the app's inline copy and the help catalogue's `<UiLabel>` pairs are swept). Plus the board. Read the constants, the tests and `marketing-content.md`; change none of them.

### The rules of this wave (every track)

- **Rising tides (bible 22).** Judge the system from the ground up: what would the perfect version
  be if none existed? If today's tokens point there, the candidates are tunings; if the perfect
  version deviates, a candidate replaces the system and says so as a departure in `BoardMeta`. The
  three candidates on a board span that range; they are never three shades of one answer. A
  candidate may question a bible rule: that is a finding, written in this manifest, ruled by Will.
- **The board shell.** `src/components/dev/board/` is the shell: `Stage` (a real viewport on a
  real ground, `cinema | paper | ink | app-dark | app-light`, zoom-fitted, `data-paused` on a hidden
  tab), `Toggle`, and `BoardMeta` (the question, the candidates, the asks, the departures, the
  assets). The stub in your directory shows the pattern; replace it whole. The asks are the exact
  choices Will makes, worded so a ruling is a few words; the Orchestrator quotes them.
- **Light QA (Will, 2026-09-14).** A lab-only round verifies its board on its preview at 1440 and
  375 with reduced motion honoured and the gate green on the synced tree, then hands off; the deep
  red-team is the wiring round's. Iterate rather than perfect. Push early and often: `preview: true`
  builds `partyreel-git-lp-<track>-partyreel.vercel.app` on every push and Will reviews there in
  parallel.
- **Unlimited design resources.** Ask for exactly the asset the design needs, in Handoff, one
  bullet per asset in the shape `what · spec (size, grade, count, format) · replaces <stand-in id>`;
  ship the manifest's stand-in meanwhile. Never edit `docs/ASSETS.md`.
- **Never touch:** `touchpoints.ts` (your board is registered; the placeholder variant names are
  renamed at integration), `rules/bible.ts` (a bible change is Will's ruling, folded by the
  Orchestrator), CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `src/lib/env.ts`, anything
  outside `owns`.
- **No mono.** Bible 7 is retiring and a sweep is removing the face in parallel: no `font-mono`, no
  `MonoCaption`; `Caption` (`system/caption.tsx`) is the label face and `tabular-nums` on the body
  face carries data.
- **Sheets.** Keyframes live in your `board.css` under your prefix only (`keyframe-uniqueness.test.ts`
  reads every sheet under the lab); a board sheet never imports tailwindcss (`css-source-policy`);
  `glow-contract.test.ts` pins exactly three `<BorderBeam` sites, one `id="glw-warp"` and one
  `<GlowFilter />` across all of `src`, so compose `<Glow>` only. No em-dashes anywhere (the AST
  guard scans lab TSX).
- **Sync** `origin/launch-prep` only per PROGRAM.md: before handoff if it moved; mid-round only when
  `docs/tracks/orchestrator.md` announces a landed change to one of your `reads`. The Orchestrator's
  rounding round retunes radius VALUES mid-window (never a token name) and announces there.
- **Handoff:** fill Handoff and Record below, `status: handed-off`, push; the chat report is one
  line, "handed off at <sha>".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. No file outside `owns` was touched; no production byte changed.

## Deferred (ROADMAP one-liners, bucket named)

- **Design lab follow-ons from the gallery round:** a Tailwind breakpoint prefix inside a `Stage`
  reads the REAL browser viewport, not the canvas, so `sm:` fires inside the 375 stage too; note it
  in the board shell's doctrine (a board's own markup keys off the `mode` prop, while the real
  marketing components carry their own prefixes and are judged as they ship).

## Handoff (round 1)

- Head: the branch tip (the board and spec at `4d0052d`, the spec's read-through fixes after it), pushed; preview
  `partyreel-git-lp-brand-voice-partyreel.vercel.app`, the board at
  `/design/c/brand-voice?key=8838d0dd22f626a603fcf551`, the guide at `docs/specs/brand-voice.md`.
- Synced with launch-prep: it had not moved. Still `6c19d84`, the SHA in `cut`.
- Gates on the tree: typecheck ok, lint ok (0 errors; 7 warnings, all pre-existing and none in this
  lane), test ok (1,644 in 190 files), build ok (113 routes).
- Lane check: `docs/specs/brand-voice.md`, `docs/tracks/brand-voice.md` and the three files under
  `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `board.css`, `voices.ts`). No exceptions.
  Nothing production imports anything on this branch; `marketing-voice.ts` and the tests are untouched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board is type on the real grounds, and its one stand-in (the
  feature card's grey plate) stands for the hub door's own photograph, which already exists.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - "The voice: today, A the house, B the room, or C the guest list (the agent recommends B, with A second)"
  - "The seven provisional home headers in the ruled voice, or line by line from any column"
  - "The account-required unfurl line: asks for an email, or asks to sign in with an email (the agent recommends asks for an email)"
  - "Bible 20's replacement: lead with what arrives, an absence may be the second beat and never the first"
- Look at first:
  - **The fourth ask is the one that outlives the round.** Bible 20 as written ("say who we are,
    never who we are not") reads on the RULED "Scan, upload, done. No app to install." and on the
    whole no-app argument. The guide proposes the sharper do: lead with what arrives, an absence may
    be the second beat and never the first, and never both. It keeps the ruled line and kills
    `noApp` ("Nothing to install. Nothing to sign up for."), which is two absences and no product.
  - **Board 4, the paper chapter, on B.** `album` as a left masthead reading "Two hundred photos you
    never had to ask for." is the clearest argument the board makes for the during over the after.
  - **B's trade, visible on board 2 at 375:** its h1 runs four lines on the phone against today's
    two. A carries none of that cost and none of the lift.
  - **Two things the board found rather than built.** The three registers do not fork with the voice
    (board 1 and 6 show them once; only the marketing register's default shape moves), and the five
    copy-alternative picks have lost their list, so the board reads them as the five headers with an
    appetite for a different line. Both are in Departures.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The brand voice was written down for the first
time. `docs/specs/brand-voice.md` is the guide as a proposal: the voice in one paragraph, the three
registers with a table of what changes between them, five sentence shapes, an example on each of
the seven surfaces, the two product-truth fences folded in as do's beside a word list, and the sweep
procedure the `voice-infusion` round rewrites by (how a line is judged, what a rewrite keeps, and
the order, with the `<UiLabel>` parity making an app rename a two-file change by construction). The
board on `/design/c/brand-voice` argued it three ways on the real `PageHero` and `SectionShell`,
across cinema, paper and the app ground at 1440 and 375: A tuned the register the eight ratified
lines already speak, B rebuilt it from the code becoming the album, and C made the people the
subject and rewrote the ruled thesis to do it. The home arc's seven provisional headers were
rewritten in each, beside today's line and Will's recorded appetite; the unfurl was shown both ways.
Three departures were flagged rather than buried, and no production byte changed.

## Handoff (round 2)

- Head: the branch tip, pushed. The round-two review fixes are `da618a2` and `43c55f5`; the
  manifest commits sit on top of them. Preview
  `partyreel-git-lp-brand-voice-partyreel.vercel.app`, the board at
  `/design/c/brand-voice?key=8838d0dd22f626a603fcf551`, the guide at `docs/specs/brand-voice.md`.
  The round-two board is the one whose root div carries `class="bv-round-two"` and whose control
  bar reads "Moves 33 of 65 lines in the arc, 15 of 30 on the feature pages."
- Synced with launch-prep at `4b035c1` (it had moved by one docs commit, `design-system.md`;
  merged in, gate re-run green).
- **Fixed after the round-two review (three defects, one of them blocking; the fourth was the QA
  claim, answered by the walk below).**
  1. **Every stage clipped, or could.** Board 5's thesis was a 520px box holding 616px of content,
     so the word "it." was cut off the second line at 1440 and the phone stopped at "as", on the
     exact surface ask 6 asks Will to choose on. The curation hero clipped 38px on candidate A.
     The cause was hand-tuned literal heights, and the reason they could not be trusted is now in
     the code: a real marketing component inside a `Stage` resolves its own `sm:`/`lg:` rungs
     against the REAL browser window rather than the canvas, so the arc's chapters measure up to
     40px taller at a 1512 window than at 1150 in the same voice. A literal cannot hold for three
     voices, two canvases, every window width AND an edit to the copy above it, which is the whole
     activity on a copy board. So there are no literal heights left: `FitStage` (board.tsx)
     measures its content in a layout effect before the first paint, re-measures on the voice
     swap, and keeps a ResizeObserver for the webfont settling and the window resizing.
  2. **The feature pages now include their cards**, which goal item (2) asked for and round two's
     first pass dropped without saying so. `PageSection` gained `cards` (and `cardColumns`), and
     the two pages carry all 24 of their real card sets: the album page's nineteen (getting in,
     the settings, the name states, the three plates, the four lifecycle steps and three notes) and
     the curation page's five (the two review modes, the three reversible calls). `today` is the
     SHIPPED object, imported from `album-copy.ts` rather than retyped, so the board cannot drift
     from the page. A count and a reason per set sit under each page.
  3. **The finding those cards produced is the reason to have rendered them.** A moves 3 of the 48
     card strings and B moves 6, against 23 and 33 of the 65 arc lines. Will's 2026-09-02 finish
     pass had already written these sets in one length band with the numbers derived from the
     constants the product enforces, and three sets quote the app's own helpers (the album page's
     `Accepting uploads` body is the settings card's helper verbatim, pinned by mock-parity, so it
     is a two-file change owned by the quiet register). Rendering them also caught a collision
     worth the whole exercise: B's supporting line for Names ended on "it rides on everything they
     add", which is the first card word for word. The line gave the clause back.
- **Light QA, done and stated (this is the bullet the review said was missing).** The board was
  walked on `pnpm dev` at both canvases in all three columns, Today, A and B, six passes:
  - **Nothing clips.** Every element inside every stage is inside its stage: a scan of all 14
    stages for any `h1/h2/h3/p/span/td/li/button` whose box crosses the stage's edge returns empty
    in all six passes, and `scrollHeight - clientHeight` is 0 on all 14 stages in all six.
  - **1440 and 375** are the two canvases above; the phone column reads with the cards stacked at
    the measure `album-copy.ts` wrote them to, and B's h1 still takes its four rows.
  - **Reduced motion is honoured.** The only animation anywhere under `.bv-round-two` is
    `bv-swap-in`, and it is inside `@media (prefers-reduced-motion: no-preference)`, so under
    `reduce` the board renders the settled composition with nothing to undo. All 7
    `[data-mkt-reveal]` slots in the stages compute to opacity 1, so no line depends on motion to
    be read. The only console error is a `cz-shortcut-listen` hydration warning from a browser
    extension on `<body>`, not from this board.
- **The preview alias is stale through no fault of this branch, and Will should know before he
  walks it.** Every push since roughly 22:00 on 2026-09-14 has produced NO deployment, on any
  track: the newest build in the project is `lp/palette` at `b4be6a2`, and the lp/palette track
  reported the same thing as a Vercel daily deployment rate limit. So
  `partyreel-git-lp-brand-voice-partyreel.vercel.app` still serves `1c109b1`, the board WITH the
  two clipped stages and without the cards. It will pick up `43c55f5` on the next build the
  project is allowed; nothing needs to be pushed again. Until then the evidence for the fixes is
  the local walk above, which is stated in numbers rather than impressions for that reason.
- Gates on the synced tree, re-run after the fixes: typecheck ok, lint ok (0 errors; 6 warnings,
  all pre-existing and none in this lane), test ok (1,698 in 193 files), build ok (114 routes, 248
  static pages).
- Lane check: `docs/specs/brand-voice.md`, `docs/tracks/brand-voice.md` and the three files under
  `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `board.css`, `voices.ts`). No
  exceptions. Nothing production imports anything on this branch; `marketing-voice.ts`,
  `feature-pages.ts` and the tests are untouched, and no production byte changed. The arrow now
  runs the other way in two places, which is deliberate and worth the Orchestrator's eye:
  `voices.ts` IMPORTS `sections/features/album/album-copy.ts` and
  `lib/lifecycle/recently-deleted.ts`, read-only, so the cards' `today` column is the shipped
  object rather than a retyped copy of it. Both are pure modules with no server import in their
  chain, and the production build is unchanged at 114 routes.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board is type on the real grounds; its only stand-ins are
  the grey plates behind the unfurl cards, which stand for a link preview's own thumbnail.
- **No "Apply to the site" on this board, per the round-two goal: copy is not CSS.** The
  equivalent artifact is on the board instead: each candidate is copied out as a real TypeScript
  block, `Copy the SECTION_HEADERS paste` (board 4) and `Copy the FEATURE_PAGES paste` (board 8),
  so a ruling reaches `marketing-voice.ts` and `feature-pages.ts` without a line being retyped.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - "The voice: today, A the house, or B the room (the agent recommends B)"
  - "The seven provisional home headers: the selected voice whole, or line by line from the ledgers"
  - "The rest of the arc (the eyebrows, the supporting lines, the CTAs): take the selected voice, or hold today's"
  - "The account-required unfurl line: asks for an email, or asks to sign in with an email (the agent recommends asks for an email)"
  - "Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat and never the first, and never both"
  - "The thesis: keep in one album, or take as everyone saw it (the agent recommends keeping it)"
  - "One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album everywhere)"
- **Shell findings the Orchestrator must carry (both fixed inside this board's own sheet, both
  true of every board that stages a marketing component):**
  1. **The lab never compiles the heading ladder.** `design.css` scans only
     `src/app/(dev)/design`, so a responsive rung no LAB file spells is never emitted for a lab
     page: a `PageHero` on a `Stage` resolves to its base class and renders at 48px where the site
     renders 96px. Every hero on every board is currently judged at the wrong size.
  2. **The 375 stage is not 375 for type or gutters.** The documented prefix gotcha (a Tailwind
     breakpoint inside a `Stage` reads the REAL viewport) bites harder than the shell's note
     implies: inside the phone stage every `sm:`/`lg:` rung fires, so `Container` takes the 2rem
     desktop gutter and every heading takes its desktop step. `board.css` restates both, keyed to
     a `data-bv-canvas` attribute the board sets from the `mode` prop. The right home for that is
     the shell, not fourteen board sheets.
  3. **`Stage` takes a height it cannot keep.** A stage is a fixed box with `overflow: hidden`, so
     every board passing a literal height is promising something about content it does not control,
     across voices, canvases AND window widths (finding 2 is exactly why that last one bites: a
     real marketing component inside a stage resolves its `sm:`/`lg:` rungs against the browser).
     Round two's review found two clipped stages here from that alone, one of them the hero an ask
     is written on. The working fix is `FitStage` in this board's `board.tsx`, about thirty lines;
     a `fit` height mode on `Stage` itself would retire the literal from every board at once.
- **The registration line is stale.** `touchpoints.ts` (not this track's to edit) still describes
  the board as "Three candidate voices ... the seven provisional home headers rewritten in each
  beside today's line; the unfurl both ways." Round two is two candidates on whole pages; the
  Orchestrator should reword it at integration.
- Look at first:
  - **The feature pages read as pages now, cards and all, and they are where the voice does the
    least.** Boards 6 and 7 carry all 24 real card sets; the ledger under each page counts what a
    voice costs there (A moves 3 of 48 strings, B moves 6) against what it costs on the arc (23 and
    33 of 65). That gap is the sharpest thing on the board about what adopting a voice means: the
    arc is unwritten and the feature pages are finished.
  - **Board 2 to 4, the arc top to bottom, on B.** This is the round's whole point: fifteen
    sections in shipped order on their real grounds. Read it once on Today, once on B; the count
    in the control bar says how much moved, and every line a candidate keeps is marked `held`.
  - **The held markers are the finding, not an omission.** A moves 23 of 65 arc lines and 6 of 30
    feature strings; B moves 33 and 15. A is cheap because the feature pages were already written
    in its register, which is its case and its cost in one number.
  - **Board 10, the guest register.** The shipped account gate says "Create a free account to see
    the full gallery and add your own photos." on the host's own page. That is the one line bible
    4 refuses, and it is a one-sentence fix.
  - **Ask 7 is new and outlives the round.** The site says *album* in every heading, nav label and
    directory line; the guest surface says *gallery* in five places. A guest who scans a code on
    the site's promise lands on a different product's noun.
  - **B's cost is now measurable rather than asserted.** With the ladder restored, B's h1 takes
    four rows at 375 against today's three, and three at 1440 against today's two.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Round two argued the voice where a voice is
actually judged: on whole pages. The board walks the home arc's fifteen sections top to bottom on
their real grounds, every eyebrow, header, supporting line and CTA in the selected voice with a
ledger carrying today beside it; then `/features/album` and `/features/curation` whole, cards
included, the thirty identity strings as a table, and the app's quiet and guest copy on twelve
surfaces. Candidate C was retired after it read as B with a substitution across fifteen sections,
and its one real question, the ruled thesis, became its own ask. Copy is not CSS, so each candidate
copies out as a real `SECTION_HEADERS` and `FEATURE_PAGES` block instead, and every held line is
counted: A moves 23 of 65 arc lines and 3 of 48 card strings, B 33 and 6, which is the round's
sharpest finding, that the arc is unwritten while the feature pages are already finished. Three lab
facts that had been making boards lie about their own content were fixed and reported to the shell:
the uncompiled heading ladder, the real-viewport prefix inside a stage, and a `Stage` height that
cannot be written as a literal, measured from the content now. The guide gained an example per
surface for each shape, the fences restated as the eight do's bible 20 asked for, and two findings:
the album/gallery split, and the guest account gate that asks for an account with us on the host's
own page. No production byte changed.

## Handoff (round 3)

- Head: the tip of `lp/brand-voice` (this manifest commit on top of the sync merge `e769c27`); the
  board's code head is `5846b43`. Preview `partyreel-git-lp-brand-voice-partyreel.vercel.app`, the
  board at `/design/c/brand-voice?key=8838d0dd22f626a603fcf551`, the guide at
  `docs/specs/brand-voice.md`. **The round-three board is the one whose root div carries
  `class="bv-round-three"`, opens with a card reading "The recommendation / B, the room." and
  carries a twelve-chapter index in the control bar.**
- Synced with `launch-prep` at `dd4aa0b` (it had moved by the palette and floating-surfaces
  round-two merges and their manifests; nothing in this lane or its `reads`). Merged clean, gate
  re-run on the merged tree.
- Gates on the synced tree: typecheck ok, lint ok (0 errors; 6 warnings, all pre-existing and none
  in this lane), test ok (1,719 in 193 files), build ok (248 static pages, compiled clean).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/brand-voice.md`,
  `docs/tracks/brand-voice.md` and the three files under
  `src/app/(dev)/design/sandbox/brand-voice/` (`board.tsx`, `board.css`, `voices.ts`). No
  exceptions, and no production byte changed. The two read-only production imports round two added
  are unchanged (`voices.ts` imports the album page's shipped copy module and the
  recently-deleted constant, so the cards' `today` column cannot drift from the page).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will: none. The board is type on the real grounds; its only stand-in is the
  grey plate in the three unfurl cards, which stands for a link preview's own thumbnail and now
  says so on the board.

### The walk, taken cold, and what it changed

The round-three brief asked for Will's walk to be taken first. Six passes (two canvases by three
columns), and every stumble it found is fixed:

1. **The verdict was at the bottom of a 15,000px board.** The recommendation, the one-line case for
   it, the case for A, and three anchored pointers now open the board; the strongest candidate is
   the FIRST column and the default; the twelve chapters are a one-row index in the sticky bar
   (borrowed from the palette board's round two, which found the same thing on a shorter board).
   The index scrolls rather than wraps, because wrapped it made the bar four rows tall on a narrow
   window.
2. **B's cost was prose, typed once.** "Four rows at 375" was a sentence, not a measurement, and
   only one column renders at a time, so it could not be checked by looking. A ruler now clones the
   LIVE heading (its own class list, its own width) and counts the line boxes for all three columns
   at the canvas on screen: the h1 takes **B 3, A 2, today 2 at 1440** and **B 4, A 3, today 3 at
   375**. The same ruler under the thesis found something the prose had missed: the alternative
   costs a row at 1440 and **nothing at 375**.
3. **Three pages the walk names had never been on a board.** `/help`, `/contact` and `/pricing` are
   chapter 9, on their real grounds, plus two real help article heads, which closes the last gap
   between the guide's surfaces table and this board. It is the cheapest chapter on the board and
   possibly the highest-yield: "How can we help?" and "Talk to Partyreel." are the two most generic
   sentences on the site.
4. **The phone canvas was a 23,000px walk with 800px of dead ground either side of every stage.**
   At 375 the ledger now sits BESIDE the stage, so the line being judged and the line it replaces
   are in one view.
5. **Twelve app and guest rewrites all read like twelve rulings.** They are the sweep's ordinary
   work; the ONE row that is a decision (the guest account gate, the line bible 4 refuses) is
   marked as one, and both chapter headnotes say which is which.
6. **A mark that meant nothing.** The dot in the ledger explained itself only in a `title`
   tooltip, on a board nobody hovers. It says what it is, and what `ruled` means beside it.
7. **Less to rule on.** Two of round two's four departures had become asks (bible 20, the
   album/gallery noun) and left; the asks were reworded so every one answers in a single word.
   Candidate A was re-judged from the ground up and KEEPS its column: it is the only answer that
   costs the finished feature pages almost nothing, which is an argument rather than a shade of B.

### Light QA, in numbers (six passes: Desktop and Phone 375, each on Today, A and B)

- **Nothing clips, anywhere.** 16 stages; a scan of every `h1/h2/h3/p/span/td/li/button/dd/dt/div`
  inside every stage for a box crossing the stage edge returns empty in all six passes, and
  `scrollHeight - clientHeight` is 0 on all 16 stages in all six. No horizontal document overflow in
  any pass.
- **Reduced motion gets the settled composition.** Verified in the SERVED stylesheet, not just the
  source: the board's one animation (`bv-swap-in`) sits inside
  `@media (prefers-reduced-motion: no-preference)`, so under `reduce` there is no rule to undo. All
  13 `[data-mkt-reveal]` slots compute to opacity 1, so no line depends on motion to be read.
- **What runs, measured, and one thing cut.** The swap carried `animation-fill-mode: both`, which
  left a FINISHED animation attached to every stage for the life of the page: 17 of them measured
  sitting on the board at rest, one per stage, each a layer kept for a move that ended in 180ms. The
  keyframe's end state IS the resting state and there is no delay to cover, so the fill bought
  nothing and is gone. **At rest the board now runs 0 animations**; a voice swap runs 17 for 180ms;
  the worst frame of a swap fell from 83ms to 50ms with the median at 17ms, on 1,394 nodes.
- **Both canvases read.** 1440 and 375, all three columns, walked top to bottom.

### The preview alias does not serve this head, and Will should know before he walks

- **Vercel is at its daily deployment ceiling and none of this round's three pushes produced a
  deployment record at all** (not a canceled one: none). Other branches are getting the occasional
  slot as the rolling window frees one, so it is not a project-wide stop and nothing is wrong with
  this branch: the build gate reads `preview: true` from this manifest and every commit also says
  `[preview]`. As of handoff the alias still serves round TWO, which is checkable in one line: the
  round-two board's root div is `bv-round-two`, round three's is `bv-round-three`.
- **The fallback, which is what this round was verified on:** `pnpm dev` in the worktree at
  `../partyreel-wt/brand-voice` (left in place) serves the tip exactly, board at
  `/design/c/brand-voice?key=8838d0dd22f626a603fcf551`.
- **Also worth the Orchestrator's eye: the `launch-prep` alias serves ROUND ONE of this board**, not
  round two. It was checked at the start of this round, before any of this round's pushes: the
  integration alias builds on request and no `[preview]` push has rebuilt it since this track
  merged, so a walk there shows a board two rounds old.

### The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will)

- "The voice: B, A, or today (the agent recommends B)"
- "The seven provisional home headers: whole in the selected voice, or line by line from the ledgers (the agent recommends whole)"
- "The rest of the arc, its eyebrows, supporting lines and CTAs: take the selected voice, or hold today's (the agent recommends take)"
- "Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat, never the first, and never both. Yes, or send it back"
- "The thesis: keep in one album, or take as everyone saw it (the agent recommends keep)"
- "One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album)"
- "The account-required unfurl line: email, or sign in (the agent recommends email)"

### Findings the Orchestrator must carry

1. **The home page is about to carry two different counts.** The hero variations propose "312 photos
   from 48 guests" as a stand-in and the shipped decomposition band two sections below says "Built
   from 214 photos. Shot by 23 guests." Do 3 of the guide allows one of those, not both: one source,
   one pair of numbers, read from the demo event. It is a departure on this board and belongs to the
   composition pass. (The scan and the river already ask for a `demoCount` prop for exactly this.)
2. **`/pricing` and the home arc say one promise two ways.** The page's h1 is the ratified "Start
   free, upgrade when you host again." and the arc's ruled teaser is "Start free, upgrade for more
   events." Both are Will's; the infusion round has to pick one.
3. **The registration line is still stale.** `touchpoints.ts` (not this track's to edit) describes
   the board as "Three candidate voices ... the seven provisional home headers rewritten in each
   beside today's line; the unfurl both ways." It is the FIRST thing a walker reads and it has been
   wrong since round two: this is two candidates on whole pages, twelve chapters. Reword at
   integration.
4. **The three shell findings from round two are all still open** and are true of every board that
   stages a marketing component: the lab never compiles the heading ladder (a `PageHero` on a Stage
   renders at its base class, 48px where the site renders 96px); a Tailwind prefix inside a Stage
   reads the REAL viewport, so the 375 stage takes desktop gutters and desktop heading steps; and a
   `Stage` cannot be handed a literal height it can keep. This board restates the first two in its
   own sheet and solves the third with `FitStage` (about thirty lines in `board.tsx`); a `fit`
   height mode on `Stage` itself would retire the literal from every board at once.

### Look at first

- **The first screen.** The recommendation, its cost, the three pointers. If the decision can be
  made there and confirmed in chapters 2 and 9, the round did its job.
- **Chapter 9, the pages the arc does not reach.** Newest, cheapest, and the place the voice does
  the most visible work: "How can we help?" against "Start with the short answer.", and "Talk to
  Partyreel." against "Every note gets a reply." The second is the model for the fence that keeps
  our support copy legal (an outcome, never who delivers it), and the two article heads hold in
  every column, which is how much the 59-article catalogue costs: nothing.
- **The row counter under chapter 2, then chapter 5.** B's whole typographic price in one measured
  line, and the surprise that the thesis alternative costs a row at 1440 and none at 375.
- **Chapter 2 at Phone 375.** The ledger beside the stage is the round's other structural change,
  and the phone is where B's extra row is paid.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Rounds two and three took the voice from three
candidate headers to a board a ruling can be read off. Round two argued the voice where a voice is
judged, on whole pages: the home arc's fifteen sections top to bottom on their real grounds, then
`/features/album` and `/features/curation` whole with all 24 card sets, the thirty identity strings
as a paste, and the app's quiet and guest copy on twelve surfaces; candidate C was retired after it
read as B with a substitution, and every held line was counted, which produced the round's sharpest
finding, that the arc is unwritten while the feature pages are already finished. Round three took
Will's walk before him: the recommendation, its cost and three pointers now open the board, the
strongest candidate is the first column, twelve chapters are an index in the bar, and the voice's
one real price is MEASURED off the live heading rather than asserted (B's h1 takes 3 rows at 1440
and 4 at 375, against today's 2 and 3). A new chapter put `/help`, `/contact` and `/pricing` on a
board for the first time, with two real help article heads, which is where the voice does its most
visible work and costs the least. Three lab facts that had been making boards lie about their own
content were fixed and reported to the shell, and the board's own cost was cut: a fill mode was
leaving seventeen finished animations on the page at rest, and nothing runs there now. The guide
gained an example per surface for each shape, the eight do's bible 20 asked for, and seven findings.
No production byte changed.
