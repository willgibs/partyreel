---
track: account-moments-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6ccc5b4e"            # the launch-prep SHA the branch was cut from
board: account-moments
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/account-moments/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/profiles-social.md
  - docs/systems/auth-accounts.md
---

# lp/account-moments-r1

**Goal.** A new board, account-moments (desk 50): two moments in a person's own account, each made in text and built, now drawn as real contenders for Will's pick: Follow and Block staying quiet (I4), and a profile before a public page (I5). No production byte.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**The moments (the calls lab's round-15 lines, as built today):**
- **I4, Follow and Block staying quiet:** a landed follow, unfollow, block or unblock says nothing (no success toast), a row leaves its list at once with no undo, and a refused flip springs back with the server's words in one toast (`components/social/relation-toggle.tsx`, `follow-button.tsx`, `profile-actions-menu.tsx`; the Connections card on Account, `app/(app)/account/page.tsx`; the owner's sections on her public page, `app/(guest)/u/[slug]/owner-sections.tsx`). What a person sees and feels when she follows someone at the album, blocks someone from their page, or tidies her Connections, and whether quiet is the right voice for each.
- **I5, a profile before a public page:** an account with no public page keeps its uploads, likes and follows on its own page (`app/(app)/me/`) under a set-up invitation with no Not now (`components/social/profile-setup-wizard.tsx`, `handle-field.tsx`); the public page itself is `app/(guest)/u/[slug]/`. What her own page is before she has chosen to be public, how the invitation reads, and what it costs her to ignore it. The consent model in `docs/systems/profiles-social.md` is a one-way door (never drawn away): a page is public only by her choice.

**Drawn on production as it is now:** identity r5's house set is production's atoms (fields sunk as wells, keys flat, the chosen afloat, working keys that say what they do), so compose production's own components and their states, never redraw an atom; the brand is Afterglow (brand r2's take is Will's open ask: draw on production's tokens and say in the About where a take would change a frame). A question about how something looks or moves is drawn, never argued: each option is a real contender, previewed whole on the real surface at 1440 and 375 on the grounds the moment lives on, with its states (and its motion where the moment moves).

**These calls were made in text on 2026-10-04 and built that way;** each is now asked as a picture, its built answer drawn as one option (production's own), so Will's pick weighs it against real alternatives. Ask each in plain words; shape the asks yourself (`after` stages one behind another where an answer changes the next); merge two that would ask one decision.

**Open asks nearest yours** (ask nothing they ask): guest-moments r1's five asks (a guest's night: a first photo's glow, taking a shot back, others' photos landing, the reel opening; its follow moment at the album is the nearest), brand r2's `take`, event-header r6's `card` and `attention`. Check the desk with `node usher/kit/board-card.mjs --desk` once booted.

**Verify on.** The light gate (PROGRAM.md, "Speed over proof in exploration"): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board account-moments` at 1440 and 375, reduced motion honoured. Measure every tile before it ships: a preview shows what its words claim, read on screen.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/account-moments/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `account-moments`, its title, `surface`, `desk: 50` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
