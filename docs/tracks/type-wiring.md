---
track: type-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4280a59c"
board: type-scale
owns:
  - src/app/theme.css
  - src/app/(marketing)/
  - src/app/(guest)/
  - src/app/not-found.tsx
  - src/app/(app)/not-found.tsx
  - src/app/admin/not-found.tsx
  - src/components/marketing/sections/
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/page-hero-contract.test.ts
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/stat-band.tsx
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/press/
  - src/components/marketing/legal/
  - src/components/marketing/help/
  - src/components/marketing/blog/
  - src/components/marketing/built-for.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/guest/
  - src/components/app/
  - src/components/reel/
  - src/components/ui/
  - src/components/shared/page-heading.tsx
  - src/components/shared/not-found-screen.tsx
  - src/components/shared/route-error.tsx
  - src/components/shared/empty-state.tsx
  - src/app/(dev)/design/sandbox/type-scale/
  - src/app/(dev)/design/(shell)/library/foundations/page.tsx
  - docs/specs/type-scale.md
reads:
  - docs/reviews/type-scale.json
  - docs/design/rulings.md
  - src/app/globals.css
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/touchpoints.ts
---

# lp/type-wiring

**Goal.** The wiring round of the type scale: the ladder Will picked ships on the whole site and the
board retires. His ruling (`docs/reviews/type-scale.json` round 7, no notes, every answer the board's
own recommendation): `ladder=b` (B, rungs: one rung set from 12 to 160, marketing travelling four
rungs between 375 and 1440, the app one, the card step none), `tracking=adopt` (each size carries its
own letter spacing and line height, tighter as it climbs) and `not-found=on-ladder` (the dead-link
title joins the set: the heading face, at the prose step on marketing and the page step inside the
app). The source of every number is the board's own `themeBlock(B)` in
`src/app/(dev)/design/sandbox/type-scale/ladders.ts` (27 tokens: nine sizes `display, hero, title,
chapter, section, prose, page, subsection, card`, each with `--line-height` and `--letter-spacing`);
print it, do not retype it. What comes back: one `@theme` block in `src/app/theme.css`, every heading
on the site wearing a step of it, the three four-breakpoint ramps collapsed to one class each, the
Library's Type section drawing the nine steps from the production tokens, and the board gone. Not in
this round: any size B does not name, any new face, any change to body copy, the lab's own headings.

**What is settled, so build rather than ask.**
- The numbers are B's, to the byte. If a step looks wrong on a real page, that is a line for Handoff
  ("Look at first"), not a retune.
- Marketing's six steps and the app's three are ONE set of names. `CardTitle` is one component on
  /pricing and on the dashboard; it wears the card step on both.
- Roles, not sizes, decide a step. The sixteen hand-rolled `font-heading text-3xl sm:text-4xl`
  headings stop one rung short of `SectionShell`'s ramp today; each lands on the step its ROLE calls
  for (most are `section`; a stat numeral in `stat-band.tsx` is not a section heading; the footer's
  two are a closer). The `text-2xl sm:text-3xl` neighbours (about, press, help, contact, a careers
  role) likewise. Judged one by one; never a new off-ladder size, never an arbitrary `text-[Npx]` on a
  heading.
- The three guest titles at `font-heading text-[28px]` (`entry-modal.tsx:445`,
  `event-experience.tsx:229`, `(guest)/u/[slug]/page.tsx:150`) take the `page` step. That is 24 at a
  phone, down from 28, and guests are on phones: capture the before and after at 375 for Handoff.
- `not-found-screen.tsx:55` is one component behind six routes; it learns which half of the site it
  is on (a prop from its callers or the ancestor it already has), never a second component.

**Two traps, measured before this lane was cut.**
1. `text-card` is ALREADY a colour utility (`--color-card`, `theme.css:81`), and Tailwind v4 resolves
   a `text-*` class as a colour before a font size. A `--text-card` token would never be reachable as
   a class. Check all nine names against the `--color-*` namespace in `theme.css` and rename what
   collides (the board's names are the wiring's to adapt; say what you chose in Handoff). The board
   never met this because it aimed CSS at hooks rather than classes.
2. `@utility font-heading` (`globals.css:911`) bakes `letter-spacing: -0.03em`, and a size step's own
   letter spacing has to beat it on every heading that wears both. Tailwind v4 orders utilities by
   property, not by class order in the string; read its sorting rule through Context7, then PROVE it
   as computed style in the browser on a `font-heading` element wearing a step, in `pnpm dev` and on
   `pnpm build && pnpm start`. If the step wins, the flat value stays as the fallback for the lab and
   for anything off the ladder and the utility's comment says so; if it does not, the flat value
   leaves the utility and every `font-heading` call site (100 files, 161 uses outside the lab) must
   wear a step first. `src/app/globals.css` is the `aurora-wiring` lane's file this round: your one
   permitted edit there is the `@utility font-heading` block and its comment (about lines 895 to
   920), listed as a lane-check exception.

**The surface, from the exploration (verify each; line numbers drift).**
- The ramps: `src/components/marketing/system/page-hero.tsx:84-107` (`HERO_SCALE`: the display clamp
  `text-[length:clamp(3.25rem,12vw,10rem)]`, `xl`, `lg`, applied at `:229-233`), `section-shell.tsx:44-47`
  (`HEADING_SCALE`, applied `:101`), `src/components/shared/page-heading.tsx:14` (`text-2xl`).
- The sixteen at 30/36: `sections/reel/guest-share-section.tsx:46`, `features/sharing/one-link.tsx:72`,
  `features/qr/print-shop.tsx:54`, `features/album/attribution-stage.tsx:108`,
  `features/album/everywhere-section.tsx:44`, `features/album/getting-in-stage.tsx:64`,
  `features/guests/credited-album.tsx:73`, `guest-list-section.tsx:60`, `profiles-section.tsx:93`,
  `careers/careers-story.tsx:87, :121, :147`, `system/stat-band.tsx:73`,
  `chrome/marketing-footer.tsx:141, :157`, `shared/route-error.tsx:45`.
- The app: `src/components/app/event-card.tsx:88` (`text-xl`), `src/components/ui/card.tsx:36-44`
  (`CardTitle`, `text-base`, `data-slot="card-title"`; `ui/*` is semicolon-free by the generator, keep
  it so), `sheet.tsx`, `drawer.tsx`, `dialog.tsx` titles, `shared/empty-state.tsx`.
- The 404: `src/components/shared/not-found-screen.tsx:55` (Inter 600, `text-3xl sm:text-4xl`), its
  six callers, `marketing-not-found.tsx`.
- Contracts that pin type today: `page-hero-contract.test.ts:64` ("declares the type size as a
  length, not a bare clamp") guards an ambiguity a named token removes; rewrite it to pin FUNCTION
  (the display step reads the ladder token; the scales stay in `HERO_SCALE`), never a look, then
  `pnpm design:rules`. `marketing-h1-policy.test.ts` and `two-faces-policy.test.ts` do not pin sizes.

**The Library, which is what the board retires into.** Foundations' Type section
(`src/app/(dev)/design/(shell)/library/foundations/page.tsx:118-140`) draws two generic specimens
today (the page is yours; `foundations/gallery-demos.tsx` beside it is the `aurora-wiring` lane's). It becomes the ladder: the nine steps at true size from the PRODUCTION tokens, each with its
name, its two ends and its spacing, marketing's six and the app's three, and the dead-link rule. Carry
over from the board only what reads production (`true-scale.tsx`'s idea of clipping rather than
shrinking is worth keeping); nothing imports the sandbox afterwards.

**Retirement, atomic, in this lane (the migration wave's precedent).** Delete
`src/app/(dev)/design/sandbox/type-scale/` and, as listed lane-check exceptions, its three
registration lines: `src/app/(dev)/design/touchpoints.ts` (the `SandboxId` member at `:76`; the entry
at `:505-525` becomes ruled 2026-09-17 and shipped, its `board` field gone, its `lives` naming
`src/app/theme.css` and the Library section), `sandbox/registry.ts` (`:12`, `:38`),
`(shell)/lab/boards.ts` (`:12`, `:36`), plus `touchpoints.test.ts:38` and
`_data/docs.test.ts:286` if the spec slug list moves. `sandbox/rounding/true-scale.tsx` is a COPY, not
an import, and stays. `src/components/lab/step.test.tsx` uses the string `type-scale` as fixture data
and stays. `docs/specs/type-scale.md` is yours: cut it to what is still true after the ruling or say
in Handoff that it should go. `docs/reviews/type-scale.json` is the Orchestrator's to delete at the
merge. Do not edit `bible.ts`: rule 5's `under exploration` status is the Orchestrator's at the merge.

**Binds.** The bible (2 and 5 above all: one token set; one heading face on one site ladder, every
h1 on it), the contracts of every component under a path you own, the policies
(`no-em-dash-policy`, `two-faces-policy`, `css-source-policy`, `keyframe-uniqueness`). Everything
else is precedent. Agents never edit CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS,
`docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/` or `rules/bible.ts`.

**Verify on.** Your own dev server on port 3131 (`pnpm dev --port 3131` from the worktree, a background
process; stop it by port at the end: `lsof -ti tcp:3131 | xargs -I{} kill {}`; never an unscoped
pkill; :3000 is the Orchestrator's). The browser pane is SHARED with two other lanes: open your own
tab, touch no other. At 1440 and at 375: the home, /about (the 160px masthead), /pricing, /help, one
features page, a marketing dead link (`/events/not-a-real-event`), the guest entry (`/e/demo` or the
demo event), the Library's Foundations page. For each step, the computed `font-size`,
`line-height` and `letter-spacing` at both widths against `ladders.ts`'s own numbers (a table in
Handoff). The signed-in dashboard and the app's 404 are the Orchestrator's on the alias.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- The feed's section heading (`src/components/app/event-feed/feed-section-header.tsx:26-34`) is an
  11px uppercase label inside an h2. B says no app heading sits below 14. Recommended: leave it a
  label (the h2 is structure, the look is a label, and restyling the feed is outside this ruling) and
  write the exception down in `docs/systems/design-system.md`; say so if you find a better answer.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet (expected: `docs/systems/design-system.md`, the type section: the nine steps' one home)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The steps as shipped: name, the class, 375 and 1440 computed, where it is worn
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
