---
track: orchestrator
status: open
cut: "794750cf"          # the launch-prep SHA this state was written at
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
| `crumbs-36` | five lines tonight's lanes deferred: the pricing pages' counts through `formatCount`, one `INACTIVE_MONTHS`, the host's Add scrolling to its panel, the blog's two keep lines, a dismissed child-abuse report's closed line saying whether it is still a live strike | running (agent `aba73c00eb28c320b`, told at spawn to push WIP and keep `## Where I am` current), cut at `c72d0231`; no SQL | Sonnet, 3132 | |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a381082be866b59e8`, spawned 2026-09-29;
no question open (Q1, the `names` hang; Q2, schema-pass part 1; Q3, the notes-into-laws audit; Q4, the door migration;
Q5, crumbs-33's two function-replacing migrations, "apply as written": each answered and acted on). From another session, respawn it from `usher/kit/advisor-prompt.txt`.

**Handoff across accounts (live: willg97 at 92% weekly on 2026-10-01 05:30Z; its auto-kill at 100% is expected within
hours, and Will opens a fresh Orchestrator chat on hi@willgibs.com, unused since its reset, the next on Tuesday
2026-10-06 21:00Z).** The dying session is `157caa18-ec54-4aa9-a12a-04c86d5a667b`: leave it idle or archived, since it
would resume mid-task at willg97's reset (Sunday 2026-10-04 13:00Z); `b01c012e` stays retired. Connectors follow the
account: Claude in Chrome answers only once Will moves it over (every red-team needs it), the Supabase MCP must reach
project `ddafaemglzmuekbtjwzn`, and the Vercel MCP may sit on his personal team (deploys ride `$VERCEL_TOKEN`; only
runtime logs need it). MCP tool ids change with the account. The new Orchestrator:
1. **Seats in** (the runbook's "Seat in"): kill by port any dev server on 3131 to 3135 and any orphaned headless Chrome.
2. **crumbs-36** (Sonnet, 3132, `../partyreel-wt/crumbs-36`, agent `aba73c00eb28c320b`): if
   `origin/lp/crumbs-36`'s manifest says handed off, integrate it (gate 114); otherwise respawn it per "Resume a lane"
   (`spawn-prompt.txt`, same track and port) from its pushed commits and its manifest's `## Where I am`, the note
   repeating the ask to push WIP and keep `## Where I am` current, with its predecessor's transcript at
   `~/.claude/projects/-Users-gibby-local-ai-partyreel/157caa18-ec54-4aa9-a12a-04c86d5a667b/subagents/agent-aba73c00eb28c320b.jsonl`
   (grep it, never read it whole), a stale `.next/dev/lock` free to delete. Its record adds its calls to Will's file
   as 60, and it rides build 36.
3. **Build 35** (`be502b45`: crumbs-33, crumbs-34 and crumbs-35 on build 34) is on the alias since 2026-10-01 06:35Z.
   Its red-team (Opus, agent `af0b7f251876c81c3`) walks from `../partyreel-wt/_scratch/redteam-35/brief.md`. If the
   kill lands before its report, respawn it from that brief with "continue after the last line of `ledger.txt` in that
   folder"; its report's finds go to the next crumbs lane. crumbs-36 rides build 36 (deploy it per the runbook, unless
   Will is mid-sitting: ask).
4. **Will's morning (2026-10-01):** the calls file first (59 calls, `../partyreel-wt/_scratch/calls/relay-calls.md`,
   last sent to him at 58: re-send it with each lane's calls), then the desk. Seat a respawned Advisor
   (`usher/kit/advisor-prompt.txt`) when a consult comes due; no question is open.

Relays that live only in an agent: the WIP-and-`## Where I am` ask in crumbs-36's spawn; nothing else.

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad (`/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/157caa18-ec54-4aa9-a12a-04c86d5a667b/scratchpad`,
until a reboot) holds the specs and gate logs (the next gate is 114); nothing there is needed that these lines and the
manifests do not carry. Everything a successor reads lives in the repo or in `../partyreel-wt/_scratch/` (the calls
file, the red-team briefs and ledgers).

Batch 8 shipped whole as milestone 31 (`7bd3b947`, 2026-09-30; 40 lanes, crumbs-12 to gone-link-soft; their merges and
records carry the rest). Merged in batch 9: crumbs-28 (`8ea749bf`), hide-strikes (`669e1717`, its migration applied by
protocol, 20260930205935), crumbs-29 (`47b5cce8`, its three migrations applied), crumbs-30 (`d0eaf507`; gate 107 green
but lab:demo's `about-press.facts` dev stall, ROADMAP's line), crumbs-31 (`5898b6d8`, no SQL), demo-stall (`7990d19d`, gate 109 whole and green: the lab:demo stall's root, a Next dev bug, patched), crumbs-32 (`04ddf22e`, no SQL), crumbs-34 (`25b21341`, no SQL; gate 111), crumbs-33 (`569a3668`, gate 112; its two migrations applied by protocol after the Advisor's Q5, 20261001045258 and 045429), crumbs-35 (`9b452bcb`, gate 113, no SQL). Schema-pass part 2 is applied (20260930204037).

## Next, in order

1. **Integrate each lane as it hands off** (crumbs-36 runs),
   each migration by protocol, one at a time: drift check, apply verbatim, the rolled-back refusals, advisors, types.
2. **Build 34** (`65dbedb2`: build 33 plus crumbs-29 to crumbs-32 and demo-stall) is on the alias since 2026-10-01
   03:45Z (Will had not begun his sitting and said go). Its first try failed at install on both projects: with no pin,
   Vercel reads a version 9.0 lockfile as pnpm 10's, which refused the patch hash pnpm 9 wrote for demo-stall's patch;
   `packageManager` now names pnpm 9.14.4 (`package-manager-pin.test.ts`). Its red-team is done (05:15Z,
   `../partyreel-wt/_scratch/redteam-34/ledger.txt`): every drivable walk of crumbs-29 to crumbs-32 PASS, no
   regression, its 13 RT34 events deleted, strikes unchanged (partyr33l's address 6, willg97's 2); one LOW (the hub's
   Select at 375), two NITs, one unconfirmed look and two observations went to `crumbs-35`. Not driven: the portal's
   404 for willg97 (his authenticator code), the magic-link return (his email), the 13-guest list, the over-cap banner
   and the export walk (no such data). Build 35 (crumbs-33, crumbs-34, crumbs-35) is on the alias (06:35Z), its red-team walking; crumbs-36 rides build 36. Lanes run again (Will, 2026-10-01: "keep the calls file running"): pace near 95% weekly (90% at
   04:57Z on 2026-10-01; willg97 resets Sunday 13:00Z, hi@willgibs.com, fresh, Tuesday 21:00Z), with this block kept
   current; Will (05:30Z, at 92%): run into the auto-kill, documenting along the way.
3. **Seats as they free** (at most four lanes; `memory_pressure` before each; app work first, Will's note; `lab-focus`
   took the lab's phone fold with it). After his desk picks: the demo event (below); about-press's wiring (its three wiring calls,
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

- **His desk:** `disposable-mode` r2 (eight asks), `locked-door` r2 (four, redrawn from production) and `event-ready` r1
  (five; its three settled calls, ready never stored nor shown to a guest among them, his to overrule) on build 25;
  `demo-framing` r2 (three: the demo's address in a host's words, how it shares the stage with the stream, the hero's
  touch; `names` retired into `slug`) and `about-press` r1 (two: the press kit on /about, its four facts; press-page's
  `a-human` retired as the carried call `named`) reach him with build 26; `privacy-hero` r4 (one: which veil, the lens
  recommended) with build 27.
- **The calls file** (59 calls to overrule, numbered, one a lane through crumbs-35; compiled from each merge's "Calls
  his to overrule", `git show <merge>^2:docs/tracks/<track>.md`, kept at `../partyreel-wt/_scratch/calls/relay-calls.md`
  and sent to him as it grows). He reviews it on 2026-10-01 against the product vision ("keep the calls file running":
  each merge's calls join it). His two decisions are answered (2026-09-30): A, the proof mail stays off until the emails
  round (ROADMAP's Emails bucket); B, the instant hide's bar becomes three strikes lapsing after 180 days ("I don't want
  to prevent a well-meaning reporter from a second report if I simply disagree with the first"), `hide-strikes`'s.
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
