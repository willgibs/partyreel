---
track: orchestrator
status: open
cut: "51f40e3"          # this window opened at the round-two walk (2026-09-14)
preview: false
owns:
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/rules/rules.ts
  - src/app/(dev)/design/rules/page.tsx
  - src/app/(dev)/design/rules/rules-registry.test.ts
  - src/app/(dev)/design/rules/component-index.test.ts
  - src/app/(dev)/design/rules/rules.generated.json
  - src/app/(dev)/design/record/
  - src/app/(dev)/design/motion/
  - src/app/(dev)/design/stream-probe/
  - src/app/(dev)/design/boom/
  - src/app/(dev)/design/reel-parity/
  - src/app/(dev)/design/c/
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.css
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.tsx
  - src/app/(dev)/design/sandbox/home-hero/source.css
  - src/app/(dev)/design/sandbox/rounding/
  - src/components/dev/
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - src/lib/track-manifests.test.ts
  - src/lib/single-source-policy.test.ts
  - scripts/vercel-ignore-build.mjs
  - docs/decisions/design-record.md
  - docs/perf/v1-baseline.md
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/events/visibility-labels.ts
  - src/lib/shared/use-entered-frame.ts
  - scripts/design-rules/
reads:
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/components/marketing/system/section-shell.tsx
announces:
  - "the review wave (2026-09-14): seven tracks cut at once off the bible's second edition; the six boards own only sandbox/<id>/ (their RULINGS entries, the dispatcher lines and the desk are registered here up front, with placeholder variant names renamed at integration); kill-mono owns the production trees it sweeps, the lab's family pages and six older sandbox files, and src/components/marketing/system/ is RELEASED to it from this manifest (deleting mono-caption.tsx is atomic only with its 18 importers)"
  - the rounding and tweaking GUI round (Orchestrator-run, in parallel with the wave) touches src/components/dev/ (the tuner, its config, the shared board shell in dev/board/), src/app/(dev)/design/motion/, the rounding board at sandbox/rounding/, and the radius VALUES in src/app/globals.css and the derivation in src/app/theme.css; tokens are never renamed mid-window (boards read --radius-float and --radius-tile), and any landed value change is announced here first so boards sync
  - theme.css line 18 (--font-mono) was deleted pre-spawn; Tailwind's default mono stack carries every surviving font-mono until kill-mono lands, and no new mono is written anywhere (bible 7, retiring)
  - no @contract-for test is added on launch-prep until kill-mono integrates (it regenerates rules.generated.json); the Orchestrator reruns pnpm design:rules at each merge
  - "kill-mono landed (2026-09-14, `69af90d`): no mono face in the product; `src/app/two-faces-policy.test.ts` refuses a `font-mono` class, a mono loader or a `--font-mono` token; `MonoCaption` is gone (`Caption` is the one atom); `@contract-for` tests may be added again (the artifact was regenerated at the merge)"
  - "the rounding round landed (2026-09-14): the radius tokens, --gap-gallery, --spill-cadence and the --tune-* knobs moved into their own :root block in globals.css (no value changed) and left the lab's .mono sheet; the Button's in-between sizes derive from --radius-action (button.tsx, same numbers); the tuner has a persisted store (tuner-store.ts), descriptions and groups, and nine specimen-less knobs retired from the panel. A lane reading globals.css, design.css or button.tsx: nothing to sync unless it copied a token block"
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, what every
open track is doing, what waits on Will, and what landed. Agents sync `origin/launch-prep` mid-round
only when a line under "announces" or "Landed this window" touches one of their `reads`; otherwise
they sync once, before handoff, if it moved.

**This window (the review wave, from 2026-09-14):** Will's rule-by-rule review of the bible, taken
while round two of the home hero was building. Nine rules rewritten, each reviewed rule carrying a
status on `/design/rules` (under exploration: the board writing what it inherits; retiring: the track
that retires it), rising tides redefined as the ground-up judgment (bible 22), copy opened (21), mono
leaving (7). Seven tracks cut at once: six lab boards and one production sweep, each on its own
preview for Will's parallel reviews, with the rounding and tweaking GUI round on this side. The
record the Orchestrator keeps between windows is the two lists below plus [`../ASSETS.md`](../ASSETS.md);
the desk at `/design/c?key=` renders the same files.

## In flight

Every open track, its board, its preview and what it waits on. A row changes at spawn, at handoff
(the preview builds on every push from the start: `preview: true`), at integration and at the ruling.

| track | board | preview | waits on |
| --- | --- | --- | --- |
| `palette` | `/design/c/palette` | the launch-prep alias (integrated `d5847ad`) | Will's ruling (Waiting on Will, item 2) |
| `light` | `/design/c/light` | the launch-prep alias (integrated `ae03a94`) | Will's ruling (Waiting on Will, item 2) |
| `type-scale` | `/design/c/type-scale` | the launch-prep alias (integrated `838a5f6`) | Will's ruling (Waiting on Will, item 2) |
| `floating-surfaces` | `/design/c/floating-surfaces` | the launch-prep alias (integrated `e1f06d6`) | Will's ruling (Waiting on Will, item 2) |
| `brand-voice` | `/design/c/brand-voice` + `docs/specs/brand-voice.md` | the launch-prep alias (integrated `749e29a`) | Will's ruling (Waiting on Will, item 2) |
| `media-kit` | `/design/c/media-kit` + `docs/specs/media-kit.md` | the launch-prep alias (integrated `797f692`) | Will's ruling (Waiting on Will, item 2), and the blog-cover decision |
| `kill-mono` | no board (a production sweep) | the launch-prep alias (integrated `69af90d`) | two looks (Waiting on Will, item 2); bible 7 is the two-faces rule |
| `hero-scan` | `/design/c/home-hero` (variation 2) | the launch-prep alias (integrated `66b4ebe`) | Will's ruling on round three (Waiting on Will, item 1) |
| `hero-burst` | `/design/c/home-hero` (variation 3) | the launch-prep alias (integrated `3aeef1a`) | Will's ruling on round three (Waiting on Will, item 1) |
| `hero-river` | `/design/c/home-hero` (variation 4) | the launch-prep alias (integrated `ff0291a`) | Will's ruling on round three (Waiting on Will, item 1) |
| the rounding round (Orchestrator) | `/design/c/rounding` + the tuner on every cinema page | the launch-prep alias | built; Will's sitting (Waiting on Will, item 3) |

## Waiting on Will

Every open ruling with its link; the asks are quoted from each board's meta panel as the boards hand
off. Assets live in [`../ASSETS.md`](../ASSETS.md).

1. **The home hero, round three** (`/design/c/home-hero?key=`, read in a FOREGROUND tab): round two
   was ruled 2026-09-14 (the source, "definitely my favorite direction"; the reel and the gathering
   out, the reel's idea parked as a "Watch your event highlights" video card for another page). Three
   variations off the source are building (`hero-scan`, `hero-burst`, `hero-river`, each on its own
   preview, the source first on the board as the reference); the ruling to come: which variation (or
   the source as is), its eyebrow and supporting elements, its copy, the departures ruled in. The
   wiring round cuts after that ruling (`kill-mono` has landed).
   - **The scan** (integrated `66b4ebe`): look at the first 1.2 seconds in a foreground tab (the code
     alone in an empty room, the brackets close on it in the phone's viewfinder, the snap, one flash,
     the album out of the plate: cause, then effect). Its departures, verbatim: (1) a phone in the
     hero, the first thing to overrule because a phone can read as an app, held to the camera by
     three things (no chrome but the notch, cropped by the frame's edge, looking at the same code
     standing in the room; its bezel radius a drawn object's literal, not a surface token); (2) one
     emissive object, the phone's screen, lighting itself and its bezel and nothing else, no lamp;
     (3) bible 13 on decorative layers only, the pre-burst and thrown-wide states inside the
     reduced-motion block; (4) the centred lockup inherited from the source, the second thing to
     overrule; (5) the count under the plate (312 photos from 48 guests) is a STAND-IN number that
     must not ship as invented data: the wiring reads the demo event's real totals or the line goes.
     Its ask: a hand-and-phone cutout (`docs/ASSETS.md` row 8).
   - **The burst** (integrated `3aeef1a`): look at the first second and a half after a Replay (the
     code alone, two or three frames slip out beside it, then the whole album erupts in every
     direction and keeps going). The one real choice on the board: the headline sits on the ladder's
     lg step (text-7xl / text-4xl) rather than xl so the quiet zone stays small enough for the burst
     to own the canvas. Its departures, verbatim: (1) bible 13 on decorative layers only, the
     pre-burst state inside the reduced-motion block; (2) bible 10, flagged because the hero is unlit
     by the standing ruling: the frames carry a soft drop shadow (rule 10 allows exactly this,
     near frame over far; a shadow, never a lamp); (3) the centred lockup, the first thing to
     overrule; (4) the lg headline step; (5) no scrim, no darkening layer, no lamp, media at 100%.
     Also to rule: whether "One code. Every angle." earns the composition, and whether the phone
     reads as the same composition rather than a thinner one. Its ask: 8 of the 24 squares also as
     4:5 portrait crops (`docs/ASSETS.md` row 9).
   - **The river** (integrated `ff0291a`): look at the first two seconds on Desktop (the code alone
     for half a second, then the whole album pours out from behind it in one beat and never stops).
     Three calls that are yours: whether the code belongs at the top at all (departure 1, the one
     real argument with the source: a code at the top with the album falling out of it is a
     beginning, everything below it is what the scan produced); which side the Caption line sits on
     (departure 4: above the plate, against its own brief, because a line under the plate forces
     every frame sideways within 80 px of its birth and kills the emergence read); and whether the
     live count under the CTAs earns its line (departure 5: a stand-in that ticks once per launch,
     248 and climbing, the only fabricated thing on the board). Also flagged: the centred lockup
     (the first thing to overrule if the hero should stay left) and bible 13 on the pre-pour state.
     Its ask: 12 portraits at 720x900 (`docs/ASSETS.md` row 12; row 3's parked portrait third would
     also serve). **All three variations are on the alias now, the source first as the reference.**
     Both the scan and the river want one shell change for the wiring round: a `demoCount` prop
     beside `qrUrl` (the demo event's real media count), so no count ships as drawn.
2. **The boards of the review wave**, as each hands off, its asks verbatim.
   - **brand-voice** (integrated `749e29a`; `/design/c/brand-voice?key=` on the launch-prep alias; the
     guide at `docs/specs/brand-voice.md`): "The voice: today, A the house, B the room, or C the guest
     list (the agent recommends B, with A second)"; "The seven provisional home headers in the ruled
     voice, or line by line from any column"; "The account-required unfurl line: asks for an email, or
     asks to sign in with an email (the agent recommends asks for an email)"; "Bible 20's replacement:
     lead with what arrives, an absence may be the second beat and never the first" (the finding that
     outlives the round: as written, rule 20 reads on the ruled no-app line). Flagged: C rewrites
     `SITE_THESIS` to "The whole event, as everyone saw it."; the "five copy-alternative picks" have no
     surviving list, so the board reads them as the five headers with an appetite for a different line
     (say if that is wrong); B's h1 runs four lines at 375 against today's two.
   - **type-scale** (integrated `838a5f6`; `/design/c/type-scale?key=` on the launch-prep alias; the
     token tables in `docs/specs/type-scale.md`): "The marketing ladder: today, A tuned, B rungs or C
     registers"; "The app ladder: today, A tuned, B rungs or C registers"; "The tracking law (leading
     and tracking named per step, running inverse to size): adopt, or keep the flat -0.03em"; "The
     face pairing: keep Inter with Urbanist, or open a face round" (the board's verdict: it holds).
     Look at stage 1 at Phone 375 first (today's phone end is the whole argument), then stage 2 (the
     loudness question), then stage 8 (the app's missing middle). Flagged: C's app title at 20 and
     card title at 14 is the first thing to reject if it reads cheap; B turns bible 2 into arithmetic.
   - **kill-mono** (integrated `69af90d`; no board): two looks on the launch-prep alias, one class
     each if they read wrong: the stat register on `/features/album` and `/help` moved to the display
     face with tabular figures (the register `/pricing` ratified for money), and `/help`'s ghost folio
     went from 5% mono to 6% Urbanist (`/[0.04]` is the dial). The inline code in the help centre and
     the blog now reads on the body face at weight 600 inside backticks; a plate would read better and
     is its own round. The four admin surfaces (`/admin/forensics`, `/admin/jobs`, `/admin/accounts/<id>`
     and its delete dialog) took the muted plate and want your eye on the alias (item 7).
   - **media-kit** (integrated `797f692`; `/design/c/media-kit?key=`; the spec at `docs/specs/media-kit.md`):
     1. "The rule as written: author, source and retrieval date REQUIRED on every manifest entry, and
     an entry missing them cannot ship"; 2. "The allowed list: Pexels, Pixabay, Mixkit, Coverr and CC0
     in, Unsplash out, each on the clause quoted; yes to the list, or strike a source"; 3. "The route:
     Licensed, Ours, or Mix (the recommendation is Mix, with the frames marked ours in the sheet)";
     4. "The first batch, item by item: OK to stage as the bridge on the blog pool, or not at all";
     5. "The kit: 36 masters, six per vertical, with the 24 squares, the 8 clips and the film derived
     from them rather than asked for separately" (`docs/ASSETS.md` row 7, applied). ★ **The finding
     that needs a decision before launch:** Unsplash's terms exclude recognizable people from the
     license, all twelve stills are full of them, and eleven are the blog's cover pool (23 posts,
     their OG cards, the RSS enclosures). Say: the CC0 bridge on the blog pool now, or the kit first.
   - **floating-surfaces** (integrated `e1f06d6`; `/design/c/floating-surfaces?key=`; the contract
     rewritten in `docs/specs/floating-surfaces.md`): 1. "The radius: sharp, nested or round, and
     whether the sheet and dialog take a second token or the same one"; 2. "The entrance: one clock,
     by frequency, or origin true"; 3. "The light in dark: lighter is closer, a soft shadow, or a lit
     edge"; 4. "The outliers: select, drawer and sheet onto the contract, or dropped". Look at row 2
     at 1:1 first (today's menu draws an 8px corner around 1.6px rows in 4px of padding, so the lit
     row never nests: the ruling is which family a floating layer belongs to), then row 3 on cinema
     and on paper, then row 1 with the entrance on "by frequency" against "one clock" (rule 12
     against rule 15, a bible question), then row 5 at 375 (the sheet is the guest's surface).
   - **palette** (integrated `d5847ad`; `/design/c/palette?key=`; the three token blocks in
     `docs/specs/palette.md`): 1. "The ramp: A, B or C, or today's, in both modes"; 2. "The accent:
     which hue (ink today, blue 252, violet 300, flare 330), and which of its three jobs it takes
     (identity, attention, the stand-in for media)"; 3. "The panel: one token at full strength,
     retiring the six alphas it ships at, and hover fills moving to --secondary"; 4. "The dark
     grounds: three steps of one ladder (A and C) or one room for cinema, the app, ink and the canvas
     (B)"; 5. "The missing step: --faint enters the token set (all three candidates add it) or the
     37 alpha-dimmed text sites stay as they are". ★ A finding against bible 16: there are FIVE
     grounds, not four; `--gallery` is both the lightbox's canvas and the footer's slab, and the
     candidates split it two ways. Look at row 01 first (the four rulers: today's light column has
     five surfaces inside 0.037 then a 0.455 fall; today's dark panel is lighter than the card, the
     ladder upside down), then row 06 with the ramp toggle, row 07 (a Card on the ink leaf is near
     white), row 09's accent toggle against the state row.
   - **light** (integrated `ae03a94`; `/design/c/light?key=`, parts `#lgt-a` to `#lgt-d`; the draft
     doctrine in `docs/specs/light.md`): "Depth in dark: the cue set for stacked media cards, a layer
     over content and a flat card"; "Lamps without media: the section aurora, yes or no, and its
     register on cinema and on paper"; "The cadence: 8s or 11s" (the board recommends the engine's
     8s for a lamp and a multiple of it for the aurora); "The publish beat's violet" (300 leaned to
     the lamp set's 305, decaying to a base); "The lit surface ([data-lit]): adopt, adapt or drop"
     (the board reads it as material, not elevation). Look at part B first (the aurora at accent on
     cinema, then on paper), then part A's stacked photographs. Seven departures on the board, in the
     spec. Its asks: a grain tile and a worst-case pair of overlapping photographs (`docs/ASSETS.md`
     rows 10 and 11). This ruling closes item 4 below (the parked light rulings b, c, d).
3. **The rounding sitting** (the tuner earned it 2026-09-14): `/design/c/rounding?key=` on the
   launch-prep alias (four columns of one kit, three fixed candidates and a live one) and the tuner
   in the corner of every cinema page and the lab (`?key=`); values survive Replay, navigation and
   reload until Reset; Copy CSS gives the block to bake. The asks: "--radius, --radius-float,
   --radius-tile: the values (today 2 / 8 / 3)"; "--radius-action, -lg, -sm: the values (today 16 /
   19.2 / 12.8), and whether they move with the surfaces"; "Whether float and tile move with the
   surfaces or stay put"; "Whether the derived scale (sm 0.6x to 4xl 2.6x) survives a rounder base,
   or the steps get retuned". Say the six numbers (or a column) and bible 8 inherits them.
4. **The light rulings** (b) the lit surface, (c) the publish beat's violet and (d) the cadence are
   now the `light` board's asks (item 2) and close with its ruling. Still parked on its own: (f)
   whether the guest surfaces follow the VISITOR's theme
   (`/e/[token]` has no forced skin; the doorbell arrival, the locked door and the awaiting-media
   skeleton were argued on cinema), which blocks the next guest-surface light round.
5. **Two copy rulings**, riding the `brand-voice` board: the account-required unfurl line ("This
   event asks guests for an email." against "...asks guests to sign in with an email."; one word
   settles it) and the five copy-alternative picks with the two provisional home headers (`noApp`,
   `fullQuality`); the board rewrites the seven provisional headers in the proposed voice as its
   worked example.
6. **The album's ambient pieces** on `/features/album` (the phone's screen cycle, the Live | Review
   photograph flying, the lightbox pill cycling): a ten-second eye on prod, since the tools cannot
   run them.
7. **Two admin looks on `admin.partyreel.com`** (host-gated; the session needs your TOTP):
   `/admin/jobs` (four cards, the purge switch, Run now) and the Delete account card on
   `/admin/accounts/<id>` (the retyped-email guard). To exercise the self-serve deletion through the
   UI, use a throwaway host: it is immediate and cancels the TEST plan.
8. **The purchase toast**: `/dashboard?upgraded=1` as the Pro host; one toast should say "You're on
   Pro." and the flag should vanish from the URL (a background tab throttles hydration, so the
   browser tooling could only see it indirectly).
9. **A revisit of /blog and /careers**, your own note at the milestone-12 merge ("I'll definitely
   revisit both of these page designs"); approved and shipped as they are, unprotected now.
10. **`SUPABASE_DB_URL` into `.env.local`** (15 minutes, yours; the session or direct string on port
    5432, not the pooler): unblocks the committed RPC integration suite
    ([`../decisions/rpc-suite-blocked.md`](../decisions/rpc-suite-blocked.md)).
11. **The Sitting-1 `/design` lab rulings** (the frozen `/reel` items and the real-phone QR
    ticket-scan check), parked until the UI era lands.

Closed earlier, kept so nobody re-asks: (a) the beam's chroma register is a DERIVED register of the
lamp set, not a second palette; (e) the root 404's lit seam stays lit (Will, 2026-09-01: a 404 that
feels alive keeps a visitor exploring).

## Landed this window

- `fa45a88` the bible, second edition: `rules/bible.ts` (nine rules rewritten; `status` per rule;
  rule 7 `mono-is-leaving`, 10 `depth-in-dark`, 11 `lamps-without-media`, 16 `four-grounds`, 21
  `copy-is-open`, 22 `rising-tides`), `bible.test.ts` (a status names a slug), `rules/page.tsx`
  (the status badge links the board; the page's mono stripped).
- `7ce4bef` the doctrine: CLAUDE.md (rising tides in the Build step, the asset-log Orient row, copy
  open), PROGRAM.md (the principle redefined, the record between windows, one window per handoff,
  the exit checklist), STATUS (the wave row, the queue as a pointer), ROADMAP (the rounding round
  opened, the composition pass, the lit surface on the light board, the hero wiring after kill-mono,
  voice-infusion), design-system.md and marketing-content.md (rules 1, 10, 11, 16 as rewritten, marked
  under exploration), the design record (seven open boards), `marketing-nav.ts` (no pin claim).
- `24239d0` the asset log and this record: `docs/ASSETS.md` seeded with round two's asks and the two
  parked media items; `docs/tracks/README.md` (the ASSETS row, the Handoff line's fixed shape, the
  queue); `track-manifests.test.ts` (`docs/ASSETS.md` is never owned); this manifest rebuilt.
- `0a06802` the pre-strip: the nine mono hits left in these lanes gone; `theme.css` drops `--font-mono`
  (Tailwind's default stack carries the survivors until `kill-mono` lands). ★ A lane that sees mono
  fall back to the system stack is seeing this, not a bug.
- `0cdf4c7` the board shell (`src/components/dev/board/`: `Stage` with grounds, `Toggle`, `BoardMeta`),
  the home-hero board and contract moved onto it, the desk at `/design/c` (reads `docs/tracks/` at
  request time; `next.config.ts` traces the directory in), seven boards registered in `touchpoints.ts`
  with stubs under `sandbox/<id>/` and reserved keyframe prefixes (`pal-`, `lgt-`, `tsc-`, `flt-`,
  `bv-`, `mk-`, `rnd-`), the dispatcher and `touchpoints.test.ts` grown to twelve.
- `9366df5` the seven manifests stubbed (each the whole init); the wave spawned from `6c19d84`.
- `ff0291a` hero-river integrated: variation 4 on the hero board, the code in the eyebrow's slot and
  the album pouring down out of it, the parting held by geometry; the asset log's row 12. Round three
  is complete on the board.
- `ae03a94` light integrated: a four-part board (depth in dark, lamps without media, the cadence, the
  violet) and the draft doctrine (SEPARATE, FILL, MARK; a lamp needs a place; the aurora as the FILL job
  at chapter scale) in `docs/specs/light.md`; the asset log's rows 10 and 11. Every board of the wave
  is in.
- `3aeef1a` hero-burst integrated: variation 3 on the hero board, the origin in every direction with
  a hand-done projection and a per-card quiet zone; the asset log's row 9 (the portrait crops).
- `66b4ebe` hero-scan integrated: variation 2 on the hero board, the corridor released by the scan;
  the asset log's row 8 (the hand-and-phone cutout).
- `d5847ad` palette integrated: three complete token sets as pastes on real sections at both widths
  against an oklab ruler, the accent argued by job; `docs/specs/palette.md` carries the blocks; the
  asset log's row 7 gains the four hard-case frames it asked for.
- `e1f06d6` floating-surfaces integrated: nine primitives live on one canvas over real photographs,
  radius / entrance / light as independent knobs, the outliers beside the contract, each frame an
  iframe at true pixels on a gated scene route (`/design/sandbox/floating-surfaces`); the contract
  rewritten in `docs/specs/floating-surfaces.md`. Its frame is offered to `src/components/dev/board/`
  as an addition (a `Stage` cannot hold a portalled layer): taken up when the next board needs one.
- `797f692` media-kit integrated: the sourcing law as a proposal, ten licenses quoted, eight CC0
  candidates staged under `public/design/media-kit/` with `provenance.json` (a test pins the pair),
  the contact sheet; the asset log's rows 2, 4, 6 and 7 rewritten from its Handoff.
- `69af90d` kill-mono integrated (88 files; the two system-doc edits read by eye; the artifact
  regenerated clean at the merge); `838a5f6` type-scale integrated; bible 7 is now `two-faces`,
  enforced by `src/app/two-faces-policy.test.ts`; `docs/specs/type-scale.md` carries the token tables.
- the rounding round: `src/components/dev/tuner-store.ts` (new), `motion-tuner.tsx` and
  `motion-tuner-config.ts` rebuilt (descriptions, ships, groups, the action trio, nine retirements),
  `motion/motion-playground.tsx` (the controls hoisted), `sandbox/rounding/board.tsx` (the kit, four
  columns), `src/app/globals.css` (the theme-independent tokens in their own `:root` block),
  `(dev)/design/design.css` (`.mono` no longer declares the radius tokens), `src/components/ui/button.tsx`
  (the in-between sizes derive from `--radius-action`). Verified on the dev server: the store survives
  a soft navigation and a reload, the live column and a paper chapter's card follow the knob
  (19.6px at a 14px base), Reset clears the DOM and the store.
- the home hero, round two RULED (the source) and round three cut: `board.tsx` shows the source as the
  reference and three variation stubs (`scan.tsx`, `burst.tsx`, `river.tsx`); the reel and the
  gathering left the board (last at `6b2c595`: `git show 6b2c595:src/app/(dev)/design/sandbox/home-hero/reel.tsx`);
  the scrim toggle and the shipped-hero reference went with them; `touchpoints.ts` names the three
  tracks on the board (`board.tracks`) so the desk lists each track's preview; this manifest now owns
  the hero shell as explicit files so the variation tracks own their two files each.

The previous window (the "less is more" reset, milestone-24, the gallery, the home-hero board and
round two) is recorded in the CHANGELOG.
