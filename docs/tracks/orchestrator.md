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
| `header-wiring` | event-header's picks: the cover, the hub wearing it with its sticky bar, the shutter with his scroll fade and a right-hand reel button; the atom contract built in `components/ui/` | running | Opus, 3131 | `a167a5fcddb3a287a` |
| `dashboard-wiring` | host-dashboard's picks: the stage, this week, the live wall, seasons; the four carried calls | running | Opus, 3132 | `abf012b4ed5f4a4d8` |
| `disposable-foundation` | the mode and reveal, the per-row seal from one predicate, develop as a write, the server-counted roll, Settings' control (the Advisor's Q8 model); migrations to apply by protocol | running | Opus, 3133 | `a3c3c52d33e26b082` |
| `identity-r2` | board identity r2 [desk 10]: voice as a layer, then actions, fields, layers and status in his voice | running | Opus, 3134 | `a3fb5687c66a613b9` |
| `create-wizard-r2` | board create-wizard r2 [desk 60]: the room's flow screen by screen in his layout | running | Opus, 3135 | `aaa11532349605aa9` |
| `demo-r4` | board demo-framing r4 [desk 90]: the centre object nailed, the mini-event card, two or three new heroes | running | Opus, 3136 | `a557d2f6e3b8e9fd8` |

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

Relays that live only in an agent: none.

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad holds the specs (`specs-r12/`) and gate logs (the next gate is 146, the calls file numbers on
from 91); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls file, the red-team briefs and ledgers).

## Next, in order

1. **Milestone 33** (his yes, 2026-10-02): build 42 `[preview]` at the tip (crumbs 48 and 49 are not on build 41), a
   short headless proof of crumbs 47 to 49, the full gate (`FULL=1`), `--no-ff` into main, the tag, production READY,
   the read-only walk (with `/admin/exports` and a signed heartbeat), the export Worker's `HEARTBEAT_URLS` pointed at
   partyreel.com, `launch-prep` fast-forwarded. ★ No round-12 lane is integrated before main has merged.
2. **Wave 2, each as its dependency merges:** `door-reveal` and `event-header` r2 after header-wiring; `host-dashboard`
   r2 after dashboard-wiring; `disposable-camera` after the foundation and Will's phone line; `disposable-rooms` after
   the foundation and header-wiring (the screen link is his Question there); fillers `crumbs-50` (Sonnet) and
   `lab-window` when a seat is free.
3. **The foundation's migrations**: the Advisor reads them, then the protocol (verbatim, the md5 proof, advisors, types
   regenerated, its seams dropped).
4. **Build 43** once header-wiring, dashboard-wiring and the foundation merge, then its red-team (the heads, the hub,
   the dashboard, the disposable leak matrix live; a sealed test album never opened through partyreel.com before
   milestone 34).
5. **Build 44**, the round's last: door-reveal, the camera and rooms if merged (red-teamed), and the five boards in desk
   order (identity r2, host-dashboard r2, event-header r2, create-wizard r2, demo r4) after the pre-sitting desk pass.
6. **The close**, then Moltbook one pass an hour.

## Waiting on Will

- **His walks today** (he offered, 2026-10-02): the phone measurement on the disposable board's dock (the camera's
  full-size promise rides on it), the 10-second iPhone Save check on partyreel.com, a real upload as a signed-out guest
  at a held-uploads event staged for him, and the two-Checkout-tabs check (its deletion step only on an account he names
  as fine to lose). After build 44: the walk-through when let in (a visible tab), a password door, reduced motion over
  the door states and the new hub, a hidden-then-shown hub tab.
- **The calls file** (90 calls, `../partyreel-wt/_scratch/calls/relay-calls.md`): he reviews it today.
- **His next desk** on build 44.
- **Asks that come due later**: Libraries.dev access for a lane (when the help chat is cut), any F1 frames he loves
  (when the admin look is cut), asset 38 (the privacy hero's photograph).
