---
track: palette
status: open
cut: "c473707"
merged_round_3: "0d5bb64"
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

## Round 4 (Will's review notes, 2026-09-15)

**The global notes, which bind every board this round** (Will, 2026-09-15, after a scroll through every
board on launch-prep): (a) **Page-wide controls always on screen.** "For any pagewide configs, the GUI
control should be fixed so that variants can be toggled on different previews anywhere on the page for
better back-and-forth comparisons. Having to scroll back to the top makes it very hard to review
differences." The shell now ships `BoardDock` (`src/components/dev/board/dock.tsx`, exported from
`@/components/dev/board`; the floating board's sticky bar, generalised: it sticks from `sm` up, writes its
height to `scroll-padding-top` so anchors land under it, and carries the shell's Fit/1:1, Sidebar and Desk
controls). Put every switch that changes the whole page in it (the candidate, the ground, the canvas, the
ramp, Replay, Apply to the site); a control that changes one specimen stays beside that specimen. (b)
**Pixel-perfect previews.** "The iFrame previews throw off anything related to size, making those reviews
particularly difficult. This needs to be fixed for pixel-perfect lab demos/previews." Every `Stage` now
renders at 1:1 by default (the lab preference in `lab-prefs.ts`; the board page lifts its max-width and
tucks the sidebar away so a 1440 canvas has its room; "Fit" keeps the old zoom for a glance at the whole).
Never zoom, scale or transform a specimen whose size is being judged; anything you render inside an iframe
renders at true pixels; if a 1440 canvas needs sideways scroll on a narrower window, that is correct. (c)
**More real UI.** Will wants live production components and whole real pages as the preview surfaces
("I'd love to see more UI examples for comparison, especially if they can be live production components";
"more UI to preview the variations on"), not a screen of specimens. (d) **The app's UI is open.** "The app
is functionally great, but UI design lags far behind the design work we've been doing for the marketing
site... any UI that touches App in an active lab track may be worked on before the dedicated app agents get
to it later." So where your board shows an app surface, you may redesign it (rising tides, bible 22), in
the lab, as a candidate. (e) **Vercel is capped** (the free plan's 100 deployments per trailing day, hit at
23:31 on the 14th; the window frees through the afternoon of the 15th): push, but verify on a local
production build or dev server at 1440 and 375 in a foreground tab, and say so in the Handoff. (f) The
record: "Handoff (round 4)" and "Record (round 4)" below; the Record is the paragraph the CHANGELOG carries
for round 4, so write it as what the board became and why.

**Will's notes on this board, verbatim where it matters.** "Again, needs a fixed GUI for comparison anywhere
on page." "I know I've asked before, but what's the difference between cinema and ink? Is cinema pure black
and ink near black? Should this be reworked to avoid complexity or is it best?" "I'd love to see more UI
examples for comparison, especially if they can be live production components using the demo palettes."
"Might as well add a couple additional palettes to increase our selection size. Side note: we can choose
dark and light separately, don't have to be a package deal. Dark will apply to marketing and app, light
applies to paper in marketing and light mode in app." "Your call on keeping dark/light/cinema/ink as
separate variants (plus the 5th using the surface color from the current /contact card, which doesn't have
a themed section of its own yet) or reworking our palette system to simply dark/light with variants of each
(such as dark having cinema for pure black, ink for lighter black, light having paper for pure white, XYZ
for light grey (needs name)). I've just seen so much dark, light, cinema, ink, etc., and didn't know if we
were incorrectly elevating a bad color system we were stuck in or if this is actually the best way to do
it." "Main ideas are: improving the comparison UI, choosing the light and dark palettes separately, adding
more palettes to options, adding more UI to preview with, and solidifying how we handle theming in general
within all of this."

**Round 4 (the goal).** (1) **The theming model is the first ask, answered by you.** Judge it from the
ground up: if no palette system existed, what would the perfect one be for a product with a dark marketing
site, a light marketing body, a footer slab, an app with two modes and a guest surface that is the host's?
Today's facts: cinema is `oklch(0.11 0 0)` (the dark marketing ground, set by the `(cinema)` group's skin),
the app's dark is 0.14, ink is 0.155 (the footer's leaf token set, `.surface-ink`), paper is 0.99, and the
/contact card's `bg-muted/40` panel is the fifth ground with no name. Propose the model as a named
structure: two modes (dark, light), each with named registers (for dark: a deep room and a lighter slab;
for light: paper and the grey panel, which you name), or three darks kept and why; say which registers
the marketing site, the app and the guest surface each use, and what a page or section chooses. Write it
on the board as the first block, in plain words, with the cinema-versus-ink answer in one sentence, and make
it the first ask. (2) **Light and dark chosen separately.** The dock carries two candidate switches, one
for the dark side (marketing cinema and ink, the app's dark mode) and one for the light side (paper and the
app's light mode), so any dark ramp pairs with any light ramp, and "Apply to the site" hands the site the
pair. (3) **More palettes.** Add at least two dark candidates and two light candidates beyond today's, each
a real different answer (a warmer black, a colder one, a lifted near-black, a warm paper, a cool paper, a
grey that is not a tint of the text), each a paste. (4) **More real UI.** The comparison surfaces are live
production components and whole real sections on each candidate pair: the home arc's chapters, a pricing
card, the dashboard's event cards, the event page, the guest album, the footer slab, a dialog and a menu
(the floating board's primitives), every state hue; the walk links stay. (5) **The dock**: every page-wide
switch in `BoardDock`, so a candidate can be flipped beside any row. (6) Keep what round three earned: the
paste per candidate, today beside the candidate in one canvas, the measured counts, the temperature switch
if it still earns its place under the new model.

### The rules of this wave (every track)

- **The shell is shared and registered.** Never edit `src/components/dev/` (the board shell: `Stage`,
  `Toggle`, `BoardDock`, `BoardMeta`, the tuner, the candidate block), `touchpoints.ts`, `rules/bible.ts`,
  another track's files, or CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`; a
  shell change you need is asked for in the Handoff and the Orchestrator lands it (announced in
  `docs/tracks/orchestrator.md`).
- **Sheets.** Keyframes under your prefix only (`keyframe-uniqueness.test.ts` reads every sheet under the
  lab); a board sheet never imports tailwindcss; `glow-contract.test.ts` pins the BorderBeam and
  GlowFilter counts across `src`, so compose `<Glow>` only. No em-dashes anywhere a person reads. No
  `font-mono`, no `MonoCaption` (`two-faces-policy.test.ts`).
- **Light QA** (Will, 2026-09-14): the board at 1440 and 375, reduced motion honoured, the gate green on
  the synced tree; Vercel is capped, so verify on a local production build or dev server in a FOREGROUND
  tab (a hidden tab pauses the loops and lays the lab out in the sidebar cell:
  `docs/systems/testing-verification.md`) and say so in the Handoff.
- **Commits** on `lp/<track>` only, staged explicitly, never `--no-verify`, never force; every commit ends
  with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

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

## The token blocks, round one (A and B are candidates; C is history)

The ruling is a candidate letter; these are what lands. Each block is generated by the board itself
(`tokenBlock()` in `ramps.ts`), so what is written here is what the board's last row renders.
`--faint` is new in both candidates and needs one line in `theme.css`'s `@theme inline` block
(`--color-faint: var(--faint);`) before a `text-faint` utility exists.

★ **Round three cut candidate C and kept every value it held: C is no longer a letter Will can rule,
and section C below is kept only as the reference the temperature switch is pinned to.** C was A's
ladder at a temperature, so it became `warm()` in `ramps.ts`, which any ramp can wear;
`temperature.test.ts` pins `warm(A)` to C's published block token for token. Read "The paste, round
three" below for what a ruling actually lands now, C's one correction included.

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

## The paste, round three (every combination a ruling can be)

The ruling is a letter plus a temperature plus an accent word plus two one-word answers about the
dark card and the missing step. The letter and the temperature are the two that rewrite whole
blocks, so their six combinations are written out in full below; the card and the faint answers each
move ONE line, and what that line becomes is printed here rather than left for the reader to derive.
The board generates all of it from the same `resolveRamp()` + `tokenBlock()` the paste uses, so
nothing here is retyped and nothing can disagree with what row 02 renders.

| The ruling | What lands |
| --- | --- |
| today, neutral | nothing. It ships. |
| today, warm | the block below, "Today, warm". |
| A, neutral | section A above, unchanged. |
| A, warm | section C above, token for token, with the one correction below. |
| B, neutral | section B above, unchanged. |
| B, warm | the block below, "B, warm". |

The accent's own block (`accentBlock()`, three selectors) is in "The paste, round two" above and is
unchanged; a ruling of "ink" prints nothing there.

**Ask 7, the dark card, is the third dimension, and it IS in the paste.** `resolveRamp()` runs the
card answer before the temperature, so it reaches `tokenBlock()` rather than the walk: it rewrites
`--card` in `.dark` and in `.surface-ink`, and nothing else in any block moves. The control offers
the same three positions the ask does. What each lands, per letter, neutral (pinned by
`temperature.test.ts`, "the dark card ruling, per letter"):

| The letter | declared | opaque | the veil |
| --- | --- | --- | --- |
| today | `oklch(0.21 0 0 / 0.62)` | `oklch(0.21 0 0)` | as declared |
| A | `oklch(0.235 0 0)` | as declared | `oklch(0.235 0 0 / 0.62)` |
| B | `color-mix(in oklab, var(--foreground) 12%, var(--background))` | as declared | the same mix at 62 percent: `color-mix(in oklab, <that value> 62%, transparent)` |

Three things that table says out loud. Today is the only letter where "opaque" moves a value, because
today is the only letter that still declares the translucent card; on both candidates the moving
answer is "the veil", which ADDS translucency back. Today's `.surface-ink` declares no `--card` at
all (the gap row 06 is about), so on today the ruling lands one line rather than two, while on A and
B it lands the same value in both blocks. And on a WARM ruling the opaque form takes the room's hue
like any other surface (`oklch(0.21 0.006 60)` for today) while the veiled form stays at chroma 0 on
purpose: `warm()` leaves every veil alone because a veil borrows the surface under it, which in a
warm room is already warm.

**Ask 6, the missing step, moves one line in each of the three blocks.** "In" is what every block
below prints. "Out" is a ruling that the custom property is never declared, so it DELETES the
`--faint` line from `:root/.surface-paper`, from `.dark` and from `.surface-ink`, leaves the
37 call sites compositing an alpha of the second step by hand exactly as they do today, and
drops the `theme.css` prerequisite with it (with no `--faint` there is no `--color-faint` line and no
`text-faint` utility to grow). The board does this to the ramp itself rather than to one renderer,
so "out" also empties the rung at row 01 and sends row 10's third step back to the fallback; row 13
prints whichever answer is set.

**The panel switch is the one answer that is NOT in the paste**, and cannot be: it deletes an alpha
at 35 call sites (six distinct ones) rather than moving a token value, so it rides the walk instead,
as a stylesheet the lab hands the real pages. Scaffolding, not shippable CSS.

**A, warm, and C's one correction.** `warm(A)` reproduces section C's five blocks token for token
with two differences, both deliberate: the two `--brand` lines round two added to every candidate's
`.surface-ink` (above, "The paste, round two"), and the dark `--ring`, which C published cold at
`oklch(0.85 0 0)` while writing the ink ring warm at the same job on the same ground. `warm(A)`
writes `--ring: oklch(0.85 0.004 70)`, and `temperature.test.ts` pins that.

**B, warm, moves five values and the rest follows.** B derives every surface from the room by
`color-mix`, so warming it is five literals (the room `0.125`, the paper ground and card `0.99`, the
menu `0.998`, the near-whites `0.96`, the canvas muted `0.62`) and every mix under them inherits
without being written. That is the clearest thing the temperature switch says about B, and the old
three-candidate board could not ask it at all.

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.99 0.003 85);
  --foreground: oklch(0.14 0 0);
  --card: oklch(0.99 0.003 85);
  --card-foreground: oklch(0.14 0 0);
  --popover: oklch(0.998 0.003 85);
  --popover-foreground: oklch(0.14 0 0);
  --primary: oklch(0.14 0 0);
  --primary-foreground: oklch(0.99 0.003 85);
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
  --background: oklch(0.125 0.005 60);
  --foreground: oklch(0.96 0.002 85);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0.002 85);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0.002 85);
  --primary: oklch(0.96 0.002 85);
  --primary-foreground: oklch(0.125 0.005 60);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0.002 85);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0.002 85);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.125 0.005 60);
  --gallery-foreground: oklch(0.96 0.002 85);
  --gallery-muted: oklch(0.62 0.004 70);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: oklch(0.125 0.005 60);
  --foreground: oklch(0.96 0.002 85);
  --card: color-mix(in oklab, var(--foreground) 12%, var(--background));
  --card-foreground: oklch(0.96 0.002 85);
  --popover: color-mix(in oklab, var(--foreground) 18%, var(--background));
  --popover-foreground: oklch(0.96 0.002 85);
  --secondary: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --secondary-foreground: oklch(0.96 0.002 85);
  --accent: color-mix(in oklab, var(--foreground) 22%, var(--background));
  --accent-foreground: oklch(0.96 0.002 85);
  --muted: color-mix(in oklab, var(--foreground) 7%, var(--background));
  --muted-foreground: color-mix(in oklab, var(--foreground) 68%, var(--background));
  --faint: color-mix(in oklab, var(--foreground) 52%, var(--background));
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: color-mix(in oklab, var(--foreground) 85%, var(--background));
  --primary: oklch(0.96 0.002 85);
  --primary-foreground: oklch(0.125 0.005 60);
  --brand: var(--primary);
  --brand-foreground: var(--primary-foreground);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.125 0.005 60);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.125 0.005 60);
}
```

**Today, warm**, for completeness: the ramp ask offers today, so the temperature ask can land on it.

```css
/* globals.css */
:root,
.surface-paper {
  --background: oklch(0.99 0.003 85);
  --foreground: oklch(0.13 0 0);
  --card: oklch(0.997 0.003 85);
  --card-foreground: oklch(0.13 0 0);
  --popover: oklch(0.997 0.003 85);
  --popover-foreground: oklch(0.13 0 0);
  --primary: oklch(0.13 0 0);
  --primary-foreground: oklch(0.99 0.003 85);
  --secondary: oklch(0.96 0.004 85);
  --secondary-foreground: oklch(0.13 0 0);
  --muted: oklch(0.965 0.004 85);
  --muted-foreground: oklch(0.45 0 0);
  --accent: oklch(0.96 0.004 85);
  --accent-foreground: oklch(0.13 0 0);
  --border: oklch(0.905 0.006 85);
  --input: oklch(0.905 0.006 85);
  --ring: oklch(0.3 0 0);
}

.dark {
  --background: oklch(0.14 0.005 60);
  --foreground: oklch(0.96 0.002 85);
  --card: oklch(0.21 0 0 / 0.62);
  --card-foreground: oklch(0.96 0.002 85);
  --popover: oklch(0.23 0.006 60);
  --popover-foreground: oklch(0.96 0.002 85);
  --primary: oklch(0.96 0.002 85);
  --primary-foreground: oklch(0.15 0.005 60);
  --secondary: oklch(0.25 0.006 60);
  --secondary-foreground: oklch(0.96 0.002 85);
  --muted: oklch(0.245 0.006 60);
  --muted-foreground: oklch(0.71 0.004 70);
  --accent: oklch(0.25 0.006 60);
  --accent-foreground: oklch(0.96 0.002 85);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.85 0.004 70);
}

/* the media canvas, identical in both modes */
:root,
.surface-paper {
  --gallery: oklch(0.155 0.005 60);
  --gallery-foreground: oklch(0.97 0.002 85);
  --gallery-muted: oklch(0.62 0.004 70);
  --gallery-border: oklch(1 0 0 / 8%);
}

.surface-ink {
  --background: var(--gallery);
  --foreground: var(--gallery-foreground);
  --card-foreground: var(--gallery-foreground);
  --brand: var(--gallery-foreground);
  --brand-foreground: var(--gallery);
  --border: var(--gallery-border);
  --muted: color-mix(in oklab, var(--gallery) 85%, var(--gallery-foreground));
  --muted-foreground: var(--gallery-muted);
  --ring: var(--gallery-foreground);
  --primary: var(--gallery-foreground);
  --primary-foreground: var(--gallery);
  --shadow-float: 0 0 0 0 oklch(0 0 0 / 0);
}

/* marketing.css, the cinema skin */
.dark[data-mkt-skin="cinema"] {
  --background: oklch(0.11 0.005 60);
}
body:has([data-mkt-skin="cinema"]) {
  background: oklch(0.11 0.005 60);
}
```

## Handoff (round 3)

- Head: the tip of `lp/palette`, pushed. Every board byte is at **`d773ad6`** (the SECOND fix pass,
  after the read-only re-review); the commits after it are this manifest's own, so no board byte
  differs between `d773ad6` and the tip. Board at `/design/c/palette?key=`.
  **The round-three board is the one whose candidate card is followed by a panel headed "What the
  letter already decides", and whose control bar reads "Put it on the real pages"; round two's had
  neither, and round two's ramp toggle had a fourth button, C. The FIX PASS on top of it is the one
  whose meta panel is preceded by a panel headed "From the other boards", whose Departures list has
  six lines rather than ten, and whose walk at row 13 is seven links rather than six. The SECOND fix
  pass is the one whose bar reads "The missing step" and "Declared Opaque Veil 62%": press Out and
  row 01's faint rung goes hatched on all three ramps, row 10's third caption reads
  `text-muted-foreground/70`, and the paste at row 13 loses its three `--faint` lines.**
- **What the SECOND fix pass changed (the read-only re-review's two should-fix items, plus the
  cause the fix found underneath the first of them).**
  1. **The missing step moves the board, because it is a ramp edit now rather than a renderer
     flag.** The review was right that "The faint step: In / Out" changed no pixel: `faintOnDimmed`
     reached `applyCss`/`applyLabel` and nothing else. Answering it in one renderer would have been
     the wrong repair, because a ruling of "out" means the custom property is never declared, not
     that one specimen draws differently. So `resolveRamp()` takes the answer and `withoutFaint()`
     deletes `--faint` from the light, dark and ink blocks, and every reader of the ramp follows at
     once: row 01's ladder draws the hatched "none" rung it already draws for today, row 10's third
     step falls back to the alpha the 37 sites composite by hand (its label reads
     `text-muted-foreground/70`, and the caption under the frames says which of the two is on
     screen), the frame labels read "faint in" / "faint out", and row 13 prints a paste with no
     `--faint` line and drops the `theme.css` prerequisite that goes with it.
  2. **The cause underneath it: two rows resolved their own ramp.** Rows 01 and 03 called
     `resolveRamp()` themselves and had never been given the new answer, which is exactly how a
     switch goes decorative. Every ramp on the board goes through ONE local resolver now
     (`resolved()` in `PaletteBoard`), with the reason written at it, so a row cannot answer a
     different question from the bar again. Verified by DOM: with Out pressed, all six ladder rungs
     (three ramps x two modes) read "none"; with In pressed, today's two read "none" and the
     candidates' four read their value.
  3. **The paste section covers the card dimension, and ask 7 reads its control.** "The paste,
     round three" now prints what each card answer lands per letter in both blocks it touches, with
     the three things that table says out loud (today is the only letter where "opaque" moves a
     value; today's `.surface-ink` declares no `--card` at all, so it lands one line rather than
     two; a warm ruling warms the opaque form and leaves the veiled one to the room showing
     through). Ask 7 offers the control's three answers rather than two of them, and the control's
     first position is "Declared" rather than "As declared" so both read as one word. The same
     section now also states what the faint answer does to the paste, and that the panel answer is
     the one switch that cannot be in it. Every cell of that table was read back off the board's own
     `<pre>` rather than derived: A declared/opaque `oklch(0.235 0 0)` and veil
     `oklch(0.235 0 0 / 0.62)` in `.dark` and `.surface-ink` both; today two lines, not three; B's
     veil the mix inside a mix. `temperature.test.ts` pins all of it (15 tests, up from 8).
- **What the FIRST fix pass changed, one line each (the read-only review's four should-fix items,
  plus two the fix walk found itself).**
  1. **Row 02 can no longer pair a set with itself.** `today` is one of the three answers ask 1
     offers, and pressing it made the candidate the same object as the left half: the row printed
     "Today" beside "Today", five identical lightnesses under each half, and two children on one
     React key. `PairFrame` renders ONCE when both sides resolve to one set, in the unpaired
     composition, with a line under it saying which press brings the second half back, and the
     frame's label and height follow (`today, with no candidate beside it`, one half's height on the
     phone). Measured at both canvases under all three ramps: no clipping, no duplicate key, no
     warning in the console.
  2. **The departures are six, and every one is a ruling.** Four of round two's ten were notes for
     the next agent rather than decisions for Will: theme.css's one `--color-faint` line (now
     printed at row 13, beside the paste it belongs to), the light board's borrowed shadow values
     (row 07's caption already says they are not in this paste), "both candidates complete
     `.surface-ink`" (row 06's reading says it), and the guest layout's missing island, which
     launch-prep has since landed. The board's own comment says why the list was cut.
  3. **The paste covers every combination a ruling can be.** "The paste, round three" above is new:
     the six rulings as a table, the two blocks nobody had written down (today warm, B warm) in
     full, and A warm as section C plus its one correction. The round-one section is re-headed so C
     reads as history rather than as a fourth button, and row 13's reading no longer claims the
     Record carries three candidates.
  4. **What this board took from the other boards is stated, on the board and below.** See the
     cross-board bullet further down; the board carries it as a panel above the meta panel.
  5. The accent wall's toast clipped 8px past the phone stage (a grid item's min-width is auto, so
     the truncating label could not shrink). Found by re-measuring every stage rather than by
     reading; the previous round's "zero overflow" claim missed it because a scroll container's
     contents were counted the same way.
  6. Nothing counts the walk's pages in prose any more: the three sentences that said "six" read the
     list instead, which is round three's own lesson about a number quoted in two places.
- ★ **The preview alias is STALE and cannot be refreshed today: the project is at Vercel's
  100-deployments-a-day ceiling.** `partyreel-git-lp-palette-partyreel.vercel.app` still serves
  round two's `b4be6a2` (22:18), and it still carries "C. Film stock", which round three cut. After
  the second fix pass it is three heads behind, and the marker to check on the rebuilt alias is the
  bar reading "The missing step" with a "Declared" position on the card control. Three
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
  Nothing this round won one: sixteen calls across four boundaries, including twelve placed across
  the 00:00:50 boundary exactly as above, were all refused. That is why this handoff is written
  against a local server, and why the alias is the Orchestrator's to refresh before Will walks it.
- **So this round's QA, and both fix passes', were taken on a local server in the worktree**
  (round three and the first fix pass on `pnpm dev`, port 3021; the SECOND fix pass on a local
  PRODUCTION build, `pnpm build` then `next start -p 3031`, which is the closest thing to the alias
  available today), the lab key on every URL. Neither fix pass called the Vercel API at all, by
  instruction: the project is still at the ceiling and the alias is the Orchestrator's to refresh.
  Every number below was measured there through the DOM rather than eyeballed. Two things to know if
  you do the same. Running `pnpm build` in a worktree that has `pnpm dev` up will eventually kill the
  dev server, because they share `.next`; restart it on another port rather than doubting the page.
  And the browser window here caps at an inner width of 1424, so "1440" is the board's own stage
  toggle (which sets the canvas width) rather than the window: the stage is what the rows render at,
  and the document's own horizontal overflow was 0 at both settings.
- Synced with `launch-prep` FOUR times as the wave integrated around this round, every one clean
  and none of them touching this lane: `dd4aa0b` (13 commits, floating-surfaces' own lane),
  `1c2d0ea` (13 more, hero-scan's round three), `8d8d0af` (13 more, light's round three) and
  **`fb395fe`** at the fix pass (41 more: type-scale, media-kit and hero-burst integrating, plus the
  shell change this track had asked for twice). The fourth sync is the one that changed the board:
  `fb395fe` mounts the key-gated `AppDesignIsland` in `(guest)/layout.tsx`, so the guest page joined
  the walk. The gate below is the run on the fourth synced tree.
- Gates on the synced tree, re-run at the second fix pass's head: typecheck ok, lint ok (0 errors, 6
  warnings, all pre-existing and none in a file this track owns), test ok (1776 in 198 files, 15 of
  them this round's `temperature.test.ts`, up from 8 with the card and faint rulings pinned), build
  ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/palette.md` plus six
  files under `src/app/(dev)/design/sandbox/palette/` (`board.tsx`, `ramps.ts`, `sections.tsx`,
  `specimens.tsx`, `call-sites.tsx` and the new `temperature.test.ts`; the fix pass added
  `call-sites.tsx` for the accent wall's clipped toast). No exceptions. No production byte changed:
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
- Light QA at the FIX-PASS head, measured through the DOM at a real 1440 browser and a real 375 one
  (a viewport-emulating pane, which round three's first pass could not reach): twenty stages, and
  under every one of the twelve combinations of ramp (today, A, B), temperature (neutral, warm) and
  stage canvas (Desktop 1440, Phone 375), ZERO elements paint outside their stage and the document
  has zero horizontal scroll. The audit counts a real clip rather than a scroll: it walks every
  descendant's rect against the stage's and ignores anything inside an `overflow-x` scroller, which
  is what the dashboard's filter chips are, and that is how the accent wall's 8px clip was found
  after a round that had claimed zero overflow. Row 02 at `today` renders one half per stage, 439px
  tall on desktop and 543px on the phone with its content fitting both, no duplicate-key warning in
  the console, and the note under it naming the press that brings the pair back. The walk's guest row
  resolves to `/e/<demo token>?key=` and is dropped when the env has no demo event. The same three
  readings were re-taken on a LOCAL PRODUCTION BUILD of the same commit (`pnpm build` then
  `next start`, port 3022): seven links, four halves at A and one per stage at today with the note
  under it, zero clipped elements at the phone canvas, zero horizontal scroll.
- Light QA at the first round-three head, kept as the record of what it measured: through the DOM,
  at a real 375-wide browser (a viewport-emulating pane) and at the widest the test browser gives
  (1456; its window clamps below 1440 plus chrome, so
  a true 1440 browser is not reachable here, as round two also found): thirteen rows `#pal-01` to
  `#pal-13` in the new order with the index matching; zero page-level horizontal scroll at either
  width under both stage toggles; all twenty stages hold their canvas with zero overflow at both
  widths (the guest album had been laying out 952 into 760 and cutting its last row mid-tile, and
  now fits); the paired frames render two token blocks in one canvas with the right ground on each
  side (dark 0.14 beside 0.145, paper 0.99 beside 0.977); the warm switch produces C's exact light,
  dark and canvas values in the paste, and warm B moves five literals (the room `oklch(0.125 0.005
  60)`, the paper ground and card, the menu, the near-whites and the canvas muted) while every
  color-mix under them follows without being written, which is the combination the old board could
  not show. Round three's first handoff said warm B "warms only the room", which was the headline
  rather than the reading: the mixes are untouched, the five literals they read are not; Apply lands one `<style>` with the real selectors and `/pricing` wears it (background 0.145,
  muted 0.195, faint 0.55, the mark in flare); Clear removes it and leaves nothing in
  `localStorage`.
- **The walk is SEVEN pages now, and the new one is the one this track had been unable to walk for
  two rounds.** `fb395fe` on launch-prep mounts the design island in the guest layout, so
  `/e/<demo token>?key=` wears a candidate: measured on the fix-pass head with warm A applied, the
  demo album's root carries `--background: oklch(0.145 0.005 60)`, `--gallery: oklch(0.09 0.004 60)`
  (A's media well, the token that surface exists for), `--faint: oklch(0.55 0.004 70)` and
  `--brand: oklch(0.7 0.2 330)`, from exactly one injected `<style>`. Clear removes it and leaves
  `localStorage` empty. The row is dropped when no demo event is configured, so the board never
  links to `/e/` with nothing after it.
- **The walk itself was taken, on five of the seven pages, and it proved two things the board could
  only assert.** With A applied (flare, panel at one token, faint in): `/help` puts all six of its
  real `bg-muted/40` panels on A's `--muted` at full strength (`oklch(0.948 0 0)`) while the five
  cards that merely HOVER to the same utility stay on `--card` and the thirteen hover-only elements
  stay transparent, so the rule's "a variant is not a panel" claim is now a reading rather than a
  comment; all 59 dimmed text sites paint `--faint` (`oklch(0.62 0 0)`). `/contact` puts both its
  panels on the same value. `/` is the one that matters most: the footer leaf comes back with
  `--card: oklch(0.235 0 0)`, which `.surface-ink` has never had, and `--brand: oklch(0.7 0.2 330)`,
  which is round two's departure 4 (a hue that does not reach the leaf reaches every surface in the
  product except the mark at the bottom of every page) proven on the real page rather than on a
  stage. `/pricing` was walked the same way earlier, and the demo guest page is the bullet
  above. `/dashboard` and the host event page need the signed-in host, which localhost cannot do by
  design, so those two stay for the alias.
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
- **Two one-line changes that are NOT this lane's, for the Orchestrator** (round three's third one,
  the guest layout's design island, landed on launch-prep at `fb395fe` and is no longer outstanding).
  1. `src/app/(dev)/design/touchpoints.ts:488` still says "three complete candidate token sets"; it
     is two plus a temperature switch now. One line, at integration.
  2. The ruling's own paste needs one line in `theme.css`'s `@theme inline` block
     (`--color-faint: var(--faint);`) before a `text-faint` utility exists. The board reaches the
     token with an arbitrary value, and row 13 now prints this line under the paste so the ruling
     and its prerequisite are read together.
- **A third, for whoever lands the two pastes: the light ruling and this one touch the same line.**
  Every candidate's `.surface-ink` block carries the shipped `--shadow-float: 0 0 0 0 oklch(0 0 0 /
  0)`, without which an ink leaf inside a paper page wears the PAPER float on a dark slab. The light
  board's round-three handoff flags that token as one its own ruling moves. They agree today (light
  keeps the zero on `.surface-ink` and on the dark root), so the order does not matter yet; if that
  ruling changes the value, drop the line from the palette paste rather than pasting both.
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
- The departures, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will; there
  are SIX, down from ten, because a departure is a thing Will rules on and four of round two's were
  notes for the next agent, now each sitting where it is read):
  1. Round three cut candidate C, and no value it held is lost. C was A's ladder at a temperature,
     and its own move list said so: the spacing was A's exactly, so a ruling between A and C was a
     ruling on temperature alone. A column that moves no step is a switch wearing a letter, so it is
     a switch now, and the one question it could never answer (does B want warming too) is one click.
     warm(A) still produces C's five published blocks token for token, pinned by
     temperature.test.ts, with one correction recorded there: C left the dark ring cold while writing
     the ink ring warm, at the same job on the same ground.
  2. Round one's departure list said only candidate B kept the system's one translucent surface. That
     was wrong: B's card is a color-mix off the room, which is fully opaque, so every candidate
     retires the veil and none of them said so. Row 08 renders both answers over a photograph and the
     card ask makes it a ruling rather than a side effect.
  3. A finding against bible 16, sharpened and changed. Counted by the job it does, the deepest dark
     surface in the product is not a token at all: the lightbox paints its backdrop with a literal
     bg-black/90 (media-lightbox.tsx:617). What --gallery actually does is the media WELL (a tile
     before its image decodes, a coverless event card, the reel frame) and, through .surface-ink, the
     footer SLAB, and those two want opposite things. Rule 16 counts four grounds; there are at least
     six surfaces and one of them is a literal. Row 03.
  4. Warm re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point,
     and saturating the neutrals was consciously declined. The switch is that decision re-argued at
     0.002 to 0.008 chroma, on the board rather than in a comment, and now on whichever ramp is
     selected rather than on one of them.
  5. The accent has to be written into .surface-ink or it never reaches the footer. Today the leaf
     declares --brand: var(--gallery-foreground), and a class rule outranks a value inherited from
     the page around it, so a hue ruled for the whole site would reach every surface in the product
     except the mark that sits at the bottom of every page. The accent paste therefore carries a
     third block, and every candidate's ink map keeps a --brand line of its own so a ruling of ink
     alone cannot leave the leaf inheriting the PAPER ink onto a dark slab. Row 06 shows the mark on
     the leaf.
  6. B deletes the cinema override in marketing.css, the skin block's only surface value. The
     cinema-to-footer seam then belongs entirely to light, which is the light board's lane.
- **What round three took from the other boards** (the round's item 2, and the wave rule that a board
  says what it took). The five wave specs in `docs/specs/` and every open track's latest Handoff in
  `docs/tracks/` were re-read at the fix pass. It is on the BOARD as a panel above the meta panel,
  "From the other boards", not only here. Three things moved.
  1. **The guest page joined the walk.** The `light` board's round-three handoff carries the same
     finding this track carried ("no board's Apply candidate can reach a guest page"), and
     launch-prep acted on it at `fb395fe`. The walk is seven pages instead of six, the demo album is
     judged wearing a candidate rather than only as a stage, and this track's own Orchestrator note
     about the guest layout is retired.
  2. **Two pastes touch one line.** That board's note (2) is that every candidate here re-declares
     `--shadow-float` on `.surface-ink`, a token its own ruling moves. Verified: all three sets carry
     the shipped zero, and it has to stay (an ink leaf inside a paper page would otherwise wear the
     paper float). They agree today, so the order does not matter yet; the board says so and so does
     the Orchestrator bullet above.
  3. **The light spec's depth cues stay borrowed, and stay out of the paste.** `docs/specs/light.md`
     still owns the shadow family and the named ring rendered on row 07; that is round two's
     borrowing, re-checked rather than re-taken, and row 07's caption says the values are not in this
     board's paste.
  Nothing else changed the answer, and each was read rather than assumed: `type-scale` states that
  `palette` proposes nothing that moves a size, leading or tracking, and the reverse is true (its
  block moves no colour token); `media-kit`'s shot list already carries both of this board's asset
  asks; `floating-surfaces` proposes radii and one contract carve-out for state toasts, which is a
  `!important` colour in globals.css this board neither reads nor writes; `brand-voice`, `rounding`,
  `hero-scan`, `hero-burst` and `design-gallery` propose nothing that moves a colour token.
  `docs/specs/palette.md` is this track's own round-one proposal and is unchanged.
- Look at first: **row 02**, the same frame twice, dark then paper. It is the whole ramp argument in
  two looks and it needs no toggle. Then **row 01** for the ladder tables and the state hues, and the
  panel beside the candidate card ("What the letter already decides") so the two cut asks stay cut.
  Press **Today** there once: the frame renders alone, which is what ruling today lands. Then press
  **Warm** and look at row 02 again, then at **row 11** on cinema, which is where a temperature
  either reads as film or as a mistake. Then **A** on "Put it on the real pages" and the seven links
  under row 13, the last of which is the demo guest page (new this pass). **Row 12** is the accent,
  all four hues on every job at once.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). Rounds two and three turned the palette board
from a proof that the ramp is wrong into a surface a ruling reads off. Round two made every
candidate leave the board as the paste its ruling lands, handed to the whole site through the shell,
and widened the judged surfaces to the event page, the dashboard, the guest album and the ink leaf
hosting a card and a menu. Round three walked it cold and cut, not added: candidate C was A's ladder
at a temperature by its own admission, so it became a switch any ramp can wear, pinned by a test to
C's blocks, and warm B became askable; two asks were consequences of the letter and print as such;
and today sits beside the candidate, because a 0.02 step is not a memory test. Every switch in the
bar repaints the board from one resolver, so none can label an answer the page does not show. Two
counts were wrong and are measured (the panel at 35 sites, not 45; the ring at 37), and the walk is
seven pages, the last the guest album, which no board could reach until the shell mounted its
island. Lab only, no production byte.

## Handoff (round 4)

- Head <sha>, pushed; preview partyreel-git-lp-palette-partyreel.vercel.app (may not build while Vercel is capped: say how the board was verified locally)
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Shell changes asked for (the Orchestrator lands them): none, or one bullet each
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (round 4; the CHANGELOG paragraph for round 4, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
