---
track: loop-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "22438704"          # the launch-prep SHA the branch was cut from
board: none             # a wiring round, design-led: /how-it-works rebuilt on his picks; the how-it-works board retires with it
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(marketing)/(cinema)/how-it-works/
  - src/components/marketing/sections/how-it-works/
  - src/components/marketing/sections/shared/how-it-works-stepper.tsx
  - src/components/marketing/sections/shared/how-it-works-stepper.test.tsx
  - src/components/marketing/sections/home/film-strip.tsx
  - src/components/marketing/sections/home/film-strip-glow.tsx
  - src/app/(marketing)/(cinema)/page.tsx
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/app/(marketing)/(cinema)/help/page.tsx
  - src/lib/constants/how-it-works.ts
  - src/lib/welcome.test.ts
  - src/app/(dev)/design/sandbox/how-it-works/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/how-it-works.json
  - docs/systems/marketing-content.md
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/section-shell.tsx
  - src/components/marketing/system/reveal.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/system/demo-cta-link.tsx
  - src/components/marketing/sections/shared/inline-reel-player.tsx
  - src/components/marketing/sections/pricing/plan-cards.tsx
  - src/components/marketing/sections/home/section-ids.ts
  - src/components/marketing/frames/index.ts
  - src/components/marketing/mock-parity.test.ts
  - src/components/marketing/chrome/footer-contract.test.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/demo.ts
  - src/lib/type-ladder-policy.test.ts
  - src/app/(marketing)/marketing-h1-policy.test.ts
  - src/components/auth/email-sign-in.tsx
  - content/help/how-partyreel-works.mdx
  - src/app/(dev)/design/sandbox/demo-event/spec.ts
---

# lp/loop-wiring

**Goal.** Rebuild `/how-it-works` on Will's picks (2026-09-19, batch three, verbatim in `docs/design/rulings.md`), to
production grade with real design care, judged on the alias; his answer in plan mode: "build the page now, design-led".
The picks: `pair=renamed` ("Two pages, same name is too confusing"), `who=host`, `steps=six` ("These headings could be
adjusted a bit to feel more clean"), `pictures=bespoke` (today's frames are "incredibly V1, and were never considered
individually"), `shape=scroll` PLUS a new ask ("let's include a toggle above the steps to switch between Host/Guest
perspective, and have custom steps for each to see both sides"), a numbered-stepper "How It Works" OVERVIEW section for
the home ("a numbered stepper would work better, where we can present the full flow within a regular height section"),
`proof=demo` ("I don't want every single page to end the same way with the reel... a centered mobile portrait video...
leaves tons of blank space on either side... fill some of the space to one or both sides. Or we can use landscape
videos"), `close=folded`, and the footer's "Explore a demo event." heading one ladder step down ("Change it directly").
`phone=?` is dissolved: the step's three options only rewrapped host-facing pieces and the rebuilt page is phone-first by
construction; say so in the Handoff. The board `sandbox/how-it-works/` retires in this lane (its directory, its three
registration lines, its RULINGS row rewritten as shipped as `git show 73451c79 -- "src/app/(dev)/design/touchpoints.ts"`
did; `pnpm design:rules`). The worked pictures are the board's own files (`content.ts`, `step-set.ts`, `spine-list.tsx`,
`shape.tsx`'s `Stepper`, `proof.tsx`, `close.tsx`, `pair.tsx`).

**The page.** `PageHero` unchanged (`who=host` is today's copy). Above the spine a client segmented pill in the precedent
of `sections/pricing/plan-cards.tsx`'s cadence toggle (`role="group"`, a sliding `aria-hidden` span, `aria-pressed`,
`--mkt-tabs-dur`) switching Host and Guest; each perspective has its own SIX steps: the host set from the board's
`content.ts` with step one's sentence made true (the event goes live the moment creation finishes, never "the moment you
create it") and the headings cleaned; the guest set new (scan, the door, add, the album filling, save and take home, the
reel arriving), written in the voice rulings' register. Both sets live in `src/lib/constants/how-it-works.ts`, which
becomes the ONE source read by the page, the stepper and the welcome flow (`welcome.test.ts` adjusted; the welcome flow's
three-step story derives from it). Six bespoke pictures PER perspective, each designed individually from real product
pieces (the create card, the styled code, the album filling in a frame, the review row, the download dialog, the reel),
never the generic `FrameCard` boxes; the "Email me a code" literal stays verbatim wherever the guest door is drawn
(`mock-parity.test.ts` pins it against `email-sign-in.tsx`). The spine stays one scroll (the board's `SpineList` as the
base). The proof section becomes a demo-door section: the demo's promise in `demo-event`'s recommended "named" wording
(`sandbox/demo-event/spec.ts`), the code and a door to `/demo`, `ReelPayoff` gone from this page; if a video is kept it
is the landscape reel from `MARKETING_REELS` or a portrait with both sides filled, never a 19rem column in the middle.
One closing section: `CtaBand` with the free-storage line folded into its subhead and "Explore a demo event" beneath the
CTA; `PricingPointer` retires from this page. The pair renamed: the spine's GoDeeper reads "Read the full how-to" (to the
article), the mega panel's Resources card the same label with "six steps" (two strings in `chrome/mega-panel.tsx` only;
the panel's shape belongs to the `site-chrome` board), the help hub's link "See the loop, start to finish".

**The overview section.** A new shared `sections/shared/how-it-works-stepper.tsx`: the board's `Stepper` promoted
(numbered tabs, one step on screen, "N of 6", a door to `/how-it-works`), reading the same constants, with a
`// @contract-for:` test beside it (function: the active step renders once, the tabs are buttons with `aria-pressed`,
reduced motion honoured). Mount it on the home in place of `sections/home/film-strip.tsx`'s three scenes (the home's
how-it-works passage; `section-ids.ts` keeps the id; the film strip and its glow retire, git keeps them) and export it
for the feature pages without mounting it there. The swap is his to overrule on the alias.

**The footer.** `chrome/marketing-footer.tsx`: "Explore a demo event." from `text-chapter` to `text-section`, one ladder
step down and level with a closing H2; `footer-contract.test.ts` re-run; nothing else in the footer moves.

**Binds.** The bible; `PageHero`'s contract and the h1 policy (one h1; the toggle's and the stepper's headings are h2s
through `SectionShell`); the type ladder on every heading (`type-ladder-policy.test.ts` excuses one stock heading in
`step-frames.tsx` today: if the file goes, the excuse goes); `keyframe-uniqueness` for any new animation; `marketing-nav`
(the footer's four Product hrefs unchanged); `help-slug-pins` (`START_HERE_SLUGS` untouched); `content-policy` (no
em-dashes, no unbacked claims); `Reveal`'s attributes (swapped content stays a descendant of the revealed section);
`PaperChapter`'s token redeclaration (the spine stays inside it); the chapter-transition ruling; the copy is open (bible
21); `component-notes.ts` `for:` lines for the new files (an exception like the registration lines). Calls that stay
Will's, stated in the Handoff: the stepper on the home in the film strip's place; the guest set's six moments; the
demo-door proof with or without a video; the landscape reel if one is kept.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132` (the retired board gone from its
  table); `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Locally at 1440 and 375: `/how-it-works` (the toggle switching both step sets, six pictures each, the demo-door proof,
  the folded close, the renamed links, reduced motion), the home's overview stepper (each numbered step, the door), the
  footer heading against a closing H2, the mega panel's card, the help hub's link; captures read against their words.
  The Orchestrator repeats the list on the alias.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet (`marketing-content.md`'s page catalogue gains a `/how-it-works` entry if the lane owns a fact there: propose it in the Handoff)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The picks landed, one line each, what the `phone` step meant, and the calls his to overrule
- Assets requested from Will: none, or one per line
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
