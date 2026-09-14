---
track: media-kit
status: open
cut: "<filled at boot: the origin/launch-prep SHA you branched from>"
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-media-kit-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Assets requested from Will: none, or one bullet per asset: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- The asks, verbatim from BoardMeta (the Orchestrator quotes them under Waiting on Will): ...
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
