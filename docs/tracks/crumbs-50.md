---
track: crumbs-50
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "31100a38"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/why-an-event-asks-for-your-email.mdx
  - content/blog/
  - src/components/marketing/chrome/
  - src/components/marketing/system/section-shell
  - src/components/marketing/sections/features/qr/print-shop
  - src/components/marketing/sections/home/live-demo
  - src/components/marketing/sections/features/album/album-fill-fixtures
  - src/components/marketing/sections/careers/
  - src/components/marketing/sections/events/
  - src/components/marketing/sections/how-it-works/
  - src/components/marketing/sections/pricing/
  - src/components/marketing/mdx
  - src/components/marketing/legal/
  - src/components/auth/email-sign-in
  - src/lib/constants/marketing-nav
  - src/lib/content/blog-tags
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/crumbs-50

**Goal.** Off-round crumbs from the ROADMAP, none on a surface this round rewires: marketing's stray preloads, demo pointers, type steps, tokens and dead fixtures, the help's last stale door line, the legal pages' print, prose's inline code, the sign-in step's waiting cue, the nav's one source and the blog's tags.

## The brief

**Why.** Small, verified ROADMAP lines (each quoted in `docs/ROADMAP.md`; retire each you finish by naming it in your Handoff, never by editing the ROADMAP, which is the Orchestrator's). None sits on a surface round 12 rewires (the heads, the dashboard, the door, disposable mode, Create, the home hero, the atoms): stay inside `owns`.

1. **Help:** `why-an-event-asks-for-your-email.mdx` still says "behind the welcome screen" (lines 22 and 48); the welcome is the doorway's page now (as `crumbs-49` did for three other articles).
2. **Marketing preloads:** every marketing page but the home preloads the home's three sheets (the hero's, the river's, the backdrop's) and never draws them, from the header logo's viewport prefetch of `/`. Fix it at its cause in the marketing chrome, measured on `next start` before and after (the guest header's same prefetch on `/e/` pages is `header-wiring`'s file: name it in your Handoff, do not touch it).
3. **The Event Pass ticket's "≈"** wraps onto a line of its own at 1440 (about 56px of text in the stat's cell).
4. **The sign-in email step pressed before hydration** is safe but says nothing: a waiting cue on its button. (Where a signed-out press on /pricing's Get Pro returns after sign-in is Will's call: leave it.)
5. **Demo pointers still plain same-tab links:** the event objects (`events/event-object.tsx`), /how-it-works' proof (`how-it-works/demo-door.tsx`) and the footer's phone link: each one `DemoDoor` (`system/demo-modal/demo-door.tsx`), as the hero's is.
6. **`SectionShell`'s subhead** carries no size class (16 px inherited) while `PageHero`'s rides the `subhead` step: put it on the ladder.
7. **/qr's pull quote** (`features/qr/print-shop.tsx`) is the last flat `text-3xl` figure, a `font-heading` paragraph the heading scan does not read: give it a step by role.
8. **`live-demo.tsx`'s mock panel** wears a literal `rounded-[14px]`: the token its role calls for.
9. **`HERO_FIXTURES`, `HERO_FRAME_H` and `HERO_SEED_COUNT`** (`album-fill-fixtures.ts`) serve only tests: fold them into the tests or delete them.
10. **`sections/careers/contact-sheet.tsx`** is a photography proof sheet named like a contact surface: rename it.
11. **Inline code in help and blog prose** has no plate (the wrappers set it sans and nothing else): give it the muted plate (the MDX components).
12. **The legal pages carry no print styles** (only the glow engine carries `@media print` and `forced-colors` rules): copy its pattern.
13. **The mega panel** hand-writes a description per event type beside `EVENT_TYPES.teaser`: one source (`marketing-nav.ts`).
14. **The blog's tags:** the family-reunion post carries `parties` while its subject reads as a trip, and `blog-tags.ts` has no `trips` tag; give it one where the posts call for it.

Each fix stands on a test where one can hold it (the policies under `src/components/marketing/` and `src/lib/content/` are the house style: red on the old code first where it is a rule). Will's standard for every surface: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." System doc: name any `marketing-content.md` line that should change in your Handoff (it is unowned this round; the Orchestrator places it).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3134`; the preload fix measured on `next start` (warnings a load on /pricing, /about and /help, before and after); every changed page read in a headless Chrome of your own at 1440 and 375.

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
