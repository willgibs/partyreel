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

## Now (concrete, pick-up-able; one line each, the provenance in git)

- The app round (Will, 2026-09-19: the host app and the guest pages unprotected, "closer to a Frankenstein's monster"), cut on freed seats in order, all four integrated and on the desk (`app-shape`, `guest-shape`, `privacy-concept` (round three, a new concept: "the image trail was a takeaway win... maybe more fitting for its theme"), `app-vocabulary`); his tile-size control lives in `app-vocabulary`, his centred event header in `guest-shape`; the seams are in `tracks/orchestrator.md`. Two findings to fix regardless of the boards: `/u/[slug]`'s 404 falls through to the marketing chrome (no `(guest)` not-found boundary), and `guest/file-dropzone.tsx` is a relic rendered only by the host's manual add.
- From `app-vocabulary` (2026-09-19): the Reel Studio (`dashboard/[eventId]/reel/page.tsx`) awaits the same presign-heavy read as the dashboard and the event page but carries no `loading.tsx`, freezing the previous screen whichever `loading` option wins; and the Likes tab draws two empty treatments for one interaction on timing alone (`EmptySectionTeaser` when the dashboard already knows it is empty, a bare `EmptyState` in `my-likes-gallery.tsx`'s client fallback when unliking the last photograph), worth one answer whichever `empty-states` option wins.
- The stacking round (Will, 2026-09-19, while deployments are capped: "explorations are, at worst, net neutral and deleted"): five boards on the free seats, `demo-event`, `app-door`, `contact-page`, `press-page`, `app-pricing`; each was cut from a read-only map whose seams are in `tracks/orchestrator.md` ("The app round's map"). Findings to fix regardless of the boards: the press kit's mark and icon plates are the retired Aperture glyph (ASSETS row 19); "Availability: Live now" is ungated on a pre-launch branch; the demo's bulk export APIs hide `isDemo` in the UI only; the careers form re-implements `/contact`'s contract in parallel.
- From `guest-shape` (2026-09-19, the lab): `lab:demo`'s "same picture" warning is not stable on a board whose frames load photographs and a dynamically imported QR (three different pairs across four runs, every one visibly different in the captures); its settle could wait on the frames' images rather than a fixed 1,600 ms. The board's own recommendation for the seams it did not draw (the growth hook's place, `/u/[slug]`'s thinner header and 404, the two footers): one "where Partyreel appears" board once the shape is settled, drawn against the footer.
- From `app-shape` (2026-09-19, the lab): `defineExploration` defaults every control to its decision's recommendation, which draws every other decision's "as today" option wearing a candidate unless the board works around it (the board did; the constructor should not); a step reached by URL while staged behind an unanswered `after` renders its head as a step count it is not; `src/components/app` still has no `@contract-for` test (seam 13).
- From `album-wiring` (2026-09-19): the album stage's stand-in stills decode at about 2 MB each into a 287 px tile (16.8 MB for the hero) because `MediaTile` serves the source file straight, so marketing stills want a derivative (row 22 is the other half); `HERO_FIXTURES` / `HERO_FRAME_H` / `HERO_SEED_COUNT` now serve only `use-album-fill.test.ts` (fold or delete); `glow-placement.test.ts` refuses `overflow-hidden` on a lamp's wrapper while the halo must clip to its object (`clip-path` satisfies both; except `shape="halo"` or name `clip-path`); with `album-page` retired, `sandbox/privacy-hero/field.ts`, `field-layer.tsx` and `field.css` have no reader left: the next lane in that directory cuts them.
- From `trail-wiring` (2026-09-19): the two group 404s ((cinema) and (paper), a `notFound()` inside a marketing route) still ship as 60vh boxes with the tile strip; give them the trail or rule the root 404 the only one that carries it; `collect-specimens.mjs` cannot read a specimen hoisted into a named const (it ships with no code panel and `specimens.test.ts` cannot see it), so a guard that fails an entry the collector could not read is owed.
- From `gallery-wiring` (2026-09-19): the guest album's column-major flow puts the newest photographs down the left column, which reads out of order at five to eight columns where it did not at two; decide row-major against Will's eye on a real album before rebuilding the layout (a different engine, not a class); `--album-column` (220 px, `shared/masonry.tsx`) is the one knob a tile-size control sets on an ancestor, every grid under it following (`app-vocabulary`).
- From `backdrop-wiring` (2026-09-18): the plate's worst block anywhere inside the pane is 3.46:1 against 5.12:1 in the bands the copy occupies, headroom today, so a second placement whose copy sits nearer the pane's corners re-measures or takes `--bkd-brightness` to 0.45 (measured to lift the whole pane past 4.5:1); the reading band (`-45% 0px -45% 0px`) is the site's first scroll-position readout, and a second one belongs in one place with it; if Will reads the demo and the album as one long section, the album's heading steps down to `text-section` first (written in `album.tsx`).
- From `cursor-backdrop` (2026-09-18): the wiring caps the served width and keeps the pool at five or six (a full-bleed layer at 2880 decodes at about 22 MB); the entering photograph's offset could scale with pointer speed (one line in the engine); the phone's `scroll` rule reads the section's real scroll progress rather than the board's scripted path.
- From `image-trail` (2026-09-18): `defineExploration` should dedupe its flattened `configs` by id (three boards carried the same six-line filter; `guest-shape` makes four); `field.ts`'s `TrailSpec`, `field-layer.tsx`'s trail rendering and `field.css`'s `.fld-smear` / `.fld-ghost` are dead since `spirals.ts` went and only `album-page` still reads that module (a lane owning `album-page` cuts them).



The lab and the kit:
- Marketing type: the last flat `text-3xl` figure is /qr's pull quote (`features/qr/print-shop.tsx:93`, a `font-heading` paragraph the heading scan does not read); the prices and readouts went onto `section` with `ladders-wiring`. It takes a step by role.
- ★ The three type calls the ladder left open are now a BOARD, not prose: `type-phone` asks the sub-head tier, the dead-link title and the display trim as three decisions with their options drawn at 375. They sat here unanswerable for a day because a roadmap line is not something you can pick from.
- Design: the Aurora beyond the home page. The home's two places are composed (`dc4530df`) and the publish moment is `lp/publish-bloom`; every later place is composed for itself (Will: "custom and bespoke", never the same composition twice on a page). Open: the throw has no production call site (the QR plate keeps its bloom, so the throw waits for a card overhanging open dark), the halo has none either (objects lit from behind only, never a button; the `album-page` board offers it behind the album's frame), and the feature pages' heroes were the `second` ask's third option. The album page's light under its demo is wrong (Will, 2026-09-18, with screenshots: "find new ways to infuse the aurora here"): `ScreenLamp` throws a full-bleed band where `design-system.md` says a screen's light is a pool, and it is stamped under three heroes against "custom and bespoke". Its new light is an `album-page` step; the fix at the source is the album wiring's, and it changes the guest and sharing screens too.
- Brand: the v1 wordmark is wired (`src/lib/brand/wordmark.ts`, `Logo`, the social card); the v1 ICON is still to come (ASSETS row 19). The day it lands, in one pass: `Logo`'s `markOnly` branch, `src/app/icon.svg`, `favicon.ico`, `apple-icon.png` and `manifest.ts`, the reel watermark's badge and wordmark in `src/lib/reel/engine/canvas2d.ts` (its REAL-LOGO seam; the wordmark path can ride a `Path2D`), and the press kit (`scripts/build-press-kit.mjs` rebuilds the committed zip: the five marks, the app icon, plus the wordmark in white and in ink, which the kit has never carried).
- ★ The `voice` board, asked for by name (Will, 2026-09-17), replacing the `brand-voice` exploration he killed. NOT a catalog of voices: each step is ONE real line in its real place with three or four close candidates and one winner, six to eight steps a round, spanning marketing, the app and a guest's phone so a voice cannot pass in a silo. After each round, what his wins have in common is written up in `docs/specs/voice.md` and the next round's candidates are drafted in it, so the rounds narrow and the voice is derived rather than declared. It needs nothing from the lab upgrade (the stepped form already does this) and it is the next named board, ahead of Glass, because bible 20 and 21 wait on it. Until it rules the words, every exploration's copy is placeholder judged for its size and wrapping (Will's `copy=page`, 2026-09-18: "The future voiceboard exploration will treat all copy as unprotected"). Round 1's first ask is the standing bible-20 question, whether it means the naming or the shape.
- ★ `glass` round one is on the desk (2026-09-18: the app's media chrome; dark and light asked separately); round two is marketing, the header's `GlassLayer`, the overlays and the set-pieces over media, the marriage Will named ("Glass + aurora atmospheric"), cut from his notes on round one. The Glass exploration, banked by name (Will, 2026-09-17: "bank a near-term agent for a dedicated Glass exploration across marketing and app so it feels more infused to our product. Glass + aurora atmospheric feels like a beautifully complementary identity for a media-forward product"): after the voice board, never a one-off (Card ships flat). Its starting map: the marketing header's `GlassLayer` (`chrome/header-shell.tsx`, the canonical "glass is a LAYER" pattern), the overlays' `backdrop-blur-xs` (dialog, sheet, drawer, the entry shell, the help palette), the app's chrome bars, the media chrome over photographs (the lightbox, masonry, like and unsave buttons, the reel overlay: the real glass condition), the marketing set-pieces over media, and the anti-pattern `album-fill-grid.tsx` names (nothing inside a moving tile carries backdrop-blur). It is the exploration allowed to break design-system.md's "there is no translucent surface in the system".
- Type (on the `loose-ends` board, on the desk since 2026-09-18): one FAQ, one look. The home and /pricing accordion's questions are on the card step (Urbanist 16/600) since `ladders-wiring`; the shared `FaqAccordion` (/events, the feature pages) sets its questions as Inter 14/500 in a `<summary>` that is not a heading, so the two FAQs read differently.
- Design: `EmailSignIn` (`src/components/auth/`) takes no Button size, so the guest gate's email button is still a default Button forced to h-11 (12.8px on 44px); give it a size so it wears `cta`.
- Design: the dialog title's `leading-none` beside `text-card-title` (`ui/dialog.tsx`) overrides the card step's own leading on every dialog; drop it and check the dialog headers signed in.
- Design: the literal corners left outside the photograph set, each onto the token its role calls for: live-demo's 14px mock panel, and the 6px corners in `reel-builder.tsx` and `style-rail.tsx` (6px is `rounded-md` under C).
- The lab: `river-visual`'s empty-state comparison draws `GalleryEmptyState` as its "today's grid" half, so both halves are the river since `ghost-wiring` (`31c94253`); the board is answered and retires at river-visual's own wiring, which also points `river-card` at `shared/river` and deletes `sandbox/river-visual/`.
- The lab (from `voice` round one, 2026-09-18): a production hero mounted on a board arrives INVISIBLE until `Reveal` sees it (`PageHero`'s subhead and actions ride `data-mkt-cut`, whose `animation-fill-mode: both` holds their backwards state), so a board owes a settled-state rule the kit could carry; and `FitStage`'s `swapKey` remounts its child and reports a small box for one frame, so `vw` clamps resolve at their phone end and an 80px headline photographs at 34px (drop `swapKey` where nothing replays; capture one load per option).
- The lab: `defineExploration` flattens every decision's `configs`, so a knob several decisions share arrives once per decision (a duplicate dock knob and a React key warning); dedupe by id in the constructor (`gallery-width/spec.ts` dedupes its window knob by hand, and `body-type/spec.ts` copied the workaround verbatim, 2026-09-18).
- The lab: a bare `Frame` ignores the lab's Fit, so a 1920 frame stays 1:1 and the stage head's scale button seems dead; fold `WindowFit` (`gallery-width/pages.tsx`: a `data-stage-fit` box with a CSS zoom, honest on an iframe) into `Frame` or the stage.
- The lab: a leftover forced-h-11 CTA (`sandbox/album-hero/hero.tsx`) takes `size="cta"` if its board outlives the wiring, and `lab/tools/motion/motion-playground.tsx` still names `/design/lab/rounding` as a specimen; re-point it at `/design/library/foundations#radius`.
- Type (RULED 2026-09-18: yes, the ladder reaches body and label sizes; `body-type` round one is on the desk; its wiring cannot sweep `text-[15px]` in one pass, since 24 sites share it across the guest pages and marketing and the guest rule and the marketing rule collide on source order, so the sweep splits by surface): body and label sizes sit on no ladder. The heading ladder stops at 16, and about 920 stock and pixel sizes carry the rest (`text-xs`/`sm`/`base`, `text-[10px]`, `text-[11px]`, the labels inside heading tags). Will's "Everything should be addressed in our design system type ladder" (2026-09-18) was said of headings; whether it reaches body copy is a question to ask him, and a body scale is designed as one question-first board before any sweep, never swept size by size.
- Design: teach `cn()` the two shadow utilities (one `theme: { shadow: [...] }` line in `src/lib/utils.ts`, the type ladder's own precedent). tailwind-merge files them under shadow COLOUR, so `cn("shadow-layer", "shadow-none")` keeps both and source order decides. Nothing in the product does that today, and the one-line fix was verified to resolve it (`light-wiring`).
- Design: `src/lib/elevation-policy.test.ts` scans `.ts`, `.tsx` and `.mdx` only, so a `box-shadow` written in a component-local STYLESHEET escapes it. One production file does that today: `src/components/marketing/sections/home/cinema-hero.css`'s `.hhs-card`, a hand-typed `0 18px 46px -16px` at 66 percent black on the home hero's stacked cards (found at the alias pass, 2026-09-17). The overlap is real so a shadow is right by the ruling, but it does not read `--shadow-lift` and so cannot follow a retune. Widen the scan to `.css` under `src/components/` and either tokenise that one or allow-list it with its reason.
- Engineering: `src/lib/shared/use-sortable-grid.ts` sets a hand-typed pick-up `box-shadow` from JS during a drag; it should read `var(--shadow-layer)`. Allow-listed by name in the elevation policy with that reason (the file sat outside `light-wiring`'s lane).
- The lab: `scripts/lab-demo.mjs` captures with `captureBeyondViewport: true` plus a `clip`, which makes Chrome resize its render surface and remount a step's iframes; on a stage holding three frames one comes back black and the pixel diff reads two identical grids as 84 percent different. It never fails a board, but it inflates every reading and could hide a frozen stage behind a false pass; the fix is one line, scroll to the top and clip in viewport coordinates (`glass` found and worked around it, 2026-09-18).
- The lab: `pnpm lab:smoke` fails one route that is NOT a regression: the legacy alias `/design/boom` resolves to the boundary probe that throws on purpose, and `EXPECT` whitelists only the canonical `/design/lab/tools/boom`. Pre-existing (proved against `9c657be6`); one line in `scripts/lab-smoke.mjs`, or drop the dead alias.
- Design, banked: the shimmer (the glow engine's sweep with its edge ring) as a delight moment, never a gallery arrival (Will, 2026-09-17: "A couple dozen photos being uploaded in a single batch would cover the top of a gallery in shimmer"); what the engine owes it is the mark-over-media line below.
- The lab, before the next round begins (Will, 2026-09-17: the stepped, form-based review "has been proven as an incredible resource"; once the current lab work clears, the lab system is upgraded again first): the kit findings below are the start of that list. **The round-behind blindness is DONE** (2026-09-17): the desk and every step say which commit they are serving, the composed paste carries it as a `#` line the grammar has always skipped, and `pnpm lab:review` compares it with the tree it writes into, which is the one moment both numbers are in the same room ("composed on build 7534d02, 6 commits behind this tree"). A build still cannot know a newer one exists, and it no longer has to. **`look` is DONE too**, a bug nobody had written down: the author's sentence naming what separates the options was carried on the step type and never rendered, which left the four words-only steps on river-visual as a question and three unlabelled words; `registry.test.ts` now requires one from any ask that draws nothing. From his fourth batch, the stage out of reach of the press was fixed by pinning it above the options (2026-09-17), and **that pin was the wrong fix, replaced 2026-09-18**: it clipped the preview and hid its labels ("The top preview UI of our lab is covered by the answer UI"), so the step is now the page with a dock (the stage at true size with every option mounted once, flipped or side by side; a sticky stage head naming what it shows and its scale; the answer in a sticky dock), and `lab:demo` fails CLIPPED, UNLABELLED, NO DOCK and a stage starting lower than 0.6 of a screen; `lab:demo` reports corner-only options as the same picture, which is true at 1440 and is itself the finding (a corner family is judged on the phone-width cards, the stage shows the gap and the reflow); `board-state.tsx` still calls `history.replaceState(null, ...)` and drops the state object `step.tsx` preserves; a step's dock is the answer's, not the board's, so the board dock's "Reload frames" is still unreachable from a step (the ask's own `strip` rides the stage head, which covers the knobs).
- Design (app): the reel Studio is a literal near-black room in both themes but carries no `.dark`, so its token-reading children (the player's control row, the style rail's captions and focus ring) read LIGHT tokens in the app's light mode; declaring the room `dark` fixes them and would let the publish light share one fenced hook. A look change to a signed-in surface, so it wants its own signed-in pass.
- Design (engine): a bloom cannot be born spent and its duration is a literal 1400ms; two one-variable changes (`--glw-bloom-dur`, an arrival that skips the one-shot) would make "rests lit, no motion on open" and a tunable swell possible. Neither is needed today.
- Design: nothing re-tunes `--lamp-1..5` on paper, so a media-less seam on a paper chapter would paint the dark register's five on a near-white page; latent (no production lamp sits on paper, and the field is fenced off light grounds), and Will's to answer if a seam ever lands there.
- The lab's kit, from the light board's round eight: `toSteps` (`_desk/session-step.ts`) always walks a catalog before the asks, so a board cannot ask anything first (a declared step order on the spec fixes it); `evidence(section, state)` is not told whether it draws a tile or the stage (an `at` argument retires the double render); `TrueFit` in `sandbox/light/fit.tsx` is a fourth copy of the true-size box; `Loupe` is a hover lens and a tile is `inert`, so a hairline needs a fixed corner inset (`CornerInset`); a one-shot on a stage has to arm on visibility (`useArmed`, board-local and general).
- Design: what a mark over media needs from the glow engine (`glow.tsx`, `globals.css`) if Will keeps one: a play-once mode for the sweep (today `infinite`), a re-key on `runId` for every shape (only a bloom today), an additive blend when the lamp is drawn over a photograph, and `[data-glw-edge-rest]` moved under its travelling ring (it sits 20 px times `--glw-scale` inside the host). `SectionLight` ships without a dither: the grain tile (ASSETS rows 10 and 15) lands on the component.
- The lab: the spec docs of retired boards (`docs/specs/palette.md`, and `type-scale.md`, already cut to its ruling) still read as standing proposals; at Round 3's planning, fold what is still true into `docs/systems/design-system.md` and delete them with their slugs in `_data/docs.test.ts`.
- The lab: **DONE 2026-09-17.** `library/rules/[id]/page.tsx` linked `docs/tracks/<id>.md` for any status whose track was not a standing board, without checking the manifest existed, so the rule page 404'd. It fired TWICE the same day: once when `floating-wiring` retired its board while rule 15 still named it, and again when rules 20 and 21 were re-pointed at the `voice` board before that board was cut. It reads the track states the desk already reads now, and a rule naming work that has not started says so instead of linking into a hole, which is exactly what "under exploration" means.
- The lab: ten boards under `(dev)` still fade `text-muted-foreground/N` by hand (`git grep 'text-muted-foreground/'`); move them onto `text-faint` as each board is next touched.
- The lab: **DONE 2026-09-17** (`9cda5262`). A step's option tiles always drew inside a 1440 canvas, so a specimen narrower than it landed as a thumbnail beside empty ground; an ask now declares its canvas (`tile: "phone"`, on `Ask` and on `Decision`) and `FitStage` draws in it.
- The lab: the true-size box LANDED in the kit as `src/components/lab/true-fit.tsx` with the settling read (`Stage` resolves its scale a pass after the box mounts and no ResizeObserver reports an ancestor's zoom, so a single read on mount measures 1 for ever). Every board copy is gone with its board (light's `fit.tsx`, brand-voice's `TrueSize`, rounding's `TrueScale`).
- The lab: a one-at-a-time catalog step has no config strip, so a reviewer at 375 cannot switch Canvas from the walk (`?canvas=phone` does it); `CatalogSpec.strip`, mirroring `Ask.strip`, is the fix (light round seven).
- The lab: a staged step reached by its own URL before its prerequisite is held numbers itself past the end ("step 43 of 42"); the walk should redirect to the first open step instead (light round seven).
- Every catalog board's `reading.why` and declared budget over-state the template's cost since the stepped review deleted the index, the "Rule on:" rows and the review panel (the boards read 1,141 to 1,662 on that tree); each board's own round rewrites its declaration.
- A measured-width wrap for the dock's knobs (a four-option switch with full labels overflows a 375 dock).
- `lab-review`'s scanner assumes a literal `defineBoard({`: keep every spec a literal or teach the scanner the wrapper.
- `height="measured"` on `Frame` and `useAnchorAfterSettle` RETIRED with the brand-voice board (2026-09-17) rather than being lifted: nothing outside that board ever called either, and a kit affordance with no caller is the bloat the kit is meant to avoid. Git holds them at the board's last commit if a later board wants the scroll-anchor fix.
- `SpotCompare` writes its own "What differs" line per spot with no way to shorten or suppress it (about 250 words of a two-dozen-spot board's budget); take an optional `differs` per spot.
- `CompareTwo`'s grid squeezes a fixed-width child, so a pair of `Frame`s laid out through it overlaps (712px columns under 1440px frames): document that a frame belongs in a `FrameRow`, or give `Compare` a `max-content` column mode.
- `Frame`'s `onApproach` cannot fire for a frame clipped out of a horizontal scroll row (the IntersectionObserver reports it as not intersecting): a row of frames takes the approach on the ROW, and the kit could carry that rather than each board.
- The production `EventCard`'s event name is a hand-rolled `font-heading text-xl` no type hook reaches, so the type-scale wiring sweep is four headings, not three.
- The board template's own chrome is about 1,000 to 1,300 words on a catalog board (the Answer prints every ask's context, look and because; the index reprints every lede; `answer.tsx`'s BoardMeta prints every idea's rationale, the departures and the assets unfolded; the Rule-on panel repeats the asks): fold what repeats behind disclosures like the card's own, so a catalog can meet 1,200 with its own words (the light board measured about 990 words of template in 2,889).
- A `Frame` seeds its state from the parent's FIRST render, before `useBoardState` reads the URL, and the correcting `lab:set` lands before the frame has hydrated (a board opened at `?ground=cinema` painted every card on the app's dark); the floating-surfaces board rides the frame's src for that state, and the kit could carry the fix.
- The lab dock renders every declared control as a pill row, so a catalog of thirteen costs thirty-nine pills across Pick, A and B; a select above about eight options gives the dock back a screen (`ControlKnobs` in `board-state.tsx`).
- ★ `ui/dropdown-menu.tsx` renders `SubContent` with no `Portal` while `Content` carries `overflow-y-auto`, so every nested submenu in the product paints nothing (the account menu's theme picker is the call site, on every host page): a wiring-round fix, with the floating-surfaces catalog's kept card.
- Fold the gallery's `RefSection` into the shell's `Section` (one anchor shape).
- Delete `_desk/sample-spec.ts` and the desk's dry run once every standing board carries a spec.
- Index the kit as a component family in the collector and delete `kit/notes.ts`; retire the panel half of the rounding board's `usePanelAwareWidth`.
- `pnpm design:specimens` beside `design:rules`, so `specimens.generated.json` regenerates by name.
- Delete the "asks, one word each" blocks from the four `docs/specs/*.md` (the registry carries the boards' asks).
- The collector's id collision: a contract target whose stem matches a library component renames both files.
- `// @policy:` on the remaining tree-reading tests so `/design/library/policies` lists every line the gate holds.
- CI caches only the pnpm store; cache `.next/cache` too if the wall time bites.
- A `design.partyreel.com` mapping rewrites the two route prefixes and `_data/legacy-routes.ts` in one place.
- Trim every standing board to `LIMITS.readingWords` (`pnpm lab:smoke` prints what each weighs; a board that declares a catalog fails the smoke over budget, a paper prints its weight until it is rebuilt).
- Mount `ItemVerdictRow` with `LIBRARY_VERDICTS` on a Library entry's page so a scroll through the components fills `docs/reviews/_library.json` (the ledger, the reader and the desk's "Redesigns you asked for" are landed; Round 3 of the revamp).

Marketing:
- Site-wide: the ~35 `bg-muted/N` sites become sections carrying `.surface-mat`, which ships declared and unworn since the palette's wiring (`88d0bec0`); the palette spec called the sweep mechanical.
- Site-wide: an a11y pass on `--faint` (3.21:1 on the page, 2.92:1 on the mat); a few of the 40 sites it inherited read closer to body copy than to a caption.
- (On the `loose-ends` board, on the desk since 2026-09-18.) The home hero (`hero-stream.ts`, shipped `0c58ff76`) is solved at two breakpoints, so between 768 and 1023 it wears the phone's card size and measure on a tablet-width screen: correct, not composed; a third breakpoint when anyone judges it there (`Geo` takes one without a structural change). The hero stays unlit until the light board's home-arc wiring.
- Events then pricing on the home are both card grids; Will named chapter 3 the model, so it stays until he wants it varied.
- The events manifest fill: the conference and trip stills are borrowed; real photographs are the fix, never a third scrim.
- The five remaining feature pages, one ground-up round each in nav order, the album page as the model (the brief: `git show 0f52503:docs/tracks/marketing-feature-pages.md`). Two heroes are ahead of that: the album page's (round four, on the `album-page` board) and the privacy page's, which Will took from restraint to the field as two spirals (2026-09-18, the `privacy-hero` board).
- The album's ambient pieces (the phone's screen cycle, the Live | Review photograph, the lightbox pill): three decisions on the `loose-ends` board (on the desk since 2026-09-18), judged on Will's screen; the switch's photograph is one hard-coded id and the Everywhere stage has no lightbox hint, so the board asks "which photo" and "propose a pill".
- The design lab on its own subdomain: one repository, a second Vercel project on the same code (architecture, not a saving: 2.5 MB marginal).
- Admin as its own app on its own subdomain: CUT 2026-09-18 as `admin-split` (one repo, a second Vercel project serving only the admin; Will's pick: separate now, in parallel with the redesign).
- Fold the two `SourceLink` copies into one; link each contract block on the rules page to its component's permalink.
- App polish the gallery surfaced: `empty-state.tsx`'s comment vs its default, `action-tooltip.tsx`'s claimed delay, `ui/drawer` and `ui/tabs` unused, `ui/select` and `ui/sheet` one call site each.
- The composition pass: once the six boards are ruled, one board stacks the ruled blocks on the home arc and the dashboard beside today, and the wiring rounds cut from that.
- The engine's `@supports not (mask-image)` fallback is compiled away by Lightning CSS: accept and say so in the comment, or drop the rule.
- The hero's warm-up (the lamp arriving neutral and warming into the wall) is built and pulled; pick it up when Will can judge the swap on a visible screen.
- The lit surface (`[data-lit]`) rides the `light` board; never un-apply it from the moment-12 specimens to re-judge them.
- The spill placement rounds: the ground picks the sibling (ink takes the beam, paper takes spill in the paper register); law 3 on real media is a loader swap to `decodeImage` on `previewUrl`; open engine defects: `effectiveAlpha` is optimistic, a bloom's band snaps as it arms, `useInViewOnce(0.35)` never arms a lamp taller than about 2.86 viewports, `BorderBeam` reads the OS scheme rather than `resolvedTheme`.
- The QR-to-album handoff wants its own ground-up visual round; the river in the QR door's card is the first piece (the `river-card` board; Will, 2026-09-18: "how it works can use a more dedicated animation"). The pour (photographs leaving one object and landing in another) is parked for a real "photos dump here" moment, and it is the alternative if the ghost river on the empty album wants a different animation once he sees it in the app.
- The `/design` gate on an `lp/*` alias is captured at build time: push again before concluding anything about the env.
- No production surface carries `forced-colors` or `@media print` but the spill engine; copy its pattern.
- Help deep links from the app (settings to its article, the Studio to the reel guides); self-serve account deletion (then the help article and the privacy policy's "Delete your account" choice); a newsletter unsubscribe path.
- Product gaps the help catalog documents honestly: the video-uploads wrapper string omits the Event Pass; `?upgraded=1` is never read; "Public" in settings vs "Open" in the header chip; the restore toast never reads `mediaStillRemoved`; the ops-only missing-ETag error can reach a guest; the privacy FAQ overstates the event-level Report; `tiers.ts`'s comment cites a retired video limit; the guest 404 says the event "may have ended"; the open-event unfurl promises "no account" when the event requires one; `lifecycle-recovery.md` vs `listRecentlyDeletedMedia` on a guest's self-deleted upload.
- The EXIF "for the common formats" clause's two remaining sites: `never-rides-along.tsx` and `feature-pages.ts`.
- Stripe Checkout `consent_collection` stays off (the guest door and `/login` carry the consent line); print styles for the legal pages; the faq accordion onto the `.mkt-acc` recipe; the floating layer's own reduced-motion gate.
- The blog's cover pool is unlicensed for recognizable people (all twelve `MARKETING_IMAGES`); replace before launch.
- Inline code as a muted plate in the help centre and the blog; a "Watch your event highlights" video card linking `/reel` on another page.
- `/press` grows into the partnerships kit; post-launch event types (`/events/birthdays`, `/events/memorials`); the media batch (per-vertical reels, honest trip and conference subjects; the stock stand-ins Will replaces).
- `/contact` onto the cinema rhythm (the last `(paper)` page; the identity revisit rides with it); the footer's Claude assistant link drops to ChatGPT-only if first impressions warrant.
- The blog's follow-ons: real `/blog/page/[n]` routes; a "Start here" strip past ~40 posts; the featured card's eyebrow as the post's purpose; a founder-voice post needs a ruling; the `compared` posts re-verified on each refresh.
- ★ `PageHero` owns only the plain type lockup, a stage slot and a backdrop; a hero whose object sits beside the lockup or a form stays bespoke.
- A mobile pass of its own over the whole marketing site (every round to date was judged at desktop).
- The root 404's browser tint (`theme-color` light over a dark page); the design-system doc's em-dashes go when it is next rewritten.

The app:
- The admin chart ramp (`--chart-1..5`, both modes) is still chroma 0 beside Graphite's cool greys; a cast on five greys is a ruling, asked on the `loose-ends` board (on the desk since 2026-09-18).
- ★ The aurora is dark-ground only (Will, 2026-09-17: "No light ground usage is a decision for now"): the app's light mode owes its own answer for lit surfaces before the dark versus light work starts.
- Polish: the guest-ghost pack's file list is rebuilt by hand in three components (`guest/gallery-empty-state.tsx`, `app/dashboard/events-empty-teaser.tsx`, `app/dashboard/empty-section-teaser.tsx`); one exported list would be the single source (`ghost-wiring`, 2026-09-18).
- Guest flow: the dropzone's second line, "Tap to choose, or drag them here" (`file-dropzone.tsx`), is half wrong on the phone almost every guest meets it on (found by the `voice` board, 2026-09-18; not asked there).
- Cross-gallery sort and filter for the Uploads hub (`get_my_uploads` is filter-ready; add a like-count sort).
- Zip-export follow-ons: an async build-to-R2 job past the cap; a custom `export.partyreel.com`.
- Preview-variant follow-ons: a server-side backfill for pre-feature media; preview bytes on the storage meter; the moderation feed's preview; AVIF if quality demands.
- A unified per-upload size limit and per-event `max_upload_bytes`, enforced at presign ([`systems/uploads-and-r2.md`](systems/uploads-and-r2.md)).
- HEIC/HEIF/AVIF and WebM metadata strip (the client-side strip fails open on item-based ISOBMFF and EBML); the JPEG MPF secondary-image Exif scrub.
- Forensic capture follow-ons, all gated: the pre-strip client-side EXIF capture (counsel-gated), proactive hashing at scale, widening the CSAM scanner past proxied traffic ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)).
- Bulk Restore-all and Empty-bin for the recovery bins; immediate hard-purge for egregious content in `/admin/albums`.
- File-picker upload e2e reconfirm on a real device; the arrival choreography fine-tune on a real gated event, one round after the V1 phases.

## Major overhauls (each its own planning round; drop related deferred tasks here)

- **Generated media: one Higgsfield month** (Will, 2026-09-17, killing the media kit for it; re-scoped 2026-09-18). Every image AND every video on the site is generated rather than shot or licensed, for one consistent look, inside ONE paid month once more of the site is shaped, and lands before launch: the 12 stand-in stills sit in the chrome of every marketing page and in the blog's OG cards and RSS feed. The agent that runs it opens with deep research into Higgsfield's tooling and prompting (Soul 2.0 and its moodboards, Soul ID, the video models) and then writes every final image and video prompt ITSELF; the asks other agents file in `docs/ASSETS.md` name the slot and what a frame must survive, never the picture (Will: "I'd like the new agent handling our Higgsfield generations to write the final image/video prompts itself"). Before buying, sweep ASSETS for every image and video ask so nothing needs a second month; no brief is kept from the media kit ("start blank"). Run it question-first: the look as round one, then each slot's frame staged `after` it. At 2026-09-17 prices, re-checked at the start: $19 / $59 / $129 a month for 270 / 1,200 / 3,000 credits; a Soul 2.0 image costs 0.12 credits, so the video is what decides the tier; Plus's 5,000 free images and 7 days of unlimited Kling are website-only, and the MCP (`mcp.higgsfield.ai/mcp`) spends credits. Outputs stay ours to use after cancelling, but they are not exclusive and Higgsfield may train on them. The AI disclosure is settled: one sentence at the end of the Terms' Disclaimers (1.2), and never a mark on any image (Will: "don't want to markup any images themselves"). No row, field or test tracks where an image came from.

- **QA hardening — the remaining fix queue** (the ~590-agent adversarial round of 2026-07-28/29;
  Q1-Q4 + the write spine shipped as milestone-1.5 — [`systems/host-app.md`](systems/host-app.md) +
  [`CHANGELOG.md`](CHANGELOG.md); this list IS the remaining queue). Roughly in the intended order:
  - **Abuse + jobs + observability, deferred from `admin-jobs` (2026-09-18):** replay a dead letter from
    `/admin/jobs` (the depth is reported and the daily reconcile is the remedy; a real replay wants a DLQ consumer in
    `wrangler.jsonc`, which changes delivery semantics) · a per-day `job_signals` aggregate if `sent_emails` ever
    outgrows a 24h head-count (the `sent_at` index is the first step) · #37/#38 below stay untouched.
  - **Abuse + jobs + observability:** #13 a `presign` abuse kind (pure TS, `action_attempts` is
    kind-generic; needs `Retry-After`/429 vocabulary the pipeline lacks today) · #14 the contact + careers
    limiter, fail-CLOSED (unauthenticated + unthrottled today: each call = one service-role insert + one
    Resend send, and ~3,000 requests drain the monthly quota, after which the orphan-sweep and prune
    breaker alerts cannot send) · #37/#38 persist the pagination cursor for the backup reconcile + orphan sweep (both are
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
- **Admin deployment, deferred from `admin-split` (2026-09-18):** revisit the admin project's preview builds if
  deployment storage bites again (pause its git deployments between rounds; never a path-based skip in
  `scripts/vercel-ignore-build.mjs`) · give the admin deployment its own Sentry project (it shares `partyreel`'s DSN).
- **Admin / operations portal** — the portal is being rethought from the ground up via the lab (`admin` round one, cut 2026-09-18: the shape first; an on-brand devtool per Will's ruling) and split into its own deployment (`admin-split`, integrated 2026-09-18; the cutover complete the same night, `admin.partyreel.com` on its own project). **Found by the `admin` board in the shipped portal (2026-09-18):** `DistributionChart` hard-codes `YAxis width={28}`, so a four-digit tick renders as its last three characters (`/admin/metrics` hits it the day a count reaches 1,000); the home's card grid and the nav list two different portals (Exports has a card and no nav entry; Reels, Forensics and Jobs have a nav entry and no card); four destructive grammars whose friction does not track the damage (pausing the purge sweep is a bare switch, deleting one account retypes an email). **Deferred from the board:** the portal at a phone, for an operator glancing at health away from a desk; an operator audit log (what was done, by whom, with an Undo where one exists), only if the arm-in-place grammar wins decision 5. **P8 backend-ops & observability (the priority piece; the four jobs with no heartbeat are `admin-jobs`, cut 2026-09-18):** every backend
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
  with Cloudflare at launch (DNS still at GoDaddy; Will, 2026-09-18: "we're probably in the clear to migrate/transfer from GoDaddy to Cloudflare anytime", so the move gets its own runbook whenever it is picked up: the nameserver switch, the three `_vercel` ownership TXTs, Resend's SPF/DKIM/DMARC records, the apex, `www` and `admin` records, proxying off for Vercel-hosted names) · Vercel Spend-Management hard cap + alerts ·
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
  `/u/[slug]` sitemap/robots decision (profiles-social.md says indexable; needs a slug feed) · WebSite
  SearchAction (needs a real `?q=` route) · AI-referral analytics (UA-tagged hits on /llms.txt).
- **Billing follow-ons** — pricing **grandfathering** when the first price change happens (the policy is
  ruled + recorded in [`PRICING.md`](PRICING.md) "Grandfathering"; the build is `planForPriceId` mapping
  MULTIPLE historical Price IDs per plan, newest = the public offer) · a full [`PRD.md`](PRD.md) refresh
  to the shipped product (this consolidation pass fixed only the misleading era claims) · **per-pass dashboard management**
  (choose WHICH stacked pass a renewal extends, per-pass expiry rows in the storage meter; v1 renews the
  soonest-expiring, billing-caps.md) · the `authenticated` role holds a latent table-level **TRUNCATE grant on
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
  settled scope in [`systems/host-app.md`](systems/host-app.md), the reel section, guest-flow.md/0024). **Deferred follow-ons:**
  Pro motion video (real video playing in the live player + trim; R2 CORS work) · multiple named
  reels · the reveal-moment polish · dropping the legacy `highlight_reels.theme` column (the R8
  destructive batch) · concise per-knob motion-tuner descriptions · the short-feed scroll-spy
  hand-off tune (with Will) · a future auto-scoring "best clips" worker (`highlight_score` /
  `reel_eligible` stay dead scaffold for it).
- **User profiles + social discovery — P1-P3 LIVE since milestone-2** (`/u/[slug]` profiles, the
  follow/block graph, the Guests feed section + guest list, the dashboard Following chip; the
  consent/privacy one-way-door is RULED in [`systems/profiles-social.md`](systems/profiles-social.md),
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
- Counsel sign-off gate (trust-safety-forensics.md D2) `[human]` — before launch counsel signs: (1) the privacy-policy +
  ToS forensic-capture disclosure language (IP/UA/geo/device UUID per upload), (2) the CSAM incident
  runbook ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)) + NCMEC registration,
  (3) the retention schedule (media-lifetime rows, 1-year preservation), (4) the pre-strip EXIF capture
  go/no-go. The 8-item checklist is in the T1 options-doc (`git show 44090827:docs/decisions/t1-forensic-csam-policy.md`).
- NCMEC CyberTipline ESP registration `[human]` — register before launch (prep note in
  [`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)); if denied, we still report actively.
- Enable the Cloudflare CSAM Scanning Tool at the DNS move `[human]` — free; scans only proxied traffic
  (cannot see presigned R2 media — state that plainly), per trust-safety-forensics.md C2.
- Stripe test → live cutover `[eng+human]` — re-create the 4 products and 8 prices in live (three Pro
  products carrying six recurring prices, monthly and annual each; the Event Pass product carrying the two
  one-time prices), named WITHOUT the em-dash the test products carry today (those names render in
  Checkout and the portal), + swap the 10 env values (code unchanged); the runbook is
  [`PRICING.md`](PRICING.md) "Stripe setup" (corrected 2026-09-02 by the `legal-billing-truth` track).
- Verify the Stripe Billing Portal permits switching between the six Pro prices (monthly and annual) `[human]` — now
  LOAD-BEARING, not cosmetic: per host-app.md 1b a Pro host changing storage size is routed to the
  portal (checkout refuses the second subscription it used to create silently). If the portal's
  product config does not allow the swap, a paying host has no self-serve way to resize. The default
  portal configuration (`bpc_1TcTxWPtjqmVkBwkcAldFEZA`) enables `subscription_update` with
  `default_allowed_updates: ["price"]` and `proration_behavior: always_invoice`, but the API returns no
  `products` list, so the actual switch set is unverified from the API side (2026-09-02): a dashboard look,
  or a portal session opened as a Pro host.
- Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER` (currently 3× the storage cap, billing-caps.md) before
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
  on a direct pg connection: it needs `SUPABASE_DB_URL` (the SESSION string on port 5432, never the 6543
  transaction pooler) in the three secret places, a `postgres` devDependency, and a third vitest project
  with a distinct include that skips cleanly when the var is unset, so `pnpm test` stays green for agents
  without it; every test runs BEGIN, exercises the RPC under `set local role`, asserts, ROLLBACKs, then
  re-asserts row counts. The fully isolated alternative is the Supabase CLI plus the Docker local stack,
  pre-wired in `supabase/config.toml` (db 54322): pick it only if production-DB test traffic ever becomes
  uncomfortable. Full detail: `git show 44090827:docs/decisions/rpc-suite-blocked.md`.
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
