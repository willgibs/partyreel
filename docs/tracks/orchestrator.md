---
track: orchestrator
status: open
cut: "26596e48"          # the launch-prep SHA this state was written at
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

Round 12 (Will's desk on build 41, answered 2026-10-02 18:00Z and transcribed at `ab799674`; approving its plan was his
yes to run continuously to the round's close, tonight included, at the machine's limits; Moltbook's hourly passes only
after the close). Up to six lanes (ports 3131 to 3136) while `memory_pressure` reads at least 50% free and swap stays
flat; a lane in its gate, or the milestone's full gate, counts as two. Every production build takes turns through
`scripts/build-lock.sh`. An agent id lives only in the session that spawned it (another session respawns: the runbook's
"Resume a lane").

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `header-wiring` | event-header's picks: the cover, the hub wearing it with its sticky bar, the shutter with his scroll fade and a right-hand reel button; the atom contract built in `components/ui/`; the tracker's Remove | MERGED at `e771e80b` (gate 150 green: lint, test, build, lab:smoke 171, lab:demo on seven boards; the lane's gate on its synced head: test 9,035, build, lab:smoke 168); PREMISE re-reads for identity and create-wizard at the desk pass; no SQL | Opus, 3131 | `a167a5fcddb3a287a` |
| `dashboard-wiring` | host-dashboard's picks: the stage, this week, the live wall, seasons; the four carried calls | MERGED at `ad70c894` (gate 148 green: test, build, lab:smoke 148, lab:demo on create-wizard, event-header, host-dashboard and identity; the lane's gate: test 8,963, build, lab:smoke 149); no SQL | Opus, 3132 | `abf012b4ed5f4a4d8` |
| `disposable-foundation` | Q9's two answers, the per-row seal from one predicate, develop as a write, the roll on live shots with its ceiling, her own held and sealed items, Settings' control | MERGED at `e1b2ad2e` (gate 152 green: lint, test, build, lab:smoke 161, lab:demo on five boards; the lane's gate on its synced head: test 9,191, build, lab:smoke 163); its migration applied by protocol after the Advisor's Q10 (disposable_foundation 20261002223236, md5 the file's b2510738; advisors 19/4/35), the types regenerated and its six seams dropped (`2c32edb6`) | Opus, 3133 | `a3c3c52d33e26b082` |
| `identity-r2` | board identity r2 [desk 10]: voice as a layer, then actions, fields, layers and status in his voice | MERGED at `3af9a608` (gate 149 green: test, build, lab:smoke 22, lab:demo on identity; the lane's gate: test 8,907, build, lab:smoke 7, lab:demo 5 steps at 1440 and 375 with its knobs); lab only; on the desk at build 44 | Opus, 3134 | `a3fb5687c66a613b9` |
| `create-wizard-r2` | board create-wizard r2 [desk 60]: the room's flow screen by screen in his layout (flow, add, look, beat) | MERGED at `34dba1fa` (gate 147 green, light: test, the merge adding only docs to its gated head; the lane's gate: test 8,902, build, lab:smoke 22, lab:demo 4 steps at 1440 and 375); lab only; on the desk at build 44 | Opus, 3135 | `aaa11532349605aa9` |
| `demo-r4` | board demo-framing r4 [desk 90]: five heroes (card recommended, plate, field, wall, door), each live at 1440, a tablet and 375 | MERGED at `31b93027` (gate 154 green: test, build, lab:smoke 18, lab:demo on demo-framing; the lane's gate: test 8,905, build, lab:smoke 3, lab:demo 1 step of 5 options); lab only; on the desk at build 44; its photographs asked (ASSETS 39 to 41) | Opus, 3136 | `a557d2f6e3b8e9fd8` |
| `save-speed` | the viewer's Save immediate: his iPhone's 30 s measured to its cause (a second download on the tap behind R2's HTTP/1.1 connections, WebKit's 5 s activation) and fixed by holding the original the viewer draws | MERGED at `b86572ce` (gate 153 green: lint, test, build, lab:smoke 152, lab:demo on three boards; the lane's gate on its synced head: test 9,083, build, lab:smoke 134); its uploads-and-r2.md and guest-flow.md lines placed | Opus, 3135 | `a4d3efdea8ef3c604` |
| `host-dashboard-r2` | board host-dashboard r2 [desk 25]: events at forty (Recent on top recommended), what the stage leads with on a quiet day, whether she pins it | MERGED at `63885f15` (gate 151 green: test, build, lab:smoke 21, lab:demo on host-dashboard; the lane's gate: test 8,970, build, lab:smoke 21, lab:demo 3 steps at 1440 and 375); lab only; on the desk at build 44 | Opus, 3132 | `aea1e17a667c43dfd` |
| `crumbs-50` | fourteen off-round crumbs (the home's prefetch on intent, demo doors, type steps, tokens, dead fixtures, a help line, legal print, inline code, the sign-in cue, the nav's one source, the blog's trips) | MERGED at `318493d5` (gate 155 green: test, build, lab:smoke 154, lab:demo on four boards; the lane's gate: test 9,000, build, lab:smoke 130); no SQL | Sonnet, 3134 | `ad78669c34ed8b55e` |
| `door-reveal` | locked-door r3's picks (the walk-through onto the cover, the turning breathing idle), the door always the first byte, the name after the email, the chooser's photos across a reload, red-team 43's MEDIUM page half; the board retired | MERGED at `d3d172fd` (gate 158 green: lint, test, build, lab:smoke 157, lab:demo on five boards; the lane's gate: test 9,324, build, lab:smoke 155); PREMISE re-read for take-home at the desk pass; the locked-door ledger retired; no SQL | Opus, 3131 | `aec876b5d6becfb32` |
| `event-header-r2` | board event-header r2 [desk 50]: the hub head's facts (the night on a dial recommended), its doors, one way every room opens | MERGED at `50e7a359` (gate 156 green: test, build, lab:smoke 19, lab:demo on event-header; the lane's gate: test 9,051, build, lab:smoke 5, lab:demo 3 steps at 1440, 375 and the week before); lab only; on the desk at build 44 | Opus, 3133 | `a65948cf0ee9a18da` |
| `the-wait` | board the-wait [desk 35], new: the one waiting experience (model first: one question of time recommended; the wait, the arrival, the cover, the name, approve plus develop); the room's screen link his Question | MERGED at `732146d7` (gate 160 green: test, build, lab:smoke 22, lab:demo on the-wait; the lane's gate on its synced head: test 9,345, build, lab:smoke 22, lab:demo 6 steps at 375 and 1440); lab only; on the desk at build 44 | Opus, 3132 | `a9256f068ba6dbfb9` |
| `disposable-camera` | disposable-mode r3's camera wired (the timeline, hold to film, the server's roll, full size) and red-team 43's upload half; the board retired at the record | MERGED at `c45b69a8` (gate 161 green over the whole lab: lab:smoke 193, lab:demo all; the lane's gate on its synced head); the disposable-mode board and its ledger retired (registry, queue and manifest tests 85, test 9,425); no SQL | Opus, 3135 | `a420bc1f815081dce` |
| `take-home` | board take-home [desk 70], new: how photographs leave (guest=select, save=light, host=two recommended) | MERGED at `303c6e82` (gate 157 green: test, build, lab:smoke 19, lab:demo on take-home; the lane's gate: test 9,269, build, lab:smoke 5, lab:demo 3 steps at 1440 and 375); lab only; on the desk at build 44 | Opus, 3136 | `af6d50656e540a41c` |
| `redteam-43` | build 43's red-team (`96c6dcdc`) | DONE 2026-10-03 00:50Z: two MEDIUMs (the develop album's tracker, fixed in door-reveal and the camera; the hub's Reel card flash, `crumbs-52`), a LOW and four NITs; the leak matrix PASS on every route; RT43 events deleted; ledger `../partyreel-wt/_scratch/redteam-43/ledger.txt` | Opus, Will's Chrome | `a7abfa3530cd42e8c` |
| `crumbs-51` | words made true after round 12's merges: four help articles and the admin switch on the retired reel tile and the welcome screen, careers, two hero comments, host-app.md's pulse | MERGED at `86dfef81` (gate 159 green; the lane's gate: typecheck, lint, test, build, lab:smoke); no SQL | Sonnet, 3133 | `ae456d79d5e6fcd48` |
| `crumbs-52` | red-team 43's second MEDIUM: the hub's Reel card (a soft navigation) showed the album before the reel; the curtain made to stand from the first frame; the camera's page half and red-team 43's two NITs | MERGED at `1cc96371` (gate 163 green, light: test 9,457; the lane's gate on its synced head: test, build, lab:smoke 148); no SQL | Sonnet, 3134 | `a43b82a5650dc8a64` |
| `lab-frame` | the lab's Frame a faithful window: a frame-scoped window for the media hooks, Radix's layers inside the frame, a glow filter host | MERGED at `0d69c92b` (gate 164 green, full: test, build, lab:smoke 186, lab:demo all 25 steps; the lane's gate: test 9,347, build, lab:smoke --all 188, lab:demo --all 19 steps); its design-system.md line placed; no SQL | Opus, 3131 | `ab041e184bfe9d164` |
| `crumbs-53` | the next words after round 12: the reel's place and the welcome in help and marketing, reel.md, the welcome cookie's tests, one home for the develop time's words, the hero fill's and pulse's names | MERGED at `57825ec2` (gate 162 green, light: test; the lane's gate on its synced head: test 9,430, build, lab:smoke 150); no SQL | Sonnet, 3133 | `a60b9ee6392ade237` |
| `redteam-44` | build 44's red-team (`ece3f8a1`): the door's first byte and walk-through, the idle, the name after the email, the album's camera, both of red-team 43's MEDIUMs again, regressions | running (from 01:37Z); brief and ledger `../partyreel-wt/_scratch/redteam-44/` | Opus, Will's Chrome | `a186d402e4367102f` |
| `desk-premise` | the pre-sitting desk pass's PREMISE re-reads (no two of the 25 asks one decision; host-dashboard and demo-framing unmoved) | DONE: identity, event-header, create-wizard and take-home HOLD; the-wait MOVED (crumbs-52's Take photos on a camera album and the Reel card's "Live at the develop", plus three older slips): `desk-tune-4`; identity's sheets style a `data-n` production's glyph count lacks: the same lane | Opus | `a20a4c46761a0fb61` |
| `account-exit` | Will's ask (2026-10-03): leaving made clear: the dialog's key points with the purge's time in her zone, the blocked sign-in's why and when (`user_banned`), the operator's Cancel deletion, her own photos out of others' albums (a checkbox, unchecked); refund none and said, his to overrule | running (cut at `891767cc`) | Opus, 3134 | `acd7d29709bfbc8a8` |
| `desk-tune-4` | the-wait's drawings made true to production again (the camera album's Take photos, the Reel card's words, three slips) and `data-n` on production's glyph count for identity's sheets; no ask moves | running (cut at `8fef7143`) | Sonnet, 3132 | `aefd55ce76aafcdec` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a2e44f7ad679754e8`, this session. Q8
(round 12's plan) answered with 21 corrections, all folded into the briefs; the next consult is the foundation's
migrations before they are applied. From another session, respawn it from `usher/kit/advisor-prompt.txt`.

**Handoff across accounts.** The Orchestrator session is `2ba90542-62d6-487c-8c79-3657619f9133` (hi@willgibs.com,
seated 2026-10-01 18:08Z; its weekly resets Tuesday 2026-10-06 21:00Z, willg97's Sunday 2026-10-04 13:00Z; Will hands
off only when one maxes its weekly limit). willg97's `157caa18` stays idle and `b01c012e` stays retired. From another
session, respawn each running lane per the runbook's "Resume a lane": kill by port any dev server left on 3131 to 3136
(and any orphaned headless Chrome), then `spawn-prompt.txt` filled (same track, same port) plus a note naming its pushed
commits, what remains, its predecessor's transcript at
`~/.claude/projects/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/subagents/agent-<id>.jsonl`
(grep it, never read it whole), that a stale `.next/dev/lock` may be deleted and that MCP tool ids change with the
account. Connectors follow the account: Claude in Chrome (every red-team needs it), the Supabase MCP on
`ddafaemglzmuekbtjwzn`, the Vercel MCP on his personal team (deploys ride `$VERCEL_TOKEN`; only runtime logs need P3).

Relays that live only in an agent: none (red-team 43's two MEDIUMs are merged: the develop album's tracker in
`door-reveal` and `disposable-camera`, the hub's Reel card in `crumbs-52`).

**Q9 is answered** (the Advisor, 21:05Z) and acted on above. The waiting experience itself goes to a design board (below).

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad holds the specs (`specs-r12/`) and gate logs (the next gate is 164, the calls file numbers on
from 110); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls file, the red-team briefs and ledgers).

## Next, in order

1. **Running:** `lab-frame` (the Frame a faithful window) and `account-exit` (Will's ask, his calls on the refund, the
   checkbox and the window in its Questions). Integrate each as it hands off (gates from 164); both ride build 45.
2. **Build 44** (`ece3f8a1`) serves the alias; its red-team walks from
   `../partyreel-wt/_scratch/redteam-44/brief.md` (its stamp `BUILD44` filled in): the door's first byte and
   walk-through, the idle, the name after the email, the camera on a camera album (a fake stream in its own headless
   Chrome), both MEDIUM fixes again, regressions. hi@willgibs.com is back as the Free host (nameless).
3. **The pre-sitting desk pass:** `board-card.mjs --desk` over the seven boards (identity r2 10, host-dashboard r2 25,
   the-wait 35, event-header r2 50, create-wizard r2 60, take-home 70, demo-framing r4 90) and `lab-scope --since`
   their cuts; PREMISE re-reads named at the gates (identity, create-wizard, take-home, the-wait); a desk-tune lane only
   if a drawn claim moved. Then the final `[preview]` (45) for his sitting, identity first.
4. **The close:** STATUS rewritten, the calls file sent (91 to 109 tonight), his morning message; then Moltbook one
   pass an hour.

## Waiting on Will

- **His walks** (2026-10-02): the phone measurement, the real upload, the Save check and the two-Checkout-tabs check
  are DONE (the last passed whole on 2026-10-03: two live test subscriptions, the newer followed; the followed
  one cancelled, the survivor followed with Pro kept; the account deleted, nothing left billing; hi@willgibs.com
  restored before the purge at his ask). Owed: Record Video's 1080p size on his iPhone; after build 44, the walk-through when let in,
  a password door, reduced motion over the door states and the new hub, the camera on his phone.
- **The calls file** (90 calls, `../partyreel-wt/_scratch/calls/relay-calls.md`): he reviews it today.
- **His next desk** on build 44.
- **Asks that come due later**: Libraries.dev access for a lane (when the help chat is cut), any F1 frames he loves
  (when the admin look is cut), asset 38 (the privacy hero's photograph).
