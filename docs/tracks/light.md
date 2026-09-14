---
track: light
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/light/
reads:
  - src/components/shared/glow.tsx
  - src/components/shared/glow-filter.tsx
  - src/app/globals.css
  - src/app/(marketing)/marketing.css
  - src/components/dev/lamp-set.ts
  - src/app/(dev)/design/sandbox/glow-lab-shared.tsx
  - src/app/(dev)/design/sandbox/glow-lab.css
  - src/app/(dev)/design/sandbox/variant-frame.tsx
  - src/app/(dev)/design/rules/bible.ts
  - docs/systems/design-system.md
  - src/components/marketing/chrome/footer-glow.tsx
  - src/components/marketing/sections/pricing/plan-cards.tsx
---

# lp/light

**Goal.** The light exploration of the review wave (2026-09-14): light, shadow and lamp as one system, with the aurora infused as identity. Bible 10 was rewritten (in dark, depth is light first; a shadow is allowed where stacked or overlapping objects need separating) and bible 11 is retiring (a lamp may light a section without media; the footer's seam is the model; this board writes the doctrine that replaces the source-and-direction law). The parked light rulings ride this board: the lit surface, the publish beat's violet, the cadence at 8s or 11s. Lab only: no production byte changes on this track; the doctrine is proposed in the Record.
**Rulings in force.** The bible's second edition: rules 10 and 11 as rewritten (under exploration and retiring, both naming this board), rule 3 (the lamp hues are light, never UI: never a text, border, background, state or brand color; the fence in `globals-theme-contract.test.ts`), rule 14 (every animation inside the reduced-motion block), rule 1 as rewritten (marketing may carry color of its own where there is no media).
**Verify on.** `/design/c/light?key=` on your preview at 1440 and 375, reduced motion honoured; the gate green.

## The brief

### The question

If light, shadow and lamp were one system designed today, what would it be: where does a shadow return in dark, how does a lamp light a section that has no media, what is the aurora, and what replaces "name the lamp or there is no spill"?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **The lamp set:** `src/app/globals.css:199-228`, five hues (coral 25, amber 85, green 155, blue 255,
  violet 305), hand-tuned per hue, fenced as LIGHT NEVER UI: not in `@theme`, so no utility exists and
  the only way to reach them is a var() in a gradient (`globals-theme-contract.test.ts` requires every
  reference to land in a gradient or a re-exporting custom property). `--mkt-confetti-1..5` alias them
  (`marketing.css:1611-1625`, the ACCENT BLOCK: "ACHROMATIC base, not monochromatic").
- **The cadence:** `--spill-cadence: 11s` (`globals.css:129-136`, one token every shipped lamp passes as
  `--glw-dur`) against the engine's own ruled default `--glw-dur: 8s` (`:1404`, "ruled by Will on the
  register 2026-08-31"): the 8s vs 11s ruling is OPEN and rides this board. The tuner has a "Lamp
  cadence" knob (`src/components/dev/motion-tuner-config.ts:301-310`).
- **The engine's no-media path:** `src/components/shared/glow.tsx:84-102`: omit `colors` and no inline
  var is set, so `[data-glw]` falls through to `--glw-c1..5: var(--lamp-1..5)` (`globals.css:1383-1397`),
  and **"an ancestor can retune these"** (a section setting `--lamp-3` recolours every lamp inside it)
  is the existing hook for a section-scoped ambient. Defaults: base and strength 0.62, blur 16px,
  reach 90%, `--glw-h` 210px ("a seam is a band, not a fill", `:1429`); the four laws transcribed at
  `:1339-1352`.
- **Seven production Glow mounts, five call sites:** two on the house set (the footer seam
  `chrome/footer-glow.tsx:42`, the QR bloom `features/qr/qr-hero.tsx:153`) and three sampled from DOM
  images (`home/film-strip-glow.tsx:57`, `home/reel-screen-lamp.tsx:59`, `system/screen-lamp.tsx:79`,
  with `ScreenLamp` consumers at `album/arrivals-stage.tsx:38`, `guests/attribution-hero.tsx:78`,
  `features/sharing/page.tsx:82`). `GlowFilter` is mounted once at the root (`src/app/layout.tsx:88`).
- **The model Will named:** `footer-glow.tsx:26-30`: "the footer's light is the house light", no
  `colors`, the seam a SIBLING hairline; calibration at `:15-24` (210px, 0.62/0.62, 16px blur, the
  4/5/1/2/3 hue order, the 100deg 9-stop comet at 280%). It is the only production lamp with no
  emitting media, and SPILL law 1 as written (`docs/systems/design-system.md:238`: "if you cannot point
  at the object emitting, there is no spill") does not admit it.
- **"Aurora" has zero hits in `src/` and `docs/`:** unclaimed vocabulary, yours to define. The nearest
  existing words: spill, beam, lamp, seam, screen lamp, pool, wash.
- **Shadows:** exactly one family, `--shadow-float` (`globals.css:190-191`; zeroed to the INVISIBLE value
  `0 0 0 0 oklch(0 0 0 / 0)` in `.dark` at `:277` and `.surface-ink` at `:311`, never `none`: Tailwind
  composes `--tw-shadow` beside the ring slots and a `none` invalidates the whole declaration,
  design-system.md:63-67; mapped at `theme.css:94`). 83 `shadow-` uses: 38 on contract (`shadow-float`,
  `shadow-[var(--shadow-float)]`), ~30 raw (`shadow-sm` 18, `shadow-lg` 8, `shadow-md` 2, `shadow-xl` 2):
  the select content (`ui/select.tsx:65`), play chips on `bg-white/9x` (`reel/poster-card.tsx:102`,
  `home/decomposition.tsx:172`, `frames/reel-frame.tsx:33`), four segmented-control thumbs
  (`access-switch.tsx:92`, `review-switch.tsx:100`, `calculator.tsx:141`, `plan-cards.tsx:206`), and
  **`pricing/plan-cards.tsx:85`: a stacked photograph with `shadow-lg` on cinema, the case Will legalised.**
- **Rings are the undocumented fourth depth technique:** `ring-1 ring-foreground/5` 37 uses,
  `ring-white/70` 28, `ring-1 ring-foreground/10` 12 (e.g. `contact-form.tsx:54`, `phone-frame.tsx:24`,
  `qr-hero.tsx:171`). The elevation contract names only shadows and surface steps.
- **The lit surface `[data-lit]`:** zero production usage; lab-only at `sandbox/glow-lab.css:243-244`,
  `glow-doctrine-variants.tsx:839,967,978`, `glow-moments-variants.tsx:2017,2033,2095,2122`; it adds two
  inset box-shadows (hairline + lip at 9%, the air blur gone) and is on three of four beam specimens
  including the Get Pro card. ROADMAP.md's lit-surface bullet has the history. ★ Do not un-apply it from
  those specimens to re-judge them (they are bare divs with no ring).
- **The doctrine you replace** (`docs/systems/design-system.md`): SPILL's four laws (`:234-241`), BEAM's
  four (`:243-247`), scarcity as a distance (`:249-250`), the NEVER list (`:252-256`), the four-question
  LampCard (`:258-262`), the three registers (`:266-273`: ambient, paper via `SPILL_REGISTER.paper` in
  `src/lib/shared/sampled-palette.ts`, live via `vendor/border-beam/styles.ts`), the elevation contract
  (`:528-537`, restated in `globals.css:44-47`), now marked "under exploration" pointing here.
- **Open light rulings riding this board:** (b) the lit surface, (c) the publish beat's violet (a
  ratified state colour meets law 3's ban), (d) the cadence. Not yours: (f) whether guest surfaces
  follow the visitor's theme.

### The board

(a) **Depth in dark:** three subjects, stacked media cards, a floating layer over content, a flat
card, each rendered four ways beside each other: lighter-is-closer alone, with the ring lift, with a
soft shadow, with `[data-lit]`; on cinema and on the app's dark. (b) **Lamps without media:** the
footer seam as the model, then a section-scoped aurora (an ancestor retuning `--lamp-*`; a `<Glow>`
with no `colors`) on a media-less section, on cinema and on paper, at two intensities; what the aurora
IS (a register, a placement grammar, a motion) in your words. (c) **The cadence** at 8s and 11s side by
side on the same lamp. (d) **The publish beat's violet** as a specimen beside the achromatic version.
Reduced motion: every lamp's rest state designed, not absent. Compose `<Glow>` only (the
`glow-contract` pins). The asks: the depth cue set per subject; the aurora yes or no and its register;
8s or 11s; the violet; the lit surface (adopt, adapt, drop).
### The deliverable

The board, plus a draft of the replacement doctrine in the Record (one paragraph each for light, shadow and lamp; the laws that stay, the laws that go, the aurora defined), since you own no system doc: the Orchestrator lands it in `design-system.md` at the ruling. Read `glow.tsx`, `globals.css`, `marketing.css`, the sandbox glow files; change none of them.

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

- Head <sha>, pushed; preview partyreel-git-lp-light-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
