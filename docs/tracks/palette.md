---
track: palette
status: open
cut: "6c19d84"
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

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-palette-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
