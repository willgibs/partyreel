---
track: mkt-polish
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7c51d429"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(marketing)/(cinema)/careers/
  - src/app/(marketing)/(cinema)/contact/
  - src/components/marketing/chrome/marketing-header.tsx
  - src/components/marketing/sections/pricing/
  - src/lib/constants/events.ts
  - src/lib/content-policy.test.ts
  - src/components/app/media-grid.tsx
  - src/components/app/media-grid.test.tsx
  - src/components/marketing/sections/features/shared/feature-faq.tsx
  - src/components/marketing/sections/features/album/live-album-stage
  - src/components/marketing/sections/features/album/how-much-fits.tsx
  - src/components/marketing/faint-copy-policy.test.tsx
  - src/components/marketing/sections/reel/clip-section
  - src/components/marketing/system/still-variants
  - src/components/marketing/chrome/mobile-menu
  - src/components/marketing/chrome/marketing-nav.tsx
  - src/components/marketing/chrome/session-hint.tsx
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/chrome/footer-faq-link
  - src/components/marketing/chrome/chrome-link.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/marketing/forms/
  - src/app/not-found.site
  - src/app/(marketing)/(cinema)/pricing/page.tsx
  - src/app/(marketing)/(cinema)/events/page.tsx
  - src/app/(marketing)/(cinema)/events/[slug]/page.tsx
  - src/lib/constants/marketing-nav
  - src/lib/validation/contact
  - src/lib/validation/careers
  - src/lib/validation/public-form
  - src/lib/security/public-form-submit
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
  - src/lib/constants/tiers.ts
---

# lp/mkt-polish

**Goal.** The marketing site's seams closed: stills served at their size through a derivative path, the 404's unused preloads gone, `--faint` legible where it reads as copy, the careers form and /contact on one contract with one receipt, each page's own FAQ, a dynamic route's 404 titled, the claim scan reaching every constant, /pricing's rows balanced, and the phone sheet tracked; no desk board's surface moved.

## The brief

The marketing site presents the product as complete, so its seams cost trust. Nine ROADMAP lines; each is its line there (find it by the words quoted), fixed at its root with a test that fails on today's code where a test can hold it, or retired with the evidence that it is already true:

- **Stills at their size:** "`MediaTile` serves the marketing stand-ins' source files (about 2 MB each into a 287 px tile, 16.8 MB for the album hero), so marketing stills want a derivative". The stand-ins are replaced in one Higgsfield month before launch, so build the derivative path (sized variants, `sizes` true to each slot) that any still dropped in later inherits, never a hand-resize of today's files. `MediaTile` is the product's own album tile (`components/app/media-grid.tsx`): the derivative belongs to the marketing stills (their call sites, or a prop only they pass), and the product's tiles render byte for byte as today. Measure the bytes before and after.
- **The 404's unused preloads:** "the 404 itself warns \"preloaded but not used\" four times a load (`marketing.css` and the home hero's, river's and backdrop's sheets): its header and footer links prefetch `/`, `/pricing`, `/login`, `/contact`, `/features` and `/help`, and the client preloads their sheets unused".
- **`--faint` read as body copy:** "An a11y pass on `--faint` (about 3:1 on the page and the mat): the sites that read as body copy move up a step." Measure each site's contrast; a caption that is decoration may stay.
- **One contract for the two forms:** "The careers form and `/contact` are two parallel copies of one contract (validation, limiter, insert, receipt): one contract, a honeypot named for nothing real (today `website`), and an end-to-end test for the actions (none exists)", and with it "the careers application form still ends on a toast and a bare drawn check (`careers/[slug]/application-form.tsx`); `contact-receipt.tsx` takes plain data and could serve both".
- **Each page's own FAQ:** "an `id=\"faq\"` on every FAQ band (the events template, `FeatureFaq`), so the footer's FAQ link meets each page's own questions, not only /pricing's (`OWN_FAQ_ROUTES`)".
- **A dynamic route's 404 title:** "A 404 reached through a dynamic marketing route (`/help/nope`) carries the bare `Partyreel` title while the root and paper 404s say Page not found." `stale-link` moved unknown help, blog, careers and events pages to the root's screen: check what stands.
- **The claim scan's reach:** "`src/lib/constants/events.ts` sits outside the content policy's claim scan" (`content-policy.test.ts`).
- **/pricing's rows:** "/pricing's table, /reel's clip table and pro-vs-event-pass each carry a clip-length row that reads 60 s on every plan now; it could fold into the mark's row", and "/pricing's Free card lists six lines to Pro's five, so the pair's balance wants a look". Prices and limits come from `src/lib/constants/tiers.ts` alone (never a number typed in a card); recommend the balance under Questions and build it.
- **The phone sheet's tracking:** "The phone sheet's foot actions (Log in, Start free, Dashboard) carry no `trackAttrs` while the header's do."

**What you leave alone:**
- **Will's desk** holds three marketing boards: `privacy-hero` (the /features/privacy hero), `about-press` (/about and the press kit) and `demo-framing` (the demo, its doors and the home hero's stream). Change nothing those boards draw or ask. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.
- **`strip-gaps`** (handed off, merging after you were cut) rewrote the location claim in `home/privacy.tsx`, `jsonld.tsx`, `content/llms.ts`, the blog's AUTHORING and five help articles. Leave those files to it.
- **The legal pages** (`legal-*`) are rewritten once before launch: no lane edits them.

**Verify:**
- the gate;
- each item's test red on today's code where one can hold it;
- on localhost at 1440 and 375: the bytes each still costs before and after, the 404's console clean, a sent form and its receipt (the contact topics and a careers role), the footer's FAQ link from an events page.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Two lanes run beside you, `export-ends` (the album download) and `lab-sitting` (the desk and the lab's kit): touch neither.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The /pricing pair's balance (built: five lines to five).** Free's list dropped "Verified-email uploads, on by
  default": every plan has it (the matrix's "Verified-email guests" row still says so), the rule `plan-cards.tsx`
  already used to take clip length off both lists. Free's two minuses now face the two Pro lines that lift them.
  Alternatives: fold it into "Every gate, verified emails and a custom link" (five lines, the fact kept on the card);
  or keep six, since no honest sixth Pro line exists (its storage is the slider and the stats).
- **The clip row's fold (built: one row, "60 seconds, small mark").** /pricing's matrix gives a clip one row, "Clips",
  each cell the length and the mark (`clipTermsFor`, from the clip creator's own `clipFactsForTier`), and /reel's table
  is Plan | Clips; the phrase is the help center's own (`pro-vs-event-pass.mdx` already reads "60 seconds, small mark",
  so that article needed no change). Alternative: the length once in the label ("Clips, up to 60 seconds") with the
  cells saying only the mark: tighter while the lengths match, a second shape the day they differ.

## System-doc edits (in place, owned facts only)

- `marketing-content.md`: the footer's FAQ link (`OWN_FAQ_ROUTES` now the events hub, every event and feature page,
  held both ways); the claims fence's reach (every constant but `CLAIM_EXEMPT_CONSTANTS`); the album page's stills
  (`stillVariants`, `variants`, `stillSizes`); /reel's clip table (`clipTermsFor`); the receipt (`NoteReceipt` and
  `useReceiptSwap`, both forms); Public forms (one contract, `submitPublicForm`, the `lantern` honeypot); the root 404's
  quiet prefetch (`QuietChromePrefetch`, `ChromeLink`).
- `design-system.md`: `--faint`'s four grounds measured, and the policy test that holds a sentence off it.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: every marketing page but the home preloads the home's three sheets (the hero's, the river's, the
  backdrop's) and never draws them, from the header logo's viewport prefetch of `/` (three "preloaded but not used"
  warnings a load on /pricing, /about and /help, measured on `next start`); prefetching `/` on intent would trade an
  instant home for them (from `mkt-polish`).
- Marketing: the faint step's informational captions (the plan and configurator stat labels, "We recommend",
  "Expected room" and its share, the size slider's ends) read 3.2:1 on paper and 2.9:1 on the mat, under AA's 4.5 for
  small text; captions by the design system's rule, so this pass left them, and a darker paper `--faint` would lift
  every one at once (from `mkt-polish`).
- Marketing: the press sheet's closing note (`press/press-sheet.tsx`, "Everything here is Partyreel artwork…") is a
  sentence in `--faint` (3.2:1 on the page); it moves up a step when about-press wires, its board being on the desk
  (from `mkt-polish`).
- Marketing: the Event Pass ticket's photo count wraps its "≈" onto a line of its own at 1440 (about 56px of text in
  the stat's cell) (from `mkt-polish`).

## Handoff (replaces the chat report)

- **Commits**, pushed to `lp/mkt-polish`: the work `d6f7160c`, the careers test's real listing `4d99efbc`, and this
  manifest. No sync: launch-prep moved by four record commits only (`docs/ROADMAP.md`, `docs/tracks/`), none in my
  reads or owns (Agent boot's sync rule).
- **Gate on `4d99efbc`**, each on its own exit code (`_scratch/mkt-polish/gate.txt` and `gate-*.log`): typecheck 0,
  lint 0, test 0 (702 files, 8,403 tests), build 0, `lab:smoke --base http://localhost:3133` 0 (146 checks, 0 failing).
- **Red on the old code**: the new tests copied onto a throwaway worktree at `7c51d429` fail 23 tests in 13 files,
  each at an assertion (`_scratch/mkt-polish/redcheck-summary.txt`); the 404 title's pin passes there by design.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 57 paths): owned paths and this file, plus the two
  system docs above and one exception: `src/lib/adopt-typed-value-policy.test.ts`, whose two honeypot exceptions
  (contact-form, application-form) became one (`forms/honeypot-field.tsx`), the field having moved there.
- **PREMISE** (lab:smoke): about-press (kit, facts) and demo-framing (slug, stage, touch), because
  `marketing-content.md` changed. Their asks still hold: no edit describes /about, /press or the home's first screen,
  and my changes reach their drawings only as `ChromeLink` (`next/link` itself outside the root 404), the phone menu
  foot's data attributes, the FAQ link's route table (a lab path still gets the home's) and `MediaTile` (unchanged
  without `variants`), so nothing they draw or ask moved; event-ready and privacy-hero likewise.
- **Stills at their size**: the album stage hands `MediaTile` each still's optimizer widths and a per-still `sizes`
  (`stillVariants`, `stillSizes`: ratio × the rows' target, held against the real rows engine at nine widths), and its
  ahead-of-arrival decode takes the same variants (11 of 11 arrivals landed `data-instant`). On `next start`, the
  stage's decoded pixels and wire (MB and KB in binary units; `_scratch/mkt-polish/album-before.txt` and
  `album-after.txt`), before → after:
  1440@1x 18.63 MB/843 KB → 3.42 MB/153 KB; 1440@2x 18.63 MB/843 KB → 9.31 MB/297 KB; 375@3x 12.45 MB/633 KB → 5.72
  MB/342 KB; a 900px still from 2.06 MB decoded (52 to 135 KB on the wire) to 0.38 MB at 1440@1x and 1.04 MB at @2x.
  Product tiles: five snapshots the untouched tile wrote matched the changed one
  (`media-grid-byte-for-byte.log`), then gave way to behavioural pins (no `srcset`, no `sizes`).
- **The 404's preloads**: 4 → 0 "preloaded but not used" at 1440 and 375 on `next start`, no route prefetched (was
  seven); Back home still navigates in place (same document). `not-found.site.test.tsx`.
- **`--faint` as copy**, each measured: the estimate's basis under the plans and under the album strip (3.22 → 7.04 on
  the page), the Pass's terms and Free's "No card" (3.22 → 7.04 on the card), the configurator's yearly price and
  alternative (3.22 → 7.04) and its size slider's only label (2.93 → 6.41 on the recess), the unlock tiles' line on
  Free (4.25 → 7.66 on the tile's wash). Captions, ordinals, icons and the room's footnotes at 4.50 stay.
  `faint-copy-policy.test.tsx`.
- **One contract**: `public-form.ts` (fields, `lantern` honeypot), `submitPublicForm`, `NoteReceipt` +
  `useReceiptSwap`; `public-form-submit.test.ts` drives both actions end to end (20 tests). The careers form ends on
  its receipt, waits for hydration and keeps its words when the Server Function rejects. Walked on `next start` at 1440
  and 375 by the honeypot path (nothing stored or sent): contact "Plans & billing" with its own answer, "Something
  else" with the help-center fallback and no greeting for "Dr Priya Nair"; careers "Graphics Engineer, Reel", the form's
  frame kept at 1440 (445px), Send another back on the name field. No real send: one writes production Supabase and
  mails the ops inbox from localhost, which a lane may not do on its own say.
- **Each page's own FAQ**: `id="faq"` on the events hub, the events template and `FeatureFaq`, `OWN_FAQ_ROUTES` (12)
  held both ways; on /events/weddings the footer's FAQ is `href="#faq"` in the HTML and lands on its own questions.
- **The dynamic 404's title**: already true since stale-link ("Page not found · Partyreel" on `/help/nope` and its
  kin, in dev and on `next start`, a load and a client push); now pinned.
- **The claim scan** reads every constant but `tiers.ts` (exempt with its reason), `events.ts` included.
- **/pricing's rows**: the clip fold and the pair's five to five (Questions).
- **The phone sheet**: Log in, Start free and Dashboard carry `cta_click` under `phone-menu` (the first two read live
  at 375, Dashboard by `mobile-menu.test.tsx`).
- Assets requested from Will: none.
- Board ideas: a darker paper `--faint` (one token lifting every caption past AA) instead of site-by-site moves.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the honeypot's name (`lantern`); the careers receipt's line (the page's own "we read every
  application"), its Send another and its onward link (/about, "Read our mission"); the 404's links prefetching
  nothing rather than on hover; the analytics location `phone-menu`; the stage's `sizes` at the rows' target, so a
  landscape stretched past it (369px at 1440) takes the 640w file at @2x, 0.87 of its pixels.
- Look at first: a real send of each form on the alias (the row in `/admin/support` and `/admin/applicants`, the ops
  mail), the careers receipt, /pricing's pair and its Clips row, and the 404's console.
