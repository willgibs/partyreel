---
track: palette
status: handed-off
cut: "4e52287"
merged_round_2: "499a1ad"
merged_round_1: "bf1a6ef"
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

**Round 2 (the goal).** The board proved the ramp is wrong in ways a ruler shows; now make it a
surface Will can rule from a walk. (1) **Apply to the site**: each candidate's full token block
(`tokenBlock()` already generates it) behind an "Apply A / B / C to the site" button, with the pages
to walk listed, so the ramp is judged on the real home arc, `/pricing`, `/help`, `/contact`, the
dashboard and the demo guest page, in both modes, rather than on stages alone. (2) **Widen the
judged surfaces on the board** to the ones that broke in round 1 and the ones the site is made of: a
real dark app composition (the dashboard's cards and an event page's stat band, from production
components), the guest page's tile grid on the canvas, the footer leaf hosting a card and a menu
(`.surface-ink` completed), a state row under every ramp in both modes, real copy at every text step
including `--faint`. (3) **Depth with the ramp**: the light spec (`docs/specs/light.md`) proposes one
shadow family with an alpha ramp per ground and names the ring lift; render each candidate with those
cues on the stacked and floating specimens, so the ramp and the depth cue are judged together (they
fail together). (4) **The five-grounds finding** as an explicit row with both answers rendered (one
`--gallery` doing two jobs against a split canvas and slab). (5) **The accent by job**, each of the
three jobs on its real call sites (the logo mark, the wizard step, the notification badge, the frames
family) at every candidate hue, the state row beside, in both modes. (6) Every stage on the phone
canvas. (7) The asks reduced to one-word answers. Keep the oklab ruler; it is the board's best idea.

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

- none (lab only; the findings above are the Orchestrator's to fold at the ruling)

## Deferred (ROADMAP one-liners, bucket named)

- The lab bucket: a board's own chrome must key off the browser, not the stage's viewport toggle; a
  Stage's canvas is not a breakpoint context in either direction.
- The lab bucket: the Chrome tooling returns a flat black screenshot of any lab page scrolled past
  the fold, so a board is read by moving the content under a scroll position of zero (a negative body
  margin) or by measuring the DOM; a board that looks blank in a screenshot is not broken.
- The lab bucket (round 2): the lab shell's nav is a Suspense boundary that does not resolve while
  `document.hidden`, so a board read in a driven background tab lays out inside the 232px sidebar
  cell and every measurement off it is wrong; read a lab page in a foreground tab or by the DOM.
- The lab bucket (round 2): `src/app/(guest)/layout.tsx` mounts no design island, so a board's
  "Apply to the site" block cannot reach `/e/[qr_token]`; one `<AppDesignIsland />` fixes it.
- The design-system bucket (round 2): the lightbox backdrop is a literal `bg-black/90`
  (`media-lightbox.tsx:617`), not the canvas token, so the deepest surface in the product moves with
  nothing; fold it into whatever the grounds ruling says.

## Handoff (round 1)

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

## Record (round 1)

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

## Handoff (round 2)

- Head: the tip of `lp/palette`, pushed, and the preview alias serves THE HEAD'S BOARD. The alias
  `partyreel-git-lp-palette-partyreel.vercel.app` serves `b4be6a2` (deployment
  `partyreel-ka5icno5j`, READY, alias assigned), proved on the served HTML rather than on the
  deploy's existence: it carries "Today it has no --card of its own" and `break-inside-avoid` and
  no longer carries "Near white until a candidate completes the set". The tip adds only this
  manifest, so no board byte differs between `b4be6a2` and the tip. Board at
  `/design/c/palette?key=`. The round-two board is the one whose control bar carries the class
  `pal-walk-bar` (and thirteen rows with ids `#pal-01` to `#pal-13`); round one's had neither. The
  last commit touching the board is the album fix; the `4b035c1` sync merge sits between it and the
  first round-two commit.
- Synced with `launch-prep` at `4b035c1` (it had moved from the `ca952b5` cut by one docs commit,
  `docs/systems/design-system.md`; merged clean, no conflict, nothing in this lane touched).
- Gates, re-run at this head on the synced tree: typecheck ok, lint ok (0 errors, 7 warnings, all
  pre-existing and none in this lane, none in a file this track owns), test ok (1698 in 193 files),
  build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` and the six
  files under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `board.css`, `ramps.ts`,
  `sections.tsx`, `call-sites.tsx`, and the new `specimens.tsx`). No exceptions. No production byte
  changed: `globals.css`, `theme.css` and `marketing.css` were read and not touched.
- Light QA, measured rather than eyeballed, and split by where each measurement was actually taken.
  ON THE REBUILT PREVIEW, through the DOM: thirteen rows `#pal-01` to `#pal-13`, the walk bar 126
  tall, the album's twenty four tiles every one `break-inside: avoid` with an IN-FLOW image whose
  box coincides with its tile (so the fragment bug cannot come back unseen), the ink slab's computed
  background equal to the value its own caption prints under every ramp (Today 0.155, A 0.185, B
  0.125, C 0.185 at 0.006 chroma) with the card on the leaf following it, the Apply walk landing one
  `<style>` with the real selectors (`:root, .surface-paper`, `.dark`, `.surface-ink` and the accent
  block) and the badge then reading "This page wears it too", Clear removing it and leaving nothing
  in `localStorage`, zero page-level horizontal scroll under BOTH stage toggles (Desktop 1440 and
  Phone 375), zero running animations, no element in a mono stack, no em-dash in any text node.
  ON A LOCAL PRODUCTION BUILD OF THE SAME COMMIT, at the two browser widths the test browser cannot
  give (its window width is pinned at a 1120 viewport, so a 1440 and a 375 BROWSER have to be
  measured locally): the content column is 1024 wide, every row's `scroll-mt-32` clears the bar, and
  all nineteen stages hold their canvas with zero overflow at 1440 AND at 375 under all four ramps.
  The one colour fade on the token wrapper lives inside `prefers-reduced-motion: no-preference`, so
  a reduced-motion reader gets the jump cut and the same composition.
  ★ The board reads as a 232px column in a HIDDEN tab: the lab shell's nav is a Suspense boundary
  that does not resolve while `document.hidden`, so the content lands in the sidebar's grid cell.
  It is a test-tool artifact, not a defect, and it hits every board in the lab: verify a lab page in
  a FOREGROUND tab or by the DOM.
- ★ **A rate-limited push leaves the alias STALE with nothing on the branch to say so: prove the
  review surface by a marker string from the newest commit, never by the push.** The project sits
  on a 100-deployments-per-day cap (`api-deployments-free-per-day`), which the first wave of tracks
  exhausted, so the three pushes after `e440961` got "Deployment rate limited, retry in 24 hours"
  as a GitHub commit status and produced NO deployment at all. The alias went on serving `e440961`,
  which is how a read-only review came to walk a board without the three fixes below and report
  them as live defects. Recovery, for the next agent to hit this: the cap is a ROLLING window, so
  slots free a few at a time. Poll `POST api.vercel.com/v13/deployments` with
  `{"gitSource":{"type":"github","repoId":1252816746,"ref":"lp/<track>","sha":"<sha>"}}` until it
  stops answering `payment_required` (two attempts 45 seconds apart was enough here, at 22:18); the
  deployment it creates takes the branch alias on its own. Then fetch the board and grep for a
  string only the newest commit has.
- What the fix pass after the first read-only review changed: NO board byte. All three defects that
  review reported were already fixed in the tree at `b4be6a2`; what was broken was the review
  SURFACE, an alias three commits behind the branch because the quota refused every push. The pass
  rebuilt the alias at `b4be6a2`, re-ran the four gates at this head, re-measured all three fixes on
  the SERVED build instead of a local one (see Light QA above), and corrected this Handoff, which
  had claimed its QA "on the preview" when half of it was measured locally.
- Three defects caught while verifying, all fixed, all worth knowing: the guest album fragmented and
  then painted black (a CSS column will split an aspect-ratio box, and an ABSOLUTELY positioned
  child of a column item is placed against the first column fragment in Chrome, so every tile past
  column two drew its photograph on top of column one; `break-inside-avoid` plus an IN-FLOW image is
  the fix, which is what production's masonry already does); the grounds row's ink slab wore the
  SHIPPED `.surface-ink` while its caption named the candidate's value; and the accent never reached
  `.surface-ink` at all (see departure 4).
- ★ Two lab-tooling traps, for the next agent: a board read in a DRIVEN BACKGROUND tab lays out in
  the 232px sidebar cell (the lab nav is a Suspense boundary that does not resolve while
  `document.hidden`), and shifting a lab page with a negative body margin to dodge the black-
  screenshot bug perturbs the Stage's own ResizeObserver, so every stage collapses to a thumbnail
  and the screenshot lies twice. Read a lab page in a FOREGROUND tab at a normal scroll position,
  or measure the DOM.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Shell change proposed (the Orchestrator's, not this lane's): the demo guest page cannot wear a
  candidate.** `src/app/(guest)/layout.tsx` mounts no design island, so `setCandidateCss` never
  reaches `/e/[qr_token]`. One line adds it, the same `<AppDesignIsland />` the host app's layout
  mounts (it is a client island that reads `?key=` itself, so a layout that cannot await
  `searchParams` is not a problem). Until then the walk covers `/`, `/pricing`, `/help`, `/contact`,
  `/dashboard` and an event page, and the guest album is judged on the board (row 04).
- Assets requested from Will:
  - **Four hard cases inside the kit the `media-kit` track already asked for** (its 36 masters
    replace all twelve stand-ins by id, so this is a line on that shot list, not a second delivery)
    · one high key (a white dress against a white wall), one low key (a dance floor lit by one lamp),
    one candle-warm, one stage-cool; four of the 36 at 1600 px long edge, landscape, one grade
    · replaces the four this board leans on (`wedding-golden`, `party-balloons`, `concert-confetti`,
    `reception-table`)
  - **A portrait pair for the guest masonry** · two of the same 36 at 1600 px long edge, PORTRAIT,
    same grade · replaces the hand-set tile ratios in `specimens.tsx` (eleven of the twelve stand-ins
    are landscape, so the column flow the guest album actually ships is being faked)
  - Why a palette board needs them: a ramp is only ever wrong against media that fights it, and the
    stand-ins are mid-key and warm, so the light end of every candidate is going untested.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will; every one
  takes a one-word answer):
  1. The ramp: today, A, B or C.
  2. The accent: ink, blue, violet or flare.
  3. The accent's reach: all three jobs, attention only, or identity only.
  4. The panel: one token, or the alphas.
  5. The dark grounds: a ladder, or one room.
  6. The canvas and the ink slab: split, or one.
  7. The missing step: faint in, or out.
  8. The dark card: opaque, or the veil.
- The departures, verbatim from BoardMeta:
  1. Round one's departure list said only candidate B kept the system's one translucent surface. That
     was wrong: B's card is a color-mix off the room, which is fully opaque, so all three candidates
     retire the veil and none of them said so. Row 08 renders both answers over a photograph and ask
     8 makes it a ruling rather than a side effect.
  2. A finding against bible 16, sharpened and changed. Counted by the job it does, the deepest dark
     surface in the product is not a token at all: the lightbox paints its backdrop with a literal
     `bg-black/90` (`media-lightbox.tsx:617`). What `--gallery` actually does is the media WELL (a
     tile before its image decodes, a coverless event card, the reel frame) and, through
     `.surface-ink`, the footer SLAB, and those two want opposite things. Rule 16 counts four
     grounds; there are at least six surfaces and one of them is a literal. Row 02.
  3. C re-opens a decision `globals.css` records as closed: zero-chroma purity IS the brand point,
     and saturating the neutrals was consciously declined. C is that decision re-argued at 0.003 to
     0.008 chroma, on the board rather than in a comment.
  4. The accent has to be written into `.surface-ink` or it never reaches the footer. Today the leaf
     declares `--brand: var(--gallery-foreground)`, and a class rule outranks a value inherited from
     the page around it, so a hue ruled for the whole site would reach every surface in the product
     except the mark that sits at the bottom of every page. The accent paste therefore carries a
     third block, and every candidate's ink map keeps a `--brand` line of its own so a ruling of ink
     alone cannot leave the leaf inheriting the PAPER ink onto a dark slab. Row 06.
  5. B deletes the cinema override in `marketing.css`, the skin block's only surface value. The
     cinema-to-footer seam then belongs entirely to light, which is the light board's lane.
  6. All three candidates complete `.surface-ink` (no `--card`, `--popover`, `--secondary`,
     `--accent` or `--input` ships today), so an ink leaf can finally host a card and a menu.
  7. Each candidate adds one custom property, `--faint`, which needs one line in `theme.css`'s
     `@theme inline` block (`--color-faint: var(--faint);`) before a `text-faint` utility exists.
     The board reaches it with an arbitrary value.
  8. Row 07 borrows the light exploration's proposed shadow family and its named ring
     (`docs/specs/light.md`) so the ramp and the depth cue are judged in one look. Those values are
     NOT in this board's paste: depth is that track's lane and its ruling lands there.
  9. The demo guest page cannot wear a candidate today (the shell change above).
- **What round two took from the other boards:** the light spec's shadow family (one geometry, two
  sizes, one alpha ramp per ground) and its named ring lift, rendered on every candidate's grounds in
  row 07; the shell's `setCandidateCss` for the walk. The media-kit track's shot list carries both
  asset asks rather than a second delivery.
- Look at first: **row 01**, the four rulers with the ladder tables and the state row under each.
  Then **row 02** (the grounds counted by job: the literal, the well, the slab, with Today's
  near-white card on the slab and a candidate's completed set one toggle away), then **row 03** (the
  event page and the dashboard in both modes, the densest chrome in the product). Then press
  **Apply A to the site** and walk `/`, `/pricing`, `/help`, `/contact`: the panel switch and the
  faint switch ride along, so four of the eight asks are answerable on real pages. **Row 12** is the
  accent, all four hues on every job at once with the state hues at the foot.

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Round two turned the palette board from a proof
into a ruling surface. Every candidate now leaves the board: the full token block plus the selected
accent, the panel at one token and `--faint` on the 37 alpha-dimmed sites, handed to the whole site
through the shell's `setCandidateCss`, so four of the eight asks are answered on `/`, `/pricing`,
`/help` and `/contact` rather than on a stage. The judged surfaces widened to what the product is
made of: the event page's stat band, command strip and review queue, the dashboard with the real
filter chips, the guest album on the canvas, the ink leaf hosting a card and a menu, the text steps
in real copy, the six state hues under every ramp in both modes. Depth is judged with the ramp (the
light spec's lift and float and the named ring), and three findings sharpened: the deepest surface in
the product is a literal `bg-black/90`, not the canvas token, so `--gallery` is the media well and
the ink slab; round one was wrong that B kept the translucent card, so the card became a three-way
toggle that folds into the paste; and the accent never reaches `.surface-ink` unless the paste says
so. The asks now take one-word answers. Lab only: no production byte changed.

## The paste, round two (what changed in it)

The ruling is a candidate letter plus an accent word; the blocks are generated by the board itself
(`tokenBlock()` and `accentBlock()` in `ramps.ts`), so row 13 renders exactly what lands and nothing
here needs retyping. Round one's three blocks are above, unchanged in every value; round two adds
two lines to each candidate's `.surface-ink` (`--brand: var(--primary)` and its foreground, without
which a pasted ink block inherits the PAPER ink onto a dark slab), and the accent's own paste is:

```css
/* globals.css, the accent (nothing prints for a ruling of "ink": it is the alias that ships) */
:root,
.surface-paper {
  --brand: <the hue's light value>;
  --brand-foreground: <its light foreground>;
}

.dark {
  --brand: <the hue's dark value>;
  --brand-foreground: <its dark foreground>;
}

/* the footer leaf neutralises --brand today; the accent has to reach it */
.surface-ink {
  --brand: <the hue's dark value>;
  --brand-foreground: <its dark foreground>;
}
```

The four hues, as they sit in `ramps.ts`: blue `oklch(0.55 0.17 252)` light and `oklch(0.72 0.15 252)`
dark; violet `oklch(0.58 0.2 300)` and `oklch(0.72 0.18 300)`; flare `oklch(0.58 0.22 330)` and
`oklch(0.7 0.2 330)`. Ink is today's alias and changes no line.

## Handoff (round 3)

- Head: the tip of `lp/palette`, pushed. Board at `/design/c/palette?key=`. **The round-three board
  is the one whose candidate card is followed by a panel headed "What the letter already decides",
  and whose control bar reads "Put it on the real pages"; round two's had neither, and round two's
  ramp toggle had a fourth button, C.**
- ★ **The preview alias is STALE and cannot be refreshed today: the project is at Vercel's
  100-deployments-a-day ceiling.** `partyreel-git-lp-palette-partyreel.vercel.app` still serves
  round two's `b4be6a2` (22:18), and it still carries "C. Film stock", which round three cut. Three
  pushes after it produced no deployment at all, and a forced redeploy of the head answers
  `payment_required`, `api-deployments-free-per-day`, `remaining: 0`, `reset` tomorrow. Other
  branches deployed inside the same window before the last slots went, so this is the whole project's
  ceiling rather than anything about this branch or the ignore-build gate (the manifest says
  `preview: true`, which the gate honours). **The Orchestrator has to force a redeploy at the head
  once a slot frees and confirm READY before Will walks this alias**, or the walk will be round two's
  board wearing round three's label. The call that does it, from round two's handoff and re-verified
  here: `POST api.vercel.com/v13/deployments?forceNew=1` with
  `{"name":"partyreel","project":"prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB","gitSource":{"type":"github","repoId":1252816746,"ref":"lp/palette","sha":"<head>"}}`
  and no `target` field (a `target` of "preview" is rejected as invalid).
- ★ **Correction to round two's recovery advice, with the cadence that replaces it.** Round two
  recorded "two attempts 45 seconds apart was enough"; that was luck, and seven attempts over seven
  minutes here freed nothing. Two things are worth knowing instead. First, the `limit.reset` the
  refusal returns is uninformative: it came back as EXACTLY the attempt's own timestamp plus 24 hours
  every time (23:11:27, 23:12:13, 23:13:23 ... 23:18:02), so it is "24 hours from now" rather than a
  clock to wait out, and a refused attempt may well be counted against the window. Second, the
  deployment list shows what actually happens at the ceiling: the window is ROLLING and releases one
  slot roughly every 14.4 minutes (100 a day), and the list bears that out to the minute over six
  deployments (22:04:10, 22:18:42, 22:33:19, 22:48:02, 23:02:50, 23:17:14), each taken by whichever
  branch asked first. A push whose deployment is refused is not queued, so it never gets a later
  slot on its own, and the slots are CONTESTED. Four consecutive slots, from the deployment list,
  landed at 23:02:50, 23:17:14, 23:31:57 and 23:46:21: an interval of 14m24s to within seconds, and
  a different branch took each one (`hero-scan`, `hero-burst`, `media-kit`, `rounding`). A call
  placed at 23:46:11 was refused because it was TEN SECONDS EARLY, and the slot was gone by the time
  it retried. **So: read the newest READY timestamp out of the list, add 14m24s, and place the call
  a few seconds AFTER that, holding with short retries for a minute rather than firing early.**
  Nothing this round won one, which is why this handoff is written against a local server.
- **So this round's QA was taken on a local production-equivalent dev server in the worktree**
  (`pnpm dev` in the worktree, the lab key on every URL), which serves the head exactly. Every
  number below was measured there through the DOM rather than eyeballed. One thing to know if you
  do the same: running `pnpm build` in a worktree that has `pnpm dev` up will eventually kill the
  dev server, because they share `.next`; restart it on another port rather than doubting the
  page.
- Synced with `launch-prep` TWICE, both clean and neither touching this lane: at `dd4aa0b`
  mid-round (13 commits, the floating-surfaces track's own lane plus its manifest) and again at
  `1c2d0ea` immediately before this handoff (13 more, hero-scan's round three: its manifest and
  `sandbox/home-hero/scan.{tsx,css}`). The gate below is the run on the second synced tree.
- Gates on the synced tree, re-run at the head: typecheck ok, lint ok (0 errors, 6 warnings, all
  pre-existing and none in a file this track owns), test ok (1727 in 194 files, 8 of them this
  round's `temperature.test.ts`), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` plus five
  files under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `ramps.ts`, `sections.tsx`,
  `specimens.tsx`, and the new `temperature.test.ts`). No exceptions. No production byte changed:
  `globals.css`, `theme.css` and `marketing.css` were read and not touched.
- **What round three changed, in one list.**
  1. **Candidate C is cut, and every value it held is still reachable.** C was A's ladder at a
     temperature, and round two wrote the reason in C's own move list: "The spacing is A's exactly,
     so a ruling between A and C is a ruling on temperature alone and nothing else moves." A column
     that moves no step is a switch wearing a letter. `warm()` in `ramps.ts` is that switch, read off
     C rather than invented (a surface carries the temperature and ink does not; paper takes hue 85
     above L 0.8, the rooms take 60, the near-whites 0.002 at 85, a veil is left alone), and
     `temperature.test.ts` pins `warm(A)` to C's five published blocks token for token. The board is
     three columns wide instead of four, the ramp ask is three options instead of four, and **warm B**
     (which the old board could not ask at all) is one click: B derives every surface from the room
     by color-mix, so a warmed room carries its whole ladder, which is the clearest thing the split
     says about B.
  2. **Two asks were consequences, not rulings.** "The dark grounds: a ladder or one room" and "the
     canvas and the ink slab: split or one" are both answered by the letter. They are a panel under
     the candidate now, headed "What the letter already decides", so an answer cannot contradict the
     paste the letter generates. Asks: seven, down from eight, each still one word.
  3. **The board's strongest evidence leads the walk, and it stopped being a memory test.** Round two
     taught this to the accent row ("four hues cannot be ruled on from memory") and left every
     SURFACE row on a toggle, which is the harder memory test of the two. Row 02 is now the same
     frame with today on the left and the candidate on the right, inside one canvas, on BOTH grounds:
     dark (0.140 / 0.245 / 0.210 / 0.230 / 0.250 beside A's 0.145 / 0.195 / 0.235 / 0.285 / 0.325)
     and paper (0.990 / 0.965 / 0.997 / 0.997 / 0.960 beside A's 0.977 / 0.948 / 0.998 / 0.998 /
     0.925), each half printing its own five steps. It was row 05, behind 4400px of app stages.
  4. **The counts are re-measured and two were wrong.** The panel ships at **35** sites, not 45
     (plus 8 hover fills wearing the same utility, which the switch leaves alone); the undocumented
     ring is at **37**, not 77. The faint step is 37 sites at five alphas, 19 of them at exactly the
     70 percent `--faint` is. A hue ruling reaches 34 utilities in 16 files. Every count now lives in
     `ramps.ts` beside the grep that produced it, so the next agent re-runs rather than re-remembers.
     Worth knowing how the last one was caught: the 77 was fixed in the row's caption and in the
     specimen's own doc comment, and the walk found it still RENDERING under the depth row from a
     third copy of the number. A count that appears in prose in more than one file is a count that
     will go stale in one of them; every one of them now reads the constant.
  5. **The stumbles a stranger hits, fixed.** Four unlabelled segmented controls in a row (two of
     them unreadable without the file open) all have visible names; the grounds strip printed four
     near-black bars and now prints each room's lightness, which is the only way 0.110 against 0.140
     is a reading; the ink leaf said "today this is near white" under a candidate that had just fixed
     it, and both captions follow the ramp now; the menu specimen sat ON the panel's own explanation
     at 1440 and hid three lines of it at 375, and now hangs off the card's top corner on desktop and
     sits over the action row on the phone, where a 224px menu cannot clear a 335px card at all
     (checked by intersecting the menu's box with every text node at both canvases, which is how the
     first attempt at this fix was caught still covering the title); nine
     stages were clipping or running up to 515px empty at one width or the other and were resized
     against measured content; the board opened by asking the same question three times over (the
     touchpoint blurb, the shell's exploration line, its own paragraph) and the paragraph now says
     how to rule from here.
  6. **The walk is six links.** The pages were printed as prose, so walking a candidate meant
     retyping six paths and remembering the lab key on each. They are links now, carrying THIS page's
     own key (read at runtime, never written into the file), each opening in its own tab, and the
     event page's row goes to the dashboard rather than to a path with a placeholder in it.
- **Cost, measured on the head rather than asserted** (the round's honesty item): 3871 DOM nodes, 81
  images, **zero running animations** at rest, a forced layout of 0.2ms, DOMContentLoaded 320ms and
  load 822ms on a dev server, page height 15593px. Nothing on this board loops, so `data-paused` has
  nothing to pause; the one colour fade on the token wrapper lives inside
  `prefers-reduced-motion: no-preference`, so a reduced-motion reader gets the jump cut and the same
  settled composition. No element renders in a mono stack and no text node carries an em-dash.
- Light QA, measured through the DOM on the head, at a real 375-wide browser (a viewport-emulating
  pane) and at the widest the test browser gives (1456; its window clamps below 1440 plus chrome, so
  a true 1440 browser is not reachable here, as round two also found): thirteen rows `#pal-01` to
  `#pal-13` in the new order with the index matching; zero page-level horizontal scroll at either
  width under both stage toggles; all twenty stages hold their canvas with zero overflow at both
  widths (the guest album had been laying out 952 into 760 and cutting its last row mid-tile, and
  now fits); the paired frames render two token blocks in one canvas with the right ground on each
  side (dark 0.14 beside 0.145, paper 0.99 beside 0.977); the warm switch produces C's exact light,
  dark and canvas values in the paste, and warm B warms only the room (`oklch(0.125 0.005 60)`)
  while every color-mix under it is untouched, which is the combination the old board could not
  show; Apply lands one `<style>` with the real selectors and `/pricing` wears it (background 0.145,
  muted 0.195, faint 0.55, the mark in flare); Clear removes it and leaves nothing in
  `localStorage`.
- **The walk itself was taken, on four of the six pages, and it proved two things the board could
  only assert.** With A applied (flare, panel at one token, faint in): `/help` puts all six of its
  real `bg-muted/40` panels on A's `--muted` at full strength (`oklch(0.948 0 0)`) while the five
  cards that merely HOVER to the same utility stay on `--card` and the thirteen hover-only elements
  stay transparent, so the rule's "a variant is not a panel" claim is now a reading rather than a
  comment; all 59 dimmed text sites paint `--faint` (`oklch(0.62 0 0)`). `/contact` puts both its
  panels on the same value. `/` is the one that matters most: the footer leaf comes back with
  `--card: oklch(0.235 0 0)`, which `.surface-ink` has never had, and `--brand: oklch(0.7 0.2 330)`,
  which is round two's departure 4 (a hue that does not reach the leaf reaches every surface in the
  product except the mark at the bottom of every page) proven on the real page rather than on a
  stage. `/pricing` was walked the same way earlier. `/dashboard` and the event page need the
  signed-in host, which localhost cannot do by design, so they stay for the alias.
- The reduced-motion claim, read off the SERVED stylesheet rather than the source: the only
  `data-pal-*` motion rule in the whole document is the 220ms colour transition on the token wrapper,
  and it sits inside `(prefers-reduced-motion: no-preference)`; there are zero `pal-` keyframes. A
  reduced-motion reader gets the jump cut and the identical settled composition.
- ★ **Two tooling notes earned this round, for whoever verifies next.** A driven tab is
  `document.hidden`, which FREEZES the transition clock at `currentTime: 0`: a colour read straight
  after a toggle is the value the element had BEFORE the toggle, and 32 transitions sit in
  `playState: "running"` forever without consuming a frame. Read a custom property
  (`getComputedStyle(el).getPropertyValue("--background")`) instead, which is never transitioned, or
  reload with the state you want. And the flat-black screenshot of a lab page scrolled past the fold
  is intermittent rather than reliable: the same scroll position screenshots correctly on a retry a
  few seconds later, so a black frame is worth one retry before it is worth a workaround.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Three one-line changes that are NOT this lane's, for the Orchestrator.**
  1. `src/app/(dev)/design/touchpoints.ts:488` still says "three complete candidate token sets"; it
     is two plus a temperature switch now. One line, at integration.
  2. `src/app/(guest)/layout.tsx` mounts no design island, so "Apply to the site" cannot reach
     `/e/[qr_token]` (carried from round two, unchanged). One `<AppDesignIsland />` fixes it; the
     guest album is judged on the board (row 05) until then.
  3. The ruling's own paste needs one line in `theme.css`'s `@theme inline` block
     (`--color-faint: var(--faint);`) before a `text-faint` utility exists. The board reaches the
     token with an arbitrary value.
- Assets requested from Will (unchanged from round two, both still lines on the media-kit track's
  existing shot list rather than a second delivery):
  - **Four hard cases inside the kit the `media-kit` track already asked for** · one high key (a
    white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm,
    one stage-cool; four of the 36 at 1600 px long edge, landscape, one grade · replaces the four
    this board leans on (`wedding-golden`, `party-balloons`, `concert-confetti`, `reception-table`)
  - **A portrait pair for the guest masonry** · two of the same 36 at 1600 px long edge, PORTRAIT,
    same grade · replaces the hand-set tile ratios in `specimens.tsx` (every stand-in in the kit but
    one is landscape, so the column flow the guest album actually ships is being faked)
  - Why a palette board needs them: a ramp is only ever wrong against media that fights it, and the
    stand-ins are mid-key and warm, so the light end of every candidate is going untested.
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will; each takes
  one word):
  1. The ramp: today, A or B.
  2. The temperature: neutral, or warm.
  3. The accent: ink, blue, violet or flare.
  4. The accent's reach: all three jobs, attention only, or identity only.
  5. The panel: one token, or the alphas.
  6. The missing step: faint in, or out.
  7. The dark card: opaque, or the veil.
- Look at first: **row 02**, the same frame twice, dark then paper. It is the whole ramp argument in
  two looks and it needs no toggle. Then **row 01** for the ladder tables and the state hues, and the
  panel beside the candidate card ("What the letter already decides") so the two cut asks stay cut.
  Then press **Warm** and look at row 02 again, then at **row 11** on cinema, which is where a
  temperature either reads as film or as a mistake. Then **A** on "Put it on the real pages" and the
  six links under row 13. **Row 12** is the accent, all four hues on every job at once.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Rounds two and three turned the palette board from
a proof that the ramp is wrong into a surface a ruling can be read off in a few words. Round two made
every candidate leave the board as the paste its ruling would land, handed to the whole site through
the shell's `setCandidateCss`, and widened the judged surfaces to what the product is made of: the
event page, the dashboard, the guest album on the canvas, the ink leaf hosting a card and a menu, the
state hues under every ramp, the light spec's depth cues on each candidate's grounds. Round three
walked it cold and cut rather than added. Candidate C was A's ladder at a temperature by its own
admission, so it became a switch any ramp can wear, pinned by a test to C's published blocks token for
token, and warm B became askable; two of the eight asks were consequences of the letter and are now
printed as what it already decides; and the strongest evidence leads, today beside the candidate in one
canvas on both grounds, because a 0.02 step is what an eye cannot hold across a toggle. Two counts the
board had quoted were wrong and are measured (the panel ships at 35 sites, not 45; the undocumented
ring at 37, not 77), and the walk's six pages are links. Lab only: no production byte changed.
