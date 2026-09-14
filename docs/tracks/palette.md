---
track: palette
status: integrated
cut: "6c19d84"
merged: "bf1a6ef"      # the branch head merged into launch-prep
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/palette/
reads:
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/sandbox/variant-frame.tsx
  - src/app/(dev)/design/sandbox/glow-lab-shared.tsx
  - src/components/shared/glow.tsx
  - src/components/shared/logo.tsx
  - src/components/marketing/frames/phone-frame.tsx
  - src/components/marketing/frames/gallery-frame.tsx
---

# lp/palette

**Goal.** The palette exploration of the review wave (Will's rule-by-rule review of the bible, 2026-09-14). Bible 1 is under exploration: the achromatic ramp between black and white in both modes (Will: the greys feel off; achromatic, not grayscale, is the intent), the accent's role (state, and UI colour where there is no media), and the muted panel as a real register. The board proposes three token blocks Will can rule between; the ruling lands in `globals.css` and `theme.css` through the Orchestrator. Lab only: no production byte changes on this track.
**Rulings in force.** The bible on `/design/rules` (second edition), rule 1 as rewritten: achromatic UI with one accent, the media is the color, and where there is no media the accent carries state and UI color and marketing may carry color of its own. Rule 3 stands (the five lamp hues are light, never UI). Rule 2 as rewritten: marketing may be louder in most things; only the tokens are shared by law.
**Verify on.** `/design/c/palette?key=` on your preview at 1440 and 375, reduced motion honoured; the gate green.

## The brief

### The question

What would the perfect neutral ramp be if none of today's greys existed, in light and in dark; what is the accent for, and which hue; and is the set-apart panel a token or an alpha trick?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **The light ramp** (`src/app/globals.css:97-114`, `:root, .surface-paper`): `0.13` (fg, primary) · `0.3`
  (ring) · `0.45` (muted-fg) · `0.905` (border, input) · `0.96` (secondary, accent) · `0.965` (muted) ·
  `0.99` (bg) · `0.997` (card, popover); charts at 0.269 to 0.87. Every value chroma 0. **A 0.455 hole
  between 0.45 and 0.905**, which is why the panel is an alpha fraction (`bg-muted/40`) and not a step.
- **The dark ramp** (`:236-253`, `.dark`): bg `0.14` · card `oklch(0.21 0 0 / 0.62)` (the one translucent
  surface) · popover `0.23` · muted `0.245` · secondary and accent `0.25` · muted-fg `0.71` · ring `0.85`
  · fg `0.96`; `--border: oklch(1 0 0 / 12%)`, `--input: oklch(1 0 0 / 15%)` (alphas of white). **Four
  semantic surfaces crushed into 0.14 to 0.25**; muted, accent and secondary are indistinguishable.
- **Three darks ship:** the cinema skin deepens only `--background` to `0.11`
  (`src/app/(marketing)/marketing.css:1635-1648`; `--card`, `--popover`, `--muted` keep the app's values,
  so on cinema the card-to-ground gap grows while the surface steps stay crushed); the app's dark is
  `0.14`; `--gallery` is `0.155` (`globals.css:193-197`, identical in both themes, never overridden in
  `.dark`) and `.surface-ink` (`:299-312`) builds on it (no `--card`, `--popover`, `--secondary`,
  `--accent`, `--input`: ink cannot host a Card or a menu today).
- **No accent hue exists.** `--brand` aliases `--primary` (ink) in all three sets (`globals.css:171-172`,
  `:263-264`, `:307-308`); `theme.css:33-36` keeps it a token "so any future accent decision is a two-line
  change, never a sweep"; `docs/systems/design-system.md` "The identity" left the door open for a lab
  round. The state colours are `globals.css:174-186` (light) and `:266-274` (dark): success 150, warning
  80/82, like 15, destructive 27/22; `--save` (blue 252) and `--reel` (violet 300) are the two existing
  NON-state action hues, icon-only. `BRAND_HEX` for OG/satori is ink `#101010` (`src/lib/constants/site.ts`).
- **The ~24 real `--brand` call sites** are the "no media but still beautiful" surfaces: the logo mark
  (`src/components/shared/logo.tsx:35`, "the single splash of --brand accent allowed"), the notification
  badge and dots (`src/components/app/notification-bell.tsx:60,85`; `admin/operator-alerts.tsx:64`),
  the wizard's active step (`app/create-event-wizard.tsx:141,282`), the welcome carousel dot
  (`welcome-flow.tsx:98`), the QR preset pick (`qr-preset-picker.tsx:53,64`), the 404 eyebrow
  (`shared/not-found-screen.tsx:53`), the MDX callout (`mdx/spec-shared.tsx:285-286`), and the whole
  `src/components/marketing/frames/*` family (`phone-frame.tsx:56-79`, `gallery-frame.tsx:29-39`,
  `album-frame.tsx:36`, `qr-frame.tsx:34`): wireframe abstractions standing in for media.
- **The muted panel** ships at three alphas across seventeen sites: `/40` (`(paper)/contact/page.tsx:166`,
  `careers/[slug]/page.tsx:196`, `help/page.tsx:189`, `legal-blocks.tsx:120`, `zip-modal-demo.tsx:118`,
  `help-facts-band.tsx:65`, ...), `/30` (`help/page.tsx:218`, `help/[slug]/page.tsx:354`), `/50`
  (`contact-form.tsx:54`, `role-listings.tsx:98`). On paper `/40` over `0.99` is about `0.980`: a 1% step.
  Bible 16 (rewritten) names it the fourth ground.
- **Rings are a parallel elevation system nobody wrote down:** `ring-1 ring-foreground/5` (37 uses),
  `ring-white/70` (28), `ring-1 ring-foreground/10` (12). The `light` board owns depth; know it exists.
- **Achromatic vs monochromatic** is already in code: the ACCENT BLOCK at `marketing.css:1611-1625`
  ("ACHROMATIC base, not monochromatic: occasional tasteful color accents for status feedback and life,
  never a brand hue"). The `light` board owns the lamps and the aurora; this board owns the ramp, the
  accent and the panel.

### The board

Today's ramp beside three candidate ramps, rendered on real sections (a marketing chapter with cards,
the app's dashboard cards, a menu over a card, the footer) on cinema, paper and ink, at 1440 and 375,
in both modes. The candidates span the range: one that fills the light middle and gives the dark
ladder real steps; one that settles the three darks into one or names why there are three; one that
questions the zero-chroma premise (a 0.002 to 0.004 warm tint was declined once and left for a lab
round; show it, flagged). The accent: shown as a hue on the brand call sites above beside the ink
alias (the existing blue 252, and a new hue if the perfect version wants one), with the state colours
beside it so the two never collide. The panel: one token at one value on the sites above. Each
candidate is a token block (`:root`, `.dark`, `.surface-ink`, the cinema `--background`) Will can rule
between and the Orchestrator can paste into `globals.css`; the board's meta panel ends in the asks:
the ramp (A, B, C or today's), the accent (yes or no, and which hue), the panel (one value), one dark
ground or three.
### The deliverable

The board, plus the three token blocks written in the Record so the ruling is a paste, not a rewrite. Read `globals.css`, `theme.css`, `marketing.css`; change none of them (the ruling lands through the Orchestrator).

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

- The lab bucket: a board's own chrome must key off the browser, not the stage's viewport toggle; a
  Stage's canvas is not a breakpoint context in either direction.
- The lab bucket: the Chrome tooling returns a flat black screenshot of any lab page scrolled past
  the fold, so a board is read by moving the content under a scroll position of zero (a negative body
  margin) or by measuring the DOM; a board that looks blank in a screenshot is not broken.

## Handoff (replaces the chat report)

- Head: the tip of `lp/palette`, pushed. The last commit touching the board is `703a227`; the commits
  after it are the unused-import sweep and this manifest. Preview
  `partyreel-git-lp-palette-partyreel.vercel.app`, board at `/design/c/palette?key=`
- Synced with `launch-prep` at `7d389d4` (twice: `8b06f89` first, then `7d389d4` when media-kit
  folded; the earlier tip `ff2de13` carried a YAML break in `docs/tracks/orchestrator.md`'s
  frontmatter that failed `track-manifests.test.ts`, fixed on the branch before this sync)
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 7 warnings, all pre-existing and none in
  this lane), test ok (1697 in 193 files), build ok (247 static pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` and the
  five files under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `board.css`, `ramps.ts`,
  `sections.tsx`, `call-sites.tsx`). No exceptions. No production byte changed: `globals.css`,
  `theme.css` and `marketing.css` were read and not touched.
- Light QA on the preview, measured rather than eyeballed: at 1440 the ladder and the rooms strip lay
  out four across (239 px and 236 px), at 375 they stack (343 px and 164 px), no horizontal scroll at
  either width, all nine stages hold their canvas with zero overflow, no element on the page renders
  in a mono stack, and no animation runs on the board (the one colour fade on the token wrapper lives
  inside `prefers-reduced-motion: no-preference`, so a reduced-motion reader gets the jump cut and
  the same composition).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. The ruling's own paste needs one
  line per candidate in `theme.css`'s `@theme inline` block (`--color-faint: var(--faint);`) before a
  `text-faint` utility exists; the board reaches the token with an arbitrary value.
- Assets requested from Will:
  - **Four hard cases inside the kit the `media-kit` track already asked for** (its 36 masters
    replace all twelve stand-ins by id, so this is a line on that shot list, not a second delivery)
    · one high key (a white dress against a white wall), one low key (a dance floor lit by one lamp),
    one candle-warm, one stage-cool; four of the 36 at 1600 px long edge, landscape, one grade
    · replaces the four this board renders (`wedding-golden`, `party-balloons`, `concert-confetti`,
    `reception-table`)
  - Why a palette board needs them: a ramp is only ever wrong against media that fights it, and all
    four stand-ins here are mid-key and warm, so the light end of every candidate is going untested.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will):
  1. The ramp: A, B or C, or today's, in both modes.
  2. The accent: which hue (ink today, blue 252, violet 300, flare 330), and which of its three jobs
     it takes (identity, attention, the stand-in for media).
  3. The panel: one token at full strength, retiring the six alphas it ships at, and hover fills
     moving to --secondary.
  4. The dark grounds: three steps of one ladder (A and C) or one room for cinema, the app, ink and
     the canvas (B).
  5. The missing step: --faint enters the token set (all three candidates add it) or the 37
     alpha-dimmed text sites stay as they are.
- The departures, verbatim from BoardMeta:
  1. C re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point, and
     saturating the neutrals was consciously declined. C is that decision re-argued at 0.003 to 0.008
     chroma, on the board rather than in a comment.
  2. A and C make the dark card opaque, retiring the system's one translucent surface. Only B keeps a
     veil, and only in B does a card over a photograph read as glass.
  3. B deletes the cinema override in marketing.css, the skin block's only surface value. The
     cinema-to-footer seam then belongs entirely to light, which is the light board's lane.
  4. A finding against bible 16, which names four grounds. There are five: the media canvas is a
     ground of its own and it is doing a job ink cannot, since a lightbox wants the deepest surface in
     the product and a footer leaf wants a slab that reads on paper. Today one token, --gallery, is
     both. A and C separate them (canvas 0.09, ink 0.185); B answers the other way and makes every
     dark surface one room. Either way rule 16 is counting wrong, and that is Will's to rule, not a
     value to tune.
  5. All three candidates complete .surface-ink (no --card, --popover, --secondary, --accent or
     --input ships today), so an ink leaf can finally host a card and a menu.
  6. Each candidate adds one custom property, --faint, which needs one line in theme.css's
     @theme inline block before a text-faint utility exists. The board reaches it with an arbitrary
     value.
- Look at first: row 01, the four rulers, with the ladder tables under them. Today's light column
  reads 0.997, 0.997, 0.990, 0.965, 0.960, 0.905, none, 0.450, 0.130: five surfaces inside 0.037,
  then a 0.455 fall to the first text step, with nothing in between. Today's dark column reads 0.140,
  0.245, 0.210, 0.230, 0.250: the panel is LIGHTER than the card and the menu, which is the ladder
  upside down. Then row 06 with the ramp toggle: the same five surfaces under Today and under A, one
  flip apart. Then row 07, where a Card on the ink leaf is near white because `.surface-ink` has no
  `--card`. Row 09's accent toggle is the other half of the ruling, and the hues are meant to be
  judged against the state row under the wall, not on their own.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The palette exploration of the review wave put
bible 1 on a board: today's twenty-one hand-picked values beside three complete candidate token sets,
each a paste for `:root`, `.dark`, the gallery canvas, `.surface-ink` and the cinema ground. A (one
ladder) keeps the philosophy and fixes the spacing, B (one room) derives every surface from one
ground per mode and collapses the three darks into one, C (film stock) is A's spacing at 0.003 to
0.008 warm chroma, which re-opens a decision `globals.css` records as closed. They are judged on real
sections built from production components, at 1440 and 375, against a ruler that interpolates in
oklab so a tick's position is its lightness. The findings: the light middle is empty and the 20
`text-muted-foreground/70` sites composite to exactly the missing step; the dark panel ships lighter
than the card it sits in; `.surface-ink` has no `--card`, so a card in the footer is near white; and
`--gallery` is doing two jobs, which makes bible 16's four grounds five. The accent is argued by the
job it does rather than by taste. Lab only: no production byte changed.

## The three token blocks (the paste)

The ruling is a candidate letter; these are what lands. Each block is generated by the board itself
(`tokenBlock()` in `ramps.ts`), so what is written here is what row 10 renders. `--faint` is new in
all three and needs one line in `theme.css`'s `@theme inline` block (`--color-faint: var(--faint);`)
before a `text-faint` utility exists.

### A. One ladder

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.977 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.998 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(0.998 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.145 0 0);
  --primary-foreground: oklch(0.998 0 0);
  --secondary: oklch(0.925 0 0);
  --secondary-foreground: oklch(0.145 0 0);
  --muted: oklch(0.948 0 0);
  --muted-foreground: oklch(0.46 0 0);
  --faint: oklch(0.62 0 0);
  --accent: oklch(0.925 0 0);
  --accent-foreground: oklch(0.145 0 0);
  --border: oklch(0.89 0 0);
  --input: oklch(0.89 0 0);
  --ring: oklch(0.3 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.955 0 0);
  --card: oklch(0.235 0 0);
  --card-foreground: oklch(0.955 0 0);
  --popover: oklch(0.285 0 0);
  --popover-foreground: oklch(0.955 0 0);
  --primary: oklch(0.955 0 0);
  --primary-foreground: oklch(0.145 0 0);
  --secondary: oklch(0.325 0 0);
  --secondary-foreground: oklch(0.955 0 0);
  --muted: oklch(0.195 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --faint: oklch(0.55 0 0);
  --accent: oklch(0.325 0 0);
  --accent-foreground: oklch(0.955 0 0);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.85 0 0);
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.09 0 0);
  --gallery-foreground: oklch(0.965 0 0);
  --gallery-muted: oklch(0.62 0 0);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.185 0 0);
  --foreground: oklch(0.965 0 0);
  --card: oklch(0.235 0 0);
  --card-foreground: oklch(0.965 0 0);
  --popover: oklch(0.285 0 0);
  --popover-foreground: oklch(0.965 0 0);
  --secondary: oklch(0.325 0 0);
  --secondary-foreground: oklch(0.965 0 0);
  --accent: oklch(0.325 0 0);
  --accent-foreground: oklch(0.965 0 0);
  --muted: oklch(0.235 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --faint: oklch(0.55 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 14%);
  --ring: oklch(0.965 0 0);
  --primary: oklch(0.965 0 0);
  --primary-foreground: oklch(0.185 0 0);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.105 0 0);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.105 0 0);
}
```

### B. One room

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.14 0 0);
  --card: oklch(0.99 0 0);
  --card-foreground: oklch(0.14 0 0);
  --popover: oklch(0.998 0 0);
  --popover-foreground: oklch(0.14 0 0);
  --primary: oklch(0.14 0 0);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: color-mix(in oklab, var(--foreground) 9%, var(--background));
  --secondary-foreground: oklch(0.14 0 0);
  --muted: color-mix(in oklab, var(--foreground) 5%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 62%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 45%, var(--background));
  --accent: color-mix(in oklab, var(--foreground) 9%, var(--background));
  --accent-foreground: oklch(0.14 0 0);
  --border: color-mix(in oklab, var(--foreground) 13%, var(--background));
  --input: color-mix(in oklab, var(--foreground) 17%, var(--background));
  --ring: color-mix(in oklab, var(--foreground) 80%, var(--background));
}

.dark {
  --background: oklch(0.125 0 0);
  --foreground: oklch(0.96 0 0);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0 0);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0 0);
  --primary: oklch(0.96 0 0);
  --primary-foreground: oklch(0.125 0 0);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0 0);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0 0);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.125 0 0);
  --gallery-foreground: oklch(0.96 0 0);
  --gallery-muted: oklch(0.62 0 0);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.125 0 0);
  --foreground: oklch(0.96 0 0);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0 0);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0 0);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0 0);
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0 0);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
  --primary: oklch(0.96 0 0);
  --primary-foreground: oklch(0.125 0 0);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.125 0 0);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.125 0 0);
}
```

### C. Film stock

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.977 0.004 85);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.998 0.003 85);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(0.998 0.003 85);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.145 0 0);
  --primary-foreground: oklch(0.998 0.003 85);
  --secondary: oklch(0.925 0.006 85);
  --secondary-foreground: oklch(0.145 0 0);
  --muted: oklch(0.948 0.005 85);
  --muted-foreground: oklch(0.46 0 0);
  --faint: oklch(0.62 0 0);
  --accent: oklch(0.925 0.006 85);
  --accent-foreground: oklch(0.145 0 0);
  --border: oklch(0.89 0.007 85);
  --input: oklch(0.89 0.007 85);
  --ring: oklch(0.3 0 0);
}

.dark {
  --background: oklch(0.145 0.005 60);
  --foreground: oklch(0.955 0.002 85);
  --card: oklch(0.235 0.006 60);
  --card-foreground: oklch(0.955 0.002 85);
  --popover: oklch(0.285 0.007 60);
  --popover-foreground: oklch(0.955 0.002 85);
  --primary: oklch(0.955 0.002 85);
  --primary-foreground: oklch(0.145 0.005 60);
  --secondary: oklch(0.325 0.008 60);
  --secondary-foreground: oklch(0.955 0.002 85);
  --muted: oklch(0.195 0.006 60);
  --muted-foreground: oklch(0.7 0.004 70);
  --faint: oklch(0.55 0.004 70);
  --accent: oklch(0.325 0.008 60);
  --accent-foreground: oklch(0.955 0.002 85);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.85 0 0);
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.09 0.004 60);
  --gallery-foreground: oklch(0.965 0.002 85);
  --gallery-muted: oklch(0.62 0.004 70);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.185 0.006 60);
  --foreground: oklch(0.965 0.002 85);
  --card: oklch(0.235 0.006 60);
  --card-foreground: oklch(0.965 0.002 85);
  --popover: oklch(0.285 0.007 60);
  --popover-foreground: oklch(0.965 0.002 85);
  --secondary: oklch(0.325 0.008 60);
  --secondary-foreground: oklch(0.965 0.002 85);
  --accent: oklch(0.325 0.008 60);
  --accent-foreground: oklch(0.965 0.002 85);
  --muted: oklch(0.235 0.006 60);
  --muted-foreground: oklch(0.7 0.004 70);
  --faint: oklch(0.55 0.004 70);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 14%);
  --ring: oklch(0.965 0.002 85);
  --primary: oklch(0.965 0.002 85);
  --primary-foreground: oklch(0.185 0.006 60);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.105 0.004 60);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.105 0.004 60);
}
```
