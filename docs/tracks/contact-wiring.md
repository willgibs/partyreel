---
track: contact-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a06f48d8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(marketing)/(paper)/contact/
  - src/lib/constants/contact.ts
  - docs/systems/marketing-content.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/contact-page.json
  - docs/systems/design-system.md
---

# lp/contact-wiring

**Goal.** Wire contact-page r1: the routed form in the desk's chapter, a required topic with its own note and link each, a delightful receipt, and the directory beside the form with icons, a heavier email link and headings.

## The brief

**His r1 answers** (`docs/reviews/contact-page.json`, 2026-09-29), wired now: `reach=routed` (the form leads; the address a fact beside it); `page=chapter` (the dark hero, then the desk's own form and facts opening the paper body; "We'll likely revisit the contact page design later", so build the pick well and invest no further); `topic=required` ("The extra friction may reduce meaningless messages. It also helps us sort into better pipelines in our admin workflows ... Another big win is potentially solving immediately with existing site resources"); `urgency=?` with his answer: "custom per topic instead of one generic 'try troubleshooting'": each topic's note and link under the picker become its own (billing to billing, a problem to its troubleshooting article), a timing line only where it is true; `receipt=card` ("The success state/transition could be much more polished. Design magic opportunity, or at least a small delight opportunity"): the on-page card with a small delight on its arrival (reduced motion honoured); `beside=directory` ("icons instead of numbers, make the email link white/heavier, for a start. The headings seem quite small and thin"): the directory promoted beside the form with icons, the email link heavier, the headings at production's one weight (crumbs-12 made every heading 700). The directory's Press tile: /press folds into /about (his press-page pick), so point it at /about, or drop it if About has no kit yet, and say which.

**Not yours:** the `contact-page` board's folder belongs to `lab-revamp` (stage two, running): leave the board; the Orchestrator retires it at your merge. The AI help chat is banked for later (ROADMAP's support arc); build nothing of it.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
