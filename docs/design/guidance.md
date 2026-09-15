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
(a workspace opened many times a day, moderation/select switches) stay INSTANT/minimal — never add theater
there; OCCASIONAL surfaces (modals, takeovers, route nav) get standard entrances (≤300ms, custom easing,
`@starting-style`, reduced-motion fallback); RARE/first-time moments (empty states, a first action,
celebrations) can carry real delight. Everything CSS-first + `prefers-reduced-motion`-safe + exits ≤ enters.

**emil-design-eng (the installed skill) is PRIMARY; Hobday's Safe Rules
(anthonyhobday.com/sideprojects/saferules) are a SECONDARY advisory; neither is a bible.**
Synthesis (Phase 2): *adopted* — no pure white surfaces, the elevation contract (no dark shadows,
lighter-is-closer, one depth technique per mode), nested-corner math, muted paired icons,
small-label tracking, the 4px-grid + radius-ratio math. *Already true* — near-black/near-white
extremes, contrast hierarchy, brightness-distinct palette, ~2x horizontal button padding, two
typefaces (mono left the product in the 2026-09-14 sweep), ~70ch prose. *Declined or
deferred with reasons* — saturate-neutrals DECLINED (zero-chroma identity); 12-column grid noted for
the Phase 6 marketing rebuild. **Guest reading-copy rule (NOW REAL, Phase 4):** guest-facing reading
copy is 15-16px (`text-[15px]`/`text-base` on event description, gate prompts, growth cards, entry
sheet rows); dense/structural UI (captions, counters, secondary labels) stays sm/xs. Host/admin keep
14px until their phases.
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

## The screenshot gate

Every new or reworked page ends at one question, with the two screenshots side by side: **would this
hold up next to the home page?** If the answer is no, the page is not done, and the round says so
rather than shipping and hoping a later polish pass finds it. The gate is what the help centre
missed when it shipped "incredibly bland and completely paper, best case, initial wireframes"
(Will, 2026-08-27) while the home page got screenshot-and-iterate loops.

## The departure note

Guidance is left on purpose, not by accident. When a board or a track departs from the craft stack,
from a shipped precedent or from a policy, it says so where a reviewer reads it: a board's
`departures`, a track's Handoff. A departure with its cost written down is a finding; the same
departure unmentioned is a regression nobody can tell from a decision.
