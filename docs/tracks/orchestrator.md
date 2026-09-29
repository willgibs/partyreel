---
track: orchestrator
status: open
cut: "18491027"          # the launch-prep SHA this state was written at
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
  - "crumbs-13 merged at 3d2cfbd6 (2026-09-29): every `.signOut(` names its scope (`local` for Sign out, the guest header and the door's \"Not you?\"; `global` for an accepted account deletion and the new `signOutEverywhereAction`, whose card is `src/app/(app)/account/sign-out-everywhere-card.tsx`); `(shell)/lab/_desk/review-session.tsx` is free for `lab-revamp`; `pnpm lint` reads 0 warnings."
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
| `schema-pass` | the data architecture audited; its migration BLOCKED: the permission classifier refused the lane's write of the file (no retry). The audit is its manifest at `origin/lp/schema-pass` (`66794756`): Q1 his permission to write and prove, Q2 the reel's three columns wait for milestone 31 (main reads them), Q3 default privileges closed for anon and authenticated, Q4 the monthly meter deny-all, Q5 three CHECKs | handed off blocked; resumed on his yes | Opus | `66794756` |
| `lab-revamp` | stage two, the plumbing: a board as one self-registering folder, scoped lab checks, the trimmed API, the words renamed, the kit following (holds registry.ts and boards.ts; PROGRAM.md's lines come in its Handoff) | running, resumed (agent `a6b4519e3d363d7dd`) | Opus, 3133 | |
| `crumbs-15` | the dead missing-schema seams of the doors and the triage rebuild, no behaviour changed | running (agent `a7a881960265d2c2a`; worktree `../partyreel-wt/crumbs-15`) | Sonnet, 3131 | |
| `loose-ends-wiring` | loose-ends r1: the FAQ heading, the rings, the corner mark and its easter-egg lightbox (the board's folder is lab-revamp's: retire it at the merge) | running (agent `af847f8233bb3aa19`; worktree `../partyreel-wt/loose-ends-wiring`) | Sonnet, 3134 | |
| `contact-wiring` | contact-page r1: the routed form in the desk's chapter, a note and link per topic, a delightful receipt, the directory with icons (the board's folder is lab-revamp's: retire it at the merge) | running (agent `af668bf0060d434b3`; worktree `../partyreel-wt/contact-wiring`) | Sonnet, 3135 | |

**Handoff across accounts (written 2026-09-29, the old account at ~97% of its weekly limit).** The old Orchestrator
session is `b01c012e-f59c-432b-9873-9f4226c036f2`; its agent ids above are unreachable from a new session, so each
running lane is respawned on its worktree per the runbook's "Resume a lane" (`usher/kit/README.md`): kill by port any
dev server left on 3131 to 3135 first, then give the fresh agent `spawn-prompt.txt` filled (same track, same port)
plus: "You are resuming a lane whose agent was cut off by a usage limit: read your manifest's `## Where I am` (each lane
was asked to write it and push a WIP commit at the limit), `git log` and `git status` in your worktree, and your
predecessor's transcript at `~/.claude/projects/-Users-gibby-local-ai-partyreel/b01c012e-f59c-432b-9873-9f4226c036f2/subagents/agent-<id>.jsonl`
only where those leave a gap; a stale `.next/dev/lock` may be deleted; continue to your own handoff." The lanes:
- `settings-wiring` (`../partyreel-wt/settings-wiring`, 3131, agent `aefdc4b3cecd92f74`): merged (below); its relays were The Orchestrator's
  relays it took mid-lane, to re-send if its `## Where I am` lacks them: skip every legal draft (legal is rewritten once
  before launch); crumbs-12's notes (`EVENT_ROOMS` order, `edge-fade-scroller.tsx`, headings `font-heading` alone at
  700, the SWC space trap, `your-event-page-explained.mdx`'s old card order); `unlisted=ask` on the shut door's foot
  ("Ask Maya to let me in", then "Use a different email"); a sheet opened from a link cannot be closed
  (`event-share-provider.tsx:113-115`) and the custom link's error is unannounced; revoke PUBLIC EXECUTE when replacing
  `get_event_by_qr_token`.
- `crumbs-15` (`../partyreel-wt/crumbs-15`, 3131, agent `a7a881960265d2c2a`) and `loose-ends-wiring` (`../partyreel-wt/loose-ends-wiring`,
  3134, agent `af847f8233bb3aa19`), and `contact-wiring` (`../partyreel-wt/contact-wiring`, 3135, agent `af668bf0060d434b3`):
  cut late, no relays; respawn the same way.
- Build 23's red-team (agent `ab63a0b9ec16c1fe1`): if its report never arrived, respawn it from
  `../partyreel-wt/_scratch/redteam-23/brief.md` after its `ledger.txt`'s last line (a relay it took: close every report it opens).
- `lab-revamp` stage two (`../partyreel-wt/lab-revamp`, 3133, agent `a6b4519e3d363d7dd`): mid-work; its notes
  `../partyreel-wt/_scratch/lab-revamp/stage-two.md`.
- `schema-pass` is not running: it handed off blocked (the classifier refused its migration file). On Will's yes,
  respawn it into `../partyreel-wt/schema-pass` (3132) with his words quoted, from its manifest on `origin/lp/schema-pass`.
If the cut-off lands mid-integration: a local `launch-prep` ahead of `origin` holds a merge made after this note (push
it, then record it from its merge message and its lane's Handoff, `git show <merge>^2:docs/tracks/<track>.md`); a
staged, uncommitted merge is finished by `usher/kit/merge-lane.sh`'s own steps or reset with `git merge --abort`.
The old session's scratchpad (`/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b01c012e-f59c-432b-9873-9f4226c036f2/scratchpad`,
until a reboot) holds the batch's specs (`specs/<track>.json`) and gate logs; nothing there is needed that these lines
and the manifests do not carry.

Batch 8 (2026-09-29) answers Will's sitting on build 19, the desk whole (transcribed at `31de6aa0`: 41 answers on ten
boards). Wave A: `settings-wiring` (all nine event-settings picks, the doors end to end), `locked-door` r2 (the door
family), `disposable-mode` r2, `crumbs-12`. Batch 7 is merged whole; its records carry the rest.

Merged in batch 8 (their records carry the rest): crumbs-12, locked-door r2, disposable-mode r2, crumbs-13, lab-revamp stage one, settings-wiring, triage-r2-wiring, crumbs-14.

## Next, in order

1. **Build 20 was red-teamed live** (`18491027`; every journey PASS, the ledger `../partyreel-wt/_scratch/redteam-20/ledger.txt`):
   its two minors went to `crumbs-12` ("30 days", merged) and `crumbs-13` (the home's double preload), and its
   observation (the global sign-out) is `crumbs-13`'s on his word.
2. **`settings-wiring` (`7c0fbcb1`) and `triage-r2-wiring` (`1b29be3a`) are merged, both migrations applied** (2026-09-29,
   by a helper, each by its own header): `event_doors` recorded `20260929131041` (md5 `60e364d2`; the drift check clean, 26
   bodies after, `get_event_by_qr_token` without PUBLIC; the proof 12/12 rolled back; advisors 0029 at 33, 0028 at 4,
   no-policy at 17) and `triage_r2` recorded `20260929131921` (md5 `94b7d521`; 12 bodies, `create_report` at seven
   arguments; the proof 10/10 rolled back; advisors unchanged; `report_proof_mail_enabled` false). Types regenerated
   (the gate's typecheck and 6,829 tests green). Build 23 is live (`6c64d5c8`, alias-ensure green, pruned); its red-team
   runs (agent `ab63a0b9ec16c1fe1`, `../partyreel-wt/_scratch/redteam-23/brief.md`, a ledger line per step: a respawn
   picks up after its last line) on both lanes' walks (their Handoffs: `git show 7c0fbcb1^2:docs/tracks/settings-wiring.md`,
   `git show 1b29be3a^2:docs/tracks/triage-r2-wiring.md`); both lanes' Questions are his to relay (13 and more). Follow-ups:
   the two lanes' typed seams for a missing schema can go now (a crumbs lane); milestone 31 carries `kept_media_ids` to
   the production purge (milestone 30's cron never asks it; no open report names a removed item today).
3. **Integrate each lane as it hands off**, each migration by protocol, one at a time: drift check, apply verbatim, the
   rolled-back refusals, advisors, types. `negative.sh` runs once before the first (the kit changed with
   merge-lane.sh's id-less sweep). `settings-wiring` owns every guest-path function replacement this batch; no other
   lane replaces one. Large files go through a helper that transcribes, `cmp`s, applies and proves.
3. **Wave B into each free seat, app first** (Will's note, a fuller one to come: app work first, so marketing and admin
   stop reshaping off trickle-down changes). Drafted specs wait in this session's scratchpad (`specs/<track>.json`); a
   new session writes them from these lines.
   - `triage-r2-wiring` is running (its manifest carries admin-triage r2 and the hold's rebuild, his words whole).
   - `lab-revamp` stage one merged at `a17725c3` (the context layer, gate 63 green; press-page's `a-human` made moot
     behind `who-for`, so `the-close` waits too). Stage two, the plumbing, is re-cut into the next free seat and its
     agent resumed (`a6b4519e3d363d7dd`; its notes `../partyreel-wt/_scratch/lab-revamp/stage-two.md`: `require.context`
     works under `next dev` and Vitest, untried under `next build`); boards cut after it are authored in the new shape,
     the first as its proof.
   - `event-ready` r1 (Opus), once `settings-wiring` merges: his event checklist and the settings' mini wizard (and
     whether Create shares it), taking ROADMAP's "what needs you" and "the hub's code as the event's live door" lines
     and the `day-of-checklist-for-hosts` article.
   - Marketing wirings, when no app lane is ready: `loose-ends-wiring` (Sonnet: `faq-look=heading`,
     `review-photo=rings` with an ASSETS row for its slot, `everywhere-pill=corner` plus his easter egg, a small
     lightbox that is clearly a demo and one tap out; the phone keeps 3.2 s; the charts wait for the admin look);
     `contact-wiring` (Sonnet: routed, chapter, required; a note and a link per topic, his `urgency` answer; a
     delightful receipt; the directory with icons, a heavier email link and heavier headings, its Press tile following
     About); `album-motion-wiring` (Opus: push, both streams kept, symmetrical, each drawn in and dissolving while its
     photo pushes into the rows from the left).
   - Marketing rounds: `demo-framing` r2 (a slug in the host's voice, `my-party` or `our-wedding`, against a
     typewriter of slugs; the typewriter sharing the stage with the stream, or leading while the QR and stream move to
     the QR page's hero; a clickable touch in place of the "Try our demo event" eyebrow; an album spanning every kind of
     party; every printed slug reserved; `names` reshaped); `about-press` r1 (the press kit folded into /about, drawn
     with and without a four-fact strip and with no kit; the boilerplate dropped; then /press redirects to /about, the
     nav, footer, sitemap and llms files kept current; press-page's `a-human` reshaped); `privacy-hero` r4 (the veil
     and three variations; the sealed cards out).
   - `schema-pass` is running (cut before `settings-wiring`'s merge, clear of every function and column the two SQL
     lanes change; what it finds there waits in its Handoff for after their merges).
   - After their rounds: the disposable wiring (after `disposable-mode` r2's picks, Will's Measure a phone, and
     `settings-wiring`'s merge, since it rewrites the guest path; with the lane's idea of the premiere on the wall, the
     reel's screen counting down to the develop time and playing the roll as an event of its own) and the door family's wiring (if the doorway wins, its reveal: walking through the
     opened door into the album, drawn first as motion options; ASSETS row 36 if the host's door wins).
4. **Build 22 is live** (`54cd706c`; alias-ensure green, pruned, the desk served, the context layer read on the served
   desk): his sitting on `locked-door` r2 and `disposable-mode` r2 (4 and 8 asks), each
   with its context now (where, what brings someone there, why it matters, each option's gain and cost, the
   recommendation's reason, each board's opening), and `crumbs-13`'s sign-out. Red-teamed live (`../partyreel-wt/_scratch/redteam-22/ledger.txt`): every journey PASS, the admin portal's
   own session kept through a main-alias sign-out (its AAL2 half and the admin bar's reverse wait on Will's authenticator
   code, a two-minute follow-up); two a11y nits to ROADMAP; at 375 a board's opening puts the question 1.4 screens down
   (ROADMAP's fold line). Build 22's
   red-team also walks `crumbs-13`'s sign-out (its Handoff's four live walks: two browsers, the admin portal's session
   kept, Sign out everywhere, the guest header). Its red-team rides the claims walk: crumbs-12's hub row at
   1440, 768 and 375 resting and stuck, "restore it for 30 days", the reports lede, the headings at 700, /terms'
   Termination.
5. **The claims walk is done** (2026-09-29, `../partyreel-wt/_scratch/claims-walk/ledger.txt`): the red-team walked all
   but the Claim (the classifier refused it), and Will pressed it himself as partyr33l: Reel lane probe and the
   password Alias red-team claimed at 11:32 (each row took her `user_id`, her `email`, a `verified_at`, its pending
   address and typed name cleared, its uploads kept; no follow written, her profile's name untouched), Gallery width
   left waiting. All three rows restored to their name-only baseline afterwards. Build 21's production changes PASS.
6. **`settings-wiring`'s build** gets a red-team of its own (every door, both ways through each swap, the Guests room,
   the pages).
7. **The demo event**, after `demo-framing` r2 (his full permission, 2026-09-29; the r1 board merged at `51db72fc`):
   the demo renamed (or made) to its pick, its slug claimed so the card's printed address opens it (today
   `mia-and-theo`, held by no event, left as is on his word), one home for the slug in `lib/demo.ts` that the card
   prints, the seed sets and every demo door opens (today all five doors and `/demo` open the token's address, since
   demo mode matches on the raw token), `OBJECT_EVENT` and `OBJECT_PRINTS` to match, a demo host account if `host` stands
   (`partyreel-demo` stays refused to anyone else by the brand family, `crumbs-11`), and ASSETS rows 5, 33 and 34
   unparked with the party's subjects.
8. **Milestone 30 is live and verified** (`7846a4c9`, tag `milestone-30`, 2026-09-29): the headless pass clean, the signed-in
   pass PASS (`../partyreel-wt/_scratch/prod-m30/ledger.txt`), `kit/`'s three screens retaken from it. Its findings: a
   sheet opened from a link cannot be closed (relayed to `settings-wiring`, with the custom link's unannounced error);
   the demo door opens the token's address, never `/e/partyreel-demo` (the demo item, step 7); Google's chooser names
   `ddafaemglzmuekbtjwzn.supabase.co` (ROADMAP's launch checkpoint, his call); the free-plan article's lowercase bullet
   (ROADMAP). At milestone 31, `kit/README.md`'s type table follows `crumbs-12` (every heading 700).
9. **The lab revamp**: a board as one self-registering folder, its metadata in its spec, lab checks scoped to the
   lane's own boards, the authoring API trimmed, a fresh agent proving it (the first board cut after it); with
   library-lean's board ideas (a `Surfaces` family of live frames per route with guest entries, the Library's sidebar
   open by default, a plain-text view of Library pages, a retire-or-reuse call on `anonymous-info.tsx` and
   `floating-add-button.tsx`, and the lab's own words renamed with the revamp: the review mechanic's "ruled",
   `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His desk: zero** after build 19's sitting. Two asks wait on the rounds that replace their boards: demo-framing's
  `names` (behind `story=?`) and press-page's `a-human` (the About round).
- **The morning of 2026-09-30, on his phone** (his word): `disposable-mode` r2's Measure a phone on the alias (the
  board's dock: Open the camera, Take a frame, the camera app's photo, on his iPhone and an Android if he has one; paste
  the line back: the full-size promise rides on it); Q1 (on a phone the code card fills the screen, but Back
  leaves the album; should Back close it like the other full-screen popups?); the 2-minute real-upload check on the
  alias (a first photo, landscape, as a signed-out guest at a held-uploads event: the keep, her uploads' "Waiting for
  approval" and the tracker's badge, no held tile at the album's head; then Confirm your email, the one beat, the told
  name's Change; its `media.file_size_bytes` checks the 3.5 MB estimate); the 10-second iPhone check on partyreel.com
  (one tap on Save opens the system sheet and a shared photo arrives as a photograph; Settings > Camera > Record
  Video's size for 1080p at 30 fps, against the 65 MB a minute estimate).
- **Asks that come due later**: the proof mail's yes (when `triage-r2-wiring` lands), Libraries.dev access for a lane
  (when the help chat is cut), and any F1 frames he loves (when the admin look is cut).
