---
track: orchestrator
status: open
cut: "38373a35"          # the launch-prep SHA this state was written at
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
| `crumbs-16` | build 23's HIGH bug at its root (a history call hands Next its own `__NA` state, so Settings rows never open their page and a page's back arrow never returns), the same shape swept and held by a policy test; triage-r2-wiring's relayed help article | handed back after gate 71: with its change `demo-framing.names` hangs (`Page.navigate` never answers; it passes on `61a4ee00` without the change), so the unpushed merge was undone; resumed to fix it at its root with a failing test and re-run `lab:demo` over every board (agent `a5ddc145d2b108533`; worktree `../partyreel-wt/crumbs-16`) | Sonnet, 3133 | |
| `schema-pass` | the data architecture audited, its migration refused by the classifier; resumed on Will's yes (2026-09-29): asked "May the lane write its two migration files and run those proofs?", he answered "Yes, write and prove"; told to close `public.reports`' default grants too (the red-team's note) | running (agent `ad2f22b2fb01a8a6e`; worktree `../partyreel-wt/schema-pass`) | Opus, 3132 | |
| `event-ready` | r1, a board: how a host knows her event is ready (an event checklist, the settings' mini wizard and whether Create shares it, a never-empty "what needs you", the hub's code as the live door); the first board authored in the one-folder shape | running (agent `a758ad3af55bfe3a7`; worktree `../partyreel-wt/event-ready`) | Opus, 3135 | |
| `album-motion-wiring` | album-motion r1: the hero's two symmetrical streams, each photograph drawn in and dissolving at the album's edge, then pushed into the album from the left as a real upload arrives; retires `sandbox/album-motion/` in-lane | running (agent `a59b9b5183feee95f`; worktree `../partyreel-wt/album-motion-wiring`) | Opus, 3131 | |

**The Advisor** (Fable, read-only; the runbook's "Consult the Advisor"): agent `a381082be866b59e8`, spawned 2026-09-29;
its first question was the `demo-framing.names` hang. From another session, respawn it from `usher/kit/advisor-prompt.txt`.

**Handoff across accounts.** The Orchestrator session is `157caa18-ec54-4aa9-a12a-04c86d5a667b` (the second account,
seated 2026-09-29 12:23 EDT); the first account's `b01c012e` is retired and must not resume. Its agent ids live only
there; from another session, respawn each running lane per the runbook's "Resume a lane": kill by port any dev server
left on 3131 to 3135 (and any orphaned headless Chrome), then `spawn-prompt.txt` filled (same track, same port) plus a
note naming its pushed commits, what remains, its predecessor's transcript at
`~/.claude/projects/-Users-gibby-local-ai-partyreel/157caa18-ec54-4aa9-a12a-04c86d5a667b/subagents/agent-<id>.jsonl`
(grep it, never read it whole), that a stale `.next/dev/lock` may be deleted and that MCP tool ids change with the
account, and the relays below, which live only in the agents:
- Build 23's red-team (agent `a26fc2a59dd39c154`): respawn from `../partyreel-wt/_scratch/redteam-23/brief.md` after
  its `ledger.txt`'s last line, with: BUG-1 and NIT-1 filed (reach a settings page by its deep link); park at the admin
  portal's "Verify it's you" and report the steps waiting on Will's code; close every report it opens before 04:48
  UTC; delete events A `9490405b` and B `18fc375e` through the product at the end; the alias stays on build 23 until it
  finishes; the Vercel MCP does not reach the P3 team.
- `schema-pass`: Will's yes quoted (its row), and `public.reports`' default anon and authenticated grants closed in
  part 1.
- `crumbs-16`: handed back with the evidence (its row): reproduce the `demo-framing.names` hang on its own port, fix it at
  its root with a test that fails on its current code, re-run `lab:demo` over every board and `lab:smoke`, hand off again.

If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
This session's scratchpad (`/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/157caa18-ec54-4aa9-a12a-04c86d5a667b/scratchpad`,
until a reboot) holds the specs and gate logs (the next gate is 68); nothing there is needed that these lines and the
manifests do not carry.

Batch 8 (2026-09-29) answers Will's sitting on build 19, the desk whole (transcribed at `31de6aa0`: 41 answers on ten
boards). Batch 7 is merged whole; its records carry the rest.

Merged in batch 8 (their records carry the rest): crumbs-12, locked-door r2, disposable-mode r2, crumbs-13, lab-revamp
stage one, settings-wiring, triage-r2-wiring, crumbs-14, lab-revamp stage two, crumbs-15, loose-ends-wiring, contact-wiring, desk-tune.

## Next, in order

1. **Build 23's red-team is running** (agent `a26fc2a59dd39c154`, resumed from its ledger; build 23 is `6c64d5c8` with
   settings-wiring and triage-r2-wiring, both migrations applied). Its BUG-1 (HIGH: Settings rows never open their page
   in the panel; root-caused in `replaceSettingsPage`) went to `crumbs-16`; its NIT-1 (one extra welcome step after
   the shut door's ask) waits for the next crumbs lane with its other findings. Triage's AAL2 steps wait at the admin
   portal's "Verify it's you" for Will's code: ask him when it parks, then resume it by SendMessage. It parked there at
   17:35Z with the settings walks done (nine PASS; W5 not driven, a password; W8 is BUG-1) and three more finds for the
   next crumbs lane: BUG-2 MEDIUM (listing a waiting newcomer's address never admits her waiting row, so she shows
   joined and still at the door, the pulse and the bell count her, and Decline there would block a guest already in),
   BUG-3 LOW (the host's own album through `/e/` offers Report on everything: `viewerIsHost` reaches only the
   dashboard grids), NIT-2 to NIT-6 (its ledger, `../partyreel-wt/_scratch/redteam-23/ledger.txt`); its note on
   `public.reports`' default grants is schema-pass's. Nine open reports on event A and events A to D (`9490405b`,
   `18fc375e`, `9ed81b8b`, `37ab40b1`) wait for its cleanup; if his code never comes by 04:00 UTC, close A's reports
   myself (test data the Orchestrator restores). After its report,
   read-only SQL confirms no report open before 04:48 UTC (partyreel.com's purge runs milestone-30 code, which ignores
   open reports) and events A and B gone. With its result, relay to Will: both lanes' Questions (settings-wiring 13,
   triage-r2-wiring 11: `git show 7c0fbcb1^2:docs/tracks/settings-wiring.md`, `git show 1b29be3a^2:docs/tracks/triage-r2-wiring.md`),
   lab-revamp's six calls (its merge message), and the proof mail's yes, due now (the recommendation keeps it off until
   the emails round, per his email-policy note).
2. **Integrate each lane as it hands off** (crumbs-16 again, schema-pass, whose part 1 the Advisor reads before I apply it, event-ready, album-motion-wiring), each migration by
   protocol, one at a time: drift check, apply verbatim, the rolled-back refusals, advisors, types. The two wiring
   lanes' ledgers are gone with their boards;
   `../partyreel-wt/_scratch/triage-r2-wiring/` goes after crumbs-16's merge (it holds the relayed help article).
3. **The PREMISE re-read is done:** `disposable-mode`'s eight hold on build 23 (he may sit on it now); `locked-door`'s
   "as today" is production's doors since `desk-tune` (merged at `643c46e9`), so its four reach him with build 24. His
   paste from either desk transcribes with the new `lab:review` (the words renamed, the grammar kept; `--dry` first).
4. **Seats as they free** (at most four lanes; `memory_pressure` before each; app work first, Will's note):
   - `schema-pass` (running): it re-verifies every item
     against the schema as it stands (event_doors and triage_r2 applied since its audit), then writes and proves part
     1; part 2 waits for milestone 31; Q2 to Q5 as recommended (the data architecture is mine). Applying part 1: grep
     `main` for every dropped name, the protocol, then a live smoke of the anonymous surfaces on partyreel.com and the
     alias (a guest page by token, a public profile, help feedback, the newsletter), since prod shares the database. A
     second classifier refusal: stop and tell him.
   - The next crumbs lane: NIT-1, the red-team's findings, and the ROADMAP's two dead-seam lines from `crumbs-15`
     (the account deletion's, and the untyped claims, notification-prefs and guest-events reads).
   - Marketing rounds: `demo-framing` r2 (a slug in the host's voice, `my-party` or `our-wedding`, against a
     typewriter of slugs; the typewriter sharing the stage with the stream, or leading while the QR and stream move to
     the QR page's hero; a clickable touch in place of the "Try our demo event" eyebrow; an album spanning every kind of
     party; every printed slug reserved; `names` reshaped); `about-press` r1 (the press kit folded into /about, drawn
     with and without a four-fact strip and with no kit; the boilerplate dropped; then /press redirects to /about, the
     nav, footer, sitemap and llms files kept current; press-page's `a-human` reshaped); `privacy-hero` r4 (the veil
     and three variations; the sealed cards out).
   - After their rounds: the disposable wiring (after `disposable-mode` r2's picks and Will's Measure a phone; with the
     lane's idea of the premiere on the wall, the reel's screen counting down to the develop time and playing the roll
     as an event of its own) and the door family's wiring (if the doorway wins, its reveal: walking through the opened
     door into the album, drawn first as motion options; ASSETS row 36 if the host's door wins).
5. **Build 24** once build 23's red-team is done (it carries the redrawn door family for his sitting; crumbs-16 rides it
   if it has landed, else build 25) (`[preview]`, `alias-ensure.mjs`, prune), then its
   red-team: BUG-1's fix live and the new lanes' walks, crumbs-15's signed-in surfaces among them (a host changing a
   disposable album's door and opening Guests and Blocked; `/account`'s social sections; the operator's
   `/admin/reports` and Ask for proof; a host's Delete permanently on a removed item, then the purge cron's next run in
   `/admin/jobs`). Then milestone 31 is proposed to Will (his yes); schema-pass's
   part 2 applies after it ships.
6. **The demo event**, after `demo-framing` r2 (his full permission, 2026-09-29; the r1 board merged at `51db72fc`):
   the demo renamed (or made) to its pick, its slug claimed so the card's printed address opens it (today
   `mia-and-theo`, held by no event, left as is on his word), one home for the slug in `lib/demo.ts` that the card
   prints, the seed sets and every demo door opens (today all five doors and `/demo` open the token's address, since
   demo mode matches on the raw token), `OBJECT_EVENT` and `OBJECT_PRINTS` to match, a demo host account if `host` stands
   (`partyreel-demo` stays refused to anyone else by the brand family, `crumbs-11`), and ASSETS rows 5, 33 and 34
   unparked with the party's subjects.
7. **At milestone 31**: `kit/README.md`'s type table follows `crumbs-12` (every heading 700); Google's chooser names
   `ddafaemglzmuekbtjwzn.supabase.co` (ROADMAP's launch checkpoint, his call).

## Waiting on Will

- **His desk:** `locked-door` r2 (four asks) and `disposable-mode` r2 (eight) wait for the PREMISE re-read (Next,
  item 3). Two older asks wait on the rounds that replace their boards: demo-framing's `names` (behind `story=?`) and
  press-page's `a-human` (the About round).
- **The admin portal's code**, when build 23's red-team parks at "Verify it's you" in his Chrome.
- **With the red-team's result:** the calls to overrule (settings-wiring 13, triage-r2-wiring 11, lab-revamp 6,
  crumbs-15 3; drafted plainly in this session's scratchpad, `relay-calls.md`) and the proof mail's yes.
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
