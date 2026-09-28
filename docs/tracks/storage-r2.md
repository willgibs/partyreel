---
track: storage-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: host-storage
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-storage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-storage.json
  - docs/systems/billing-caps.md
  - docs/systems/design-system.md
---

# lp/storage-r2

**Goal.** Draw `host-storage` round 2: `prices` alone, a wider and better set of options, each drawn on the plan sheet as it ships today with Will's three round-1 picks built into the ground, so he sees how a host arrives at the prices now.

## The brief

**His round 1 answers** (`docs/reviews/host-storage.json`):
- `order=flat`: one ranked list, largest first across every event. His note: a filter to show All or one event, rather than choosing between every event mixed and grouped by event; hosts will differ, so offering both is "a great mini feature".
- `goal=live`: a sticky strip counts down as items are selected for Remove, and at zero its own button finishes the switch.
- `refusal=inline`: the tapped size flips to the refusal in place. His note: stacked vertically, so each card's lines don't break as they do in the tight three-column layout.
- `prices=?`: "I don't believe these are the best ideas we can come up with here. Would also like to bake in previous selection so I have a more current idea how this gets entered at this point."

**The question:** how a Pro host's six prices (three sizes, monthly or yearly: `src/lib/constants/tiers.ts`) sit in the plan sheet, including a size that would not fit. Round 1 drew rows, cards and a matrix; he wants better. Draw the widest good set, each on the plan sheet as it ships: popups' `plans=wide` (a wide dialog with the plans stacked, never a two-column row; its own screen on a phone: `PopupContent kind`, `src/components/ui/popup-kinds.ts`; the sheet is `src/components/app/pricing/pricing-sheet.tsx`). Production's six prices are the honest plain rows in `pro-price-list.tsx`, behind the storage guard (`src/lib/billing/storage-guard.ts`).

**Build his round 1 into every frame**, since "how this gets entered" is part of what he is judging: the host arrives where they really would (the storage meter and plan card; or the flat size list with its All / per-event filter and the live goal strip whose button finishes the switch), and a size that does not fit flips inline, stacked full width. Round 1's other asks leave `asks` (the ledger keeps them) and become the ground. `storage-wiring` builds them in production after you (not cut yet); this lane ships no production byte.

The board moves to `round.n: 2` with round 1 in `history` and his notes as the direction. Its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` are yours for this round (named exceptions).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended; the first four are the board's carried calls, so he can overrule them in place.

- Where does See what's using space open from the plan? Popups' side panel stacked over the plan at a desk, its own
  screen in a hand whose Back says "Your plan"; closing it returns to the plan (`list-stacks`).
- What does the strip's button do while items are only selected? "Remove and switch": they go to Deleted first, since
  the check counts active bytes; once removed it reads "Switch to Pro 100 GB" (`strip-removes`).
- What is the refusal's second way out when the size that fits is hers? "Keep Pro 500 GB", which flips it back; tapped
  yearly, "Pro 500 GB, yearly instead", a real switch (`keep-plan`).
- Does the plan's head change with the prices? No: every answer wears production's "You are on Pro already" and its
  line, so only the six prices differ (`head-stays`).
- Which doors do the frames open from? Both a Pro host has: frame 1 the Plan card's Change plan on Account, frame 2 the
  storage meter's popover on the dashboard (drawn open under the plan); the prices never differ between them.
- Is the reference answer production verbatim? Production plus his `refusal=inline`: "Too small" becomes a press that
  flips its row, since the pick is the ground every answer stands on.
- What does a fitting price do when pressed? Production's own "Opening…" beat, then nothing: Stripe's confirm page is
  never reached from the lab.

## System-doc edits (in place, owned facts only)

- none (the board ships no production byte; no fact in `billing-caps.md` or `design-system.md` changed)

## Deferred (ROADMAP one-liners, bucket named)

- none (the wiring is `storage-wiring`'s, and ROADMAP's Billing follow-ons line already names its per-item size query)

## Handoff (replaces the chat report)

- Work commit `283abf68` on `origin/lp/storage-r2`, branched from `1708b049` (the cut commit). No sync: launch-prep
  moved only by the record commit `e541cb05` (`docs/STATUS.md`, `docs/tracks/orchestrator.md`).
- Gates on `283abf68`, each its own exit code (`_scratch/storage-r2/gate.log`): typecheck 0; lint 0 (0 errors, 5
  warnings, none in a touched file); test 0 (510 files, 5,738 tests); `build-lock.sh pnpm build` 0; `lab:smoke --base
  http://localhost:3132` 0 (232 checks, host-storage at 437 of 1,200 words); `lab:demo --board host-storage` timed out
  once on the cold compile right after the build (`Runtime.evaluate did not answer in 60000ms`, `demo2.log`), then 0
  warm (1 step, 5 options, the stage moves by up to 30.77%, `demo3.log`).
- Lane check: the 13 owned paths under `sandbox/host-storage/` plus `src/app/(dev)/design/touchpoints.ts`, the named
  exception (the board's row rewritten for round 2), plus this file. `registry.ts` and `boards.ts` unchanged (same id,
  same component).
- `spec.ts`: round 2, `prices` alone with five answers (`shipped` as today, `sizes` recommended, `moves`, `pick`,
  `advised`), round 1 in `history`, his notes as the direction, four carried calls.
- `board.tsx` + `scene.tsx` + `screens.ts`: every answer drawn twice (phones in a row, laptops in a column), each
  caption read off its frame after every press: prices on screen, choices to set first, the dialog's height or the
  fold.
- `plan-sheet.tsx`: the plan quoted on `floatingPopupShapes` and `POPUP_KINDS.plan` (wide at a desk, cover in a hand),
  production's head, Manage billing and quiet foot verbatim.
- `prices.tsx` + `parts.tsx`: the five answers over one fit meter, one price tile and one inline refusal, fit read from
  the storage guard's own `planHolds`, `fittingProPlans` and `formatBytesUp`.
- `storage-list.tsx`: his round-one list as `POPUP_KINDS.list` (panel, or screen under Back): chips for All or one
  event carrying each event's total, flat largest first, the sticky live strip, the quoted bulk row and a top-centre
  Undo toast.
- `ground.tsx` + `world.tsx`: the real `AppShell` with Account's Plan card and the dashboard's storage meter; every
  press local, links swallowed so nothing navigates; the flip arrives on `@starting-style` only after first paint, and
  not at all under reduced motion.
- `fixtures.ts`: price helpers derived from `tiers.ts`'s labels; round 1's grouping helpers retired (order is ruled
  flat); `cake-smash` 0.58 to 0.54 GB, so the total (110.79 GB) prints 110.8 through both formatters. `pricing.tsx`
  (round 1's three layouts) deleted.
- Assets requested from Will: none.
- Board idea: production's Pro fit line tells a Pro 500 GB monthly host "or choose Pro 500 GB" (it means the yearly
  price; plan names carry no billing: `pro-price-list.tsx` feeds `refusalSentence` its yearly rows). The board's
  refusal says "Keep Pro 500 GB" or "Pro 500 GB, yearly instead".
- Board idea: one account's bytes print two ways in one flow: the Plan card and the meter round to nearest
  (`formatBytes`), the refusal rounds up (`formatBytesUp`), so 110.83 GB reads 110.8 GB, then 110.9 GB.
- Board idea: a Pro host who pressed Change plan is greeted "You are on Pro already" (`lead()`, written for an upgrade
  door); the Change plan doors could lead with her plan instead (carried here as `head-stays`).
- Board idea: ROADMAP's line on stale uploader notes cites `host-storage/spec.ts:49`; round 2's spec no longer says it,
  so that clause can close.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: `sizes` as the recommendation (overrule: `moves` if a host thinks in changes, `pick` if the
  phone's length matters most); the seven Questions above.
- Look at first: the step `host-storage.prices` at 1440, `sizes` then `moves`; in a second frame press "See what's
  using space" and tick two files to watch the strip reach "Remove and switch"; then the 375 knob.
