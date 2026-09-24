---
track: library-lean
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "cd3532fb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/
  - src/app/(dev)/design/_data/
  - src/app/(dev)/design/design.css
  - src/app/(dev)/design/gallery/
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/reference/
  - src/app/(dev)/design/review/
  - src/app/(dev)/design/rules/
  - src/app/(dev)/design/sandbox/admin-triage/
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/contact-page/
  - src/app/(dev)/design/sandbox/emails/
  - src/app/(dev)/design/sandbox/event-safety/
  - src/app/(dev)/design/sandbox/export-flow/
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/home-hero/
  - src/app/(dev)/design/sandbox/host-curation/
  - src/app/(dev)/design/sandbox/host-storage/
  - src/app/(dev)/design/sandbox/identity-claims/
  - src/app/(dev)/design/sandbox/identity-door/
  - src/app/(dev)/design/sandbox/identity-profile/
  - src/app/(dev)/design/sandbox/loose-ends/
  - src/app/(dev)/design/sandbox/media-viewer/
  - src/app/(dev)/design/sandbox/press-page/
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/profile-page/
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-front/
  - src/app/(dev)/design/sandbox/reel-host/
  - src/app/(dev)/design/sandbox/reel-screen/
  - src/app/(dev)/design/sandbox/reel-story/
  - src/app/(dev)/design/sandbox/reel-view/
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/sandbox/voice-guest/
  - src/app/(dev)/design/theme-toggle.tsx
  - src/app/(dev)/design/touchpoints.test.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/components/lab/
  - scripts/build-design-rules.mjs
  - scripts/design-rules/
  - scripts/lab-review.mjs
  - docs/design/
  - usher/kit/
  - src/components/ui/
  - src/components/shared/
  - src/components/marketing/
  - src/components/app/
  - src/components/social/
  - src/components/admin/
  - src/components/auth/
  - src/components/dev/
  - src/components/reel/
  - src/app/(app)/
  - src/app/(marketing)/
  - src/app/two-faces-policy.test.ts
  - src/app/keyframe-uniqueness.test.ts
  - src/app/globals-theme-contract.test.ts
  - src/app/css-source-policy.test.ts
  - src/lib/dashboard/
  - src/lib/avatar/
  - src/lib/admin/
  - src/lib/shared/
  - src/lib/format/
  - src/lib/constants/
  - src/lib/auth/
  - src/lib/qr/
  - src/lib/observability/
  - src/lib/content/
  - src/lib/db/queries/claims.test.ts
  - src/lib/db/row-cap-policy.test.ts
  - src/lib/events/event-guests.test.ts
  - src/lib/events/host-fingerprint.test.ts
  - src/lib/type-ladder-policy.test.ts
  - src/lib/track-manifests.test.ts
  - src/lib/single-source-policy.test.ts
  - src/lib/record-depth-policy.test.ts
  - src/lib/no-em-dash-policy.test.ts
  - src/lib/glass.test.ts
  - src/lib/elevation-policy.test.ts
  - src/lib/content-policy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - src/app/theme.css
  - src/app/globals.css
---

# lp/library-lean

**Goal.** The Library as three parts, catalog first (the brand kit, the catalog, the ten), opening on a short design recipe; the rules machinery retired; every test that only pins a look deleted and every function test kept.

## The brief

**Will's words (2026-09-24, verbatim):** "it's also insane that we have 9 dense pages of rules in the library, then ask agents to get creative." And: "imagine we set an agent off to redesign the blog page, a contact form, even an eyebrow. Does it really need almost 10 pages of dense docs, or could it take a brand kit, our 10 global guidelines, check in on production to see how things are now, maybe a visual pass for design, any real rules, then take a creative shot? Feel like it's hard for an agent to go design something new when we're telling it a million things it can't do." He also ruled that every test that only pins a look goes: the Library and production show the look, and the lab and his review hold it.

**The target: the Library is three things, catalog first.**
1. **The brand kit.** `/foundations` becomes it and leads the nav. It describes and never commands.
2. **The catalog.** Components, patterns, compositions and marketing, open by default. The home is the searchable index, and it opens on the design recipe below. An entry page keeps its specimens, config and variants, plus at most one line naming the test file that pins its behavior.
3. **The ten.** `/rules` shows the bible's ten and nothing else. The glossary stays as a quiet link.

**The design recipe** (the home's first band, about 100 words): the brand kit; the ten; production as it is now (open the live surface); a visual pass (capture the current surface at 1440 and 375); the real rules are the tests (run them, and a failure names what broke); then take a creative shot, in the lab.

**What goes:**
- **Pages:** `/policies`, `/guidance`, `/doctrine/*`, the rulings, "What binds you", the nine levels, the health strip (`influences.ts` and its components), and the contracts and landmines on entry pages.
- **Machinery:** `design:rules` and everything it feeds, `rules.generated.json` and `docs/design/library.md`. The catalog reads what it needs directly.
- **Tests of the machinery:** freshness, coverage, `for`-line coverage, influences, and the policy-path checks. The Library-facing parts of the lab and kit tests are trimmed to what remains.
- **Directives:** `@contract-for`, `@policy` and `@refuses` leave the test headers. The tests themselves stay.
- **Leftovers:** the unread `links: { bible }` field on boards, the 100 "nothing to look at" reasons, the rulings in `touchpoints.ts` if nothing else reads them, and the kit's regeneration steps (`hand-merge.sh`, `integrate.sh`, `gate-lane.sh`; `closer.py` only if the registries no longer need it).
- **Old routes:** each redirects to its nearest remaining page.
- **Guidance docs:** `docs/design/README.md` and `guidance.md` fold into the recipe or go.

**Look tests go; function tests stay.** Delete every test, or part of a test, that only pins a look:
- the source-reading glow, light and lit-edge pins;
- the type ladder, elevation and two-faces policies;
- button heights and avatar radius;
- the vendored border-beam check.

Keep every test that protects function: data, privacy, accessibility (a reduced-motion check is accessibility, whatever its filename), performance, security, CSS and build safety, content links, the lab boundary, and the no-em-dash rule. Judge each test by what it protects, not by its filename. Where the bible's `enforcedBy` names a deleted test, it becomes "review".

**Hand off with:**
- a table of every page, file and test removed, each with one reason;
- the test count before and after, by kind;
- the lines to change in `CLAUDE.md`, `docs/PROGRAM.md` and `package.json` (the `design:rules` script). Those are the Orchestrator's to apply.

**Prove the recipe:** after the Library is lean, spawn one fresh subagent with only the recipe and a small task (redesign an eyebrow on a scratch board, never committed). Report whether it had what it needed and what it asked for.

**Your owns, and why they are wide.** The directive strip reaches every test file that carries `@contract-for`, `@policy` or `@refuses`, so your owns cover each of them, except those of the held `reel-guest-wiring` lane (`src/components/guest/`, `src/app/(guest)/`, `src/lib/guest/`, `src/lib/reel/engine/player-live*`): leave its files exactly as they are, and that lane strips its own at its merge. Touch nothing in your owns beyond what this brief asks.

**The root files are the Orchestrator's.** `package.json` (the `design:rules` script), `.prettierignore` (the generated JSON's lines), `CLAUDE.md`, `docs/PROGRAM.md` and `docs/reviews/README.md` (its `review library:` line) cannot be lane-owned. Leave them untouched, and hand off each change as its exact old and new line. Once the generator is gone, your gate skips `pnpm design:rules`; everything else in the gate runs as usual.

**The integration order.** `package.json` keeps its `design:rules` line until the merge, so the kit's current merge script would call a script you deleted. Rewrite the kit scripts (`usher/kit/`) so that no step calls `design:rules`, and hand off the exact integration sequence the Orchestrator should run: the merge, the root lines, then the gate with your new `gate-lane.sh`.

**Also in your owns, found by the docs lane:**
- `usher/kit/cut-lane.py`: its Binds block says the policies and contracts bind and repeats CLAUDE.md's record-doc, staging and trailer rules, and `PROD_VERIFY` lists `design:rules` and the specimen collector. Make its Binds line match the template in `docs/tracks/README.md` (CLAUDE.md's working loop and the bible's ten; the tests are the real rules), and point Verify at CLAUDE.md's gate.
- `usher/kit/integrate.sh`: its default `S` is an old session's scratchpad; make it require `$S`.
- Comments that point at CLAUDE.md or PROGRAM.md text that no longer exists (CLAUDE.md was rewritten, so read the current file): `src/lib/no-em-dash-policy.test.ts`, `src/components/marketing/chrome/header-shell.tsx`, `src/lib/content/help-description-numbers.test.ts`, `src/components/marketing/mdx/spec-shared.tsx`, `src/components/marketing/mock-parity.test.ts`, `src/lib/track-manifests.test.ts`. Keep the reason in each comment and drop the pointer.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The Library at 1440 and 375: the brand kit leads the nav, the catalog is open, `/rules` shows the ten, and no rules section remains. Every entry page renders, `page-console` finds no console error on any Library route, and every retired route redirects. `pnpm test` is green, with a before-and-after count by kind. `lab:smoke` is green from the Library. A fresh subagent designs an eyebrow from the recipe alone and reports what it lacked.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
