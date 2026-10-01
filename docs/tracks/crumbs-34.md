---
track: crumbs-34
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # added at boot, each with its why: the footer renders the FAQ link, the tests hold the lines above
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/chrome/footer-faq-link.tsx
  - src/components/marketing/chrome/footer-faq-link.test.tsx
  - src/components/marketing/faq-data.test.ts
  - src/lib/constants/events.test.ts
  - src/lib/constants/marketing-nav.test.ts
  - src/lib/content-policy.test.ts
  - src/lib/content/help-reading-order.test.ts
  - src/lib/content/help-product-doors.test.ts
  - src/lib/observability/sentry.test.ts
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

Each is built as recommended and listed again under Calls his to overrule.

1. **What true line closes `/events/<type>`?** The old close, "Your guests need nothing but their phones.", breaks on a Require-verified-emails event (the default for a new one): the guest also confirms an email. Recommended and built: "Free to start. No app required for your guests." (the ruled claim, `marketing-voice.ts`'s account rule). The other two worth drawing in words: "Free to start. Guests join with one scan." (the home close's register) and "Free to start. Guests need only a phone and an email." (the literal truth, longer).
2. **Should the footer's FAQ link always land on the page's own FAQ?** Built: it follows the page only where the page's FAQ is `id="faq"` (the home and /pricing), so `#faq` on /pricing and `/#faq` from every other page. Recommended, because the ROADMAP names only /pricing and a client island is the price of a pathname. The bigger answer is an `id="faq"` on every FAQ band (the events template, `FeatureFaq`) so the link always meets the page's own questions; it reaches feature pages this lane does not own.
3. **What shape quiets Sentry on localhost?** Recommended and built: it reports only where Vercel stamps a deployment (production and preview: `VERCEL_ENV` on the server and edge, `NEXT_PUBLIC_VERCEL_ENV` in the browser). The alternatives: a second Sentry project for development (one more service to own), or no DSN in `.env.local` (one machine's file, undone by any copy of it).

## System-doc edits (in place, owned facts only)

- `docs/systems/admin-observability.md` "Sentry": gated twice (the DSN, and a Vercel deployment, with the browser's marker), and the ★ that a Vercel project must expose its system environment variables or its browser goes quiet.
- `docs/systems/marketing-content.md`: the footer's FAQ link follows the page (`footer-faq-link.tsx`, `OWN_FAQ_ROUTES`); the claims list gains the "nothing but their phones" fence and the ★ that a line saying an event "stays up" carries the Free plan's idle removal; the /pricing bullet's "`shared-band.tsx` is dead" gives way to its `id="faq"`.
- `docs/systems/design-system.md` "The glass material": `lib/glass.ts` names the classes the product wears (its token table is gone).

## Deferred (ROADMAP one-liners, bucket named)

- Now, Housekeeping: one `INACTIVE_MONTHS` in `lifecycle/inactivity.ts` for the seven copies of `Math.round(INACTIVE_DAYS / 30)` (`spec-shared.tsx`, `jsonld.tsx`, `llms.ts`, `album-copy.ts`, `media-lives.tsx`, and this lane's `faq-data.ts` and `events.ts`).
- Now, Marketing: the blog's `family-reunion-photo-sharing` ("no expiry clock on it and no countdown to a deletion") and `group-trip-photo-sharing` ("an event has no end date") say the rule with no word of the Free plan's idle removal beside it (the first links to `event-album-no-expiry-date`, which carries the exception).
- Now, Host app: `HostAddProvider.openAdd` scrolls the page to the top ("the panel lives at the top, below the command strip") though the upload panel opens under the album's own header; the reel card's Add photos is its one caller, and `host-add-provider.tsx` and `host-upload.tsx` still describe the retired command strip and floating Add pill.

## Handoff (replaces the chat report)

- **Commits**, pushed to `origin/lp/crumbs-34`: `1e85ac4e` Sentry, `4d9f684b` dead files, `68cfe20b` the footer's FAQ link, `7922f94c` the keep lines and the event pages' close, `8d86a561` help, `c2cc4010` the pass article and the FAQ's pass answer, after `888ec434` (this manifest's claims); then this manifest. launch-prep moved once since the cut (`2888eba8`, STATUS.md and orchestrator.md only, none of my reads), so there is no sync commit.
- **Gates** on `c2cc4010` (this commit adds only this file), each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (679 files, 8,096 tests; 675 and 8,065 at the cut); `zsh scripts/build-lock.sh pnpm build` 0 (263 static pages, all 59 help articles prerendered); `pnpm lab:smoke` on dev 175 checks and `--production` on the build of `c2cc4010` 181 checks, 0 failing each (SCOPE all, because `.env.example` is a path the scope does not know); no `lab:demo` (no board). Logs in `_scratch/crumbs-34/`.
- **The PREMISE lines** named `about-press` (kit, facts) and `demo-framing` (slug, stage, touch) only because the crawl's scope read my edits to `docs/systems/marketing-content.md`, which both boards list in `lives`. Those edits are the footer FAQ link's line, two claims bullets and /pricing's bullet; none touches /about, the press kit, the demo's doors or the home hero's card, and no word of those pages or of /features/privacy's hero changed (`privacy-hero` was not named). Their asks are the kit's place on /about and its four facts, and the demo card's address, its typing stage and its touch: all still open on the pages production shows. The footer that `about-press` draws on /about keeps `/#faq` (its pathname is not /pricing).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path sits under `owns`, is this file, or is a `docs/systems/` file listed above, plus three one-line exceptions: `.env.example` (its Sentry comment said "blank makes Sentry a no-op everywhere"; a root file, which the manifest test refuses as an owns prefix), `src/app/(marketing)/(cinema)/pricing/page.tsx` (its comment about the deleted `shared-band.tsx`) and `src/app/globals.css` (the glass block's two comment lines that named `glass.ts`'s tokens and a test that holds nothing).
- **The items** (ROADMAP lines to retire: all but the two stale ones were closed here):
  1. Help-sync, billing: `upgrade-downgrade-or-cancel`, `what-the-free-plan-includes`, `what-happens-when-storage-fills-up`, `payments-receipts-and-invoices` and `your-dashboard-explained` (and `how-long-an-event-pass-lasts`, the same claim) name the Plan card's Upgrade or Change plan, the storage meter's Need more?, and Manage billing on both, against `account/page.tsx`, `storage-meter.tsx`, `user-menu.tsx` and `pricing-sheet.tsx` (`8d86a561`, `c2cc4010`); `pro-vs-event-pass` names no buying path (its one pricing mention is the comparison door), so it stays. `help-product-doors.test.ts` holds the doors (4 of its 6 tests fail on the old text).
  2. Help-sync, the guest door: already true at the cut (`b25d4595`): `a-photo-is-missing-from-the-album` "You're seeing the preview" names the email-first preview and the photo-first one, as `guest-flow.md` "Gallery access" has it (teaser gates `account` and `upload`). No change; the ROADMAP line is stale.
  3. Help-sync, the host app: `add-your-own-photos` (the album's own header, the panel under it, each file's progress and Retry) and `your-event-page-explained` (one View menu: Tile size, Sort, Filter with the Deleted lens) now match `event-gallery.tsx` and `host-upload.tsx`; the two profile articles had lost their Following-chip lines on 2026-09-23 (`f7abbdd2`), and the one claim still wrong in them (the account's Connections card counts who follows you, it does not list them) is fixed in `your-public-profile-following-and-blocking` (`8d86a561`).
  4. Help-sync, the order: `require-an-upload-to-view-explained` is order 3, the four after it moved down one, AUTHORING's map follows; `help-reading-order.test.ts` holds the map to the order fields and the photo-first article beside the email-first one (`8d86a561`).
  5. The dashboard article's breadcrumb: already gone at the cut (`f7abbdd2` replaced it with "Tap the Partyreel logo, top left ... on an album, the account menu has Dashboard", which `guest-account-menu.tsx` makes true); no change; the ROADMAP line is stale.
  6. The FAQ's keep answer: `faq-data.ts` says the Free plan's idle removal (about 6 months, a warning email, Deleted, 30 days, any activity resets the clock), the numbers from `INACTIVE_DAYS` and `RECENTLY_DELETED_WINDOW_DAYS`; `faq-data.test.ts` fails on the old answer (`7922f94c`).
  7. The event pages' memories: the four lines of `events.ts` (the weddings FAQ, the trips card and FAQ, the events hub's card) each carry the exception; `events.test.ts` "the event pages' keep lines" fails on the old text (`7922f94c`).
  8. The event pages' close: "Free to start. No app required for your guests." (Question 1); `content-policy.test.ts`'s no-account fence refuses "nothing but their phones" too (`7922f94c`).
  9. The footer's FAQ link: `faqHrefFrom` (`marketing-nav.ts`), `footer-faq-link.tsx` and their tests (`68cfe20b`); the prerendered HTML carries `href="#faq"` on /pricing and `/#faq` on every other page (curl of `next start`), and a real click on /pricing stays on `/pricing#faq` with the FAQ at the top of the viewport.
  10. Two dead files: `shared-band.tsx` deleted; `GLASS_TOKENS`, `GlassToken` and `NOT_GLASS` out of `glass.ts`, whose header, `globals.css`'s glass block and design-system.md follow (`4d9f684b`); typecheck, lint and the build prove nothing read them.
  11. Sentry on localhost: `isVercelDeployment` and `commonInit.enabled` (`sentry.ts`, `1e85ac4e`), 6 new tests in `sentry.test.ts` (3 fail on the old gate). End to end on this machine: a browser error and the lab's deliberate server crash (`/design/lab/tools/boom`) reached Sentry before the change (`environment=development`, JAVASCRIPT-NEXTJS-6G) and neither after; under a posed `VERCEL_ENV` and `NEXT_PUBLIC_VERCEL_ENV` both arrived as `environment=vercel-crumbs34probe` (-6H and -J); the browser SDK's own options read `enabled: false` with the DSN set on `next dev` and on a local `next start`. The probes left two resolved issues (commented) and `vercel-crumbs34probe`'s two events in the project; one alert email may have fired.
- **Assets requested from Will**: none.
- **Board ideas**: none beyond the Deferred lines and Question 2's bigger answer.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: no migration, Worker, Stripe or env value. Vercel, to check, not change: that `partyreel-admin` exposes system environment variables ("Automatically expose System Environment Variables"), since its browser now reads `NEXT_PUBLIC_VERCEL_ENV` (the main project's does: Sentry holds browser events tagged `vercel-preview` and `vercel-production`; this session's Vercel connection sees only the Personal team, so I could not read either project's setting). `NEXT_PUBLIC_SENTRY_DSN` can stay in `.env.local`: it no longer sends from there.
- **Calls his to overrule**:
  1. The event pages' close reads "Free to start. No app required for your guests." (Question 1).
  2. The footer's FAQ link follows the page only on /pricing (Question 2).
  3. Sentry reports only from a Vercel deployment, by marker (Question 3).
  4. `upgrade-downgrade-or-cancel`'s door under the short answer is "Open your plan" (`/account#plan`), not "See the plans" (`/pricing`): its readers manage a plan they have.
  5. The home FAQ's "What's an Event Pass?" says "covered for about a year", not "kept": a pass's end settles the account to Free and deletes nothing.
  6. Each keep line says the exception in full or in brief; the trips card's "Come back to it years later." went to make room for it.
  7. `how-long-an-event-pass-lasts` is fixed though outside the brief's five (same claim, in an owned directory); `pro-vs-event-pass` is left as is.
- **Look at first**: after the next alias build, (1) a deliberate browser error on the alias still reads `vercel-preview` in Sentry (and a server one), and `partyreel-admin`'s first browser error reads `vercel-production`, never `production`; (2) on /pricing the footer's FAQ link scrolls to the page's own questions and from /events/weddings goes to the home's; (3) the billing articles (`upgrade-downgrade-or-cancel` first) against a real signed-in session's Plan card and storage meter, and `your-event-page-explained` against a real event page's album header: the host app is behind sign-in, which localhost cannot drive, so my checks of those claims are against the source that draws them (`account/page.tsx`, `storage-meter.tsx`, `pricing-sheet.tsx`, `event-gallery.tsx`), pinned by `help-product-doors.test.ts`.
