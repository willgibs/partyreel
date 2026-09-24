# The design rule set: what binds, what informs

> **ROLE:** the authority model of everything that influences design work on Partyreel, and the one
> sentence that says what an agent follows by default in an exploration. **BELONGS HERE:** the levels, their
> definitions, where each kind of influence lives. **NOT HERE:** the rules themselves (the bible),
> the craft (`guidance.md`), what shipped (`docs/systems/`). **GROWS BY:** a level is added only by
> Will's ruling, which edits the table below first; the Library renders it at `/design/library`.

## What binds you

The Library holds the working rules: the global ones and each component's own, stated as they stand
today so that new work stays consistent with what is built. They are working guidelines, not hard
rules. While the product is still being built everything is unprotected (the bible's Rising tides rule):
any rule, and any past decision, may be reshaped when a better solution needs it. Follow a rule by
default; reshape one deliberately, and say which and why in your Handoff. The Library hardens only
as the marketing site and the app near their final production state.

Three things hold in every exploration until one is deliberately reshaped: **the bible** (Will's; it
changes only by his word, so a better answer against a rule is a question for him, never a quiet
edit), **the contracts of every component under a path you own** (they guard function, never look;
change one deliberately with its test, never silently), and **the policies** (the tests that hold a
line across the tree; the gate is red without them, and one that blocks better work is reshaped in
the open). Everything else informs: guidance is the default you leave on purpose, precedent is what
shipped and may be rebuilt, a proposal is another board's argument, a ruling is what Will chose for
one component or page, a landmine is a trap. An example inside a rule or a ruling illustrates it; it
is never the rule's text.

Nothing that influences design work lives outside the Library, so nothing guides an agent that Will
cannot see there, and a global rule is kept apart from a component's own so an exploration follows
the fewest. Every component, marketing section and app screen belongs in it with a live preview; one
that is missing is a gap to fill.

## The levels

| level | badge | one line | binds in an exploration? | scope |
| --- | --- | --- | --- | --- |
| law | LAW | The bible: Will's global working rules, changed only by his word. | By default. A better answer against a rule is a question for Will; a rule `under exploration: <your board>` is yours to rewrite; a `retiring` rule is read, not followed. | global |
| contract | CONTRACT | A component's functional guards (a test opening `// @contract-for`), never its look. | For every component under a path you own; change one deliberately with its test, never silently. | component |
| policy | POLICY | An agent-written test that holds a line across the tree (a test opening `// @policy:`). | Mechanically; provisional: one that blocks better work is reshaped in the open. | global, a surface, the lab |
| program | PROGRAM | How a round works: lanes, light QA, unlimited resources, rising tides, nothing protected. | As process. | global, a wave |
| guidance | GUIDANCE | The craft stack and the skills: the default you depart from on purpose. | No; a departure is flagged on the board. | global |
| precedent | PRECEDENT | What shipped and why it is shaped so (the system docs' chapters). | No; rebuild it in a better exploration and say what you broke. | global, a surface |
| proposal | PROPOSAL | A standing board's argument: its asks and recommendations on the desk; not law until Will rules. | No; read the other boards' before you contradict them. | a board |
| ruling | RULING | What Will ruled for one component or page: the rule it holds today, and why. | No; an exploration may reopen one and says so. When a ruling and the bible disagree, the bible is wrong and that is a finding. | a component, a page |
| landmine | ★ | A silent breakage if reverted; never a design decision. | Know it before you touch its surface. | a surface, a component |

## Where everything lives

- The bible: `src/app/(dev)/design/rules/bible.ts` (Will's; changed only by his word).
- Contracts and policies: tests carrying `// @contract-for: <path>` or `// @policy: <scope>`,
  collected by `scripts/design-rules/collect.mjs` into `rules.generated.json`.
- Program rules: `docs/PROGRAM.md` (Program principles) and `docs/tracks/README.md`.
- Guidance: `guidance.md` beside this file (the craft stack, the skills, the standing preferences).
- Precedent: `docs/systems/design-system.md` and `docs/systems/marketing-content.md`.
- Proposals: each standing board's asks at `/design/lab/<board>` (its `spec.ts`); a
  `docs/specs/<board>.md` when a board writes a document of its own.
- Rulings: `RULINGS` in `src/app/(dev)/design/touchpoints.ts`, one row per ruled component or page
  (the rule, why, where it lives), rendered at `/design/library/rules#rulings`; a standing board's
  row says what it asks.
- Landmines: the ★ entries in the two system docs.
- A board's carried calls: it may carry the calls its lane took without Will (`carried`): id,
  question, taken, overrule, drawn above the sections and counted in the reading budget.
- A board's breakpoint utilities: a `<breakpoint>:` utility works in a board only when production
  uses that exact class too; otherwise write the media query in the board's own sheet.
  `/design/lab/sample` draws both.
- The whole set as one document: `library.md` beside this file, generated by `pnpm design:rules`.
