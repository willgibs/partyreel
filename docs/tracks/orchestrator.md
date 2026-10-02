---
track: orchestrator
status: open
cut: "f6d72a9d"          # the launch-prep SHA this state was written at
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
  - "demo-stall merged at 7990d19d (2026-10-01): `next@16.2.6` carries a pnpm patch (`patches/next@16.2.6.patch`, upstream's vercel/next.js#98168: the dev image optimizer's wedged sizes), so a checkout that syncs past it runs `pnpm install` (`src/lib/next-image-optimizer.test.ts` is red until it does); drop the patch when Next ships the fix (16.4). `lab:demo` no longer resizes a page it leaves, disables the back/forward cache, and prints WAITING ON for a stalled navigation."
  - "lab-revamp stage two merged at 8cb5f21a (2026-09-29): a board is one folder, `src/app/(dev)/design/sandbox/<id>/` (`pnpm new-board <id> \"<title>\" --surface <s> --desk <n>`), found by the registry and the board route and retired by deleting it (`touchpoints.ts` and `(shell)/lab/boards.ts` are gone); a spec imports `@/components/lab/exploration` and its drawings `@/components/lab` (`kit-discipline.test.ts` holds both doors); the lab's words are pick, verdict and answer (`words.test.ts`); `lab:smoke` and `lab:demo` scope themselves to what a change reached (`scripts/lab-scope.mjs`; `--all` or `FULL=1` for the whole lab), and `lab:demo` takes `--state <control>=<option>` and `--width 375`."
  - "crumbs-13 merged at 3d2cfbd6 (2026-09-29): every `.signOut(` names its scope (`local` for Sign out, the guest header and the door's \"Not you?\"; `global` for an accepted account deletion and the new `signOutEverywhereAction`, whose card is `src/app/(app)/account/sign-out-everywhere-card.tsx`); `pnpm lint` reads 0 warnings."
  - "crumbs-12 merged at 3e27e6fc (2026-09-29): `EVENT_ROOMS` runs Highlight reel, Guests, Review, Settings; the hub row's scroller is `edge-fade-scroller.tsx`; every heading is `font-heading` alone at 700, and `type-ladder-policy.test.ts` refuses a weight class beside it anywhere in `src/` outside the lab; a JSX text after an expression or element that holds an entity over several lines loses its leading space under SWC (write the number and its word as one string), and `jsx-text-space-policy.test.ts` refuses the shape."
  - "profile-setup merged at 853093a6 (2026-09-27): the profile setup is `/account/profile` (`PROFILE_SETUP_PATH` in `src/app/(app)/account/profile/invite.ts`); an account that already has a page is sent to `/account#public-profile`, so a \"Claim a handle\" row can point at the setup unconditionally. `get_public_profile` carries `private_event_count` (applied; null unless the page shows nothing)."
  - "album-guest-wiring merged at a474d130 (2026-09-25): every album is the windowed rows; the viewer takes `onNeedLinks` (an item with `url: \"\"` is a placeholder); `MasonryColumns`/`AlbumRows` take `firstPaintWidth` and `onBoxWidth`; `album-window-plan.ts` holds the first paint (`firstPaintIds`, `ALBUM_WIDTH_COOKIE`, the served plan); `/api/guests/gallery` is gone; `yours-filter` lives in `src/lib/guest/`."
  - "album-host-wiring merged at 7130d26d (2026-09-25): `HostAlbumLinksBody` (the host's links answer plus `likes`) in `@/lib/events/album-wire`; `likes-provider.tsx` seeds likes per window and bulk-likes through `like_many`; `lib/events/host-fingerprint.ts` and `/api/events/[eventId]/live` are gone; the bin is `/api/events/<id>/bin` and `bin/media`."
  - "reel-defaults-migration merged at 71cfea65 (2026-09-25), its migration applied: `events.reel_hold_sec` (NULL = the default hold; read it with `resolveHoldSec(row.reel_hold_sec)`, since the generated type says `number`), returned last by `get_event_by_qr_token`; `HOLD_STEPS_SEC`, `DEFAULT_HOLD_SEC`, `nearestHoldStep`, `REEL_MOOD_IDS` in `@/lib/reel/defaults` (their one home: the guest lane drops its copies); `setReelDefaults({ eventId, showReel?, styleId?, holdSec? })` in `@/lib/reel/defaults-action` for the view's Set for everyone and Settings; `event_stills(uuid[], int)` (authenticated, one jsonb of preview keys an event, presigned server-side like `readCoverUrls`). reel-guest-wiring and reel-host-wiring merge origin/launch-prep past it."
  - "media-viewer-wiring merged at 7eb190de (2026-09-24): `MediaLightbox`/`MediaLightboxLazy` take `origin={{ kind: \"reel\", rect }}` (rect null fades in; omit `returnTo` so the way out lands in the frame) and `startAt` (a clip's seconds); `ViewerOrigin` is exported from `@/components/shared/media-lightbox`; the photo parameter is `PHOTO_PARAM` with `readPhotoParam` in `@/lib/media/share-save`, whose Save follows the platform (the clip's finish reuses it)."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

Up to four lanes at once (Will, 2026-09-28: eight ran his Mac out of memory; heavy steps take the lock); every production build, a lane's or the kit's gate, takes turns
through `scripts/build-lock.sh` (the kit's gate takes it itself). The lanes' manifests carry everything they need; an
agent id below lives only in the Orchestrator session that spawned it (another session respawns: the runbook's "Resume
a lane").

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `crumbs-41` | admin, data and billing: Will's #60 (a child-abuse dismissal reopenable while its strike counts), two live subscriptions, the strike's lapse as a duration, the drill-in's status filter, the person report's handle, `reviewed`, four-digit ticks, the soft-deleted events' index | MERGED at `6ae5c0b1` (gate 122 green: lint, test, build, lab:smoke 157, lab:demo on five boards 22 steps; PREMISE lines for about-press and disposable-mode, which the lane argued hold and the pre-sitting desk pass re-reads); its two migrations applied by protocol after the Advisor's Q7 (strike_lapse_duration 20261002000612, the file's md5 7903a927, its check held: lapse_seconds 15,552,000, 5 lapses measured; deleted_events_index 20261002000706, 8b207b5e, its check held over 57 deleted events) | Opus, 3131 | `c9c647d0` |
| `crumbs-42` | the host app: Review's credits by its pending ids, a Settings save's page moves held, Paused, Review's one head, the dead upload count, a restore's Deleted line, the settings head's one name, the wizard's samples | MERGED at `3842b21f` (gate 121 green: test, build, lab:smoke 150, lab:demo on disposable-mode, event-ready and locked-door 17 steps; PREMISE lines for event-ready and disposable-mode, which the lane argued hold and the pre-sitting desk pass re-reads); no SQL | Opus, 3132 | `929659b8` |
| `crumbs-43` | guests: Back closes the photograph, the welcome on a shared phone, one row for a re-join, the host's own upload cap, a face that moves at once, Show-more hearts, waiting uploads on an empty album, "A guest" retired, the viewer's loading state | MERGED at `5c572152` (gate 129 green, light: `pnpm test`, the merge adding only docs to its gated head `35536130`, whose whole gate the lane ran green: lab:smoke 137, lab:demo on event-ready and locked-door 9 steps; PREMISE line for disposable-mode, event-ready and locked-door, re-read in the pre-sitting desk pass; its `gate-lane.sh` fix, an empty `.next/dev` for the gate's server, accepted, `negative.sh` green); its two migrations applied by protocol after the Advisor's Q7 (faces_move_attribution 20261002020705, the file's md5 6a4b2b98, its proof 6/6; guest_event_cap 20261002020808, f4b8c233, its proof 5/5), the types regenerated and `hostCapOf` dropped (`8877d204`) | Opus, 3133 | `b9181f7c` |
| `strip-gaps` | the EXIF strip's three documented leak windows closed losslessly (an iPhone's HEIC, HEIF and AVIF; a WebM; a JPEG's MPF secondary images), every claim of it made true | MERGED at `c573275d` (gate 125 green: lint, test, build, lab:smoke 134, lab:demo on locked-door 4 steps; PREMISE line for disposable-mode, re-read in the pre-sitting desk pass); no SQL; the backfill only ever run DRY | Opus, 3131 | `0b7c09b6` |
| `export-ends` | every album download ends and says how; the portal sees the Worker's checks, skips and heartbeat | MERGED at `15a0d3d2` (gate 126 green: test, build, lab:smoke 139, lab:demo on event-ready and locked-door 9 steps; PREMISE line for disposable-mode, re-read in the pre-sitting desk pass); its migration applied by protocol (export_worker_reports 20261002004012, the file's md5 ffb09416, its check held), the types regenerated and its two seams dropped (`aa80d056`); the Worker deployed (version `abf810e7`, its tsc and 76 tests green first, the 05:30 UTC heartbeat scheduled; it refuses malformed requests 403/405) | Opus, 3132 | `192adda3` |
| `crumbs-44` | a person's page: cards on their preview derivatives, a video-only card's face, one toggle for follow and block, the menu at 375, loading screens, the setup's follow-ons, the report's person arm under test | MERGED at `4b5adc8a` (gate 124 green: lint, test, build, lab:smoke 141, lab:demo on event-ready and locked-door 9 steps; PREMISE line for event-ready, re-read in the pre-sitting desk pass); no SQL | Opus, 3133 | `5fdd6fbb` |
| `lab-sitting` | a faster, truer sitting: the queue pictures first, a phone's one-row tabs, a copied link with a board's own state, a whole-program note, answered asks reachable, a select for long controls, a frame of its own, the shell's restyle scoped, the dock's dead exports | MERGED at `d5efa6a3` (gate 128 green over the whole lab: lab:smoke 172, lab:demo all 23 steps; PREMISE line for disposable-mode, re-read in the pre-sitting desk pass); no SQL | Opus, 3131 | `afcb3c6d` |
| `mkt-polish` | the marketing site's seams: stills through a derivative path, the 404's unused preloads, `--faint` as copy, one contract and one receipt for careers and contact, each page's FAQ, the claim scan's reach, /pricing's rows, the phone sheet's tracking | MERGED at `a20865d5` (gate 127 green: lab:smoke 142, lab:demo on about-press, demo-framing, event-ready and privacy-hero 11 steps; PREMISE lines for about-press and demo-framing, re-read in the pre-sitting desk pass); no SQL | Opus, 3133 | `66ff982f` |
| `crumbs-45` | build 36's red-team finds, the milestone's last gate: a first-page Delete in My uploads that holds (the MEDIUM), the reel card's Add photos landing, the owner's own credit | MERGED at `3b92b770` (its gate green, light: `pnpm test`, the merge adding only docs to its gated head; no SQL); rides build 37, proven on the alias before milestone 32 | Opus, 3134 | `728e53be` |
| `desk-tune-3` | the desk made true of build 38 before Will's sitting: event-ready's quoted Settings head at 375 and its paused word, disposable-mode's quoted Review head, three stale portal comments (the desk pass, 2026-10-02) | MERGED at `03a24b3d` (gate 130 green, light: `pnpm test` 8,711, the merge adding only docs to its head, whose whole gate the lane ran green: lab:smoke 20, lab:demo on event-ready, disposable-mode and demo-framing 16 steps at both widths); lab files only, no SQL | Sonnet, 3131 | `24f7eb11` |
| `door-wiring` | locked-door's picks: the doorway family (one shared design), the waiting door's chooser, the shut door for a broken link; round 2's swing; privacy exactly as before | MERGED at `f538cf8d` (gate 135 FULL green: lab:demo all; the lane's gate: test 8,822, build, lab:smoke 136; its Question 1 answered by Will's "Only what's shown today" at `760cc982`); no SQL | Opus, 3131 | `fefe9d30` |
| `ready-wiring` | event-ready's picks: the checklist at the hub's head, Settings as steps, Create's hand-off, the code's corner mark; readiness into src/lib; the board retired | MERGED at `38d4f1ec` (gate 133 green: lab:smoke 129; the lane's whole gate on its head: test 8,733, build, lab:smoke 132, lab:demo on disposable-mode); no SQL | Opus, 3132 | `8698a5b8` |
| `mkt-wiring` | privacy-hero's lens on /features/privacy; about-press's kit band on /about#press, /press 307; both boards retired | MERGED at `fcbd2f89` (gate 134 green; the lane's whole gate on its head: test 8,711, build, lab:smoke 139, the answered steps pressed 7 of 7; the lens's words 7.55:1 or better at 21 widths, about 60 fps at 375 under 6x throttle); no SQL | Sonnet, 3133 | `fefe9d30` |
| `crumbs-46` | /me for a handle-less account (his A), the strike line's repeated date, /pricing's sticky head, event-card's comment | MERGED at `2ada77e1` (gate 131 green, light: `pnpm test`, the merge adding only docs to its head, whose whole gate the lane ran green: test 8,725, build, lab:smoke 141); no SQL | Sonnet, 3134 | `fefe9d30` |
| `lab-prefetch` | the lab's keyless prefetch 404s on production builds, at the source | MERGED at `feaab8a9` (gate 132 green over the whole lab: lab:demo all; measured on production builds, 247 refused requests on the Library and one per step page before, 0 after); shell and doc only, the gate untouched | Sonnet, 3135 | `fefe9d30` |
| `host-dashboard` | board r1 [desk 25]: the host dashboard reconceived (purpose, needs, events, arrivals) | MERGED at `a799127c` (gate 137 green; the lane's gate: test 8,798, build, lab:smoke 6, lab:demo 4 steps at 1440 and 375); lab only; on the desk at the night's final build | Opus, 3132 | `2852a232` |
| `create-wizard` | board r1 [desk 60]: the whole create wizard (shape, the mode step as create=cards redrawn with a deeper compare, the hand-off) | MERGED at `ae6429ee` (gate 136 green: lab:demo on create-wizard; the lane's gate: test 8,784, build, lab:smoke 5, lab:demo 3 steps at 1440 and 375); lab only; on the desk at the night's final build | Opus, 3134 | `2852a232` |
| `demo-r3` | board demo-framing r3 [desk 90]: his stage hybrid in three takes (rise, open, words); the demo's door identity | MERGED at `b29aeaf1` (gate 138 green; the lane's gate: test 8,853, build, lab:smoke 4 and --all 174, lab:demo 2 steps at 1440 and 375); lab only; on the desk at the night's final build | Opus, 3133 | `a07496c3` |
| `crumbs-47` | two guest LOWs: Back over a credit's look; the flip's stale failure sheet | MERGED at `3fe44072` (gate 139 green; each red on the old code); no SQL | Sonnet, 3136 | `8db9cd47` |
| `locked-door-r3` | board locked-door r3 [desk 30]: the reveal into the album; one calm idle loop for the waiting and shut doors | MERGED at `52f3e61e` (gate 141: its one red, `password-gate.test.tsx`'s stalled-hold case, a flake under load, 3 of 3 alone and the whole suite 8,874 green on a rerun; lab:demo on locked-door green); lab only; on the desk at the night's final build | Opus, 3131 | `8db9cd47` |
| `event-header` | board r1 [desk 50]: the host hub's head and the guest album's head (guest, host, stays) | MERGED at `461717f0` (gate 140 green; the lane's gate: test 8,832, build, lab:smoke 5, lab:demo 3 steps at 1440 and 375 and with knobs); lab only; on the desk at the night's final build | Opus, 3135 | `8db9cd47` |
| `identity` | board r1 [desk 10]: Partyreel's atomic identity, three or four complete families across every primitive, on a specimen and three real screens (his library prompt) | RUNNING since 2026-10-02 09:55Z (round 11, wave 2) | Opus, 3132, agent `a2da3ac367414ec91` | `04afe52d` |
| `disposable-r3` | board disposable-mode r3 [desk 80]: four new cameras (two from viewfinder, two from reel, modern), a new waiting room (no tilt), save with the looks on real photos beside none; video and cost staged | RUNNING since 2026-10-02 09:55Z (round 11, wave 2) | Opus, 3134, agent `a72f2f8607b28f7e7` | `04afe52d` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a2e44f7ad679754e8`, respawned
2026-10-01 18:15Z in this session; no question open. Q6 (crumbs-37's two migrations and crumbs-38's cursor file against
the deployed readers) answered "apply as written", acted on: the four applied by protocol (`f6d72a9d`); the prune runs
before milestone 32 only when build 36's `/api/cron/purge` is hand-run on the alias, and a milestone-31 tab parked on a
pruned album may then keep a stale tile until it reloads (expected; the red-team brief says so). Q1 to Q5 are answered
and acted on. From another session, respawn it from
`usher/kit/advisor-prompt.txt`.

**Handoff across accounts.** The Orchestrator session is `2ba90542-62d6-487c-8c79-3657619f9133` (hi@willgibs.com,
seated 2026-10-01 18:08Z; its weekly resets Tuesday 2026-10-06 21:00Z, willg97's Sunday 2026-10-04 13:00Z; Will hands
off only when one maxes its weekly limit). willg97's `157caa18` stays idle (it would resume mid-task at its reset) and
`b01c012e` stays retired. An agent id lives only in this session; from another, respawn each running lane per the
runbook's "Resume a lane": kill by port any dev server left on 3131 to 3135 (and any orphaned headless Chrome), then
`spawn-prompt.txt` filled (same track, same port) plus a note naming its pushed commits, what remains, its
predecessor's transcript at
`~/.claude/projects/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/subagents/agent-<id>.jsonl`
(grep it, never read it whole), that a stale `.next/dev/lock` may be deleted and that MCP tool ids change with the
account. Connectors follow the account: Claude in Chrome (every red-team needs it), the Supabase MCP on
`ddafaemglzmuekbtjwzn`, the Vercel MCP on his personal team (deploys ride `$VERCEL_TOKEN`; only runtime logs need P3).

**Build 36's red-team** is done (19:00 to 22:15Z, `../partyreel-wt/_scratch/redteam-36/ledger.txt`): every drivable walk PASS but one MEDIUM, a first-page Delete in My uploads that comes back until a reload, with one LOW (the reel card's Add photos stopping short, a popover's focus return) and two NITs (the owner's own credit a "?" disc; the closed strike line saying one date twice, which waits for crumbs-41's merge), all but the last in `crumbs-45`; the purge hand-run twice, ok then skipped, the switch ON; strikes unchanged (willg97 2, partyr33l 7, hi@willgibs 0, whose 3 instant hides lapse about 20:58Z 2026-10-02); its RT36 events deleted. Not driven: visible-tab steps (Will's Chrome window never came forward), Sentry (the `.env.local` token answers 403 on reads), the prune's client manifest (needs a tab frozen, not hidden, during the first run).

Relays that live only in an agent: none.

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad (`/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/scratchpad`,
until a reboot) holds the specs and gate logs (the next gate is 119, the calls file numbers on from 65); nothing there
is needed that these lines and the manifests do not carry. Everything a successor reads lives in the repo or in
`../partyreel-wt/_scratch/` (the calls file, the red-team briefs and ledgers).

Batch 8 shipped whole as milestone 31 (`7bd3b947`, 2026-09-30; 40 lanes, crumbs-12 to gone-link-soft; their merges and
records carry the rest). Merged in batch 9: crumbs-28 (`8ea749bf`), hide-strikes (`669e1717`, its migration applied by
protocol, 20260930205935), crumbs-29 (`47b5cce8`, its three migrations applied), crumbs-30 (`d0eaf507`; gate 107 green
but lab:demo's `about-press.facts` dev stall, ROADMAP's line), crumbs-31 (`5898b6d8`, no SQL), demo-stall (`7990d19d`, gate 109 whole and green: the lab:demo stall's root, a Next dev bug, patched), crumbs-32 (`04ddf22e`, no SQL), crumbs-34 (`25b21341`, no SQL; gate 111), crumbs-33 (`569a3668`, gate 112; its two migrations applied by protocol after the Advisor's Q5, 20261001045258 and 045429), crumbs-35 (`9b452bcb`, gate 113, no SQL), crumbs-36 (`901ad613`, gate 114, no SQL), crumbs-39 (`be0abd7b`, gate 115, no SQL), crumbs-37 (`cc49cf17`, gate 116; its two migrations unapplied, its row), crumbs-38 (`c95e6429`, gate 117; its two migrations unapplied, its row), crumbs-40 (`96a5d8ee`, gate 118, no SQL). Schema-pass part 2 is applied (20260930204037).

## Next, in order

**Round 11** (Will, 2026-10-02 06:30Z): his desk answered on build 39 and transcribed (`3e1271b9`); approving the plan
was his yes to run through the night to a natural close at the machine's limits (up to six lanes on measured memory;
the runbook's four is the floor he lets me raise), then Moltbook one pass an hour; no milestone without his yes. His
four answers: each redesign board draws whole bespoke designs under one shared direction; wire a screen first, then
cut the boards drawn on it; the doorway shows only what the album's read gives today (a gated door names the album,
never the host; private, Only me and blocked doors name nothing; no RPC change); the disposable foundation waits for
round 3. His library prompt (the atoms still read as shadcn; identity as a sum total) opens an `identity` board.

1. **Wave 1, running** (In flight above): door-wiring, ready-wiring, mkt-wiring, crumbs-46, lab-prefetch. Integrate each
   on its handoff; a retired board's ledger (`docs/reviews/<board>.json`) is mine to delete at its record, then
   `registry.test.ts` and `queue.test.ts`.
2. **Wave 2, each cut from the production its dependencies leave** (desk place in brackets): `identity` r1 [10] after
   door-wiring, ready-wiring and crumbs-47; `host-dashboard` r1 [25] after ready-wiring and crumbs-46 (it inherits
   event-ready's `needs` with his note quoted in `opening.earlier`); `locked-door` r3 [30] after door-wiring (the reveal
   into the album with the album behind polished, calm idle loops; its `lives` inside `door/`); `event-header` r1 [50]
   after door- and ready-wiring (the hub's head and the guest album's head); `create-wizard` r1 [60] after ready-wiring
   (the whole wizard, its mode step a named redraw of `create=cards` with his deeper compare); `crumbs-47` after
   door-wiring (Back over the credit look, the flip's stale sheet); `disposable-mode` r3 [80] after door-wiring,
   ready-wiring and crumbs-47 (camera: two branches each from viewfinder and reel, modern; waiting: a new round, no
   tilt; save: the looks on real guest photos beside none; `video` and `cost` staged after camera); `demo-framing` r3
   [90] after mkt-wiring (his stage hybrid in two or three takes; the demo's door identity). `lab-window` (the
   frame-scoped window) waits for his next sitting: it edits `ui/popup` and `ui/sheet`, which `identity` draws. The eight
   specs are written (`specs-r11/` in this session's scratchpad; a successor rewrites them from this list). Page boards own composition, `identity` owns the atoms; every redesign brief carries his one direction
   (bespoke and experiential, sleek, sophisticated, no tilt, minimal but information-rich, media is the color).
3. **Build 40 is ON THE ALIAS** (`26743369`, 2026-10-02 09:05Z) and its red-team PASSED (09:10 to 10:30Z,
   `../partyreel-wt/_scratch/redteam-40/ledger.txt`): every drivable walk, no MEDIUM or HIGH; one LOW (a hidden tab's view
   transition), a NIT and a production warning to the ROADMAP; the redaction held on every kind of door (a blocked
   guest's page byte-identical to Only me's but the trace meta). Its undriven steps are Will's (below).
4. **Before the final build**: the pre-sitting pass (`board-card.mjs --desk`) and `lab-scope --since <each cut>`, a
   desk-tune where a drawn claim moved; then the final `[preview]` carries every board, the desk ready when he wakes
   (identity first, then host-dashboard).
5. **The close**: every lane integrated, the gate green, STATUS and this file current, the calls file re-sent with a
   morning note (what reached the alias, the desk's order, every call in his name, what needs his yes); then Moltbook.
   After his next sitting: identity's wiring, the disposable foundation, the demo event's data, the dashboard's,
   headers' and wizard's wirings.

## Waiting on Will

- **His desk**: answered 2026-10-02 06:00Z on build 39 and transcribed (`3e1271b9`); the next desk is round 11's boards.
- **The calls file** (74 calls to overrule, numbered, one a lane through desk-tune-3; compiled from each merge's "Calls
  his to overrule", `git show <merge>^2:docs/tracks/<track>.md`, kept at `../partyreel-wt/_scratch/calls/relay-calls.md`
  and sent to him as it grows). He reviews it on 2026-10-01 against the product vision ("keep the calls file running":
  each merge's calls join it). His two decisions are answered (2026-09-30): A, the proof mail stays off until the emails
  round (ROADMAP's Emails bucket); B, the instant hide's bar becomes three strikes lapsing after 180 days ("I don't want
  to prevent a well-meaning reporter from a second report if I simply disagree with the first"), `hide-strikes`'s. And
  #60 (2026-10-01, "Yes, 180 days"): a child-abuse dismissal stays reopenable for as long as its strike counts, other
  kinds 30 days; the admin lane builds it.
- **The morning of 2026-09-30, on his phone** (his word): `disposable-mode` r2's Measure a phone on the alias (the
  board's dock: Open the camera, Take a frame, the camera app's photo, on his iPhone and an Android if he has one; paste
  the line back: the full-size promise rides on it); Q1 (on a phone the code card fills the screen, but Back
  leaves the album; should Back close it like the other full-screen popups?); the 2-minute real-upload check on the
  alias (a first photo, landscape, as a signed-out guest at a held-uploads event: the keep, her uploads' "Waiting for
  approval" and the tracker's badge, no held tile at the album's head; then Confirm your email, the one beat, the told
  name's Change; its `media.file_size_bytes` checks the 3.5 MB estimate); the 10-second iPhone check on partyreel.com
  (one tap on Save opens the system sheet and a shared photo arrives as a photograph; Settings > Camera > Record
  Video's size for 1080p at 30 fps, against the 65 MB a minute estimate).
- **The walks only he can drive** (build 30's red-team, optional):
  - an event password typed once (Let back in's password landing);
  - the hub under macOS reduced motion;
  - a tab hidden, then shown (the hub's album);
  - crumbs-27's two walks that need a second signed-in device (the host's phone while partyr33l holds the shared one).
  - crumbs-31's magic-link return: the confirm door's email link tapped in the same browser plays the follow moment.
  - build 40's: the let-in's swing seen in a visible tab (a guest signed in on his Chrome), a password door's swing
    (typed), and reduced motion over the signed-in door states;
  - build 38's: the reel card's Add photos at 375x667 on an event with 0 or 1 photo, its smooth scroll's feel (a
    visible tab; the mechanics passed hidden); crumbs-41's card, a disposable host paying Pro in two Checkout tabs
    (4242): Sentry's `stripe_grant_repointed_subscription`, the followed subscription cancelled in Stripe TEST leaving
    `profiles.tier` pro on the other, and the account's deletion leaving none of its subscriptions billing.
- **Whenever convenient:** the Vercel MCP on this account points at his personal team; re-pointed at P3 it reads
  runtime logs (deploys ride `$VERCEL_TOKEN` and need nothing).
- **Asks that come due later**: Libraries.dev access for a lane (when the help chat is cut), and any F1 frames he loves
  (when the admin look is cut).
