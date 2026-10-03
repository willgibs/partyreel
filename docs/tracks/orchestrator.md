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

Round 13 (Will's desk on build 45, answered 2026-10-03 06:30Z and transcribed at `5dc4dee8`; approving its plan was his
yes to run continuously to the round's close overnight; Moltbook's hourly passes only after it). Milestone 34 is live
at `2aae7331` (tag `milestone-34`, gate 168 green, the walk PASS). Up to six lanes plus the research lane while
`memory_pressure` reads at least 50% free; every production build takes turns through `scripts/build-lock.sh`. The
plan's whole text (lane splits, the Advisor's Q11 corrections, Will's answers) is
`~/.claude/plans/please-resume-your-role-gentle-crown.md`; the briefs carry it.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `identity-wiring` | identity r2's voice=camera, layers=display, status=lights at the source; corners only as focus | MERGED at `3d80670e` (gate 172 green: lint, test, build, lab:smoke, lab:demo all; the lane's: test 9,590, build, lab:smoke 193, all 25 desk steps at 1440 and 375) | Opus, 3131 | `afc6d0be1a26b1f6f` |
| `wait-wiring` | the-wait's picks: time on the guest screens, Settings' album styles, the contact sheet, the host's cover as guests see it, "Disposable", approval never with a develop (a CHECK migration; held photos join the roll at the switch) | MERGED at `c02893c1` (gate 174 green, light: test; the lane's gate on its synced head); its migration `20261003100000_approval_never_with_a_develop.sql` waits for the Advisor's Q12, then apply by protocol | Opus, 3132 | `af468aba998f4f11a` |
| `take-home-wiring` | take-home's picks: Select then Save, Save into Photos at phone size with sizes, the host's Originals and Phone size; the phone copy; the media-cost guard | MERGED at `f8f23300` (gate 175 green: lint, test, build, lab:smoke, lab:demo on five boards; the lane's: test 9,862); its migration `phone_copy` APPLIED by protocol after the Advisor's Q13 (20261003104506, md5 the file's f999035b; one `create_media` and one `create_media_as_host`, 12 and 13 args); wait-wiring's `approval_never_with_a_develop` APPLIED after Q12 (20261003103742, md5 86ac4dea); types and seams next, then the export Worker | Opus, 3133 | `aa8ae040fb361d3c6` |
| `rooms-wiring` | event-header's rooms=over: Review, Guests and Settings in one panel over the hub, the reel full screen, See it as a guest (a true guest render) | MERGED at `d6452566` (gate 171 green: lint, test, build, lab:smoke, lab:demo on four boards; the lane's: test 9,670, build, lab:smoke 163); See it as a guest gated on the host's own event read (`getEvent`, RLS) and drawn inert; wizard-wiring's host-app.md lines placed with it | Opus, 3134 | `ac7150b41d7dc7ae0` |
| `wizard-wiring` | Create as the room with flow=carry, look=places, beat=develop; the add step waits for create-wizard r3 | MERGED at `feca808e` (gate 169 green, light: test 9,621; the lane's gate: test 9,625, build, lab:smoke 151, lab:demo each step pressed at 1440 and 375; 49 tests red against production first); its host-app.md lines (its manifest, `feca808e^2`, from line 76) placed at rooms-wiring's record, which owns the doc | Opus, 3135 | `afd8421950f236037` |
| `identity-r3` | board identity r3 [desk 10]: system (keys and wells recommended, all rings, ink), room (graphite recommended), edge (everything that floats recommended) | MERGED at `792dbc05` (gate 170 green: lint, test, build, lab:smoke, lab:demo identity 3 steps; the lane's: test 9,585, lab:demo eight runs at 1440, 375 and its knobs); lab only; on his next desk | Opus, 3136 | `a4b60128e7777e310` |
| `cost-model` | research: the per-event and per-month cost model across every vendor, the levers ranked, into PRICING.md | MERGED at `cdefd776` (light gate: test 9,577; the lane's: test, typecheck, lint; every price read from its vendor's raw page 2026-10-03, one invented WebFetch summary caught); his decisions in the morning message | Opus, none | `adc26155bbe485569` |
| `create-wizard-r3` | board create-wizard r3 [desk 60]: the add step's second exploration, four polished options in the wired room (styles recommended: Settings' album-style cards) | MERGED at `97798963` (gate 173 green, light: test; the lane's: test 9,733, build, lab:smoke, lab:demo at 1440 and 375); lab only; on his next desk | Opus, 3135 | `a5c57d3cc25a5c81c` |
| `demo-framing-r5` | board demo-framing r5 [desk 90]: the hero's stage, a more polished set from r4's five | MERGED at `bf26d730` (gate 177 green: lint, test, build, lab:smoke, lab:demo demo-framing); lab only; on his next desk | Opus, 3136 | `a8f0856b99cc9ed00` |
| `event-header-r3` | board event-header r3 [desk 50]: facts (the strip free of a timeline, new ideas; the dial banked) and doors (three refined, each with its sticky form) | MERGED at `a2affb3d` (gate 179 green, light: test); lab only; on his next desk | Opus, 3134 | `ac26dc46271773f37` |
| `crumbs-55` | four crumbs: frame-ancestors and X-Frame-Options against clickjacking (both projects), the next-step chip's room link, the brand kit's fifth ground and tokens, How it works' Create picture | MERGED at `599ede52` (gate 176 green: lint, test, build, lab:smoke, lab:demo all) | Sonnet, 3131 | `af911157a822471ec` |
| `host-dashboard-r3` | board host-dashboard r3 [desk 25]: events for 1 to 10 scaling to hundreds, the empty featured stage, the feature's rule as a choice | MERGED at `a8b21659` (gate 178 green: lint, test, build, lab:smoke, lab:demo host-dashboard); lab only; on his next desk | Opus, 3135 | `a96b83311939a385c` |
| `event-dates` | an optional end date read everywhere (Settings' range, the dashboard's week, live today and stage, the formatter's ranges, the develop default after the last day; never the lifecycle); lead=made; its migration for the Orchestrator | running (cut at `9af92e54`); WIP pushes each milestone | Opus, 3132 | `a4f91d827093a1238` |
| `the-wait-r2` | board the-wait r2 [desk 35]: the arrival, his first choice drawn properly (the develop as the album's first load, two or three takes), the premiere first and into place refined | running (cut at `9af92e54`); WIP pushes each milestone | Opus, 3133 | `a0a9f95e641174de4` |
| `redteam-46` | build 46's red-team (`9af92e54`): the waiting room and the develop, the pair refused, taking photos home (the phone copy, the host's two sets), the rooms and See it as a guest, Create, identity across the app, the frame headers, regressions | running (from 11:35Z); brief and ledger `../partyreel-wt/_scratch/redteam-46/` (its ledger is its handoff) | Opus, Will's Chrome | `a8acc8ebda6e32988` |
| `crumbs-56` | red-team 46's MEDIUM: the waiting contact sheet draws her own video as a broken image; a video draws its first frame | running (cut at `15259241`); WIP pushes each milestone | Sonnet, 3131 | `aa29965c66e3771f2` |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a2e44f7ad679754e8`, this session. Q8
(round 12's plan) answered with 21 corrections, all folded into the briefs; the next consult is the foundation's
migrations before they are applied. From another session, respawn it from `usher/kit/advisor-prompt.txt`.

**Handoff across accounts** (2026-10-03 11:31Z: this account's weekly at 99%, the auto-kill imminent; memory 55% free after a 09:30Z squeeze; Will's rule: watch from 96%, refresh this block often from 98%). The Orchestrator session is `2ba90542-62d6-487c-8c79-3657619f9133` (hi@willgibs.com,
seated 2026-10-01 18:08Z; its weekly resets Tuesday 2026-10-06 21:00Z, willg97's Sunday 2026-10-04 13:00Z; Will hands
off only when one maxes its weekly limit). willg97's `157caa18` stays idle and `b01c012e` stays retired. From another
session, respawn each running lane per the runbook's "Resume a lane": kill by port any dev server left on 3131 to 3136
(and any orphaned headless Chrome), then `spawn-prompt.txt` filled (same track, same port) plus a note naming its pushed
commits, what remains, its predecessor's transcript at
`~/.claude/projects/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/subagents/agent-<id>.jsonl`
(grep it, never read it whole), that a stale `.next/dev/lock` may be deleted and that MCP tool ids change with the
account. Connectors follow the account: Claude in Chrome (every red-team needs it), the Supabase MCP on
`ddafaemglzmuekbtjwzn`, the Vercel MCP on his personal team (deploys ride `$VERCEL_TOKEN`; only runtime logs need P3).

Relays that live only in an agent (2026-10-03): to `take-home-wiring` (08:30Z), from the cost model: the `phone` key shaped
so a one-line filter in the `partyreel-backup` Worker could skip it as it could the preview (a variant segment readable
from the key alone), the exact filter written under its Handoff's Proposed Worker changes; the backup Worker itself
unchanged ("back up only originals" is Will's to decide). To every running lane (09:20Z): WIP pushed at each milestone
with a `## Where I am` note, for the weekly's limit.

**Q9 is answered** (the Advisor, 21:05Z) and acted on above. The waiting experience itself goes to a design board (below).

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad holds the specs (`specs-r12/`) and gate logs (the next gate is 180, the calls file numbers on
from 127); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls file, the red-team briefs and ledgers).

## Next, in order

0. **Red-team 46's MEDIUM (11:30Z, its ledger):** the waiting contact sheet draws her own VIDEO as a broken image
   (`src/components/guest/gallery-empty-state-sheet.tsx`: every lit `[data-hers] .wait-cell` is an `<img src={cell.src}>`,
   `HerShot.video` ignored; a camera album's hold-to-film shot is `video/mp4`). Its fix is `crumbs-56` (running). Relayed to it
   too (11:43Z): red-team 46's second MEDIUM, the host's cover after the switch that puts held photos in the roll
   reading "0 developing" and wearing the sealed photos (`host-cover.ts`'s `entryWaits` compares `created_at` with
   `sealed_from`; a row should wait by its seal), with `host-cover.ts` and `event-hub-head-cover.tsx` accepted outside
   its owns.
0. **Now (11:20Z):** every wave-1 lane is merged and both migrations are applied (types regenerated at `e0cbda7d`;
   take-home's typed seams one ROADMAP line), and the export Worker is deployed (version 955ce073). Build 46 (`9af92e54`)
   serves the alias; red-team 46 walks it from `../partyreel-wt/_scratch/redteam-46/brief.md`. Running: `event-dates` (its migration for the Advisor,
   then apply by protocol) and `the-wait-r2`. The Advisor's Q13: the backup Worker's originals-only filter is never
   deployed (nothing server-side remakes a preview or a phone copy).
1. **Running** (the In-flight table; integrate each as it hands off, gates from 173): `wait-wiring` and
   `take-home-wiring` each bring a migration (the Advisor reads it, then apply by protocol: verbatim, the md5 proof,
   advisors, types regenerated and their seams dropped) and take-home a `workers/export` change I deploy (`wrangler
   whoami` first); `create-wizard-r3`, `demo-framing-r5`, `event-header-r3` (boards for his next desk) and `crumbs-55`.
   Merged tonight: milestone 34, cost-model, wizard-wiring, identity-r3, rooms-wiring, identity-wiring.
2. **Wave 2 still to cut** (briefs from the plan file, ports as seats free, memory at least 50%): `event-dates` once
   `wait-wiring` merges (its migration by protocol; lead=made in `moment.ts`), then `the-wait-r2` (arrival) after
   `wait-wiring` (`host-dashboard-r3` is running, drawing ranges and lead=made as settled).
3. **Build 46 `[preview]`** once wait-wiring and take-home-wiring merge with their migrations applied and the Worker
   deployed, then red-team 46 (the plan's list); the desk pass; build 47 for his next desk.
4. **The close:** STATUS, the calls file (91 to 124 tonight), his morning message (a draft is
   `../partyreel-wt/_scratch/morning-2026-10-03.md`: bring it current, then send it with the calls file); then Moltbook
   one pass an hour.

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
