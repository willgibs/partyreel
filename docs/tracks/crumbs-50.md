---
track: crumbs-50
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "31100a38"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/why-an-event-asks-for-your-email.mdx
  - content/blog/
  - src/components/marketing/chrome/
  - src/components/marketing/system/section-shell
  - src/components/marketing/sections/features/qr/print-shop
  - src/components/marketing/sections/home/live-demo
  - src/components/marketing/sections/features/album/album-fill-fixtures
  - src/components/marketing/sections/careers/
  - src/components/marketing/sections/events/
  - src/components/marketing/sections/how-it-works/
  - src/components/marketing/sections/pricing/
  - src/components/marketing/mdx
  - src/components/marketing/legal/
  - src/components/auth/email-sign-in
  - src/lib/constants/marketing-nav
  - src/lib/content/blog-tags
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/crumbs-50

**Goal.** Off-round crumbs from the ROADMAP, none on a surface this round rewires: marketing's stray preloads, demo pointers, type steps, tokens and dead fixtures, the help's last stale door line, the legal pages' print, prose's inline code, the sign-in step's waiting cue, the nav's one source and the blog's tags.

## The brief

**Why.** Small, verified ROADMAP lines (each quoted in `docs/ROADMAP.md`; retire each you finish by naming it in your Handoff, never by editing the ROADMAP, which is the Orchestrator's). None sits on a surface round 12 rewires (the heads, the dashboard, the door, disposable mode, Create, the home hero, the atoms): stay inside `owns`.

1. **Help:** `why-an-event-asks-for-your-email.mdx` still says "behind the welcome screen" (lines 22 and 48); the welcome is the doorway's page now (as `crumbs-49` did for three other articles).
2. **Marketing preloads:** every marketing page but the home preloads the home's three sheets (the hero's, the river's, the backdrop's) and never draws them, from the header logo's viewport prefetch of `/`. Fix it at its cause in the marketing chrome, measured on `next start` before and after (the guest header's same prefetch on `/e/` pages is `header-wiring`'s file: name it in your Handoff, do not touch it).
3. **The Event Pass ticket's "≈"** wraps onto a line of its own at 1440 (about 56px of text in the stat's cell).
4. **The sign-in email step pressed before hydration** is safe but says nothing: a waiting cue on its button. (Where a signed-out press on /pricing's Get Pro returns after sign-in is Will's call: leave it.)
5. **Demo pointers still plain same-tab links:** the event objects (`events/event-object.tsx`), /how-it-works' proof (`how-it-works/demo-door.tsx`) and the footer's phone link: each one `DemoDoor` (`system/demo-modal/demo-door.tsx`), as the hero's is.
6. **`SectionShell`'s subhead** carries no size class (16 px inherited) while `PageHero`'s rides the `subhead` step: put it on the ladder.
7. **/qr's pull quote** (`features/qr/print-shop.tsx`) is the last flat `text-3xl` figure, a `font-heading` paragraph the heading scan does not read: give it a step by role.
8. **`live-demo.tsx`'s mock panel** wears a literal `rounded-[14px]`: the token its role calls for.
9. **`HERO_FIXTURES`, `HERO_FRAME_H` and `HERO_SEED_COUNT`** (`album-fill-fixtures.ts`) serve only tests: fold them into the tests or delete them.
10. **`sections/careers/contact-sheet.tsx`** is a photography proof sheet named like a contact surface: rename it.
11. **Inline code in help and blog prose** has no plate (the wrappers set it sans and nothing else): give it the muted plate (the MDX components).
12. **The legal pages carry no print styles** (only the glow engine carries `@media print` and `forced-colors` rules): copy its pattern.
13. **The mega panel** hand-writes a description per event type beside `EVENT_TYPES.teaser`: one source (`marketing-nav.ts`).
14. **The blog's tags:** the family-reunion post carries `parties` while its subject reads as a trip, and `blog-tags.ts` has no `trips` tag; give it one where the posts call for it.

Each fix stands on a test where one can hold it (the policies under `src/components/marketing/` and `src/lib/content/` are the house style: red on the old code first where it is a rule). Will's standard for every surface: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." System doc: name any `marketing-content.md` line that should change in your Handoff (it is unowned this round; the Orchestrator places it).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3134`; the preload fix measured on `next start` (warnings a load on /pricing, /about and /help, before and after); every changed page read in a headless Chrome of your own at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as its recommended answer and is Will's to overrule; none is a one-way door.

1. **Does the home's prefetch wait for intent?** The wordmark's viewport prefetch of `/` cost every other marketing
   page 11 requests and about 73 KB (13 KB of payload, 4 KB of sheets, 56 KB of chunks) and three warnings; it bought
   a press that lands in about 70 ms. Built: it waits for a pointer or focus (`HomeLink`), and the link answers a press
   that had no lead. Measured on `next start` (press to the URL changing, median of 3; fast = 40 ms RTT at 10 Mbps, slow
   = 150 ms RTT at 1.6 Mbps): hover 70 fast and 681 slow, tap 249 and 917, a bare click 253 and 755, against 60 to 90
   in every case before. Recommended: keep intent (every page view is 8% lighter and the only cost is the press that
   arrives with no hover to lead it), since a late prefetch warns three seconds after it too (measured: hover at 8 s,
   warnings at 11 s), so no deferral gives both. The other way is one line (drop `prefetchOnIntent` in `HomeLink`) and brings the warnings back.
2. **/qr's "pull quote" is not one.** `print-shop.tsx:93` is the printed welcome sign's headline ("Add your photos"),
   type drawn inside a picture, which design-system.md names off the ladder on purpose and the retired heading scan
   listed `depicted`. Recommended: leave it (a step's clamp would print the same fixed sign smaller at a phone), named at
   its site. The alternative is `text-page` (24 to 28).
3. **Is a family reunion a trip on the blog?** `events.ts` files reunions under Trips (its subhead and nested
   themes), the Parties page does not name them, and the blog's own `parties` line did. Built: a `trips` audience (the
   four event types, in the nav's order, held by `blog-tags.test.ts`); the group-trip guide and the reunion guide
   carry it, the reunion's closing link goes to /events/trips, and Parties' line lost "reunions". Recommended: keep.
4. **Do the Events panel's rows say the registry's teasers?** One source meant the teaser (57 to 64 characters), so a row
   is longer than its Features siblings and Parties wraps to two (`text-pretty`, no stranded word). Recommended: keep. The
   other way is a `navDescription` on `EventType` beside `navLabel`, as `FEATURE_PAGES` has, which keeps the compact
   lines (`events.ts` is outside this lane).
5. **Which step is a section's subhead?** `copy` (16 at a phone, 18 at a desk: theme.css names it a section's lede),
   not `subhead` (20 to 22, which would crowd a 24px section heading at a phone), and balanced when centred as
   PageHero's is. A 2 px larger lede on about 35 sections at a desk. Recommended: keep.
6. **Does the email step replay an early press?** Continue with Google does (`EarlyPressButton`); the email step now
   only says it is waiting. A replay at hydration would submit before react-hook-form adopts the typed address and
   answer "Enter a valid email address." over a valid one. Recommended: keep the cue alone.
7. **The Pass ticket's room.** The stub is 320 px (was 288) and the frame's strip 208 (was 240), so the words half
   keeps its width; the alternative is the cell padding, shared with the pair. Recommended: keep.
8. **The new doors go to the event itself** (`DEMO_EVENT_URL`, as the hero's, the footer's and `DemoCtaLink` do), not
   through `/demo`'s 307: one hop fewer for a phone's new tab. The code each draws still encodes the short `/demo`.
   Recommended: keep (`event-door.tsx`, not in this lane, still says `/demo`).

## System-doc edits (in place, owned facts only)

- none: the lane owns no system doc. The `marketing-content.md` lines the Orchestrator places are in the Handoff.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: the same-class preload warnings left are a page body's own links to a route with its own sheets: the curation and guests heroes' "See the live album" prefetches `/features/album`'s five sheets (six warnings a load), /how-it-works links `/features` and /features/privacy links `/features/curation`; a body link takes `prefetchOnIntent` (or its hero's secondary link stops prefetching) (from `crumbs-50`).
- Guests: the guest header's logo (`guest-header.tsx`) prefetches `/` on sight on every `/e/` page, the cause `HomeLink` fixed in the marketing chrome (ROADMAP's "three preloaded but not used warnings" line); it can take `ChromeLink`'s `prefetchOnIntent` (from `crumbs-50`).
- Help: `browse-the-album.mdx` (:22, "behind a blurred welcome screen") and `play-the-reel-on-a-screen.mdx` (:24, "the welcome screen ... meets the same welcome screen") still draw the welcome as a screen in front of the album; it is the doorway's page and the steps rise over it as sheets (from `crumbs-50`).
- Code hygiene: `album-fill-grid.tsx`'s and `everywhere-stage.tsx`'s comments still say "the hero's grid" and "the hero's three" columns, the table the hero kept here until the live stream replaced it (from `crumbs-50`).

## Handoff (replaces the chat report)

- **Commits.** The work commit is `5d143f03` on `lp/crumbs-50` (this manifest is the commit on top of it); both pushed. launch-prep
  moved to `f4c9c6d9` while the lane ran (header-wiring, host-dashboard-r2, disposable-foundation and their records) and
  no sync commit was needed: a trial merge of it is clean, no changed file is shared with the lane's, and the only
  dependency that moved, `ui/button.tsx`, gained variants and kept `group/button`, which the email step's cue reads.
- **Gates**, each on its own exit code, on `5d143f03`'s tree: `pnpm typecheck` 0; `pnpm lint` 0 (no warning);
  `pnpm test` 0 (761 files, 9000 tests); `zsh scripts/build-lock.sh pnpm build` 0 (the same tree);
  `pnpm lab:smoke --base http://localhost:3134` 0 on my dev server (130 checks, 0 failing; the production
  server closes the lab's door, so it takes `--production --key`). No `lab:demo`: the lane has no board.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the work commit's 36 files and this manifest, every one
  under `owns` but three, each a necessary line of the item it serves: `src/app/(marketing)/(cinema)/careers/page.tsx` (item 10's four
  call-site lines: the import's name and path, one comment, the JSX tag); `src/app/not-found.site.test.tsx` (it pinned
  "the chrome on every other page prefetches as it always did" with the wordmark as its probe, so item 2 reshapes that
  one assertion, probing /pricing and stating the wordmark's `false`, and its `next/link` stand-in gains `useLinkStatus`);
  `src/components/marketing/sections/features/album/use-album-fill.test.ts` (item 9: it imported the hero table, so it
  keeps its own).
- **The items**, each retiring its ROADMAP line (named by its words; the ROADMAP stays the Orchestrator's):
  1. Help "behind the welcome screen": `content/help/why-an-event-asks-for-your-email.mdx`, both lines, `updated` bumped.
  2. Marketing preloads (the line naming the header logo's viewport prefetch): `chrome-link.tsx` (`HomeLink`,
     `IntentLink`, `LinkPending`), used by the header, the footer and the phone menu. **Before and after on `next start`,
     warnings a load:** /pricing, /about, /help 3 -> 0 at 1440 and at 375 (also /contact and /blog at 375; the 25-page
     sample 71 -> 15 at 1440, 75 -> 21 at 375); a /pricing load 67 -> 56 requests and 893,959 -> 820,993 bytes. Logs:
     `_scratch/crumbs-50/before-preload-1440.log`, `after-preload-1440.log`, `before-survey-{1440,375}.log`,
     `after-survey-{1440,375}.log`, `before-navtime.log`, `after-navtime*.log`. Tests: `chrome-link.test.tsx`,
     `home-link-policy.test.ts` (red on the old chrome), the reshaped `not-found.site.test.tsx`. The guest header's same
     prefetch on `/e/` pages is `header-wiring`'s file and is untouched (Deferred).
  3. Event Pass "≈": `pass-card.tsx`, `plan-cards.tsx`; every stat value is one line at 1440, 1024, 768 and 375 (the Pass
     cell 55 -> 67 px of text for 61 needed). No test: a wrap is a look.
  4. Sign-in email step's waiting cue (the cue half of the sign-in line; the /pricing return half stays Will's):
     `email-sign-in.tsx`, `email-sign-in.test.tsx` (red on the old button: the server's HTML carries the cue, the hydrated
     render and the hydrating render drop it). Driven on /login with the scripts held (CDP `Fetch`): `aria-disabled`, a
     progress cursor, the spinner after 0.5 s and at once under a press, and no `?email=` in the address.
  5. Demo pointers: `events/event-object.tsx`, `how-it-works/demo-door.tsx` are `DemoDoor`s (the footer's phone link
     already was, crumbs-6); driven at 1440 (the modal opens, the page stays) and at 375 emulating touch (`target=_blank`,
     no modal) on /events/weddings, /events/trips and /how-it-works. `chrome/demo-door-policy.test.ts` (red on both old
     files); `event-object-contract.test.ts` reshaped (its `href="/demo"` pin follows the door to the event).
  6. SectionShell's subhead: `copy`, balanced when centred; measured 18/28 px at 1440 and 16/24 at 375 on / /pricing,
     /how-it-works, /events, /contact and /features/curation. No test: the ladder's look tests left with library-lean.
  7. /qr's "pull quote": retired as mistaken (Question 2); a comment at the sign.
  8. live-demo's panel: `rounded-lg`. No test: depicted pictures keep literal corners, so a scan would carry an allow-list of every device.
  9. HERO_*: `album-fill-fixtures.ts` loses them; `use-album-fill.test.ts` keeps the derivation's table; the two hero-only
     invariants now hold the everywhere pair's table (`album-fill-fixtures.test.ts`, which says which scars moved).
  10. contact-sheet: `careers/proof-sheet.tsx` (`ProofSheet`), its test renamed with it.
  11. Inline code: `InlineCode` and `CodeBlock` in `mdx/spec-shared.tsx`, `inline-code.test.tsx` (red on the old map;
      the block guard goes red with `pre` unmapped); read on /help/send-the-event-link at both widths.
  12. Legal print: retired as stale. The block exists (`globals.css` "PRINT: the legal documents", `data-print-legal`
      on the legal shell, `src/app/legal-print.test.ts`); read through Chrome's own print path (/privacy to a PDF, page one
      in ink on white, no header, footer or rail) and in forced colors (legible). Nothing built.
  13. Mega panel: `marketing-nav.ts`, `marketing-nav.test.ts` (red on the old strings), `text-pretty` in `mega-panel.tsx`.
  14. Blog tags: `blog-tags.ts`, `blog-tags.test.ts` (red without a `trips`), the two posts, `content/blog/AUTHORING.md`; the
      line's second sentence (three posts with an audience tag and no link into a type page) stays on the ROADMAP.
- **`marketing-content.md` lines for the Orchestrator to place** (the doc is unowned this round):
  - "The chrome", after the Resources bullet, add: "★ **The wordmark's door to `/` fetches on intent, never on sight**
    (`HomeLink`): its viewport prefetch put the home's three sheets into every other page (a prefetched payload makes
    React preload each sheet it names), 11 requests and about 73 KB a load; a hover or a focus fetches it, a press with no
    lead answers itself (a progress cursor, the wordmark dimming after 150 ms), and a prefetch fired late warns three
    seconds after it as any unused preload does."
  - "The 404 pages" ends "(The home's three warn on every other marketing page too, from the header logo's prefetch of `/`:
    ROADMAP's line.)": delete the parenthesis.
  - "The chrome", the nav bullet, add: "The Events panel's rows say each type's own `teaser`, word for word, held by
    `marketing-nav.test.ts` as the Features rows are to their `navDescription`."
  - "The demo (marketing side)" ends "The event objects, `/how-it-works`' proof and the footer's phone link are still plain
    links.": replace with "`demo-door-policy.test.ts` refuses a plain link to the demo anywhere in marketing."
  - "The content pipeline", after the `blockJS` bullet, add: "**Inline `code` is the muted value plate** (`InlineCode`, the
    shared map): `not-prose` takes it out of the typography plugin's code rules, which print a literal backtick either
    side, and a fenced block stays bare through `CodeBlock`."
  - The tags bullet gains: "The four audiences are the four event types, in the nav's order (`blog-tags.test.ts`); a
    reunion files under Trips, as `/events/trips` files it."
- **Assets requested from Will:** none.
- **Board ideas:** pending feedback for every link that is not prefetched on sight (`useLinkStatus`, which `HomeLink`
  now uses and nothing else does; the profile door's ROADMAP line is the same idea); the guest header's logo can wear
  `HomeLink` as it is.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** Question 1 (the home waits for intent: about 73 KB and three warnings a page against a
  bare press at 250 ms fast and 0.75 to 0.9 s on slow 4G); 2 (the sign stays off the ladder); 3 (a reunion is a trip); 4
  (the panel says the teasers); 5 (`copy`, balanced); 6 (no replay); 7 (the Pass ticket's widths); 8 (the doors go to the
  event). The email step's `aria-disabled` and the proof sheet's name are smaller calls of the same kind.
- **Look at first:** Question 1 on a real phone (the logo's press on a slow network); the Events panel at 1440; the Pass
  ticket at 1440; /login on a cold phone, where the spinner shows before the page is ready.
