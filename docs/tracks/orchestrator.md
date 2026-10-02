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
| `demo-r4` | board demo-framing r4 [desk 90]: the centre object nailed, the mini-event card, two or three new heroes | running | Opus, 3136 | `a557d2f6e3b8e9fd8` |
| `save-speed` | the viewer's Save immediate: his iPhone's 30 s measured to its cause (a second download on the tap behind R2's HTTP/1.1 connections, WebKit's 5 s activation) and fixed by holding the original the viewer draws | MERGED at `b86572ce` (gate 153 green: lint, test, build, lab:smoke 152, lab:demo on three boards; the lane's gate on its synced head: test 9,083, build, lab:smoke 134); its uploads-and-r2.md lines placed at the record, its guest-flow.md viewer line waits for door-reveal's merge (door-reveal owns the doc) | Opus, 3135 | `a4d3efdea8ef3c604` |
| `host-dashboard-r2` | board host-dashboard r2 [desk 25]: events at forty (Recent on top recommended), what the stage leads with on a quiet day, whether she pins it | MERGED at `63885f15` (gate 151 green: test, build, lab:smoke 21, lab:demo on host-dashboard; the lane's gate: test 8,970, build, lab:smoke 21, lab:demo 3 steps at 1440 and 375); lab only; on the desk at build 44 | Opus, 3132 | `aea1e17a667c43dfd` |
| `crumbs-50` | fourteen off-round ROADMAP crumbs (marketing preloads, demo pointers, type steps, tokens, dead fixtures, a help line, legal print, inline code, the sign-in cue, the nav's one source, the blog's tags) | running | Sonnet, 3134 | `ad78669c34ed8b55e` |
| `door-reveal` | locked-door r3's picks (the walk-through onto the cover, the turning breathing idle), the door always the first paint (his walk), the name after the email where verification is on, the chooser's photos across a reload; retires the board | running | Opus, 3131 | `aec876b5d6becfb32` |
| `event-header-r2` | board event-header r2 [desk 50]: the hub head's facts (the night on a dial among them) and one predictable way every room opens | running | Opus, 3133 | `a65948cf0ee9a18da` |
| `the-wait` | board the-wait [desk 35]: the one waiting experience of a delayed album, the mental model first (his to find), then her wait, the arrival, the host's cover and the words | running | Opus, 3132 | `(spawning)` |
| `disposable-camera` | disposable-mode r3's camera wired (the reel as a timeline, hold to film, a video one shot, the roll's end) at full size on the server's roll; Add opens it on a camera album; retires the board | running | Opus, 3135 | `(spawning)` |

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

Relays that live only in an agent (2026-10-02, from Will's walk and answers):
- `disposable-foundation`, Q9's model (21:10Z, superseding the 20:20Z and 20:55Z relays):
  - **Two axes**, disposable a preset, no `mode` column:
    - `events.capture` (text CHECK upload or camera) and `roll_size`;
    - `moderation_mode` untouched;
    - `develops_at` (develop applies to free uploads too) and a server-stamped `sealed_from`;
    - all three in both column grants and returned by `get_event_by_qr_token` (Q7 pattern).
  - **The predicate:** `status = 'approved' and (sealed_until is null or sealed_until <= now() or host)` in every SQL home and the four app-side reads.
  - **The sync's `waiting: {count, minutes}`:** pending and sealed together, full access only, in the ETag, no ids.
  - **The roll counts live shots** (his overrule: a deleted shot frees its slot), with a withdrawn camera shot purged at once and a lifetime ceiling of `roll_size * 3` under the lock.
  - **Settings:** two questions on `adds-page` (how guests add; when everyone sees, one three-way choice), mountable for the wizard.
  - Her pending items' read and remove already exist (`guest-media.ts:357`, `remove_my_upload*`).
- `header-wiring` (21:10Z): a Remove in her tracker on each of her own items not yet in the album (held, later sealed), on the existing `remove_my_upload*` paths, with state while it works.

**Q9 is answered** (the Advisor, 21:05Z) and acted on above. The waiting experience itself goes to a design board (below).

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad holds the specs (`specs-r12/`) and gate logs (the next gate is 146, the calls file numbers on
from 91); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls file, the red-team briefs and ledgers).

## Next, in order

1. **Milestone 33 is DONE** (`f210dfaf`, tag `milestone-33`, 2026-10-02 19:40Z): gate 146 green over the whole tree
   (lint, 8,897 tests, build, lab:smoke 179), build 42 (`26bd44f0`) proved crumbs 48 and 49 on the alias, production
   READY on both projects, the read-only walk PASS; `launch-prep` fast-forwarded. Owed: the export Worker's 05:30 UTC
   heartbeat read in `export_worker_reports` on 2026-10-03 (its `HEARTBEAT_URLS` already tries partyreel.com first, so
   nothing to change), and `/admin/exports` when partyr33l's session is at hand.
2. **Wave 2, each as its dependency merges** (Will's walks of 2026-10-02 add to it):
   - `door-reveal` after header-wiring, with two of his findings: the welcome's seen-state lives only in localStorage
     (`use-welcome-seen.ts`), so a signed-out arrival at an open album paints the album for 1 to 3 s before the door
     rises (his "big bug"; reproduced on build 42, frames in `$S/flash/`): the door must be the first paint; and the
     door's name step drops a typed name for a verified account's own ("Will Test Mobile" became "Will Gibson",
     silently). His answers (2026-10-02): the album is NEVER visible before any door or gate a visitor should meet first
     ("could catch screen recording", and "what just happened? i saw the album, now i'm out"), held by a test on the
     server's first paint for every door; and where verification is required the name comes after the email, asked
     only of an account that has none.
   - `event-header` r2 after header-wiring; `host-dashboard` r2 after dashboard-wiring.
   - `disposable-camera` after the foundation: his phone line is in (iOS 26, Chrome 154 on WebKit: the stream
     4032x3024 at 30 fps; a frame drawn whole 3024x4032, 12.2 MP, 2.6 MB at JPEG 0.92; takePhoto 12.2 MP, 7.6 MB; the
     camera app 12.2 MP, 2.9 MB), so full size holds on iPhone.
   - (`disposable-rooms` is replaced by `the-wait` board below, then its wiring after his sitting: Q9 made the held
     and the sealed album one waiting experience.)
   - `save-speed` (new): the viewer's Save on his iPhone took about 30 s to turn ready for a demo photo (the demo's
     originals: median 0.3 MB, largest 5.2 MB), so the stall is the path, not the bytes; measure each step, make Save
     immediate. His standard, for every brief: "Everything should feel as immediate/responsive/snappy, and anything
     taking longer should provide clear state feedback and potential interruptibility" (design-system.md's line at
     header-wiring's record, which owns it now).
   - `the-wait` board (new, cut after the foundation merges): the ONE waiting experience for any delayed album (once
     approved, or at a develop time): her own shots lit and removable, everyone's as "uploads stacking" (count and
     minutes), never a landing that vanishes to the empty state; the reveal and the reel's premiere; the host's cover
     she lifts; whether approve-plus-develop is ever offered; the preset's name ("Disposable"). Its FIRST ask is the
     mental model itself, which Will leaves open (21:20Z: "I don't want to suggest the correct solution to the right
     mental model across Moderation and disposables, but they both have that same feel of 'here's only your photos,
     you'll see the everyone else's on the develop date or when host approves'"): several syntheses drawn end to end
     (Settings, the guest's wait, the arrival), such as two questions, named album styles, or one question of time;
     the foundation's two-axis schema serves any of them, and its Settings control is a working version. Disposable's
     `waiting=sheet` is an anchor option; the screen link is a Question.
   - `take-home` board (new): how guests and hosts take photos home, from his note: a guest's one-press Download all
     against Select, Select all, Save; and a host's originals beside an optimized download for quick posts.
   - Fillers: `crumbs-50` (Sonnet, the off-round ROADMAP lines) and `lab-window` when a seat is free.
3. **The foundation's migrations**: the Advisor reads them, then the protocol (verbatim, the md5 proof, advisors, types
   regenerated, its seams dropped).
4. **Build 43** once header-wiring, dashboard-wiring and the foundation merge, then its red-team (the heads, the hub,
   the dashboard, the disposable leak matrix live; a sealed test album never opened through partyreel.com before
   milestone 34).
5. **Build 44**, the round's last: door-reveal, the camera and rooms if merged (red-teamed), and the five boards in desk
   order (identity r2, host-dashboard r2, event-header r2, create-wizard r2, demo r4) after the pre-sitting desk pass.
6. **The close**, then Moltbook one pass an hour.

## Waiting on Will

- **His walks** (2026-10-02): the phone measurement, the real upload and the Save check are DONE (their findings are
  wave 2's above). Owed: the two-Checkout-tabs check, ON HOLD while he is out (the card entry is his, on Stripe's hosted
  page; any test host, my call; the account's deletion is fine, "we'll wipe on launch"; a step-by-step chat guide in
  order of what needs him, ready for his desk), and Record Video's 1080p size on his iPhone. After build 44: the walk-through when let in (a visible tab), a password door, reduced motion over
  the door states and the new hub, a hidden-then-shown hub tab.
- **The calls file** (90 calls, `../partyreel-wt/_scratch/calls/relay-calls.md`): he reviews it today.
- **His next desk** on build 44.
- **Asks that come due later**: Libraries.dev access for a lane (when the help chat is cut), any F1 frames he loves
  (when the admin look is cut), asset 38 (the privacy hero's photograph).
