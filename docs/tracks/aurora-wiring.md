---
track: aurora-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet (expected: `docs/systems/design-system.md`, the lamps: the clock, the field, the vocabulary)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- What landed, one line each: the clock, the field, the fence on paper, the contract, the two Library entries
- What the engine does on `.surface-paper` today for the seams that already ship (one line, for Will)
- The tuner knob's new sentence (for the Orchestrator's file)
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
