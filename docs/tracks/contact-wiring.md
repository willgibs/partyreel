---
track: contact-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a06f48d8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(marketing)/(paper)/           # /contact was the group's only page: it moves out, so the group's layout and 404 retire with it
  - src/app/(marketing)/(cinema)/contact/  # the page's new home: a dark hero needs the cinema group's nav (the chapter pick)
  - src/app/(dev)/design/sandbox/contact-page/  # the retired board (the Orchestrator's relay: lab-revamp merged, so this lane removes the folder)
  - src/lib/constants/contact.ts
  - src/lib/constants/contact.test.ts      # the constants' own test follows the hints' new shape
  - docs/systems/marketing-content.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/contact-page.json
  - docs/systems/design-system.md
---

# lp/contact-wiring

**Goal.** Wire contact-page r1: the routed form in the desk's chapter, a required topic with its own note and link each, a delightful receipt, and the directory beside the form with icons, a heavier email link and headings.

## The brief

**His r1 answers** (`docs/reviews/contact-page.json`, 2026-09-29), wired now: `reach=routed` (the form leads; the address a fact beside it); `page=chapter` (the dark hero, then the desk's own form and facts opening the paper body; "We'll likely revisit the contact page design later", so build the pick well and invest no further); `topic=required` ("The extra friction may reduce meaningless messages. It also helps us sort into better pipelines in our admin workflows ... Another big win is potentially solving immediately with existing site resources"); `urgency=?` with his answer: "custom per topic instead of one generic 'try troubleshooting'": each topic's note and link under the picker become its own (billing to billing, a problem to its troubleshooting article), a timing line only where it is true; `receipt=card` ("The success state/transition could be much more polished. Design magic opportunity, or at least a small delight opportunity"): the on-page card with a small delight on its arrival (reduced motion honoured); `beside=directory` ("icons instead of numbers, make the email link white/heavier, for a start. The headings seem quite small and thin"): the directory promoted beside the form with icons, the email link heavier, the headings at production's one weight (crumbs-12 made every heading 700). The directory's Press tile: /press folds into /about (his press-page pick), so point it at /about, or drop it if About has no kit yet, and say which.

**The board retires here** (the Orchestrator's relay after `lab-revamp` stage two merged at `8cb5f21a`, when a board became one folder): `src/app/(dev)/design/sandbox/contact-page/` is `git rm -r`'d in a commit of its own, since its picks are what this lane builds; its ledger `docs/reviews/contact-page.json` stays in `reads` and the Orchestrator deletes it at the record. `loose-ends-wiring` changes one line of `docs/systems/marketing-content.md` (the FAQ fact) as a listed exception: expect that line to move at a sync.

**Not yours:** the AI help chat is banked for later (ROADMAP's support arc); build nothing of it.

## Where I am

Restarted after the first agent hit a usage limit while booting (nothing of its work existed); `origin/launch-prep` fast-forwarded in at `38373a35`. Commits on `lp/contact-wiring`, each with typecheck, lint and the whole test suite green: the board retired (`c46eac80`); the route moved into `(cinema)` under a dark hero and one `PaperChapter`, `(paper)` retired (`3d0afc5c`); each topic names its own answers (`6c7b630e`); the directory beside the form with icons and the heavier address (`0dbe5e1c`); the receipt (`8a6a6b06`). Next, in order: the walks (1440, 768, 375, the palette on the new ground, keyboard, hostile input), `pnpm build` and `pnpm lab:smoke --base http://localhost:3135`, `docs/systems/marketing-content.md` refined in place, the Questions and Handoff below, then `status: handed-off`.

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
