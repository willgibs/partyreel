---
track: lab-kit-3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - usher/kit/
  - scripts/lab-demo.mjs
  - scripts/album-perf.mjs
  - scripts/compute-model/
  - src/components/lab/whole.ts
  - src/components/lab/whole.test.tsx
  - src/lib/media/strip-metadata-fixtures/
  - src/app/(dev)/design/sandbox/drive-export/spec.ts
  - src/app/(dev)/design/sandbox/customize/spec.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/testing-verification.md
  - docs/systems/auth-accounts.md
---

# lp/lab-kit-3

**Goal.** The kit and the lab at home in the cloud: every Orchestrator script runs from any checkout on Linux as on the Mac, a cloud walk can sign in as a test host and has test media of its own, and the lab's open Now lines are closed (fitStage's pixel, DevTools port 0 everywhere, the pause proven at the gate, a motion capture per option). A production lane on tooling: the whole gate, no board.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**Why now.** The Orchestrator moved from Will's Mac into a claude.ai cloud session on 2026-10-06, and every lane now runs as a cloud session of its own (Ubuntu, root, 4 cores, Node 22, zsh installed at boot, Chromium at `/opt/pw-browsers/chromium`, outbound HTTPS through a proxy, the app's variables in the environment). The kit was written for the Mac. What the seat found: `merge-lane.sh` and `gate-lane.sh` source `~/.nvm/nvm.sh` under `set -e`, so on a machine without nvm every merge dies before it starts (`negative.sh` caught it; the seat runs on a no-op stub today); `alias-ensure.mjs`, `vercel-lib.mjs`, `desk-sections.mjs`, `moltbook.mjs`, `test-delta.sh` and `advisor-prompt.txt` name `/Users/gibby/...` paths and read `/Users/gibby/local/ai/partyreel/.env.local`; `kit-capture.mjs` hard-codes the Mac's Chrome; the runbook says `md5 -q` and `memory_pressure`; Chromium refuses to start as root without `--no-sandbox` (the spawn prompt makes a wrapper at `/usr/local/bin/chrome-ns`, read through `CHROME_PATH`); `compute-model/run.mjs` reads its photographs from `/Users/gibby/local/ai/partyreel-test-media`, which no cloud machine has.

1. **The kit runs anywhere.** Every path from the repo root (`git rev-parse --show-toplevel`) or the environment; `.env.local` read when present, the process environment as the fallback (a cloud seat holds the values in its environment); nvm sourced only where it exists; `md5sum` beside `md5 -q` and `free` beside `memory_pressure` in the runbook's commands; `kit-capture.mjs` and `page-console.mjs` through `CHROME_PATH`. `zsh usher/kit/negative.sh` green after, on Linux (this container), with a check for the nvm-less machine.
2. **A cloud walk signs in** (Will's yes, 2026-10-06): `usher/kit/redteam/signin.mjs <email> <base>`, for the test hosts alone (`willg97@gmail.com` on Pro and `hi@willgibs.com` on Free, the accounts in `testing-verification.md`): the service key mints a magic link (`auth.admin.generateLink`, type `magiclink`, which sends no mail), the publishable key's `verifyOtp` on its hashed token makes the session, and the script sets it as the SSR auth cookie in the walk's own headless Chrome for the local origin. It refuses any other address, the operator `partyr33l@gmail.com` above all (its AAL2 is never minted); it never prints a token or a cookie; and `negative.sh` holds the refusal. Then `testing-verification.md`'s sign-in lines say how a cloud walk signs in (the chooser stays the local way). Read `auth-accounts.md` first for what a session must carry here.
3. **Test media with no Mac.** A generator in the kit for photographs (a phone's size and bytes, a capture time in the minimal Exif) and a short video, unique bytes each run (`ffmpeg` and ImageMagick are on the container), feeding the red-team harness and `compute-model/run.mjs` (its fixtures from an environment variable or the generator's folder); and the two capture-time fixtures only the Mac's old scratch held, regenerated into `src/lib/media/strip-metadata-fixtures/` beside the rest (`imageio-nozone.jpg`, a capture time with no zone; `imageio-lying.jpg`, a time past the bounds), so the next capture-time walk needs no scratch.
4. **The red-team harness on Linux** (`usher/kit/redteam/`): its Chrome through `CHROME_PATH`, its devices' blocks of Vercel and partyreel.com kept, `drv.mjs`'s head saying how to start it in a cloud container; a smoke run of it against your own dev server.
5. **The lab's open lines** (ROADMAP Now, each retired in your Handoff's list): `fitStage` (`src/components/lab/whole.ts`) wears a width a fraction short of the row it measured, so the last slide wraps at the 375 knob on a desk (`lab:demo --board brand --state screen=375`: CUT and CLIPPED): round it up or give it a pixel of slack; `album-perf.mjs`, `scripts/compute-model/chrome.mjs`, `usher/kit/page-console.mjs` and `kit-capture.mjs` ask Chrome for port 0 and read `DevToolsActivePort`, as `lab-demo.mjs` does; `lab:demo` reads `getAnimations()` in every hidden option's frames and fails a step whose CSS loops still run; `merge-lane.sh`'s transitional block goes (every open lane postdates the lab revamp); a motion capture per option in `lab:demo` (a short loop), so a light that answers events is judged moving; `pnpm compute:model --event-name` (it measures only 'Compute model (test)' today).
6. **The Mac's scratch named in code**: `sandbox/drive-export/spec.ts:13` points at `docs/systems/drive-export.md`; `sandbox/customize/spec.ts:21-23` at PRD's workflow principle and the ROADMAP's customize line (the third, `gallery-empty-state-wait.test.tsx`'s, is crumbs-85's, in its folder).

The runbook (`usher/kit/README.md`) is yours for this lane, with the Orchestrator's cloud lines already in it: refine its commands in place, never a second home. Out of scope: the boards' own pause bridges (each in its board's next round) and anything under `src/` beyond your owns.

**Verify on.** The whole gate on the synced tree, each step on its own exit code (`pnpm lab:smoke` too, since `whole.ts` renders in every board); `negative.sh` on this Linux container; a signed-in page loaded headless through `signin.mjs` against your own production build at :3000 (a host's dashboard, read-only), and `signin.mjs` refusing the operator and a stranger; the generator's files uploaded through a guest's real join on a disposable album of yours (name it '(disposable)'), the album deleted after.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- `signin.mjs` mints only on a LOCAL base (localhost, 127.0.0.1) and refuses the alias as well as partyreel.com.
  Recommended: keep it (a cloud walk runs on its own build, and a minted session on the alias spends Hobby CPU); built so.
- `lab:demo` now walks every step a second time with motion allowed (the pause check and the motion capture), where
  it did only when the stills matched. Measured: the whole desk (3 steps) in 205 s. Recommended: keep it on every
  step, since a pause proven only sometimes is not proven; `--loop 0` skips the loop if a desk grows slow. Built so.

## System-doc edits (in place, owned facts only)

- `docs/systems/testing-verification.md` (listed under `reads`, edited because the brief asks for it): the signed-in
  walk line gains how a cloud walk signs in (`signin.mjs`); the fixtures line's Mac path becomes `media-gen.mjs` and
  the strip fixtures.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `pnpm format` rewraps the kit's one-statement-a-line scripts (seven of them on this lane:
  moltbook.mjs grew 400 lines) and `proxy.test.ts` reads `alias-ensure.mjs`'s TARGETS on one line, so three of its
  tests went red; a `usher/kit/` line in `.prettierignore` (lab-kit-3).
- The lab and the kit: `redteam/join.mjs` walks only a name-only door ("Continue as guest"); an album on the default
  confirm-an-email door needs Settings > Who can get in > Type a name first, so a walk of the email door has no tool
  (lab-kit-3).
- The lab and the kit: `pnpm compute:model` has not run end to end on Linux (its fixtures now come from
  `$PARTYREEL_TEST_MEDIA` or `media-gen.mjs`, and `--event-name` is new); its next milestone run is the first
  (lab-kit-3).

## Handoff (replaces the chat report)

- **Commits:** work `f4900505`, `89b3cd94` (`send.mjs` counts a batched complete's files), `9d8b3bea` (the kit's dense
  scripts restored: `pnpm format` had rewrapped seven); sync `f3b2afab` (launch-prep `e4c2d7c3` merged; one README
  conflict, the cloud seat-in line: launch-prep's snapshot words kept, the no-op nvm stub dropped); `5ddcbdce` (fuser
  beside lsof). The head is in the chat line.
- **Gates on the synced tree `f3b2afab`**, each on its own exit code: typecheck 0, lint 0, `pnpm test` 0 (13,172
  passed, 2 skipped), build 0 (`NEXT_PUBLIC_SITE_URL=http://localhost:3000`), `lab:smoke` 0 (202 checks, 0 failing),
  `lab:demo --all` 0 (3 steps, 0 failing, 205 s; a first cold run erred on brand reading an option not yet drawn, the
  warm re-run green), `lab:demo --board brand --state screen=375` 0 (was CUT and CLIPPED at 1440).
  `git diff --name-only f3b2afab HEAD | zsh usher/kit/scope.sh code` prints nothing (kit and this manifest only).
  `zsh usher/kit/negative.sh` on this Linux container: all 23 refusals hold, the two new ones included.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and
  `docs/systems/testing-verification.md` (a `reads` file; the brief asks for its sign-in lines; System-doc edits).
- **The items:**
  1. The kit runs anywhere: `kit-env.sh` (nvm only where it exists, `kit_env` from `.env.local` else the
     environment, `kit_port_pids`/`kit_free_port` through fuser where lsof sees no socket) and `kit-env.mjs` (`REPO`,
     `envValue`, `chromePath`, `devToolsPort`); every script on them, no `/Users/gibby` left but the Mac's own
     `spawn-prompt.txt` and `budget.json`'s provenance. Proof: negative.sh's new check 15 (merge-lane.sh with a HOME
     holding no nvm reaches its own refusal; the old script died `STEP FAILED`, run by hand); `page-console.mjs` on
     :3131 read the Library with 0 errors. Found on the way: `lsof -ti tcp:` frees nothing here (a :3000 server from
     an hour before still held the port).
  2. A cloud walk signs in: `usher/kit/redteam/signin.mjs <email> <base> <device> [--open <path>]`. Proof: on a
     production build at :3000, device H1 signed in as willg97 (2 cookies, `sb-…-auth-token.0/.1`) and
     `--open /dashboard` landed on `/dashboard` ("23 events · Pro"); the operator, a stranger, the operator's address
     in other case and `https://partyreel.com` exit 3 before any key is read (negative.sh check 16). Never prints a
     token, link or cookie.
  3. Test media with no Mac: `usher/kit/media-gen.mjs` (ffmpeg alone, so the Mac runs it too): 4032x3024 photos at
     about 4.4 MB with Make, Model, Orientation, DateTimeOriginal and OffsetTimeOriginal; a 3 s 1080x1920 H.264 + AAC
     clip with its creation_time; `party-cam.y4m`; compute:model's six shapes. `--capture-fixtures` wrote
     `imageio-nozone.jpg` (OffsetTime tags dropped from ImageIO's own file) and `imageio-lying.jpg` (2099), byte-for-byte
     reproducible; read through the app's own strip and capture-time: nozone `2026:10:03 21:14:05`, no zone, read in
     America/New_York as 2026-10-04T01:14:05Z; lying 2099 accepted as null.
  4. The red-team harness on Linux: `drv.mjs` reads Chrome's port from the walk's profile (port 0), its head says how
     to start a walk on a cloud seat; `send.mjs` counts the files inside each batched complete (it timed out on one
     answer for four files). Proof: a guest's real join (`join.mjs`, device G2 at 375) on a disposable album of
     willg97's, two sends of generated media: 6 rows, all approved, sizes and `captured_at` equal to each file's stamp
     (the video's from its movie header).
  5. The lab's open lines: `fitStage` lays out and wears every width with 2 px of slack and takes it from the room
     (`whole.test.tsx`'s new case fails at a slack of 0 and passes at 2; the four-in-a-row case reads the worn width);
     `lab:demo` fails a step UNPAUSED on any CSS loop a hidden option still runs (`getAnimations()` in the view and its
     frames; a forced loop in a hidden option read `["ring: zzspin"]`, none before) and takes a motion capture per
     option (`--loop 4`, `--loop-gap 250`; `--save-shots` keeps them under `loops/`), which now names event-header's
     moving options; port 0 in `album-perf.mjs`, `compute-model/chrome.mjs`, `page-console.mjs`, `kit-capture.mjs` and
     `drv.mjs`; `compute:model --event-name`; `merge-lane.sh`'s transitional block was already gone at the cut (no
     `touchpoints.ts`, `boards.ts` or kept-ours line in it), so that line only retires.
  6. The Mac's scratch named in code: `drive-export/spec.ts` points at `docs/systems/drive-export.md`;
     `customize/spec.ts` at PRD's "Adapt to every host's workflow" and the ROADMAP's customize line.
- **ROADMAP lines to retire** (record.py): `compute:model`'s `--event-name`, the two capture-time fixtures,
  `fitStage`'s width, a motion capture per option, port 0 for the four Chrome launchers, `lab:demo`'s
  `getAnimations()`, and `merge-lane.sh`'s transitional block.
- **Test data left:** the album "lab-kit-3 media walk (disposable)" (`e3a681d1-1f98-4d9c-b1bd-fa53a871fec8`,
  willg97's), deleted through Settings > Delete event at 08:54Z, so it sits in Deleted with its 6 media and its guest
  "RT LabKit Guest" until the purge; delete it for good whenever. Every magic link minted was used at once.
- Assets requested from Will: none.
- Board ideas: `lab:demo`'s loops could reach the review sheet as one moving picture per option (a GIF or a strip),
  so Will judges a light's motion where he answers, not only the gate.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (no SQL was written; the walk's reads went
  through the REST API with the service key, read-only).
- **Calls his to overrule:** a cloud walk signs in by a minted magic link for the two test hosts (his yes of
  2026-10-06), on a local base only; the generated media are synthetic gradients with drawn labels, never a real
  photograph; `lab:demo` always walks the motion pass.
- **Look at first:** `usher/kit/redteam/signin.mjs` (the refusals sit above every key read), then `scripts/lab-demo.mjs`'s
  motion pass, then `src/components/lab/whole.ts`'s SLACK.
