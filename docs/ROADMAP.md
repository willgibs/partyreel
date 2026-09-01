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

- **The home hero redesign** (Will, 2026-09-01: "I'd love a full home hero redesign"). A design
  problem, not a lighting one; deserves the lab and his rulings, as its own round. The hero stays
  UNLIT by ruling meanwhile: the wall is the ground, not a source.
- **The album chapter's opener** — assess on screen against the round-2 arc whether the straddle
  already reads as the paper chapter opening; `SECTION_HEADERS.album`'s note ("wants more distinctness
  from the live demo before it") predates the pacing principle and may now be answered by the wind-down.
- **The events manifest fill** — the conference and trip stills are borrowed. Over the conference
  placeholder's white tablecloth the card copy needed a second scrim and still sits at 4.27:1 at the
  brightest 5% of pixels under the heading (median 5.6:1; measured 2026-09-01). The real photographs
  are the real fix; do not darken the scrim a third time for this one image.

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
  dragging the real surfaces; verified live on the panel. Ruled to run AFTER the library round, before
  branching agents. Everything on the glow boards reads its token rather than a literal, so the lab inherits
  whatever lands here for free.
- **The design lab taxes production CSS, and nobody had measured it** (found verifying milestone-13,
  2026-09-01). Tailwind v4 generates its utility layer from a scan of the source tree, and
  `src/app/(dev)/design/` is in that tree, so a utility used ONLY by a lab specimen is still emitted into
  the shared stylesheet every production page loads. Measured by diffing the homepage CSS of two
  production deployments across the glow merge: **+2,752 bytes uncompressed, 26 selectors added and 0
  removed, every one of them lab-only** (`-inset-14`, `accent-current`, `-bottom-16` and friends, each
  with zero occurrences in production source). Small today and entirely dead weight (no production
  element uses them), but it is a standing cost that grows every time the lab does, and the lab is now
  the largest thing in the repo: **89 files, 29,463 lines** (`design.css` alone was 2,725 before round 0
  cut it to 1,894).
  ★ **THE LEVER EXISTS AND IS UNUSED.** `@source not "..."` is implemented in the installed Tailwind
  4.3.0 (verified in `node_modules/tailwindcss/dist/lib.mjs`: paths must be QUOTED and the directive
  cannot be nested), so it is one line at the top of `globals.css`. There is no `@source` anywhere
  today, meaning the scan is fully automatic and the whole lab is in it. Caveat for whoever does it: it
  also stops emitting classes the lab genuinely needs, and it does nothing about `design.css`'s own
  bytes (those are excluded by the route-group import, not by the scanner). Pin the number in
  [`perf/v1-baseline.md`](perf/v1-baseline.md) either way.
  ★★ **AND THE BIGGER HALF IS NOT BYTES** (Will, 2026-09-01): the lab has become "a massive working
  record of all experiments", and all that stale information distills what actually matters. Worse, the
  volume of unused rules reads to a new agent as **a huge bible of design law they must obey**, which
  works directly against rising tides, whose whole premise is that a better system can be reshaped
  rather than worked around. So this is not a bytes cleanup: **distil the lab into a minimal internal
  design-system library**, keeping the ratified primitives and the live decision records, and letting
  git history hold the rest. Pre-launch. Round 0 started it for free (the doctrine's LAWS moved to
  `design-system.md` and the engine left `design.css`, -31%); the pattern to repeat is "when something
  is ratified, the rule leaves the lab with it".
  ★★★ **SEQUENCED BY WILL (2026-09-01): this runs AFTER the Glow integration rounds, not before.**
  "Let's go through all of our rounds of integrating the new Glow branches' work across marketing and
  app. Once complete, we'll review everything still remaining in the lab, pull anything still remaining
  that may benefit the streamlined design system library, and effectively wipe everything that's left
  stale." Distilling first would freeze boards whose placements have not shipped yet, against the very
  pattern above. The integration order: **R1 the home page ✅ (2026-09-01)** → R2 the guest surfaces
  (doorbell arrival, locked door, awaiting-media; blocked on one ruling, since `/e/[token]` follows the
  visitor's own theme and all three were argued on cinema, plus the sampling loader swap) → R3 the Get
  Pro beam + the lit surface, which are entangled (three of four beam specimens already wear
  `[data-lit]`) → R4 the publish beat's violet. **Then** the lab review.
  ★ Two lab-fidelity findings to carry INTO that review, both the same class: moment 05's specimen is
  vertically INVERTED from the surface it names (paper above / dark below, where production is the
  opposite) and claims a 160px overhang where the real one is 63px; and moment 09's lamp does not
  exist at all, since /press has no real photograph left to sample ("every frame is ours"), so its ship
  verdict needs re-arguing or dropping. A specimen that does not model its own surface launders a guess
  into a ruling.
- **`marketing-css-policy.test.ts` rule 3 is a bad system, not a good rule** (the round-0 rules audit,
  2026-09-01). Its `selectorLines()` treats ANY line ending in `,` as a selector, so multi-line CSS
  values are misparsed and a legitimate ` * ` inside `calc()` reads as a universal selector. It has
  already distorted authoring once on the record (`marketing.css:1353` documents a formatting
  compromise made to appease it) and would have rejected the promoted halo mask on eight lines. The
  intent is right (no bare element selectors in a scoped stylesheet); the parser is wrong. Fix: only
  treat a line as a selector when it precedes a `{` at brace depth 0, and strip declaration bodies
  first. Small, and it removes a standing tax on how CSS may be written in that file.
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
- **The lit surface (`[data-lit]`) wants its own round**, the way the corner became the rounding round.
  Its cue set was ruled (hairline + lip at 9%, the air blur gone) but the CONTRACT it amends was not:
  it adds two inset box-shadows against the ratified "Dark: NO shadows anywhere" rule in
  [`design-system.md`](systems/design-system.md), and it is already applied to three of four moment-12
  specimens including the flagship Get Pro card, while the board and `design.css` both still say
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
  next push. Nothing to do here beyond knowing it: if `/design` 404s on an `lp/*` alias, push again
  before concluding anything about the env.
- **Two real bugs the glow round surfaced, both out of its scope.** (1) `design.css` REDECLARES nine
  production keyframe names (`rvl-flash`, `rxp-bloom`, `rxp-pubglow`, `mkt-kenburns`, `mkt-cut`,
  `mkt-marquee`, `mkt-scan`, `mkt-pulse`, `mkt-progress`); keyframes are document-global and the last
  definition wins, so any `/design` visit shadows the production definitions for the rest of the
  session. Worth a uniqueness pin across the three sheets. (2) The repo has NO `forced-colors` and no
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
  event-level Report, and `tiers.ts`'s comment still cites a retired 5-min/2-GB video limit;
  the dedicated **legal agent** fills privacy/terms bodies in the `LegalArticle` shell (section ids stable;
  the plain-language drafts are its brief); **self-serve account DELETION in the app** (supersedes the help
  article's contact path — swap the "Deleting your account" section of
  `your-data-and-deleting-your-account` when it ships); faq-accordion
  native-`<details>` → the `.mkt-acc` recipe (clocks aligned, markup not); FAQ/GoDeeper unification onto
  `shared/` (M3's ready-to-apply plan); the **MonoCaption sweep question** for legal status lines + GoDeeper captions (press facts were
  settled on `/press` 2026-08-28: mono holds data only, Inter for every label and descriptor);
  `/press` grows into the partnerships/ambassador kit (the press + brand kit itself shipped); post-launch event-type candidates `/events/birthdays` + `/events/memorials`;
  the media batch (per-vertical reel renders, a landscape wedding render, honest trip/conference subjects);
  the **/contact identity revisit** — shipped at milestone-5 as the desk + note composite ("good enough
  for rising tides," Will 2026-08-28, "not in love yet"); the `contact-identity` touchpoint holds the
  explored range for the next pass; the **footer Claude assistant-link banner** — shipped at
  milestone-7 with Claude's "use caution" banner over the URL-injected prompt known and flagged;
  drop to ChatGPT-only if first impressions warrant; **move the remaining `(paper)` pages onto the
  cinema rhythm** (Will's 2026-08-28 ruling covers legal, privacy and contact too — blog/careers/press
  arrive via their own branches, so this is the leftover trio, and `(paper)` retires when the last one
  moves); **unify the ink footer's 9-token spray with a shared dark-ground set** (the /about round's
  `CINEMA_TOKENS` analysis found three tokens the footer never redeclares — `--card-foreground`,
  `--muted`, `--shadow-float` — which is why its Start-free link is hand-rolled instead of a `Button`;
  behavior-neutral, guarded by `footer-contract.test.ts`, deliberately not done inside a merge);
  **settle `PageHero`: one hero entrance, then sweep the twelve hand-rolled copies onto it** (Will,
  2026-08-29 — one round, after careers lands, never inside a merge). Two halves of the same
  question. (a) ENTRANCE: `PageHero` uses the chapter-1 rise while /help, /contact and /careers
  arrive on the texts-reveal blur-rise — two grammars for one slot; note `.mkt-line` forces
  `display:block`, so a blur-rise lockup needs its own handling for the actions row, and its
  `opacity: 0` rest state is why those pages gate their own h1's paint. ★ That last part is a REAL
  BUG the sweep closes, on **4 of 22 marketing h1s** (pricing, /help index, /contact, /careers): the
  h1 ships at `opacity: 0` and paints only after hydration plus an observer, which is exactly the LCP
  hole `PageHero` already forbids. ★ And /careers is confirmed to QUALIFY (checked at its merge,
  2026-08-29) — its hero is a plain eyebrow/h1/subhead/actions lockup, with the contact sheet a
  BACKGROUND sibling rather than part of it — so the old "careers still hand-rolls, so the sweep is
  blocked" framing is retired; only (a) blocks it. (b) ADOPTION: only /about and
  /press compose it, while TWELVE pages hand-copy its exact lockup inline (`<Reveal>` + `Eyebrow` +
  the identical `text-4xl…lg:text-7xl` h1 + subhead + a two-Button row) and have already drifted to
  `gap-5` against its `gap-6`. The sweep is blocked on (a): those twelve differ in entrance
  (`data-mkt-reveal` vs `data-mkt-cut`, and /features/curation deliberately keeps its h1 static), so
  `PageHero` needs an entrance prop before any of them can move. ★ `PageHero` owns ONLY the plain
  type lockup — it must never absorb a hero with media, a form, or its own object (/blog's index
  masthead, /help's instrument row, the home hero all stay bespoke by design)
  ([`ask-ai.ts`](../src/lib/constants/ask-ai.ts) carries the verified per-vendor behavior).
- **A mobile pass of its own** (Will, 2026-08-29): "we'll already need to make mobile tweaks in the
  future. Right now, I've really been reviewing desktop only." Every marketing round to date has been
  judged at desktop and merely checked for breakage at 375, so the phone is un-tuned by accretion
  rather than by any single decision. One round over the whole marketing site, not per page.
- **The sticky-offset split** (found in the careers merge, 2026-08-29): reading rails use `top-24`
  (96px — /help/[slug], the legal shell, the careers role page) while index rails use
  `calc(var(--mkt-header-h) + 1.5rem)` (88px — /blog, /press, the /help index). Both are consistent
  WITHIN their family, so neither is a bug; it is one number that should come from the same knob.
- **The reply line, hand-copied on seven surfaces** (found in the careers merge): "Every note gets a
  reply, usually within a day." lives inline on /press, /help, /contact (×3) and now /careers, plus a
  `REPLY_LINE` const in the contact lab. The content-policy test already NAMES it as the standard
  line, which is the tell that it wants one home.

- **Collapse the THREE FLIP implementations to one** (found in the /blog merge, 2026-08-29): the
  shared [`use-flip.ts`](../src/lib/shared/use-flip.ts) (event feed + blog library, now two-axis and
  covered by `use-flip.test.tsx`), a stale lab-local copy under `(dev)/design/event-feed/`, and a
  third inlined in `use-sortable-grid.ts`. Only the shared one got the two-axis + prune work, so the
  other two are now behind it. Behaviour-neutral consolidation; its own small round.

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
    [`systems/testing-verification.md`](systems/testing-verification.md)).

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
  health on the account detail. See [`systems/admin-observability.md`](systems/admin-observability.md).
- **Vercel / Next.js optimization** — ~~the 12s guest-gallery poll~~ SHIPPED Phase 3 (doorbell +
  ETag/304 + stable presigns → [`systems/guest-flow.md`](systems/guest-flow.md)) · **dashboard
  Suspense streaming DEFERRED post-launch** (P5 S1, three live strandings: completions die inside
  radix TabsContent regardless of child shape, and even outside-radix boundaries displayed but
  never client-hydrated on this page while the guest page's identical shape works; revisit in the
  PPR/cacheComponents era - the permanent `/design/stream-probe` + the blocking page + loading.tsx
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
- **The AI-SEO content arc** (its own round; the llms layer shipped at milestone-4) — question-shaped
  comparison/blog content for assistant retrieval (category pages stay brand-nameless per Will's
  2026-08-28 ruling) · `.md` mirrors of key pages (the llms spec's optional convention) · the
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

- Enable leaked-password protection (HaveIBeenPwned) `[human]` — Pro-gated; the long-standing advisor WARN.
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
- Stripe test → live cutover `[eng+human]` — re-create products/prices in live + swap the 5 env vars
  (code unchanged); checklist in [`PRICING.md`](PRICING.md).
- Verify the Stripe Billing Portal permits switching between the three Pro prices `[human]` — now
  LOAD-BEARING, not cosmetic: per ADR-0023 1b a Pro host changing storage size is routed to the
  portal (checkout refuses the second subscription it used to create silently). If the portal's
  product config does not allow the swap, a paying host has no self-serve way to resize.
- Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER` (currently 3× the storage cap, ADR-0021) before
  Pro launch `[eng]` — confirm the multiplier holds at real scale.
- Real `/privacy` page `[content]` — replace the stub; include the drafted Sentry session-replay
  disclosure line.
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

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they're roadmap-ready (co-hosts, referral
program, guest→full-user conversion, host 2FA, proactive CSAM filtering, NSFW / host trust-level configs, a
content CMS, a Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this
file to actual upcoming work. Pull one in here (as a Now task or a new overhaul bucket) when it's ready.
