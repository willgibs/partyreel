---
track: compute-lazy-sdk
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c68029ed"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/r2/client.ts
  - src/lib/r2/objects.ts
  - src/lib/r2/presign.ts
  - src/lib/r2/delete.ts
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/compute-model/budget.json
---

# lp/compute-lazy-sdk

**Goal.** Load the AWS S3 SDK only when a send needs it, so a page that only reads (its presigns are hand-signed now) never pays the SDK's cold-start CPU (about 52 ms an instance).

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why:** compute-presign (merged) signs R2 links by hand, but the guest page's cold start still loads `@aws-sdk/client-s3`. That is about 52 ms of CPU locally, once an instance, for sends it rarely makes: a guest's own delete (`my-uploads`, `lifecycle/reclaim.ts`, `r2/delete.ts`) and `r2/presign.ts`'s multipart, HEAD and COPY. On Vercel every cold start pays it, at Will's events' spikes most of all.

**The work:** import the SDK lazily (`await import("@aws-sdk/client-s3")`) inside the four `src/lib/r2/` modules that use it, behind their existing functions so no caller changes. The module graph of a page that only presigns must no longer reach the SDK.
- Prove the graph with a test or a build-output check: the guest page's server chunk, or a static import trace, no longer pulls `@aws-sdk/client-s3`.
- Prove the time: a cold `require` or `import` of the guest page's module before and after.
- Every existing test stays green. Error paths keep their words, and an import failure is captured like any send failure (never silent).

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app. Port 3132 is yours.

Wiring rigor: the whole gate. If `pnpm compute:model --port 3132` shows the guest page's CPU line falling, lower it (`budget.json`, an exception in your Handoff). Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Should a failed SDK load throw from `headObject`, the HEAD that never throws, rather than read as "absent"?
  Recommended: throw (built).** Its try wraps R2's answer alone (a 404 or 403 is `null`: still rendering, not there);
  the client and the SDK come before it, so a load that fails is a failed send like the others, reaches the complete
  route's own handling and Sentry, and never tells the render check its object is missing.
- **Is `getR2()` (the client and the command classes in one call) the right shape, replacing `getR2Client()`?
  Recommended: yes (built).** A command built from an import would put the SDK back on every cold start; one call that
  hands out both makes the lazy way the only way, and `lazy-sdk.test.ts` fails the other.

## System-doc edits (in place, owned facts only)

- `uploads-and-r2.md`, "R2 and presigns": a ★ line, the S3 SDK loads on the first send (`getR2()`), never on an import,
  with what holds it (`lazy-sdk.test.ts`); and the checksum line names the one client's home.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Compute: the compute model's server is warm and Next preloads every route entry at its boot (`preloadEntriesOnStart`,
  off on Vercel's minimal mode), so a cold-start lever, this one included, can never show in its CPU lines. Promote
  `_scratch/compute-lazy-sdk/cold-require.cjs` and `cold-batch.mjs` (a fresh process loads one route's compiled entry and its
  loader tree; two builds, interleaved, 12 runs each) into `scripts/compute-model/` as a `--cold` mode with a per-route budget.
- Now: Compute: the guest page's cold load is still about 120 ms of CPU (175 before this lane) and a profile of it
  (`_scratch/compute-lazy-sdk/prof/`) puts about 60% in node reading and compiling the entry's 49 chunks (2.3 MB), Stripe's SDK
  among them (197 KB, never run: `claim-handle-prompt.tsx` → `(app)/account/actions.ts` → `db/mutations/account.ts` →
  `stripe/account-cancel.ts` → `stripe/client.ts`), and zod's (277 KB): the next lever is what a read-only page loads without running.

## Handoff (replaces the chat report)

Scratch (every log named below): `../partyreel-wt/_scratch/compute-lazy-sdk/`.

- **Commits**, on `origin/lp/compute-lazy-sdk`: `a82c13e91` (the lazy load, its test, `presign.test.ts`'s reference calls),
  `e8108b0ea` (client.ts's failure note, the system-doc lines, the Questions), then this manifest alone (the head is in
  the chat line). Launch-prep moved since the cut (library-specimens' merge, crumbs-70's cut: the Library's demos, docs and
  manifests): nothing of mine or my reads, and `git merge-tree` of it with this head is clean, so no sync.
- **Gates**, each on its own exit code. Build on `a82c13e91`; the rest on `e8108b0ea`, whose only differences from it are a
  comment in `client.ts`, the doc and this file: `zsh scripts/build-lock.sh pnpm typecheck` 0 (`gate-typecheck.log`,
  `gate-typecheck2.log`); `pnpm lint` 0, no warnings (`gate-lint.log`, `gate-lint2.log`); `zsh scripts/build-lock.sh pnpm
  test` 0, 917 files and 11,302 tests (`gate-test.log`); `NEXT_PUBLIC_SITE_URL=http://localhost:3132 zsh
  scripts/build-lock.sh pnpm build` 0 (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3132 --timeout 90000` 0,
  164 checks, 0 failing, on a dev server of this tree (`gate-smoke.log`; scope: the boards whose drawings reach
  `r2/client.ts`, the Library and the shell). No board, so no `lab:demo`. Its PREMISE note (drive-export's nine open asks
  describe `uploads-and-r2.md`): my lines are about the SDK's load and change no premise of those asks.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned `src/lib/r2/{client,delete,objects,presign}.ts`
  and `uploads-and-r2.md`, this file, and two exceptions: `src/lib/r2/lazy-sdk.test.ts` (new: the brief's "prove the graph
  with a test"; it is not under an owned path) and `src/lib/r2/presign.test.ts` (7 lines: its three SDK reference calls took
  `getR2Client()`, which is gone, and now take `(await getR2()).client`; the corpus is unchanged and green).
  `scripts/compute-model/budget.json` is NOT touched (item 7).
- **The items**
  1. **The lazy load** (`src/lib/r2/client.ts`, about 70 lines): `getR2()` imports the SDK on the first send
     (`await import("@aws-sdk/client-s3")`), builds the one client with the checksum options R2 needs, memoizes it and
     hands out `{ client, sdk }`; the 15 send sites in `delete.ts`, `objects.ts` and `presign.ts` take both from it
     (`new sdk.HeadObjectCommand(...)`), each function's signature and words unchanged, so no caller changed. The one
     remaining reference to the package elsewhere is an `import type` in `presign.ts`. The credentials are checked
     before the SDK is paid for; this file remembers no failure.
  2. **The graph, by a test** (`lazy-sdk.test.ts`, C): no file in `src/` imports the SDK except as a type, only `client.ts`
     imports it at all (once, dynamically), and the guest page's static graph (its layouts, boundaries and page: 373 files)
     reaches `presign.ts` and `client.ts` and none of it the SDK. The walker agrees with the TypeScript parser's own
     import list on all 373 files, edge for edge (`bfs-check.mjs`); the detector is run against 15 sources that break it
     or must not trip it.
  3. **The graph, on the build** (`cold-require.cjs`, which loads one route's compiled entry and its loader tree in a
     fresh process, as a Vercel cold start does, minimal mode): the guest page loaded 10 `client-s3` files and 18
     `@smithy` files before and loads none after, 186 node modules before and 126 after (`coldreq-main.json`).
  4. **The time** (12 fresh processes per cell, the two builds interleaved, `coldreq-main.json`; CPU medians): the guest
     page **175.4 → 122.6 ms** (min to max 166.8 to 185.2, then 117.3 to 125.2); `/api/album/guest/media` 162.6 → 108.9;
     `/api/guests/mine` 142.3 → 91.7; `/api/r2/complete-upload` 159.7 → 107.8, which pays the SDK once on its first send
     instead (the model's two completes: 240 and 207 ms before, 401 and 71 after: the same total within noise,
     `model-before/` and `model-after/`). The bare `require` of the SDK alone was 68 to 73 ms in five fresh processes
     under this machine's load.
  5. **Every send, still**: `lazy-sdk.test.ts` A and B (24 tests): importing the four modules, a presign (all five
     kinds) and an empty delete load nothing; the first send loads once, two racing sends once, with one client built
     with the checksum options; a missing credential fails before the load and the next send tries again; a failed load
     throws from every sender (the load's own message) and is not remembered; `headObject` throws it where R2's refusal
     reads `null`; and one case per function for its command, input and reading (none of these sends had a test).
     **Live on R2 with the real SDK** (`r2-live-check.txt`, a scratch test, not committed): put, both heads, both
     copies, three list pages by token, a multipart (create, a presigned part PUT, the ListParts sum, complete) and an
     abort, a delete of 5 keys with no error and nothing left under the prefix. **On the production build**
     (`model-after/requests.jsonl`): both `complete-upload` calls answered 200 through the lazy path (HEAD and COPY on
     R2). **On `next dev`**: `getR2()` and a `headObject` of an absent key through a temporary route, 200, `null`, the
     one client twice (deleted after; `git status` clean).
  6. **Shipped files**: 158 route traces, 79 name the SDK before and after, and each of the 79 now also lists the lazy
     chunk it loads (`[externals]_@aws-sdk_client-s3_*.js`), so on Vercel no route that can send lost its SDK
     (`nft-before.json`, `nft-after.json`).
  7. **`pnpm compute:model --port 3132 --scenarios guest-hour-live,guest-join-upload`**, same session, the baseline
     build and this tree's (`model-before.log`, `model-after.log`): guest-hour-live 723 ms over 23 calls → 730 over 25;
     guest-join-upload 1,202 over 17 → 1,236 over 18; within the budget's 26 calls and 1,190 ms, and 18 calls and
     2,620 ms (the joins' polls move with the compressed hour's phase: nothing here makes or saves a call). **No line
     fell, so none was lowered**: the model's server is warm and Next preloads every route entry at its boot (off on
     Vercel), so a cold-start lever is outside what it measures; item 4's probe is where this lever shows (Deferred).
- **Assets requested from Will**: none.
- **Board ideas**: none (no UI moved).
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none (the same four R2 variables).
- **Calls his to overrule**: `getR2()` (client and commands in one call) in place of `getR2Client()` (Questions 2); a failed
  load throws from `headObject` rather than reading as absent (Questions 1); the new test file and the 7 lines in
  `presign.test.ts`, both outside the owned paths; `budget.json` left where it is.
- **Not run, by the brief**: the live red-team on the alias (★ local only: nothing of this lane requested the alias,
  partyreel.com or a `*.vercel.app`); R2 itself and a production build on 3132 stood in for it (item 5).
- **For the record** (the Orchestrator's): `_scratch/compute-lazy-sdk/next-before` and `next-after` are the two builds
  (APFS clones, 301 MB each) that `cold-batch.mjs` compares; delete them when the lane is merged.
- **Look at first**: `src/lib/r2/client.ts`, then `lazy-sdk.test.ts`'s sections A and C.
