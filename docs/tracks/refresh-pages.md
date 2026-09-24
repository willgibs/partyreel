---
track: refresh-pages
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ce9c13df"            # the launch-prep SHA the branch was cut from
board: help-center
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/emails/
  - src/app/(dev)/design/sandbox/contact-page/
  - src/app/(dev)/design/sandbox/press-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-pages

**Goal.** The help center, the emails, the contact page and the press page. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `help-center` (7x3; range: real variety): "hub"/"feedback" picks lean on app-pricing/admin rulings, not help's own traffic. Worth trying: Re-judge "hub" against help's own needs, not others' rulings.
- `emails` (8: 3,4,3,3,2,3,3,3; range: mostly real): chained citations of app-door/app-vocabulary rulings; "code" ask binary. Worth trying: Give the mail button's wording a genuine third option.
- `contact-page` (6x3; range: real variety): receipt ask admits "a fourth option this board does not draw yet". Worth trying: Draw the fourth receipt option the board admits is missing.
- `press-page` (7x3; range: real variety): brand-guidelines content "cut... by the 2026-08-28 ruling and not reopened here". Worth trying: Reconsider whether brand-guidelines deserves a fresh look now.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `help-center`, `emails`, `contact-page`, `press-page`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- Lab kit: `DialogTitle`/`DialogDescription` (radix) throw with no `Dialog.Root` above them, not just styled divs; a board quoting the Dialog family (this lane's `contact-page/receipt.tsx`, its `modal` receipt option) has to rebuild the header/title/description/footer as plain elements carrying the same classNames. `profile-page`'s landmine comment names only `DialogContent`/`Portal`/`Overlay` as the parts a board can't mount for real; this is the same landmine one layer wider. Caught live before the commit, not by the gate. Bucket: lab-authoring gotchas.

## Handoff (replaces the chat report)

- Work commit `a0f03f6d` on `lp/refresh-pages`, pushed. `origin/launch-prep` moved to `8f531c6b` (a one-line `docs/tracks/orchestrator.md` record) since this lane's cut; no sync commit made, per PROGRAM.md ("record commits... never need one").
- Gates, all on `a0f03f6d`: `pnpm typecheck` clean; `pnpm lint` 0 errors (7 pre-existing warnings, none in a touched file); `pnpm test` 4580/4580 green; `zsh scripts/build-lock.sh pnpm build` compiled, typechecked and generated all 257 routes; `pnpm lab:smoke --base http://localhost:3132` 314 checks/0 failing; `pnpm lab:demo --base http://localhost:3132 --board <id>` for all four, 0 failing each (help-center 7 steps, emails 8, contact-page 6, press-page 7; the script's own reduced-motion emulation covers that half of "Verify on"). 1440/375 and reduced motion also eyeballed live in the Chrome pane for every changed ask.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is exactly the 14 files under the four `owns` prefixes; this manifest is the one line outside them.
- The items:
  - `help-center`: `hub` and `feedback` re-argued on help's own two-visitor traffic (who-first's own phone-scanned-a-code / laptop-from-the-host's-menu split) and its own content-maintenance need, dropping the app-pricing/admin citations the audit flagged. Both picks (`hybrid`, `beacon`) unchanged; only the reasoning moved.
  - `emails`: `code` gains the real third direction the audit asked for, `copy` — no button; the digits themselves sit in a highlighted block captioned for the tap-and-hold gesture every mail client already supports (no client can wire a real one-tap copy, so the caption asks for the gesture that actually works). Now recommended over `continue`/`promise`, which were stuck arguing about a tap this mail can't itself resolve.
  - `contact-page`: `receipt` gains the fourth option its own prior `overrule` named and left undrawn, `modal`, quoting `welcome-to-pro.tsx`'s dialog mechanism as plain markup, never the real `Dialog` family (see Deferred). Deliberately no confetti: it borrows the mechanism, not the celebration. `card` stays recommended; the modal is the honest answer to "if a note ever deserves that weight," not a claim that it does.
  - `press-page`: `the-sheet` re-judges the inherited 2026-08-28 brand-guidelines cut on its own case rather than carrying it forward unexamined. The audience-mismatch reasoning in `press/page.tsx`'s own comment still holds (clear space and minimum size are a design team's business, not a press reader's), so the internal plates stay off. What doesn't hold: nothing on the sheet today tells a publication what it may actually DO with the marks. `usage-note` (the eight plates plus one permission line) is the new, one-line-cheap, genuinely press-relevant answer, now recommended over `eight-plates`.
- Assets requested from Will: none.
- Board ideas: none beyond this lane's own four boards.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - `emails.code`: recommendation moved from `continue` to `copy`; the ask's own `overrule` names what flips it back (most people reading the code on a different device than the one waiting for it).
  - `press-page.the-sheet`: recommendation moved from `eight-plates` to `usage-note`; its own `overrule` names the flip condition (even one line reading as a brand book creeping onto the page).
  - `contact-page.receipt`: `modal` is drawn but deliberately NOT recommended; his own note (quoted in the ask's context) pointed at the precedent existing, not at a note deserving it.
- Look at first: `press-page.the-sheet` (the brand-guidelines reconsideration carries the most judgment) and `emails.code` (the new no-button direction).
