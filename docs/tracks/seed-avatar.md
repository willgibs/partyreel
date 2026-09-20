---
track: seed-avatar
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8225bc35"          # the launch-prep SHA the branch was cut from
board: seed-avatar      # round one: the seeded default avatar, a deterministic gradient orb until a photo replaces it
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/seed-avatar/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/systems/profiles-social.md
  - src/components/ui/avatar.tsx
  - src/components/social/guest-list.tsx
  - src/components/app/user-menu.tsx
  - src/components/guest/guest-account-menu.tsx
  - src/components/app/account-avatar-form.tsx
  - src/app/(guest)/u/[slug]/page.tsx
  - src/app/(app)/account/page.tsx
  - src/lib/social/cards.ts
  - src/lib/supabase/avatar-storage.ts
  - src/app/theme.css
  - src/app/(dev)/design/sandbox/profile-page/spec.ts
  - src/app/(dev)/design/sandbox/profile-page/fixtures.ts
---

# lp/seed-avatar

**Goal.** Round one of the seeded default avatar, Will's ask by name (2026-09-19, verbatim in `docs/design/rulings.md`):
"A while back, Vercel introduced seed-generated dither avatars, which made new accounts feel way cooler than something
generic. I'd like you to explore https://www.hashvatar.com/ ... so that we can bake our own version into the app for new
accounts until a new avatar is uploaded to replace. I noticed that with both our guest lists and default dashboard,
without avatars/color it feels very bland. This would immediately bring life to all avatar components, without a generic
one being repeated for every new account. Guest lists would feel rich and diverse, even without any custom avatars
uploaded. I like the gradient over dither for our purposes." Today every account without a photo is one letter on
`bg-muted` (`ui/avatar.tsx`'s `AvatarFallback`), on the guest list, the faces row, the dashboard's user menu, the guest
account menu, the account page and the profile's identity row. Research first, then decisions: pull the hashvatar package
into your scratch directory (`npm pack hashvatar`, read its source and README; the site and the GitHub repo too) and learn
its gradient mode exactly (how the string is hashed, how the hue and the four oklch colours derive from it, where the light
source sits, what `animated` does, what `tones` constrains). Then write OUR OWN generator in the board directory, credited
to hashvatar (MIT) in a comment, with zero dependencies and NO canvas: pure functions (`seed -> hue -> palette`) and one
renderer that works in a Server Component (an inline SVG with a radial gradient, or a CSS background), so the guest list,
a server component, can draw it; the wiring lane promotes it into `AvatarFallback`. Draw every option on the REAL avatar
surfaces with the `profile-page` board's 24-name cast (five with a photo, the rest seeded), phone first at 375 with 1440
on the knob. Six to eight decisions; recut them if the drawings argue otherwise:

1. `look`: the orb (one hue, a radial light source, hashvatar's gradient mode); a two-hue diagonal (Vercel's); an aurora
   blend of two hues in the Aurora's own register (seam, throw); the orb with the initial over it. Gradient, never dither
   (his steer).
2. `letter`: the initial stays over the orb at every size; the orb alone; the initial only from 40 px up where it can read.
3. `seed`: the colour derives from the account id (stable across renames, never a leak); from the display name (a person
   can tune their colour by renaming, and a rename changes them everywhere); for an uploader without an account, the
   guest row's id. Never the email or anything private (`profiles-social.md`).
4. `palette`: the full hue wheel with lightness and chroma clamped so every orb reads on the dark ground AND on paper
   (against the ring `after:border-border` and the letter); a curated set of hues; the album's own sampled palette
   (drawn to show the coupling it costs).
5. `motion`: none (avatars are chrome; the motion budget); a slow drift on the profile's own page only; a drift on hover.
6. `after-upload`: the photo replaces the orb whole; the orb persists as the ring behind the photo (the account's colour
   as identity); the orb as the loading state until the presigned photo lands (the profile's cards paint black for
   seconds today, ROADMAP).
7. `the-crowd`, the proof: the faces row and the wrapping chips at 375 and 1440 with 24 seeded guests against today's
   grey letters, with the number of distinct hues and the lowest contrast measured in the frame.

**Binds.** The bible (bible 1, media is the colour: an avatar is a person's colour, not the chrome's; bible 7; no
em-dashes); the `Avatar` contract (`sm` 24, `default` 32, `lg` 40, the ring); the privacy doctrine (nothing private in a
seed); zero dependencies and no canvas (server-renderable); `defineExploration` with one question per decision and every
option drawn on the real surface; the reading budget (`pnpm lab:smoke`); every step's options changing its stage (`pnpm
lab:demo --board seed-avatar`); the registration exception: this lane adds ONLY its own board's lines at the HEAD of
`sandbox/registry.ts`'s registration list, `(shell)/lab/boards.ts`, the `SandboxId` union AND `DESK_ORDER` in
`src/app/(dev)/design/touchpoints.ts` (the Orchestrator moves the id into its leverage place at the merge), plus its
RULINGS row, and nothing else in those files. A generator test beside the board (`// @contract-for:` the generator file):
the same seed gives the same colours; a thousand seeds spread over the wheel; every colour clears a contrast floor against
the ring and the letter at every size.

**Verify on.** The board at 375 and 1440 with reduced motion honoured, `pnpm lab:smoke --base http://localhost:3131`
whole, `pnpm lab:demo --board seed-avatar --base http://localhost:3131` pressing every step; the gate (`pnpm design:rules`,
the specimen collector, typecheck, lint with the 8 known warnings, test, build) each on its own exit code;
`DESIGN_PREVIEW_KEY` in the environment, never on a command line. Lab-only: no production byte.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **Two of the goal's suggested options were recut, and the recuts are on the board.** `look`'s fourth
  ("the orb with the initial over it") is the `letter` decision, so offering it twice would ask one question in two
  places; it became `flat` (one hue, no gradient), the option that tests whether shading earns its place at all.
  `palette`'s third ("the album's own sampled palette") was cut because it couples a PERSON's colour to an EVENT
  they uploaded to, which breaks the one-colour-per-person invariant the other six decisions rest on, and because
  `--brand` is ink (achromatic), so there is no brand hue to anchor to; it became "one warm arc". **Recommended:**
  keep both recuts; if Will wants the sampled palette it is a second round, not an option here.
- **`the-crowd` became a decision rather than the proof.** The goal describes it as a frame to look at, and an
  exploration has no shape for a question with no winner, so it asks a real one (how much of a guest list carries
  colour: everyone, the row only, or everyone softer inside the list) and the proof is its frame plus the measured
  caption. **Recommended:** keep it as a decision.
- **The 64px account control and the 80px identity row are outside the `Avatar` contract's three sizes.** They draw
  their own disc today (a plain `<img>` with no fallback behind it), which is why `after-upload`'s `under` option
  reaches them and `replace` cannot. **Recommended:** the wiring lane gives `AvatarFallback` the orb and hands those
  two surfaces `background()` directly rather than growing a fourth `Avatar` size for two callers.
- **The initial at 24px renders at 12px, not 10.** `guest-list.tsx` passes `text-[10px]` and `AvatarFallback`'s own
  `group-data-[size=sm]/avatar:text-xs` wins the variant, so the shipped chip already draws 12px. The board
  reproduces the shipped conflict rather than fixing it, and the frame's caption measures it. **Recommended:** if
  `letter` is ruled in, the wiring lane decides 10 or 12 once, in `avatar.tsx`, for every caller.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (lab-only)

## Deferred (ROADMAP one-liners, bucket named)

- The lab: a staged step reached directly reads "step 112 of 111" (`step.tsx`, `n = walk.indexOf(step) + 1` falls
  back to `walk.length + 1` for a step the walk skips). Pre-existing and not this lane's: `site-chrome.foot-alone`
  shows the same number today. A reviewer walking normally never sees it.
- The lab: two decisions sharing a `configs` control silently broke option presses as well as drawing the knob
  twice, and only the second symptom is written down (`profile-page`'s "one knob per id"). Worth a line in
  `components/lab/traps.ts` so the next board does not find it by capture.

## Handoff (replaces the chat report)

- Head `0a7536e2` (the board) with this manifest on top, pushed to `lp/seed-avatar`; `origin/launch-prep` had not
  moved (still `26ac720d`), so nothing was merged in. The branch was cut from `26ac720d`, one
  docs-only commit past the `cut:` above, which the Orchestrator wrote before that commit landed.
- Gates, each on its own exit code: `pnpm design:rules` ok · specimen collector ok · `pnpm typecheck` ok ·
  `pnpm lint` ok (8 known warnings, none in this lane) · `pnpm test` ok (2667 in 254 files, 13 of them the
  generator's contract) · `pnpm build` ok (255 pages) · `pnpm lab:smoke --base http://localhost:3131` ok
  (the board reads 405 words against the 1200 budget; every one of the seven steps 200) ·
  `pnpm lab:demo --board seed-avatar --base http://localhost:3131` ok (7 steps, 0 failing, every step's stage
  moving 12 to 23 percent between options).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is the eight files under
  `src/app/(dev)/design/sandbox/seed-avatar/`, this manifest, and four registration lines only:
  `sandbox/registry.ts` (import + head of REGISTERED), `(shell)/lab/boards.ts` (import + head of
  BOARD_COMPONENTS), `touchpoints.ts` (the `RulingId` member, the `SandboxId` member, the head of `DESK_ORDER`
  and the RULINGS row spliced directly after `site-chrome`'s), and `docs/design/library.md`, which is generated
  by `pnpm design:rules` and fails `rules-registry.test.ts` if it is left stale.
- **What hashvatar's gradient mode does, in five lines.** (1) FNV-1a over the lowercased, trimmed string, then
  mulberry32 on that one integer for a stream of uniform floats. (2) Twelve floats become four OKLCH colours that
  all share ONE hue (`seeds[0] * 360`): a LIGHT primary (L 0.55 to 0.77, C 0.18 to 0.36) and three dark secondaries
  (L 0.18 to 0.38), chroma clamped flat at 0.37. (3) A canvas is filled with the light primary, then six hard-coded
  polygons are each translated by up to 17.5 percent, rotated up to 0.6 pi, scaled 0.85 to 1.35, blurred by 21
  percent of the size and composited back with per-layer `overlay` and `soft-light`. (4) There is NO light source:
  the highlight is wherever the base shows between the blobs. (5) `animated` is a `requestAnimationFrame` loop
  rotating every layer at 0.45 to 0.65 rad/s, drifting it sinusoidally by 18 percent and pulsing its scale by 15,
  forever; `tones` restricts each colour to a given tone's hue plus or minus 30 degrees and floors its chroma.
- **What ours keeps and changes.** Keeps the hash (FNV-1a into mulberry32), OKLCH, and one base hue per identity.
  Changes five things, each forced: no canvas and no dependency (one CSS `background-image` string, so the guest
  list stays a Server Component); the lightness FITTED by two bisections into the window where a near-white initial
  clears 4.5:1 and the disc clears 3:1 on paper AND ink, instead of hashvatar's light body that no letter can sit
  on; the chroma gamut-clamped at the real hue and lightness instead of a flat 0.37 that gets channel-clipped on the
  way out; the light source PLACED in the upper third and off the centre, because an emergent one is mud at 24px;
  no animation by default, and when `motion` asks for one it is a CSS keyframe on `background-position` that
  `prefers-reduced-motion` stops dead. `tones` became `palette`, which restricts the wheel rather than tinting one
  avatar, because the question a crowd asks is how far apart two strangers should be.
- **The decisions, one line each.**
  - `look`: what shape the colour takes (a lit sphere, two hues on a diagonal, two hues over a ground, one flat
    colour). Recommended **a lit sphere**: the only one of the four still reading as an object at 24px, which the
    captures bear out (the diagonal and the aurora both go muddy in the chips).
  - `the-crowd`: how much of a guest list carries colour (everyone, the row only, everyone softer in the list).
    Recommended **every guest, full colour**: his complaint was about the list, and answering only the row leaves it
    standing. The frame measures 19 distinct colours across 24 seeded discs against today's one.
  - `palette`: how far apart two strangers' colours sit (the whole wheel, twelve chosen hues, one warm arc).
    Recommended **the whole wheel**: twelve hues over twenty-four guests repeats every colour about twice, which
    reads as a pattern rather than as people.
  - `letter`: whether the initial stays over the colour (every size, never, from 40px up). Recommended **every
    size**: a colour distinguishes two people but identifies neither, and the faces row carries no name at all.
  - `seed`: what the colour derives from (the account id, the display name, the handle). Recommended **the account
    id**: a colour that moves when somebody fixes a typo is not an identity colour, and the frame draws exactly that
    (one person at three moments, the colour jumping under `name` and holding under `account`).
  - `after-upload`: what the colour does once a photograph lands (replaced, a rim, waiting underneath). Recommended
    **waiting underneath**: free, invisible once the photo paints, and the only option that reaches the two surfaces
    with no fallback behind them, which show an empty disc today while a presign is in flight.
  - `motion`: whether a seeded avatar ever moves (never, a drift on a profile only, under a cursor). Recommended
    **never**: two dozen breathing discs under a wall of photographs is the inverse of the media carrying the room.
- **One line asked of another lane, with the exact patch.** `gradient.test.ts` opens with
  `// @contract-for-pending:` rather than `// @contract-for:`, because a live marker indexes the file and
  `gallery.test.ts` then demands a `for` line in `rules/component-notes.ts`, which belongs to the lab-rules lane.
  The tests run either way. To publish the contract: strip `-pending` from that one line and add to
  `src/app/(dev)/design/rules/component-notes.ts`, beside the `sandbox/registry.ts` entry:
  `"src/app/(dev)/design/sandbox/seed-avatar/gradient.ts": { for: "a string in, a deterministic OKLCH orb out: the seeded default avatar, fitted to a contrast floor under the letter and against both grounds" },`
  then `pnpm design:rules`.
- Assets requested from Will: none. Nothing new was drawn: the five photographs in the cast are `profile-page`'s
  own marketing stills, square-cropped exactly as the shipped surfaces crop a real avatar.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Lab-only, not one production byte.
- Look at first: **`the-crowd` at 375** against the grey strip in the same frame, then **`look`** at 24px rather
  than at 80. Everything else on the board rides on those two.
- Captures, one per option at 375 and read against its words:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/seed-avatar/shots/`
  (22 PNGs, the step names in the filenames). 1440 was read by hand in the browser, at the board page and at the
  shape, crowd and initial steps.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of the seeded default avatar went on the desk as seven
decisions, Will's ask by name. hashvatar's gradient mode was pulled apart (FNV-1a into mulberry32, one OKLCH hue per
identity, six blurred polygons on a canvas, a rAF loop) and rebuilt as ours: one pure function from a string to a CSS
`background-image`, zero dependencies, no canvas, renderable in a Server Component, credited to hashvatar in the file.
Its lightness is fitted by bisection into the window where a near-white initial clears 4.5:1 and the disc clears 3:1
on both page grounds, its chroma is gamut-clamped at the hue and lightness it will really be painted at, and a
contract test holds a thousand seeds to those floors, to determinism and to a filled wheel. Every option was drawn on
the real avatar surfaces with `profile-page`'s own twenty-four guests, today's grey in the same frame, and the board
declared its screen knob once, which turned out to be what made the option presses register at all.
