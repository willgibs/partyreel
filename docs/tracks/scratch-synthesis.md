---
track: scratch-synthesis
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "613ad790"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/
  - docs/PRD.md
  - docs/PRICING.md
  - docs/calls.md
  - usher/kit/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/scratch-synthesis

**Goal.** Everything a future Orchestrator needs from the local scratch folder lives in the repo, the reusable tools in the kit, and what cannot be public in one private doc for Will to hand the cloud Orchestrator.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3131 is yours; 3000 is Will's desk.

**Will's ask (2026-10-06):** the program is moving to a cloud-seated Orchestrator, which sees only the repo. "Synthesize anything relevant from /_scratch into the repo. Anything that cannot make it into the public repo should be written into a single doc, which I can save locally and upload directly to the first cloud orchestrator chat." Agent memory was already folded in (CLAUDE.md's rule: memory holds nothing the repo lacks); `../partyreel-wt/_scratch/` (about 30 folders, mostly lanes' captures and logs) is the last place knowledge lives outside the repo.

1. **Survey every folder of `/Users/gibby/local/ai/partyreel-wt/_scratch/`** by its `.md`, `.json`, `.sh` and `.mjs` files (never read captures or logs whole). For each, decide: (a) knowledge a future agent needs and the repo lacks: synthesize it into its ONE home, per CLAUDE.md's "Keeping the docs healthy" (synthesized, never transcribed; no history; a decision's reason, never its story; a deferred task is one ROADMAP line); (b) a reusable tool: move it into `usher/kit/` with a line in the runbook's "The scripts" (the desk refresh, `desk/desk-refresh.sh`, at least; a red-team brief template distilled from `redteam-54/brief.md` and `redteam-56/brief.md`, with what is generic kept and the round's specifics as placeholders); (c) history or a lane's spent artifacts: leave it (the merge commits hold what shipped). Expect to place: the calls lab (`calls/calls-lab.md`, Will's review queue, as `docs/calls.md`, its form kept, its two stale lines fixed: AH3's "the app keeps no capture time" and S1's line about the bell's link, which crumbs-69 made untrue); the Drive design note's next versions (`drive-export/`, which the ROADMAP's Drive v2 lines cite by a scratch path: point them at the repo home); the desk plans' remaining desks (`desk/round-15-plan.md`, `desk-3-plan.md`: what is still ahead, as proposed lines for the Orchestrator's pickup, not edited by you); Will's inspiration notes (`inspiration/`) where a design brief would need them; the pricing and cost research's lasting facts and sources (`pricing-research/`, `pricing/`, `cost-atlas/`, `compute-model/report.md`) only where PRICING.md or a system doc lacks them.
2. **Every pointer into `_scratch/` from the repo** (`grep -rn "_scratch" docs usher CLAUDE.md`) is repointed to its repo home, or kept only where the scratch file is a lane's working area by design (the spawn prompt's `{scratch}`, a lane's own captures), said so where it stands.
3. **The private doc:** anything that must not go into a PUBLIC repo but a cloud Orchestrator needs goes into ONE file outside the repo, `/Users/gibby/local/ai/partyreel-wt/CLOUD-ORCHESTRATOR-PRIVATE.md`, written for that Orchestrator to read first. ★ NEVER a secret's value (an API key, a token, a password, a cookie, a session): a secret is named with where it lives (`.env.local` on Will's Mac, the Vercel env, Will's connectors), never copied. Expect it to be short: what is private but not secret (a person's details beyond the public account names, a local path's meaning, anything you judge should not be public), and the local-only facts a cloud session cannot reach (the desk at `localhost:3000` and its refresh, the test media folder, the agent transcripts' paths). If nothing qualifies in a category, say so in one line.
4. **Also place three lanes' leftovers:** guest-requests' proposed doc lines and its two Deferred lines (`git show 1cdbcaed5^2:docs/tracks/guest-requests.md`), and crumbs-84's proposed ROADMAP Help line (`git show 3bc74d23d^2:docs/tracks/crumbs-84.md`, "Proposed for the Orchestrator").

The repo is public: before committing, read every added line as a stranger would. Docs only (and the kit files you move); no production code. `docs/PROGRAM.md`, `docs/ROADMAP.md`, `docs/ASSETS.md`, `docs/STATUS.md` and `docs/tracks/` are the Orchestrator's: write the lines they need under your Handoff's proposed lines. The whole gate is light here: typecheck, lint and `pnpm test` (the docs and kit tests read these files), each on its own exit code. In your Handoff, list each scratch folder with its verdict (placed where, moved where, or left as history), and the private doc's path.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1. The calls lab's home and writer** (recommended, built): `docs/calls.md`, written by the Orchestrator as before
  (each merge's calls its own section at the record), so a cloud seat reads it; it should join `NEVER_OWNED` in
  `src/lib/track-manifests.test.ts` beside `docs/reviews/` once this lane merges (proposed below). Overrule: keep it
  local, and a cloud Orchestrator never sees it.
- **Q2. The policy tests' style picks, asked of Will as the lab's X8** (recommended: keep five as house rules, let
  `content-policy`'s "nothing but their phones" go, as docs-prune's classification said). Only Will answers it.
- **Q3. More tools moved than the two named** (recommended, built): beside the desk refresh and the red-team brief,
  the red-team harness five red-teams carried by copy (`usher/kit/redteam/`) and the dollar model behind PRICING.md
  (`usher/kit/cost-model/`, its output identical to the run PRICING quotes). Overrule: drop either; the scratch copies
  stay on the Mac as history.
- **Q4. Stale lines fixed in the lab beyond the two named** (recommended, built): X4 left the questions (built as the
  poll lever, the lab's AB2 to AB5), F's and L's intros and AW6's desk were untrue. Overrule: put X4 back.
- **Q5. docs-prune's 2026-10-04 proposals** (recommended, built): every stale one re-derived from today's code and
  applied to my docs (PRICING, PRD, billing-caps); the ≈92 history and restatement cuts were left (their snippets
  drift with every lane) for a prune pass (a Deferred line), and CLAUDE.md's one stale line is proposed below.
  Overrule: apply the cuts now, in a docs lane of their own.
- **Q6. The visual calls the desks still owe** (round 15's B1, Q6, B2, L3, C7, D3, Q3, G6, I4, I5, F1, F2, N4, N7, N9,
  out of the calls lab since 2026-10-04 and written down nowhere since): recovered from the round's transcript and
  proposed as one ROADMAP line per board (Deferred below), the durable home a brief is cut from, since the pickup is
  rewritten. Overrule: keep them in the pickup's desk lines only.

## System-doc edits (in place, owned facts only)

- `docs/systems/drive-export.md`: "The next versions (designed, not built)" (live sync on the same queue, Dropbox
  through `save_url`, the other destinations as read), from the design note's sections 9 and 10 and its research;
  wrangler dev's internal-error line is "up to two a call".
- `docs/systems/guest-flow.md`: the link store starts at the seed's attribution; the validator hashes the uploads
  switch while it is off (guest-requests' lines, checked against its merge).
- `docs/systems/disposable-mode.md`: the camera over a closed album hears the album's own word (its old "the sync
  carries no word of it" was untrue since guest-requests).
- `docs/systems/host-app.md`: the hub's link store starts at the seed's attribution (guest-requests).
- `docs/systems/billing-caps.md`: the constants' WHY lives in each function's newest migration; the account page also
  reads `?email_change`.
- `docs/systems/architecture.md`: why the guest API stays on Vercel until about 1,000 events a month.
- `docs/PRICING.md` (owned): the market it is priced against (sixteen rivals, linked); the atlas's stale lines (the
  stop policy, the preview refusal, staging, the breakers, the prune's and the reconcile's cursors, the proxy, the
  polls' rest, levers 3, 5 and 8, the join limit) and a note that its CPU a call is low against the compute model.
- `docs/PRD.md` (owned): a custom link and a password on every plan, the instant hide's exception, the bible's one
  accent; three of Will's standing principles no doc held; the Linear study folded into the workflow principle.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Guests: the door's camera (`entry-modal.tsx`'s `AlbumCamera`) is handed no word on uploads, so it still asks a closed album again on the calm cadence; hand it `uploadsWord` and `onAskUploadsWord` as the album's own camera has them (`guest-upload.tsx`) (guest-requests).
- The lab and the kit: `pnpm compute:model` measures only "Compute model (test)" (`EVENT_NAME` in `run.mjs`); a `--event-name` flag would let a lane measure an album of its own (guest-requests).
- Now: Pricing: re-run the atlas's per-call lines with `usher/kit/cost-model/` for today's paths (the CPU a call as measured, ≈44 ms on Vercel's average and not ≈3; a burst's one presign; staging's three copies a photo; no proxy on an API route; the wall screen resting, ≈$0.41 where it says $0.54), and decide the preview at complete: it is checked against its original's declared bytes at presign only, so a multipart original completed short could land a 2 MB preview beside a tiny original (re-check it against the original's HEAD at complete, or say so) (scratch-synthesis).
- Now: Docs: a prune pass over `PRICING.md`, `systems/billing-caps.md`, `systems/reel.md` and `PRD.md` by CLAUDE.md's "Keeping the docs healthy" (docs-prune counted ≈92 history and restatement lines there on 2026-10-04, never applied) (scratch-synthesis).
- Now: Media: capture-time's walk used two fixtures only the old scratch holds (`imageio-nozone.jpg`, a time with no zone; `imageio-lying.jpg`, a time past the bounds); add them to `src/lib/media/strip-metadata-fixtures/` beside the rest, so the next capture-time walk needs no scratch (scratch-synthesis).
- The lab and the kit: one capture tool in the kit: eight lanes each wrote their own URL capturer, each picking its DevTools port from a pid or at random; brand-r1's `shoot.mjs` interface (any URL, `--selector`, `--scheme`, `--reduced`, `--frames`, `--clipjs`), launched as `lab-demo.mjs` launches (port 0, then `DevToolsActivePort`) (scratch-synthesis).
- The lab and the kit: a function-body CLI over `src/lib/db/testing/migrations.ts`'s `liveFunction` (a function's newest definition, and its prosrc md5 for the drift check in `systems/database-security.md`), since two lanes re-derived both with regexes (scratch-synthesis).
- Generated media: the privacy hero's contrast re-measure when ASSETS 38 lands has no script: pause the veil's animations, seek N points of its loop, hide the words, take each text box's 95th-percentile backdrop luminance and keep each line's worst contrast (privacy-hero r4's `cap2.mjs` did it on the retired board) (scratch-synthesis).
- Lab explorations no board asks yet: host-moments r1, round 15's visual calls for the host: B1 adding a password (guests already in stay in on every device; anyone waiting meets it like anyone new; she is warned first), Q6 a develop time added mid-party refilling every roll (the Advisor thinks a host would not expect it), B2 declining blocks (the shut door, no second ask; Let back in tells her the outcome), L3 over her plan with a goal (the banner opens the size list: "5.3 GB left to free to fit your plan"); drawn on identity r5's set.
- Lab explorations no board asks yet: guest-moments r1: C7 a first photo glowing for the host but not for the guest who took it, D3 taking a shot back (one press, its frame free again; three rolls' worth at most, deleted that night) with Will's flat 3 re-shoots at any roll, Q3 how a batch of others' photos lands (about every 15 s; at a phone a batch of six opens the album's top at once and reads empty for a moment), G6 the reel opening on black from the Reel card and a shared reel link (a blink with no progress mark).
- Lab explorations no board asks yet: account-moments r1: I4 Follow and Block staying quiet (no success toast; a row leaves its list at once, with no undo), I5 a profile before a public page (an account with no public page keeps its uploads, likes and follows on its own page under a set-up invitation with no Not now).
- Lab explorations no board asks yet: create-wizard r4: the styles' polish, F1 what is left as Settings' steps (flat under the code with ticks, one line on what guests still need), F2 the develop playing while the event is made ("Creating your event…" as the room dims for the code; a failure returns to the look with her work kept).
- Lab explorations no board asks yet: marketing-themes (desk 6, the brand applied): N4 the privacy page's lens (its clear spots a touch stronger than drawn, the moving pane slipping under the words between rests; its photograph is ASSETS 38), N7 the FAQ (bold headings a screen reader can list; the footer's FAQ link staying on the page only on pricing), N9 the album page's hero (two photo streams handing over in turn, a photograph every 1.9 s).
- Lab explorations no board asks yet: moments in motion, from Will's six links of 2026-10-04 (transitions.dev's smoky dissolve and image-open tilt, libraries.dev's image): the product's verbs as one family on real photographs: take back (a smoky dissolve on the camera's Your shots and the bin's Delete permanently, never a soft Remove), set aside, open (today's grow, a weighted dismiss, the full tilt only for rare launches such as the Reel card), arrive, develop (a cell-by-cell reveal); ★ a canvas over a presigned `<img>` taints, so only object URLs and the camera's frames can feed one.
- Lab explorations no board asks yet: the aurora that answers, for desk 6's aurora board: light answering a real signal rather than looping: the Add's ring with libraries.dev's voice-glow envelope (quick to rise, slow to settle, an idle breath), a glow under the album camera's frame while a clip rolls (its mic is open, and a refused mic films silence), transitions.dev's gradient word re-keyed to the five lamps as the aurora's ink on paper, never on small badges.
- Lab explorations no board asks yet: the code develops: Create's sample code flipping only the modules that differ into hers (the QR version pinned so both share a grid, its finders still; canvas, no three.js), the disposable develop's first-visit reveal cell by cell, darkest first, and "Developing" as a breathing achromatic grain in the status set; skipped from Will's six: gooey as a language (a Melt look in the reel's catalog at most) and the tilt on every photo.
- Now: Host: the preferences customize r1's audit ranked and no board drew, each for the next customize round: a cover she picks ("Use as the cover"), "Tell me when" (someone waiting at the door, Review waiting, the develop; after the Notification system), library photos on a Disposable counting against the roll, "Show who took each" for the album and the wall, a fresh roll each day of a range, uploads closing at the develop or the morning after, the strangers' peek of 9 or none, keep out of the reel and feature, a guest's starting tile size set for everyone (scratch-synthesis).

## Handoff (replaces the chat report)

- **Commits, pushed** on `lp/scratch-synthesis`: `29d17f1aa` (the calls lab as `docs/calls.md`), `26b653542` (the
  kit's tools), `269b71710` (the system docs), `b84509c53` (PRICING and PRD), `7616885e5` (architecture), and the
  manifest's own (`d42eac06f`, `a089ac9a6`, this one). launch-prep moved only by two pickup records since the cut
  (`8d38c3ce5`, `9f7a7a1a4`: `docs/tracks/orchestrator.md`), so no sync.
- **Gates** on `a089ac9a6`, each on its own exit code: typecheck 0, lint 0, test 0 (1,052 files, 13,161 tests), logs
  `_scratch/scratch-synthesis/gate-{typecheck,lint,test}.log`; `7616885e5` and this commit add docs alone. Beside
  them: `zsh usher/kit/negative.sh`, every refusal holding, desk-refresh's new one included (`negative.log`); the
  red-team harness smoke-run on a headless Chrome of mine (`rt-smoke/`: a context at 375, a navigate, a tap, the
  events log); `cost-model/plans.mjs` and `atlas.mjs` diffed identical to pricing-wiring's and trash-in-storage's runs.
  `desk-refresh.sh` was not run: the desk served red-team 56, then brand r2's take (syntax checked, the desk found).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `docs/PRD.md`, `docs/PRICING.md`,
  `docs/calls.md`, six `docs/systems/` docs, `usher/kit/` (README, negative.sh, desk-refresh.sh, redteam-brief.txt,
  `redteam/`, `cost-model/`) and this file: owned paths, no exception.
- **The private doc:** `/Users/gibby/local/ai/partyreel-wt/CLOUD-ORCHESTRATOR-PRIVATE.md` (where each secret lives,
  never a value; what only the Mac reaches; what stays private; where to start).
- **Every scratch folder's verdict:**
  - `calls/`: placed as `docs/calls.md` (S1, AH3, X4, F, L, AW6 fixed; X8 added).
  - `desk/`: `desk-refresh.sh` moved to the kit; `round-15-plan.md` and `desk-3-plan.md` are spent but for desks 6 and
    7 (proposed pickup lines below, and the boards' calls as Deferred lines); the two review pastes are transcribed
    (history); `captures/` are lanes' captures by design, every capture-time fixture in the repo but two (a Deferred
    line).
  - `drive-export/`: the design note's next versions and the research's lasting facts placed in `drive-export.md`;
    Q25 and Q27 were wired (history).
  - `inspiration/`: placed as three lab-exploration lines (Deferred).
  - `pricing-research/`: the market placed in PRICING.md with its sources; its ladders and Deleted-inside runs are
    history (Ladder A shipped).
  - `pricing/`: Q15's model is PRICING's "What it costs us"; Q26 was applied (history).
  - `cost-atlas/`: its section is PRICING's cost section; its model moved to the kit; vendor page dumps history.
  - `compute-model/`: its facts are architecture.md's "Compute budget" and its scripts `scripts/compute-model/`; lever
    6's reason placed in architecture.md; its "≈3 ms a call is low" is PRICING's note and a Deferred line.
  - `customize/`: the Linear principles folded into PRD's workflow principle; the audit's unbuilt preferences a
    Deferred line; `customize-r1/` is their evidence (history).
  - `docs-prune/`: `policy-tests.md` placed as the lab's X8; its stale proposals applied (Q5) and its history cuts a
    Deferred line; audits, ledgers and briefs history.
  - `redteam-54/` and `redteam-56/`: the brief template and the harness moved to the kit; ledgers history.
  - `redteam-46/`: its driving notes folded into the brief template; `redteam-47` to `-55`, `-53b`, `-54b`: every
    finding routed to a crumbs lane or the ROADMAP (history). One loose end, harmless: red-team 54's four name-only guest
    rows on willg97's "Reel lane probe one (disposable)" were never removed (the test-data reset takes them).
  - `specs/`: every spec became a merged manifest (`git show <merge>^2:docs/tracks/<track>.md`) or a running lane's:
    history.
  - `brand-r1/`, `event-header-r4/`, `host-dashboard-r4/`, `identity-r4/`, `privacy-hero-r4/`, `crumbs-25/`: boards'
    and lanes' briefs and captures, their picks in `docs/reviews/` and their merges (history); the capture scripts
    and the hero's contrast measure became two Deferred lines.
  - `drive-walk/`, `drive-rewalk/`, `drive-wiring/`, `trash-in-storage/`, `pricing-wiring/`: lanes' working files,
    their findings fixed by later merges (history); `pricing-wiring/cost/` moved to the kit; the function-body helpers
    a Deferred line.
  - `test-slim/`: the running lane's working area. `crumbs-74-install.log`, `crumbs-79-install.log`: logs (history).
- **Proposed for the Orchestrator's files** (not mine):
  - Pickup (`docs/tracks/orchestrator.md`): line 63's "Its model of the pricing rules is
    `../partyreel-wt/_scratch/pricing/q15-advisor.md`" → "Its model of the pricing rules is PRICING.md's "What it costs
    us""; line 77's refresh → "`zsh usher/kit/desk-refresh.sh <sha>` (S set) does it all"; line 78's specs line →
    deleted (each spec is its lane's manifest in its merge); lines 85 to 86 → "Everything a successor reads lives in the
    repo (the calls lab is `docs/calls.md`, the red-team brief and tools are in the kit, Drive's next versions in
    `systems/drive-export.md`); the old scratch is history"; lines 91 to 92 → the round's remaining desks as below, the
    plan file's path dropped; line 172 → "Local-only: Will's desk (`localhost:3000`), the old scratch (captures and
    ledgers, history) and the agent transcripts"; line 184 → "**The calls lab** (`docs/calls.md`)", its X list read
    from the file; line 194 → "the policy tests: the lab's X8"; line 34's ledger path and line 48's fixtures path →
    "`_scratch/desk/captures/capture-time/fixtures/`, two of them only there (a ROADMAP line)"; lines 45 and 57 stand
    (a lane's captures and a walk's brief, its working area by design).
  - Pickup, the desks ahead: **desk 6** = the brand applied after brand r2's pick: brand-marks (the wordmark and icon
    final, the palette's tokens, the status set with the waiting colour), aurora (the answering light, a ROADMAP line),
    marketing-themes (each page fully dark or light, a section rhythm for the chapters, N4, N7, N9), demo-framing r6
    (its three refined, r5 a knob away, one or two new directions, the link quieter), presence r1 (the guest row and the
    hashvatar where they earn a place); **desk 7** = the moments boards after identity r5's set: host-moments,
    guest-moments, account-moments, create-wizard r4, each one ROADMAP line with its calls.
  - STATUS line 34: "desk 7, the small moments (`../partyreel-wt/_scratch/desk/round-15-plan.md`)" → "desk 7, the small
    moments (`tracks/orchestrator.md`, Next)".
  - ROADMAP: line 81 ("Drive v2 ...") retired as the duplicate of 119 and 120; line 119's "(`_scratch/drive-export/
    design.md`) and the Advisor's Q27 notes" → "(`systems/drive-export.md`, "The next versions")"; line 120 + the same
    pointer; line 64's "(`mock-parity.test.ts` and `step-screens.test.ts` quote "Live for guests" from
    `reel-card.tsx`)" → "(`mock-parity.test.ts` and `step-screens.test.ts` pin its "Live for guests" against
    `room-card.ts`, while the picture still types the line; redrawn, it takes `reelCardFace`)" (crumbs-84's proposal;
    its reel.md half already landed); line 86's "(this lane's scratch `console-crawl.mjs` and `no-writes.mjs`, …)"
    → dropped (those scripts are gone; `usher/kit/redteam/drv.mjs` is a driver to start from); line 264 ("Take
    `proxy.ts`'s matcher off the API routes …", built by compute-levers) → "One `getUser()` a request: a route handler
    misses React's `cache()`, so a signed-in album request asks Auth twice (`events/album-viewer.server.ts:74,99`;
    PRICING.md lever 3)"; line 382 (speculative ideas "tracked outside these docs", where no list exists) → name where
    docs-prune's 38 cut SPECULATIVE lines live (`git show e8d11584c^:docs/ROADMAP.md`), or Will's own list if he keeps
    one.
  - CLAUDE.md lines 9 to 10: guests upload "(an account, and a confirmed email, when the host asks for one)" → "(by
    default with an email confirmed by a code, which is their account)": Require verified emails is on by default
    (`20260921150000_identity_require_verified_email.sql:51`, `validation/event.ts:247`).
  - `src/lib/track-manifests.test.ts`: `docs/calls.md` joins `NEVER_OWNED`.
  - Pointers in code, outside my lane: `sandbox/drive-export/spec.ts:13` → `docs/systems/drive-export.md`;
    `sandbox/customize/spec.ts:21-23` → PRD's workflow principle and the ROADMAP's customize line;
    `gallery-empty-state-wait.test.tsx:373`'s `_scratch/crumbs-61/cap-4-*.jpg` is already gone (drop the path, keep
    the mechanism); `scripts/compute-model/budget.json`'s `mergedFrom` is generated provenance (stands).
- Assets requested from Will: none.
- Board ideas: none new beyond the Deferred lines (the moments boards, the inspiration's three, the capture tool).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the calls lab in the repo and the Orchestrator's (Q1) · X8's recommendation (Q2) · the
  red-team harness and the cost model in the kit (Q3) · X4 out of the questions and four more stale lab lines fixed
  (Q4) · docs-prune's history cuts left for a prune pass (Q5) · the owed visual calls as ROADMAP lines (Q6) · PRD's
  three new principles worded from the standing brief (delight where it costs nothing in clarity, nothing on a
  timeline, immediate or a clear state and a way out) · desk-refresh now exits 1 on a stamp that is not the sha.
- Look at first: `docs/calls.md`'s X8, S1 and AH3; `usher/kit/README.md`'s "The scripts"; PRICING.md's "What it is
  priced against" and its atlas note; `drive-export.md`'s "The next versions".
