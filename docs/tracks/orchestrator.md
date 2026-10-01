---
track: orchestrator
status: open
cut: "37d20db7"          # the launch-prep SHA this state was written at
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
| `crumbs-37` | scale and upkeep: `album_changes`' tombstones pruned under per-album watermarks, `media_removed_idx`, the admin drill-in paged, the over-capacity reduce paged | MERGED at `cc49cf17` (gate 116 green); its two migrations UNAPPLIED: `20261001150000_album_log_prune` (replaces `album_changes_since`, adds the watermarks and `album_prune_tombstones`) and `20261001151000_removed_media_index` (drops `media_purge_at_idx` for `media_removed_idx`): the Advisor first, then the protocol, both BEFORE build 36 deploys; then regenerate the types (album_state's two columns, `album_prune_tombstones`) and drop the cast in `album-log.ts` | Opus, 3131 | |
| `crumbs-38` | a person's own record: the return's toast told once, My uploads and My likes past 200, the viewer's credit with a face and a door | MERGED at `c95e6429` (gate 117 green on its re-run: one timing flake, `history-entry.test.tsx`, its ROADMAP line); `20261001203810_let_in_told` APPLIED by protocol 2026-10-01 (recorded 20261001183243, the payload's md5 the file's 5f3b0099; the proof 6/6 rolled back first; nine triggers on media; advisors 18/4/35, unchanged); `20261001203800_my_feeds_cursor` (md5 9866ebad, drops and re-creates the two feed functions) UNAPPLIED, on the Advisor's Q6, BEFORE build 36 deploys; then regenerate the types and drop the two typed seams (`feedRpc`'s cast in `queries/my-uploads.ts`, `untypedAdmin` in `mutations/guest-media.ts`) | Opus, 3133 | |
| `crumbs-41` | admin, data and billing: Will's call #60 (a child-abuse dismissal reopenable while its strike counts), two live subscriptions, the strike's lapse as a duration, the drill-in's status filter, the person report's handle, `reviewed`, four-digit ticks, the soft-deleted events' index | running (agent `ae5f01ac4f8d75ceb`), cut at `07277c23`; its merge waits for milestone 32 | Opus, 3131 | |
| `crumbs-42` | the host app: a malformed dashboard id, Review's credits, a save and a second tap, Paused, Review's one heading, the dead upload count, what a restore leaves in Deleted, the settings head's double name, the wizard's sample codes | running (agent `a1416ca66bd8a253a`), cut at `07277c23`; its merge waits for milestone 32 | Opus, 3132 | |
| `crumbs-43` | guests: Back closes the photograph, the welcome on a shared phone, one row for a re-join, the host's own upload cap, a face that moves at once, Show-more hearts, waiting uploads on an empty album, "A guest" retired, the viewer's loading state | running (agent `a314d5cae046d0f4c`), cut at `07277c23`; its merge waits for milestone 32 | Opus, 3133 | |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a2e44f7ad679754e8`, respawned
2026-10-01 18:15Z in this session; **Q6 open**: crumbs-37's two migrations and crumbs-38's `my_feeds_cursor` (each drops
or replaces a function or an index) against the deployed readers, prod `7bd3b947` and build 35 `be502b45`, leaning
apply as written. Q1 to Q5 are answered and acted on. From another session, respawn it from
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

1. **The owed migrations**, each by its header's protocol, one at a time: `let_in_told` now (additive, replaces
   nothing); `my_feeds_cursor`, `album_log_prune` and `removed_media_index` on the Advisor's Q6; then the types
   regenerated once, the three typed seams dropped (`feedRpc`'s cast in `queries/my-uploads.ts`, `untypedAdmin` in
   `mutations/guest-media.ts`, the cast at `lifecycle/sweeps/album-log.ts:102`), gate 119 (typecheck, lint, test,
   build) and the two In-flight rows cleared.
2. **Build 36** (build 35 plus crumbs-36 to crumbs-40, the four migrations standing): the `[preview]` record,
   `alias-ensure`, the prune. The desk is the same six boards (only `words.test.ts` moved in the lab since build 35)
   and his answers live in his browser's localStorage, so the deploy waits for no sitting. Then its red-team, an agent
   on Claude in Chrome, from `../partyreel-wt/_scratch/redteam-36/brief.md`, written fresh from crumbs-36 to
   crumbs-40's Handoff steps on `redteam-35/brief.md`'s template; strikes going in: willg97's address 2, partyr33l's 7.
   **Milestone 32: Will said yes** (2026-10-01, "Ship after the red-team (Recommended)"): batch 9 ships once build 36,
   or its fix build, passes, any MEDIUM or worse fixed and proven on the alias first; then the full gate, merge, tag,
   deploy and the read-only prod walk with no further ask. Until it ships only the red-team's fixes merge; any other
   lane that hands off waits, as crumbs-28 waited for milestone 31.
3. **Seats as they free** (at most four lanes; `memory_pressure` before each), claimed in this order: the red-team's
   fixes (milestone-blocking), the wiring of his desk picks, the ROADMAP's app work (his note: app work first), the
   lab. Three app lanes from the Now bucket run now (admin, data and billing, led by #60's reopen window; the host
   app; guests), the fourth seat held for the red-team's fixes. After his desk picks: the demo event (below); about-press's wiring (its three wiring calls,
   `git show 3ded6ba9^2:docs/tracks/about-press.md`: /press a temporary redirect, the llms summary kept, the kit's files
   if none wins); the disposable wiring (after `disposable-mode` r2's picks and his Measure a phone; with the lane's
   idea of the premiere on the wall, the reel's screen counting down to the develop time and playing the roll as an
   event of its own); the door family's wiring (if the doorway wins, its reveal: walking through the opened door into
   the album, drawn first as motion options; ASSETS row 36 if the host's door wins).
4. **The demo event**, after his `demo-framing` r2 picks (his full permission, 2026-09-29): the demo renamed (or made)
   to its pick, its address claimed so the card's printed address opens it (today `mia-and-theo`, held by no event,
   left as is on his word), one home for the slug in `lib/demo.ts` that the card prints, the seed sets and every demo
   door opens (today all five doors and `/demo` open the token's address, since demo mode matches on the raw token),
   `OBJECT_EVENT` and `OBJECT_PRINTS` to match, the typed addresses reserved to the demo, a demo host account for the
   persona (`partyreel-demo` stays refused to anyone else by the brand family, `crumbs-11`), and ASSETS rows 5, 33 and
   34 unparked with the party's subjects (the board's Handoff names the counts).
5. **Google's chooser** names `ddafaemglzmuekbtjwzn.supabase.co` (ROADMAP's launch checkpoint, his call).

## Waiting on Will

- **His desk** (not begun at 18:08Z on 2026-10-01; locked-door first): `disposable-mode` r2 (eight asks), `locked-door` r2 (four, redrawn from production) and `event-ready` r1
  (five; its three settled calls, ready never stored nor shown to a guest among them, his to overrule) on build 25;
  `demo-framing` r2 (three: the demo's address in a host's words, how it shares the stage with the stream, the hero's
  touch; `names` retired into `slug`) and `about-press` r1 (two: the press kit on /about, its four facts; press-page's
  `a-human` retired as the carried call `named`) reach him with build 26; `privacy-hero` r4 (one: which veil, the lens
  recommended) with build 27.
- **The calls file** (64 calls to overrule, numbered, one a lane through crumbs-40; compiled from each merge's "Calls
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
- **Whenever convenient:** the Vercel MCP on this account points at his personal team; re-pointed at P3 it reads
  runtime logs (deploys ride `$VERCEL_TOKEN` and need nothing).
- **Asks that come due later**: Libraries.dev access for a lane (when the help chat is cut), and any F1 frames he loves
  (when the admin look is cut).
