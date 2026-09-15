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
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/lab-nav.tsx
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/mode-shell.tsx
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/app/(dev)/design/sandbox/home-hero/board.tsx
  - src/app/(dev)/design/sandbox/home-hero/board.css
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
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
  - "round four of the review wave (2026-09-15, overnight on Will's notes): the shell gained BoardDock (src/components/dev/board/dock.tsx: a board's page-wide switches, sticky from sm up, writing its height to scroll-padding-top and --board-dock-h) and the reading preferences (lab-prefs.ts, applied by LabChrome: every Stage renders at 1:1 by default, the board page lifts its max-width, the sidebar is tucked away on board pages; Fit keeps the old zoom); never scale a judged specimen. The home hero board is the source, the scan and the new inflow (hero-source, hero-scan, hero-inflow); the burst and the river left it for their own boards, album-hero and river-visual, their files moved whole (imports now ../home-hero/shared); ConceptId keeps burst and river for the seeds. Twelve tracks run at once; Vercel is capped until the afternoon, so every track verifies locally."
  - "the review wave (2026-09-14): seven tracks cut at once off the bible's second edition; the six boards own only sandbox/<id>/ (their RULINGS entries, the dispatcher lines and the desk are registered here up front, with placeholder variant names renamed at integration); kill-mono owns the production trees it sweeps, the lab's family pages and six older sandbox files, and src/components/marketing/system/ is RELEASED to it from this manifest (deleting mono-caption.tsx is atomic only with its 18 importers)"
  - the rounding and tweaking GUI round (Orchestrator-run, in parallel with the wave) touches src/components/dev/ (the tuner, its config, the shared board shell in dev/board/), src/app/(dev)/design/motion/, the rounding board at sandbox/rounding/, and the radius VALUES in src/app/globals.css and the derivation in src/app/theme.css; tokens are never renamed mid-window (boards read --radius-float and --radius-tile), and any landed value change is announced here first so boards sync
  - theme.css line 18 (--font-mono) was deleted pre-spawn; Tailwind's default mono stack carries every surviving font-mono until kill-mono lands, and no new mono is written anywhere (bible 7, retiring)
  - no @contract-for test is added on launch-prep until kill-mono integrates (it regenerates rules.generated.json); the Orchestrator reruns pnpm design:rules at each merge
  - "kill-mono landed (2026-09-14, `69af90d`): no mono face in the product; `src/app/two-faces-policy.test.ts` refuses a `font-mono` class, a mono loader or a `--font-mono` token; `MonoCaption` is gone (`Caption` is the one atom); `@contract-for` tests may be added again (the artifact was regenerated at the merge)"
  - "round two of the review wave (2026-09-14): src/components/dev/tuner-store.ts gained the candidate block (setCandidateCss, clearCandidate; persisted under its own key), src/components/dev/candidate-style.tsx renders it, the lab layout, the cinema and paper islands and a new app-layout island (src/components/dev/app-design-island.tsx, key-gated like the marketing one) mount it; src/components/dev/board/ re-exports the API for boards. sandbox/rounding/ is released to the rounding track for its second round"
  - "the rounding round landed (2026-09-14): the radius tokens, --gap-gallery, --spill-cadence and the --tune-* knobs moved into their own :root block in globals.css (no value changed) and left the lab's .mono sheet; the Button's in-between sizes derive from --radius-action (button.tsx, same numbers); the tuner has a persisted store (tuner-store.ts), descriptions and groups, and nine specimen-less knobs retired from the panel. A lane reading globals.css, design.css or button.tsx: nothing to sync unless it copied a token block"
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, what every
open track is doing, what waits on Will, and what landed. Agents sync `origin/launch-prep` mid-round
only when a line under "announces" or "Landed this window" touches one of their `reads`; otherwise
they sync once, before handoff, if it moved.

**This window (the review wave, 2026-09-14 to 15):** Will's rule-by-rule review of the bible, taken while
round two of the home hero was building. Nine rules rewritten, each reviewed rule carrying a status on
`/design/rules`, rising tides redefined as the ground-up judgment (bible 22), copy opened (21), mono
gone (7 is now the two-faces rule). Seven tracks cut at once (six lab boards and one production
sweep) and round three of the hero (three variations off the ruled source) cut the same afternoon,
and all ten integrated the same day. Will's read at the close: one round of context was not enough
for a real review, so **every board and hero variation ran a second and then a third round the same
night, ten tracks at once** (the rounding board as an agent track), each round a workflow: build, a
read-only skeptic refuting the handoff, a fix, a second review. The shell gained the candidate block
(`setCandidateCss`: a board hands the whole site the paste its ruling would land, rendered by the tuner
islands on the lab, the marketing pages, the host app, the guest surface and the admin portal). Every
round-3 handoff is integrated (the merge SHAs are on the In flight rows), folded into the CHANGELOG,
its asks quoted under Waiting on Will, its proposal refreshed in `docs/specs/`. Every worktree and
`lp/*` branch is pruned. ★ Vercel's free-plan cap (100 deployments per trailing day) was hit at 23:31
on the 14th: the launch-prep alias serves round one until the window frees (from 16:30 on the 15th),
so the review surface is the local dev server. Will's overnight notes (2026-09-15) opened **round four on
twelve tracks at once** (the seven boards and the scan on his notes; the source released to
`hero-source`; `hero-inflow` new; `album-hero` and `river-visual` seeded with the burst and the river,
killed as heroes), on a shell that gained the board dock and 1:1 stages for it. **Now: Will's review of
round four** (the items below), after which:
the composition pass (one Orchestrator board stacking the ruled blocks on the home arc and the
dashboard), the hero's wiring round, the floating and light wiring rounds, `voice-infusion`. The
record the Orchestrator keeps between windows is the two lists below plus
[`../ASSETS.md`](../ASSETS.md); the desk at `/design/c?key=` renders the same files.

## In flight

Every open track, its board, its preview and what it waits on. A row changes at spawn, at handoff
(the preview builds on every push from the start: `preview: true`), at integration and at the ruling.

| track | board | preview | waits on |
| --- | --- | --- | --- |
| `palette` | `/design/c/palette` | `partyreel-git-lp-palette-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `b6da35d`) | round four: the handoff, then Will's ruling |
| `light` | `/design/c/light` | `partyreel-git-lp-light-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `8d8d0af`) | round four: the handoff, then Will's ruling |
| `type-scale` | `/design/c/type-scale` | `partyreel-git-lp-type-scale-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `5277925`) | round four: the handoff, then Will's ruling |
| `floating-surfaces` | `/design/c/floating-surfaces` | `partyreel-git-lp-floating-surfaces-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `e7309d7`) | round four: the handoff, then Will's ruling |
| `brand-voice` | `/design/c/brand-voice` | `partyreel-git-lp-brand-voice-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `778bdf1`) | round four: the handoff, then Will's ruling |
| `media-kit` | `/design/c/media-kit` | `partyreel-git-lp-media-kit-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `db2af14`) | round four: the handoff, then Will's ruling |
| `kill-mono` | no board (a production sweep) | the launch-prep alias (integrated `69af90d`) | two looks (Waiting on Will, item 2); bible 7 is the two-faces rule |
| `hero-scan` | `/design/c/home-hero` | `partyreel-git-lp-hero-scan-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `1c2d0ea`) | round four: the handoff, then Will's ruling |
| `hero-source` | `/design/c/home-hero (variation 1)` | `partyreel-git-lp-hero-source-partyreel.vercel.app` (round 4 building: the source continues in its emanating direction; the lane released from this manifest) | round four: the handoff, then Will's ruling |
| `hero-inflow` | `/design/c/home-hero (variation 3)` | `partyreel-git-lp-hero-inflow-partyreel.vercel.app` (round 1 building: the album streaming INTO the code, off the source) | round one: the handoff and its honest verdict, then Will's ruling |
| `album-hero` | `/design/c/album-hero` | `partyreel-git-lp-album-hero-partyreel.vercel.app` (round 1 building: the burst's field as the /features/album hero) | round one: the handoff, then Will's ruling |
| `river-visual` | `/design/c/river-visual` | `partyreel-git-lp-river-visual-partyreel.vercel.app` (round 1 building: the river as a feature visual, one flow) | round one: the handoff, then Will's placement |
| `hero-burst` | retired: the burst left the home hero (Will, 2026-09-15) for `album-hero` | the launch-prep alias (round 3 merged `78e9538`) | nothing: its field is the album-hero track's seed |
| `hero-river` | retired: the river left the home hero (Will, 2026-09-15) for `river-visual` | the launch-prep alias (round 3 merged `39113bb`) | nothing: its stream is the river-visual track's seed |
| `rounding` | `/design/c/rounding` | `partyreel-git-lp-rounding-partyreel.vercel.app` (round 4 building on Will's notes; rounds 2 and 3 on launch-prep, round 3 merged `93017e2`) | round four: the handoff, then Will's ruling |

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
   - **The scan** (rounds two and three; merged `1c2d0ea`). The departures Will rules on:
     - THE ROOM, OR A PHONE. Will named a phone in the hero as the first thing he may overrule, because a phone can read as an app. The recommendation is the room, until the cutout on ASSETS row 8 is shot. Either reading also puts light in a hero that is cinema and unlit by the standing ruling, and it is the only light in the frame: in the phone reading the screen, lighting itself and its own bezel and nothing else; in the room reading one white capture bloom behind the plate, spent in 400 ms and repeated once per turn of the album. Both brighten, neither darkens: there is no scrim anywhere on this concept and every photograph is at 100 percent.
     - KEEP THE COUNT, OR CUT IT. 282 photos from 48 guests, climbing to 312, is a STAND-IN and must not ship as invented data: the wiring round reads the demo event's real total, or the line goes. Round three made it the quiet half of the pair, so the composition holds either way.
     - THE CENTRED LOCKUP, inherited from the source: precedent and not law, because the code owns the axis. Overrule it and this hero goes left with the source.
     - Bible 13, decorative layers only: the corridor's pre-release state and the brackets' thrown-wide state live inside the reduced-motion block, so nothing paints settled and then snaps back. Every word, the code, the caption and the count are plain markup and never gated, and reduced motion gets the whole composition deployed and locked.
   - **The burst** (rounds two and three; merged `78e9538`). The departures Will rules on:
     - Rule on, the headline step, and it is the one choice that changes the composition: lg or xl. The toggle is on the stage, bottom right, and the field re-solves for whichever is showing. lg (text-7xl at 1440, text-4xl at 375) leaves the burst the canvas and keeps a corridor wide enough for a frame to leave the code through; xl (text-8xl, text-5xl) is the louder promise and costs the field about 80 px of quiet zone in every direction. Both are cinema steps of the one site ladder (bible 5).
     - Rule on, the copy: proposed or ruled. Proposed is 'It all comes out of this code.' over 'Every guest shoots from a different spot, and all of it reaches you at full size. No app, no account.' Both halves of the trade, because this is the easiest thing on the board to rule in the wrong word. WHAT IT BUYS: the code stays in the headline, which is the standing ruling here (the code as the basis of the feature is the distinct thing; a generic album is the weak one), the line says the one thing only this concept shows, that every frame on screen came out of that object, and it collides with nothing the other three propose. WHAT IT COSTS: it names the mechanism where round two's line named the outcome, so the album now arrives in the subhead instead of the headline, and 'It all' is a pronoun the picture has to answer, which makes the line the burst's rather than the site's. WHY IT MOVED: round two proposed 'One code, and the album fills.' over the subhead the river had published half an hour earlier, and the river, now integrated on launch-prep, opens 'One code, and the whole event lands here.' over that same sentence, so the duplicate was this concept's to fix. Round three's first answer, 'Your album, from every angle.', gave up the wrong half by giving up the code. Round two's phrasing can come back on one word, and it comes back into that collision: the line is the river's own opening, shortened, and both concepts would again be arguing one sentence. The ruled thesis stays the default under the board's copy toggle (bible 21).
     - Rule on, the lockup: centred or left. Precedent, not law. The code owns the axis here, so the type is centred on it. The first thing to overrule if the home hero should stay left.
     - Departure, bible 10 (the hero is unlit by the standing ruling): the frames carry a drop shadow, the light spec's LIFT family (docs/specs/light.md) at four times the offsets, because LIFT separates two cards a pixel apart and these are separated by a depth axis measured in hundreds of units. It is a shadow, never a lamp: no light source is added, no photograph is darkened, and there is no scrim anywhere on this concept.
     - Departure, bible 13, decorative layer only: the frames' pre-burst state sits inside the reduced-motion block, so with JavaScript off and motion allowed the field rests around the code instead of leaving it. The h1, the code, the caption, the sentence and the actions are plain markup, never gated, and reduced motion gets the whole album settled around the code.
   - **The river** (rounds two and three; merged `39113bb`). The departures Will rules on:
     - THE AXIS, and the one real argument with the source: the code leaves the exact centre. The source's case was the still centre of a moving album, and it is a good one; this trades it for causality read top to bottom. A code in the middle of a composition is an object the page is arranged around, and a stranger reads it as a thing to scan for more information. A code at the TOP, in the eyebrow's slot, with the album falling out of it, is a beginning: everything below it is what the scan produced, which is the sentence the hero was asked to say. The stillness survives the move, and nothing about the card animates. The lockup is centred rather than left-aligned for the same reason, which is precedent and not law: left-aligning costs the symmetry of the two arms, not the mechanism.
     - THE LINE UNDER THE CODE is printed on the card, and that is now the only build. Round two put both on the stage under a chip, a printed line and a line floating above a bare plate; walked cold the floating one loses plainly, so the chip is gone rather than left for Will to find, because it was also the one thing on the canvas that was not the composition. Say "above" and it comes back in a line: the mechanism does not care, it is the object that changes, and round one's argument against a line under a FLOATING plate (every frame has to escape sideways before it has fallen a card's height) is exactly what putting the line inside the white object dissolves.
     - See a real album
     - Built from 214 photos. Shot by 23 guests.
     - BIBLE 13, decorative layer only: the stream's pre-pour state (every frame collapsed at the code) and the ticking count both sit inside the reduced-motion block, so with JavaScript off and motion allowed the stream rests at the code and the count shows its starting figure. Putting either in an effect instead would paint the album deployed and then snap it back. The h1, the code, the line, the subhead, the buttons and the count's settled figure are plain markup and never gated, and a reader who asked for less motion gets the stream fully deployed and the settled number. What this board took from the first wave, recorded here because there is no other row for it: the light spec's LIFT carries the cards' overlap at its cinema alphas (docs/specs/light.md), the voice guide's hero shape and its two-beat sentence wrote the proposed copy (docs/specs/brand-voice.md), and the media kit's "readable at 120 px" test is what the asks are written against (docs/specs/media-kit.md). This concept has no CSS-paste candidate and so offers no "Apply to the site" block: its ruling lands as a hero component in the wiring round, not as tokens.
2. **The boards of the review wave** (rounds two and three integrated; the asks quoted from each
   board's meta panel; each ends in a word):
   - **palette** (`/design/c/palette?key=`; merged `b6da35d`):
     - The ramp: today, A or B.
     - The temperature: neutral, or warm.
     - The accent: ink, blue, violet or flare.
     - The accent's reach: all three jobs, attention only, or identity only.
     - The panel: one token, or the alphas.
     - The missing step: faint in, or out.
     - The dark card: declared, opaque, or the veil.
   - **light** (`/design/c/light?key=`; merged `8d8d0af`):
     - (see the board's Rule on panel)
   - **type-scale** (`/design/c/type-scale?key=`; merged `5277925`):
     - (see the board's Rule on panel)
   - **floating-surfaces** (`/design/c/floating-surfaces?key=`; merged `e7309d7`):
     - The radius: sharp, nested or round (this board says nested)
     - The entrance: one clock or by frequency (this board says by frequency, and that rule 15 means one language)
     - The light in dark: today or the shadow (this board says whatever the light board is ruled, since the numbers are the same)
     - The edge family: sheet or drawer (this board says drawer, and the guest entry shell adopts it)
     - The select: keep or drop (this board says keep, on the contract)
   - **brand-voice** (`/design/c/brand-voice?key=`; merged `778bdf1`):
     - The voice: B, A, or today (the agent recommends B)
     - The seven provisional home headers: whole in the selected voice, or line by line from the ledgers (the agent recommends whole)
     - The rest of the arc, its eyebrows, supporting lines and CTAs: take the selected voice, or hold today's (the agent recommends take)
     - Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat, never the first, and never both. Yes, or send it back
     - The thesis: keep in one album, or take as everyone saw it (the agent recommends keep)
     - One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album)
     - The account-required unfurl line: email, or sign in (the agent recommends email)
   - **media-kit** (`/design/c/media-kit?key=`; merged `db2af14`):
     - (see the board's Rule on panel)
   - **rounding** (`/design/c/rounding?key=`; merged `93017e2`):
     - The surfaces: A, B, C or D (--radius, --radius-float and --radius-tile move together)
     - The actions: today, pill or quiet
     - The derived ladder: stock or quarters
     - The dead rungs (rounded-3xl, rounded-4xl, --radius-action-lg): keep or drop
     - The gallery gap: pinned to the tile, or free
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
