---
track: loop-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The home's film strip: does the conveyor retire with the three scene cards?** The manifest says
  "the film strip and its glow retire"; Will's ruling was only about the teaser's THREE STEPS ("a numbered
  stepper would work better, where we can present the full flow within a regular height section").
  **Recommended, and carried:** the three scene cards and the section's own pointer go and the stepper
  takes their place; the conveyor and its sampled underlight STAY. They are the section's identity (the
  site's own photographs edge to edge, bible 18) and one of the four shipped lamps, whose whole design is
  a strip of frames above and an object below positioned to catch the light; the stepper is that object
  now, and it reads on screen. Retiring them would also have meant editing three rows of
  `docs/systems/design-system.md` and a comment in `reel-screen-lamp.tsx`, neither of which this lane owns.
  `film-strip-glow.tsx` is therefore untouched and the section id stays `film-strip`.
- **The demo's promise: the "named" wording without its numbers.** `demo-event`'s recommended wording is
  "A real wedding album. N photos from M guests." The counts are a DB row that can be re-seeded, and the
  party type is one too, so a hardcoded pair would be an unbacked claim the day the demo changes.
  **Recommended, and carried:** name what it IS rather than what it contains, in the section's subhead:
  "A real Partyreel album, curated by the host who ran it, open with no sign-up." If Will wants the counts,
  they need a source (a build-time read of the demo event, or a constant he owns).
- **The close's second button.** The manifest folds the pricing pointer's FACT into the band's subhead but
  leaves its POINTER homeless. **Recommended, and carried:** the band's secondary button becomes
  "See full pricing" (the hero already spends "Browse the features"), so the retired section loses a seam
  and keeps its job.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. `marketing-content.md` has no `/how-it-works` entry today and this lane did not add one: its page
  catalogue is written per page family, and a one-page entry is better written when `event-identity` lands
  and the marketing catalogue is revised as a whole. Proposed line, if the Orchestrator wants it now:
  *"**`/how-it-works`**: the loop as six steps in one scroll with a Host/Guest toggle above them
  (`lib/constants/how-it-works.ts` is the ONE source, read by the page, the shared overview stepper and the
  app's welcome tutorial); twelve bespoke pictures, the host's on a desk and the guest's in a phone; the
  demo as a finished album rather than a reel; one folded close."*
- `design-system.md` is deliberately untouched: the film strip and its lamp stay (see Questions).

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** the home section id `film-strip` now renders the how-it-works stepper under the strip; rename
  the id to `how-it-works` in a lane that owns `sections/home/section-ids.ts`, `index.ts` and
  `home-sections.test.ts` (this lane owns none of the three, so the misnomer stands).
- **Now:** `content/help/how-partyreel-works.mdx` still tells FIVE steps where the page now walks six;
  the mega panel's blurb stopped counting rather than claim a number that is wrong on one of them. The
  help lane should bring the article's `<Steps>` onto the same six.
- **Later:** `HowItWorksStepper` has no Library specimen (it is a full-width section, so it carries an
  `unspecimened` reason); a `gallery-demos` entry would let the Library show it.

## Handoff (replaces the chat report)

- The work is `b88ae082`, the sync merge `f73819b9`, and this manifest commit rides on top; all pushed.
  Synced with `launch-prep` at `b45f94fb` (it moved once mid-round, by a record commit touching
  `docs/STATUS.md` and `docs/tracks/orchestrator.md`; merged clean, no conflict with any owned path, and
  the whole gate re-run on the synced tree)
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok · the specimen collector ok
  (131 specimens on 94 entries) · `pnpm typecheck` ok · `pnpm lint` ok (the 8 known warnings, none in this
  lane) · `pnpm test` ok (2,555 in 242 files) · `pnpm build` ok (254 static pages) ·
  `pnpm lab:smoke --base http://localhost:3132` ok (454 checks, 0 failing, and `how-it-works` gone from the
  reading table)
- Lane check, pasted (`git diff --name-only origin/launch-prep...HEAD`):

```
  docs/design/library.md
  docs/tracks/loop-wiring.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/rules/component-notes.ts
  src/app/(dev)/design/rules/rules.generated.json
  src/app/(dev)/design/sandbox/how-it-works/board.tsx
  src/app/(dev)/design/sandbox/how-it-works/close.tsx
  src/app/(dev)/design/sandbox/how-it-works/content.ts
  src/app/(dev)/design/sandbox/how-it-works/pair.tsx
  src/app/(dev)/design/sandbox/how-it-works/phone.tsx
  src/app/(dev)/design/sandbox/how-it-works/picture-treatments.tsx
  src/app/(dev)/design/sandbox/how-it-works/pictures.tsx
  src/app/(dev)/design/sandbox/how-it-works/proof.tsx
  src/app/(dev)/design/sandbox/how-it-works/scene.tsx
  src/app/(dev)/design/sandbox/how-it-works/shape.tsx
  src/app/(dev)/design/sandbox/how-it-works/spec.ts
  src/app/(dev)/design/sandbox/how-it-works/spine-list.tsx
  src/app/(dev)/design/sandbox/how-it-works/state.ts
  src/app/(dev)/design/sandbox/how-it-works/step-set.ts
  src/app/(dev)/design/sandbox/how-it-works/steps.tsx
  src/app/(dev)/design/sandbox/how-it-works/who.tsx
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  src/app/(marketing)/(cinema)/help/page.tsx
  src/app/(marketing)/(cinema)/how-it-works/page.tsx
  src/components/marketing/chrome/marketing-footer.tsx
  src/components/marketing/chrome/mega-panel.tsx
  src/components/marketing/mock-parity.test.ts
  src/components/marketing/sections/home/film-strip.tsx
  src/components/marketing/sections/how-it-works/demo-door.tsx
  src/components/marketing/sections/how-it-works/guest-pictures.tsx
  src/components/marketing/sections/how-it-works/host-pictures.tsx
  src/components/marketing/sections/how-it-works/picture-parts.tsx
  src/components/marketing/sections/how-it-works/pricing-pointer.tsx
  src/components/marketing/sections/how-it-works/reel-payoff.tsx
  src/components/marketing/sections/how-it-works/side-chip.tsx
  src/components/marketing/sections/how-it-works/spine.tsx
  src/components/marketing/sections/how-it-works/step-frames.tsx
  src/components/marketing/sections/how-it-works/step-picture.tsx
  src/components/marketing/sections/shared/how-it-works-stepper.test.tsx
  src/components/marketing/sections/shared/how-it-works-stepper.tsx
  src/lib/constants/how-it-works.ts
  src/lib/type-ladder-policy.test.ts
```

  Grouped, with the exceptions and why:
  - inside `owns`: the page, `sections/how-it-works/*` (five new files, four retired), the stepper and its
    contract, `sections/home/film-strip.tsx`, the footer, the mega panel, the help hub,
    `lib/constants/how-it-works.ts`, the retired board directory
  - the retirement's registration lines: `sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`
    (the `SandboxId` member removed and the RULINGS row rewritten as shipped), plus the generated
    `docs/design/library.md`, `rules.generated.json` and `specimens.generated.json`
  - `rules/component-notes.ts`: one `for:` line for the new stepper (the named exception)
  - **two one-line test edits outside `owns`, both facts about files this lane owns**, named because the
    manifest's Binds anticipated one of them: `mock-parity.test.ts`'s guest-door entry follows the drawing
    from `step-frames.tsx` to `guest-pictures.tsx` (the literal it pins is unchanged), and
    `type-ladder-policy.test.ts` loses its `step-frames.tsx` exception because the file is gone AND the
    twelve pictures that replace it need none: no drawn type wears the heading face, so the allow-list got
    shorter rather than moving
  - `src/lib/welcome.test.ts` was NOT edited: `HOW_IT_WORKS` keeps its `{icon, title, body}` shape, so the
    welcome flow, the `app-door` board and the existing assertions all hold unchanged. It now DERIVES from
    the host's first three steps instead of being written a second time.
- **The picks landed, one line each**
  - `pair=renamed`: the spine's foot and the mega panel's Resources card both read "Read the full how-to"
    into the article; the help hub's link into this page reads "See the loop, start to finish". The panel's
    blurb stopped counting steps (it said four; the article writes five and the page walks six).
  - `who=host`: `PageHero` is byte-identical. The guest side is a perspective inside the page, not a
    second greeting.
  - `steps=six`, headings "more clean": twelve verb-first titles, three or four words each, parallel across
    both sets and ending on the same object from opposite ends (the host CUTS the reel, the guest GETS it).
    Step one's body is true now: finishing the Design step is what writes the row.
  - `pictures=bespoke`: twelve pictures designed one at a time, no shared box. The host's six are objects
    on a desk (the wizard at its commit moment, a printed table card on a photograph, the album in a
    browser, the review queue, the download dialog over the album it takes, the reel control with its cut);
    the guest's six are one phone, six screens, each with a companion beside it so a portrait object never
    sits alone in a wide column. Every string is the app's own.
  - `shape=scroll` + the toggle: one scroll, and a segmented pill above the steps on the pricing cadence
    toggle's cadence. The numbers 01 to 06 do not move when it flips, and neither does the entrance: one
    `<Reveal>` per INDEX is reused across both sets, so a toggle never replays six 700ms rises on steps the
    reader is looking at. The swap has its own 200ms rise out of a 3px blur, `@starting-style` rather than a
    keyframe, `motion-safe` gated.
  - the overview stepper: promoted to `sections/shared/how-it-works-stepper.tsx` with a `@contract-for`
    test (one step on screen, `aria-pressed` buttons, the single source, reduced motion), mounted on the
    home in the three scene cards' place and exported for the feature pages without being mounted there.
  - `proof=demo`: the reel is gone from this page and the demo is the payoff. A full-width wall of
    photographs, then the real scannable code centred beneath it, encoding `/demo` (25 modules, his
    river-card ruling) rather than the event link. No video at all, so there is no portrait column with
    blank wings.
  - `close=folded`: one section. The free-storage line is inside the band's subhead and still derives from
    `tiers.ts`; `PricingPointer` and `ReelPayoff` retired with the page (git keeps them).
  - the footer: "Explore a demo event." moved `text-chapter` to `text-section`, measured at 52px against
    the closing H2's 52px at 1440.
- **What the `phone` step meant.** It asked what should change about the page in a guest's hand and Will
  could not read the question ("I'm not sure what's being asked here. How is this 'in a guest's hand?'").
  Fairly: its three options never left the host's side of the page. Two of them rewrapped the payoff's
  video in a bezel and the third paginated the spine below 375; none of them was about a guest. The rebuild
  dissolves it by construction: the guest half of the walkthrough IS a phone, six screens of one, and the
  payoff has no video left to wrap.
- **The calls that stay his, to overrule on the alias**
  1. The stepper on the home in the film strip's place, and the film strip itself staying (Questions, one).
  2. The guest set's six moments: scan, the door, add, the room filling, save, the reel arriving.
  3. The demo-door proof WITHOUT a video, and the demo appearing three times at the foot of the page (the
     code here, the line under the close, the footer's plate) as a decreasing ladder.
  4. The demo's promise naming what it is rather than counting what is in it (Questions, two).
  5. The close's second button reading "See full pricing" (Questions, three).
- Assets requested from Will: none. The twelve pictures are drawn from shipped components and the existing
  manifest; a generated media set lands as a swap by id, as everywhere else.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Captures:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/loop-wiring/captures.md`
  (what was read at 1440 and 375, against which pick, and the four bugs the reading caught)
- Look at first: the toggle, pressed twice, at 1440 and then at 375. Then the foot's "Now read it as a
  guest", which is the lane's one piece of delight: it flips the perspective AND returns you to step one.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). `/how-it-works` was rebuilt on Will's round-one picks,
design-led: one scroll of six steps with a Host/Guest segmented toggle above them, a step set per side out
of one new single source (`lib/constants/how-it-works.ts`, which the page, a new shared overview stepper and
the app's welcome tutorial all read), and twelve bespoke pictures replacing the six FrameCard quotes, the
host's as objects on a desk and the guest's as one phone with a companion beside each screen. The numbers
stay put when the toggle flips, because the spine reuses one Reveal per index and the swap runs its own
`@starting-style` rise instead. The payoff became the demo as a finished album with a real code encoding
`/demo`, the close folded into one band, the pair renamed across three surfaces, and the footer's demo
heading dropped a rung to sit level with a closing H2. The board retired; `ReelPayoff`, `PricingPointer`,
`SideChip` and `step-frames.tsx` retired with it.
