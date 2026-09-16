---
track: orchestrator
status: open
cut: "51f40e3"          # this window opened at the round-two walk (2026-09-14)
preview: false
owns:
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/(shell)/page.tsx
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/docs.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/_data/legacy-routes.ts
  - src/app/(dev)/design/_data/legacy-routes.test.ts
  - src/app/(dev)/design/_data/glossary.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/components/dev/motion-tuner.tsx
  - src/components/dev/motion-tuner-config.ts
  - src/components/dev/marketing-motion-tuner.tsx
  - src/components/dev/tuner-store.ts
  - src/components/dev/candidate-style.tsx
  - src/components/dev/app-design-island.tsx
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
  - src/components/dev/lamp-set.ts
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - scripts/lab-smoke.mjs
  - .github/workflows/ci.yml
  - docs/perf/v1-baseline.md
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/events/visibility-labels.ts
  - src/lib/shared/use-entered-frame.ts
reads:
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/components/marketing/system/section-shell.tsx
announces:
  - "the clarity round (2026-09-15, be1638f2): an ask carries its context. `Ask` in src/components/lab/board-spec.ts gained `context`, `look`, `state` and `control`, and `options` are `{ id, label, means }` (a bare string is the transitional form; read an option only through optionId / optionLabel / optionMeans); LIMITS gained askContext 400, askLook 240, optionLabel 48, optionMeans 160 and askQuestion is 160. sandbox/registry.test.ts holds PLAIN, the boards still on the string form, which only shrinks: a board off it must ask a real question ending in ?, carry context and look, label every option in words, and mirror a control only with equal option ids. `?` is an answer in the review grammar (`ask=? \"why\"`, the note required): scripts/lab-review.mjs stores it as choice null, review/ledger.ts allows it, review/status.ts reports it as state unclear (still waiting), the desk flags it, and the session and the board panel offer it as Not clear to me. The light board is the exemplar (sandbox/light/spec.ts; depth.tsx's columns carry the options' names). docs/reviews/light.json carries Will's five entries for round 5 (kit=land, infusion=phase-1, register=accent; aurora and depth not clear); docs/reviews/_window.json round 5 carries his three notes. Eleven tracks cut: the nine content tracks rewrite their board's asks (one per board; glow-specs both glow boards), palette rebuilds as the first catalog, lab-review-card moves the answering onto the board."
  - "Phase 1 of the Library x Lab round integrated (2026-09-15): the kit is src/components/lab (import from `@/components/lab`; nothing outside /design may import it): BoardPage({spec, dock, evidence, review}), defineBoard in board-spec.ts (asks, candidates, departures, assets, sections, controls, lookFirst, notes, links; LIMITS pinned by sandbox/registry.test.ts), useBoardState (declared controls read from the URL: canvas, ground, candidate, s), Frame (a same-origin iframe wearing a candidate as an adopted stylesheet; scroll-locked rows; the blocked banner; never a cross-origin contentWindow touch), Compare (differs required), Specimen, ApplyToSite, the walk, CostMeter, the review panel (one ledger line), traps.ts rendered at /design/lab/kit; `pnpm new-board <id> \"<title>\"` scaffolds a spec and a board; a migrated board registers its spec in sandbox/registry.ts and its component in (shell)/lab/boards.ts without the legacy flag, and the discipline test refuses a local Row|Part|Knob|PageFrame|ApplyToSite|CostMeter in it. The shell: _data/state.ts is the one URL vocabulary (key, canvas, ground, candidate, s, session) and the keyboard contract (useDigitKeys); _data/search.ts the ⌘K index; Section anchors its heading; PreviewCode is gone (gallery/specimen.tsx frames a specimen with Tabs). The rules layer: rules/influences.ts (LEVELS, bindsFor), the BindsStrip at (shell)/library/rules/binds-strip.tsx, review/status.ts (boardStatus, waitingOnWill, windowNotesFor), the collector's @policy: and @refuses: directives, docs/design/guidance.md and docs/design/library.md. The desk: /design/lab queues every open ask of every board with a spec; `pnpm lab:review '<line>'` appends Will's pasted line to docs/reviews/<board>.json (the Orchestrator runs it). The tuner panel sets data-lab-panel and --lab-panel-w on <html>; design.css pads a wide page clear of it from 1024 up."
  - "the lab's gate runs in the proxy (2026-09-15, 216830cc): src/proxy.ts refuses a keyless or wrong-key /design request with a real 404 before any lab layout renders and forwards a good key as the x-design-key request header; (shell)/layout.tsx reads it and hands `designKey` to Shell as a prop (ShellProvider no longer calls useSearchParams; the layout has no Suspense boundary around the page, which let a page's notFound() answer 200 with the nav in the flight payload). The pages keep requireDesignKey. Landed inside four lanes after the spawn (shell.tsx, shell-context.tsx, layout.tsx; lab/[board]/page.tsx; library/record/[id]/page.tsx; lab/page.tsx and lab/proposals/[slug]/page.tsx): each track was told to merge origin/launch-prep before touching those files."
  - "the Library x Lab round, Phase 0 (2026-09-15): the lab is two areas on one shell. Routes are /design/library/* (rules, policies, guidance, rulings, doctrine/<doc>, record, glossary, the component permalinks and the five family galleries) and /design/lab/* (the desk, /design/lab/<board>, proposals, tracks, kit, tools/<tool>); every old URL 307s with the key (_data/legacy-routes.ts, next.config.ts). The shell: (shell)/layout.tsx builds the nav server-side (_data/nav.ts over _data/catalog.ts) and renders _shell/shell.tsx (top bar with the two areas, the theme control and the key chip; the sidebar with prefix matching, badges and a filter; the content column; the TOC rail from xl). Templates every page composes, from (shell)/_shell/index.ts: PageHeader (breadcrumbs from the nav, title, description, badges, meta, actions, Copy page), Section and Sub (anchored, scroll-margin under the top bar and a dock), Pager (neighbours from the nav or passed), Ref (one link for every reference: a bible rule, a component, a board, a record entry, a doc anchor, a proposal, a track, a policy, a source path; replaces both SourceLinks), LabLink and useDesignKey (the key on every internal href, fragment-safe: withDesignKey now inserts before #), Tag, Callout, StatRow, WidePage (data-lab-wide: the TOC rail hides, the sidebar honours the preference), PreviewCode, CopyButton. Repo markdown renders through _shell/markdown.tsx (compileMDX, format md, remark-gfm; heading ids from the help slugify; docs read by _data/docs.ts from an allow-list of docs/, CLAUDE.md and the craft skill, traced into the /design/ functions by next.config.ts). The board shell: lab-prefs.ts renamed bleed to sidebar (open | collapsed) and gained editorRoot; BoardDock sticks under the top bar (sm:top-[var(--lab-topbar-h)]), reads BoardPageContext (id, title, sections, prev, next; provided by (shell)/lab/[board]/page.tsx, filled by the kit's template) and links the desk at /design/lab; ModeShell, .mono (except the dark override two legacy boards still paint), font-opt-urbanist and the data-dir-root wash are gone: one design language on the real tokens. The board spec type is src/components/lab/board-spec.ts (defineBoard, LIMITS, anchorFor) and the registry sandbox/registry.ts (empty until the kit track lands the pilots). docs/design/rulings.md holds Will's rulings (never owned); docs/reviews/ holds the ledgers (never owned; the README states the shape and the message grammar). pnpm lab:smoke crawls every lab route against a running server. Five tracks cut on disjoint lanes: lab-shell, lab-rules, lab-kit, lab-library, lab-desk (their manifests are their inits); integration order lab-shell, lab-rules, lab-kit, lab-library, lab-desk; a shared-file change a track needs (_data/{links,docs,legacy-routes,glossary}.ts, touchpoints.ts, rules/bible.ts, next.config.ts, motion-tuner.tsx) is asked for in Handoff and landed here."
  - "the CI budget round (2026-09-15): CI is not the gate, the four local steps are. ci.yml runs on main and launch-prep pushes that touch code and on PRs to main; an lp/* push runs it only when the commit message says [ci]; a docs-only push is skipped. Vercel: an lp/* branch builds at status: handed-off or on [preview], never every push (preview: true is intent only). Push work in progress freely; say [preview] on the push Will should see before the handoff."
  - "round four of the review wave (2026-09-15, overnight on Will's notes): the shell gained BoardDock (src/components/dev/board/dock.tsx: a board's page-wide switches, sticky from sm up, writing its height to scroll-padding-top and --board-dock-h) and the reading preferences (lab-prefs.ts, applied by LabChrome: every Stage renders at 1:1 by default, the board page lifts its max-width, the sidebar is tucked away on board pages; Fit keeps the old zoom); never scale a judged specimen. The home hero board is the source, the scan and the new inflow (hero-source, hero-scan, hero-inflow); the burst and the river left it for their own boards, album-hero and river-visual, their files moved whole (imports now ../home-hero/shared); ConceptId keeps burst and river for the seeds. Twelve tracks run at once; Vercel is capped until the afternoon, so every track verifies locally."
  - "the review wave (2026-09-14): seven tracks cut at once off the bible's second edition; the six boards own only sandbox/<id>/ (their RULINGS entries, the dispatcher lines and the desk are registered here up front, with placeholder variant names renamed at integration); kill-mono owns the production trees it sweeps, the lab's family pages and six older sandbox files, and src/components/marketing/system/ is RELEASED to it from this manifest (deleting mono-caption.tsx is atomic only with its 18 importers)"
  - the rounding and tweaking GUI round (Orchestrator-run, in parallel with the wave) touches src/components/dev/ (the tuner, its config, the shared board shell in dev/board/), src/app/(dev)/design/(shell)/lab/tools/motion/, the rounding board at sandbox/rounding/, and the radius VALUES in src/app/globals.css and the derivation in src/app/theme.css; tokens are never renamed mid-window (boards read --radius-float and --radius-tile), and any landed value change is announced here first so boards sync
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
`/design/library/rules`, rising tides redefined as the ground-up judgment (bible 22), copy opened (21), mono
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
killed as heroes), on a shell that gained the board dock and 1:1 stages for it; every round-4
handoff is integrated (the merge SHAs on the In flight rows), each after a read-only review, a fix and a
re-review, the last passes cut short by a usage limit at 06:20 and finished after it. **The alias serves Phase 1 (`a0ef9867`) until the wave's build lands after 2026-09-17 00:13 UTC (Vercel's daily API-deployment cap); the desk and every migrated board review on a local `pnpm dev` meanwhile.** **The clarity round (2026-09-15, opened at `be1638f2`):** Will's first review through the desk answered three light asks (`kit=land`, `infusion=phase-1`, `register=accent`) and marked two not clear; the questions were labels with token options. Every board's asks are being rewritten in plain words (one agent per board), the answering moves onto the board beside its evidence (`lab-review-card`), and the palette board is rebuilt as the first catalog (his directive: a few polished variants with demo UI to pick from beat a mountain of research text). ★ Vercel's GitHub integration works: the wave's `[preview]` pushes were refused with "Deployment rate limited, retry in 24 hours" (the daily cap counts every path, the dashboard included), so the alias serves Phase 1 until 2026-09-17 00:13 UTC and the round reviews on a local `pnpm dev`. **Now: Will's review resumes on the desk once the wave lands** (every open ask of every board, in plain words, one line to paste at the end; the items below are the same asks as they read before the rewrite, kept until the ledgers carry his answers), after which:
the composition pass (one Orchestrator board stacking the ruled blocks on the home arc and the
dashboard), the hero's wiring round, the floating and light wiring rounds, `voice-infusion`. The
record the Orchestrator keeps between windows is the two lists below plus
[`../ASSETS.md`](../ASSETS.md); the desk at `/design/lab?key=` renders the same files.

## In flight

Every open track, its board, its preview and what it waits on. A row changes at spawn, at handoff
(the preview builds on every push from the start: `preview: true`), at integration and at the ruling.

| track | board | preview | waits on |
| --- | --- | --- | --- |
| `lab-review-card` | `/design/lab/<board>?session=` (the review card, the clarity round) | none: a local `pnpm dev` after integration | handoff |
| `palette` | `/design/lab/palette` (the clarity round, round 6: the first catalog) | none: a local `pnpm dev` after integration | handoff |
| `album-hero` | `/design/lab/album-hero` (the clarity round, round 3: the asks in plain words) | none: a local `pnpm dev` after integration | handoff |
| `brand-voice` | `/design/lab/brand-voice` (the clarity round, round 6) | none | handoff |
| `floating-surfaces` | `/design/lab/floating-surfaces` (the clarity round, round 6) | none | handoff |
| `glow-specs` | `/design/lab/glow-doctrine` and `/design/lab/glow-moments` (the clarity round, round 2) | none | handoff |
| `home-hero` | `/design/lab/home-hero` (the clarity round, round 6) | none | handoff |
| `media-kit` | `/design/lab/media-kit` (the clarity round, round 6) | none | handoff |
| `river-visual` | `/design/lab/river-visual` (the clarity round, round 3) | none | handoff |
| `rounding` | `/design/lab/rounding` (the clarity round, round 6) | none | handoff |
| `type-scale` | `/design/lab/type-scale` (the clarity round, round 6) | none | handoff |
| `light` | `/design/lab/light` (the clarity round: rewritten by the Orchestrator at `be1638f2`, the exemplar) | the launch-prep alias after the cap resets | Will's six open asks, in plain words, through the desk |
| `album-hero` | `/design/lab/album-hero` (the migration wave, round 2) | the launch-prep alias (integrated, merged `a61fd366`) | Will's ruling, through the desk's review session |
| `river-visual` | `/design/lab/river-visual` (the migration wave, round 2) | the launch-prep alias (integrated, merged `a489d563`) | Will's ruling, through the desk's review session |
| `home-hero` | `/design/lab/home-hero` (the migration wave, round 5) | the launch-prep alias (integrated, merged `feb67ecb`) | Will's ruling, through the desk's review session |
| `type-scale` | `/design/lab/type-scale` (the migration wave, round 5) | the launch-prep alias (integrated, merged `abe45329`) | Will's ruling, through the desk's review session |
| `floating-surfaces` | `/design/lab/floating-surfaces` (the migration wave, round 5) | the launch-prep alias (integrated, merged `d7959f13`) | Will's ruling, through the desk's review session |
| `palette` | `/design/lab/palette` (the migration wave, round 5) | the launch-prep alias (integrated, merged `6fd30692`) | Will's ruling, through the desk's review session |
| `brand-voice` | `/design/lab/brand-voice` (the migration wave, round 5) | the launch-prep alias (integrated, merged `55e74015`) | Will's ruling, through the desk's review session |
| `media-kit` | `/design/lab/media-kit` (the migration wave, round 5) | the launch-prep alias (integrated, merged `3fe6f41b`) | Will's ruling, through the desk's review session |
| `glow-specs` | `/design/lab/glow-doctrine` and `/design/lab/glow-moments` (specs + the template) | the launch-prep alias (integrated, merged `1c0306dd`) | Will's ruling, through the desk's review session |
| `lab-shell` | `/design/library` and `/design/lab` (the chrome) | the launch-prep alias (integrated, merged `90f23288`) | nothing |
| `lab-rules` | `/design/library/rules`, `policies`, `guidance`, `rulings`, `doctrine`, `record`, `glossary` | the launch-prep alias (integrated, merged `0fb9498e`) | nothing: the desk and the kit read its `review/` and Binds strip |
| `lab-kit` | `/design/lab/light`, `/design/lab/rounding`, `/design/lab/kit` | the launch-prep alias (integrated, merged `22c0dc81`) | the migration wave (eight boards onto its template) |
| `lab-library` | `/design/library/<component>` and the five family galleries | the launch-prep alias (integrated, merged `a76578de`) | nothing: the shell track reads `entry.badge` into the nav |
| `lab-desk` | `/design/lab` (the desk, the review session), `tracks`, `proposals`, `tools` | the launch-prep alias (integrated, merged `ea0ae0d8`) | boards with specs (the migration wave) to queue |
| `palette` | `/design/lab/palette` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `c0d60b94`) | Will's ruling |
| `light` | `/design/lab/light` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `bc2390f2`) | Will's ruling |
| `type-scale` | `/design/lab/type-scale` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `d762841f`) | Will's ruling |
| `floating-surfaces` | `/design/lab/floating-surfaces` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `75be0b0d`) | Will's ruling |
| `brand-voice` | `/design/lab/brand-voice` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `0414a120`) | Will's ruling |
| `media-kit` | `/design/lab/media-kit` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `1c2be959`) | Will's ruling |
| `kill-mono` | no board (a production sweep) | the launch-prep alias (integrated `69af90d`) | two looks (Waiting on Will, item 2); bible 7 is the two-faces rule |
| `hero-scan` | `/design/lab/home-hero` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `f4494d6e`) | Will's ruling |
| `hero-source` | `/design/lab/home-hero (variation 1)` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `797fa9ad`) | Will's ruling |
| `hero-inflow` | `/design/lab/home-hero (variation 3)` | the launch-prep alias once Vercel's window frees (round 1 integrated, merged `7294f1d5`) | Will's ruling |
| `album-hero` | `/design/lab/album-hero` | the launch-prep alias once Vercel's window frees (round 1 integrated, merged `f51fcdc5`) | Will's ruling |
| `river-visual` | `/design/lab/river-visual` | the launch-prep alias once Vercel's window frees (round 1 integrated, merged `3e81cc39`) | Will's ruling |
| `hero-burst` | retired: the burst left the home hero (Will, 2026-09-15) for `album-hero` | the launch-prep alias (round 3 merged `78e9538`) | nothing: its field is the album-hero track's seed |
| `hero-river` | retired: the river left the home hero (Will, 2026-09-15) for `river-visual` | the launch-prep alias (round 3 merged `39113bb`) | nothing: its stream is the river-visual track's seed |
| `rounding` | `/design/lab/rounding` | the launch-prep alias once Vercel's window frees (round 4 integrated, merged `06ceeb41`) | Will's ruling |

## Waiting on Will

Every open ruling with its link; the asks are quoted from each board's meta panel as the boards hand
off. Assets live in [`../ASSETS.md`](../ASSETS.md).

1. **The home hero, round three** (`/design/lab/home-hero?key=`, read in a FOREGROUND tab): round two
   was ruled 2026-09-14 (the source, "definitely my favorite direction"; the reel and the gathering
   out, the reel's idea parked as a "Watch your event highlights" video card for another page). Three
   variations off the source are building (`hero-scan`, `hero-burst`, `hero-river`, each on its own
   preview, the source first on the board as the reference); the ruling to come: which variation (or
   the source as is), its eyebrow and supporting elements, its copy, the departures ruled in. The
   wiring round cuts after that ruling (`kill-mono` has landed).
   - **The source** (round 4; merged `797fa9ad`). The departures Will rules on:
     - THE CENTRED LOCKUP, and it is the only one left. Precedent rather than law: every other marketing hero goes left, and this one is centred because the code owns the axis and the corridor is symmetrical about it. Overrule it and the composition changes shape, because the type would then have to live beside the corridor rather than above and below it. Everything else here is inside the bible: media at 100 percent with no scrim and no darkening layer anywhere, the h1 in the markup at full opacity, every animation inside the reduced-motion block with the deployed corridor as the rest state, and cinema and unlit with no lamp. Round three's second departure, a reader with scripting off and motion allowed getting an empty band, is fixed rather than flagged: a noscript companion rule restores the deployed corridor for exactly that reader.
   - **The scan** (round 4; merged `f4494d6e`). The departures Will rules on:
     - KEEP THE COUNT, OR CUT IT. 282 photos from 48 guests, climbing to 312, is a STAND-IN and must not ship as invented data: the wiring round reads the demo event's real total, or the line goes. It is the quiet half of the pair, so the composition holds either way. This is the one ruling left on the concept.
     - THE CENTRED LOCKUP, inherited from the source: precedent and not law, because the code owns the axis. Overrule it and this hero goes left with the source.
     - RULED AND FLAGGED, not a question: the phone. Will ruled it in on 2026-09-15, and three things still hold it to a camera rather than to software, because a phone that reads as an app would break the whole pitch. The screen carries no chrome but the notch, no title bar and no buttons; the device is cropped by two frame edges so it reads as a held object in the room rather than a mockup on a slide; and what it is looking at is visibly the same code standing a few hundred pixels away. Its bezel radius is a drawn object's proportion, a literal rather than a surface token, because a phone corner is not a UI surface.
     - THE LIGHT. The hero is cinema and unlit by the standing ruling, and this concept has two emissive things: the phone's screen, which lights itself and its own bezel and nothing else, and one white capture bloom behind the plate, spent in 400 ms and repeated once per turn of the album. Both brighten, neither darkens: there is no scrim anywhere on this concept and every photograph is at 100 percent.
     - Bible 13, decorative layers only: the corridor's pre-release state, the phone's off-frame start and the brackets' thrown-wide state live inside the reduced-motion block, so nothing paints settled and then snaps back. Every word, the code, the caption and the count are plain markup and never gated, and reduced motion gets the whole composition deployed, held and locked.
   - **The inflow** (round 1; merged `7294f1d5`). The departures Will rules on:
     - Bible 13, decorative layer only, and a milder trade than the source's: with JavaScript off and motion allowed the corridor rests one beat further out than its steady spacing, because the gather's first frame lives inside the reduced-motion block (an effect would paint the steady corridor and then jump it outward). Both states are a full corridor rather than a collapsed one, which the source's pre-burst frame was not. The h1, the code, the count, the subhead and the CTAs are plain markup and never gated, and reduced motion gets the corridor flowing at its steady spacing.
     - The splash ring carries an 18 px outer glow, which is the concept's one departure from the standing cinema-and-unlit ruling. Measured, not decorative: a hairline ring at the opacity a ripple wants is invisible the moment it crosses a photograph, and the plate is surrounded by photographs by construction, so at a hairline the landing is only legible over the dark. There is no inner glow, which would whiten the plate and the frames under it, and bible 1 does not allow that.
     - The count under the code is the one fabricated thing in the frame, and it is load-bearing here in a way it is not on the other concepts: it is what separates arriving from vanishing. At wiring it reads the demo event's real total and each tick is one real upload. Rule on whether a hero may carry a live number at all; if it may not, this concept loses its clearest signal and the recommendation to keep the source gets stronger.
     - Precedent, not law: the lockup is centred rather than left-aligned, inherited from the source because the code owns the axis. The first thing to overrule if the home hero should stay left.
2. **The boards of the review wave** (round four integrated on Will's notes; the asks quoted from each
   board's meta panel; each ends in a word):
   - **palette** (`/design/lab/palette?key=`; merged `c0d60b94`):
     - The model: registers, or today's five grounds.
     - The dark: today, ladder, one room, ember, slate or lift.
     - The light: today, paper, bright, warm or cool.
     - The accent: ink, blue, violet or flare.
     - The accent's reach: all three, attention only, or identity only.
     - The mat: a register, or the alphas.
     - The missing step: faint in, or out.
     - The dark card: declared, opaque, or the veil.
   - **light** (`/design/lab/light?key=`; merged `bc2390f2`):
     - (see the board's Rule on panel)
   - **type-scale** (`/design/lab/type-scale?key=`; merged `d762841f`):
     - (see the board's Rule on panel)
   - **floating-surfaces** (`/design/lab/floating-surfaces?key=`; merged `75be0b0d`):
     - The direction: today, card, glass or command (this board says card)
     - The submenu: keep it, or delete it and let the three values be a group (this board says delete)
     - The radius: sharp, nested or round (this board says nested, which is what card carries)
     - The entrance: one clock or by frequency (this board says by frequency, and that rule 15 means one language)
     - The light in dark: today or the shadow (this board says whatever the light board is ruled, since the numbers are the same)
   - **brand-voice** (`/design/lab/brand-voice?key=`; merged `0414a120`):
     - The voice: B, A, or today (the agent recommends B)
     - The seven provisional home headers: whole in the selected voice, or line by line from the ledgers (the agent recommends whole)
     - The rest of the arc, its eyebrows, supporting lines and CTAs: take the selected voice, or hold today's (the agent recommends take)
     - Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat, never the first, and never both. Yes, or send it back
     - The thesis: keep in one album, or take as everyone saw it (the agent recommends keep)
     - One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album)
     - The account-required unfurl line: email, or sign in (the agent recommends email)
   - **media-kit** (`/design/lab/media-kit?key=`; merged `1c2be959`):
     - (see the board's Rule on panel)
   - **rounding** (`/design/lab/rounding?key=`; merged `06ceeb41`):
     - The surfaces: A, B, C or D (--radius, --radius-float and --radius-tile move together)
     - The actions: today, pill or quiet
     - The derived ladder: stock or quarters
     - The dead rungs (rounded-3xl, rounded-4xl, --radius-action-lg): keep or drop
     - The gallery gap: pinned to the tile, or free
   - **album-hero** (`/design/lab/album-hero?key=`; merged `f51fcdc5`):
     - (see the board's Rule on panel)
   - **river-visual** (`/design/lab/river-visual?key=`; merged `3e81cc39`):
     - (see the board's Rule on panel)
3. **The rounding sitting** (the tuner earned it 2026-09-14): `/design/lab/rounding?key=` on the
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
  the home-hero board and contract moved onto it, the desk at `/design/lab` (reads `docs/tracks/` at
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
