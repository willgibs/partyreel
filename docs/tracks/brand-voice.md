---
track: brand-voice
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
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

- Head <sha>, pushed; preview partyreel-git-lp-brand-voice-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
