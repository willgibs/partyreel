---
track: account-moments-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- The board's surface: `account` is not a surface (guest, host, marketing, shared, admin), so it stands on Shared,
  since these moments are a guest's and a host's alike. Recommended: Shared; overrule if Guest should own them.
- The Screen knob opens on 375 (a guest meets these on her phone, from the album); 1440 is one press away.
- A refused flip (springs back, the server's words in one toast) is drawn nowhere and listed as settled in the
  opening: no option changes it. Overrule if he wants refusal asked too.
- The wizard (`profile-setup-wizard.tsx`, `handle-field.tsx`) is not redrawn: I5's asks stop at the invitation that
  leads into it, so a pick changes /me and the card, never the setup's three screens.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Work commit `4520dad67`, pushed to `origin/lp/account-moments-r1`; no sync commit: launch-prep moved only by the
  record commit `8769437f5` (docs/STATUS.md, docs/tracks/orchestrator.md), none of my reads.
- Gates on `4520dad67` (the light gate), each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (no warning);
  the board's tests `pnpm vitest run src/app/(dev)/design/sandbox/registry.test.ts` 56/56; `pnpm lab:smoke --base
  http://localhost:3131` 7 checks, 0 failing (363 words of 1200); `pnpm lab:demo --board account-moments --base
  http://localhost:3131` 5 steps, 0 failing, every step draws its options at 1440 and 375 (stage moves 21.6% to 100%).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the ten files under
  `src/app/(dev)/design/sandbox/account-moments/` + this file; no exception.
- Measured on screen (Playwright over the dev server, reduced motion emulated): every tile at 375 and 1440, each
  caption read off its frame (`scene.tsx`'s `data-am-read`) matches its option's words; the one motion (an option's
  line arriving, `account-moments.css`) is off under reduced motion.
- The items, five asks, production's answer one option of each (`today`, or `block`'s today):
  - `follow`: what tells her a follow landed: the button turns (today) / a line under her name, once (rec.) / a toast.
  - `block`: Jordan's page once she blocks: Follow just goes (today) / a well that says it with Unblock, on every
    visit (rec.) / a toast with Undo. Its first frame is production's `BlockConfirm`, the same in every option.
  - `tidy`: a Connections row on unfollow or unblock: leaves at once (today) / stays turned back, one more press
    undoes it, gone on the next visit (rec.) / leaves with a toast's Undo.
  - `me-page`: /me before a public page: lists under the invitation (today) / her page, private, the public head
    marked Only you (rec.) / the public half drawn empty above her lists.
  - `invite` (after `me-page`, drawn on the page he picked): the standing card (today) / one quiet line, always there
    (rec.) / the card with Not now, which folds it to the line.
- Assets requested from Will: none (the marketing stills every board reuses).
- Board ideas:
  - The public page's meta row orphans its `·` at 375 when the handle is long (`@jordanpike ·` then `Joined …` on
    the next line, `u/[slug]/page.tsx`): the separator should travel with what follows it.
  - A relation's off face for Block is the destructive red button (`relation-toggle.tsx`); any surface that keeps an
    unblocked row (`tidy=stays`) wears a red Block in a calm list: a quieter off face for a list row is worth a look.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. A wiring note: `tidy=stays` needs the
  Connections card to keep the rows it rendered across the Server Function's revalidation (client-held rows), no SQL.
- Calls his to overrule: the four under Questions (Shared surface, 375 first, refusal settled, the wizard untouched).
- Look at first: `block` (a standing state rather than a success message is the boldest reading of his "a clear
  state and a way to stop it"), then `me-page` → `invite`.
- Test data left: none (no write reached a service; every act in a frame is inert).
