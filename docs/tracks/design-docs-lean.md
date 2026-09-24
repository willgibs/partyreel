---
track: design-docs-lean
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7966dcba"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/design-system.md
  - docs/systems/marketing-content.md
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/design-docs-lean

**Goal.** The design system, marketing content and host app docs keep only how the systems work, their invariants and gotchas, and the product's principles as guidance, organized for retrieval.

## The brief

**The job.** Three system docs, `design-system.md` (about 16,000 words), `marketing-content.md` (about 8,800) and `host-app.md` (about 8,500), keep only what a strong model cannot find or infer. That rule's home is CLAUDE.md "Keeping the docs healthy": docs are for security practice, data handling, user safety, how the systems work and their gotchas. Design and past decisions are guidance with their reason, never a law; nothing is treated as perfect, and a change is one edit in its one home.

**What stays:**
- how each system works, where the code alone would not tell a reader;
- the invariants and ★ landmines (a CSS trap, a rendering constraint, a content pipeline's rule);
- security and data facts;
- Will's product principles, as current guidance without dates.

**What goes:**
- tables and walkthroughs that restate what the code or the Library shows (the type ladder, radii, elevation, token values, page-arc walkthroughs);
- design written as law ("binds", "ruled", "must", "never re-judged");
- quotes, dates and provenance;
- platform knowledge that current docs give;
- a fact whose home is another doc (point there once).

**The Library is changing under you.** The `library-lean` lane is turning the Library into three parts, the brand kit, the catalog and the bible's ten, and it retires the rules machinery (`design:rules`, `rules.generated.json`, `docs/design/library.md`, the contracts, policies, landmines and levels). Cut every line that describes that machinery. Where a doc needs the Library, one line says it shows the brand kit, the catalog and the ten at `/design/library`.

**Organize for retrieval.** Each doc opens with the questions it answers, and its sections follow the task that would send someone there.

**Pointers.** Code comments and other docs cite these files, sometimes by section (`git grep -n "<name>.md"`). Keep a section's name where something cites it, or list each pointer to change in your Handoff.

**Hand off with:** words before and after for each doc; the kinds of line cut, one example each; the invariants and ★ lines kept, counted; the pointers to change outside the lane.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` green (the docs tests read these files); every link in a changed doc resolves; the Handoff's before-and-after table.

## Questions (a recommended answer each; the Orchestrator relays them)

- none

## System-doc edits (in place, owned facts only)

- The lane's own three docs (the table below); no system doc outside the lane was touched.

## Deferred (ROADMAP one-liners, bucket named)

- none (the two bugs the docs used to describe, the hidden-media dim and the disabled Sort, already hold ROADMAP lines;
  their pointer fixes are below)

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/design-docs-lean`:** the work `28671600` (the three docs) and `b615229a` (host-app keeps the
  live reel's decided shape and the no-branding line's scope). No sync: `origin/launch-prep` moved only by record
  commits, the systems-lean merge (`0aa6e2a8`, none of this lane's files) and the build-lock and Sentry build changes,
  none touching these docs (PROGRAM.md "Sync"; the coordinator's word). Every pointer these docs make into the merged
  systems-lean docs was re-read on `origin/launch-prep` and resolves (architecture.md "Host-page hydration",
  uploads-and-r2.md's two ★ lines, database-security.md's reel predicates, auth-accounts.md's name gate,
  profiles-social.md's owner mode, lifecycle-recovery.md's 30-day window).
- **Gates on `b615229a`, each on its own exit code:** `pnpm typecheck` 0, `pnpm lint` 0 (8 warnings, none in a changed
  file: only markdown changed), `pnpm test` 0 (434 files, 4,778 passed, 1 skipped), `zsh build-lock.sh pnpm build` 0
  (through the coordinator's scratch lock; the repo's own `scripts/build-lock.sh` landed after this base), and
  `pnpm lab:smoke --base http://localhost:3134` 0 (490 checks, 0 failing; the doctrine pages that render two of these
  docs and the policies page that lists their landmines all answer 200). Logs: the scratch
  `design-docs-lean/{typecheck2,lint2,test2,build2,lab-smoke}.log`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the three owned docs, plus this file at the
  handoff commit. No exception.
- **Links:** every relative link in the three docs resolves (25 checked by the scratch `check-links.py`).

**Words and landmines, before and after** (`wc -w`; ★ counts landmines, the prose mentions of the glyph excluded):

| doc | words before | after | kept | ★ before → after |
| --- | --- | --- | --- | --- |
| design-system.md | 16,312 | 6,698 | 41% | 54 → 60 |
| marketing-content.md | 8,825 | 4,545 | 52% | 25 → 30 |
| host-app.md | 8,543 | 5,057 | 59% | 38 → 40 |
| **total** | **33,680** | **16,300** | **48%** | **117 → 130** |

(`28671600`'s message estimated design-system.md at 6,751 and host-app.md at 4,949; the table is the measured figure at
`b615229a`.)

**The 117 landmines, accounted for.** 113 keep their star in place (51 of design-system's 54, 24 of marketing's 25,
all 38 of host-app's). 3 were cut with the machinery they described (the type-ladder body scan's allow-list, the scans
that cannot see a `cva` table, the demo module that indexes a component at a missing route). 1 was demoted to a plain
line: marketing's "Never promise 'no account'", whose principle is the bible's; the line keeps where the claim lines
live and the expensive case, which stays starred. 17 lines the old docs already described as silent, a gotcha or a
security invariant gained the star: design-system 9 (the full-bleed clip on the wrapper, the step `cn()` must know, a
tracking or leading utility beside a step, the reveal chip's `!important`s, `useFlip`'s prune, the exit and the FLIP on
separate elements, the toast colours' `!important`, `RouteError` never rendering `error.message`, the overlay that eats
a swipe), marketing 6 (the gather's hidden starting arrangement, the cover morph's two traps, the event page's
`noindex`, the SWC whitespace, the group 404 boundaries, the demo token's `parsePublic`), host 2 (the wizard's
at-cap snapshot, `markWelcomed` before navigating). 113 + 17 = 130. The rules kept beside the stars are bold-led lines,
each with its reason (179 across the three docs).

**Each doc opens with "Open this before you:"** (the tasks that send a reader there), and its sections follow those
tasks: design-system by what you touch (colour and grounds, chapters, light, type, corners, shadows, glass, the album
tile, motion and the floating layer, toasts, the arrival, errors, the craft skills, the lab, the gotchas);
marketing-content by surface (the chrome, the shared claims, the pages, the content pipeline, public forms, SEO and
the AI layer, the 404 pages, the demo); host-app by the host's path (the dashboard, creating an event, QR and print, the
custom link, the welcome, the event page, moderation, the reel).

**The kinds of line cut, one example each:**
- Tables that restate the code, production or the Library: the type ladder's two what-wears-what tables ("| Hero |
  `text-hero` | the home's hand-built hero …"), the rounding and elevation tables, the shipped-light table.
- Token values: "Light = the Pearl page (bg `oklch(0.995 0.002 286)`, card the SAME white, fg `0.145 0.006 286` …)".
- Page-arc walkthroughs: "The home arc (…): chapter 1 runs from the hero through the trust strip, the decomposition,
  the film strip …", and careers' heading story ("join our team → the best content gets lost in camera rolls → …").
- Design written as law: "Never add a font loader or a `font-mono` class back without a ruling", "THE PRODUCT SHAPE
  governs every reel decision", every "(bible N)" citation; each keeps its reason and drops the authority.
- The Library machinery: "The component index and the gallery" (`gallery-demos.tsx` declarations joined with
  `rules.generated.json` and `component-notes.ts`), the craft stack's "levels, the law, the policies", and every
  "pinned by `<look test>`" claim for a test library-lean deletes. Where the doc needs the Library, one line says it
  shows the brand kit, the catalog and the ten.
- Quotes, dates and provenance: "(Will, 2026-09-22, "Own deletes close it")", "(guest by upload, Will 2026-09-22 …)",
  "`git show 44090827:docs/perf/v1-baseline.md`".
- Platform knowledge current docs give: "Before believing 'Tailwind emitted no rule', check your grep. Tailwind
  escapes `[`, `]` and `.` …", the `text-[length:…]` hint, a rotated tile's bounding box.
- A fact with a home elsewhere, pointed at once: the CORS cache poisoning half of the sampler landmine
  (uploads-and-r2.md), the stale dev CSS chunk (testing-verification.md), "Events have no end date" (CLAUDE.md), the
  no-account principle (the bible's ten).
- Stale facts: "One line still breaks the rule: the /blog index's closing CtaBand ships 'No app or account for your
  guests.'" (it reads "No app required." now); host-app's "Hidden media renders at 30% opacity" (it does not today: the
  ROADMAP holds the bug).
- One-offs: "A lab specimen can be geometrically inverted from the surface it names …", "(A title with NO descender,
  like 'Press', reads looser …)".
- Moved to its one home: the blog's index masthead and the root 404's image trail into marketing-content.md, the
  responsive `Sheet` into design-system.md's floating layer, the QR presets' corner tints into host-app.md, the
  multi-select seam into host-app.md's bulk select.

**Structure kept for the lab's anchor test.** `src/app/(dev)/design/_data/docs.test.ts` on this base pins ten heading
anchors that `touchpoints.ts` writes, "## The craft guidance stack" (over 200 characters), "### The shipped light",
one "## Gotchas / don't-revert" opening on the bare `<code>` ★, the "The vaul motion gotcha" label and more than ten
landmines; every one is kept, each holding real content. library-lean (`2bac8693` on its branch) deletes those
assertions and the rulings; after it merges, only code comments cite these headings ("Chapters", "Light", "the
shipped light", "the motion tuner", "Calm + 700ms", "the two-beat set change", "restraint is their identity"), and those
names should stay.

**Pointers outside the lane:**
- `src/app/theme.css:189` says "The steps' one home for WHAT WEARS WHAT is docs/systems/design-system.md; the Library
  draws them at true size at /design/library/foundations#type.": the tables are cut. Proposed: "The brand kit draws the
  steps at true size; a grep of `text-<step>` finds what wears each."
- `docs/SYSTEMS.md:23` (design-system's row) ends on a link to `design/README.md` ("how design guidance is
  levelled"), the file library-lean deletes with the levels. Proposed row: "change the look: colour and the theme
  sets, light, type, corners, shadows and glass, motion, a floating panel or a toast, the album tile, a marketing page's
  chapters, the error taxonomy, the `/design` lab". `docs/SYSTEMS.md:22` (marketing's row) may add "a public form".
- "host-app.md ruling 2" in `src/app/api/guests/route.ts:92`, `src/app/api/r2/complete-upload/route.ts:22`,
  `src/app/api/r2/presign-upload/route.ts:39` and `src/lib/events/upload-lock.ts:2`: no numbered rulings existed before
  this lane either; the fact is uploads-and-r2.md's "A locked event gates UPLOADS, not just viewing".
- "host-app.md ruling 4" in `src/components/reel/reel-builder.tsx:6` and `src/components/reel/reel-marquee.tsx:4`: now
  host-app.md "Reel curation, the live composer, and the .mp4 export" (the reel room and the two-beat Create).
- `src/lib/constants/legal-terms.tsx:246` cites host-app.md for "one Pro at a time": that is billing-caps.md's "One plan
  at a time for Pro".
- `src/components/marketing/reading/article-toc.tsx:32` cites "the drawer-swipe lesson in design-system.md", which no
  version of the doc held: keep the reason (an inherited custom property recalculates every descendant), drop the
  pointer.
- `docs/ROADMAP.md:170` ends "(`host-app.md` describes a 30 percent dim; no test covers it)": the doc no longer does;
  the intent is `dimItem`'s comment at `src/components/app/host-media-grid.tsx:450`.
- `docs/ROADMAP.md:176` says Sort ships disabled "because the hub gallery's client holds one page, not the whole approved
  list": the hub now reads its album whole (host-app.md), so the reason is that the album is a server-rendered slot and
  a client sort could only reorder what is mounted.
- Resolve with no change: `globals.css:226` (the two sibling lamp registers), `:445` ("a hand-assembled dark set is for
  a LEAF"), `:985` (glass) and `:1670` (the base-and-band star); `theme.css:311` (`copy` inside a `card-title` block);
  `u/[slug]/page.tsx:351` (an Inter label inside a heading); the six "Chapters" citations and `about/page.tsx:56`
  (joining the group); `screen-lamp.tsx:12` ("Light"); `film-strip.tsx:29` ("the shipped light");
  `demo-ticket.tsx:131` (the two shadows); `album-fill-grid.tsx:28` (the two-beat set change); `reveal-constants.ts:13`
  (the motion tuner's three places); `privacy-hero/hero.tsx:36` ("restraint is their identity"); guest-flow.md's
  "Calm + 700ms"; `engine/constants.ts:2` (the reel's product shape); `tile-size-control.test.tsx:24` (the View menu's
  cookie); "the promise-neutralization doctrine" (ROADMAP, `content/blog/AUTHORING.md:114`); "the utility-page rhythm"
  (the privacy and terms pages, `legal-document.tsx`); the content pipeline's "see marketing-content.md"
  (`help/[slug]/page.tsx`, `collection.ts`, `blog.ts`, `help.ts`). The pointers in `docs/design/*`, the guidance page,
  `type-ladder-policy.test.ts`, `border-beam-vendor.test.ts` and `glow-contract.test.ts` leave or change with
  library-lean.

- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.

**Calls his to overrule:**
- The no-account star demoted to a plain line (the principle is the bible's), and the 17 lines that gained a star.
- The live reel's decided shape stays in host-app.md's reel section as guidance for the reel round's host lanes (it has
  no other written home yet: the ROADMAP does not hold it and the guest side rides the held `reel-guest-wiring`).
- "Chapters", a marketing pacing principle, stays in design-system.md, because six code comments cite it there.
- The zero-team rule is now written as sitewide guidance in marketing-content.md ("the site shows no team"), where it
  was only stated as relaxed on /about.
- `src/components/ui/*`'s semicolon-free generator style keeps one line in design-system.md, its only home since the
  new CLAUDE.md dropped it.

**Look at first:** design-system.md's Light and Type sections (the deepest cut, 16,312 to 6,698 words), then the
pointer list's `theme.css:189` and the four "ruling 2" comments.
