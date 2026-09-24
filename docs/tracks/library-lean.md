---
track: library-lean
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "cd3532fb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/
  - src/app/(dev)/design/_data/
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/gallery/
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/reference/
  - src/app/(dev)/design/review/
  - src/app/(dev)/design/rules/
  - src/app/(dev)/design/sandbox/admin-triage/
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/contact-page/
  - src/app/(dev)/design/sandbox/emails/
  - src/app/(dev)/design/sandbox/event-safety/
  - src/app/(dev)/design/sandbox/export-flow/
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/home-hero/
  - src/app/(dev)/design/sandbox/host-curation/
  - src/app/(dev)/design/sandbox/host-storage/
  - src/app/(dev)/design/sandbox/identity-claims/
  - src/app/(dev)/design/sandbox/identity-door/
  - src/app/(dev)/design/sandbox/identity-profile/
  - src/app/(dev)/design/sandbox/loose-ends/
  - src/app/(dev)/design/sandbox/media-viewer/
  - src/app/(dev)/design/sandbox/press-page/
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/profile-page/
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-front/
  - src/app/(dev)/design/sandbox/reel-host/
  - src/app/(dev)/design/sandbox/reel-screen/
  - src/app/(dev)/design/sandbox/reel-story/
  - src/app/(dev)/design/sandbox/reel-view/
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/sandbox/voice-guest/
  - src/app/(dev)/design/theme-toggle.tsx
  - src/app/(dev)/design/touchpoints.test.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/components/lab/
  - scripts/build-design-rules.mjs
  - scripts/design-rules/
  - scripts/lab-review.mjs
  - docs/design/
  - usher/kit/
  - src/components/ui/
  - src/components/shared/
  - src/components/marketing/
  - src/components/app/
  - src/components/social/
  - src/components/admin/
  - src/components/auth/
  - src/components/dev/
  - src/components/reel/
  - src/app/(app)/
  - src/app/(marketing)/
  - src/app/two-faces-policy.test.ts
  - src/app/keyframe-uniqueness.test.ts
  - src/app/globals-theme-contract.test.ts
  - src/app/css-source-policy.test.ts
  - src/lib/dashboard/
  - src/lib/avatar/
  - src/lib/admin/
  - src/lib/shared/
  - src/lib/format/
  - src/lib/constants/
  - src/lib/auth/
  - src/lib/qr/
  - src/lib/observability/
  - src/lib/content/
  - src/lib/db/queries/claims.test.ts
  - src/lib/db/row-cap-policy.test.ts
  - src/lib/events/event-guests.test.ts
  - src/lib/events/host-fingerprint.test.ts
  - src/lib/type-ladder-policy.test.ts
  - src/lib/track-manifests.test.ts
  - src/lib/single-source-policy.test.ts
  - src/lib/record-depth-policy.test.ts
  - src/lib/no-em-dash-policy.test.ts
  - src/lib/glass.test.ts
  - src/lib/elevation-policy.test.ts
  - src/lib/content-policy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - src/app/theme.css
  - src/app/globals.css
---

# lp/library-lean

**Goal.** The Library as three parts, catalog first (the brand kit, the catalog, the ten), opening on a short design recipe; the rules machinery retired; every test that only pins a look deleted and every function test kept.

## The brief

**Will's words (2026-09-24, verbatim):** "it's also insane that we have 9 dense pages of rules in the library, then ask agents to get creative." And: "imagine we set an agent off to redesign the blog page, a contact form, even an eyebrow. Does it really need almost 10 pages of dense docs, or could it take a brand kit, our 10 global guidelines, check in on production to see how things are now, maybe a visual pass for design, any real rules, then take a creative shot? Feel like it's hard for an agent to go design something new when we're telling it a million things it can't do." He also ruled that every test that only pins a look goes: the Library and production show the look, and the lab and his review hold it.

**The target: the Library is three things, catalog first.**
1. **The brand kit.** `/foundations` becomes it and leads the nav. It describes and never commands.
2. **The catalog.** Components, patterns, compositions and marketing, open by default. The home is the searchable index, and it opens on the design recipe below. An entry page keeps its specimens, config and variants, plus at most one line naming the test file that pins its behavior.
3. **The ten.** `/rules` shows the bible's ten and nothing else. The glossary stays as a quiet link.

**The design recipe** (the home's first band, about 100 words): the brand kit; the ten; production as it is now (open the live surface); a visual pass (capture the current surface at 1440 and 375); the real rules are the tests (run them, and a failure names what broke); then take a creative shot, in the lab.

**What goes:**
- **Pages:** `/policies`, `/guidance`, `/doctrine/*`, the rulings, "What binds you", the nine levels, the health strip (`influences.ts` and its components), and the contracts and landmines on entry pages.
- **Machinery:** `design:rules` and everything it feeds, `rules.generated.json` and `docs/design/library.md`. The catalog reads what it needs directly.
- **Tests of the machinery:** freshness, coverage, `for`-line coverage, influences, and the policy-path checks. The Library-facing parts of the lab and kit tests are trimmed to what remains.
- **Directives:** `@contract-for`, `@policy` and `@refuses` leave the test headers. The tests themselves stay.
- **Leftovers:** the unread `links: { bible }` field on boards, the 100 "nothing to look at" reasons, the rulings in `touchpoints.ts` if nothing else reads them, and the kit's regeneration steps (`hand-merge.sh`, `integrate.sh`, `gate-lane.sh`; `closer.py` only if the registries no longer need it).
- **Old routes:** each redirects to its nearest remaining page.
- **Guidance docs:** `docs/design/README.md` and `guidance.md` fold into the recipe or go.

**Look tests go; function tests stay.** Delete every test, or part of a test, that only pins a look:
- the source-reading glow, light and lit-edge pins;
- the type ladder, elevation and two-faces policies;
- button heights and avatar radius;
- the vendored border-beam check.

Keep every test that protects function: data, privacy, accessibility (a reduced-motion check is accessibility, whatever its filename), performance, security, CSS and build safety, content links, the lab boundary, and the no-em-dash rule. Judge each test by what it protects, not by its filename. Where the bible's `enforcedBy` names a deleted test, it becomes "review".

**Hand off with:**
- a table of every page, file and test removed, each with one reason;
- the test count before and after, by kind;
- the lines to change in `CLAUDE.md`, `docs/PROGRAM.md` and `package.json` (the `design:rules` script). Those are the Orchestrator's to apply.

**Prove the recipe:** after the Library is lean, spawn one fresh subagent with only the recipe and a small task (redesign an eyebrow on a scratch board, never committed). Report whether it had what it needed and what it asked for.

**Your owns, and why they are wide.** The directive strip reaches every test file that carries `@contract-for`, `@policy` or `@refuses`, so your owns cover each of them, except those of the held `reel-guest-wiring` lane (`src/components/guest/`, `src/app/(guest)/`, `src/lib/guest/`, `src/lib/reel/engine/player-live*`): leave its files exactly as they are, and that lane strips its own at its merge. Touch nothing in your owns beyond what this brief asks.

**The root files are the Orchestrator's.** `package.json` (the `design:rules` script), `.prettierignore` (the generated JSON's lines), `CLAUDE.md`, `docs/PROGRAM.md` and `docs/reviews/README.md` (its `review library:` line) cannot be lane-owned. Leave them untouched, and hand off each change as its exact old and new line. Once the generator is gone, your gate skips `pnpm design:rules`; everything else in the gate runs as usual.

**The integration order.** `package.json` keeps its `design:rules` line until the merge, so the kit's current merge script would call a script you deleted. Rewrite the kit scripts (`usher/kit/`) so that no step calls `design:rules`, and hand off the exact integration sequence the Orchestrator should run: the merge, the root lines, then the gate with your new `gate-lane.sh`.

**Also in your owns, found by the docs lane:**
- `usher/kit/cut-lane.py`: its Binds block says the policies and contracts bind and repeats CLAUDE.md's record-doc, staging and trailer rules, and `PROD_VERIFY` lists `design:rules` and the specimen collector. Make its Binds line match the template in `docs/tracks/README.md` (CLAUDE.md's working loop and the bible's ten; the tests are the real rules), and point Verify at CLAUDE.md's gate.
- `usher/kit/integrate.sh`: its default `S` is an old session's scratchpad; make it require `$S`.
- Comments that point at CLAUDE.md or PROGRAM.md text that no longer exists (CLAUDE.md was rewritten, so read the current file): `src/lib/no-em-dash-policy.test.ts`, `src/components/marketing/chrome/header-shell.tsx`, `src/lib/content/help-description-numbers.test.ts`, `src/components/marketing/mdx/spec-shared.tsx`, `src/components/marketing/mock-parity.test.ts`, `src/lib/track-manifests.test.ts`. Keep the reason in each comment and drop the pointer.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The Library at 1440 and 375: the brand kit leads the nav, the catalog is open, `/rules` shows the ten, and no rules section remains. Every entry page renders, `page-console` finds no console error on any Library route, and every retired route redirects. `pnpm test` is green, with a before-and-after count by kind. `lab:smoke` is green from the Library. A fresh subagent designs an eyebrow from the recipe alone and reports what it lacked.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Every surface at a glance (Will's framing of the Library as his review surface).** The catalog holds host (11),
  admin (2), marketing (39) and shared (49) entries, no guest entry and no whole screen or page. Recommended: a
  `Surfaces` family in its own lane, one entry per production route (host, guest, admin, marketing) drawn as a live
  frame at 1440 and 375, plus guest entries for the guest components. Not built here: it needs a route list and a
  frame or capture pipeline, which is new catalog work rather than the lean.
- **The brand kit's route.** Built: `/design/library/foundations` keeps its route and reads "The brand kit" (the
  sidebar, the specimen routes, the smoke and every link hold). Recommended as built; a `/design/library/brand-kit`
  route is one redirect away if the URL should say it too.
- **The Library's sidebar on a fresh browser.** The lab's sidebar preference defaults to collapsed on every page, so
  a first-time reader of the Library sees the recipe and the index but not the nav until they open it. Recommended:
  open the sidebar by default on Library pages and keep boards collapsed (a shell change for the lab's owner, listed
  under Board ideas); left as is here.

## System-doc edits (in place, owned facts only)

- none in this lane (no `docs/systems/` doc is in its owns). Since `design-docs-lean` merged, no system doc names the
  machinery. One line the new numbering of the ten made false, for the Orchestrator: `docs/systems/guest-flow.md` L186
  `(a demo code in a host's own album is what bible 4 refuses)` -> `(a demo code in a host's own album is what the
  bible's seventh principle refuses)` (4 is now "Premium is the floor"; 7 is "A guest surface belongs to the host's
  event").

## Deferred (ROADMAP one-liners, bucket named)

- Code hygiene: `GLASS_TOKENS` and `NOT_GLASS` in `src/lib/glass.ts` are read by nothing since the glass look tests
  went (the file is outside this lane).
- The lab and the kit: seven catalog entry pages log next/image dev warnings from their specimens (`loading="eager"`
  on an LCP image: card-grid, media-split, conveyor x2, inline-reel-player, morph-delegate, demo-ticket;
  `sizes="100vw"` on a `fill` image narrower than the viewport: photo-section x6); the same seven log them at
  `d1f59826`, before this lane. The components family page, which draws the photo-section specimen, carries its
  `sizes` warning too, and scrolls sideways at 1440 (its `w-screen` breakouts: 2049px wide at `d1f59826` as well).

## Handoff (replaces the chat report)

- **Commits**, all on `lp/library-lean`, pushed: `2bac8693` (the Library, the machinery, the look tests, the directive
  strip), `0718b063` (the kit), `8778d1b8` (the catalog's ledes, leftover comments), `a4286336` (the sync: a clean
  merge of `origin/launch-prep` at `f10eadc3`), `47d119bd` (a comment), `b656ac56` (a brand kit note), `6f388371`
  (the recipe proof's findings), `d5086dd6` (the second sync: `origin/launch-prep` at `df8d4624`, with
  `album-columns`' board row carried into the reshaped `touchpoints.ts` schema, its spec's `bible` line dropped, and
  `DESK_ORDER` as launch-prep has it; `docs/design/library.md` stays deleted), `4fb8e01b` (the board registry's header
  and two board texts describe what exists), then this manifest.
- **Gates on the tree synced to `df8d4624`**, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (0 errors;
  7 warnings, every one in a file this lane never touched); `pnpm test` 0 (427 files, 4574 tests, 0 failing);
  `pnpm build` 0 (through the build lock); `pnpm lab:smoke --base http://localhost:3131` 0 (308 checks, 0 failing: the
  four new redirects, and `album-columns`' board with its six sessions under the reshaped schema). No board of its own,
  so no `lab:demo`. Logs: the scratch folder's `sync2-tc.log`, `sync2-lint.log`, `sync2-test.log`, `sync2-build.log`,
  `sync2-smoke.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 251 paths): every path under `owns` plus this
  file, and two one-line exceptions, both because an exploration no longer carries a `bible` field and the tree must
  typecheck: `scripts/new-board.mjs` (the board template it prints: `links: { bible: [] }` became `links: {}`) and
  `src/app/(dev)/design/sandbox/album-columns/spec.ts` (`bible: [1, 2, 3, 6],` removed at the sync).
- **Verified at 1440 and 375** (headless Chrome, a fresh profile with the sidebar open; captures in the scratch folder's
  `shots-main/`): the brand kit leads the nav, the catalog's four families are open, the home opens on the recipe
  above the searchable index (101 entries), `/design/library/rules` shows the ten and a quiet glossary link, no page
  overflows at 375. Every Library route loads: the eight main pages at both widths and all 101 entry pages at 1440,
  with no console error and no exception; seven entry pages and the components family page log pre-existing
  next/image warnings (Deferred). After the second sync, `usher/kit/page-console.mjs` on the eight main pages,
  `/design/library/button` and `/design/lab/album-columns`: 0 errors, 0 exceptions, the components page's one
  pre-existing warning (`page-console-sync2.log`). Every retired route answers 307 with the key:
  `/design/library/policies`, `/guidance` and `/doctrine/:doc` to the home, `/rules/:id` to the ten (`sync2-smoke.log`).
- **The Library, three parts.** The brand kit (`foundations/page.tsx`) leads the nav and describes the live tokens,
  with the mark and the voice in its meta; the catalog is open in the sidebar, and the home is its searchable index
  under a six-step recipe (about 100 words: the brand kit, the ten, production as it is, a visual pass at 1440 and 375,
  the tests as the real rules, then a creative shot in the lab); `/rules` is the ten and nothing else.
- **The bible**: `bible-synth/bible.ts` installed byte for byte; `bible.test.ts` slimmed to its shape; every reader
  adapted (the ten's page, the nav, the search, the link grammar), so the "enforcedBy becomes review" item is moot.
- **An entry page** keeps its config panel, variants and specimens, plus one line: its file and, when a test pins its
  behavior, that test (`FileLine` in `gallery/gallery-ui.tsx`; 27 entries name one). Each catalog entry now declares
  its own `file`, `for` and `test` in its family's `gallery-demos.tsx`; its title is its file's name in PascalCase
  unless it sets `title`.
- **touchpoints.ts** keeps only the 27 standing boards (`album-columns` carried in at the sync): the 51 ruled rows,
  `RULED` and `RulingId` went, `shipped` went, `board` is required and `ruled` became `asks` (no "open: " prefix).
  Three board texts now describe what exists: `album-columns`' why (it named the retired `gallery-width` board's
  ruling), `site-chrome`'s why and `profile-page`'s note (a ruling and a quote).
- **Removed, each with one reason:**

  | removed | reason |
  | --- | --- |
  | `/design/library/policies` | the policies were tests shown as rules; the tests are the real rules (recipe step 5); redirects to the home |
  | `/design/library/guidance` | the craft and preferences folded into the recipe and the ten; redirects to the home |
  | `/design/library/doctrine/[doc]` | rendered repo docs; the recipe points at production, and the docs live in the repo; redirects to the home |
  | `/design/library/rules/[id]` | one page per principle; the ten sit on one page with an anchor each; redirects to the ten |
  | the home's "What binds you", stat row and "What changed" band | the recipe replaces them; new and updated badges stay on the index rows and in the sidebar |
  | the ten's levels, binds strip, policies, rulings and health strip | the ten are the page; nothing else there reads as law |
  | the entry page's contracts, landmines and exports | one line names the test instead; the source shows the exports |
  | `rules/rules.generated.json`, `rules/rules.ts` | the collector's artifact and its reader: the machinery |
  | `scripts/build-design-rules.mjs`, `scripts/design-rules/collect.mjs`, `library-md.mjs` | `design:rules` and what it fed |
  | `docs/design/README.md`, `guidance.md`, `library.md` | folded into the recipe, or generated by the retired machinery |
  | `rules/component-notes.ts` | each entry carries its own `for` line; the 100 "nothing to look at" reasons went with it |
  | `rules/influences.ts`, `_data/policies.ts`, `gallery/landmines.ts`, `library/rules/binds-strip.tsx`, `level-badge.tsx` | the levels, the policy views, the landmines and their badges |
  | `links: { bible }` on boards (26 specs, the fixtures, the kit) | read by nothing, and its numbers named the old 22 |
  | the 51 ruled rows in `touchpoints.ts` | a pick is built into production, never kept as a rule |
  | `usher/kit/closer.py`, `fixtures/union/`, the cost reading that replayed them | they repaired unions of `component-notes.ts` only |
  | tests: `rules-registry.test.ts` (14), `component-index.test.ts` (4), `influences.test.ts` (15) | freshness, coverage and the levels: the machinery's own checks |
  | tests: `button.test.tsx` (27) | look only: heights and icon sizes |
  | tests: `elevation-policy.test.ts` (6), `two-faces-policy.test.ts` (3), `glow-placement.test.ts` (5) | look only: which shadow, which face, where a lamp may sit |
  | look parts of 20 files (101 tests): `type-ladder-policy` (-11), `glow-contract` (-18), `page-hero-contract` (-9), `section-light` (-8), `avatar` (-8), `border-beam-vendor` (-7), `floating-layer` (-7), `publish-light` (-6), `glass` (-5), `lit-edge-contract` (-4), `screen-lamp` (-4), `event-door-contract` (-3), `pricing-page` (-3), `globals-theme-contract` (-2), and one each in `marketing-css-policy`, `footer-contract`, `event-type-card-contract`, `failure-grammar`, `media-lightbox`, `sampled-palette`; single look assertions in `bulk-bar`, `route-skeleton`, `masonry` | each pinned a size, a colour, a radius, a shadow, a clock, a placement, a material or a composition; the Library and production show those |

- **Kept inside those files, because each protects function** (the brief's "judge by what it protects"):
  `type-ladder-policy`: `cn()` knows every type step and radius token, and no step shares a colour's name
  (tailwind-merge drops an undeclared step silently); `floating-layer`: the cross-slide's motion rides `motion-safe`,
  the responsive sheet stays scoped to its side; `glow-contract`: offscreen pause, reduced motion, forced colours and
  print, the no-mask fallback that keeps an unmasked field off content, keyframe namespace and collisions, no dead
  knob, a server-component host; `lit-edge-contract`: the edge never takes a tap, never overrides a layout's
  positioning, drops under forced colours and print; `border-beam-vendor`: the MIT notice; `avatar`: a seed paints,
  deterministically; `glass`: the utilities compile in the entry sheet; `section-light`, `publish-light`,
  `screen-lamp`, `page-hero`, `event-door`, `event-type-card`, `pricing-page`: content above the light, the fence
  hook off the copy, reduced motion, the h1 and LCP, the demo gate, focus, the measured scrim, the FAQ's one list.
- **Directives**: `@contract-for`, `@policy` and `@refuses` left the headers of all 126 owned test files that carried
  them (four of those files were then deleted as look tests), with the explanatory comments above three; the 22
  files in the held guest lane keep theirs for that lane's merge.
- **Test count, by kind**: before (`d1f59826`) 434 files, 4782 tests; after (the tree synced to `df8d4624`) 427
  files, 4574 tests. Of the -208: look -142 (-41 in four deleted files, -101 trimmed across 20 files); machinery and
  the Library-facing lab tests -58 net (-33 in three deleted files, `docs` -13, `links` -7, `legacy-routes` -2 (+4
  redirects, -6 traced globs), `gallery` -2 (-3 coverage, +1 holding lab:review's reader to the catalog), `bible` -2,
  `touchpoints` -1, `catalog` +1, `sandbox/registry` +1); launch-prep's own data -8 (`ledger` -7 for the seven deleted
  ledgers, the manifests that came and went -3 across `track-manifests` and `docs`, `album-columns`' board +2 across
  `sandbox/registry` and `legacy-routes`). Every other test is unchanged.
- **The kit**: no step calls `design:rules`; every merge and gate script requires `$S` (`negative.sh` proves each
  refuses without it); `gate-lane.sh` builds through `scripts/build-lock.sh`; `cut-lane.py` writes "Starts from",
  points Verify at CLAUDE.md's gate and adds Board ideas; the runbook carries every line the Orchestrator's messages
  asked for (a board opens on anyone's improvement, "an answer that reaches", the retired board's ledger, briefs as
  synthesized intent, eight lanes with paced builds, Board ideas read at the record).
- **The root lines, the Orchestrator's to apply** (CLAUDE.md and docs/PROGRAM.md need none: neither names the
  machinery any more):
  - `package.json`: delete `    "design:rules": "node scripts/build-design-rules.mjs",`
  - `.prettierignore`: delete the three lines (and the blank line before them)
    `# Generated by \`pnpm design:rules\` (scripts/design-rules/collect.mjs) and compared by value`,
    `# in rules-registry.test.ts; a reformat only makes the next regeneration a noisy diff.`,
    `src/app/(dev)/design/rules/rules.generated.json`; and change
    `# seven in-body sites, all tagged PARTYREEL: and pinned by border-beam-vendor.test.ts).` to
    `# seven in-body sites, all tagged PARTYREEL:).`
  - `docs/reviews/README.md` L86-89: `rules on a LIBRARY entry` -> `gives a verdict on a catalog entry`;
    `so there is one ruling per entry` -> `so there is one verdict per entry`;
    `An \`<entry-id>\` is a component id from \`rules.generated.json\`, which is the last segment` ->
    `An \`<entry-id>\` is a catalog entry's id, the last segment`.
  - `docs/ROADMAP.md`: delete L44 (promote plain pins to contract lines), L80 (widen `elevation-policy.test.ts`'s
    scan: the test is gone), L104 (index the kit in the collector), L106 (the collector's id collision), L107
    (`// @policy:` on the remaining tests) and L150 (`glow-placement.test.ts`'s halo exemption: the test is gone);
    L105 becomes
    `- \`pnpm design:specimens\`, so \`specimens.generated.json\` regenerates by name (today \`node "src/app/(dev)/design/gallery/collect-specimens.mjs"\`).`
- **The integration sequence** (the kit on launch-prep still calls `design:rules`, so this merge runs the lane's own
  merge script):
  1. `export S=<scratch>; git fetch origin; git show origin/lp/library-lean:usher/kit/merge-lane.sh > $S/merge-lane-ll.sh`
  2. `S=$S zsh $S/merge-lane-ll.sh library-lean <head sha8> $S/msg-library-lean.txt > $S/merge-library-lean.log 2>&1`
     (the `--no-ff` merge, the registry files resolved, the manifest deleted, the specimen code regenerated,
     typecheck and the two registry tests, the commit; it ends `MERGED <sha>`).
  3. One record commit with the root lines above.
  4. `S=$S zsh usher/kit/gate-lane.sh <N> none > $S/gate<N>.log 2>&1` (the lane's gate, now on the tree), read by its
     `EXIT[...]` lines; `zsh usher/kit/negative.sh` once, since the kit changed.
  5. The message to `reel-guest-wiring`: strip `@contract-for`, `@policy` and `@refuses` from the 22 test headers in
     its owns (the explanatory comment above a directive with them); any look-only test there is its call.
- **The recipe, proved**: a fresh Sonnet subagent given only the recipe and the eyebrow task drew today's eyebrow
  beside three options (a tick rule before the word, a quieter sentence-case semibold, a hairline chip) on the real
  "The album" copy, in true-width frames at 1440 and 375, in about 27 minutes; its board was never committed and is
  deleted (its picture: the scratch folder's `recipe-proof/screenshots/board-all4.png`). It used the ten (principles
  2, 6 and 8 shaped every option), production (the real `Eyebrow` and its call site) and the tests (the em-dash test
  caught two of its labels and named the fix). What it lacked: how to make a quick exploration (it read the whole
  standing-board registration before finding that a bare `sandbox/<name>/page.tsx` needs none of it, about 12
  minutes); that the kit's `Frame` draws true widths (found by grepping); a portalled frame's theme trap; and readable
  Library pages through curl (it read `bible.ts` and the token source from the repo instead). Folded in at `6f388371`:
  the recipe's last step opens the kit ("the kit shows how"), the kit page says a quick exploration is a bare page
  drawn with `Frame` and `FrameRow`, and `Frame`'s `children` note names the trap. The curl gap is a board idea.
- Assets requested from Will: none.
- Board ideas: a `Surfaces` family of live frames per route, host, guest, admin and marketing, with guest entries
  (Questions); the Library opening its sidebar by default while boards stay collapsed; `anonymous-info.tsx` and
  `floating-add-button.tsx` are drawn only by the catalog (unused in the product), so they are a retire-or-reuse call;
  a plain-text view of every Library page for an agent that reads with curl (the recipe proof read the source
  instead; the shell's Copy page already builds the markdown in the browser).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - the function checks kept inside files the brief lists as look (the list above);
  - look tests deleted beyond the brief's named list, each judged by what it protects (the table above);
  - the brand kit keeps the `/design/library/foundations` route;
  - the glossary sits at the foot of the ten, not in the sidebar;
  - `touchpoints.ts` keeps its `RULINGS`, `Ruling` and `getRuling` names (a rename would reach `new-board.mjs` and every
    lab page) while its field became `asks`;
  - a card's `library` link renders whenever it is set, and `sandbox/registry.test.ts` holds it to a real entry
    (there is no artifact to check at runtime);
  - a component's source path in a manifest's markdown now links to GitHub rather than to its entry page (the link
    grammar lost the artifact's file map, and the catalog cannot ride into a client bundle).
- For the comment sweep after this merge: comments that name a deleted test or its pins, in files this lane did not
  touch (`git grep -n -E "elevation-policy|glow-placement|two-faces-policy|type-ladder-policy|rules-registry|component-index.test"`),
  about twenty lines, among them `globals.css`, `theme.css`, `floating-layer.ts`, `navigation-menu.tsx`,
  `reel-studio.tsx` and `elevation-legend.tsx`; `utils.ts`'s two pointers to `type-ladder-policy.test.ts` stay true
  (the file now holds exactly the `cn()` parity they name). And comments that cite a principle by number
  (`git grep -n -E "bible [0-9]+" -- src`: 119 lines once `links.ts`' grammar and its two tests are set aside, 35 of
  them in board files) were written against the old 22; the ten renumbered them, so each reads against `/design/library/rules`.
- Look at first: the Library's home at 1440 (`shots-main/design_library-1440.png`), then an entry page
  (`/design/library/button`) and the ten (`/design/library/rules`).
