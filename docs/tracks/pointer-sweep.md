---
track: pointer-sweep
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6fd4bbbd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/account/layout.tsx
  - src/app/(app)/account/page.tsx
  - src/app/(app)/dashboard/claims-actions.ts
  - src/app/(app)/name-gate.test.ts
  - src/app/(app)/name-gate.ts
  - src/app/(dev)/design/(shell)/_shell/ref.tsx
  - src/app/(dev)/design/(shell)/lab/tracks/page.tsx
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/rules/influences.ts
  - src/app/(dev)/design/sandbox/admin-triage/spec.ts
  - src/app/(dev)/design/sandbox/contact-page/spec.ts
  - src/app/(dev)/design/sandbox/emails/spec.ts
  - src/app/(dev)/design/sandbox/export-flow/spec.ts
  - src/app/(dev)/design/sandbox/guest-capture/parts.tsx
  - src/app/(dev)/design/sandbox/guest-capture/spec.ts
  - src/app/(dev)/design/sandbox/help-center/spec.ts
  - src/app/(dev)/design/sandbox/host-curation/spec.ts
  - src/app/(dev)/design/sandbox/identity-claims/fixtures.ts
  - src/app/(dev)/design/sandbox/identity-claims/spec.ts
  - src/app/(dev)/design/sandbox/identity-door/scene.tsx
  - src/app/(dev)/design/sandbox/identity-door/spec.ts
  - src/app/(dev)/design/sandbox/identity-profile/spec.ts
  - src/app/(dev)/design/sandbox/media-viewer/spec.ts
  - src/app/(dev)/design/sandbox/overtaken.test.ts
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/app/(dev)/design/sandbox/press-page/spec.ts
  - src/app/(dev)/design/sandbox/privacy-hero/concepts.ts
  - src/app/(dev)/design/sandbox/privacy-hero/spec.ts
  - src/app/(dev)/design/sandbox/profile-page/fixtures.ts
  - src/app/(dev)/design/sandbox/profile-page/spec.ts
  - src/app/(dev)/design/sandbox/reel-cut/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
  - src/app/(dev)/design/sandbox/reel-host/spec.ts
  - src/app/(dev)/design/sandbox/reel-screen/spec.ts
  - src/app/(dev)/design/sandbox/reel-story/spec.ts
  - src/app/(dev)/design/sandbox/reel-view/spec.ts
  - src/app/(dev)/design/sandbox/site-chrome/foot.tsx
  - src/app/(dev)/design/sandbox/site-chrome/spec.ts
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(marketing)/(cinema)/how-it-works/page.tsx
  - src/app/api/guests/email/route.ts
  - src/components/app/dashboard/claims-card.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-header.test.tsx
  - src/components/lab/board-spec.ts
  - src/components/lab/carried-calls.tsx
  - src/components/marketing/chrome/footer-demo.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/home/full-quality.tsx
  - src/components/marketing/system/demo-cta-link.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/shared/backdrop/backdrop-engine.ts
  - src/components/shared/backdrop/photo-section.tsx
  - src/components/shared/failure-grammar.test.tsx
  - src/components/shared/trail/trail-engine.ts
  - src/components/ui/avatar.test.tsx
  - src/components/ui/avatar.tsx
  - src/lib/avatar/gradient.ts
  - src/lib/avatar/measure.ts
  - src/lib/avatar/seed.test.ts
  - src/lib/avatar/seed.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/constants/marketing-voice.ts
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/queries/claims.ts
  - src/lib/db/queries/guest-events-admin.ts
  - src/lib/demo.ts
  - src/lib/guest/entry-steps.ts
  - src/lib/surface/index.ts
  - src/lib/validation/event.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/pointer-sweep

**Goal.** Rewrite every code comment or display string that points at the retired history docs so it states the rule itself; behavior never changes.

## The brief

THE RESHAPE (Will, 2026-09-22). His words: "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight... It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'. Our Library and Lab should work the same way - the Library establishes all of our working rules (global and per component) for new agents to pull from, without giving them a backlog of history to distill anything. Doesn't matter what we've done before - agent tasks follow current rules and seek best solution at every point."

The rule for every line you keep: it states a current rule, fact, gotcha or task in the present tense, with at most a one-line why. Dates, "was", provenance ("from X (2026-09-19)"), narratives of what shipped when and stories of retired boards go: git holds them. Nothing true and still binding is lost: when unsure whether a fact still holds, check the code, and keep it if it does. The CHANGELOG is already retired (the merge commits carry what shipped); the rulings log `docs/design/rulings.md` retires in the `docs-rules` lane. Four lanes run at once on disjoint files: `docs-rules`, `systems-trim`, `roadmap-lean`, `pointer-sweep`.

YOUR PART: code that points at the retired history docs. Your owns are exactly the files that mention `rulings.md` or `CHANGELOG`, minus those the other lanes own.

1. In each file, every comment or string that points at `docs/design/rulings.md`, `rulings.md` or `docs/CHANGELOG.md`: rewrite it so it states the rule or fact itself; where the surrounding comment already states it, drop the pointer phrase. Same voice, same length or shorter, no em-dash. `git show 6fd4bbbd:docs/design/rulings.md` shows a ruling if a pointer's meaning is unclear.
2. In a board's `spec.ts` and `fixtures.ts`: context and lede strings keep their words minus the pointer phrase; never change a question, an option's id, label or meaning, a recommendation, a because, overrule or lands claim, or any string a test pins. In the lab kit (`src/components/lab/carried-calls.tsx`, `src/components/lab/board-spec.ts`) and the tracks page, the calls his to overrule now live in `docs/STATUS.md` (Waiting on Will) and the merge commit rather than a CHANGELOG: say that.
3. Behavior never changes: comments and display strings only.

HANDOFF EXTRAS: the count of pointers rewritten; any file left alone and why.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The full gate on the synced tree, each step on its own exit code (`pnpm design:rules`, the specimen collector, typecheck, lint, test, build, `pnpm lab:smoke --base http://localhost:3134`).

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Calls his to overrule, one line each
- Look at first: ...
