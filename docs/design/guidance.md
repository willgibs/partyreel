# Guidance: the craft stack, the skills, the review surface

> **ROLE:** the default an agent reaches for, and leaves only on purpose. **BELONGS HERE:** the craft
> stack, the installed skills and when to invoke each, how a board is built so a review is quick.
> **NOT HERE:** the law (the bible), a component's contract (its `@contract-for` test), what shipped
> (`docs/systems/`), what Will said (`rulings.md`). **GROWS BY:** a round that learns a better default
> refines the line in place; a skill added to the repo gains a row. **AUTHORITY:** guidance, the level
> below the law, the contracts and the policies: it never binds, and a departure is flagged on the
> board rather than argued for in advance. Rendered in the Library at `/design/library/guidance`.

## The craft stack

**Proactively propose creative DELIGHT (bible 22): make it feel like magic (Will, 2026-06-21).** In all design/UI
work, don't stop at "correct": surface a creative delight opportunity (a considered entrance, a satisfying
micro-interaction, a rare-moment beat) and RECOMMEND it by default, rather than waiting to be asked. Beauty
is leverage, the unseen details compound, and "feels like magic" is Partyreel's differentiator. The
discipline that keeps delight from becoming noise is **animate by FREQUENCY** (emil): HIGH-frequency actions
(a workspace opened many times a day, moderation/select switches) stay INSTANT/minimal: never add theater
there; OCCASIONAL surfaces (modals, takeovers, route nav) get standard entrances (≤300ms, custom easing,
`@starting-style`, reduced-motion fallback); RARE/first-time moments (empty states, a first action,
celebrations) can carry real delight. Everything CSS-first + `prefers-reduced-motion`-safe + exits ≤ enters.

**emil-design-eng (the installed skill) is PRIMARY; Hobday's Safe Rules
(anthonyhobday.com/sideprojects/saferules) are a SECONDARY advisory; neither is a bible.**
*Adopted*: no pure white surfaces, the elevation contract (no dark shadows,
lighter-is-closer, one depth technique per mode), nested-corner math, muted paired icons,
small-label tracking, the 4px-grid + radius-ratio math. *Already true*: near-black/near-white
extremes, contrast hierarchy, brightness-distinct palette, ~2x horizontal button padding, two
typefaces (there is no mono face in the product), ~70ch prose. *Declined or
deferred with reasons*: saturate-neutrals DECLINED (zero-chroma identity); the 12-column grid is
noted for a marketing rebuild rather than adopted. **The guest reading-copy rule:** guest-facing reading
copy is 15-16px (`text-[15px]`/`text-base` on event description, gate prompts, growth cards, entry
sheet rows); dense/structural UI (captions, counters, secondary labels) stays sm/xs. Host and admin
are still on 14px.

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
Departures or the manifest's Record.

## Inspiration: the Mobbin MCP

Mobbin (the connected MCP: `search_screens`, `search_flows`, `search_sections`) is a library of real
product UI, screens, flows and sections, searched in plain language and returned as images to read. An
exploratory UI agent is ENCOURAGED, never required, to reach for it when a board wants new concepts on
the table or a specific target (a section, a screen, a flow, a UI element, a style): search, read the
screens, and design from the ground up; a screen you leaned on is cited by its Mobbin link in the
board's context or the manifest's Record so the influence is visible. It is a way in, not a shortcut:
an agent that always looks up inspiration first may never find its own, so use it when it opens a door
and skip it when the idea is already alive. Its images are for reading only, never for the repo (no
image is copied into `public/` or a board; every image on the site is the Higgsfield month's), and a
screen's look is a reference for a decision, never a component to trace.

Verbatim (Will, 2026-09-18, after the first use): "I'd like a note in our docs/lab that encourages other
exploratory UI agents to use the Mobbin MCP tool as well so it isn't a one-off usage the first time it
was added. I don't want to make it a hard rule (agents that always look up inspo may never find their
own creativity), but it's an incredible way to get some new concepts on the board or specifically target
different design ideas of new sections, screens, flows, UI elements, styles, etc."

## Boards: the review surface

A board exists to get one question answered in a single screen, so its shape is a craft problem of
its own (Will, 2026-09-15: "there's no cross-page navigation, each page's presentation can be super
messy so it's hard for me to understand the work").

- **Answer first.** The verdict, then the asks, then the evidence. A reviewer who stops after the
  first screen has still answered the question.
- **Page-wide switches stay on screen.** A control that changes every preview is fixed in the dock,
  never at the top of the page: "having to scroll back to the top (such as for palette) makes it
  very hard to review differences."
- **Previews are 1:1.** A stage renders a real viewport's pixels on a real ground. Nothing that
  reviews size may be zoom-fitted, and an iframe that rescales is a broken review.
- **Compare against the real thing.** Whole real pages and live production components on the
  candidate's tokens beat abstract swatches: "I'd love to see more UI examples for comparison,
  especially if they can be live production components using the demo palettes."
- **Dark and light are chosen separately.** They are not a package deal.
- **One word answers an ask.** An ask names two or more options and a recommendation; Will answers
  in a word, and the panel composes the message he pastes into chat. The lab never writes the repo.
- **A question carries its own context** (Will, 2026-09-15: "it was tough to understand what I was
  being asked for most of those questions"). An ask is a real
  question a stranger can answer where it is met: what the thing is and where it lives on the site,
  where to look and what to compare, each option in words with what choosing it does. A nickname from
  the board is glossed the first time or left out. "Not clear to me" is an answer (`?`), and a board
  that receives it owes a clearer question, not a longer argument.
- **The specimen carries the option's name.** Every cell, frame or column an ask is judged on is
  labelled with the option's own words, so "Family" on the card is "Family" on the preview; a dock
  control an ask mirrors uses the same labels, and picking the option previews it.
- **A catalog beats a paper** (Will, 2026-09-15: "a dozen polished variants with preview palettes with
  some demo UI to config & compare would've been far more helpful than this massive mountain"). An
  exploration is a few (or many) polished variants, each a preview with the demo UI to configure and
  compare it, to pick the best direction from and refine to production polish. The research stays
  collapsed under the evidence or leaves the board.

## The screenshot gate

Every new or reworked page ends at one question, with the two screenshots side by side: **would this
hold up next to the home page?** If the answer is no, the page is not done, and the round says so
rather than shipping and hoping a later polish pass finds it. A page that skips the gate ships
"incredibly bland and completely paper, best case, initial wireframes" (Will, 2026-08-27) while the
pages that got screenshot-and-iterate loops do not.

## The departure note

Guidance is left on purpose, not by accident. When a board or a track departs from the craft stack,
from a shipped precedent or from a policy, it says so where a reviewer reads it: a board's
`departures`, a track's Handoff. A departure with its cost written down is a finding; the same
departure unmentioned is a regression nobody can tell from a decision.
