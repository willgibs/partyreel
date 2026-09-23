# Guidance: the craft stack, the skills, the review surface

> **ROLE:** the default an agent reaches for, and leaves only on purpose. **BELONGS HERE:** the craft
> stack, the installed skills and when to invoke each, Will's standing preferences that no bible rule
> or system doc holds, how a board is built so a review is quick. **NOT HERE:** the law (the bible), a
> component's contract (its `@contract-for` test), what shipped (`docs/systems/`), what Will ruled on
> one component or page (the rulings registry, `touchpoints.ts`). **GROWS BY:** a round that learns a
> better default refines the line in place; a skill added to the repo gains a row. **AUTHORITY:**
> guidance, the level below the bible, the contracts and the policies: it never binds, and a departure
> is flagged on the board rather than argued for in advance. Rendered in the Library at
> `/design/library/guidance`.

## The craft stack

**Proactively propose creative DELIGHT (bible 22): make it feel like magic.** In all design and UI
work, don't stop at "correct": surface a creative delight opportunity (a considered entrance, a
satisfying micro-interaction, a rare-moment beat) and RECOMMEND it by default, rather than waiting to
be asked. Beauty is leverage, the unseen details compound, and "feels like magic" is Partyreel's
differentiator. The discipline that keeps delight from becoming noise is **animate by FREQUENCY**
(bible 12): HIGH-frequency actions (a workspace opened many times a day, moderation and select
switches) stay INSTANT or minimal, never theater; OCCASIONAL surfaces (modals, takeovers, route
navigation) get standard entrances (at most 300ms, custom easing, `@starting-style`, a reduced-motion
fallback); RARE and first-time moments (empty states, a first action, celebrations) can carry real
delight. Everything is CSS-first and `prefers-reduced-motion`-safe, and every exit is no slower than
its entrance.

**emil-design-eng (the installed skill) is PRIMARY; Hobday's Safe Rules
(anthonyhobday.com/sideprojects/saferules) are a SECONDARY advisory; neither is a bible.**
*Adopted*: no pure white page, the elevation contract (lighter is closer; four heights, one job each),
nested-corner math, muted paired icons, small-label tracking, the 4px grid and radius-ratio math, cool
neutrals (the greys carry hue 286). *Already true*: near-black and near-white extremes, contrast
hierarchy, a brightness-distinct palette, about 2x horizontal button padding, two typefaces (there is
no mono face in the product), about 70ch prose. *Not adopted*: the 12-column grid. **Body sizes come
off the body ladder** (`docs/systems/design-system.md`, "Type"): a guest-facing sentence is
`text-reading` (16px), the app's and the admin's working type is `text-working` (14px), and dense
structure (captions, counters, labels) takes the caption, label and micro rungs.

## Skills

The installed skills, and when a round reaches for each. A skill is guidance: it carries craft, not
law. `src/app/(dev)/design/rules/influences.test.ts` refuses a skill directory in the repo that no
row here names, so a skill cannot sit installed and unmentioned.

| skill | when | where it lives |
| --- | --- | --- |
| `emil-design-eng` | **Primary.** Every UI change: motion by frequency, press feedback, custom easing, `@starting-style` entrances, reduced-motion safety. | `.agents/skills/emil-design-eng`, rendered at `/design/library/doctrine/craft` |
| `transitions-polish` | The motion audit of a **wiring** round: durations, distance, easing and stagger tuned against the motion-token scale once a direction has been ruled. | `.agents/skills/transitions-polish` |
| `transitions-dev` | Recipes while building: a specific transition (a modal, a toast, a sliding tab, a streaming line) you would otherwise hand-roll. | `.agents/skills/transitions-dev` |

Only the primary skill is rendered in the Library: the lab's doc reader carries a deliberate
allow-list (`_data/docs.ts`), and widening it to every skill directory would put arbitrary vendored
markdown behind a request-time `readFileSync`. Read the other two from the repo. A skill a session
loads from outside the repo is invisible to the next agent, so name what it gave you in the board's
Departures or the manifest's Handoff.

## Inspiration: the Mobbin MCP

Mobbin (the connected MCP: `search_screens`, `search_flows`, `search_sections`) is a library of real
product UI, screens, flows and sections, searched in plain language and returned as images to read. An
exploratory UI agent is ENCOURAGED, never required, to reach for it when a board wants new concepts on
the table or a specific target (a section, a screen, a flow, a UI element, a style): search, read the
screens, and design from the ground up; a screen you leaned on is cited by its Mobbin link in the
board's context or the manifest's Handoff so the influence is visible. It is a way in, not a shortcut:
an agent that always looks up inspiration first may never find its own, so use it when it opens a door
and skip it when the idea is already alive. Its images are for reading only, never for the repo (no
image is copied into `public/` or a board; every image on the site is generated for its slot, bible
18), and a screen's look is a reference for a decision, never a component to trace.

## Standing preferences

Will's design preferences that hold on a page that does not exist yet and live in no bible rule or
system doc. Each is a default: an exploration may beat one, and says so.

**The product**

- **One purpose, one component.** Components that do one job are one component with props, never
  near-copies; components that serve different purposes stay separate even when they look alike. When
  it is unclear which a pair is, the lane says so in its Handoff rather than merging by default. A
  family of near-copies drifts, and a forced merge serves two jobs badly.
- **An ask says what it gives, where that comes naturally.** A name, an email, a first upload or a gate
  reads as what the guest or the host gains when the gain is real ("The host has asked guests to confirm
  an email for safety"); where a benefit would be forced, the line is natural or at least neutral, never
  worded as a rule or in regulatory language. The first welcome reads fun, safe, easy and quick. A guest
  who scanned a code owes us nothing: a regulatory ask reads as a barrier, and a forced benefit reads as
  pandering.
- **A limit meets you before the work.** A cap refuses before the form it would waste, with the ways
  out beside the refusal, and a locked control says why it is locked and offers the upgrade: convert,
  never block. Discovering a limit after doing the work is the worst moment to meet it.
- **Back and Continue mean previous and next.** A step's forward button keeps its word wherever the
  reader returns to it, and Back never changes direction. Everyone reads the pair the same way.

**The marketing site**

- **Headings hold to two lines on a desktop.** A heading that wraps to three at 1440 is rewritten or
  moved down the ladder. Three lines read as a paragraph, and the ladder always has a smaller step.
- **Heroes share a lockup, never a template.** Every hero composes the shared lockup (`PageHero`: the
  h1's step, the spacing to the subhead, the button group) and is otherwise its own, media and motion
  forward and themed for its page; the same hero with new copy is not production quality. Heroes that
  feel custom are what make a reader want to see the next page.
- **A page's payoff is its own.** Pages close on their call to action with the demo invitation
  beneath, but the section above it varies: no one payoff (the reel, say) ends every page. A repeated
  ending is noticed by the third page.
- **No portrait video centred in empty space.** On a desktop a portrait video shares its section with
  something on one or both sides, or gives way to a landscape one. A centred phone-shaped video leaves
  most of the section blank.
- **Frames wait for real media.** A marketing visual is a frame (a browser window, a phone, a gallery
  grid, a QR card, a reel player) built so a real photograph or video drops in with no layout change.
  Every frame is generated for its slot later (bible 18), so the layout must not depend on today's
  stand-in.
- **A phone scrolls.** On a phone a row of cards stacks and scrolls; a swipe carousel is kept for
  gallery-type sections. Scrolling is far more common than swiping, and swipe cards get missed.
- **The menu goes straight to the page.** Navigation opens the page a reader chose, never a hub they
  must pass through first, on a phone above all.

## Boards: the review surface

A board exists to get one question answered in a single screen, so its shape is a craft problem of
its own: a board with no way to move between pages, or a presentation too messy to read, costs a
review before it starts.

- **Answer first.** The verdict, then the asks, then the evidence. A reviewer who stops after the
  first screen has still answered the question.
- **Page-wide switches stay on screen.** A control that changes every preview is fixed in the dock,
  never at the top of the page, so any two previews can be compared without scrolling back.
- **The answer never covers the question.** The context, the preview and the answer controls work
  together: the preview shows the whole option at its true height with its labels, and the dock never
  hides it.
- **Previews are 1:1.** A stage renders a real viewport's pixels on a real ground. Nothing that
  reviews size may be zoom-fitted, and an iframe that rescales is a broken review.
- **Compare against the real thing.** Whole real pages and live production components on the
  candidate's tokens beat abstract swatches.
- **Dark and light are chosen separately.** They are not a package deal: dark is the marketing site's
  dark chapters and the app's dark mode, light is marketing's paper and the app's light mode.
- **One word answers an ask.** An ask names two or more options and a recommendation; Will answers
  in a word, and the panel composes the message he pastes into chat. The lab never writes the repo.
- **A question carries its own context.** An ask is a real question a stranger can answer where it is
  met: what the thing is and where it lives on the site, where to look and what to compare, each
  option in words with what choosing it does. A nickname from the board is glossed the first time or
  left out. "Not clear to me" is an answer (`?`), and a board that receives it owes a clearer
  question, not a longer argument.
- **The specimen carries the option's name, and shows the difference.** Every cell, frame or column
  an ask is judged on is labelled with the option's own words, so "Family" on the card is "Family" on
  the preview; a dock control an ask mirrors uses the same labels, and picking the option previews it.
  Each specimen shows what distinguishes its option; similarities may be shown too.
- **Copy is judged in its real place.** A line is compared with three or four close candidates where
  it will live, one real line at a time, and the voice is built from the lines that win: never
  declared first and then applied, because a voice that sounds right in a silo can fail in use.
- **A catalog beats a paper.** An exploration is a few (or many) polished variants, each a preview
  with the demo UI to configure and compare it, to pick the best direction from and refine to
  production polish; the aim is intuitive content flow and engaging visuals together. The research
  stays collapsed under the evidence or leaves the board.
- **A `vh` inside a Frame is the frame's height.** The kit's `Frame` is a same-origin iframe of a set
  height, so `min-h-screen` inside it fills exactly the frame, and several chromes stacked in one
  Frame, each with a `vh` minimum, compound into a frame several screens tall. A chrome drawn more
  than once per frame takes a flag (`standalone`) that drops its minimum when it is not alone.
- **A board's spec is a literal `defineExploration({ ... })`.** `scripts/lab-review.mjs` finds the
  spec by scanning the source for that call and its object literal, reading `id`, `round.n`, the
  asks' ids and the options' ids as written, so a spec assembled by a helper, a spread or a variable
  is refused when a review is transcribed: keep it literal, or teach the scanner the wrapper.

## The screenshot gate

Every new or reworked page ends at one question, with the two screenshots side by side: **would this
hold up next to the home page?** If the answer is no, the page is not done, and the round says so
rather than shipping and hoping a later polish pass finds it. A page built in one pass without the
screenshot-and-iterate loop ships bland, which is what the gate exists to catch.

## The departure note

Guidance is left on purpose, not by accident. When a board or a track departs from the craft stack,
from a shipped precedent or from a policy, it says so where a reviewer reads it: a board's
`departures`, a track's Handoff. A departure with its cost written down is a finding; the same
departure unmentioned is a regression nobody can tell from a decision.
