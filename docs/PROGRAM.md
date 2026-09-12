# The Elevation Program — charter, roles, protocol

> ROLE: the active program's durable rulebook — what the program is, who does what, the round
> definitions, the hard gates, the milestone policy, and the multi-agent versioning protocol.
> BELONGS HERE: rules and definitions that outlive any one round. · NOT HERE: where we are right now
> (→ [`STATUS.md`](STATUS.md)), the branch-protocol summary every session gets (→ [`../CLAUDE.md`](../CLAUDE.md)
> "Git" + "Sessions & roles" — CLAUDE.md is canonical for the rules themselves; this doc adds the
> operating depth), round CONTENT (→ the [`ROADMAP.md`](ROADMAP.md) buckets), history (→ [`CHANGELOG.md`](CHANGELOG.md)).
> LIFECYCLE: this doc dies at program end — the teardown checklist is in ROADMAP's Launch checkpoint
> ("Elevation-program teardown" + "Revisit the git workflow").

**The program (started 2026-07-02):** take all four surfaces (App / Marketing / Admin / the `/design`
lab) to magic-grade on the `launch-prep` integration branch, in focused rounds, before a later,
separate launch round. It supersedes the old one-off-task mode as the main thread.

## Roles: Orchestrator and Agent

Every top-level session is an **Agent** unless Will's first prompt designates it **the Orchestrator**.
The rules live in [`CLAUDE.md`](../CLAUDE.md) "Sessions & roles"; the operating depth:

- **Max ONE Orchestrator at a time**, seated in the repo root on `launch-prep`. It alone merges into
  `launch-prep`, applies DB migrations, deploys Workers, mutates Vercel/Stripe/Supabase config, and
  runs milestone merges. It closes every round **succession-ready** (checklist below).
- **Agents** work in worktrees on their own `lp/<track>`, **self-created at boot** (the Agent boot
  sequence below — Will never pre-creates branches). An Agent needs NO live Orchestrator: it
  prepares the handoff in its manifest `docs/tracks/<track>.md` (the Handoff and Record sections:
  what it built, the gate results on the synced tree, the lane check, the branch preview URL
  `partyreel-git-lp-<track>-partyreel.vercel.app`, any proposed migrations/config changes), sets
  `status: handed-off`, pushes, and stops; the chat report is one line. Worktree sessions have no out-of-repo memory by
  design — the repo is their whole context.
- **Every track has a manifest** at `docs/tracks/<track>.md` (contract + template:
  [`tracks/README.md`](tracks/README.md)): its claimed path PREFIXES, what it reads, the rulings it
  works under, its handoff and its record. The Orchestrator stubs it at spawn or the Agent creates it
  at boot, committed ALONE and pushed before any other work; `src/lib/track-manifests.test.ts`
  refuses two live tracks whose claims overlap. Agents never edit CHANGELOG, STATUS, ROADMAP, this
  file or CLAUDE.md: a track's record and its ROADMAP one-liners live in the manifest and the
  Orchestrator folds them at integration; a `docs/systems/*.md` line may be refined in place only
  for a fact inside the track's owned paths, and every such edit is listed in the manifest so it is
  read by eye at the merge (a clean doc merge reconciles text, not facts).
- **Orchestrator seat-in (a fresh Orchestrator session):** read [`STATUS.md`](STATUS.md) then this
  doc; read `docs/tracks/` (a `handed-off` manifest is the signal) and sweep
  `git branch -r --list 'lp/*'` for branches without one; confirm the preview deploy
  state at the `launch-prep` tip; review Will's open decision queue in STATUS. Everything needed to
  seat lives in the repo.
- **Succession-ready round close (the Orchestrator's exit checklist):** the record step is done
  (system docs refined in place, CHANGELOG entry, ROADMAP pruned); STATUS is current (round table,
  live state, decision queue); every track branch is integrated or `handed-off` in its manifest; `git worktree list` shows only the root and open tracks and
  `origin/lp/*` only open or handed-off ones (merged worktrees removed, merged remotes deleted);
  gates are green at the `launch-prep` tip and, when the round ended in a walk, its `[preview]`
  push is READY there (the integration preview is built on request since 2026-09-11); Vercel is
  pruned (`node scripts/prune-vercel-deployments.mjs`); nothing a successor needs lives only in
  the closing session.

### Init templates (Will copies one as the first prompt of a new session)

Will only manages agents, never branches: state the goal and the Agent creates + owns its branch
via the boot sequence below. Worktree toggle ON is preferred (one click); the sequence also handles
a session opened in the repo root.

**Agent:**

> You are an AGENT on Partyreel's elevation program. Track `<track>`. Goal: `<goal>`.
> Rulings in force: `<rulings | none>`. You own: `<owned path prefixes>`. Also never touch:
> `<extra forbidden paths | none>`. Verify on: `<pages/flows>`.
> Boot per `docs/PROGRAM.md` "Agent boot" (your manifest `docs/tracks/<track>.md` is the last boot step, before any other work),
> build, then hand off by filling the manifest's Handoff + Record sections, setting
> `status: handed-off`, and pushing. The chat report is one line: "handed off at <sha>".

(With a committed stub the prompt shrinks to one line, in [`tracks/README.md`](tracks/README.md)
"Spawning a track from a stub": the manifest is the init. A bare goal works too — CLAUDE.md "Sessions &
roles" routes any undesignated session here — but the one-liner makes it deterministic. To RESUME an existing handoff branch instead of cutting a fresh
one, say so: "resume `lp/<track>`".)

**Orchestrator** (repo root, no worktree):

> You are THE ORCHESTRATOR for Partyreel's elevation program (single-writer integration role).
> Seat in per `docs/PROGRAM.md` "Orchestrator seat-in", then take up the goal: `<goal>`.

### Agent boot (the self-branching sequence — run before ANY work)

1. `git fetch origin`, then derive a short kebab `<track>` from the goal (e.g. `help-content`),
   keeping it ≤ 36 chars (past that the preview-alias label truncates).
   If `origin/lp/<track>` already exists, that's someone's handoff — pick a fresh variant name;
   never adopt an existing branch unless Will's prompt said to resume it. If
   `docs/tracks/<track>.md` exists on `origin/launch-prep`, adopt it only if your init named that
   track (it is your stub); a stub with your derived name but not your goal is someone else's.
2. **In a worktree** (the normal case — `git rev-parse --git-dir` contains `/worktrees/`): note your
   birth branch (`git branch --show-current`; the app's toggle auto-creates one, often cut from
   `main`), then `git checkout -b lp/<track> origin/launch-prep`. Delete the auto-created birth
   branch with `git branch -d <birth>` (safe: `-d` refuses if it holds unique commits — leave it
   then and say so in your report). This is what keeps `worktree-agent-*` ref debris from
   accumulating again.
3. **In the primary checkout** (no `/worktrees/` in the git-dir — this is the Orchestrator's working
   tree): do NOT branch, commit, or edit here. Create your own worktree and do ALL work inside it:
   `git worktree add ../partyreel-wt/<track> -b lp/<track> origin/launch-prep`.
4. Confirm the invariant: `git branch --show-current` = `lp/<track>` AND
   `git merge-base --is-ancestor origin/launch-prep HEAD` succeeds.
5. A fresh worktree has NO `node_modules` and NO `.env.local` (gitignored): `nvm use` then
   `pnpm install --frozen-lockfile`, and copy `.env.local` from the primary checkout before the
   first gate or `pnpm dev` (the env-validating instrumentation hook fails the dev server without
   it). Then read `docs/STATUS.md` + the `docs/systems/` doc(s) the goal touches, and follow
   CLAUDE.md's working loop. First push: `git push -u origin lp/<track>`. Your review preview at
   `partyreel-git-lp-<track>-partyreel.vercel.app` builds only when your manifest says `preview: true`
   or `status: handed-off`, or a commit message carries `[preview]`; an open manifest with
   `preview: false` skips, so builds never queue behind work in progress on the one-at-a-time Hobby
   plan (proven both ways 2026-09-02). UI-review only — the allow-list-gated flows fail there by
   design, see CLAUDE.md "Local dev vs. live testing".
6. **Your manifest, before any other work** (the operating model, 2026-09-02). If the stub exists,
   fill its body; else copy the template from [`tracks/README.md`](tracks/README.md) and fill
   `owns` / `reads` from your init. Commit it alone (`docs(tracks): open <track>`) and push. Then
   run the peer sweep and, for anything you plan to create, the single-source lookup (both in the
   README); if a peer's claim overlaps yours, stop and say so rather than build. `pnpm test` must
   be green here: the manifest guard proves your lane is free.

### Sync (merge, never rebase, a pushed branch)

Sync `origin/launch-prep` exactly when: (1) never at boot (you were cut from its tip); (2) before
handoff, only if it moved (`git fetch --prune && git rev-list --count HEAD..origin/launch-prep`
greater than 0: `git merge origin/launch-prep`, re-run the gate, record the SHA in Handoff); (3)
mid-round only when `docs/tracks/orchestrator.md` on `origin/launch-prep` lists a landed change
touching one of your `reads` or the MDX registries. Syncing minutes after cutting merges your own
merge-base and gains nothing (it happened twice on 2026-09-01). Conflicts belong to the lane owner
while its session is alive.

### Handoff

Sync per above; fill the manifest's Handoff (head SHA, preview URL, the gates on the synced tree,
the lane check `git diff --name-only origin/launch-prep...HEAD` pasted with any exception explained,
proposed migrations/config changes) and Record (the CHANGELOG paragraph, past tense, at most 12
lines); set `status: handed-off` (and `preview: true` if Will should look); push; one line in chat.

## The hard gates (religious — no exceptions)

1. **Lab-validate before shipping creative magic**: prototype in the `/design` lab, Will reacts,
   then wire the ratified direction ([`systems/design-system.md`](systems/design-system.md)).
2. **One-way doors get an options-doc + recommendation, then WAIT for Will's ruling**, recorded as
   an ADR (the `decisions/t1-*` tombstones model the lifecycle).
3. **NO launch switches** (Stripe live, the real `/privacy`, secrets→Sensitive, `PRUNE_MODE=live`,
   the test-data reset): they accrete in ROADMAP's **Launch checkpoint** and never execute mid-program.

## Round definitions (status column lives in STATUS.md; content lives in ROADMAP buckets)

| Round | Definition |
| --- | --- |
| R0 | Bootstrap: `launch-prep` + the preview env + the EXIF/GPS-strip hotfix |
| R1 | Decision Studio → T1 Ruling Day (the seven one-way-door rulings) |
| R2 | Reel Engine (canvas + $0 on-device encode) + Foundation |
| QA insert | The adversarial QA hardening rounds (Q1-Q4 + the write spine; remainder = the ROADMAP QA bucket) |
| R3 (+R3.1) | Reel Experience: guest surfacing, reveal, Marquee, Studio-first + the Lambda teardown |
| Track B | The marketing identity build (voice, chapters, routes, help; = milestone M4) |
| R4 / R4b | Growth: Profiles P1 + Share Studio / Social P2+P3 (P4 feed stays post-program) |
| R5 | Notifications & lifecycle (owns the reel-published guest send) |
| R6 | App polish + the deferred ledger (arrival fine-tune, guest-gates pass, cross-gallery sort/filter, …) |
| R7 | Admin & operations (P8 `/admin/jobs`, audit log, `/admin/security`, failure drill) |
| R8 | Hardening & certification (WCAG-AA, perf vs [`perf/v1-baseline.md`](perf/v1-baseline.md), full red-team, the batched destructive migrations, launch checklist final) |

**Milestone policy:** `launch-prep` never holds more than ~2 rounds of unmerged work. A milestone =
a `--no-ff` true merge into `main` (never squash), tagged `milestone-<n>`, prod deployment confirmed
READY at the merge SHA, then a **post-merge production verification pass** on partyreel.com (the
things previews can't prove). Hotfix rule: fix on `main` → verify → back-merge to `launch-prep` the
same session. The steps, so no milestone is reverse-engineered from git again (2026-09-12):
1. The full gate on `launch-prep`, each step on its own exit code (`rm -rf .next/dev` first).
2. `git checkout main && git merge --no-ff launch-prep`: subject `milestone-<n>: prod = <the three to
   five things>`; body `launch-prep merged --no-ff: <the round>.` then the inventory, `Gate on the tree:
   <N> tests, <M> static pages; CI green on the tip.`, the preview walk in parentheses, and `prod is
   verified at this SHA (docs/CHANGELOG.md).`
3. An annotated tag, one line: `milestone-<n>: <the same things> (<the round>)`. Push `main`, then the
   tag. (`git tag -l` sorts lexically; read the last one with `--sort=v:refname`.)
4. Production READY at the merge SHA (the Vercel API), then the verification pass on partyreel.com,
   including whatever the round made newly risky on prod.
5. `git checkout launch-prep && git merge --ff-only main`, so the two agree again.
6. The record on `launch-prep`, pushed without `[preview]`: the CHANGELOG entry (`## <date> —
   MILESTONE-<n>: prod = …` with its two blocks, the walk before and prod at the SHA), STATUS's top
   round row, Live state and Updated date, and the orchestrator manifest's window.

## The multi-agent versioning protocol (the operating depth behind CLAUDE.md's Git rules)

- **Worktrees.** Will-initiated Agents ride the app's worktree toggle (lands at
  `.claude/worktrees/<name>`, often cut from `main` — the Agent boot sequence re-bases onto
  `origin/launch-prep` and cleans up the auto-birth branch; proven live 2026-08-27). The
  Orchestrator creates subagent-track worktrees explicitly:
  `git worktree add ../partyreel-wt/<track> -b lp/<track> launch-prep`.
- **Integration is single-writer, merge-based, and windowed.** Never rebase a pushed branch; every
  integration is `merge --no-ff` (the branch's own merges of `launch-prep` are merges too). Two
  integration windows per Orchestrator session (after seat-in, before close) plus on request; a
  window = fetch with prune, integrate every `handed-off` track OLDEST FIRST (a quick typecheck +
  test after each merge localises a break; the full four-step gate once on the final tree, each
  step on its own exit code), ONE push, one preview verify at the pushed SHA before any red-team.
  The Orchestrator's own cross-cutting change lands last in the window. Per track: read its manifest
  (must be `handed-off`) → lane check `git diff --name-only launch-prep...origin/lp/<track>` (every
  line inside `owns`, the manifest, or a listed system doc; anything else is handed back or ruled)
  → staleness `git rev-list --count origin/lp/<track>..launch-prep` (if the two name-only diffs
  intersect outside docs and the agent is alive, it syncs first) → `merge --no-ff` with the manifest
  flipped to `status: integrated` + `merged: "<sha>"` in the same commit → the doc-eye pass over
  every listed system-doc edit, fact against code → fold Record into CHANGELOG (dated, merge SHA)
  and Deferred into its ROADMAP buckets, STATUS's round table if it moved → prune: `git worktree
  remove`, `git branch -d lp/<track>`, `git push origin --delete lp/<track>`, then
  `node scripts/prune-vercel-deployments.mjs --apply` so the branch's deployments go with the
  branch (the Vercel cost round, 2026-09-11; dry-run first, it prints what it would delete). A change touching
  more than one open lane (a rename, a shared-component sweep, the radius round) is
  Orchestrator-only, announced in `docs/tracks/orchestrator.md` first, and lands after the affected
  tracks integrate or are told to sync. Contention hotspots, now fenced by the manifests: STATUS /
  CHANGELOG / ROADMAP / `src/lib/env.ts` / `src/components/marketing/mdx/spec-shared.tsx`.
- **DB migrations are global state** (ONE prod Supabase serves prod AND every preview, launch-prep
  and agent `lp/*` aliases alike — preview writes ARE prod writes). Agents write migration FILES only. The Orchestrator applies via the Supabase MCP
  one at a time (re-timestamped; diff-against-live before any `CREATE OR REPLACE`), then
  `get_advisors` + regenerate `types.ts` + commit file+types together. **Additive-only while any
  branch is unmerged**, and the change must stay compatible with `main`'s DEPLOYED code (a
  column-scope contraction broke prod for ~30min in July). Contractions follow
  expand→migrate→contract; destructive drops batch in R8.
- **Workers are global** (one deployed instance serves prod + preview): Orchestrator deploys at
  integration; must stay compatible with `main`'s callers. `wrangler whoami` first (CLAUDE.md).
- **Shared services:** one Supabase + R2 + Stripe TEST + Resend + Sentry behind prod and every
  preview (agent `lp/*` aliases included). Disposable test data only (the accounts + fixtures:
  [`systems/testing-verification.md`](systems/testing-verification.md)).

## Program principles

- **Rising tides** (Will, 2026-08-27): spread polish across surfaces; don't gold-plate two pages
  while others sit at wireframe. Every page still ends at the "would this hold up next to the
  homepage?" screenshot check.
- **Prototype-first for creative/UI magic** (the lab gate above) and **focused per-dimension rounds**
  over mega-plans.
- **Own fewer services / cost frugality:** no recurring SaaS pre-revenue; prefer free tiers and
  in-house (the canvas engine replacing Lambda is the archetype).
- **Model delegation:** the Orchestrator carries judgment/curation; volume work fans out to cheaper
  subagents.
- ★ **RULES ARE PROVISIONAL TOO, and auditing them is an Orchestrator duty** (Will, 2026-09-01).
  Will sets the big-picture goals, answers the follow-ups, and rules on UI. **Most of the laws,
  doctrines and don't-revert notes in this repo were written by AGENTS**, to keep themselves
  consistent, against a design system that has since moved. So every round, ask of the rules it
  touches: *"is this a good rule that prevents bad choices, or a bad system that prevents good
  choices?"* Keep the ones that encode a real scar, reshape the ones whose reason expired, and say
  which you did and why in the commit. Rising tides is not confined to working inside the current
  system: if a better system can be reshaped, reshape it. The failure this exists to stop is an
  agent treating an agent-authored constraint as a ruling and quietly narrowing the work to fit it.
  Related, and the same instinct one level down: the lab and production are **both** provisional and
  the arrow points both ways ([design-system.md](systems/design-system.md)).

## Settled — do not re-litigate (pointers, not restatements)

- The seven T1 rulings → [ADR-0019](adr/0019-social-privacy-host-controlled-guest-list.md) ·
  [ADR-0020](adr/0020-forensic-capture-csam-policy.md) · [ADR-0021](adr/0021-pricing-numbers-reel-caps-ingress.md) ·
  [ADR-0022](adr/0022-reel-guest-surfacing.md); QA product rulings → [ADR-0023](adr/0023-qa-round-product-rulings.md);
  Studio-first → [ADR-0024](adr/0024-studio-first-reel-composition.md).
- The reel's settled product decisions → [`specs/reel-v1.md`](specs/reel-v1.md) "Scope" + the style catalog.
- The guest read path, export chain, admin seam, and durability design passed adversarial review —
  don't re-open them without new evidence (their invariants live in their `systems/` docs).
- The monochrome identity + the emil craft bar → [`systems/design-system.md`](systems/design-system.md);
  the marketing IA + the byte-pinned voice thesis → [`systems/marketing-content.md`](systems/marketing-content.md)
  + `src/lib/constants/marketing-voice.ts`.
