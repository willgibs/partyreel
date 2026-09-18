---
track: orchestrator
status: open
cut: "5cdebfe0"          # this window opened at Round 1 of the revamp (2026-09-16)
owns:
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/(shell)/page.tsx
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/_data/docs.ts
  # The two tests below name no board any more (a fixture, or the first standing
  # board under it.runIf), so a retirement never needs them released again.
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/globals.css
  - src/app/theme.css
  - src/components/dev/motion-tuner-config.ts
  # The board lists: a lane adds or removes ONLY its own board's lines here
  # (the registration and retirement exceptions, announced 2026-09-18).
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/_data/legacy-routes.ts
  - src/app/(dev)/design/_data/legacy-routes.test.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/components/dev/motion-tuner.tsx
  - src/components/dev/marketing-motion-tuner.tsx
  - src/components/dev/tuner-store.ts
  - src/components/dev/candidate-style.tsx
  - src/components/dev/app-design-island.tsx
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
  - src/components/dev/lamp-set.ts
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/(marketing)/marketing.css
  - src/lib/events/visibility-labels.ts
  - src/lib/shared/use-entered-frame.ts
reads:
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/components/marketing/system/section-shell.tsx
announces:
  - "Round 1 of the revamp (2026-09-16, 5cdebfe0): the lab guards itself against a stale stylesheet (src/components/lab/lab-chrome.tsx reads --lab-css-generation off .lab-shell; bump lab-css-generation.ts and design.css together when a shell rule changes; a stale copy after one reload means the SERVER: stop it, rm -rf .next/dev, start it); every pick toggles (review-store.ts writers toggleAnswer / setAnswerNote / setBoardNote / toggleItemVerdict / setItemNote, an `items` map keyed by itemHoldId); a wide page at 1:1 runs edge to edge (data-lab-bleed on Stage and FrameRow; a bleed inside a bleed keeps its box); board-spec.ts carries ITEM_VERDICTS, LIBRARY_VERDICTS, BuilderVerdict, Candidate.one/verdict/facts, Control.clearable, BoardSpec.catalog and LIMITS.readingWords; .lab-catalog is the unlayered grid in design.css. Two lanes cut: lab-catalog (the review's item scope, the catalog kit, the toolbox, the reading budget, the palette as proof; owns scripts/lab-smoke.mjs this round) and lab-sweep (walk every lab page and fix the shell; owns design.css and _data/glossary.ts this round). docs/reviews/README.md stays here: a grammar change is written into Handoff verbatim and landed at the merge."
  - "The stepped review round (2026-09-16, 02c409b4): board-spec.ts carries Ask.lands / after / strip, AskOption.state, Candidate.lands, CatalogSpec.mode / winner / walk / stage and LIMITS.askLands / candidateLands; registry.test.ts rules on them (a staged ask waits on an earlier ask or a card of its own catalog; a pick-one catalog names a winner ask that mirrors the pick control and offers none; look is optional once every option is drawn; an ask mirroring a clearable control may offer its cleared default as none)."
  - "The home hero ships (2026-09-17, 0c58ff76): src/components/marketing/sections/home/cinema-hero.tsx is the band streaming out of the demo code on hero-stream.ts, and the home-hero board is retired; sandbox/home-hero/shared.tsx outlives it for the album-hero and river-visual boards (FRAMES, CANVAS, GUTTER, LADDER, Mode, Photo) and nothing else under that folder exists."
  - "The wiring rounds (2026-09-17): Graphite is the palette (globals.css, theme.css, marketing.css at 88d0bec0: a 0.995 page, a 0.105 room, --faint as the third text step, the dark card opaque, no accent, the cinema deepening gone); the three stylesheets are the Orchestrator's again; Copy so far sends only a board's open round (review-message.ts composeSoFar), so a store entry from a round the board has left never rides again."
  - "The second batch (2026-09-17, 4280a59c): the type scale is ruled (B, the spacing law, the dead link on the set) and the Aurora is one light in three kept forms (seam, throw, field), never on paper, on an 8 second clock. The stylesheets are released for the round: theme.css and marketing.css to type-wiring (plus the @utility font-heading block of globals.css), the rest of globals.css to aurora-wiring. review-message.ts: composeSoFar(store, openOf, transcribed) takes the open round's shape ({ round, asks, items }) and Transcribed carries notes by board."
  - "The third batch (2026-09-17, c9903c99 and dc4530df): every card of the light board's round seven is ruled (the bloom, the halo and the beam kept) and round eight is three steps (depth, face, sweep). SectionLight has NO default placement: `placement` is required, `room` takes a `from` origin on an edge of the box and every placement a `reach`, and its contract refuses the same composition twice on one page (Will: the Aurora is 'a mix of all of them... custom and bespoke'). ProCardBeam measures its card's corner and passes it, zero included. src/app/globals.css is released to publish-bloom for the round (the publish block and the one fence rule only)."
  - "The fourth batch (2026-09-17, 871f650b to c64275a3): light r8 is fully answered and floating-surfaces picks Card. `pnpm lab:demo` (scripts/lab-demo.mjs) presses every open step and fails a frozen stage; a catalog card's preview is inert when the card is the press target (src/components/lab/catalog.tsx). Released to light-wiring for the round: src/app/globals.css, src/app/theme.css, _data/links.test.ts and _data/docs.test.ts (the two tests that name light as a standing board and its spec as NOT LAW); touchpoints.ts and touchpoints.test.ts stay here and the lane edits its own board's lines under the retirement exception."
  - "The eighth batch (2026-09-18, 00e82dba): type-phone r1 and rounding r7 are ruled, and one lane, ladders-wiring, wires both ladders and retires both boards (phase 1 type, phase 2 corners). The type ladder's law becomes the ORDER: prose's phone end 18 to 24 and a tenth step, subhead (20 to 24), declared in theme.css AND TYPE_STEPS. Corners are family C in quarters: --radius 8px, --radius-float 12px (rows derived at 8), --radius-tile 4px, --gap-gallery max(3px, var(--radius-tile)), 3xl and 4xl set to initial, a cta Button size, --shadow-float retired. Released to ladders-wiring for the round: src/app/globals.css, src/app/theme.css, src/components/dev/motion-tuner-config.ts; touchpoints.ts and touchpoints.test.ts stay here under the retirement exception."
  - "The ninth batch (2026-09-18): album-hero r3 and river-visual r2 are ruled (their first ledgers, so registry.test.ts's grandfathered set is empty, and that file is the Orchestrator's again), and river-visual's `proportion` is withdrawn inside the round. Three board lanes are cut: `heroes` (`privacy-hero`, `album-page`), `river-card`, `gallery-width`. THE REGISTRATION EXCEPTION, while they run: a lane adds its own board's lines to sandbox/registry.ts, (shell)/lab/boards.ts and touchpoints.ts and touches nothing else in them (touchpoints.test.ts derives its standing list from the registry since the glow retirement, so it takes no line). New members go at the HEAD of `BOARDS`, `BOARD_COMPONENTS` and the `SandboxId` union, the RULINGS row directly after river-visual's, the id into `RulingId` directly after `river-visual`; `ladders-wiring` removes only its own lines and reorders nothing, so every merge is line-disjoint. The names `ladders-wiring` changes, which every lane builds against: `rounded-3xl` and `rounded-4xl` become no-ops (set to `initial`), `shadow-float` and `--radius-action-lg` retire, `size=\"cta\"` on Button and `text-subhead` arrive, and `prose` is 24px at a phone."
  - "The protocol (2026-09-16): docs/PROGRAM.md is the loop (the round, the question route, integration, the record's depth), docs/tracks/README.md the one-round manifest template and the spawn paragraph; a manifest is deleted in its merge commit from here on."
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, what every
open track is doing, and what waits on Will. Agents sync `origin/launch-prep` mid-round only when a
line under `announces` touches one of their `reads`; otherwise once, before handoff, if it moved.

**This window: the revamp (opened 2026-09-16).** Will's first per-item sitting is under way on his
dev server; his batches transcribe as they arrive (`docs/reviews/`), and the wind-down rules from here:
a board ends in promotion into the Library, never in another exploration unless he asks for one by name
(he asked for two: the palette's cool greys and the hero's stream). Will found the lab broken on localhost and the
explorations turning into papers; the plan he approved runs four rounds: the lab (Round 1, in flight),
the docs diet and the track protocol (Round 2, the Orchestrator's, the protocol part landed), the
Library as the complete inventory and a review surface (Round 3), the six paper boards rebuilt as
catalogs (Round 4, closed on the tree the same day). The alias was rebuilt at `a964d4a6` the moment
Vercel's cap freed (2026-09-17 00:16 UTC) and serves the whole tree; his sitting runs on his local
`pnpm dev` after a hard reload. The stepped review round opened 2026-09-16 on his sitting's verdict (the
review "favors you and makes me spend tons of time per track figuring what I'm even being asked"):
`lab-flow` rebuilds the review as an onboarding form, every board is reshaped into steps four at a time
with no new exploration, and his sitting resumes on the first two that land; the last lab-infrastructure
round of the window. His sitting opened on the hero and answered its round six `none` in chat, asking
for the symmetric approach by name; with no parallel work left, round seven (the band, the orbit and the
two stacks) was built here in the root tree rather than on a lane. He picked the stack with the code
above and Graphite the same night, and answered four of the light board's asks; the two wiring lanes
are cut (development is parallel work again), the light sitting continues on its cards.

## In flight

Every lane's agent was killed mid-work by an API limit on 2026-09-18, and **all three were resumed the same
day by a new Orchestrator seated on a second Claude account** (opened for token economics). By Will's ruling
the Orchestrator runs on Fable and plans, judges and integrates; a lane runs on Opus for big, ambiguous,
multi-file work and on Sonnet for fast, direct UI work, the call being the Orchestrator's on every spawn
(PROGRAM.md "Model delegation"). Each agent ADOPTED its worktree and branch rather than being cut fresh. Dev
ports: :3000 is the Orchestrator's; lanes take 3132 to 3135, one each, killed by port (the fourth, `voice`, cut the same afternoon as the ceiling's last seat). ★ Two lines in the
`heroes` and `river-card` manifests are stale (cut before the glow retirement): `touchpoints.test.ts` takes NO
line (it derives its list from the registry), and the worked example is `sandbox/gallery-width`, not the
retired `type-phone`; both agents were told so by message.

| track | worktree (`../partyreel-wt/<track>`) | state at the kill | resumed as | to finish |
| --- | --- | --- | --- | --- |
| `heroes` | integrated at `6b5ea1bf` (handed off `766f5a66`) | done | Sonnet, :3133 | nothing |
| `river-card` | integrated at `3ed62f0c` (handed off `64c25a02`; the RULINGS rows' union needed album-page's closing lines put back by hand) | done | Sonnet, :3134 | nothing |
| `ghost-wiring` | integrated at `31c94253` (handed off `79169b2c`; its two mid-lane claims accepted) | done | Opus, :3132 | nothing |
| `voice` | integrated at `e0b92af6` (handed off `5e6e5481`; eight lines, 234 smoke checks, 8 demo steps) | done | Opus, :3135 | nothing; round two is cut from his notes |
| `glass` | integrated at `30aaf705` (handed off `f8ab4ad9`; seven steps, 250 smoke checks; one unused import cleaned at the record) | done | Opus, :3132 | nothing; round two is cut from his notes |
| `loose-ends` | integrated at `b83b7c3d` (handed off `a34eaf27`; seven steps, 258 smoke checks) | done | Sonnet, :3133 | nothing; the wiring waits on his answers |
| `body-type` | integrated at `130236c2` (handed off `998aa906`; seven steps, 242 smoke checks) | done | Opus, :3134 | nothing; the wiring waits on his answers |

No lane is open (2026-09-18, evening): every board of the round is integrated and on the desk, eight in all
(privacy-hero, album-page, river-card, gallery-width, voice, body-type, glass, loose-ends), plus the ghost on
the disposable event. Next from here: his batches, transcribed; then the wiring lanes from his answers and
round two of `voice` and `glass` from his notes. `gallery-width` integrated at `3a519e0d`. The three resumed lanes integrated the same afternoon (`6b5ea1bf`,
`31c94253`, `3ed62f0c`), the full gate green on the final tree (2,189 tests, 254 pages), and the round's
`[preview]` is the record commit on top of them; the four worktrees and branches are pruned at the push.

## Next, in order (batch nine's plan T4 to T6; the plan's words live in rulings.md 2026-09-18 and ROADMAP)

1. **Done 2026-09-18:** `heroes`, `river-card` and `ghost-wiring` integrated. Will's next sitting is the four
   new boards (`privacy-hero`, `album-page`, `river-card`, `gallery-width`) in the rebuilt step, plus the
   ghost on a disposable event on the alias (left standing until he has judged it, then deleted).
2. **Wiring lanes from his answers** (four agents at most, each a manifest from the template):
   - `album-wiring`: `ScreenLamp` fixed AT ITS SOURCE into the pool design-system.md prescribes (it also
     lights the guest and sharing pages: flag it to Will); the album page's round-four motion, the visual
     at 896 with the faded bottom, its light; retires `album-hero`.
   - `river-wiring`: the card per river-card's answers (unlinked code, above the scrims; the `/demo`
     redirect if he picks it); retires `river-visual` and points the card at `src/components/shared/river/`.
   - `privacy-wiring`: the spiral field on the Privacy hero; the page's comments and design-system.md's
     "restraint" lines rewritten.
   - `gallery-wiring`: gallery-width's answers on the guest page and in the host app (its two questions
     below first).
3. **Show the ghost** on a DISPOSABLE event on the alias, then delete the event (never the public
   "Partyreel Demo"). If he wants another animation, the parked "pour" is the one.
4. **Done 2026-09-18:** `milestone-25` merged (`bf9cbd74`) and deployed on Will's word; the classifier refuses a
   push to `main` from a script, so the push is run as its own plain command, and Will granted it standing
   ("You always have full permission to push to main once we're ready").
5. **`lab-scrub`** once no old-surface board stands (about 4,200 lines of the old authoring surface); its
   Handoff carries the never-owned doc edits word for word. Ask Will first: removing `item:` retires his
   keep/refine/kill verdicts (2026-09-16).

## Operating facts no other doc holds (the Orchestrator's, carried across sessions)

- **The alias check.** launch-prep builds only when the pushed head commit carries `[preview]` (a build takes
  about four minutes). Two checks that work (2026-09-18): the Vercel MCP's `list_deployments` shows READY for
  the sha on `launch-prep`; and `curl "<alias>/design/lab?key=<key>"` contains the sha7 (the page prints "Serving build",
  and the stamp rides the RSC payload with ESCAPED quotes, `\"build\":\"<sha7>`, so grep for the bare sha7,
  never for `"build":"`; a poll on the quoted form watched a READY alias for 15 minutes and never matched). The
  same keyed lab page also carries `sentry-release=<sha40>` (the Sentry SDK's stamp on a dynamic page); the static
  home page carries neither, which is why a poll on `/` sees nothing. The key must ride the QUERY on a plain request; the `x-design-key` header alone
  answers 404, and no `sentry-release` marker exists in the HTML. After every integration:
  `node scripts/prune-vercel-deployments.mjs --apply`.
- **The lab key** is `DESIGN_PREVIEW_KEY` in `.env.local` (read it there, never echo it); `pnpm lab:demo
  --key <key>` and `?key=` on `/design/lab` take it.
- **The review.** Will pastes a batch in chat; transcribe it with `pnpm lab:review` on STDIN (`--dry`
  first to validate; `--by ai:orchestrator` for the Orchestrator's own notes). Never click Copy or Copy so
  far in the built-in browser pane to test it: it writes Will's real clipboard, and a stray paste reads as a
  ruling.
- **Agents.** Four at most. Plan mode is inherited by running agents (they stop; resume them by message);
  tell Will to send a batch without plan mode while lanes build. An agent killed by a usage limit is
  resumed or re-spawned onto its existing worktree. Agents never edit CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS, ASSETS, rulings, `docs/reviews/` or `bible.ts`, and never track image rights,
  provenance or credits nor mark an image as AI (Will's ruling).
- **The account.** From 2026-09-18 the Orchestrator runs on a second Claude account (Fable), with every
  MCP re-connected there: Supabase, Vercel, Resend, Mobbin, Context7, Cloudflare, Sentry and (since the same afternoon)
  Stripe answer (TEST, `acct_1TcStrPtjqmVkBwk`, verified through `list_available_accounts_or_orgs`); the shadcn
  MCP named in CLAUDE.md is still not connected on it, and is needed only for a new shadcn component.
- **A merge deletes the manifest with `git rm -f`.** The lane's handoff commit modifies its manifest, so
  the merge stages it as changed and a plain `git rm` refuses; the refusal broke a chained script once
  (2026-09-18) and the next block committed the wrong merge under the wrong message. So: one script per merge,
  `set -e` with a trap, every step on its own exit code, never a `&&` chain that a `;` can skip past.
- **The RULINGS rows' keep-both.** Two lanes appending rows after river-visual's conflict with git's hunk
  ending INSIDE the first lane's last row (the two closing lines are common to both sides), so a plain
  union of ours and theirs needs that row's `},\n  },\n  {` put back by hand before the next row; typecheck
  before the commit catches it.
- **The gate** before any `[preview]` push, each step on its own exit code: `pnpm design:rules`, `node
  "src/app/(dev)/design/gallery/collect-specimens.mjs"`, typecheck, lint (8 known warnings), test, build,
  `pnpm lab:smoke` (0 failing), `pnpm lab:demo --key <key>` (0 failing).

## Waiting on Will

**The disposable event for the ghost** (created 2026-09-18 on the alias by the Orchestrator as `willg97@gmail.com`,
named "Ghost check (disposable)", guest link `/e/0333eef9d7994951b86e5b2a71da49f9`): it stands until Will has
judged the empty state in the app, then it is DELETED (never the public "Partyreel Demo"). The alias serves
`797a7361` (READY) with the four boards and the ghost.

The desk derives it (`/design/lab?key=`: every open ask and every unruled item of every board, from
the specs minus the ledgers in `docs/reviews/`). Assets: [`../ASSETS.md`](../ASSETS.md). Next from
him: one sitting on the four new boards in the rebuilt step as they integrate (`gallery-width` first).
`gallery-width` asks two questions for its wiring: if the host follows the guest with the words at the
edge, does the WHOLE app pin left from `lg` (recommended, one header everywhere) or only the event page;
and do the host's uniform grids (the review queue, the reels) take the same tile width (recommended yes).
album-hero and river-visual have every step answered and retire at their wiring. Also still his to
overrule: the Orchestrator's call that type inside a picture counts as depicted (the ladders lane's
question); the album visual at the scale's 896 rather than his 880.

## Landed this window

- `5cdebfe0` the foundation (the guard, the toggle rule, the bleed, the shared types); `28d1aa95` the
  two manifests and the catalog grid; `0c0269ee` to `e8ce341e` the protocol and the record diet;
  `88dafe50` lab-sweep integrated (the shell walked and fixed; its manifest deleted at the merge;
  design.css generation 4); `52241e4f` the dev indicator bottom-right; `ce21ac31` the lab functions'
  file trace cut to 718 files (docs.ts's dynamic root marked turbopackIgnore); `d4ec4cff` docs-adr-fold
  integrated (the 25 ADRs folded, `docs/adr/` gone with the decisions tombstones, the reel spec and the
  perf baseline); `aea90fd3` the citation sweep (247 code comments name the system docs); `57b93286`
  lab-catalog integrated (the item scope, the catalog kit, the toolbox, the reading budget, the palette as
  the proof; the review grammar's item and library lines landed in docs/reviews/README.md); the Library's
  record pages and docs/decisions/design-record.md deleted (`kind: "record"` is gone from links.ts; a
  ruling's home is docs/design/rulings.md and the board's answer block; /design/record 307s to the rulings).
- `0a48db70` docs-systems-strip integrated (the four heavy docs stripped, 118 dated passages to 25, the ★
  audit; the arrival heading renamed with its `lives` anchor; the rulings' two dangling anchors fixed).
- `5868325e` brand-voice integrated (Round 4's first catalog: six voices, twenty-four spots, 2,642 words
  against a declared 2,700; two questions for Will).
- `257df8fe` type-scale integrated (five ladders as type specimens; 1,155 words under the budget; the
  dashboard as a lab screen route).
- `767e6182` floating-surfaces integrated (seven directions as cards; 2,317 words against a declared 2,400;
  asset row 14; the dropdown-menu submenu bug named for the wiring round).
- `2326a924` light integrated (twelve treatments as cards on the real surfaces; 2,889 words against a
  declared 2,950; asset rows 15 and 16; the template's meta panel named for a fold).
- `128aca34` rounding integrated (six families as cards; 2,564 words against a declared 2,800; the
  proposal doc written); the kit takes its three findings (the dock wraps four options, the clip
  comment, the post-hydration trap).
- `8587d3ed` media-kit integrated (thirteen sources as cards; 2,686 words against a declared 2,750).
  Round 4 is closed on the tree: every standing paper board is a catalog under its declared budget.
- `5a538c0a` palette round seven integrated during the sitting (nine cool palettes, three controls, the
  accent as a config; 2,924 words against a declared 2,950).
- `02c409b4` the stepped review's spec fields; `551ecab5` the round's three lanes cut (lab-flow, light,
  palette); `56ea9185` home-hero integrated (round six: four compositions of the stream, mirror, phrase,
  settle and ribbon, on one engine; 1,189 words under the budget with no declaration; the board
  recommends the settle; its pick-one switch is three spec lines once the flow lands).
- `c18570c4` lab-flow integrated (the review as a stepped onboarding form: `step.tsx` with tiles on one
  specimen, show versus choose, the winner ask with none as the third exit, one card at a time with
  `BeforeAfter`, staging through `Ask.after`, the desk's rows as steps with held badges, Copy so far
  omitting what the ledger holds; the ask pills, the index, the "Rule on:" rows and the review panel
  deleted, which halved the catalog boards' reading); `6907ce68` the three live manifests stop reading
  the merged one.
- `c334de13` the hero's catalog asked as pick-one (the winner ask on the four cards); `ec7367e7` type-scale
  integrated (round seven: a three-step walk, the winner from five or none, one real page under the pressed
  card with a second copy on a fade; 486 words; a kit finding: tiles draw inside a zoomed FitStage, so a
  1:1 tile is owed by the kit and `true-scale.tsx` retires into it).
- `7ed0d2a2` light integrated (round seven: the twelve walked one at a time in Will's order on three
  specimens, each drawn as today and with it, with what it lands as and its usages; the four calls as
  tile steps; the aurora's landing staged behind keeping the aurora; 920 words, the declaration deleted;
  the order ask renamed `second` so round five's `infusion=phase-1` stands). The agent force-pushed its
  own branch once after amending a pushed manifest commit: no damage, a rule broken, noted.
- `49ed0fbf` palette integrated (round eight: one pick over the twelve with "None of these", the real
  product as the stage on one Screen control, the accent, card, faint and reach questions as tile steps,
  the reach staged behind accent=own; 1,191 words, no declaration; the guest masonry and its portrait-pair
  ask withdrawn; two kit findings: `Candidate.lands` never draws on a pick-one gallery, and the spine
  miscounts a blocked step opened by URL).
- `ef5e737d` the kit draws Lands as on the picked card of any grid; `514aee2d` floating-surfaces integrated
  (round seven: one pick over the seven with "None of these", the real product as the stage, the four
  calls as tile steps each on one menu, the submenu bug named in its step's context; 922 words, no
  declaration); the meta panel's Ideas rows made visible again (a native details folds by itself).
- `7d90465c` rounding integrated (round seven: one pick over the six families with "None of these", one
  real page re-skinned in place as the stage, the button, ladder, dead-rung and gap questions as tiles at
  true pixels; 684 words, no declaration; `TrueScale` copied into the board pending its move into the kit).
- `0c1cfa60` brand-voice integrated (round seven: one pick over the six voices with "None of these", the
  tiles three lines in each voice at phone size, the real home page as the stage, the noun, unfurl and
  counts questions as tiles and the scope question means-only behind the pick; the spot list stays as
  the whole board's own section off the walk; its true-size box is the one of three copies whose reads
  settle).
- `61063785` media-kit integrated (round seven: thirteen cards in one keep-any gallery, a kept card a
  purchase priced on the card, the crowds question as two tiles on the blog's own row, the rule, spend
  and shoot questions means-only over real stages; 1,077 words, no declaration; the side-by-side section
  and its twenty-six dock pills deleted). Every board of the stepped review round is integrated.
- `514a5902` the hero's round six transcribed as `stream=none` from Will's message; `ccf93732` home-hero
  round seven built in the root tree (no lane, no manifest): the engine gains a turn by distance, a polar
  placement and a lockup with its own axis; the band, the orbit and the two stacks on the board at 779
  words, the four scatterings deleted.
- `88d0bec0` palette-wiring integrated (the wind-down's first wiring: Graphite in both modes, no accent,
  the dark card opaque, `--faint` on 40 sites, the board retired into its ruling; the manifest deleted);
  `52e9afa2` bible 1's "under exploration" status gone and its why in the past tense, the palette's
  ledger gone with the board; `c667db3c` the media kit's search doors; `cbad7faf` the album hero's
  round three cut on Will's six notes.
- `0c58ff76` hero-wiring integrated (the wind-down's second wiring: the band out of the code with the
  ruled block under it and no caption, `hero-stream.ts` with its contract, the wall and the kinetic word
  gone, the board retired, the Library's `cinema-hero` entry badged new; the manifest deleted);
  `137e504b` the hero's ledger gone, the artifacts regenerated, ASSETS rows 2 and 12 on the shipped hero.
- `0c9caedc` the album page's reduced-motion crash fixed on its own branch (a looping fill's still is one
  settled pass; `use-album-fill.ts` and its test); `57e2c2e4` album-hero round three integrated (four calm
  compositions, the one-block lockup, the album centred; 830 words; the manifest deleted); `759a557b` its
  touchpoint says round three.
- `1cb34f70` Will's second batch transcribed (type-scale r7 ruled on every ask; light r7: the throw and
  the aurora kept, six cards returned as refine; the repeated paper note not recorded twice); `4280a59c`
  Copy so far never re-sends a held note nor anything for a step the board withdrew (`composeSoFar` takes
  the open round's shape; `Transcribed.notes`). Three lanes cut: `type-wiring`, `light` (round eight),
  `aurora-wiring`.
- `2987a5e5` aurora-wiring integrated (the 8 second clock, `--aurora-cadence`, `SectionLight` with its
  contract and its fence on paper, the Library's Aurora entry and the `SectionLight` entry, the transform
  drive's resting translate; the manifest deleted); the tuner knob's default and words follow it.
  `globals.css` is the Orchestrator's again, except the `@utility font-heading` block while
  `type-wiring` is open.
- `0a52c8dc` type-wiring integrated (ladder B as nine `--text-*` steps in theme.css, about sixty
  headings on a step by role, the three ramps collapsed, the dead link on the set, `TYPE_STEPS` in
  `utils.ts` so `cn()` keeps a step beside a colour, `type-ladder-policy.test.ts`, the board retired
  into Foundations' ladder; the manifest deleted); `4c5500da` the ledger gone, `aaa057dd` bible 5 ruled
  (the first of the two staged only the deletion: a removed path in a `git add` aborts the whole add).
  The three stylesheets are the Orchestrator's again.
- `ee0b21d6` light round eight integrated (six steps: `landing`, `depth`, `face`, `sweep`, `bloom`,
  `halo`, all asks so `landing` walks first; no `catalog`, so an `item:` clause is refused for this
  board; 700 words; the manifest deleted); its touchpoint and ASSETS rows 10, 11, 15 and 16 follow.
- `c9903c99` Will's third batch: he finished round seven's walk on the ALIAS, which still served that
  round (no `[preview]` since `aaa057dd`), so his `r7` line was transcribed against round seven's own
  spec (`lab-review --root` on a scratch tree holding `git show ee0b21d6^1:.../light/spec.ts` and a
  copy of the ledger; today's spec refuses `r7` by design). The bloom, the halo (objects only, never a
  button) and the beam kept; the Aurora's placement "a mix of all of them... custom and bespoke".
  Round eight cut to `depth`, `face`, `sweep` inside the round (539 words); `ProCardBeam` measures its
  card's corner under a new contract (the board's Pro card named a radius token that does not exist,
  computed square, and the vendored library refuses a zero and falls back to 16px). The alias is
  rebuilt whenever a board changes from here: a board that differs between the tree and the alias is
  how a sitting lands in the wrong round.
- `dc4530df` the Aurora's two places on the home page, each composed for itself (the closer's light
  rises from the line it shares with the footer's seam; the guest ledger is lit from its open side),
  `SectionLight` without a default placement, the Library's Aurora entry with the bloom and the halo
  as working specimens. One lane cut: `publish-bloom`.
- `871f650b` Will's fourth batch and the lab defect that stopped it: `light r8` fully answered
  (`depth=both`, `face=keep`, `sweep=skip`) and `floating-surfaces r7` picks Card and keeps submenus at
  two levels, with that board's shadow ask withdrawn inside the round. The radius step's 6x corner
  drawing was read once and never again (`scenes.tsx` `useCorner` keeps reading), a press on a catalog
  card's picture landed inside its frame (`catalog.tsx`: the preview is inert on a pressable card),
  and rounding's stage mounted lazily on the home page's hero (eager, and it opens on the app).
  `pnpm lab:demo` (`scripts/lab-demo.mjs`) presses every open step and fails a frozen stage: FROZEN
  on the old code, 25 open steps pass on the fix. ★ Plan mode is inherited by a running agent: it
  stops mid-build with its work uncommitted and resumes by `SendMessage` once the plan is approved.
- `7e713fe8` publish-bloom integrated (the engine's bloom in the house five behind the Studio's frame
  and as a pool under the share card, mounted only while shared, the swell owed to the tap through
  `sharedHere`, nothing on a light ground through the ONE fence rule, the violet keyframes gone,
  `publish-light.test.tsx` with 26 function pins; the manifest deleted). The one conflict was the
  generated `docs/design/library.md`, regenerated on the merged tree. The signed-in pass on the alias
  (`c64275a3`): the Studio's wings and the share card's pool rest lit with strength 0 on open, no
  sideways scroll at 375 (a same-origin 375px frame inside the signed-in tab stands in for a phone:
  the extension cannot resize a maximised window), the card's light `display: none` with `.dark`
  removed. NOT flipped: the only shared reel is the public demo event's, so the tap's swell stays
  proven by the lab stand-in and the contract. ★ The Studio and the event page fade in over several
  seconds on the alias; a capture in the first five reads as a dimmed, see-through room.
- `9c657be6` `light-wiring` cut (the two shadows by role, the four depth techniques in the Library,
  the bright edge on the box that owns its radius, the board retired).
- Will's fifth batch, in the root tree while `light-wiring` runs: `floating-surfaces r7`
  `entrance=by-frequency` and `radius=nested` with a request to pop the question back up if Rounder
  differs. It does: the corner is drawn filled, its tiles at true size through the kit's new `TrueFit`
  (`src/components/lab/true-fit.tsx`, the fifth copy of that box promoted), and a staged follow-up ask
  `roundness` (its options carry `state`, since a mirrored ask must offer every option of its control).
  The v1 wordmark is wired: `src/lib/brand/wordmark.ts`, `Logo` alone in `currentColor`, the social
  card, the Library entry, `logo.test.tsx`; ASSETS rows 18 (wired) and 19 (the icon, to come). These
  files sit under prefixes `light-wiring` owns (`src/components/shared/`), so the agent was told by
  message to leave them and to regenerate the artifacts at its sync. Card's wiring lane waits for
  `light-wiring`'s merge: both own `src/components/ui/`.
- Will's sixth batch. `floating-surfaces r7: roundness=nested` confirms the corner and closes that board;
  `brand-voice r7` records `voice=?` with his words plus `noun=album`, `unfurl=join` and `counts=hero`,
  and he killed the rest of that exploration. The ledger for it was created by that paste and had never
  existed: the board was at ROUND SEVEN with no review on record. Two rules landed with the record: a
  board past round 1 with no `docs/reviews/<id>.json` fails `registry.test.ts` (four boards grandfathered
  in a list that only shrinks, each on his queue), and options are never forced apart (that board made two
  voices that agreed owe a written excuse). Two lanes are cut when `light-wiring` merges: Card's wiring,
  and `voice-retire`, which deletes the board whole (he chose to keep none of the 510 lines) and ships his
  three picks. The new `voice` board is on the ROADMAP ahead of Glass, since bible 20 and 21 wait on it.
  ★ Mine at `voice-retire`'s merge: bible 20 and 21 re-pointed, `docs/reviews/brand-voice.json` deleted in
  its own commit, and `album-hero`'s "Hold for the brand voice line" option re-pointed at the new board.
- `light-wiring` integrated at `47bba92a` (86 files; the conflict was the two generated artifacts, resolved
  to theirs and regenerated). Mine at the merge: bible 10 and 11 both ruled (10 rewritten to say BOTH
  shadows with the flat-surface rule, `enforcedBy` now `src/lib/elevation-policy.test.ts`; 11 naming the
  Aurora as the doctrine that replaced the source-and-direction law), `docs/reviews/light.json` deleted,
  ASSETS rows 10 and 11 marked superseded by 15 and 16 (the same two asks from the same board in two waves)
  and 15 and 16 re-pointed off the deleted board at `SectionLight` and the Library's Elevation legend.
  `globals.css`, `theme.css`, `_data/links.test.ts` and `_data/docs.test.ts` return to `owns` here.
- `voice-picks` at `2735ad92` and `floating-wiring` at `8bb6aa9e`, both clean; bible 15 ruled with its first
  test, which also cleared the last route failing the smoke. The brand-voice board deleted whole at
  `1257ee63` (bible 20 and 21 re-pointed at `voice`, the ledger and 4,121 lines gone). `library/rules/[id]`
  no longer 404s when a rule names work that has not been cut, a bug that fired twice the same day.
- ★ **The lab, upgraded while the lanes ran** (Will asked for it mid-window, then for a ground-up rethink).
  Measured first: the stage sat up to 5.6 screens below the option it answers to and nothing was sticky, so
  a step now pins its evidence above the options at every width (out of reach 3 of 11 to 0). `look` was
  carried and never rendered. A paste says which build composed it and `lab:review` reports the drift.
  `lab:demo` fails a stage out of reach and prints the sitting's words-only share. Then the cause:
  `defineExploration` (`9cda5262`) takes questions and emits an ordinary board, so every option is pictured
  BY CONSTRUCTION and a missing preview is a type error; `type-phone` is the first, and it is the three type
  calls that had sat in the ROADMAP as prose. Its previews were wrong once and corrected at `8d7f0031`: a
  `vw` clamp reads the browser's width, so a "375 column" on a 1550 page drew the 1440 sizes under a 375
  label. Frames fixed it, and the `vw` lesson is in `traps.ts`.
- **The media kit killed** (Will, the seventh batch): reviewed at `8c510621` (`rule=no`, `spend=hold`,
  `shoot=park`; crowds kept off the record by his ruling that no agent tracks an image's rights), then
  deleted whole in the commit after it, call sheet included ("delete it all, start blank"), with the 22
  staged stock photos and `public/design/`. The `credit` field left `MarketingImage` at his instruction so
  none carries forward; the SWC count-glue policy went with the only files it scanned and its gotcha is in
  `marketing-content.md`. Every frame is generated in one Higgsfield month before launch (ROADMAP, researched
  2026-09-17: prices, the MCP, Article 50). ASSETS 6, 7 and 13 withdrawn.
  The media kit was the last keep-any board, so the gallery walk has no user left and goes with the
  old authoring surface's scrub.
- **Will's ninth batch** (composed on `00e82db`): album-hero r3 (`composition=none`, `album-width=w880`,
  `headline=lg`, `no-script=settled`, `copy=page`) and river-visual r2 (`placement=card`, `code=in`,
  `guest-photos=ghost`) recorded, with type-phone's two `?` re-sent by the lab and overwritten unchanged.
  His `proportion=?` was the lab, not the question: the pinned stage clipped the preview and hid its
  labels. It is withdrawn inside the round on an `ai:orchestrator` note, and the step is rebuilt (the
  preview is the page, the answer is a dock). He answered three questions in chat: the album page's hero
  gets a round four at the home hero's pace, subtle, in the empty space around the lockup; the guest album
  runs wide with "a smaller size and add more columns. Not go wide and keep 2 col", on a board rather than
  an interim 880 cap. The calm lesson is in PROGRAM.md: a relative note is answered against a reference,
  never with a cap and a test. The step rebuilt the same day: the preview is the page (every option
  mounted once at its true size, flipped or side by side, a sticky head naming what it shows and at
  what scale) and the answer is a dock (options by number, Pick, the note, "not clear", Back and Next;
  keys 1-9, x, g, n, ?, Enter from the note). Measured on ten steps reopened locally (type-phone's
  two, album-hero's five, river-visual's three): `lab:demo`, which now fails CLIPPED, UNLABELLED,
  NO DOCK and a stage lower than 0.6 of a screen, passed all ten. The re-paste's cause: the walk's
  end composed "Copy the message" from every held answer with no ledger check, and a transcribed "?"
  stayed in the walk; both fixed (`alreadySent`, one rule for both composers). `ladders-wiring`'s
  phase 1 merged at `55e444ea` ahead of its handoff, so the type fix reaches the alias with the dock:
  the ladder's law is the order, `prose` 24 at a phone, a tenth step `subhead`, 103 headings moved
  onto a step, the trim tracking its leading, type-phone retired; bible 5 reworded to the order.
  ★ Still mine: the board lanes' handoffs, then the wiring rounds.
- `ladders-wiring` integrated (lane head `be9e521f`, the merge the same day): phase 2's corners on top of
  phase 1's type. Family C in quarters (an 8px surface, a 12px floating layer with 8px rows, a 4px
  photograph with the gap pinned to it at 4), 3xl and 4xl set to `initial`, a `cta` Button on 46 sites
  and `ctaCorner` for the raw 44px actions, the guest sheet on the floating corner, `--shadow-float` and
  `--radius-action-lg` retired, `cn()` taught the radius tokens, `rounding` retired. Mine at the merge:
  bible 8 ruled (its status off exploration, `enforcedBy` gaining the policy that pins the radius tokens)
  and 15's corner numbers, both ledgers and the manifest deleted, ASSETS row 17 withdrawn (the gap is
  pinned and checked on real photographs), the lane's five deferred lines into the ROADMAP, and the
  stylesheets, the board lists and the two example tests back here.
- The glow boards retired right after, with nothing open (5,613 lines, both ledgers), and the lab's
  global `[data-lit]` rule with them, which had restyled production's bright edge for the rest of a
  session once a glow board was visited. Every floor that counted boards (five sheets, thirty keyframes,
  two lab sheets, the first standing board) now checks the fixed files, and `touchpoints.test.ts`
  derives its standing list from the registry, so a lane never edits that test to add or retire a board.
  `lab:smoke` passes whole. The round's record: a new CHANGELOG entry (the stepped review's dropped, git
  keeps it at `d2db2629`) and STATUS replaced.

Older windows are in the CHANGELOG (two rounds deep) and in git.
