---
track: crumbs-36
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c72d0231"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/constants/tiers.ts
  - src/components/marketing/sections/pricing/pass-card.tsx
  - src/components/marketing/sections/pricing/plan-cards.tsx
  - src/components/marketing/sections/pricing/configurator.tsx
  - src/components/marketing/sections/pricing/comparison-table.tsx
  - src/lib/lifecycle/inactivity.ts
  - src/components/marketing/faq-data.ts
  - src/components/marketing/jsonld.tsx
  - src/components/marketing/mdx/spec-shared.tsx
  - src/components/marketing/sections/features/album/album-copy.ts
  - src/components/marketing/sections/features/privacy/media-lives.tsx
  - src/lib/content/llms.ts
  - src/lib/constants/events.ts
  - src/components/app/host-add-provider.tsx
  - src/components/app/host-upload.tsx
  - content/blog/family-reunion-photo-sharing.mdx
  - content/blog/group-trip-photo-sharing.mdx
  - src/components/admin/report-queue.tsx
  - src/lib/admin/reports.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/host-app.md
  - docs/systems/admin-observability.md
  - docs/systems/billing-caps.md
---

# lp/crumbs-36

**Goal.** Five ROADMAP lines tonight's lanes deferred: the pricing pages' counts through formatCount, one INACTIVE_MONTHS for its seven copies, HostAddProvider's Add scrolling to the panel it opens, two blog posts saying the Free plan's idle removal, and a dismissed child-abuse report's closed line saying whether it is still a live strike.

## The brief

Five lines the ROADMAP holds, each deferred tonight by `crumbs-33` or `crumbs-34` (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **Counts in the runtime's locale** (from `crumbs-33`): "`formatLimit` (`src/lib/constants/tiers.ts`, the pricing table's caps) and the pricing cards' photo and hour counts (`pass-card.tsx`, `plan-cards.tsx`, `configurator.tsx`, `comparison-table.tsx`, all `toLocaleString()`)". Route each through `formatCount`, the one pinned formatter (`src/lib/utils.ts`), so the server and a browser in another locale print the same digits. `tiers.ts` is the tier limits' one home under a parity test with `public.tier_limits()`: change how a number prints, never a number.
- **One `INACTIVE_MONTHS`** (from `crumbs-34`): seven copies of `Math.round(INACTIVE_DAYS / 30)` (`faq-data.ts`, `jsonld.tsx`, `spec-shared.tsx`, `album-copy.ts`, `media-lives.tsx`, `llms.ts`, `events.ts`) become one export beside `INACTIVE_DAYS` in `lifecycle/inactivity.ts`. No printed word moves.
- **The host's Add scrolling to the top** (from `crumbs-34`): "`HostAddProvider.openAdd` scrolls the page to the top ('the panel lives at the top, below the command strip') though the upload panel opens under the album's own header". It scrolls to the panel it opens (its one caller is the reel card's Add photos), and the two files' comments stop describing the retired command strip and floating Add pill. `crumbs-35` owns `event-gallery.tsx`, so take the target from `host-upload.tsx`'s own panel.
- **The blog's two keep lines** (from `crumbs-34`): `family-reunion-photo-sharing` ("no expiry clock on it and no countdown to a deletion") and `group-trip-photo-sharing` ("an event has no end date") say the rule with no word of the Free plan's idle removal. Each says the exception in the help's words, as the FAQ and the event pages now do (`docs/systems/marketing-content.md`'s ★ on "stays up").
- **A closed report's strike** (a board idea from `crumbs-33`): a dismissed child-abuse report's closed line says whether it is still a live strike and until when, read from `report_strikes` (the rule's one home; `readStrikes` in `src/lib/db/queries/reports.ts` reads it), so an operator reading past dismissals sees what each costs its address, and that its reopen takes it back. The address never shows.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, the pricing pages in a German-locale browser, the blog posts, and the Library's queue specimen.

The portal and the hub cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `privacy-hero` describes /features/privacy's hero, `about-press` /about and its press kit, and `demo-framing` the demo and its doors. `media-lives.tsx` sits on the privacy page: change no word there. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL. `crumbs-35` runs beside you on the hub's album header (`event-gallery.tsx`, `gallery-actions.tsx`, `bulk-bar.tsx`), the guest header, the dashboard's claims, `media-grid.tsx` and the portal's `admin-nav.tsx`: don't touch them.

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
