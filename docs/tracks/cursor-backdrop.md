---
track: cursor-backdrop
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9e2a573b"         # the launch-prep SHA the branch was cut from (the stub said ef044ee8; the tip had moved)
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

- **Does the copy over a photograph lose the muted tier?** Measured over every photograph in the pool,
  not the first: the body ladder's muted ink sits at a relative luminance of 0.364, and no treatment
  short of a nearly opaque scrim gets it past 4.5:1 over the brightest one (the pane leaves it at
  2.1:1, a 0.62 scrim at 2.5:1). **Recommended, and built that way:** over media the body copy is the
  full foreground and hierarchy comes from size and weight instead; `half` keeps the muted tier,
  because there the copy is on the section's own ground with nothing behind it. If he wants the tier
  kept, the pane has to go to about 44 percent black and the photograph behind it is mostly gone.
- **One photograph section on the home page, or two?** The board asks which section takes the FIRST
  one. **Recommended:** one for now (chapter 1's `full-quality`), and a second only after he has seen
  the first on the alias: two full-bleed pools on one page double the decode, and the effect's whole
  argument is that it is rare enough to feel like a room rather than a wallpaper.
- **Does the index rail survive?** It is the delight proposed on the `band` option: eight ticks at the
  section's foot, the live one lit, fading in only while the pointer is inside. **Recommended:** keep
  it with `band`, and drop it if `travel` or `cells` wins, since neither is scrubbable and a rail would
  then be a readout of nothing.
- **Does the `glass` ruling bind this pane?** The plate is that board's `frost` recipe with one number
  changed (black 22 percent rather than 12, measured here). **Recommended:** whatever he rules there
  sets the blur, brightness and saturation here too, and the tint stays this board's, because a
  section-scale pane over a changing photograph is a different bet from a pill over a still one.
- **The pane goes edge to edge under 640.** At 375 the inline padding left a 16 px border of
  photograph, which reads as a dark card with a coloured rim rather than a room. **Recommended, and
  built that way:** full width, square sides, the photograph as two bands the pane sits between.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None (lab-only, as expected).

## Deferred (ROADMAP one-liners, bucket named)

- Marketing / media: a full-bleed photograph pool is decode-bound, so the wiring round caps the served
  width and keeps the pool at five or six; at 2880 (a full-bleed section on a 2x laptop) one layer
  decodes at about 22 MB and a pool of eight would be 177 MB of bitmap.
- Marketing / motion: the entering photograph's offset could scale with pointer SPEED, so a slow drift
  barely moves it and a fast sweep throws it across; the engine takes it in one line, banked.
- Marketing / the phone: the `scroll` rule is a scripted path on the board; the wiring round reads the
  section's real scroll progress through the viewport.
- Lab tooling: `pnpm lab:demo --key "$KEY"` prints the key, because pnpm echoes the script's whole
  command line. Run it as `node scripts/lab-demo.mjs` (or `pnpm -s`) until the script reads the key
  from the environment.

## Handoff (replaces the chat report)

**Head:** this manifest's own commit, sitting on the work commits `f140ce81` and `0f2bca55`
and the sync merge `ae0a0e48` (`git merge origin/launch-prep`, never rebased; the
branch was cut at `9e2a573b` and `launch-prep` had moved 21 commits, through milestone-26). The four
registration conflicts were all the same shape and BOTH sides were kept, mine at the head:
`registry.ts` (`CURSOR_BACKDROP`, then `ADMIN`), `boards.ts`, and touchpoints' `RulingId` and
`SandboxId`. `pnpm design:rules` and the specimen collector re-ran after the merge.

**The gate, each on its own exit code, on the synced tree:** `pnpm design:rules` 0 ·
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0
(the 8 known warnings) · `pnpm test` **1** · `pnpm build` 0 · `lab:smoke --base http://localhost:3136`
0 (276 checks, 0 failing; this board reads 791 words of its 1200) · `lab:demo --board cursor-backdrop`
0 (6 steps, 0 failing, every step draws its options).

★ **`pnpm test` is red at the tip and it is not this lane.** One failure:
`record-depth-policy.test.ts`, "the ladders and the dock" CHANGELOG entry is 163 lines over a cap of
160. `git diff origin/launch-prep -- docs/CHANGELOG.md` is empty, so the file is yours exactly as
merged; three lines out of that entry clears it. (The `env-example-parity` failure that was red when
this lane booted is fixed on the tip and passes here.)

**The lane check** (`git diff --name-only origin/launch-prep...HEAD`):

```
docs/design/library.md
docs/tracks/cursor-backdrop.md
src/app/(dev)/design/(shell)/lab/boards.ts
src/app/(dev)/design/sandbox/cursor-backdrop/backdrop-engine.test.ts
src/app/(dev)/design/sandbox/cursor-backdrop/backdrop-engine.ts
src/app/(dev)/design/sandbox/cursor-backdrop/backdrop.tsx
src/app/(dev)/design/sandbox/cursor-backdrop/board.tsx
src/app/(dev)/design/sandbox/cursor-backdrop/cursor-backdrop.css
src/app/(dev)/design/sandbox/cursor-backdrop/sections.tsx
src/app/(dev)/design/sandbox/cursor-backdrop/spec.ts
src/app/(dev)/design/sandbox/cursor-backdrop/strip.tsx
src/app/(dev)/design/sandbox/registry.ts
src/app/(dev)/design/touchpoints.ts
```

Eight files inside `owns`, plus this manifest; three are the registration exception (this board's own lines only, both
sides kept at the merge); `docs/design/library.md` is the artifact `pnpm design:rules` regenerates and
was committed with it. Nothing under `src/components/marketing/` moved: the real sections are
IMPORTED and wrapped, and the one thing a wrapper cannot do from outside (tagging the cards for the
`cells` trigger) is done from outside anyway, by selector, after mount.

**The six decisions, one line each.**

- `section`: which UI-forward section takes the first photograph backdrop: the icon three-up he
  named, the guest ledger that holds the page's only Aurora room-cast, the pricing teaser, or none.
  Recommends `full-quality`.
- `legibility`: how the copy survives eight different photographs: a glass pane, a scrim, or a
  half-bleed with the copy beside it; the `ground` knob moves it between a cinema and a paper chapter.
  Recommends `plate`.
- `trigger`: what switches it: the cursor's position across the section (scrubbable, and what his
  note asks for in words), the reference's travel distance (on a knob at 100 / 180 / 260), or the card
  under the pointer. Recommends `band`.
- `entrance`: how it arrives: a slide from the way you moved, a wipe from that edge, or a hard cut
  with a settle; nothing fades in any of them; the pace is on a knob at 480 / 680 / 1000 ms.
  Recommends `slide`.
- `rhythm`: where it sits in the seven-dark, three-light, five-dark run, on a strip of all fifteen
  sections at their measured shares plus the section at 1:1. Recommends `swap-dark`.
- `phone`: with no cursor: the scroll through the section, a slow cycle, or one still. Recommends
  `scroll`.

**Measured** (Chrome over CDP against the running board on :3136, 2026-09-18; the harness was a
throwaway, nothing installed, the shared browser never touched).

- **The board at 1440 and 375, dark and light.** Section heights, read in the frame per treatment:
  full quality 535 / 647 (pane) / 584 (half) at 1440, 658 / 793 / 942 at 375; the guest ledger 792 /
  904 / 792 and 812 / 952 / 1064; pricing 694 / 806 / 694 and 915 / 1027 / 1028. The board's frames
  carry these numbers and its captions re-read them live.
- **The copy's contrast, over EVERY photograph in the pool.** A blur is a local average, so the pane
  was measured against each photograph's worst 26 px BLOCK rather than its mean: pane 4.9:1 at the
  worst spot and 8.1:1 typical, scrim 5.6:1, half-bleed 18.5:1, all at the full foreground. Four of
  the eight photographs peak at a luminance of 1.0 inside the copy's band, which is why the scrim's
  middle is 0.62 rather than the 0.56 it looks right at, and why the pane's black went to 22 percent.
  On paper the pane's white is 0.60 for the mirror reason: the paper chapter's ink is at 0.003, and a
  photograph with a black region under the words leaves it at 3.7:1 through a 0.42 veil and 7.0:1
  through a 0.60 one.
- **The pool's cost.** 8 photographs, 423 KB over the wire as AVIF, about 17.4 MB decoded while the
  section is on screen. They are served at 700 to 900 px, so a full-bleed section at 1440 upscales
  them 1.6x to 2.1x: the stand-ins are the wrong SHAPE for this effect, not just the wrong pictures.
- **Reduced motion:** one photograph, 1 of 8 layers visible, nothing changed over 1.5 s, no rAF
  running. **Scripting off:** with every inline style stripped (what a no-JS render leaves), exactly 1
  of 8 layers is visible, because the rest state is a CSS rule and not a write.
- **The frame cost** at a 4x CPU throttle: 247 frames in 4.01 s (61.7 a second), 0 frames over 33 ms,
  worst frame 16.8 ms, 0 long tasks. **Paused off screen:** scrolled away, no transform changed.
- **The page's rhythm:** all fifteen sections measured at 1440x900 (11,092 px), which is what the
  chapter strip's bands are drawn from. The hero is `min-h-screen`, so its share moves with the window.

**The asset ask (for `docs/ASSETS.md`).** A new Higgsfield slot: **room frames**, six landscape
photographs at 2880 px wide or more, each with a QUIET middle third and no blown highlight there,
because that band is where the copy sits. They are the pool a photograph section cycles, and they are
the first thing on the site that needs a frame wider than 900. Ask by slot, never by picture.

**Departures, named rather than argued.** (1) A photograph backdrop puts a layer over a photograph,
which the home hero's own argument refuses ("no darkening layer anywhere"); the pane keeps that true
everywhere except behind the words, and the scrim option does not, which is the trade the legibility
question is really about. (2) Over media the body copy leaves the muted tier, so the ladder loses a
step on exactly these sections. Both are his to overrule.

**Look at first:** the `legibility` step at 1440, and flip the ground knob. The pane over the
confetti photograph on cinema and then on paper is the whole idea in two presses; the scrim beside it
is what it costs to darken the picture instead.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Round one of `cursor-backdrop` landed at `<sha>`: six decisions on the shipped home sections, imported
and drawn in place, for the full-bleed photograph backdrop Will asked for after demo six. A pure
engine (`backdrop-engine.ts`, 25 tests) holds the pool, the three switch rules, the three entrances
and the scripted pointer, so a board tile is alive with nobody pointing at it, a real pointer takes it
over the moment one arrives, and the reduced-motion still is one frame of the same run rather than a
special case. The copy's contrast was measured over every photograph rather than the first, and it
changed the design: the body copy leaves the muted tier over media, the pane's black went to 22
percent and the scrim's middle to 0.62. The pool costs 423 KB and 17.4 MB decoded, and the stand-ins
are too small for a full-bleed section, which became the round's asset ask.
