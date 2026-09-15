---
track: media-kit
status: handed-off
cut: "fb395fe"
merged_round_2: "2307446"
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

- Head: the tip of `lp/media-kit`, pushed, and the alias is built from it (a manifest cannot name
  its own commit; `git rev-parse origin/lp/media-kit` gives the SHA). The last commit that changes
  what the board draws is `763423a`; the ones after it are this manifest and one unused import
  dropped. Preview `partyreel-git-lp-media-kit-partyreel.vercel.app`, board at
  `/design/c/media-kit?key=`
- ★ **The alias was a day stale, and it is rebuilt.** Vercel's ceiling of 100 deployments a day
  was at 0 remaining when `763423a` landed, so that push produced no deployment and the alias kept
  serving `b05c7c3`, a build whose Ours slate is still the 1200x800 cut. That is the one frame the
  walk below opens on, and the one this track found broken: a 4:5 blog card takes 20 percent off
  each side of it, so the shot code and the start of the line were gone. The first rebuild push lost
  its slot by seven seconds, so the rebuild was forced at the same SHA instead and went READY, and
  the alias now serves the tip. Verified on it, not inferred: the board's chunk carries
  `viewBox='0 0 1000 1000'` and no served chunk carries `0 0 1200 800` any more, and Ours applied
  from the board draws the square slate on the real `/blog` at 1440, centred inside the 320x400 card
  with the code, both rows of the subject and the replaces line all inside the crop. The same check
  settles it any time the alias looks behind again.
- **How the ceiling actually behaves** (worth knowing while six tracks share one project, and the
  reason the first rebuild push produced nothing): the cap does not lift at midnight, it refills at
  one deployment every 14.4 minutes, and the next push on ANY branch takes the free slot. Pushes
  made mid window are refused outright and GitHub never retries them, so a push is not a deploy: it
  is an entry in a race. Confirm a rebuild by the SHA on the deployment, never by the push
  succeeding. The API route is the same race from the other side (`POST /v13/deployments` with
  `gitSource` returns `payment_required` until a slot frees).
- Synced with `launch-prep` at `4b035c1` (it had moved one docs-only commit past the cut at `ca952b5`)
- Gates on the synced tree, re-run at the head: typecheck ok, lint ok (0 errors, 7 warnings, all
  pre-existing and none in this lane now that round two's own unused import is gone), test ok (1726
  in 197 files; this track's five suites hold 34, 28 of them new this round), build ok (248 pages)
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

## Handoff (round 3)

- Head: the tip of `lp/media-kit`, pushed (`git rev-parse origin/lp/media-kit`; a manifest cannot
  name its own commit). The last commit that changes what the board draws is `063a227`, the third
  pass's; the ones after it are the `launch-prep` merge and these docs. Board at
  `/design/c/media-kit?key=`.
- **Third pass (a second read-only review raised two should-fix items; both are closed here, in the
  lane, and both were the same fault seen from two sides: the board and the site were not looking at
  the same thing).**
  1. *The block could only speak in ids, and the sheet speaks in posts.* `BRIDGE[].candidate` is per
     POST and a file name can only carry an id, so the applied CSS matched `BRIDGE_BY_ID` and 14 of
     the 21 filled posts wore a different photograph on the walk from the one the board's own row
     showed (the timeline post wore bridge-ceremony.jpg under Licensed while the sheet showed
     wedding-arch.jpg). It also made the route table unreachable: the Mix row promises two covers and
     exactly one id can change. The site does name a post, in two places, so the blocks now carry a
     per-slug rule as well as the per-id one: `a[data-cover-morph][href="/blog/<slug>"] img` for the
     card (the index and an article's "Keep reading" row), and
     `html:has(link[rel="canonical"][href$="/blog/<slug>"]) [data-cover-plate="target"] img` for the
     article's own hero, both outranking the id rule on specificity. A post that nothing licensed can
     fill draws a `None` slate rather than keeping today's frame, and under Ours a post draws the
     shot ITS vertical is owed (the conference post wears `K1`, not the festival frame's shot), which
     is the miscasting the route exists to end said on the real page. Five assertions in
     `apply.test.ts` pin every post's rule to `routeOutcome`, pin that the 14 genuinely diverge, pin
     that no slug is a suffix of another (the canonical is matched by suffix, because its origin
     differs between localhost, a preview and production), and pin the route table's blog column to
     the number of licensed rules in the block.
  2. *The candidate was drawn centred and the real card does not draw it centred.* `coverFor` derives
     object-position from the SLUG alone, so a `content` swap leaves it where it was and the wiring
     round's frontmatter edit will not move it either: a candidate lands at the post's own rung of
     the crop ladder. The stage and the sheet drew it at `50% 50%`, which flattered every candidate
     by exactly what the real card takes off its side. Both are drawn at `post.crop` now, on both
     rows, and the file header and the two captions say why.
  3. The two doc comments that claimed the sheet and the block "cannot disagree" (`bridge.ts`) are
     corrected to say what is actually true now, and `decision.ts` carries the note that its `blog`
     column is a number a reviewer can count on the real /blog.
- **Second pass (a read-only review of the first handoff raised three should-fix items, all fixed
  here, none blocking and none outside the lane).**
  1. *Ask 3 still carried round two's pre-rule count.* It read "Licensed ships twelve swaps, Mix
     ships two, Ours ships none", which is the one number this round exists to take back, in the
     first sentence a reviewer reads, under a caption promising every number is computed, two lines
     above its own `because` and directly above the table that contradicts it. Every digit in the
     asks and the route table is interpolated now, and `decision.test.ts` refuses any that the batch
     does not compute (the asks below are re-quoted from the rendered board).
  2. *`MIX_LICENSED` was read in two namespaces at once.* `routeOutcome` matched it against a post's
     candidate; the applied CSS matched it against a manifest id. Both only appeared to work because
     "wedding-rings" and "wedding-arch" name a staged frame AND a manifest entry, and the id
     `wedding-arch` is bridged by `bridge-ceremony`, so Mix pasted bridge-ceremony.jpg onto a page
     the board's own sheet showed wearing wedding-arch.jpg. It was also one edit from silence: a key
     that is not also an id would have sent every post to "ours" and made Mix identical to Ours,
     which is the inert toggle this round claims to have killed. The list is candidate keys now, one
     predicate answers for a post and for an id (`routeOutcomeForId`), `apply.ts` builds all three
     route blocks through it, and three tests pin the namespace, the agreement and that Mix changes
     something. **The correction moves a count: Mix swaps ONE of the twelve ids, not two** (the id
     `wedding-arch` is bridged by a ceremony with people in it, which is not furniture, so it goes
     to the shoot); on the blog, where a post names its own candidate, Mix is still two covers. The
     board, the route table, the spec and this manifest all say the derived numbers.
  3. *The applied-block walk was reported for `/blog` only.* It is now walked on every page in the
     walk row, with the counts under Light QA below.
- ★ **Verified on a LOCAL PRODUCTION BUILD, not on a preview.** Vercel was at its daily deployment
  ceiling for the whole round, so the `lp/media-kit` alias serves round two's build and no push in
  this round produced a deployment, and neither the second nor the third pass called a Vercel API at
  all. The round was walked on `pnpm build` + `next start` in this worktree against the real Supabase
  and R2 (`-p 3112` in the first pass, `-p 3210` in the second, `-p 3211` in the third;
  `pnpm dev -p 3111` during the work). The alias will be
  round three's as soon as a slot frees: confirm by the SHA on the deployment, never by the push
  succeeding (round two's note on how the cap behaves still holds, one slot every 14.4 minutes and
  the next push on any branch takes it).
- Synced with `launch-prep` at `778bdf1` (it had moved one merge past the cut `fb395fe`, the
  brand-voice track's round three, which touches nothing this lane reads; merged in before handoff
  so the tree under test is the integration tree).
- Gates on that tree, re-run after `pnpm format` on the changed files: typecheck ok, lint ok
  (0 errors, 6 warnings, all pre-existing and none in this lane), test ok (1786 in 198 files; this
  track holds 59 across six suites, 25 of them new this round), build ok (248 static pages).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/media-kit.md`,
  `docs/tracks/media-kit.md` and nine files under `src/app/(dev)/design/sandbox/media-kit/`
  (`apply.ts`, `apply.test.ts`, `board.tsx`, `bridge.ts`, `bridge.test.ts`, `decision.ts`,
  `decision.test.ts`, `exposure.test.ts`, `shoot.ts`). No exceptions. No production byte changed: `marketing-media.ts`,
  `public/marketing/` and every blog frontmatter are untouched, and `public/design/media-kit/` is
  unchanged from round two (the 22 staged files and `provenance.json`).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Shell / touchpoint change the Orchestrator applies** (no agent edits `touchpoints.ts`), superseding
  round two's proposal: `note` → `The ruling first: four questions with one-word answers, then the
  exposure on the real site, all 23 posts at the blog card's and the share card's real geometry, the
  kit as a call sheet of 36, and four blocks a walk can wear`; `variants` →
  `["The exposure", "Mix", "Ours", "Licensed"]` (the four applied blocks, recommendation first).
- **Assets requested from Will.** Unchanged in substance; round three read the whole asset log and
  found the list is longer on paper and shorter in practice, because one night produces nine of its
  twelve rows.
  - **36 event photographs, six per vertical** (weddings, birthdays, corporate, conferences,
    festivals, trips) · 1600 px long edge, a third portrait, one dark warm grade; the call sheet is
    on the board and in `docs/specs/media-kit.md` 5.1, one card per frame, codes `W1` to `T6`, each
    naming the subject, the framing, the light and the crops it must survive. Four are the palette
    board's hard cases (`W5` high key, `W3` low key, `W2` candle warm, `S4` stage cool) and three
    show a guest holding a phone up (`K3`, `S3`, `T4`) · replaces all twelve `MARKETING_IMAGES` by id
  - **24 squares at 512x512**, 6 to 35 KB webp · 1:1 crops of the 24 masters marked `512 square` ·
    `ASSETS.md` row 2
  - **10 portrait crops at 512x640 and 12 portraits at 720x900** · 4:5 recrops of the same masters ·
    rows 9 and 12. **Ten, not row 9's eight**: `hero-burst` raised the count in its round-two handoff
    so no frame is on screen twice on the desktop canvas, and the log still says eight
  - **A hand-and-phone cutout**, PNG with alpha, 1200 px long edge, screen area transparent, two
    grips · the ONE separate setup: the same event, the darkest wall, `K3`'s light · row 8
  - **8 vertical clips with posters**, 3 to 5 s, 1080x1920, silent · filmed between the frames, and
    the film cut from that footage · rows 4 and 1
  - **The light board's worst-case overlapping pair** (row 11) · `W3` and `C1` on the call sheet are
    already that pair, two dark low-contrast frames; they need the intent, not a second setup
  - **The demo event's curated folder** (row 5) · if the shoot is run AS a Partyreel event, the
    guests' own uploads are the seed and the live QR on every hero board points at a real album
- **Proposed `ASSETS.md` changes** (the Orchestrator applies): row 7's `spec` → append `one night
  closes nine of the twelve rows in this log: rows 1, 2, 3, 4, 5, 8, 9, 11 and 12 are crops,
  recrops, cuts or setups of it, and the table is docs/specs/media-kit.md 5.3`; row 9's `what` and
  `spec` → ten portrait crops rather than eight (hero-burst, round two); row 11's `spec` → append
  `W3 and C1 on the media-kit call sheet are this pair already; shoot them knowing they will be laid
  over each other`; row 5's `spec` → append `if row 7's shoot is run as a Partyreel event, the
  guests' uploads ARE this folder`; row 6's `spec` → replace the recommendation clause with `under
  the proposed rule the staged batch fills 10 of the 12 ids and 18 of the 23 posts, not 12 and 21:
  four frames carry a recognisable face with no release, and reception-hall and party-dj are the two
  ids it cannot fill`.
- The asks, verbatim from `BoardMeta` (the Orchestrator quotes them under Waiting on Will). **Four,
  not five:** round two asked the route and the bridge separately, and the route decides the bridge,
  so the fifth was the same question in different words. The consequence is on the board as a route
  table instead.
  1. The sourcing rule: author, source, the license clause quoted, a retrieval date and a people
     field required on every manifest entry, and no recognisable face ships without a release.
     Options: Yes or No. This board recommends Yes.
  2. The allowed list: CC0, Pexels, Pixabay, Mixkit and Coverr in; Unsplash and CC BY out. Options:
     Yes or Strike one. This board recommends Yes.
  3. The route, which also decides the bridge: under ask 1 Licensed fills 10 of the 12 ids, Mix
     fills 1 of them now and sends the rest to the shoot, Ours sends all 12. Options: Mix, Ours or
     Licensed. This board recommends Mix.
  4. The kit: 36 masters, six per vertical, shot in one night at a real event running Partyreel.
     Options: Shoot or Park. This board recommends Shoot.
- **Look at first**: the card at the top. It is the whole ruling in four rows, and a reviewer who
  reads nothing else can still answer it. Then press **Licensed** in "Apply to the site" and click
  `/blog` in the walk row (the links carry the key and open in a new tab now): the whole library
  wears the CC0 bridge on the real cards, and every card wears the candidate its own row on the
  sheet names rather than whatever its cover's id is bridged with, so the walk and the board can be
  read against each other line by line. Press **Mix** and walk it again: two covers keep a
  photograph and the other 21 become the shot they are owed, which is the route table's blog column
  standing on the page. Come back, flip the route toggle to **Licensed** on the stage, and read the
  three plates at their real 320x400, each cut at its post's own rung of the crop ladder: a group
  around a fire with `A face, no release` under it, the conference frame that stays empty with the
  reason in it, and a ring detail that is legitimately licensed. That row is the argument in one
  line: the corpus can dress the site and cannot dress the half of it that matters.
- **Light QA.** Walked cold at 1440 on the local production build: every toggle, all three routes
  against both geometries and both viewport modes, and the four applied blocks.
  **The third pass re-walked every page after the block was rebuilt, on `next start -p 3211`.**
  Under **Licensed** all 23 posts land exactly what `routeOutcome` says, checked by computed
  `content` on every rendered card (13 on page 1, 11 on page 2, all 23 slugs covered, zero
  mismatches) and on three article heroes through the canonical rule:
  `/blog/scanned-a-qr-code-where-your-photos-go` wears bridge-ceremony.jpg (its own candidate, where
  the id would have given wedding-golden.jpg), `/blog/qr-code-for-wedding-photos` wears
  wedding-golden.jpg, and the conference post wears the `None` slate. The reviewer's own example is
  the clearest: `/blog/wedding-day-photo-collection-timeline` now wears wedding-arch.jpg at
  `50% 42%`, which is what its row on the sheet shows, rather than bridge-ceremony.jpg centred.
  Under **Mix**, exactly **2** of the 23 covers keep a photograph and 21 wear their shot, which is
  the number the route table promises and one more than the old block could land; the frames on
  every other page still come from the id rules (`/` 117 frames: 9 licensed, 105 slated, 3 reel
  posters no route touches; `/pricing` 26: 2 and 24; `/help` 8: 0 and 8; `/contact` 5: 0 and 5;
  `/features/album` 66: 6 and 59), and `scrollWidth === clientWidth === 1440` on each. The stage and
  the sheet were re-measured the same way: every `today` plate and its `bridge` plate now report the
  same computed `object-position`, across all three routes.
  **Round three's first-pass walk, unchanged:** With **Mix** applied from the board's own button (not by hand into the store) and
  `?key=` carrying the gate, every page mounts the island's `<style data-tuner-candidate="Mix">` and
  wears it. Marketing stills on the page, then the count wearing the licensed ring and the count
  wearing a slate: `/` 114 (9 and 105), `/pricing` 26 (2 and 24), `/help` 8 (0 and 8), `/contact` 5
  (0 and 5), `/blog` 17 (1 and 16), `/blog/qr-code-for-wedding-photos` 7 (0 and 7),
  `/features/album` 68 (7 and 61). With **Licensed** applied, every frame swaps and none slates
  (`/blog` 17 of 17 across 11 distinct staged files, `/` 114 of 114), which is the check that the
  block rebuilt through `routeOutcomeForId` still fills all twelve.
  **One walk finding, recorded rather than fixed:** the footer strip's four ids are in the DOM of
  every marketing page, but the nav mega panel's two (`wedding-toast`, `reception-table`) mount only
  when the panel opens, so a page at rest wears four of the six the board counts in the chrome. The
  exposure count is right; a reviewer just has to open the nav to see the last two wearing the block.
  **The non-marketing half of the round's list stays declined, and the board says why:** no marketing
  still is referenced anywhere under the dashboard, an event page, the admin portal or
  `/e/[qr_token]`, so a block changes nothing there, and `exposure.test.ts` pins it.
  **375 was verified for real this round, not by construction:** the Chrome MCP still cannot
  narrow the window (it reports `innerWidth` 1456 for a 420 px window), but the board loaded in a
  375 px same-origin IFRAME does re-run its media queries, and there
  `documentElement.scrollWidth === clientWidth === 375` at every section, with no element outside an
  `overflow-x: auto` container reaching past 376 px. The route table is the one wide element and it
  sits in its own scroller (736 px table inside a 343 px wrapper, the page still 375). The second
  pass also re-walked the applied block at an emulated 375: `/`, `/blog` and `/pricing` wear it with
  `scrollWidth - innerWidth === 0` on each, so a slate never widens a page. The third pass re-ran
  both: the board in a 375 iframe is 375 wide at eight sampled scroll positions down all 30,799 px
  of it, and `/blog` and `/pricing` at 375 with the Mix block on are 375 wide too, so the per-slug
  rules add nothing to a phone's width. Reduced motion
  is honoured: this board still mints no keyframe and runs no loop, the develop beat's settled state
  lives outside the media query in `marketing.css`, the only rule `board.css` adds is a transition
  delay inside `prefers-reduced-motion: no-preference`, and round three added
  `motion-reduce:transition-none motion-reduce:active:scale-100` to the press feedback on the applied
  blocks, which round two left unguarded. No console message of any kind on the production build, so
  the `useSyncExternalStore` read of the lab key hydrates clean.
- **Findings against a rule** (for Will, not acted on): none against the bible. Five against this
  track's own earlier work, all corrected in place and all now pinned by a test: the Licensed route's
  counts were the counts before the rule the same board proposes; the stage was drawing the wrong
  geometry on the wrong ground while its route toggle was inert between two of its three routes; the
  mix list was read in two namespaces at once, so the board's sheet and the CSS it hands the site
  disagreed about one frame on the recommended route; the block could only ever speak one of those
  two namespaces, so a walk showed the id's answer on 14 of the 21 filled posts and the route table's
  blog column was a number no walk could produce; and the candidate was drawn centred on a board
  whose whole claim is that it draws the real card. The shape of all five is one shape, and it is
  worth saying once: a number or a rule written into a sentence goes stale silently, a list read in
  two places means two things, and a surface that cannot express half of an argument will quietly
  show the other half instead. Each is derived from one function now and refused by a test.

## Record (round 3; the CHANGELOG paragraph for rounds 2 and 3, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-15). Two rounds turned the media-kit survey into a
surface Will can rule on in four words. Round two found the exposure was the site and not the blog
(the twelve unverified stills are named in 40 production files across 22 routes, six of them in the
footer and nav of every marketing page), that nobody hashed the blog covers (all 23 posts set
`cover:` by hand, so the fix is 23 frontmatter lines), and that a recorded reel re-renders with no
code edit; a second, harder search by scene rather than by keyword staged 22 CC0 candidates and
handed the running site four CSS blocks it can wear. Round three walked the board the way a reviewer
would and found the argument was buried under its own evidence, so the ruling is now the first thing
on the page: four questions with one-word answers, the recommendation marked, each linked to the
section that argues it. Asking the route and the bridge separately was asking one question twice, so
there are four asks and a table of what each route ships. The round's real correction is a number:
the rule this board proposes bars a recognisable face without a release, four of the 22 staged frames
carry one, and so the Licensed route fills ten of the twelve ids and eighteen of the 23 posts rather
than twelve and 21, with the dance floor and the DJ the two it cannot fill. The stage was drawing
440 px plates on the paper ground when the real blog card is 320x400 on a cinema page, and all three
of its posts went to the shoot under the default route, so it opened blank and two of its three
routes looked identical; it is now the real card at the real size with today's row above the route's
row, and a test refuses a stage set that leaves a route flip inert. A review of the handoff found the
same class of fault twice more: the ask a reviewer answers first still quoted the pre-rule count, and
the list of frames the Mix route keeps licensed was read as candidate keys on the board and as
manifest ids in the CSS the board hands the site, so the recommended route pasted a photograph the
sheet did not show. One function now answers a route for a post and for an id, every digit in the
ruling surface is interpolated from the batch, and Mix swaps one of the twelve ids and two of the 23
covers. Reading the whole asset log
closed the cost argument: one night of photography produces nine of its twelve rows, the demo event's
own seed among them, so the shoot is the cheapest item on the list rather than the most expensive.
No production byte changed.
