---
track: orchestrator
status: open
cut: "94d66338"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "claims lent to test-slim (2026-10-06): bible.ts, bible.test.ts, src/lib/design-gate/ and src/app/api/design-gate/ leave this owns for test-slim (tests only) and return at its merge"
  - "kit fix at launch-prep (2026-10-04): `integrate.sh` passes the lane's sha whole and `merge-lane.sh` compares heads whole (git's short form grew to 9 characters, so comparing short forms refused every lane); `negative.sh`'s check 2 reworded. A lane editing `usher/kit/` syncs before touching those three."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

Round 15 continues (2026-10-05, evening), seated on willg97. Milestone 37 is live (`b67cdc1f2`). Since then
launch-prep holds thirteen merged lanes (album-order the latest, gate 21) and three applied migrations (billing_integrity, cloud_export_fixes,
roll_size_range) for milestone 38, plus the Orchestrator's StrictMode tile fix (`d6bfc64a0`). Desks 3 and 4 are
answered and transcribed; his desk (`localhost:3000`, launch-prep `5104a5d05`) holds no open ask until desk 5 lands.
Lanes merged before milestone 37 left this table: their summaries are their merge commits (`git log`).

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `brand-r1` | board brand r1 (desk 4 alone): Afterglow (recommended), Contact Sheet, Everyone's Color, as 14-slide decks at a desk and on a phone | MERGED at `30f790d1f` (gate 14 green), served as desk 4; its nine Higgsfield asks go to ASSETS.md for the picked vision; pruned | Opus (gone) | `aab7f784008cbcfeb` |
| `drive-rewalk` | Drive's re-walk on the desk (`5104a5d05`) after drive-fixes, the seven watches | DONE: 6 PASS (a send's check runs before done: a `check` lease and every `confirmed_at`; a kept re-send counts once; Cancel says what landed, 25 of 60; Disconnect forgets every id on 188 items; the promise's three photographs; the Worker log clean but three lines) and /admin/jobs NOT DRIVEN (the catalog's every fifteen minutes read in code); no HIGH or MEDIUM; LOWs: Google's Drive box starts unticked (the promise could name it), two Partyreel folders after a reconnect (a ROADMAP line); NITs to crumbs-82; test albums deleted; P3's grant revoked; ledger `../partyreel-wt/_scratch/drive-rewalk/ledger.txt`; the local Worker stopped | Opus, Will's Chrome | `a623313be9e7d1503` |
| `drive-fixes` | the Drive walk's findings before the Worker deploys | MERGED at `28a0b8e73` (gate 16 green); migration `cloud_export_fixes` APPLIED (20261005193047, md5 8ff68cd5 = the file's; the Advisor's Q35: APPLY; advisors 26/4/36); types and `recordLaneFailed`'s seam at `eecf67ef6`; the sweep every fifteen minutes at the Worker's deploy; NEXT: the desk re-walk (the Handoff's seven watches; P3's consent, Will's yes), then the Worker deploys with milestone 38 (never against milestone 37's build); pruned | Opus, 3131 | `ac344602a4d093794` |
| `billing-integrity` | money and the meter tell one truth: the pass-to-Pro credit once ever, a replay never consuming a later pass, the recompute one SQL under the profiles lock, the upload advisories on the completes' predicate, each allowance refusal's true words | MERGED at `87b7e69fd` (gate 13 green); migration `billing_integrity` APPLIED (20261005191959, md5 b20b0090 = the file's; the Advisor's Q33: APPLY; advisors 26/4/36); types regenerated and `creditDb` dropped (`78d1ffd47`); the Advisor's three after-steps: (a) overlap answers busy while the other claim is only leased, (b) an /admin/accounts line from `pass_credits`, (c) milestone 38 soon (milestone 37's build re-grants past a day); (a), (b) and two of its Deferred lines to credit-watch; pruned | Opus, 3132 | `ac63625bc3241384d` |
| `durability-restore` | the backup's lone copies loud at their source (Sentry, the ops mail), counted across a pass, and restored on their own (only keys a live row names, never over a present object, `RESTORE_MODE` dryrun, the card and its AAL2 Restore now) | MERGED at `d2a05e70f` (gate 12 green); no migration; the `partyreel-backup` Worker deploys at milestone 38 (code at `3d4696626`, `RESTORE_MODE` dryrun, `workers_dev` true), then `BACKUP_WORKER_URL` (non-sensitive, its workers.dev origin) on partyreel-admin; its two Deferred lines (the reconcile's cursor: a HEAD per object, 715 s over 3,419 and today's run cut at 15 minutes, its card Overdue; lone copies younger than the prune's 36-day gate unseen) are backup-reconcile's; pruned | Opus, 3133 | `a8f62e4da88eff099` |
| `crumbs-81` | a sealed album's Guests room tells of waiting shots, the admin login's legal links and manifest, a Settings write that throws settles as a refusal, Settings' head described, the guest menu's Your profile | MERGED at `1438d017e` (gate 11 green; PREMISE on customize and event-header re-read: their asks stand); test data: "crumbs-81 sealed (disposable)" on willg97, to delete through Settings; pruned | Sonnet, 3134 | `a26a051b9eef9cd0d` |
| `back-layers` | Back peels one layer a press and keys act on the top layer: the viewer's arrows under a layer, Back over a confirm, a reload's stranded marker, the camera's shots | MERGED at `7be83a1b4` (gate 17 green); its host-only walks (Remove over the viewer, the credit's look and Block, the claims review's confirm, Settings' confirms) for the desk; test data: one guest photo `abca8336` on "crumbs-76 free (disposable)" and "Back-layers walk" guest rows on the two crumbs-76 albums; pruned | Opus, 3135 | `aba2db9cfc7819b71` |
| `pricing-doors` | a signed-out Get Pro returns to /pricing after sign-in, Back from Stripe in one press, checkout and manage-billing behind PricingDoors' verbs | MERGED at `9e5c0681f` (gate 15 green); its finding beside the lane DONE by the Orchestrator: TEST's change-plan portal configuration `bpc_1UIhooPtjqmVkBwkcLe9YgYN` now lists the current three products and six prices (the LIVE one at the cutover, PRICING.md); pruned | Sonnet, 3136 | `a4375fab0a2949568` |
| `backup-reconcile` | the backup reconciles again: a listing merge (715 s to 2.4 s on 3,419; 100,000 in 57.5 s), resumable, the young lone copies restored, loud at its source | MERGED at `dbd049dae` (gate 18 green); deploys with `partyreel-backup` at milestone 38 (no wrangler change); its dry run found two backup copies carrying pre-backfill EXIF (Waiting on Will: delete them); pruned | Opus, 3131 | `a988b2c397a301df7` |
| `settings-wiring` | customize r1's Settings half: the roll's film boxes and a full-width 1-to-99 stepper, her roll kept across a style switch, Settings' first screen as live words over focused pages; mine=account, take-home and taken NOT built | MERGED at `1bd318dfe` (gate 19 green); migration `roll_size_range` APPLIED (20261005205744, md5 1cdf6e02 = the file's; the Advisor's Q36: APPLY; advisors 26/4/36; no types); its board ideas (the reel's page: what each hold feels like; Create at a laptop) for customize's next round; pruned | Opus, 3132 | `aa99ad6c35dbc02eb` |
| `album-order` | customize r1's album half: the turn (newest while on, in order from the morning after its last day or its develop) as presentation over the same wire, the guest's Newest/Oldest and Photos/Videos/Yours, the arrivals pill, the edge cases by test | MERGED at `9f400ed6d` (gate 21 green); its host-app.md and design-system.md lines landed at the record; `takenAtOf` (album-order.ts) handed to capture-time, which carries `captured_at`; for the desk: the hub's pill signed in (under the header and the stuck band at 1440 and 375, its press, Oldest first); test data: one photo by "Pill adder" on "crumbs-76 free (disposable)"; pruned | Opus, 3133 | `a3fa5640805863f7b` |
| `identity-r5` | board identity r5 (desk 10, desk 5): the atoms as three whole sets on real screens (keys and wells, the house mix recommended, ink and tone) under halo, shrink and the floating edge; working as three densities of one arc | MERGED at `b4e4c0644` (gate 24 green on its test rerun: the first run's one red was `storage-list.test.tsx`'s one-second first render timing out while event-zone's build held nine cores; it passes on a quiet machine, and crumbs-83 takes the wait); served with desk 5; its accessibility and wiring lines to ROADMAP, the door's one light for desk 6; pruned | Opus, 3134 | `aac5d7e798dfb013c` |
| `event-header-r5` | board event-header r5 (desk 20, desk 5): three polished takes on the picked cards doors in Afterglow's language (keys, seam recommended, points), both grounds live in every frame, a tablet screen | MERGED at `db3de9be5` (gate 27 green); served with desk 5; captures kept at `../partyreel-wt/_scratch/desk/captures/event-header-r5/`; its voice and tab-bar board ideas for the next round; pruned | Opus, 3135 | `afb9456e0c2d57b85` |
| `event-header-wiring` | the hub's doors as picked: the cards over the seam, folding into pills when stuck; the Guests card's developing shots; its doc lines landed by the Orchestrator | MERGED at `3566afe5c` (gate 20 green); host-app.md, reel.md and disposable-mode.md lines landed at the record; its signed-in walk for the desk (each door pressed, the fold at 1440 and 375, a reversal mid-fold, a throttled load); pruned | Sonnet, 3136 | `abfa1873f50527623` |
| `brand-r2` | board brand r2 (desk 5's first by leverage): three polished takes on Afterglow (Aperture recommended, Ink, Cast), above all its light on paper, each a 14-slide deck at 1440 and 375 | MERGED at `fc488d954` (gate 32 green); served at the next desk refresh (after red-team 56's walk); its two photo asks in ASSETS.md (rows 42, 43); its board ideas to ROADMAP; pruned | Opus, 3137 | `a40a63a2c6953cbb5` |
| `capture-time` | Will's X7: a photo keeps the time it was taken, never the place or the device: read before the strip, kept in the file's minimal EXIF, validated on the server, `media.captured_at`, on the album's wire, naming its Drive copy | MERGED at `d345640ed` (gate 22 green); migration `capture_time` APPLIED (20261006011725, md5 78b03a23 = the file's; the Advisor's Q37: APPLY; advisors 26/4/36); types regenerated and the seams dropped (`05655ed4f`); for red-team 56: upload `_scratch/desk/captures/capture-time/fixtures/` to a test album on the desk (five at 2026-10-04 01:14:05Z, `imageio-nozone.jpg` at 21:14:05 in the browser's zone, `imageio-lying.jpg` NULL; the videos need a paid host), read back from `media` and the manifest's seventh element; pruned | Opus, 3131 | `a2516557c94207581` |
| `credit-watch` | the Advisor's Q33 after-steps: a leased claim answers busy (the orphans looked for before any grant), a stuck credit on /admin/accounts with Retry, the recompute's seconds, the expired-passes sweep's cost, a change-plan configuration missing a price caught | MERGED at `6425e2ab3` (gate 26 green); migration `credit_watch` APPLIED (20261006015811, md5 9a28be43 = the file's; the Advisor's Q38: APPLY, the deferred MEDIUM acceptable until milestone 38; advisors 26/4/36); types regenerated and the `creditDb` seams dropped (`8e95dd77c`); database-security.md lists `release_pass_credit`; for the desk (AAL2): the Accounts list's two billing checks and an account's credits card; milestone 38: the orphan adoption as one transaction (a ROADMAP line); pruned | Opus, 3138 | `a4aacf9c3fb29b068` |
| `identity-wiring` | Will's three settled identity traits into production: the halo on every focusable atom, the shrink on every action, the bright edge on everything that floats (one home each; forms untouched: identity r5 asks the set; light: brand r2) | MERGED at `a53a411b4` (gate 23 green); design-system.md refined in the lane; for the desk: Tab through Account or Settings on paper at 375, a menu on paper and a dialog in the room; pruned | Opus, 3136 | `af513bd6bed4eeaef` |
| `crumbs-82` | host-dashboard r4's chooser = words, `/account`'s trail, FollowButton's slug, the Drive re-walk's small findings (the unticked box named, "deletes" gone, Sent's counts per connection, the strip's beat) and /admin's title on a non-admin 404 | MERGED at `99332464e` (gate 25 green); its drive-export.md lines and two stale Drive bits handed to drive-hardening (Drive's doc and code are that lane's); the host-dashboard board can retire (a ROADMAP line); for the desk: the chooser on a day with no party live (the desk's server under `TZ=Europe/London`), Disconnect's confirm and Sent's Earlier line with a connection; pruned | Sonnet, 3139 | `a76ed48484e49ddad` |
| `event-zone` | Will's ask: one moment for every guest: the party keeps its own zone (`events.time_zone`), the album's turn computed once on the server, the develop's 9 am in it, See it as a guest in the guests' order, a far-from-home choice in Settings | MERGED at `586cae5c9` (gate 28 green); migration `event_zone` APPLIED (20261006022141, md5 ceab6bdb = the file's; the Advisor's Q39: APPLY; advisors 26/4/36); types regenerated at `6b2da6239` (its seams retire in a crumbs lane); for red-team 56: Create's zone, a zoneless save filled, a far-from-home choice naming its place, See it as a guest in order, one instant from two zones; pruned | Opus, 3133 | `a284a0c6386c75127` |
| `drive-hardening` | Drive's last correctness before it goes live: a throttled PUT resends from a read of its own (the Worker's other retries audited, every Google answer read or canceled), one Partyreel folder per Google account by its private mark | MERGED at `b48676d7f` (gate 29 green on its test rerun: the first run timed out `history-state-policy.test.ts` under load, handed to crumbs-83); no migration; its Worker code deploys at milestone 38; milestone 38's live walk (P3's consent): connect, send, count the Partyreel folders; Disconnect, Connect, send again (a new Partyreel folder means a re-granted drive.file cannot list the old grant's folder: back to the Advisor); `wrangler tail` clean; pruned | Opus, 3131 | `a90977222aba5ae37` |
| `crumbs-83` | eight bugs a person can hit: Back under a deep-linked photograph (Will's call, recommended built), a popup whose act navigates, Forward onto a closed popup, Stripe's doors tapped twice and the storage strip's leave, the door's wait chooser on a camera album, the uploader's refusal codes, the Guests card counting only guests' shots; and the gate's load flakes | MERGED at `e3124e66d` (gate 31 green); its design-system.md and uploads-and-r2.md lines refined in the lane; pruned | Opus, 3132 | `a600e6b129f3e96f6` |
| `lab-kit-2` | the lab's four notes: a hidden option's loops pause inside frames (a bridge in `Frame`), lab runs refuse a DevTools port that answers, the tools index linked and crawled, a frame takes its pane's theme | MERGED at `7fbe7dd04` (gate 30 green; PREMISE on identity's two asks re-read: only the lab section moved, they stand); its two system docs refined in the lane; pruned | Sonnet, 3134 | `ac1bd614d4150badf` |
| `guest-requests` | three requests a guest's page never needed: the demo's links prefetch on intent (108 requests to 86), the first poll stops re-asking the seed's links (8 links calls to 2), the camera hears a reopen from the sync (12 presigns to 1); no migration | MERGED at `1cdbcaed5` (gate 34 green); its proposed doc lines (guest-flow.md, disposable-mode.md, host-app.md) for scratch-synthesis to place; for the desk: delete its two probe events through Settings (`efdaa41e-6434-45d0-8061-d3be396833ca`, `08fccfb6-3636-4a3a-bf09-ee6338d89c51`) and read the host hub on the Scale probe (one sync, no `/media` call); pruned | Opus, 3136 | `aab13c406e12ae1dd` |
| `redteam-56` | the walk before milestone 38, local on the desk build (`2c7423ca4`): every merge since milestone 37 | DONE: PASS on album order and its pill, one instant from two zones, capture time end to end (the SQL, the manifest's seventh element, a download keeping only the time), the hub's doors, Settings, Back and keys, the dashboard's chooser, regressions; PARTIAL on identity (the halo missing on many controls); no HIGH; 1 MEDIUM, 2 LOW and NITs (Next 3); NOT DRIVEN the full-account refusal, the credit and a checkout, Drive, the Workers, the admin portal, a real phone; its RT56 events moved to Deleted; ledger `../partyreel-wt/_scratch/redteam-56/ledger.txt` | Opus, Will's Chrome + its own headless | `a0ca0d2feb415d060` |
| `crumbs-84` | cleanup whose time had come: event-zone's typed seams retired, the host-dashboard board retired with `seasonsOf` and kin, the dead `refreshHubReelAction` deleted, the Reel card's words in `room-card.ts`, the Library's sticky-band specimen | MERGED at `3bc74d23d` (gate 33 green); the host-dashboard ledger deleted at the record; pruned | Sonnet, 3133 | `a066d475f32c874e8` |
| `scratch-synthesis` | Will's ask: everything a future Orchestrator needs from the Mac's `_scratch/` in the repo (the calls lab as `docs/calls.md`, the kit's tools, Drive's next versions, the desks ahead), one private note on Will's Mac for the cloud seat | MERGED at `cc7c966f` (gate 35 green, the cloud seat's first); its proposed pickup, STATUS, ROADMAP and CLAUDE.md lines landed at the record; its calls are the lab's BG; pruned | Opus (the Mac, gone) | (local) |
| `test-slim` | Will's ask: a leaner, faster suite with no weaker guarantees (about 13,190 tests today): duplicates folded into tables, whole-tree scans shared, copy pins pointed at their homes, coverage held per directory, and a rule that keeps it lean (CI now runs only on main and opt-in pushes, `70c374381`) | RUNNING (cut at `613ad790`; the design-gate claims lent to it) | Opus, 3132 | `a33effa6a33104bf0` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a22be0c2878d7ab19`, this session, spawned
for Q31 (billing-locks' migration against the live schema and milestone 36's callers). Its model of the pricing rules is `../partyreel-wt/_scratch/pricing/q15-advisor.md`.

**Handoff across accounts** (Will's rule: wind down near the weekly limit; the other account resumes at once). This
session: `f2c62c71-9c33-49f4-9fd5-d48376be9824` on willg97@gmail.com, weekly 0% at 04:10Z 2026-10-05, resetting
Sunday 2026-10-11 13:00Z (hi@willgibs.com resets Tuesday 2026-10-06 21:00Z). If it ends, the next Orchestrator:
- resumes each `lp/*` whose manifest is not `handed-off` per the runbook's "Resume a lane" (its pushed WIP, its
  predecessor's transcript under `~/.claude/projects/-Users-gibby-local-ai-partyreel/f2c62c71-9c33-49f4-9fd5-d48376be9824/subagents/agent-<id>.jsonl`,
  the same port); one whose manifest says handed-off is ready to integrate;
- reads this pickup, then STATUS; recreates the hourly heartbeat only for an unattended run (`CronCreate`, session-only; Will: off while he works
  actively; this session's was deleted 2026-10-05 when he returned);
- Will's desk: `http://localhost:3000/design/lab?key=fiesta` is served by `pnpm start -p 3000` in
  `../partyreel-wt/desk` (nohup), pinned at `5104a5d05` (no open ask); the next refresh serves desk 5. A refresh: checkout the
  SHA detached, `pnpm install`, stop port 3000, `rm -rf .next`, build with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  through `scripts/build-lock.sh`, `nohup pnpm start -p 3000`, then the `sentry-release` in `/design/lab` names it
  (about a minute; `../partyreel-wt/_scratch/desk/desk-refresh.sh <sha>` does it all; its `.env.local` is a symlink to the root's, so Will's env lands there too);
- the specs of round 15 and its later lanes are in `../partyreel-wt/_scratch/specs/`;
- MCP tool ids change with the account; Claude in Chrome (connected per account by Will), the Supabase MCP on
  `ddafaemglzmuekbtjwzn` and the Vercel token in `.env.local` are what the work needs.

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
Everything a successor reads lives in the repo or in `../partyreel-wt/_scratch/` (the calls lab, the red-team briefs
and ledgers, the Drive research).

## Next, in order

Round 15, on Will's desk answers of 2026-10-04 and his brand note; the approved plan, whole, is
`../partyreel-wt/_scratch/desk/round-15-plan.md`; this session's opening plan is
`~/.claude/plans/please-resume-your-role-delightful-cascade.md`.

1. **Milestone 37 SHIPPED** (2026-10-05 16:25Z, `b67cdc1f2`). Merged since, for milestone 38 (gates 11 to 20, each
   green): crumbs-81, durability-restore, billing-integrity, brand-r1, pricing-doors, drive-fixes, back-layers,
   backup-reconcile, settings-wiring, event-header-wiring, and the Orchestrator's StrictMode tile fix (`d6bfc64a0`, gate
   by hand: typecheck, lint, 12,572 tests, the build). Applied: `billing_integrity` (20261005191959),
   `cloud_export_fixes` (20261005193047), `roll_size_range` (20261005205744); advisors 26/4/36; types current
   (`78d1ffd47`, then drive's seam at the drive-fixes record).
2. **Drive's road to live:** the desk re-walk PASSED (no HIGH or MEDIUM; the local Worker stopped). Red-team 56 is
   RUNNING on the desk build `2c7423ca4` (everything merged since milestone 37, gates 11 to 28; three migrations applied
   today since 37's: capture_time, credit_watch, event_zone; advisors 26/4/36); its findings to a crumbs lane, then
   milestone 38 on Will's yes; then and milestone 38 on Will's yes, where Drive's Worker deploys (never
   against milestone 37's build: `npm ci`, `wrangler queues create partyreel-drive-dlq --message-retention-period-secs
   1209600`, `wrangler deploy`, `DRIVE_APP_URL` partyreel.com, the cron every fifteen minutes) and Vercel's non-secret
   `DRIVE_WORKER_URL` (production holds Drive's four secrets but not the URL, so it reads "not set up" until then);
   `partyreel-backup` deploys at 38 too (the reconcile's listing merge, RESTORE_MODE dryrun; then `BACKUP_WORKER_URL`
   on partyreel-admin). The Advisor wants 38 soon: milestone 37's build re-grants a Pro credit past a day (TEST money).
3. **Desk 5 ANSWERED** (2026-10-06, transcribed `3983158d8`): identity r5 **set = house, loading = words**; event-header
   r5 **cards = ?** with Will's note. **Brand r2's `take` SERVED** on the desk at `2634388a8` (04:34Z; Aperture
   recommended, Ink, Cast): his one open ask; the desk pass,
   refresh the desk, tell him. **Desk 6** = the brand applied (after brand r2's pick); **desk 7** = the moments boards
   (host-, guest-, account-moments, create-wizard r4; after identity r5's set pick).
4. **Lanes running** (three agents; weekly 94%): red-team 56 (Opus, on the desk build) and, on Will's word before the
   handoff (2026-10-06), scratch-synthesis and test-slim (their rows above). Merged tonight: lab-kit-2 (gate 30),
   crumbs-83 (31), brand-r2 (32), crumbs-84 (33), guest-requests (34, no migration). CI now runs only on `main`, pull
   requests, manual runs and `[ci]` opt-ins (`70c374381`): every launch-prep merge is gated locally first.
   Their rows above carry each agent id; a successor on another session respawns a lane from its transcript
   (`~/.claude/projects/-Users-gibby-local-ai-partyreel/f2c62c71-9c33-49f4-9fd5-d48376be9824/subagents/agent-<id>.jsonl`,
   local) or, from the cloud, from its pushed branch and manifest alone. Each lane's migration goes through the Advisor (`a22be0c2878d7ab19`, this session) before the apply.
5. **The calls lab:** runs to AX (AF to AX added today; AF4 and AJ3 retired as built); X7 answered and routed
   (capture-time); album-order's calls next (AY), then each merge's.
6. **Compute:** lever 3 and 3b (the CDN-cached album version) only on Will's X5; the guest page's next CPU levers
   (AsyncLocalStorage on Node 24, a lighter first paint) measured locally first; `pnpm compute:model` at every
   milestone.
7. **★ Vercel's Hobby Active CPU** (`node usher/kit/vercel-usage.mjs` before any Vercel work): REFUSE at 04:09Z
   2026-10-05 (320,513 calls in 30 days, about 3.92 of 4 CPU-hours; the 2026-10-03 peak of 57,400 rolls off in early
   November; qrcdn, a non-Partyreel project on the team, shares the budget). Nothing runs against the alias or
   partyreel.com but what Will asks for by name; desks and red-teams run on the local desk build. Pro is a launch switch
   regardless (Hobby is non-commercial); whether it comes sooner is his.
8. **Pacing (Will, 2026-10-05):** weekly usage is no constraint (two Claude accounts, about $500 of cloud usage
   untapped, a third account at worst): the fastest pace I am comfortable with, the machine's memory the limit (eight
   agents at 61 to 68% free). Weekly 59% at 21:32Z (resets 2026-10-11 13:00Z): near 95% the handoff block is current
   so the other account's Orchestrator takes over. **Cloud first where a lane fits** (Will, 2026-10-05: until
   willg97's $250 cloud credit is spent; local where it really benefits): in this desktop session the Agent tool's
   `isolation: "remote"` ran on the Mac (a probe), so the route from here is claude.ai routines (`RemoteTrigger`,
   run on demand, a cloud session on the GitHub repo pushing its `lp/` branch; it cannot message back), awaiting his yes
   to create the first; he may seat the Orchestrator in a cloud session once weekly maxes, where cloud subagents may
   work (chosen at a session's start).
9. **The close of the day:** STATUS (stale since 2026-10-03), this pickup, the calls lab. Moltbook only on his word.

**★ WIND-DOWN (Will, 2026-10-06 ~03:20Z, weekly at 92%; at 97% ~04:40Z: finish the running scratch-synthesis and
test-slim first, then, with usage to spare, one lane at a time until the limit, red-team 56's fixes first): start NO
other lane.** Let the running ones finish, integrate
each handoff, keep this pickup current at every step, and roll into 100% weekly for a clean handoff to a cloud-seated
Orchestrator. What that Orchestrator starts, in order (each a lane, cloud first where it fits: no secrets, no local desk):
1. **identity-r5 wiring** (Opus): the **house** set into production's atoms (keys and wells: fields sunk as wells, the
   lighter chosen on both grounds, keys lying flat as Afterglow's decks draw them; production's corner ladder and boxes,
   one home each) and **working = words** (the arc, then its word: "Saving…", "Still saving" past four seconds; reduced
   motion still), on every action that waits; the two identity-r5 ROADMAP lines ride it (the door page's non-atom parts
   in the set's construction; a working key holding its wider width). The board's look-at-first and frames are its
   spec (`sandbox/identity/`, `docs/reviews/identity.json`).
2. **event-header r6** (Opus, a board round): FIRST verify and rebuild the Seam against Afterglow's (brand r1's decks;
   brand r2's retune once picked): Will sees "a streak of horizontal brightness behind the cards, only a few pixels
   tall" (the lane's Q9 shrank it to a 2 px lamp and a 12 px fall at quarter strength for a row). Then explore with his
   notes: each card's count rides its glyph as a badge (`points`' idea) so title and count read in one glance, capped
   "99+" so it never overflows the title; and colour returns for counts that need attention (he notes the QR's code
   kept its colour while the doors went achromatic, and bland counts get scrolled past unhandled), within Afterglow's
   one-light rule. His full note: `docs/reviews/event-header.json`.
3. **Red-team 56's findings** (a crumbs lane, then a short re-walk of the MEDIUM), then **milestone 38** on Will's yes
   (Next 2's deploy steps; drive-hardening's live walk). The findings: MEDIUM (album-order) in an album in order, a guest
   who sends from the head sees no progress until it lands, since her stack (progress and Stop) stands at the album's
   end (seen at 375 on a throttled send); LOW (identity-wiring) many controls keep their own ring, not the halo (all of
   Settings' first screen, the style cards, film boxes, stepper, Max-size select, Add an end date and Change time zone;
   Account's bell and menu: 17 call sites on shadcn's old ring; "Show password"'s eye and the header links wear only the
   browser's outline): fold into item 1's wiring with the ROADMAP's halo-sweep line; LOW (settings-wiring) at a roll of 1
   a guest holding two shots reads "1 shot… 1 of 1" beside both, and "Removing a shot frees its frame" is untrue there;
   NITs "1 shots each" at a roll of 1, the stored MOV's track header keeps the export's write time, a menu trigger keeps
   the halo after a mouse choice, the hub's develop time unnamed beside Settings' "in Makassar", two robots metas on the
   404, "Select" shrinking over 150 ms instead of at once.
4. Brand r2's integration and the desk refresh (if it hands off after this session), then desk 6 (the brand applied).
Local-only, so a cloud session cannot reach them: Will's desk (`localhost:3000`), `../partyreel-wt/_scratch/` (specs,
captures, the calls lab, red-team ledgers) and this machine's agent memory. Everything a successor needs is in this
file, STATUS, the runbook and the ROADMAP.

## Waiting on Will

- **Two backup copies to delete (privacy; a permanent delete is his hand):** in the `partyreel-backup` R2 bucket,
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/326b519d-b453-42a4-b24c-ade0ac7f7a07/original.jpg` and
  `events/38290e85-c23c-4d3a-bdbb-c6240e6b5074/photo/c4992e06-1423-4ed7-9ac0-81359b408f7c/original.jpg`: backed up
  2026-06-21, before the 2026-07-03 EXIF backfill stripped their primaries, so they still carry EXIF (GPS where the
  photo had it). Once deleted, the next reconcile copies the stripped originals; until then the deployed reconcile
  reads Needs a look and mails daily (backup-reconcile's Q1).
- **The calls lab** (`../partyreel-wt/_scratch/calls/calls-lab.md`): open questions X1 (a Disposable's develop time
  when the date comes later), X2 (a Vercel token for the limits watch), X3 (a read-only Cloudflare analytics token),
  X5 (the CDN-cached album version), X6 (the operator's uploads credit), X7 (keep a photo's capture time); X4 is
  built. Then the text calls built and his to overrule (AF to AP: today's merges, added 2026-10-05). He asks direct questions in chat; answer in chat, never only in a file.
- **Milestone 38** on his yes, after the Drive re-walk and red-team 56 (Drive's Worker and `partyreel-backup` deploy
  with it).
- **Vercel:** Pro now, or Hobby until the window clears in early November (he said hold, 2026-10-05). 79% of one
  day's calls were qrcdn's (his other project on the team).
- **Six retired env names** (`STRIPE_PRICE_PRO_100` to `_2TB_YR`) to delete from both Vercel projects and `.env.local`:
  unread by any code, their Stripe TEST prices archived; the classifier refuses an agent's secret-store write.
- **The 26 policy tests, GUARD or TASTE** (`../partyreel-wt/_scratch/docs-prune/policy-tests.md`).
- **His six motion links, a note:** libraries.dev is blocked on his home network (the ISP's CUJO filter), so three of
  the six (voice, image, gooey) were read from their MIT source on GitHub, never watched.
- **His walks:** Settings' develop time on his iPhone (type a time, then Back or the picker's close: it holds;
  crumbs-72), the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on; and
  trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete for good
  on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own removal
  reading its purge that night); a Ladder A checkout with the test card on the alias.
