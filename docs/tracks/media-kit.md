---
track: media-kit
status: handed-off
cut: "6c19d84"         # the launch-prep SHA the branch was cut from (the review wave, round two)
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

## Handoff (replaces the chat report)

- Head `f78800f` (this manifest commit is the tip), pushed; preview
  `partyreel-git-lp-media-kit-partyreel.vercel.app`
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

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

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
