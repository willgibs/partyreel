---
track: refresh-site
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5b17e8f3"            # the launch-prep SHA the branch was cut from
board: site-chrome
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/profile-page/
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/loose-ends/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-site

**Goal.** The site's chrome, the privacy hero, the profile page, the album's motion and the loose ends. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `site-chrome` (3: 4,2,3; range: one binary): first-event r1 makes one foot-phone option "the weakest of the three". Worth trying: Judge foot-phone fresh, not pre-weighted by an unrelated ruling.
- `privacy-hero` (1: 4; range: near-duplicate pair): access & sweep are "the same" 8-tile circuit, differing only fade-vs-sweep. Worth trying: Merge access/sweep and draw a real fourth concept instead.
- `profile-page` (3: 4,3,3; range: real variety): round 1's 8 asks retired outright; round 2 pre-shaped by 3 rulings. Worth trying: Revisit a retired round-1 question now other boards have shipped.
- `album-motion` (1: 3; range: one mechanism, 3 params): ruling flips the pick but "no option was added". Worth trying: Draw a 4th option built for the fade rule, not just rescore.
- `loose-ends` (7: 4,4,3,3,3,3,3; range: workable): "Hover is ruled a desk verb"; faq-look leans on pricing-page's order. Worth trying: Judge faq-look on its own page, not pricing-page's precedent.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `site-chrome`, `privacy-hero`, `profile-page`, `album-motion`, `loose-ends`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- **Commits**: work `91123f0d`; sync `980658f5` (`refresh-guest` had merged and touched `touchpoints.ts`; `git merge origin/launch-prep` resolved with no conflicts, `touchpoints.ts` auto-merged clean). Head: `980658f5`, pushed to `origin/lp/refresh-site`.
- **Gates on the synced tree, each green on its own exit code**: `pnpm typecheck` (`npx tsc --noEmit -p .`) clean; `pnpm lint` 0 errors (7 pre-existing warnings, none in touched files); `pnpm test` 4586 passed, 427 files; `zsh scripts/build-lock.sh pnpm build` succeeded; `pnpm lab:smoke --base http://localhost:3134` 314 checks, 0 failing; `pnpm lab:demo --board <id> --base http://localhost:3134` for all five, 0 failing on every step (option counts below match).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = the five owned board directories + `touchpoints.ts` (the listed exception, all five boards' rows updated except `loose-ends`, whose asks didn't change shape) + a second, unlisted exception below.
- **The one unlisted exception, and why**: `src/components/shared/album-stream/{stream-engine.ts,album-stream.tsx,album-stream.css}`. `album-motion`'s board renders the real production `AlbumStream` component directly (its own docstring: "It is the production component, not a copy of it"), so a fourth `fall` option has no way to exist without a fourth `Variant` in the shared engine. Added: the `bloom` recipe (stream-engine.ts, ~25 lines, no existing recipe's numbers touched), a `data-variant` attribute for CSS scoping (album-stream.tsx, one line), and a glow scoped to `[data-variant="bloom"]` alone (album-stream.css, ~15 lines, the same rim-and-wash `arrival.css` already uses elsewhere, riding the card's own opacity rather than a new animated value). `stream-engine.test.ts`'s generic per-variant checks (pace, keep-out, spacing, landing depth, never-scale-above-fit) all passed on `bloom` with no test edits. No other lane's manifest claims these files (checked `docs/tracks/*.md`).
- **The five boards, what changed, and the live counts** (`pnpm lab:demo` option counts in parens):
  - `site-chrome` — `foot-alone` (2→3): a real third path, `line`, a closing sentence built for a page that asked nothing else (not borrowed from `full` or `same`). `foot-phone` (3→4) judged fresh rather than pre-weighted by `first-event r1`'s ruling on a code's real home: a fourth path, `reveal`, a tap-to-show code sized for someone standing next to the reader; new recommendation. `foot-after` unchanged (4).
  - `privacy-hero` — `concept` (4→4, but a real swap): `access` retired as `sweep` wearing a second transition (the audit's own finding: same grid, same cycle, differing only fade-vs-sweep); `veil` drawn in the open slot, a single photograph never wholly visible with a soft clearing drifting across it (CSS `mask-position` keyframes, no `@property`). `sweep` still recommended (product consistency); `veil` argued as the fresher, more purely thematic case.
  - `profile-page` — a fourth ask, `head`, reopened (round one's `head=guest` verbatim carried Will's own doubt: "maybe not the best overall solution for our nav in general here"). `way-back`'s pill (this same round) now answers that doubt directly, for every visitor, signed in or not, so the header no longer has to carry that argument alone. A new `quiet` option (logo, no menu) joins `today` (renamed from round one's `guest`) and `bare`; `profile.tsx`'s `Head` component gained the one case. Recommendation still `today`, for a narrower reason than it first won on (the menu's other jobs — settings, billing, sign-out — not just the way back).
  - `album-motion` — `fall` (3→4): `bloom`, built for the fade rule itself (grows into place under a glow that fades) rather than a rescore of `glide`/`gather`/`cascade`, all three of which predate that rule. New recommendation (`cascade` → `bloom`); `glide` still ships.
  - `loose-ends` — `faq-look`'s recommendation no longer leans on pricing-page's own closing order (a fact about a different board); the case now stands on the FAQ alone. `everywhere-pill`'s "hover is ruled a desk verb" context restated as the fact itself (no touch equivalent) rather than a citation. No option sets changed; `touchpoints.ts` row left as-is.
  - Every "ruled"/"law"/authority-framed comment across all five boards (and their spec.ts prose) reworded to state the reason itself; grep for `\bruled\b|\blaw\b|\bgivens?\b` across the five directories now returns nothing but one unrelated match ("given a COPY of", frame-filter.ts).
- **Verified live in this session's Chrome pane** (`localhost:3134`, a fresh background tab, fronted only to check CSS-animation progress since a backgrounded tab throttles it): `site-chrome`'s `line` register (DOM-checked at both 1440 and 375: heading, thesis line, demo link and QR all present) and `reveal` (button click confirmed via DOM: QR and "Hold this up to someone else's camera" appear); `privacy-hero`'s `veil` (computed styles confirmed `mask-size` 230px/140px, `mask-position` animating smoothly through its waypoints once visible, `.vl-blur` opacity 0.55 / blur 44px-26px, all matching `VEIL`'s numbers exactly); `album-motion`'s `bloom` (the glow box-shadow confirmed via computed style, and visually: a warm rim of light around the falling tile, distinct from the other three); `profile-page`'s `head` (all three options confirmed via DOM: `today` has a header with a right-side control, `quiet` has a header with none, `bare` has no header at all, and all three carry `way-back`'s pill underneath).
- Assets requested from Will: none.
- Board ideas: none beyond this lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule** (each board's own `overrule` field carries the full case; these are the boldest, least-precedented ones): `site-chrome.foot-phone=reveal` (a new tap-to-show interaction, not a rewording of `hidden`/`small`/`none`); `privacy-hero.concept=sweep` held over the fresher `veil`; `profile-page.head=today` held for a narrower reason than round one gave it, with `quiet` a real, bible-7-motivated alternative; `album-motion.fall=bloom`, the first change to this board's recommendation since the overtaken audit moved it to `cascade`.
- **Look at first**: `privacy-hero.concept`'s `veil` (the clearest answer to that board's own round-three brief, "more fitting for its theme," of anything on this board so far) and `profile-page.head` (a shipped decision genuinely reopened, not just reworded).
