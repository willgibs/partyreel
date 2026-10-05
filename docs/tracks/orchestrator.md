---
track: orchestrator
status: open
cut: "958b6ee7"          # the launch-prep SHA this state was written at
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

Round 15 (2026-10-04), on Will's desk answers on build 31b7c65 and his brand note. Milestone 35 is live. Every wiring
of the round is merged on launch-prep for milestone 36 (Ladder A, trash in storage, the reel's tap, the camera's clip,
the dashboard, the hub's strip, graphite, Create's styles, small fixes, red-team 52's fixes, the arrival), and build 53
(`31a73a46`) serves them on the alias. The boards below are parked at their handoffs for their desks.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `customize-r1` | board customize r1 (desk 15): the roll (film's 12/24/36 or 1 to 99), where options live, "use for new parties", the album's order; Linear's lessons and the audit in `_scratch/customize/` | HANDED OFF at `97a8d62b9`, parked for desk 3 (integrated with the foundation boards) | Opus, 3133 | `a1ba7927eb8a90754` |
| `identity-r4` | board identity r4 (desk 10): Will's mix as seven trait asks (field, button, focus, selected, press, loading, toggles), each on real screens wearing the picks before it, and the edge on ten places on paper beside the room; A1 to A4 and H3 as carried calls; form, never hue | HANDED OFF at `204bd7970` (synced to `18b6bb784`; gates green, lab:demo 8 steps at 1440 and 375), parked for desk 3; its edge-under-scale fix routed to graphite-wiring, the reel dock's open fill to crumbs-64 | Opus, 3132 | `a4152d141563a9a7d` |
| `event-header-r4` | board event-header r4 (desk 20): one ask, the doors (glass recommended: counts as badges on its icons, a tab bar under her thumb on a phone; cards owning the phone; windows lit only where something waits), each refined by its own helper then once from fresh eyes; G1, G2, G4 drawn on production's panel in every option; the waiting colour left to the brand | HANDED OFF at `bf44a50f4` (gates green on `2d6f692d5`, unsynced: launch-prep touched none of its imports), parked for desk 3 | Opus, 3134 | `a4eaf6f839b991e91` |
| `brand-r1` | board brand r1 (desk 5, desk 4 alone): what the agency returned, three visions as 14-slide decks at a desk and on a phone: Afterglow (recommended: light is the brand, sampled from the photographs, a Ring, a Seam or a Bloom one per screen), Contact Sheet (the print is the brand: paper and ink, film edges, a photo lab's marks), Everyone's Color (people are the brand: every guest a seeded orb, an event the mix of its people); the creative director's pass and one refinement; Will's motion study used | HANDED OFF at `82e262385` (gates green on `2858bbfd6`), parked for desk 4 after desk 3; its Higgsfield asks (nine, by slot and theme) go to ASSETS.md for the picked vision at its integration | Opus, 3135 | `aab7f784008cbcfeb` |
| `host-dashboard-r4` | board host-dashboard r4 (desk 25): two asks, `chooser` (how she chooses what leads her stage: corner, words recommended, deck; each on production's wired lit stage, every rule saying the fact it read) and `details` (H6, as built or each the other way) | HANDED OFF at `bd75f406a` (synced to `e5cad2fb4`; gates green, lab:demo at 1440 and 375), parked for desk 3: integrated after Will answers desk 2 | Opus, 3136 | `a2252d0ff7db3ba6f` |
| `redteam-53` | build 53's red-team (`31a73a4`) | STOPPED at 15:40Z mid-walk 6 (the Vercel CPU limit): W1 dashboard, W2 Create, W3 hub before the develop, W4 develop and arrival, W5 downloads and uploads and W9's guest upload PASS; **1 MEDIUM** (a download whose line drops after the mint posts its form anyway: Chrome's error page, never "Your connection dropped"), LOWs (offline, the drop line turns to "Your download is starting." as `heard(null)` resets `lineLost`; the Reel card hides "Guests get it later" at 375) and NITs (Reset drops focus; the Style key's open fill loses to hover; her header disc flashes uncoloured; the camera never says a dropped connection; "and try again" against ", then try again"): all to `crumbs-65`. Not walked: the strip going quiet, Q2 on the tile and table, red-team 52's fixes, graphite, the host's upload, /admin/jobs. Ledger `../partyreel-wt/_scratch/redteam-53/ledger.txt` | Opus, Will's Chrome | `a74c0224d08c09800` |
| `compute-model` | Phase 1: what Partyreel costs Vercel per user action, projected onto real events, a standing budget | MERGED at `cbcf7a6e4` (gate 212 green); report `../partyreel-wt/_scratch/compute-model/report.md` (a wedding 56,000 to 85,000 calls; the proxy half of every count; six levers, -93% calls and -71% CPU together); Will's calls X4, X5 in the calls lab; pruned | Opus, 3131 | `a097c42685f2fa292` |
| `crumbs-65` | red-team 53's findings before milestone 36 | MERGED at `3e7e6ec53` (gate 210 green; no migration); his calls in the calls lab (Z); pruned | Sonnet, 3132 | `a986701b02f98a735` |
| `limits-watch` | every vendor's plan meter against its limit, a "Plan limits" card on /admin/jobs and an email at 60% and 85%, inside the spend watch's daily run | MERGED at `42745a7dd` (gate 211 green); its migration APPLIED (`limits_watch_readings`, 20261004174457, Q33 safe as written, md5 f44a2828, advisors 19/4/36); types and the seam dropped (`8578c1cf0`); his questions X2 (a Vercel token for the cron) and X3 (a read-only Cloudflare analytics token) in the calls lab; pruned | Sonnet, 3138 | `addb8c6edba9adbff` |
| `compute-levers` | levers 1 and 2: the proxy only where a session matters, polls that rest | MERGED at `227849c9c` (gate 213 green); measured: a heavy wedding's calls -66% (80,599 to 27,479), the budget rebased; his calls in the calls lab (AB); pruned | Opus, 3131 | `aa924f52363c4607c` |
| `redteam-53b` | the local red-team of launch-prep at `1c8a981bd` (the desk build at port 3000; never Vercel) | DONE: every walk PASS (sessions across an expired token after the proxy change, page and API routes refreshing their own; crumbs-65's fixes; polls at rest, 60 s for ten lit minutes then 5 minutes, a new photo in 5 s; red-team 53's unwalked walks; regressions); no HIGH, MEDIUM or LOW; 2 NITs to ROADMAP; not drivable: the admin portal, a checkout's webhook, a real phone; ledger `../partyreel-wt/_scratch/redteam-53b/ledger.txt` | Opus, Will's Chrome and its own headless | `acc14cd8bde6e2fba` |
| `compute-uploads` | lever 4: a burst of uploads is one presign and as few completes as its landing allows, every per-file check kept | MERGED at `3915071ca` (gate 216 green; no migration; a guest's join and ten photos 59 calls to 17, a wedding -65%); his call in the calls lab (AC); pruned | Opus, 3131 | `a1127664b1a59539e` |
| `crumbs-66` | red-team 53b's NITs (the hub's door words; the cover's srcset not built: a cover variant deferred), Reset's focus, the hub reel's develop words, the compute harness's join wait | MERGED at `53e1e8fb2` (gate 215 red on a flake, then the full suite green: 11,160; no migration); pruned | Sonnet, 3132 | `aa18239db9c002762` |
| `crumbs-67` | two jsdom tests that flaked under load wait on what they mean | MERGED at `b6cabeb35` (gate 217 green; tests only; 30 runs in a row under a concurrent build); pruned | Sonnet, 3132 | `a07bf3008e5deabd3` |
| `crumbs-68` | the door's upload bar, the album's one ask a burst, the cause of a drop on the queue | MERGED at `e85312ba4` (gate 218 green; a guest's join and ten photos 20 calls to 18); pruned | Sonnet, 3131 | `ab8e4ad3cf9714ba1` |
| `compute-presign` | the guest page's next CPU lever: R2 presigns signed by hand (SigV4), byte-identical to the SDK's | MERGED at `84d9a62ab` (gate 220 green after a re-run: the first merge met a stray `.git/index.lock` and was aborted clean; 257 links 12x cheaper, about 25 ms off each guest page render); pruned | Opus, 3132 | `ae54afeec77675ece` |
| `crumbs-69` | the hub counts as an open; the old reel route before the develop | MERGED at `c5828d84c` (gate 219 green); pruned | Sonnet, 3131 | `ab9453e19fea9242a` |
| `library-specimens` | three Library specimens: the download toast's states, the Plan limits card, TapTooltip | MERGED at `bb3942afc` (gate 221 green); pruned | Sonnet, 3131 | `a5c2f78ccd20a3030` |
| `compute-lazy-sdk` | the S3 SDK loaded on the first send | MERGED at `365274760` (gate 222 green; the guest page's cold load 175 to 123 ms of CPU); pruned | Sonnet, 3132 | `a99654d8427f34e53` |
| `crumbs-70` | the /pricing hop's uploads sentence, the floating gutter's name, the lamp's ignition from Create | MERGED at `6ef4b3d92` (gate 223 green); pruned | Sonnet, 3131 | `ac83ec59db2e60df5` |
| `crumbs-71` | a download's Try again waits for the line; the disc's per-ticket colour in profiles-social.md | MERGED at `c754b3d68` (gate 224 green); pruned | Sonnet, 3132 | `abe6516c311e72a70` |
| `uploads-meter-ui` | this month's uploads against her allowance in the storage ring's popover | MERGED at `c00b1f5b0` (gate 225 green); his calls in the calls lab (AD); pruned | Sonnet, 3131 | `a5d19501a15912cc1` |
| `upload-cancel` | E6 for uploads: an in-flight upload's x asks first, then offers Try again | MERGED at `4a064993f` (gate 226 green); his calls in the calls lab (AE); pruned | Sonnet, 3132 | `a80a1b7990acf514c` |
| `crumbs-72` | Settings' develop time never lost (one hook with the date field's close-save), the host's storage refusal with its numbers, the teaser's waiting words, the reel's dead viewer path removed | RUNNING (cut at `192a09666`; may be cut off: resume from its WIP) | Sonnet, 3131 | `acf51d0ab0fa56db8` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a2e44f7ad679754e8`, this session. Its
model of the pricing rules is `../partyreel-wt/_scratch/pricing/q15-advisor.md`. From another session, respawn it from
`usher/kit/advisor-prompt.txt`.

**Handoff across accounts** (Will's rule: wind down near the weekly limit; the other account resumes at once). This
session (`2ba90542-62d6-487c-8c79-3657619f9133`, hi@willgibs.com, weekly 92% at 21:15Z 2026-10-04, resets Tuesday
2026-10-06 21:00Z) runs to 100% on Will's word (no token wasted): compute-uploads (lever 4) and crumbs-66 were cut at
21:30Z and may be mid-flight when it stops. The next Orchestrator runs on willg97 (its weekly reset 2026-10-04 13:00Z,
0% then). Its first steps:
- for each `lp/*` whose manifest is not `handed-off`, resume it per the runbook's "Resume a lane" (its pushed WIP, its
  predecessor's transcript under `subagents/agent-<id>.jsonl`, the same port); one whose manifest says handed-off is
  ready to integrate;
- read this pickup, then STATUS; recreate the hourly heartbeat (`CronCreate`, session-only; the old one died with this
  session);
- Will's desk: `http://localhost:3000/design/lab?key=fiesta` is served by `pnpm start -p 3000` in
  `../partyreel-wt/desk` (nohup; a restart of the machine needs it restarted: checkout `origin/launch-prep`, build with
  `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, start);
- the specs of round 15 and its later lanes are in `../partyreel-wt/_scratch/specs/`;
- the parked boards keep their worktrees: identity-r4, event-header-r4, host-dashboard-r4, customize-r1, brand-r1;
- MCP tool ids change with the account; Claude in Chrome, the Supabase MCP on `ddafaemglzmuekbtjwzn` and the Vercel
  token in `.env.local` are what the work needs (the Vercel MCP needs the partyreel team re-authorized).

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad holds the specs (`specs-r15/`) and gate logs (the next gate is 210); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls lab, the red-team briefs and ledgers, the Drive research).

## Next, in order

Round 15, on Will's desk answers of 2026-10-04 06:00Z and his brand note; the approved plan, whole, is
`../partyreel-wt/_scratch/desk/round-15-plan.md`.

00. **Milestone 36 SHIPPED** on Will's yes (2026-10-04 21:00Z, `28bd6d62`, tag `milestone-36`): production's pass prices
   set to Ladder A's first, both projects READY, the read-only walk PASS, launch-prep fast-forwarded.
0a. **Phase 2 of the compute fix:** compute-levers (levers 1 and 2) MERGED (-66% of a heavy wedding's calls); next
   batched presign and complete (lever 4, `compute-uploads`) MERGED (a guest's ten photos 59 calls to 17); next the CDN version (lever 3, 3b) only on Will's privacy call X5. An auth red-team of lever 1 runs on the local
   desk before it ships; the fix reaches partyreel.com only through a milestone on Will's yes.
0. **★ VERCEL'S HOBBY ACTIVE CPU (Will, 2026-10-04 15:30Z: almost maxed; breaking it again may cost the hosting, since
   Vercel unlocked his account once already).** Hobby allows 4 CPU-hours a rolling 30 days and pauses functions past it.
   Function calls grew from about 3,000 a day (early September) to 57,400 (2026-10-03), nearly all ours: red-team walks
   and `lab:demo` desk checks on the alias (about 5,000 to 6,000 an hour each), album and hub tabs left polling. Until
   he decides (Pro now, or Hobby with the fixes): **nothing runs against the alias or partyreel.com** (no red-team, no
   `lab:demo --base` the alias, no `[preview]`). Built: the kit's guard, `usher/kit/vercel-usage.mjs` (30-day function
   calls from `GET /v2/usage?type=requests`; Active CPU itself is Pro's Observability Plus; 320,789 calls, about 87% by
   count at 15:37Z), in front of `alias-ensure.mjs` and every remote `lab:*` run (`d41b1ea3f`). Next: calibrate it from
   his dashboard figure; the spend watch reading it daily into `/admin`; desk checks and red-teams on a local production
   build (the alias only for sign-in, upload and checkout); polls rest when idle (`use-live-poll.ts` is 12 s without the
   doorbell and 60 s with it, paused only when hidden, and a headless tab is never hidden: about 300 calls an hour each).
   Vercel's fair-use rules confine Hobby to non-commercial use, so Pro at launch stays a launch switch regardless (it
   bills Active CPU from $0.128 an hour: today's month would be about $0.50); the foundational work is cost and
   behaviour at scale, which compute-model prices on both plans.
1. **Red-team 53** (stopped for the CPU limit): its findings fixed by `crumbs-65` (merged, gate 210); next a local red-team 53b
   on the desk build at port 3000 (the walks not taken: the strip going quiet, Q2 on the tile and table, red-team 52's
   fixes, graphite, the host's upload, /admin/jobs, plus crumbs-65's "Look at first"); then milestone 36 on Will's yes
   (the runbook's "Milestone"), which is also the first deploy since the CPU limit: run `vercel-usage.mjs` first.
   Red-team 53b waits for the weekly (88% at 17:33Z) after compute-model and limits-watch hand off; refresh the desk
   build to launch-prep's head first (`../partyreel-wt/desk`: checkout, build with the localhost site URL, restart).
2. **Desk 2 is Drive alone** (on the alias since build 52). After his answers: the Drive wiring lane (his Google Cloud
   step relayed: the design note's section 11; the way-in now lives in production's Display menu and the download toast
   tells a cancel from a dropped line, so the lane reconciles both), and desk 3's four boards integrated (customize-r1,
   identity-r4, event-header-r4, host-dashboard-r4, one at a time), the desk pass (`board-card.mjs --desk`, PREMISE
   re-reads, any two asks asking one decision merged), a `[preview]`, `lab:demo` on the alias at 1440 and 375, then
   tell him desk 3 is ready.
3. **Desk 4 is brand r1 alone**, integrated after desk 3's answers; its nine Higgsfield asks go to ASSETS.md for the
   picked vision only.
4. **Desk 5**, the moments boards (host-moments: B1, Q6, B2, L3; guest-moments: C7, D3 with the flat 3, Q3, G6;
   account-moments: I4, I5; create-wizard r4: the styles' polish, F1, F2), cut after desk 3's identity and customize
   picks. **Desk 6**, the brand applied (brand-marks with the status set, aurora, marketing-themes with N4, N7, N9,
   demo-framing r6, presence r1, moments-in-motion), cut after brand r1's pick.
5. **The calls lab's open question X1** (a Disposable's develop time when the date comes later): its recommended fix
   is a small lane on his word.
6. **A capture incident:** brand-r1's capture drove host-dashboard-r4's headless Chrome for about 16 s at
   04:47 local; the desk pass re-reads host-dashboard r4 by `lab:demo` before desk 3.
7. **Will's motion inspirations, studied** (`../partyreel-wt/_scratch/inspiration/2026-10-04-motion.md`; his six links
   and words beside it): sent to brand-r1 at 08:10Z as material for its visions' signature ("the aurora that answers":
   light answering a real signal), the aurora as ink on paper, the motion principles and "the code develops". After
   brand r1's pick, a `moments-in-motion` board joins desk 6, drawn in the chosen brand: the product's verbs as one
   family (take back as smoke in Your shots and the bin's Delete permanently, never a soft Remove; set aside; open, with
   a weighted pull to dismiss and the full flight only for rare launches; arrive; develop as a cell reveal), the
   camera's filming glow, Create's code flipping only the modules that differ. Skipped: gooey as a language, the tilt on
   every photo. ★ The smoke reads pixels: an album tile's presigned image taints the canvas.
8. **The heartbeat:** cron `11f7f524`, hourly at :17 local, session-only (it dies with this session; recreate it in a
   new one). A fail-safe: it acts only on ready work and otherwise ends in a line (Will: stalls are rare, needless
   wakeups cost context).
9. **Pacing (Will: never pause overnight; he switches accounts at a weekly limit):** the night's twelve board helpers
   burned the 5-hour window about 30 points an hour; Sonnet wirings and one Opus lane burn about 8. The weekly was 85%
   at 14:18Z (this account's resets Tuesday 21:00Z; willg97's reset today at 13:00Z). From 96% weekly nothing new
   starts and every lane parks at a commit; `get_usage` at every wake.
10. **The close of the day:** STATUS, this pickup, the calls lab. Moltbook hourly only on his word.

## Waiting on Will

- **Desk 2, Drive alone** (nine asks), on his local desk (Vercel's CPU): `http://localhost:3000/design/lab?key=fiesta`,
  served from `../partyreel-wt/desk` (launch-prep at `08f6c8cd5`, built with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`,
  `pnpm start -p 3000`; refresh: checkout, build, restart). Sign-in works there through the chooser.
- **The calls lab** (`../partyreel-wt/_scratch/calls/calls-lab.md`): one open question (X1, a Disposable's develop time
  when the date comes later), then the text calls built and his to overrule (the night's wirings added S to Y). He asks
  direct questions in chat; answer in chat, never only in a file.
- **Milestone 36** on his yes, after red-team 53.
- **His six motion links, a note:** libraries.dev is blocked on his home network (the ISP's CUJO filter), so three of
  the six (voice, image, gooey) were read from their MIT source on GitHub, never watched; the study says what each is
  worth.
- **The 26 policy tests, GUARD or TASTE** (`../partyreel-wt/_scratch/docs-prune/policy-tests.md`): which taste rules he
  keeps as his voice and which go.
- **His walks:** the camera on his iPhone (a held-shutter video on a waiting sheet), Save into Photos, Record Video's
  size, a deletion and its Cancel deletion on hi@willgibs.com, the spend watch's uploads switch off and on; and
  trash-in-storage's permanent deletes, which no agent may press (on hi@willgibs.com: the size list's Delete for good
  on "RT51 free", Make room from Deleted back on and one upload past the line, Empty Deleted, a guest's own removal
  reading its purge that night); a Ladder A checkout with the test card on the alias.
