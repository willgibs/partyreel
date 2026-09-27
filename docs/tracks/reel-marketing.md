---
track: reel-marketing
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "1a455e5f"            # the launch-prep SHA the branch was cut from
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

- **What heads the event pages' reel card?** Recommended and built: the reel's line with the page's own event in it,
  "Your wedding, playing as it happens." (the hub: "Your event, ..."), from `reelLineFor` in `marketing-voice.ts`, so
  a type page says his "Your event" in its own clearer noun and r3's better line carries through the one function.
  The others: the reel's line verbatim on every page, or a line of its own per type (a new `EVENT_TYPES` field).
- **Does the contained player carry a second way on?** Recommended and built: Start free alone. The r2 drawing also
  had "Open the demo album"; his note is that the player "keeps them in the marketing lane, rather than just dropping
  them off in an app demo", and the demo keeps its own labelled doors everywhere else.
- **One still and one film for all the event pages, or one per type?** Recommended: one per type (each type's angle
  names its own screen, and the principle is media made for its place), asked below as five stills and five films;
  built on one shared stand-in until they land. Per type they live in a `reel` slot of `EVENT_TYPES.media`
  (`constants/events.ts`, outside this lane), because `media` is the single home of a per-type photograph.

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`, "The chrome": the footer's invitation is the demo's code on its photo pile
  (was a frame); the root 404's footer carries the pile's box, size and rest pose, the rest pose a layered utility so
  the unlayered recipe's fan still wins on marketing pages.
- "Pages and their single sources", a new head bullet: each section's media is made for its own point, never borrowed
  from the demo; the demo is opened on purpose through its labelled doors; every Watch opens the one contained player.
- `/events`: the proof's reel is the door's still twin, its film behind a press. `/reel`: the hero's heading is
  `REEL_LINE`, the door's line; the home's close keeps its own words.
- "The demo": its doors are three objects, each built for its place (`DemoFrame` on the hero and the Features pane,
  the footer's pile, `DemoCtaLink`'s words), replacing "One `DemoFrame` is every demo door".

## Deferred (ROADMAP one-liners, bucket named)

- Hygiene: `.prettierignore` gains `src/app/(dev)/design/gallery/specimens.generated.json`; `pnpm format` re-flows
  the collector's output into prettier's shape, a thousand lines of churn for any lane that touches a Library
  specimen (this lane re-ran the collector over it instead).
- Marketing: the home teaser's muted loop keeps decoding under the open player; `AmbientReelVideo` could take a
  `paused` prop that `ReelPlayScreen` sets while its player is up.

## Handoff (replaces the chat report)

- **Commits.** Work `4520da30`, pushed to `origin/lp/reel-marketing`; this manifest's commit is the head. No sync:
  launch-prep moved to `8725cb0b` (claims-r2, mine-none and their records), none of its 35 files is in this lane's
  diff, its one touch to a read (`design-system.md`) is the album tile's mark line, and
  `git merge-tree --write-tree 4520da30 origin/launch-prep` is clean.
- **Gates, each on its own exit code, on the tree committed as `4520da30`** (logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/reel-marketing/gate-*.log`): `pnpm typecheck` 0; `pnpm lint` 0 (six
  warnings, none in a touched file); `pnpm test` 0 (484 files, 5479 tests); `zsh scripts/build-lock.sh pnpm build` 0
  (`/`, `/events`, `/features` static, `/events/[slug]` SSG); `pnpm lab:smoke --base http://localhost:3134` 0 (257
  checks); `pnpm lab:demo --board site-chrome --base http://localhost:3134` 0 (three steps, every option moves the
  stage). Port 3134 is free.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths and this file, plus three
  exceptions: `src/app/(dev)/design/gallery/specimens.generated.json` (the Library's derived artifact, regenerated by
  its collector from the owned `gallery-demos.tsx`, which `specimens.test.ts` requires); one comment in
  `sections/home/reel-screen-lamp.tsx` (the lamp's pool holds only the pointer now); one comment in
  `lib/analytics/events.ts` (`reel_play` fires from three openers, two with a `source`).
- **Items.**
  - `close=starts`: `cinema-close.tsx` says "Your next event starts here." over "Free to host, and every guest joins
    with one scan.", its demo line and credit kept; it no longer reads `GOLDEN_LINES`.
  - `card=as-it-happens`: `REEL_LINE` and `reelLineFor` in `marketing-voice.ts`; `feature-door.tsx` says it at both
    sizes (the hub's old long line told the stored render) with the view's resting bar as its chip, no length;
    `reel-hero.tsx` takes it as the heading.
  - `wall=pair`: `event-door.tsx`'s reel is the door's still twin (the corner, ring, floor and, at a desk, the
    door's height: 453px at 1440 on all four types and the hub); the film's poster, the type's line and angle, Watch a
    reel (the contained player) and How the reel works (/reel) on its floor; no player or loop in the section. The
    door says "A real album, open with no sign-up." (one line at 1440, two at 375).
  - `play=modal`: `sample-reel-overlay.lazy.tsx` is the contained player (the floating panel, a 16:9 film, a caption
    and Start free, small on a phone), opened by the hero's Watch a sample reel (`cinema-hero.tsx` unchanged), the
    teaser's play mark and the twin. It moves focus to Close, keeps Tab inside (Close, Start free, the film's toggle,
    Close), locks the page, and on Escape, the scrim or Close returns focus to its opener; Start free lands on
    `/login` with the lock released; it fits unscrolled at 1440x900, 1280x720, 1366x600 and 1024x768 (an 812x375
    phone draws it 325 by 380 and scrolls). New `sections/shared/reel-player.tsx`: `useReelPlayer` portals the player to the nearest
    `[data-mkt]` (a section's held cut transform would pin a fixed layer to the section), and `ReelPlayScreen` is the
    teaser's muted loop under a play mark (poster held under reduced motion with no video bytes, paused offscreen).
  - The teaser (`reel-teaser.tsx`): its stale "Pick a style..." subhead and the fourteen-chip style strip retire; the
    subhead takes the ruled shape; the pointer is See how the reel works, to /reel.
  - The footer: `footer-demo.tsx` is the pile under the plate as at `d1f38489`, its rest pose now layered utilities,
    so the root 404 shows the pile at rest (read there: the four cards at their `--cx/--cy/--rot`, no sideways
    scroll) and marketing pages keep the fan; `not-found.tsx`'s comment is true again (the glow lights there, the fan
    does not); `footer-contract.test.ts` pins it. The "We're hiring" badge wraps under Careers at 375, where it ran
    3.7px past the screen.
  - The demo link stands alone: `demo-cta-link.tsx` drops the frame, in the 14 closing bands and 5 heroes;
    `DemoCtaLink` and `LearnMoreLink` compose `LearnChevron`, the atom's own "one-move cleanup". `DemoFrame` keeps
    `hero`, `heroCompact` and `nav`; its `footer` and `line` sizes retire, so a board still drawing either fails
    typecheck at its merge.
  - `site-chrome` (the open `foot-after`): its context, `today` and the notes read the restored pile and its fork
    speaks the shipped footer's copy; every option kept. `chrome.tsx` needed nothing: its `DemoTicket` is the nav
    pane, which keeps the frame.
  - The Library: the player's entry (updated), a new `reel-player` entry, the reel door's specimen, and honest lines
    for `DemoFrame`, `DemoCtaLink`, `InlineReelPlayer` and the `CtaBand` specimen.
  - Contract tests: `event-door-contract.test.ts` "keeps the reel's twin still, with no film until a press" (its scar
    kept: no bytes before a press; gained: no motion); `footer-contract.test.ts` "keeps the demo pile standing where
    marketing.css never loads".
  - Verified locally (captures in `/Users/gibby/local/ai/partyreel-wt/_scratch/reel-marketing/after/`): the console
    clean, each page scrolled whole, at 1440 on `/`, `/reel`, `/features`, `/features/sharing`, `/events`,
    `/events/weddings`, `/events/trips`, `/about` and `/pricing`, and at 375 on `/`, `/reel`, `/events/weddings` and
    `/features`, with no sideways scroll (bar the dev-only "trail CSS preloaded" warning, which `pnpm start` does not
    show); with the demo token unset, no demo link anywhere, no pile, Start free kept, and the twin alone at its own
    shape (`nodemo/weddings-door-1440.png`). Live waits for the integration's build.
- **Assets requested from Will.**
  - ASSETS row 1 should read: `The home's reel film` · 20 to 30 s made to sell the highlight reel, for the home alone
    (event moments in the reel's own look, fast cuts, 12 to 18 shots, the reel on a room's screen among them; nothing
    needing a face in focus); no type over it: it fills the contained player (896x504 at a desk, the phone's width on
    a phone, a close control top right), and its first seconds loop muted on the teaser's 768x432 screen under a 64px
    play mark at the centre (keep the centre fifth quiet), its bottom edge's colour thrown onto the floor; masters
    1920x1080 and a 1080x1920 crop; muted; an H.264 mp4 under 2.5 MB at 1280x720, a VP9 webm, first-frame posters
    under 120 KB, the cut list, and a seamless 5 to 6 s loop cut from it (1280x720, under 900 KB, its own poster) ·
    a new `MARKETING_REELS` entry of its own, named by `TEASER_REEL_ID` (`reel-teaser.tsx`) and the player's default
    `STAND_IN_REEL_ID` (`sample-reel-overlay.lazy.tsx`); the phone crop replaces `hero-candidate-01` (the /reel
    hero's loop); `hero-candidate-02` stays where other sections still play it · status requested, no longer parked
    on the demo album.
  - The event pages' reel-card stills · five (weddings, parties, conferences, trips, the /events hub), 1600px long
    edge, landscape, one grade, JPG or webp; each survives 403x453 at a desk, 448x448 on a tablet, 343x429 (4:5) on
    a phone and 4:3 alone; the subject in the top 45%, the bottom 55% dark for the floor (a two-line heading, a
    three-line angle and two actions, bottom-left); ideally the reel on that event's own screen, as its angle says ·
    replaces the `hero-candidate-02` poster (`CARD_REEL_ID`, `event-door.tsx`).
  - The event pages' reel films · five (or one shared), 16:9, 15 to 25 s, row 1's formats, each opened from its
    page's card in the contained player · replaces `hero-candidate-02` (`CARD_REEL_ID`).
- **Board ideas.** A landscape phone gets a small, scrolling player (812x375 draws it 325 wide); a landscape
  posture that fills the glass could be drawn once the films land.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule.**
  - The event cards' heading "Your {event}, playing as it happens." (the first Question).
  - Start free alone in the player (the second).
  - One stand-in still and film on every event page until the per-type ones land (the third).
  - The teaser's subhead: "Every guest catches a moment you missed. The album plays them all back as one highlight
    reel while everyone is still there.", no style strip, the pointer to /reel.
  - The player's caption: "Every album plays its own reel." over "It plays from the second photo guests add, on every
    phone and the room's screen, with nothing to edit."
  - The hero's Watch a sample reel opens the same panel, caption and Start free included (one player for every
    Watch).
  - The twin's two actions: Watch a reel, and How the reel works (the link every type page owes /reel).
  - The footer's pile shows its rest pose on the root 404 too (at `d1f38489` the pose rode the recipe alone, which
    never loads there, so the four cards sat under the plate).
- **Look at first.** `/events/weddings` at 1440 and 375, then Watch a reel; `/`'s reel teaser and its play mark,
  its close and the footer's pile; the pile on `/no-such-page`; the reel door on `/features` and the `/reel` heading.
