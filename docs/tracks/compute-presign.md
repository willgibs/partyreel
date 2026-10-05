---
track: compute-presign
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f5d933cb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/r2/presign.ts
  - src/lib/r2/presign.test.ts
  - src/lib/r2/sigv4
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/compute-model/budget.json
  - src/lib/r2/client.ts
  - src/lib/r2/presign-bucket.ts
---

# lp/compute-presign

**Goal.** The guest page's next CPU lever: presign R2 links with a small hand-rolled SigV4 query signer instead of the AWS SDK's presigner, byte-identical to the SDK's URLs, measured by `pnpm compute:model`.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why:** the compute model (`../partyreel-wt/_scratch/compute-model/report.md`, "Beside the levers") profiled the guest page, the dearest call (a 1,000-photo album's first load presigns up to 257 links). The AWS SDK's presigning is about 13% of its main-thread time; PRICING.md calls this its lever 5. The proxy, polls and upload levers have shipped or merged; what CPU remains is mostly page renders.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Port 3000 is Will's desk; 3131 is another lane's; yours is 3132.

**What to build:**
- **The signer:** a SigV4 query-string presign for R2's S3-compatible API in `src/lib/r2/sigv4` (Node's `crypto` only: HMAC-SHA256, the canonical request, the string to sign, the derived signing key cached per day, region and service), behind `src/lib/r2/presign.ts`'s existing functions so no caller changes.
- **★ Byte-identical:** a test corpus of keys (unicode, spaces, `+`, `/`, long keys), methods (GET, PUT with content type and length if signed today), expiries and response overrides (`response-content-disposition` for downloads) compares every URL with the SDK's for the same inputs and a frozen clock. The SDK stays a dev dependency for that test only if it can; if it must stay in dependencies, say why.
- **Every security property stays:** the same expiries, the same signed headers, no raw key or URL to the browser beyond the presigned one (CLAUDE.md), and secrets never logged.

**Prove it:**
- a micro-benchmark of 257 presigns, SDK against yours;
- `pnpm compute:model --port 3132` before and after: the guest page's CPU in guest-hour-live and guest-join-upload; lower the CPU lines in `budget.json` if they fall (the compute model's file, an exception in your Handoff);
- the whole gate (this code ships).

Work economically, with no helper agents.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Should the signer refuse what the SDK signed without a word? Recommended: yes (built).** Byte-identity holds for
  every input a caller sends; on inputs none sends, the SDK signed and this refuses: an empty key (the SDK signs the
  bucket's ROOT, whose GET is a listing of every key: `presign.test.ts` shows it), an empty content type (bound as an
  empty header), a length or part number that is no whole count, a part outside 1 to 10,000, an empty upload id, a
  life of no whole seconds, a bucket name R2 would not take. Each is a fail-closed throw, never a different URL.
- **Keep `@aws-sdk/s3-request-presigner` at all? Recommended: as a dev dependency (built).** The corpus is its last
  user, and it re-proves byte-identity on every SDK bump; if it ever blocks an upgrade, drop it with the corpus's SDK
  half, since `sigv4.test.ts` pins four URLs as literals that hold without it. `@aws-sdk/client-s3` stays a
  dependency: it still sends the multipart, HEAD, COPY, list and delete calls.

## System-doc edits (in place, owned facts only)

- `uploads-and-r2.md`, "R2 and presigns": a ★ line, presigns are signed by hand (`r2/sigv4.ts`), byte-identical to
  the SDK's, proved by `presign.test.ts`'s corpus, with what it refuses that the SDK signed.
- `uploads-and-r2.md`, the cost rule: "no `GetObjectCommand` in `src/`: a read is a URL signed in `r2/sigv4.ts`" in
  place of "`GetObjectCommand` only signed, in `r2/presign.ts`".

## Deferred (ROADMAP one-liners, bucket named)

- Now: Compute: the guest page's cold start still loads `@aws-sdk/client-s3` (about 52 ms of CPU locally, once an
  instance: `_scratch/compute-presign/`, `require` timed three times) for sends it rarely makes (a guest's own delete
  through `my-uploads` → `lifecycle/reclaim.ts` → `r2/delete.ts`; `r2/presign.ts`'s multipart, HEAD and COPY); a lazy
  `import()` of the SDK in `r2/client.ts`'s users would spare every cold start of every page that only reads.

## Handoff (replaces the chat report)

Scratch (every log named below): `../partyreel-wt/_scratch/compute-presign/`.

- **Commits**, on `origin/lp/compute-presign`: `32b1e0c3e` (the signer, the corpus, the policy test, the dev
  dependency, the doc lines), `ea6125ce9` (a WIP note, superseded here), `ef0979523` (the budget line), `32259e0f9`
  (the sync: launch-prep at `85ae56043`, crumbs-68's merge, which touched `budget.json`, a read, and
  `uploads-and-r2.md`, owned; no conflict), then this manifest alone (the head is in the chat line). Since the sync
  launch-prep took crumbs-69's merge and the library-specimens cut (the hub, the reel route, `dashboard.md`,
  `reel.md`): nothing of mine or my reads, and `git merge-tree` against `1d1afe8cc` is clean, so no second sync.
- **Gates** on `32259e0f9`, each on its own exit code: `zsh scripts/build-lock.sh pnpm typecheck` 0
  (`gate-typecheck.log`); `pnpm lint` 0, no warnings (`gate-lint.log`); `zsh scripts/build-lock.sh pnpm test` 0,
  914 files and 11,258 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`);
  `pnpm lab:smoke --base http://localhost:3132` 0, 188 checks, scope all since `package.json` changed
  (`gate-smoke.log`). No board, so no `lab:demo`. Its PREMISE note (drive-export's nine open asks describe
  `uploads-and-r2.md`): my two lines there are about signing, and change no premise of those asks.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned `src/lib/r2/{presign,presign.test,
  sigv4,sigv4.test}.ts` and `uploads-and-r2.md`, this file, and four exceptions: `src/lib/media-cost-policy.test.ts`
  (its presigner check matched `getSignedUrl(getR2Client(), new GetObjectCommand(`, which no longer exists: reshaped
  to its real scar, no function streams R2 bytes; `GetObjectCommand` is now refused anywhere in `src/`, and the check
  proves `presign.ts` signs its reads by hand and `sigv4.ts` holds no client and sends nothing); `package.json` and
  `pnpm-lock.yaml` (`@aws-sdk/s3-request-presigner` to devDependencies, the brief's ask; the lockfile moves only
  that importer entry); `scripts/compute-model/budget.json` (the brief's ask, below).
- **The items**
  1. **The signer** (`src/lib/r2/sigv4.ts`): SigV4's query presign on `node:crypto` alone (the canonical request, the
     string to sign, the derived key cached per day, region and service, at most four days held), behind
     `presign.ts`'s three functions unchanged in signature, so no caller changed. Its header holds the why, the
     byte-identity contract and the secret rule (no error, log or return carries a credential).
  2. **Byte-identical, proved**: `presign.test.ts` holds every URL equal to the SDK's (presign.ts's own old calls on
     the real `getR2Client()`) for 274 cases (26 key shapes from the app's own builders to unicode, spaces, `+`,
     `//`, `./`, `..`, `%41`, `?#&=`, controls and 1,024-byte and longer keys; GET inline, stable and save; PUT over
     8 types and 7 lengths; parts over 4 upload ids, 4 part numbers, 3 lengths; 7 expiries) on 5 frozen clocks.
     Five deliberate signer bugs (escaping, trimming, path normalizing, query order, the payload hash) each fail it,
     and a sixth (the host not lowercased) fails `sigv4.test.ts`'s configurations (each run by hand, reverted).
     `sigv4.test.ts` pins four URLs as literals, matches the SDK over six bucket and account shapes, refuses the
     bucket names the SDK would address by path, counts the HMACs (four a day, one a link) and shows no refusal
     carries the secret.
  3. **Live against R2** (`r2-live-check.mts`, its output `r2-live-check.txt`, 21 of 21): with the real keys, the
     stable and fresh GETs equal the SDK's URLs and R2 serves the object whole; the save answers with the signed
     disposition; R2 refuses a flipped signature, a longer life, an expired link, another key, an added
     `response-content-type`, a swapped save name, a read link used to PUT and a write link used to GET; a PUT of
     the wrong type or one byte more is refused and the signed one stores exactly its bytes and type; a part URL
     equals the SDK's on a real upload id, refuses one byte more and takes its own; all on `staging/` keys, deleted
     and aborted, nothing left. The app's own links: the test event's guest page rendered on 3132 read from R2 16 of
     16 sampled (inline and save, `page-links-check.txt`); both after-runs' joins uploaded 10 photos each through
     the presigned PUTs (complete-upload 200 x 2 each run; 20 media rows with previews in the test event).
  4. **The lever**: 257 album links in 2.31 to 2.33 ms against the SDK's 27.9 to 28.4 ms, 12x (`bench.log`; the race
     is in `presign.test.ts` with 4x as its floor). The guest page itself on the measuring server (`page-ab.mjs`: the
     test event's open album, 272 to 287 R2 links a render, renders one at a time): median 188.3 ms over 39 renders
     and 183.3 over 59 on the base (`page-before.txt`), 160.7 over 39 on this tree (`page-after.txt`): about 25 ms a
     render, as the race predicts.
  5. **`pnpm compute:model --port 3132 --scenarios guest-hour-live,guest-join-upload`** (`before.log`, `after.log`,
     `after2.log`; per route by `compare.py`): guest-hour-live 671 ms, then 594 and 448 (its page 391, then 178 and
     148); guest-join-upload 831 ms, then 1,176 and 964, the rise on calls that sign little or nothing (its two
     complete-upload calls 143, then 424 and 211 ms; its polls 189, then 173 and 269). What the change moved there: the page's presigns no longer warm the SDK's send
     path, worth about 18 ms over a cold process's first 20 sends (`send-warmth.txt`: 116 to 126 against 97 to
     106 ms); the rest is the shared machine (the join's page render alone moved 353 to 398 ms between the two runs
     of this tree). Calls: 20, then 17 and 17 (the join's polls, 7 then 5: the compressed hour's phase; nothing here
     makes or saves a call), and 24, then 23 and 24, within the budget's 18 and 26.
  6. **budget.json**: guest-hour-live's CPU line 1540 → 1190 (the file's own rule over the larger after-run, 594
     ms); guest-join-upload's left at 2620, since it did not fall.
- **Assets requested from Will**: none.
- **Board ideas**: none (no UI moved).
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none (the same four R2 variables).
- **Calls his to overrule**: the refusals where the SDK signed (Questions 1); the SDK's presigner kept as a dev
  dependency (Questions 2); guest-join-upload's budget line left where it is.
- **Not run, by the brief**: the live red-team on the alias (★ local only: nothing of this lane requested the alias,
  partyreel.com or a `*.vercel.app`); R2 itself stood in for it (item 3).
- **For the record** (the Orchestrator's): PRICING.md's lever 5 lines (the "≈100 ms of the SDK's presigning a 200",
  "Better: … a lean presigner") now describe a lever that landed.
- **Look at first**: `src/lib/r2/sigv4.ts` (about 200 lines), then `presign.test.ts`'s first describe and its
  fails-closed case.
