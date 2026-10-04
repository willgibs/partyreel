---
track: camera-clip
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d85ab943"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/media/limits
  - src/lib/guest/camera/
  - src/components/guest/camera/
  - src/lib/disposable/shot
  - src/lib/disposable/roll
  - supabase/migrations/20261004120000_
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/mutations/guest.ts
  - supabase/migrations/20261004100000_ladder_a.sql
---

# lp/camera-clip

**Goal.** Will's yes: the album camera's held clip runs to 30 seconds at about 5 Mbps (about 19 MB), the server's bound restated from ladder_a's create_media with the Advisor's hardening (the grace its own constant, the messages formatted from the constants), the ring's 0:30.

## Where I am

- Handed off. Booted from `8fa910336` (launch-prep's tip then). The migration went out first as the WIP `e2ad2d91e` (the Advisor reads it there, with the TypeScript side), the screen's wiring test followed as `7e93203fd`, and the Handoff below is the manifest-only commit after. launch-prep moved meanwhile (docs-prune and drive-export-r1 merged, records and cuts) without touching my paths or reads, and the two heads merge clean, so there is no sync commit.
- The migration is `supabase/migrations/20261004120000_camera_clip.sql`: `create_media` restated from ladder_a (live md5 `db4049b7…` = the file's, read at 05:52Z and again at 06:54Z), the diff its three hunks only; the new body hashes `fab801fc…`. Its foot holds the rolled-back proof and its result on the live schema: RED 4 of 8 rows red (steps 1, 2, 3, 7), GREEN 8 of 8, nothing persisted after. Not applied (the Orchestrator's, after the Advisor).
- Everything this lane wrote outside the repo is in `/Users/gibby/local/ai/partyreel-wt/_scratch/camera-clip/` (the proof's `red.sql` and `green.sql`, the measurement kit with its recordings, the gate logs).

## The brief

**Will's yes (2026-10-04) to the camera's longer clip:** "if easily manageable, i think this is a win-win. hosts get longer videos of special moments, we max storage more easily with great performance." The 10 seconds came from the camera board's drawn option (`video=hold`), never a technical limit: a clip is drawn at 1080 on its short side and recorded at about 8 Mbps (`src/lib/guest/camera/recorder.ts`'s `VIDEO_BITS`), about 1 MB a second, sent as one PUT (multipart only from 100 MB).

**What ships:**
- **The clip runs to 30 seconds** (`CAMERA_VIDEO_SECONDS`, `src/lib/media/limits.ts`, the one home the recorder's `maxMs`, the shutter's ring and its 0:30 read) **at about 5 Mbps** (about 19 MB a clip, sharp for party footage at 1080, so a 30 s clip sends in about the time of two of today's on a weak party signal). Say in your Handoff what you measured (a 30 s recording's bytes and seconds in a headless Chrome with a fake camera at least).
- **The per-shot byte bound scales with it** (`CAMERA_VIDEO_MAX_BYTES`, today 128 MB as "ten seconds of 4K at 60 fps from any current phone", for the direct-track fallback that records the camera's own track): derive the 30 s number from the same reasoning, in its WHY-comment.
- **`create_media`, restated by one migration under your reserved prefix** from its newest definition, `supabase/migrations/20261004100000_ladder_a.sql` (applied 2026-10-04 05:32Z; its live hash is in that file's foot), changing only the camera's block, hardened as the Advisor's Q26 asked (`/Users/gibby/local/ai/partyreel-wt/_scratch/pricing/q26-advisor.md`, "For the camera-clip lane"): the seconds written `c_camera_video_seconds + c_camera_video_grace` (30 + 0.5) so the mirror is literal; both refusal messages built with `format()` from the constants so one literal drives the check and the words; the words the guest wrapper routes by kept (`exceeds`, `longer than`: `src/lib/db/mutations/guest.ts`) and `roll.ts`'s exact match on the retake message untouched. The parity test reads the SQL constants beside the TS ones. The protocol at the migration's head: the drift read (its hashes), the rolled-back proof red then green at its foot (a 29 s clip lands, a 31 s clip and an oversize one are refused with the right words), the holders and grants restated exactly; the Advisor reads it, then the Orchestrator applies it.
- **What partyreel.com (milestone 35) and the alias meet** between the apply and the next milestone: their camera still stops itself at 10 s, so a longer bound on the server refuses nothing they send. Say so in the migration's head.
- **Not this lane:** re-shoots become a flat 3 per guest (Will's word), but that change ships with D3's confirm, whose "only a deletion" warning must exist from its first day, so `c_roll_retakes` and the roll's guard stay exactly as they are here.

`docs/systems/disposable-mode.md` is owned by another lane right now: write the line it should say ("a hold films up to 30 seconds…") under your Handoff's proposals for the Orchestrator, never in the doc.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The per-shot byte bound, 128 -> 384 MB.** Recommended, and built: 384 MB, the brief's "same reasoning" (128 MB held ten seconds of 4K at 60 fps from any current phone, about 13 MB a second; thirty seconds of the same is three times that). A real clip is about 19 MB (measured below), so the bound is only what a client that lies about the length can spend a shot, and every byte of it counts against the host's room and her plan's uploads whatever the shot's size: no loophole opens. What moves: a lying guest identity's worst case in one period (72 shots) goes from about 9 GB to about 27 GB, all of it inside the host's room. Holding 128 MB instead (still six times a real clip) is a small edit (the constant in `limits.ts`, the migration's `c_camera_video_bytes`, the comments naming the number and the proof's 384s): decide BEFORE the migration is applied.
- **A full clip against the host's smallest file cap (25 MB).** Recommended: no change. A host may set her per-event file cap as low as `MIN_UPLOAD_CAP_BYTES` (25 MB), and a full clip at the recorder's ask weighs 19.1 to 19.3 MB (measured on real footage and on noise), 1.35x under it; `recorder.test.ts` pins the arithmetic. What I could not measure is iPhone Safari's encoder: if a 30 s hold there weighs more than 25 MB, a camera album at that cap would refuse the guest's clip at the presign (the host's own sentence, after it was filmed), and the answer is a lower `VIDEO_BITS` (one number) or a higher floor. Will's iPhone walk reads the file's size.
- **iPhone Auto-Lock (30 s by default) at the end of a full hold.** Recommended: no code now. The screen may dim or lock as a 30 s hold ends; the camera already keeps what it filmed when the page hides (`keepFilming`, `camera-screen.tsx`), so the worst case is a clip a moment short. A screen wake lock while a hold rolls (`createWakeLock`, `src/lib/guest/screen-posture.ts`, which the live reel uses) is the small follow-up if his walk shows it (Deferred).

## System-doc edits (in place, owned facts only)

- none: `docs/systems/disposable-mode.md` and `uploads-and-r2.md` were docs-prune's while this lane ran, so the lines they should say are the proposals below.

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a screen wake lock while a camera hold rolls (`createWakeLock`, `lib/guest/screen-posture.ts`), if an iPhone's 30 s Auto-Lock locks the screen at a full clip's end; the camera keeps what it filmed meanwhile (from `camera-clip`). Bucket: Now.
- Guests: unsent camera shots wait in memory until they send (a roll of 24 full-length clips offline is about 0.46 GB); keeping them in IndexedDB would survive a long offline party and a killed tab (from `camera-clip`). Bucket: Speculative / longer-horizon backlog.

## Handoff (replaces the chat report)

- **Commits**, pushed to `origin/lp/camera-clip`: `e2ad2d91e` (the WIP: the migration, the TypeScript side, this manifest's Where I am), `7e93203fd` (the camera screen's wiring test), then the manifest-only handoff commit (its sha is in the chat line). launch-prep had moved to `fdbe1caba` (docs-prune and drive-export-r1 merged, records and cuts) with nothing touching my owns or reads, and `git merge-tree` of the two heads is clean, so there is no sync commit.
- **Gates** on `7e93203fd` (the head's code; the handoff commit changes this manifest alone), each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0, no warnings; `pnpm test` 0 (880 files, 10,602 tests; the untouched base had 877 and 10,585); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (155 checks, 0 failing; scope: the Library and the boards event-header, host-dashboard, identity and take-home, which import `limits.ts`). Its PREMISE note, that the-wait's open ask (arrival) describes `src/lib/disposable/`, is answered: this change touched that folder only in the camera video's limits (`shot.ts` and its tests), nothing of the arrival. Logs in `_scratch/camera-clip/` (`typecheck.log`, `lint.log`, `test.log`, `build2.log`, `lab-smoke2.log`). My dev server (3131) and every headless Chrome of mine are closed.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths plus this file, and four exceptions, each the one change the camera's new numbers forced:
  1. `src/lib/disposable/migration-guards.test.ts`: one test pinned `create_media`'s two refusals as literals (128 MB, 10 seconds); reshaped on purpose (scar kept: a camera video is bounded by its bytes and, where it says one, its length, each refused in the words the wrapper routes by; reason dropped: the numbers typed in the sentences).
  2. `src/app/api/r2/presign-upload/route.test.ts`: one test's literals (a 30 s clip and 129 MB were "too long" and "too large") now read from the constants, and a case added that a full thirty-second clip presigns.
  3. `src/app/api/r2/presign-upload/route.ts`: one WHY-comment said "ten seconds and 128 MB".
  4. `src/lib/errors/codes.test.ts`: one comment said "a video shot runs ten seconds".
  Left alone: `src/lib/db/mutations/guest.test.ts` (two sample sentences still say 10 seconds and 128 MB, which are valid inputs to a wrapper that routes by their words) and `guest.ts` (a `reads`).
- **The items**
  - The migration `supabase/migrations/20261004120000_camera_clip.sql`: `create_media` restated from ladder_a in three hunks only: the seconds 30 with the grace its own constant (the check is seconds + grace), the bytes 384 MB, both refusals `format()`ed from the constants; the words the wrapper routes by, the roll's sentences, `c_roll_retakes` and the grants untouched. Drift read, the live attributes and the proof's RED and GREEN result are in its head and foot (the SQL that ran is `_scratch/camera-clip/red.sql` and `green.sql`, generated from the file's statements and its proof; GREEN's step 7 shows the installed body hashing to the file's).
  - `CAMERA_VIDEO_SECONDS = 30` and `CAMERA_VIDEO_MAX_BYTES = 384 MB` in `src/lib/media/limits.ts` (the WHY-comment derives the number); the recorder asks 5 Mbps (`VIDEO_BITS`, `src/lib/guest/camera/recorder.ts`).
  - The ring and the mark are drawn by the new pure `src/lib/guest/camera/clock.ts` (`filmingProgress`, `filmingRead`, "0:07 of 0:30"), and the screen's `maxMs` is the same constant; `src/components/guest/camera/album-camera.film.test.tsx` pins all three on the real screen (mutation-checked: with `maxMs` typed as 10 s it fails "expected 10000 to be 30000").
  - The parity test (`src/lib/disposable/roll.test.ts`) reads the three SQL constants numerically beside the TypeScript ones, requires the check to be seconds + grace and evaluates each `format()` template against the presign's sentence; `shot.test.ts` (29 s, a full clip and the grace go, 31 s and one byte past the bound do not), `limits.test.ts`, `recorder.test.ts` (a full clip at the ask is about 19 MB and under the host's 25 MB floor).
  - **Measured**: Google Chrome 154, headless, a fake camera, the REAL `recorder.ts` bundled with the repo's esbuild, 1080 x 1440 portrait, MP4 H.264 + Opus, the fake microphone on (`_scratch/camera-clip/measure/`: `measure-results.jsonl`, `measure-results-busy.jsonl`, the recordings in `out/`, `ffprobe` read of each). A 30 s hold on Chrome's own easy test pattern weighs 4.24 MB (1.13 Mbps); on the repo's real 1080p footage (3:4 crop) 19.11 MB (5.08 Mbps overall); on a noise-and-motion worst case 19.34 MB (5.14 Mbps). The container runs 30.075 to 30.080 s for a 30 s hold, so the 0.5 s grace has six times to spare. The old setting for contrast (8 Mbps, 10 s): 10.49 MB on the real footage, 8.89 MB on noise. So a 30 s clip is about 19 MB, about two of the old clips, as the brief said, and the encoder meets its ask. iPhone Safari's encoder is not measured (Will's walk).
  - **Not walked, and why**: the camera UI in a browser against the dev server. Every camera album in the database is a deleted red-team one and a host cannot sign in on localhost, so none could be opened without creating data; the screen is pinned instead by the film test above, and the live walk is the red-team's after the apply and the deploy (the proof is this lane's live check, on the live schema).
  - `pnpm format` reflowed three pre-existing lines of `shot.ts` (prettier, nothing else).
  - No help or marketing page states the clip's length (`content/` and the marketing components grepped); the pricing estimates' 65 MB a minute of video (`VIDEO_BYTES_PER_MIN`) is the phone's own camera app, and a camera clip at 5 Mbps is 37.5 MB a minute, under it: nothing to retune.
- **Docs proposals** for the Orchestrator (the docs are docs-prune's, now merged):
  - `docs/systems/disposable-mode.md`, line 131 on launch-prep: replace "A camera video is one shot of up to 10 s (with half a second's grace) and 128 MB, since its length is the client's word (`media/limits.ts`, mirrored in `create_media` under `roll.test.ts`)." with "A hold films up to 30 seconds at about 5 Mbps (about 19 MB), with half a second's grace, and a clip may weigh 384 MB at most, since its length is the client's word. `media/limits.ts` is the one home (the recorder's `maxMs`, the ring, the "0:30" read); `create_media` mirrors it in three `c_camera_video_*` constants and `format()`s both refusals from them, under `roll.test.ts`." The rest of the bullet stands.
  - `docs/ROADMAP.md`, line 139 on launch-prep (Billing: measure an iPhone photo and a 10 s video uploaded at the camera's defaults): "a 10 s video" is now "a 30 s video" (about 19 MB at the camera's default).
- **Assets requested from Will**: none.
- **Board ideas**: a host could choose her camera's clip length beside its roll (10, 20 or 30 s) on the `customize` board's pattern: `CAMERA_VIDEO_SECONDS` is now one constant with its SQL mirror, so a per-event length is a column and the two SQL constants reading it, and the cost is bounded by the 30 s ceiling; the camera's first hint could say how long a hold may run ("Hold for a video, up to 30 seconds"), since today only the ring teaches it (a words question for the camera's next board).
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: one migration, `supabase/migrations/20261004120000_camera_clip.sql`, for the Orchestrator to apply verbatim through `apply_migration` after the Advisor has read it and BEFORE the build that films 30 s deploys (its head says why: an MP4's measured length would be refused at the complete by the old 10.5 s bound, after its bytes moved); then `get_advisors` (no delta expected: no grant, table or signature moves). No types to regenerate. No Worker, Vercel, Stripe or env change.
- **Calls his to overrule**: the per-shot byte bound at 384 MB, not 128 (Questions 1: before the apply); 5 Mbps as his yes said (measured about 19 MB) and the grace staying 0.5 s (measured over-run 0.08 s); no wake lock for the iPhone's Auto-Lock (Questions 3).
- **Look at first**: the head of `supabase/migrations/20261004120000_camera_clip.sql` and the three hunks (`python3 /Users/gibby/local/ai/partyreel-wt/_scratch/camera-clip/build_fn.py`, run in the worktree's root, rebuilds the body from ladder_a with the three hunks and prints the diff; its hash is the file's `fab801fc…`); then Will's iPhone: hold the shutter the whole 30 s at his default Auto-Lock, watch the ring fill and the mark read "0:30 of 0:30", see the clip land in the album and read its size in Files (about 19 MB expected; over 25 MB means lowering `VIDEO_BITS`).
