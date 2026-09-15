---
track: light
status: handed-off
cut: "521ea6633021e20756b75aba5b723213867d82cf"
merged_round_2: "6203d62"
merged_round_1: "72b20da"
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

**Round 2 (the goal).** The board wrote the doctrine; now make every claim in it something Will can
see on a real surface and, where it is CSS, wear on the site. (1) **Apply to the site**: the shadow
family (LIFT and FLOAT with the alpha ramp per ground) as a candidate block on the real primitives'
classes and the real card, so the dashboard's cards, a real menu and a real dialog carry it; the lit
face as a second block on real media frames and the QR plate; the cadence as knobs (`setTunerValue`
on the `--spill-cadence` control: "8s on the site" / "11s on the site"). (2) **The aurora on real
chapters**: rebuild the home arc's media-less chapters from production components inside the board
(find them: the trust strip, the pricing pointer, the how-it-works closer, whichever have no
photograph) and light each with the aurora at the ruled register on cinema and on paper, beside the
same chapter unlit; the placement grammar (top and bottom edges, never the middle) proven on a real
chapter, not a box; the drift at a lamp's clock and at the aurora's, side by side. (3) **The grain**:
the tile is asked for (row 10); meanwhile make the stand-in honest at 1x and 2x, and show the aurora
with and without it. (4) **The paper five**, hand-tuned, on a real paper chapter beside the flat row.
(5) **The lit face** on the three surfaces the doctrine names (a media frame, a screen, a plate), on
cinema and paper, beside the ring lift and the shadow, so "material, not elevation" is visible. (6)
**The doctrine as a diff**: in the spec's shape, the exact paragraphs that replace `design-system.md`'s
SPILL laws, BEAM laws, registers and elevation contract, so the ruling is a paste. (7) Every part on
the phone canvas; every lamp's rest state designed. Keep the four-part structure and the anchors.

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

## Handoff (round 1)

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

## Record (round 1)

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

## Handoff (round 2)

- Head: the tip of `lp/light`, pushed (the board's content is `be34aba`, the sync merge of
  `launch-prep` at `4b035c1`, the two review fixes `76ef0c0` and `46837cf`, this manifest, and the
  second sync merge of `launch-prep` at `1cf4cea` on top);
  preview partyreel-git-lp-light-partyreel.vercel.app. The board is
  `/design/c/light?key=...`; five anchors now, `#lgt-a` .. `#lgt-e` (part E is the doctrine as a paste).
- What changed after the read-only review of `471b8db` (all four should-fix items, all inside the lane):
  - The shadow family reaches the real card. `[data-media-tile][data-static]`, the host pair
    globals.css already uses to opt those surfaces out of the guest arrival fade, takes
    `box-shadow: var(--shadow-lift)` and re-states the tile radius, so the dashboard's event cards
    (and the host gallery's static tiles) carry the proposal the goal item and the walk line both
    advertise. Part E's elevation table names the case: a media card on a ground of its own lightness.
  - It stopped re-pointing the shipped token on the dark grounds. `.dark, .surface-ink` now re-states
    `--shadow-float`'s invisible value rather than aliasing it to lift. Aliasing it handed a shadow to
    all 26 of the token's consumers in dark, flat surfaces included, while the caption promised eight
    floating layers. Walking it found a second path to the same defect: `:root` and `.dark` are the
    same element at the same specificity, so even the light block's bridge alias beat globals.css's
    zero on source order, which is why the zero has to be written in the block rather than inherited.
  - The aurora's clock is a sibling token. The paste declares
    `--aurora-cadence: calc(var(--spill-cadence) * 3)` and leaves `--spill-cadence` alone, which is
    what part E asks Will to land ("the lamp's clock and the aurora takes a multiple of it"). The old
    paste wrote 33s into the lamp's own token, which would have slowed every shipped lamp including
    the footer seam the board calls its model, and fought part C's two knobs, which write that token.
  - The two captions now say what their blocks do, and part E moved with them (the aurora block names
    the sibling and the ratio, the CSS lede says why the dark grounds are named surface by surface).
  - The light-QA claim below is redone: the board was walked on the preview at 1440 and at 375, and
    the bytes that changed since are walked on the running app.
- Synced with `launch-prep` twice: at `4b035c1` mid-round (1 commit, the candidate-block doc note) and
  again at `1cf4cea` before this handoff (9 commits, all of them hero-river's own lane and its
  manifest, so no overlap with this track's files or its reads). Both merged clean.
- Gates on the synced tree, re-run after the review fixes and after the second sync: typecheck ok,
  lint ok (0 findings in the lane; 7 pre-existing warnings elsewhere), test ok (1698), build ok
  (248 static pages, 114 routes).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/light.md` +
  `src/app/(dev)/design/sandbox/light/{aurora,beats,board,candidates,chapters,depth,doctrine,shared}`
  (`board.css` too). No exceptions. No production byte changed: the board composes `<Glow>`, imports
  five marketing sections read-only, and everything it proposes lives in its own sheet under `lgt-` or
  in `candidates.ts` as a string.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Light QA, on the preview (partyreel-git-lp-light-partyreel.vercel.app, serving `471b8db`; the
  deployment note is the next bullet). Seen, not only measured: screenshots at every part.
  - 1440: a real 1440 viewport, walked top to bottom. All five parts render, 14 stages, 22 `<Glow>`
    mounts, the five real chapters mount and their reveal grammar fires on scroll (every
    `[data-mkt-reveal]` inside the guest ledger at opacity 1). No horizontal overflow on the document.
  - 375: the board's own Phone 375 canvas, every part walked. All 14 stages measure exactly 375px and
    not one of them overflows its canvas; part A pairs its four cues two by two, part C stacks its
    three seams, and the real chapter reflows its two columns rather than compressing them.
  - Reduced motion: the Rest state switch sets `data-lgt-rest`, and all 22 lamps' bands then compute
    `animation-name: none`, so the whole board renders its reduced-motion state at once. The board's
    one keyframe (`lgt-phase`) lives inside the `prefers-reduced-motion: no-preference` block.
  - The browser VIEWPORT could not be narrowed to 375, which is a tooling limit and not a finding:
    this Chrome window's foreground tab belongs to a parallel session, so the lane's tab renders
    offscreen at a fixed 1440 and ignores a window resize. The board's own 375 canvas is the honest
    instrument for it anyway: this board uses `matrixCols` rather than breakpoints inside a stage,
    because a Tailwind prefix inside a stage reads the browser's width and not the stage's.
- The preview is two commits behind, and it is NOT the lane's doing: the Vercel account hit its
  100-deployments-per-day cap (`api-deployments-free-per-day`; eight tracks pushing in parallel), so
  the push at `76ef0c0` created no build at all and an API deployment is refused until the cap resets,
  about 24 hours from 2026-09-14 21:56. Everything that changed since `471b8db` is inside
  `candidates.ts` and `doctrine.tsx`, so the board Will walks is the one verified above; the paste
  text and the blocks themselves were walked on the running app instead:
  - The four Apply captions render as written, and each block is applied and then walked on the real
    pages with `?key=`.
  - The shadow family: with it applied, `--shadow-float` is the invisible value on the dark root and
    on `.surface-ink`, and on `.surface-paper` it is today's shipped bytes
    (`0 2px 4px -1px oklch(0 0 0 / 0.06), 0 4px 8px -2px oklch(0 0 0 / 0.1)`), so paper does not move.
    The real EventCard takes the dark lift (13 cards on `/design/compositions`, computed
    `oklch(0 0 0 / 0.45) 0 2px 4px -1px, oklch(0 0 0 / 0.55) 0 4px 8px -2px`, radius 3px). The home
    page carries no `[data-media-tile][data-static]`, so marketing's frames are untouched by the card
    rule.
  - The aurora: `--spill-cadence` stays 11s, `--aurora-cadence` resolves to `calc(11s * 3)`, the
    footer seam keeps `--glw-dur: 11s` (a lamp keeps the lamp's clock, which is the doctrine), and the
    register does reach it (`--glw-base: 0.3`, `--glw-blur: 38px`).
  - Clear works from the board's banner, and removes the block from the page.
- Verified live at `471b8db`, still standing (the earlier pass, on the same blocks): the shadow family
  resolves the dark ramp on `/pricing` and leaves `/help`'s paper cards at 0.06 / 0.10 untouched; the
  nav dropdown's viewport takes `--tw-shadow: 0 4px 8px -2px oklch(0 0 0 / 0.5), ...` AND KEEPS ITS
  RING (the reason the blocks write `--tw-shadow` and not `box-shadow`); the lit face lands on
  `.bg-gallery` on `/` and on the QR hero plate on `/features/qr`, ring intact; the paper five lands on
  `.surface-paper` (`--lamp-1: oklch(0.88 0.085 25)`) with the root five untouched. The cadence knobs
  write `{"--spill-cadence":8}` and 11s removes the override (it is the baked default), which is the
  store's own contract.
- Assets requested from Will:
  - A grain tile, so the aurora stops banding · seamless monochrome noise, 256x256, PNG-8, fine grain
    (one tile pixel), neutral, mean 50 percent grey, used at about 5 percent over the light AND laid out
    at 128 CSS px on a 2x screen (one tile pixel per device pixel; laid out at 256 it doubles and the
    band returns) · replaces the inline feTurbulence stand-in in `board.css` (`[data-lgt-grain]`).
  - A worst-case pair of overlapping photographs for part A · two images whose touching edges are both
    dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG · replaces the
    `reception-hall` + `wedding-toast` pair in `depth.tsx`, so the depth cue is judged against the case
    it exists for rather than a lucky one.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  - Depth in dark: the cue set for stacked media cards, a layer over content and a flat card
  - The lit face: adopt, adapt or drop, on the three surfaces it names
  - The section aurora: yes or no
  - Its register: accent or identity
  - Its placement: both boundaries, the top edge alone, or the room
  - The cadence: 8s or 11s
  - The paper five: hand-tuned, the flat row, or leave the dark set
  - The publish beat's violet: 300 as shipped, the house five, or the five leaned to 305
  - Part E as pasted: land it, or name what to change
- Look at first: part B, the guest ledger unlit then lit, at accent on cinema. It is the whole round in
  one pair, and it is the first time the aurora has been judged against a chapter it was not built for.
  Then press Apply to the site on part A's shadow family and open a menu on `/pricing`: that is the
  proposal wearing the real app. Then part E, which is the ruling with no translation left in it.
- For the Orchestrator: the preview alias serves `471b8db` and will serve the tip on the first push
  after the Vercel daily cap resets; nothing else is needed to refresh it. `touchpoints.ts` describes this board as "Four parts" and it is five now
  (`#lgt-e`, the doctrine as a paste). The description is yours to rename at integration; I did not
  touch the file. Findings against a bible rule: none, rules 10 and 11 are already under exploration
  naming this board.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The light board's second round turned the
doctrine from an argument into a surface Will can wear. Four candidates became pastes in one source
(`candidates.ts`), each with an Apply to the site button handing the whole site the exact block a
ruling would land: the shadow family (lift and float, one ramp per ground, on the primitives and on
the dashboard's real event cards), the lit face on media frames, screens and plates, the aurora's
register with a sibling clock, and a hand-tuned paper five. Each block does only what its caption
says: `--shadow-float` keeps its contract zero on the dark grounds and `--spill-cadence` keeps its
number. Part A withdrew round one's light-ground alphas and gained a lit-face matrix; part B mounted
the home arc's five real media-less chapters, unlit beside lit, with the placement error as a fourth
candidate, both drifts side by side and the grain honest at 1x and 2x; part C gained two cadence
knobs; part E carries the doctrine in `design-system.md`'s own shape, so the ruling is a paste,
beside a board-wide Rest switch. Nine asks, two assets, eight departures.

## Handoff (round 3)

- Head: the board's content is `08b97fa`, this manifest on top; pushed to
  partyreel-git-lp-light-partyreel.vercel.app. The board is `/design/c/light?key=...`; five anchors,
  `#lgt-a` .. `#lgt-e`, and the index at the top of the board links each of the eight calls to the
  part that argues it.
- **The alias is refreshed: it serves the head, and the review-blocking gap is closed.** The
  read-only review of `97602076` was right that the alias was pinned four commits back at `e108ec4`
  (the Vercel `api-deployments-free-per-day` cap, not the lane), so the board Will would have opened
  was missing part E's drive paragraph and the engine's one-line paste, the corrected canvas
  heights, the drive reaching the middle and the room, the seam's knob note and the meter's
  hidden-tab guard, while part B on that same build told him to press the drive toggle. Deployments
  freed up and a forced deploy was taken at this head; the served board is verified below, not
  assumed. Nothing about the fixes changed, only where they are readable.
- **What the review asked to re-check on the real thing, checked there.** The two corrected canvas
  heights were arrived at by measurement the last handoff called unreliable on a zoomed stage, so
  they were re-measured on a rendered board rather than trusted: the honest instrument is a leaf
  text node's own rect against the canvas's rect (both in the same post-zoom space), not
  `scrollHeight` against `clientHeight`. At 1440 the lit-face matrix is 870px with its lowest text
  46px clear of the bottom; at 375 it is 1370px with 27px clear. All 13 stages on both canvases have
  positive headroom, and the document has zero horizontal overflow on either. The drive toggle now
  moves three of the four lights (`[data-glw-drive]` flips mask to transform on the aurora, the
  middle and the room); the fourth is the seam, and that is deliberate, which is the first defect
  below.
- Synced with `launch-prep` at `dd4aa0b` (72 commits, all of them other tracks' lab lanes and their
  manifests: nothing in this lane and nothing in its `reads`). Merged clean at `74d96e1`.
- Gates on the synced tree, re-run after the review fixes: typecheck ok, lint ok (0 errors, 0
  findings in the lane; 6 pre-existing warnings elsewhere), test ok (1719 in 193 files), build ok
  (248 static pages, 114 routes).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/light.md` +
  `src/app/(dev)/design/sandbox/light/{aurora,beats,board,candidates,depth,doctrine,shared}` and
  `board.css`. No exceptions, no production byte: the board composes `<Glow>`, imports five
  marketing sections read-only, and everything it proposes lives in its own sheet under `lgt-` or in
  `candidates.ts` as a string.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **What round three changed, and why (the walk, taken cold, in Will's order).**
  - **The calls are at the top and on every part.** Nine asks lived only in the meta panel at the
    bottom of 17,000px. There are eight now, each answered in one word, the first of them the whole
    board (part E as pasted), and they are printed three times from one array: an index at the top
    that links each to its part, a line under each part's heading, and the panel. A reviewer now
    knows what he is being asked before the first stage rather than after the last.
  - **Every knob carries its name, and says what it does.** Part B had four unlabelled toggles in a
    row ("Accent | Identity" beside "House five | Warm | Cool"), which is the first thing a stranger
    stumbles over, and the prose that explained them sat below the stage, read after the control is
    pressed. Each toggle has its label; a line under them says what the current register and
    temperature mean; and the seam says why the register and grain knobs do not move it.
  - **The aurora is judged against the chapter it touches.** Round two printed the chapter unlit
    above and lit below, 800px apart, which asks the eye to carry a field this quiet across a
    scroll. One stage now, with a wipe: unlit left of the handle, lit right of it, everything else
    identical. It is the sharpest thing on the board and it cost 800px rather than adding them. The
    grain row took the same treatment.
  - **The cost is measured, not asserted.** A new block at the end of part B prints what is actually
    on the screen, read off the specimen (2 lamps, 6 painted layers, each field 1517 by 359 css px
    at 1:1 under `url(#glw-warp) blur(38px)`), and a Measure button runs three 1.8s samples on that
    chapter with every other lamp on the board hidden: no lamp, the aurora as built, the aurora on
    the transform drive. Measured here at `e108ec4` on the preview in headless Chrome: 16.7ms mean
    and 0 frames over 17ms in all three, which says the field is inside budget on that machine and
    nothing about the raster a frame gap cannot see. The caption says exactly that, and the meter
    says when the tab was behind something while it ran.
  - **The drive is now part of the aurora's definition, and it carries a law 4 defect.** The engine
    has two drives and the doctrine never said which a field takes; globals.css calls `transform`
    "the cheap one" and `mask` "repainting every frame", which at chapter scale is two filtered
    layers of about 1500 by 360. Moving the field to the cheap drive takes one line of the engine
    with it: `glw-drift-x` runs from `translate: 32% 0`, so its unanimated state is translate 0, the
    comet parked dead centre at full strength, which is exactly the inversion the mask drive had
    fixed when its resting `mask-position` moved to its own from-keyframe. Nobody has seen it
    because no shipped lamp uses that drive. The one line is a paste in part E.
  - **The paper five can be compared.** Three tints stacked 900px apart cannot be: by the time the
    third is on the screen the first is a memory. They are a three-up row now, with the proposal
    printed full width under them.
  - **Part E can be scanned.** Nine pastes at full height were 6,300px, more than a third of the
    board. Each opens on its first six lines with a Read all button and a Copy that always takes the
    whole block. Part E went 6,300px to 3,100 and the whole board 17,064 to about 13,700.
  - **One candidate withdrawn, two lights renamed.** "Replace" is cut from the meta panel with its
    reason on the board: the half of it that survived two rounds of specimens is on the board as
    options (the identity register, the room), and the half that did not was never built. Part B's
    four lights led with the seam and lettered A to D, which reads as a ranking that ranks the
    proposal third; the aurora is first now and the other two are named as what they are, the
    placement error and the engine's warning, because only two of the four were ever candidates.
  - **A clipped row, found by the cold walk.** The lit-face matrix, the stage that carries the
    "material, not elevation" proposal, was 780px at 1440 against 856px of content and 1180 against
    1363 at 375: the plate's row and its label were cut off the bottom on both canvases, through two
    rounds of QA. ★ The reason it survived: a stage carries `zoom`, and Chrome reports
    `scrollHeight` and `clientHeight` on a zoomed element in different spaces, so the obvious check
    reports a constant phantom overflow that does not move when the height does. The honest measures
    are a child's own rect divided by the computed zoom, and, sharper, whether any text sits below
    the stage's bottom. Both canvases are re-measured and nothing is cut at 1440 or 375.
  - **The floating board's ruling is folded in rather than asked twice.** Its contract's fifth line
    ("the light in dark: lighter is closer, a soft shadow, or a lit edge") is part A's middle subject
    with the same three columns, so part A says so and part E's elevation block says bible 15
    inherits the ruling.
  - **Two knobs stopped promising what the page does not do** (found by the walk below, after the
    review). The seam's knob note exempted the register and grain knobs but not the DRIVE, and the
    seam is the one light of the four that does not take it: it is the footer's lamp verbatim, so a
    re-tuned drive would make it a different candidate wearing its name. Pressing Transform on the
    seam did nothing, with no line saying why, which is precisely the stumble this round exists to
    remove; the note names all three knobs now and says the other three lights do take the toggle.
    And the lit face's walk line sent a reviewer to the demo guest page, where the block CANNOT
    land: the tuner island that renders an applied candidate mounts in `(app)`,
    `(marketing)/(cinema)`, `(marketing)/(paper)` and `(dev)/design`, and the `(guest)` group has
    none, so no board's candidate reaches `/e/[token]` at all. That page is off the line with the
    reason written beside it in `candidates.ts`; the island gap itself is the Orchestrator's, below.
- Light QA at the head. The board on the served preview and on a local dev server in this worktree,
  and the four applied blocks on the running app.
  - 1440: all 13 stages, no horizontal overflow on the document, no stage overflowing its canvas,
    and no text below any stage's bottom edge (the tightest is the lit-face matrix at 46px clear).
    The five real chapters mount and their reveal grammar fires on scroll.
  - 375: every stage measures exactly 375 css px, nothing cut on any of them (the lit-face matrix at
    1370px clears by 27px), the paper row stacks to one column and part A pairs its cues two by two.
  - Reduced motion: the board-wide Rest switch computes `animation-name: none` on all of the bands
    at once and is reversible (back on Live they compute `glw-mask-x` again, so the switch is the
    cause and not a stuck state; the machine's own `prefers-reduced-motion` is false, which is what
    makes that a real test). The board's one keyframe stays inside the
    `prefers-reduced-motion: no-preference` block.
  - The drive toggle, per light: mask to transform on the aurora, the middle and the room; the seam
    stays on mask by design, now said out loud on the stage.
  - **The four "Apply to the site" blocks, walked on the pages each one names** (this is round three
    goal item 1, which the reviewed handoff reported only for the board itself). All with `?key=`,
    which is required: without it no page mounts the tuner island and no block lands, and that is
    the gate working rather than a defect. The blocks themselves are byte-identical to round two
    (the round's only change to `candidates.ts` is `ENGINE_DRIVE_FIX`, which is deliberately not an
    Apply candidate), so this re-walk confirms round two's live pass rather than replacing it.
    - The control is a radio across the board and behaves as one: four buttons, exactly one reads
      "Applied to the site" at any time, applying a second clears the first, and the board's banner
      clears the store (`partyreel.tuner.candidate.v1` back to null).
    - The shadow family on `/pricing`, `/help`, `/contact` and `/design/compositions`:
      `--shadow-lift` resolves the dark ramp (`0 2px 4px -1px oklch(0 0 0 / 0.45), 0 4px 8px -2px
      oklch(0 0 0 / 0.55)`), `--shadow-float` stays the invisible zero on the dark root and on
      `.surface-ink`, and `.surface-paper` keeps today's shipped `0.06 / 0.1`, so paper does not
      move. The 13 real event cards take the dark lift with the tile radius intact at 3px, and the
      nav viewport takes the float as `--tw-shadow` (`0.5 / 0.62`) while keeping its ring.
    - The lit face on `/`, `/features/qr` and `/features/album`: the gallery canvas and the QR hero
      plate both gain the inset hairline with the outer ring surviving, and the album page carries
      it on three plates, one of them on paper and taking the paper variant.
    - The aurora register on `/`, `/pricing`, `/help` and `/contact`: `--spill-cadence` stays 11s
      (untouched, which is the contract), `--aurora-cadence` resolves to `calc(11s * 3)`, the footer
      seam keeps `--glw-dur: 11s` because a lamp keeps the lamp's clock, and the register reaches it
      (`--glw-base: 0.3`, `--glw-blur: 38px`). `/contact`'s lamp reads 0.52 / 0.24, which is the
      block's own `.surface-paper` rule and not a miss: that lamp is inside `.surface-paper`.
    - The paper five on `/`, `/pricing`, `/help` and `/contact`: `.surface-paper` takes
      `--lamp-1: oklch(0.88 0.085 25)` and the root five are untouched.
    - No page in the walk gained horizontal overflow under any block.
  - Not walked, and why: `/dashboard` and a host event page redirect to `/login` on localhost, since
    sign-in is not in any local allow-list by design. They are the two surfaces round two verified
    live on the preview at `471b8db` (same bytes), and `/design/compositions` carries the same real
    `EventCard` at 13 instances, which is the honest local stand-in for the dashboard's cards.
  - The launch-prep alias, walked as goal item 1 asks: it serves a board that PREDATES round two.
    Round two is genuinely merged there (`6203d62` is an ancestor of `origin/launch-prep`, and that
    tree's `shared.tsx` contains "Apply to the site"), but the served HTML is 178,543 bytes with no
    Apply button, no `#lgt-e` and a lede still reading "Four parts". That is the on-request preview
    policy doing what it says, not a lost merge: nothing has pushed `[preview]` on launch-prep since
    before this board's round two landed. It is listed for the Orchestrator below.
- Assets requested from Will (unchanged from round two, both still standing):
  - A grain tile, so the aurora stops banding · seamless monochrome noise, 256x256, PNG-8, fine
    grain (one tile pixel), neutral, mean 50 percent grey, used at about 5 percent over the light
    AND laid out at 128 CSS px on a 2x screen (one tile pixel per device pixel; laid out at 256 it
    doubles and the band returns) · replaces the inline feTurbulence stand-in in `board.css`
    (`[data-lgt-grain]`).
  - A worst-case pair of overlapping photographs for part A · two images whose touching edges are
    both dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG ·
    replaces the `reception-hall` + `wedding-toast` pair in `depth.tsx`.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will). The first
  is the whole board; the seven under it are the individual calls inside it, so only the ones Will
  wants to differ on need an answer:
  - Part E, as pasted: land it, or name what to change
  - Depth in dark: the family (lift and float), lift only, or neither
  - The lit face: adopt, adapt or drop
  - The aurora: no, the seam, both boundaries, or the room
  - Its register: accent or identity
  - The paper five: hand-tuned, the flat row, or the dark set
  - The cadence: 8s or 11s
  - The publish beat: 300 as shipped, the house five, or 305
- Look at first: part B's wipe, on the guest ledger at accent on cinema. Drag it once and the
  whole proposal is in one frame: the chapter exactly as it ships on the left of the handle, the
  aurora at both boundaries on the right of it, the copy in the clean middle of both. Then press
  Measure under it. Then part A's stacked photographs, and part E, which is the ruling with no
  translation left in it.
- For the Orchestrator: `touchpoints.ts` still describes this board as "Four parts" and it has been
  five since round two; the description is yours to rename at integration, I did not touch the file.
  Findings against a bible rule: none (10 and 11 are already under exploration naming this board),
  but four cross-board notes. (1) The floating-surfaces contract's fifth line is this board's part A
  question for one family: one ruling should close both, and part E says so. (2) All three palette
  candidates re-declare `--shadow-float` zeroed on the dark grounds; whichever ramp is ruled here,
  the palette block inherits it, and the two should land in one pass rather than overwrite each
  other. (3) ★ **No board's "Apply to the site" candidate can reach a guest page.** The island that
  renders an applied block mounts in `(app)`, `(marketing)/(cinema)`, `(marketing)/(paper)` and
  `(dev)/design`; `(guest)` has none, so `/e/[token]` silently ignores every block every board
  applies. It is a lab-coverage gap rather than a bug in any candidate, and the guest gallery is one
  of the better real surfaces for a media cue (the demo page carries 18 real tiles), so it is worth
  one line in `(guest)/layout.tsx` at some point. That file is production and outside this lane, so
  this track dropped the page from the lit face's walk line instead of reaching for it. (4) The
  launch-prep alias serves a build older than this board's round two (no Apply button, lede still
  "Four parts"), because nothing has pushed `[preview]` on launch-prep since before round two
  landed. Any walk that expects the integrated board there needs one `[preview]` push first.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Two rounds turned the light board from an
argument into a ruling. Round two made every claim wearable: four candidates became pastes in one
source (`candidates.ts`), each with an Apply to the site button handing the whole site the exact
block a ruling would land (the shadow family on the primitives and the dashboard's real event cards,
the lit face on media frames, screens and plates, the aurora's register with a sibling clock, a
hand-tuned paper five), and part B mounted the home arc's five real media-less chapters instead of a
specimen built to suit the proposal. Round three walked the board the way Will would and rebuilt
what a stranger stumbles on: eight calls, each a one word answer, indexed at the top and named on
every part from one array; every knob labelled and explaining its own setting; the aurora judged
through a wipe that puts the unlit chapter and the lit one in a single frame; the field's cost
measured on the machine reading it, which turned into a doctrine line (the field takes the cheap
transform drive) and a law 4 defect nobody had seen (that drive's rest state is the comet at full
strength); the paper five made comparable in a three-up row; part E collapsed from 6,300px to 3,100;
one candidate withdrawn with its reason; and a clipped stage found at last, the lit-face matrix
cutting off the label that carries its own proposal, hidden for two rounds by a zoomed stage
misreporting its own overflow. The board went 17,064px to about 13,700 and reads shorter than that.
