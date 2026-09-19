---
track: footer-close
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b30445d9"          # the launch-prep SHA the branch was cut from
board: site-chrome      # round two of the board, on the footer only
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/site-chrome/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/site-chrome.json
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/chrome/footer-demo.tsx
  - src/components/marketing/chrome/footer-qr.tsx
  - src/components/marketing/chrome/footer-glow.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/app/(marketing)/(cinema)/how-it-works/page.tsx
  - src/app/(marketing)/(cinema)/about/page.tsx
  - src/app/theme.css
  - src/lib/demo.ts
---

# lp/footer-close

**Goal.** Round two of `site-chrome`, on the footer alone, from Will's note on `foot-job=three` (verbatim in
`docs/design/rulings.md`, the fourth batch): "The reason I like this one over 3 (the closing invitation) is because most
of our pages close with a CTA section in the same rough shape as your '3' design. Having those back to back would feel
very repetitive, would rather them work together. Knowing this now, would love to see a couple additional explorations
of footers that work well with that closing CTA pattern above." A `defineExploration` round two on the SAME board
(`round.n: 2` with `changed:` saying what this round asks; the ledger in `docs/reviews/site-chrome.json` is what lets a
second round open), two or three decisions, every option drawn under a REAL closing `CtaBand` (the rebuilt
`/how-it-works` close, whose second button is already "Explore a demo event") and under a page with no `CtaBand`
(`/about`), at 1440 and 375, the board's `foot.tsx` as the base with its stale `text-chapter` corrected to the shipped
`text-section`. Suggested decisions (recut them if the drawings argue otherwise): (1) the foot after a close (the sign-off
as today; a quiet strip, the demo one line with the code small beside the index; the close and the foot as one
composition on the ink, the band's demo line becoming the foot's; the index first with the demo tucked into the legal
bar); (2) the foot where nothing closes the page (the full sign-off only there; one footer everywhere and the page's close
is the page's), staged `after` 1; (3) the phone's foot (the pile hidden as today with the link; the code small; nothing
but the index). Not in this round: any production byte (`chrome-wiring` is landing his seven other picks on the real
chrome at the same time: the hiding bar, the Dashboard hint, Start free always, both doors to `/how-it-works`); the
header; the material (`glass` round two).

**Binds.** The bible; the reading budget (`pnpm lab:smoke`); every step's options changing its stage (`pnpm lab:demo
--board site-chrome`); the rulings on the footer so far (`close=folded` from `how-it-works` r1: "With the footer always
having the demo event QR CTA at its top, this pattern pairs well together"; the footer heading a rung down; `foot-door=always`);
no em-dashes; the registration exception: this lane edits ONLY its own board's lines in `src/app/(dev)/design/sandbox/registry.ts`,
`src/app/(dev)/design/(shell)/lab/boards.ts` and `src/app/(dev)/design/touchpoints.ts` (the RULINGS row's `ruled`, `why` and
`board.note` rewritten for round two: the seven picks named as shipped by `chrome-wiring`, the foot's job re-asked; `lives`
may gain `header-shell.tsx`), and nothing else in those files.

**Verify on.** The board at 1440 and 375 with reduced motion honoured, every decision's options and notes reaching the
desk and the composed line, `pnpm lab:smoke --base http://localhost:3134` whole, `pnpm lab:demo --board site-chrome --base
http://localhost:3134` pressing every step; the gate (`pnpm design:rules`, the specimen collector, typecheck, lint with
the 8 known warnings, test, build) each on its own exit code; `DESIGN_PREVIEW_KEY` in the environment, never on a command line.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (lab-only)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board site-chrome` ok (N steps)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines (exceptions and why)
- The decisions, one line each: `<id>: the question; the recommendation and why`
- Assets requested from Will: none, or one per line
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
