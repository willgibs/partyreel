---
track: ladders-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "00e82dba"         # the launch-prep SHA the branch was cut from
board: type-phone, rounding # both retired by this lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/theme.css
  - src/app/globals.css
  - src/lib/utils.ts
  - src/lib/type-ladder-policy.test.ts
  - src/lib/elevation-policy.test.ts
  - src/components/dev/motion-tuner-config.ts
  - src/components/ui/
  - src/components/app/
  - src/components/admin/
  - src/components/guest/
  - src/components/shared/
  - src/components/social/
  - src/components/reel/
  - src/components/marketing/sections/
  - src/components/marketing/system/
  - src/components/marketing/frames/
  - src/components/marketing/legal/
  - src/components/marketing/help/
  - src/components/marketing/blog/
  - src/components/marketing/press/
  - src/components/marketing/chrome/
  - src/components/marketing/built-for.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/marketing/marketing-route-error.tsx
  - src/app/(marketing)/(cinema)/
  - src/app/(marketing)/(paper)/
  - src/app/(guest)/
  - src/app/(app)/
  - src/app/(auth)/
  - src/app/admin/
  - src/app/(dev)/design/sandbox/type-phone/
  - src/app/(dev)/design/sandbox/rounding/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/(shell)/library/foundations/
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/catalog.test.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/rules/influences.test.ts
  - scripts/lab-smoke.mjs
  - docs/specs/rounding.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/type-phone.json
  - docs/reviews/rounding.json
  - docs/design/rulings.md
  - src/app/(dev)/design/rules/bible.ts
  - src/components/marketing/mdx/spec-shared.tsx
---

# lp/ladders-wiring

**Goal.** A wiring round, not an exploration. Will answered both boards on 2026-09-18, and this lane
ships both of the design system's ladders and retires both boards: the TYPE ladder (`type-phone`) in
phase 1, the CORNER ladder (`rounding`) in phase 2, each its own gated, pushed commit. What comes back:
a ladder whose headings keep their order at a phone, every heading-face element on a step, the display
trim that tracks its leading, family C's corners in quarters with the gallery gap pinned to them, and
two boards gone. **Not in this round:** body and label text sizes (about 920 stock and pixel sizes; the
heading ladder stops at 16 and a body scale is a separate design question, on the ROADMAP), any new
exploration, any change to the shadow tokens `light-wiring` landed, and anything glass.

**Binds.** The bible, the contracts of every component under a path you own (`src/components/ui/*` is
semicolon-free by its generator: match it), the policies. Read `docs/reviews/type-phone.json`,
`docs/reviews/rounding.json` and the newest `docs/design/rulings.md` section (2026-09-18) before you
write anything: his notes carry constraints the option ids do not.

## What he ruled

**type-phone r1.** `subhead=?` and `dead-link=?` came back open with ONE direction: fix the ladder, not
the page. "I wish there was an obvious third pick, which is to fix the mobile type scale ladder so the
upper heading is larger... We should have a very clear heading hierarchy on mobile as well." And, binding
every type decision in this lane: "we really shouldn't have any one-off adding instances. Everything
should be addressed in our design system type ladder. That either means adding new styles to the ladder
or using styles from the ladder on existing one-offs. Unless it's a helpful global addition, I prefer not
to add one-offs to the library to keep consistent standards." `display-trim=clamped`.

**rounding r7.** `family=c`, `actions=today`, `ladder=quarters` ("This keeps the final pixel
calculations much cleaner."), `dead-rungs=drop`, `gap=pinned`. Every step answered.

## Phase 1: the type ladder (one commit, gated and pushed before phase 2 starts)

**What is settled, so build rather than ask.**
- **The law becomes the ORDER, not the travel.** Ladder B moved every marketing step exactly four rungs
  between 375 and 1440, so a step's phone end was whatever that left, and at 375 the paper h2 (`prose`,
  18) fell under its own sub-head (the stock `text-xl sm:text-2xl`, 20). The 1440 ends Will ruled do
  not move; the phone end is the rung that keeps each heading above the one it heads.
- **`prose`: phone end 18 → 24** (two rungs up), 1440 stays 34. Its line height moves with it (a 24px
  step at a phone reads at the ratio `section` uses there, about 1.26). The paper h2 and the marketing
  404 (already on `prose`: his "H2-3 size" with no special case) now read as h2s at a phone, level with
  the cinema h2 (`section`, 24). Two h2 roles at one size is correct.
- **`subhead`, a tenth step: 20 at 375 → 24 at 1440**, with its own line height and tracking, tighter as
  it climbs like the rest. It is the helpful global addition he allowed: seven headings already wear
  exactly this pair as stock classes (`about/page.tsx:210`, `help/page.tsx:305`, `careers/[slug]/page.tsx:231`,
  `legal-document.tsx:167`, `blog-list.tsx:264`, `role-listings.tsx:120`, `home/no-app.tsx:82`), so it
  names a size the site already uses and none of them moves at 375 or 1440. Declare it in BOTH
  `theme.css` and `TYPE_STEPS` in `src/lib/utils.ts`, or `cn()` drops it silently (the policy's test 2).
- **Compute each clamp the way the existing tokens are built**: a straight line through (375, phone) and
  (1440, desktop), floor and ceiling at the two ends, in rem and vw. The generator that printed ladder B
  (`themeBlock(B)`) is gone from the tree; do not type a number you did not derive.
- **Roles, not sizes, decide a step.** All 126 off-ladder heading-face elements move onto the step their
  ROLE calls for, never a new off-ladder size and never an arbitrary `text-[Npx]`:
  - 46 headings (h1 to h3) on stock or arbitrary sizes, 41 of them on marketing;
  - the 25 `CardTitle`s with a stock override (mostly admin `text-base`): drop the override so the card
    step applies (the override also made `cn()` drop `text-card-title`, so their leading and tracking
    were wrong too). `card.tsx`'s `group-data-[size=sm]/card:text-sm` is judged by role: a small card's
    title either takes the card step or is recorded as the label case with its reason;
  - 47 heading-face numerals, names and labels on p, span, div or Link. `section`'s role already
    includes "a stat numeral";
  - the eight `text-lg sm:text-xl` feature h3s are exactly `subsection` (18 to 20): no visible change;
  - the blog index's deliberately quiet h1 (`blog-list.tsx:200`, `text-lg sm:text-xl`) takes `subsection`,
    its exact sizes, and the design-system.md note that calls it an exception is rewritten;
  - the MDX article h2 and h3 on /help and /blog are sized by `@tailwindcss/typography` (24 and 20 at
    every width). Put them on `prose` and `subhead` through the prose wrappers' `prose-h2:` / `prose-h3:`
    modifiers in `help/[slug]/page.tsx` and `blog/[slug]/page.tsx`. `components/marketing/mdx/` is the
    Orchestrator's: do not edit it;
  - the home FAQ's bare `<h3>` (`faq-accordion.tsx:41`, inherits 16px Inter) takes a step by role.
  The full inventory with file:line is in the Orchestrator's research; regenerate it yourself with a
  comment-aware scan of every h1-h6, `*Title`/`*Heading` component and `font-heading` element before you
  start, and count what each resolution took.
- **Exactly two exceptions, each named in the policy with its reason:** text drawn inside a depicted
  device or screen (the marketing frames that picture the app at reduced scale are pictures of headings,
  not headings), and the eight Inter labels inside heading tags that `design-system.md` already allows.
  `global-error.tsx`'s inline style stays (it renders outside the stylesheet) and is named too. If a
  third kind appears, stop and write it under Questions.
- **The trim: `display-trim=clamped`, done as the option's words said.** `page-hero.tsx:100`'s
  `-mt-[0.12em]` becomes `mt-[calc((1em-1lh)/2-0.19em)]`: -0.12em at 1440 as today, about -0.18em
  (-11.5px) at 375. ★ The board's tile drew `(1lh - 1em)/2 - 0.05em`, which has its sign backwards (it
  trimmed LESS at a phone, -3.8px against -7.7px, so the caps sat further from the line: the opposite of
  "sits on its line at both ends"). Repin `page-hero-contract.test.ts:54` to the new form and fix the
  comments at `page-hero.tsx:22-53` that explain the flat value.
- **Widen `type-ladder-policy.test.ts`; add no new test file.** It refuses a stock size
  (`text-xs` … `text-9xl`) or an arbitrary `text-[…]` size on an h1-h3 or a `font-heading` element in
  production code, with the named exceptions above allow-listed by file and reason. `elevation-policy.test.ts`'s
  refusal of stock shadows is the precedent. The ladder's NUMBERS stay unpinned ("Will retunes a step
  without asking a test"); you may add an ORDER check (the paper stack `title > prose > subhead` holds at
  375 and 1440, read off the tokens), because order is the function that broke.
- **The Library.** `(shell)/library/foundations/type-ladder.tsx` reads its numbers from the live tokens;
  `subhead` needs an entry in its hand-written `STEPS` list (role and a real sample line), and its
  "Marketing descends to 18 and the app starts again at 24" note (line 225) changes.

**Traps, measured before this lane was cut.**
1. `text-*` resolves as a COLOUR before a font size in Tailwind v4, so a step may never share a name
   with a `--color-*` token (checked: `subhead` is free).
2. The stock pair jumps at 640px while a clamp does not: the sub-head also out-shouted the h2 from 640
   to 775. A single fluid step fixes both bands; do not keep a `sm:` ramp on any heading.
3. `tracking-tight` resolves to 0em here and cancels a step's own tracking through `--tw-tracking`: drop
   it where a heading moves onto a step (`help/[slug]/page.tsx:303,359` and `legal-document.tsx:189` have it).
4. Numbers in comments go stale with the phone end: `theme.css:136-143` (the travel law),
   `design-system.md:500-503` and `:186`, `page-hero.tsx:33-36, 118, 120`, `page-heading.tsx:7`, and the
   "(18/20)" notes in `empty-state.tsx:46`, `event-card.tsx:88`, `admin/layout.tsx:44-46`.

**Retire `type-phone`** (no spec doc exists): the directory, `registry.ts`, `boards.ts`, and under the
retirement exception its lines in `touchpoints.ts` and `touchpoints.test.ts` (checklist below).

## Phase 2: the corner ladder (one commit)

**What is settled, so build rather than ask.**
- **`family=c`**, in `globals.css:247-255` (the `:root` values; `theme.css` only maps them, whatever the
  board's `lands` said): `--radius` 2 → 8px (0.5rem), `--radius-float` 8 → 12px (0.75rem), `--radius-tile`
  3 → 4px, `--gap-gallery: max(3px, var(--radius-tile))` (4px under C; the board's own `gapFor`). Rewrite
  the header prose at `globals.css:36-43`.
- **The menu is 12px, not 8, and the rows stay derived** (`floatingRow` = float minus 4, so 8px). C's
  option text says "a 12px menu"; floating's `roundness=nested` was explicitly provisional ("let's go with
  your pick for now. We can always adjust later") and he saw no difference at true size. Nesting survives.
- **`Card` wears the surface token itself**: `card.tsx:15` `rounded-xl` → `rounded-lg` (8px), which makes
  C's "an 8px card" true and follows bible 8 ("surfaces take --radius"). Every other surface keeps its step
  and scales with the base.
- **`ladder=quarters`**: `theme.css:87-91` multipliers 0.5 / 0.75 / 1 / 1.25 / 1.5 for sm / md / lg / xl
  / 2xl (4 / 6 / 8 / 10 / 12px under C), and the comment at 84-86.
- **`dead-rungs=drop`**: ★ deleting the `3xl` and `4xl` lines does NOT delete the steps: Tailwind's own
  default theme defines `--radius-3xl: 1.5rem` and `--radius-4xl: 2rem`, which would come back as 24 and
  32px. Set both to `initial` inside the `@theme` block and confirm with a build that `rounded-3xl` and
  `rounded-4xl` emit nothing. Then `badge.tsx:8` `rounded-4xl` → `rounded-full` (the pill it was faking),
  `zip-modal-demo.tsx:118` `rounded-3xl` → `rounded-2xl`, `attribution-stage.tsx:92` → `rounded-full`.
- **`actions=today`, as the board's own `lands` said**: buttons keep 0.4 of their height (16px on a 40px
  button), plus (a) a `cta` size on `Button` (`button.tsx:33-43`): h-11 at 1.1× the action radius, which
  replaces the 45 sites in 25 files that force `size="lg"` up to h-11, and retires `--radius-action-lg`
  (`globals.css:251`, `theme.css:95`, the tuner knob, `reel-builder.tsx:357`); and (b) the guest entry
  sheet onto the floating corner: `entry-shell.tsx:99` `rounded-t-[calc(var(--radius-action)*1.4)]` →
  `rounded-t-float` (22.4 → 12px; capture it, every guest sees it). Also h-11 on the 40px corner:
  `guest-reel-overlay.tsx:408,417` and `marketing-footer.tsx:192`.
- **`gap=pinned`**: the guest grid's literals become the token: `guest-masonry.tsx:83` (gap) and `:96,158`
  (`mb-[3px]`: the masonry lays out in COLUMNS, so the vertical gap is a margin), `gallery-skeleton.tsx:12`
  and `:16`, `ghost-grid.tsx:9`, and the two album-like grids `calculator.tsx:172,184` and
  `empty-section-teaser.tsx:34,43`. Stale prose: `press-sheet.tsx:26,160-166`, `guest-masonry.tsx:6`.
- **Bible 8 is "tokens, never literals"**: the 27 literal photograph corners in 20 files become
  `rounded-tile` (review-switch ×5, album-fill-grid ×2, live-demo ×2, entry-phone ×2, and one each in
  film-strip, studio-filmstrip, reel-studio, entry-flow, attribution-hero, stays-section,
  visibility-frames, take-home, gallery-empty-state, reel-payoff, decomposition, your-call, calculator,
  gallery-skeleton, empty-section-teaser, contact-form; judge `upload-thumbnail.tsx:26,41`'s bare
  `rounded`, a literal 4px). The glyphs (`help-emblems.tsx` ×20, `help/page.tsx:430-432`), the tooltip
  arrow and the focus corner at `about/page.tsx:222` are not photographs and stay.
- **Retire `--shadow-float`** (ROADMAP): the three declarations (`globals.css:187-192`, `:389-396`,
  `:475-483`), the `theme.css:107-111` mapping, the pin in `footer-contract.test.ts:67-76`; keep
  `elevation-policy.test.ts`'s guard and reword its comments. Its only readers were the board's specimens.
- **The tuner.** `motion-tuner-config.ts` defaults "MUST mirror" `globals.css` (its header): 202 (2 → 8),
  215 (8 → 12), 230 (3 → 4); the `-lg` knob goes; the knobs that named the rounding board as their
  specimen (17, 185-186) are re-pointed at the Library's radius section, because the file's own rule
  retires a knob with no specimen.
- **The Library and the docs.** `(shell)/library/foundations/page.tsx:174-201` hard-codes "2px / 3px / 8px
  / 16px": read the live tokens or state the new values. `design-system.md`'s Rounding section is rewritten
  to C (the table, "rounded-xl is tiny", the sitting-surface paragraph) but keeps its HEADING TEXT: the
  anchor `#rounding-sharp-surfaces-round-actions` is used by the `buttons` and `rounding` touchpoint rows
  and validated by `_data/docs.test.ts`. Pixel comments in `floating-layer.ts:28-41`,
  `floating-layer.test.ts:24,228-232`, `navigation-menu.tsx:30`, `select.tsx:18`.

**Retire `rounding`**: the directory (11 files, its `screen/` route and its `TrueScale` copy with it);
`docs/specs/rounding.md` cut to "STATUS: RULED AND SHIPPED" the way `floating-surfaces.md` was;
`scripts/lab-smoke.mjs` `SCENES` becomes `[]` (rounding's screen was the last scene) and its comment says
why.

## Retiring the boards (atomic per board; the checklist is not optional)

`BOARD_COMPONENTS` is `Record<SandboxId, BoardEntry>` and `SandboxId` lives in `touchpoints.ts`, so a
board's edits cannot be split: drop the entry alone and tsc fails; delete the directory alone and the
import fails. `floating-wiring` at `b8e77444` is the model.

1. The board's directory, deleted.
2. `sandbox/registry.ts`: the import and the array member, plus the header prose that counts boards.
3. `(shell)/lab/boards.ts`: the import and the map entry, plus its header prose.
4. The standing-board examples that name `rounding` move to `album-hero`: `_data/links.test.ts:33-51`,
   `_data/catalog.test.ts:149-152, 393-395`, `rules/influences.test.ts:174-176`, and `registry.test.ts`'s
   `anchorFor("rounding", "composer")`. `_data/docs.test.ts:298-302` asserts a standing board's spec says
   "NOT LAW"; no standing board has a spec doc after this, so REWRITE that assertion rather than re-point
   it. Leave `docs.test.ts:285-293`'s spec list alone (a spec doc outlives its board).
5. `pnpm design:rules` regenerates `docs/design/library.md` and `rules.generated.json`: GENERATED, never
   hand-edited, named in the lane check as allowances.

★ **The retirement exception.** `src/app/(dev)/design/touchpoints.ts` and `touchpoints.test.ts` stay in
the Orchestrator's `owns`; you edit only your two boards' own lines: both leave `SandboxId` (they stay in
`RulingId`), each RULINGS row loses its `board` block, `ruled` and `shipped` are rewritten so `ruled` no
longer contains the word "open", `lives` points at what landed, `why` at most 170 characters on ONE line;
both leave the standing list in the test. List them in the lane check as the exception.

★ **Not yours, at all:** `bible.ts` (rules 5, 8 and 15 are the Orchestrator's to flip at the merge),
`docs/reviews/`, `docs/design/rulings.md`, `docs/ASSETS.md` (row 17 is withdrawn at the merge), the
CHANGELOG / STATUS / ROADMAP / PROGRAM files, `components/marketing/mdx/`, `marketing.css`.

## Verify, and the gate

**Verify on**, at 1440 and 375, light and dark, reduced motion honoured:
- /about (the masthead, the prose h2 over its six sub-heads), /help (ten panes), the blog index, one blog
  article and one help article (the MDX h2 and h3), the marketing 404 (`/this-page-does-not-exist`),
  /pricing (plan cards, the `cta` buttons), /press, and one feature page;
- the floating layer open over a page (the marketing nav panel, the help palette): 12px panel, 8px rows;
- a guest album (the public demo event: VIEW only, never flip its share state) for the 4px corners and
  gap with no hole where four photographs meet, and the guest entry sheet;
- **the trim, measured**: capture the /about masthead losslessly at 375 and at 1440 and find the first ink
  row of the caps against the element's top; report both numbers. `scripts/lab-demo.mjs` shows the
  DevTools-protocol pattern and a ready capture tool is at
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b4ab430f-9f27-40b5-90a6-4177ea1d1021/scratchpad/cdp-shot.mjs`
  (its header has the usage; write captures outside the repo).
Localhost cannot sign in: never type a password or an OTP, never click a Copy button in the shared pane,
use your own pane tab by tabId. The signed-in surfaces (a dialog in the app, the dashboard's cards) are
the Orchestrator's on the alias after the merge. Dev server on port 3132, stopped by port
(`lsof -ti tcp:3132 | xargs -I{} kill {}`), never an unscoped kill.

**The gate, each step on its own exit code** (zsh has no PIPESTATUS: capture `$?` per step):
`pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`,
`pnpm lint`, `pnpm test`, `pnpm build`, then `pnpm lab:smoke --base http://localhost:3132` (exit 1 is
normal while the two glow boards sit over the reading budget; 0 ROUTES failing is the bar) and
`pnpm lab:demo --base http://localhost:3132` (both boards gone from its list is the retirement working).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **A third kind of off-ladder type: type drawn inside a picture that is not a device or a screen.**
  The help emblem's "?" glyph, the press kit's "Aa" typeface plate, and /features/qr's printed welcome
  sign and table card are all heading-face type sized by the picture they sit in, not by the page. The
  brief named two exceptions and said a third kind is a question. **Recommended:** the same kind as a
  depicted device (type that is part of a picture, where a viewport clamp would size it by the wrong
  box), allow-listed under the one `depicted` exception with a reason and an exact count per file;
  phase 1 ships it that way. **Orchestrator's call, 2026-09-18; relayed to Will, who may overrule.**

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, "Type: the heading face + the ladder": ten steps, and the law is the
  ORDER (the travel paragraph replaced); the table gains `subhead` and every row names its wearers by
  role; a "roles, not sizes" paragraph (the MDX h2/h3 on the prose wrappers, index numerals on the body
  face); the five silent failures the policy holds; the named off-ladder kinds (depicted, the Inter
  labels, the root error page); the display trim paragraph (the clamped form, its sign, the measured
  cap offsets); the index masthead on `subsection`; the utility-documents line. Also the chapter-opener
  bullet in "Chapters" (its stale "36/48/60" became the `chapter` step).
- `docs/systems/design-system.md`, "Rounding: sharp surfaces, round actions" (the heading text kept for
  its anchor): family C in quarters, the table by what each token is FOR (values have one home in
  globals.css), the quarters and the two dropped rungs (`initial`, and why deleting the lines would not
  drop them), the `cta` corner and `ctaCorner`, the pinned gap, the sheet on the floating corner,
  `cn()` taught the radius tokens, the sitting surface re-pointed at the Library's radius section, and
  "rounded-xl is tiny" rewritten. Also the three `--shadow-float` facts in the Elevation contract and the
  one in the palette section (it is retired, not a bridge), and the tuner's specimen line.
- `docs/systems/guest-flow.md`, the masonry line: "3px gaps/radius" became the pinned tokens (the file
  it describes, `guest-masonry.tsx`, is in this lane).

## Deferred (ROADMAP one-liners, bucket named)

- Now: one FAQ, one look. The home and /pricing accordion's questions are on the card step (Urbanist
  16/600) since this lane; the shared `FaqAccordion` (/events, the feature pages) sets its questions as
  Inter 14/500 in a `<summary>` that is not a heading, so the two FAQs now read differently.
- Now: `EmailSignIn` (`src/components/auth/`, outside this lane) takes no Button size, so the guest
  gate's email button is still a default Button forced to h-11 (12.8px on 44px); give it a size so it
  wears `cta`.
- Now: the dialog title's `leading-none` beside `text-card-title` (`ui/dialog.tsx`) overrides the card
  step's own leading on every dialog; drop it and check the dialog headers signed in.
- Now: the literal corners left outside the photograph set, each onto the token its role calls for:
  live-demo's 14px mock panel, and the 6px corners in `reel-builder.tsx` and `style-rail.tsx` (6px is
  `rounded-md` under C).
- Now: the lab's two leftover forced-h-11 CTAs (`sandbox/album-hero/hero.tsx`,
  `sandbox/glow-moments-variants.tsx`) take `size="cta"`, and `lab/tools/motion/motion-playground.tsx`
  still names `/design/lab/rounding` as a specimen; re-point it at `/design/library/foundations#radius`.

## Handoff (replaces the chat report)

- Head <sha>, pushed; phase 1 at `55e444ea` (merged early into launch-prep at `5a5c6eb4`); phase 2 at <sha>; synced with launch-prep at <sha>
- Gates, phase 1 (on its own commit, each step's own exit code): see the phase 1 commit message; the synced tree's line replaces this one at handoff
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, plus the retirement exception (`touchpoints.ts`, `touchpoints.test.ts`: only type-phone's and rounding's own lines), the generated `docs/design/library.md` and `rules.generated.json`, and the listed system doc
- Course corrections from the Orchestrator (2026-09-18): `sandbox/registry.test.ts` left `owns` (it moves `anchorFor` onto a fixture id itself); the standing-board example tests take a fixture, or the first standing board under an `it.runIf` guard, never a named board (done as the "Standing-board examples" line below says); widened policies never scan `src/app/(dev)/` or `src/components/lab/`; the three lanes cut today register their boards at the head of the shared lists, so this lane removed only its own two boards' lines and reordered nothing
- Type, the two clamps (printed by the board's own `fluid()` from git `41dcd591^`, after it had regenerated the other 27 declarations byte for byte): `--text-prose: clamp(1.5rem, 1.28rem + 0.94vw, 2.125rem)` (leading `clamp(1.89rem, 1.688rem + 0.86vw, 2.465rem)`, -0.024em; was `clamp(1.125rem, 0.773rem + 1.5vw, 2.125rem)`) and `--text-subhead: clamp(1.25rem, 1.162rem + 0.38vw, 1.5rem)` (leading `clamp(1.65rem, 1.566rem + 0.36vw, 1.89rem)`, -0.018em); `TYPE_STEPS` gained `subhead`
- Type, the 126 (a comment-aware TypeScript AST scan of every h1-h6, `*Title` / `*Heading` and `font-heading` element in production code): 24 CardTitle overrides dropped (the card step applies again), 45 to `subsection`, 15 to `subhead` (the seven stock pairs among them), 9 to `page`, 6 to `section` (prices, storage and calculator readouts), 1 to `chapter` (/help's ghost folio), 3 to `card-title`, 1 index numeral to the body face (/contact), and 22 left and named: 15 depicted (9 files), 6 Inter labels (5 files), 1 false positive (the blog article's lead-in paragraph size, on its prose wrapper). Beyond the 126: the MDX h2/h3 through `prose-h2:text-prose prose-h3:text-subhead` on both article wrappers, the home FAQ's bare h3 onto `card-title`, `card.tsx`'s small-card `text-sm` dropped (a small card's title keeps the card step: its padding shrinks, its role does not)
- Type, the policy (`type-ladder-policy.test.ts`, no new file): ten steps with their leading and tracking, parity with `cn()`, no colour-name clash, no ramp, the ORDER (title > prose > subhead, read off the tokens at 375 and 1440), and every heading on a step. Scan roots: every `.ts`/`.tsx` under `src/` except tests and `src/app/(dev)/`, `src/components/dev/`, `src/components/lab/`, `src/components/vendor/`. Exceptions by file, reason and exact element count: `depicted` (9 files, 15 elements), `label` (5 files, 6 heading tags that are not in the heading face; the feed header and the album's "Guests" h2 size a child span, so the scan never sees them), `unstyled` (`global-error.tsx`, sized inline because it replaces the stylesheet). Mutation-tested: a `sm:` ramp and an order break each turn it red
- The trim, measured on /about's masthead (lossless CDP, reduced motion, the first ink row of the "P"): 375 before: -0.12em margin (-7.68px), caps 5.0px under the end of the shared gap (12.7px under the h1's box top); after: -0.18em (-11.52px), 2.0px (13.5px). 1440 before: -19.19px, 6.0px (25.2px); after: -19.21px, 6.0px (25.2px). The form is `mt-[calc((1em-1lh)/2-0.19em)]` (compiles to `calc(.31em - .5lh)`); the contract pins it and refuses the board's reversed sign
- Corners, the tokens (globals.css `:root`, before -> after): `--radius` 0.125rem (2px) -> 0.5rem (8px); `--radius-float` 0.5rem (8px) -> 0.75rem (12px), its row `calc(float - 4px)` 4px -> 8px; `--radius-tile` 3px -> 4px; `--gap-gallery` 3px -> `max(3px, var(--radius-tile))` (4px); `--radius-action` 1rem and `-sm` 0.8rem unchanged; `--radius-action-lg` 1.2rem retired (and its tuner knob); `--shadow-float` retired (its three declarations, the theme mapping, the footer contract's pin; the elevation policy keeps refusing it). The derived steps (theme.css): sm 0.6 -> 0.5, md 0.8 -> 0.75, lg 1, xl 1.4 -> 1.25, 2xl 1.8 -> 1.5 (4 / 6 / 8 / 10 / 12px), 3xl and 4xl set to `initial`: the built CSS emits no `.rounded-3xl`, no `.rounded-4xl` and no `--radius-3xl` (checked). The tuner's defaults follow (8 / 12 / 4 / 16 / 12.8), and its specimen is the Library's new radius section, which reads every corner live
- Corners, the call sites: `Card` `rounded-xl` -> `rounded-lg` (with its header, footer and image corners); the Badge and attribution-stage's pill `rounded-4xl` -> `rounded-full`, zip-modal-demo `rounded-3xl` -> `rounded-2xl`; a `cta` Button size (h-11, 1.1x the action corner = 17.6px, `ctaCorner` exported for 44px actions that are not a Button) on 46 sites in 26 files (the 45 forced `size="lg"` + the guest gate's forced default), and `ctaCorner` on the four raw 44px actions (guest-reel-overlay x2, marketing-footer, reel-builder, the last the 48px rung's one reader); the guest entry sheet `rounded-t-[calc(var(--radius-action)*1.4)]` -> `rounded-t-float`; 29 photograph corners onto `rounded-tile` (the brief's 27 in 20 files, and upload-thumbnail's two bare `rounded`, a literal 4px on a photo preview); the gap token on guest-masonry (gap + the two tile margins), gallery-skeleton (gap + margin), ghost-grid, calculator and empty-section-teaser; the help palette's rows `rounded-lg` in `p-2` -> `floatingRow` in `p-1` (the floating family's rail, so the row arc nests in the panel's and a float retune moves both; its icons now align with the search field's)
- Corners, one fix found on the way: `cn()` did not know `tile`, `float`, `action` or `action-sm`, so a token corner and a stock one both survived it and the stylesheet's alphabetical order picked (the dashboard's loading skeletons asked for `rounded-action-sm` and drew `rounded-md`). `RADIUS_TOKENS` in `utils.ts` teaches it, pinned beside the ladder's parity test (the order check is a live `cn()` call both ways)
- Corners, measured (computed style on the live page, before -> after, light and dark agree): the marketing nav panel 8 -> 12px, its rows 4 -> 8px; the help palette 8 -> 12px, its rows 2 -> 8px; the demo album's tiles 3 -> 4px with the gap 3 -> 4px (column gap and tile margin) and no hole where tiles meet; the guest entry sheet at 375 22.4 -> 12px and the entry dialog at 1440 8 -> 12px; /login's card 2.8 -> 8px; the 44px CTAs 14.4 -> 17.6px
- Lane exceptions for the corners, both approved by the Orchestrator on 2026-09-18: `src/app/(dev)/design/gallery/playgrounds.tsx` and `src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx` each gain `"cta"` after `"lg"` (the Library's Button playground and entry; `gallery.test.ts` pins both to the cva, so the brief's `cta` size cannot pass the gate without them). `registry.test.ts` is untouched (its `anchorFor("rounding", ...)` is pure and passes with the board gone)
- Standing-board examples: `parseRef`, the nav and the search index all read touchpoints' `SANDBOX` (not `BOARDS`), so their examples take `SANDBOX[0]` under `it.runIf(standing !== undefined)`; `bindsFor` takes `"fixture-board"`; docs.test.ts asserts rounding's cut spec says "RULED AND SHIPPED". The type ladder's scan roots skip `src/app/(dev)/`, `src/components/dev/`, `src/components/lab/` and `src/components/vendor/`; no corner policy was added (bible 8's `enforcedBy` is the Orchestrator's)
- Captures, phase 2: `.../ladders/p2-before/` and `.../ladders/p2-after/` (the open nav panel, the help palette, the demo album at 2x, the entry sheet on a throwaway test event, /login, the CTAs; 1440 and 375; light and dark; each with its measured JSON), the full pages after `.../ladders/after-p2/`, pairs `.../ladders/crops/pair-album-*`, `pair-entry-375.png`, `pair-palette-1440.png`, `pair-pricing-cards-p2.png`, and the Library's radius section `.../ladders/p2-after/library-radius-*` and `.../ladders/p2-after-lib/`
- Captures, phase 1 (light, reduced motion; full pages, 1440 and 375): before `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b4ab430f-9f27-40b5-90a6-4177ea1d1021/scratchpad/ladders/before/`, after `.../ladders/after-p1/` (about, help, blog, blog-article, help-article, 404, pricing, press, feature-album, guest, home, careers, contact, how); side-by-side pairs `.../ladders/crops/pair-*.png`; the trim `.../ladders/trim/`; every heading's computed size on 26 routes before and after `.../ladders/audit-before/`, `.../ladders/audit-after/`
- Assets requested from Will: none (every image is the Higgsfield month's; an ask names the slot, never the picture)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: the pricing prices on the stat-numeral step (36 at every width became 24 at a phone and 52 at 1440); /help's ghost folio on `chapter` (60/72 became 28/64); /features' wide door title on `subhead` (30 at 1440 became 24, a step over its siblings' 20; `prose` at 34 is the louder alternative); the home FAQ questions now Urbanist 16/600 (the shared FAQ is still Inter 14, Deferred). Then the corners where C shows most: every `rounded-2xl` marketing card (the pricing plan cards 3.6 -> 12px), the guest album's reel poster card (a surface, 2 -> 8px, above 4px tiles), and the help palette's tighter rail. Signed in (the Orchestrator's, on the alias): every app `Card` at 8px, dialogs at 12px, the dashboard's loading skeletons now drawing the action corner they asked for. For the Orchestrator at the merge: bible 8's `enforcedBy` and its "under exploration: rounding" status are yours to flip (`influences.test.ts`'s bindsFor case reads the first live marker, and "under exploration: voice" stays, so it holds)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
