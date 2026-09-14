---
track: brand-voice
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-brand-voice-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
