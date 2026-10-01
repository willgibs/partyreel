---
track: crumbs-36
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # Added by the lane (the brief: "your owns are a start"): each item's tests, and the closed line's own files
  # (the closed log is `report-review.tsx`, read by `queries/reports.ts`, specimen in the Library's compositions).
  - src/lib/test-utils/german-runtime.ts
  - src/lib/format/count.test.ts
  - src/lib/constants/tiers.test.ts
  - src/components/marketing/sections/pricing/plan-cards-contract.test.tsx
  - src/components/marketing/sections/pricing/pricing-counts.test.tsx
  - src/lib/lifecycle/inactivity.test.ts
  - src/components/marketing/faq-data.test.ts
  - src/lib/constants/events.test.ts
  - src/components/app/host-add-provider.test.tsx
  - src/lib/content/blog-keep-lines.test.ts
  - src/lib/admin/reports.test.ts
  - src/lib/db/queries/reports.ts
  - src/lib/db/queries/reports.test.ts
  - src/components/app/report-review.tsx
  - src/components/app/report-review.test.tsx
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  # A one-call exception, named in the Handoff: the root 404's first lazy wait (a gate flake under load, no lane's file).
  - src/app/not-found.lazy.test.tsx
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

Each is built as recommended and is Will's to overrule.

- **Where a closed report says its strike, and in what words.** The closed row stays one line; a dismissed child-abuse
  report carries one quiet line under it: "A strike on its address until <date> UTC; the address holds N of 3." (with
  "Undo takes it back." only while the dismissal is inside its reopen window), "Its strike lapsed <date> UTC.", or
  "Not a strike: it kept no address to count against." Recommended: as written, so every dismissed child-abuse
  report answers "is this still a strike?" in the queue's own register (UTC dates, counts, never the address).
- **The reopen window (30 days) is shorter than a strike's life (180).** A slip found on day 31 stays a strike for
  149 more days and nothing can take it back; the closed line now says so plainly. Recommended: leave both rules as
  they are (his call B and `closed=window`) and let the words be honest; whether a child-abuse dismissal's reopen
  should last as long as its strike is his, as a board idea below.
- **The host's Add scrolls to the panel with the least movement**, never to the top of the page: the upload panel is
  brought into view (`nearest`, clear of the app bar and the stuck cards band), smoothly unless the reader asked for
  reduced motion; a panel already open and in view does not move. Recommended: as built.
- **Where the two blog posts say the Free plan's idle removal.** Reunion: its closing keep sentence says the exception in
  the event pages' words, and the absolute "no expiry clock and no countdown to a deletion" goes. Trip: the closing
  "The album stays" bullet carries it (and "Nothing expires underneath it" goes), and the mid-post "an event has no
  end date" becomes a scope sentence, so no line of either post promises how long an album lasts without the
  exception beside it. Recommended: as built; `blog-keep-lines.test.ts` holds it for these two posts.

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`: the ★ on "stays up" (its holders now include the blog's reunion and trip posts,
  `blog-keep-lines.test.ts`, and the months are `INACTIVE_MONTHS`).
- `docs/systems/host-app.md`: the Host upload line (the album header's Add toggles the panel in place; the reel card's
  opens it and brings it into view, never the top).
- `docs/systems/admin-observability.md`: the instant hide's strikes line (a dismissed report's closed line says whether
  its strike still counts, until when, what its address holds, and its Undo only while it can be reopened).

## Deferred (ROADMAP one-liners, bucket named)

- Host app: `HostAddProvider`'s `uploadingCount` and `setUploadingCount`, and `HostUpload`'s `onUploadingCountChange`, have no reader since the floating Add pill retired; removing them takes `event-gallery.tsx`'s `onUploadingCountChange={add?.setUploadingCount}` (from crumbs-36).
- Housekeeping: the idle window's words typed by hand (the pricing table's "~6 months" cell and its tip, the pricing FAQ, the legal pages, the two sweep emails, the jobs catalog) are held to `INACTIVE_MONTHS` by no test, as `faq-data.test.ts` holds the FAQ's; a retune of `INACTIVE_DAYS` would leave them stale (from crumbs-36).
- Admin: `report_strikes` could answer the lapse as a duration beside `fresh_lapses_at`, so no reader derives it (`strikeLapseMs` rounds the distance to the minute, exact for an interval of whole days); a migration, so the Orchestrator's to open (from crumbs-36).
- Code hygiene: `utils.test.ts`'s inline German-runtime helper for dates and `lib/test-utils/german-runtime.ts`'s for numbers are one simulation twice (from crumbs-36).

## Handoff (replaces the chat report)

- **Commits**, all on `origin/lp/crumbs-36`: item 2 `d9d28c55`, item 1 `986de08b`, item 4 `db0a8e97` and `377aba19`, item 3
  `c20de5ed` and `eadaadfe` (comments), item 5 `f6da8e3e`, the named exception `4334261d`; the sync commit `e5813fb1`
  (merged `origin/launch-prep` at `c32222ab`, crumbs-35's merge and the records, no conflict; it had not moved again at
  the handoff). The head is in the chat line.
- **Gates on the synced tree at `eadaadfe`** (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-36/final-*.log`),
  each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (684 files, 8204 tests; the cut was 680 and
  8128); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (149 checks, 0
  failing). `pnpm lab:demo --base http://localhost:3132` for the three boards the change reached (about-press,
  disposable-mode, event-ready): 0 (15 steps, 0 failing), run at `4334261d`; `eadaadfe` changed two comments since.
- **Lane check**, `git diff --name-only origin/launch-prep...HEAD` = the owned paths, the three system docs listed above and this file, with one exception:
  `src/app/not-found.lazy.test.tsx` (`4334261d`, one call): its first `findByRole` waits for the site chrome's lazy chunk
  with findBy's default second, which alone takes about 0.5 s but in a full parallel run on this machine (four lanes, load
  14 to 16) took 1014 to 1019 ms and failed `pnpm test` in four runs of five (green alone, and with `--maxWorkers=6`); it
  now waits four seconds. Drop that commit if it is not wanted. `src/components/admin/report-queue.tsx` stayed untouched:
  the closed log is `report-review.tsx`, which the brief's owns did not name (added to `owns` with the files below it).
- **The items**, each red on the cut before its fix:
  1. Counts: `formatLimit` and `formatCapacity` (`tiers.ts`) and the ten bare `toLocaleString()` of the four pricing
     components are `formatCount`'s (`src/lib/format/count.ts`: the brief says `utils.ts`, where the date pin lives).
     Reds on the cut: `count.test.ts`'s scan (exactly the 11 calls), `tiers.test.ts` (`formatLimit(12_345)` read
     "12.345"), `pricing-counts.test.tsx` (4 of 5 drew "21.943"), all under `lib/test-utils/german-runtime.ts`. In a German
     browser (headless Chrome, CDP `Emulation.setLocaleOverride de-DE`, `_scratch/crumbs-36/cdp-pricing.mjs`) the cut
     drew "≈ 29.257", "≈ 21.943", "≈ 599.186" beside the table's "21,943" and logged React's "Hydration failed because
     the server rendered text didn't match the client"; this lane draws every count en-US with an empty console
     (`cdp-before-german.json`, `cdp-after.json`). No number moved: `tier-limits-parity.test.ts` stayed green untouched.
  2. `INACTIVE_MONTHS` beside `INACTIVE_DAYS`: the seven copies read it; `inactivity.test.ts` (2 reds: the export, and a scan
     that found exactly the seven) refuses any other division of the day count. No printed word moved: the FAQ, JSON-LD,
     the help's phrase, the album page, the privacy page, `llms.txt`, `llms-full.txt` and the event pages are
     byte-identical before and after (104,995 bytes each, `capture-before.json` against `capture-after.json`).
  3. The host's Add: `HostUpload` registers its box with the provider, `openAdd` brings that into view (`block: "nearest"`,
     smooth unless reduced motion, `scroll-mt-52 scroll-mb-4` clearing the app bar and the stuck band), never `scrollTo` 0;
     the album header's Add still toggles in place. `host-add-provider.test.tsx` (5 of 7 red). Measured on
     localhost:3132 at `/design/album-scale?surface=host&n=300&key=fiesta` (the hub's own album, no cards row there) with a
     700 px spacer and a 114 px stand-in for the sticky stack: from scrollY 6000 the root lands at 208 px, the panel box at
     159 px (119 px at 375, intro clear); a panel in view does not move; one below the fold moves until its bottom is 16 px
     above it. Both files' comments no longer name the command strip or the floating Add pill.
  4. The blog: reunion's closing paragraph and trip's closing bullet say the Free plan's one exception in the event pages'
     words (the months and the restore window from the spec inlines); "no expiry clock", "no countdown to a deletion" and
     "Nothing expires underneath it" are gone and the trip's mid-post line is a scope sentence ("however many days that
     takes"). `blog-keep-lines.test.ts` compiles both posts through the real component map (4 of 5 red). Read on
     localhost:3132 at both posts.
  5. The closed line's strike: a dismissed child-abuse report says, under its one-line row, "A strike on its address until
     <date> UTC; the address holds N of 3." (barred: "holds 3 strikes, so its reports don't hide right away until <date>"),
     "Its strike lapsed <date> UTC.", or "Not a strike: it kept no address to count against."; "Undo takes it back." only
     while `wayBack` is "reopen". `listReports` asks `report_strikes` once and attaches a `ClosedStrike` (no address or
     hash leaves the server; until the function stands, no line, never "no strike"); the lapse is read off the answer's
     `fresh_lapses_at` to the minute, never a copy of 180. Reds on the cut: `reports.test.ts` (10), `queries/reports.test.ts`
     (4), `report-review.test.tsx` (4). Live, read-only: `report_strikes` answers `fresh_lapses_at = now() + 180 days`
     exactly (Supabase MCP), and the real `listReports("dismissed", 200)` against the real database drew 8 live lines (the
     8 dismissed child-abuse reports, every `at` = `resolved_at` + 180 days, one address holding 6, SQL's own maximum) and no
     hash. The Library's closed log draws each state (`/design/library/compositions`, dark and light, 1440 and 375).
- **PREMISE** (the lab crawl names four boards; why their asks still hold): `about-press` (kit, facts) and `demo-framing`
  (slug, stage, touch) describe `marketing-content.md`, where this lane refined one line about which pages carry the idle
  exception (it adds the blog's two posts), none of their asks; `disposable-mode` (camera ... save) describes `tiers.ts`,
  where only how a count prints changed (`formatCapacity` is byte-identical in one locale, no limit or price moved, the
  parity test is untouched); `event-ready` (list, guide, create, needs, door) describes `host-app.md`, where one line about
  the album's Add panel changed, and its asks are the launch list, Settings, Create, What needs you and the code.
- **For the next build's red-team** (the hub and the portal cannot run signed in on localhost):
  - Hub, an event with fewer than two playable photos (the reel card is counting, `LIVE_REEL_MINIMUM` is 2; its popover
    holds the only caller), at 375x667 and 1440: (a) at the top, press the reel card, then Add photos: the panel comes
    into view with its dropzone whole and the page is not thrown to the top; (b) scroll down the page until the panel is
    above the fold, press again: the page scrolls up and the panel's top lands under the stuck band, its intro line clear
    (not y 0); (c) with the panel open and in view, press it again: nothing moves; (d) with the OS's reduced motion on,
    the move is instant; (e) the album header's own Add photos opens and closes the panel and never moves the page.
  - Portal, as the admin on `/admin/reports?status=dismissed` (disposable test reports only): file a child-abuse report
    from a confirmed address, Dismiss it: its closed line says "A strike on its address until <resolved + 180 days> UTC;
    the address holds 1 of 3. Undo takes it back."; press Undo: the report reopens and its line is gone, and the same
    address's open card reads "no strikes" again; Dismiss three from one address: the line says "holds 3 strikes, so its
    reports don't hide right away until ...", matching `select public.report_strikes(array['<hash>'])` (a read-only call);
    a child-abuse report filed without confirming an address, dismissed, says "Not a strike: it kept no address to
    count against." At 375 each line is the row plus its caption, no horizontal scroll.
- **Assets requested from Will**: none.
- **Board ideas**: a dismissal can be reopened for 30 days (`closed=window`) but its strike lives 180 (his call B): a slip
  found on day 31 stays a strike for 149 more days with nothing to take it back, and the closed line now says so; whether a
  child-abuse dismissal's reopen should last as long as its strike is his.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the four Questions above (the strike line's placement and words; the reopen window left at
  30 days; the Add scroll's policy; the two posts' wording); the closed log now needs `report_strikes` like the open
  queue (any failure but "function absent" errors the Dismissed, Actioned and All views, as the open queue's does, rather
  than hiding the strike lines); `formatCapacity` also moved onto `formatCount` (same bytes out); the 404 test's
  four-second wait.
- **Look at first**: `/pricing` in a German-locale browser (the stat rows, the Event Pass ticket, Find your size, the
  table's Holds about row), then `/design/library/compositions` (the Reports queue specimen's Closed log), then the
  two posts' last paragraphs (`/blog/family-reunion-photo-sharing`, `/blog/group-trip-photo-sharing`).

## Where I am

All five items are done, gated and handed off (above); nothing is in progress. A successor has only to integrate: merge
`lp/crumbs-36` (the sync with `origin/launch-prep` at `c32222ab` is already in), run the merge gate (the machine's load
decides whether `pnpm test` needs `--maxWorkers=6`; the one flake this lane met is hardened in `4334261d`), and delete
this manifest in the merge commit.
