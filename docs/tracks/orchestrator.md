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
| `schema-pass` | the data architecture trimmed | merged at `57b17ace`; part 1 applied on Will's go-ahead (2026-09-29, his answer "Yes, apply part 1"; recorded `20260929210010`, the payload the file's md5; advisors 18/4/33; anon REST 42501; types regenerated at `c7a50adc`); a signed-in host walk on partyreel.com rides build 25's red-team as a follow-up; part 2 (`20260929170000`) after milestone 31 ships | Opus, 3132 | `54f414f9` |
| `stale-link` | a stale QR code, a gone profile and an unknown cinema slug answered by a server-drawn not-found with a 404 status, never Next's white error shell | running (agent `a9515f10f5f3021da`; worktree `../partyreel-wt/stale-link`) | Opus, 3133 | |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a381082be866b59e8`, spawned 2026-09-29;
no question open (Q1, the `names` hang; Q2, schema-pass part 1; Q3, the notes-into-laws audit; Q4, the door migration:
each answered and acted on). From another session, respawn it from `usher/kit/advisor-prompt.txt`.

**Handoff across accounts.** The Orchestrator session is `157caa18-ec54-4aa9-a12a-04c86d5a667b` (willg97's account,
seated 2026-09-29 12:23 EDT; its weekly resets Sunday 9am ET, hi@willgibs.com's Tuesday 5pm ET; Will hands off only
when one maxes its weekly limit); the first account's `b01c012e` is retired and must not resume. Its agent ids live only
there; from another session, respawn each running lane per the runbook's "Resume a lane": kill by port any dev server
left on 3131 to 3135 (and any orphaned headless Chrome), then `spawn-prompt.txt` filled (same track, same port) plus a
note naming its pushed commits, what remains, its predecessor's transcript at
`~/.claude/projects/-Users-gibby-local-ai-partyreel/157caa18-ec54-4aa9-a12a-04c86d5a667b/subagents/agent-<id>.jsonl`
(grep it, never read it whole), that a stale `.next/dev/lock` may be deleted and that MCP tool ids change with the
account, and the relays below, which live only in the agents:
- Build 25's red-team (agent `a777878702cf5d407`): respawn from `../partyreel-wt/_scratch/redteam-25/brief.md` after its
  `ledger.txt`'s last line (the brief carries every rule and restore).
- `schema-pass`: Will's yes quoted (its row), and `public.reports`' default anon and authenticated grants closed in
  part 1.

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad (`/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/157caa18-ec54-4aa9-a12a-04c86d5a667b/scratchpad`,
until a reboot) holds the specs and gate logs (the next gate is 80); nothing there is needed that these lines and the
manifests do not carry.

Batch 8 (2026-09-29) answers Will's sitting on build 19, the desk whole (transcribed at `31de6aa0`: 41 answers on ten
boards). Batch 7 is merged whole; its records carry the rest.

Merged in batch 8 (their records carry the rest): crumbs-12, locked-door r2, disposable-mode r2, crumbs-13, lab-revamp
stage one, settings-wiring, triage-r2-wiring, crumbs-14, lab-revamp stage two, crumbs-15, loose-ends-wiring, contact-wiring, desk-tune, event-ready r1, window-notes, crumbs-16, album-motion-wiring, crumbs-17 (its migration applied by protocol, 20260929204753), unfence, crumbs-18, demo-framing-r2, about-press, menu-depth, crumbs-19, crumbs-20, crumbs-21 (its three migrations applied by protocol), privacy-hero-r4, shared-claims (its migration applied by protocol, 20260930010219), crumbs-22, crumbs-23 (its migration applied, 20260930013213), perf-404, lab-focus (gate 94's lab:demo outran the gate's 420 s alarm; re-run 23 of 23 in 490 s; the alarm is 900 s), crumbs-24 (its two migrations applied, 20260930071830 and 20260930072120), crumbs-26, crumbs-25 (rides build 29).

## Next, in order

1. **Integrate each lane as it hands off** (none running but build 27's red-team), each migration by protocol, one at a time: drift check, apply verbatim, the rolled-back refusals,
   advisors, types.
2. **Build 28 is on the alias** (`f5005b56`, 2026-09-30; its red-team PAUSED, agent `a323059321486cd11`: Claude in
   Chrome never connected, so every signed-in walk, crumbs-26's fix first, waits on Will reopening the side panel; the
   signed-out walks passed (lab-focus 23 of 23, perf-404's /login 123 KB lighter, the title after Back); resume it by
   SendMessage from its ledger's PLAN block; brief and ledger in `../partyreel-wt/_scratch/redteam-28/`; from another session, respawn from the brief after the ledger's last
   line): build 27 (red-teamed; its MEDIUM, a shared phone's uploads under another guest's ticket, fixed by `crumbs-26`)
   plus lab-focus, perf-404, crumbs-24 and crumbs-26. When it passes, milestone 31 is proposed to Will (his yes);
   schema-pass's part 2 applies after it ships. crumbs-25 rides build 29. Waiting on Will from build 27's walk: one
   event password typed while someone waits (optional), and a 10-second Cmd+F on /events.
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
5. **At milestone 31**: `kit/README.md`'s type table follows `crumbs-12` (every heading 700); Google's chooser names
   `ddafaemglzmuekbtjwzn.supabase.co` (ROADMAP's launch checkpoint, his call).

## Waiting on Will

- **His desk:** `disposable-mode` r2 (eight asks), `locked-door` r2 (four, redrawn from production) and `event-ready` r1
  (five; its three settled calls, ready never stored nor shown to a guest among them, his to overrule) on build 25;
  `demo-framing` r2 (three: the demo's address in a host's words, how it shares the stage with the stream, the hero's
  touch; `names` retired into `slug`) and `about-press` r1 (two: the press kit on /about, its four facts; press-page's
  `a-human` retired as the carried call `named`) reach him with build 26; `privacy-hero` r4 (one: which veil, the lens
  recommended) with build 27.
- **His answer on the calls file** (34 calls to overrule, numbered; 33 and 34, crumbs-18's and menu-depth's, added
  2026-09-29): A, the proof mail (recommended off until the emails round) and B, the instant-hide bar's permanence
  (recommended permanent until launch).
- **The morning of 2026-09-30, on his phone** (his word): `disposable-mode` r2's Measure a phone on the alias (the
  board's dock: Open the camera, Take a frame, the camera app's photo, on his iPhone and an Android if he has one; paste
  the line back: the full-size promise rides on it); Q1 (on a phone the code card fills the screen, but Back
  leaves the album; should Back close it like the other full-screen popups?); the 2-minute real-upload check on the
  alias (a first photo, landscape, as a signed-out guest at a held-uploads event: the keep, her uploads' "Waiting for
  approval" and the tracker's badge, no held tile at the album's head; then Confirm your email, the one beat, the told
  name's Change; its `media.file_size_bytes` checks the 3.5 MB estimate); the 10-second iPhone check on partyreel.com
  (one tap on Save opens the system sheet and a shared photo arrives as a photograph; Settings > Camera > Record
  Video's size for 1080p at 30 fps, against the 65 MB a minute estimate).
- **Whenever convenient:** the Vercel MCP on this account points at his personal team; re-pointed at P3 it reads
  runtime logs (deploys ride `$VERCEL_TOKEN` and need nothing).
- **Asks that come due later**: Libraries.dev access for a lane (when the help chat is cut), and any F1 frames he loves
  (when the admin look is cut).
