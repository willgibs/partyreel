---
track: ready-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-ready/
  - src/lib/events/readiness
  - src/lib/events/visibility-labels.ts
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/[eventId]/page.test.tsx
  - src/components/app/event-feed/launch-list
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/event-feed/event-cards-row.tsx
  - src/components/app/event-feed/checklist
  - src/components/app/event-settings/
  - src/components/app/create-event-wizard
  - src/components/app/share/event-code-door
  - content/help/day-of-checklist-for-hosts.mdx
  - docs/systems/host-app.md
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-ready.json
  - src/lib/dashboard/next-step.ts
  - src/lib/event/door/words.ts
  - src/components/app/event-card-qr.tsx
  - docs/systems/guest-flow.md
---

# lp/ready-wiring

**Goal.** Wire Will's event-ready picks into production: the readiness checklist at the head of the hub until done, Settings as numbered ticked steps with the code fifth, Create handing off into Settings' first step, and the code's corner mark with a tooltip and a tap; readiness moved into src/lib and the board retired.

## The brief

**Why.** Will answered `event-ready` r1 on 2026-10-02 (`docs/reviews/event-ready.json`):
- `list=head`: the checklist sits at the head of the hub until done.
- `guide=steps`: Settings becomes numbered, ticked rows on a rail, with the code as the fifth step and Next on each page.
- `create=hand`: Create's last screen shows the code, then what's left, then "Get it ready", which leads into Settings' step 1.
- `door=mark`: a corner glyph on the code (a lock, a closed eye, or the waiting count). This overrules the recommended `sign`. His note, verbatim: "I think the mark keeps the header from getting too crowded with text where icons will likely work 99% of the time, and we could add tooltips to clarify on the mark."
- `needs=?` is NOT yours: it moves to a host-dashboard board cut after your merge.

**What to build:**
- **Readiness.** Move `sandbox/event-ready/readiness.ts` and its 13 tests to `src/lib/events/readiness.ts`; it imports only production modules. Ready is never stored and never shown to a guest.
- **The checklist.** Build it from the board's `checklist.tsx` at the head of `dashboard/[eventId]/page.tsx`. It retires `event-feed/launch-list.tsx`, its test, and the "Before the first photo" line in `event-gallery.tsx`. The Settings card counts what a guest still needs.
- **Settings as steps,** across `event-settings/*` and `settings-pages.ts`.
- **Create's hand-off** in `create-event-wizard.tsx`.
- **The mark,** on the hub's `share/event-code-door.tsx` only, never the dashboard's `EventCardQr`. It carries a tooltip on hover and focus, and on touch a tap shows the same words: never hover alone.
- **Retire the board** by deleting `src/app/(dev)/design/sandbox/event-ready/` once readiness has moved. Its ledger is the Orchestrator's.
- **The Library and help:**
  - `library/compositions/gallery-demos.tsx` points `host-media-grid`'s test at `launch-list.test.tsx`, and its Settings entry follows your change;
  - `composition-demos.tsx` imports the Settings pages;
  - `content/help/day-of-checklist-for-hosts.mdx`;
  - `host-app.md`.

**Boundaries:**
- Don't touch the dashboard page `(app)/dashboard/page.tsx`, `components/app/dashboard/`, `lib/dashboard/`, `event-card*.tsx`, the notification bell or `user-menu.tsx`. A board draws the dashboard next.
- `visibility-labels.ts` is yours tonight; door-wiring reads it.
- Nobody edits `lib/event/door/words.ts`.

**Context, not scope.** Will's broader notes ask to redesign the host dashboard, the event headers and the whole create wizard. Boards for those are cut from the production you leave, so build the picks as clean working versions and draw nothing speculative.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3132`; `pnpm lab:demo --board disposable-mode --base http://localhost:3132` (its drawings import the wizard); the Library's Settings and hub specimens at 1440 and 375 in a headless Chrome of your own (signed-in pages cannot run on localhost: name the hub, Settings, Create and the mark's touch for build 40's red-team in your Handoff).

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
