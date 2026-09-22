# Design system: identity, tokens, motion

> ROLE: the visual system in force: token contracts, type, rounding, elevation, motion, state
> colors, and the error taxonomy's UX contract.
> BELONGS HERE: what the system IS + its invariants + don't-reverts. · NOT HERE: the craft
> defaults (→ [`../design/guidance.md`](../design/guidance.md)), per-surface redesigns (each
> surface's own doc), how it was chosen and what shipped when (→ git).
> GROWS BY: edit-in-place as tokens/rules evolve; the lab (`/design`) stays the experimentation
> venue, this doc records what's ratified.

**The design law is the bible on `/design/library/rules`** (22 rules, Will's; source
`src/app/(dev)/design/rules/bible.ts`) **plus each component's contract** (a test tagged
`@contract-for`, shown on the component's Library page). This doc is the machinery and the scars: how
the system works, and the landmines (★) that break silently when reverted. A ★ is never a rule, and a
decision recorded here is precedent, not law.

## What it is

The design system is the production tokens in [`src/app/globals.css`](../../src/app/globals.css), the
crafted primitives across `src/components/ui/*`, and the error taxonomy in
[`src/lib/errors/`](../../src/lib/errors). The lab (`/design`) is two things and never a third: a
**LIBRARY** of production imports (the reference pages render the real components and tokens, synced by
construction; `/design/library/marketing` renders the marketing system on the cinema skin; the index is
below) and a **WORKSHOP** holding only the boards whose winner is not yet wired (`sandbox/`, ordered on
the desk by `DESK_ORDER`). Prototype and compare there; when a winner is wired, the RULE moves here (or
to its surface doc) and the board is deleted (git keeps it). The registry the lab reads is
`touchpoints.ts`: one `RULINGS` row per ruling (what shipped, why in one line, and where the rule lives
in `lives[]`).

## The identity: achromatic, media is the color

The chrome is a cool grey with no brand hue, so the photographs supply every colour and only feedback
and actions are coloured.

- **Cool grey in BOTH modes, at hue 286.** The chrome's greys sit at hue 286 with a chroma between 0.002
  and 0.0105, a temperature and never a colour (half again Apple's grey, because a tint disappears into
  our blacker grounds). The exceptions are pure white (the light menu, the dark hairlines' white alphas)
  and the admin chart greys (`--chart-N`), still at chroma 0. Light = the Pearl page (bg
  `oklch(0.995 0.002 286)`, card the SAME white, fg `0.145 0.006 286`, menu pure white `oklch(1 0 0)`);
  dark = the Graphite room (bg `0.105 0.0053 286`, an OPAQUE card `0.225 0.006 286`, popover `0.27`,
  secondary/accent `0.315`), ONE room for the app and every cinema chapter. A card on the page is its
  hairline, never a step of 0.007 no eye resolves (and never a shadow, see the Elevation contract).
  **Four registers:** the page (`:root, .surface-paper`), the set-apart mat (`.surface-mat`, light only,
  declared and worn nowhere yet), the room (`.dark`) and the slab (`.surface-ink`).
- **THREE text steps.** `--foreground`, `--muted-foreground`, and `--faint` for a timestamp, a caption
  or a hint (`text-faint`): one token is one grey on every ground, where a hand-set alpha composites
  against whatever is behind it. `--faint` measures 3.21:1 on the page and 4.47:1 in the room: captions
  only, never body copy, never a control's only label, and never stacked with a further alpha.
- **The brand is the v1 wordmark, alone.**
  [`src/lib/brand/wordmark.ts`](../../src/lib/brand/wordmark.ts) holds the SVG's single path byte for
  byte, [`Logo`](../../src/components/shared/logo.tsx) inlines it in `currentColor` (the ground sets the
  colour) and sizes it by HEIGHT (22px in a bar), and the social card (`src/app/opengraph-image.tsx`)
  draws the same path. Every door mounts `<Logo />` and nothing else, so there is no lockup to keep in
  step. ★ Never retype or optimise the path: replace the whole string from the next export. The MARK is
  a stand-in (the Aperture tile behind `markOnly`, mounted nowhere in production) until the v1 icon
  lands.
- **`--brand` is an ALIAS of `--primary`** (ink). Never reintroduce a brand hue: photography supplies
  all colour and the accent stays off (bible 1); marketing may carry light of its own (the Aurora,
  non-sampled spill), so a section without a picture is still beautiful.
- **Feedback + actions are ALWAYS colored**, state and never decoration: `--success` green, `--warning`
  amber, `--like` rose, `--destructive` red, `--info` blue (a Badge and table-row tone), and the two
  action hues, `--save` blue 252 (icon-only) and `--reel` violet 300 (host reel curation: the
  `Clapperboard` icon, and the fill of the reel's own action buttons), each with light/dark variants.
  **The action colours are UNIVERSAL**: one colour per action everywhere it appears, guest and host
  (like=rose, save/download=blue, hide/show=amber, approve=green, delete=red, add-to-reel=violet; guests
  lack the host's verbs). **Monochrome at rest → full-brightness colored STROKE on direct icon-hover + a
  SUBTLE `/25` FILL on the active state**, so the outline stays legible; native `title` tooltips. →
  [host-app.md](host-app.md) for the action model.
- **`--gallery*` stays always-dark in both themes** (media surfaces; never overridden in `.dark`).
  ★ **A `bg-gallery` on a dark leaf paints two registers too deep.** `--gallery` is the media WELL at
  `0.065 0.0045 286`, the deepest thing in the system, so on an OLED panel a photograph is the only
  light on it; the dark LEAF on a paper page is the slab at `0.165 0.0053 286`, and `.surface-ink`
  writes its own values rather than deriving them from `--gallery*` (derived, a footer would sink to the
  well and read as a hole). Inside `.surface-ink`, `bg-background` IS the slab.
  ★ **Painting a subtree dark is only half the job.** `--ring`, `--border`, `--foreground`,
  `--muted-foreground` and `--brand` are not surfaces, so under `.surface-paper` they keep their LIGHT
  values: `outline-ring/50` (applied to `*`) lands a ~1.4:1 focus ring on the slab, muted text reads
  2.69:1, and a bare `border-t` paints a near-white hairline, all INVISIBLE while you work on a cinema
  page where the subtree sits inside `.dark`. Wear `.surface-ink` (the `.surface-paper` mechanism for
  one subtree), which carries every token a leaf needs: **`--brand` redeclared DIRECTLY** (a `var()`
  inside a custom property resolves where it is DECLARED, so `:root`'s `--brand: var(--primary)`
  inherits down as paper ink; `.surface-ink` re-declares `--primary` and `--brand` together); **both
  shadows on the DARK ramp** (`--shadow-lift`, `--shadow-layer`; paper's 6 and 10 percent are nothing on
  a slab); **`--card-foreground` WITH `--card`** (shadcn `Card` is `bg-card text-card-foreground`, so
  half a pair is ink-on-ink), `--muted-foreground` with `--muted`, and `--input` beside `--border`. A
  shadow token that must draw nothing is `0 0 0 0 oklch(0 0 0 / 0)`, never `none`: Tailwind composes
  `--tw-shadow` into one comma-separated `box-shadow` with the ring slots, and a `none` in that list
  invalidates the declaration and takes the ring with it. The ink footer is the worked example
  ([marketing-footer.tsx](../../src/components/marketing/chrome/marketing-footer.tsx), pinned by
  `footer-contract.test.ts`).
- ★ **A hand-assembled dark set is for a LEAF, never a page's chrome.** A leaf knows every token its
  children read; page chrome's set is always one token behind what a descendant asks for next. The
  marketing desktop nav panels render IN FLOW inside the header (not portalled), so a `--gallery*` set
  on the header that omits `--popover` paints `--foreground` white on `--popover` white, every nav title
  at ~1.07:1, while the same markup on a cinema page is correct. A page that wants dark chrome JOINS THE
  `(cinema)` GROUP, where `.dark` flips the whole block; never re-derive the group from the paper side.
- ★ **A child straddling a chapter cut sets two silent traps.** (The /help and /about idiom: a visual
  pulled across a cut with a negative margin.) The chapter must NOT carry `isolate` (the footer does; a
  chapter never does): it traps the child's z-index in a stacking context, so the next section's
  background paints over the overhang. And the child's wrapper needs a block formatting context
  (`flow-root`), or the negative margin COLLAPSES THROUGH it into the ancestor and the next section's
  text renders over the child (`/help` escapes it only because its straddle sits in a padded section).
  The child also carries `surface-paper` ITSELF (re-aliasing the light block, the shadows' paper alphas
  included) and wears `shadow-lift`, since a card across a cut is one object on another.
- **A rotated tile needs more frame than its size suggests**: a square's bounding box grows to
  `side x (cos t + sin t)`, so offsets authored against the unrotated size clip against an
  `overflow-hidden` frame. Size a stage from the ROTATED extent.
- ★ **A chapter's stacked-viewport rule OUTRANKS its children's padding.** `PaperChapter` carries
  `max-lg:[&>section]:py-14` (two paddings meeting at a cut read as dead space on phones), and that
  child selector beats a plain `pt-*` on the section, so below `lg` a child's own padding is silently a
  no-op. A chapter whose section must clear a large straddling element passes
  **`compressStacked={false}`** and its sections own their padding. Never reach for `!`: it wins at one
  breakpoint and loses at another (an `!` on `sm:pt-40` silently beats an un-`!`'d `lg:pt-44` above
  1024px).
- **Where a frame's height and a seam's offset are derived from each other, keep both in one place**:
  /about's `.mkt-gather-straddle` percentage and its twin `.mkt-gather-clear` are ONE calculation, side
  by side in marketing.css, so retuning one cannot strand the other and land the album on the prose.
- **Before believing "Tailwind emitted no rule", check your grep.** Tailwind escapes `[`, `]` and `.`,
  so `py-[0.08em]` ships as `.py-\[0\.08em\]` and a raw-text search finds NOTHING while the rule works.
  Two real causes give the same symptom: a **stale dev CSS chunk** (Turbopack reuses unhashed chunk
  filenames ACROSS worktrees; the fix is in [testing-verification.md](testing-verification.md)), and an
  arbitrary `text-[clamp(…)]` that needs the `text-[length:…]` form because v4 cannot tell a size from a
  color (a named ladder step avoids it). Load-bearing geometry still belongs in the component's own
  stylesheet, for readability.
- `BRAND_HEX` (`src/lib/constants/site.ts`) is ink `#101010` for OG/satori.
- The QR presets' corner tints (the legacy coral among them) are INTENTIONAL exceptions tied to no UI
  token: existing events keep their rendering, and scanners locate corners by shape.

★ **A theme alias is emitted only when the scanner sees it used.** Tailwind v4 drops an unused `@theme`
variable, and a colour read by name from JS or SVG (`var(--color-chart-N)` built from a template string
or a data table) is never seen, so it resolves to nothing. Tokens read by name outside a class live in
`theme.css`'s `@theme static` block (the chart aliases, beside the type ladder), which is emitted whole;
the raw `--chart-N` values still flip with the mode.

### The media-forward card

The one anatomy for a tile whose picture IS the card: the image fills the card, the copy keeps its
position bottom left, and a dark gradient keeps the words distinct. It serves the home's event types,
the feature doors and every page's closing row, the blog library and the events teaser. TWO overlays,
never one, and they have different owners. The **visual's own fade** is the picture's (bottom-weighted,
and it lifts on hover); the **copy gradient is the CARD's**, one treatment for every feature and visual
pairing: `CARD_COPY_SCRIM` in
[feature-door.tsx](../../src/components/marketing/sections/features/shared/feature-door.tsx), a band
under the copy row plus a bloom in the bottom-left corner the copy starts from, stacked over whatever
visual the slot holds, and it never lifts. So a visual that wants to be quiet fades ITSELF (the river's
dissolve, the ghost's filter) and a card that wants its words read wears this. ★ The alphas are a
per-pixel reading off the real photographs, not a taste: re-measure on every door when one moves.

## Chapters: the attention arc

Marketing pages alternate **cinema** (dark) and **paper** chapters to group sections and break the
monotony of an all-dark or all-paper page. A chapter is a **pacing principle, not a component**: an
**attention arc** that opens strong to recapture attention, ramps down through supporting sections that
stay interesting but stop shouting and carry the information, and hands over to the next chapter's bold
opener. That paces the visual-forward sections (a hero, a live demo, the reel) against the
information-dense ones (curation, privacy, FAQ), so a page is never monotonous *or* overwhelming.

**The first section of each chapter carries more weight than a body section, and it stays BESPOKE**: the
same device on every opener reads as templated one level up. The devices are a **vocabulary**, and a
page **varies the device between its chapters**:

- the heading a tier up (`SectionShell scale="lg"`, the ladder's `chapter` step)
- the hard film-cut entrance (`reveal="cinema"` / `data-mkt-cut`) instead of the soft rise
- materially more air above the opener than a body section gets
- an object that physically crosses the chapter cut (/about's gather, /help's emblem strip, /blog's
  featured card)
- a drawn rule (`[data-mkt-rule]`, the masthead hairline)
- a lit subject (the reel player, a screen in a dark room)
- a full-bleed frame or strip (`w-screen -translate-x-1/2`; safe because the cinema and paper skin
  wrappers clip the x axis, so nothing scrolls sideways. The clip stays ON THE WRAPPER: on `body` it
  propagates to the viewport, which treats `clip` as visible)

**Scope.** Core marketing pages with enough body sections to justify chapters: home, the feature pages,
the event pages, how-it-works. **Not** the resource and utility pages (help, blog, press, contact,
about, careers, legal), which keep the cinema hero → paper body → cinema close rhythm, each designed
bespoke. The checkable line: **the arc applies where a chapter holds several distinct sections; where
the chapter IS the page's body (an article, a form, a reading surface) it does not.** Two devices at one
cut are noise: an opener that already carries a straddling object takes no second device.

**A full-image section is a way to CROSS a chapter cut:** a section standing on a full-bleed photograph
may close a chapter, open one, or sit between two, so the page turns from dark to light through a
picture rather than over a hairline. Use it sometimes, never at every cut, or it reads as a template.
The home's chapter 1 closes on `full-quality` standing on a `PhotoSection`, so the live demo opens the
paper chapter; the album page stands a bare `PhotoSection` (no copy, no plate) BETWEEN its chapters, so
the Aurora on the quality section's floor rises into a photograph rather than into paper, whose white
would drown it.

**A chapter never escalates.** It may close on an **anchor**, a strong visual that wraps its ideas
together, but only after the sections before it have ramped down: the loudest non-hero section right
before a cut leaves the next chapter no quiet to open against, and two huge visuals fighting across one
cut is the same failure. A chapter ends on its own air.

**Shape paces where the arc paces loudness: no two sections back to back feel repetitive.** Neighbours
may share a register but never a layout. Read the page's column rhythm top to bottom: a centred icon
three-up after a centred icon three-up reads as one long section, and "three centred sections in a row"
is the failure to watch on a paper chapter, where only shape carries the pacing. The home's answer:
chapter 1 runs strip, ledger, three-up on a photograph; the paper chapter alternates the centred stage,
a left masthead, a mirrored split and a numbered ledger.

The home arc (order and surface single-sourced in `section-ids.ts`): **chapter 1** runs from the hero
through the trust strip, the decomposition, the film strip and the guest-side ledger to `full-quality`
on the switching photograph · **chapter 2** (paper) opens on the live demo's stage (a lit subject) and
covers the album, curation and privacy · **chapter 3** opens on the reel, supports through events and
pricing, and closes on the FAQ, the CTA and the tail.

## Light: SPILL, BEAM, and the lamp set

Every light on the site is SPILL, light falling FROM a lit thing onto what is near it, or BEAM, an
object lit BECAUSE IT IS the live subject. Picking the wrong one is the usual mistake. The ground
usually picks: ink takes the beam, paper takes spill in the paper register.

**SPILL's four laws**

| # | Law | What it kills |
| --- | --- | --- |
| 1 | **Source.** Name the lamp: the object emitting, or the PLACE it lights (bible 11). | Decorative glow on section edges, cards, borders, "anything that could use some life" |
| 2 | **Direction.** Spill has a vector; every instance declares where it comes from. | Even rims, concentric halos, premium pill treatments |
| 3 | **Colour of the lit thing.** Real media where it exists, the lamp set where it does not. **Never a house token, never a state colour.** | The glow becoming a second brand palette. Amber storage warnings, violet reel glows |
| 4 | **Falloff.** Fades with distance, never draws an edge, sits behind content, always warped, always an always-on base under any travelling band. | The paused-state invisibility trap |

**Bible 11 sits over both law sets:** a lamp may light a section without media, because a lamp needs a
PLACE rather than an object throwing it. The footer's seam (`footer-glow.tsx`, the house light with no
media behind it) is the model, and the Aurora (below) is that light in three forms, never on a light
ground.

**BEAM's four laws:** 1 it marks the object that is currently the LIVE SUBJECT (working, awaiting,
uploading, publishing, live). 2 One subject per view. 3 **It ends when the state ends** (a beam is a
state, never a decoration, and that is the whole difference between a live object and a pretty border).
4 One standing exception, named so it stays an exception rather than a precedent: a premium object at
rest (Get Pro, whose card already carries stacked photographs).

**Scarcity is a DISTANCE, not a count:** roughly a viewport of unlit page between lamps.

**NEVER:** nav panels and dropdowns (no lamp, and the frequency doctrine forbids theater on the
most-used controls) · the storage meter near its cap and upload errors/retry (the moment spill can mean
"warning" it is a state colour and the system is decoration; failure is `--destructive`, full stop) ·
generic skeletons (a skeleton is an absence; spill needs a presence) · every CtaBand (the
every-section-gets-a-version failure under another name) · the admin portal.

**Every new lamp answers four questions before it is built**, and someone other than its author can
answer them: **Lamp** (what is emitting, or what place is lit?) · **Direction** (from where?) ·
**Colour** (sampled from what, or the lamp set?) · **Admitted by** (which law lets this in?). A
placement that cannot answer all four is not built; a pointer lamp, a CTA rim and an upload light all
fail it.

### The lamp set, and its three registers

The five HUES are the identity constant: **25 coral, 85 amber, 155 green, 255 blue, 305 violet**. What
varies per surface is the REGISTER, not the hue.

| Register | Values live in | For |
| --- | --- | --- |
| **Ambient** | `--lamp-1..5`, [globals.css](../../src/app/globals.css) | Light falling on things: spill, the confetti canvas. Hand-tuned per hue (85 needs a higher L than 305 to read equally bright), which is why it is not one flat L/C row |
| **Paper** | `SPILL_REGISTER.paper`, [sampled-palette.ts](../../src/lib/shared/sampled-palette.ts) | The same light on a near-white ground, where the dark register makes a card look dirty rather than lit. Uniform L/C, not yet hand-tuned per hue |
| **Live** | the `partyreel` entry in the vendored [border-beam styles.ts](../../src/components/vendor/border-beam/styles.ts) | The beam. Same five hues, raised to the chroma a gamut-edge gradient needs, **generated by `glow-contrast.ts`'s `oklchToSrgb`**, hue held exactly. It is a DERIVED register, not a second palette. It cannot be a `var()`: that file regex-parses `rgb()` strings to compute alpha variants, so a token would silently break it. Pinned by `border-beam-vendor.test.ts` instead |

**The lamp set is LIGHT, never UI** (bible 3). Never a text, border, background, state or brand colour:
these five exist so the LIGHT in a room can carry colour while the room does not. Enforced two ways: the
block is deliberately **not** in `@theme` (so no `bg-lamp-1` / `text-lamp-1` utility is ever generated),
and a fence in [globals-theme-contract.test.ts](../../src/app/globals-theme-contract.test.ts) requires
every CSS reference to land in a gradient or in another custom property that re-exports it.

★ **Which sampler you pick decides whether law 3 fires on guest media.** `useSampledPalette` (the URL
form) decodes through the reel engine's `decodeImage` (`mode: "cors"`, `cache: "no-store"`), so it
samples presigned R2 media correctly: hand it a row's `previewUrl` (~16KB), never the original.
`useSampledPaletteFromDom` reads the `<img>` elements already painted, and a raw presigned R2 tile
carries no `crossOrigin`, so its canvas taints, `getImageData` throws, and the `.catch()` silently
returns the fallback five: no console error, no failing test, only "the colours look generic", and no
lab specimen reproduces it (every specimen samples same-origin `marketingImage(...)`). So a guest-media
lamp takes the URL form on `previewUrl`, or its tiles carry `crossOrigin="anonymous"`. The `no-store` is
load-bearing either way: a plain `<img>` fetches the same URL with no `Origin`, R2 answers without ACAO
or `Vary: Origin`, and a later CORS fetch reads the poisoned cache entry.

### Where the machinery is

The engine is `[data-glw*]` in [globals.css](../../src/app/globals.css), kept **UNLAYERED**, and the
primitive is [`Glow` / `GlowFilter`](../../src/components/shared/glow.tsx).

★ **Layer the glow engine and one caller's `blur-sm` silently deletes its turbulence.** Inside
`@layer base` the utilities layer outranks the engine, so a `blur-sm` from a caller replaces
`filter: url(#glw-warp) blur(...)` wholesale and the turbulence vanishes with no error and no failing
test: unlayered is load-bearing. That is also why `Glow` **accepts no `className`**: the caller's own
wrapper positions it, and tuning goes through `vars`. The `[data-reveal-chip]` `!important`s are the
same utilities-beat-base lesson read from the other side.

★ **A band-only glow is invisible whenever it is paused** (SPILL law 4 as code). The travelling band
sweeps a window wider than the layer (the mask drive animates `mask-position`), so at rest it sits fully
off-layer and shows NOTHING, and rest is its default state below the fold AND its reduced-motion state,
which breaks the arrival-default contract under Motion. So base and band always ship together: the
engine's always-on `[data-glw-base]` under the travelling `[data-glw-band]`. The base is how a
reduced-motion arrival still ARRIVES.

`GlowFilter` (its own **server** component,
[glow-filter.tsx](../../src/components/shared/glow-filter.tsx)) is mounted **once, in the root layout**.
Root and not `(marketing)`, because `not-found.tsx` renders the marketing footer outside that group.
Never mount a second: SVG ids are document-global.

★ **A missing host is a quality failure, not a crash.** A dangling `filter: url(#glw-warp)` (a renamed
filter id, a deleted host node) does **not** blank the element. The whole chain is dropped, `blur()`
included, so the five ellipses land as hard-edged colour blobs: visibly wrong, and completely silent.
`Glow` carries a dev-only console guard for it.

★ **A band resting mid-travel shows a reduced-motion visitor the comet at full strength, forever.** The
animation lives inside `@media (prefers-reduced-motion: no-preference)`, so whatever the band *declares*
is what a reduced-motion visitor sees permanently: declaring `50% 0` with `mask-size: 280%` puts the
comet's peak at dead centre of the box, the exact midpoint of the sweep. The band rests where its
animation starts: `150% 0` on the mask drive, `glw-drift-x`'s from-keyframe (`translate: 32% 0`) on the
transform drive. Pinned by test.

### The shipped light

| Light | Where | Shape | Colour |
| --- | --- | --- | --- |
| **The footer seam** | [footer-glow.tsx](../../src/components/marketing/chrome/footer-glow.tsx), every page incl. the root 404 | `seam` | the house lamp set (no media to sample) |
| **The film strip's backlight** | [film-strip-glow.tsx](../../src/components/marketing/sections/home/film-strip-glow.tsx), full-bleed under the strip | `seam` | **sampled** from the strip's eight frames |
| **The reel screen's pool** | [reel-screen-lamp.tsx](../../src/components/marketing/sections/home/reel-screen-lamp.tsx), under the reel player, the box exactly the screen's width under an elliptical wrapper mask | `seam` | **sampled** from the reel's poster |
| **The Pro card's beam** | [pro-card-beam.tsx](../../src/components/marketing/sections/home/pro-card-beam.tsx) | beam (`pulse-outside`, the vendored border-beam) | the derived beam register of the lamp set |
| **The feature heroes** (album, guests, sharing) | [screen-lamp.tsx](../../src/components/marketing/system/screen-lamp.tsx) under each page's stage (the arrivals stream, the attribution wall, the link frame) | `seam` | **sampled** from the frame the visitor is looking at |
| **The QR plate switching on** | [qr-hero.tsx](../../src/components/marketing/sections/features/qr/qr-hero.tsx) | `bloom` armed on arrival, resting at `--glw-base: 0.34` | the house five (a code is ink on white, law 3's no-media branch) |
| **A shared reel, in the Studio** | [publish-light.tsx](../../src/components/reel/publish-light.tsx) `StudioPublishLight`: wings at the sides of the reel's frame in [reel-studio.tsx](../../src/components/reel/reel-studio.tsx), never over the media, mounted only while the reel is shared; the room is near-black in both themes, so it is never fenced | `bloom`; the swell only for a share made on this page (`sharedHere`), otherwise the band eases up to the same base | the house five |
| **A shared reel, on the host's share card** | `ShareCardPublishLight`, a pool centred under the bottom edge of [reel-share-card.tsx](../../src/components/reel/reel-share-card.tsx) (nothing reaches the poster); it follows the host's theme, so it is named on the light-ground fence | `bloom`, the same gate | the house five; none at all on a light ground |

**`ScreenLamp` is the ONE underlight as a component:** a lit object throws its own sampled light down
off its bottom edge, full-bleed, as a sibling of the object (never inside a clipping frame). Neither
`throw` nor `halo` can backlight an opaque object, so a new underlight is a `<ScreenLamp>` around the
object, not a fourth file, and its section is `overflow-x-clip`, never `overflow-hidden`, or the field
hanging below is cut off. A feature page lights its hero and the footer seam, and any second light sits
a long way below the first (the album page's Aurora floor); the curation and privacy pages carry NO lamp
(restraint is their identity), nor does the doors band (a row of lit cards is the
every-section-gets-a-version failure).

★ **A radial mask's reach is a fraction of the FULL field.** The transparent stop sits at 78% of that
radius, so a `--glw-reach: 78%` on a field the size of its object puts the fade outside the box and the
light renders as a rounded square. Size the field generously (`-inset-32` on the QR plate) and keep
reach where the falloff completes inside it.

The home page's lamps are the film strip's backlight, the reel pool, the Pro beam and the footer seam,
spaced by the distance rule, plus the Aurora on the guest ledger and the closer. The hero and the event
cards carry none: a wall of photographs is the ground, not a source, and the cards lose to the Pro beam
on scarcity.

**Two ways a seam's sides end, and the box decides.** A seam's five ellipses sit at 14/38/60/80/96% of
the field, so its colour is still ~40 to 50% at the ends of ANY box, and a box that ends on screen ends
the light on a cut. A strip's light goes full-bleed, ends off-screen
([film-strip-glow.tsx](../../src/components/marketing/sections/home/film-strip-glow.tsx)). A screen's
light is never wider than the screen: its box IS the screen, under an elliptical wrapper mask anchored
at the screen's bottom centre (rx 46%, smoothstep stops), a pool gone 31px inside each edge at 1440 and
14px at 375. Never a linear side mask on a wider box, which draws a wedge ending on a straight line
(pinned by test).

**One clock.** Every lamp passes `--spill-cadence` (**8s**), never a literal, so one change re-times the
page. The Aurora's field takes a SIBLING, `--aurora-cadence: calc(var(--spill-cadence) * 3)` (24s),
because a chapter-sized field on a lamp's clock reads as a screensaver. ★ The sibling must stay declared
in `globals.css`: `vars` lands inline and outranks the engine's own `--glw-dur`, so an undeclared
cadence is invalid at computed-value time, the `animation` shorthand goes with it, and the band FREEZES
over a still-lit base, which reads as a design choice rather than a defect.

### The Aurora, and its three forms

**The Aurora is the coloured light**, one family rather than three effects. Its FORMS: the **seam**, a
band where two grounds meet (the footer, the film strip, every screen lamp); the **throw**, cast from a
point on an object, which is how a plate sits on open dark without a rim; the **field**, a whole chapter
lit at its own edges. Two MARKS sit beside them: the **bloom**, a one-time glow that rests lit and never
decays to nothing (the QR plate and the publish moment), and the **halo**, which lights an OBJECT from
behind and never wraps a button (no production use; the Library holds its specimen). Code identifiers
keep their names (`Glow`, SPILL, `--glw-*`, `--lamp-*`); the Library and these docs say Aurora.

★ **The Aurora is composed for the place, never stamped.** The REGISTER and the CLOCK are fixed so they
cannot drift; the GEOMETRY is the call site's, chosen by looking at the section, with a comment saying
why. `SectionLight` therefore has **no default placement**, and its contract refuses the same
composition twice on one page. On the home page the **closer** takes the light at its bottom edge only
(`placement="bottom" reach="58%"`), rising from the line it shares with the footer's seam so the two
read as one horizon, and the **guest ledger**, the page's one left-aligned header, is lit from its open
side (`placement="room" from={{ x: "0%", y: "50%" }} reach="62%"`). ★ A section with no boundary line of
its own cannot take a band or a floor cast: the lamp's box clips its falloff into a hard line nothing
explains. A cast from a side edge, vertically centred, with a reach under about 64 percent finishes its
falloff inside the box.

**The field is [`SectionLight`](../../src/components/marketing/system/section-light.tsx)**, beside
`ScreenLamp` for the same reason: the placement grammar and the register live in ONE place, so a chapter
asks for light rather than assembling bands and custom properties. Two seams at the section's own
boundaries, the bottom one the top one flipped on its own axis (`scale: "1 -1"`; the engine must not
grow a bottom-seam shape, since law 2 makes a vector the caller's to turn), each 42 percent of the
section's height unless the call site passes its own `reach`. `placement` is
`both | top | bottom | room`, and `room` takes a `from` origin on or beside an edge of the box; `middle`
and `behind` are fenced rather than typed, because the copy would sit IN the light instead of beside it.
There is one register (the accent one) and no register axis: one object, `AURORA_VARS`, which every lamp
in the file spreads. It rides the **transform drive**, because a chapter-scale mask repaints every
frame.

★ **An Aurora on a light ground reads as a weird shadow or a stray artifact, so a CSS fence switches it
off.** The fence is CSS rather than a prop or a review note, so a chapter that turns to paper goes quiet
on its own: `[data-section-light]:not(.dark *), .surface-paper [data-section-light] { display: none }`,
theme.css's `dark` variant inverted (both halves are needed: a paper chapter lives inside a forced-dark
cinema wrapper, and a cinema page in an explicit-light session has no `.dark` on `<html>`).
★ **A second copy of the light-ground fence is the one that drifts.** It is ONE rule listing lamp BOXES:
the share card's publish light (`[data-rxp-cardlight]`, the app's one lamp that follows the host's
theme) is on it, and the Studio's twin is not, because that room is near-black in both themes and
carries no `.dark`. The hook sits on the light's own box, never on the object (`display: none` takes
what it names), and the rule is **never widened to `[data-glw]`**, which would silently switch off the
shipped seams (the footer's, the film strip's, the screen lamps'); a media-less lamp on paper still
paints the dark register's five.

**Where the page already painted the media, sample the DOM.** `useSampledPaletteFromDom(ref)` reads the
`<img>` elements already on the page, so `drawImage` reuses the decoded bitmap: zero bytes, zero
requests, zero extra decodes. The URL form (`useSampledPalette`) fetches its own copies, which is right
for a lab board and for a guest-media lamp handed `previewUrl`, but on the home page's wall it would
refetch over a megabyte of originals (`next/image` serves a different URL, so nothing is a cache hit).
The DOM form never calls `img.decode()`, which would force a `loading="lazy"` tile to fetch.

★ **Two lamp placement mistakes look like opacity problems and send you tuning the wrong thing.** (1) A
lamp goes **after** the scrims it lights through, never inside them: nothing in the hero creates a
stacking context, so a lamp under four scrims arrives at about an eighth strength. (2) The caller's
content wrapper needs an explicit `relative`, because `Container` is a static div and an
absolutely-positioned `Glow` otherwise paints **over** the H1. Fix the stack, not the opacity.

**A lamp that crosses a chapter cut is clipped at the cut**, on purpose: `PaperChapter`'s cuts are hard
(hairline + plane change, no gradients), and it keeps one lamp on one register.

**A lab specimen can be geometrically inverted from the surface it names** while its argument survives:
before judging the idea, check the specimen's geometry against production (paper above and dark below,
on a page built the other way round) and measure the surface rather than trusting the specimen's own
numbers.

## Type: the heading face + the ladder

Every heading wears the one heading face on a step of the one type ladder, and the steps keep their
order at every width. `font-heading` is a Tailwind `@utility` in globals.css (NOT a theme font token):
**Urbanist** (`--font-display`, a variable font loaded in the root layout via next/font) at **weight
700**, with a flat **-0.03em** tracking that is only the FALLBACK for headings the ladder does not
reach. A real bold weight does the work (no font-size-adjust, synthetic stroke or font-synthesis). Swap
the brand face by repointing `--font-display` + retuning the utility's two lines.

**THE LADDER: sixteen steps, one set, both halves of the site.** Ten HEADING steps and six BODY steps,
declared once as `--text-*` tokens in [`src/app/theme.css`](../../src/app/theme.css) and drawn at true
size at `/design/library/foundations#ladder`, which is where you READ them (the numbers have one home,
and it is not this doc). A step carries its own font-size, line-height and letter-spacing, each a
`clamp()` through (375, phone) and (1440, desktop): no breakpoint to jump at, and no ramp anywhere on
the site.

**The law is the ORDER, not the travel.** Heading sizes sit on one rung set from 12 to 160 whose ratio
widens as it climbs. A step's desktop end is its ruled size at 1440; its phone end is the rung that
keeps every heading ABOVE the one it heads at 375 (shifting every step by the same rungs puts the paper
h2, `prose`, under its own sub-head on a phone). Marketing travels further than the app (bible 2), only
as far as the order allows. The policy reads the paper stack (title > prose > sub-head) and the body
steps' order, FLOOR at the bottom, off the tokens at both ends.

| Step | Class | Wears it |
| --- | --- | --- |
| Display | `text-display` | the masthead, one or two words (`PageHero scale="display"`) |
| Hero | `text-hero` | the cinema hero and the home (`PageHero scale="xl"`) |
| Title | `text-title` | /help, the six feature heroes, /reel, /events (`PageHero scale="lg"`) |
| Chapter | `text-chapter` | `SectionShell scale="lg"`, the article and role titles, the footer's closer, /help's ghost folio (each pane's chapter number) |
| Section | `text-section` | the body-section h2 (`SectionShell` default) and a stat numeral: a price, a storage readout |
| Prose | `text-prose` | the paper prose head (/about, /press, /help, /contact), an article's h2, and a dead link on marketing |
| Sub-head | `text-subhead` | the sub-head under a prose or section h2 (/about's six, /help's categories, a role, the home's first chapter), an article's h3, a legal section, an article's closing h2s, a featured door |
| Page | `text-page` | every app and admin h1 (`PageHeading`), the guest event and profile titles, every screen of the guest entry sheet, the reel's title card |
| Subsection | `text-subsection` | the app's quiet middle (an event tile, a gate card, an empty state, a prompt tile) and marketing's tile and item titles (a feature h3, a plan's name, a footer column) |
| Card title | `text-card-title` | `CardTitle`, every sheet, drawer and dialog title, an FAQ question, a table's column head |

**THE BODY HALF** names every size under `card-title`. Its six steps are read in **Inter**, and **the
leading rule is `2 x size - 8`** at every rung, which lands each on the 4px grid.

| Step | Class | Wears it |
| --- | --- | --- |
| Copy | `text-copy` | marketing's ledes and paragraphs, and the ONLY body step that travels (16 at 375, 18 at 1440) |
| Reading | `text-reading` | every guest-facing sentence (16, a safe starting size), and a single-line label, link or field on a marketing page |
| Working | `text-working` | the app, the admin and marketing's own UI chrome: a row, a cell, a control, a notice |
| Caption | `text-caption` | a caption, a hint, a descriptor, a control's label (the `Caption` atom), at 12 |
| Label | `text-label` | every uppercase label, marketing and app (the `Eyebrow` atom): the caption step's twin at 12, tracked **0.08em** |
| Micro | `text-micro` | THE FLOOR at 10: metadata over a photograph, a count, a pip, a keycap, a credit. Nothing on Partyreel is under 10. |

- **`copy` never goes inside a block whose title is `card-title`.** It reaches 18 at 1440 against
  `card-title`'s flat 16, so an FAQ answer on `copy` would outrank its own question; those blocks keep
  `reading`.
- **An uppercase label carries NO `tracking-*` of its own.** The step carries the 0.08em, and a tracking
  utility beats a step silently through `--tw-tracking`.
- **`working` is the 14px rung for any functional line**, marketing chrome included: a blog rail row and
  a dashboard row are the same job at the same size. The admin may break away for density.

**Roles, not sizes, decide a step.** A heading no step fits is a role nobody has decided, and a new step
is added only when it names a size the site already uses (as `subhead` did). The MDX articles' h2 and h3
are sized on the prose wrappers (`prose-h2:text-prose prose-h3:text-subhead` in `help/[slug]` and
`blog/[slug]`), because the shared MDX components carry no sizes. Index numerals are data, not headings:
body face, tabular figures.

Six ways the ladder fails SILENTLY, all held by
[`src/lib/type-ladder-policy.test.ts`](../../src/lib/type-ladder-policy.test.ts):
- **The card step is `card-title`, never `card`.** Tailwind v4 resolves a `text-*` class as a COLOR
  before a font size and `--color-card` exists, so `--text-card` would be a token no className could
  reach. No step may take a name the colour namespace owns.
- **`cn()` has to be taught the ladder** ([`src/lib/utils.ts`](../../src/lib/utils.ts)). tailwind-merge
  files an unknown `text-*` as a colour and drops it beside a real one (untaught,
  `cn("font-heading text-chapter text-white")` returns `font-heading text-white`). A step added to
  theme.css is added there in the same change.
- **A ramp coming back.** A stock pair (`text-xl sm:text-2xl`) JUMPS at 640 where a clamp does not. No
  `sm:` size, and no step behind a breakpoint, on any heading.
- **The order breaking at one end**, read off the tokens at 375 and at 1440.
- **A heading off the ladder**: a stock (`text-xs` to `text-9xl`), arbitrary (`text-[22px]`) or inline
  size on a heading tag, a `*Title` / `*Heading` component or anything in the heading face.
- **A SENTENCE off the ladder.** Every element the heading scan does not claim is body; its size
  resolves to a NUMBER (`text-sm` and `text-[14px]` are one answer) and passes only on 10, 12, 14 or 16
  or a declared step, and an uppercase label only with no tracking or `tracking-[0.08em]`. An arbitrary
  size also carries no leading: `text-[15px]` inherits the preflight's 1.5 and computes at 22.5.
  ★ **The body scan's allow-list only ever shrinks.** Each survivor is named, counted and reasoned, and
  `BodyException.kind` holds only the structural kinds (`depicted`, `relative`, `board`: a picture, an
  `em`, a board still on the desk), so a new kind fails typecheck rather than review. ★ Neither scan
  sees a class string that never reaches a JSX attribute (a `cva` table, a const map), so Button's sizes
  are held by hand: every icon sits one Tailwind icon-step over its own text (12/14, 14/16, 16/18),
  explicit on every size in `button.tsx`'s `cva` table so none falls back to the base `size-4` by
  accident (`icon-sm` is an explicit 14 beside `sm`'s 12px text).

**A step beats `font-heading`; a `tracking-*` or `leading-*` beats the step.** Tailwind emits a custom
`@utility` in the font-* position, ahead of the size utilities, so the step's own spacing wins over the
heading face's; but `tracking-tight` (`0em` here) cancels the step's tracking through `--tw-tracking`,
and a `leading-*` overrides its line height the same way, so never put either beside a step.
`--tracking-tight` stays `0em` so the legacy `tracking-tight` usages are no-ops everywhere else.

**Only what the policy names sits off the ladder**, each by file with its reason and a count, so the
hole cannot grow: **type drawn inside a picture** (a phone, a frame card or an album that pictures the
app at reduced scale, a printed sign, the press kit's typeface plate, an emblem's glyph; a viewport
clamp would size it by the wrong box); **a LABEL inside a heading tag**, kept for the document OUTLINE
and set in Inter (the event feed's section header, `app/event-feed/feed-section-header.tsx`, the
dashboard's section labels, the admin metric bands), which is not the heading face's ladder, so never
"fix" these onto a step; and **the root error page** (`app/global-error.tsx`), which replaces the whole
document, stylesheet included, so its h1 is sized inline.

**Weight is tiered on top of the step** (one face; app page and card titles take the heading face, never
Inter): page titles **700** via [`PageHeading`](../../src/components/shared/page-heading.tsx), the ONE
source for every app and admin `<h1>`; card titles **600** (`CardTitle` adds `font-semibold`);
per-setting labels (`FormLabel`) and small uppercase eyebrows **Inter 500**. `PageHeading` adds no
`font-semibold` (it would drop 700→600), and a caller passing a STOCK size (`text-3xl`) takes that h1
off the ladder: name another STEP instead.

**Marketing's page-H1s** own their headers: the standard page h1 is `title`, the HOME hero `hero`,
long-title ARTICLE surfaces (help, blog and careers articles, the blog index's featured card) stop at
`chapter`, and utility documents (`/contact` via SectionShell, the legal shell) use the section steps.
**The hero lockup owns all of this**
([`page-hero.tsx`](../../src/components/marketing/system/page-hero.tsx), pinned by
`page-hero-contract.test.ts`): eyebrow / heading / subhead / actions on one shared `gap-6` grammar,
`scale` picking the type (`lg` the ladder above, `xl` the cinema register, `display` the masthead), and
the heading always an `<h1>` (`SectionShell`'s `as` carries the same rule for sections). Compose it
rather than hand-rolling a hero. **Its entrances are three NAMED registers, and the H1 never moves in
any:** `entrance` is `rise` (the standard stagger: the identity pages and /pricing), `cut` (the hard
film cut: the cinema-family heroes, the feature pages, the hub, /how-it-works, /events) or `blur` (the
blur-rise on the slots around the title: /help, /contact, /careers); a new hero takes one of the three
or adds a named one, never an unnamed variant or a single condensed template. `children` is the STAGE
slot under the lockup (the page owns its object, its entrance and its lamp) and `backdrop` sits BEHIND
the lockup, never in front; `PageHero` owns only the type. An h1 resting at `opacity: 0` is an LCP hole,
so `marketing-h1-policy.test.ts` refuses `.mkt-line` on an h1. The QR hero and the home hero stay
hand-rolled: their object sits BESIDE the lockup, not under it.

The **display step** is the MASTHEAD tier, 160px at 1440 on purpose (never "fix" it toward 72px), worn
by /about's "Partyreel" and /press's "Press": **ONE OR TWO WORDS ONLY**, and **the H1 matches its NAV
LABEL** (bible 6), with anything more specific in the eyebrow. `whitespace-nowrap` is load-bearing under
the clamp, so a longer title belongs at `xl`. The tracking squeeze (`.mkt-name`, marketing.css) belongs
to the STEP and must read its token there, because unlayered marketing.css beats the `utilities` layer
whatever the specificity.

The display step takes two corrections a normal H1 does not. An **asymmetric optical trim**: a display
line's box is wrong in OPPOSITE directions at each end (with `py-[0.08em]`, one honest `gap-6` reads
~44px over the name and ~9px under it), so the step trims its TOP only and never its bottom, and **the
trim tracks the clamped leading**: `mt-[calc((1em-1lh)/2-0.19em)]`, fitted so 1440 keeps `-0.12em`. ★
Mind the sign: `(1lh - 1em) / 2` agrees at 1440 and trims LESS at a phone (the contract pins the form).
Keep `py-[0.08em]`: it stops an `overflow-hidden` ancestor clipping the descender while the negative
margin removes the distance from LAYOUT. (A title with NO descender, like "Press", reads looser than one
with a "y"; the box rhythm is identical, so leave it.) And an **optical side bearing** (`leadIn`),
applied ONLY at `align="left"`: it pulls a flush-left masthead onto its column edge, and on a CENTRED
one it drags the line 3.6px off centre, which reads only as "slightly wrong". Both mastheads are
centred, so `leadIn` has no consumer; it stays gated rather than deleted so the next flush-left one does
not invent a magic number.

**THE INDEX MASTHEAD is the display step's inverse**, for a page whose CONTENT is the subject (the blog
index): a small h1 at the `subsection` step above a drawn `[data-mkt-rule]` hairline, with the lead item
owning the stage (the featured card's h2 at `chapter`). The h1 is quiet by picking a quiet STEP, never
by leaving the ladder, and it stays the h1 because it is what the page IS and never collapses under a
filter. It is not in `PageHero` (title + rule + a trailing link is a different lockup); one page uses
it, and a second index is when it gets extracted.

**TWO FACES, AND ONLY TWO** (bible 7): Inter for everything a person reads, Urbanist for what the page
says loudly. There is no mono face: no `Geist_Mono` loader and no `--font-mono` in `layout.tsx` or
`theme.css`, and `Caption` (`system/caption.tsx`) is the ONE caption atom, labels and data alike.
**Never add a font loader or a `font-mono` class back without a ruling.** Instead:
- **Data** sits on the body face with `tabular-nums`: index rows, counters, durations, sizes, table
  columns. On a spin reel (`StatBand`) the tabular figures are load-bearing: they hold a column's ten
  digits to one width.
- **A number that is the SUBJECT of its block** takes the display face with tabular figures: the pricing
  cards' price register, `StatBand`, the help filmstrip and `/help`'s ghost folio.
- **A value that must LOOK like a value** (an error digest, a full id, a storage key, a raw error) takes
  a muted plate, `rounded bg-muted px-1.5 py-0.5`, plus `select-all` where one click should take the
  whole thing; a value the person must retype as a guard (the operator delete-confirm) takes the plate
  WITHOUT `select-all`.

## Rounding: sharp surfaces, round actions

Surfaces take a small corner and actions a round one, and every corner is one of four token families,
never a literal. The values have one home, the `:root` block of
[`globals.css`](../../src/app/globals.css), drawn and measured at `/design/library/foundations#radius`
(judge corners there and on the real pages the tuner mounts on); this table says what each is FOR.

| Layer | Token | What wears it |
| --- | --- | --- |
| Surfaces | `--radius` (8px) | cards (`Card` wears `rounded-lg`, the token itself), inputs, panels, plates; the base the derived steps multiply |
| Actions | `--radius-action` / `-sm` | 0.4 of the height: 16px for a 40px action, `-sm` on the 32px default `Button`; the other sizes DERIVE from `--radius-action` (h-6 0.6x, h-7 0.7x, h-9 0.9x, the 44px `cta` 1.1x, all in `button.tsx`), so one knob moves the whole action ladder. `ctaCorner` exports the 44px corner for the few 44px actions that are not a `Button` |
| Photographs | `--radius-tile` · `--gap-gallery` | every photograph and media tile wears `rounded-tile`; `--gap-gallery` is `max(3px, var(--radius-tile))`, PINNED to the corner (below the tile radius, four corners meeting open a visible diamond; the 3px floor is the album's hairline tell), and it is the ONE gap for every media grid: the album masonry (each tile's `mb-[var(--gap-gallery)]` is its vertical gap), its skeleton, the ghost grid, the triage grids, the album-like marketing walls |
| Floating layer | `--radius-float` (12px) | menus, tooltips, toasts, dialogs, and the guest entry sheet (`rounded-t-float`, the corner of the dialog it becomes at 640, never an action's); a ROW inside a panel is `calc(--radius-float - 4px)`, derived in [`floating-layer.ts`](../../src/components/ui/floating-layer.ts), on the family's `p-1` rail |

**The derived steps climb in quarters of `--radius`** (`sm` 0.5, `md` 0.75, `lg` 1, `xl` 1.25, `2xl`
1.5: 4 / 6 / 8 / 10 / 12px). Nested-corner math is inner = outer minus gap; an action riding its HEIGHT
is the DELIBERATE exception, which keeps a control twice as round as the surface under it so it reads as
the pressable thing.

★ **Deleting the `3xl` and `4xl` radius lines brings Tailwind's defaults back.** Tailwind's own theme
defines both (24 and 32px), so they are dropped by setting them to `initial` in theme.css, which removes
the key so the utilities emit nothing. A corner that big is a pill, and a pill is `rounded-full`.

★ **A radius token `cn()` has not been taught loses to every stock corner.** tailwind-merge does not
read the theme, so an unknown token corner and a stock one BOTH survive `cn()`, and the stylesheet's
order, alphabetical for utilities on one property, picks the winner: every stock step beats
`rounded-float` and `rounded-action-sm`. The names live in [`src/lib/utils.ts`](../../src/lib/utils.ts)
`RADIUS_TOKENS` (`action`, `action-sm`, `tile`, `float`), pinned beside the type ladder's parity.

★ **Declared inside a theme set, a radius, gap, cadence or tuner token silently ignores the tuner.** The
radius tokens, `--gap-gallery`, `--spill-cadence` and the `--tune-*` knobs live in their OWN `:root`
block in `globals.css`, never in the `:root, .surface-paper` block and never in a lab sheet: aliased
into a theme set they are re-declared by every paper chapter and lab board, so the tuner's inline
override on `<html>` never reaches them there. Declared once on `:root`, the tuner wins everywhere,
`--gap-gallery` included (it reads `--radius-tile`, so the tile knob moves the gap too).

★ **A DERIVED radius token is not a runtime variable.** `theme.css` declares `--radius-sm..2xl` inside
`@theme inline`, so Tailwind compiles each into its utility and emits NO custom property;
`var(--radius-md)` is empty at runtime, and an empty var inside a `calc()` invalidates the whole
declaration silently. Derive from `--radius`, `--radius-action`, `--radius-float` or `--radius-tile`
(the real `:root` tokens), never from the scale's names.

**Anything drawn AROUND an object takes the object's radius, never a literal** (bible 9): a ring, glow
or bloom at offset N gets `object radius + N`, the nested rule read outward, or ring and object read as
two shapes the moment colour lands in a corner. `BorderBeam` auto-detects its child's computed radius
when the prop is OMITTED, and
[`border-beam-vendor.test.ts`](../../src/components/dev/border-beam-vendor.test.ts) pins that no lab
specimen passes `borderRadius`. The effect is authored for 16px+ corners, which is what this system
rounds an ACTION to, so **a beam's natural layer here is an action, not a surface**. A floating panel
uses `rounded-float`, never a derived `rounded-sm..2xl` step that happens to match it (`rounded-2xl` is
also 12px, but only the floating token moves when the floating corner is retuned).

## Elevation contract (four heights, one job each)

Four heights do four jobs, never rivals, and the rule is the SAME in both modes. A small shadow goes
where one card sits on another and a larger one under menus, dialogs and toasts; the step and the ring
carry everything else. The legend lives at `/design/library/foundations#elevation`.

| Height | Technique | How it is worn | Reached for |
| --- | --- | --- | --- |
| 1 | **The step** | `bg-card`, `bg-popover` (dark: bg 0.105 → muted 0.175 → card 0.225 → popover 0.27 → secondary 0.315) | First. A panel is a shade lighter than what it sits on. In light the card is the page's own white, so the step is a hair and the ring carries the edge |
| 2 | **The ring** | `ring-1 ring-foreground/N`, `border` | On every surface: one hairline marks where a panel, a button or a menu ends |
| 3 | **The lift** | `shadow-lift` (`--shadow-lift`) | ONLY where one object really overlaps another of its own lightness: stacked photographs (the pricing plan cards' photos, /help's mini album), the QR plate on the demo frame's mat, a print deck (/features/qr), a card laid across a cinema-to-paper cut (the /help strip, the article and legal lead cards, the guest list), the contact stamp, a white chip or play badge laid on a photograph |
| 4 | **The layer** | `shadow-layer` (`--shadow-layer`) | Under anything the page keeps living behind: dialog, sheet, popover, dropdown and its sub content, select, tooltip, the navigation menu's viewport and indicator, the toast, the guest entry shell, the help palette, the host's floating action bar, the floating Add, the reveal's share prompt, the Studio's confirmation card and the demo frame's floating mat; and a marketing mock that QUOTES one of those |

- **A surface lying flat takes neither shadow, in either mode.** A shadow on a flat dark ground is a
  smudge (bible 10) and on a flat light one it is a fifth technique; a card, a field, a segmented
  control's thumb and a frame standing on the page are their step and their ring.
- **One geometry, two sizes, one alpha ramp per ground** (blur = 2x offset, single top light source; the
  layer is the lift at double the offsets). The values live in `globals.css` and nowhere else, and
  `.dark` and `.surface-ink` carry their own darker ramp, because 6 percent of black over a 0.105 room
  is arithmetically invisible.
- **The role is the call site's to declare**, and `src/lib/elevation-policy.test.ts` refuses the four
  ways round it: a stock or arbitrary Tailwind shadow, a hand-typed inline `box-shadow`, the retired
  `shadow-float` name (declared nowhere), and a ground that re-declares the ink without both shadows.
- ★ **A bare `box-shadow` on a ringed surface deletes its hairline.** `ring-1` IS a box-shadow in
  Tailwind v4, composed with `--tw-shadow` into one declaration, so a bare `box-shadow:` takes the ring
  with it and nothing in the source shows it. Wear the utility (it writes `--tw-shadow`), or re-state
  the ring first: the toast re-states sonner's focus ring for exactly this reason.
- ★ **An unlayered rule outranks every utility.** `marketing.css` is unlayered, so a bare `box-shadow`
  there beats `shadow-lift` on the same element whatever the specificity: the unused
  `[data-mkt] .mkt-stack-card` recipe still sets one, so a card wearing it takes no lift. A shadow that
  must beat that sheet is carried inline as the token, never a literal.
- ★ **`cn()` files `shadow-lift` and `shadow-layer` under shadow COLOUR** (tailwind-merge does not read
  the theme). The two replace each other correctly, but `cn("shadow-layer", "shadow-none")` keeps both
  and the stylesheet's order decides. Nothing in the product does that; the fix is one `theme.shadow`
  line in `src/lib/utils.ts`.
- **A shadow that falls on a photograph does not follow the page's ground**: a photo is as bright in the
  light theme as in the dark one, and paper's ramp is the faint one. If a lift over media reads weak in
  light, the fix is a ramp declared on the media ground, never a raw shadow.
- ★ **No SURFACE token is translucent.** A surface token with an alpha reads solid over a page and turns
  to glass over a photograph, and nothing says so. Every surface is opaque and no surface token takes an
  alpha: glass is a MATERIAL of its own (`.glass`, below), worn only as media chrome.

### The bright edge (`data-lit`): material, not elevation

One pixel of light catching the bevel of a surface lit from above: brightest along the top, falling away
down the sides, nothing at the foot, in the FOREGROUND colour at a low alpha and never a lamp hue (bible
3). Three kinds of surface take it and nothing else does: a photograph or a video (the masonry tiles,
the event card, the canvas player, the inline reel player, the marketing frames' wells), a framed screen
(`PhoneShell`'s bezel) and the QR card (`QrFrame`, `LiveQr`, the /features/qr plate). The rule is
`[data-lit]` in `globals.css`, the Library judges it at `/design/library/foundations#bright-edge` with a
fixed 4x corner per surface, and `src/components/shared/lit-edge-contract.test.ts` holds the function:

- **The hook sits on the box that owns the radius**, and the radius is inherited, never typed (a
  hand-typed radius on a wrapper draws a second arc, bible 9). `event-card.tsx` is the standing trap:
  its outer `data-media-tile` wrapper is square, so the hook is on the rounded box inside it.
- **`data-lit="border"` on a surface that wears Tailwind's 1px `border`**: the pseudo-element is pushed
  out by that width so the light lands ON the border, one arc and not two. ★ Such a host must not clip:
  `overflow: hidden` clips at the padding box, exactly where the border ends, so the edge is drawn and
  then cut off to the pixel. The canvas player rounds its canvas instead of clipping it.
- **Dark grounds only, through `@variant dark`**, so the one definition of dark in `theme.css` decides
  and no pseudo-element is generated on paper at all (a gallery can hold hundreds of tiles).
- **Generated only where it can be drawn right**: `@supports` requires `color-mix` and `mask-composite`
  up front, because without the mask the gradient is a veil over the whole photograph and without
  `color-mix` the build's own fallback is the foreground at full strength.

## The glass material: Crystal, and the one place it lives

**Every surface that sits over a photograph wears one glass material, Crystal**, never a treatment of
its own. The numbers have ONE home, the `--glass-*` block in [`globals.css`](../../src/app/globals.css);
[`lib/glass.ts`](../../src/lib/glass.ts) names them and [`glass.test.ts`](../../src/lib/glass.test.ts)
holds the two files to each other. A pane that types its own `bg-black/55 backdrop-blur-sm` is the drift
this ends.

- **Crystal, in numbers**: a 42px blur, the backdrop at 0.68 brightness and 2x saturation, 4 percent
  black over it, and TWO hairlines (a 28 percent lip, a 10 percent ring all round). ★ **BRIGHTNESS is
  what makes glass legible, not blur**: a blur does not change the mean luminance under a pill, so a
  near-clear pane over a bright photograph loses its white text however wide the blur; that is what lets
  Crystal carry only a 4 percent tint.
- **The edges are INSET SHADOWS, never a border**: a border changes the pane's size, while an inset
  shadow draws on the padding box at the surface's own radius (bible 9's concentric arc for free).
- **Three pane utilities and no more**: `glass` (the pane), `glass glass-mark` (the same material at a
  lighter blur, because a tile carries a mark on every photograph of an album and a phone pays for each)
  and `glass-behind` (the lightbox's ground: the album blurred at half brightness). ★ A `@utility`
  compiles only in the sheet Tailwind is imported from, so the material cannot live in `theme.css` or a
  component sheet.
- ★ **THE GROUND IS ITS OWN ELEMENT, ALWAYS.** A backdrop filter blurs what is behind the element it
  sits on, so a filter on an ancestor of the photograph blurs the photograph the viewer exists to show,
  a failure that neither throws nor type-errors. `media-lightbox.tsx` puts `glass-behind` on the overlay
  and the media in the content above it; `media-lightbox.test.tsx` pins the pair.
- ★ **A GLYPH ON GLASS CARRIES ITS OWN LIGHT** (`glass-mark-lit`). The rose `--like` mark reads 4.4:1
  through Crystal over the brightest photograph in the repo, under the 4.5:1 floor, and WHITE fails the
  same way on a near-white sky; judge it over the raw photograph, never over an album already darkened
  to half brightness. A pane cannot fix a colour's contrast, and a tint heavy enough for a sky would
  sink every dark photograph, so the glyph wears a halo: invisible over a dark photograph, the whole
  difference over a bright one.
- **Dark in both themes**: chrome over a photograph is chrome over a photograph whatever the page is
  made of, so no `--glass-*` token is redeclared under `.dark`, and the event card's chip wears the same
  pane on a paper dashboard as on a dark one.
- ★ **GLASS IS MEDIA CHROME, NEVER A POPOVER.** `floating-layer.ts`'s refusal of a backdrop filter on a
  floating PANEL stands: a menu, a tooltip, a dialog and a sheet are opaque surfaces with a step and a
  ring (bible 15). Two tests fence it from both sides.
- **The section plate is the one place two numbers are local**, measured rather than chosen
  ([`photo-section.css`](../../src/components/shared/backdrop/photo-section.css)): a chapter-scale pane
  of reading copy over a full-bleed photograph needs 0.55 brightness through a 22 percent tint to clear
  4.5:1. It takes the material's blur, saturation and edges from the tokens; retune its two numbers by
  MEASURING, never by matching.
- **A phone pays nothing for the ground**: a backdrop filter is GPU work, and the lightbox's swipe holds
  16.7ms frames at p50 and p95 blurred or flat, even at twice the radius under a 6x CPU throttle
  (headless Chrome at 375). `ui/dialog.tsx` drops its overlay under a full-screen takeover for another
  reason: an opaque surface has nothing to show through it.

### The album tile: marks, and the desk's one pane

**A tile shows STATE, not controls:** exactly three marks (an active like, a video's play mark, a subtle
like count), and on a phone that is the whole tile. Every action and control (like, download and the
rest) lives in the lightbox, because icons on every tile crowd a phone immediately.

- **ONE tile for every album grid**: [`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)
  serves the guest album (`GuestMasonry` is a thin wrapper over it), the host's moderation gallery, the
  recovery bin and the two personal feeds. The admin's `ModerationTile` stays its own: a report is not
  an album.
- **The desk keeps its hover row, because the state-only rule is a MOBILE rule**, and the row is ONE
  PANE (one `.glass` bar) rather than three discs. The set is the per-surface `tileActions` prop (guest:
  like, save; host: like, save, hide/show; the bin: restore, delete forever; the personal feeds: none),
  and `[data-reveal-chip]` rides the BAR, so one width opens instead of three chips sliding.
- ★ **A CSS-columns album re-flows every column when a photograph lands.** A browser re-flows every
  column of a `columns-*` box on an insert, so items are distributed to real column elements, OLDEST
  FIRST INTO THE SHORTEST, walking the array BACKWARDS: a newly prepended photograph is the last one
  placed, every tile already on screen keeps its column, and the arrival grows one column while nothing
  else moves. Pure (`distributeColumns`), so strict mode's double render and a poll's reconcile agree.
  `GALLERY_COLUMNS` stays a class string: it is the lab's, marketing's and the skeleton's own box, and
  it is this grid's pre-measure paint (the column COUNT needs a width the server does not have, so the
  first paint is the CSS-columns box and a layout effect takes over).
- **The open item is an ID, never a position.** `items` mutates under an open lightbox (a doorbell
  prepends, an upload prepends, a removal drops one) and a stored index silently starts pointing at a
  different photograph.

## Motion

Motion runs on three custom curves, stays under 300ms in UI, and exits faster than it enters. The curves
are in `@theme`: `--ease-emphasis` `cubic-bezier(0.23,1,0.32,1)` (entrances/UI), `--ease-in-out-strong`
`cubic-bezier(0.77,0,0.175,1)` (moves/toggles), `--ease-drawer` `cubic-bezier(0.32,0.72,0,1)` (sheets).
**Exits faster than enters** (`data-closed:duration-*` composes with tw-animate via `--tw-duration`);
press feedback = `active:scale-[0.97]` on buttons; explicit transition properties, never
`transition-all` on primitives. Panel timings are the floating-layer contract's three clocks (below);
the **marketing nav runs 200/130 with a 100ms hover intent** on its own knobs (`--mkt-dropdown-*` /
`--mkt-nav-*`, [marketing-content.md](marketing-content.md)).

**A BACKGROUND WASH IS A CROSSFADE, NOT AN ENTRANCE.** On `--ease-emphasis` a full-width glass layer
snaps, whatever the duration: that curve delivers ~90% of the change in the first third, so a 200ms wash
lands in ~60ms and then creeps. Large ambient surfaces take the symmetric S (`--ease-in-out-strong`),
asymmetric by riding the OPEN state (enter 300ms, exit 220ms): the overlay header and any full-bleed
hero adopting the transparent-until-scrolled header.

### The floating-layer contract

**Bible 15: one radius, one entrance, one light, as a MODULE rather than a sentence.**
[`floating-layer.ts`](../../src/components/ui/floating-layer.ts) exports what every panel wears and
[`floating-layer.test.ts`](../../src/components/ui/floating-layer.test.ts) refuses a primitive that
answers any of it locally: a rule spelled out in nine className strings is a rule the tenth panel never
hears about.

- **The corner**: a 12px panel around 8px rows. `floatingCorner` is `rounded-float`; `floatingRow` is
  `calc(var(--radius-float) - 4px)`, DERIVED from the panel's own 4px padding (bible 9's inner = outer
  minus the gap), so moving a panel's padding moves its rows' corner.
- **The entrance**: one LANGUAGE per kind, the clock inside it chosen by frequency (bible 15 and bible
  12 agree that way). `floatingEntrance` is the anchored one (a fade, a hair of scale, 8px of travel
  from the anchored side, on `--ease-emphasis`); `floatingEdgeEntrance` is the sheet's (the same fade,
  no scale, a long slide from its own side, on `--ease-drawer`). `floatingClock` has three rungs and no
  more: **instant** 90/70 (tooltip, dropdown, submenu, select: opened dozens of times an hour; the root
  `TooltipProvider` opens a tooltip with no delay, and `skipDelayDuration` 300 keeps its siblings
  instant), **standard** 200/150 (popover, dialog; the marketing nav's panel keeps its own
  `--mkt-dropdown-*` knobs at 200/130), **edge** 300/200 (the sheet, where the distance is the
  affordance). Every exit is faster than its entrance and nothing exceeds bible 12's 300ms.
- **The light**: `shadow-layer` in BOTH modes, owned by the elevation contract and never re-stated here.
- **No translucency**: the policy refuses a `backdrop-filter` on any panel, because a panel is opaque
  and glass is media chrome only. A scrim's blur is not a panel's material and is untouched.
- **Outside the family, by name**: `drawer.tsx` (vaul owns its drag physics; its entrance is a gesture,
  not a curve) and `sonner.tsx` (a third-party surface themed through CSS variables; it reads
  `--radius-float`, and the rule in `globals.css` outweighs its own shadow and re-states its focus
  ring).

**A menu's anatomy lives in [`dropdown-menu.tsx`](../../src/components/ui/dropdown-menu.tsx) as PARTS a
call site may leave out, never as a shape baked into the panel:** `DropdownMenuHeader` (the title row,
what the menu belongs to), `DropdownMenuGroup` + `DropdownMenuLabel` (a quiet label, sentence case at 70
percent of the foreground), the icon rail on the item itself (a call site never colours a leading
glyph), `DropdownMenuMeta` (the trailing column: the state you opened the menu to read) and
`DropdownMenuFooter` (a ground of its own for the action you cannot undo). A two-row overflow menu wears
only the material, the corner, the entrance and the rail.

★ **An unportalled submenu can open with a real box and paint nothing.** `SubContent` must sit in a
`Portal`: inside `Content`, which carries `overflow-y-auto` AND animates with a transform, the
transformed ancestor becomes the containing block for its `fixed` descendants, so a submenu opened by a
CLICK (the parent mid-closing-animation) has a measured box and rows and paints nothing, and a scrolled
parent clips it the same way. Hover on a settled parent works, which is how the failure hides. **A menu
stops at two levels**, structurally: each `Sub` publishes its depth and a third one throws at render.

Three reusable patterns serve the layer: the **`data-swap`-gated box morph** (arm a size transition only
when there is a previous size to morph FROM, or a measured-late 0×0 first frame animates as a wipe), the
**glass LAYER** (`backdrop-filter` on an inert `-z-10` sibling whose `opacity` animates, never a
class-toggled filter on the bar itself, which snaps and drags every descendant's repaint into a blurred
region; a glass surface that never FADES puts the filter on itself, as every `.glass` pane does), and
the **measured indicator** (JS writes `offsetLeft`/`offsetWidth`, CSS owns the tween; the first
placement MUST suspend the transition and force a reflow or it flies in from x=0). Hover is the one
place enters may be SLOWER than exits: a skimmed row needs its in inside ~90ms and can take ~180ms to
fade back out.

### Skeletons, tiles and the reveal chips

Skeletons shimmer via a background-position sweep (`--animate-shimmer`, linear on purpose: a strong
curve stutters at the loop point). **`MediaTile` (every gallery tile) renders the shimmer skeleton under
the photo until it decodes, then fades the photo in over it**, so a cold presigned-R2 load never pops in
as a black square; reduced motion drops to a static muted block. Approving in Review also preloads the
just-approved photos while the exit and the all-caught-up beat play (`use-review-triage.ts`), so the
album paints them from cache (see [host-app.md](host-app.md)). A tile's action row wears the
**`[data-reveal-chip]`** hook (globals.css) on the BAR, not on each glyph: the pane collapses its width
at rest and opens to one width on tile hover, sized by `--reveal-max` from the surface's own verb count
(reduced-motion = opacity-only). **GOTCHA:** the hook is `!important` because it lives in `@layer base`
while the chips' own Tailwind `transition`/`ml-1` sit in the higher `utilities` layer (no slide,
residual gaps otherwise); and it expands on `:hover` / `:focus-visible` / `:has(:focus-visible)`, NOT
`:focus-within`, so a mouse click doesn't leave a chip stuck open after the cursor leaves.

**THE ARRIVAL-DEFAULT CONTRACT (bible 13): the VISIBLE state is the default; the hidden state belongs to
the trigger, never to the element at rest.** A plate animating from `opacity: 0` gated on
`[data-inview]` stays invisible wherever no `Reveal` wraps it, and an observer-gated hairline is an
invisible divider on every path that fails to trip. So a cover plate paints a static muted base and only
the PHOTO develops over it, and arrival hooks that must not depend on scroll (`[data-mkt-develop]`,
`[data-mkt-rule]`, `[data-mkt-entering]`, marketing.css) fire on **`@starting-style`**, never an
observer: the failure mode becomes "no animation", never "no content". Use the observer grammar
(`[data-mkt-reveal]` + `Reveal`) when the beat is genuinely about scroll position, `@starting-style`
when it is about arrival. The base-and-band landmine under Light is the same contract in the glow
engine.

★ **A FILLING ANIMATION OUTRANKS EVERY AUTHOR DECLARATION, so an entrance and a hover state can never
share an element.** `[data-mkt-cut]` (and any `animation-fill-mode: both` entrance) keeps applying its
final keyframe forever, and the animation origin beats author-normal in the cascade, so a later rule
setting the same property is inert: the selector matches, DevTools shows the rule, and nothing moves (a
cut pinning `opacity: 1` so a light-table dim never applies). Put the entrance on an inner layer and the
interactive state on the outer one.

★ **`:has(:focus-visible)` matches in `element.matches()` but does not repaint.** Chromium invalidates a
`:has()` ancestor on `:hover` changes but not reliably on focus-visible changes, so a
`:has(:focus-visible)` isolate is live, matching, and dead. Use `:focus-within`, which propagates
natively. Its objection (a mouse click pins the state on) is contextual: on the press sheet's light
table a clicked frame staying picked is wanted, on `[data-reveal-chip]` it is not.

★ **A sticky grid item without `self-start` never sticks.** `position: sticky` on a grid item is a
silent no-op: the item stretches to its row's height, so it already spans the whole scroll range.
`PressSection`'s pinned column is the worked example (`lg:sticky lg:top-… lg:self-start`), its offset
riding `--mkt-header-h` rather than a hardcoded rem so a retuned header cannot strand it under the bar.

**Reduced motion:** a global guard in globals.css clamps animation/transition durations to `0.01ms`
(NEVER `0`: radix exit-unmount and the lightbox settle wait on `transitionend`/`animationend`) and stops
infinite loops. Component-level `motion-reduce:`/`no-preference` gates stay the first line.

## Icon + small-type rules

Icons paired with text render muted (`text-muted-foreground`/reduced opacity) unless they ARE the
action. Small labels get positive tracking; letter-spacing/line-height run inverse to size.

## Error taxonomy (the UX contract)

Every failure code lives in one union, `ErrorCode` in `src/lib/errors/`, and every per-file result union
stays narrow and MUST fit inside it. `codes.test.ts` enforces that at compile time: a route code added
without taxonomy copy fails the build. Failure arms are `{ ok: false, code, message? }`; clients surface
via `showActionError`/`showErrorToast` (producer message > `FALLBACK_MESSAGES[code]` > generic default).
Copy rules: plain language, no em-dashes (bible 19), no internals; the wording itself is open like every
other line on the site (bible 21), so a round that improves an error message is doing its job.

**Boundaries:** every route group has an `error.tsx` → the shared `RouteError`, tagged
`render:app|guest|marketing|admin|auth` in Sentry. It draws `NotFoundScreen` with a per-area help line
and the `digest` as the support handle (`error-digest.tsx`, a Copy with a receipt), and it NEVER renders
`error.message`: that is the security invariant. The ROOT `src/app/error.tsx` catches a crash inside a
group's OWN layout, which no group boundary can, and tags `render:global` like `global-error.tsx`, which
is dependency-free (own html/body, inline styles, a plain `<a href="/">` home and the code) for
root-layout death. `captureError` lives in the crash wrappers only, never in `NotFoundScreen`, where it
would file every real 404 (`failure-grammar.test.tsx` scans for it). The gated `/design/lab/tools/boom`
probe throws on purpose to verify the chain against the real prod build (dev shows the overlay); it
lands on the root boundary, so `global-error` has no probe. `notFound()` is never caught by these.

**The ROOT 404 (`app/not-found.tsx`, every unmatched URL) stands on the image trail:** the marketing
block on its forced paper ground, photographs laid down behind the words by a `<Trail>` from
[`shared/trail`](../../src/components/shared/trail/trail.tsx) that walks its own figure until a cursor
takes over, and walks alone below 640px. Nothing is laid over a photograph (bible 1): the words punch a
feathered WINDOW in the trail, so the worst backdrop any line meets is the ruled floor and the muted
description keeps 4.9:1. The strip of tiles yields there and stays on the two group 404s, the 500 screen
and the help palette. The trail needs layout to solve a composition, so with scripting off a reader
gets the block, the actions and the links on clean paper and no photographs.

## The craft guidance stack

The craft stack and the skills live in [`docs/design/guidance.md`](../design/guidance.md), rendered at
`/design/library/guidance`, with the rest of the rule set around them (the levels, the law, the
policies). Guidance is a level of authority, so it lives in the design rule set rather than in this doc.
It is the default an agent leaves only on purpose, and a departure is flagged on the board or in the
manifest rather than argued for in advance.

## Stagger (the gallery entrance)

The guest album's tiles stagger in on the seed render only, 45ms apart and capped at 540ms. The
`[data-media-tile]` `@starting-style` entrance carries a per-index delay,
`transition-delay: min(calc(var(--tile-i, 0) * 45ms), 540ms)`; `masonry.tsx` (with `stagger`, which the
guest album passes and the host's grids do not) sets `--tile-i` from a render-once `Set` of the seed
ids, so doorbell/poll-arrived tiles carry `--tile-i: 0` and land immediately. The cap stops deep
galleries from queuing forever; reduced-motion drops the move.

## Event-feed + review motion + the live motion tuner

The host event feed ([host-app.md](host-app.md)) is the densest motion cluster, and all of it is
CSS-first, reduced-motion-safe and var-tunable. The motion-defining picks:
- **Condense:** the sticky pill bar gains `data-stuck` once the feed scrolls past its top sentinel (a
  hairline + backdrop), and the pills shrink (`h-8`→`h-7`, smaller text) on a
  `transition-[transform,height,padding,font-size]`.
- **Fade** (`[data-section-swap]`): the feed container is re-keyed on a pill change (and the floating
  bar's content on the active section), so `@starting-style` fires a crossfade + rise
  (`--tune-section-swap-ms`, no blur); reduced-motion = fade.
- **FLIP** (`useFlip`, [`use-flip.ts`](../../src/lib/shared/use-flip.ts)): when the urgency order flips
  (the review queue clears), the sections slide to their new positions (`--tune-reorder-ms`,
  `--ease-in-out-strong`); reduced motion = instant. Hand-rolled: the project ships no `motion`
  (framer-motion) and no drag library. It inverts BOTH axes, so a filtered multi-column grid reorganizes
  correctly (`dx` is 0 for a full-width stack), and `runFlip` is the one copy of the arithmetic
  (`use-sortable-grid.ts` calls it). It PRUNES prev rects for unmounted keys each pass, or a node that
  leaves a filtered set flies back in from where it sat under another filter; the prune cannot live in
  the ref cleanup, because `register(key)` returns a fresh closure per render and React detaches every
  node on every render.
- **The two-beat set change: removal and reflow are never the same beat.** Departing items leave
  TOGETHER (`transition-delay: 0`) on a short clock, and only then does the set commit and the FLIP
  reorganize the survivors, with entrants fading in on a delay; animating both at once makes a filter
  read cheap, because the eye cannot separate what left from what moved. The exit and the FLIP sit on
  SEPARATE elements (exit on the item, FLIP on its wrapper) or the FLIP's inline `transition: transform`
  clobbers the exit's. Hooks: `[data-mkt-exiting]` / `[data-mkt-entering]` + `--mkt-blog-*`
  (marketing.css).
- `[data-review-tile][data-exiting]`: the bulk-action REMOVAL EXIT (opacity→0 / `scale(0.9)`,
  `--tune-review-exit-ms`, `transition-delay:0` so the acted set leaves TOGETHER). The inline review
  opts OUT of the `[data-review-tile]` open cascade (no entrance theater on an always-present surface;
  the hook stays for the tuner's replay).
- `[data-unlock-success]`: the ALL-CAUGHT-UP beat; `useReviewTriage`'s `run()` holds it
  `--tune-review-beat-ms` IN PLACE, then `caughtUp` clears → the urgency order recomputes → the FLIP
  relocates the now-empty Review section to the bottom.
- `[data-check-pop]`: the selection-checkmark scale-in (review tiles + QR presets);
  `[data-preset-arrive]`: the QR-preset cascade (a KEYFRAME, NOT a transition, so the swatch's
  `transition-colors` hover survives).

★ **`parseInt` on a CSS time var collapses a 2500ms beat to ~2ms.** The build minifier (Lightning CSS,
via Tailwind v4) canonicalizes `<time>` to its shortest form, so `2500ms` ships as `2.5s` and
`parseInt("2.5s")` is `2`. JS-timed motion reads vars with `readCssMs`
([`read-css-ms.ts`](../../src/lib/shared/read-css-ms.ts)); `parseCssMs` handles `s`/`ms`/bare
(unit-tested).

**The baked motion values** (globals.css `:root`): `--tune-route-fade-ms` 310 / `--tune-route-fade-ease`
ease-out, `--tune-section-swap-ms` 180, `--tune-reorder-ms` 500, `--tune-review-beat-ms` 2500, and the
REEL REVEAL grammar's `--tune-rvl-*` / `--tune-rxp-*` set. The reveal's beats and the feed's swap and
reorder are ratified and off the tuner panel; a retune moves the CSS default, the CSS fallback and any
JS fallback (`src/components/reel/reveal-constants.ts`) together.

**The contextual floating action bar**
([`event-feed-action-bar.tsx`](../../src/components/app/event-feed/event-feed-action-bar.tsx)) is one
fixed-bottom surface that follows a scroll-spy (`useActiveSection`) and MORPHS its action to the section
in view through the same `[data-section-swap]` crossfade (the Add pill / a card holding the review
cluster / a disabled placeholder). Reuse it wherever a long scroll needs a section-aware action in
reach.

**Multi-select primitives** (Review triage and the Gallery album bulk-select). `useSelection(ids)`
([`event-feed/use-selection.ts`](../../src/components/app/event-feed/use-selection.ts)) is the pure
state machine; it PRUNES the selection to the surviving ids when the universe changes and never resets,
so a background poll can't wipe an in-progress multi-select. `SelectableMediaGrid`
([`event-feed/selectable-media-grid.tsx`](../../src/components/app/event-feed/selectable-media-grid.tsx))
is the shared selectable grid (`[data-check-pop]` + the `[data-exiting]` beat; `enablePreview` for
Review's peek; `clampAspect` MUST match the surface's normal grid or toggling select reflows tile
heights). The selection STATE lives in a thin provider (`HostSelectionProvider`, like `HostAddProvider`)
so a grid and a scroll-following bar share it: the grid REGISTERS its optimistic bulk handlers and the
bar calls `run(kind)`, the seam to use whenever a control surface and its target grid live in different
subtrees. Long-press entry rides `use-long-press.ts` (opt-in `onTileLongPress`, a capture-phase
click-suppress).

**Grid layout + the sortable primitive.** The shared grids take `layout: "masonry" | "uniform"` (default
masonry): **masonry** = natural ratios in explicit columns (`MasonryColumns`); **uniform** = a fixed
`UNIFORM_TILE_ASPECT` (`4 / 5`) `object-cover` grid (`GALLERY_UNIFORM_COLUMNS`) for the Reel and Review,
where uniform tiles make drag order and selection targets legible. Drag-reorder is
[`useSortableGrid`](../../src/lib/shared/use-sortable-grid.ts), a hand-rolled pointer machine +
`runFlip` for the sibling slide: on a uniform grid the drop index is two integer divisions
(`pointToIndex`, unit-tested), so a drag library buys nothing. Touch grabs behind a 450ms press (a
scroll never reorders); `touch-none` in the reorder mode and edge autoscroll reach off-screen tiles;
keyboard reorder (space / arrows / enter / escape) comes free with the index math.

**The motion tuner** ([`motion-tuner.tsx`](../../src/components/dev/motion-tuner.tsx) +
`motion-tuner-config.ts` + `tuner-store.ts`) writes CSS vars as inline styles on the element that
declares them (`<html>` for the app's `--tune-*` and the radius tokens, where an inline style outranks
`:root`; the `[data-mkt]` wrapper for `--mkt-*`), so any var-backed timing or radius is tuned LIVE. The
working set persists to `localStorage` and survives a Replay, a navigation and a reload; Reset clears
it. Every knob carries a `description`, a `ships` line and a `group`, and a specimen where the tuner
mounts (the playground at
[`/design/lab/tools/motion`](../../src/app/(dev)/design/(shell)/lab/tools/motion/page.tsx), the real
cinema pages, the Library's radius section); a knob without one is retired from the panel, its var and
bake untouched. Contract: a new knob lands with all three fields and a specimen in the same commit, its
config `default` MIRRORS the CSS default, and a JS-read var (`run()`'s `readCssMs`) falls back to a
constant that ALSO mirrors it. To bake: Copy CSS → set it as the default → Reset.

**The candidate block:** a lab board can hand the whole site one CSS paste (the block its ruling would
land) through `setCandidateCss(label, css)` / `clearCandidate()` in `tuner-store.ts`; `CandidateStyle`
renders it as a `<style>` after every stylesheet wherever a key-gated island mounts (the lab layout, the
cinema and paper islands, the host app's `AppDesignIsland`), so a candidate is judged on the real pages
with `?key=`. One labelled block at a time, persisted until cleared; real selectors only
(`:root, .surface-paper`, `.dark`, `.surface-ink`, a primitive's class), never a production path.

**The toast system:** one `Toaster` (`ui/sonner.tsx`), mounted once in `layout.tsx` above every surface.
**Where:** `position="top-center"` everywhere, clear of every fixed-bottom control (the guest's floating
Add pill and the lightbox credit line, the host's action bar); the top `offset`/`mobileOffset` of 5rem
clears the tallest bar, the marketing header (`--mkt-header-h`, 4rem), plus a breath. It cannot read
`--mkt-header-h`: that var is scoped to `[data-mkt]`, and the Toaster mounts as that scope's SIBLING.
**Stack:** `expand` always on, newest on top, because sonner's collapsed pile needs a hover a phone does
not have; `visibleToasts` stays sonner's three. **Life:** success and warning keep sonner's 4s (or a
call site's override, e.g. `guest-reel-overlay.tsx`'s 8000ms); an error waits for a press, because a
failure that disappears before it is read repeats itself. ★ Sonner has no per-type default duration
(`duration` and `toastOptions.duration` are one flat number for every kind), so `ui/sonner.tsx` patches
sonner's own `toast.error` once at module load to force `duration: Infinity` and `closeButton: true`,
guarded by a `Symbol.for` flag on `toast` against Fast Refresh re-wrapping it; a call site's own
`duration`/`closeButton` still wins. **Action:** every toast reserves the same trailing slot through
sonner's `action`/`cancel` (Undo, Retry or a named door, nothing when unfilled), so a card's width never
depends on the slot and there is no toast helper of our own.

**State-colored toasts:** sonner's `data-type` maps to the state colors (`success` = `--success` green,
`warning` = `--warning` amber, `error` = `--destructive` red; plain/info keep the neutral `--normal-*`).
Approve/positive = `toast.success`, HIDE/soft-caution = `toast.warning`, failures = `toast.error`. The
CSS (globals.css) targets sonner's OWN `[data-sonner-toast][data-type="…"]` with **`!important`**, never
the `cn-toast` class, because sonner injects a neutral `--normal-bg` rule at runtime that beats a class
rule on layer/order; verify the toast's computed `backgroundColor`, not that the rule loaded. **Red is
for FAILURE, full stop:** a destructive action that SUCCEEDED ("Permanently deleted.", "Event deleted",
"Removed from saved.") is `toast.success` (green), and `toast.error` (red) is strictly for things that
went wrong; there is no separate destructive-confirmation variant.

## The arrival choreography ("Calm + 700ms")

The guest arrival is the one sanctioned exception to the under-300ms rule, because it is a rare,
first-time moment. The entry sheet ENTERS on vaul's native 500ms iOS drawer curve after a 700ms arrival
beat; everything repeated stays fast (exit 250ms, steps 220ms, height glide 300ms). The choreography
attributes (all `@starting-style`, reduced-motion = fades): `data-arrive`/`--arrive-i` (the locked page
settles), `[data-entry-step][data-dir]` (directional step handoffs) + `[data-entry-exit]` (the
inverted-@starting-style exit clone), `data-unlock-success` (the gate button's green morph content),
`data-reveal`/`--reveal-i` (the unlock reveal: 150ms + 50ms steps) held back by `[data-reveal-curtain]`
until the success beat releases. Constants live in `use-arrival-beat.ts` (700/350/0) +
`use-success-hold.ts` (900ms beat / 1.5s slow / 8s watchdog).

**★ The vaul motion gotcha:** with no `snapPoints`, vaul's open/close runs on KEYFRAME ANIMATIONS from
its injected stylesheet (`slideToBottom`/`fadeOut`, 0.5s), so `transition-duration` overrides do NOTHING
there; the exits-faster rule must override `animation-duration` (`!important`, scoped to
`data-state="closed"`). The drawer's TRANSITION only drives drag-release snap-back (under
`data-state="open"`), so never touch it.

**Two adjacent craft rules:** any full-width `inset-x-0` overlay floating above a GESTURE track needs
`pointer-events-none` on the box + `pointer-events-auto` on just its controls (`items-center` centers
children but the BOX stays edge-to-edge and eats pointerdown across its flanks, which kills swipe-nav on
every shared-viewer surface at once). And the repo's react-hooks lint bans setState-in-effect sync
resets, so use the adjust-state-during-render pattern (prev-state comparison) for transient view resets.

## The component index and the gallery

Every Library component is declared once, in its family's gallery module, and three surfaces render from
that one declaration. The module is `src/app/(dev)/design/(shell)/library/<family>/gallery-demos.tsx`
(its id, its section, its variants, its specimens, and the id of a config panel where it has one), and
the surfaces are its family page, its permalink at `/design/library/<id>`, and the searchable index of
all of them at `/design/library`. The declaration carries only what code cannot derive: the file, the
exported names, the specimen routes and the contracts come off `rules.generated.json`
([`scripts/design-rules/collect.mjs`](../../scripts/design-rules/collect.mjs)), and the `for` line plus
any no-specimen reason come off
[`component-notes.ts`](../../src/app/(dev)/design/rules/component-notes.ts), joined in
`gallery/registry.ts`. A component outside the six indexed directories (the product components under
`src/components/app`) declares its own `file` and joins on that.

★ **A demo module in the wrong folder indexes its components at a route that does not exist, and nothing
says so.** A family is the page that MOUNTS the specimen: the collector reads a component's specimen
route from the directory of the `page.tsx` or `*-demos.tsx` file that imports it, so an entry module
must live in that page's directory. It also means `family` is not always the component's own directory,
and should not be made to be: Glow lives in `src/components/shared` and belongs beside the light tokens
on `/design/library/foundations`.

Two guards keep it honest. `component-index.test.ts` fails when a library component has neither a
specimen nor a recorded reason. `gallery/gallery.test.ts` fails when a component has no gallery entry or
no `for` line, when a config panel is unreachable or shared, and, the one that earns its keep, when a
DECLARED variant is not a variant the component has: a `cva` axis is compared key for key against the
component's own `variants` block and its `defaultVariants`, and a `prop` or `declared` axis must at
least name values the source contains. A declared axis that has silently fallen behind the component (a
Badge or Button declaring fewer variants or sizes than it has) is exactly what it catches.

## Where it lives

The tokens, utilities and guards have one source, `src/app/globals.css`, and every other part of the
system has one home, listed here. `src/app/theme.css` (the `@theme` block and the `dark` variant, shared
with the lab's own Tailwind entry; the `--glass-*` block and the glass utilities stay in globals.css,
because a Tailwind `@utility` compiles only in the entry sheet) · `src/lib/glass.ts` (the material's
NAMES, held to that block by `glass.test.ts`) · `src/app/layout.tsx` (font loading) ·
`src/components/ui/*` (the crafted primitives) · `src/lib/errors/` (taxonomy) ·
`src/components/vendor/*` (third-party packages copied in verbatim) ·
`src/components/shared/route-error.tsx` + the route-group `error.tsx` files · `src/app/(dev)/design/`
(the lab, two areas on one shell: `(shell)/library/` is everything that binds or informs (the bible at
`/design/library/rules`, `rules/bible.ts` hand-authored; the policies and landmines; the guidance; the
doctrine, the system docs rendered; the glossary; the index and every component's permalink plus the
five family galleries, each declared once in its family's `gallery-demos.tsx`) and `(shell)/lab/` is
everything exploratory (the desk, `/design/lab/<board>`, proposals from `docs/specs/`, tracks from
`docs/tracks/`, the kit, the tools); `(shell)/_shell/` the chrome and the page templates; `_data/` the
nav model, the link grammar (`links.ts`), the markdown reader (`docs.ts`), the legacy redirects; the
component contracts (every test tagged `@contract-for`, collected by `pnpm design:rules` into
`rules/rules.generated.json`, `rules-registry.test.ts` pinning it fresh); `touchpoints.ts` the rulings
registry and the desk's order; `sandbox/` the standing boards, each with its own sheet and any scenes
its frames portal; `src/components/lab/board-spec.ts` the board spec type; the authority model in
[`../design/README.md`](../design/README.md); `pnpm lab:smoke` crawls every lab route) ·
`src/lib/design-gate/*` + `/api/design-gate` (the gate, outside the lab because production depends on
it). The perf baseline and its repeatable method are in git:
`git show 44090827:docs/perf/v1-baseline.md`.

## Gotchas / don't-revert

- ★ **A bare `<code>` element renders in a mono stack with no class at all.** So do `<pre>`, `<kbd>` and
  `<samp>`: Tailwind's preflight sets `font-family: var(--default-mono-font-family, ui-monospace, …)` on
  those four elements, which no `font-mono` grep will ever find. Give any of them `font-sans` (the `Kbd`
  atom is the model), and a prose container `prose-code:font-sans`, which on the two long-form wrappers
  covers every inline code span in `content/help` and `content/blog`.
- The lab renders on the REAL tokens, never a copy of them. `design.css` keeps the shell's grid (the
  sidebar and TOC rails under `--lab-topbar-h`, `[data-lab-wide]` pages), the boards' hooks
  (`[data-dir-display|card|press|enter|stagger]`) and the shared motion, and declares NO keyframes:
  keyframe names are document-global, so a lab keyframe would shadow the production name of the same
  spelling on every `/design` visit (`src/app/keyframe-uniqueness.test.ts` holds the count at zero). A
  board's own CSS lives beside the board under `sandbox/`, imported by it, so it leaves with it.
- The behavior pins (`*.test.tsx`, the component vitest project) freeze MediaLightbox / GuestUpload /
  LikesProvider behavior and never styles, so token/craft changes don't touch them. jsdom can't run the
  lightbox pause-on-navigate effect (portal/commit timing); that one pin is dropped on purpose, so cover
  it in live device passes.
- ★ **A page-level gate cannot close the lab, because the shell layout has already rendered the nav.**
  The shell layout builds the nav (every component, board, proposal and track by name) and a layout
  cannot read `searchParams`, so a page-level `notFound()` comes too late: a keyless request would
  answer 200 with the layout's props in the flight payload. So the gate runs in the proxy:
  `src/proxy.ts` runs `designGateOpen` on every `/design` request (a refused one is rewritten to a path
  no route serves, a real 404) and forwards the key as the `x-design-key` header the shell layout reads;
  the pages still call `requireDesignKey`. Never wrap the shell layout's page in a Suspense boundary (a
  page's `notFound()` would answer 200) and never read the key in the shell with `useSearchParams` (it
  needs that boundary). `pnpm lab:smoke --production` proves it.
- ★ **The lab compiles nothing if it references `globals.css`.** Two Tailwind entries, one theme, two
  scans: `globals.css` excludes the lab and `docs/` from its scan (`@source not`), and the lab compiles
  its own utilities from the entry at the top of `design.css`, which `@reference`s `theme.css`;
  `@reference "globals.css"` would drag the exclusion along. Never move a token VALUE into `theme.css`:
  it holds only the variant and the `@theme` mapping. Pinned by `src/app/css-source-policy.test.ts`.
- `vitest.setup.ts` mocks sonner globally; `vi.unmock("sonner")` is the per-file escape hatch.
- shadcn `src/components/ui/*` files are semicolon-free (generator style); app code uses semicolons.
  Don't reformat either direction.
- **The lab and production are BOTH provisional, and the arrow points both ways.** A specimen is often
  an early prototype of FUTURE UI, and a shipped surface is sometimes a minimal stand-in not yet
  designed, so **a minimal production surface is not evidence against a specimen.** A proposal that does
  not fit its surface has three answers, and collapsing the middle one into "reject" is the easy
  mistake: (1) the PLACEMENT is wrong, so re-assign it to what the surface's own properties call for;
  (2) the SURFACE is provisional and will grow into it, so park the placement and design the two
  together in that surface's round; (3) the SURFACE should change on its own merits, argued from what
  the surface should be and NEVER from what the effect needs. Which applies is usually roadmap
  knowledge, so ask rather than infer, and record the answer beside the placement.
- **`src/components/vendor/*` is third-party source copied in verbatim, and is NOT ours to restyle.**
  Prettier (`.prettierignore`) and the em-dash policy (its `SKIP` regex, because an em-dash in a CSS
  comment inside a CSS-in-JS template literal never reaches a user) look away entirely, and eslint turns
  off exactly two rules there (`react-hooks/set-state-in-effect` and
  `@typescript-eslint/no-unused-vars`, both of which BorderBeam genuinely trips), so the usual gate
  would not catch a restyle.
  [`border-beam-vendor.test.ts`](../../src/components/dev/border-beam-vendor.test.ts) pins what is left:
  the licence notice in every file, an EXACT count of marked deviations (a floor such as `>= 2` against
  an actual 11 can never fail), and the palette's parity with the lamp set. Two
  `react-hooks/set-state-in-effect` sites inside `BorderBeam.tsx` are known, accepted and NOT
  gate-verified. Compose ON a vendored package from your own file, never edit it in place, and mark any
  unavoidable deviation `PARTYREEL:`. The one vendored package is border-beam v1.4.0 (MIT), vendored
  because a hand-port substitutes our low-chroma five into a palette tuned at the sRGB gamut edge and
  then compensates with filters.
- ★ **Two mask layers on one element never intersect in Chrome.** With `mask-image: a, b`,
  `mask-composite: intersect` composites the last layer against transparent black, so the pair resolves
  to the union and a two-axis dissolve silently does nothing. Split the masks across two nested
  elements, one mask each.
- ★ **A Tailwind breakpoint prefix inside a board's `Stage` reads the REAL browser viewport, not the
  canvas.** `sm:` fires inside the 375 stage on a desktop window and never fires on a phone-width window
  showing the 1440 canvas, so a board silently reviews the wrong layout. A board's own markup keys off
  the `mode` prop; the real production components carry their own prefixes and are judged as they ship.
- ★ **In one shared `utilities` layer the lab's copy of a utility beats production's responsive one.**
  The lab sheet loads after `globals.css`, so its unprefixed `grid-cols-1` would beat a production
  section's `lg:grid-cols-12` on the same element and every real section a board mounts at 1440 would
  lay out as its phone version. So the lab's compiled utilities live in the `utilities.lab` sub-layer
  (`design.css`), which rules directly in `utilities` outrank: production wins on a shared element, and
  a board that must override a production class uses its own sheet or `cn()`. Pinned by
  `css-source-policy.test.ts`. The breakpoint ★ above still applies: a production section inside a 375
  stage lays out for the real window, so judge phone chrome in an iframe at 375.
