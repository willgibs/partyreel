---
track: crumbs-34
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "65dbedb2"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/
  - src/components/marketing/faq-data.ts
  - src/lib/constants/events.ts
  - src/app/(marketing)/(cinema)/events/[slug]/page.tsx
  - src/lib/constants/marketing-nav.ts
  - src/components/marketing/sections/pricing/shared-band.tsx
  - src/lib/glass.ts
  - src/lib/observability/sentry.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-34

**Goal.** Eleven ROADMAP items, every published claim made true of today's product: five help-sync lines, the FAQ's keep answer and the event pages' promises on the Free plan's inactivity removal and the email door, the footer's FAQ link, two dead files, and Sentry quiet on localhost.

## The brief

Eleven items the ROADMAP holds (each is its line there; find it by the words quoted). Each is a claim the site or the help center makes that the product no longer keeps, or a small hygiene line. Fix each where it lives, with a test that fails on today's text where a test can hold it (the help and content tests show the shapes):

- **Help-sync, billing**: five articles "say buying happens on the pricing page where the app opens its pricing sheet", and `your-dashboard-explained` "calls the storage bar's panel the only billing page while the account page's Plan card carries Manage billing too".
- **Help-sync, the guest door**: `a-photo-is-missing-from-the-album` gives the preview one cause (Require an upload to view is the second).
- **Help-sync, the host app**:
  - `add-your-own-photos` sends a host to buttons that moved (Add photos sits in the album's own header);
  - `your-event-page-explained` describes the old album control row;
  - two profile articles send a followed host's events to a Following chip the dashboard no longer has.
- **Help-sync, the order**: bump the privacy-and-safety articles after `require-verified-emails-explained`, so `require-an-upload-to-view-explained` sits beside it.
- **The dashboard article's breadcrumb**: `your-dashboard-explained.mdx` carries `<Path>Account menu › Dashboard</Path>`, and the account menu has no Dashboard item (the logo is the door).
- **The FAQ's keep answer**: `faq-data.ts`'s "How long do you keep my photos?" reconciles only the Event Pass exception. The Free plan's inactivity removal (the help guide's rule 7) is missing.
- **The event pages' memories**: `/events/weddings` and `/events/trips` still say "no expiry clock counting down" (`src/lib/constants/events.ts`, four lines), with no word of the Free plan's inactivity removal.
- **The event pages' close**: "Your guests need nothing but their phones." (`events/[slug]/page.tsx`) is a promise a Require-verified-emails event breaks. A true line is a working version, recommended in a Question.
- **The footer's FAQ link** is hard-coded `/#faq` (`marketing-nav.ts`), so on `/pricing` it leaves the page's own FAQ for the home's.
- **Two dead files**: `sections/pricing/shared-band.tsx` has no importer; `GLASS_TOKENS` and `NOT_GLASS` in `src/lib/glass.ts` are read by nothing.
- **Sentry on localhost**: a localhost run reports to the production project as `environment=development` (`commonInit`'s `enabled` is `Boolean(dsn)`). Enable it on Vercel only, or name a better shape. The red-teams read preview errors there, so the alias and production keep reporting.

The facts come from the product as it is (the code, `docs/systems/`), never from another article. Plain words, in the help's voice (`content/help/AUTHORING.md`). A new sentence is a working version, his to overrule.

**Verify:**
- the gate;
- each changed claim checked against the code that makes it true;
- the help and marketing pages render on localhost.

**Will's desk is up:** `about-press`, `demo-framing` and `privacy-hero` describe marketing pages (/about and the press kit, the demo and its doors, /features/privacy's hero). Change none of their words. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL. `crumbs-33` runs beside you on the reports portal, the account, `src/lib/utils.ts`, the album's rows and links and `ui/tooltip`: don't touch them.

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
