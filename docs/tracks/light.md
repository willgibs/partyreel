---
track: light
status: handed-off
cut: "6c19d84"
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

- none. This track owns no system doc; the replacement doctrine is drafted in the Record below and
  the Orchestrator lands it in `design-system.md` at the ruling.

## Deferred (ROADMAP one-liners, bucket named)

- none.

## Handoff (replaces the chat report)

- Head: the tip of `lp/light` (the sync merge `0672ad9`, this manifest committed on top), pushed; preview
  partyreel-git-lp-light-partyreel.vercel.app. The board is `/design/c/light?key=...`; each part has
  an anchor (`#lgt-a` .. `#lgt-d`).
- Synced with `launch-prep` at `3d40173` (it had moved 57 commits; merged at `0672ad9`).
- Gates on the synced tree: typecheck ok, lint ok (0 findings in the lane; 7 pre-existing warnings
  elsewhere), test ok (1697), build ok (248 static pages, 114 routes).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/light.md` +
  `src/app/(dev)/design/sandbox/light/{board.tsx,board.css,shared.tsx,depth.tsx,aurora.tsx,beats.tsx}`.
  No exceptions. No production byte changed: the board composes `<Glow>` and reads the engine, and the
  three things it proposes that do not exist yet (the dark shadow family, the lit face's paper half,
  the aurora's grain) live in the board's own sheet under the `lgt-` prefix.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Assets requested from Will:
  - A grain tile, so the aurora stops banding · seamless monochrome noise, 256x256, PNG-8, fine grain
    (about 1px), neutral, mean 50 percent grey, used at about 5 percent over the light · replaces the
    inline feTurbulence stand-in in `board.css` (`[data-lgt-grain]`).
  - A worst-case pair of overlapping photographs for part A · two images whose touching edges are both
    dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG · replaces the
    `reception-hall` + `wedding-toast` pair in `depth.tsx`, so the depth cue is judged against the case
    it exists for rather than a lucky one.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - Depth in dark: the cue set for stacked media cards, a layer over content and a flat card
  - Lamps without media: the section aurora, yes or no, and its register on cinema and on paper
  - The cadence: 8s or 11s
  - The publish beat's violet
  - The lit surface ([data-lit]): adopt, adapt or drop
- Look at first: part B, the aurora at accent on cinema, then the same on paper. It is the answer to
  "what is the aurora" and it is the only part of the board that proposes a new thing rather than a
  rule about existing things. Then part A's stacked-photographs row, which is the whole case for
  letting a shadow back into dark.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The light exploration replaced its stub with a
four-part board at `/design/c/light` and drafted the doctrine that replaces the source-and-direction
law. Part A put three subjects (two overlapping photographs, a layer over content, a flat card) under
four cues (the surface step alone, the ring lift, a soft shadow, the lit face) on cinema, app dark and
paper, and proposed one shadow family at two sizes with one alpha ramp per ground. Part B rendered the
footer seam as the model and then three candidate lamps for a media-less chapter (the seam at a
chapter's top edge, the aurora at both boundaries, one fill behind everything) at two registers and
three temperatures, and proposed a hand-tuned paper five. Part C put 8s, 11s and the aurora's 33s on
three identical seams. Part D put the publish beat's violet beside the house five and beside the five
leaned to 305. Nothing production changed; the board's own sheet carries the three things the system
does not have yet. Five asks went to Will, two assets were requested, and seven departures were flagged
on the board rather than buried.

### The draft doctrine (for `design-system.md` at the ruling)

**LIGHT.** One doctrine in three jobs, decided by what the light is DOING rather than by the mode or by
what kind of thing is emitting. **SEPARATE** is achromatic and static: it says one object is in front of
another (today's elevation contract, moved inside the light doctrine instead of sitting beside it).
**FILL** is chromatic, slow and always behind content: it gives a room a temperature (spill, and the
aurora it grows into). **MARK** is chromatic, bounded, and ends when its state ends (the beam, and a
moment's beat). A surface takes at most one job at a time and a view carries at most one MARK. The
identity claim underneath: light is where our colour lives, so the five hues are the whole palette of
all three jobs and nothing else on the site is allowed colour (bible 3, unchanged and now load-bearing
for three jobs instead of one).

**SHADOW.** One family, two sizes, one alpha ramp per ground. **LIFT** separates two objects of the same
lightness that overlap (two photographs, a card over a card). **FLOAT** detaches a layer from content
that keeps living behind it (menu, dialog, sheet, toast). A flat surface with nothing behind it and
nothing over it takes neither, in either mode, and keeps its step and its hairline. The geometry is
`--shadow-float`'s, unchanged (blur = 2x offset, a single top source); `float` is that geometry at
double the offsets. What changes per ground is only the ALPHA, because a shadow has to be darker than
what it falls on and 6 percent of black over `oklch(0.14)` is arithmetically invisible: that is why
"dark has no shadows" read as true for so long, and it was never the real rule. Proposed values are in
the board's sheet. The **RING** (`ring-1 ring-foreground/5` on surfaces, `/10` on media frames, 77 uses
and in no document) is the fourth SEPARATE technique and is now named: it states an edge without
implying height. The **LIT FACE** (an inset hairline plus a 1px lip) is not elevation at all, it is
material: it belongs to a face that is catching light (a media frame, a screen, a plate), and on paper
it reads off the bottom edge instead of the top, because a ground changes what light means.

**LAMP.** A lamp needs a **PLACE**, not an object: an edge, a boundary, a screen, a plate, a horizon.
That replaces "name the lamp, and if you cannot point at the object emitting there is no spill", and it
reaches every verdict the old law reached (a pill's rim is not a place, a nav panel is not a place, a
skeleton is an absence) while admitting the footer seam, which the old law forbade and which is the
model Will named. The rest of SPILL stands as written: DIRECTION (every lamp declares its vector; the
container mask is origin-anchored, so there is no even-rim mode), COLOUR (real media where it exists,
the house five where it does not, never a house token and never a state colour), FALLOFF (base and band
always ship together, because a swept layer rests off-layer and the base is how a reduced-motion
arrival still arrives). BEAM's four laws stand. Scarcity stays a DISTANCE, roughly a viewport of unlit
page between lamps, and it governs LAMPS only, never the field. The four-question LampCard stands with
question one restated: what place is the light entering from? The cadence is a lamp's, not the
system's: one register for a lamp (the board recommends the engine's own 8s) and a multiple of it for
the aurora, so `--spill-cadence` stays one token and gains a sibling.

**THE AURORA.** The aurora is the FILL job at chapter scale: the house light itself, at rest, in a
section that has no media. It is three things, and it is not a lamp. A **REGISTER**: a low base with a
band near zero, so it reads as the room having a temperature rather than as something glowing, and
higher numbers on paper than on cinema, because a tint has far less contrast with a near-white page
than with a near-black room. A **PLACEMENT GRAMMAR**: the chapter's own boundaries, its top edge and
its bottom edge, never its middle, never centred on a card or a control, and never a fill; the copy
lives in the clean band between the two. A **MOTION**: a drift several times slower than a lamp's,
because a field the size of a chapter moving at a lamp's clock reads as a screensaver. Its **COLOUR**
is the house five narrowed to a temperature by the section itself, through the engine's own documented
ancestor hook (`--lamp-*` is inherited and `[data-glw]` reads it, so a section retuning it recolours
every lamp inside it): a temperature is five of the five, re-ordered, never a sixth hue. On paper the
five take the paper register, hand-tuned per hue rather than one flat L/C row. This is how marketing
carries colour of its own where there is no media (bible 1) without growing a second palette.

**What goes.** "If you cannot point at the object emitting, there is no spill" (replaced by the place).
"One depth technique per mode" and "Dark: NO shadows anywhere" (replaced by one cue per relationship).
"Never a violet reel glow" as an absolute (replaced by: light never takes its colour from a meaning, but
a moment may lean the five toward the nearest hue, so 300 becomes 305).

**What stays.** The lamp set is light, never UI. Direction, colour, falloff. BEAM's four laws. Scarcity
as a distance. The four-question LampCard. Every animation inside the reduced-motion block, and every
lamp's rest state designed, which is the argument that decides part D on its own: the shipped publish
beat declares nothing outside its animation, so a visitor who asked for less motion is told nothing at
all when their reel goes live.
