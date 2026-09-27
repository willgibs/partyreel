---
track: demo-doors
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and is Will's to overrule.

- **The eyebrow's look.** Recommended and built: the house eyebrow register (the uppercase label step, muted, white
  on hover) with the demo link's live dot before it and the learn chevron after it, as one link; no pill. Overrule:
  a pill or chip, or the words without the dot.
- **The modal's words.** Built: the code, "Try our demo event", "Scan the code with your phone to join as a guest
  would, or open it here.", the short link in words (`partyreel.com/demo`, selectable), and one button, "Open the
  demo", in a new tab. No Copy link (the brief asked for the code and the direct link). Overrule: a Copy link beside
  it, or other words.
- **What a desk is.** Built: 640 and up with a fine pointer, the Sheet's own split; a tablet (a coarse pointer at any
  width) opens the demo in a new tab like a phone. Overrule: a tablet gets the modal too.
- **The hero's object keeps its own link.** The brief left `DemoQr` as it is while `hero-card` draws its successor,
  so a press on the object still opens the demo in the same tab; making it a demo door is one line when
  `hero-card`'s object lands. Overrule: make it a door now.
- **The eyebrow costs the home hero 28px at a desk (36 on a phone).** Built: it is the block's first line, so the
  block is re-measured (`hero-stream.ts` `blockH`: 384 at `lg`, 361 at `base`), and on a 720-tall laptop the air
  under the actions scrolls (the whole hero needs 744 there; the test is reshaped with its scar). 780 and taller fit
  whole with their air. Overrule: a smaller eyebrow gap, or the eyebrow at `lg` only.
- **The reel card's noun.** Built: every type's noun reads well ("Everyone's wedding / party / trip / conference
  photos, live as they land."), two lines at 1440 and 375 on all four; the /events hub keeps the plain line, since
  "Everyone's event photos" is the noun padding the line. Overrule: the plain line on every page.
- **The credit.** Built: a band carrying the demo link loses the credit line to it (the home's close asks for both
  and the link wins); a band without a demo line keeps the credit, and it comes back if the demo is ever unset.
- **Analytics.** Built: each door keeps its own `demo_open` source on the press, at a desk and on a phone alike,
  and the modal's own button fires `demo_open` with `source: demo-modal`, so a desk visitor who opens the demo
  from the modal counts once as intent (the door) and once as the open. Overrule: a new event name for the modal
  (the taxonomy is append-only, `events.test.ts`).

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`, "The demo (marketing side)": the doors bullet refined in place
  (`DemoCtaLink` is the live dot and the words, beside the button in five heroes and at a closing band's foot in the
  credit's place; the hero's eyebrow is the block's first line inside `blockH`), and one new bullet: every pointer
  to the demo is a demo door (a real new-tab link; a plain press at a desk opens the one modal), ★ the modal belongs
  to the page, not the door (the nav's pane leaves with its panel), and which pointers are still plain links.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: the demo pointers outside this lane are still plain same-tab links: the home hero's object
  (`cinema-hero.tsx` `DemoQr`, with `hero-card`'s object), the event objects (`events/event-object.tsx`), /how-it-works'
  proof (`how-it-works/demo-door.tsx`) and the footer's phone link (`marketing-footer.tsx`); each is one
  `DemoDoor` (`system/demo-modal/demo-door.tsx`).
- Marketing: the home hero's `axisMin` is solved for the old bare 144px code (72 + 8 over the axis) while the frame
  stands 129 over it at `lg`, so on desk windows under about 773 tall the frame's top runs under the transparent
  header band (the code itself never does); re-solve it with `hero-card`'s object.

## Handoff (replaces the chat report)

- Commits, pushed on `lp/demo-doors` (branched at `ebfb1581`, the cut commit itself): the work `5beb986a`, the
  board's retirement `0acc0832`, and the sync `ce1dd535` (a merge of `origin/launch-prep` at `eeebb5bd`, which
  brought `hero-card` r1; its one conflict was `DESK_ORDER` in `touchpoints.ts`, resolved to `hero-card` standing
  and `reel-story` gone). This manifest's own commit follows and is the head in the chat line.
- Gates, all on the synced tree `ce1dd535`, each on its own exit code (logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/demo-doors/gate-*.log`):
  - `pnpm typecheck`: exit 0.
  - `pnpm lint`: exit 0; 0 errors, the 5 pre-existing warnings, none in a touched file.
  - `pnpm test`: exit 0; 501 files, 5633 tests.
  - `zsh scripts/build-lock.sh pnpm build`: exit 0, no warning in the log.
  - `pnpm lab:smoke --base http://localhost:3133`: 249 checks, 0 failing (the one 500 is `/design/lab/tools/boom`,
    the permanent probe); `/design/lab/reel-story` now 404s.
  - `board: none`, so no `lab:demo`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is the owned paths plus this file, with these named
  exceptions: `hero-stream.ts` (two numbers, `GEO.blockH` at both breakpoints: the eyebrow is the block's first line
  and the block's height is the number its own comment says a copy change must re-measure; the `lg` one had also
  read 323 against a page that measured 356 before the eyebrow), `hero-stream.test.ts` (the `lg` fit, reshaped with
  its scar: a 720 laptop fits the block and gives up its foot's air), `gallery/specimens.generated.json` (derived:
  the collector's output for the Library entries), and the retirement's `touchpoints.ts`, `sandbox/registry.ts`,
  `(shell)/lab/boards.ts` and `sandbox/reel-story/` (named in the brief).
- The items, one line each:
  1. The live dot rides inside `DemoCtaLink` in all its places (`system/demo-cta-link.tsx`, `LiveDot` in
     `demo-modal/demo-door.tsx`): the success dot on the house pulse, paused off screen (`useAmbientPause`, measured:
     the band's dot `paused` while the hero's runs on /reel) and still under reduced motion (`animation-name: none`).
  2. In every closing band carrying the link, it moves to the credit's place, 64px under the buttons (measured on
     `/` at 1440 and 375), and the credit goes (`system/cta-band.tsx`); the home's close no longer shows the credit.
  3. "Try our demo event" over the home hero's headline (`sections/home/cinema-hero.tsx`), a demo door: at 1440x900
     the composition still ends 28px over the fold, at 375x667 25px over it (`home-hero-*.png` in the scratch dir).
  4. One demo modal (`system/demo-modal/`): opened at 1440 from the eyebrow, `DemoCtaLink` (heroes and bands), the
     footer's pile, the nav's pane and "Explore the demo" on `/`, `/reel`, `/features`, `/events/weddings`,
     `/pricing`, `/features/album` and `/contact`: every one opened the card with its code and its link, Escape
     closed it and focus went back to the opener (the nav's pane: to the Features trigger); the scrim closes it;
     "Open the demo" opens a new tab. The code, read off the rendered pixels by the browser's `BarcodeDetector`,
     decodes to `https://partyreel.com/demo`. At 375 (touch) every pointer's tap on those pages is left to the link
     (not prevented, no modal), as are the eyebrow's on an 820 tablet and a Cmd-click at 1440. Console clean on
     every page.
  5. The reel's line (`lib/constants/marketing-voice.ts`): `REEL_LINE` "Everyone's photos, live as they land." on
     the hub's lead door and the related rows (one line at 1440 and 375) and as the /reel heading (two lines at 1440
     and 375); `reelLineFor` on the event pages (two lines at both widths for all four types).
  6. `reel-story` retired (`0acc0832`); its ledger stays for the record.
  7. The Library (`library/marketing/gallery-demos.tsx`): the band's two feet as two specimens, the link's dot, the
     hero's eyebrow in its lede, and a new `DemoDoor` entry with its test (`demo-door.test.tsx`: the door is a real
     new-tab link, opens the modal at a desk, hands focus back on Escape, keeps the modal when the door unmounts,
     leaves a phone's and a modified press alone; `opens.test.ts` holds the rule).
- Verified locally on :3133 with an isolated headless Chrome (the shared Browser pane was busy with another lane's
  :3134), scripts and captures in `/Users/gibby/local/ai/partyreel-wt/_scratch/demo-doors/` (`s2.mjs` every
  pointer desk and phone, `s3.mjs` the nav's pane, a Cmd-click and a tablet, `s5.mjs` the code's decode, the scrim
  and the button). Live was not run: a lane push deploys nothing; every surface here is public marketing with no
  allow-list gate, and the same scripts take the alias once it builds (`BASE=<alias> node s2.mjs`).
- Assets requested from Will: none.
- Board ideas: the nav's Features pane draws the frame in the top 16:9 of a pane stretched to the two-column
  list's height, leaving an empty well under it (production before this lane: `nav-pane-open-1440.png` beside
  `alias-nav-pane-open-1440.png`).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the Questions above, each built as recommended.
- Look at first: the home hero at 1440 (the eyebrow's air to the object and to the headline), then any demo link at
  a desk (the modal), then the nav's Features pane (the modal outliving its panel).
