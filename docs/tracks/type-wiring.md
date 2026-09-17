---
track: type-wiring
status: handed-off       # deleted in the merge commit that integrates it
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
  **Taken, and no better answer found.** The ladder is the heading FACE's ladder and this is Inter, so
  it is not an app heading sitting below 14, it is a label that borrowed a heading tag for the
  document outline. Written down in design-system.md ("The one written exception"), with the admin
  metric bands' 14px cousin beside it, and the file untouched.
- **New, and answered the same way: marketing's sub-head tier is now louder than the section above
  it at a phone.** B's marketing register ends at `prose` (18 at 375), and the `text-xl sm:text-2xl`
  h3s under it are 20 flat, so on /about and /help a sub-head out-shouts its own h2 at 375. B names a
  step for that rank (`subsection`, 18/20) and it would close the inversion, but taking it would also
  drop every marketing sub-head from 24 to 20 at 1440, which is a design change Will never saw on the
  board. Recommended, and what shipped: leave them off the ladder this round and rule on the tier
  separately. Measured numbers are in "Look at first".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, the Type section (renamed "Type: the heading face + the ladder",
  so both `lives` anchors pointing at it moved with it): the nine steps as a name/class/wears-it
  table pointing at theme.css and the Library for the numbers, the travel law, the three silent
  failures the wiring measured, the weight tiers kept, marketing's H1 exemptions restated as steps,
  the label-in-a-heading-tag exception, and the display step's `text-[length:...]` note retired
  (the line in "Gotchas" now says a NAMED step cannot be misread).

## Deferred (ROADMAP one-liners, bucket named)

- The marketing bucket: rule on the marketing sub-head tier below `prose` (the ~9 `font-heading
  text-xl sm:text-2xl` h3s plus the `text-lg sm:text-xl` and flat `text-2xl` ones); at 375 they now
  read louder than the `prose` h2 above them, and `subsection` (18/20) is the step that would close it.
- The lab bucket: the existing "fold the retired boards' spec docs and delete them" line now covers a
  `docs/specs/type-scale.md` already cut to the ruling; it should go with `palette.md`.
- The marketing bucket: the flat `font-heading text-3xl` FIGURES (the pricing teaser's and the
  calculator's price, /qr's pull quote) are off the ladder on purpose, being figures rather than
  headings; fold them when the sub-head tier is ruled.

## Handoff (replaces the chat report)

- Head `HEAD_SHA`, pushed; synced with `launch-prep` at `0e6a2058` (it had moved: the Aurora's
  wiring). The merge touched only `docs/design/library.md`, which is generated, so it was resolved by
  rerunning `pnpm design:rules` on the merged tree rather than by hand; `globals.css` and
  `design-system.md` both auto-merged (Aurora took the spill engine and the lamp doctrine, this lane
  the `@utility font-heading` block and the type section).
- Gates on the synced tree, each read on its own exit code: typecheck ok, lint ok (0 errors, the 9
  pre-existing warnings), test ok (2114 in 229 files), build ok (256 static pages). `pnpm lab:smoke
  --production` is 247 checks with 3 failing, none of them a regression this lane can fix: two are
  the glow boards over the reading budget (untouched here), and the third is under "Look at first".
- Lane check (`git diff --name-only origin/launch-prep...HEAD`, 71 files). Inside `owns` except:
  - the four listed retirement lines: `touchpoints.ts` (the `SandboxId` member and the entry, now
    ruled 2026-09-17 / shipped "B, rungs" with `board` gone), `sandbox/registry.ts`,
    `(shell)/lab/boards.ts`, `touchpoints.test.ts`. `_data/docs.test.ts` was NOT needed: the spec doc
    stayed, cut to the ruling, so the slug list did not move.
  - `src/app/globals.css`: the listed one-block exception, the `@utility font-heading` comment only.
  - `docs/systems/design-system.md`: the listed system-doc edit.
  - `docs/design/library.md` + `rules/rules.generated.json`: the two files `pnpm design:rules` writes.
  - **`src/lib/utils.ts`, unlisted and forced.** `cn()` DROPS a ladder step the moment a real colour
    shares the call: unextended, `cn("font-heading text-chapter text-white")` returned `font-heading
    text-white`, because tailwind-merge cannot see our stylesheet and files an unknown `text-*` under
    `text-color`. The blog index's own h2 is that exact shape. The ladder is now declared to it as
    `TYPE_STEPS`, which is the DRY single-source's own pattern (tiers.ts and its parity test).
  - **`src/lib/type-ladder-policy.test.ts`, new.** The three silent failures, held: a step that takes
    a `--color-*` name, theme.css and `cn()` disagreeing, and a breakpoint ramp returning to one of
    the three system components. Scoped `engineering` because a `global` policy has to be cited by a
    bible rule and `bible.ts` is yours.
  - **`(shell)/library/foundations/type-ladder.tsx`, new.** The Library's ladder reads the live
    tokens, so it is a client island and cannot live inside the server `page.tsx`. It sits beside
    `foundations/gallery-demos.tsx` without touching it (that file is the Aurora's).
  - **`scripts/lab-smoke.mjs`:** one line, the retired board's scene URL. The retirement is not atomic
    without it and the smoke 404s on it otherwise.
  - **`src/components/marketing/marketing-route-error.tsx`:** one prop, `surface="marketing"`. It is
    the sibling caller of `NotFoundScreen` and the dead-link ruling reaches both.
  - **`(app)/dashboard/[eventId]/page.tsx`, `admin/albums/[eventId]/page.tsx`, `admin/layout.tsx`:**
    the three `PageHeading` size overrides. Forced by `PageHeading` joining the ladder: twMerge still
    lets a caller's size win, so a stock `text-3xl` would have left three app h1s off the ladder
    against bible 5, silently. Two dropped the override; the admin gate card named a STEP instead
    (`text-subsection`), because a 24/28 h1 in a `max-w-sm` card is not the rank that screen wants.
- The steps as shipped. Computed in the browser at both widths (the 0.02-0.06px drifts are the
  clamp's linear term evaluated at exactly 1440/375, not error), every number equal to
  `themeBlock(B)`'s. Read live at `/design/library/foundations#ladder`.

  | Step | Class | 375 size/leading/tracking | 1440 size/leading/tracking | Worn by |
  | --- | --- | --- | --- | --- |
  | Display | `text-display` | 64 / 62.72 / -.045em | 159.94 / 137.58 / -.045em | PageHero `display`: /about, /press |
  | Hero | `text-hero` | 42.02 / 46.21 / -.042em | 100 / 89.97 / -.042em | PageHero `xl`, the home's hand-rolled hero |
  | Title | `text-title` | 34.01 / 39.45 / -.038em | 80 / 75.2 / -.038em | PageHero `lg`, /qr, /reel, /events |
  | Chapter | `text-chapter` | 28.00 / 34.16 / -.035em | 64 / 62.69 / -.035em | SectionShell `lg`, article + role titles, the footer's two |
  | Section | `text-section` | 24.01 / 30.26 / -.032em | 52 / 54.08 / -.032em | SectionShell default (~70), the twelve hand-rolled h2s, StatBand |
  | Prose | `text-prose` | 18 / 24.48 / -.024em | 33.97 / 39.38 / -.024em | /about, /press, /help, /contact, the help facts band, a marketing dead link |
  | Page | `text-page` | 24.02 / 30.25 / -.02em | 28 / 34.16 / -.02em | PageHeading (every app + admin h1), the three guest titles, RouteError |
  | Subsection | `text-subsection` | 18.01 / 24.48 / -.014em | 20 / 26.4 / -.014em | EventCard's name, the admin gate card, EmptyState `quiet` |
  | Card title | `text-card-title` | 16 / 22.4 / -.006em | 16 / 22.4 / -.006em | CardTitle, Sheet/Drawer/Dialog titles |

- Trap 1, as ruled: `text-card` is already `--color-card` and v4 resolves colour before size, so the
  card step ships as **`card-title`**. The other eight names were checked against the whole
  `--color-*` namespace and the policy test now holds that for any step added later.
- Trap 2, PROVEN rather than reasoned, in `pnpm dev` AND on `pnpm build && pnpm start`: Tailwind sorts
  the utilities layer by property and emits a custom `@utility` in the font-* position, ahead of every
  `text-*` size utility, so at equal specificity the step wins. `h1.font-heading.text-title` on /help
  computes `-0.038em`, not `-0.03em`, in both builds. The flat value therefore STAYS in the utility as
  the fallback for everything off the ladder, and its comment says so. A third fact fell out of the
  same measurement and is the live landmine: `tracking-tight` resolves to `0em` here and CANCELS a
  step's tracking through `--tw-tracking`, so the five `tracking-tight` headings on /help and /contact
  dropped it when they took their step.
- The masthead: `.mkt-name` is unlayered (marketing.css beats the utilities layer whatever the
  specificity), so wearing `text-display` was not enough; the two closing rules now read
  `var(--text-display--letter-spacing)`. Settles at exactly -0.045em, measured in both builds. The
  reduced-motion branch is the base rule, so it takes the token by construction.
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first:
  1. **Marketing's sub-head tier now out-shouts its own section at 375.** /about: the `prose` h2 is
     18px and the six conviction `h3`s under it are 20px; /help: the same, an 18px "Start here" over
     20px category-card `h3`s. B's marketing register simply ends at `prose`, and this tier was never
     on the board. The Questions entry has the recommendation (rule on it separately) and the cost of
     the alternative (every marketing sub-head 24 to 20 at 1440).
  2. **The dead-link title at 375 is 18px**, which is one pixel over the body copy beside it. That is
     the `prose` step exactly as ruled, and at 1440 it reads well (34px, Urbanist 700, up from Inter
     600 at 36). It is the phone end that is worth a second look before this is called done.
  3. **One `lab:smoke` route 404s and the fix is yours at the merge.** With the board retired,
     `/design/library/rules/one-site-ladder` falls to its "this is a track, not a board" branch and
     links `/design/lab/tracks/type-scale`, which has no manifest. Clearing rule 5's
     `status: "under exploration: type-scale"` in `rules/bible.ts` (explicitly yours) and rerunning
     `pnpm design:rules` removes it. The other two smoke failures are the glow boards' reading budget,
     untouched by this lane.
  4. **The app's own surfaces are yours on the alias**: the signed-in dashboard (PageHeading at 24/28
     where the event name used to be a flat 30, and EventCard's name at 18/20), the app 404, and any
     sheet or dialog title. Everything logged-out was measured here.
  5. The display step's `-mt-[0.12em]` trim was reasoned against a 0.85 leading; the step's own
     leading is 0.86 at 1440 (identical in practice) but 0.98 at 375, so the trim under-corrects at a
     phone. Left alone deliberately: trimming per width needs a second clamp for one page.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-17). Will's type ruling shipped: ladder B baked as one
`@theme static` block of nine `--text-*` steps in theme.css, generated from the board's own
`themeBlock(B)` rather than retyped, each step a clamp through (375, phone) and (1440, desktop)
carrying its own leading and tracking. The three four-breakpoint ramps collapsed to one class each and
about sixty headings moved onto a step by ROLE, including the dead-link title, which joined the set
through a `surface` prop rather than a second component. Two traps were measured before anything
moved (the card step renamed `card-title` around `--color-card`; the step proven to beat
`font-heading`'s flat tracking in dev and in the production build) and a third was found at the wiring
(`cn()` silently dropping a step beside a colour), all three now held by a policy test. The board
retired atomically into the Library's Foundations page, which draws the ladder at true size and reads
every number back off the live tokens.
