# Design system: tokens, light, type, motion, errors

Open this before you:
- change a colour or a theme set, or paint a subtree dark or light;
- add, move or retune light: a lamp, the Aurora, a beam, a glow;
- touch type, a corner, a shadow, the bright edge or glass;
- build motion, a floating panel (a menu, dialog, sheet or tooltip), a toast or an album tile;
- pace a marketing page's chapters;
- add an error path, an error boundary or a crash screen;
- work in the `/design` lab.

The Library at `/design/library` shows the brand kit (the live tokens), the component catalog and the bible's ten;
this doc holds how the system works underneath them and the ★ landmines that break silently. The theme sets' values,
the utilities, the glass tokens and the guards live in `src/app/globals.css`; the `@theme` block (the type steps, the
eases) and the `dark` variant in `src/app/theme.css`, which the lab's own Tailwind entry shares. The marketing site's
pages and content are [marketing-content.md](marketing-content.md)'s.

## The identity: achromatic, media is the color

The chrome is a cool grey with no brand hue (hue 286, at a chroma that reads as a temperature), so photographs carry
the colour and only state and actions are coloured.

- **Four grounds, four classes**: the page `:root, .surface-paper` (the card is the page's own white), the room
  `.dark` (one room for the app and every cinema chapter), the slab `.surface-ink` (an always-dark leaf on paper, such
  as the footer) and the mat `.surface-mat` (declared, worn nowhere yet). `--gallery*` is the media well, always dark in
  both themes.
- **Three text steps**: `--foreground`, `--muted-foreground` and `--faint`, each one grey on every ground where a
  hand-set alpha composites against whatever is behind it. `--faint` reads about 3.2:1 on the page: captions and hints
  only, never body copy, a control's only label, or under a further alpha.
- **The brand is the wordmark alone**: `src/lib/brand/wordmark.ts` holds the export's single SVG path, `Logo` inlines it
  in `currentColor` sized by height, the social card draws the same path, and every door mounts `<Logo />`. ★ Never
  retype or optimise the path: replace the whole string from the next export. The mark (`markOnly`) is a stand-in
  mounted nowhere until the v1 icon lands. `--brand` is an alias of `--primary` (ink).
- **One colour per action, everywhere**: like rose (`--like`), save and download blue (`--save`), hide and show amber,
  approve green, delete red, on guest and host surfaces alike. Violet (`--reel`) marks the highlight reel itself (its
  own calls to action, the style rail's active thumb), never a verb on a photograph: the live reel plays every approved
  photo by itself, so no tile or bulk bar adds to it. An action icon is monochrome at rest, takes its colour as a stroke
  on direct hover and a `/25` fill while active; an icon beside text is muted unless it is the action.
- ★ **A `bg-gallery` on a dark leaf paints two registers too deep.** The well is the deepest ground (on OLED a
  photograph is the only light on it); a dark leaf on paper is the slab, which `.surface-ink` declares itself rather
  than deriving from `--gallery*` (derived, a footer sinks into the well and reads as a hole).
- ★ **Painting a subtree dark is only half the job.** `--ring`, `--border`, `--foreground`, `--muted-foreground` and
  `--brand` are not surfaces, so under `.surface-paper` they keep their light values: a focus ring near 1.15:1 on the
  slab, muted text at 2.69:1, a near-white `border-t`, all invisible while you work on a cinema page inside `.dark`. Wear
  `.surface-ink`, which carries every token a leaf reads: `--brand` redeclared directly (a `var()` in a custom property
  resolves where it is declared, so `:root`'s `var(--primary)` inherits as paper ink), both shadows on the dark ramp,
  and each pair whole (`--card` with `--card-foreground`, `--muted` with `--muted-foreground`, `--border` with
  `--input`). A shadow token that draws nothing is `0 0 0 0 oklch(0 0 0 / 0)`, never `none`: Tailwind composes it with
  the ring into one `box-shadow`, and a `none` in that list takes the ring with it.
- ★ **A hand-assembled dark set is for a LEAF, never a page's chrome**, because page chrome's set is always one token
  behind what a descendant reads next: the nav panels render in flow inside the header, so a header set that omits
  `--popover` paints every nav title white on white. A page that wants dark chrome joins the `(cinema)` group.
- ★ **A child straddling a chapter cut sets two traps** (a visual pulled across a cut by a negative margin, as on /help
  and /about): an `isolate` on the chapter traps the child's z-index, so the next section paints over the overhang (the
  footer carries `isolate`; a chapter never does), and without a block formatting context on its wrapper (`flow-root`)
  the negative margin collapses through and the next section's text lands on the child. The child wears
  `surface-paper` and `shadow-lift` itself.
- ★ **A chapter's stacked-viewport rule outranks its children's padding.** `PaperChapter`'s
  `max-lg:[&>section]:py-14` beats a section's own `pt-*` below `lg`; a section that must clear a big straddling
  element needs its chapter's `compressStacked={false}`. Never `!`: it wins at one breakpoint and loses at another.
- ★ **A theme alias is emitted only when the scanner sees it used.** A colour read by name from JS or SVG
  (`var(--color-chart-N)` from a template string) is never seen and resolves to nothing, so tokens read by name live in
  theme.css's `@theme static` block, which is emitted whole.

### The media-forward card

A tile whose picture IS the card (the event types, the feature doors, the closing rows) has two overlays with two
owners: the picture's own fade, which lifts on hover, and the card's copy gradient, `CARD_COPY_SCRIM` in
`feature-door.tsx`, which never lifts. A visual that wants to be quiet fades itself. ★ The scrim's alphas are read per
pixel off the real photographs: re-measure every door when one moves.

## Chapters: the attention arc

Marketing pages alternate cinema (dark) and paper chapters, and each chapter is an attention arc: it opens strong,
ramps down through sections that carry the information without shouting, and hands over to the next opener. That paces
the visual sections (a hero, the demo, the reel) against the dense ones (curation, privacy, the FAQ).

- **An opener is weightier and bespoke, and a page varies the device between chapters**: a heading a step up
  (`SectionShell scale="lg"`), the film-cut entrance (`reveal="cinema"`), more air, an object crossing the cut, a
  drawn rule (`[data-mkt-rule]`), a lit subject, a full-bleed frame. One device per cut; two are noise.
- **It applies to the core pages** (the home, the feature and event pages, how it works); the utility pages keep the
  utility-page rhythm ([marketing-content.md](marketing-content.md)), and a chapter that IS the page's body (an
  article, a form) has no arc.
- **A full-image section may cross a cut**, turning the page from dark to light through a photograph: sometimes, never
  at every cut.
- **A chapter never escalates**: it may close on an anchor only after ramping down, since a loud section right before a
  cut leaves the next opener nothing to open against.
- **Shape paces where the arc paces loudness**: neighbours may share a register, never a layout; three centred sections
  in a row is the paper chapter's failure.
- ★ **A full-bleed strip** (`w-screen -translate-x-1/2`) is safe only because the skin wrappers clip the x axis. The
  clip stays on the wrapper: on `body` it propagates to the viewport, which treats `clip` as visible, and the page
  scrolls sideways.

## Light: SPILL, BEAM, and the lamp set

Where there is no photograph, light carries the colour, as one of two kinds. **Spill** falls from a lit thing onto what
is near it; **beam** marks the object that is the live subject. Ink tends to take the beam, paper spill.

- **Spill** has a named source (an object, or the place it lights, as the footer's seam does), a direction, the colour
  of the lit thing (sampled media, or the lamp set where there is none; never a house or state colour, or the glow
  becomes a second palette) and a falloff that draws no edge, sits behind content and keeps an always-on base.
- **Beam** marks the live subject (uploading, publishing, live), one per view, and ends when the state ends. The Get
  Pro card, lit at rest, is the one exception.
- **Scarcity is a distance**: roughly a viewport of unlit page between lamps.
- **Light never goes** on nav panels (the most-used controls get no theater), near a cap or an upload error (it would
  read as a warning; failure is `--destructive`), on skeletons, on every `CtaBand`, in the admin, or on gallery
  arrivals (a batch would bury an album's top; arrivals wear `shared/arrival.css`).
- **A new lamp answers four questions first**: what emits (or what place is lit), from where, sampled from what, and
  what above admits it.
- **The lamp set is light, never UI**: five hues (coral 25, amber 85, green 155, blue 255, violet 305) in three
  registers, documented at their homes: ambient `--lamp-1..5` (globals.css, hand-tuned per hue), paper
  `SPILL_REGISTER.paper` (`sampled-palette.ts`), and live, the vendored border-beam's `partyreel` palette, derived from
  the five by `glow-contrast.ts`. The live one cannot be a `var()`: that file regex-parses `rgb()` strings. The ambient
  block stays out of `@theme`, so no `bg-lamp-*` or `text-lamp-*` utility can exist.
- ★ **Which sampler you pick decides whether guest media colours its light.** `useSampledPalette` (the URL form)
  decodes with `mode: "cors"` and `cache: "no-store"`, so it samples presigned R2 media: hand it `previewUrl`, never
  the original. `useSampledPaletteFromDom` reads the painted `<img>`s, and a presigned tile has no `crossOrigin`, so the
  canvas taints and the `.catch()` returns the fallback five, silently, and no lab specimen reproduces it (they sample
  same-origin images). The `no-store` is the cache trap in [uploads-and-r2.md](uploads-and-r2.md). For same-origin media
  already on the page the DOM form is right: zero requests, and it never forces a lazy tile to load.

### The glow engine

`[data-glw*]` in globals.css, kept unlayered; the primitives are `Glow` and `GlowFilter` (`shared/glow*.tsx`).

- ★ **Layer the engine and one caller's `blur-sm` deletes its turbulence**: the utilities layer would outrank it and
  replace `filter: url(#glw-warp) blur(...)` whole, silently. That is also why `Glow` takes no `className` (tune through
  `vars`).
- ★ **A band-only glow is invisible whenever it is paused**: the band rests off the layer, and rest is its state below
  the fold and under reduced motion. Base and band ship together (`[data-glw-base]` under `[data-glw-band]`).
- ★ **A band resting mid-travel shows a reduced-motion visitor the comet forever**: the animation lives under
  `no-preference`, so the declared position is what they see. It rests where its animation starts (`150% 0` on the
  mask drive, `glw-drift-x`'s from-keyframe on the transform drive), never `50% 0`.
- **`GlowFilter` mounts once, in the root layout** (the root `not-found.tsx` renders the footer outside `(marketing)`);
  SVG ids are document-global, so never a second. ★ **A missing filter host drops the whole filter chain**, `blur()`
  included, and the five ellipses render as hard blobs, silently; `Glow` has a dev-only console guard.
- **One clock**: lamps read `--spill-cadence`, never a literal; the Aurora's field reads `--aurora-cadence`, a slower
  sibling (a chapter-sized field on a lamp's clock reads as a screensaver). ★ The sibling stays declared in
  globals.css: an inline `vars` value outranks `--glw-dur`, so an undeclared cadence voids the `animation` shorthand and
  the band freezes over a lit base, which reads as a design choice.
- ★ **Two placement mistakes look like opacity problems**: a lamp goes after the scrims it lights through, never under
  them (four scrims leave an eighth of its strength), and the content wrapper needs an explicit `relative`, or the
  absolute `Glow` paints over the h1. Fix the stack, not the opacity.

### The shipped light

- **`ScreenLamp` is the one underlight**: a lit object throws its sampled light down off its bottom edge, as a sibling
  of the object, never inside a clipping frame, and its section is `overflow-x-clip`, never `overflow-hidden`, or the
  field below is cut off. A new underlight is a `<ScreenLamp>`, not another file.
- **A feature page lights its hero and the footer seam**, a second light only far below. Curation and privacy carry no
  lamp (restraint is their identity), nor does the doors band (a row of lit cards is decoration); a wall of photographs
  is a ground, not a source.
- **A seam's sides end with its box**: its ellipses keep 40 to 50 percent of their colour at the box's ends, so a
  strip's light goes full bleed and ends off screen, and a screen's light is exactly the screen's width under an
  elliptical mask anchored at its bottom centre. A linear side mask on a wider box draws a wedge ending on a straight
  line.
- ★ **A radial mask's reach is a fraction of the FULL field**: the transparent stop sits at 78 percent of it, so
  `--glw-reach: 78%` on a field the object's size fades outside the box and renders a rounded square. Size the field
  generously (`-inset-32` on the QR plate).
- **A lamp crossing a chapter cut is clipped at the cut**, on purpose: one lamp, one register.

### The Aurora, and its three forms

The Aurora is the coloured light as one family (code keeps the older names: `Glow`, SPILL, `--glw-*`, `--lamp-*`): the
**seam** where two grounds meet, the **throw** cast from a point on an object, the **field** lighting a chapter at its
edges, and two marks, the **bloom** (a one-time glow that rests lit) and the **halo** (an object lit from behind, never a
button).

- **The field is `SectionLight`** (`marketing/system/section-light.tsx`): two seams at the section's own boundaries,
  the bottom one the top one flipped (the engine grows no bottom shape; a vector is the caller's to turn), `placement`
  `both | top | bottom | room` (`room` takes a `from` origin on an edge). `middle` and `behind` are fenced, because the
  copy would sit in the light. One register (`AURORA_VARS`), on the transform drive, since a chapter-scale mask repaints
  every frame.
- ★ **The Aurora is composed for the place, never stamped**: register and clock are fixed, the geometry is the call
  site's with a comment saying why, so `SectionLight` has no default placement and a page never repeats a composition.
- ★ **A section with no boundary line of its own cannot take a band or a floor cast**: the box clips the falloff into a
  hard line. A side cast, vertically centred, with a reach under about 64 percent finishes inside the box.
- ★ **An Aurora on a light ground reads as an artifact, so a CSS fence switches it off**:
  `[data-section-light]:not(.dark *), .surface-paper [data-section-light] { display: none }`, both halves needed (a paper
  chapter sits inside a forced-dark wrapper; a cinema page in a light session has no `.dark` on `<html>`).
- ★ **A second copy of that fence is the one that drifts.** It is ONE rule listing lamp boxes (the share card's
  `[data-rxp-cardlight]` is on it; the Studio's twin, in a near-black room, is not), hooked on the light's own box, never
  the object, and never widened to `[data-glw]`, which would switch off the shipped seams. Nothing re-tunes the lamp set
  for paper, so a media-less lamp on paper would paint the dark register on white.

## Type: the heading face + the ladder

- **Two faces**: Inter to read, Urbanist (`--font-display`, weight 700) to be loud, through `font-heading`, an
  `@utility` in globals.css rather than a theme font token. There is no mono face.
- **The ladder is the `--text-*` steps in theme.css**, headings from `display` to `card-title`, then the body steps down
  to `micro` (10px, the floor). Each step's size, leading and tracking is a `clamp()` from 375 to 1440, so no heading
  takes an `sm:` size. Headings keep their ORDER at both ends (at 375 marketing steps sit closer together, so a section's
  weight comes from its entrance and air as much as its type), and body leading is `2 × size − 8`, on the 4px grid.
- **A role picks a step, never a size**: a heading no step fits is an undecided role, and a new step names a size the
  site already uses. `working` (14px) is the rung for any functional line. MDX articles size h2 and h3 on the prose
  wrappers, because the shared MDX components carry no sizes.
- **`copy` never sits inside a block titled at `card-title`**: `copy` reaches 18 at 1440 against `card-title`'s 16, so an
  FAQ answer would outrank its question; those blocks take `reading`.
- ★ **A step is a step only once `cn()` knows it**: tailwind-merge files an unknown `text-*` as a colour and drops it
  beside a real one (`cn("text-chapter text-white")` loses the step), so a new step joins `TYPE_STEPS` in
  `src/lib/utils.ts` in the same change; and no step takes a name the colour namespace owns (`--color-card` exists, so
  the step is `card-title`).
- ★ **A `tracking-*` or `leading-*` beside a step overrides it** through `--tw-tracking` and the line height, though a
  step beats `font-heading` (Tailwind emits a custom `@utility` ahead of sizes). `--tracking-tight` is `0em` so legacy
  uses are no-ops, and an uppercase label adds no tracking: the `label` step carries its 0.08em. An arbitrary
  `text-[15px]` has no leading and inherits preflight's 1.5.
- **Three things sit off the ladder on purpose**: type drawn inside a picture (a pictured phone, a printed sign, an
  emblem's glyph), which a viewport clamp would size by the wrong box; an Inter label inside a heading tag, kept for the
  outline (the feed's section header, the dashboard's section labels, the admin bands), never "fixed" onto a step; and
  `app/global-error.tsx`, which replaces the whole document, stylesheet included, so its h1 is sized inline.
- **Weight rides on the step**: `PageHeading` is the one source of every app and admin `<h1>` at 700 (a
  `font-semibold` would drop it to 600, and a stock size passed in takes it off the ladder); `CardTitle` is 600, labels
  and eyebrows Inter 500.
- **Marketing heroes compose `PageHero`** (eyebrow, h1, subhead, actions; `scale` picks the step, `children` is the
  stage, `backdrop` sits behind; the heading always an `<h1>`, as `SectionShell`'s `as` is for sections). Its entrances
  are named registers (`rise`, `cut`, `blur`), and the h1 never moves in any: an h1 resting at `opacity: 0` is an LCP
  hole, so `.mkt-line` never goes on an h1. The home and QR heroes stay hand-rolled, their object beside the lockup.
- **The display step is a masthead**: 160px at 1440 on purpose, one or two words matching the nav label (detail goes in
  the eyebrow), `whitespace-nowrap` under the clamp, its tracking squeeze `.mkt-name` reading the step's token. It trims
  its top only, `mt-[calc((1em-1lh)/2-0.19em)]`, keeping `py-[0.08em]` so a clipping ancestor never cuts a descender.
  ★ Mind the sign: `(1lh - 1em) / 2` agrees at 1440 and trims less on a phone. `leadIn` applies only at `align="left"`;
  on a centred masthead it pulls the line 3.6px off centre.
- **Data without a mono face**: figures on the body face with `tabular-nums` (a spin reel's digits hold one width
  through them); a number that is the subject of its block in the display face with tabular figures (prices,
  `StatBand`); a value that must look like one (a digest, an id, a key) on a muted plate, `rounded bg-muted px-1.5
  py-0.5`, with `select-all` unless the person must retype it as a guard. `Caption` is the one caption atom.

## Rounding: sharp surfaces, round actions

Every corner comes from one of four token families in globals.css's own `:root` block: `--radius` (surfaces; the base
the `sm`..`2xl` steps multiply), `--radius-action` and `-sm` (0.4 of an action's height; `button.tsx` derives every
other size from it, and `ctaCorner` exports the 44px corner for a non-`Button` action), `--radius-tile` with
`--gap-gallery` (every media tile; the gap is `max(3px, var(--radius-tile))`, pinned to the corner because four corners
meeting below it open a diamond) and `--radius-float` (the floating layer). An action riding its height is the
deliberate exception to nested-corner math: a control reads twice as round as the surface under it.

- **A ring, glow or bloom at offset N takes the object's radius plus N**, never a literal, or the two read as two shapes
  once colour lands in a corner. `BorderBeam` reads its child's radius when the prop is omitted, and is authored for
  corners of 16px and up, so its natural layer here is an action. A floating panel wears `rounded-float`, never a
  `rounded-2xl` that happens to match.
- ★ **Deleting the `3xl` and `4xl` radius lines brings Tailwind's defaults back**: theme.css sets them to `initial`,
  which removes them. A corner that big is `rounded-full`.
- ★ **A radius token `cn()` has not been taught loses to every stock corner**: both survive tailwind-merge and the
  stylesheet's alphabetical order picks the stock one. The names live in `RADIUS_TOKENS` (`src/lib/utils.ts`).
- ★ **A radius, gap, cadence or tuner token declared inside a theme set ignores the tuner**: every paper chapter and
  board re-declares it, out of reach of the tuner's inline override on `<html>`. They live in their own `:root` block.
- ★ **A derived radius token exists at runtime only while a scanned file spells it**: `--radius-sm..2xl` sit in
  `@theme inline`, so the custom property is emitted only where a source writes `var(--radius-<step>)`; an empty var
  voids its whole `calc()`, and deleting the last spelling empties every reader. Derive from the four real tokens.

## Elevation contract (four heights, one job each)

Four techniques, one job each, the same in both modes: the **step** (a panel a shade lighter than its ground), the
**ring** (the hairline where every surface ends), the **lift** (`shadow-lift`, only where one object truly overlaps
another of its own lightness: stacked photographs, a card across a chapter cut, a chip on a photograph) and the
**layer** (`shadow-layer`, under anything the page lives behind: menus, dialogs, sheets, tooltips, toasts). In light
the card is the page's own white, so the ring carries the edge; a surface lying flat takes no shadow in either mode.

- **One geometry, two sizes, one alpha ramp per ground**, all in globals.css; `.dark` and `.surface-ink` carry a darker
  ramp, since six percent black over the dark room is invisible. A call site names a role, never a stock or arbitrary
  Tailwind shadow or an inline `box-shadow` (`shadow-float` is retired). A lift over a photograph that reads weak in
  light gets a ramp declared on the media ground, never a raw shadow.
- ★ **A bare `box-shadow` on a ringed surface deletes its hairline**: `ring-1` is a box-shadow composed with
  `--tw-shadow`, so wear the utility or re-state the ring first (the toast re-states sonner's focus ring).
- ★ **An unlayered rule outranks every utility**: a bare `box-shadow` in marketing.css beats `shadow-lift` whatever the
  specificity. A shadow that must beat that sheet is carried inline as the token.
- ★ **`cn()` files `shadow-lift` and `shadow-layer` under shadow colour**: `cn("shadow-layer", "shadow-none")` keeps both
  and the stylesheet decides; the fix, if ever needed, is one `theme.shadow` line in `src/lib/utils.ts`.
- ★ **No surface token is translucent**: an alpha reads solid over a page and turns to glass over a photograph. Glass is
  its own material, worn only as media chrome.

### The bright edge (`data-lit`): material, not elevation

One pixel of light on the bevel of a surface lit from above, in the foreground colour at a low alpha, never a lamp
hue, worn by media (tiles, the event card, the players, the marketing wells), a framed screen (`PhoneShell`) and the
QR card, through `[data-lit]` in globals.css.

- **The hook sits on the box that owns the radius**, which it inherits: `event-card.tsx`'s outer `data-media-tile`
  wrapper is square, so the hook is on the rounded box inside it.
- **`data-lit="border"`** pushes the edge out over a 1px `border`. ★ Such a host must not clip: `overflow: hidden` cuts
  at the padding box, exactly where the border ends, erasing the edge (the canvas player rounds its canvas instead).
- **Dark grounds only** (`@variant dark`, so nothing is generated on paper, where a gallery holds hundreds of tiles), and
  only under `@supports` for `color-mix` and `mask-composite`: without the mask the gradient veils the photograph.

## The glass material: Crystal

Every surface over a photograph wears one material, Crystal: its numbers are the `--glass-*` block in globals.css,
named in `lib/glass.ts`. `PosterCardChip` (the stored reel's poster) is the one pane still carrying its own.

- ★ **Brightness makes glass legible, not blur**: a blur leaves the mean luminance under a pill unchanged, so a clear
  pane over a bright photograph loses white text at any radius. Crystal dims the backdrop under a four percent tint.
- **The edges are inset shadows, never a border**, which would change the pane's size.
- **Three utilities and no more**: `glass`, `glass glass-mark` (a lighter blur, because a phone pays for a mark on every
  tile) and `glass-behind` (the viewer's ground). ★ A `@utility` compiles only in the sheet Tailwind is imported from,
  so the material cannot move to theme.css or a component sheet.
- ★ **The ground is its own element, always**: a backdrop filter on an ancestor of the photograph blurs the photograph.
  `media-lightbox.tsx` puts `glass-behind` on the overlay and the media above it.
- ★ **A glyph on glass carries its own light** (`glass-mark-lit`): the rose like reads 4.4:1 through Crystal over the
  brightest photograph, and white fails the same way on a pale sky. A tint strong enough would sink every dark
  photograph, so the glyph wears a halo. Judge over the raw photograph, never an already-dimmed album.
- **Dark in both themes**: chrome over a photograph is the same on any page, so `.dark` redeclares no `--glass-*`.
- ★ **Glass is media chrome, never a popover**: a floating panel is opaque with a step and a ring, and
  `floating-layer.ts` refuses a backdrop filter on one. A scrim's blur is not a panel's material.
- **The section plate's two numbers are local and measured** (`backdrop/photo-section.css`: reading copy over a
  full-bleed photograph needs a darker brightness and tint to clear 4.5:1); retune them by measuring.
- **A phone pays nothing measurable for the ground**: the viewer's swipe holds 16.7ms frames blurred or flat, even at
  twice the radius under a 6x CPU throttle.

## The album tile

One tile, `shared/album-tile.tsx` (`AlbumTile`), draws every album grid, laid out by `shared/masonry.tsx`
(`MasonryColumns`): the guest album (`GuestMasonry` wraps it), the host's album, the bin and the personal feeds. The
admin's `ModerationTile` stays its own: a report is not an album. It lays out as masonry (the default), uniform (a
fixed aspect: the Reel and Review) or `rows`, the justified album, windowed (`shared/album-window.tsx`, opt-in until
each surface switches). `/design/album-scale` is the grid over 1,145 photographs and `scripts/album-perf.mjs` its
harness (nodes, animations, a fling's frames, renders per like, tick and poll, a head arrival while deep), measured on
a production build.

- **A tile shows state, not controls**: at most an active like, a play mark, a like count and the guest's `MineMark`;
  on a phone that is the whole tile, and every action lives in the viewer. At a desk the surface's `tileActions` ride
  one glass pane (the host's verbs: [host-app.md](host-app.md)), `display:none` until the tile is hovered or the
  keyboard is inside it (`data-kbd-focus`, written by the grid, since `:has(:focus-visible)` does not reliably
  repaint), sliding open on `@starting-style` and `allow-discrete` (`album-tile.css`). Collapsed to a zero width it
  still composited one blur a photograph.
- ★ **A tile renders only when what it draws changes**: it is memoized on data props compared by content (the item's
  drawn fields, its box's values, each verb's everything but `onSelect`), holds no handler (the grid answers every
  control from one delegated click and one long-press, reading the latest props), and reads its like per id
  (`useIsLiked`: `LikesProvider` is a store, and its context value never changes). A per-tile closure or JSX prop
  defeats it: `renderOverlay` is compared by identity, so a surface with an overlay re-renders its tiles with itself.
- ★ **`[data-reveal-chip]` needs its `!important`s** (the bin's chips): it lives in `@layer base`, where the chips' own
  utilities outrank it, so without them the collapse and slide die silently. It opens on `:hover`, `:focus-visible`
  and `:has(:focus-visible)`, never `:focus-within`, so a click does not leave it stuck open.
- ★ **A CSS-columns album re-flows every column when a photograph lands**, so items go to explicit columns:
  `distributeColumns` places oldest first into the shortest, walking backwards, so an arrival grows one column and no
  other tile moves. `GALLERY_COLUMNS` stays the first paint, since the count needs a width the server lacks.
- ★ **The measured columns are places in the same box, never a wrapper per column** (`placeColumns`): a tile that
  changes parent remounts, and wrappers remounted every tile at the first measure and on every filter. Each tile sits
  absolutely at `calc()`s on `--col-w` (the box's `100cqw` shared out), so a resize re-places nothing; the head stands
  at the first column's top and pushes it down by its measured `--head-h`.
- **`rows` justifies like a typesetter** (`lib/shared/album-rows.ts`): optimal breaks over the whole album, so every row
  fills the width; the oldest row justifies too and alone may run past the soft band, up to a hard cap; an album too
  small to fill a row at the cap sits centred at it. Three steps, photos per row by the box's width (`ROW_CLASSES`:
  1/2/3 under 480, 2/3/4, 3/4/6 from 900, 3/5/8 from 1280), never pixels; one index in the shared `pr_tile_size`
  cookie (`resolveRowStep`, the legacy widths mapped across). The feature row never runs at one a row. Extreme ratios
  clamp to 1:2..2.4:1 (`rowRatio`).
- ★ **A full re-solve moves the whole album**, since paths from a new head need not merge with the old ones, so it runs
  only on load, a resize, a step change and a filter; an arrival re-solves the new photos plus the three rows beside
  them and a hide its row and neighbours, each window pinned at its edges and stretched by one row at most: never
  more than four old rows move.
- ★ **The rows are one flex container broken by hand, never a wrapper per row**: a tile that changes parent remounts,
  dropping its decoded image to the shimmer and replaying its entrance on every arrival. Each tile's whole-pixel width
  is its `flex-grow` over a zero basis, so it lands on its pixel at the laid width and still fills mid-resize.
- ★ **The rows mount only around the view** (`lib/shared/album-window.ts`): row tops are a prefix sum of the engine's
  heights, the rows in view a binary search, one viewport behind and two ahead, full-width spacers for the rest, and
  the keyboard's row pinned. A scroll reads the view by arithmetic on a cached offset, never a rect: a rect read mid-
  frame forced a layout every frame. The first paint draws the first 48 photographs and a spacer estimates the rest.
- ★ **Nothing a reader is looking at moves**: `overflow-anchor: none` (the browser cannot anchor through a spacer, and
  Safari has no anchoring), then a change is paid in its own layout effect by scrolling exactly as far as the first
  photograph at the view's top (or under a pinch) moved: a difference of two album positions, so a view read a frame
  late cannot throw it off. At the head nothing anchors, so the arrival is seen; on a touch screen a change that needs
  a scroll waits until the scroll has been still 150ms, since a scroll written mid-flick stops the flick.
- ★ **The rows' glide snapshots every tile in `getSnapshotBeforeUpdate`** (the only pre-commit DOM read React has; a
  null class component): a rect remembered from the last glide is off by however far the reader scrolled since. The
  anchor's scroll is paid before the glide runs, so every tile glides from where it stood on screen.
- **An arrival pushes** (`arrival=push`): the rows write `data-entering` on what their reflow brought in, in the same
  render (a surface's mark lands a commit later and would flash the tile whole), and `arrival.css` wipes it in from its
  left edge on the glide's clock while the neighbours glide; it clears after the glide, so a remount never replays it.
- **Density is the View menu's slider and a pinch** (`density-control.tsx`): the slider's stops are menu radio items
  (a thumb inside a menu is unreachable by keyboard) and a pick keeps the menu open; a pinch, a trackpad pinch or
  ctrl and the wheel over the grid (native non-passive listeners, `touch-action: pan-y`) steps, anchored on the photo
  under the gesture.
- **The open item is an ID, never a position**: items mutate under an open viewer, and a stored index silently points
  at another photograph.
- **A tap hands the viewer its origin**: the viewer grows from the tile's rect (`data-media-id`) and drops back into the
  tile showing at close (a windowed album scrolls to it and mounts it first, `scrollToId`), focus returning there. The
  open photograph rides `?photo=<id>` (`lib/media/share-save.ts`), claimed by one grid per page.
- **A tile shimmers until its photograph decodes, then fades it in**, only while on screen (`data-inview` from the
  grid's one observer) and after a beat, so a cached photograph never flickers; the shimmer is linear, because a strong
  curve stutters at the loop point. The first row loads eager and first, every photograph decodes async, and a mounted
  tile keeps its URL across a presign rollover (the same object path), taking the fresh one only on an error.
- ★ **The album grid is one placeholder in a session replay** (`data-sentry-block`): the replay buffers every session,
  serialized every node the album mounted and measured every photograph (one forced layout each), the largest cost of
  a throttled phone's fling; the photographs are blocked from replays anyway.
- **Only the guest album staggers, and only its first paint**: `--tile-i` is the seed index, and whether a tile enters
  is decided once, at mount, so a windowed row scrolled in later lands still.

## Motion

Four house curves, under 300ms in UI, exits faster than entrances: `--ease-emphasis` (entrances, UI),
`--ease-in-out-strong` (moves, toggles, large ambient surfaces), `--ease-drawer` (sheets) and marketing's
`--mkt-ease-pop` (bounces). Exits compose through `data-closed:duration-*`; buttons press at `active:scale-[0.97]`;
primitives name their transition properties, never `transition-all`.

- **A background wash is a crossfade, not an entrance**: `--ease-emphasis` front-loads its change, so a full-width
  glass layer on it snaps. Ambient surfaces take `--ease-in-out-strong`, asymmetric by riding the open state (the
  overlay header).
- **The visible state is the default; the hidden state belongs to the trigger**: an element hidden until an observer
  fires stays hidden wherever it never fires, so arrival hooks (`[data-mkt-develop]`, `[data-mkt-rule]`,
  `[data-mkt-entering]`) fire on `@starting-style`, and the observer grammar (`[data-mkt-reveal]` with `Reveal`) is only
  for beats about scroll position. The failure mode is then "no animation", never "no content".
- **Reduced motion**: a global guard clamps durations to `0.01ms`, never `0` (radix's exit-unmount and the viewer's
  settle wait on `transitionend`), and stops infinite loops; component gates stay the first line.
- ★ **A filling animation outranks every author declaration**: an `animation-fill-mode: both` entrance
  (`[data-mkt-cut]`) holds its last keyframe forever over any later rule on that property, which DevTools still shows as
  matching. Put the entrance on an inner element and the interactive state on the outer one.
- ★ **`:has(:focus-visible)` matches but does not reliably repaint** in Chromium, so a state hanging on it alone is
  dead; use `:focus-within` wherever a click pinning the state is acceptable.
- ★ **A sticky grid item without `self-start` never sticks**: it stretches to its row and already spans the scroll range
  (`PressSection`'s pinned column, offset by `--mkt-header-h`).
- ★ **`parseInt` on a CSS time var collapses 2500ms to 2**: the minifier ships `2500ms` as `2.5s`. JS reads timing vars
  through `readCssMs` (`lib/shared/read-css-ms.ts`).
- **Three techniques**: arm a size morph only when there is a previous size (`data-swap`), or a late-measured 0×0 frame
  animates as a wipe; put an animated `backdrop-filter` on an inert `-z-10` sibling whose opacity fades, never toggle
  it on the bar, which snaps and repaints every descendant blurred; and a measured indicator suspends its transition and
  forces a reflow on first placement, or it flies in from x=0.
- **FLIP and drag are hand-rolled** (no motion or drag library): `useFlip` inverts both axes, `runFlip` is the one copy
  of the maths (every rect read before any style is written, one forced reflow a pass; `scale`, `duration` and
  `visibleOnly` for the album's rows), and `useSortableGrid` drops by index arithmetic on a uniform grid, with a 450ms
  touch press so a scroll never reorders and keyboard reorder for free. ★ `useFlip` prunes the rects of unmounted keys every pass, or a node
  that leaves a filtered set flies back in from where it sat; the prune cannot live in the ref cleanup, because
  `register(key)` is a fresh closure every render.
- **The two-beat set change: removal and reflow are never the same beat.** Leavers exit together, then the set commits
  and the FLIP moves the survivors, or the eye cannot tell what left from what moved. ★ The exit and the FLIP sit on
  separate elements, or the FLIP's inline `transition: transform` clobbers the exit (`[data-mkt-exiting]` /
  `[data-mkt-entering]`, `[data-review-tile][data-exiting]`).
- **The motion tuner** (`dev/motion-tuner.tsx`) writes CSS vars inline where they are declared (`<html>` for `--tune-*`
  and the radii, `[data-mkt]` for `--mkt-*`), so any var-backed timing tunes live on the real pages; its candidate
  block (`setCandidateCss` in `tuner-store.ts`) lets a board hand the site one CSS paste behind `?key=`. **A baked value
  moves in three places together**: the CSS default, the tuner config's `default`, and any JS fallback (the review
  takeover's `use-review-triage.ts`, via `readCssMs`).

### The floating-layer contract

`floating-layer.ts` (`src/components/ui/`) exports what every floating panel wears, so no primitive answers it locally:
`floatingCorner` (`rounded-float`) around rows derived from the panel's own padding; `floatingEntrance` (anchored: a
fade, a hair of scale, 8px from the anchor) and `floatingEdgeEntrance` (the sheet's slide); and `floatingClock`, whose
three rungs follow frequency: instant for what opens dozens of times an hour (a tooltip, a dropdown, a select),
standard for a popover or dialog, edge for the sheet. The light is `shadow-layer`, and no panel is translucent.
`drawer.tsx` (vaul's, drawn only by the Library's gallery now) and `sonner.tsx` sit outside the family by name; the QR mini-modal's View
Transition is its one sanctioned hole ([host-app.md](host-app.md)).

- **The product has ONE responsive `Sheet`** (`ui/sheet.tsx`, opted into with `responsive`): a side panel at a desk, a
  bottom sheet in a hand. It emits `data-side="responsive"`, so none of the fixed-side rules can race it, and its
  posture pair lives in `floating-layer.ts`; the share, settings and pricing sheets, the guest's door and overlays and
  the admin's destructive sheets all wear it.
- ★ **Its phone half is keyboard-safe** (`src/lib/use-keyboard-inset.ts`): `visualViewport` sets `--kb-inset` and
  `--vv-h`, the sheet stands on the keyboard with its ceiling at the visible height, `data-keyboard` reads `open` (or
  `tight` under 200px, a landscape phone's thin band), and `floatingKeyboardFoot` with `data-sheet-primary` keeps the
  primary action sticky at the foot while typing. The phone half opens with focus on the panel, never its first field;
  on iOS a field's tap is taken at `touchend` to hold the page's scroll, and the keyboard's height is remembered, since
  iOS reports it only once risen. An `overflow: hidden` ancestor defeats the sticky foot (use `overflow: clip`), and a
  fixed-height flex child inside the sheet needs `shrink-0` or it clips instead of scrolling. `overlayClassName`
  carries a door's own scrim.
- ★ **An unportalled submenu can open with a real box and paint nothing.** `SubContent` sits in a `Portal`: inside the
  scrolling, transform-animated `Content`, the transformed ancestor becomes the containing block for fixed
  descendants, so a submenu opened by a click mid-close paints nothing, while hover on a settled parent works. A menu
  stops at two levels: each `Sub` publishes its depth, and a third throws.

## Toasts

One `Toaster` (`ui/sonner.tsx`) in the root layout: top centre, clear of every fixed-bottom control, always expanded
(a phone has no hover to open sonner's pile), each toast reserving one trailing action slot so its width never shifts.
Its 5rem offset cannot read `--mkt-header-h`, which is scoped to `[data-mkt]`, a sibling scope.

- **An error waits for a press**, since a failure that vanishes unread repeats itself. ★ Sonner has no per-type
  duration, so `ui/sonner.tsx` patches `toast.error` once at load (`duration: Infinity`, a close button), guarded by a
  `Symbol.for` flag against Fast Refresh wrapping it twice.
- **Colour is state**: success green (a destructive action that succeeded is a success), warning amber (a Hide), error
  red for failure only. ★ The colours target sonner's `[data-sonner-toast][data-type]` with `!important`, because sonner
  injects a runtime `--normal-bg` rule that beats a class; verify a toast's computed background, not that the rule
  loaded.
- The only helpers are `showErrorToast` and `showActionError` (`lib/errors/toast.ts`). `vitest.setup.ts` mocks sonner
  globally; `vi.unmock("sonner")` is the escape.

## The arrival choreography ("Calm + 700ms")

The guest's arrival is a sanctioned exception to the 300ms ceiling, because it happens once (the reel reveal and
marketing's reveal are the others): the entry sheet enters on the Sheet's edge clock (300ms) after a 700ms beat,
while everything repeated stays fast. Its attributes (`data-arrive`, the step handoffs, `data-unlock-success`,
`data-reveal` behind `[data-reveal-curtain]`) are `@starting-style` with reduced-motion fades; the timings live in
`use-arrival-beat.ts` and `use-success-hold.ts`.

## Errors: the taxonomy and the boundaries

- **Every failure code is in one union**, `ErrorCode` (`src/lib/errors/`); each route's result union fits inside it,
  and `codes.test.ts` fails the build on a code without copy. A failure is `{ ok: false, code, message? }`, surfaced by
  `showActionError` / `showErrorToast` (the producer's message, then `FALLBACK_MESSAGES[code]`, then a default), in plain
  language with no internals.
- **Every route group's `error.tsx` draws the shared `RouteError`**, tagged `render:<area>` in Sentry, showing a help
  line and the `digest` as the support handle. ★ **It never renders `error.message`**: that is the security invariant.
- **The root `error.tsx`** catches a crash in a group's own layout, which no group boundary can; `global-error.tsx`,
  dependency-free (its own html, inline styles), covers the root layout's death.
- **`captureError` lives in the crash wrappers only**, never in `NotFoundScreen`, where it would file every real 404.
- **Verify the chain on a production build** with the gated `/design/lab/tools/boom` probe (dev shows the overlay).
- The 404 pages are [marketing-content.md](marketing-content.md)'s.

## The craft guidance stack

The craft defaults for UI work are the in-repo skills in `.agents/skills/`: `emil-design-eng` for every UI change
(motion by frequency, press feedback, custom easing, `@starting-style` entrances, reduced motion), `transitions-dev`
for a transition's recipe while building, and `transitions-polish` for tuning motion that already ships. They are
defaults, left on purpose and said so.

The lab and production are both provisional: a specimen is often an early prototype of future UI and a shipped surface
sometimes a minimal stand-in, so a minimal production surface is no evidence against a specimen. A proposal that does
not fit its surface means the placement is wrong, or the surface is provisional and will grow into it (design the two
together in its round), or the surface should change on its own merits, argued from what it should be and never from
what the effect needs. Which one is usually roadmap knowledge: ask.

## The /design lab

The lab (`src/app/(dev)/design/`) renders on the real tokens; a board lives in `sandbox/` with its own sheet and
scenes, which leave with it.

- ★ **A page-level gate cannot close the lab, because the shell layout has already rendered the nav** (every component,
  board and track by name), and a layout cannot read `searchParams`: a keyless request would answer 200 with the nav in
  the flight payload. So `src/proxy.ts` runs `designGateOpen` on every `/design` request (a refusal rewrites to a real
  404) and forwards the key as `x-design-key`; the pages still call `requireDesignKey`. Never wrap the shell's page in
  Suspense (its `notFound()` would answer 200), and never read the key there with `useSearchParams`. The gate lives
  outside the lab (`src/lib/design-gate/`), because production depends on it; `pnpm lab:smoke --production` proves it.
- ★ **The lab compiles nothing if it references `globals.css`.** Two Tailwind entries, one theme: globals.css excludes
  the lab and `docs/` from its scan (`@source not`), and `design.css` compiles the lab's utilities while
  `@reference`-ing theme.css. Never move a theme set's value into theme.css, which holds only the variant and `@theme`.
- ★ **The lab's utilities sit in the `utilities.lab` sub-layer**, or its unprefixed `grid-cols-1` would beat a
  production section's `lg:grid-cols-12` and every real section on a board would lay out as its phone version. A board
  overrides production through its own sheet or `cn()`.
- ★ **A breakpoint prefix inside a board's `Stage` reads the real window, not the canvas**, so a board silently reviews
  the wrong layout: board markup keys off the `mode` prop, and phone chrome is judged in an iframe at 375.
- **`design.css` declares no keyframes**: keyframe names are document-global, and a lab one would shadow production's
  on every `/design` visit.

## Gotchas / don't-revert

- ★ **A bare `<code>` element renders in a mono stack with no class at all**, as do `<pre>`, `<kbd>` and `<samp>`:
  Tailwind's preflight gives those four `var(--default-mono-font-family, ui-monospace, …)`, which no `font-mono` grep
  finds. Give them `font-sans` (the `Kbd` atom is the model), and a prose container `prose-code:font-sans`.
- ★ **Two mask layers on one element never intersect in Chrome**: `mask-composite: intersect` composites the last layer
  against transparent black, so the pair resolves to the union. Split the masks across two nested elements.
- ★ **Radix's `Portal` renders its children one commit after it mounts**, so an effect keyed on a dialog opening finds
  no element: the viewer binds its stage and media through callback refs held in state, and keys its effects on those.
- ★ **A tap on a tooltip-wrapped control can lose its click**: the touch's compatibility mousedown focuses the button,
  radix opens the tooltip on focus with no delay, and its arrow lands under the finger. The viewer's chrome cancels a
  touch pointerdown in capture (`media-lightbox.tsx`), except on a menu trigger, which radix opens on pointerdown.
- ★ **A full-width `inset-x-0` overlay above a gesture track eats the gesture** across its flanks, killing swipe
  navigation on every viewer at once: the box takes `pointer-events-none`, its controls `pointer-events-auto`.
- **`src/components/ui/*` keeps the shadcn generator's style** (no semicolons, `.prettierignore`d) while app code uses
  semicolons: reformat neither toward the other.
- **Vendored code (`src/components/vendor/*`) is verbatim third-party source**: prettier and the em-dash policy look
  away and eslint relaxes two rules there, so no gate catches a restyle. Compose on it from your own file and mark any
  unavoidable deviation `PARTYREEL:`. The one package is border-beam (MIT), vendored because a hand-port pushed our
  low-chroma five into a palette tuned at the gamut edge.
