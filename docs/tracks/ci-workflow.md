---
track: ci-workflow
status: open
cut: "efe8118"
preview: false
owns:
  - .github/workflows/ci.yml
reads:
  - package.json
  - .nvmrc
  - scripts/vercel-ignore-build.mjs
---
# lp/ci-workflow

**Goal.** The four-step gate (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`) runs on
GitHub Actions on every push to `launch-prep` and `lp/*` and on every pull request to `main`, on the
pinned toolchain (Node from `.nvmrc`, pnpm 9.14.4, `pnpm install --frozen-lockfile`), each step its own
step so a failure names itself, the pnpm store cached, superseded runs of the same ref cancelled. If
`pnpm build` needs environment values, use repository variables for the `NEXT_PUBLIC_*` ones and propose
the rest in Handoff; never write a secret into the workflow. This is the program's prerequisite for
wider fan-out: an agent's push turns red before the Orchestrator's integration window, not inside it.
Size S; merges alone the same day.

**Rulings in force.** none.

**Verify on.** The Actions tab: a green run on this branch's own push; a throwaway commit with a
deliberately failing test turns the run red (then a revert commit, both kept on the branch as the
proof); the run on `launch-prep` after integration.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/testing-verification.md`, "## The gate": one line, CI runs the same four steps on every
  push, and where to read a failed run.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff

- to be filled at handoff

## Record

- to be filled at integration
