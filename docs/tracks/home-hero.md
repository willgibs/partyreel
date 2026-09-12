---
track: home-hero
status: open            # open -> handed-off -> integrated (deleted at the milestone that ships it)
cut: "260c015"       # the launch-prep SHA the branch was cut from (docs: record MILESTONE-24)
preview: true           # Will's review surface: every push builds partyreel-git-lp-home-hero
owns:
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/app/(dev)/design/sandbox/
  - src/app/(dev)/design/c/
  - src/app/(dev)/design/touchpoints.ts
reads:
  - src/components/marketing/system/page-hero.tsx
  - src/app/globals.css
  - src/app/(dev)/design/rules/bible.ts
  - src/lib/constants/marketing-voice.ts
---

# lp/home-hero

**Goal.** The full home hero redesign, as its own focus round (Will, 2026-09-01: "I'd love a full
home hero redesign"; 2026-09-11 and 2026-09-12: its own agent round, cut alongside `design-gallery`).
A design problem, not a lighting one: boards in the lab first (a `home-hero` ruling with a `board` in
`touchpoints.ts`, its variants under `sandbox/`, dispatched from `c/[touchpoint]/page.tsx`), Will's
rulings on the boards, then the wiring into `cinema-hero.tsx`. Take the big swing: a totally
different, better hero beats a safe increment, and the only law is the bible plus the hero's
contracts (`page-hero-contract.test.ts`, `marketing-h1-policy.test.ts`: the h1 on the ladder, never
gated, at paint).

**Rulings in force.** The bible on `/design/rules` (22 rules, Will's). The hero stays UNLIT until a
board rules otherwise (the wall is the ground, not a source). The thesis line and the primary CTA are
ruled copy (`marketing-voice.ts`); the two provisional home headers stay provisional. Boards leave the
sandbox when their ruling lands; the record goes to `docs/decisions/design-record.md`.

**Verify on.** partyreel-git-lp-home-hero-partyreel.vercel.app: the boards on `/design/c/home-hero?key=`,
then the home at 1440 and 375 with the h1 at opacity 1 at paint, reduced motion included.

**Lane exception, ruled.** `src/app/(dev)/design/rules/rules.generated.json` is generated: a push that
adds a specimen, a component file or a contract regenerates it with `pnpm design:rules` (the
freshness guard says so) and the lane check accepts the file.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-home-hero-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
