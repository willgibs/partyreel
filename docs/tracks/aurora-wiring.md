---
track: aurora-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4280a59c"
board: none
owns:
  - src/app/globals.css
  - src/components/marketing/system/section-light.tsx
  - src/components/marketing/system/section-light.test.ts
  - src/components/marketing/system/screen-lamp.tsx
  - src/components/marketing/chrome/footer-glow.tsx
  - src/components/marketing/chrome/footer-contract.test.ts
  - src/components/shared/glow.tsx
  - src/components/shared/glow-contract.test.ts
  - src/components/shared/glow-placement.test.ts
  - src/app/(dev)/design/(shell)/library/foundations/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/marketing/
  # Added at handoff, not at the cut, and each one forced rather than chosen; the
  # Handoff's lane check says why per file. Three are GENERATED (pnpm design:rules,
  # the specimen collector) and a stale copy fails the gate; the fourth is one `for`
  # line, which gallery.test.ts and component-index.test.ts both require of a new
  # component in an indexed directory.
  - docs/design/library.md
  - src/app/(dev)/design/rules/rules.generated.json
  - src/app/(dev)/design/gallery/specimens.generated.json
  - src/app/(dev)/design/rules/component-notes.ts
reads:
  - docs/reviews/light.json
  - docs/design/rulings.md
  - docs/specs/light.md
  - src/app/(dev)/design/sandbox/light/kit.ts
  - src/app/(dev)/design/sandbox/light/composer.tsx
  - src/app/(dev)/design/sandbox/light/candidates.ts
  - src/app/(dev)/design/sandbox/light/shared.tsx
  - src/lib/shared/use-ambient-pause.ts
  - src/components/dev/lamp-set.ts
---

# lp/aurora-wiring

**Goal.** The wiring round of the lamps Will kept: they land in the Library as ONE component family
in his word, the Aurora, as working versions. His rulings (`docs/reviews/light.json`, rounds 5 and 7;
`docs/design/rulings.md`, both 2026-09-17 sections):

- the seam, kept: "This seam application of our Aurora looks great. I'm assuming I'm approving the
  colored glow component that can be applied as needed, not a single specific application of it
  right here." (He is: that is this lane.)
- the throw, kept: "I like the throw. Assuming it's basically an alternative way to use our Aurora,
  similar to the seam."
- the aurora (the chapter-scale field), kept: "Approved on the Aurora. However, we're keeping all
  Aurora forms off of paper, as mentioned in the previous round. Assuming this, similar to seam and
  throw, is another alternative way to infuse the Aurora into our UI."
- never on a light ground: "we may not be able to use the Aurora on white/paper surfaces. It's barely
  noticeable and almost appears as a weird shadow or a stray artifact... No light ground usage is a
  decision for now."
- `cadence=8s` (every lamp, the footer included, on the engine's own clock), `register=accent` ("Identity
  feels way too weak. Let's use accent as the global register, and we can modify it as needed in the
  future if it feels too strong."), `kit=land`.

So the vocabulary from here: **Aurora** is the coloured light; it has three kept FORMS: the seam (a
band where two grounds meet), the throw (cast from a point on an object) and the field (chapter
scale, at a section's own edges). Code identifiers do not move (`Glow`, the SPILL engine, `--glw-*`,
`--lamp-*`); the Library and the docs speak his word.

**What comes back.**
1. **The clock.** `--spill-cadence: 8s` (`src/app/globals.css:231`, with its comment), the literal the
   contract pins (`src/components/marketing/chrome/footer-contract.test.ts:115-126` reads
   `--spill-cadence:\s*11s`), the comment in `screen-lamp.tsx:86-88`, and
   `docs/systems/design-system.md:365-367` ("All three seams ship at `--glw-dur: 11s` against the
   engine's ruled 8s") refined in place. `--aurora-cadence: calc(var(--spill-cadence) * 3)` declared
   beside it (the board's `AURORA_REGISTER` in `sandbox/light/candidates.ts:227-258`; an UNDECLARED
   cadence freezes the band rather than falling back, `sandbox/light/board.css:177-200` has the
   story). `src/components/dev/motion-tuner-config.ts` (the "Lamp cadence" knob's words, "every lamp
   shipped at 11s") is the Orchestrator's file: put the new sentence in Handoff.
2. **The field, as a component.** `src/components/marketing/system/section-light.tsx`, beside
   `screen-lamp.tsx`, from the kit's own `AURORA_MOUNT` (`sandbox/light/kit.ts:176-201`) and the
   board's `auroraVars()` and register matrix (`sandbox/light/composer.tsx:60-136`; read them, port
   what ships, never import the sandbox): `<SectionLight placement="both | top | bottom | room">`,
   two seam bands (the bottom one the same seam flipped, `scale: "1 -1"`), each 42 percent of the
   SECTION's height, the accent register on dark (`--glw-base: 0.30`, `--glw-strength: 0.13`, the
   wider blur), the slow clock (`--glw-dur: var(--aurora-cadence)`), behind the copy and never over
   it, `aria-hidden`, no `className` (the engine's third invariant). Only accent ships; identity is
   not a prop value. `AURORA_VARS` is named in the kit's mount string and defined nowhere: define it
   here. The placement Will picks (`landing`, the first step of the light board's round eight) is not
   in yet, so all four placements ship as prop values and NO production call site is added in this
   round: the home page's two (the guest ledger and the closer, `second=home-arc`) land the moment he
   answers, by the Orchestrator or by this lane resumed.
3. **Dark grounds only, by construction.** Inside `.surface-paper` (and the app's light mode) the
   field paints nothing: one rule in `globals.css`, a line in the contract, and the reason in a
   comment in his words. The engine's existing `.surface-paper [data-glw]` behaviour for the seams
   that already ship is NOT this lane's to change: say in Handoff what it does today so the
   Orchestrator can ask him.
4. **Its contract.** `src/components/marketing/system/section-light.test.ts`, opening
   `// @contract-for: src/components/marketing/system/section-light.tsx`, pinning FUNCTION: renders
   `Glow` seams and nothing of its own, never a `className` on the lamp, the slow clock read from the
   token (never a literal), the wrapper never clipping (`glow-placement.test.ts`'s law), nothing on
   paper, reduced motion resting on the engine's designed still. Then `pnpm design:rules`. The
   engine's own laws bind everything here: `glow-contract.test.ts` (every animation inside the
   no-preference block, every keyframe `glw-` and unique, base always beside band) and
   `keyframe-uniqueness.test.ts`.
5. **The Library.** The Foundations entry `glow` (`library/foundations/gallery-demos.tsx`; keep the id,
   it is a URL) presents as **Aurora**: a `title`, a lede in his vocabulary, and one live specimen for
   each kept form on a dark ground: the seam on a boundary, the throw under a plate on open dark
   (`THROW_MOUNT`, `kit.ts:101-117`, typed as a specimen: it has no production call site yet, see
   below), the field on a chapter through `SectionLight`. `SectionLight` gets its own entry in
   `library/marketing/gallery-demos.tsx` (the four placements as specimens, `bleed: true`; read
   `gallery.test.ts:324-356` for when an entry must declare `file`; specimen nodes are declared
   INLINE or the collector cannot read them), badged `new`. Rerun
   `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`; the Orchestrator reruns it again at
   the merge.

**Deliberately not in this round, and why (say so in Record).**
- The throw's production call site. The kit names the QR plate, where a directionless `bloom` ships
  today (`sections/features/qr/qr-hero.tsx:150-166`); the bloom card is unruled (round eight), so the
  plate waits for it. The home hero Will approved yesterday is not touched.
- The publish flourish (`publish=house-five`: a bloom in the house five, or sampled where the light
  bleeds from media). It replaces `rxp-bloom` and `rxp-pubglow` (`globals.css:1268-1296, 1392-1411`),
  and whether a one-shot rests on a base or on nothing is the same unruled bloom card.
- The shadows, the lit face, the marks: round eight asks them again.

**Binds.** The bible (3: the five lamp hues are light, never UI; 10; 11: a lamp may light a section
without media, the footer's seam is the model), the four SPILL laws and the NEVER list in
`docs/systems/design-system.md:214-370`, the contracts above, the policies (`css-source-policy`,
`globals-theme-contract`: the five declared once and used only in gradients; `marketing-css-policy`).
The `type-wiring` lane is live beside you and has ONE permitted edit in your `globals.css`: the
`@utility font-heading` block (about lines 895 to 920). Stay out of it. Agents never edit CHANGELOG,
STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/`,
`touchpoints.ts` or `rules/bible.ts`; the light board's folder is the `light` lane's this round.

**Verify on.** Your own dev server on port 3133 (`pnpm dev --port 3133` from the worktree, in the
background; stop it by port at the end: `lsof -ti tcp:3133 | xargs -I{} kill {}`; never an unscoped
pkill; :3000 is the Orchestrator's). The browser pane is SHARED with two other lanes: open your own
tab, touch no other. The Library's Aurora entry and the `SectionLight` entry at 1440 and 375, reduced
motion on and off (the designed still, not a blank); the home page, a features page and the footer on
the 8 second clock (computed `animation-duration` on the footer's band reads 8s; the field's reads
24s); a paper page with a `SectionLight` forced onto it in the Library paints nothing. The grain tile
is a stand-in until `docs/ASSETS.md` row 15 lands: keep the board's inline one, and ask for nothing
new.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The transform drive's resting state was broken, and the field is the first lamp to sit on it.**
  Built, not asked, because it is law 4 as code rather than a product call:
  `[data-glw-drive="transform"] [data-glw-band]` declared no `translate`, and every engine animation
  lives inside `@media (prefers-reduced-motion: no-preference)`, so a reduced-motion visitor saw the
  comet parked dead centre at full strength, permanently. Identical to the `mask-position: 50% 0`
  defect round 1 fixed on the other drive, and invisible until now only because no shipped lamp used
  this one. It now declares `glw-drift-x`'s own from-keyframe (`translate: 32% 0`), so the animated
  path is unchanged down to the frame and only the still moves. **Recommendation: keep.** Nothing to
  relay unless Will wants the field on the mask drive instead, which would cost a chapter-sized
  repaint every frame.
- **`room` ships as a prop value although the kit's fence list is nearby.** The fenced placement is
  `behind` (origin at 46%, which becomes a fill behind everything); `room` is an origin-anchored cast
  from the section's own FLOOR, so it still declares a vector and passes law 2. Both `middle` and
  `behind` are absent from the type. **Recommendation: keep the four, watch `room` at review.**

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, the lamp doctrine: the cadence paragraph rewritten (11s ruled to
  8s, plus `--aurora-cadence` and why an undeclared sibling freezes a band), and a new
  `### The Aurora, and its three forms` subsection (the vocabulary, `SectionLight`'s geometry and
  register, the transform drive's resting translate, the light-ground fence, and the note that the
  field has no production call site yet).

## Deferred (ROADMAP one-liners, bucket named)

- **Design**: the Aurora's field has no production call site; the home's two candidates (the guest
  ledger and the closer, `second=home-arc`) land the moment Will answers the light board's round-eight
  placement question.
- **Design**: the throw's production call site (the QR plate) still waits on the unruled bloom card;
  the publish flourish (`rxp-bloom` / `rxp-pubglow`) waits on the same card.
- **Design**: a hand-tuned PAPER five for `--lamp-1..5`. Nothing overrides the dark register on paper
  today, so a media-less lamp on a paper chapter would light a near-white page with colours picked for
  a near-black room. Latent rather than live (no production lamp sits on paper), and now doubly latent
  since the Aurora is fenced off light grounds entirely.
- **Design**: the grain tile (`docs/ASSETS.md` row 15). Not requested again; the field ships without
  one and does not band at this register on the grounds tested.

## Handoff (replaces the chat report)

- The work is `9c4bb8fd`; this manifest is the commit on top of it and is the branch head, pushed.
  `origin/launch-prep` had not moved (still `c338c95c`), so no sync was needed.
- Gates on the tree: typecheck ok, lint ok (0 errors, 9 pre-existing warnings, none in this lane),
  test ok (2138 in 229 files), build ok (257 pages). `pnpm lab:smoke`: 0 route failures; the 2 are the
  pre-existing reading-budget overruns on `glow-doctrine` (3916 words) and `glow-moments` (4495),
  two legacy boards this lane does not own and did not touch.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is the owned paths plus four, each
  forced: `docs/systems/design-system.md` (listed above), `docs/design/library.md` +
  `src/app/(dev)/design/rules/rules.generated.json` (`pnpm design:rules` rewrites both and
  `rules-registry.test.ts` fails on a stale copy), `src/app/(dev)/design/gallery/specimens.generated.json`
  (the specimen collector, same deal), and **`src/app/(dev)/design/rules/component-notes.ts`**: one
  added `for` line for `section-light.tsx`. Not optional and not cosmetic, since `gallery.test.ts`
  and `component-index.test.ts` both fail on a new indexed component without one. One line, in the
  sorted `marketing/system` group; no other lane is near it.
- What landed:
  - **The clock.** `--spill-cadence: 8s` with its comment rewritten, and
    `--aurora-cadence: calc(var(--spill-cadence) * 3)` declared beside it with the freeze story. The
    footer's, the film strip's, the reel's and every screen lamp's computed `animation-duration` now
    reads 8s; the field's reads 24s; the QR bloom keeps its own 1.4s (a MARK tunes itself inline).
  - **The field.** `src/components/marketing/system/section-light.tsx`: `placement` is
    `both | top | bottom | room`, two seams at 42 percent of the section's height, the bottom one the
    top one flipped (`scale: "1 -1"`), the accent register in one `AURORA_VARS` object, the transform
    drive, `--glw-dur: var(--aurora-cadence)`, no `className` anywhere near the lamp. No production
    call site, per the goal.
  - **The fence on paper.** One rule in `globals.css`:
    `[data-section-light]:not(.dark *), .surface-paper [data-section-light] { display: none }`,
    theme.css's `dark` variant inverted. Verified three ways in the browser: outside `.dark` = none,
    inside `.dark` = block, `.surface-paper` nested inside `.dark` = none.
  - **The contract.** `section-light.test.ts`, 10 pins, all function: the engine and nothing of its
    own, the flipped band, no className on the lamp, the clock from its token, one register object,
    never clipping, content after the light in a positioned wrapper, the hook on the LIGHT and never
    on the content (or paper would hide the chapter), the CSS fence with both halves, and the
    transform drive's resting translate equal to `glw-drift-x`'s from-keyframe.
  - **The Library.** Foundations' `glow` entry keeps its id and its URL and presents as **Aurora**,
    with a lede in his vocabulary and one live specimen per kept form on a dark ground (the seam on a
    boundary, the throw under a plate, the field through `SectionLight`), badged `updated`.
    `SectionLight` gets its own entry under Marketing > Shells, badged `new`: the four placements
    plus a fifth frame that is the FENCE as a specimen (the same component inside a `PaperChapter`,
    deliberately painting nothing).
- **What the engine does on `.surface-paper` today, for Will:** nothing at all. There is no
  `.surface-paper [data-glw]` rule in `globals.css`, `theme.css` or `marketing.css`, and `--lamp-1..5`
  are declared once at the DARK register, so a media-less seam on a paper chapter would light a
  near-white page with colours picked for a near-black room (the "dirty rather than lit" failure the
  sampled paper register fixed for lamps WITH media). It is latent, not live: no production lamp sits
  on paper today. Widening the Aurora's fence to `[data-glw]` would unlight four shipped lamps, so it
  is deliberately scoped to `[data-section-light]` and left as his question.
- **The tuner knob's new sentence** (`src/components/dev/motion-tuner-config.ts`, the Orchestrator's
  file). Three edits, and the third is load-bearing:
  - the comment above the control: "Every lamp reads `--spill-cadence` (globals.css, 8s since Will's
    ruling of 2026-09-17). The Aurora's field is not on this knob directly: it follows at three laps,
    through `--aurora-cadence`."
  - `description`: "One full cycle of every lamp's drift, ruled 8s on the whole page (2026-09-17); the
    Aurora's field follows at three laps of it."
  - `default: 11` to `default: 8`. ★ `setTunerValue` compares against `default` to decide whether to
    store an override or drop one, so leaving 11 would leave a phantom override that Reset never
    clears, and the light board's `useClocks` reads the same field as its SSR fallback.
- **Stale 11s lines outside this lane**, now that the ruling landed (none touched, all one-liners):
  `src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx:1354` (a note saying the specimen runs 8s
  "while the shipped footer runs 11s"; the two now agree), and the light board's own
  `candidates.ts:239`, `kit.ts:462` and `spec.ts` cadence rows, which are the `light` lane's while it
  is open.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/library/section-light` at 1440, the `room` placement and the paper frame
  beneath it (the fence, visible), then the footer of any page for the 8s clock.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-17). The three forms of light Will kept landed as one
family in his word: the clock ruled to 8s on every lamp with `--aurora-cadence` declared beside it as
a sibling (three laps, 24s) rather than a re-tune, and `SectionLight` shipped as the field's one
mount, four placements, the accent register in one object, the bottom band the top one flipped. The
no-light-ground ruling became a CSS fence keyed on `[data-section-light]`, mirroring the dark variant
inverted, scoped to the field so the four shipped seams keep their own paper history. Being the first
shipped lamp on the transform drive exposed that drive's missing resting `translate`, which parked the
comet dead centre at full strength for every reduced-motion visitor; it now rests at its own
from-keyframe. Two Library entries carry it: Foundations presents as Aurora with a specimen per form,
and SectionLight ships its placements plus the paper frame that paints nothing on purpose. No
production call site: the placement is round eight's question.
