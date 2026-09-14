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
  - the review wave (2026-09-14): seven tracks cut at once off the bible's second edition; the six boards own only sandbox/<id>/ (their RULINGS entries, the dispatcher lines and the desk are registered here up front, with placeholder variant names renamed at integration); kill-mono owns the production trees it sweeps, the lab's family pages and six older sandbox files, and src/components/marketing/system/ is RELEASED to it from this manifest (deleting mono-caption.tsx is atomic only with its 18 importers)
  - the rounding and tweaking GUI round (Orchestrator-run, in parallel with the wave) touches src/components/dev/ (the tuner, its config, the shared board shell in dev/board/), src/app/(dev)/design/motion/, the rounding board at sandbox/rounding/, and the radius VALUES in src/app/globals.css and the derivation in src/app/theme.css; tokens are never renamed mid-window (boards read --radius-float and --radius-tile), and any landed value change is announced here first so boards sync
  - theme.css line 18 (--font-mono) was deleted pre-spawn; Tailwind's default mono stack carries every surviving font-mono until kill-mono lands, and no new mono is written anywhere (bible 7, retiring)
  - no @contract-for test is added on launch-prep until kill-mono integrates (it regenerates rules.generated.json); the Orchestrator reruns pnpm design:rules at each merge
  - the rounding round landed (2026-09-14): the radius tokens, --gap-gallery, --spill-cadence and the --tune-* knobs moved into their own :root block in globals.css (no value changed) and left the lab's .mono sheet; the Button's in-between sizes derive from --radius-action (button.tsx, same numbers); the tuner has a persisted store (tuner-store.ts), descriptions and groups, and nine specimen-less knobs retired from the panel. A lane reading globals.css, design.css or button.tsx: nothing to sync unless it copied a token block
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
| `palette` | `/design/c/palette` | `partyreel-git-lp-palette-partyreel.vercel.app` | spawned 2026-09-14 from `9366df5`; building |
| `light` | `/design/c/light` | `partyreel-git-lp-light-partyreel.vercel.app` | spawned 2026-09-14 from `9366df5`; building |
| `type-scale` | `/design/c/type-scale` | `partyreel-git-lp-type-scale-partyreel.vercel.app` | spawned 2026-09-14 from `9366df5`; building |
| `floating-surfaces` | `/design/c/floating-surfaces` | `partyreel-git-lp-floating-surfaces-partyreel.vercel.app` | spawned 2026-09-14 from `9366df5`; building |
| `brand-voice` | `/design/c/brand-voice` + `docs/specs/brand-voice.md` | the launch-prep alias (integrated `749e29a`) | Will's ruling (Waiting on Will, item 2) |
| `media-kit` | `/design/c/media-kit` + `docs/specs/media-kit.md` | `partyreel-git-lp-media-kit-partyreel.vercel.app` | spawned 2026-09-14 from `9366df5`; building |
| `kill-mono` | no board (a production sweep; the hard cases walked on its preview) | `partyreel-git-lp-kill-mono-partyreel.vercel.app` | spawned 2026-09-14 from `9366df5`; building |
| `hero-scan` | `/design/c/home-hero` (variation 2) | `partyreel-git-lp-hero-scan-partyreel.vercel.app` | spawned 2026-09-14 (round three); building |
| `hero-burst` | `/design/c/home-hero` (variation 3) | `partyreel-git-lp-hero-burst-partyreel.vercel.app` | spawned 2026-09-14 (round three); building |
| `hero-river` | `/design/c/home-hero` (variation 4) | `partyreel-git-lp-hero-river-partyreel.vercel.app` | spawned 2026-09-14 (round three); building |
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
   wiring round cuts after that ruling and after `kill-mono` lands.
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
3. **The rounding sitting** (the tuner earned it 2026-09-14): `/design/c/rounding?key=` on the
   launch-prep alias (four columns of one kit, three fixed candidates and a live one) and the tuner
   in the corner of every cinema page and the lab (`?key=`); values survive Replay, navigation and
   reload until Reset; Copy CSS gives the block to bake. The asks: "--radius, --radius-float,
   --radius-tile: the values (today 2 / 8 / 3)"; "--radius-action, -lg, -sm: the values (today 16 /
   19.2 / 12.8), and whether they move with the surfaces"; "Whether float and tile move with the
   surfaces or stay put"; "Whether the derived scale (sm 0.6x to 4xl 2.6x) survives a rounder base,
   or the steps get retuned". Say the six numbers (or a column) and bible 8 inherits them.
4. **The light rulings**, riding the `light` board and closed by its ruling: (b) the lit surface
   (`[data-lit]`, on three of four beam specimens), (c) the publish beat's violet, (d) the cadence,
   8s or 11s. Still parked on its own: (f) whether the guest surfaces follow the VISITOR's theme
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
