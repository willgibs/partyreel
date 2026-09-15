# Partyreel — What's next

> ROLE: what MIGHT be next — the curated upcoming work + the buckets where deferred work accrues.
> BELONGS HERE: directly-upcoming tasks · the major-overhaul buckets · the launch checkpoint. · NOT HERE: how the system works (→ [`systems/`](systems)), the build history (→ [`CHANGELOG.md`](CHANGELOG.md)), current state (→ [`STATUS.md`](STATUS.md)), the comprehensive/speculative backlog (tracked outside these docs).
> GROWS BY: prune (delete a line when it ships or is dropped) + append one-liners under the right bucket.

**Provisional + non-binding.** Everything here is a CANDIDATE that may change — it is **not a spec, not an
invariant**, and **must not constrain current implementation** (don't bend today's feature to fit a line
below). An item is only "real" once it's **picked up into its own plan** (we re-plan per task, the house
pattern). The load-bearing "what exists / don't-revert" layer is [`systems/`](systems); this file is just
the shortlist of what could come next.

**Where deferred work goes (the one rule):** when you defer something, add it as a **one-liner under the
matching overhaul bucket or the launch checkpoint** below — never an inline "Deferred:" note elsewhere.
When that overhaul finally runs, its whole accrued task log is already sitting here.

**Picking up a task:** the working loop lives in [`CLAUDE.md`](../CLAUDE.md) (orient → doc-check →
plan → build → test → verify live → record); your role + branch rules are CLAUDE.md "Sessions &
roles" + [`PROGRAM.md`](PROGRAM.md).

## Now (concrete, pick-up-able)

- **Fold `RefSection` into `Section`** (the `lab-shell` track, 2026-09-15): the shell's `Section` anchors
  its heading, the gallery's older `RefSection` (`reference/reference-ui.tsx`) anchors its wrapper; the
  TOC reads both, but one shape is better than two.
- **The `.mono` dark ground leaves `design.css`** with the two legacy marketing boards
  (`marketing-decomposition`, `marketing-hero-substrate`) when the migration wave retires them to the record.
- **Delete `(shell)/lab/_desk/sample-spec.ts` and the desk's dry run** once every standing board carries a
  spec (the `lab-desk` track, 2026-09-15); it exists only so the review session could be walked first.
- **Index the kit as a family** (the `lab-kit` track, 2026-09-15): add `src/components/lab` to the
  collector's `COMPONENT_DIRS` so the kit is indexed like any component family rather than only through its
  contracts, then delete `(shell)/lab/kit/notes.ts` (the stand-in `for`-line map) and let the kit page read
  the index; and retire the panel half of the rounding board's `usePanelAwareWidth` now that the tuner
  panel sets `--lab-panel-w`.
- **`pnpm design:specimens`** (the `lab-library` track, 2026-09-15): give the specimen source collector a
  script beside `design:rules` so `specimens.generated.json` regenerates by name rather than by path
  (`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`); the freshness test names the command.
- **The proposals' "asks, one word each" blocks** (the `lab-rules` track, 2026-09-15): delete them from the
  four `docs/specs/*.md` once `sandbox/registry.ts` carries the boards' specs (the `lab-kit` round lands
  them); until then the proposals are the only home of Will's open questions.
- **The collector's id collision** (the `lab-rules` track): a new contract target whose stem matches a
  library component renames BOTH files (`sheet` becomes `ui-sheet`), so the real component is silently
  re-id'd; `gallery.test.ts` catches it but reads as a missing entry; the id rule deserves a better answer.
- **The policy directive sweep** (the Library x Lab round, 2026-09-15): the `lab-rules` track puts
  `// @policy: <scope>` on the fourteen policy tests the bible cites; the remaining tests that read
  the tree (`gallery.test.ts`, `touchpoints.test.ts`, the lane guard's siblings) get the same
  directive in a follow-up so `/design/library/policies` lists every line the gate holds.
- **The design-system doc's em-dashes**: `docs/systems/design-system.md` still uses em-dashes in
  prose (internal docs are exempt from the policy); sweep them when the doc is next rewritten, so
  the doctrine page reads in the voice the site uses.
- **The lab subdomain round is unchanged by the Library x Lab round**: the routes moved under
  `/design/library` and `/design/lab` on the one domain; a `design.partyreel.com` mapping would
  rewrite the two prefixes and `_data/legacy-routes.ts` in one place.
- **CI caches only the pnpm store**, so every run compiles cold (about 2m20s with the build skipped;
  longer with it). If the wall time starts to bite, cache `.next/cache` too, keyed on the lockfile plus a
  source hash (the `ci-workflow` track's note, 2026-09-02).
- **The restore toast should read `mediaStillRemoved`** (the `product-truth` track, 2026-09-02:
  `restoreEventAction` now returns the count, and nothing reads it). The consumer is
  `src/components/app/restore-event-button.tsx`; the exact block is in the track's manifest, now in git
  only: `git show d752a9b:docs/tracks/product-truth.md` (Handoff).
- **The root 404's browser tint.** The lit root `not-found` (outside every route group) inherits the root
  layout's light `theme-color` (`#fcfcfc`) over a dark cinema page, while the cinema-group 404 carries
  `#040404`; export the dark tint from the root not-found or move it under the cinema group (found in
  the milestone-16 red-team, 2026-09-02).
- **The home hero redesign** (Will, 2026-09-01: "I'd love a full home hero redesign"). Round one
  (`home-hero`, integrated 2026-09-12) put four grids on the board; Will's ruling 2026-09-14: none of
  them, too generic, not the QR-to-album idea. Round two runs as three parallel tracks (`hero-source`,
  `hero-reel`, `hero-gathering`) against one shell at `sandbox/home-hero/`, each with its own eyebrow
  and copy proposal and its own asset request; all three integrated 2026-09-14 and **ruled the same day:
  the source** ("I bet if I scan this QR I get all of these images"; the reel read as the video being the
  product, the gathering's QR as a learn-more object). **Round three runs as three variation tracks off the
  source** (`hero-scan`, `hero-burst`, `hero-river`; the source stays on the board as the reference), all
  three integrated 2026-09-14 (`66b4ebe`, `3aeef1a`, `ff0291a`), and **waits on Will's ruling**; the
  wiring inherits a `demoCount` prop beside `qrUrl` (the demo event's real media count, from a
  build-time count or the guest page's RPC) because the scan's and the river's counts are stand-ins that
  must not ship as drawn, the scan's hand-and-phone cutout, the burst's per-card quiet zone and lg
  headline (its `KEEP` boxes are measured for the lab's two fixed canvases, so the wiring derives them from the lockup at layout time, a ResizeObserver on the type feeding the same clearance scan, or pins the lockup per breakpoint; never the literals against a fluid column), the river's parting held on the corridor's wall; the wiring round (after `kill-mono` lands: `cinema-hero.tsx` carries three mono hits and the
  `MonoCaption` import) then lifts the ruled variation's mechanics into `cinema-hero.tsx` (the
  source: the loop on `useAmbientPause` and a `<noscript>` companion for the deployed corridor; the
  reel: the announcement card `lg:fixed` and a `--radius-screen` step if its 24 px corner is ruled in;
  the gathering: the clearing profile and the parallax hook, retiring the four stacked darkenings);
  then: wire the ruled hero into
  `cinema-hero.tsx`, retire the board and record the ruling in `decisions/design-record.md#home-hero`;
  rule the kinetic word in the h1 (every variant reads better with it off, the photographs carry the
  variety now); and if the ruling is V3 (the arrival), the live-demo section at position 7 of the home
  arc needs its own round, since the two would say the same thing in one chapter. The hero stays UNLIT
  meanwhile: the wall is the ground, not a source.
- **Events then pricing on the home** are both card grids (four photo cards, then three pricing
  cards): the one soft adjacency left after the 2026-09-01 ruling ("no two sections back to back
  should feel repetitive"). Will named chapter 3 the model, so it stays until he wants it varied.
- **The events manifest fill** — the conference and trip stills are borrowed. Over the conference
  placeholder's white tablecloth the card copy needed a second scrim and still sits at 4.27:1 at the
  brightest 5% of pixels under the heading (median 5.6:1; measured 2026-09-01). The real photographs
  are the real fix; do not darken the scrim a third time for this one image.
- **The five remaining feature pages, one ground-up round each, in nav order** (Will, 2026-09-11:
  /features/qr, /curation, /sharing, /guests, /privacy), the album page as the model, section for
  section; they cut AFTER the library phase, two to three at a time, each claiming only its own
  route and sections directories (the queue in [`tracks/README.md`](tracks/README.md)). The brief,
  page by page (what each has today, the questions its round answers, the mechanisms to reuse, the
  corrections that must hold), lives in the track's manifest in git:
  `git show 0f52503:docs/tracks/marketing-feature-pages.md`.
- **The album's ambient pieces, a focused round later** (Will, 2026-09-11: "good enough for now, a
  little buggy"): the phone's screen cycle, the Live | Review photograph and the lightbox pill on
  `/features/album`. Neither browser tool can run them, so the round is judged on his screen.
- **The design lab on its own subdomain** (Will, 2026-09-11). He wants it "closely tied and unified
  with the marketing site and app for the agents to continually learn from and upgrade", which argues
  for ONE repository and a second Vercel project pointed at the same code, not a separate codebase:
  agents keep reading production components, and the lab stops shipping inside the product. ★ This is
  architecture, NOT a saving: measured at the cost round, all 13 lab routes cost 2.5 MB marginal in
  the trace, because every route bundle shares the same dependencies. The round decides the
  subdomain, how the gate travels with it, and which of the six filesystem-path tests move.
- **Admin as its own app on its own subdomain** (Will, 2026-09-11): "totally closed to regular users
  while continuing to be fully available to our orchestrators and agents". `admin.partyreel.com`
  already exists as a project domain and the portal is already host-gated to it, so the round is about
  making it a separately deployable surface rather than about the hostname. ★ Also not a saving: the
  16 admin routes cost 1.5 MB marginal. The win is the closed blast radius.
- **A docs diet for the two design docs** (a candidate off the "less is more" reset, 2026-09-12):
  `design-system.md` (885 lines) and `marketing-content.md` (636) are half record, half machinery now that
  the star pass demoted 59 of their 92 stars to past-tense notes; a round could move the per-page record
  into `decisions/design-record.md` and leave each doc the system and its landmines. Not before the UI
  era; Will: "we've just weighed ourselves down with docs and rules".
- **Design lab follow-ons from the gallery round** (2026-09-12): fold the two `SourceLink` copies into
  one (`gallery/gallery-ui.tsx` has the one to keep; `rules/page.tsx` was outside the track's lane), and
  link each contract block on `/design/library/rules` to its component's permalink at `/design/library/<id>`.
- **App polish the gallery's declarations surfaced** (2026-09-12): `shared/empty-state.tsx`'s comment
  says `"quiet" (default)` while the signature defaults to `"icon"`; `shared/action-tooltip.tsx` claims a
  200ms provider delay while `ui/tooltip.tsx` defaults to 0; `ui/drawer.tsx` and `ui/tabs.tsx` have no
  product call site and `ui/select.tsx` and `ui/sheet.tsx` exactly one each, so a round decides whether
  to use them or drop them.

- **The rounding round** (Will, 2026-08-31, off the glow board's section 04: "I'm thinking we go with
  that amount of rounding carried into our design system. Not just these components only."). He picked
  the 16px column over our sharp surfaces. Deliberately NOT applied in the glow round, because it is
  not a one-line token change and it restyles the whole product. **What the next agent should not have
  to rediscover:** (1) the `rounded-sm..4xl` scale is DERIVED from `--radius` by multiplication (md
  0.8x, lg 1x, xl 1.4x, 2xl 1.8x, 3xl 2.2x, 4xl 2.6x), so `--radius: 1rem` yields lg 16px but 2xl
  28.8px and 4xl 41.6px — the card he liked is `rounded-2xl`, so the literal reading overshoots what he
  actually approved; (2) blast radius is **288 uses across 140 files** in shipping code (`rounded-lg` 94,
  `rounded-md` 80, `rounded-xl` 60, `rounded-2xl` 44), plus a further 157 uses in 40 `(dev)` lab
  files that never ship (the glow round wrote "445 across 140", which paired the with-lab use count
  with the without-lab file count, and the lab half is self-inflating: this round's own specimens took
  lab `rounded-2xl` from 13 to 47); (3) the design system's stated rationale is that the
  sharp-surface / round-action CONTRAST is what signals "pressable", and surfaces at 16px collapse it,
  so the round has to decide what replaces that affordance (rounder actions? a different cue?);
  (4) `--radius-tile` (3px) exists because tight-gap grids open corner holes, and `--radius-float`
  (8px) because sharp reads broken on floating elements — both are separate tokens and may not want to
  move with `--radius`. Wants a preview of REAL pages at two or three candidate values before any
  commit. ✅ **Staged at round 2 (2026-09-01):** three knobs on the marketing motion tuner (`--radius`,
  `--radius-float`, `--radius-tile`, behind `?key=` on every cinema page), so the ruling is taken by
  dragging the real surfaces; verified live on the panel. **Ruled again 2026-09-12 (the "less is more"
  reset): a dedicated rounding and tweaking GUI round, Orchestrator-run, after `design-gallery`
  integrates**, and the tuner earns the sitting first: `TunerControl` gets a `description` and where each
  knob ships (Will: "some of the labels aren't very clear"), knobs grouped, a working set that survives a
  reload with an export block, a specimen for every knob or the knob retired (eight playground knobs have
  none), and two defects fixed (a Replay on the playground wipes every tuned value, because the control
  array is rebuilt per render and the effect cleanup removes the properties; values die on leaving the
  cinema group). Everything on the glow boards reads its token rather than a
  literal, so the lab inherits whatever lands here for free. **Opened 2026-09-14** as the Orchestrator's
  round of the review wave (`tracks/orchestrator.md` In flight): the `rounding` board on `/design/lab/rounding`
  is the sitting surface, the three action-radius knobs join the tuner, and a store outside the
  component (persisted, exported) fixes both defects at their one root. Bible 8 inherits the values.
  ✅ **The tuner earned the sitting (2026-09-14):** the store, the descriptions and ships lines, the
  grouped panel and export, the action trio, the retirements (nine knobs without a specimen), the
  board at `/design/lab/rounding`, the button ladder derived from `--radius-action`, and the two
  places that made the tokens deaf to the knob (the `:root, .surface-paper` alias and the lab's
  `.mono` sheet) fixed. **The sitting is Will's** (Waiting on Will, item 3).
- **The composition pass** (2026-09-14): when the review wave's six boards are ruled, one Orchestrator
  board stacks the ruled token blocks (ramp, accent, panel, light, type ladder, floating treatment,
  radius values) on the home arc and the dashboard, at both widths and on every ground, beside today;
  Will rules the sum once, and the wiring rounds cut from that.
- **The design lab's CSS tax, CLOSED 2026-09-02 (the library round):** the lab and `docs/` left the
  production scan (`@source not`; the lab compiles its own utilities from a second Tailwind entry that
  references `src/app/theme.css`, never `globals.css`), and the home's main stylesheet went from 304,277 to
  265,358 raw bytes (42,084 to 37,790 gzipped) with zero lab-only utilities left; the method and the columns
  are [`perf/v1-baseline.md`](perf/v1-baseline.md) section 5, the arrangement is pinned by
  `src/app/css-source-policy.test.ts`.
- **The engine's no-mask fallback is compiled away** (noted at round 0). `@supports not (mask-image: …)`
  is real in `globals.css` but absent from the built chunk: Lightning CSS evaluates the condition
  against browserslist, finds it statically false, and drops the block. Correct given the targets, but
  the source comment claims a protection that does not ship. Either accept and say so in the comment,
  or drop the rule. Same question likely applies to other `@supports not` blocks.
- **The hero's warm-up: built, measured, and pulled** (round 1, 2026-09-01). A sampled lamp paints on
  the house five and takes the photographs' hues a beat later, which on the home hero is above the
  fold. The proposed delight was to register `--glw-c1..5` with `@property` as `<color>` and transition
  them, so the lamp arrives neutral and warms into the wall's colour: "the lamp cannot be the colour of
  the wall until the wall has been read". It WORKS -- the registration takes (an unrelated probe reports
  the `initial-value` rather than an empty string) and the transition binds to all five.
  ★ **Pulled anyway, and the reason generalises: I never established the problem it solves is real.**
  The Browser pane runs hidden, so `document.hidden` is true, images never load, rAF is throttled to
  zero and transitions do not advance -- so the colour pop it hides was never actually observed being
  objectionable. Adding a mechanism to production because it *ought* to help is the same move that
  broke the contrast instrument at round 0. It also introduced a real if benign new state: measured, a
  frozen transition leaves the computed value at the OLD palette (`transition: none` applies the new
  one instantly, which is how it was isolated), so a background-tab visitor keeps the lamp set until
  focus. That fails toward the lit fallback, i.e. law 4's correct no-media branch, so it is safe -- but
  it is a cost with an unproven benefit. **Pick this back up the moment Will can say whether the swap
  reads as a bug on a visible screen.** One commit either way.
- **The lit surface (`[data-lit]`) rides the `light` exploration** (2026-09-14; bible 10 rewritten, 11 retiring; the cadence and the publish beat's violet ride the same board). Its history, so the next agent does not rediscover it: it wanted its own round, the way the corner became the rounding round.
  Its cue set was ruled (hairline + lip at 9%, the air blur gone) but the CONTRACT it amends was not:
  it adds two inset box-shadows against the ratified "Dark: NO shadows anywhere" rule in
  [`design-system.md`](systems/design-system.md), and it is already applied to three of four moment-12
  specimens including the flagship Get Pro card, while the board and its sheet (`sandbox/glow-lab.css`) both still say
  "lab-local until you rule". If adopted its production surface is every dark card in the app, which is
  why it should not ride inside a round about light. ★ Do NOT un-apply `data-lit` from the specimens to
  re-judge them on today's card: those are bare divs with no ring, so removing the 9% hairline puts them
  further from the shipped `Card`, not closer.
- **The spill wiring round** (the glow doctrine's second half; the lab boards are `glow-doctrine` +
  `glow-moments`). ✅ **ROUND 0 SHIPPED 2026-09-01**: engine promoted to `globals.css` unlayered,
  `--lamp-1..5` is the one palette home (`--mkt-confetti-*` aliases it), `FooterGlow` retired onto the
  engine, the doctrine moved into `design-system.md`. The one-way-door ADR is resolved rather than
  waived: the engine block carries ZERO colour literals, and the lamp set ships with its own fence
  (light only, never UI, enforced structurally by staying out of `@theme`). What remains is the
  PLACEMENT rounds below. Unmeasured and carried
  forward: the frame cost of the three sweep drives on a mid-range Android (the board has the meter
  and the buttons; a background tab throttles rAF to zero, so it needs a foreground window). The
  BEAM half of this round no longer needs porting: border-beam is vendored at
  `src/components/vendor/border-beam` and wired into doctrine 04 + moment 12. Both of its questions are
  CLOSED: the corner is the rounder one (Will, 2026-08-31), which grew into the rounding round above;
  and the palette question closed by evidence at round 0 — the beam's values are our own five hues
  through `oklchToSrgb` at effect-grade chroma, hue held exactly, so it is the LIVE REGISTER of the
  lamp set rather than a rival palette. Named in `design-system.md`, pinned by test. It stays literal
  `rgb()` in the vendored file on purpose: `styles.ts` regex-parses those strings to derive alpha
  variants, so a `var()` would silently break the gradients. Beam surfaces that ship:
  Get Pro at rest, the reel while it renders, the help palette while focused. The QR plate takes our
  own light instead (the beam reads too faintly on a white plate), and the upload takes NO light at all
  (the opacity climb and the bar already say it; the sweep read as forced).
  ★ **THE GROUND PICKS THE SIBLING** (found at the merge, 2026-08-31). Two of those three beam surfaces
  were specified against DARK lab specimens and do not have that ground in production, which is the
  exact condition that got the QR plate's beam rejected. The help palette is forced `surface-paper`
  (`help-palette.tsx`, the R6 forced-light rule) so it is near-white in EVERY session, and it is 8px
  `rounded-float` on a library authored for 16px+; the reel stitching dialog is `bg-popover`, near-white
  in any light-theme session. The system already answers this three ways and the ship list picked the
  wrong one twice: an off-black surface already exists one line away (`portalSkinProps("cinema")`);
  near-white surfaces do not need to become black to be lit, because `SPILL_REGISTER.paper` exists
  precisely because Will caught sampled light making a paper card look dirty rather than lit. So the
  rule, worth promoting into `design-system.md` with the doctrine: **ink takes the BEAM, paper takes
  SPILL in the paper register.** That is the sibling structure resolving by ground, not a workaround.
  Drop the help palette from the beam list (light it with paper-register spill, or ask separately
  whether a focused command palette wants to be a cinema surface, argued from what a palette should be
  and never from what the beam needs). The reel dialog is different: today's `reel-stitching-dialog.tsx`
  is a MINIMAL STAND-IN, not the finished reel-render experience (Will, 2026-08-31), so its current
  spinner-plus-bar signal set measures the stub rather than the surface. Park that beam and design it
  WITH the reel-render round. ★ General lesson: a minimal production surface is not evidence against a
  lab specimen; see the three-way test in `design-system.md`.
  ★★ **PREREQUISITE nobody logged: law 3 cannot fire on real user media.** `useSampledPalette`
  (`src/components/dev/sampled-palette.ts`) does `new Image()` with NO `crossOrigin`, then
  `ctx.getImageData()`. Our media is presigned against `*.r2.cloudflarestorage.com`
  (`src/lib/r2/client.ts`), a DIFFERENT ORIGIN, so the canvas taints, `getImageData` throws, and the
  hook's `.catch()` silently returns the fallback five. No console error, no failing test, no visual
  tell beyond "the colours look generic". Every lab specimen samples `marketingImage(...)`, which is
  same-origin, which is why the lab never caught it. Four ship-listed placements depend on sampling
  (the doorbell arrival, the album straddle, the publish beat, the paper probe). ★ **CORRECTED AT ROUND
  1: the blocker is much smaller than this said, and the album straddle was never blocked at all** (its
  card is marketing media, and it shipped). The R2 CORS rule listed as prerequisite work is ALREADY LIVE
  and already proven in production — the reel's canvas engine CORS-fetches presigned R2 media, decodes
  it and reads the canvas back on every export (`decodeImage` in `src/lib/reel/engine/assets.ts`), which
  is strictly more than this hook needs. So the unblock is a **loader swap** to that same `decodeImage`
  pointed at `previewUrl` (the ~16KB WebP already presigned for every row, which also covers video
  posters); reuse it rather than hand-setting `crossOrigin`, because its `cache: "no-store"` is
  load-bearing against R2's ACAO-less cache poisoning. The server-side-palette option is now the
  EXPENSIVE one, not the better one: no server-side image decode exists in this stack, `media` has no
  palette column, and the insert path is a locked-down SECURITY DEFINER RPC. Marketing placements are
  unaffected and sample correctly today.
  ✅ **The promotion's owed items closed at ROUND 1**: `GlowFilter` is now a server component mounted
  once in the root layout, and the live check it owed is answered — a dangling `url(#glw-warp)` does
  NOT blank the element, it drops the whole filter chain (`blur()` included), so a missing host is a
  visible quality failure rather than a crash. Dev-only console guard shipped. `sampled-palette.ts`
  moved to `lib/shared/`; `glow-contrast.ts` stays in `components/dev/` (it is the lab's measuring
  instrument, not a shipped dependency). **The cadence ruling is still open but its SHAPE changed**:
  all three lamps ship at 11s, so the honest A/B is no longer "the footer alone with nothing else
  moving" but the whole home page at 11s vs 8s.
  **Engine defects still open** (the vacuous animation guard was fixed at round 0): `effectiveAlpha`
  models one layer while its own docstring defines the worst case as base and band together, so the
  reported contrast ceiling is optimistic; ~~reduced motion parks the band mid-sweep at full strength~~
  **FIXED at round 1** (the declared rest is now the animation's own `150% 0` from-keyframe, pinned by
  test; nothing changes for no-preference visitors); a bloom's band sits lit while unarmed and
  snaps to 0 as it arms; `useInViewOnce(0.35)` is an element-area threshold, so a lamp taller than about
  2.86 viewports can never arm; and `BorderBeam` reads the OS colour scheme directly rather than
  `next-themes`, so any wrapper must pass `resolvedTheme` (never `theme`, which can be `"system"`).
- **The QR-to-album handoff wants its own ground-up visual-design round.** Killed off the glow board
  (Will, 2026-08-31) rather than inherited from it: the three scan-through directions there were
  argued from a glow doctrine, and the idea deserves to be designed from the product claim instead.
  One asset is KEPT and parked rather than killed: the **pour** (photographs leaving one object and
  landing in another), built and working in moment 11, waiting for a real "photos dump here" moment
  rather than being forced onto a surface that did not ask for it.
- **The `/design` lab gate on a preview is captured at BUILD time, so a branch whose newest
  deployment predates the env var 404s until it is pushed again.** `DESIGN_PREVIEW_KEY` IS set on
  the unscoped Preview target (so the lab is reachable on `lp/*` aliases; the `lp/blog-redesign`
  agent corrected the stale doc claim 2026-08-28). What is not obvious, and cost this agent a wrong
  finding: an already-built deployment never picks it up. Proven on one branch at one moment with
  one key: `lp/glow-doctrine`'s FIRST deployment still 404s on `/design` at its immutable URL while
  its latest serves the lab fine. `lp/about` is the remaining stale alias and will fix itself on its
  next push. Nothing to do here beyond knowing it: if `/design` (or `/design/library/marketing`, `/design/library/record`,
  a `/design/lab/<board>`) 404s on an `lp/*` alias, push again before concluding anything about the env.
- **One real bug the glow round surfaced, out of its scope** (its sibling, nine production keyframe
  names redeclared by `design.css`, closed 2026-09-02 in the library round: the blocks are gone and
  `src/app/keyframe-uniqueness.test.ts` pins every sheet). The repo has NO `forced-colors` and no
  `@media print` rule on any production surface; the spill engine is the first thing in the repo to
  carry either, so the pattern to copy now exists.

- **Elevation-program deferred queue (marketing).** Logged at
  R5/R6 settlement (2026-08-27): the **help catalog** shipped on `lp/help-catalog` (2026-09-01; the brief is
  [`content/help/AUTHORING.md`](../content/help/AUTHORING.md)) and left these one-liners: the `Checklist`
  component's persistence/draw is Will's preview call (revert the day-of article to `Steps` if it fails);
  in-app contextual deep links into help (the settings page → its article, the Studio → the reel guides);
  research-found product gaps that the catalog documents honestly rather than fixes — the
  `Video uploads are available on the Pro plan.` wrapper string omits the Event Pass, `?upgraded=1` is set
  by checkout and never read (no post-purchase confirmation), the settings selector says "Public" while the
  event header chip says "Open", `restoreEventAction.mediaStillRemoved` is never surfaced, the ops-only
  "missing ETag" upload error can reach a guest, the privacy FAQ's "flag a photo or video" overstates the
  event-level Report, `tiers.ts`'s comment still cites a retired 5-min/2-GB video limit, the guest
  404 page says the event "may have ended" (events have no end date) and the open-event unfurl
  promises "no account" even when the event requires one (keyed on `allow_anonymous_uploads`, the real
  column), and `lifecycle-recovery.md` says a guest's
  self-deleted upload is excluded from the host's Deleted list while `listRecentlyDeletedMedia`
  applies no such filter (only `restore_media` refuses it; a live check settles which is true);
  **self-serve account DELETION in the app** (supersedes the help article's contact path — swap the
  "Deleting your account" section of `your-data-and-deleting-your-account` AND the privacy policy's
  "Delete your account" choice when it ships); **a newsletter unsubscribe path** (the privacy policy
  promises removal on request within 30 days until one exists; `newsletter_signups` has no delete route
  and `notification_prefs` has no UI); **the EXIF-strip overclaim**: ruled 2026-09-02 to the "for the common formats" clause and fixed the
  same day on `sections/home/privacy.tsx`, `constants/features.ts` (twice), `jsonld.tsx`, the blog post
  and `src/lib/content/llms.ts` (the help article was already right); the two sites left,
  [`never-rides-along.tsx`](../src/components/marketing/sections/features/privacy/never-rides-along.tsx)
  and `feature-pages.ts`, belong to the `marketing-followons` track;
  **Stripe Checkout `consent_collection`** (a Terms checkbox on the hosted page; ruled off for now,
  2026-09-01, the guest door and /login carry the consent line); **print styles for the legal pages**
  (the cinema hero prints dark; the spill engine's `@media print` is the pattern); faq-accordion
  native-`<details>` → the `.mkt-acc` recipe (clocks aligned, markup not); the **MonoCaption sweep** (2026-09-11) is superseded: **mono is leaving** (Will, 2026-09-14; the `kill-mono` track removes the face and redesigns every place it did semantic work); **the voice-infusion round** (after `brand-voice` is ruled): the voice carried site-wide, the 30 feature-page strings, the 59 nav strings, the seven provisional headers, the MDX, the ten email templates and the inline app copy (`help-ui-labels.test.ts` makes an app-control rename a two-file change);
  **the floating layer has no reduced-motion gate of its OWN** (floating-surfaces, corrected in round 2, 2026-09-14: `tw-animate-css` ships no guard, and what holds bible 14 on all 36 floating surfaces today is the global `@layer base` clamp at `globals.css:855`, every animation and transition to 0.01ms with `!important`, carried since 2026-06-11; that guard's own comment calls a component-level gate the first line, and the board's `REDUCED_MOTION_CSS` is that gate, ready to paste in the floating wiring round); **`guest/entry-shell.tsx` renders a raw vaul drawer outside `ui/drawer.tsx`** with a literal radius `calc(var(--radius-action) * 1.4)`, so the surface most guests ever meet sits outside the token law (bible 8) and the floating-layer contract (bible 15): the tenth floating surface, onto whichever contract the ruling lands; **the lightbox backdrop is a literal `bg-black/90`** (`media-lightbox.tsx:617`, palette round 2), not the canvas token, so the deepest surface in the product moves with nothing: fold it into the grounds ruling; **`ui/tooltip.tsx`'s arrow** takes a literal `rounded-[2px]` (bible 8), the one literal radius left on the floating layer; **`ui/navigation-menu.tsx`'s viewport** cannot size itself outside the marketing header (its width rides a radix var that never lands on a lab page), so the mega-menu rendered anywhere but `marketing-nav.tsx` gets a 0-wide panel; **the board shell wants a frame** (the floating board's `frame.tsx` + scene route: an iframe at the canvas's true pixels for anything that portals to `document.body`; add it to `src/components/dev/board/` when the next board needs one);
  **the blog's cover pool is unlicensed for what it shows** (media-kit, 2026-09-14: Unsplash's terms exclude recognizable people, all twelve `MARKETING_IMAGES` are full of them, eleven cover 23 posts plus OG and RSS; replace before launch with the kit (`docs/ASSETS.md` row 7) or bridge with the staged CC0 batch on the blog pool only, Will's call); **`/design/lab/tools/reel-parity` hardcodes its eight `FIXTURES`**, so re-rendering a recorded `MARKETING_REELS` recipe needs a code edit rather than a control (read the clip ids off the recipe); **the media manifest has no home in `docs/systems/`** (fold `docs/specs/media-kit.md` section 2 into `marketing-content.md` when the rule is ruled);
  **inline code as a plate** in the help centre and the blog (kill-mono, 2026-09-14: `prose-code:font-sans` left ~260 code spans reading on the body face at weight 600 inside backticks; a muted plate would read better; its own round); **the operator emails' `<code>media</code>`** (`src/lib/email/templates.ts:169,196` renders in each mail client's mono face; an inline style or drop the tag); **the 404 title** (`shared/not-found-screen.tsx:55` is the one h1 without `font-heading`; the type wiring sweeps it with the ladder);
  **a "Watch your event highlights" video card** on another page, a CTA that links to `/reel` (Will, 2026-09-14: the round-two reel hero, redesigned as a section rather than the hero, since a film in the hero reads as the video being the product; the film ask in `docs/ASSETS.md` row 1 serves it);
  `/press` grows into the partnerships/ambassador kit (the press + brand kit itself shipped); post-launch event-type candidates `/events/birthdays` + `/events/memorials`;
  the media batch (per-vertical reel renders, a landscape wedding render, honest trip/conference
  subjects; the hub doors' and the album stages' stock photographs are placeholders Will replaces,
  "the only weak link");
  the **/contact identity revisit** — shipped at milestone-5 as the desk + note composite ("good enough
  for rising tides," Will 2026-08-28, "not in love yet"); the `contact-identity` touchpoint holds the
  explored range for the next pass; the **footer Claude assistant-link banner** — shipped at
  milestone-7 with Claude's "use caution" banner over the URL-injected prompt known and flagged;
  drop to ChatGPT-only if first impressions warrant; **the blog library's follow-ons** (2026-09):
  promote `?page=` to real `/blog/page/[n]` routes once deep-page indexing matters (today a cold load
  of a shared `?tag=`/`?page=` URL paints the unfiltered first page before hydration corrects it); a "Start here" curated strip above the
  rail once the archive passes ~40; the featured card's `Latest` eyebrow becoming the post's purpose
  label (a POV hero should read as an opinion, not a news item; the tag `kind` field is in place); a
  founder-voice origin post NEEDS A RULING first (the zero-team relaxation is /about-only); the
  incumbent claims in the `compared` posts get re-verified against the named products' current
  behaviour on each refresh (`updated` convention in the brief); **move `/contact` onto the
  cinema rhythm** (Will's 2026-08-28 ruling; privacy and terms moved in the legal round 2026-09-01, so
  /contact is the last `(paper)` page and the group retires with it); **the ink footer's token spray is ONE CLASS** (`.surface-ink` in `globals.css`, 2026-09-11: the nine plus the
  three it never redeclared, computed colours unchanged);
  **the `PageHero` sweep is COMPLETE** (2026-09-11, the library phase: three named registers,
  `rise | cut | blur`; the utility trio composes `blur` and /pricing composes `rise`; every marketing
  h1 holds at paint, and `marketing-h1-policy.test.ts` refuses the cut, the rise and the blur-rise on
  an h1). ★ `PageHero` owns ONLY the plain type lockup, a stage slot under it and a backdrop behind
  it; it must never absorb a hero whose object sits beside the lockup or a form (/qr, /blog's index
  masthead, the home hero stay bespoke by design)
  ([`ask-ai.ts`](../src/lib/constants/ask-ai.ts) carries the verified per-vendor behavior).
- **A mobile pass of its own** (Will, 2026-08-29): "we'll already need to make mobile tweaks in the
  future. Right now, I've really been reviewing desktop only." Every marketing round to date has been
  judged at desktop and merely checked for breakage at 375, so the phone is un-tuned by accretion
  rather than by any single decision. One round over the whole marketing site, not per page. The
  feature pages (2026-09-11) were measured at 375 for overflow and row balance, not for feel.


- **Cross-gallery sort/filter for the Uploads hub** — `get_my_uploads` is already filter-ready; add a
  **like-count** sort dimension. (The rest of the attribution initiative shipped + closed 2026-06-09,
  ADR-0015 → [`CHANGELOG.md`](CHANGELOG.md).)
- **Zip-export follow-ons** — an async build-to-R2 job for >cap (2000-item / ~20 GB) albums; a custom
  `export.partyreel.com` subdomain (v1 uses `*.workers.dev`). (The export itself shipped, ADR-0018.)
- **Preview-variant follow-ons** — a server-side BACKFILL of previews for pre-feature media; counting
  preview bytes toward the storage meter; the operator moderation feed's preview; an AVIF upgrade if
  quality ever demands it. (The client-generated `preview` variant shipped 2026-06-22.)
- **Unified per-upload size limit + per-event `max_upload_bytes`** (own round) — replace the per-type limits
  with a single per-upload ceiling = min(remaining storage, ~5 GB), enforced at presign; video stays
  Pro-only; keep a generous duration cap. See [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **HEIC/HEIF/AVIF + WebM metadata strip** — the client-side strip consciously fails open on item-based
  ISOBMFF (Exif is an iloc-referenced item; blanking `meta` would destroy the image) and EBML, so those
  formats still upload with metadata intact; close the residual leak window (iloc-aware blanking) if real
  devices turn out to upload unconverted HEIC. → [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **JPEG MPF secondary-image Exif scrub** — the Exif inside a post-EOI MPF secondary image (gain map /
  dual-shot preview) is consciously kept (excising shifts the trailer the MPF index points into; needs
  in-place TIFF surgery or coordinated MPF size+offset rewrites); the backfill report flags it as
  clean-but-GPS. → [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **Forensic capture follow-ons (ADR-0020)** — the A3-lite capture + legal hold + preservation +
  `/admin/forensics` SHIPPED 2026-07-07 (→ [`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)).
  Remaining, all gated: the pre-strip client-side EXIF capture (COUNSEL-GATED, ADR-0020 decision 1 — the
  server never sees EXIF post-strip, so extraction must run client-side before the strip); proactive
  hashing (PhotoDNA/Safer) at real scale; any media-serving re-architecture to widen the Cloudflare CSAM
  scanner past proxied traffic. The counsel sign-offs + NCMEC registration live in the Launch checkpoint.
- **Bulk Restore-all / Empty-bin** for the recovery bins (per-item already ships).
- **Immediate hard-purge for egregious content** in `/admin/albums` (today only soft-remove → 30-day window).
- **File-picker upload e2e reconfirm** on a real device (the optimistic-tile path is client-only; couldn't
  be driven via the Chrome MCP).
- **Arrival choreography fine-tune (post-roadmap lab round)** — Will's call closing P4.5: the lab sets
  direction during the program; on-device finetuning (beat/heights/morph timing via the touchpoint-11
  player + a real gated event) batches into one round after the V1 phases land. Include the
  password+account lighter-path feel and the account-step in-place-morph judgment call.

## Major overhauls (each its own planning round; drop related deferred tasks here)

- **QA hardening — the remaining fix queue** (the ~590-agent adversarial round of 2026-07-28/29;
  Q1-Q4 + the write spine shipped as milestone-1.5 — [ADR-0023](adr/0023-qa-round-product-rulings.md) +
  [`CHANGELOG.md`](CHANGELOG.md); this list IS the remaining queue). Roughly in the intended order:
  - **Abuse + jobs + observability:** #13 a `presign` abuse kind (pure TS, `action_attempts` is
    kind-generic; needs `Retry-After`/429 vocabulary the pipeline lacks today) · #14 the contact + careers
    limiter, fail-CLOSED (unauthenticated + unthrottled today: each call = one service-role insert + one
    Resend send, and ~3,000 requests drain the monthly quota, after which the orphan-sweep and prune
    breaker alerts cannot send) · #15 the purge cron + backup Worker have NO `/admin` surface and NO kill
    switch (the P8 mandate; `/admin/exports` + `/admin/reels` are the byte-identical template, and
    NOTHING persists a job run today — no heartbeat table exists) · #27 per-ROW isolation inside the
    sweep loops (isolation is per-sweep today, so one bad address aborts the rest of that sweep's
    accounts) · #37/#38 persist the pagination cursor for the backup reconcile + orphan sweep (both are
    function-local `let`s, so both restart at bucket head every run and nothing past the per-run cap is
    ever examined) · #39 POST id batches (supabase-js renders `.in()` into the URL; several sites can
    reach ~1000-2000 UUIDs) · #22 scrub Sentry (guest capability tokens ride the URL PATH, and
    `beforeSend` is error-events-only, so breadcrumbs/transactions/`extra` bypass the current scrubber)
    · #19 limiter failures are SILENT (fail-open is BY DESIGN — the token/session is the real gate,
    documented in `src/lib/security/abuse-rate-limit.ts` — but a limiter error today produces no
    Sentry/`captureError` signal, so a silently-dead limiter looks identical to a healthy one; add the
    observability, in both the abuse store and the unlock limiter) · a venue-NAT-aware per-IP limiter
    for `create_guest`/`create_report` (a naive per-IP cap blocks legit venue crowds; reuse the unlock
    limiter's count-failures design)
    · quick wins: hoist `assertResendEnv` ABOVE the `sent_emails` claim (a throw currently leaves the
    claim row, permanently suppressing that dedupeKey), #42 security headers (`poweredByHeader` is still
    on), a `STYLE_IDS.every(engineSupports)` catalog↔engine parity assertion.
  - **Infrastructure debt:** #46 CI (typecheck/lint/test/build on push — the 2026-07 Actions-minutes
    blocker is over: the daily DB-backup Action has been running green since the August reset, so
    minutes exist; validate a CI workflow now) · #45 recover the two live-only columns into a migration
    file (committed migrations can no longer rebuild the schema) · #44 preservation-prefix backup truth ·
    #47 teardown residue + stale doc claims.
  - **Carried-forward live verification:** #11 the >90-min presign-roll soak + #12 upload retry (fixed
    in code at milestone-1.5, never verified live; the two soak traps are in
    [`systems/testing-verification.md`](systems/testing-verification.md)). · **Follow-ons the `ops-hardening` track logged (2026-09-02):** a report-only CSP, then an enforced
  one (a per-request nonce through the streaming render plus an inventory of every inline style; its own
  project) · `X-Frame-Options` / CSP `frame-ancestors`, a one-line add once the CSP question is settled ·
  Session Replay records DOM snapshots and an `href` in them can still carry `/e/<qr_token>` (the replay
  scrub covers custom frames only; walking every snapshot node is more than it buys) · a dedicated
  `JOB_API_SECRET` instead of reusing `PRUNE_API_SECRET` as the internal-jobs bearer (cleaner naming; three
  homes plus a Worker secret plus a GitHub secret is why it was not done). · **From the `account-deletion` track (2026-09-02):** sweep the app routes for the JSX landmine it found
  on `/privacy` (a text node that contains an HTML entity loses its own leading space, so a bolded lead-in
  glues to the next word; the prerendered surface is clean as of `26341a7`, the dynamic app routes were not
  scanned, and no lint or test catches it) · a `deletion_requested_by` column so an operator-triggered
  deletion is distinguishable from a self-serve one after the fact.
- **Notification system** — the announcements overhaul · new bell signals (link-activity "new since last
  seen" deltas; billing `past_due` alerts, needs a denormalized flag on `profiles`) · a durable per-item
  feed + real-time push · per-item announcement un-read toggling · **the reel-published guest send** (R3
  ruled NO email until R5 and shipped only the seam: `setReelGuestVisibleAction` is the single publish
  hook — audience/transport design lands here, and late joiners see the card meanwhile, no catch-up mail).
  Build the foundational features first so
  we know what needs notifying. Extension point: [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md).
- **Admin / operations portal** — **P8 backend-ops & observability (the priority piece):** every backend
  job (the cron sweeps, the media-backup Worker + DLQ, the **weekly backup prune**, the DB backup)
  manageable + health-surfaced in `/admin` with zero silent failures (a missing nightly backup pages,
  never passes quietly). The prune currently ships **alert-only** (breaker trips page via Sentry + a
  deduped email); a job-runs heartbeat that ALSO catches "a job silently stopped running" lands here.
  (At very large scale, the prune+reconcile per-run bucket scans can move to a merge-join / deletion
  tombstone / shared copy-state index — see [`systems/durability-backups.md`](systems/durability-backups.md).)
  Also: an operator-action audit log · per-announcement edit + read receipts · live-Stripe subscription
  health on the account detail. See [`systems/admin-observability.md`](systems/admin-observability.md). **The MFA enrolment secret** (`src/components/admin/mfa-enroll.tsx:122`) is a bare `<code>`, so preflight still sets it in a mono stack (kill-mono, 2026-09-14; outside that lane): `font-sans`, or the muted plate the other admin codes took.
- **Vercel / Next.js optimization** — ~~the 12s guest-gallery poll~~ SHIPPED Phase 3 (doorbell +
  ETag/304 + stable presigns → [`systems/guest-flow.md`](systems/guest-flow.md)) · **dashboard
  Suspense streaming DEFERRED post-launch** (P5 S1, three live strandings: completions die inside
  radix TabsContent regardless of child shape, and even outside-radix boundaries displayed but
  never client-hydrated on this page while the guest page's identical shape works; revisit in the
  PPR/cacheComponents era - the permanent `/design/lab/tools/stream-probe` + the blocking page + loading.tsx
  are the baseline) · front Vercel
  with Cloudflare at launch (DNS already migrating there) · Vercel Spend-Management hard cap + alerts ·
  revisit the `proxy.ts` per-request `getUser` matcher scope · a large-gallery presigned-read strategy
  (per-media proxy/pagination beyond the Phase-3 stable buckets) · Realtime concurrent-connection quota
  (one socket per open guest tab) at launch scale · `cacheComponents`/"use cache" adoption post-launch
  (deferral rationale → [`systems/architecture.md`](systems/architecture.md)) · the **`(app)` dashboard
  first-load latency** (~1-3s to hydrate, observed 2026-06-09 — the layout fans out `getUser` +
  notifications + profile + avatar, then the page adds events + storage; Phase 5 streams/parallelizes
  the chain; Phase 3 added the interim `loading.tsx` skeletons).
- **Emails** — a transactional-email automation system + the guest "email me the album" auto-send (reuses
  `sendOnce`). See [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md).
- **The support-automation arc** — AI-default first responses keyed on `contact_submissions.topic` (the
  structured intake shipped 2026-08-28; the neutralized copy already permits automation) + auto-routing
  rules in `/admin/support`; published language must keep committing to outcomes only (the
  promise-neutralization doctrine, [`systems/marketing-content.md`](systems/marketing-content.md)).
- **The AI-SEO content arc** (its own round; the llms layer shipped at milestone-4) — the blog half
  SHIPPED in the library round (2026-09: 23 posts, question-shaped `faq` blocks + FAQPage on hubs
  and comparisons, incumbents named and rivals category-level per Will's 2026-08-28 ruling; category
  pages stay brand-nameless); still open: `.md` mirrors of key pages (the llms spec's optional convention) · the
  `/u/[slug]` sitemap/robots decision (ADR-0019 says indexable; needs a slug feed) · WebSite
  SearchAction (needs a real `?q=` route) · AI-referral analytics (UA-tagged hits on /llms.txt).
- **Billing follow-ons** — pricing **grandfathering** when the first price change happens (the policy is
  ruled + recorded in [`PRICING.md`](PRICING.md) "Grandfathering"; the build is `planForPriceId` mapping
  MULTIPLE historical Price IDs per plan, newest = the public offer) · a full [`PRD.md`](PRD.md) refresh
  to the shipped product (this consolidation pass fixed only the misleading era claims) · **per-pass dashboard management**
  (choose WHICH stacked pass a renewal extends, per-pass expiry rows in the storage meter; v1 renews the
  soonest-expiring, ADR-0025) · the `authenticated` role holds a latent table-level **TRUNCATE grant on
  `profiles`** (unreachable via PostgREST, found 2026-08-27; sweep table grants and revoke in the next
  security pass).
- **Share studio (QR + share-content configurator)** — (Will, 2026-06-11, from the V1 design lab's QR-card
  round) an in-app generator for polished share outputs so hosts never build their own: card presets
  (minimal-ink + photo-backed won the lab round), per-common-event-type curated stock cover images +
  generic sets (hosts rarely have a cover BEFORE the event), toggles for link/date/cover, mobile/story
  vs printable formats, multiple file types, drag-and-drop element placement as the stretch goal. Doubles
  as a growth lever (every output carries the QR) and keeps hosts on-site. Slots into the V1 program
  around Phases 5-6; needs its own planning round. **Foundation shipped:** the QR DESIGNER ("Customize",
  preset styles) now lives prominently in the event-page Share dialog (3b, 2026-06-21) — deliberately a fun,
  core, growth-loop feature, NOT tucked into settings; the share studio is its evolution into a full
  share-OUTPUT configurator (cards, covers, formats) on top of that QR styling.
- **Highlight reel — SHIPPED end-to-end through milestone-2** (curation + the canvas engine + the
  14-style catalog + Studio + guest surfacing/download; current truth
  [`systems/host-app.md`](systems/host-app.md) + [`systems/guest-flow.md`](systems/guest-flow.md);
  settled scope [`specs/reel-v1.md`](specs/reel-v1.md), ADR-0022/0024). **Deferred follow-ons:**
  Pro motion video (real video playing in the live player + trim; R2 CORS work) · multiple named
  reels · the reveal-moment polish · dropping the legacy `highlight_reels.theme` column (the R8
  destructive batch) · concise per-knob motion-tuner descriptions · the short-feed scroll-spy
  hand-off tune (with Will) · a future auto-scoring "best clips" worker (`highlight_score` /
  `reel_eligible` stay dead scaffold for it).
- **User profiles + social discovery — P1-P3 LIVE since milestone-2** (`/u/[slug]` profiles, the
  follow/block graph, the Guests feed section + guest list, the dashboard Following chip; the
  consent/privacy one-way-door is RULED in [ADR-0019](adr/0019-social-privacy-host-controlled-guest-list.md),
  do not re-litigate; current truth [`systems/profiles-social.md`](systems/profiles-social.md)).
  **Still ahead:** P4 (v2) the social feed (DEPENDS on the Notification overhaul above) + discovery ·
  the notification-prefs UI (R5 owns sends; storage + defaults shipped) · guest-list
  sort-by-upload-count (the contribution-encouragement idea, Will 2026-06-21). NOT launch-gating.

## Launch checkpoint (far off — a bucket; tasks get assigned here, handled together at launch)

**The clean launch point** (ruled 2026-09-02, with no date: "launch when everything's done"): every
published claim is true, every promised path exists, every backend job is operable from `/admin`, and
the switches below flip in a known order with nothing else pending. The agent-doable half runs as
tracks ([`tracks/`](tracks); the wave plan in [`STATUS.md`](STATUS.md)): the help catalog's nine gaps
closed or ruled, the EXIF claim corrected on its seven sites, the guest unfurl and 404 true for
account-required events, self-serve account deletion with an operator trigger, a newsletter removal
control, the contact and careers limiters failing closed, security headers on, Sentry scrubbing
capability tokens, every job with a kill switch and a heartbeat on `/admin/jobs`, CI on every push,
`.env.example` parity, legal pages that print, the `LEGAL_PARTY` flip rehearsed, the blur-rise heroes
with a visible h1, the root 404 tint, the marketing site at phone widths, the demo event on curated
media. **The `[human]` switches, in order:** counsel sign-off, the DMCA agent, the `privacy@` and
`help@` mailboxes → `LEGAL_PARTY` and both documents effective → Stripe live (the 4 products and 8
prices, the live webhook and portal with six-price switching verified, the 10 env values, one
real-card smoke) → Vercel Pro (the analytics vendor, the Spend cap, Cloudflare fronting and CSAM
scanning at the DNS move, the Realtime quota) → secrets Sensitive, leaked-password protection, the
Sentry alert rule, one DB-backup test-restore → the test-data reset, the demo token repointed,
`PRUNE_MODE=live` → the program teardown.

- Enable leaked-password protection (HaveIBeenPwned) `[human]` — no longer Pro-gated (checked 2026-09-02),
  so it can flip any time; the long-standing advisor WARN.
- Pick the web-analytics vendor at the Vercel Hobby → Pro cutover `[eng+human]` — Hobby collects free
  (pageviews only, hard caps); Pro activates the wired custom-event taxonomy but bills usage. Will's
  pricing research (2026-08-28): PostHog gives 1M events/mo free (likely covering launch traffic
  entirely), then $0.00005/event ($50/M) vs Vercel's ~$30/M; past ~15M events/mo PostHog's volume
  tiers ($0.0000295/event) undercut Vercel. So the call is cost vs features (PostHog adds funnels +
  session replay, strongest once the app opens) with observed marketing traffic in hand; other
  candidates: Cloudflare WA (free, shallow) / self-host Umami / GA4 (free, consent banner + ad-block
  losses; the move if Google Ads enter). The swap is one file (`src/lib/analytics/web.ts`); see
  [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md).
- Counsel sign-off gate (ADR-0020 D2) `[human]` — before launch counsel signs: (1) the privacy-policy +
  ToS forensic-capture disclosure language (IP/UA/geo/device UUID per upload), (2) the CSAM incident
  runbook ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)) + NCMEC registration,
  (3) the retention schedule (media-lifetime rows, 1-year preservation), (4) the pre-strip EXIF capture
  go/no-go. The 8-item checklist is in the T1 options-doc (git history: `decisions/t1-forensic-csam-policy.md`).
- NCMEC CyberTipline ESP registration `[human]` — register before launch (prep note in
  [`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)); if denied, we still report actively.
- Enable the Cloudflare CSAM Scanning Tool at the DNS move `[human]` — free; scans only proxied traffic
  (cannot see presigned R2 media — state that plainly), per ADR-0020 C2.
- Stripe test → live cutover `[eng+human]` — re-create the 4 products and 8 prices in live (three Pro
  products carrying six recurring prices, monthly and annual each; the Event Pass product carrying the two
  one-time prices), named WITHOUT the em-dash the test products carry today (those names render in
  Checkout and the portal), + swap the 10 env values (code unchanged); the runbook is
  [`PRICING.md`](PRICING.md) "Stripe setup" (corrected 2026-09-02 by the `legal-billing-truth` track).
- Verify the Stripe Billing Portal permits switching between the six Pro prices (monthly and annual) `[human]` — now
  LOAD-BEARING, not cosmetic: per ADR-0023 1b a Pro host changing storage size is routed to the
  portal (checkout refuses the second subscription it used to create silently). If the portal's
  product config does not allow the swap, a paying host has no self-serve way to resize. The default
  portal configuration (`bpc_1TcTxWPtjqmVkBwkcAldFEZA`) enables `subscription_update` with
  `default_allowed_updates: ["price"]` and `proration_behavior: always_invoice`, but the API returns no
  `products` list, so the actual switch set is unverified from the API side (2026-09-02): a dashboard look,
  or a portal session opened as a Pro host.
- Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER` (currently 3× the storage cap, ADR-0021) before
  Pro launch `[eng]` — confirm the multiplier holds at real scale.
- Legal go-live `[human]` — the documents are written (v1.0, 2026-09-01, incl. the forensic-capture
  paragraph and the Sentry replay line); after counsel signs the gate above: (1) fill `LEGAL_PARTY` in
  [`src/lib/constants/legal.ts`](../src/lib/constants/legal.ts) (entity, state, address, DMCA agent)
  and flip both documents' `status` to `effective` with an `effectiveDate` (`legal.test.ts` refuses a
  bracketed placeholder once effective, so the fill cannot be skipped; the 2026-09-02 rehearsal showed the
  flip also needs one line of that test, whose pending status-line assertion reads the live meta: the diff is
  in `docs/tracks/legal-billing-truth.md` until the milestone prunes it, then in git); (2) register the DMCA
  designated agent with the Copyright Office ($6, renewed every 3 years) so the Terms' safe-harbor
  section is true; (3) create the `privacy@partyreel.com` mailbox both documents name, routed to the
  support inbox.
- Swap the demo event to curated media `[eng+content]` — repoint `NEXT_PUBLIC_DEMO_QR_TOKEN` to a dedicated
  event with catchy approved media.
- Committed automated RPC integration suite `[eng]` — replace the per-change rolled-back MCP checks. BLOCKED
  on a direct pg connection; the exact gaps + the two unblock paths + the intended test list are in
  [`decisions/rpc-suite-blocked.md`](decisions/rpc-suite-blocked.md) (2026-07-03).
- Confirm the Sentry email-alert rule fires `[human]`.
- Pre-launch test-data hard reset ("Recovery Phase 6") `[eng]` — the deletion-aware prune has shipped (in
  dry-run), so the "reset ≥35 d before launch so test objects age out of the Bucket Lock" timing
  constraint is gone.
- Flip the backup prune to live `[human]` — set `PRUNE_MODE=live` in `workers/backup/wrangler.jsonc` +
  redeploy once the primary is populated (it ships in dry-run, deleting nothing). Also set the shared
  `PRUNE_API_SECRET` (Vercel + `wrangler secret put`). See [`systems/durability-backups.md`](systems/durability-backups.md).
- Revisit the git workflow for production `[eng]` — the elevation program runs on the `launch-prep`
  integration branch (see [`../CLAUDE.md`](../CLAUDE.md) Git); when the program ends, decide the standing
  post-program workflow (straight-to-main speed vs branches/PR previews once real users arrive).
- **Elevation-program teardown** `[eng]` — when the program's final milestone merges: re-enable Vercel SSO
  deployment protection (`ssoProtection: all_except_custom_domains`), delete the temporary Stripe TEST
  webhook endpoint `we_1U1I3GPtjqmVkBwkjUqWGpvR` (the launch-prep preview endpoint, recreated in the
  2026-08-05 P3 migration — it must NOT survive into the live-mode cutover), remove the preview origin from
  the R2 `partyreel` bucket CORS + the Supabase auth redirect allow-list, remove the 3 branch-scoped
  Vercel env vars (`NEXT_PUBLIC_SITE_URL`/`STRIPE_WEBHOOK_SECRET`/`DESIGN_PREVIEW_KEY` @launch-prep),
  delete the `launch-prep` branch +
  `lp/*` remnants, decide the post-program fate of the `lp/*` build gate (`vercel.json`
  `ignoreCommand` → [`scripts/vercel-ignore-build.mjs`](../scripts/vercel-ignore-build.mjs), part of
  the "revisit the git workflow" item above), and revert CLAUDE.md's git section to the post-program rule.
- Close the AWS Remotion sub-account (console) `[human]` — the Lambda render path was torn down 2026-07-08
  (canvas + on-device client-encode is the only reel path now); the sub-account under `partyr33l@gmail.com`
  (the `remotion-lambda-role`/`remotion-user` IAM + the deployed Remotion site/function) has no remaining use.
- Toggle critical secrets to Vercel "Sensitive" `[human]` — pre-launch all env vars are non-sensitive (so
  values stay swappable); at launch flip the critical ones (the Supabase service-role key, Stripe + webhook,
  `CRON_SECRET`, `PRUNE_API_SECRET`, `UNLOCK_COOKIE_SECRET`) to Sensitive.
- Self-serve account deletion with its operator path `[eng]` — gating; the `account-deletion` track
  ([`tracks/account-deletion.md`](tracks/account-deletion.md)).
- The four QA items that are launch truth, cross-listed from the QA bucket `[eng]` — #42 security
  headers, #22 Sentry scrubbing capability tokens, #19 limiter observability plus the contact and careers
  limiters failing closed (the `ops-hardening` track), and the guest unfurl and 404 true for
  account-required events (the `product-truth` track).
- CI on every push `[eng]` — the `ci-workflow` track; a program prerequisite for the wider fan-out.
- The blur-rise heroes' foreground LCP read (the h1 at `opacity: 0` until hydration; the "Now" item)
  `[eng]` — the `marketing-followons` track, as a named entrance register with the h1 visible at paint.
- Cloudflare fronting at the DNS move and the Realtime concurrent-connection quota `[human]` —
  cross-listed from the Vercel / Next.js bucket so they are not forgotten at the cutover.
- One DB-backup test-restore `[human]` — prove the backup restores before it is the only copy.
- The `help@partyreel.com` mailbox `[human]` — the help center and the documents name it; confirm the
  receipt path once it exists.
- `.env.example` parity with `env.ts`, pinned by a test `[eng]` — the `legal-billing-truth` track.
- The marketing site tuned at phone widths, judged on Will's phone `[eng+human]` — gating; the
  `marketing-mobile` track.
- A per-account throttle on the deletion request `[eng]` — beyond Supabase Auth's own OTP limits it is
  unlimited; it needs a live session plus a password or an emailed code, so the exposure is a borrowed
  session rather than a stranger, but the throttle is cheap insurance (the `account-deletion` track's note).
- Submit the apex to the HSTS preload list `[human]` — a one-way door for the domain and every future
  subdomain (`max-age` already meets the list's requirement; the header ships without `preload` on purpose).
- `SUPABASE_DB_URL` into `.env.local` `[human, 15 minutes]` — unblocks the committed RPC integration
  suite above.

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they're roadmap-ready (co-hosts, referral
program, guest→full-user conversion, host 2FA, proactive CSAM filtering, NSFW / host trust-level configs, a
content CMS, a Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this
file to actual upcoming work. Pull one in here (as a Now task or a new overhaul bucket) when it's ready.
