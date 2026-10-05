---
track: orchestrator
status: open
cut: "94d66338"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "kit fix at launch-prep (2026-10-04): `integrate.sh` passes the lane's sha whole and `merge-lane.sh` compares heads whole (git's short form grew to 9 characters, so comparing short forms refused every lane); `negative.sh`'s check 2 reworded. A lane editing `usher/kit/` syncs before touching those three."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

Round 15 continues (2026-10-05), seated on willg97. Milestone 36 is live. `launch-prep` holds 17 merged lanes for
milestone 37 (below) and this session's merges, which wait on red-team 54 (54b for the rest) and Will's yes. Desk 2 at
`94d66338` was answered (desk 2 transcribed at `952b9cce2`: the Drive wiring cut); his desk now serves desk 3 at
`18e075a30` (identity r4, customize r1, event-header r4, host-dashboard r4: 15 asks, the desk pass clean).

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `redteam-54` | the local red-team of `94d663383` (guest walks) and `18e075a30` (host walks in Will's Chrome) | DONE: every walk PASS but the hub's develop play (NOT DRIVEN: a hidden tab) and /pricing's hop (Stripe); no HIGH or MEDIUM; its three LOWs and three NITs all fixed by crumbs-76 (`f52d6b6df`); still owed: four name-only guest rows on "Reel lane probe one" (test data); ledger `../partyreel-wt/_scratch/redteam-54/ledger.txt` | Opus, its own headless and Will's Chrome | `aad2547f8dbb570b6` |
| `crumbs-75` | the jobs fail loudly: a kept notice retried, deletes in id order, the prune's lone copies an alert, a silent export at the bell, the over-capacity sweep exact, the palette's switches | MERGED at `a21790e95` (gate 7 green); migration `over_capacity_read` APPLIED (20261005060204, md5 bf001b53 = the file's; advisors 20/4/36 as expected); types regenerated and the three seams dropped (`a391fcf57`), `database-security.md` at 20 and `notice_retries` listed, the `partyreel-backup` Worker deployed (version `465c32a7`, PRUNE_MODE still dryrun); pruned | Opus, 3131 | `a2428ae853740682b` |
| `crumbs-76` | the guest's upload counts and words, with red-team 54's upload findings | MERGED at `f52d6b6df` (gate green); test data left: four "crumbs-76 ... (disposable)" events on willg97, to delete through Settings; pruned | Sonnet, 3132 | `af667c9e8c7ed6f87` |
| `crumbs-77` | the gate's flakes and guards (two tests under load, help labels, one drop-aware migration reader, three migration files recovered, two scripts, two testing-doc facts) | MERGED at `4be0b5a1b` (gate 5 green, the whole lab: its tsconfig line reaches every page); pruned | Sonnet, 3133 | `a5625f1475a561cab` |
| `library-specimens-3` | Library specimens for what lab:smoke could not reach (popup kinds, the stepper, toggle-group, the pricing pieces over a stubbed door, ContactReceipt, HostMediaGrid's arrival, RouteErrorMock, the spend watch card, plate sizes) | MERGED at `2be06c461` (FULL gate green); pruned | Sonnet, 3134 | `a227bf5ce904530be` |
| `drive-wiring` | Send to Google Drive as Will picked it on desk 2 | MERGED at `1e9ad9c51` (its full gate red on one test where it met crumbs-79: the spend watch's migration test now counts the winning body's sections, `f2ba8249d`, the whole suite green after); migration `cloud_export` applied (20261005100151); STILL TO DO: types and its seams (with billing-locks'), WILL's two secrets on every deployment, the desk walk with `wrangler dev`, the deployed Worker at Drive's milestone; pruned | Opus, 3136 | `a60bf71bcb1402618` |
| `help-words` | the help center, the blog and two marketing sections say what the product does today (end dates, Select then Save, the reel's place, a live-demo article, audiences, three stale labels) | MERGED at `b36ba3cf4` (gate green); pruned | Sonnet, 3137 | `a2033d03d542634ca` |
| `billing-locks` | the webhook's pass conversion takes the profile row first, the presign refuses a lapsed pass up front, /admin/accounts reads its hosts' uploads in one call | MERGED at `aa66e86f6` (gate green; migration `billing_locks` applied at 20261005095005, md5 91c83a93); types and the seams `passCreditDb`, `uploadsWindowsDb` after drive-wiring's merge; pruned | Opus, 3131 | `a341a16f8ff0e2a1e` |
| `crumbs-78` | nine small crumbs off the boards (phone_key seams, a person report's signed-in flag, LiveReelView's dead props, a tooltip comment, render:root and a global-boundary probe, moderation previews, ModerationGrid's props, the MFA key's face) | MERGED at `934ac2003` (gate green; PREMISE on identity re-read: its asks stand); pruned | Sonnet, 3138 | `aad11494823d72f0e` |
| `redteam-54b` | the short pre-milestone walk of `21118e59e` on the desk build: crumbs-76's fixes at 375 and 1440, help-words' pages, a regression skim; brief and ledger `../partyreel-wt/_scratch/redteam-54b/` | DONE: every walk PASS (crumbs-76's fixes at 375 and 1440, help-words' pages, the regression skim); no HIGH or MEDIUM; LOWs: the door names no file and no reason when every file is refused for itself; /help/notifications-and-emails cuts two subject chips at 375 (pre-existing); NITs: a whole-failed run's row Retry says \"Everything else is in…\" before anything lands; the door's Sending step closes at the first recorded group (a call); an unanswered Stop question lingers 7 s (a call): to a crumbs lane after milestone 37; its RT54b events in Deleted | Opus, its own headless and Will's Chrome | `a84b138b0cbcceb62` |
| `uploads-idempotent` | a retried complete idempotent on media_id, presign and complete with client ceilings, the next file prepared while one sends, the create_media args seams | MERGED at `c79852c3f` (gate green); its uploads-and-r2.md lines written at the record; test data: 84 photos on willg97's "crumbs-76 free (disposable)"; pruned | Opus, 3132 | `a22e76674a8415d69` |
| `crumbs-79` | five marketing "no end date" lines, the migration readers through liveFunction, the stored-copies scanner's parse, the boom tool's callout, the camera's paragraphs to disposable-mode.md | MERGED at `ef0da48c3` (gate green; PREMISE on customize re-read: a docs move, its asks stand); pruned | Sonnet, 3133 | `a3da58d3869d3d549` |
| `types-seams` | drop the five typed seams billing-locks and drive-wiring left (types regenerated at `9fd2bccb2`) | MERGED at `dc459fd4b` (gate green); pruned | Sonnet, 3131 | `aba8e5f0237321a55` |
| `redteam-55` | the pre-milestone walk of `0833b00b1` on the refreshed desk: Drive without its secrets ("not set up yet" everywhere, nothing breaks), uploads-idempotent's retry and ceilings, the pricing seam, crumbs-79's words, a regression skim; brief and ledger `../partyreel-wt/_scratch/redteam-55/` | DONE: every walk PASS (Drive "not set up yet" everywhere with no 5xx; uploads-idempotent: 21 rows once, the meter exact, the held presign ended at 30 s; the pricing seam; crumbs-79's words; the regression skim); billing-locks NOT DRIVEN; ONE MEDIUM (latent until Drive's secrets: the `?drive=` return toast never shows on a full page load), a LOW and NITs: all to crumbs-80 before milestone 37 | Opus, its own headless and Will's Chrome | `ab8fcb7a389702aaf` |
| `crumbs-80` | red-team 55's MEDIUM (the Drive return toast on a full load) and the two red-teams' small findings | MERGED at `40fba6ed3` (gate green; the MEDIUM re-walked by the lane: the toast shows on `/account?drive=unavailable` loaded whole); pruned | Sonnet, 3134 | `a2baa5a9ae09857d7` |
| `identity-r4` | board identity r4 (desk 10): Will's mix as seven trait asks (field, button, focus, selected, press, loading, toggles), each on real screens wearing the picks before it, and the edge on ten places on paper beside the room; A1 to A4 and H3 as carried calls; form, never hue | MERGED at `eed3f3d30` (gate 1 green, lab:demo 8 steps), waiting for desk 3; its scratch kept for the desk | Opus (gone) | `a4152d141563a9a7d` |
| `customize-r1` | board customize r1 (desk 15): the roll (film's 12/24/36 or 1 to 99), where options live, "use for new parties", the album's order; Linear's lessons and the audit in `_scratch/customize/` | MERGED at `386f4fd4a` (gate 2 green), waiting for desk 3; its scratch kept for the desk | Opus (gone) | `a1ba7927eb8a90754` |
| `event-header-r4` | board event-header r4 (desk 20): one ask, the doors (glass recommended: counts as badges on its icons, a tab bar under her thumb on a phone; cards owning the phone; windows lit only where something waits); G1, G2, G4 drawn on production's panel; the waiting colour left to the brand | MERGED at `66aec24fa` (gate 3 green), waiting for desk 3; its scratch kept for the desk (captures) | Opus (gone) | `a4eaf6f839b991e91` |
| `host-dashboard-r4` | board host-dashboard r4 (desk 25): two asks, `chooser` (corner, words recommended, deck) and `details` (H6) | MERGED at `76e479272` (gate 4 green), waiting for desk 3; its captures re-read by `lab:demo` in the desk pass | Opus (gone) | `a2252d0ff7db3ba6f` |
| `brand-r1` | board brand r1 (desk 4 alone): Afterglow (recommended), Contact Sheet, Everyone's Color, as 14-slide decks at a desk and on a phone | HANDED OFF at `82e262385` (gated on `2858bbfd6`), parked for desk 4 after desk 3's answers; its nine Higgsfield asks go to ASSETS.md for the picked vision | Opus (gone) | `aab7f784008cbcfeb` |
| `compute-reads` | fewer calls: the hub's delta carries its links, the cover keeps its six, stable cover presigns, /welcome counts, the demo's header on intent | MERGED at `d59612754` (gate 6 green; a hub batch 2 calls to 1, a guest's burst 17 to 14; PREMISE on customize and event-header re-read: their asks stand); pruned | Sonnet, 3135 | `afec6648610e18c5d` |

The parked boards' agents lived in the old session (`2ba90542`): a board asked for more work is respawned from its
transcript, `~/.claude/projects/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/subagents/agent-<id>.jsonl`.

**Merged since milestone 36, for milestone 37** (gates 215 to 231, each green; no migration): compute-uploads,
compute-presign, compute-lazy-sdk, crumbs-66 to crumbs-74, library-specimens and library-specimens-2,
uploads-meter-ui, upload-cancel, admin-uploads. Their calls are in the calls lab (AC to AE).

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a22be0c2878d7ab19`, this session, spawned
for Q31 (billing-locks' migration against the live schema and milestone 36's callers). Its model of the pricing rules is `../partyreel-wt/_scratch/pricing/q15-advisor.md`.

**Will's laptop restart (2026-10-05 06:05Z).** Chrome would not relaunch for him (likely why Claude in Chrome never
connected). Resumed 06:43Z after the restart: the desk restarted at `18e075a30`, the four lanes resumed by message.
The original order: (1) the desk: `cd ../partyreel-wt/desk && nohup pnpm start -p 3000` (its build of
`18e075a30` stands; refresh to the head with `../partyreel-wt/_scratch/desk/desk-refresh.sh <sha>` once crumbs-75's
types land); (2) every parked agent by SendMessage to its id above (from a fresh session, respawn from its
transcript per the runbook); (3) crumbs-75's three leftovers: DONE; (4) `list_connected_browsers`: once Chrome
answers, Will asked me to do the Google Cloud step for Drive myself (the P3 account through Google's chooser; he copies
the client secret into `.env.local` and Vercel himself), then red-team 54's host walks; (5) the heartbeat if the
session restarted fresh.

**Handoff across accounts** (Will's rule: wind down near the weekly limit; the other account resumes at once). This
session: `f2c62c71-9c33-49f4-9fd5-d48376be9824` on willg97@gmail.com, weekly 0% at 04:10Z 2026-10-05, resetting
Sunday 2026-10-11 13:00Z (hi@willgibs.com resets Tuesday 2026-10-06 21:00Z). If it ends, the next Orchestrator:
- resumes each `lp/*` whose manifest is not `handed-off` per the runbook's "Resume a lane" (its pushed WIP, its
  predecessor's transcript under `~/.claude/projects/-Users-gibby-local-ai-partyreel/f2c62c71-9c33-49f4-9fd5-d48376be9824/subagents/agent-<id>.jsonl`,
  the same port); one whose manifest says handed-off is ready to integrate;
- reads this pickup, then STATUS; recreates the hourly heartbeat only for an unattended run (`CronCreate`, session-only; Will: off while he works
  actively; this session's was deleted 2026-10-05 when he returned);
- Will's desk: `http://localhost:3000/design/lab?key=fiesta` is served by `pnpm start -p 3000` in
  `../partyreel-wt/desk` (nohup), pinned at `94d66338` (Drive alone) until he pastes desk 2. A refresh: checkout the
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

1. **Milestone 37 SHIPPED** on Will's yes (2026-10-05 16:25Z, `b67cdc1f2`, tag `milestone-37`): both projects READY, the
   read-only walk PASS, launch-prep fast-forwarded. Drive's secrets SET by Will (2026-10-05: `.env.local` with `DRIVE_WORKER_URL=http://localhost:8787`, both Vercel projects, `wrangler secret put`; the queue `partyreel-drive` made) but for `workers/drive/.dev.vars`, his one command (gitignored; an agent's secret write is refused). `.dev.vars` made by Will; the desk at `1b49495cb`; the local Worker on :8787 (`wrangler dev`, log `../partyreel-wt/_scratch/drive-wiring/wrangler-dev.log`); the DRIVE WALK RUNNING (agent `a840f4f1590e89119`, Opus, ledger `../partyreel-wt/_scratch/drive-walk/ledger.txt`; Will approved the drive.file consent on P3, partyr33l@gmail.com). Was next: `cd workers/drive && npx wrangler dev -c wrangler.walk.jsonc --port 8787 --test-scheduled`, then a walker on drive-wiring's 17-step script (`../partyreel-wt/_scratch/drive-wiring/`); Drive's Worker and its queues deploy once the desk walk passes (`DRIVE_APP_URL` to partyreel.com then); a compute-budget check at the next milestone.
2. **Desk 3 is ready** (merged, gates 1 to 4, the desk pass clean: no two asks ask one decision, no PREMISE,
   `lab:demo` green at 1440 and 375): served by a desk refresh the moment he pastes desk 2.
3. **Lanes as seats free**, off the parked boards' surfaces (the hub's doors, the dashboard's stage, Settings'
   options, `ui/` atoms, marketing): `billing-locks` (Opus: pass consumption takes `profiles` first, the presign
   refuses a lapsed pass, `/admin/accounts`' 50 `uploads_used` calls as one read, a lapsed pass's "0 B"; migrations
   through the Advisor); `uploads-idempotent` (Opus: a retried complete idempotent on `media_id`, so presign and
   complete get ceilings; the next file prepared while one sends); `compute-hub-links` (Sonnet: the hub's delta carries
   its links, the cover keeps its playing stills); `help-words` (Sonnet, facts only); the spend watch card's specimen
   after crumbs-75; then ROADMAP "Now" in batches: data integrity, bugs a person can hit, cost, accessibility, hygiene.
4. **When he pastes desk 2:** transcribe (`review-sheet.mjs`, `pnpm lab:review --dry`, then for real); the Drive
   wiring lane (Opus; his Google Cloud step relayed: the design note's section 11; the way-in lives in production's
   Display menu and the download toast tells a cancel from a dropped line, so the lane reconciles both); the desk
   refresh (desk 3 served); tell him.
5. **Desk 4 is brand r1 alone**, integrated after desk 3's answers. **Desk 5**, the moments boards (host-moments: B1,
   Q6, B2, L3; guest-moments: C7, D3 with the flat 3, Q3, G6; account-moments: I4, I5; create-wizard r4: the styles'
   polish, F1, F2), cut after desk 3's identity and customize picks. **Desk 6**, the brand applied (brand-marks with
   the status set, aurora, marketing-themes with N4, N7, N9, demo-framing r6, presence r1, moments-in-motion), cut
   after brand r1's pick; Will's motion study (`../partyreel-wt/_scratch/inspiration/2026-10-04-motion.md`) feeds
   moments-in-motion (★ the smoke reads pixels: an album tile's presigned image taints the canvas).
6. **Compute:** lever 3 and 3b (the CDN-cached album version) only on Will's X5; the guest page's next CPU levers
   (AsyncLocalStorage on Node 24, a lighter first paint) measured locally first; `pnpm compute:model` at every
   milestone.
7. **★ Vercel's Hobby Active CPU** (`node usher/kit/vercel-usage.mjs` before any Vercel work): REFUSE at 04:09Z
   2026-10-05 (320,513 calls in 30 days, about 3.92 of 4 CPU-hours; the 2026-10-03 peak of 57,400 rolls off in early
   November; qrcdn, a non-Partyreel project on the team, shares the budget). Nothing runs against the alias or
   partyreel.com but what Will asks for by name; desks and red-teams run on the local desk build. Pro is a launch switch
   regardless (Hobby is non-commercial); whether it comes sooner is his.
8. **Pacing:** weekly 0% on 2026-10-05; full speed, at most six agents (36 GB; memory 82% free at the seat-in).
   `get_usage` at every wake; from 96% weekly nothing new starts and every lane parks at a commit.
9. **The close of the day:** STATUS (stale since 2026-10-03), this pickup, the calls lab. Moltbook only on his word.

## Waiting on Will

- **Drive's Google client** (done 2026-10-05 by the Orchestrator in Chrome as P3: the Drive API enabled on `partyreel-498522`, `drive.file` in Data Access, the audience already External and In production, a web client "Partyreel Drive" with the callbacks `https://partyreel.com/api/drive/callback` and `http://localhost:3000/api/drive/callback`; the alias's callback left out while Vercel holds): Will copies its ID and secret from the creation dialog into `.env.local` (`GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`) and Vercel's `partyreel` project; a lost secret is re-minted on the client's page.
- **Desk 2, Drive alone** (nine asks), on his local desk: `http://localhost:3000/design/lab?key=fiesta` (launch-prep at
  `94d66338`). Sign-in works there through the chooser. "Stack desk 3" is his to say; otherwise one desk at a time.
- **The calls lab** (`../partyreel-wt/_scratch/calls/calls-lab.md`): open questions X1 (a Disposable's develop time
  when the date comes later), X2 (a Vercel token for the limits watch), X3 (a read-only Cloudflare analytics token),
  X5 (the CDN-cached album version), X6 (the operator's uploads credit); X4 is built. Then the text calls built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **Milestone 37** on his yes, after red-team 54.
- **Vercel:** Pro now, or Hobby until the window clears in early November.
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
