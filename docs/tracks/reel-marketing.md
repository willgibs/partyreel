---
track: reel-marketing
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/home/cinema-close.tsx
  - src/components/marketing/sections/home/reel-teaser.tsx
  - src/components/marketing/sections/shared/
  - src/components/marketing/sections/events/event-door
  - src/components/marketing/sections/features/shared/feature-door
  - src/components/marketing/sections/reel/reel-hero.tsx
  - src/components/marketing/system/demo-cta-link.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/system/cta-band.tsx
  - src/components/marketing/chrome/footer-demo.tsx
  - src/components/marketing/chrome/footer-contract.test.ts
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/lib/constants/marketing-voice.ts
  - src/lib/constants/marketing-media.ts
  - src/app/not-found.tsx
  - public/marketing/
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/(shell)/library/marketing/
  - docs/systems/marketing-content.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-story.json
  - src/app/(dev)/design/sandbox/reel-story/
  - docs/ASSETS.md
  - docs/systems/design-system.md
  - src/app/(marketing)/marketing.css
---

# lp/reel-marketing

**Goal.** `reel-story` r2's four answers built the way Will's notes shape them (the home close's invitation, the reel's line, the event pages' reel as the demo door's still twin, the teaser's contained player), plus the footer's photo stack back, the demo link standing alone in all 19 places, and marketing's content made for each section's point, never the demo's by default.

## The brief

**The answers** (`docs/reviews/reel-story.json`, r2). Each option is drawn in `src/app/(dev)/design/sandbox/reel-story/`; a board lane is re-cutting it for r3 now, so read it at your cut.

- **`close=starts`:** the home close's heading, line and buttons (`src/components/marketing/sections/home/cinema-close.tsx`, which stops reading the shared thesis constant): "Your next event starts here.", with free to host and one scan for guests under it (the drawing's words).
- **`card=as-it-happens`:** "Your event, playing as it happens."
  - Where: the reel door's line at both sizes (its chip becomes the view's resting bar, with no length) and the /reel hero's heading (`sections/features/shared/feature-door.tsx`, `sections/reel/reel-hero.tsx`, `src/lib/constants/marketing-voice.ts`).
  - His note: "Could use a few better options though. The 'everyone's photos... live' and 'every new photo joins' from the other options also added value beyond this version's 'Your event', which is less clear."
  - r3 draws better lines; this ships as the working line.
- **`wall=pair`:** on every event type page, the reel stands beside the demo door as the door's twin card, with its corner, ring, floor and height (`sections/events/event-door.tsx`).
  - His note: "the motion in both cancels each other out, and I prefer the river. Maybe the reel card adds secondary info more statically (maybe a really cool bg image) rather than fighting the river demo card for attention."
  - So the twin card is STILL: a strong image, the words on its floor, and a way to watch (never autoplay). The river is the page's only motion.
  - Use the best stand-in in the media registry (`src/lib/constants/marketing-media.ts`), and ask for the real image in the Handoff: per type if the type pages want their own.
- **`play=modal`** (overruling `overlay`): the home teaser's play mark (`sections/home/reel-teaser.tsx`, today an in-place `InlineReelPlayer`) opens a contained landscape player.
  - Its shape: a panel over the dimmed page, with a caption and Start free, small on a phone; closing it returns to the teaser.
  - The hero's "Watch a sample reel" already opens such a player (`sections/shared/sample-reel-overlay.lazy.tsx`), so one player for both is the likely shape.
  - The film is made for this section (the principle below). `hero-candidate-02`, a stock-clip render and not demo content, is the stand-in; ask for the real film in the Handoff.

**His notes on the album + QR art** (`DemoFrame`, `src/components/marketing/system/demo-ticket.tsx`): it replaced every instance, and he wants the three handled separately.
- **The footer:** "swap back in the old version": `FooterDemo` as it was at `d1f38489` (`git show d1f38489:src/components/marketing/chrome/footer-demo.tsx`): four photos under a QR plate, fanning out on hover.
  - Its CSS recipe (`.mkt-stack`, `.mkt-stack-card`) still lives in `src/app/(marketing)/marketing.css`, the Orchestrator's file; if the recipe needs a change, name it in the Handoff.
  - The footer also renders on the root 404, where `marketing.css` never loads.
  - Stale comments sit at `src/app/not-found.tsx:70` and `footer-contract.test.ts:73`.
  - `site-chrome`'s open `foot-after` question describes the footer as one framed photograph. Update its context, its `today` option and the board's own footer drawing (`foot.tsx`, `chrome.tsx`) to the restored stack, every option kept.
- **Beside the demo link:** "It looks really silly here beside the 'Try the live demo...' CTA link. Would like something totally new here (or nothing at all beside the link)."
  - His call in chat (2026-09-27): the link stands alone in all 19 places it shows while r3 explores something new.
  - The 19: `DemoCtaLink` (`system/demo-cta-link.tsx`) in 14 closing bands through `cta-band.tsx`'s `demoLink`, and in 5 page heroes.
  - Keep the Library's mounts honest (`src/app/(dev)/design/(shell)/library/marketing/gallery-demos.tsx`).
- **The home hero:** "needs a ton of work to feel more polished". That is r3's question: the hero keeps `DemoFrame` untouched here, and so does the nav's `size="nav"` pane.

**The principle, his words on `play`:** "We don't need to lean super hard into making our demo cohesive across every marketing surface when referenced. The demo is meant to be an experience within itself, but I'm disliking how much we're leaning on it specifically for all of our content as opposed to using more customized content at each point to really nail our goal... If we're putting feature demos in front of them to understand the product, they don't care all the demos don't track back to one universal dataset."
- Synthesize it into `docs/systems/marketing-content.md` where content sources are decided. The lines near :109, :116, :312 and :319 state the demo's place and one `DemoFrame` per door: reconcile them, with the demo staying a real experience a visitor opens on purpose.
- Where the opposite idea came from: "made by Partyreel's own creator from the demo album" was an Orchestrator's rewording of his round-1 note, "a custom clipped short looped video" (`docs/reviews/reel-story.json:25` against `:59`). It spread into `docs/ASSETS.md` row 1, which parks the hero film on it. Say in the Handoff how row 1 should read now; the Orchestrator writes ASSETS.

**Assets** go in the Handoff as slots, never the picture (where, size, aspect, crops, where the type sits), for the Higgsfield month.

**Verify:**
- every touched marketing page at 375 and 1440: the home, /reel, a type page, and the footer on a marketing page and on the 404;
- the console clean;
- the contract tests reshaped with their scars;
- `pnpm lab:smoke` whole.

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
