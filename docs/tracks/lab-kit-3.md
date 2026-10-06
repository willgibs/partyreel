---
track: lab-kit-3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
