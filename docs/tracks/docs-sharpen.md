---
track: docs-sharpen
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "49752a48"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - usher/kit/spawn-prompt.txt
  - usher/kit/README.md
  - usher/HEARTBEAT.md
  - usher/moltbook/README.md
  - usher/README.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - AGENTS.md
  - docs/STATUS.md
  - docs/tracks/orchestrator.md
  - src/lib/record-depth-policy.test.ts
---

# lp/docs-sharpen

**Goal.** The docs every session and lane reads at boot, sharpened to what is followed: one-off rules, history, repeats and wordiness cut, every ruling of Will's and every guardrail kept, each cut listed with its reason.

## The brief

**Will's words (2026-09-24, verbatim):** "I feel like we've created more rules than we need to operate on a daily basis. One-offs were likely hit by lesser models and don't need to be written rules that distill others. Our internal workflow docs are key - every added line distills the rest, so it's important we're constantly reviewing that to keep it sharp. Attempting to follow intense comprehensive docs in every round of context reduces both how many things actually get followed, as well as creative context remaining. Elegance tends to win."

**The task.** Sharpen the docs that every session or lane reads at boot:
- `CLAUDE.md` (1,857 words, loaded into every session);
- `docs/PROGRAM.md` (3,013 words, read at every lane's boot);
- `usher/kit/spawn-prompt.txt` (578 words, every lane);
- the Orchestrator's own `usher/kit/README.md` (1,709), `usher/HEARTBEAT.md`, `usher/moltbook/README.md` and `usher/README.md`.

**Cut:**
- a rule that records a one-off mistake rather than a hazard that recurs;
- history, or the story of how a rule was learned (git holds it);
- the same rule stated in two docs (keep it in the one whose question it answers, per CLAUDE.md's "every fact has one home", and point to it at most once);
- a rule a script or test already enforces, where the prose adds nothing the refusal doesn't say;
- phrasing that takes three lines to say one.

**Keep:**
- every ruling of Will's (his quoted words and what they decide);
- the security guardrails;
- the working loop's steps;
- the facts a newcomer cannot find in the code.

When unsure, keep it and list it under Questions. Aim for a real reduction, around a third of the words, but never cut a live rule to reach a number.

**Hand off with** a table of every cut, each with its doc, the line or rule in a few words, and one reason (one-off, history, repeat of X, enforced by Y, compressed), so the Orchestrator can review it in minutes; and the before and after word counts per doc.

**Boundaries.**
- You own the five usher files. `CLAUDE.md` and `docs/PROGRAM.md` are the Orchestrator's alone (no lane may own them): write your sharpened copies to `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/docs-sharpen/CLAUDE.md` (at most 150 lines, the record-depth test's cap) and `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/docs-sharpen/PROGRAM.md`, with their cuts in the same table, and the Orchestrator reviews and applies them at your merge.
- The tests that pin these docs stay green: `src/lib/record-depth-policy.test.ts` (CLAUDE.md at most 150 lines) and anything else the gate finds.
- Never change a rule's meaning while compressing it.
- No other doc is touched: a doc outside these that repeats a rule goes in your Handoff as a line to change.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

Every call below is built as recommended and is Will's to overrule.

1. **A lane reads its manifest and only what its task names**: no STATUS, board ledger or review sheet by default
   (CLAUDE.md step 1, PROGRAM.md "Agent boot" 5, the spawn prompt). Recommended: keep (Will's retrieval rule).
2. **"Rules are provisional" is dissolved.** Its working-guidelines paragraph is superseded by the Library direction
   (the tests are the real rules). "Keep the real scar, drop the expired reason, say which" moved to CLAUDE.md step 4.
   "Before launch there are no real users" is now its own principle. "Only Will changes the bible" moved to
   CLAUDE.md's Rising tides line, since its old homes (`docs/design/README.md` and the bible's header) may retire.
   Recommended: keep.
3. **The service ids** (Supabase project, R2 account and bucket, Stripe account) now live only in STATUS
   "Infrastructure", which CLAUDE.md's map points to; the one Stripe check (`livemode` false) stays in the guardrails.
   Recommended: keep them in STATUS, or move them to `architecture.md` if STATUS is trimmed.
4. **The gate is defined once** (CLAUDE.md "The gate and git"). `design:rules` and the specimen collector left the
   always-read layer because their freshness tests name the command; `gate-lane.sh` still runs both. Recommended: keep.
5. **The Orchestrator's init template** seats in per the runbook's "Seat in" (it was PROGRAM.md "Roles"); the
   seat-in and the clean close moved there. Recommended: keep.
6. **Program principles**: Rising tides, Model delegation and Rules are provisional left PROGRAM.md (the bible,
   the runbook and CLAUDE.md hold them). "Prototype first, focused rounds" is now "Fast, focused rounds", in Will's
   words, and "Own fewer services, cost frugality" is now "Own fewer services". The "Program principles" heading
   stays because `influences.ts` reads it until the rules machinery retires. Recommended: keep.
7. **Dates are dropped from Will's rulings** in the files I own (git holds them); his quoted words and "(Will)" are
   kept. Recommended: keep.
8. **HEARTBEAT "Never" is the one home of Will's terms** ("act as him" now reads "act or speak as him", which folds in
   Moltbook's "never a word as him"). usher/README keeps "nothing destructive", scoped to the folder as before.
   Recommended: keep.
9. **Kept although a strong model might infer them**, listed in case you want to cut further: `rm -rf .next/dev` for
   a CSS edit that does not show; `pnpm format` on changed files only; the lab key as a light guard; a backend job's
   `/admin` health signal; a replacing migration starts from the function's newest definition (runbook); a time is
   read from `date` (HEARTBEAT); the Moltbook challenge rules (ten failures suspend the account). Recommended: keep
   all, since each is either specific to this project or costly to get wrong.

## System-doc edits (in place, owned facts only)

- none

## Deferred (ROADMAP one-liners, bucket named)

- none (the follow-up candidates are in the Handoff)

## Handoff (replaces the chat report)

- **Commits:** work `0e172f04` (the five usher files); sync `d7f10487` (`origin/launch-prep` at `6fb45435`, the
  bible-ten cut, merged in). The head is in the chat line.
- **The two copies to apply at the merge** (your files) are in
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/docs-sharpen/`:
  `CLAUDE.md` (125 lines, md5 `e17df7fefefe276fa59965e1a74fb72f`) and `PROGRAM.md` (md5
  `30995a176df4da6e6a75668d8b852033`). Apply them in the same merge: the new spawn prompt relies on CLAUDE.md's gate
  and on PROGRAM.md "Agent boot" 5 and 6.
- **Swap test** on the final copies (the md5s above in the tree, then restored with
  `git checkout -- CLAUDE.md docs/PROGRAM.md`):
  - record-depth-policy, docs, influences, links and track-manifests tests: EXIT 0 (5 files, 72 tests;
    `swap-targeted-final.log`);
  - `pnpm design:rules`: EXIT 0, no artifact change (`swap-rules-final.log`);
  - full `pnpm test`: EXIT 0 (434 files, 4,779 passed; `swap-test-final.log`);
  - `/design/library/doctrine/program` and `/doctrine/agent-guide`: 0 console errors and 0 exceptions
    (`console-final-*.log`), captured at 1440 and 375 with scrollWidth equal to clientWidth (`cap-*.png`).
- **Gates on the synced tree `d7f10487`**, each on its own exit code: design:rules 0 · collect-specimens 0 (no
  artifact change) · typecheck 0 · lint 0 (7 warnings, none in a file this lane touched) · test 0 (434 files, 4,781
  passed, 1 skipped) · build 0 · `lab:smoke --base http://localhost:3131` 0 ("503 checks, 0 failing"). Logs:
  `<scratch>/gate-*.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `usher/HEARTBEAT.md`, `usher/README.md`,
  `usher/kit/README.md`, `usher/kit/spawn-prompt.txt`, `usher/moltbook/README.md`, plus this manifest; no
  exceptions.
- **Words, before → after:** CLAUDE.md 1,857 → 1,369 (150 → 125 lines) · PROGRAM.md 3,013 → 1,345 ·
  spawn-prompt.txt 578 → 138 · kit/README.md 1,709 → 1,929 (it took in about 1,000 words of Orchestrator-only
  procedure from PROGRAM.md and CLAUDE.md, and no lane reads it) · HEARTBEAT.md 238 → 206 · moltbook/README.md 355 →
  275 · usher/README.md 195 → 107 · **total 7,945 → 5,369 (−32%)**.
- **Per reader at boot:** a spawned lane reads 1,795 words, down from 5,448 (CLAUDE.md, the spawn prompt and
  "Agent boot"; 2,852 for a board lane that reads all of PROGRAM.md). The Orchestrator reads 4,643, down from 6,579,
  if it reads everything; less when it looks up only the runbook section it needs.
- **Items:**
  - `CLAUDE.md` copy: the product, one line of Rising tides, the roles, a task-keyed "Where to look" map, the working
    loop, the gate and git, the security guardrails, the project traps, live testing, and docs health written as
    Will's rules.
  - `PROGRAM.md` copy: the roles, the round in four steps, Agent boot with Sync and Handoff, the hard gates, six
    principles, and "Starting a session" at the end.
  - `usher/kit/spawn-prompt.txt`: the manifest, the paths, the port, the scratch directory and the chat line;
    everything else is homed once in CLAUDE.md or PROGRAM.md.
  - `usher/kit/README.md`: sections by task, each standalone with no preamble: Seat in, Resume a lane, Run a round,
    Cut a lane, Integrate a handoff, Deploy to the alias, Milestone, Mutate config, Verify, The scripts.
  - `usher/HEARTBEAT.md`, `usher/moltbook/README.md`, `usher/README.md`: Will's terms stated once; the one-offs cut.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:** the nine under Questions.
- **Look at first:** the scratch `CLAUDE.md` top to bottom (what every session now carries); then the runbook's "Run
  a round" (Will's round rulings, moved from PROGRAM.md); then call 9 above.

### The cut table

Reasons: **one-off** · **history** · **repeat of X** · **enforced by Y** · **compressed** · **platform** (current
docs give it) · **Library** (production or the Library shows it) · **procedural** (the review or the lab catches it)
· **superseded** (Will's Library direction: the tests are the real rules) · **moved → X**.

| doc | the line or rule | reason |
| --- | --- | --- |
| CLAUDE.md | "the `@AGENTS.md` import is load-bearing: this is Next.js 16" | repeat of AGENTS.md (the import stays) |
| CLAUDE.md | "every QR exposes Partyreel to future hosts" | repeat of PRD.md |
| CLAUDE.md | "One domain carries the marketing site, the host app, the guest links and the admin portal" | repeat of architecture.md |
| CLAUDE.md | "work rides launch-prep in rounds, each a catalog in the lab, Will's verdicts, then the wiring" | repeat of PROGRAM.md "The round" |
| CLAUDE.md | the Orient table (question → doc) | compressed into "Where to look" (task → doc) |
| CLAUDE.md | "What guides design work? the Library (the bible, contracts, policies: working rules), levelled in docs/design/README.md" | superseded (the brand kit, the catalog, the ten) |
| CLAUDE.md | "Every doc states current rules, never history" | repeat of "Keeping the docs healthy" |
| CLAUDE.md | Sessions & roles: the branch-cut detail, "(lane, questions, handoff)" | compressed |
| CLAUDE.md | step 1 "Orient: STATUS, then the system doc" | replaced by "your manifest, then only what the task touches" (Will: targeted retrieval) |
| CLAUDE.md | step 2's library list (Next 16, Tailwind v4, zod v4, Supabase SSR) | platform (Context7, AGENTS.md) |
| CLAUDE.md | step 4 component paths (`src/components/lab`, `ui`, `shared`) | Library (the catalog) |
| CLAUDE.md | step 4 "the bible, contracts and policies followed by default…; everything else is precedent (bible 22)" | superseded |
| CLAUDE.md | step 4 "an exploration is a catalog…; a favourite lands in the Library as a working version" | repeat of PROGRAM.md "The round" 4 |
| CLAUDE.md | step 4 "every ask carries its context" | repeat of PROGRAM.md "A round returns DECISIONS" (Will's bar) |
| CLAUDE.md | step 4 "ask for the exact asset in your Handoff" | repeat of PROGRAM.md "Unlimited design resources" |
| CLAUDE.md | step 4 "Propose a creative delight (`/emil-design-eng`)" | Library (the bible's Premium is the floor) |
| CLAUDE.md | step 5 "the four-step gate; `get_advisors` after any DDL" | the gate is defined once; `get_advisors` moved → runbook (the Orchestrator applies DDL) |
| CLAUDE.md | step 6 "a lab-only round verifies light: the board at 1440 and 375" | repeat of PROGRAM.md hard gate 1 |
| CLAUDE.md | "execute boldly without re-litigating the plan" | compressed to "execute boldly" (no doc forbids revisiting a decision, Will) |
| CLAUDE.md | "The human is a targeted instrument…" | moved → "Local dev vs. live testing" |
| CLAUDE.md | `pnpm dev`/`build`/`lint`/`typecheck`/`test`; "`next lint` is gone in 16" | platform (package.json, Next 16 docs) |
| CLAUDE.md | "`pnpm design:rules` (regenerate … after a contract, policy, `for` line or touchpoints change)" | enforced by rules-registry.test.ts (its failure names the command); the machinery retires |
| CLAUDE.md | "Node `.nvmrc` (22.21.1); pnpm 9.14.4" | enforced by `.nvmrc` (`nvm use` in Agent boot); the pnpm pin is ci.yml's (follow-up 14) |
| CLAUDE.md | "Formatting is not in the gate" | compressed (the gate list shows it) |
| CLAUDE.md | the Stack line with versions | platform (package.json) |
| CLAUDE.md | MCP tooling: the Supabase project id, R2 account and bucket, Stripe account | repeat of STATUS "Infrastructure" |
| CLAUDE.md | MCP tooling: "MCP-created RPCs inherit an `anon` EXECUTE grant" | moved → Security guardrails (★) |
| CLAUDE.md | MCP tooling: Stripe "`livemode` first" | moved → Security guardrails |
| CLAUDE.md | MCP tooling: "no CLI, migrations land via `apply_migration`" | moved → Project traps |
| CLAUDE.md | MCP tooling: R2 "cannot mint tokens or set CORS" | platform (the tool says so) |
| CLAUDE.md | MCP tooling: Vercel "deploys and logs; never env vars or domains" | moved → runbook "Mutate config" |
| CLAUDE.md | MCP tooling: Mobbin, Resend, the pane and Chrome | platform (the tools are listed); Mobbin is design inspiration |
| CLAUDE.md | MCP tooling: shadcn "no `form` item in radix-nova; ours is hand-authored" | platform (the shadcn MCP shows it; `.prettierignore` guards `ui/`) |
| CLAUDE.md | "`lp/*` aliases are not [allow-listed], by design" | enforced by vercel.json (`lp/*` never deploys) |
| CLAUDE.md | the pointer to testing-verification.md in the live-testing paragraph | repeat of the map |
| CLAUDE.md | the Vercel REST endpoints and "★ a value decrypts ONE at a time" | platform (Vercel's API docs) |
| CLAUDE.md | `$VERCEL_TOKEN` (P3 team; no CLI); deploy auth (`gh`, `wrangler whoami`) | moved → runbook "Mutate config" |
| CLAUDE.md | Next.js 16 gotchas (async `params`, `cookies()`/`headers()`, `proxy.ts` on Node) | platform (AGENTS.md, Next 16 docs) |
| CLAUDE.md | "`@supabase/ssr` with `getAll`/`setAll`" | platform |
| CLAUDE.md | "authorize with `getUser()`, never `getSession()`" in the gotchas | repeat of Security guardrails (merged there) |
| CLAUDE.md | "clients in `src/lib/supabase/{client,server,middleware,admin}.ts`" | moved → the single-sources line |
| CLAUDE.md | Tailwind v4 (CSS-first, `@theme` and theme.css, no config, the lab's design.css, standalone `translate`) | platform, Library (the tokens), enforced by css-source-policy.test.ts |
| CLAUDE.md | zod v4 (`z.url()`, `error.issues`) | platform |
| CLAUDE.md | Postgres "★ integer literals are int4" | platform; repeat of database-security.md |
| CLAUDE.md | "`shadcn` is a real build dependency; one `zod` via `pnpm.overrides`" | platform (package.json, globals.css) |
| CLAUDE.md | "`src/components/ui/*` is semicolon-free…; reformat neither" | enforced by `.prettierignore` (its comment says why) |
| CLAUDE.md | Copy: no em-dashes; "all copy is open (bible 21)"; "no mono face (bible 7)" | enforced by no-em-dash-policy, content-policy and two-faces-policy tests; the bible holds them |
| CLAUDE.md | Git: "(the protocol's depth in PROGRAM.md)" | compressed |
| CLAUDE.md | Git: "`[preview]` and `[ci]` are the Orchestrator's to add" | repeat of PROGRAM.md "Agent boot" 3 |
| CLAUDE.md | Git: "only the Orchestrator merges, applies migrations, deploys Workers and mutates config" | repeat of Sessions & roles |
| CLAUDE.md | Git: "`main` is frozen except milestone merges and true hotfixes" | moved → runbook "Milestone" |
| CLAUDE.md | Git: "tests green before a commit" | repeat of the gate line |
| CLAUDE.md | "read `types.ts` for table and column names before writing SQL" | procedural (the rolled-back check and the review catch it) |
| CLAUDE.md | "after any schema change, `get_advisors` and regenerate types (the accepted advisor set)" | moved → runbook "Integrate a handoff" |
| CLAUDE.md | "The design law is the bible plus each component's contract…; never pin copy or a look with a test" | superseded; "copy is open" is the bible's |
| CLAUDE.md | "a rule that blocks better work is a finding for your manifest, not a wall" | compressed into step 4 (reshape a test on purpose, keeping its scar) |
| CLAUDE.md | "Markdown is `.prettierignore`d" | enforced by `.prettierignore` |
| CLAUDE.md (added) | Will's 2026-09-24 rulings as rules: only what a strong model cannot find; every added line dilutes the rest; one-offs stay in git; the tests are the real rules; relitigating is welcome; only Will changes the bible | their repo home (they were in chat and memory only) |
| PROGRAM.md | header: "Every line is a current rule…; git holds how it was learned" | repeat of CLAUDE.md docs health |
| PROGRAM.md | header: "(the teardown is in ROADMAP's launch checkpoint)" | compressed (ROADMAP holds it) |
| PROGRAM.md | Roles: the pointer to CLAUDE.md; "nothing in the program depends on which [model]" | repeat of CLAUDE.md; the docs are model-agnostic by rule |
| PROGRAM.md | Roles: the record docs an Agent edits only when `owns` names one | enforced by `owns` and track-manifests.test.ts |
| PROGRAM.md | Roles: "a `docs/systems/` line is refined in place … listed so it is read by eye" | repeat of CLAUDE.md step 8 (Agent boot 6 points to it) |
| PROGRAM.md | Roles: "Worktree sessions have no out-of-repo memory by design" | nothing acts on it (explanation) |
| PROGRAM.md | Roles: Seat-in | moved → runbook "Seat in" |
| PROGRAM.md | Roles: A clean close | moved → runbook "Run a round" |
| PROGRAM.md | Round 1: "notes `redesign` on a Library entry" | moved → runbook "Run a round" |
| PROGRAM.md | Round 2: the options message ("never a report") | moved → runbook "Run a round" |
| PROGRAM.md | Round 2: a lane's questions with a recommended answer; one-way doors never guessed | moved → CLAUDE.md step 3 (one home) |
| PROGRAM.md | Round 3: what `lab:smoke` and `lab:demo` refuse | enforced by the scripts |
| PROGRAM.md | Round 4: "the Orchestrator creates the deployment by API" | moved → runbook "Deploy to the alias" |
| PROGRAM.md | Round 5: leverage order, `DESK_ORDER`, the review walk, the paste, `lab:review` | moved → runbook "Run a round" (Will's leverage ruling kept) |
| PROGRAM.md | Round 6: "its Library entry … a `new` badge, its preview, its variants and its contracts" | superseded |
| PROGRAM.md | Round 6: "A board past round 1 needs his notes on record (`registry.test.ts`)" | repeat of "Every round gets Will's notes" |
| PROGRAM.md | Round 6: "deepening an unreviewed board is the cheapest thing an agent can do" | history (registry.test.ts's comment carries it) |
| PROGRAM.md | Round 6: "Never force a board's options apart" | moved → "A round returns DECISIONS" |
| PROGRAM.md | Round 7: "The record is what is active…; git holds everything older" | repeat of CLAUDE.md docs health and runbook "Integrate" |
| PROGRAM.md | Round 7: retired boards; boards whose product is gone retire unreviewed | moved → runbook "Run a round" |
| PROGRAM.md | Round 7: "Stacked boards never overlap in what they ask" | moved → runbook (the cut check) and a DECISIONS bullet (the lane's half) |
| PROGRAM.md | Round 7: a ruling that reaches an open question is judged | moved → runbook "Run a round" (Will's decision outcomes) |
| PROGRAM.md | Agent boot 1: "(at most 36 characters)" | one-off (the `lp/*` alias label; `lp/*` no longer deploys) |
| PROGRAM.md | Agent boot 3: the `--show-current` and `merge-base --is-ancestor` confirmation | procedural (the lane check shows a wrong base) |
| PROGRAM.md | Agent boot 6: "then STATUS.md and the `docs/systems/` doc the goal touches" | replaced by "only what the task touches" (Will) |
| PROGRAM.md | the Handoff paragraph's item list | repeat of the manifest's Handoff template |
| PROGRAM.md | Integration: what the Orchestrator folds | moved → runbook "Integrate a handoff" |
| PROGRAM.md | The record's depth | repeat of CLAUDE.md docs health; enforced by record-depth-policy.test.ts |
| PROGRAM.md | Milestones | moved → runbook "Milestone" (with "on Will's yes" from orchestrator.md) |
| PROGRAM.md | "Each principle is a heading so the Library indexes it … a Binds strip can cite it" | superseded (the doctrine pages and Binds retire) |
| PROGRAM.md | the Rising tides principle | repeat of the bible and CLAUDE.md's one line |
| PROGRAM.md | "would this hold up next to the homepage?" | repeat of guidance.md (design guidance; follow-up 4) |
| PROGRAM.md | the `defineExploration` mechanics (derived sections, type error on a missing preview, `tile: "phone"`) | enforced by exploration.ts's types; readable in the code |
| PROGRAM.md | "What NOT to build" list | compressed into the bar paragraph (his quote kept) |
| PROGRAM.md | "The workflow rides rising tides too" | moved → runbook "Run a round" |
| PROGRAM.md | "The notes come through the desk, one line, transcribed by the Orchestrator" | moved → runbook "Run a round" |
| PROGRAM.md | "An exploration round is light: it ships no production byte, verifies its board at 1440 and 375…" | repeat of hard gate 1 |
| PROGRAM.md | Model delegation | moved → runbook "Cut a lane" and "Integrate a handoff" (Will's words kept) |
| PROGRAM.md | "Which model orchestrates is Will's choice per session" | nothing acts on it (orchestrator.md holds the seat) |
| PROGRAM.md | "every commit's trailer names the model actually running" | moved → CLAUDE.md "The gate and git" |
| PROGRAM.md | "The Library holds working guidelines… hardens … on Will's word" | superseded |
| PROGRAM.md | "Most of the laws … were written by agents against a design system that has since moved" | history |
| PROGRAM.md | "good rule or bad system: keep the real scar, reshape the expired reason, say which" | moved → CLAUDE.md step 4 |
| PROGRAM.md | "A ★ marks a silent breakage if reverted, never a design preference" | repeat of docs/design/README.md (the landmine level) |
| PROGRAM.md | "The bible changes only by Will's ruling; the Orchestrator lands everything else" | moved → CLAUDE.md's Rising tides line |
| PROGRAM.md | the dates on Will's quotes | history |
| PROGRAM.md | Init templates | moved to the end ("Starting a session"); the Orchestrator's now seats in per the runbook |
| spawn-prompt | "read, then build, then hand off"; "Will's words for your task included" | compressed |
| spawn-prompt | the boot commands (`worktree add`, `nvm use`, install, `.env.local`, `push -u`) | repeat of PROGRAM.md "Agent boot" (the spawn's own paths kept) |
| spawn-prompt | "then `docs/STATUS.md`, your board's ledger in `docs/reviews/`…, and the `docs/systems/` doc" | replaced by the manifest and what it and the task name (Will) |
| spawn-prompt | "CLAUDE.md's working loop (Context7 doc-check first: Next 16, Tailwind v4, zod v4, Supabase SSR)" | repeat of CLAUDE.md (loaded in every session) |
| spawn-prompt | "If your manifest names a review sheet, open your board's section first" | procedural (the manifest names it when it matters) |
| spawn-prompt | the gate list and "a warning in a file you touched is yours" | moved → CLAUDE.md "The gate and git" |
| spawn-prompt | "kill it by port before a build, a test run and the handoff" | repeat of PROGRAM.md "Agent boot" 5 |
| spawn-prompt | "`DESIGN_PREVIEW_KEY` is a light guard…; a local `next dev` accepts any key" | moved → CLAUDE.md "Local dev vs. live testing" |
| spawn-prompt | "edit only the paths under your manifest's `owns` … a single line in another lane's file, listed with why" | moved → PROGRAM.md "Agent boot" 6 |
| spawn-prompt | "a record doc … only when your owns name it"; "never `src/lib/db/types.ts`" | enforced by `owns` and track-manifests.test.ts |
| spawn-prompt | "a new board registers its own lines … never at the head of a list" | moved → PROGRAM.md "A round returns DECISIONS" |
| spawn-prompt | "never a password or OTP; disposable test data only" | repeat of CLAUDE.md |
| spawn-prompt | staging, `--no-verify`, force-push, amend, the trailer, "commit only to `lp/{track}`" | repeat of CLAUDE.md "The gate and git" |
| spawn-prompt | "push freely (no CI or Vercel runs on a lane push)" | repeat of PROGRAM.md "Agent boot" 3 |
| spawn-prompt | "A lane never deletes, renames or breaks the props of a module the lab imports" | enforced by the typecheck (the lab is typechecked) and the lane check |
| spawn-prompt | "Sync (merge, never rebase)…" | repeat of PROGRAM.md "Sync" |
| spawn-prompt | "Clarify nothing … take the recommended answer…; stop only for a one-way door" | repeat of CLAUDE.md step 3 (a pointer stays) |
| spawn-prompt | the Handoff paragraph (the items, "the head is in your chat line") | repeat of PROGRAM.md "Handoff" and the manifest's template |
| kit/README | header: "Every line is a current rule; git holds how each was learned" | compressed (no preamble, Will); repeat of CLAUDE.md docs health |
| kit/README | "The counting rule" | moved → CLAUDE.md docs health (Will's lean-rules ruling); `negative.sh` stays in the index |
| kit/README | the `lsof` command | platform |
| kit/README | "Plan mode pauses every running lane" (its own step) | compressed into "Resume a lane" |
| kit/README | the spec field list | repeat of cut-lane.py's docstring |
| kit/README | "`owns` … disjoint from every live lane and from the Orchestrator's claims" | enforced by track-manifests.test.ts |
| kit/README | MERGE RED's per-side `git show` recipe | compressed (`hand-merge.sh` repairs the usual case) |
| kit/README | "★ READY is not the alias … grep the bare sha7" | enforced by alias-ensure.mjs (exit 0 only when the alias serves the sha) |
| kit/README | "★ The deployment cap" | compressed (kept: a plan limit that fails silently) |
| kit/README | Verify: the lab-key paragraph | moved → CLAUDE.md |
| kit/README | "the scratchpad's `alias-capture.mjs` pattern: viewport captures, never clipped ones" | one-off (a session scratch file) |
| kit/README | "`resize_window` preset `mobile` is a real 375; Will's Chrome keeps its inner width" | platform (the tool says so) |
| kit/README | Verify: sign-in through the chooser; never a password | repeat of CLAUDE.md |
| kit/README | "One script per merge, `set -e`…; never a record chained behind an integration" | compressed into Integrate 4 and 6 |
| kit/README | "A manifest never reads another lane's manifest" | moved → Cut a lane 1 |
| kit/README | "Integrated means the manifest is gone from HEAD…" | moved → Seat in 3 |
| kit/README | "A lane's scratch files live under `$S/<track>/`" | repeat of the spawn prompt |
| kit/README | "a script's debugging port is random, never fixed" | one-off |
| kit/README | "A new board registers after the neighbour its brief names" | repeat of PROGRAM.md and Integrate 6 |
| kit/README | "A board retires in ONE commit … (`SandboxId` … breaks the typecheck)" | compressed into Run a round; enforced by the typecheck |
| kit/README | "A `git add` naming a path already removed aborts the whole add…" | one-off |
| kit/README | "(his rule, 2026-09-24)" | history (the date) |
| kit/README | "(36 GB: a dev server holds 3 to 9 GB, a build is the spike)" | history (a measurement); "six lanes" kept |
| kit/README | the `merge-lane.sh` and `gate-lane.sh` index entries | compressed under `integrate.sh` |
| HEARTBEAT | "A routing table, kept tiny." | compressed |
| HEARTBEAT | item 4 "A wait has a wake condition and a threshold" | repeat of the timed-wake paragraph (merged) |
| HEARTBEAT | "(the pickup: in flight, next, waiting on Will)" | repeat of orchestrator.md's header |
| moltbook | "never a word as him; never spend; never register an account" | repeat of HEARTBEAT "Never" |
| moltbook | "One post per 2.5 minutes" | platform (Moltbook's rate limit refuses) |
| moltbook | the wording-to-operation list (total, times, left…) | enforced by moltbook.mjs (`CHALLENGE_HINT`) |
| moltbook | "Read the whole write output…, never a grep of the challenge line" | one-off |
| moltbook | "verify one challenge per shell command … (zsh does not split an unquoted variable…)" | one-off (no shell hook, Will) |
| moltbook | "`hint "<text>"` prints it for any text" | repeat of the client's usage line |
| usher/README | the name's gloss ("an usher seats the guests…") | repeat of identity/ |
| usher/README | "Everything under `docs/` and `src/` stays exactly as strict as the program makes it" | compressed (nothing acts on it) |
| usher/README | "a lesson becomes a rule where it applies…; the story … stays in git" | repeat of CLAUDE.md docs health |
| usher/README | "Whichever model Will seats as the Orchestrator works from the same files" | repeat of orchestrator.md |

### Where each moved rule now lives

| rule | was | now |
| --- | --- | --- |
| the gate, every step | CLAUDE.md commands; the spawn prompt | CLAUDE.md "The gate and git" |
| a lane's questions with recommended answers; one-way doors | PROGRAM.md round 2; the spawn prompt | CLAUDE.md step 3 |
| reshaping a rule: keep the scar, say which | PROGRAM.md "Rules are provisional" | CLAUDE.md step 4 |
| only Will changes the bible | PROGRAM.md; docs/design/README.md | CLAUDE.md's Rising tides line |
| the lab key is a light guard; local `next dev` takes any key | runbook Verify; the spawn prompt | CLAUDE.md "Local dev vs. live testing" |
| Will as a targeted instrument | CLAUDE.md after the loop | CLAUDE.md "Local dev vs. live testing" |
| the MCP `anon` EXECUTE grant; the Stripe `livemode` check; `getUser` | CLAUDE.md MCP tooling and gotchas | CLAUDE.md "Security guardrails" |
| no Supabase CLI; `types.ts` generated; the Supabase clients | CLAUDE.md MCP tooling, Git, gotchas | CLAUDE.md "Project traps" |
| the service ids | CLAUDE.md MCP tooling; STATUS | STATUS "Infrastructure" |
| one-offs stay in git; a refusal encodes a shape | runbook counting rule; memory | CLAUDE.md "Keeping the docs healthy" |
| the trailer names the running model | PROGRAM.md Model delegation; CLAUDE.md | CLAUDE.md "The gate and git" |
| edit only `owns`; the one-line exception | the spawn prompt | PROGRAM.md "Agent boot" 6 |
| kill the dev server before a build, a test run, the handoff | the spawn prompt; PROGRAM.md | PROGRAM.md "Agent boot" 5 |
| push freely; `[preview]` and `[ci]` are the Orchestrator's | CLAUDE.md Git; PROGRAM.md; the spawn prompt | PROGRAM.md "Agent boot" 3 |
| a new board registers after its named neighbour | the spawn prompt; runbook | PROGRAM.md "A round returns DECISIONS" |
| never force options apart; ask nothing another board asks | PROGRAM.md round 6 and 7 | PROGRAM.md "A round returns DECISIONS" |
| before launch there are no real users | PROGRAM.md "Rules are provisional" | PROGRAM.md, its own principle |
| fast iterative rounds | PROGRAM.md "Prototype first" | PROGRAM.md "Fast, focused rounds" |
| seat-in | PROGRAM.md Roles; runbook Session start | runbook "Seat in" |
| see every agent's vision through | runbook Session start | runbook "Resume a lane" |
| the Orchestrator's round: options message, desk by leverage, the sitting and `lab:review`, decision outcomes, repeats merged, retiring boards, the lab-workflow ask, the clean close | PROGRAM.md The round, principles, Roles; runbook learned-once | runbook "Run a round" |
| model delegation: model per spawn, lab briefs light on rules, six lanes, Handoffs not diffs | PROGRAM.md Model delegation | runbook "Cut a lane", "Integrate a handoff" |
| integration: lane check, merge, record, prune after the final line | PROGRAM.md Integration; runbook | runbook "Integrate a handoff" |
| migrations: the lane writes, you apply, additive-only, destructive on Will's yes, `get_advisors`, types | PROGRAM.md; CLAUDE.md; orchestrator.md | runbook "Integrate a handoff" |
| milestones on Will's yes; `main` frozen; hotfix | PROGRAM.md; CLAUDE.md Git; orchestrator.md | runbook "Milestone" |
| Vercel env over REST; `wrangler whoami`; `gh` | CLAUDE.md Secrets and MCP; PROGRAM.md | runbook "Mutate config" |
| Will's terms (spend, act or speak as him, credentials, accounts) | HEARTBEAT; moltbook; usher/README | HEARTBEAT "Never" (usher/README keeps "nothing destructive" for the folder) |

### Follow-up candidates outside this lane (one line each)

1. `usher/kit/cut-lane.py`: its Binds block tells lanes that the policies and contracts bind and repeats CLAUDE.md's
   record-doc, staging and trailer rules; `PROD_VERIFY` lists `design:rules` and the specimen collector. Make Binds
   "CLAUDE.md's working loop" and point Verify at CLAUDE.md's gate.
2. `docs/tracks/README.md`: "Spawning a lane from its manifest" repeats PROGRAM.md's Agent init in an older version
   that says contracts bind (delete it and point at "Starting a session"). The template's Binds line has the same
   problem as cut-lane.py. "Previews and CI" repeats the runbook, and "Who edits what" restates `owns`.
3. `docs/design/README.md`: the levels (law, contract, policy, program, guidance, precedent, proposal, ruling,
   landmine) and "What binds you" retire with the rules machinery; "only Will changes the bible" now lives in
   CLAUDE.md.
4. `docs/design/guidance.md`: design guidance that exists only in an internal doc (the craft stack, "would this hold
   up next to the home page?", "proactively propose creative DELIGHT") moves into the Library (the brand kit, or the
   bible's Premium is the floor) or goes.
5. `docs/systems/admin-observability.md`, "What binds the admin's design (Will, 2026-09-18 and 2026-09-20)": the
   admin's design rules exist only here. Move them into the Library or cut them; the dates in the heading are
   history.
6. `docs/systems/design-system.md` (about 30%): the type ladder, rounding and elevation tables restate the
   `theme.css`/`globals.css` values the Library shows. Cut them and keep the ★ landmines.
7. `docs/systems/marketing-content.md` (about 12%): the page-arc walkthroughs can be read off the sections; cut them.
8. `docs/systems/database-security.md`: "Postgres integer literals are int4" is platform knowledge; cut it.
9. `docs/systems/testing-verification.md` "Dev-server CSS (localhost only)": keep the project-specific ★ (worktrees
   on one port serve each other's CSS) and trim the Turbopack mechanics.
10. `docs/systems/durability-backups.md` and `trust-safety-forensics.md`: drop the status words and dated incident
    quotes in their headings (history).
11. `docs/ROADMAP.md`: the dated result recaps ("TEST verified 2026-09-23 on partyreel.com…") are history. The
    teardown line's "revert CLAUDE.md's git section" still resolves ("The gate and git").
12. `docs/STATUS.md`: "Infrastructure" is now the only home of the service ids (call 3). "The desk" line's "(a light
    guard, not a secret; the value is in `.env.local`)" repeats CLAUDE.md.
13. `docs/tracks/orchestrator.md`, "Will's standing approvals": the milestone and destructive-migration yes now live
    in the runbook; only the push approval stays there.
14. `.github/workflows/ci.yml` ("must track CLAUDE.md's pin") and the root `README.md` ("see CLAUDE.md" for
    prettier; "Pinned versions and the per-library gotchas … live in CLAUDE.md"): CLAUDE.md no longer pins pnpm or
    lists library gotchas. Let ci.yml own the pin (or add `packageManager` to package.json) and trim README's
    pointers.
15. Code comments that point at CLAUDE.md or PROGRAM.md text that is gone (two were already stale):
    - `src/lib/no-em-dash-policy.test.ts` ('CLAUDE.md "Working conventions"', already stale);
    - `src/components/marketing/chrome/header-shell.tsx` ("the v4 landmine, CLAUDE.md");
    - `src/lib/content/help-description-numbers.test.ts` ("CLAUDE.md: never pin copy");
    - `src/components/marketing/mdx/spec-shared.tsx` ("never hard-code a cap; CLAUDE.md");
    - `src/components/marketing/mock-parity.test.ts` ("CLAUDE.md's copy laws");
    - `src/app/globals.css` ("CLAUDE.md: long-form inherits the one design system");
    - `scripts/prune-vercel-deployments.mjs` ("the per-track integration checklist in docs/PROGRAM.md", already
      stale; it is the runbook's now);
    - `scripts/vercel-ignore-build.mjs` and `src/lib/track-manifests.test.ts` ('CLAUDE.md "Git"', now "The gate and
      git").
16. `usher/kit/integrate.sh` (not this lane's file): its default `S` is an old session's scratchpad (`924675e3…`).
    Make it require `$S`; the runbook's "Seat in" now exports it.
