---
track: camera-clip
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
