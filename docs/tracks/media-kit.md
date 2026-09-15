---
track: media-kit
status: handed-off
cut: "ca952b5"
merged_round_1: "c1aa5c6"
preview: true           # Will reviews this board on its preview as it builds
owns:
  - src/app/(dev)/design/sandbox/media-kit/
  - public/design/media-kit/
  - docs/specs/media-kit.md
reads:
  - src/lib/constants/marketing-media.ts
  - src/lib/constants/marketing-media.test.ts
  - docs/systems/marketing-content.md
  - docs/ASSETS.md
  - docs/tracks/hero-source.md
  - docs/tracks/hero-reel.md
  - docs/tracks/hero-gathering.md
  - src/lib/reel/build-reel-props.ts
  - src/lib/reel/render-service.ts
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/sandbox/variant-frame.tsx
---

# lp/media-kit

## Round 2 (Will, 2026-09-14: "another iterative round on all active tracks before review")

**Round 2 (the goal).** The survey found the exposure and the corpus's limits; now turn the board
into the two things Will can act on. (1) **The blog bridge, concrete**: a mapping of all 23 posts to a
candidate cover (the staged CC0 batch plus whatever the allowed sources yield on a second, harder
search: the exact verticals the corpus failed on, tried by subject synonyms and by scene rather than
by keyword, on every source in the allowed list), each shown in place at the blog card's and the OG
card's real geometry, with the provenance line under it and the posts that stay miscast named
honestly; if a frame cannot be filled under the rule, say so and leave it empty. (2) **The kit as a
shootable brief**: one card per master frame (36 by vertical, plus the derived rows 2, 8, 9 and 12
from the hero rounds and the palette's four hard cases from `docs/ASSETS.md` row 7), each with the
subject, the framing, the light, the crop it must survive (22 to 78 percent, 4:5, 1:1, 120 px
legibility), and the stand-in it replaces by id, laid out as a contact sheet Will can shoot from.
(3) **The provenance schema** prototyped: `provenance.json` mirrors the fields `marketing-media.ts`
would gain (`author`, `sourceUrl`, `license`, `clause`, `retrieved`, `people`), and the test pins
that every staged file has every field. (4) **The reel re-render runbook** made executable: the
steps, the page, the finish command, tried once as far as the lab allows, with what the wiring round
must add. (5) The asks reduced to one-word answers; the route recommendation kept.

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

**Goal.** The media-kit exploration of the review wave (2026-09-14). Bible 18 (every frame is ours) was "an unspoken rule": no stock at launch, and a licensed kit found under allowed licenses. This track writes the licensing rule down as a proposal (`docs/specs/media-kit.md`), surveys the sources whose terms allow a marketing use, plans the kit Will produces himself (he makes any image, video, SVG, 3D or generative asset), and stages a candidate first batch on a contact-sheet board beside the current twelve stills with provenance under each. The batch is staged, not wired: the stand-ins stay until a wiring round. No production byte changes on this track.
**Rulings in force.** The bible's second edition: rule 18 (every frame is ours; `marketing-media.test.ts` enforces the manifest), rule 1 as rewritten (media is the color), the unlimited-design-resources policy (PROGRAM.md: Will makes the assets; ask specifically). Every asset request goes through `docs/ASSETS.md` via the Orchestrator; never edit it.
**Verify on.** `/design/c/media-kit?key=` on your preview at 1440 and 375; `docs/specs/media-kit.md` reads whole; the gate green (`marketing-media.test.ts` stays green: the staged batch lives under `public/design/`, which nothing scans, never under `public/marketing/`).

## The brief

### The question

If the marketing media were sourced today under the rule that every frame is ours or licensed under terms we can name, where does it come from, what does Will make himself, and does a candidate first batch replace the twelve unverified stills?

### The facts, verified at `51f40e3` (start here; do not rediscover them)

- **All twelve `MARKETING_IMAGES`** (`src/lib/constants/marketing-media.ts:64-171`) carry the same line,
  `credit: { license: "unsplash (per lab-pack comment; provenance unverified)" }`, with no `author`,
  `sourceUrl` or `retrieved` (all three optional on the type at `:33-36`); the header (`:13-15`) admits
  the gap and `:31` says unverified entries "block the M4 gate". The lab pack they were copied from,
  `public/design/`, is EMPTY now, so the provenance trail is gone from the tree.
- **The test** (`marketing-media.test.ts`): every referenced file exists (`:29`), every file under
  `public/marketing/` has a manifest entry (`:39`, no orphans), every entry has a NON-EMPTY license line
  (`:51`; it does not check verified), unique ids, orientation matches dims, reel recipes reference
  known ids. `public/marketing/` holds 16 files (`img/`, `posters/`, `reels/`).
- **The two reels** (`MARKETING_REELS`, `:181-217`): `hero-candidate-01` (portrait) and `hero-candidate-02`
  (landscape, clips `festival-lights`, `festival-crowd`, `concert-confetti`, `party-dj`), each with a
  deterministic recipe (`styleId`, `seed`, `clipIds`, `sourceBitrate`, `finish`). ★ Re-rendering is NOT
  a CLI job: the engine encodes in the host's browser (WebCodecs, `src/lib/reel/engine/encode.ts:54`;
  `render-service.ts:1-12` brokers the client encode; the Lambda path was torn down 2026-07-08), driven
  from the lab's `/design/reel-parity` page, then the `finish` ffmpeg step by hand. Budget for it.
- **The rights statement today:** `docs/systems/marketing-content.md:555-557` (bible 18; Will pulled the
  two stock event photos from the press cut: "just feels weird to say here's a random stock photo"). The
  media manifest itself is undocumented in the system doc. STATUS's old queue said "the 4 Unsplash items
  need a per-batch OK"; the manifest has 12 (`docs/ASSETS.md` row 6 carries the corrected count).
- **The three hero asks already written** (`docs/ASSETS.md` rows 1 to 4; the manifests
  `docs/tracks/hero-reel.md`, `hero-source.md`, `hero-gathering.md`): the film (15 to 20 s, 12 to 18
  shots, a dark warm grade with the left 55% low, both orientations, mp4 + webm + posters, the cut list),
  24 squares at 512 px, 36 photographs at 1600 px (a third portrait) with 8 vertical clips and their own
  posters. `hero-gathering` names all twelve stills as the stand-ins to replace. These are the seed of
  the generated-kit plan.
- **The upload fixtures** (`/Users/gibby/local/ai/partyreel-test-media/`, gitignored) are proxy-licensed
  (Lorem Picsum "Unsplash-sourced", `samplelib.com`): never promote them into `public/marketing/`.
- **The unlimited-design-resources policy** (PROGRAM.md): Will makes any image, video, SVG, 3D or
  generative asset; a licensed kit is the complement, not the plan.

### The board

A contact sheet: the current twelve stills in one row, and beneath each the candidate that would
replace it (staged under `public/design/media-kit/` with a `provenance.json` beside the files: source,
author, license, the clause that allows a marketing use, the retrieval date), with the twelve grouped
by vertical (weddings, birthdays, corporate, festivals) so the gaps show; the two reels' clip ids
mapped to their candidates; a Phone 375 view. The candidates span the range: a batch from licensed
libraries; a batch that is Will's to make (the shot list rendered as a brief card per frame, with the
stand-in it replaces); a mix. The asks: the licensing rule as written; the sources allowed, clause by
clause; the first batch, OK or not, item by item; the kit plan.
### The deliverable

`docs/specs/media-kit.md` (a proposal until Will rules; the settled part is promoted into the system layer by the Orchestrator): the licensing rule (no stock at launch; every frame ours or under a license we can name, with `author`, `sourceUrl` and `retrieved` required on every manifest entry), the manifest and its test documented, how a loop is re-rendered, a survey of licensed sources whose terms allow a marketing use without attribution (CC0, Pexels, Pixabay, Mixkit, Coverr and the like, each with the exact clause and what it forbids), the generated-kit plan (the hero asks generalised: photographs by vertical, vertical clips, posters, with the shot lists), and the rows to add to `docs/ASSETS.md` proposed in Handoff. Plus the board.

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

- none. The media manifest is undocumented in the system layer (`marketing-content.md` covers the
  pages but never `marketing-media.ts`), and `docs/systems/` is outside this lane, so the contract is
  written in `docs/specs/media-kit.md` section 2 until the Orchestrator promotes the settled part.

## Deferred (ROADMAP one-liners, bucket named)

- Lab: `/design/reel-parity` hardcodes its eight `FIXTURES`, so re-rendering a recorded
  `MARKETING_REELS` recipe needs a code edit rather than a control; read the clip ids off the recipe.
- Docs: the marketing media manifest and its test have no home in `docs/systems/`; fold
  `docs/specs/media-kit.md` section 2 into `marketing-content.md` when the rule is ruled.

## Handoff (round 1)

- Head: the tip of `lp/media-kit`, pushed. The last commit touching the board, the spec or the batch
  is `14bd665`; `f78800f` merged `launch-prep`; the commits after it are this manifest.
  Preview: `partyreel-git-lp-media-kit-partyreel.vercel.app`
- Synced with `launch-prep` at `8b06f89` (twice: an earlier merge at `04af3d5` took a tip that still
  carried a YAML break in `docs/tracks/orchestrator.md`'s frontmatter, landed by `ff2de13`, which
  failed `track-manifests.test.ts`; `8b06f89` has it fixed and the suite is green)
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 7 warnings, all pre-existing and none in
  this lane), test ok (1697 in 193 files, 6 of them this track's `provenance.test.ts`), build ok
  (247 static pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md`, the nine files under `public/design/media-kit/`, and the five under
  `src/app/(dev)/design/sandbox/media-kit/` (`board.tsx`, `board.css`, `kit.ts`, `sources.ts`,
  `provenance.test.ts`). No exceptions. No production byte changed: the twelve stand-ins,
  `marketing-media.ts` and `public/marketing/` are untouched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will:
  - **36 event photographs, six per vertical** (weddings, birthdays, corporate, conferences,
    festivals, trips) · 1600 px long edge, a third portrait, one grade, 3 of the 36 showing a guest
    holding a phone up, framed to read at 120 px and to survive a crop from 22 to 78 percent; the
    shot list is `docs/specs/media-kit.md` 5.1 · replaces all twelve stand-ins by id
    (`wedding-golden`, `reception-table`, `party-balloons`, `concert-confetti`, `wedding-rings`,
    `reception-hall`, `party-dj`, `wedding-toast`, `festival-lights`, `festival-crowd`,
    `wedding-arch`, `wedding-petals`)
  - **24 square crops at 512 px** · 6 to 35 KB webp, cropped from 24 of the 36 rather than shot
    separately · replaces `FRAMES` in `sandbox/home-hero/shared.tsx`, which every round-three hero
    variation cycles (`ASSETS.md` row 2)
  - **8 vertical clips with posters** · 3 to 5 s, 1080 x 1920, silent, each with its own poster at
    1080 x 1920, filmed at the same events · replaces the `currentTime` ranges cut out of
    `hero-candidate-01` (`ASSETS.md` row 4, withdrawn with the gathering; it costs nothing to keep
    because it is the same shoot)
- **Proposed `ASSETS.md` changes** (the Orchestrator applies; no agent edits that file). Row 7 is
  already open for "a licensed media kit" and this specifies it; rows 2 and 4 fold into it:
  - Row 7, `what` → `The kit, 36 masters`; `spec` → `36 event photographs, six per vertical
    (weddings, birthdays, corporate, conferences, festivals, trips), 1600 px long edge, a third
    portrait, one grade; 3 of the 36 show a guest holding a phone up; framed to read at 120 px and to
    survive a 22 to 78 percent crop; shot lists in docs/specs/media-kit.md 5.1. The 24 squares
    (row 2), the 8 clips (row 4) and the film (row 1) are crops and cuts of this one shoot, not
    separate deliveries.`; `replaces` → `all twelve MARKETING_IMAGES by id`; `status` → `requested`
  - Row 2, `spec` → append `derived from row 7 rather than shot separately`
  - Row 4, `status` → `parked (revives with row 7: the same shoot)` rather than `withdrawn`
  - Row 6, `spec` → append `the media-kit track staged 8 CC0 candidates under public/design/media-kit/
    with provenance.json; the recommendation is a dated bridge on the blog pool only, never the hero`
- The asks, verbatim from `BoardMeta` (the Orchestrator quotes them under Waiting on Will):
  1. The rule as written: author, source and retrieval date REQUIRED on every manifest entry, and an
     entry missing them cannot ship (spec section 1).
  2. The allowed list: Pexels, Pixabay, Mixkit, Coverr and CC0 in, Unsplash out, each on the clause
     quoted above. Yes to the list, or strike a source.
  3. The route: Licensed, Ours, or Mix. The recommendation is Mix, with the frames marked ours in the
     sheet.
  4. The first batch, item by item: OK to stage as the bridge on the blog pool, or not at all.
  5. The kit: 36 masters, six per vertical, and the 24 squares, the 8 clips and the film derived from
     them rather than asked for separately.
- **Look at first**: the three paragraphs above the toggles, then flip Route to Licensed and read the
  four empty frames. Unsplash's terms exclude recognizable people from the license, and all twelve
  stand-ins are full of them, so the gap cannot be closed by finding the source; and the best free
  corpus that exists returns hot air balloons for "party balloons" and a rope on a stage for "a dance
  floor". Then "In place", which is the whole argument in one image: a conference post illustrated
  with a music festival, on the real blog geometry with the real derived crop.

## Record (round 1)

Merged into `launch-prep` at `<sha>` (2026-09-14). The media-kit exploration wrote bible 18 down as a
proposed sourcing law (`docs/specs/media-kit.md`): two provenance classes and no third, `author`,
`sourceUrl` and `retrieved` required on every manifest entry, a generated frame's license being the
generating service's output-ownership clause, and the model-release rule that keeps a licensed face
off a page that makes a claim. The survey behind it quotes ten license pages clause by clause and
found the thing that settles the round: Unsplash's terms exclude recognizable people from the
license, and all twelve stand-ins are full of them, so the gap was never a missing citation. The board
at `/design/c/media-kit` argues three routes on the same twelve positions with the provenance line
under each, shows the vertical gap costing seven of 23 blog posts a miscast cover, and stages eight
CC0 candidates under `public/design/media-kit/` with `provenance.json` and a test pinning the two
together; the four it could not fill are the argument. The kit plan generalises round two's parked
asks into 36 masters by vertical, with the squares, clips and film derived from one shoot. No
production byte changed.

## Handoff (round 2)

- Head `<HEAD>`, pushed; preview `partyreel-git-lp-media-kit-partyreel.vercel.app`, board at
  `/design/c/media-kit?key=`
- ★ **The preview alias is behind the head.** The project hit Vercel's daily deployment limit during
  this round (the palette track hit it too and recorded the same), so the push at `763423a` built no
  deployment and the alias still serves `b05c7c3`. The only difference between them is the Ours
  slate's geometry (a square viewBox with centred type, so a 4:5 card no longer crops the shot code
  off it); everything else on the board, including all four applied blocks, is what the alias serves.
  A redeploy of the head is the one thing this handoff needs from the Orchestrator.
- Synced with `launch-prep` at `4b035c1` (it had moved one docs-only commit past the cut at `ca952b5`)
- Gates on the synced tree: typecheck ok, lint ok (0 errors, 8 warnings, all pre-existing and none in
  this lane), test ok (1725 in 197 files, 28 of them this track's five suites), build ok (248 pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md`, `public/design/media-kit/` (22 jpgs + provenance.json) and the eleven
  files under `src/app/(dev)/design/sandbox/media-kit/`. No exceptions. No production byte changed:
  `marketing-media.ts`, `public/marketing/` and every blog frontmatter are untouched.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Shell / touchpoint change the Orchestrator applies** (no agent edits `touchpoints.ts`): the
  `media-kit` entry still carries round one's note and variants. Proposed:
  `note` → `The exposure measured on the real site, all 23 posts mapped to a candidate cover at the
  blog card's and the share card's real geometry, the kit as a call sheet of 36 frames, and four
  blocks a walk can wear`; `variants` → `["The exposure", "Licensed", "Ours", "Mix"]` (they are the
  four applied blocks now, which is what a reviewer actually switches between).
- Assets requested from Will (unchanged in substance from round one, sharpened by the call sheet;
  `ASSETS.md` row 7 already covers the first and names the hard cases):
  - **36 event photographs, six per vertical** (weddings, birthdays, corporate, conferences,
    festivals, trips) · 1600 px long edge, a third portrait, one dark warm grade; the call sheet is on
    the board and in `docs/specs/media-kit.md` 5.1, one card per frame with codes `W1` to `T6`, each
    naming the subject, the framing, the light and the crops it must survive. Four are the palette
    board's hard cases (`W5` high key, `W3` low key, `W2` candle warm, `S4` stage cool) and three show
    a guest holding a phone up (`K3`, `S3`, `T4`) · replaces all twelve `MARKETING_IMAGES` by id
  - **24 squares at 512x512**, 6 to 35 KB webp · 1:1 crops of the 24 masters marked `512 square`,
    not a second shoot · replaces `FRAMES` in `sandbox/home-hero/shared.tsx` (`ASSETS.md` row 2)
  - **8 portrait crops at 512x640 and 12 portraits at 720x900** · 4:5 recrops of the same masters;
    `W4`, `B5` and `S3` are shot portrait and the rest are recrops of masters whose subject is
    vertical · `ASSETS.md` rows 9 and 12
  - **A hand-and-phone cutout**, PNG with alpha, 1200 px long edge, screen area transparent, two
    grips · the ONE item that is a separate setup: shoot it at the same event, against the darkest
    wall, from just behind the holder's shoulder, in the same low warm light as `K3` · replaces the
    drawn device in `sandbox/home-hero/scan.tsx` (`ASSETS.md` row 8)
  - **8 vertical clips with posters**, 3 to 5 s, 1080x1920, silent · filmed at the same events, and
    the film cut from that footage · `ASSETS.md` rows 4 and 1
- **Proposed `ASSETS.md` changes** (the Orchestrator applies): row 7's `spec` → append
  `the call sheet is docs/specs/media-kit.md 5.1 and the board, one card per frame with codes W1 to
  T6; rows 9 and 12 are recrops of the same masters and row 8 is the only separate setup (shoot it at
  the same event in K3's light)`; row 6's `spec` → replace the count with
  `the media-kit track staged 22 CC0 candidates under public/design/media-kit/ with provenance.json,
  filling all twelve ids; the recommendation is a dated bridge, and the exposure is 40 production
  files and 22 routes, with six of the twelve in the footer and nav of every marketing page`;
  rows 8, 9 and 12 `spec` → append `derived from row 7's shoot` (row 8: `shot at the same event`).
- The asks, verbatim from `BoardMeta` (the Orchestrator quotes them under Waiting on Will):
  1. The rule, yes or no: author, source, license clause, retrieval date and a people field required
     on every manifest entry, and a recognisable face may not ship without a release (spec 1.2 and 1.4).
  2. The allowed list, yes or strike one: CC0, Pexels, Pixabay, Mixkit and Coverr in, Unsplash and
     CC BY out.
  3. The route, one word: Licensed, Ours or Mix. The recommendation is Mix.
  4. The bridge, ship or hold: 23 posts recovered by hand, 21 filled and 2 left empty on purpose.
  5. The kit, shoot or park: 36 masters, six per vertical, with the squares, the portraits, the clips
     and the film cut from the same night.
- **Look at first**: press **Licensed** in "Apply to the site", then open `/blog` on this preview.
  The whole library wears the CC0 bridge, all twelve ids, on the real cards. Press **Ours** and walk
  it again: every frame becomes the slate of the shot that replaces it, which is the shoot's cost said
  page by page. Then come back and read the two red rows at the bottom of the bridge, which are the
  conference post and the office party, the two the corpus cannot fill at all.
- **Light QA.** Board walked on the preview at 1440: the four applied blocks driven on the real
  `/blog` (Licensed swaps all 15 loaded frames on the library page; Ours draws the slate on each), the
  stage no longer clips its plates, the sheet reads at three across. 375 verified by construction and
  by the stage's Phone 375 mode (every grid on this board is single-column at its base and only opens
  at `sm:`), because the Chrome MCP could not actually narrow the window: it reports
  `window.innerWidth` 1318 for a 658 px window, so a forced-width measurement re-runs no media query
  and is pessimistic by design. Reduced motion is honoured: this board mints no keyframe and runs no
  loop, the develop beat's settled state lives outside the media query in `marketing.css`, and the
  only rule `board.css` adds is a transition delay inside `prefers-reduced-motion: no-preference`.
- **Findings against a rule** (for Will, not acted on): none against the bible. Three against round
  one's own board, all corrected in place and each pinned by a test so they cannot come back: the
  exposure (the site, not the blog), the blog covers (chosen in frontmatter, not hashed) and the reel
  runbook (no code edit needed).

## Record (round 2; the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-14). The media-kit board's second round turned the
survey into a ruling surface and corrected three things the first round got wrong, each now pinned by
a test. The exposure was the site, not the blog: the twelve unverified stills are named in 40
production files across 22 routes, and six of them sit in the footer strip and the nav panel, both in
the group layouts, so they are on all 24 marketing pages before a reader scrolls. Nobody hashed the
blog covers either; all 23 posts set `cover:` in frontmatter and 22 differ from the fallback hash, so a
person chose every miscast one out of eleven wedding and festival frames, which makes the bridge 23
frontmatter lines rather than twelve files. And re-rendering a recorded reel needs no code edit: both
recipes are already in the parity page's clip-set picker, in order. A second, harder search by scene
rather than by keyword closed all four of round one's holes and staged 15 more CC0 frames, 22 in all,
which moved the argument rather than winning it: 18 of the 22 work only because nobody in them is
recognisable, and the free corpus turns out to be an archive of record rather than of celebration, so
it covers trips completely and conferences not at all. The board now maps every post to a candidate at
the blog card's and the share card's real geometry (the share card centre-crops and ignores the
ladder), writes the kit as a call sheet of 36 frames with framing, light and the crops each must
survive, prototypes the manifest's proposed `credit` shape across 22 records, and hands the running
site four blocks it can wear. No production byte changed.
