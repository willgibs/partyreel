# Design system: identity, tokens, motion

> ROLE: the visual system in force: token contracts, type, rounding, elevation, motion, state
> colors, and the error taxonomy's UX contract.
> BELONGS HERE: what the system IS + its invariants + don't-reverts. · NOT HERE: how it was chosen
> (→ the design lab + [`../design/rulings.md`](../design/rulings.md)), the craft
> defaults (→ [`../design/guidance.md`](../design/guidance.md)), per-surface redesigns (each
> surface's own doc), shipping narrative (→ [`../CHANGELOG.md`](../CHANGELOG.md)).
> GROWS BY: edit-in-place as tokens/rules evolve; the lab (`/design`) stays the experimentation
> venue, this doc records what's ratified.

**The design law is the bible on `/design/library/rules`** (22 rules, Will's; source
`src/app/(dev)/design/rules/bible.ts`) **plus each component's contract** (a test tagged
`@contract-for`, shown on the component's library row). This doc is the machinery and the scars: how
the system works, and the landmines (★) that break silently when reverted. A ★ is never a rule, and a
decision recorded here is precedent, not law (Will, 2026-09-12).

## What it is

The production tokens in [`src/app/globals.css`](../../src/app/globals.css), the crafted primitives
across `src/components/ui/*`, and the error taxonomy in
[`src/lib/errors/`](../../src/lib/errors). The lab is two things and never a third: a **LIBRARY** of
production imports (the reference pages render the real components and tokens, synced by
construction; `/design/library/marketing` renders the marketing system on the cinema skin; the index
is below) and a **WORKSHOP** that is empty by default (`sandbox/` holds only the boards whose ruling
is still open). Prototype and compare there; when a ruling lands, the RULE moves here (or to its
surface doc), Will's words go to [`docs/design/rulings.md`](../design/rulings.md), and the board is
deleted (git keeps it). The thin registry the lab reads is `touchpoints.ts` (`RULINGS`: one line per
ruling, where the rule lives), rendered at `/design/library/record`.

## The identity: achromatic, media is the color

- **Cool-grey chrome in BOTH modes** (Graphite, Will 2026-09-17; it was zero-chroma until then).
  Light = the Pearl page (bg `oklch(0.995 0.002 286)`, card the SAME white, fg `0.145 0.006 286`,
  menu pure white); dark = the Graphite room (bg `0.105 0.0053 286`, an OPAQUE card `0.225 0.006
  286`, popover `0.27`, secondary/accent `0.315`). Hue 286 is Apple's grey, not their blue at 258,
  at roughly half again their chroma because our grounds are blacker than theirs and a tint
  disappears into black. A card on the page is its hairline, never a step of 0.007 no eye
  resolves (and never a shadow: a surface lying flat takes none, see the Elevation contract): the
  grounds carry the contrast, and everything on them reads cool rather than dead.
  **Four registers, not two:** the page (`:root, .surface-paper`), the set-apart mat
  (`.surface-mat`, light), the room (`.dark`) and the slab (`.surface-ink`).
- **THREE text steps.** `--foreground`, `--muted-foreground`, and `--faint` for a timestamp, a
  caption or a hint (`text-faint`). Forty places used to fade the second grey by hand at five
  alphas; an alpha composites against whatever is behind it, so one line was three different greys.
  `--faint` measures 3.21:1 on the page and 4.47:1 in the room: captions only, never body copy,
  never a control's only label, and never stacked with a further alpha.
- **The brand is the v1 wordmark, alone** (Will, 2026-09-17: "The wordmark should exist alone in the nav
  & footer, I'll upload new v1 icon separately later once complete"). One drawing, one home:
  [`src/lib/brand/wordmark.ts`](../../src/lib/brand/wordmark.ts) holds his SVG's single path byte for
  byte, [`Logo`](../../src/components/shared/logo.tsx) inlines it in `currentColor` (the ground sets the
  colour: paper chapters, the app's light mode, the ink footer) and sizes it by HEIGHT (22px in a bar,
  the width follows), and the social card (`src/app/opengraph-image.tsx`) draws the same path. Every
  door mounts `<Logo />` and nothing else, so there is no lockup to keep in step. ★ Never retype or
  optimise the path: replace the whole string from his next export. The MARK is still a stand-in (the
  Aperture tile behind `markOnly`, mounted nowhere in production) until the v1 icon lands; what waits
  on it is in the ROADMAP.
- **`--brand` is an ALIAS of `--primary`** (ink). Don't reintroduce a brand hue; photography
  supplies all color. ("Saturate your neutrals" was consciously DECLINED: zero-chroma is the
  identity; a 0.002-0.004 warm-tint variant may get a lab round later, never silently.)
  **Ruled (bible 1, Will 2026-09-17, the palette's round eight):** the chrome went cool and the
  accent stayed OFF. `--brand` remains the alias, no hue landed anywhere, and the photographs are
  still the only colour; marketing may carry light of its own (aurora, non-sampled spill), so a
  section without a picture is still beautiful. What the ruling fixed: the light ramp's 0.455 hole
  between 0.45 and 0.905, the dark ramp crushing four surfaces into 0.14 to 0.25, and three darks
  shipping at once (cinema 0.11, the app 0.14, ink 0.155) where there is now ONE room. `--save` blue
  252 and `--reel` violet 300 stay the two icon-only action hues.
- **Feedback + actions are ALWAYS colored** (the one exception): `--success` green, `--warning` amber,
  `--like` rose, `--destructive` red, `--save` blue (the first non-state ACTION hue), and `--reel` violet
  (the host reel-curation hue, on the `Clapperboard` icon), each with light/dark variants. State, not
  decoration. **The action-color system is UNIVERSAL** (guest + host; only the action SET differs, guests have no
  hide/approve/delete/reel): one color per action everywhere it appears (like=rose, save/download=blue,
  hide/show=amber, approve=green, delete=red, add-to-reel=violet), for recognizability + legible state.
  Emil rule: **monochrome at rest → full-brightness colored STROKE on direct icon-hover + a SUBTLE `/25`
  FILL on the active state** (so the outline stays legible: liked rose, in-reel violet, hidden amber); native
  `title` tooltips. Lives on the gallery tiles + the shared lightbox
  pill; brand stays mono (color is punctuation). → [host-app.md](host-app.md) for the action model.
- **`--gallery*` stays always-dark in both themes** (media surfaces; never overridden in `.dark`).
  ★ **THE WELL AND THE SLAB ARE NO LONGER ONE VALUE** (Graphite, 2026-09-17). They were both 0.155
  and `--gallery*` served both jobs. Now `--gallery` is the media WELL at `0.065 0.0045 286`, the
  deepest thing in the system, so on an OLED panel a photograph is the only light on it; the dark
  LEAF on a paper page is the slab at `0.165 0.0053 286`, and `.surface-ink` writes its own values
  rather than deriving them. A `bg-gallery` on a leaf now paints two registers too deep: inside
  `.surface-ink`, `bg-background` IS the slab.
  ★ **Painting a subtree dark is only half the job.** `--ring`, `--border`, `--foreground`,
  `--muted-foreground` and `--brand` are not surfaces, so under `.surface-paper` they keep their
  LIGHT values: `outline-ring/50` (applied to `*`) lands a **1.41:1** focus ring on the slab against a 3:1
  requirement, muted text reads **2.69:1** against 4.5:1, and a bare `border-t` paints a near-white
  hairline. All of it is INVISIBLE while working on a cinema page, where the subtree sits inside `.dark`.
  Use `.surface-ink` rather than hand-redeclaring; it is the `.surface-paper` mechanism applied to one
  subtree. **`--brand` must be redeclared DIRECTLY, not inherited:** a `var()` inside a custom property
  is substituted at the element that DECLARES it, so `:root`'s `--brand: var(--primary)` already
  resolved to paper ink and inherits down resolved; `.surface-ink` re-declares `--primary` and
  `--brand` together so the alias re-resolves. The ink
  footer is the worked example ([marketing-footer.tsx](../../src/components/marketing/chrome/marketing-footer.tsx),
  pinned by `footer-contract.test.ts`).
  Three more the footer never hits: **the two shadows are re-declared with the DARK ramp**
  (`--shadow-lift`, `--shadow-layer`; on a paper page the leaf would otherwise inherit paper's 6 and
  10 percent, which is nothing on a slab, and the footer's photo pile is a real reader), **and a
  shadow token that must draw nothing is the INVISIBLE value `0 0 0 0 oklch(0 0 0 / 0)`, never
  `none`** (Tailwind composes `--tw-shadow` into a comma-separated `box-shadow` beside the ring/inset
  slots, and a `none` in that list invalidates the whole declaration, taking any ring on the element
  with it — the retired `--shadow-float` bridge needed exactly this zero on `.dark` until it left, 2026-09-18); **`--card-foreground` travels WITH `--card`** (shadcn `Card` is `bg-card
  text-card-foreground`, so half-redeclaring makes a Card ink-on-ink, i.e. invisible rather than merely
  wrong), same for `--muted`/`--muted-foreground`; and `--input` paints the same near-white hairline
  `--border` is redeclared to stop. `.surface-ink` carries all of them, which is why a leaf should wear
  the class rather than assemble its own set.
- ★ **A hand-assembled dark set is for a LEAF, never a page's chrome.** The ink footer's
  redeclaration works because the footer is a leaf: it knows every token its own children read. Scale
  that to page chrome and it fails, because such a set is always one token behind whatever a
  descendant asks for next. A 21-entry `--gallery*` set on a sticky marketing header omits
  `--popover` on the reasonable assumption that popovers portal out of the subtree. Radix ones do;
  **the marketing desktop nav panels render IN FLOW inside the header**, so they paint `--foreground`
  white `lab(96.52)` on `--popover` white `lab(99.65)`: all seven primary nav titles at **~1.07:1**,
  measured live. Nothing in the code looks wrong, and on a cinema page the identical markup is
  correct. So: a page that wants dark chrome JOINS THE `(cinema)` GROUP, where `.dark` flips the whole
  block and nothing can be left behind. Never re-derive the group from the paper side.
- ★ **Two silent traps a seam-straddling child sets** (the /help + /about idiom, and anywhere a
  visual is pulled across a chapter cut with a negative margin). The chapter must NOT carry `isolate`: it
  creates a stacking context and TRAPS the straddling child's z-index, so the next section's background
  paints over the thing meant to overhang (the footer wants `isolate`; a chapter never does). And the
  straddling child's wrapper needs a block formatting context (`flow-root`) or the negative margin
  COLLAPSES THROUGH it and escapes as the ancestor's own margin, leaving the ground running on past the
  child and the next section's text rendering over it. `/help` avoids the second only because its straddle
  sits inside a section that already has vertical padding. A straddling child also carries `surface-paper`
  ITSELF, which re-aliases the whole light block including the two shadows' paper alphas, and it wears
  `shadow-lift`: a card laid across a cut is one object on another, which is the small shadow's case
  (the same card lying flat on the page below the cut takes none).
- **A rotated tile needs more frame than its size suggests.** A square's bounding box grows with
  rotation (`side x (cos t + sin t)`), so a 169px tile at 11deg spans ~197px: scatter offsets authored
  against the unrotated height sit ~28px further out than the arithmetic says, and clip against an
  `overflow-hidden` frame. Size a stage from the ROTATED extent, and where a frame's height and a
  seam's offset are derived from each other (the /about gather), keep both in one place so retuning
  one cannot silently strand the other.
- ★ **A chapter's stacked-viewport rule OUTRANKS its children's padding.** `PaperChapter` carries
  `max-lg:[&>section]:py-14` (two section paddings meeting at a cut read as dead space on phones), and
  that child selector beats a plain `pt-*` on the section itself, so below `lg` a child's own padding is
  silently a no-op. Right for a chapter's INTERIOR sections, wrong for one that must clear a large
  straddling element: that chapter passes **`compressStacked={false}`** and its sections own their
  padding. Do NOT reach for `!` here: an `!` wins at one breakpoint and loses at another, which is the
  symptom itself (an `!` on `sm:pt-40` silently beats an un-`!`'d `lg:pt-44` at every width above
  1024px).
- **Where a frame's height and a seam's offset are derived from each other, keep both in one place.**
  /about's gather is the worked example: `.mkt-gather-straddle`'s percentage and its twin
  `.mkt-gather-clear` are ONE calculation and sit together in marketing.css, so retuning one cannot
  strand the other. Split across two files they are two magic numbers, and the album lands on the prose.
- **Before believing "Tailwind emitted no rule", check your grep.** Tailwind escapes `[`, `]` and `.`
  in generated selectors, so `py-[0.08em]` ships as `.py-\[0\.08em\]` and a search for the raw class text
  finds NOTHING while the rule is present and working. Arbitrary utilities emit correctly. Two things
  that ARE real and produce the same symptom: a **stale dev CSS chunk** (Turbopack's chunk URLs are not
  content-hashed and it reuses filenames ACROSS worktrees, so a browser, or a second browser on the
  same port, can serve you another tree's stylesheet; the mechanism and the fix are in
  [testing-verification.md](testing-verification.md)), and an arbitrary `text-[clamp(…)]` needing the
  `text-[length:…]` form because v4 cannot tell a size from a color (the type ladder removed the site's
  last one: a NAMED step cannot be misread). Load-bearing
  geometry still belongs in the stylesheet that owns the component's other CSS, for readability, not
  because utilities are unreliable.
- `BRAND_HEX` (`src/lib/constants/site.ts`) is ink `#101010` for OG/satori.
- The QR preset corner tints (e.g. the legacy coral) are INTENTIONAL exceptions: existing events
  keep their chosen rendering, scanners locate corners by shape, and the share studio redesigns
  presets wholesale. No longer tied to any UI token.

★ **A theme alias is emitted only when the scanner sees it used.** Tailwind v4 drops an unused `@theme`
variable from the build, and a colour read by name from JS or SVG (`var(--color-chart-N)` built from a template
string, or set from a data table) is never seen, so it resolves to nothing: four of the five chart aliases did
until 2026-09-18. Tokens read by name outside a class live in `theme.css`'s `@theme static` block (the chart
aliases, beside the type ladder), which is emitted whole; the raw `--chart-N` values still flip with the mode.

### The media-forward card

The one anatomy for a tile whose picture IS the card (Will, the event cards' round two: "the image
being the full background, the copy keeping its position bottom left, and using a dark gradient
overlay to ensure the text is distinct"): the home's event types, the feature doors and every
page's closing row, the blog library, the events teaser. TWO overlays, never one, and they have
different owners. The **visual's own fade** is the picture's (bottom-weighted, and it lifts on
hover); the **copy gradient is the CARD's** — one ruled treatment, `CARD_COPY_SCRIM` in
[feature-door.tsx](../../src/components/marketing/sections/features/shared/feature-door.tsx): a
band under the copy row plus a bloom in the bottom-left corner the copy starts from, stacked over
whatever visual the slot holds, and it never lifts. Will ruled the split on `river-card`
(2026-09-19): "the card would have its own from its text, being treated separately so the card's
applies to all features & visual pairings", and "not exclusive to the QR code card, nor part of the
river visual design itself, which keeps its own overlay fade as well". So a visual that wants to be
quiet fades ITSELF (the river's dissolve, the ghost's filter) and a card that wants its words read
wears this. ★ The alphas are a per-pixel reading off the real photographs, not a taste: re-measure
on every door when one moves.

## Chapters: the attention arc

Marketing pages alternate **cinema** (dark) and **paper** chapters to group sections and break
the monotony of an all-dark or all-paper page. The chapter is a **pacing principle, not a component**
(Will, 2026-09-01, in his own words because they are the clearest statement of it):

> Chapters can start visually strong to keep the visual attention and encourage further exploration,
> then follow up with supporting informative sections that should be interesting within themselves but
> ramp down from the big visual design until the next chapter intro or another big visual within that
> chapter.

So a chapter is an **attention arc**. It opens strong, to recapture attention that the previous
chapter's quiet tail may have started to lose. It ramps down through supporting sections that stay
interesting but stop shouting and carry the information. Then the next chapter opens bold and the cycle
restarts. That is what paces the visual-forward sections (a hero, a live demo, the reel) against the
information-dense ones (curation, privacy, FAQ) so a page keeps visual interest and clear communication
without ever being monotonous *or* overwhelming.

**The first section of each chapter carries more weight than a body section, and it stays BESPOKE.**
The goal is not formalised chapter intros. Give every opener the same device and the page reads as
templated one level up, which kills the freshness each chapter is supposed to bring. The devices are a
**vocabulary** to draw from, and a page should **vary the device between its chapters**:

- the heading a tier up (`SectionShell scale="lg"`, the ladder's `chapter` step)
- the hard film-cut entrance (`reveal="cinema"` / `data-mkt-cut`) instead of the soft rise
- materially more air above the opener than a body section gets
- an object that physically crosses the chapter cut (/about's gather, /help's emblem strip, /blog's
  featured card)
- a drawn rule (`[data-mkt-rule]`, the masthead hairline)
- a lit subject (the reel player, a screen in a dark room)
- a full-bleed frame or strip (break out of the container with `w-screen -translate-x-1/2`; it is
  safe because the cinema and paper skin wrappers clip the x axis at the viewport, so nothing ever
  scrolls sideways. That clip must stay ON THE WRAPPER: on `body` it propagates to the viewport,
  which treats `clip` as visible; the why lives on the cinema layout's class)

**Scope.** Core marketing pages with enough body sections to justify chapters: home, the feature
pages, the event pages, how-it-works. **Not** the resource and utility pages (help, blog, press,
contact, about, careers, legal), which have no room to alternate chapters in the body and keep the
cinema hero → paper body → cinema close rhythm, each designed bespoke. The checkable line: **the arc
applies where a chapter holds several distinct sections; where the chapter IS the page's body (an
article, a form, a reading surface) it does not.** Two devices at one cut are noise: an opener that
already carries a straddling object does not also take a second device.

**A full-image section is a way to CROSS a chapter cut** (Will, 2026-09-18): a section standing on a
full-bleed photograph may close a chapter, open one, or sit between two, so the page turns from dark to
light through a picture rather than over a hairline; it is used sometimes and never at every cut, or every
page with chapters grows one above and below its paper chapter and the device reads as a template. The
home's chapter 1 is the first instance (`full-quality` on `PhotoSection`, which moved the cut up one so the
live demo opens the paper chapter).

**A chapter never escalates.** It may close on an **anchor**, a strong visual that wraps its ideas
together, but only once the sections before it have ramped down. The loudest non-hero section landing
immediately before a cut leaves the next chapter no quiet to open against, and two huge visuals
fighting across one cut is the same failure from the other side: a chapter ends on its own air.

**A second rule governs SHAPE where the arc governs loudness** (Will, 2026-09-01):

> No two sections back to back should feel repetitive. Otherwise, scrolling gets boring quickly.

Two neighbours may share a register (both quiet, both informative) but never a layout. The checkable
line is the page's column rhythm read top to bottom: a centred icon three-up after a centred icon
three-up reads as one long section, and "three centred sections in a row" is the specific failure to
watch on a paper chapter, where the ground is quiet and only shape carries the pacing. The home's
answer: chapter 1 runs strip, ledger, three-up on a photograph; the paper chapter alternates the centred
stage, a left masthead, a mirrored split and a numbered ledger.

The home arc: **chapter 1** opens on the hero, supports through the trust strip, the decomposition
and the film strip, winds down through the guest-side ledger, and closes on `full-quality` standing on the
switching photograph · **chapter 2** (paper) opens on the live demo's stage (a lit subject, the vocabulary's
device, landing just under the photograph) and covers the album as the host's masthead, curation and
privacy · **chapter 3** opens on the reel, supports through events and pricing, and closes on the FAQ, the
CTA and the tail.

## Light: SPILL, BEAM, and the lamp set

> The two glow boards that argued this retired on 2026-09-18 with nothing open (git keeps them); the
> rules live here, because a rule that lives only inside a lab TSX is a rule the next agent has to go
> excavating for.

Two siblings, and picking the wrong one is the usual mistake. **SPILL** is light falling FROM a lit
thing onto what is near it. **BEAM** is an object lit BECAUSE IT IS the live subject. The ground
usually picks: ink takes the beam, paper takes spill in the paper register.

**SPILL's four laws**

| # | Law | What it kills |
| --- | --- | --- |
| 1 | **Source.** Name the lamp. If you cannot point at the object emitting, there is no spill. | Decorative glow on section edges, cards, borders, "anything that could use some life" |
| 2 | **Direction.** Spill has a vector; every instance declares where it comes from. | Even rims, concentric halos, premium pill treatments |
| 3 | **Colour of the lit thing.** Real media where it exists, the lamp set where it does not. **Never a house token, never a state colour.** | The glow becoming a second brand palette. Amber storage warnings, violet reel glows |
| 4 | **Falloff.** Fades with distance, never draws an edge, sits behind content, always warped, always an always-on base under any travelling band. | The paused-state invisibility trap |

**Bible 11 (retiring, Will, 2026-09-14):** law 1 as written forbids the
footer's seam, the one production lamp with no emitting media (`footer-glow.tsx`: "the footer's light
is the house light") and the model Will named. A lamp may light a section without media. The `light`
board wrote what replaces the source-and-direction law and retired at its ruling (2026-09-17): light
sorts by what it is doing and a lamp needs a PLACE rather than an object throwing it, the Aurora is
that light in three forms on the 8 second clock and never on paper (below), the shadows returned in
dark BY ROLE (the Elevation contract), the lit surface shipped as the bright edge (`data-lit`), and
the streak of light over an arriving photograph is banked for a delight moment. The SPILL laws and
the BEAM laws inherit it.

**BEAM's four laws:** 1 it marks the object that is currently the LIVE SUBJECT (working, awaiting,
uploading, publishing, live). 2 One subject per view. 3 **It ends when the state ends** (a beam is a
state, never a decoration, and that is the whole difference between a live object and a pretty
border). 4 One standing exception, named so it stays an exception rather than a precedent: a premium
object at rest (Get Pro, whose card already carries stacked photographs).

**Scarcity is a DISTANCE, not a count:** roughly a viewport of unlit page between lamps.

**NEVER:** nav panels and dropdowns (no lamp, and the frequency doctrine forbids theater on the
most-used controls) · the storage meter near its cap and upload errors/retry (the moment spill can
mean "warning" it is a state colour and the system is decoration; failure is `--destructive`, full
stop) · generic skeletons (a skeleton is an absence; spill needs a presence) · every CtaBand (the
every-section-gets-a-version failure under another name) · the admin portal.

**The four-question LampCard is the anti-sprawl mechanism.** A placement that cannot answer all four
cannot be built, and the form is answerable by someone other than its author: **Lamp** (what is
emitting?) · **Direction** (from where?) · **Colour** (sampled from what, or the lamp set?) ·
**Admitted by** (which law lets this in?). It decides cases on its own terms: the pointer lamp, the
CTA rim and the upload light all died on it.

### The lamp set, and its three registers

The five HUES are the identity constant: **25 coral, 85 amber, 155 green, 255 blue, 305 violet**.
What varies per surface is the REGISTER, not the hue.

| Register | Values live in | For |
| --- | --- | --- |
| **Ambient** | `--lamp-1..5`, [globals.css](../../src/app/globals.css) | Light falling on things: spill, the confetti canvas. Hand-tuned per hue (85 needs a higher L than 305 to read equally bright), which is why it is not one flat L/C row |
| **Paper** | `SPILL_REGISTER.paper`, [sampled-palette.ts](../../src/lib/shared/sampled-palette.ts) | The same light on a near-white ground. Exists because sampled light made a paper card "look dirty rather than lit". Uniform L/C today, so a hand-tuned paper five is still an open design task |
| **Live** | the `partyreel` entry in the vendored [border-beam styles.ts](../../src/components/vendor/border-beam/styles.ts) | The beam. Same five hues, raised to the chroma a gamut-edge gradient needs, **generated by `glow-contrast.ts`'s `oklchToSrgb`**, hue held exactly. It is a DERIVED register, not a second palette. It cannot be a `var()`: that file regex-parses `rgb()` strings to compute alpha variants, so a token would silently break it. Pinned by `border-beam-vendor.test.ts` instead |

**The lamp set is LIGHT, never UI** (bible 3). Never a text, border, background, state or brand colour. The
identity stays achromatic and media-forward; these five exist so the LIGHT in a room can carry colour
while the room does not. Enforced two ways: the block is deliberately **not** in `@theme` (so no
`bg-lamp-1` / `text-lamp-1` utility is ever generated), and a fence in
[globals-theme-contract.test.ts](../../src/app/globals-theme-contract.test.ts) requires every CSS
reference to land in a gradient or in another custom property that re-exports it.

★ **Which sampler you pick decides whether law 3 fires on guest media.** `useSampledPalette` (the
URL form) decodes through the reel engine's `decodeImage`, which fetches `mode: "cors"` with
`cache: "no-store"`, so it samples presigned R2 media correctly: hand it a row's `previewUrl` (~16KB),
never the original. `useSampledPaletteFromDom` reads `<img>` elements the page already painted, and a
raw presigned R2 tile carries no `crossOrigin`, so its canvas taints, `getImageData` throws, and the
`.catch()` silently returns the fallback five. No console error, no failing test, no tell beyond "the
colours look generic", and no lab specimen reproduces it because every specimen samples same-origin
`marketingImage(...)`. So a guest-media lamp either takes the URL form on `previewUrl`, or its tiles carry
`crossOrigin="anonymous"`. The `no-store` is load-bearing either way: a plain `<img>` fetches the same
URL with no `Origin`, R2 answers without ACAO and without `Vary: Origin`, and a later CORS fetch reads
the poisoned entry.

### Where the machinery is

The engine is `[data-glw*]` at the end of [globals.css](../../src/app/globals.css), landed
**UNLAYERED**, and the primitive is [`Glow` / `GlowFilter`](../../src/components/shared/glow.tsx).

★ **Unlayered is load-bearing.** Inside `@layer base` the utilities layer outranks the engine, so one
`blur-sm` from a caller replaces `filter: url(#glw-warp) blur(...)` wholesale and the turbulence
vanishes with no error and no failing test. That is also why `Glow` **accepts no `className`**: the
caller's own wrapper positions it, and tuning goes through `vars`. The `[data-reveal-chip]`
`!important`s are the same utilities-beat-base lesson read from the other side.

★ **Base and band always ship together** (SPILL law 4 as code). The organic-shimmer family animates
`mask-position` across a mask wider than the layer, so a band-only layer rests fully off-layer and
shows NOTHING: invisible whenever it is paused, which is its default state below the fold AND its
reduced-motion state, which breaks the arrival-default contract under Motion. Split it into an
always-on base plus the travelling band over it (`.mkt-fglow-base` / `.mkt-fglow-band`,
marketing.css). The base is how a reduced-motion arrival still ARRIVES.

`GlowFilter` (its own **server** component, [glow-filter.tsx](../../src/components/shared/glow-filter.tsx))
is mounted **once, in the root layout**. Root and not `(marketing)`, because `not-found.tsx` renders the
marketing footer outside that group. Never mount a second: SVG ids are document-global.

★ **A missing host is a quality failure, not a crash.** A dangling `filter: url(#glw-warp)` (a renamed
filter id, a deleted host node) does **not** blank the element. The whole chain is dropped, `blur()`
included, so the five ellipses land as hard-edged colour blobs: visibly wrong, and completely silent.
`Glow` carries a dev-only console guard for it.

★ **The band rests where its animation starts (`150% 0`), never mid-travel.** The animation lives inside
`@media (prefers-reduced-motion: no-preference)`, so whatever the band *declares* is what a
reduced-motion visitor sees permanently. Declaring `50% 0` with `mask-size: 280%` puts the comet's
peak at dead centre of the box at full strength: the exact midpoint of the sweep, the worst case,
forever, for the people who asked for less motion. Pinned by test.

### The shipped light

| Light | Where | Shape | Colour |
| --- | --- | --- | --- |
| **The footer seam** | [footer-glow.tsx](../../src/components/marketing/chrome/footer-glow.tsx), every page incl. the root 404 | `seam` | the house lamp set (no media to sample) |
| **The film strip's backlight** | [film-strip-glow.tsx](../../src/components/marketing/sections/home/film-strip-glow.tsx), full-bleed under the strip | `seam` | **sampled** from the strip's eight frames |
| **The reel screen's pool** | [reel-screen-lamp.tsx](../../src/components/marketing/sections/home/reel-screen-lamp.tsx), under the reel player, the box exactly the screen's width under an elliptical wrapper mask | `seam` | **sampled** from the reel's poster |
| **The Pro card's beam** | [pro-card-beam.tsx](../../src/components/marketing/sections/home/pro-card-beam.tsx) | beam (`pulse-outside`, the vendored border-beam) | the derived beam register of the lamp set |
| **The feature heroes** (album, guests, sharing) | [screen-lamp.tsx](../../src/components/marketing/system/screen-lamp.tsx) under each page's stage (the arrivals stream, the attribution wall, the link frame) | `seam` | **sampled** from the frame the visitor is looking at |
| **The QR plate switching on** | [qr-hero.tsx](../../src/components/marketing/sections/features/qr/qr-hero.tsx) | `bloom` armed on arrival, resting at `--glw-base: 0.34` | the house five (a code is ink on white, law 3's no-media branch) |
| **A shared reel, in the Studio** | [publish-light.tsx](../../src/components/reel/publish-light.tsx) `StudioPublishLight`, behind the reel's frame in [reel-studio.tsx](../../src/components/reel/reel-studio.tsx): wings at the frame's sides, never over the media, mounted only while the reel is shared; the room is dark in both themes, so it is never fenced | `bloom`; the swell only for a share made on this page (`sharedHere`), otherwise the band eases up to the same base | the house five (Will, `publish=house-five`) |
| **A shared reel, on the host's share card** | `ShareCardPublishLight`, a pool under [reel-share-card.tsx](../../src/components/reel/reel-share-card.tsx) centred on the card's bottom edge (nothing reaches the poster above it); the first lamp in the app, so it is the second name on the light-ground fence | `bloom`, the same gate | the house five; none at all on a light ground |

**`ScreenLamp` is the ONE underlight as a component:** a lit
object throws its own sampled light down off its bottom edge, full-bleed, as a sibling of the object
(never inside a clipping frame). Neither `throw` nor `halo` can backlight an opaque object, so every
underlight on the site is this mechanic; a new one is a `<ScreenLamp>` around the object, not a fourth
file. Its section must be `overflow-x-clip`, never `overflow-hidden`, or the field hanging below is
cut off. Scarcity on a feature page is one lamp in the hero and the footer seam, nothing between; the
curation and privacy pages carry NO lamp on purpose (restraint is their identity), and so does the
doors band (a row of lit cards is the every-section-gets-a-version failure).

★ **A radial mask's reach is a fraction of the FULL field.** The transparent stop sits at 78% of that
radius, so a `--glw-reach: 78%` on a field the size of its object puts the fade outside the box and
the light renders as a rounded square. Size the field generously (`-inset-32` on the QR plate) and
keep reach where the falloff completes inside it.

Three seams and one beam on the home page (film strip, reel, Pro beam, footer: 5909, 1275 and 1509px
apart at 1440, the nearest pair 1.4 viewports): scarcity as a distance. The hero, the album straddle
and the event cards carry none (a wall is the ground, not a source; the straddle's slot is 63px; the
cards lose to the beam on scarcity).

**Two ways a seam's sides end, and the box decides.** A seam's five ellipses sit at 14/38/60/80/96%
of the field, so its colour is still ~40 to 50% at the ends of ANY box, and a box that ends on screen
ends the light on a cut. A strip's light goes full-bleed so its ends are off-screen
([film-strip-glow.tsx](../../src/components/marketing/sections/home/film-strip-glow.tsx)). A screen's
light must not be wider than the screen, so its box IS the screen and the wrapper carries an
elliptical mask anchored at the screen's bottom centre (rx 46%, smoothstep stops): a pool, gone 31px
inside each edge at 1440 and 14px at 375. A linear side mask on a wider box is a third thing, a wedge
lit 40% at the object's own edge and ending on a straight line outside it; ruled out on sight, and
pinned by test.

**One clock, ruled** (Will, 2026-09-17). Every lamp reads `--spill-cadence` and it is **8s**: the
engine's own register, judged as the whole home page at each rather than one seam in isolation, ending
the two rounds in which every shipped lamp ran 11s against it. A lamp passes the token and never a
literal, which is what lets one ruling re-time the page at once. The Aurora's field takes a SIBLING,
`--aurora-cadence: calc(var(--spill-cadence) * 3)` (24s), because a field the size of a chapter moving
at a lamp's clock reads as a screensaver. ★ The sibling must stay declared in `globals.css`: `vars`
lands inline and outranks the engine's own `--glw-dur`, so an undeclared cadence is invalid at
computed-value time, the `animation` shorthand goes with it, every longhand resets, and the band
FREEZES over a still-lit base. That reads as a design choice rather than a defect, and it cost the
light board a round to diagnose.

### The Aurora, and its three forms

**The Aurora is Will's word for the coloured light** (2026-09-17), and it is one family rather than
three effects. The kept FORMS: the **seam**, a band where two grounds meet (the footer, the film
strip, every screen lamp); the **throw**, cast from a point on an object, which is how a plate sits on
open dark without a rim; the **field**, a whole chapter lit at its own edges. Two MARKS are kept beside
them (2026-09-17): the **bloom**, a one-time glow that rests lit and never decays to nothing (the QR
plate and the publish moment ship it), and the **halo**, which lights an OBJECT from behind and never wraps a button ("Do not
like as a button wrapper, only to light objects from behind"; no production use yet, the Library holds
its working specimen). Code identifiers do not move (`Glow`, SPILL, `--glw-*`, `--lamp-*`); the Library
and these docs speak his word.

★ **The Aurora is composed for the place, never stamped** (Will, 2026-09-17, asked which placement the
site takes: "a mix of all of them... custom and bespoke, not a couple of identity components reused
everywhere in the same way constantly"). The REGISTER and the CLOCK are fixed so they cannot drift; the
GEOMETRY is the call site's, chosen by looking at the section, and a call site says in a comment why.
`SectionLight` therefore has **no default placement**, and its contract refuses the same composition
twice on one page. The home page's two are the first: the **closer** takes the light at its bottom edge
only (`placement="bottom" reach="58%"`), rising from the line it shares with the footer's seam so the
two lamps read as one horizon; the **guest ledger**, the page's one left-aligned header, is lit from
its open side (`placement="room" from={{ x: "0%", y: "50%" }} reach="62%"`). ★ A section with no
boundary line of its own cannot take a band or a floor cast: the lamp's box clips its falloff, so the
light ends in a hard line where nothing on the page explains one. A cast whose origin sits on a side
edge, vertically centred, with a reach under about 64 percent finishes its falloff inside the box.

**The field is [`SectionLight`](../../src/components/marketing/system/section-light.tsx)**, beside
`ScreenLamp` and for the same reason: the placement grammar and the register live in ONE place, so a
chapter asks for light rather than assembling two bands and four custom properties. Two seams at the
section's own boundaries, the bottom one the top one flipped on its own axis (`scale: "1 -1"`; the
engine has no bottom-seam shape and must not grow one, since only the vector differs and law 2 says a
vector is the caller's to turn), each 42 percent of the section's height unless the call site passes
its own `reach`. `placement` is `both | top | bottom | room`, and `room` takes a `from` origin on or
beside an edge of the box; `middle` and `behind` are fenced rather than typed, because the copy
then sits IN the light instead of in the clean band beside it. **Accent is the global
register** ("Identity feels way too weak"), so there is no register axis: one object, `AURORA_VARS`,
which every lamp in the file spreads. It takes the **transform drive** deliberately, since a
chapter-scale mask repaints every frame. ★ Being the first shipped lamp on that drive is what exposed
its missing resting `translate`: with the animation inside the no-preference block, a reduced-motion
visitor saw the comet parked dead centre at full strength, which is law 4 inverted exactly as the mask
drive's `mask-position: 50% 0` was. The drive now declares `glw-drift-x`'s own from-keyframe.

★ **No Aurora on a light ground** (Will, 2026-09-17: "It's barely noticeable and almost appears as a
weird shadow or a stray artifact... No light ground usage is a decision for now"). The fence is CSS
rather than a prop or a review note, so a chapter that turns to paper a round later goes quiet on its
own: `[data-section-light]:not(.dark *), .surface-paper [data-section-light] { display: none }`, which
is theme.css's `dark` variant inverted (both halves are needed, since a paper chapter lives inside a
forced-dark cinema wrapper and a cinema page in an explicit-light session has no `.dark` on `<html>`).
★ It is ONE rule holding a list of lamp BOXES, never a second copy: the share card's publish light
(`[data-rxp-cardlight]`, the first lamp in the app, which follows the host's theme) is the second name
on it, and the Studio's twin is deliberately absent, because that room is a literal near-black in both
themes and carries no `.dark`. The hook always sits on the light's own box, never on the object
(`display: none` takes what it names). It names boxes one by one and is **never widened to
`[data-glw]`**: the seams that already ship have
their own paper behaviour, and today that behaviour is nothing at all, so a media-less lamp on paper
still paints the dark register's five (open for Will; the hand-tuned paper five is in ROADMAP).

**Where the page already painted the media, sample the DOM.** `useSampledPaletteFromDom(ref)` reads
the `<img>` elements the page has already painted, so `drawImage` reuses the decoded bitmap: zero
bytes, zero requests, zero extra decodes. The URL form (`useSampledPalette`) fetches its own copies,
which is right for a lab board (no rendered image to read) and for a guest-media lamp handed
`previewUrl`, but pointed at the home page's wall it would refetch **1,101,641 bytes** of originals,
since `next/image` serves a different URL and nothing is a cache hit. The DOM form also never calls
`img.decode()`: that would force a `loading="lazy"` tile to fetch, so the lamp would undo the page's
own loading strategy in order to colour itself.

★ **Two placement rules, both cheap to break by accident.** (1) A lamp goes
**after** the scrims it lights through, never inside them: nothing in the hero creates a stacking
context, so children paint in DOM order and a lamp under four scrims arrives at about an eighth
strength. (2) The caller's content wrapper needs an explicit `relative`, because `Container` is a
static div and an absolutely-positioned `Glow` otherwise paints **over** the H1. Both failures look
like "the effect is too strong" and send you tuning opacity instead of fixing the stack.

**A lamp that crosses a chapter cut is clipped at the cut.** Light stops dead there, and that is the
ruling rather than a containment accident: `PaperChapter`'s rule is that cuts are hard (hairline +
plane change, no gradients), so a bleed would soften the edge the chapter system rests on. It also
keeps one lamp on one register instead of needing the dark register above and the paper register below.

**A lab specimen can be geometrically inverted from the surface it names,** and its *argument* can
survive the flip intact. When a specimen and its surface disagree, check the geometry against
production before judging the idea: a specimen that puts paper above and dark below would throw
dark-register light onto near-white paper on a page built the other way round, while the claim it
makes ("the card casts onto the dark field it overhangs") still holds. Measure the surface rather
than trusting the specimen's own numbers: the home straddle overhangs its cut by **63px** (`-mt-40`
is 10rem, `SectionShell` puts back 6rem of padding, `PaperChapter`'s border another 1px), not the
160px a specimen claimed.


## Type: the heading face + the ladder

`font-heading` is a Tailwind `@utility` in globals.css (NOT a theme font token): the brand face
**Urbanist** (`--font-display`, loaded in the root layout via next/font as a variable font) at **weight
700**, plus a flat **-0.03em** tracking that is now only the FALLBACK for headings the ladder does not
reach. Urbanist is a real variable sans, so it carries no font-size-adjust, no
synthetic text-stroke weight and no font-synthesis: a real bold weight does
the work. Swap the brand face forever by repointing `--font-display` + retuning the two lines in the utility.

**THE LADDER: ten steps, one set, both halves of the site** (Will's rulings: 2026-09-17 on the
type-scale board's card B, 2026-09-18 on `type-phone`). Declared once as `--text-*` tokens in
[`src/app/theme.css`](../../src/app/theme.css) and drawn at true size from those live tokens at
`/design/library/foundations#ladder`, which is where you READ it: the numbers have one home, and this
doc deliberately does not copy them. A step carries its own font-size, line-height and letter-spacing,
so one class sets all three, and each is a `clamp()` through (375, phone) and (1440, desktop): there
is no breakpoint to jump at, and no ramp anywhere on the site.

**The law is the ORDER, not the travel** (2026-09-18). Every size sits on one rung set from 12 to 160
whose ratio widens as it climbs (one ratio cannot serve a 160px masthead and a 14px label). A step's
desktop end is the size Will ruled at 1440; its phone end is the rung that keeps every heading ABOVE
the one it heads at 375. The first wiring moved every marketing step exactly four rungs instead, and
that put the paper h2 (`prose`) under its own sub-head at a phone, unseen on a desktop review ("We
should have a very clear heading hierarchy on mobile as well"). Marketing still travels further than
the app (bible 2, "marketing may be louder, scale included"), only as far as the order allows. The
policy reads the paper stack (title > prose > sub-head) off the tokens at both ends.

| Step | Class | Wears it |
| --- | --- | --- |
| Display | `text-display` | the masthead, one or two words (`PageHero scale="display"`) |
| Hero | `text-hero` | the cinema hero and the home (`PageHero scale="xl"`) |
| Title | `text-title` | /help, the six feature heroes, /reel, /events (`PageHero scale="lg"`) |
| Chapter | `text-chapter` | `SectionShell scale="lg"`, the article and role titles, the footer's closer, /help's ghost folio (each pane's chapter number) |
| Section | `text-section` | the body-section h2 (`SectionShell` default, ~70 sites) and a stat numeral: a price, a storage readout |
| Prose | `text-prose` | the paper prose head (/about, /press, /help, /contact), an article's h2, and a dead link on marketing |
| Sub-head | `text-subhead` | the sub-head under a prose or section h2 (/about's six, /help's categories, a role, the home's first chapter), an article's h3, a legal section, an article's closing h2s, a featured door |
| Page | `text-page` | every app and admin h1 (`PageHeading`), the guest event and profile titles, every screen of the guest entry sheet, the reel's title card |
| Subsection | `text-subsection` | the app's quiet middle (an event tile, a gate card, an empty state, a prompt tile) and marketing's tile and item titles (a feature h3, a plan's name, a footer column) |
| Card title | `text-card-title` | `CardTitle`, every sheet, drawer and dialog title, an FAQ question, a table's column head |

**Roles, not sizes, decide a step** (Will, 2026-09-18: "we really shouldn't have any one-off adding
instances. Everything should be addressed in our design system type ladder"). A heading that no step
fits is a role nobody has decided, and a new step is added only when it is a helpful global addition
that names a size the site already uses (`subhead` named seven headings' stock pair). The MDX
articles' h2 and h3 are sized on the prose wrappers (`prose-h2:text-prose prose-h3:text-subhead` in
`help/[slug]` and `blog/[slug]`), because the MDX components are shared and carry no sizes. Index
numerals are data, not headings: they sit on the body face with tabular figures.

Five ways the ladder fails SILENTLY, all held by
[`src/lib/type-ladder-policy.test.ts`](../../src/lib/type-ladder-policy.test.ts):
- **The card step is `card-title`, never `card`.** Tailwind v4 resolves a `text-*` class as a COLOR
  before a font size, and `--color-card` (the surface) has existed far longer, so `--text-card` would
  be a token no className could reach. No step may take a name the colour namespace owns.
- **`cn()` has to be taught the ladder** ([`src/lib/utils.ts`](../../src/lib/utils.ts)). tailwind-merge
  does not read the stylesheet, so an unknown `text-*` lands in its colour group and is dropped by any
  real colour in the same call: `cn("font-heading text-chapter text-white")` returned `font-heading
  text-white`. A step added to theme.css is added there in the same change.
- **A ramp coming back.** A stock pair (`text-xl sm:text-2xl`) also JUMPS at 640 where a clamp does
  not: the sub-head out-shouted its h2 from 640 to 775 as well as at a phone. No `sm:` size, and no
  step behind a breakpoint, on any heading.
- **The order breaking at one end** (above), read off the tokens at 375 and at 1440.
- **A heading off the ladder.** A stock (`text-xs` to `text-9xl`), arbitrary (`text-[22px]`) or inline
  size on a heading tag, a `*Title` / `*Heading` component or anything in the heading face. The scan
  found 126 at the second wiring; every heading among them took the step its role calls for.

**A step beats `font-heading`; a `tracking-*` or `leading-*` beats the step.** Tailwind sorts the
utilities layer by property and emits a custom `@utility` in the font-* position, ahead of the size
utilities, so at equal specificity the step's own spacing wins. But `tracking-tight` resolves to `0em`
here and cancels it through `--tw-tracking`, and a `leading-*` overrides the step's line height the
same way; never put either beside a step. `--tracking-tight` stays `0em` so the legacy
`tracking-tight` usages are no-ops on everything else.

**What the policy names, and nothing else, sits off the ladder** (each by file, with its reason and a
count, so the hole cannot grow). **Type drawn inside a picture**: a phone, a frame card or an album
that pictures the app at reduced scale, a printed sign, the press kit's typeface plate, an emblem's
glyph; a picture of a heading is sized by its picture, and a viewport clamp would size it by the wrong
box. **A LABEL inside a heading tag**: the event feed's section header
(`app/event-feed/feed-section-header.tsx`) is an 11px uppercase Inter label inside an `h2`, and the
admin metric bands are its 14px cousin (eight such labels, six of which size the tag itself). The tag
is there for the document OUTLINE, the look is a label, and this is the heading FACE's ladder: nothing
set in Inter joins it. Restyling the feed is its own decision, so until one is taken, do not "fix"
these onto a step. **The root error page** (`app/global-error.tsx`), which replaces the whole document,
stylesheet included, so its h1 is sized inline.

**Weight is still tiered on top of the step** (one face, weight per tier; app page and card titles take
the heading face, never Inter): page titles **700** via
[`PageHeading`](../../src/components/shared/page-heading.tsx), the ONE source for every app and admin
`<h1>` so headings cannot drift back to Inter; card titles **600** (`CardTitle` adds `font-semibold`);
per-setting labels (`FormLabel`) and small uppercase eyebrows stay **Inter 500**. `PageHeading` adds no
`font-semibold` (it would drop 700→600), and a caller passing a STOCK size (`text-3xl`) takes that h1
off the ladder: name another STEP instead.

**Marketing's page-H1 exemptions** (titles must OWN their headers): the standard page h1 is the `title`
step; the HOME hero takes `hero`; long-title ARTICLE surfaces (help, blog and careers articles, and the
blog index's featured card) stop at `chapter`, where a long line reads as prose rather than as a
masthead; utility documents (`/contact` via SectionShell, the legal shell, whose section titles are
sub-heads) use the section steps. On a phone the marketing steps sit closer together than they do at
1440, so a section's weight there comes from its entrance and its air as much as from its type.
**The hero lockup owns all of this** ([`page-hero.tsx`](../../src/components/marketing/system/page-hero.tsx),
pinned by `page-hero-contract.test.ts`): eyebrow / heading / subhead / actions on one shared `gap-6`
grammar, with `scale` picking the type, `lg` the ladder above, `xl` the cinema register, `display`
the exemption below. **Share grammar, page picks
scale** (Will, 2026-08-28). Compose it rather than hand-rolling a hero: four agents write four heroes
in a week otherwise, and that is the drift it closes. The heading is always an `<h1>` (`SectionShell`'s `as`
carries the same rule for sections). **The hero entrances are three NAMED registers: `entrance` is `rise`
(the standard stagger: the identity pages and /pricing), `cut` (the hard film cut: every
cinema-family hero, the six feature pages, the hub, /how-it-works, /events) or `blur` (the
texts-reveal blur-rise on the slots around the title: the utility trio /help, /contact, /careers),
and the H1 never moves in any of them.** `children` is the STAGE slot, rendered inside the same
Container under the lockup, so a page with an object (the album filling, the attribution wall, the
link frame, /help's instrument strip) composes the lockup and owns its object, its entrance and its
lamp; `backdrop` is what sits BEHIND the lockup (careers' contact sheet and scrim), never in front;
`PageHero` still owns only the type. An h1 that rests at `opacity: 0` is an LCP hole, so
`marketing-h1-policy.test.ts` refuses `.mkt-line` on an h1. **No single templated hero, few named
registers, no unnamed minor variants** (Will, 2026-09-02): a new hero uses one of the three or adds a
named one, and never condenses the existing ones into one template. The QR hero and the home hero
stay hand-rolled: their object sits BESIDE the lockup, not under it.

The **display step** is the MASTHEAD tier: a 160px string at 1440, a recorded decision rather than a
stray arbitrary value. Do not "fix" it back down toward 72px. /about's
"Partyreel" and /press's "Press" take it. **ONE OR TWO WORDS ONLY** (bible 6),
and at this size **the H1 matches its NAV LABEL** (bible 6): a masthead is the loudest promise on the page,
so it must be the word the reader just clicked; anything more specific goes in the eyebrow. Both:
`whitespace-nowrap` is load-bearing under a viewport-driven clamp, and the trim below is reasoned about
a single line, so a longer title belongs at `xl`. The tracking squeeze (`.mkt-name`, marketing.css)
belongs to the STEP, not to the page that first used it: any masthead at this size arrives set slightly
open and closes to the display step's own tracking. It has to be closed THERE, reading the token:
marketing.css is unlayered, so it beats the `utilities` layer whatever the specificity, and a masthead
merely wearing `text-display` would still settle on whatever that file says.

Two things it needs that a normal H1 does not. An **asymmetric optical trim**: a normal heading's box is
about its ink, a display line's is not, and it is wrong in OPPOSITE directions at each end. Measured
with canvas TextMetrics (Urbanist bold: cap 0.75em over the baseline, descender 0.25em under), a
0.85-ish leading + `py-[0.08em]` put the box top 0.125em ABOVE the cap while the box bottom lands
0.094em ABOVE the descender, so one honest `gap-6` reads ~44px over the name and ~9px under it. The
step therefore trims its TOP only and deliberately never its bottom: trimming both ends symmetrically
is the intuitive move and it tightens the end already tight. **The trim tracks the leading** (Will,
2026-09-18, `display-trim=clamped`): `mt-[calc((1em-1lh)/2-0.19em)]`, minus the half-leading at
whatever width is drawing plus a face constant fitted so 1440 keeps the `-0.12em` it shipped with. The
step's leading is itself a clamp (looser at a phone), so the old flat `-0.12em` was right at 1440
only; measured on /about's masthead, the cap's first ink row now sits 2px under the shared gap's end
at 375 (it was 5) and 6px at 1440 (unchanged). ★ Mind the sign: `(1lh - 1em) / 2` agrees at 1440 and
trims LESS at a phone, which is how the board's own tile drew it (the contract pins the form). Keep
`py-[0.08em]`: it is what stops an `overflow-hidden` ancestor clipping the descender, and the negative
margin removes the distance from LAYOUT while the glyph keeps its room.
(A consequence worth expecting rather than "fixing": a title with NO descender, like "Press", reads
looser under the masthead than one with a "y". The box rhythm is identical; the ink differs.)
And an **optical side bearing** (`leadIn`), which is a different kind of correction and is gated
separately: the vertical trim is about the LINE BOX and holds at any alignment, while `leadIn` pulls a
flush-left masthead back onto its column edge and therefore applies ONLY at `align="left"`. Folded into
the heading class it drags a CENTRED masthead off centre by half its value (3.6px, and it reads as
"the hero is slightly wrong" and nothing more, which is why it can sit unspotted for a milestone).
Both mastheads are centred, so
`leadIn` has no consumer today; it is kept gated rather than deleted so the next flush-left one does not
rediscover the problem and invent a magic number.

**THE THIRD REGISTER, the INDEX MASTHEAD, is the display step's inverse** (Will, 2026-08-28: "I love
broadsheet's small 'notes' title and underline above the featured blog card... should say 'Blog'").
Where `display` is for a page whose
TITLE is the subject, this is for a page whose CONTENT is: the h1 recedes to a small title above a
drawn `[data-mkt-rule]` hairline, and the lead item owns the stage. It is ON the ladder, at the
`subsection` step (the exact sizes its old stock pair set, so nothing moved), while the featured
card's h2 runs at `chapter`. That inversion is DELIBERATE: the h1 is quiet by picking a quiet STEP,
never by leaving the ladder, and a louder step would undo the register. The small one keeps the h1 because it is what the
page IS, it never collapses under a filter the way the featured card does, and it holds the document
outline stable in every view. It is deliberately NOT in `PageHero`: that component owns the
eyebrow/heading/subhead/actions lockup, and this is a different one (title + rule + a trailing
link). One page uses it; if a second index wants it, THAT is when it gets extracted.

**TWO FACES, AND ONLY TWO** (Will, 2026-09-14: "kill mono entirely"). Inter for
everything a person reads, Urbanist for what the page says loudly. There is no mono face in the
product: no `Geist_Mono` loader and no `--font-mono` in `layout.tsx` or `theme.css`, no `MonoCaption`,
and `Caption` (`system/caption.tsx`) is the ONE caption atom, labels and data alike.
**Never add a font loader or a `font-mono` class back without a ruling.** What carries
the work mono used to do:
- **Data** sits on the body face with `tabular-nums`: index rows, counters, durations, sizes, table
  columns. On a spin reel (`StatBand`) the tabular figures are load-bearing, not decoration: they are
  what holds a column's ten digits to one width.
- **A number that is the SUBJECT of its block** takes the display face with tabular figures: the
  pricing cards' price register, `StatBand`, the help filmstrip and `/help`'s ghost folio.
- **A value that must LOOK like a value** (an error digest, a full id, a storage key, a raw error) takes
  a muted plate: `rounded bg-muted px-1.5 py-0.5` plus `select-all` where one click should take the whole
  thing. The plate says "this came from the machine"; the typeface no longer has to. A value the person
  must retype as a guard (the operator delete-confirm) takes the plate WITHOUT `select-all`.

## Rounding: sharp surfaces, round actions

**Family C, the derived steps in quarters** (Will's ruling, 2026-09-18, on the rounding board:
`family=c`, `actions=today`, `ladder=quarters`, `dead-rungs=drop`, `gap=pinned`). The values have
one home, the `:root` block of [`globals.css`](../../src/app/globals.css), and the Library draws and
measures them at `/design/library/foundations#radius`; this table says what each token is FOR.

| Layer | Token | What wears it |
| --- | --- | --- |
| Surfaces | `--radius` (8px under C) | cards (`Card` wears `rounded-lg`, the token itself), inputs, panels, plates; the base the derived steps multiply |
| Actions | `--radius-action` / `-sm` | 0.4 of the height: 16px on the 40px button, `-sm` on the 32px default `Button`; the other sizes DERIVE from `--radius-action` (h-6 0.6x, h-7 0.7x, h-9 0.9x, and the 44px `cta` size 1.1x, all in `button.tsx`), so one knob moves the whole action ladder. `ctaCorner` exports the 44px corner for the few 44px actions that are not a `Button` |
| Photographs | `--radius-tile` · `--gap-gallery` | every photograph and media tile wears `rounded-tile`, never a literal; `--gap-gallery` is `max(3px, var(--radius-tile))`, PINNED to the corner (below the tile radius, four corners meeting open a visible diamond; 3px is the floor because the 3px gap was the album tell), and it is the ONE gap for every media grid: the guest masonry (its vertical gap is each tile's `mb-[var(--gap-gallery)]`, since CSS columns have no row gap), the skeleton that stands in for it, the ghost grid, the triage grids, the album-like marketing walls |
| Floating layer | `--radius-float` (12px under C) | menus, tooltips, toasts, dialogs, and the guest entry sheet (`rounded-t-float`, the dialog it becomes at 640; it was 1.4x a button's corner); a ROW inside a panel is `calc(--radius-float - 4px)`, derived in [`floating-layer.ts`](../../src/components/ui/floating-layer.ts), on the family's `p-1` rail |

**The derived steps climb in quarters of `--radius`** (`sm` 0.5, `md` 0.75, `lg` 1, `xl` 1.25, `2xl`
1.5: 4 / 6 / 8 / 10 / 12px under C), where the old 0.6 / 0.8 / 1.4 / 1.8 steps landed on fractions.
★ **`3xl` and `4xl` are dropped by setting them to `initial` in theme.css, never by deleting the
lines**: Tailwind's own default theme defines both (24 and 32px), so a deleted line brings them
back fixed and off every token; `initial` removes the key and the utilities emit nothing. A corner
that big is a pill, and a pill is `rounded-full`.

Nested-corner math: inner = outer minus gap. An action riding its HEIGHT instead is the system's
DELIBERATE exception to it, and C keeps the contrast: a control is twice as round as the surface
under it, so it still reads as the pressable thing.

★ **`cn()` has to be taught the custom radius names** ([`src/lib/utils.ts`](../../src/lib/utils.ts)
`RADIUS_TOKENS`: `action`, `action-sm`, `tile`, `float`). Unknown to tailwind-merge, a token corner
and a stock one BOTH survived `cn()`, and the stylesheet's order, alphabetical for utilities on one
property, picked the winner: every stock step beat `rounded-float` and `rounded-action-sm` whichever
was written last. The parity is pinned beside the type ladder's.

★ **The radius tokens, `--gap-gallery`, `--spill-cadence` and the `--tune-*` knobs live in their OWN
`:root` block in `globals.css`, never in the `:root, .surface-paper` block and never in a lab
sheet.** They are theme-independent, and aliased into a
theme set they are re-declared by every paper chapter and every lab board, so the tuner's
html-inline override never pierces them: a radius sitting on a paper chapter or on a lab board
runs silently on the baked values (measured at the rounding round: `<html>` at 14px, the live
column at 2px). Declared once on `:root` they inherit everywhere and the tuner wins everywhere,
`--gap-gallery` included (it reads `--radius-tile` on the same element, so the tile knob moves the
gap too).

★ **A DERIVED radius
token is not a runtime variable.** `theme.css` declares `--radius-sm..2xl` inside `@theme inline`, so
Tailwind compiles each into its utility and emits NO custom property; `var(--radius-md)` is empty at
runtime and an empty var inside a `calc()` invalidates the whole declaration silently.
Derive from `--radius`, `--radius-action`, `--radius-float` or
`--radius-tile` (the real `:root` tokens), never from the scale's names.

The sitting surface is the Library's radius section (`/design/library/foundations#radius`: every
token on a real specimen, each caption read off the specimen, so the tuner's knobs move it live)
plus every real page the tuner mounts on. The rounding board it replaced retired at the ruling.

**Anything drawn AROUND an object takes the object's radius, never a literal** (bible 9). A ring, glow or
bloom at offset N gets `object radius + N`, which is the same nested rule read outward. This is not
theoretical: a 16px chromatic ring around a card rounded a step off it (3.6px, measured before
family C) reads as two different shapes
the moment colour lands in a corner, which is what happens when a specimen is rounded like the
vendored library and then handed the library's own
`borderRadius`. `BorderBeam`
auto-detects its child's computed radius when the prop is OMITTED, which is the correct call, and
[`border-beam-vendor.test.ts`](../../src/components/dev/border-beam-vendor.test.ts) pins that no lab
specimen passes one. The corollary is worth knowing before reaching for that effect: it is authored
for 16px+ corners, and 16px is what this system rounds an ACTION to, so **a beam's natural layer here
is an action, not a surface**. The derived `rounded-sm..2xl` scale is mapped off `--radius` (the
surface family), so a floating panel still uses `rounded-float`, never a step that happens to land
near it: under C `rounded-2xl` and the floating corner are both 12px, and only one of them moves when
the floating token is retuned. Measurements ride Tailwind's 4px grid + the 0.4-height radius ratio
(the system's math).

## Elevation contract (four heights, one job each)

Will's ruling on the light board's depth step (2026-09-17): "A small shadow where one card sits on
another, and a larger one under menus, dialogs and toasts"; and, once the four were drawn on one
screen: "I now see how step, ring, lift, and float work together." They are never rivals and the
rule is the SAME in both modes. The legend he ruled on lives at `/design/library/foundations#elevation`.

| Height | Technique | How it is worn | Reached for |
| --- | --- | --- | --- |
| 1 | **The step** | `bg-card`, `bg-popover` (dark: bg 0.105 → muted 0.175 → card 0.225 → popover 0.27 → secondary 0.315) | First. A panel is a shade lighter than what it sits on. In light the card is the page's own white, so the step is a hair and the ring carries the edge |
| 2 | **The ring** | `ring-1 ring-foreground/N`, `border` | On every surface: one hairline marks where a panel, a button or a menu ends |
| 3 | **The lift** | `shadow-lift` (`--shadow-lift`) | ONLY where one object really overlaps another of its own lightness: stacked photographs (the pricing photo stack, the footer's photo pile, /help's mini album), a print deck (/features/qr), a card laid across a cinema-to-paper cut (the /help strip, the article and legal lead cards, the guest list), the contact stamp, the fanned badges, a white chip or play badge laid on a photograph |
| 4 | **The layer** | `shadow-layer` (`--shadow-layer`) | Under anything the page keeps living behind: dialog, sheet, popover, dropdown and its sub content, select, tooltip, the navigation menu's viewport and indicator, the toast, the guest entry shell, the help palette, the host's floating action bar, the floating Add, the reveal's share prompt and the Studio's confirmation card; and a marketing mock that QUOTES one of those |

- **A surface lying flat takes neither shadow, in either mode.** A shadow on a flat dark ground is a
  smudge (bible 10) and on a flat light one it is a fifth technique; a card, a field, a segmented
  control's thumb and a frame standing on the page are their step and their ring.
- **One geometry, two sizes, one alpha ramp per ground** (blur = 2x offset, single top light source;
  the layer is the lift at double the offsets). The values live in `globals.css` and nowhere else:
  paper did not move (the lift is the retired `--shadow-float`'s value to the byte), and `.dark` and
  `.surface-ink` gained the ramp they never had, because 6 percent of black over a 0.105 room is
  arithmetically invisible, which is the whole reason dark read as shadowless.
- **The role is the call site's to declare**, and `src/lib/elevation-policy.test.ts` refuses the four
  ways round it: a stock or arbitrary Tailwind shadow, a hand-typed inline `box-shadow`, the retired
  `shadow-float` name, and a ground that re-declares the ink without both shadows. `--shadow-float`
  retired with the rounding board, its last reader (2026-09-18), and is declared nowhere now.
- ★ **Never overwrite `box-shadow` where a ring lives.** `ring-1` IS a box-shadow in Tailwind v4,
  composed with `--tw-shadow` into one declaration, so a bare `box-shadow:` on a ringed surface
  deletes its hairline with nothing to see in the source. Wear the utility (it writes `--tw-shadow`),
  or re-state the ring first: the toast re-states sonner's focus ring for exactly this reason, and
  the footer's photo pile re-states the card-stack recipe's hairline.
- ★ **An unlayered rule outranks every utility.** `marketing.css`'s `[data-mkt] .mkt-stack-card` sets
  a bare `box-shadow`, so `shadow-lift` on those cards does nothing at all; the footer's pile carries
  the lift INLINE (`footer-demo.tsx`), token and never a literal.
- ★ **`cn()` files `shadow-lift` and `shadow-layer` under shadow COLOUR**, as it did the retired
  `shadow-float` (tailwind-merge does not read the theme). The two replace each other correctly, but
  `cn("shadow-layer", "shadow-none")` keeps both and the stylesheet's order decides. Nothing in the
  product does that today; the fix is one `theme.shadow` line in `src/lib/utils.ts`.
- **A shadow that falls on a photograph does not follow the page's ground**: a photo is as bright
  in the light theme as in the dark one, and paper's ramp is the faint one. It holds on the stacked
  photographs today; if a lift over media ever reads weak in light, the fix is a ramp declared on
  the media ground, never a raw shadow back.
- ★ **There is no translucent surface in the system** (card=declared, Will 2026-09-17: "If we ever
  need to design that glass style over photos, we can design that custom."). The dark card was
  `oklch(0.21 0 0 / 0.62)` and no document said so: solid over a page, glass over a photograph. It
  is opaque everywhere now, so nothing needs backdrop-blur and nothing should reintroduce an alpha
  on a surface token. A glass surface over media is a design task with its own ruling.

### The bright edge (`data-lit`): material, not elevation

Will kept it on the light board's face step (2026-09-17: "I love the bright edge. It's a really nice
subtle design touch") and asked for it polished. One pixel of light catching the bevel of a surface
lit from above: brightest along the top, falling away down the sides, nothing at the foot, in the
FOREGROUND colour at a low alpha and never a lamp hue (bible 3). Three kinds of surface take it and
nothing else does: a photograph or a video (the masonry tiles, the event card, the canvas player,
the inline reel player, the marketing frames' wells), a framed screen (`PhoneShell`'s bezel) and the
QR card (`QrFrame`, `LiveQr`, the /features/qr plate). The rule is `[data-lit]` in `globals.css`, the
Library judges it at `/design/library/foundations#bright-edge` with a fixed 4x corner per surface,
and `src/components/shared/lit-edge-contract.test.ts` holds the function:

- **The hook sits on the box that owns the radius**, and the radius is inherited, never typed. The
  board's mismatch was a hand-typed radius on a wrapper (bible 9). `event-card.tsx` is the standing
  trap: its outer `data-media-tile` wrapper is square, so the hook is on the rounded box inside it.
- **`data-lit="border"` on a surface that wears Tailwind's 1px `border`**: the pseudo-element is pushed
  out by that width so the light lands ON the border, one arc and not two. ★ Such a host must not
  clip: `overflow: hidden` clips at the padding box, exactly where the border ends, so the edge is
  drawn and then cut off to the pixel. The canvas player rounds its canvas instead of clipping it.
- **Dark grounds only, through `@variant dark`**, so the one definition of dark in `theme.css`
  decides and no pseudo-element is generated on paper at all (a gallery can hold hundreds of tiles).
- **Generated only where it can be drawn right**: `@supports` requires `color-mix` and
  `mask-composite` up front, because without the mask the gradient is a veil over the whole
  photograph and without `color-mix` the build's own fallback is the foreground at full strength.

## Motion

Three curves in `@theme`: `--ease-emphasis` `cubic-bezier(0.23,1,0.32,1)` (entrances/UI),
`--ease-in-out-strong` `cubic-bezier(0.77,0,0.175,1)` (moves/toggles), `--ease-drawer`
`cubic-bezier(0.32,0.72,0,1)` (sheets). Rules: UI under 300ms; **exits faster than enters**
(`data-closed:duration-*` composes with tw-animate via `--tw-duration`); press feedback =
`active:scale-[0.97]` on buttons; explicit transition properties, never `transition-all` on
primitives. Current timings: dialog 200/150 · dropdown/popover 175/120 · tooltip 150/100 (+
`skipDelayDuration` 300) · sheet 300/200 on the drawer curve · **marketing nav 200/130 with a 100ms
hover intent** (its clocks are `--mkt-dropdown-*` / `--mkt-nav-*`, [marketing-content.md](marketing-content.md)).
**A BACKGROUND WASH IS A CROSSFADE, NOT AN ENTRANCE.** A full-width glass layer on
`--ease-emphasis` reads as an instant, rough snap, and the duration is not the
problem: `--ease-emphasis` (0.23,1,0.32,1) delivers ~90% of the change inside the first third, so a
200ms wash effectively lands in ~60ms and then creeps. Large ambient surfaces want the
symmetric S (`--ease-in-out-strong`), which eases in AND out of the change instead of front-loading
it. Timing stays asymmetric per the house rule by riding the OPEN state: enter 300ms, exit 220ms.
This covers the overlay header and any full-bleed hero adopting the transparent-until-scrolled header.

### The floating-layer contract

**Bible 15: one radius, one entrance, one light, and since the `floating-surfaces` wiring
(2026-09-17) they are a MODULE rather than a sentence.**
[`floating-layer.ts`](../../src/components/ui/floating-layer.ts) exports what every panel wears and
[`floating-layer.test.ts`](../../src/components/ui/floating-layer.test.ts) refuses a primitive that
answers any of it locally. A rule spelled out in nine className strings is a rule the tenth panel
never hears about, which is how the family drifted: the nav shipped `rounded-lg` (the 2px SHARP
general-UI radius) and a stock shadow until the nav round, `select` shipped `rounded-md border` with
no entrance at all, and three panels carried three hand-typed clocks nobody had ever compared.

- **The corner** (`radius=nested`, confirmed by `roundness=nested`, Will 2026-09-17): an 8px panel
  around 4px rows. `floatingCorner` is `rounded-float`; `floatingRow` is `calc(var(--radius-float) -
  4px)`, DERIVED, because the 4px is the panel's own padding and bible 9 wants inner = outer minus the
  gap. Move a panel's padding and you have moved its rows' corner. Rows were `rounded-md` (1.6px), so
  the panel's arc missed its rows' by six times.
- **The entrance**: one LANGUAGE per kind, with the clock inside it chosen by frequency, which is how
  bible 15 and bible 12 stop disagreeing (`entrance=by-frequency`, Will 2026-09-17).
  `floatingEntrance` is the anchored one (a fade, a hair of scale, 8px of travel from the anchored
  side, on `--ease-emphasis`); `floatingEdgeEntrance` is the sheet's (the same fade, no scale, a long
  slide from its own side, on `--ease-drawer`). `floatingClock` has three rungs and no more:
  **instant** 90/70 (tooltip, dropdown, submenu, select: opened dozens of times an hour), **standard**
  200/150 (popover, dialog, and the marketing nav through its own `--mkt-dropdown-*` knobs, whose
  defaults ARE this rung), **edge** 300/200 (the sheet, where the distance is the affordance). Every
  exit is faster than its entrance and nothing is over bible 12's 300ms ceiling.
- **The light**: `shadow-layer` in BOTH modes since the light ruling (2026-09-17; it was
  `shadow-float`, which drew nothing in dark). The elevation contract above owns it and the floating
  module never re-states it.
- **No translucency, on purpose.** Will liked the glassy panel and declined a one-off of it here
  ("let's bank a near-term agent for a dedicated Glass exploration across marketing and app"), so the
  policy refuses a `backdrop-filter` on any panel until that exploration lands. A scrim's blur is not
  a panel's material and is untouched.
- **Outside the family, by name**: `drawer.tsx` (vaul owns its drag physics, and its entrance is a
  gesture rather than a curve) and `sonner.tsx` (a third-party surface themed through CSS variables;
  it already reads `--radius-float`, and the rule in `globals.css` outweighs its own shadow and
  re-states its focus ring). The navigation menu's indicator and the toast joined the shadow half in
  the light round.

**The menu's anatomy is Card** (`direction=card`, Will 2026-09-17: "Card is my overall favorite"), and
it lives in [`dropdown-menu.tsx`](../../src/components/ui/dropdown-menu.tsx) as PARTS a call site may
leave out, never as a shape baked into the panel: `DropdownMenuHeader` (the title row, what the menu
belongs to), `DropdownMenuGroup` + `DropdownMenuLabel` (Glass's quieter label, sentence case at 70
percent of the foreground, the one thing taken from that direction), the icon rail on the item itself
(a call site never colours a leading glyph again), `DropdownMenuMeta` (the trailing column: the state
you opened the menu to read) and `DropdownMenuFooter` (a ground of its own for the action you cannot
undo). Card's own cost is real and the parts answer it: a two-row overflow wears the material, the
corner, the entrance and the rail, and says nothing more.

★ **A submenu MUST be portalled, and the failure it prevents is CONDITIONAL, not total.**
`SubContent` shipped with no `Portal`, so it rendered inside `Content`, which carries
`overflow-y-auto` AND animates with a transform. A transformed ancestor becomes the containing block
for its `fixed` descendants, so a submenu opened by a CLICK (which puts the parent into its closing
animation) had a real measured box, its rows, and painted nothing; a scrolled parent clipped it the
same way. Hover on a settled parent worked, which is how it survived to production. **A menu stops at
two levels** (Will, 2026-09-17: a third "gets too complicated"), and the cap is structural: each `Sub`
publishes its depth and a third one throws at render, so there is no third level to review.

Three reusable
patterns serve the layer: the **`data-swap`-gated box morph** (a size transition must be armed
only when there is a previous size to morph FROM, or a measured-late 0×0 first frame animates as a
wipe), the **glass LAYER** (`backdrop-filter` on an inert `-z-10` sibling whose `opacity` animates,
never a class-toggled filter on the bar itself, which both snaps and drags every descendant's repaint
into a blurred region), and the **measured indicator** (JS writes `offsetLeft`/`offsetWidth`, CSS owns
the tween; the first placement MUST suspend the transition and force a reflow or it flies in from
x=0). Hover is the one place enters may be SLOWER than exits: a row that is skimmed rather than
studied needs its in inside ~90ms and can take ~180ms to fade back out.

### Skeletons, tiles and the reveal chips

Skeletons shimmer via a
background-position sweep (`--animate-shimmer`, linear on purpose: ambient loop, a strong curve
stutters at the loop point). **`MediaTile` (every gallery tile) renders the shimmer skeleton under the photo
until it decodes, then fades the photo in over it:** a cold presigned-R2 load (no thumbnail variant)
reads as shimmer→photo, never a black square that pops; reduced motion drops to a static muted block. The
host-review takeover pairs this with a preload of the just-approved photos during the all-caught-up beat so
the album reveal paints from cache (see [host-app.md](host-app.md)). The host tile action row uses the
**`[data-reveal-chip]`** hook (globals.css): hover-reveal chips collapse their width + margin at rest so the
persistent chips (liked / in-reel / hidden) pack to the right edge, then slide back on tile hover (the row is
margin-spaced, not gap, so no residual gap; reduced-motion = opacity-only). **GOTCHA:** the hook is
`!important` because it lives in `@layer base` but the chips carry their own Tailwind `transition`/`ml-1` in
the higher `utilities` layer (which silently overrides it: no slide, residual gaps); and it expands on
`:hover` / `:focus-visible` / `:has(:focus-visible)`, NOT `:focus-within`, so a mouse click doesn't leave a
chip stuck-expanded after the cursor leaves.

**THE ARRIVAL-DEFAULT CONTRACT (bible 13): the VISIBLE state is the
default; the hidden state belongs to the trigger, never to the element at rest.** Two failures say
why: plates animating from `opacity: 0` gated on `[data-inview]` leave every cover permanently
invisible wherever no
`Reveal` wraps them, and an observer-gated hairline is an invisible divider on every path that
fails to trip. So a cover plate paints a static muted base and only the PHOTO develops over it, and
arrival hooks that must not depend on scroll (`[data-mkt-develop]`, `[data-mkt-rule]`,
`[data-mkt-entering]`, marketing.css) fire on **`@starting-style`** instead of an observer. Failure
mode becomes "no animation", never "no content". Reach for the observer grammar
(`[data-mkt-reveal]` + `Reveal`) when the beat is genuinely about scroll position; reach for
`@starting-style` when it is about arrival. The base-and-band landmine under Light is the same
contract read through the glow engine.

★ **A FILLING ANIMATION OUTRANKS EVERY AUTHOR DECLARATION, so an entrance and a hover state can
never share an element.** `[data-mkt-cut]` (and any `animation-fill-mode: both` entrance) keeps
applying its final keyframe forever once it completes, and the animation origin beats author-normal
in the cascade, so a later rule setting the same property on that element is inert. The symptom is
maddening: the selector matches, DevTools shows the rule, and nothing moves (a cut pinning
`opacity: 1` over a light-table dim that silently never applies). Put the entrance on an
inner layer and the interactive state on the outer one.

★ **`:has(:focus-visible)` matches in `element.matches()` but does not repaint.** Chromium invalidates
a `:has()` ancestor on `:hover` changes but not reliably on focus-visible changes, so a
`:has(:focus-visible)` isolate is live, matching, and dead. Use `:focus-within`, which propagates
natively with no `:has()` involved. The standing `:focus-within` objection (a mouse click pins the
state on) is contextual, not absolute: on the press sheet's light table a clicked frame staying
picked is the wanted behaviour, on `[data-reveal-chip]` it is not.

★ **`position: sticky` on a grid item is a silent no-op without `self-start`.** A grid item stretches
to its row's height by default, so it already spans the whole scroll range and has nothing left to
stick through. `PressSection`'s pinned column is the worked example (`lg:sticky lg:top-… lg:self-start`);
its offset rides `--mkt-header-h` rather than a hardcoded rem so a retuned header cannot strand it
under the bar.

**Reduced motion:** a global guard in globals.css clamps animation/transition durations to
`0.01ms` (NEVER `0`: radix exit-unmount and the lightbox settle wait on
`transitionend`/`animationend`) and stops infinite loops. Component-level
`motion-reduce:`/`no-preference` gates stay as the first line.

## Icon + small-type rules

Icons paired with text render muted (`text-muted-foreground`/reduced opacity) unless they ARE the
action. Small labels get positive tracking; letter-spacing/line-height run inverse to size.

## Error taxonomy (the UX contract)

`src/lib/errors/`: `ErrorCode` is the superset union of every failure code; per-file result unions
stay narrow and MUST fit inside it (compiler-enforced by `codes.test.ts`: a route code added
without taxonomy copy fails the build). Failure arms are `{ ok: false, code, message? }`; clients
surface via `showActionError`/`showErrorToast` (producer message > `FALLBACK_MESSAGES[code]` >
generic default). Copy rules: plain language, no em-dashes (bible 19), no internals; the
wording itself is open like every other line on the site (bible 21), so a round that improves
an error message is doing its job, not breaking a contract.

**Boundaries:** every route group has an `error.tsx` → the shared `RouteError` (generic copy +
`digest` as the support handle; it NEVER renders `error.message`, which is the security invariant)
tagged `render:app|guest|marketing|admin|auth` in Sentry; `global-error.tsx` is dependency-free
(own html/body, inline styles) for root-layout death. The gated `/design/lab/tools/boom` probe throws on
purpose to verify the chain against the real prod build (dev shows the overlay instead).
`notFound()` is never caught by these.

## The craft guidance stack

The craft stack and the skills live in [`docs/design/guidance.md`](../design/guidance.md), rendered
at `/design/library/guidance`, with the rest of the rule set around them (the levels, the law, the
policies). Guidance is a level of authority, not a chapter of what shipped, so it belongs in the
design rule set rather than in this doc. It is still the default an agent leaves on purpose, and a
departure is flagged on the board or in the manifest rather than argued for in advance.

## Stagger (the gallery entrance)

The `[data-media-tile]` `@starting-style` entrance carries a per-index delay:
`transition-delay: min(calc(var(--tile-i, 0) * 45ms), 540ms)`. The guest masonry sets `--tile-i` on the
SEED render ONLY (a render-once ids `Set`); doorbell/poll-arrived tiles carry `--tile-i: 0` and land
immediately. The cap (540ms) stops deep galleries from queuing forever; reduced-motion drops the move.

## Event-feed + review motion + the live motion tuner

The host event feed ([host-app.md](host-app.md)) is the densest motion cluster, all CSS-first,
reduced-motion-safe, and var-tunable. The motion-defining picks:
- **A=Condense:** the sticky pill bar gains `data-stuck` once the feed scrolls past its top sentinel:
  a hairline + backdrop, and the pills shrink (`h-8`→`h-7`, smaller text) on a `transition-[transform,height,padding,font-size]`.
- **B=Fade** (`[data-section-swap]`): the feed container is re-keyed on a pill change (and the floating
  bar's content on the active section), so `@starting-style` fires a crossfade + rise (opacity+translateY,
  `--tune-section-swap-ms`; a blur variant was REJECTED). Hardware-accelerated, reduced-motion = fade.
- **C=FLIP** (`useFlip`, [`use-flip.ts`](../../src/lib/shared/use-flip.ts)): when the urgency order flips
  (the review queue clears), the sections slide to their new positions via a hand-rolled First-Last-Invert-Play
  (`--tune-reorder-ms`, `--ease-in-out-strong`); reduced motion = instant. Chosen over framer-motion's
  `layout` (cleaner, off the main thread, no dependency; the project ships no `motion`). **Two-axis**:
  it inverts X as well as Y, so a filtered multi-column grid reorganizes correctly and nothing needs
  the second, unextracted FLIP inside `use-sortable-grid.ts`; `dx` is 0 for any full-width stack, so the event
  feed is unaffected. It also PRUNES prev rects for unmounted keys each pass, and without that a node that
  leaves a filtered set keeps a stale rect and, on returning, flies in from wherever it sat under a different
  filter. The prune cannot live in the ref cleanup: `register(key)` returns a fresh closure per render, so
  React detaches every node on every render and dropping prev on null would disable the FLIP outright.
- **The two-beat set change: removal and reflow are never the same
  beat.** Departing items leave TOGETHER (`transition-delay: 0` on all of them) on a short clock, and only
  once that is spent does the set commit and the FLIP reorganize the survivors; entrants fade in on a delay
  so the reorganize stays legible underneath them. Animating removal and reflow at once is what makes a
  filter read cheap: the eye cannot separate what left from what moved. The exit and the FLIP must sit on
  SEPARATE elements (exit on the item, FLIP on its wrapper) or the FLIP's inline `transition: transform`
  clobbers the exit's transition property. Hooks: `[data-mkt-exiting]` / `[data-mkt-entering]` +
  `--mkt-blog-*` (marketing.css).
- `[data-review-tile][data-exiting]`: the bulk-action REMOVAL EXIT (opacity→0 / `scale(0.9)`,
  `--tune-review-exit-ms`, `transition-delay:0` so the acted set leaves TOGETHER). The inline review opts OUT
  of the `[data-review-tile]` open cascade (no entrance theater on an always-present surface; the cascade hook
  is kept for the tuner's lab replay).
- `[data-unlock-success]`: the ALL-CAUGHT-UP beat; `useReviewTriage.run()` holds it `--tune-review-beat-ms`
  IN PLACE, then `caughtUp` clears → the urgency order recomputes → the FLIP relocates the
  now-empty Review section to the bottom.
- `[data-check-pop]`: the selection-checkmark scale-in (review tiles + QR presets); `[data-preset-arrive]`:
  the QR-preset cascade (a KEYFRAME, NOT a transition, so the swatch's `transition-colors` hover survives).

★ **JS-timed motion reads vars with `readCssMs` ([`read-css-ms.ts`](../../src/lib/shared/read-css-ms.ts)), never
`parseInt`.** The build minifier (Lightning CSS, via Tailwind v4) canonicalizes `<time>` to its shortest form,
so `2500ms` ships as `2.5s`; `parseInt("2.5s")` is `2`, which collapses a 2500ms beat to ~2ms.
`parseCssMs` handles `s`/`ms`/bare (unit-tested).

**The baked motion values** (globals.css `:root`): `--tune-route-fade-ms` 310 / `--tune-route-fade-ease`
ease-out, `--tune-section-swap-ms` 180, `--tune-reorder-ms` 500, `--tune-review-beat-ms` 2500, plus the
REEL REVEAL grammar's `--tune-rvl-*` / `--tune-rxp-*` set (its tuner knobs are annotated "ratified,
revisit-only"; per the tuner contract a retune must move the config
default + the CSS fallback + any JS fallback together). The tuner overrides
these live with an inline style on `<html>` (which outranks `:root`), so the playground tunes against them.

**The contextual floating action bar** ([`event-feed-action-bar.tsx`](../../src/components/app/event-feed/event-feed-action-bar.tsx)):
one fixed-bottom surface that follows a scroll-spy (`useActiveSection`) and MORPHS its action to the section in
view (the floating Add generalized). The morph crossfades via the same `[data-section-swap]` language; each
section self-surfaces its control (primary Add pill / a neutral card holding the review cluster / a disabled
placeholder). Reuse this when a long scroll needs a section-aware action always in reach.

**Multi-select primitives** (Review triage + the Gallery album bulk-select share these). `useSelection(ids)`
([`event-feed/use-selection.ts`](../../src/components/app/event-feed/use-selection.ts)) is the pure state machine
(`selected` Set / `selectMode` / toggle / selectAll / enterSelect(seed) / exitSelect); it PRUNES the
selection to the surviving ids when the universe changes, never resets, so a background poll/revalidate can't
wipe an in-progress multi-select. `SelectableMediaGrid`
([`event-feed/selectable-media-grid.tsx`](../../src/components/app/event-feed/selectable-media-grid.tsx)) is the
shared selectable masonry (the `[data-check-pop]` checkmark + `[data-exiting]` removal beat; `enablePreview` for
Review's peek; `clampAspect` MUST match the surface's normal grid or toggling select reflows tile heights). The
selection STATE is lifted to a thin provider (`HostSelectionProvider`, mirrors `HostAddProvider`) so a grid and
a scroll-following bar share it; the grid REGISTERS its optimistic bulk handlers and the bar calls
`run(kind)`: the registration seam to use whenever a control surface and its target grid live in different
subtrees. Long-press entry rides `use-long-press.ts` (opt-in `onTileLongPress`, a capture-phase click-suppress).

**Grid layout + the sortable primitive.** The shared grids take a `layout: "masonry" | "uniform"` prop
(default masonry): **masonry** = natural-ratio CSS columns (the Gallery "wow"); **uniform** = a fixed
`UNIFORM_TILE_ASPECT` (`4/5`) `object-cover` CSS grid (`grid-cols-3 sm:grid-cols-4`) for the Reel + Review,
where uniformity makes a drag-order / selection hit-targets legible. Drag-reorder rides our own
dependency-free [`useSortableGrid`](../../src/lib/shared/use-sortable-grid.ts) (the project ships no
framer-motion and no drag lib): a hand-rolled pointer machine (modeled on the lightbox swipe) + a 2-axis
FLIP for the sibling slide (mirrors `use-flip` but X AND Y; `--tune-reorder-ms` / `--ease-in-out-strong`,
reduced-motion = instant). The dragged tile is finger-followed via an imperative transform (excluded from the
slide). Why hand-rolled beats dnd-kit HERE: on a uniform grid the drop-index is two integer divisions
(`pointToIndex`, unit-tested), so a drag lib's collision/sensor machinery buys nothing. Touch grabs behind a
450ms press (a scroll never reorders); `touch-none` in the focused reorder mode + edge autoscroll reach
off-screen tiles; keyboard reorder (space / arrows / enter / escape) is free since the order math is index-based.

**The motion tuner** ([`motion-tuner.tsx`](../../src/components/dev/motion-tuner.tsx) + `motion-tuner-config.ts`
+ `tuner-store.ts`): a panel that writes CSS vars as inline
styles on the element that declares them (`<html>` for the app's `--tune-*` and the radius tokens, the
`[data-mkt]` wrapper for `--mkt-*`) so any var-backed timing or radius can be finetuned LIVE, no rebuild. The
working set lives in a module store persisted to `localStorage` and re-applied on every mount, so a value
survives a Replay, a navigation out of the cinema group and a reload; Reset clears it and the badge always
counts what stands. Every knob carries a `description`, a `ships` line and a `group`, and every knob has a
specimen where the tuner mounts (the playground at [`/design/lab/tools/motion`](../../src/app/(dev)/design/(shell)/lab/tools/motion/page.tsx),
the real cinema pages, the Library's radius section at `/design/library/foundations#radius`); a knob without one is retired rather than left as a dead
slider, and retiring a knob leaves its var and its bake untouched. Contract: an increment APPENDS its
knobs with all three fields and a specimen in the same commit,
the config `default` MIRRORS the CSS default, and any JS-read var (`run()`'s `readCssMs`) falls back to a
constant that ALSO mirrors it. Bake a tuned value: Copy CSS (grouped, per scope) → set it as the default → Reset.
**The candidate block:** a lab board can hand the whole site one
CSS paste, the same block its ruling would land (a token set, a shadow family, a floating rung), through
`setCandidateCss(label, css)` / `clearCandidate()` in `tuner-store.ts`; `CandidateStyle` renders it as a `<style>`
after every stylesheet wherever a key-gated island mounts (the lab layout, the cinema and paper islands, the
host app's `AppDesignIsland`), so Will judges a candidate on the real pages with `?key=`. One block at a time,
labelled, persisted in the browser until cleared from the panel or the board; real selectors only
(`:root, .surface-paper`, `.dark`, `.surface-ink`, a primitive's class), never a production path.

**State-colored toasts (global policy):** sonner's `data-type` is mapped to the design state colors,
`success` = `--success` green, `warning` = `--warning` amber, `error`/destructive = `--destructive` red;
plain/info toasts keep the neutral `--normal-*` default. Use the right TYPE for the state: approve/positive =
`toast.success`, HIDE/soft-caution = `toast.warning`, failures = `toast.error`. The CSS (globals.css) targets
sonner's OWN `[data-sonner-toast][data-type="…"]` with **`!important`**, never the `classNames.toast` hook:
sonner injects a neutral `--normal-bg` rule at runtime (unlayered, non-important) that beats a
class rule on layer/order, so a more-specific `!important` is required. Verify it on the toast's
computed `backgroundColor` matching the token, the RENDERED color, not just that the rule loaded.
**Red is for FAILURE, full stop** (Will, 2026-06-21): a successful destructive confirmation ("Permanently
deleted.", "Event deleted", "Removed from saved.") stays `toast.success` (GREEN), because the action
succeeded and it reads as a positive completion; `toast.error` (red) is reserved strictly for things that
went wrong. So delete that worked = green, delete that failed = red. There is no separate
destructive-confirmation variant; the green-on-success convention carries it.

## The arrival choreography ("Calm + 700ms")

The guest arrival is the sanctioned RARE/FIRST-TIME moment (the craft standard's exception to the
under-300ms rule): the entry sheet ENTERS on vaul's native 500ms iOS drawer curve after a 700ms
arrival beat; everything repeated stays fast (exit 250ms, steps 220ms, height glide 300ms). The
choreography attributes (all `@starting-style`, reduced-motion = fades): `data-arrive`/`--arrive-i`
(the locked page settles), `[data-entry-step][data-dir]` (directional step handoffs) +
`[data-entry-exit]` (the inverted-@starting-style exit clone), `data-unlock-success` (the gate
button's green morph content), `data-reveal`/`--reveal-i` (the unlock reveal: 150ms + 50ms steps)
held back by `[data-reveal-curtain]` until the success beat releases. Constants live in
`use-arrival-beat.ts` (700/350/0) + `use-success-hold.ts` (900ms beat / 1.5s slow / 8s watchdog);
the ratification record is touchpoint 11's `decisionNote`.

**★ The vaul motion gotcha:** with no `snapPoints`, vaul's open/close runs on KEYFRAME ANIMATIONS
from its injected stylesheet (`slideToBottom`/`fadeOut`, 0.5s), so `transition-duration` overrides do
NOTHING there; the exits-faster rule must override `animation-duration` (`!important`, scoped to
`data-state="closed"`). The drawer's TRANSITION only drives drag-release snap-back (under
`data-state="open"`), so never touch it.

**Two adjacent craft rules:** any full-width `inset-x-0` overlay floating
above a GESTURE track needs `pointer-events-none` on the box + `pointer-events-auto` on just its
controls (`items-center` centers children but the BOX stays edge-to-edge and eats pointerdown across
its flanks, which kills swipe-nav on every shared-viewer surface at once). And the repo's
react-hooks lint bans setState-in-effect sync resets, so use the adjust-state-during-render pattern
(prev-state comparison) for transient view resets.

## The component index and the gallery

The library renders itself. A component is **declared once**, in its family's
`src/app/(dev)/design/<family>/gallery-demos.tsx` (its id, its section, its variants, its specimens,
and the id of a config panel where it has one), and three surfaces render from that one declaration:
its family page, its permalink at `/design/library/<id>`, and the searchable index of all of them at
`/design/library`. The declaration carries only what code cannot derive: the file, the exported
names, the specimen routes and the contracts come off `rules.generated.json`
([`scripts/design-rules/collect.mjs`](../../scripts/design-rules/collect.mjs)), and the `for` line
plus any no-specimen reason come off
[`component-notes.ts`](../../src/app/(dev)/design/rules/component-notes.ts), joined in
`gallery/registry.ts`. A component outside the six indexed directories (the product components under
`src/components/app`) declares its own `file` and joins on that.

★ **A family is the page that MOUNTS the specimen, and an entry module must live in that page's
directory.** The collector reads a component's specimen route from the directory of the `page.tsx`
or `*-demos.tsx` file that imports it, so a demo module in the wrong folder indexes its components at
a route that does not exist, and nothing says so. It also means `family` is not always the
component's own
directory, and should not be made to be: Glow lives in `src/components/shared` and belongs beside the
light tokens on `/design/library/foundations`.

Two guards keep it honest. `component-index.test.ts` fails when a library component has neither a
specimen nor a recorded reason. `gallery/gallery.test.ts` fails when a component has no gallery entry
or no `for` line, when a config panel is unreachable or shared, and, the one that earns its keep,
when a DECLARED variant is not a variant the component has: a `cva` axis is compared key for key
against the component's own `variants` block and its `defaultVariants`, and a `prop` or `declared`
axis must at least name values the source contains. A declared axis that has silently fallen behind
the component (five Badge variants of six, four Button sizes of eight) is exactly what it catches.

## Where it lives

`src/app/globals.css` (tokens + utilities + guards, the single source; its `@theme` block and the `dark`
variant sit in `src/app/theme.css`, shared with the lab's own Tailwind entry) ·
`src/app/layout.tsx` (font loading) · `src/components/ui/*` (the crafted primitives) ·
`src/lib/errors/` (taxonomy) · `src/components/vendor/*` (third-party packages copied in verbatim) · `src/components/shared/route-error.tsx` + the route-group
`error.tsx` files · `src/app/(dev)/design/` (the lab, two areas on one shell:
`(shell)/library/` is everything that binds or informs (the bible at `/design/library/rules`,
`rules/bible.ts` hand-authored; the policies and landmines; the guidance; Will's rulings from
`docs/design/rulings.md`; the doctrine, the system docs rendered; the record; the glossary; the index and
every component's permalink plus the five family galleries, each declared once in its family's
`gallery-demos.tsx`) and `(shell)/lab/` is everything exploratory (the desk, `/design/lab/<board>`,
proposals from `docs/specs/`, tracks from `docs/tracks/`, the kit, the tools); `(shell)/_shell/` the chrome
and the page templates; `_data/` the nav model, the link grammar (`links.ts`), the markdown reader
(`docs.ts`), the legacy redirects; the component contracts (every test tagged `@contract-for`, collected by
`pnpm design:rules` into `rules/rules.generated.json`, `rules-registry.test.ts` pinning it fresh);
`touchpoints.ts` the rulings registry; `sandbox/` the open boards with their own sheets and, outside the
shell group, the iframe scene routes; `src/components/lab/board-spec.ts` the board spec type; the
authority model in [`../design/README.md`](../design/README.md); `pnpm lab:smoke` crawls every lab route) · `src/lib/design-gate/*` +
`/api/design-gate` (the gate, outside the lab because production depends on it) ·
[`../design/rulings.md`](../design/rulings.md) (Will's rulings, verbatim). The perf
baseline and its repeatable method are in git: `git show 44090827:docs/perf/v1-baseline.md`.

## Gotchas / don't-revert

- ★ **A bare `<code>`, `<pre>`, `<kbd>` or `<samp>` renders in a mono stack with no class at all.**
  Tailwind's preflight sets `font-family: var(--default-mono-font-family, ui-monospace, …)` on those
  four elements, which no `font-mono` grep will ever find. Give any of them `font-sans` (the `Kbd` atom
  is the model), and a prose container `prose-code:font-sans`: that one variant on the two long-form
  wrappers covers the ~260 inline code spans in `content/help` and `content/blog`.
- The lab renders on the REAL tokens, one design language; only a dark
  override remains for the two legacy marketing boards until the migration wave deletes them. `design.css`
  keeps the shell's grid (the sidebar and TOC rails under `--lab-topbar-h`, `[data-lab-wide]` pages), the
  boards' hooks (`[data-dir-display|card|press|enter|stagger]`) and the shared motion, and declares NO
  keyframes: keyframe names are document-global, so a lab keyframe shadows the production name of the same
  spelling on every `/design` visit; `src/app/keyframe-uniqueness.test.ts` holds the count at zero. A
  board's own CSS lives beside the board under `sandbox/`, imported by it, so it leaves with it.
- The behavior pins (`*.test.tsx`, the component vitest project) freeze MediaLightbox / GuestUpload /
  LikesProvider behavior: they assert behavior only, never
  styles, so token/craft changes don't touch them.
- jsdom can't run the lightbox pause-on-navigate effect (portal/commit timing); that one pin is
  dropped on purpose, so cover it in live device passes.
- ★ **The lab's gate runs in the proxy, before any lab layout renders.**
  The shell layout builds the nav (every component, board, proposal and track by name) and a
  layout cannot read `searchParams`, so a page-level `notFound()` comes too late: a keyless request
  answers 200 with the layout's props in the flight payload while the page draws the
  404. `src/proxy.ts` runs `designGateOpen` on every `/design` request (a refused one is rewritten to
  a path no route serves, a real 404 like any missing URL) and forwards the key as the `x-design-key`
  header the shell layout reads; the pages still call `requireDesignKey`. Never wrap the shell layout's
  page in a Suspense boundary (it lets a page's `notFound()` answer 200) and never read the key in the
  shell with `useSearchParams` (it needs that boundary). `pnpm lab:smoke --production` proves it.
- ★ **Two Tailwind entries, one theme, two scans.** `globals.css` excludes
  the lab and `docs/` from its scan (`@source not`), and the lab compiles its own utilities from the entry at
  the top of `design.css`, which `@reference`s `theme.css`. Never `@reference "globals.css"` from the lab: it
  drags the exclusion along and the lab compiles nothing (19 rules against 695, measured). Never move a
  token VALUE into `theme.css`: it holds only the variant and the `@theme` mapping. Pinned by
  `src/app/css-source-policy.test.ts`.
- `vitest.setup.ts` mocks sonner globally; `vi.unmock("sonner")` is the per-file escape hatch.
- shadcn `src/components/ui/*` files are semicolon-free (generator style); app code uses
  semicolons. Don't reformat either direction.
- **The lab and production are BOTH provisional, and the arrow points both ways.** A lab specimen is
  often an early prototype of FUTURE UI, and a shipped surface is sometimes itself a minimal stand-in
  that has not been designed yet. So a mismatch between a specimen and the production surface it names
  does NOT establish that the specimen is wrong: **a minimal production surface is not evidence against
  a specimen.** When a proposal does not fit its surface there are three answers, and collapsing the
  middle one into "reject" is the easy mistake:
  (1) the PLACEMENT is wrong, so re-assign it to whatever the surface's own properties call for;
  (2) the SURFACE is provisional and will grow into it, so park the placement and design the two
  together in that surface's own round; (3) the SURFACE should change on its own merits, which is its
  own design round, argued from what the surface should be and NEVER from what the effect needs.
  Which of the three applies is usually roadmap knowledge rather than something readable from the code,
  so ask rather than infer, and record the answer beside the placement.
- **`src/components/vendor/*` is third-party source copied in verbatim, and is NOT ours to restyle.**
  Prettier (`.prettierignore`) and the em-dash policy (the `SKIP` regex) look away entirely; eslint
  does NOT, it lints the folder fully minus exactly two rules (`react-hooks/set-state-in-effect` and
  `@typescript-eslint/no-unused-vars`, both of which BorderBeam genuinely trips, so the override is
  load-bearing rather than cosmetic). The net is that the usual gate would not catch a restyle there. The em-dash
  exemption is the subtle one: that scanner reads every template literal as user-facing copy, which
  is right for our code and wrong for a CSS-in-JS package, where an em-dash inside a `/* */` CSS
  comment never reaches a user. Because all three look away,
  [`border-beam-vendor.test.ts`](../../src/components/dev/border-beam-vendor.test.ts) pins what is
  left: the licence notice in every file, an EXACT count of marked deviations (a floor such as `>= 2`
  against an actual 11 can never fail, so the count is exact), and the palette parity
  the A/B depends on. Two `react-hooks/set-state-in-effect` sites inside `BorderBeam.tsx` are known,
  accepted, and NOT gate-verified, which the rounds that place the beam should know. Compose ON a vendored package from your own file; never edit it in place, and mark
  any unavoidable deviation `PARTYREEL:`. The one vendored package is border-beam v1.4.0 (MIT),
  vendored because a hand-port substitutes our low-chroma five into a palette tuned at the sRGB
  gamut edge and then compensates with filters.
- ★ **`mask-composite: intersect` does NOT intersect two mask layers in Chrome.** With
  `mask-image: a, b`, the last layer's operator composites it against transparent
  black, so the pair resolves to the union and a two-axis dissolve silently does nothing. Split the
  masks across two nested elements, one mask each; it costs one div and is unambiguous in every engine.
- ★ **A Tailwind breakpoint prefix inside a board's `Stage` reads the REAL browser viewport, not the
  canvas.** `sm:` fires inside the 375 stage on a desktop window and
  never fires on a phone-width window showing the 1440 canvas, so a board silently reviews the wrong
  layout. A board's own markup keys off the
  `mode` prop; the real production components carry their own prefixes and are judged as they ship.
- ★ **The lab's compiled utilities live in the `utilities.lab` sub-layer** (`design.css`).
  The lab sheet loads after `globals.css`; in one shared `utilities` layer its copy of an
  unprefixed utility beats a production component's responsive one on the same element (`grid-cols-1`
  over `lg:grid-cols-12`), so every real section a board mounts at 1440 lays out as its phone version.
  Rules directly in `utilities` outrank the sub-layer, so production wins on a shared element; a board
  that must override a production class on the same element uses its own sheet or `cn()`. Pinned by
  `css-source-policy.test.ts`. The remaining limit is the ★ above on breakpoints: a production section
  inside a 375 stage still lays out for the real window, so judge phone chrome in an iframe at 375.
