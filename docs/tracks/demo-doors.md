---
track: demo-doors
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d202ed1"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/system/demo-cta-link.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/system/demo-modal
  - src/components/marketing/chrome/footer-demo.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/events/event-door
  - src/components/marketing/sections/features/shared/feature-door
  - src/components/marketing/sections/reel/reel-hero.tsx
  - src/lib/constants/marketing-voice.ts
  - src/app/(dev)/design/(shell)/library/marketing/
  - docs/systems/marketing-content.md
  - src/app/(dev)/design/sandbox/reel-story/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-story.json
  - docs/systems/design-system.md
  - src/components/app/share/event-code-modal.tsx
---

# lp/demo-doors

**Goal.** Every pointer to the demo gets its one door: the live dot inside the demo link, which moves down to the credit line's place in the closing bands; a "Try our demo event" eyebrow over the home hero's heading; and on a desk a demo modal (the direct link, or a code that scans to try it on a phone) behind every demo pointer, a new tab on a phone; plus the reel's new line; then the reel-story board retires.

## The brief

**His answers** (`docs/reviews/reel-story.json`, r3; drawn in `src/app/(dev)/design/sandbox/reel-story/`, which is the spec):
- `beside=live`: the live dot inside the demo link (the album door's "Filling live" dot, breathing on the house pulse, still under reduced motion) in all its places (`system/demo-cta-link.tsx`). His note: "let's replace the 'A Partyreel production · partyreel.com' further down with this link so its a bit more spaced from the 'Start free' primary CTA button." So in every closing band that carries the demo link (`cta-band.tsx`'s `demoLink`), the link moves down to the credit line's place and the credit line goes; a band without the link keeps its credit line (a call his to overrule).
- `line=as-they-land`: "Everyone's photos, live as they land." as the reel door's line at both sizes and the /reel heading (`REEL_LINE`, `reelLineFor` in `src/lib/constants/marketing-voice.ts`; `feature-door.tsx`, `reel-hero.tsx`), and the event pages' reel card through `reelLineFor` where a type's own noun reads well in it (else the plain line; say which).
- `hero=print`: NOT built. His note: the print "is far from perfect, just inspired a better idea": a new board, `hero-card`, is drawing the hero's object now (a compact album card with the code baked in as a visual). Leave the hero's object (`DemoQr`, `DemoFrame` in `demo-ticket.tsx`) as it is.

**His new idea, in chat (2026-09-27), built here:** "an eyebrow over the H1 that says 'Try our demo event' and when clicked, opens a modal (on desktop) to allow for either direct link access or a scannable QR to try on their phone. On mobile, it'd simply open in a new tab. This modal could be helpful everywhere we point to our demo event on desktop."
- The eyebrow over the home hero's H1 (`sections/home/cinema-hero.tsx`).
- One demo modal (a new `system/demo-modal`) in the code card's family (his `popups` share answer: `src/components/app/share/event-code-modal.tsx` is the card; read it, do not edit it): the demo's code, sized to scan at its size (the short `/demo` link keeps the modules few), and the direct link to open the demo (in a new tab). On a desk every demo pointer opens it: the eyebrow, `DemoCtaLink` in its 19 places, the footer's pile (`chrome/footer-demo.tsx`), the nav pane (`chrome/mega-panel.tsx`), the event pages' "Explore the demo" (`sections/events/event-door.tsx`); on a phone (below the desk breakpoint, or a coarse pointer) the same pointers open the demo in a new tab. Keyboard: focus into the modal, Escape and the scrim close it, focus returns to its opener.
- The modal is a popup: `popups-wiring` is building the kinds' table in `src/components/ui/` now; build the modal on the Dialog as it stands and name its kind in a comment for the table to take.

**Then retire `reel-story`** (its three rounds built or moved: the hero's question is `hero-card`'s now), one commit (its folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`; named exceptions). `marketing-content.md` is yours: the demo's doors now open one modal on a desk and a new tab on a phone. Keep the Library's mounts honest.

**Verify:** `/`, `/reel`, `/features`, `/events/weddings`, `/pricing` and a feature page at 1440 and 375 (the eyebrow, the dot, the link in the credit's place, the modal from each pointer at 1440 with its code scanning, a new tab at 375), page-console clean, the contract tests reshaped with their scars; `pnpm lab:smoke` whole.

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
