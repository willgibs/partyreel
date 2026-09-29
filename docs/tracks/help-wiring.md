---
track: help-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e385f61"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(marketing)/(cinema)/help/
  - src/components/marketing/help/
  - src/components/marketing/chrome/
  - src/components/guest/upload/failure-sheet
  - supabase/migrations/20260928150000_article_feedback.sql
  - src/app/admin/help-feedback/
  - src/app/(dev)/design/sandbox/help-center/
  - src/components/guest/upload-tracker
  - src/components/guest/guest-name-menu
  - src/components/guest/guest-account-menu
  - src/components/app/user-menu
  - src/components/marketing/mdx/spec-help.tsx
  - src/components/marketing/mdx/spec-shared.tsx
  - src/lib/content/help
  - content/help/AUTHORING.md
  - content/help/how-guests-join-and-upload.mdx
  - content/help/how-partyreel-works.mdx
  - content/help/print-or-display-your-qr.mdx
  - content/help/play-the-reel-on-a-screen.mdx
  - content/help/why-an-event-asks-for-your-email.mdx
  - content/help/the-email-code-didnt-arrive.mdx
  - content/help/a-clip-wont-finish-or-save.mdx
  - content/help/a-photo-is-missing-from-the-album.mdx
  - content/help/a-video-wont-play.mdx
  - content/help/an-upload-wont-finish.mdx
  - content/help/messages-guests-might-see.mdx
  - content/help/you-cant-sign-in.mdx
  - content/help/the-qr-wont-scan-or-the-link-wont-open.mdx
  - src/app/api/help/
  - src/lib/validation/help-feedback
  - src/lib/db/mutations/article-feedback
  - src/lib/db/queries/article-feedback
  - src/lib/db/queries/jobs
  - src/app/admin/jobs/
  - src/lib/admin/nav
  - src/lib/security/abuse-rate-limit.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/help-center.json
  - docs/systems/marketing-content.md
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
---

# lp/help-wiring

**Goal.** Build Will's seven `help-center` answers: a host-first help hero whose quick questions drop from the search, the ten doors, illustrated steps, help links where trouble happens plus a standing entry in the menu, recorded article feedback visible in admin, working dead ends, and the search reachable from the header and footer; then retire help-center.

## The brief

**His answers** (`docs/reviews/help-center.json`, each note there; the drawings in `src/app/(dev)/design/sandbox/help-center/`):
- `who-first=host`: the heading and search speak to hosts; guests get one quiet line. His note: "Our entire platform is paid for by hosts, not guests ... Guests are smart enough to find the content they're looking for."
- `hub=strip`: keep the ten doors across the hero's edge, then Start here, the numbers, the index. His note: "remove the preset questions below the input. Instead, when the input is selected, those can drop down as quick options."
- `article=screen`: each step keeps a small illustration of the surface it describes, beside its sentence (drawn from production's own components, as the board did).
- `from-product=contextual`: the failure sheet and a refused photo's row in her uploads each link to the article that answers them. His note: "Let's also include the help center entry in the menu too. That way it's globally accessible for general questions as well." So a Help row in the guest's name menu and the host's account menu, too.
- `feedback=beacon`: one insert per click, visible only in admin; the reader sees the same thank-you or sorry.
  - A table with RLS, `anon` with no table access, and one insert path that is rate-limited and cannot be read back. Write the migration; the Orchestrator applies it.
  - An admin view with its health signal (`/admin/help-feedback`: counts per article, newest first). A backend write ships its admin surface in the same change.
- `dead-end=rung`: a troubleshooting article ends with a link back to the calm, working version of the same act.
- `search=visible`: the header's Resources panel and the footer's Resources column each gain a plain Search row opening the help palette. His note: "admin can create its own component version of the command palette if helpful ... this help palette should have zero conflicts with where they get used (admin vs main platform)." The help palette never mounts in the admin portal.

**Paths:** `voice-wiring` has merged, so the refused row (`src/components/guest/upload-tracker.tsx`; its words are `TRACKER_WORDS` in `src/lib/guest/upload-tracker.ts`, a read) and the guest's name menu are yours. The host's account menu (`src/components/app/user-menu.tsx`) already carries a "Help center" row: keep one, in the menu's own grammar. `hero-wiring` runs beside you and may need `src/components/marketing/chrome/mega-panel.tsx` if the demo's frame changes signature; if it asks, the Orchestrator settles it. Add any other path to `owns` before editing it.

**Then retire `help-center`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Verify:**
- Vitest for the feedback path (the insert, the rate limit, no read-back) and the palette's mounts.
- A rolled-back SQL check on the table's grants.
- The help at 1440 and 375.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where the quick questions drop from the field.** Built: pressing /help's field opens the palette ON the field (its
  input where the field was, the four Suggested questions dropping beneath: `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/hub-1440-open.png`) at a desk with a
  pointer only (`(min-width: 40rem) and (pointer: fine)`, `dropFrom` in `help-palette.tsx`). A touch screen keeps the
  top placement, since its keyboard rises over the lower half and a list dropped from mid-screen would open under it
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/hub-375-open.png`); so do ⌘K, the article's pill, a Search row with the field out of view, and an arrival from
  another page (the hero is still rising then, and a dropped panel landed 12px off it: measured). Recommended: keep.
- **The quick questions themselves.** Built as the board drew `who-first=host`: the host-voiced heading and search, the
  one quiet guest line, and `HELP_QUICK_LINKS` unchanged, one of the four still guest-voiced ("Why is it asking for my
  email?"), now only the palette's Suggested list on /help (and still chips on /contact, another board's page).
  Recommended: keep as drawn; the alternative is swapping the guest question for a host one ("Can I approve photos
  first?", to review-uploads-before-they-appear).
- **Which how-tos took screens.** Built: every step of the six this lane holds (29 steps, and the guest how-to's closing
  keep beside its callout); `report-a-problem-as-a-guest` is triage-wiring's this round, so it waits by name in
  `STEPS_WITHOUT_SCREENS` (a Deferred line). A step that describes a surface outside the product is drawn without a
  product word it does not say: the mail app's subject and preview are bars (the auth email's template lives in the
  Supabase dashboard, not the repo), the code's size and contrast are two drawings, the laptop wired to the room's screen
  one. The email-code fix's four code-screen steps show that one screen with the part each step names picked out.
  Recommended: keep.
- **The beacon's limits.** Built: `help_feedback` scoped to (IP, article), 10 an hour a scope (a host who sends the
  whole party to one article puts a crowd behind one WiFi), 40 distinct articles an hour from one address (stuffing);
  fails CLOSED like the public forms. No per-device "already answered" memory: a reload asks again, and the limiter
  bounds it. Recommended: keep.
- **The admin surface's shape.** Built: `/admin/help-feedback` under Watching (a reading, not an inbox): all-time Yes
  and No per article with the last click, newest first, a row where No outnumbers Yes tinted; the signal's 24h recorded
  and dropped above it. No per-click list and no window. Recommended: keep; a last-30-days window is the next step
  once the counts grow (a Deferred line).

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md` (a reads doc; these are this lane's facts): the Resources group's Search row; the
  troubleshooting `rung`; ★ the help palette's two mounts and its doorbell (a query, never a hash); the field's drop;
  ★ every step's screen (phone documents, zoomed desk pictures, quoted words held to their files); the beacon.
- `docs/systems/admin-observability.md` (a reads doc): the beacon among the `signal` kind's examples; a short "Help
  feedback" section for `/admin/help-feedback` and the signal's two halves.
- `docs/systems/database-security.md` (a reads doc): the advisor count 16 to 17 `rls_enabled_no_policy` (true once the
  migration is applied); `article_feedback` among the deny-all tables and `article_feedback_summary` among the
  service-role-only; the beacon's limiter failing closed beside the public forms'.

## Deferred (ROADMAP one-liners, bucket named)

- Help: `report-a-problem-as-a-guest`'s three steps take screens once triage-wiring's article merges (the report sheet
  opening, its reason box, its sent line), and its name leaves `STEPS_WITHOUT_SCREENS` (from `help-wiring`).
- Help: the four email-code screens quote `AccountDoor`'s post-send code view as markup, since no prop reaches it; an
  exported code view would make them the real piece (from `help-wiring`).
- Admin: `/admin/help-feedback` could take a last-30-days window beside all time once the counts grow (from
  `help-wiring`).
- Help: the hero field's `⌘K` chip shows on a phone, which has no ⌘K; hide it on a coarse pointer (from `help-wiring`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/help-wiring`:** owns `6dba1a27`; the beacon `cf4927e8`; the hub and search `42956476`; the
  doors from the product `f0290aac`; the rung `4c16e047`; the screens `0fa13851`; the retirement `7a05d6c9` (one commit:
  the folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`); the system docs `ed59ebd8`; one sync, a
  merge, `34f088b4` (at `7724e5bd`, after hero-wiring merged into `marketing-content.md`, a read, and the three lab
  registration files; everything auto-merged, both retirements hold); one fix after it, `f55d4ab1` (a phone screen's
  stylesheet watcher lets go of the blank document its `srcdoc` replaces); this handoff commit on top.
- **Gates on the synced tree, sha `f55d4ab1`, each on its own exit code:** `pnpm typecheck` 0
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/final-typecheck.log`); `pnpm lint` 0, 4 warnings, none in a file this lane touched (`review-session.tsx`,
  `contact-form.tsx`, `album-fill-grid.tsx`: `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/final-lint.log`); `pnpm test` 0, 540 files / 6094 tests
  (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/final-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/final-build.log`);
  `pnpm lab:smoke --base http://localhost:3134` 196 checks, 0 failing (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/final-smoke.log`). The same five ran green
  on the sync `34f088b4` (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/sync-*.log`) and before it on `7a05d6c9` plus the docs (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/gate-*.log`: 6079 tests,
  197 checks). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths and this file, plus the named
  exceptions: `registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts` (the retirement, named by the brief) and the
  three system docs above.
- **The migration** `supabase/migrations/20260928150000_article_feedback.sql`, proved rolled back on the live schema in
  one `execute_sql` call, 28/28 (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/proof-result.txt`): RLS on with no policy; no table or column privilege for `anon`
  or `authenticated`, reads included; the summary invoker, `search_path ''`, EXECUTE for the service role alone; each
  client role's select, insert, update, delete and summary actually refused (42501); the service role's four clicks
  summarized newest first with the right counts; the CHECK refusing eight bad slugs and taking a real one. After:
  neither object exists live.
- **Items:**
  - `who-first=host` / `hub=strip`: the chips under /help's field are gone, the four questions drop from the field at a
    desk, the ten doors, Start here, the numbers and the index as they were (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/hub-1440.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/hub-375.png`).
  - `article=screen`: a `screen` slot on the shared `Step` and `Callout`; 30 screens on six how-tos
    (`help/step-screens/`: 14 phone documents, the door's own pieces plus a camera and a mail app drawn; 13 desk
    pictures, six of them the walkthrough's own), a test failing any step without one (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/join-1440-a.png` to `-d`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/loop-1440-a.png`,
    `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/print-1440-a.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/reel-1440-a.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/email-1440-a.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/code-1440-a.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/join-375-a.png`,
    `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/loop-375-a.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/keep-375.png`; the production build's documents `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/prod-join.png`).
  - `from-product=contextual`: "Still not going? What stops an upload" on the failure list (the album's sheet and the
    door's in-step view), "Why?" on a refused row, both new tabs (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/failure-375.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/tracker-375.png`,
    `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/tracker-1440.png`); a Help center row in both guest menus, the host's kept at one.
  - `feedback=beacon`: the migration; `POST /api/help/feedback` (JSON only, a published slug only, the limiter failing
    closed, a bare status); the fire-and-forget click; `/admin/help-feedback` with its NAV entry and the
    `help_feedback` signal on `/admin/jobs`, the band and the bell. Both runtime readers of the catalog trace
    `content/help` whole (`.next/server/app/api/help/feedback/route.js.nft.json` and the admin page's: 60 entries), so
    no `outputFileTracingIncludes`.
  - `dead-end=rung`: "Working now?" on all eight fixes, from their frontmatter (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/rung-1440.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/rung-375.png`).
  - `search=visible`: Search rows in the header's Resources panel, the phone menu and the footer, ringing the palette in
    place on /help and /contact and opening it at /help from anywhere else (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/search-panel-open.png`,
    `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/footer-1440.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/menu-375-resources.png`, `/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/search-footer-from-pricing.png`); never in the admin
    portal (`help-palette-mounts.test.tsx`).
- **Assets requested from Will:** none.
- **Board ideas:** /contact's chips under its search (its board's page) could take /help's drop-from-the-field
  treatment, the palette already drops there (`/Users/gibby/local/ai/partyreel-wt/_scratch/help-wiring/contact-drop.png`).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** apply `20260928150000_article_feedback.sql` before
  any build carrying this code reaches a host: unapplied, `getJobSignals` cannot count the table, so every admin page's
  band reads "the backend heartbeat could not be read", and the beacon answers 503 (readers still see their thank-you).
  Advisors after: `rls_enabled_no_policy` 17 (was 16), 0028 and 0029 unchanged. Regenerate `types.ts`, then drop the
  three untyped seams (`db/mutations/article-feedback.ts`, `db/queries/article-feedback.ts`, the one count in
  `db/queries/jobs.ts`). No Worker, Vercel, Stripe or env change.
- **The live red-team (after the apply, on the alias):** a Yes and a No on one article land as two rows and show on
  `/admin/help-feedback` newest first; the eleventh click in an hour on one article from one address answers 429; with
  the anon key, `GET /rest/v1/article_feedback` and `POST /rest/v1/rpc/article_feedback_summary` are refused; a
  `text/plain` post answers 415; the three Search rows from /pricing land on /help with the palette open; a real failed
  upload's sheet and a refused photo's row carry their links; the menus' Help rows open a new tab.
- **Calls his to overrule:**
  - The `screen` slot sits on the SHARED `Step` and `Callout` (the board's own note: "a real fix belongs in
    `spec-shared.tsx` at integration"), not help-only twins in `spec-help.tsx`.
  - Arrivals use `/help?search`, not the drawn hash (a hash naming no element scrolled the arriving page).
  - The Search row says "Search" with a magnifier in all three places, as drawn; the panel's sits under a hairline in
    the Features footnote's grammar.
  - The name-only guest's Help row sits directly under Log in with no separator, as drawn; the signed-in guest's after
    Theme; all open a new tab like the host's.
  - The failure line lives in the list both failure views render, so the door's in-step view carries it too.
  - The rungs, each "Working now?" then: sign-in to "See how signing in works"; the email code to "See how the email code
    should go"; an upload to "See what a smooth upload looks like"; a missing photo to "See how the album fills"; the
    messages to "See how joining an event goes"; a code that won't scan, host-first, to "See how to print a code that
    scans"; a video to "See how the album plays a video"; a clip to "See how making a clip goes".
  - The picked-out part of a screen is an amber ring (`Mark`), the one highlight the pictures use.
- **Look at first:** /help (press the field), `/help/how-guests-join-and-upload` (the steps), `/help/an-upload-wont-finish`
  (the rung, then Yes), the footer's Search from /pricing, and `/admin/help-feedback` once applied.
