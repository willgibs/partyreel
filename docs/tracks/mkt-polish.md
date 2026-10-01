---
track: mkt-polish
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "cf82f882"            # the launch-prep SHA the branch was cut from
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
