---
track: publish-bloom
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "dc4530df"
board: none
owns:
  - src/components/reel/reel-studio.tsx
  - src/components/reel/reel-share-card.tsx
  - src/components/reel/reveal-constants.ts
  - src/components/reel/publish-light.tsx
  - src/components/reel/publish-light.test.tsx
  - src/app/globals.css
  - src/app/(dev)/design/sandbox/glow-moments-variants.tsx
reads:
  - docs/reviews/light.json
  - docs/design/rulings.md
  - src/components/shared/glow.tsx
  - src/components/marketing/system/section-light.tsx
  - src/components/marketing/sections/features/qr/qr-hero.tsx
  - src/app/(dev)/design/(shell)/library/foundations/gallery-demos.tsx
---

# lp/publish-bloom

**Goal.** A wiring round, not an exploration: the moment a host shares a reel joins the Aurora. Today
it is two flat violet box-shadow animations (`rxp-pubglow` breathing INSIDE the studio's reel frame,
`rxp-bloom` riding out of the share card on the host's event page), both decaying to nothing. Will
ruled both halves (`docs/reviews/light.json` round 7; `docs/design/rulings.md`, the 2026-09-17
sections):

- the colour, `publish=house-five`: "Let's keep it consistent with the rest of our glows. Don't need a
  single stray glow color, let's use either our house five or sampled depending on whether it
  "bleeds" from media." He answered house five for this beat, so it is the house five (no `colors`
  prop on the lamp).
- the shape, `item:bloom=keep`, on the card that read: "A one-shot that decays to a base, never to
  nothing, so the object stays lit afterwards. Lands: a resting base under the one-shot, on the
  publish beat and the QR plate. The plate already carries it." So a shared reel RESTS LIT: it looks
  different from a draft for as long as it is shared, and goes dark when the host unshares.
- never on a light ground: "No light ground usage is a decision for now." The studio is always a dark
  room; the share card follows the app's theme, so in light mode it takes NO coloured light and the
  state change (the check, "Shared with guests") carries the moment alone.
- the halo's fence, the same day: "Do not like as a button wrapper, only to light objects from
  behind." The Share BUTTON never wears a glow; the lit object is the reel's frame, or the card.
- the placement law: "custom and bespoke, not a couple of identity components reused everywhere in the
  same way constantly." Compose each of the two for its place; they need not match each other.

What lands:

1. **The studio** (`reel-studio.tsx`): the engine's bloom (`<Glow shape="bloom">`, the QR plate's shipped
   recipe in `qr-hero.tsx` is the reference) BEHIND the reel's frame, never over the media: a host is
   judging their reel's look in this room, so nothing may tint it at rest. Mounted while
   `publish.shared`; the swell plays at the moment of sharing in this session and NOT on every open of
   an already-shared reel (the engine arms a bloom on arrival: hold `--glw-strength` at 0 until the
   first share of the session, and the base alone says "this one is live"). The header and the dock
   stay above the light and legible (they are not positioned today, so a positioned lamp paints over
   them unless the stack is fixed). Phones leave 18 to 24 px beside a 9:16 frame: look at 375.
2. **The share card** (`reel-share-card.tsx`): on a dark ground the same light behind the card, resting
   while shared; on a light ground nothing. ONE fence: globals.css already hides `[data-section-light]`
   off dark grounds (`:not(.dark *)`, `.surface-paper`); extend that one rule to the new lamp host
   rather than writing a second copy of it.
3. **The violet leaves**: `@keyframes rxp-bloom`, `@keyframes rxp-pubglow`, their two rules and their
   reduced-motion lines in globals.css. `--tune-rxp-pub-ms` still times the confirmation card (and the
   swell, if the engine's duration can read it without editing the engine).
4. **One shared mount** (`publish-light.tsx`) if and only if the two surfaces really share it; two
   honest call sites beat one component with a mode prop. Its contract test pins FUNCTION only (mounted
   only while shared, no className on the lamp, the lamp before the object in a positioned wrapper,
   fenced off paper, the reduced-motion state is the resting base with no swell, no violet literal left
   in the publish rules). Never pin a look or a number.
5. **The lab's specimen of "today"**: `glow-moments-variants.tsx`'s Publish moment draws the shipped
   violet through `data-rxp-pubglow`, which stops existing. Point it at what ships, or delete that one
   specimen and say so; do not touch the rest of that board.

Not in this round: the engine (`glow.tsx` and its CSS block are read-only; if the bloom cannot do
something this needs, write it under Questions and work around it at the call site), sampled colours,
the reel reveal's other flourishes, anything on the light board.

**Binds.** The bible, the contracts of every component under a path you own, the glow contract
(`src/components/shared/glow-contract.test.ts`, `glow-placement.test.ts`: never an `overflow-hidden`
ancestor clipping a lamp, never a className on `<Glow>`), and the policies. `src/app/globals.css` is
released to this lane for the round for the publish block and the one fence rule ONLY; every other
line of it is the Orchestrator's.
**Verify on.** Localhost cannot sign in, and both surfaces are behind sign-in: never type a password or
an OTP, and never click a Copy button in the shared browser pane. So: the state logic under jsdom
(`publish-light.test.tsx` or the studio's own test), the look on a specimen you can reach (the
glow-moments board's Publish moment is the natural one), reduced motion honoured, and the full gate
(`pnpm design:rules` first if a contract test gains a case). The Orchestrator verifies both surfaces
signed in on the `launch-prep` alias after the merge, at 1440 and 375, the card in dark and in light;
"Look at first" is the exact path for that pass. Dev server on port 3131, killed by port
(`lsof -ti tcp:3131 | xargs -I{} kill {}`); your own pane tab, by tabId.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- What landed, one line per surface
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
