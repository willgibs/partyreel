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
yes to run continuously to the round's close overnight; Moltbook's hourly passes only after it). Milestone 34 merged
to `main` at `2aae7331` (tag `milestone-34`, gate 168 green). Up to six lanes plus the research lane while
`memory_pressure` reads at least 50% free; every production build takes turns through `scripts/build-lock.sh`. The
plan's whole text (lane splits, the Advisor's Q11 corrections, Will's answers) is
`~/.claude/plans/please-resume-your-role-gentle-crown.md`; the briefs carry it.

| lane | what | state | model, port | agent |
| --- | --- | --- | --- | --- |
| `identity-wiring` | identity r2's voice=camera, layers=display, status=lights at the source; corners only as focus; merges first | running (cut at `5dc4dee8`) | Opus, 3131 | `afc6d0be1a26b1f6f` |
| `wait-wiring` | the-wait's picks: time on the guest screens, Settings' album styles, the contact sheet, the host's cover as guests see it, "Disposable", approval never with a develop (a CHECK migration; held photos join the roll at the switch) | running | Opus, 3132 | `af468aba998f4f11a` |
| `take-home-wiring` | take-home's picks: Select then Save, Save into Photos at phone size with sizes, the host's Originals and Phone size; the phone copy (a migration, the export Worker, every reader of the stored copies); the media-cost guard | running | Opus, 3133 | `aa8ae040fb361d3c6` |
| `rooms-wiring` | event-header's rooms=over: Review, Guests and Settings in one panel over the hub, the reel full screen, See it as a guest (a true guest render) | running | Opus, 3134 | `ac7150b41d7dc7ae0` |
| `wizard-wiring` | Create as the room with flow=carry, look=places, beat=develop; the add step waits for create-wizard r3 | running | Opus, 3135 | `afd8421950f236037` |
| `identity-r3` | board identity r3 [desk 10]: actions and fields as one system (keys plus wells, all rings, a third idea) in real screens; the room's inverse; the light edge | running | Opus, 3136 | `a4b60128e7777e310` |
| `cost-model` | research: the per-event and per-month cost model across every vendor, the levers ranked, into PRICING.md | running | Opus, none | `adc26155bbe485569` |

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

Relays that live only in an agent: none (red-team 44's LOWs relayed to `crumbs-54` are merged with it).

**Q9 is answered** (the Advisor, 21:05Z) and acted on above. The waiting experience itself goes to a design board (below).

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad holds the specs (`specs-r12/`) and gate logs (the next gate is 168, the calls file numbers on
from 116); nothing there is needed that these lines and the manifests do not carry. Everything a successor reads lives
in the repo or in `../partyreel-wt/_scratch/` (the calls file, the red-team briefs and ledgers).

## Next, in order

1. **Milestone 34:** production READY at `2aae7331`, then the read-only partyreel.com walk; `launch-prep` fast-forwards
   to `main`; STATUS's prod line.
2. **Integrate wave 1** as each hands off (gates from 169), `identity-wiring` first and the others synced onto it. Two
   migrations (wait-wiring's CHECK, take-home-wiring's phone copy): the Advisor reads each, then apply by protocol;
   take-home's export Worker deployed by me (`wrangler whoami` first).
3. **Wave 2** as seats free: `event-dates` after wait-wiring and rooms-wiring (its migration by protocol; lead=made in
   `moment.ts`), then the boards: host-dashboard r3 (after event-dates), demo-framing r5, event-header r3 (after
   rooms-wiring), the-wait r2 (after wait-wiring), create-wizard r3 (after wizard-wiring). Briefs from the plan file.
4. **Build 46 `[preview]`** when the wirings merge, then red-team 46 (the plan's list); build 47 with the new boards for
   his next desk after the desk pass; the close (STATUS, the calls file, his morning message with the cost model's
   summary); then Moltbook one pass an hour.

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
