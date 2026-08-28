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
  prepares the handoff (push `lp/<track>` + a report naming what it built, its gate results, its
  branch preview URL (`partyreel-git-lp-<track>-partyreel.vercel.app`), and any proposed
  migrations/config changes) and stops. Worktree sessions have no out-of-repo memory by
  design — the repo is their whole context.
- **Orchestrator seat-in (a fresh Orchestrator session):** read [`STATUS.md`](STATUS.md) then this
  doc; sweep `git branch -r --list 'lp/*'` for unintegrated handoffs; confirm the preview deploy
  state at the `launch-prep` tip; review Will's open decision queue in STATUS. Everything needed to
  seat lives in the repo.
- **Succession-ready round close (the Orchestrator's exit checklist):** the record step is done
  (system docs refined in place, CHANGELOG entry, ROADMAP pruned); STATUS is current (round table,
  live state, decision queue); every track branch is integrated or listed as a pending handoff;
  gates are green at the `launch-prep` tip and the preview deploy is READY there; nothing a
  successor needs lives only in the closing session.

### Init templates (Will copies one as the first prompt of a new session)

Will only manages agents, never branches: state the goal and the Agent creates + owns its branch
via the boot sequence below. Worktree toggle ON is preferred (one click); the sequence also handles
a session opened in the repo root.

**Agent:**

> You are an AGENT on Partyreel's elevation program. Goal: `<goal>`.
> Boot per `docs/PROGRAM.md` "Agent boot" (self-create your `lp/<track>` branch), then proceed;
> hand off by pushing + a final report (include your branch preview URL).

(A bare goal works too — CLAUDE.md "Sessions & roles" routes any undesignated session here — but the
one-liner makes it deterministic. To RESUME an existing handoff branch instead of cutting a fresh
one, say so: "resume `lp/<track>`".)

**Orchestrator** (repo root, no worktree):

> You are THE ORCHESTRATOR for Partyreel's elevation program (single-writer integration role).
> Seat in per `docs/PROGRAM.md` "Orchestrator seat-in", then take up the goal: `<goal>`.

### Agent boot (the self-branching sequence — run before ANY work)

1. `git fetch origin`, then derive a short kebab `<track>` from the goal (e.g. `help-content`),
   keeping it ≤ 36 chars (past that the preview-alias label truncates).
   If `origin/lp/<track>` already exists, that's someone's handoff — pick a fresh variant name;
   never adopt an existing branch unless Will's prompt said to resume it.
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
5. Read `docs/STATUS.md` + the `docs/systems/` doc(s) the goal touches, then follow CLAUDE.md's
   working loop. First push: `git push -u origin lp/<track>` — every push auto-deploys your review
   preview at `partyreel-git-lp-<track>-partyreel.vercel.app` (builds queue one-at-a-time on the
   Hobby plan; UI-review only — the allow-list-gated flows fail there by design, see CLAUDE.md
   "Local dev vs. live testing").

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
same session.

## The multi-agent versioning protocol (the operating depth behind CLAUDE.md's Git rules)

- **Worktrees.** Will-initiated Agents ride the app's worktree toggle (lands at
  `.claude/worktrees/<name>`, often cut from `main` — the Agent boot sequence re-bases onto
  `origin/launch-prep` and cleans up the auto-birth branch; proven live 2026-08-27). The
  Orchestrator creates subagent-track worktrees explicitly:
  `git worktree add ../partyreel-wt/<track> -b lp/<track> launch-prep`.
- **Integration is single-writer.** Track rebases onto `launch-prep` (the track's own agent resolves
  its conflicts) → `merge --ff-only` → the FULL gate re-runs on the MERGED tree (a green worktree can
  lie by omission) → one push per round → confirm the Vercel preview READY at the pushed SHA before
  any red-team. Contention hotspots (minimize subagent touches): STATUS / CHANGELOG / ROADMAP /
  `src/lib/env.ts`.
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
