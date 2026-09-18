---
track: cursor-backdrop
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ef044ee8"         # the launch-prep SHA the branch was cut from
board: cursor-backdrop  # round one: full-bleed photograph sections that switch with the cursor
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/cursor-backdrop/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
  - src/app/(dev)/design/sandbox/glass/spec.ts
  - src/components/lab/exploration.ts
  - src/components/marketing/sections/home/index.ts
  - src/components/marketing/sections/home/section-ids.ts
  - src/components/marketing/sections/home/no-app.tsx
  - src/components/marketing/sections/home/cinema-close.tsx
  - src/components/marketing/system/section-light.tsx
  - src/components/marketing/system/paper-chapter.tsx
  - src/components/marketing/sections/home/hero-stream.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-prefers-reduced-motion.ts
---

# lp/cursor-backdrop

**Goal.** Round one of `cursor-backdrop`: full-bleed photograph sections whose photograph SWITCHES with the
cursor, for the marketing site's UI-forward chapters, drawn on the real sections in place. Will's words
(`docs/design/rulings.md`, 2026-09-18 "the privacy hero: none"): "demo 6 of 6
(https://tympanus.net/Development/ImageTrailEffects/index6.html) would be amazing for the marketing site
as well. Rather than leaning on aurora treatments for more UI-forward sections (eg. icon feature cards with
no media visual), we could have full image background sections that switch the image based on cursor
position. This would feel help break up the strictly alternating dark/light chapters and make the page feel
very alive, especially once we begin our higgsfield generations for custom media. This new effect would be
its own exploration as well." The bind on everything you draw: "I think this crisp media motion design is
going to be the foundation of our visual identity."

**The reference, read once** (source github.com/codrops/ImageTrailEffects, `js/demo6.js`; its numbers
calibrate the first options; nothing is copied). A stack of full-bleed photographs, one shown at load; each
time the cursor has travelled 100 px from where the last switch happened, the next photograph in the pool
is placed on top (a rising z-index), offset 100 px toward the direction of horizontal travel, and slides
to rest over 1.2 s (expo-out); nothing fades, the stack simply cycles. The feel is a room whose picture
changes as you move through it.

**What is measured (the tree at the cut).** The home page is chapters alternating cinema (dark) and paper
(light): `section-ids.ts` (`homeSurfaceChunks`) and `PaperChapter` compose it from
`HOME_SECTION_COMPONENTS` (`index.ts`). The Aurora (`section-light.tsx`; `design-system.md` "The Aurora,
and its three forms") lights the UI-forward sections, `no-app.tsx` and `cinema-close.tsx` among them; the
icon feature cards with no media visual are the target, and you name them by reading the sections. Nothing
in production changes this round.

**What the engine is.** One pure module in `sandbox/cursor-backdrop/` (`backdrop-engine.ts` with tests,
the river's shape): a pool, a switch rule, the entering photograph's offset and settle, fed by the pointer.
No new dependency (no GSAP): the Web Animations API or rAF and CSS; `prefers-reduced-motion` honoured with
one still photograph; paused off screen; the pointer listener passive; no layout read per frame. The pool
is preloaded and decoded before the first switch, sized for its section through `next/image` (full-bleed
photographs at 1440 are heavy: measure the weight of five to eight and say what it costs the page).
Photographs come from the site's own pool (`STREAM_FRAMES` in `hero-stream.ts` through `marketingImage`);
the Higgsfield month replaces them later, so an ask names the slot, never the picture; nothing from Codrops
enters the repo (their license forbids as-is reuse, and their photographs are not ours).

**Binds.** Bible 1 (media is the colour), 13, 14, 22; the guidance's boards section (answer first, previews
1:1, dark and light chosen separately, the specimen carries the option's name, a question carries its own
context); `defineExploration` with `gallery-width/spec.ts` as the worked example; the 1,200-word reading
budget; `lab:demo` fails CLIPPED, UNLABELLED and NO DOCK; `docs/PROGRAM.md` "A round returns DECISIONS":
options are never forced apart. The Glass board's recipes (`glass/spec.ts`) are the precedent if copy sits
on a plate over a photograph. Mobbin is encouraged, never required (`guidance.md`).

## What to build (five to seven decisions, each on the real section)

Suggested, yours to recut: **the sections** (which UI-forward sections take a switching backdrop, drawn as
the real section in place, two or three candidates such as `no-app`, the trust strip and the pricing
teaser, with "none, keep the aurora" as an honest option); **the trigger** (travel distance, about 100,
160 and 240 px; POSITION banding, the photograph indexed by the pointer's x across the section so moving
back returns the previous one; or the cards, each owning a photograph its hover brings up); **the
entrance** (a slide from the direction of travel as demo six; a crossfade; a hard cut with a settle);
**legibility** (the copy over the photograph: a scrim gradient; a glass plate for the copy; a half-bleed,
the copy on its ground beside the photograph); **the chapter rhythm** (where such a section sits in the
dark/light alternation: replacing a dark chapter's aurora, replacing a paper chapter, inserted between;
shown on a chapter strip of the whole home page at reduced scale PLUS the real section 1:1); **at a phone**
(no cursor: switch on scroll progress through the section; a slow cycle on its own; on tap; one still).
Dark and light are asked SEPARATELY where the ground matters (a photograph backdrop inside a paper chapter
and inside a cinema chapter). Every option is previewed at true size with the pointer SIMULATED for the
capture and for `lab:demo` (a scripted pointer path); the desk gets the live pointer.

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3136`,
  `pnpm lab:demo --board cursor-backdrop --key <key>` (0 failing).
- Measured: the board at 1440 and 375, dark and light; reduced motion (one still); JavaScript off (the
  section stands on its first photograph); the frame cost (a 4x CPU throttle, dropped frames counted); the
  decoded weight of the pool; paused when scrolled away; the copy's contrast over every photograph in the
  pool, not only the first.
- A capture of every option beside its words at 1440 and 375, the picture checked against the words. The
  desk in a real browser, never only the headless capture (headless fires before the animation).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
