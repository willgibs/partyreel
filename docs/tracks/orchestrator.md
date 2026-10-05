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
milestone 37 (below), which waits on red-team 54 and Will's yes. Desk 2 (Drive alone) is on his local desk at
`94d66338`. Desk 3's four boards are integrated into `launch-prep` one at a time while his desk stays pinned to Drive
alone, so desk 3 serves the moment he pastes desk 2.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `redteam-54` | the local red-team of `94d663383` (the desk build at port 3000; never Vercel): uploads in bursts, hand-signed links, upload-cancel, the uploads line, crumbs-66 to 74, regressions; brief and ledger `../partyreel-wt/_scratch/redteam-54/` | RUNNING: guest walks headless; host walks WAITING ON CHROME (Claude in Chrome not connected to willg97) | Opus, its own headless and Will's Chrome | `aad2547f8dbb570b6` |
| `crumbs-75` | the jobs fail loudly: a released notice retried, deletes in event-id order, the prune's `primary_missing` an alert, a silent export at the bell, the over-capacity sweep exact (maybe a migration), the palette's switches | RUNNING | Opus, 3131 | `a2428ae853740682b` |
| `crumbs-76` | the guest's upload counts and words ("1 of 0", "Everything else", the camera hearing uploads reopen, the host on her guest page, one heading scale, a camera album's door) | RUNNING | Sonnet, 3132 | `af667c9e8c7ed6f87` |
| `crumbs-77` | the gate's flakes and guards (two tests under load, help labels, one drop-aware migration reader, three migration files recovered, two scripts, two testing-doc facts) | RUNNING | Sonnet, 3133 | `a5625f1475a561cab` |
| `library-specimens-3` | Library specimens for what lab:smoke cannot reach (popup kinds, the stepper, toggle-group, the pricing pieces over a stubbed door, ContactReceipt, HostMediaGrid's arrival, RouteErrorMock, plate sizes) | RUNNING | Sonnet, 3134 | `a227bf5ce904530be` |
| `identity-r4` | board identity r4 (desk 10): Will's mix as seven trait asks (field, button, focus, selected, press, loading, toggles), each on real screens wearing the picks before it, and the edge on ten places on paper beside the room; A1 to A4 and H3 as carried calls; form, never hue | HANDED OFF at `204bd7970` (gated on `d9654688d`), integrating first | Opus (its session gone) | old session's `a4152d141563a9a7d` |
| `customize-r1` | board customize r1 (desk 15): the roll (film's 12/24/36 or 1 to 99), where options live, "use for new parties", the album's order; Linear's lessons and the audit in `_scratch/customize/` | HANDED OFF at `97a8d62b9` (gated on `bfcc63e1e`), integrating second | Opus (gone) | `a1ba7927eb8a90754` |
| `event-header-r4` | board event-header r4 (desk 20): one ask, the doors (glass recommended: counts as badges on its icons, a tab bar under her thumb on a phone; cards owning the phone; windows lit only where something waits); G1, G2, G4 drawn on production's panel; the waiting colour left to the brand | HANDED OFF at `bf44a50f4` (gated on `2d6f692d5`), integrating third | Opus (gone) | `a4eaf6f839b991e91` |
| `host-dashboard-r4` | board host-dashboard r4 (desk 25): two asks, `chooser` (corner, words recommended, deck) and `details` (H6) | HANDED OFF at `bd75f406a` (gated on `ce77dc1a5`), integrating fourth; its captures re-read by `lab:demo` (the capture incident) | Opus (gone) | `a2252d0ff7db3ba6f` |
| `brand-r1` | board brand r1 (desk 4 alone): Afterglow (recommended), Contact Sheet, Everyone's Color, as 14-slide decks at a desk and on a phone | HANDED OFF at `82e262385` (gated on `2858bbfd6`), parked for desk 4 after desk 3's answers; its nine Higgsfield asks go to ASSETS.md for the picked vision | Opus (gone) | `aab7f784008cbcfeb` |

The parked boards' agents lived in the old session (`2ba90542`): a board asked for more work is respawned from its
transcript, `~/.claude/projects/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/subagents/agent-<id>.jsonl`.

**Merged since milestone 36, for milestone 37** (gates 215 to 231, each green; no migration): compute-uploads,
compute-presign, compute-lazy-sdk, crumbs-66 to crumbs-74, library-specimens and library-specimens-2,
uploads-meter-ui, upload-cancel, admin-uploads. Their calls are in the calls lab (AC to AE).

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): not spawned yet this session; spawned from
`usher/kit/advisor-prompt.txt` at its first consult (crumbs-75's migration, billing-locks', or milestone 37's risk
read). Its model of the pricing rules is `../partyreel-wt/_scratch/pricing/q15-advisor.md`.

**Handoff across accounts** (Will's rule: wind down near the weekly limit; the other account resumes at once). This
session: `f2c62c71-9c33-49f4-9fd5-d48376be9824` on willg97@gmail.com, weekly 0% at 04:10Z 2026-10-05, resetting
Sunday 2026-10-11 13:00Z (hi@willgibs.com resets Tuesday 2026-10-06 21:00Z). If it ends, the next Orchestrator:
- resumes each `lp/*` whose manifest is not `handed-off` per the runbook's "Resume a lane" (its pushed WIP, its
  predecessor's transcript under `~/.claude/projects/-Users-gibby-local-ai-partyreel/f2c62c71-9c33-49f4-9fd5-d48376be9824/subagents/agent-<id>.jsonl`,
  the same port); one whose manifest says handed-off is ready to integrate;
- reads this pickup, then STATUS; recreates the hourly heartbeat (`CronCreate`, session-only; this session's is
  `d5139e32` at :17);
- Will's desk: `http://localhost:3000/design/lab?key=fiesta` is served by `pnpm start -p 3000` in
  `../partyreel-wt/desk` (nohup), pinned at `94d66338` (Drive alone) until he pastes desk 2. A refresh: checkout the
  SHA detached, `pnpm install`, stop port 3000, `rm -rf .next`, build with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  through `scripts/build-lock.sh`, `nohup pnpm start -p 3000`, then the `sentry-release` in `/design/lab` names it
  (about a minute; `../partyreel-wt/_scratch/desk/desk-refresh.sh <sha>` does it all);
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

1. **Red-team 54, then milestone 37.** Red-team 54 walks `94d663383` locally; its findings go to a crumbs lane; then
   milestone 37 on Will's yes (the runbook's "Milestone": `FULL=1` gate, `pnpm compute:model`, merge, tag, the deploy
   he asked for by name, a short read-only walk). What merges after `94d663383` gets red-team 54b on the refreshed desk
   build before the milestone.
2. **Desk 3 integrated now** (identity-r4, customize-r1, event-header-r4, host-dashboard-r4, one at a time;
   `negative.sh` before the day's first), then the desk pass: `board-card.mjs --desk`, PREMISE re-reads, any two asks
   asking one decision merged, host-dashboard r4 re-read by `lab:demo`, `lab:demo` at 1440 and 375 on a local build.
   Served by a desk refresh the moment he pastes desk 2.
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

- **Claude in Chrome on willg97:** red-team 54's host walks need it (resume that agent by SendMessage once connected).
- **Desk 2, Drive alone** (nine asks), on his local desk: `http://localhost:3000/design/lab?key=fiesta` (launch-prep at
  `94d66338`). Sign-in works there through the chooser. "Stack desk 3" is his to say; otherwise one desk at a time.
- **The calls lab** (`../partyreel-wt/_scratch/calls/calls-lab.md`): open questions X1 (a Disposable's develop time
  when the date comes later), X2 (a Vercel token for the limits watch), X3 (a read-only Cloudflare analytics token),
  X5 (the CDN-cached album version), X6 (the operator's uploads credit); X4 is built. Then the text calls built and
  his to overrule. He asks direct questions in chat; answer in chat, never only in a file.
- **Milestone 37** on his yes, after red-team 54.
- **Vercel:** Pro now, or Hobby until the window clears in early November.
- **The 26 policy tests, GUARD or TASTE** (`../partyreel-wt/_scratch/docs-prune/policy-tests.md`).
- **His six motion links, a note:** libraries.dev is blocked on his home network (the ISP's CUJO filter), so three of
  the six (voice, image, gooey) were read from their MIT source on GitHub, never watched.
- **His walks:** Settings' develop time on his iPhone (type a time, then Back or the picker's close: it holds;
  crumbs-72), the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on; and
  trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete for good
  on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own removal
  reading its purge that night); a Ladder A checkout with the test card on the alias.
