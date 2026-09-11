# Design system (V1 identity + tokens + motion)

> ROLE: the locked V1 visual system: token contracts, type, rounding, elevation, motion, state
> colors, the error taxonomy's UX contract, and the craft-guidance stack.
> BELONGS HERE: what the system IS + its invariants + don't-reverts. · NOT HERE: how it was chosen
> (→ the design lab + `adr/`), per-surface redesigns (each surface's owning phase), shipping
> narrative (→ [`../CHANGELOG.md`](../CHANGELOG.md)).
> GROWS BY: edit-in-place as tokens/rules evolve; the lab (`/design`) stays the experimentation
> venue, this doc records what's ratified.

## What it is

Ratified in V1 program Phase 1 (the gated `/design` lab), made real in Phase 2: production tokens in
[`src/app/globals.css`](../../src/app/globals.css), the craft pass across `src/components/ui/*`,
and the error taxonomy in [`src/lib/errors/`](../../src/lib/errors). The lab is two things and never a
third (the library round, 2026-09-02): a **LIBRARY** of production imports (the reference pages render
the real components and tokens, synced by construction; `/design/marketing` renders the marketing
system on the cinema skin; the index is below) and a **WORKSHOP** that is empty by default (`sandbox/`
holds only the boards whose ruling is still open). Prototype and compare there; when a ruling lands,
the RULE moves here (or to its surface doc), the RECORD moves to
[`docs/decisions/design-record.md`](../decisions/design-record.md), and the board is deleted (git
keeps it). The thin registry the lab reads is `touchpoints.ts` (`RULINGS`: one line per ruling, where
the rule lives), rendered at `/design/record`.

## The identity: monochrome, media is the color

- **Zero-chroma chrome in BOTH modes.** Light = paper (bg `oklch(0.99 0 0)`, card `0.997`, fg
  `0.13`); dark = night (bg `0.14`, translucent card `oklch(0.21 0 0 / 0.62)`, opaque popover
  `0.23`). No pure white anywhere (Hobday rule, adopted): the bg/card lift is real but hairlines do
  the layering, not contrast.
- **`--brand` is an ALIAS of `--primary`** (ink). Don't reintroduce a brand hue; photography
  supplies all color. ("Saturate your neutrals" was consciously DECLINED: zero-chroma is the
  identity; a 0.002-0.004 warm-tint variant may get a lab round later, never silently.)
- **Feedback + actions are ALWAYS colored** (the one exception): `--success` green, `--warning` amber,
  `--like` rose, `--destructive` red, `--save` blue (the first non-state ACTION hue), and `--reel` violet
  (the host reel-curation hue, S5 R1), each with light/dark variants. State, not decoration. **The
  action-color system (P5 S3·3c) is UNIVERSAL** (guest + host; only the action SET differs — guests have no
  hide/approve/delete/reel): one color per action everywhere it appears (like=rose, save/download=blue,
  hide/show=amber, approve=green, delete=red, add-to-reel=violet), for recognizability + legible state.
  Emil rule: **monochrome at rest → full-brightness colored STROKE on direct icon-hover + a SUBTLE `/25`
  FILL on the active state** (so the outline stays legible: liked rose, in-reel violet, hidden amber); native
  `title` tooltips. Lives on the gallery tiles + the shared lightbox
  pill; brand stays mono (color is punctuation). (`--reel` violet + the `Clapperboard` icon are RATIFIED,
  Will 2026-06-21.) → [host-app.md](host-app.md) for the action model.
- **`--gallery*` stays always-dark in both themes** (media surfaces; never overridden in `.dark`).
  ★ **Painting a subtree with `bg-gallery` is only half the job.** `--ring`, `--border`, `--foreground`,
  `--muted-foreground` and `--brand` are NOT in that family, so under `.surface-paper` they keep their
  LIGHT values: `outline-ring/50` (applied to `*`) lands a **1.44:1** focus ring on the slab against a 3:1
  requirement, muted text reads **2.62:1** against 4.5:1, and a bare `border-t` paints a near-white
  hairline. All of it is INVISIBLE while working on a cinema page, where the subtree sits inside `.dark`.
  Redeclare the tokens locally on the wrapper (`[--ring:var(--gallery-foreground)]` etc.) — the
  `.surface-paper` mechanism applied to one subtree. **`--brand` must be redeclared DIRECTLY, not via
  `--primary`:** a `var()` inside a custom property is substituted at the element that DECLARES it, so
  `--brand: var(--primary)` already resolved to ink back at `:root` and inherits down resolved. The ink
  footer is the worked example ([marketing-footer.tsx](../../src/components/marketing/chrome/marketing-footer.tsx),
  pinned by `footer-contract.test.ts`).
  Three more the footer never hit, found building `CinemaChapter` (2026-08-28): **`--shadow-float` must be
  zeroed to the INVISIBLE value `0 0 0 0 oklch(0 0 0 / 0)`, never `none`** (Tailwind composes `--tw-shadow`
  into a comma-separated `box-shadow` beside the ring/inset slots, and a `none` in that list invalidates the
  whole declaration, taking any ring on the element with it — `.dark` says exactly this at its own
  declaration); **`--card-foreground` travels WITH `--card`** (shadcn `Card` is `bg-card
  text-card-foreground`, so half-redeclaring makes a Card ink-on-ink, i.e. invisible rather than merely
  wrong), same for `--muted`/`--muted-foreground`; and `--input` paints the same near-white hairline
  `--border` is redeclared to stop. Derive `--secondary`/`--accent` by `color-mix` over the gallery pair
  rather than copying `.dark`'s literals, or the two drift the first time the dark ramp is retuned.
- ★ **A hand-assembled dark set is for a LEAF, never a page's chrome — and the measurement that closed
  the question.** The ink footer's redeclaration works because the footer is a leaf: it knows every token
  its own children read. Scale that to page chrome and it fails, because such a set is always one token
  behind whatever a descendant asks for next. The /about round tried it (a `(spotlight)` group whose
  sticky header wore a 21-entry `--gallery*` set) and the set omitted `--popover` on the reasonable
  assumption that popovers portal out of the subtree. Radix ones do; **the marketing desktop nav panels
  render IN FLOW inside the header**, so they painted `--foreground` white `lab(96.52)` on `--popover`
  white `lab(99.65)`: all seven primary nav titles at **~1.07:1**, measured live. Nothing in the code
  looked wrong, and on a cinema page the identical markup is correct. So: a page that wants dark chrome
  JOINS THE `(cinema)` GROUP, where `.dark` flips the whole block and nothing can be left behind. Never
  re-derive the group from the paper side.
- ★ **Two silent traps a seam-straddling child sets** (the /help + /about idiom, worth knowing wherever a
  visual is pulled across a chapter cut with a negative margin). The chapter must NOT carry `isolate`: it
  creates a stacking context and TRAPS the straddling child's z-index, so the next section's background
  paints over the thing meant to overhang (the footer wants `isolate`; a chapter never does). And the
  straddling child's wrapper needs a block formatting context (`flow-root`) or the negative margin
  COLLAPSES THROUGH it and escapes as the ancestor's own margin, leaving the ground running on past the
  child and the next section's text rendering over it. `/help` avoids the second only because its straddle
  sits inside a section that already has vertical padding. A straddling child also carries `surface-paper`
  ITSELF, which re-aliases the whole light block including `--shadow-float`: the attribute that makes it
  straddle is the one that gives back its elevation.
- ★ **A rotated tile needs more frame than its size suggests.** A square's bounding box grows with
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
  padding. Do NOT reach for `!` here — an `!` wins at one breakpoint and loses at another, which is the
  symptom itself (`/about`'s hero carried `pt-28!`/`sm:pt-40!`, and the `!` on `sm:pt-40` silently beat
  the un-`!`'d `lg:pt-44` at every width above 1024px).
- ★ **Where a frame's height and a seam's offset are derived from each other, keep both in one place.**
  /about's gather is the worked example: `.mkt-gather-straddle`'s percentage and its twin
  `.mkt-gather-clear` are ONE calculation and sit together in marketing.css, so retuning one cannot
  strand the other. They were two magic numbers in two files and that is how the album landed on the prose.
- ★ **Before believing "Tailwind emitted no rule", check your grep.** Tailwind escapes `[`, `]` and `.`
  in generated selectors, so `py-[0.08em]` ships as `.py-\[0\.08em\]` and a search for the raw class text
  finds NOTHING while the rule is present and working. An earlier version of this doc recorded
  "Tailwind can emit nothing for an arbitrary utility, silently" from exactly that mistake; re-tested
  2026-08-28 against a clean production build, every arbitrary utility emitted correctly. Two things
  that ARE real and produce the same symptom: a **stale dev CSS chunk** (Turbopack's chunk URLs are not
  content-hashed and it reuses filenames ACROSS worktrees, so a browser — or a second browser on the
  same port — can serve you another tree's stylesheet; the mechanism and the fix are in
  [testing-verification.md](testing-verification.md), and it has now cost two rounds), and `text-*`
  needing `text-[length:...]` for a `clamp()` because v4 cannot tell a size from a color. Load-bearing
  geometry still belongs in the stylesheet that owns the component's other CSS, for readability, not
  because utilities are unreliable.
- `BRAND_HEX` (`src/lib/constants/site.ts`) is ink `#101010` for OG/satori; the real logo/OG design
  pass is Phase 6.
- The QR preset corner tints (e.g. the legacy coral) are INTENTIONAL exceptions: existing events
  keep their chosen rendering, scanners locate corners by shape, and the share studio (ROADMAP)
  redesigns presets wholesale. No longer tied to any UI token.

## Chapters: the attention arc

> Will's ruling, 2026-09-01, made while reviewing the homepage's light. Recorded close to his own
> words because they are the clearest statement of it, and because the first attempt to build it
> proposed a component, which is exactly wrong.

Marketing pages already alternate **cinema** (dark) and **paper** chapters to group sections and break
the monotony of an all-dark or all-paper page. The chapter idea goes one step further, and it is a
**pacing principle, not a component**:

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

- the heading a tier up (`SectionShell scale="lg"`, the ladder's one empty slot: 36/48/60)
- the hard film-cut entrance (`reveal="cinema"` / `data-mkt-cut`) instead of the soft rise
- materially more air above the opener than a body section gets
- an object that physically crosses the chapter cut (/about's gather, /help's emblem strip, /blog's
  featured card; the home album carried one until the 2026-09-01 second pass, when it fought the live
  demo across the cut and came off)
- a drawn rule (`[data-mkt-rule]`, the masthead hairline)
- a lit subject (the reel player, a screen in a dark room)
- a full-bleed frame or strip (break out of the container with `w-screen -translate-x-1/2`; it is
  safe because the cinema and paper skin wrappers clip the x axis at the viewport, so nothing ever
  scrolls sideways. That clip must stay ON THE WRAPPER: on `body` it propagates to the viewport,
  which treats `clip` as visible. Measured 2026-09-01; the why lives on the cinema layout's class)

**Scope.** Core marketing pages with enough body sections to justify chapters: home, the feature
pages, the event pages, how-it-works. **Not** the resource and utility pages (help, blog, press,
contact, about, careers, legal), which have no room to alternate chapters in the body and keep the
cinema hero → paper body → cinema close rhythm, each designed bespoke. The checkable line: **the arc
applies where a chapter holds several distinct sections; where the chapter IS the page's body (an
article, a form, a reading surface) it does not.** The "two devices at one cut would be noise" ruling
still stands: an opener that already carries a straddling object does not also take a second device.

**Two worked examples, both on the homepage (Will's own):**

- *Chapter 3, the payoff, is the model.* The reel section is visual-forward and recaptures the
  attention curation and privacy may have started to lose while conveying real information; events and
  pricing follow, less bold but still visually interesting; the FAQ and the CTA close simple. If this
  were not the last chapter, that quiet tail would be followed by a fresh opener catching attention
  again — a perfect mid-page example.
- *Chapter 1, the event, was the defect.* The hero grabs attention; the trust strip balances it and
  hits key ideas; the decomposition is a beautiful visual that is less bold than the hero and
  introduces the idea. But the chapter then **escalated** — the live demo, the loudest non-hero section
  on the page, landed immediately before the paper cut, so the next chapter had no quiet to open
  against. The fix (round 2) was two quieter guest-side sections above the live demo, and the live demo
  reworked as the chapter's closing **anchor**: a chapter can end on a strong visual that wraps its
  ideas together, as long as the sections before it have ramped down.

**A second rule from the same review (Will, 2026-09-01) governs SHAPE where the arc governs loudness:**

> No two sections back to back should feel repetitive. Otherwise, scrolling gets boring quickly.

Two neighbours may share a register (both quiet, both informative) but never a layout. The checkable
line is the page's column rhythm read top to bottom: a centred icon three-up after a centred icon
three-up reads as one long section (the two guest-side sections shipped exactly that way and were
caught on review), and "three centred sections in a row" is the specific failure to watch on a paper
chapter, where the ground is quiet and only shape carries the pacing. The home's answer: chapter 1
runs strip, ledger, three-up, stage; the paper chapter alternates left, centred, left with a masthead,
a mirrored split and a numbered ledger. The straddle left the home in the same pass: the live demo and
the straddling album were "two huge visuals fighting for attention" across one cut, so a chapter now
ends on its own air before the next one opens.

The home arc as ruled: **chapter 1** opens on the hero, supports through the trust strip, the
decomposition and the film strip, winds down through the two guest-side sections, and closes on the
live-demo anchor · **chapter 2** (paper) opens on the album as the host's masthead (a left header a tier up, the print
laid on the desk below-right; no straddle, so the live demo concludes chapter 1 on its own air) and
covers the album and the
host experience · **chapter 3** opens on the reel, supports through events and pricing, and closes on
the FAQ, the CTA and the tail.

**Heroes: registers, not a template (Will, 2026-09-02).** "Every page does not need to have a single
templated hero. In fact, that would be an incredibly boring site where you know exactly what to expect
everywhere and therefore don't really want to explore." Variety is wanted; what is not wanted is "tons
of very minor variants". So `PageHero` carries a few NAMED entrance registers (the marketing branch
added `rise` and `cut`; the blur-rise trio on /help, /contact and /careers becomes a named third, with
the h1 visible at paint), and a new hero either uses an existing register or adds a named one, never an
unnamed tweak, and never condenses the existing ones into a single template.

## Light: SPILL, BEAM, and the lamp set

> Promoted out of the lab at round 0 (2026-09-01) with the engine it governs. The two boards
> ([`sandbox/glow-doctrine-variants.tsx`](../../src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx),
> `glow-moments`) stand in the workshop for the placements still open; the rulings are
> [on the record](../decisions/design-record.md#glow-doctrine) and the rules live here, because a rule
> that lives only inside a 1,405-line lab TSX is a rule the next agent has to go excavating for.

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

**BEAM's four laws:** 1 it marks the object that is currently the LIVE SUBJECT (working, awaiting,
uploading, publishing, live). 2 One subject per view. 3 **It ends when the state ends** (a beam is a
state, never a decoration, and that is the whole difference between a live object and a pretty
border). 4 One standing exception, named so it stays an exception rather than a precedent: a premium
object at rest (Get Pro, whose card already carries stacked photographs).

**Scarcity is a DISTANCE, not a count** (amended in the lab after a whole-page test falsified the
first version): roughly a viewport of unlit page between lamps.

**NEVER:** nav panels and dropdowns (no lamp, and the frequency doctrine forbids theater on the
most-used controls) · the storage meter near its cap and upload errors/retry (the moment spill can
mean "warning" it is a state colour and the system is decoration; failure is `--destructive`, full
stop) · generic skeletons (a skeleton is an absence; spill needs a presence) · every CtaBand (the
every-section-gets-a-version failure under another name) · the admin portal.

**The four-question LampCard is the anti-sprawl mechanism.** A placement that cannot answer all four
cannot be built, and the form is answerable by someone other than its author: **Lamp** (what is
emitting?) · **Direction** (from where?) · **Colour** (sampled from what, or the lamp set?) ·
**Admitted by** (which law lets this in?). It has demonstrably decided cases on its own terms: it
killed the pointer lamp, the CTA rim and the upload light.

### The lamp set, and its three registers

The five HUES are the identity constant: **25 coral, 85 amber, 155 green, 255 blue, 305 violet**.
What varies per surface is the REGISTER, not the hue.

| Register | Values live in | For |
| --- | --- | --- |
| **Ambient** | `--lamp-1..5`, [globals.css](../../src/app/globals.css) | Light falling on things: spill, the confetti canvas. Hand-tuned per hue (85 needs a higher L than 305 to read equally bright), which is why it is not one flat L/C row |
| **Paper** | `SPILL_REGISTER.paper`, [sampled-palette.ts](../../src/lib/shared/sampled-palette.ts) | The same light on a near-white ground. Exists because sampled light made a paper card "look dirty rather than lit". Uniform L/C today, so a hand-tuned paper five is still an open design task |
| **Live** | the `partyreel` entry in the vendored [border-beam styles.ts](../../src/components/vendor/border-beam/styles.ts) | The beam. Same five hues, raised to the chroma a gamut-edge gradient needs, **generated by `glow-contrast.ts`'s `oklchToSrgb`**, hue held exactly. It is a DERIVED register, not a second palette. It cannot be a `var()`: that file regex-parses `rgb()` strings to compute alpha variants, so a token would silently break it. Pinned by `border-beam-vendor.test.ts` instead |

★ **The lamp set is LIGHT, never UI.** Never a text, border, background, state or brand colour. The
identity stays achromatic and media-forward; these five exist so the LIGHT in a room can carry colour
while the room does not. Enforced two ways: the block is deliberately **not** in `@theme` (so no
`bg-lamp-1` / `text-lamp-1` utility is ever generated), and a fence in
[globals-theme-contract.test.ts](../../src/app/globals-theme-contract.test.ts) requires every CSS
reference to land in a gradient or in another custom property that re-exports it.

★★ **Which sampler you pick decides whether law 3 fires on guest media.** `useSampledPalette` (the
URL form) decodes through the reel engine's `decodeImage`, which fetches `mode: "cors"` with
`cache: "no-store"`, so it samples presigned R2 media correctly: hand it a row's `previewUrl` (~16KB),
never the original. `useSampledPaletteFromDom` reads `<img>` elements the page already painted, and a
raw presigned R2 tile carries no `crossOrigin`, so its canvas taints, `getImageData` throws, and the
`.catch()` silently returns the fallback five. No console error, no failing test, no tell beyond "the
colours look generic" (the trap the URL form used to share, with `new Image()` and no `crossOrigin`;
the lab never caught it because every specimen samples same-origin `marketingImage(...)`). So a
guest-media lamp either takes the URL form on `previewUrl`, or its tiles carry
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
`!important`s are the scar from learning the utilities-beat-base lesson once already.

★ **Base and band always ship together** (law 4 as code). A swept layer rests fully off-layer, so a
band-only glow is invisible whenever it is paused, which is its default state below the fold AND its
reduced-motion state. The base is how a reduced-motion arrival still ARRIVES.

`GlowFilter` (its own **server** component, [glow-filter.tsx](../../src/components/shared/glow-filter.tsx))
is mounted **once, in the root layout**. Root and not `(marketing)`, because `not-found.tsx` renders the
marketing footer outside that group. Never mount a second: SVG ids are document-global.

★ **A missing host is a quality failure, not a crash** (measured in Chrome at round 1, twice: renaming
the filter id, and deleting the host node). A dangling `filter: url(#glw-warp)` does **not** blank the
element. The whole chain is dropped, `blur()` included, so the five ellipses land as hard-edged colour
blobs: visibly wrong, and completely silent. `Glow` carries a dev-only console guard for it.

★ **The band rests where its animation starts (`150% 0`), never mid-travel.** The animation lives inside
`@media (prefers-reduced-motion: no-preference)`, so whatever the band *declares* is what a
reduced-motion visitor sees permanently. It shipped declaring `50% 0` for two rounds, which with
`mask-size: 280%` puts the comet's peak at dead centre of the box at full strength: the exact midpoint
of the sweep, i.e. the worst case, forever, for the people who asked for less motion. Fixed at round 1
and pinned by test.

### The shipped light

| Light | Where | Shape | Colour |
| --- | --- | --- | --- |
| **The footer seam** | [footer-glow.tsx](../../src/components/marketing/chrome/footer-glow.tsx), every page incl. the root 404 | `seam` | the house lamp set (no media to sample) |
| **The film strip's backlight** | [film-strip-glow.tsx](../../src/components/marketing/sections/home/film-strip-glow.tsx), full-bleed under the strip | `seam` | **sampled** from the strip's eight frames |
| **The reel screen's pool** | [reel-screen-lamp.tsx](../../src/components/marketing/sections/home/reel-screen-lamp.tsx), under the reel player, the box exactly the screen's width under an elliptical wrapper mask | `seam` | **sampled** from the reel's poster |
| **The Pro card's beam** | [pro-card-beam.tsx](../../src/components/marketing/sections/home/pro-card-beam.tsx) | beam (`pulse-outside`, the vendored border-beam) | the derived beam register of the lamp set |
| **The feature heroes** (album, guests, sharing) | [screen-lamp.tsx](../../src/components/marketing/system/screen-lamp.tsx) under each page's stage (the arrivals stream, the attribution wall, the link frame) | `seam` | **sampled** from the frame the visitor is looking at |
| **The QR plate switching on** | [qr-hero.tsx](../../src/components/marketing/sections/features/qr/qr-hero.tsx) (lab moment 06, "the second one") | `bloom` armed on arrival, resting at `--glw-base: 0.34` | the house five (a code is ink on white, law 3's no-media branch) |

★ **`ScreenLamp` is the ONE underlight as a component** (the feature-pages round, 2026-09-01): a lit
object throws its own sampled light down off its bottom edge, full-bleed, as a sibling of the object
(never inside a clipping frame). Neither `throw` nor `halo` can backlight an opaque object, so every
underlight on the site is this mechanic; a new one is a `<ScreenLamp>` around the object, not a fourth
file. Its section must be `overflow-x-clip`, never `overflow-hidden`, or the field hanging below is
cut off. Scarcity on a feature page is one lamp in the hero and the footer seam, nothing between; the
curation and privacy pages carry NO lamp on purpose (restraint is their identity), and so does the
doors band (a row of lit cards is the every-section-gets-a-version failure).
★ **A radial mask's reach is a fraction of the FULL field** (found twice now: the reel treatment and
the QR plate). The transparent stop sits at 78% of that radius, so a lab `--glw-reach: 78%` on a field
the size of its object puts the fade outside the box and the light renders as a rounded square. Size
the field generously (`-inset-32` on the plate) and keep reach where the falloff completes inside it.

Three seams and one beam on the home page (film strip, reel, Pro beam, footer: 5909, 1275 and 1509px
apart at 1440 on the re-paced page, the nearest pair 1.4 viewports): scarcity as a distance. The hero and the album straddle
were lit at round 1 and pulled the same day (the wall is the ground, not a source; the straddle's slot
was 63px), and the event cards' own light was tried three ways and dropped for scarcity against the
beam. The reel opener's seam (treatment A, "lights down") was ruled in on 2026-09-01 once its light
was held to the screen's width.

★ **Two ways a seam's sides end, and the box decides.** A seam's five ellipses sit at 14/38/60/80/96%
of the field, so its colour is still ~40 to 50% at the ends of ANY box, and a box that ends on screen
ends the light on a cut. A strip's light goes full-bleed so its ends are off-screen
([film-strip-glow.tsx](../../src/components/marketing/sections/home/film-strip-glow.tsx)). A screen's
light must not be wider than the screen, so its box IS the screen and the wrapper carries an
elliptical mask anchored at the screen's bottom centre (rx 46%, smoothstep stops): a pool, gone 31px
inside each edge at 1440 and 14px at 375. A linear side mask on a wider box is a third thing, a wedge
lit 40% at the object's own edge and ending on a straight line outside it; ruled out on sight, and
pinned by test.

All three seams ship at `--glw-dur: 11s` against the engine's ruled 8s. With more than one lamp the open ruling is no
longer "the footer alone with nothing else moving" but the **system's register**: the whole home page at
11s against the whole page at 8s.

★ **Where the page already painted the media, sample the DOM.** `useSampledPaletteFromDom(ref)` reads
the `<img>` elements the page has already painted, so `drawImage` reuses the decoded bitmap: zero
bytes, zero requests, zero extra decodes. The URL form (`useSampledPalette`) fetches its own copies,
which is right for a lab board (no rendered image to read) and for a guest-media lamp handed
`previewUrl`, but pointed at the home page's wall it would refetch **1,101,641 bytes** of originals,
since `next/image` serves a different URL and nothing is a cache hit. The DOM form also never calls
`img.decode()`
— that would force a `loading="lazy"` tile to fetch, so the lamp would undo the page's own loading
strategy in order to colour itself.

★ **Two placement rules the home page paid for, both cheap to break by accident.** (1) A lamp goes
**after** the scrims it lights through, never inside them: nothing in the hero creates a stacking
context, so children paint in DOM order and a lamp under four scrims arrives at about an eighth
strength. (2) The caller's content wrapper needs an explicit `relative` — `Container` is a static div,
and an absolutely-positioned `Glow` otherwise paints **over** the H1. Both failures look like "the
effect is too strong" and send you tuning opacity instead of fixing the stack.

★ **A lamp that crosses a chapter cut is clipped at the cut.** Light stopping dead there is doctrine, not
containment: `PaperChapter`'s rule is that cuts are hard (hairline + plane change, no gradients), so a
bleed would soften the edge the chapter system rests on. It also keeps one lamp on one register instead
of needing the dark register above and the paper register below.

★ **A lab specimen can be geometrically inverted from the surface it names.** Moment 05's stage puts
paper above and dark below; production is the opposite, so its insets would have thrown dark-register
light onto near-white paper. Its stated *argument* ("the card casts onto the dark field it overhangs")
survived intact and only the geometry flipped — which is the useful distinction when a specimen and its
surface disagree. Its "overhangs the cut by 160px" was also wrong: the real number is **63px**
(`-mt-40` is 10rem, `SectionShell` puts back 6rem of padding, `PaperChapter`'s border another 1px).
Same family as the seam field-inset finding at round 0: a specimen that was not rendering what its own
source claimed.


## Type: the heading face + the tiered scale

`font-heading` is a Tailwind `@utility` in globals.css (NOT a theme font token): the brand face
**Urbanist** (`--font-display`, loaded in the root layout via next/font as a variable font) at **weight
700** + **-0.03em** tracking. Urbanist is a real variable sans, so the old Instrument-era knobs
(font-size-adjust, the synthetic text-stroke weight, font-synthesis) are gone — a real bold weight does
the work. Swap the brand face forever by repointing `--font-display` + retuning the two lines in the utility.

**The tiered app heading scale** (one face, weight per tier — this SUPERSEDES the old "functional headings
stay Inter" rule; app page + card titles now use the heading face):
- **Page titles** → `PageHeading` ([`src/components/shared/page-heading.tsx`](../../src/components/shared/page-heading.tsx)):
  Urbanist **700**, `text-2xl` default (the event-name hero bumps to `text-3xl`). The ONE source for every app
  + admin page `<h1>` — new pages use it so headings can't drift back to Inter.
- **Card / section titles** → `CardTitle` (`ui/card.tsx`): Urbanist **600** (`font-semibold`) — clearly a
  heading above the labels below it.
- **Per-setting labels** (`FormLabel`) + small uppercase eyebrow labels → **Inter 500**, unchanged.

`PageHeading` deliberately adds no `font-semibold` (would drop 700→600) and no `tracking-tight` (our
`--tracking-tight` is `0em`, which would CANCEL the utility's -0.03em). `--tracking-tight` stays `0em` so the
90+ legacy `tracking-tight` usages are no-ops (re-tuning them is its own deferred pass).

**The marketing page-H1 ladder (RULED site-wide 2026-08-27: titles must OWN their headers):** standard
marketing page H1s ramp `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` (the 72px class on desktop).
Exemptions by the ruling's own latitude: the HOME hero keeps its unique display ramp (5xl→8xl), `/reel`
was already at 7xl, long-title ARTICLE surfaces (help/blog/careers articles) stop at `lg:text-6xl`, and
utility documents (`/contact` via SectionShell, the legal shell) stay at 4xl/5xl. The marketing **h2 ladder** has three real tiers, and they should be named rather than inferred: **24/30** (`text-2xl sm:text-3xl`) is the bespoke paper-prose section (/about's story, /press's sections, the 2026-08-25 careers ruling); **30/36/48** is `SectionShell`'s default body section (~70 sites); **36/48/60** is `SectionShell scale="lg"`, the one slot nothing else occupied, for a chapter's opener or closing anchor (the "Chapters" section above). Below `lg` that top tier equals the page h1's size, so on a phone a section's weight comes from its entrance and its air, not its type.
**The hero lockup owns all of this** ([`page-hero.tsx`](../../src/components/marketing/system/page-hero.tsx),
pinned by `page-hero-contract.test.ts`): eyebrow / heading / subhead / actions on one shared `gap-6`
grammar, with `scale` picking the type — `lg` is the ladder above, `xl` the cinema register, `display`
the exemption below. Will's ruling for the identity pages, 2026-08-28: **share grammar, page picks
scale.** Compose it rather than hand-rolling a hero; four agents wrote four heroes in one week and that
is the drift it closes. The heading is always an `<h1>` (the /contact bug class; `SectionShell`'s `as`
carries the same rule for sections). **The hero entrances are three NAMED registers (2026-09-01 and 2026-09-11): `entrance` is `rise`
(the standard stagger: the identity pages and /pricing), `cut` (the hard film cut: every
cinema-family hero, the six feature pages, the hub, /how-it-works, /events) or `blur` (the
texts-reveal blur-rise on the slots around the title: the utility trio /help, /contact, /careers),
and the H1 never moves in any of them.** `children` is the STAGE slot, rendered inside the same
Container under the lockup, so a page with an object (the album filling, the attribution wall, the
link frame, /help's instrument strip) composes the lockup and owns its object, its entrance and its
lamp; `backdrop` is what sits BEHIND the lockup (careers' contact sheet and scrim), never in front;
`PageHero` still owns only the type. The blur register closed the trio's LCP hole (their h1s rested
at `opacity: 0` under `.mkt-line`; `marketing-h1-policy.test.ts` now refuses that class on an h1
too). Will's hero ruling (2026-09-02): no single templated hero, few named registers, no unnamed
minor variants; a new hero uses one of the three or adds a named one. The QR hero and the home hero
stay hand-rolled: their object sits BESIDE the lockup, not under it.

The **display step** is the MASTHEAD tier: `clamp(3.25rem, 12vw, 10rem)`, a 160px string, a recorded
decision rather than a stray arbitrary value. Do not "fix" it back down toward 72px. /about's
"Partyreel" and /press's "Press" take it. ★ **ONE OR TWO WORDS ONLY** (Will's contract, 2026-08-29),
and at this size ★ **the H1 matches its NAV LABEL** — a masthead is the loudest promise on the page,
so it must be the word the reader just clicked; anything more specific goes in the eyebrow. Both:
`whitespace-nowrap` is load-bearing under a 12vw clamp, and the trim below is reasoned about a single
line, so a longer title belongs at `xl`. ★ The tracking squeeze (`.mkt-name`) belongs to the STEP, not
to the page that first used it: any masthead at this size arrives set slightly open and closes to the
heading face's own `-0.03em`.

Three things it needs that a normal H1 does not. **`text-[length:...]`** — v4 must be told whether a
`clamp()` in `text-*` is a size or a color. An **asymmetric optical trim**: a normal heading's box is
about its ink, a display line's is not, and it is wrong in OPPOSITE directions at each end. Measured
with canvas TextMetrics (Urbanist bold: cap 0.75em over the baseline, descender 0.25em under),
`leading-[0.85]` + `py-[0.08em]` put the box top 0.125em ABOVE the cap while the box bottom lands
0.094em ABOVE the descender, so one honest `gap-6` reads ~44px over the name and ~9px under it. The
step therefore trims its TOP only (`-mt-[0.12em]`, in `em` so it holds across the clamp) and
deliberately never its bottom — trimming both ends symmetrically is the intuitive move and it tightens
the end already tight. Keep `py-[0.08em]`: it is what stops an `overflow-hidden` ancestor clipping the
descender, and the negative margin removes the distance from LAYOUT while the glyph keeps its room.
(A consequence worth expecting rather than "fixing": a title with NO descender, like "Press", reads
looser under the masthead than one with a "y". The box rhythm is identical; the ink differs.)
And an **optical side bearing** (`leadIn`), which is a different kind of correction and is gated
separately: the vertical trim is about the LINE BOX and holds at any alignment, while `leadIn` pulls a
flush-left masthead back onto its column edge and therefore applies ONLY at `align="left"`. Folded into
the heading class it drags a CENTRED masthead off centre by half its value, which reads as "the hero is
slightly wrong" and nothing more — /about shipped exactly that from milestone-9 until 2026-08-29, 3.6px
left of centre, and nobody spotted it until /press took the same step. Both mastheads are centred, so
`leadIn` has no consumer today; it is kept gated rather than deleted so the next flush-left one does not
rediscover the problem and invent a magic number.

★ **THE THIRD REGISTER — the INDEX MASTHEAD, and it is the display step's inverse** (ruled by Will
2026-08-28 for /blog, from the Broadsheet direction: "I love broadsheet's small 'notes' title and
underline above the featured blog card... should say 'Blog'"). Where `display` is for a page whose
TITLE is the subject, this is for a page whose CONTENT is: the h1 recedes to a label
(`text-lg sm:text-xl`) above a drawn `[data-mkt-rule]` hairline, and the lead item owns the stage.
/blog's `Blog` sits at 18px while the featured card's h2 runs to `lg:text-6xl`. That inversion is
DELIBERATE — do not "restore" it to the ladder. The small one keeps the h1 because it is what the
page IS, it never collapses under a filter the way the featured card does, and it holds the document
outline stable in every view. It is deliberately NOT in `PageHero`: that component owns the
eyebrow/heading/subhead/actions lockup, and this is a different one (title + rule + a trailing
link). One page uses it; if a second index wants it, THAT is when it gets extracted.

**The mono ruling (R6, 2026-08-27, site-wide type doctrine):** mono (Geist Mono) is for **numerals /
tabular alignment only** in standard UI — numbered index rows, stat values (the StatBand register), counts
where alignment matters. Captions, labels, and CTA notes are Inter ("this is a consumer app, not a
devtool" — Will). Restated 2026-09-02 on the album page's finish pass: **"I don't want to use mono
anywhere except where it aids in tabular layouts."** The GoDeeper rows went to Inter that day, and the
library phase swept the rest (2026-09-11): `MonoCaption` holds DATA only (timecodes, counts, sizes,
URLs, step indices, style-and-duration lines) and every label, hint and descriptor is the `Caption`
atom (`system/caption.tsx`, Inter, the same size and colour). A new caption picks by that question
alone; both atoms sit side by side on `/design/marketing`.

## Rounding: sharp surfaces, round actions

| Layer | Token | Value |
| --- | --- | --- |
| Surfaces (cards, inputs, sections) | `--radius` | `0.125rem` (sharp) |
| Actions (buttons) | `--radius-action` / `-lg` / `-sm` | `1rem` @ h-10 · `1.2rem` @ h-12 · `0.8rem` @ h-8 (ratio ~0.4 x height; in-between sizes interpolate: h-6 `0.6rem`, h-7 `0.7rem`, h-9 `0.9rem`) |
| Media tiles | `--radius-tile` · `--gap-gallery` | radius `3px`; `--gap-gallery` (`3px`) is the ONE gap for EVERY media-tile grid — masonry galleries + the dense triage grids (Reviews / review takeover / admin moderation). Use `gap-[var(--gap-gallery)]`; one knob retunes them all |
| Floating layer (menus, tooltips, toasts, dialogs, sheets' corners) | `--radius-float` | `0.5rem` (sharp reads broken on floating elements) |

Nested-corner math: inner = outer minus gap. The sharp-surface/round-action contrast is the
system's DELIBERATE exception to it.

★ **Anything drawn AROUND an object takes the object's radius, never a literal.** A ring, glow or
bloom at offset N gets `object radius + N`, which is the same nested rule read outward. This is not
theoretical: the border-beam round shipped a 16px chromatic ring around a `rounded-2xl` (3.6px) card
because the specimen was rounded like the vendored library and then handed the library's own
`borderRadius`, and it read as two different shapes the moment colour landed in a corner. `BorderBeam`
auto-detects its child's computed radius when the prop is OMITTED, which is the correct call, and
[`border-beam-vendor.test.ts`](../../src/components/dev/border-beam-vendor.test.ts) pins that no lab
specimen passes one. The corollary is worth knowing before reaching for that effect: it is authored
for 16px+ corners, and 16px is what this system rounds an ACTION to, so **a beam's natural layer here
is an action, not a surface**. The legacy `rounded-sm..4xl` scale stays mapped off `--radius`
(all "sharp family") — `rounded-xl` is now tiny, so floating panels must use `rounded-float`, never
`rounded-xl`. Measurements ride Tailwind's 4px grid + the 0.4-height radius ratio (the system's
math).

## Elevation contract (one depth technique per mode)

- **Light:** exactly one shadow family, `--shadow-float` (soft, blur = 2x offset, single top light
  source), floating layer only. Surfaces are hairline-led, no shadows.
- **Dark:** NO shadows anywhere (`--shadow-float` resolves to a zero shadow in `.dark`). Depth =
  lighter-is-closer surface steps (bg 0.14 → card 0.21 → popover 0.23+) + borders + the glass card.
- Components use the `shadow-float` utility; never reintroduce `shadow-md/lg` on primitives (the
  tabs active pill sheds its `shadow-sm` in dark for the same reason).
- The dark translucent card ships WITHOUT blanket backdrop-blur (alpha composites fine; blur only
  where a surface sits over media).

## Motion

Three curves in `@theme`: `--ease-emphasis` `cubic-bezier(0.23,1,0.32,1)` (entrances/UI),
`--ease-in-out-strong` `cubic-bezier(0.77,0,0.175,1)` (moves/toggles), `--ease-drawer`
`cubic-bezier(0.32,0.72,0,1)` (sheets). Rules: UI under 300ms; **exits faster than enters**
(`data-closed:duration-*` composes with tw-animate via `--tw-duration` — verified); press feedback =
`active:scale-[0.97]` on buttons; explicit transition properties, never `transition-all` on
primitives. Current timings: dialog 200/150 · dropdown/popover 175/120 · tooltip 150/100 (+
`skipDelayDuration` 300) · sheet 300/200 on the drawer curve · **marketing nav 200/130 with a 100ms
hover intent** (its clocks are `--mkt-dropdown-*` / `--mkt-nav-*`, [marketing-content.md](marketing-content.md)).
★ **A BACKGROUND WASH IS A CROSSFADE, NOT AN ENTRANCE** (2026-08-29). The overlay header's glass
layer ran 200ms on `--ease-emphasis` and read as an instant, rough snap when a nav panel opened over
a transparent bar ("feels instant right now and is too visually rough"). The duration was not the
problem: `--ease-emphasis` (0.23,1,0.32,1) delivers ~90% of the change inside the first third, so a
full-width wash effectively landed in ~60ms and then crept. Large ambient surfaces want the
symmetric S (`--ease-in-out-strong`), which eases in AND out of the change instead of front-loading
it. Timing stays asymmetric per the house rule by riding the OPEN state: enter 300ms, exit 220ms.
The same reasoning applies to any full-bleed hero adopting the transparent-until-scrolled header.

**★ THE FLOATING-LAYER CONTRACT** (named 2026-08-28 when the nav turned out to be the one menu
outside it): every floating surface ships `rounded-float` + `shadow-float` + an origin-AWARE
`transform-origin` + `fade-in-0`/`fade-out-0` beside its zoom + one house clock on `--ease-emphasis`.
Miss any of the five and the surface reads wrong in a way that is hard to name: `rounded-lg` resolves
to the 2px SHARP general-UI radius, a raw `shadow` draws in dark mode against the elevation contract,
a centre origin detaches the panel from its trigger, and a scale with no fade pops. Three reusable
patterns came out of that round: the **`data-swap`-gated box morph** (a size transition must be armed
only when there is a previous size to morph FROM, or a measured-late 0×0 first frame animates as a
wipe), the **glass LAYER** (`backdrop-filter` on an inert `-z-10` sibling whose `opacity` animates —
never a class-toggled filter on the bar itself, which both snaps and drags every descendant's repaint
into a blurred region), and the **measured indicator** (JS writes `offsetLeft`/`offsetWidth`, CSS owns
the tween; the first placement MUST suspend the transition and force a reflow or it flies in from
x=0). Hover is the one place enters may be SLOWER than exits: a row that is skimmed rather than
studied needs its in inside ~90ms and can take ~180ms to fade back out. Skeletons shimmer via a
background-position sweep (`--animate-shimmer`, linear on purpose: ambient loop, a strong curve
stutters at the loop point). **`MediaTile` (every gallery tile) renders the shimmer skeleton under the photo
until it decodes, then fades the photo in over it (S5 P1)** — a cold presigned-R2 load (no thumbnail variant)
reads as shimmer→photo, never a black square that pops; reduced motion drops to a static muted block. The
host-review takeover pairs this with a preload of the just-approved photos during the all-caught-up beat so
the album reveal paints from cache (see [host-app.md](host-app.md)). The host tile action row uses the
**`[data-reveal-chip]`** hook (globals.css): hover-reveal chips collapse their width + margin at rest so the
persistent chips (liked / in-reel / hidden) pack to the right edge, then slide back on tile hover (the row is
margin-spaced, not gap, so no residual gap; reduced-motion = opacity-only). **GOTCHA:** the hook is
`!important` because it lives in `@layer base` but the chips carry their own Tailwind `transition`/`ml-1` in
the higher `utilities` layer (which silently overrode it = no slide, residual gaps); and it expands on
`:hover` / `:focus-visible` / `:has(:focus-visible)` — NOT `:focus-within`, so a mouse click doesn't leave a
chip stuck-expanded after the cursor leaves.

★ **THE ARRIVAL-DEFAULT CONTRACT (generalized 2026-08-28, the /blog round): the VISIBLE state is the
default; the hidden state belongs to the trigger, never to the element at rest.** The swept-mask rule
below is one instance. The blog round produced two more in one sitting: plates animating from
`opacity: 0` gated on `[data-inview]` left **23 of 23 covers permanently invisible** wherever no
`Reveal` wrapped them, and an observer-gated hairline is an invisible divider on every path that
fails to trip. So a cover plate paints a static muted base and only the PHOTO develops over it, and
arrival hooks that must not depend on scroll (`[data-mkt-develop]`, `[data-mkt-rule]`,
`[data-mkt-entering]`, marketing.css) fire on **`@starting-style`** instead of an observer. Failure
mode becomes "no animation", never "no content". Reach for the observer grammar
(`[data-mkt-reveal]` + `Reveal`) when the beat is genuinely about scroll position; reach for
`@starting-style` when it is about arrival.

★ **A swept-mask layer needs a STATIC base, or it vanishes when paused.** The organic-shimmer family
works by animating `mask-position` across a mask wider than the layer, so its resting frame sits fully
off-layer and shows NOTHING. Anything under the loop-pause contract therefore defaults to invisible
(offscreen is the default state) and stays invisible under reduced motion, which breaks the arrival
rule. Split it: an always-on base layer plus the travelling band over it. The footer seam glow is the
worked example (`.mkt-fglow-base` / `.mkt-fglow-band`, marketing.css).

★ **A FILLING ANIMATION OUTRANKS EVERY AUTHOR DECLARATION, so an entrance and a hover state can
never share an element.** `[data-mkt-cut]` (and any `animation-fill-mode: both` entrance) keeps
applying its final keyframe forever once it completes, and the animation origin beats author-normal
in the cascade, so a later rule setting the same property on that element is inert. The symptom is
maddening: the selector matches, DevTools shows the rule, and nothing moves. Put the entrance on an
inner layer and the interactive state on the outer one. Found building the press contact sheet, where
the cut pinned `opacity: 1` and the light-table dim silently never applied.

★ **`:has(:focus-visible)` matches in `element.matches()` but does not repaint.** Chromium invalidates
a `:has()` ancestor on `:hover` changes but not reliably on focus-visible changes, so a
`:has(:focus-visible)` isolate is live, matching, and dead. Use `:focus-within`, which propagates
natively with no `:has()` involved. The standing `:focus-within` objection (a mouse click pins the
state on) is contextual, not absolute: on the press sheet's light table, a clicked frame staying
picked is the wanted behaviour, whereas on `[data-reveal-chip]` it was not.

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
stay narrow and MUST fit inside it (compiler-enforced by `codes.test.ts` — adding a route code
without taxonomy copy fails the build). Failure arms are `{ ok: false, code, message? }`; clients
surface via `showActionError`/`showErrorToast` (producer message > `FALLBACK_MESSAGES[code]` >
generic default). Copy rules: plain language, no em-dashes, no internals.

**Boundaries:** every route group has an `error.tsx` → the shared `RouteError` (generic copy +
`digest` as the support handle — it NEVER renders `error.message`; that's the security invariant)
tagged `render:app|guest|marketing|admin|auth` in Sentry; `global-error.tsx` is dependency-free
(own html/body, inline styles) for root-layout death. The gated `/design/boom` probe throws on
purpose to verify the chain against the real prod build (dev shows the overlay instead).
`notFound()` is never caught by these (verified).

## The craft guidance stack

**★ Proactively propose creative DELIGHT — make it feel like magic (Will, 2026-06-21).** In all design/UI
work, don't stop at "correct": surface a creative delight opportunity (a considered entrance, a satisfying
micro-interaction, a rare-moment beat) and RECOMMEND it by default, rather than waiting to be asked. Beauty
is leverage, the unseen details compound, and "feels like magic" is Partyreel's differentiator. The
discipline that keeps delight from becoming noise is **animate by FREQUENCY** (emil): HIGH-frequency actions
(a workspace opened many times a day, moderation/select switches) stay INSTANT/minimal — never add theater
there; OCCASIONAL surfaces (modals, takeovers, route nav) get standard entrances (≤300ms, custom easing,
`@starting-style`, reduced-motion fallback); RARE/first-time moments (empty states, a first action,
celebrations) can carry real delight. Everything CSS-first + `prefers-reduced-motion`-safe + exits ≤ enters.

**emil-design-eng (the installed skill) is PRIMARY; Hobday's Safe Rules
(anthonyhobday.com/sideprojects/saferules) are a SECONDARY advisory; neither is a bible.**
Synthesis (Phase 2): *adopted* — no pure white surfaces, the elevation contract (no dark shadows,
lighter-is-closer, one depth technique per mode), nested-corner math, muted paired icons,
small-label tracking, the 4px-grid + radius-ratio math. *Already true* — near-black/near-white
extremes, contrast hierarchy, brightness-distinct palette, ~2x horizontal button padding, two
typefaces (Geist Mono = a documented utility exception for code/counts), ~70ch prose. *Declined or
deferred with reasons* — saturate-neutrals DECLINED (zero-chroma identity); 12-column grid noted for
the Phase 6 marketing rebuild. **Guest reading-copy rule (NOW REAL, Phase 4):** guest-facing reading
copy is 15-16px (`text-[15px]`/`text-base` on event description, gate prompts, growth cards, entry
sheet rows); dense/structural UI (captions, counters, secondary labels) stays sm/xs. Host/admin keep
14px until their phases.

## Stagger (the gallery entrance)

The `[data-media-tile]` `@starting-style` entrance (Phase 2) gains a per-index delay (Phase 4):
`transition-delay: min(calc(var(--tile-i, 0) * 45ms), 540ms)`. The guest masonry sets `--tile-i` on the
SEED render ONLY (a render-once ids `Set`); doorbell/poll-arrived tiles carry `--tile-i: 0` and land
immediately. The cap (540ms) stops deep galleries from queuing forever; reduced-motion drops the move.

## Event-feed + review motion + the live motion tuner

The host event feed ([host-app.md](host-app.md)) is the densest motion cluster — all CSS-first,
reduced-motion-safe, and var-tunable. The motion-defining picks were ratified in the
event-feed lab ([on the record](../decisions/design-record.md#event-feed); Will 2026-06-22):
- **A=Condense** — the sticky pill bar gains `data-stuck` once the feed scrolls past its top sentinel:
  a hairline + backdrop, and the pills shrink (`h-8`→`h-7`, smaller text) on a `transition-[transform,height,padding,font-size]`.
- **B=Fade** (`[data-section-swap]`) — the feed container is re-keyed on a pill change (and the floating
  bar's content on the active section), so `@starting-style` fires a crossfade + rise (opacity+translateY,
  `--tune-section-swap-ms`; the lab's blur variant was REJECTED). Hardware-accelerated, reduced-motion = fade.
- **C=FLIP** (`useFlip`, [`use-flip.ts`](../../src/lib/shared/use-flip.ts)) — when the urgency order flips
  (the review queue clears), the sections slide to their new positions via a hand-rolled First-Last-Invert-Play
  (`--tune-reorder-ms`, `--ease-in-out-strong`); reduced motion = instant. Chosen over framer-motion's
  `layout` (cleaner, off the main thread, no dependency — `motion` was dropped). **Two-axis since the /blog
  round**: it inverts X as well as Y, so a filtered multi-column grid reorganizes correctly and nothing needs
  the second, unextracted FLIP inside `use-sortable-grid.ts`; `dx` is 0 for any full-width stack, so the event
  feed is unchanged. ★ It also PRUNES prev rects for unmounted keys each pass — without that, a node that
  leaves a filtered set keeps a stale rect and, on returning, flies in from wherever it sat under a different
  filter. The prune cannot live in the ref cleanup: `register(key)` returns a fresh closure per render, so
  React detaches every node on every render and dropping prev on null would disable the FLIP outright.
- **The two-beat set change (the /blog filter, ruled 2026-08-28): removal and reflow are never the same
  beat.** Departing items leave TOGETHER (`transition-delay: 0` on all of them) on a short clock, and only
  once that is spent does the set commit and the FLIP reorganize the survivors; entrants fade in on a delay
  so the reorganize stays legible underneath them. Animating removal and reflow at once is what makes a
  filter read cheap: the eye cannot separate what left from what moved. The exit and the FLIP must sit on
  SEPARATE elements (exit on the item, FLIP on its wrapper) or the FLIP's inline `transition: transform`
  clobbers the exit's transition property. Hooks: `[data-mkt-exiting]` / `[data-mkt-entering]` +
  `--mkt-blog-*` (marketing.css).
- `[data-review-tile][data-exiting]` — the bulk-action REMOVAL EXIT (opacity→0 / `scale(0.9)`,
  `--tune-review-exit-ms`, `transition-delay:0` so the acted set leaves TOGETHER). The inline review opts OUT
  of the `[data-review-tile]` open cascade (no entrance theater on an always-present surface; the cascade hook
  is kept for the tuner's lab replay).
- `[data-unlock-success]` — the ALL-CAUGHT-UP beat; `useReviewTriage.run()` holds it `--tune-review-beat-ms`
  IN PLACE (no Dialog now), then `caughtUp` clears → the urgency order recomputes → the FLIP relocates the
  now-empty Review section to the bottom.
- `[data-check-pop]` — the selection-checkmark scale-in (review tiles + QR presets); `[data-preset-arrive]` —
  the QR-preset cascade (a KEYFRAME, NOT a transition, so the swatch's `transition-colors` hover survives).

★ **JS-timed motion reads vars with `readCssMs` ([`read-css-ms.ts`](../../src/lib/shared/read-css-ms.ts)), never
`parseInt`** — the build minifier (Lightning CSS, via Tailwind v4) canonicalizes `<time>` to its shortest form,
so `2500ms` ships as `2.5s`; `parseInt("2.5s")` is `2`, which once collapsed the all-caught-up beat to ~2ms.
`parseCssMs` handles `s`/`ms`/bare (unit-tested).

**The baked motion values** (globals.css `:root`, ratified): `--tune-route-fade-ms` 310 / `--tune-route-fade-ease`
ease-out, `--tune-section-swap-ms` 180, `--tune-reorder-ms` 500, `--tune-review-beat-ms` 2500 — plus the
REEL REVEAL grammar's `--tune-rvl-*` / `--tune-rxp-*` set (T2-ratified as-built, production since R3; the
tuner knobs are annotated "ratified, revisit-only" — per the tuner contract, a retune must move the config
default + the CSS fallback + any JS fallback together). The tuner overrides
these live with an inline style on `<html>` (which outranks `:root`), so the playground tunes against them.

**The contextual floating action bar** ([`event-feed-action-bar.tsx`](../../src/components/app/event-feed/event-feed-action-bar.tsx)):
one fixed-bottom surface that follows a scroll-spy (`useActiveSection`) and MORPHS its action to the section in
view (the floating Add generalized). The morph crossfades via the same `[data-section-swap]` language; each
section self-surfaces its control (primary Add pill / a neutral card holding the review cluster / a disabled
placeholder). Reuse this when a long scroll needs a section-aware action always in reach.

**Multi-select primitives** (Review triage + the Gallery album bulk-select share these). `useSelection(ids)`
([`event-feed/use-selection.ts`](../../src/components/app/event-feed/use-selection.ts)) is the pure state machine
(`selected` Set / `selectMode` / toggle / selectAll / enterSelect(seed) / exitSelect) — ★ it PRUNES the
selection to the surviving ids when the universe changes, never resets, so a background poll/revalidate can't
wipe an in-progress multi-select. `SelectableMediaGrid`
([`event-feed/selectable-media-grid.tsx`](../../src/components/app/event-feed/selectable-media-grid.tsx)) is the
shared selectable masonry (the `[data-check-pop]` checkmark + `[data-exiting]` removal beat; `enablePreview` for
Review's peek; `clampAspect` MUST match the surface's normal grid or toggling select reflows tile heights). The
selection STATE is lifted to a thin provider (`HostSelectionProvider`, mirrors `HostAddProvider`) so a grid and
a scroll-following bar share it; the grid REGISTERS its optimistic bulk handlers and the bar calls
`run(kind)` — the registration seam to use whenever a control surface and its target grid live in different
subtrees. Long-press entry rides `use-long-press.ts` (opt-in `onTileLongPress`, a capture-phase click-suppress).

**Grid layout + the sortable primitive.** The shared grids take a `layout: "masonry" | "uniform"` prop
(default masonry): **masonry** = natural-ratio CSS columns (the Gallery "wow"); **uniform** = a fixed
`UNIFORM_TILE_ASPECT` (`4/5`) `object-cover` CSS grid (`grid-cols-3 sm:grid-cols-4`) for the Reel + Review,
where uniformity makes a drag-order / selection hit-targets legible. Drag-reorder rides our own
dependency-free [`useSortableGrid`](../../src/lib/shared/use-sortable-grid.ts) (the project dropped
framer-motion + ships no drag lib): a hand-rolled pointer machine (modeled on the lightbox swipe) + a 2-axis
FLIP for the sibling slide (mirrors `use-flip` but X AND Y; `--tune-reorder-ms` / `--ease-in-out-strong`,
reduced-motion = instant). The dragged tile is finger-followed via an imperative transform (excluded from the
slide). ★ Why hand-rolled beats dnd-kit HERE: on a uniform grid the drop-index is two integer divisions
(`pointToIndex`, unit-tested), so a drag lib's collision/sensor machinery buys nothing. Touch grabs behind a
450ms press (a scroll never reorders); `touch-none` in the focused reorder mode + edge autoscroll reach
off-screen tiles; keyboard reorder (space / arrows / enter / escape) is free since the order math is index-based.

**The motion tuner** ([`motion-tuner.tsx`](../../src/components/dev/motion-tuner.tsx) + `motion-tuner-config.ts`,
S4·0): a panel that writes `--tune-*` CSS vars to `<html>` so any var-backed timing can be finetuned LIVE, no
rebuild. It lives in the **lab at [`/design/motion`](../../src/app/(dev)/design/motion/page.tsx)** (the
`MotionPlayground`): the tuner drives REPLAYABLE DUMMY animations on the exact same hooks, so you adjust a
slider, hit Replay, feel it, and Copy CSS - far better than tuning real prod animations (which meant a refresh
+ re-entering the takeover per tweak; it shipped on the prod event page first, S4·0, then moved here). Contract:
each polish increment APPENDS its knobs to `EVENT_PAGE_TUNER_CONTROLS`, the config `default` MIRRORS the CSS
default, and any JS-read var (`run()`'s `readCssMs`) falls back to a constant that ALSO mirrors it — so
tuned-vs-untuned stays consistent. Bake a tuned value: Copy CSS → set it as the globals.css default → Reset.

**State-colored toasts (global policy, S4):** sonner's `data-type` is mapped to the design state colors —
`success` = `--success` green, `warning` = `--warning` amber, `error`/destructive = `--destructive` red;
plain/info toasts keep the neutral `--normal-*` default. Use the right TYPE for the state: approve/positive =
`toast.success`, HIDE/soft-caution = `toast.warning`, failures = `toast.error`. The CSS (globals.css) targets
sonner's OWN `[data-sonner-toast][data-type="…"]` with **`!important`** — NOT the `classNames.toast` hook (it
didn't win): sonner injects a neutral `--normal-bg` rule at runtime (unlayered, non-important) that beat the
earlier class rule on layer/order, so a more-specific `!important` is required (verified live via the toast's
computed `backgroundColor` matching the token — confirm the RENDERED color, not just that the rule loaded).
**Red is for FAILURE, full stop** (ratified 2026-06-21): a successful destructive confirmation ("Permanently
deleted.", "Event deleted", "Removed from saved.") stays `toast.success` (GREEN) — the action succeeded, so it
reads as a positive completion; `toast.error` (red) is reserved strictly for things that went wrong. So delete
that worked = green, delete that failed = red. (No separate destructive-confirmation variant; the green-on-
success convention carries it.)

## The arrival choreography (Phase 4.5, ratified "Calm + 700ms")

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
from its injected stylesheet (`slideToBottom`/`fadeOut`, 0.5s) — `transition-duration` overrides do
NOTHING there; the exits-faster rule must override `animation-duration` (`!important`, scoped to
`data-state="closed"`). The drawer's TRANSITION only drives drag-release snap-back (under
`data-state="open"`) — never touch it. Don't trust "vaul hardcodes inline transitions" notes from
older write-ups.

**Two adjacent craft rules (P4-era, still binding):** any full-width `inset-x-0` overlay floating
above a GESTURE track needs `pointer-events-none` on the box + `pointer-events-auto` on just its
controls (`items-center` centers children but the BOX stays edge-to-edge and eats pointerdown across
its flanks — this once killed swipe-nav on all six shared-viewer surfaces). And the repo's
react-hooks lint bans setState-in-effect sync resets — use the adjust-state-during-render pattern
(prev-state comparison) for transient view resets.
## The component index

The library renders its own index. `/design` lists every component file under
`src/components/{ui,shared,marketing/system,marketing/sections/shared,marketing/frames,marketing/sections/features/shared}`
with the page that renders it, derived from the pages' imports by
[`scripts/design-rules/collect.mjs`](../../scripts/design-rules/collect.mjs) into the committed
`src/app/(dev)/design/rules/rules.generated.json`; a file with no specimen carries a reason in
`src/app/(dev)/design/rules/annotations.ts` (`COMPONENT_NOTES`: the root singletons `GlowFilter` and
the `Toaster`, the provider-bound `AppShell`, `MediaLightbox`, `ClaimUploadsOnAuth`, the
`UploadThumbnail` that takes a live File), and `rules-annotations.test.ts` fails on silence. The table
that used to sit here was hand-maintained and drifted; the pages ARE the index (the library phase,
2026-09-11).

## Where it lives

`src/app/globals.css` (tokens + utilities + guards, the single source; its `@theme` block and the `dark`
variant sit in `src/app/theme.css`, shared with the lab's own Tailwind entry) ·
`src/app/layout.tsx` (font loading) · `src/components/ui/*` (the crafted primitives) ·
`src/lib/errors/` (taxonomy) · `src/components/vendor/*` (third-party packages copied in verbatim) · `src/components/shared/route-error.tsx` + the route-group
`error.tsx` files · `src/app/(dev)/design/` (the lab: the library pages; `/design/rules`, every enforced rule derived from
the guard tests' titles, the star-marked runs in this doc and `marketing-content.md`, and the rulings, with
`pnpm design:rules` regenerating `rules/rules.generated.json`, `rules-registry.test.ts` pinning it fresh
and `rules/annotations.ts` holding the scopes and Will's verdicts; `touchpoints.ts` the rulings
registry; `sandbox/` the open boards with their own sheets; the four probes) · `src/lib/design-gate/*` +
`/api/design-gate` (the gate, outside the lab because production depends on it) ·
[`../decisions/design-record.md`](../decisions/design-record.md) (the rulings, verbatim). Perf baselines: [`../perf/v1-baseline.md`](../perf/v1-baseline.md).

## Gotchas / don't-revert

- The lab's `design.css` keeps the `.mono` mock sheet (the sandbox's frozen token set, the one
  deliberate duplicate of production tokens: it is what the boards are judged in), the type layer and the
  shared motion, and declares NO keyframes: keyframe names are document-global and the lab once shadowed
  nine production names on every `/design` visit; `src/app/keyframe-uniqueness.test.ts` holds the count at
  zero. A board's own CSS lives beside the board under `sandbox/`, imported by it, so it leaves with it.
- 47 behavior pins (`*.test.tsx`, the component vitest project) freeze MediaLightbox / GuestUpload /
  LikesProvider behavior ahead of the Phase 4-5 decomposition — they assert behavior only, never
  styles, so token/craft changes don't touch them.
- jsdom can't run the lightbox pause-on-navigate effect (portal/commit timing); that one pin was
  dropped on purpose — cover it in live device passes.
- ★ **Two Tailwind entries, one theme, two scans** (the library round, 2026-09-02). `globals.css` excludes
  the lab and `docs/` from its scan (`@source not`), and the lab compiles its own utilities from the entry at
  the top of `design.css`, which `@reference`s `theme.css`. Never `@reference "globals.css"` from the lab: it
  drags the exclusion along and the lab compiles nothing (19 rules against 695, measured). Never move a
  token VALUE into `theme.css`: it holds only the variant and the `@theme` mapping. Pinned by
  `src/app/css-source-policy.test.ts`.
- `vitest.setup.ts` mocks sonner globally; `vi.unmock("sonner")` is the per-file escape hatch.
- shadcn `src/components/ui/*` files are semicolon-free (generator style); app code uses
  semicolons. Don't reformat either direction.
- ★ **The lab and production are BOTH provisional, and the arrow points both ways.** A lab specimen is
  often an early prototype of FUTURE UI, and a shipped surface is sometimes itself a minimal stand-in
  that has not been designed yet. So a mismatch between a specimen and the production surface it names
  does NOT establish that the specimen is wrong: **a minimal production surface is not evidence against
  a specimen.** When a proposal does not fit its surface there are three answers, and collapsing the
  middle one into "reject" is the easy mistake (it was made twice during the glow merge, 2026-08-31):
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
  left: the licence notice in every file, an EXACT count of marked deviations (it shipped as a floor,
  `>= 2` against an actual 11, so it could not fail; corrected at the merge), and the palette parity
  the A/B depends on. Two `react-hooks/set-state-in-effect` sites inside `BorderBeam.tsx` are known,
  accepted, and NOT gate-verified, which the rounds that place the beam should know. Compose ON a vendored package from your own file; never edit it in place, and mark
  any unavoidable deviation `PARTYREEL:`. First instance: border-beam v1.4.0 (MIT), vendored after
  three hand-ports missed, each substituting our low-chroma five into a palette tuned at the sRGB
  gamut edge and then compensating with filters.
