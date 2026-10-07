# Design system: tokens, light, type, motion, errors

Open this before you:
- change a colour or a theme set, or paint a subtree dark or light;
- add, move or retune light: a lamp, the Aurora, a beam, a glow;
- touch type, a corner, a shadow, the bright edge or glass;
- build motion, a floating panel (a menu, dialog, sheet or tooltip), a toast or an album tile;
- build or restyle an atom that stands on a photograph (the event heads' contract);
- pace a marketing page's chapters;
- add an error path, an error boundary or a crash screen;
- work in the `/design` lab.

The Library at `/design/library` shows the brand kit (the live tokens), the component catalog and the bible's ten;
this doc holds how the system works underneath them and the ★ landmines that break silently. The theme sets' values,
the utilities, the glass tokens and the guards live in `src/app/globals.css`; the `@theme` block (the type steps, the
eases) and the `dark` variant in `src/app/theme.css`, which the lab's own Tailwind entry shares. The marketing site's
pages and content are [marketing-content.md](marketing-content.md)'s.

## The identity: achromatic, media is the color

The chrome is a cool grey with no brand hue, so photographs carry the colour and only state and actions are coloured.

Nothing in the component library is protected: it is a working version whose actions and fields still wear their shadcn
forms, though every atom's focus and press and the light on what floats are the house's (below). An identity is the sum
of every part read together (primitives, materials, type, motion, composition), so a button made different on its own
is not one, and atoms left at a generator's defaults read as generic however custom the layout above them. The current
direction is a camera's own instruments, carried by the voice (Type), the display (the floating layer) and status as
light (below).
It is pitched at the crowd that actually comes, about 18 at a party to about 50 at a wedding: bespoke and current to
them, never a developer's tool, and never flattened for the lowest common denominator, since the core path (scan, add,
view) is plain to anyone already.

- **Five grounds, five classes**, each a whole token set in globals.css: the page `:root, .surface-paper` (paper), the
  room `.dark` (the app and every cinema chapter), the slab `.surface-ink` (an always-dark leaf on paper, such as the
  footer), the mat `.surface-mat` (declared, worn nowhere yet) and the display `.surface-display` (the quick layers'
  screen: the room's own black on paper, lit graphite in the room). `--gallery*` is the media well, always dark and the
  deepest ground. A ground re-declares every token a part inside it reads, in whole pairs (`--signal` beside
  `--destructive`, a state beside its words), because a pair left out resolves to the ground beneath
  (`ui/display.test.ts` holds the display's and the states').
- **A piece of the room on paper is the room's own black** (brand-marks r1, `plate=room`: "the contrast feels a lot
  richer, almost vibrant"): the slab is `.dark`'s ladder value for value, its states the room's lights and its lamps the
  house ember, and paper's display stands on the room's body with its held row on the room's dialog, so light on paper
  reads as bright as in the room. The well (`--gallery`) stays a register deeper, so a slab never derives from it.
- ★ **The display's `--display*` set is declared per ground**, in whole, on paper's block and on `.dark`, never on
  `:root` alone: the layer reads whichever ground it stands in, a paper subtree inside the room takes paper's again by
  wearing `.surface-paper`, and a value the layer needs on only one ground still gets a token on both (a literal typed
  into `.surface-display` is paper's grey on graphite, which `display.test.ts` refuses for the ones that differ).
- **Three text steps**: `--foreground`, `--muted-foreground` and `--faint`, each a solid grey per ground rather than an
  alpha, so it reads the same over whatever is behind it. `--faint` is under 4.5:1 on every ground, so it is for
  captions and hints, never a sentence, a control's only label or under a further alpha (`faint-copy-policy.test.tsx`).
- **Status is light, in four tiers** (brand-marks r1, `status=amber`, for "a clearer hierarchy of states rather than
  simply red or not red"): a state is a point and its word, the point solid and hard-edged (the glow is the light's),
  and "nothing here yet" is one atom, `ui/empty.tsx` (the shared `EmptyState` and the feed's section empty are it). The
  tokens keep their names, so every reader moved with its value; the Badge draws each point (8px, Standby's half-lit):
  - **Standby** (`--info`, the Badge's `info`): waiting on us or the line, nothing for her to do. Half-lit, no hue: the
    ground's muted ink. Drive's Starting, Sending and Checking (`drive/moments.ts`, the admin's Making folders), a
    download under way, a job running (`lib/admin/tone.ts`), the export toast's between-parts and downloading.
  - **Ready** (`--success`): done, a clear green. Approved, sent, in her Drive, connected, copied, a step set up, all
    caught up, a job healthy, a check passed; `text-success` reads `--success-ink`, the green at AA on paper.
  - **A warning** (`--warning`): look soon, nothing lost. Amber in the room, deepening toward orange on paper so it
    stands as a point (3:1); `text-warning` reads `--warning-ink`. Near or over a cap inside its grace (the storage
    meter and chart), at a limit, a pause (Drive full, a reconnect, Google's day), partly done, a job overdue or needing
    a look, the caution before a step guests will see (`ui/consequence-line.tsx`).
  - **A fault** (`--destructive`): failed, refused, stopped, unreadable, and every error in words. The one red, which
    also means a count that needs her (`--needs-you`, below) and live (`--signal`, the only point that breathes, the
    dashboard's `LiveDot` and the Badge's `live`).
  - Not states, so never a tier: an action's own hue (approve green, hide amber, delete red), a selection's tick, an
    operator's label (the Badge's unlit `secondary`, `outline`, `ghost`). A state drawn in another tier's token is its
    surface's to move (ROADMAP's Design line names those left).
- ★ **A count that needs her is one token, `--needs-you`** (event-header r6, Will's `attention=tally`), with
  `--needs-you-foreground` for its figures: the camera's tally, the red the palette already holds (paper's is
  `--signal` itself; the room's a step deeper than its bright signal, so white figures hold 4.6:1). It is worn solid
  and hard-edged by every count that waits on her, never a glow, so a screen's one light stays its light: the hub's
  badges and their pills, the code's corner, Review's count, the card's "to review" chip and the dashboard's marks and
  rows (`StateDot`, the row's pill); the stage's figures stay white beside its dot, since a deep red as type thins over
  a photograph. No utility maps it, so a part reads it by name (`bg-(--needs-you)`). A count hers that waits on
  nobody (steps left, a pause) is never it.
- **The brand is the wordmark alone**, in the bars, the foot and every card: `src/lib/brand/wordmark.ts` is the one
  home of Will's v1 path and its two cuts, each his letters only moved apart (the small cut under 48px, the display cut
  from 48px up, `Logo`'s `cut`), drawn by `Logo`, the social and event cards and the kit. ★ His rule for every cut and
  every later redraw: a bit bold, so it "packs a bit of a punch" at any size without being large, and it "should present
  as a singular group to present clearly, rather than feel spaced out and spread focus": part only what touches, by the
  least that keeps a seam, never track it out. `--brand` is an alias of `--primary` (ink).
- **The icon is the Ring** (brand-marks r1, `icon=ember`; a bespoke take is brand-marks r2's): the shutter's puck in its
  ring, key-lit from the top-left by the house ember on the room's dark tile, a whole ring at every size (each size its
  cut, never a moon). `src/lib/brand/ring.ts` is its one home, drawn by `Logo markOnly`, the reel's watermark (the mono
  Ring on footage, the icon as the badge) and `scripts/build-press-kit.mjs`, which writes every file it lives in (the
  favicon, the app and manifest icons, `kit/logo/`, the press kit); `src/lib/brand/marks.test.ts` fails on a file not
  redrawn. It is the house's, never an event's light, and never stands beside the wordmark as a lockup.
- **One colour per action**, so an act reads the same on guest and host surfaces: like rose (`--like`), save and
  download blue (`--save`), hide and show amber, approve green, delete red. Violet (`--reel`) marks the highlight reel
  itself (its own calls to action, the style rail's active thumb), never a verb on a photograph, since the live reel
  plays every approved photo by itself and no tile or bulk bar adds to it. An action icon is monochrome at rest, takes
  its colour as a stroke on direct hover and a `/25` fill while active; an icon beside text is muted unless it is the
  action.
- ★ **Painting a subtree dark is only half the job.** `--ring`, `--border`, `--foreground`, `--muted-foreground` and
  `--brand` are not surfaces, so under paper they keep their light values (a focus ring and muted words all but
  invisible on a dark leaf), which you will not see while you work on a cinema page inside `.dark`. A dark leaf on
  paper wears `.surface-ink`, which carries every token a leaf reads, rather than `.dark` or `bg-gallery` (the well is
  two registers deeper, and a footer on it reads as a hole). Inside a set, `--brand` is redeclared directly, since a
  `var()` in a custom property resolves where it is declared (`:root`'s `var(--primary)` would inherit as paper ink).
  A shadow token that draws nothing is `0 0 0 0 oklch(0 0 0 / 0)`, never `none`: Tailwind composes it with the ring
  into one `box-shadow`, and a `none` in that list takes the ring with it.
- ★ **A hand-assembled dark set is for a LEAF, never a page's chrome**, because page chrome's set is always one token
  behind what a descendant reads next: the nav panels render in flow inside the header, so a header set that omits
  `--popover` paints every nav title white on white. A page that wants dark chrome joins the `(cinema)` group.
- **A colour read by name from JS or SVG** (`var(--color-chart-N)` in a template string) lives in theme.css's
  `@theme static` block: Tailwind emits a theme variable only where a scanned utility uses it, so elsewhere it
  resolves to nothing.

### The media-forward card

A tile whose picture is the card (the event types, the feature doors, the closing rows) has two overlays with two
owners: the picture's own fade, which lifts on hover, and the card's copy gradient, `CARD_COPY_SCRIM` in
`feature-door.tsx` (measured per pixel off the real photographs, so a change is measured again on every door), which
never lifts; a visual that wants to be quiet fades itself.

## Chapters: the attention arc

Marketing pages alternate cinema (dark) and paper chapters, and each chapter is an attention arc: it opens strong,
ramps down through sections that carry the information without shouting, and hands over to the next opener. That paces
the visual sections (a hero, the demo, the reel) against the dense ones (curation, privacy, the FAQ).

- **An opener is weightier and designed bespoke**, its device varied between chapters: a heading a step up
  (`SectionShell scale="lg"`), the film-cut entrance (`reveal="cinema"`), more air, an object crossing the cut, a
  drawn rule (`[data-mkt-rule]`), a lit subject, a full-bleed frame. One device per cut reads as a cut; two read as
  noise.
- **It applies to the core pages** (the home, the feature and event pages, how it works); the utility pages keep the
  utility-page rhythm ([marketing-content.md](marketing-content.md)), and a chapter that is the page's body (an
  article, a form) has no arc.
- **A chapter winds down before its cut**: it may close on an anchor only after ramping down, since a loud section
  right before a cut leaves the next opener nothing to open against. A full-image section may carry the page across a
  cut now and then.
- **Shape paces as well as loudness**: neighbours may share a register but vary their layout (three centred sections
  in a row flatten a chapter).
- **A visual pulled across a cut by a negative margin** (as on /help and /about) needs a chapter without `isolate`,
  which would trap its z-index under the next section (the footer carries `isolate`; a chapter does not), and a block
  formatting context on its own wrapper (`flow-root`, as `about/gather.tsx` explains), or the margin collapses through
  and the next section's text lands on it.

## Light: SPILL, BEAM, and the lamp set

Where there is no photograph, light carries the colour, as one of two kinds. **Spill** falls from a lit thing onto what
is near it; **beam** marks the object that is the live subject. Ink tends to take the beam, paper spill.

- **Spill** has a named source (an object, or the place it lights, as the footer's seam does), a direction, the colour
  of the lit thing (sampled media, or the lamp set where there is none; never a house or state colour, or the glow
  becomes a second palette) and a falloff that draws no edge, sits behind content and keeps an always-on base. In dark,
  spill stays off the words: under a muted word the atmosphere register reads about 2:1, so a lamp behind copy spends
  itself in the padding (`door/lit.css`).
- **Beam** marks the live subject (uploading, publishing, live), one per view, and ends when the state ends; the Get
  Pro card, lit at rest, is the one exception.
- **Scarcity is a distance**: roughly a viewport of unlit page between lamps.
- **Light never goes** on nav panels (the most-used controls get no theater), near a cap or an upload error (it would
  read as a warning; failure is `--destructive`), on skeletons, on every `CtaBand`, or in the admin.
- **Gallery arrivals wear their own glow** (`shared/arrival.css`) rather than a lamp: a second light at the album's head
  on every beat reads as a pulse, not light, and a batch of them would bury the album's top.
- **Afterglow's first light in production is the hub's Seam** (event-header r6; its facts are
  [host-app.md](host-app.md)'s): born at the cover photograph's edge in that edge's own colours, read at runtime off the
  crop the eye sees, at the brand's reach in the room and inside a strip of the room on paper, never on the page itself.
  It is neither this engine nor the lamp set, and a status beside it is a solid point (`--needs-you`), never a glow.
- **A new lamp answers four questions first**: what emits (or what place is lit), from where, sampled from what, and
  what above admits it.
- **The lamp set is light, never UI**: five hues in three registers, each at its home: ambient `--lamp-1..5`
  (globals.css, hand-tuned per hue), paper `SPILL_REGISTER.paper` (`sampled-palette.ts`), and live, the vendored
  border-beam's `partyreel` palette, derived from the five by `glow-contrast.ts` (it cannot be a `var()`: that file
  regex-parses `rgb()` strings). The ambient block stays out of `@theme`, so no `bg-lamp-*` or `text-lamp-*` utility
  can exist.
- **The house ember is the light where there is no photograph** (brand-marks r1): one gradient from one key light,
  amber to coral to a deep ember, its four stops `--ember-1..4` (the Ring's own, `ring.ts`, held by `ring.test.ts`),
  and five points along them, `--ember-lamp-1..5`, relighting what read the five lamps there: the foot's seam
  (`.surface-ink` redeclares `--lamp-*` as them, so every unsampled lamp inside a piece of the room is the ember) and
  the confetti (`--mkt-confetti-*`). A photo-less event's lamp on the dashboard keeps its own five hues, since the
  house ember on every event would read as one.
- **Pick the sampler by where the media comes from** (`src/lib/shared/sampled-palette.ts`): the URL form samples
  presigned R2 media when handed `previewUrl`, never the original; the DOM form suits same-origin media already
  painted (zero requests), and over a presigned tile it taints the canvas and silently returns the fallback five. The
  URL form's `no-store` is the cache trap in [uploads-and-r2.md](uploads-and-r2.md).

### The glow engine

`[data-glw*]` in globals.css, kept unlayered (in a layer, one caller's `blur-sm` would replace the engine's whole
`filter`, which is also why `Glow` takes no `className`); the primitives are `Glow` and `GlowFilter`
(`shared/glow*.tsx`). The engine's comments in globals.css carry its traps where they live.

- ★ **A band-only glow is invisible whenever it is paused**: the band rests off the layer, and rest is its state below
  the fold and under reduced motion. Base and band ship together (`[data-glw-base]` under `[data-glw-band]`), and a
  band rests where its animation starts, never mid-travel, or a reduced-motion visitor sees the comet forever.
- **`GlowFilter` mounts once per document**: in the root layout (the root 404 renders the footer outside
  `(marketing)`) and in each portalled lab frame (`FrameWindow`), since SVG ids are document-global. Without a filter
  host the whole filter chain drops, `blur()` included, and the lamps render as hard blobs (`Glow` has a dev-only
  console guard).
- **One clock**: lamps read `--spill-cadence`, never a literal; the Aurora's field reads `--aurora-cadence`, a slower
  sibling declared beside it (a chapter-sized field on a lamp's clock reads as a screensaver).
- **Two placement mistakes look like opacity problems**: a lamp goes after the scrims it lights through, never under
  them (four scrims leave an eighth of its strength), and the content wrapper needs an explicit `relative`, or the
  absolute `Glow` paints over the h1. Fix the stack, not the opacity.

### The shipped light

- **`ScreenLamp` is the one underlight**: a lit object throws its sampled light down off its bottom edge
  (`marketing/system/screen-lamp.tsx` says how its section must clip); a new underlight is a `<ScreenLamp>`, not
  another file.
- **A feature page lights its hero and the footer seam**, a second light only far below: a row of lit cards is
  decoration, and a wall of photographs is a ground, not a source.
- **A radial mask's reach is a fraction of the full field** (its transparent stop sits at 78 percent), so a field the
  object's size renders a rounded square: size the field generously (`-inset-32` on the QR plate).
- **A lamp crossing a chapter cut is clipped at the cut**, on purpose: one lamp, one register.
- **Every other light fades out on its own, never at a box's edge**: a sheet, a scroller or a card with `overflow`
  cuts a spill into a hard line where it overflows, so a light leaking from a source is drawn as a sibling outside the
  clip, or finishes inside it; and a lit edge keeps its object's corners ("Rounding": a glow at offset N takes the
  radius plus N). A glow with unpaired corners, or a spill cut short, reads as unfinished.

### The Aurora, and its three forms

The Aurora is the coloured light as one family (the code's names: `Glow`, SPILL, `--glw-*`, `--lamp-*`): the **seam**
where two grounds meet, the **throw** cast from a point on an object, the **field** lighting a chapter at its edges,
and two marks, the **bloom** (a one-time glow that rests lit) and the **halo** (an object lit from behind: around a
button it reads as decoration on a control rather than light from a thing).

- **The field is `SectionLight`** (`marketing/system/section-light.tsx`, composed for its place at each call site):
  seams at the section's own boundaries, the bottom one the top one flipped (the engine grows no bottom shape; a vector
  is the caller's to turn), never in the middle or behind, where the copy would sit in the light. One register
  (`AURORA_VARS`), on the transform drive, since a chapter-scale mask repaints every frame.
- **A section with no boundary line of its own cannot take a band or a floor cast**: the box clips the falloff into a
  hard line. A side cast, vertically centred, with a reach under about 64 percent finishes inside the box.
- **The Aurora is off on a light ground, by a CSS fence**: nothing tunes the lamp set for paper yet, so a media-less
  lamp there would paint the dark register on white. The fence is ONE rule, both halves needed (a paper chapter sits
  inside a forced-dark wrapper; a cinema page in a light session has no `.dark` on `<html>`):
  `[data-section-light]:not(.dark *), .surface-paper [data-section-light] { display: none }`. It lists lamp boxes (the
  share card's `[data-rxp-cardlight]` is on it), hooked on the light's own box, never the object, and never widened to
  `[data-glw]`, which would switch off the shipped seams; a second copy is the one that drifts.

## Type: the heading face + the ladder

- **Two faces**: Inter to read, Urbanist to be loud, through `font-heading`, an `@utility` in globals.css rather than a
  theme font token. There is no mono face (a bare `<code>` is the gotcha below).
- **The ladder is the `--text-*` steps in theme.css** (the Library's brand kit reads every number back off them), each
  step's size, leading and tracking a `clamp()` from 375 to 1440, so no heading takes an `sm:` size. Headings keep
  their order at both ends; at a phone the marketing steps sit closer together, so a section's weight comes from its
  entrance and air as much as its type.
- **A role picks a step, never a size**: a heading no step fits is an undecided role, and a new step names a size the
  site already uses. `working` is the rung for any functional line. MDX articles size h2 and h3 on the prose wrappers,
  because the shared MDX components carry no sizes.
- **`copy` never sits inside a block titled at `card-title`**: `copy` reaches 18 at 1440 against `card-title`'s 16, so an
  FAQ answer would outrank its question; those blocks take `reading`.
- **A new type step, radius or shadow token is taught to `cn()` in the same change** (`TYPE_STEPS`, `RADIUS_TOKENS`,
  `SHADOW_TOKENS` in `src/lib/utils.ts`): tailwind-merge files an unknown `text-*` as a colour and drops it beside a
  real one, and an untaught radius or shadow survives beside a stock one, leaving the stylesheet's order to pick.
  `type-ladder-policy.test.ts` pins the lists against theme.css. No step takes a name the colour namespace owns
  (`--color-card` exists, so the step is `card-title`).
- **A step carries its own leading and tracking**: a `tracking-*` or `leading-*` beside it overrides them
  (`tracking-tight` is `0em` here, so a generator's habit flattens the step), and an uppercase label adds no tracking,
  since the `label` step carries its own.
- **Three things sit off the ladder on purpose**: type drawn inside a picture (a pictured phone, a printed sign, an
  emblem's glyph), which a viewport clamp would size by the wrong box; an Inter label inside a heading tag, kept for the
  outline (the feed's section header, the dashboard's section labels, the admin bands); and `app/global-error.tsx`,
  which replaces the whole document, stylesheet included, so its h1 is sized inline.
- **The heading weight lives in the `font-heading` utility alone**: Tailwind emits a custom utility ahead of the stock
  ones, so a weight class beside it wins silently (as a step's tracking does, on purpose), and shadcn's generator
  writes a weight onto every title it adds; `type-ladder-policy.test.ts` refuses the pair. A heading that should weigh
  otherwise changes the utility. `PageHeading` is the one source of every app and admin `<h1>`.
- **Data without a mono face**: figures on the body face with `tabular-nums` (a spin reel's digits hold one width
  through them); a number that is the subject of its block in the display face with tabular figures (prices,
  `StatBand`); a value that must look like one (a digest, an id, a key) on a muted plate, with `select-all` unless the
  person must retype it as a guard. `Caption` is the one caption atom.
- **A readout is the camera's voice**: what a camera prints (a badge's state, a count beside its glyph, the live mark)
  is the `label` step in spaced capitals with tabular figures; every other label and every word on a control stays in
  sentence case.

## Rounding: sharp surfaces, round actions

Every corner comes from one of four tokens in globals.css's own `:root` block (the Library's radius ladder shows their
values): `--radius` (surfaces; the base the `sm`..`2xl` steps derive from), `--radius-action` and `-sm` (`button.tsx`
derives every other size from it, and `ctaCorner` exports the corner for a non-`Button` action), `--radius-tile` with
`--gap-gallery` (every media tile; the gap is pinned to the corner, because four corners meeting below it open a
diamond) and `--radius-float` (the floating layer; its rows, a tooltip's capsule and the work layers derive from it in
`floating-layer.ts`). They sit in their own `:root` block, never a theme set, so the motion tuner's override on
`<html>` reaches them. A card is the surface ladder's `2xl`. An action is the deliberate exception to nested-corner
math, twice as round as the surface under it, so the contrast says what is pressable.

- **A ring, glow or bloom at offset N takes the object's radius plus N**, never a literal, or the two read as two shapes
  once colour lands in a corner. `BorderBeam` reads its child's radius when the prop is omitted and is authored for
  large corners, so its natural layer here is an action. A floating panel wears `rounded-float` rather than a stock
  corner that happens to match, so a retune moves it.
- **A derived radius token exists at runtime only while a scanned file spells it**: `--radius-sm..2xl` sit in
  `@theme inline`, so the custom property is emitted only where a source writes `var(--radius-<step>)`; an empty var
  voids its whole `calc()`, and deleting the last spelling empties every reader. Derive from the four real tokens.

## The atoms' focus and press

Every focusable atom wears one focus mark and every action one press, each a utility in globals.css that carries its
board's words (identity r4: focus=halo, press=shrink): `focus-halo` and `press-shrink`. An atom wears the class and
spells no focus ring or active scale of its own (`ui/identity-traits.test.ts`, which pins the edge below too).

- **The halo is drawn whole in Tailwind's ring slot** (`--tw-ring-shadow`: a painted band, the ink line, a bloom), so an
  atom's own shadow stays under it, and a call site that gives an atom a ring of its own (`focus-visible:ring-*`)
  replaces it whole: a part that is not a field in a box opts out so (Create's name on its rule,
  `focus-visible:ring-0`).
- ★ **Its band is painted, so it is a ground's token**: `--halo-gap` and `--halo-bloom` are declared on every ground
  (paper's white, the atom's own `--background` in the room and on the display), and a photograph's set rides
  `data-surface="photo"` and Button's `on-photo` and `glass` wherever they stand. A subtree painted dark in literal
  colours (the camera's black) wears `dark`, or its halo is paper's ink on black.
- **An atom whose own light stands outside its box** (the shutter's ring) sets `--halo-at` and `--halo-band` to stand
  beyond it (`ui/shutter.css`); an element that stands for a focus it does not hold (the code field's caret slot) pins
  the halo with `data-halo`; a control filling a box that clips (a row's stretched button, an overlay, a field's eye)
  draws it inside with `halo-inset`. ★ An inset halo is painted under the control's own content, so a control a
  picture fills (the album tile's open button) wears it on a layer over the picture, pinned with `data-halo` while
  it holds the keyboard's focus (`TileHalo`), its outline drawn inside the edge where colours are forced. An atom's
  error is drawn inside it (a key's and a switch's `inset-ring`, a field's well rim), never in the ring slot, where it
  would replace the halo.
- ★ **A trigger a layer hands its focus back to after a pointer's choice wears no halo** (`ui/quiet-focus.ts`, worn
  by DropdownMenu and ResponsiveMenu: Chrome reads that programmatic focus as the keyboard's); a new layer that gives
  focus back calls it too.
- **A focusable atom transitions no `box-shadow`**: the halo arrives in its own 140ms beat (out of the registered
  `--halo-t`) and leaves at once, where a fade would show two marks as a key moves on.
- **The press lands in the frame the finger does and lets go on the atom's own transition**, which must name `scale`
  (its 0ms is `!important`, to outrank a transition an atom's own sheet declares outside every layer). Each size names
  its give in `--press-scale`, about two pixels at every size. It never fires on a popup trigger (`aria-haspopup`),
  whose layer Radix anchors to the trigger in that same frame. The camera's shutter keeps a camera's press.

## The atoms' set: sunk, flat, afloat

Every atom is built from one set (identity r5, set=house): **a field is a well**, **a key lies flat**, **what is chosen
floats**. Their values are THE HOUSE SET'S GROUNDS in globals.css, declared on every ground; the constructions are
utilities beside the halo, each writing its own slot of the shadow every utility composes, so the halo stands over
any of them whole.

- **`field-well`**: Input, Textarea, Select's trigger, the code's slots and any native field (Settings' Max size). A
  shade inside its top, a rim, a lit lip; the rim firms under a pointer, the inside lightens holding the caret, red
  rim in error. A field in the set wears no border.
- **The keys** are Button's variants on the tokens directly: ink (`default`), a tone (`secondary`), clear inside a
  hairline (`outline`), nothing (`ghost`), a red tint (`destructive`). Off, a key with a face settles clear with a
  quiet hairline and faint words, unless it is working.
- **`afloat`** (with `afloat-card` for a card in a clipping wrapper): a chosen segment, chip, tab or radio card, white
  on its lift on paper, lit graphite with the bright edge on its `::after` in the room. A segment's track is
  `bg-(--track)`; a radio card waits as `bg-(--choice)`; a radio waits as a ring of tone and fills with ink. A note
  set into a control's place (the consequence line, "31 guests are already in") is a flat tone with no line.
  Production's corners and boxes stand: the set is bodies, never sizes.
- **A switch** is a flat track of tone that turns to ink, its thumb `toggle-thumb` (white on both grounds, a seam).

## Working: the arc and its words

A key working on what was pressed says so twice (identity r5, loading=words): Button's `working` and `workingLabel`
draw `working-arc` (a third of a ring turning round a faint whole ring, in the key's ink, sized by `--arc` per size) in
its icon's place, and its words turn to what it is doing ("Saving", "Creating your event", never an ellipsis, never
"Still saving"). Both faces stand in one grid cell from the first paint, so the key never changes width.

- **Busy, never off**: a working key keeps its face and its focus (`aria-busy`, `aria-disabled`) and swallows a
  second press, a submit included; a `disabled` beside it keeps the face while it works.
- **A field checking what was typed** puts the arc in its status slot (`working-arc text-muted-foreground`), as the
  handle and the event link do. Under reduced motion the arc rests as a ring a third filled.

## Elevation contract (four heights, one job each)

Four techniques, one job each, the same in both modes: the **step** (a surface a shade off its ground), the **ring**
(a hairline at an edge), the **lift** (`shadow-lift`, only where one object truly overlaps another: stacked
photographs, a card across a chapter cut, a chip on a photograph, the code's white mat) and the **layer**
(`shadow-layer`, under anything the page lives behind: menus, dialogs, sheets, tooltips, toasts). A card lies flat as
its tone alone, with no ring and no shadow in either mode; the ring is left to what a step cannot part (a body panel
such as the marketing nav's), and what floats ends in light instead (the bright edge, below).

- **One light, two sizes, one alpha ramp per ground**, all in globals.css; `.dark` and `.surface-ink` carry a darker
  ramp, since the paper ramp is invisible over the dark room. A call site names a role, never a stock or arbitrary
  Tailwind shadow or an inline `box-shadow`, so a retune reaches it; a lift over a photograph that reads weak in light
  gets a ramp declared on the media ground.
- **A shadow can delete a ring**: `ring-1` is a box-shadow composed with `--tw-shadow`, so a bare `box-shadow` on a
  ringed surface deletes its hairline (wear the utility, or re-state the ring first, as the toast does for its focus
  mark), and an unlayered rule such as marketing.css's outranks every utility whatever the specificity (a shadow
  that must beat that sheet is carried inline as the token).
- **No surface token is translucent**: an alpha reads solid over a page and turns to glass over a photograph, and glass
  is its own material (below). The lines are the exception, because they are never surfaces: paper's `--border` and
  `--input` are ink at an alpha so one line reads on the body and on a card, and the display's row wash (`--accent`) is
  light inside an opaque panel.

### The bright edge (`data-lit`): material, not elevation

One pixel of light on the bevel of a surface lit from above, in the foreground colour at a low alpha, never a lamp
hue, worn by media (tiles, the event card, the players, the marketing wells), a framed screen (`PhoneShell`) and the
QR card, through `[data-lit]` in globals.css.

- **The hook sits on the box that owns the radius**, which it inherits: `event-card.tsx`'s outer `data-media-tile`
  wrapper is square, so the hook is on the rounded box inside it.
- **`data-lit="border"`** pushes the edge out over a 1px `border`, so such a host must not clip: `overflow: hidden` cuts
  at the padding box, exactly where the border ends, erasing the edge (the canvas player rounds its canvas instead).
- ★ **The edge's pixel is a 1px transparent border under the mask, never a padding**: Chrome draws a border under a
  device pixel as one whole device pixel but rounds a padding to the pixel grid, so a padding ring drew nothing once a
  page was zoomed under half (a zoomed-out desk, a laptop's smaller steps) while looking right at 100%. Measure an
  edge at 100% and under half zoom (CSS `zoom: .33`).
- **Dark grounds only** (`@variant dark`, so nothing is generated on paper, where a gallery holds hundreds of tiles), and
  only under `@supports` for `color-mix` and `mask-composite`: without the mask the gradient veils the photograph.
- **What floats wears it too, in place of a hairline** (identity r4, edge=floating), through the floating-layer
  contract: `lit-display` on every quick layer and the toast, on both grounds (the display is dark on paper too) in the
  ground's `--display-light`; `lit-work` on every work layer, in the room alone, on its free edge (all round a dialog,
  along a sheet's top, down a desk panel's left; nothing on a whole screen or a fixed-side Sheet). Cards stay flat.
- ★ **On paper the display's light steps a pixel in**, since on its outer pixel it read as a grey rim against the
  page, its corner a pixel tighter through `--lit-r`: a layer whose corner is not the display's 16px names it (the
  tooltip's capsule does), and a call site's own corner on a quick layer leaves the light off concentric.
- **A layer that scrolls itself carries its light with its content** (the positioned pseudo-element scrolls with the
  rows), so a long menu scrolled down loses its top light; a layer that scrolls an inner body (`PopupBody`) keeps it.
  A toast's light is its `::before`, since sonner's `::after` is its gap's hit area.

## The glass material: Crystal

Every surface over a photograph wears one material, Crystal: its numbers are the `--glass-*` block in globals.css,
and `lib/glass.ts` names the classes the product wears. `PosterCardChip` (the stored reel's poster) is the one pane
still carrying its own.

- **Brightness makes glass legible, not blur**: a blur leaves the mean luminance under a pill unchanged, so a clear
  pane over a bright photograph loses white text at any radius. Crystal dims the backdrop under a light tint.
- **The edges are inset shadows, not a border**, which would change the pane's size.
- **Three utilities**: `glass`, `glass glass-mark` (a lighter blur, because a phone pays for a mark on every tile) and
  `glass-behind` (the viewer's ground). A `@utility` compiles only in the sheet Tailwind is imported from, so the
  material cannot move to theme.css or a component sheet.
- **The ground is its own element**: a backdrop filter on an ancestor of the photograph blurs the photograph, so
  `media-lightbox.tsx` puts `glass-behind` on the overlay and the media above it.
- **A glyph on glass carries its own light** (`glass-mark-lit`, a halo): a coloured or white glyph through Crystal fails
  contrast over the brightest photograph, and a tint strong enough to fix it would sink every dark one. Judge over the
  raw photograph, never an already-dimmed album.
- **Dark in both themes**: chrome over a photograph is the same on any page, so `.dark` redeclares no `--glass-*`.
- **Glass is media chrome, not yet a floating panel's**: panels are opaque (the display, or the body's popover), and
  `floating-layer.ts` carries no backdrop filter until a glass exploration designs the material across marketing and
  app, since one added there first would be a one-off on every panel at once. A work layer's scrim is the page
  half-dimmed and sharp (`floatingScrim`).
- **The section plate's two numbers are local and measured** (`backdrop/photo-section.css`: reading copy over a
  full-bleed photograph needs a darker brightness and tint to clear 4.5:1); retune them by measuring.
- **A phone pays nothing measurable for the ground**: the viewer's swipe holds 16.7ms frames blurred or flat, even at
  twice the radius under a 6x CPU throttle.

## The event's head: the atoms on a photograph

The album's cover and the hub's head ([guest-flow.md](guest-flow.md), [host-app.md](host-app.md)) stand their
controls on a photograph, which no paper atom was made for. Their atoms live in `src/components/ui/` under one
contract: the hooks below are what a lab sheet styles the atoms by while production draws them, so a name here never
moves without both (a rule naming a hook the atom does not draw reaches nothing).

| Hook | The atom |
| --- | --- |
| `data-slot="shutter"`, `data-state` `idle` / `sending` / `done`, `--progress` (0 to 1) | `ui/shutter.tsx`: the round Add at an album's foot, its ring the album's light |
| `data-surface="photo"` | any container standing on a photograph (`EventHead`, the guest header on the cover) |
| Button `data-variant="on-photo"` | the white primary on a photograph |
| Button `data-variant="glass"` (with `size="icon-cta"`) | the glass round beside it |
| `data-slot="code-mat"` | `ui/code-mat.tsx`: a scannable code on its white mat, always a button |
| `data-slot="code-chip"` | `ui/code-chip.tsx`: the code's glyph, not the code itself, on white in a sticky bar |
| `data-slot="glyph-count"`, its number's `data-n` | `ui/glyph-count.tsx`: an icon and a number (a readout), its words on hover, focus and a tap |
| Badge `data-variant="live"` | the live mark: `--signal` and the word as a readout |

- **A photograph is the room**: a head wears `dark` with `data-surface="photo"` in both themes, so every token its
  words and atoms read is the room's; a `text-white` over paper tokens is the half-painted subtree (the identity
  section).
- **An atom a server page draws takes its glyph as an element** (`GlyphCount`'s `icon={<Images />}`): a component is a
  function, and a function cannot cross from a server page into a client atom.
- **A head's motion is its own sheet's** (`event-experience-head.css`, every keyframe `head-`): the cover's stills
  dissolve in CSS, so they run from the first byte, and reduced motion stands them still.

## The album tile

One tile, `shared/album-tile.tsx` (`AlbumTile`), draws every album grid, laid out by `shared/masonry.tsx`
(`MasonryColumns`): the guest album (`GalleryRows` wraps it), the host's album, the bin and the personal feeds. The
admin's `ModerationTile` stays its own: a report is not an album. It lays out as masonry (the default), uniform (a
fixed aspect: the Reel and Review) or `rows`, the justified album, windowed (`shared/album-window.tsx`, opt-in until
each surface switches). Each file's header carries its mechanism and the traps it guards. Measure a change on a
production build with `scripts/album-perf.mjs` at `/design/album-scale` (the grid over 1,145 photographs;
`?surface=host` is the hub's album there, over one fake server answering as the real routes do).

- **A tile shows state, not controls**: at most an active like, a play mark and a like count; on a phone that is the
  whole tile, and every action lives in the viewer. At a desk the surface's `tileActions` ride one glass pane (the
  host's verbs: [host-app.md](host-app.md)), `display:none` until the tile is hovered or the keyboard is inside it
  (`data-kbd-focus`, written by the grid), since even a pane collapsed to zero width composites one blur a photograph.
- **A tile renders only when what it draws changes**: it is memoized on its data, holds no handler of the grid's (the
  grid answers every control from one delegated click and one long-press; the tile hears only its open button's own
  keyboard focus, for its halo) and reads its like per id (`useIsLiked`), so a per-tile closure or JSX prop
  (`renderOverlay` is compared by identity) re-renders the whole album.
- **A tile never changes parent**, since a tile that changes parent remounts, dropping its decoded image to the
  shimmer and replaying its entrance: the measured columns are places in one box (`placeColumns`), the rows one flex
  container broken by hand, and items go to explicit columns (`distributeColumns`) rather than CSS columns, which
  re-flow every column when a photograph lands.
- **`rows` justifies like a typesetter** (`lib/shared/album-rows.ts`): optimal breaks over the whole album, so every row
  fills the width; three density steps set photos per row by the box's width (`ROW_CLASSES`), never pixels, one index
  in the shared `pr_tile_size` cookie. A partition beats the best only past a tie (`TIE`), the one met first standing:
  `Math.log` and `Math.pow` are implementation-approximated, so Node and a browser would otherwise settle a tie a last
  bit apart and lay the album out differently (`album-rows.test.ts` simulates a second engine).
- **Nothing a reader is looking at moves**: a full re-solve runs only on load, a resize, a step change and a filter; an
  arrival or a hide re-solves a pinned window of at most four old rows, and a change outside the rows in view never
  re-lays them (`rowsInView`); and the window pays a change by scrolling exactly as far as the photograph at the view's
  top moved (`overflow-anchor: none`, since the browser cannot anchor through a spacer and Safari has no anchoring),
  waiting out a touch flick, since a scroll written mid-flick stops it. What lands out of sight is said by one glass
  pill (`album-window-news.tsx`).
- **The rows mount only around the view** (`lib/shared/album-window.ts`), the keyboard's row pinned; a scroll reads the
  view by arithmetic on a cached offset, never a rect, since a rect read mid-frame forces a layout every frame.
- **An arrival settles** (guest-moments r1's `batch=settle`): the rows write `data-entering` on what their reflow
  brought in, in the same render (a surface's mark lands a commit later), and `arrival.css` lifts it, whole and lit,
  over the neighbours gliding out of its place (never a wipe or a fade: its batch was let in drawn,
  `use-arrival-gate.ts`).
- **Density is the View menu's slider and a pinch** (`density-control.tsx`): the slider's stops are menu radio items,
  since a thumb inside a menu is unreachable by keyboard; a pinch, a trackpad pinch or ctrl and the wheel over the grid
  steps, anchored on the photo under the gesture.
- ★ **The open item is an ID, never a position**: items mutate under an open viewer, and a stored index silently points
  at another photograph, the one the viewer's next act would land on.
- **A tap hands the viewer its origin**: the viewer grows from the tile's rect (`data-media-id`) and drops back into the
  tile showing at close (a windowed album scrolls to it and mounts it first, `scrollToId`), focus returning there.
- **A tile shimmers until its photograph decodes, then fades it in**, only while on screen and after a beat, so a
  cached photograph never flickers (one already complete when it mounts shows at once). The first row loads eager and
  first, every photograph decodes async, and a mounted tile keeps its URL across a presign rollover (the same object
  path), taking the fresh one only on an error.
- **Only the guest album staggers, and only its first paint**: whether a tile enters is decided once, at mount, so a
  windowed row scrolled in later lands still.

## Motion

Four house curves, under 300ms in UI, exits faster than entrances (the Library plays them): `--ease-emphasis`
(entrances, UI), `--ease-in-out-strong` (moves, toggles, large ambient surfaces), `--ease-drawer` (sheets) and
marketing's `--mkt-ease-pop` (bounces). Exits compose through `data-closed:duration-*`, and primitives name their
transition properties rather than `transition-all`, so nothing they did not mean to move animates.

- **A background wash is a crossfade, not an entrance**: `--ease-emphasis` front-loads its change, so a full-width
  glass layer on it snaps. Ambient surfaces take `--ease-in-out-strong`, asymmetric by riding the open state (the
  overlay header).
- **The visible state is the default; the hidden state belongs to the trigger**: an element hidden until an observer
  fires stays hidden wherever it never fires, so arrival hooks (`[data-mkt-develop]`, `[data-mkt-rule]`,
  `[data-mkt-entering]`) fire on `@starting-style`, and the observer grammar (`[data-mkt-reveal]` with `Reveal`) is only
  for beats about scroll position. The failure mode is then "no animation", never "no content".
- **Reduced motion**: a global guard clamps durations to `0.01ms`, never `0` (radix's exit-unmount and the viewer's
  settle wait on `transitionend`), and stops infinite loops; component gates stay the first line. The clamp is
  `!important` in `@layer base`, which beats every plain declaration and an important one in a later layer or outside
  every layer, so a fade meant to run under reduced motion sits beside it, `!important` in `@layer base`
  (`doorway.css`); written anywhere else it ends in a frame, silently. The guard creates no transition of its own (its
  default property is `none`, so a script's size write and read stay in step; `reduced-motion-guard.test.ts` reads the
  sheet), and a layout property that does declare one stays stale in the same task at any duration: read it through
  `getAnimations()`.
- **A filling animation outranks every author declaration**: an `animation-fill-mode: both` entrance (`[data-mkt-cut]`)
  holds its last keyframe forever over any later rule on that property, which DevTools still shows as matching. Put the
  entrance on an inner element and the interactive state on the outer one.
- **`:has(:focus-visible)` matches but does not reliably repaint** in Chromium, so a state hanging on it alone is dead;
  use `:focus-within` wherever a click pinning the state is acceptable.
- ★ **JS reads a CSS time through `readCssMs`** (`lib/shared/read-css-ms.ts`), never `parseInt`: the production
  minifier ships `2500ms` as `2.5s`, so a `parseInt` reads 2, and only on a production build.
- **Three techniques**: arm a size morph only when there is a previous size (`data-swap`), or a late-measured 0×0 frame
  animates as a wipe; put an animated `backdrop-filter` on an inert `-z-10` sibling whose opacity fades, since toggling
  it on the bar snaps and repaints every descendant blurred; and a measured indicator suspends its transition and
  forces a reflow on first placement, or it flies in from x=0.
- **FLIP and drag are hand-rolled** (no motion or drag library): `useFlip` inverts both axes, `runFlip` is the one copy
  of the maths (every rect read before any style is written), and `useSortableGrid` drops by index arithmetic on a
  uniform grid, with a long touch press so a scroll never reorders, and keyboard reorder for free.
- **The two-beat set change: removal and reflow are never the same beat.** Leavers exit together, then the set commits
  and the FLIP moves the survivors, or the eye cannot tell what left from what moved. The exit and the FLIP sit on
  separate elements, or the FLIP's inline `transition: transform` clobbers the exit (`[data-mkt-exiting]` /
  `[data-mkt-entering]`, `[data-review-tile][data-exiting]`).
- **The motion tuner** (`dev/motion-tuner.tsx`) writes CSS vars inline where they are declared (`<html>` for `--tune-*`
  and the radii, `[data-mkt]` for `--mkt-*`), so any var-backed timing tunes live on the real pages; its candidate
  block (`setCandidateCss` in `tuner-store.ts`) lets a board hand the site one CSS paste behind `?key=`. A baked value
  moves in three places together: the CSS default, the tuner config's `default`, and any JS fallback (via
  `readCssMs`).

### The floating-layer contract

`floating-layer.ts` (`src/components/ui/`) exports what every floating panel wears, so no primitive answers it locally:
`floatingCorner` (`rounded-float`) around rows derived from the panel's own padding; `floatingEntrance` (anchored) and
`floatingEdgeEntrance` (the sheet's slide); `floatingGutter`, the 8px an anchored layer keeps from the glass; and
`floatingClock`, whose three rungs follow frequency: instant for what opens dozens of times an hour (a tooltip, a
dropdown, a select), standard for a popover or dialog, edge for the sheet. The light is `shadow-layer`, the ground's own. `sonner.tsx` sits outside the family by name; the QR mini-modal's View
Transition is its one sanctioned hole ([host-app.md](host-app.md)).

- **Two materials, by what a layer is for.** A quick layer, what a press opens and the next press closes (a menu and
  its submenu, a select's list, a popover, the Add's rows, the palette, a tooltip, a toast), is the display:
  `floatingDisplayPanel` (`floatingTip` for a tooltip's capsule) on the `.surface-display` ground, the camera's own
  screen, near-black on paper and lit graphite in the room, its edge light rather than a ring (the bright edge). A
  work layer, where a host does something (a dialog, the popup's shapes, the Sheet), is the body's:
  `floatingWorkSurface`, which `PopupContent`, the Dialog and the Sheet all read, over `floatingScrim`. A body panel
  that is neither (the marketing nav's, the code card) keeps `floatingPanel`, the ground's popover and its ring.
  Whatever a quick layer holds reads the screen's tokens and names no colour of its own, which `ui/display.test.ts`
  holds.
- **The product has one responsive `Sheet`** (`ui/sheet.tsx`, opted into with `responsive`): a side panel at a desk, a
  bottom sheet in a hand. It emits `data-side="responsive"`, so none of the fixed-side rules can race it, and its
  posture pair lives in `floating-layer.ts`; the guest's door and its held sheets and the upload failure sheet wear it;
  every other popup opens through its kind.
- **Every popup names its kind** (`ui/popup-kinds.ts`, the one table: list, confirm, form, choice, share, plan,
  settings, peek, each with a desk shape and a hand shape), so a later answer on a kind is one row. `PopupContent`
  (`ui/popup.tsx`) wears the Dialog's and the Sheet's shapes from `floatingPopupShapes`, each scoped to the `data-shape`
  the element sets for the width it opens at, so a dialog is sized with `size`: the shape's scoped rule outranks a
  width class. The own shapes are `ui/responsive-menu.tsx`, the code card (`app/share/code-card.tsx`) and the look
  (`social/guest-peek.tsx`); a bare `SheetContent` or `DialogContent` is named with why in `popup-kinds.test.ts`.
  `PopupBody` is the one part that scrolls.
- **A confirm speaks as an `alertdialog`** (`role` is a column of its kind's row, spread only where a row names one,
  never as `role={undefined}`, which would erase Radix's own), so anything asking whether a layer is up asks
  `layerIsUp()` (`ui/layer-is-up.ts`, the one home of the layer roles; `layer-is-up.test.tsx` refuses a hand-written
  dialog selector), and a test proving a confirm gone asks for `alertdialog`, or it passes for nothing. A surface that
  is itself a layer and owns the keys (the viewer's arrows) asks `insideAnotherLayer(target)` instead: the layer the
  key came from, so a layer stacked over it takes its keys and one under it never does.
- **In a hand, a screen, a cover or a sheet is a place the phone's Back closes** (`ui/popup-back.ts` on
  `lib/history-entry.ts`, whose header holds what Next does to an entry), so Back peels one layer a press: a question
  (a dialog) holds an entry only over another layer (the viewer's Delete, a look's Block screen) and none over the
  bare page, and a page that already routes the place (`routed`, `?room=`) keeps its own. Entries leave in stack
  order, one landing at a time, a person's Back pops only the top one, and a push waits for a Back of ours still on
  its way; a reload's dead entry (a marker this page life never wrote) is stepped over as the first popup hook or the
  album mounts. A link inside a place replaces the place's entry as it navigates, so Back from the next page lands on
  the page beneath, never on a same-URL entry with nothing open; and an entry whose popup has gone another way is
  stepped over when a press lands on it, the way the press was going: one a person's Back (or ours) left above the
  window only a Forward reaches, and it is undone, the popup beneath untouched; one left under a page the popup's act
  went on to (`router.push`, a server action's redirect) is gone over Back to the page beneath, or Forward again. The
  way out for Stripe's page goes Back over the places' entries without closing them (`ui/popup-back-way-out.ts`).
- **Focus** lands on the popup itself in a hand, never its first field (which would raise the keyboard into a surface
  still arriving), and where the row's `deskFocus` says at a desk; a popup with no trigger of its own gives focus back
  to the control that opened it, inside the layer still open behind it when it was stacked over one, and a menu or a
  listbox, which close as the next popup opens, is never a return target.
- **A layer a tap opened takes no tap until it has settled**: it is hit-testable from its first frame, so a double
  tap's second tap would land on the row beneath, or on the scrim and close it; `PopupContent` swallows a press inside
  it, and refuses the scrim's outside press, while its own entrance or exit animation runs (`ui/popup.tsx` holds how).
  A harness that clicks a popup right after opening it is swallowed too: wait for it to settle.
- **Every shape stands on the keyboard** (`src/lib/use-keyboard-inset.ts`, which holds what iOS does to it):
  `visualViewport` sets `--kb-inset` and `--vv-h`, a sheet stands on the keyboard with its ceiling at the visible
  height (a centred shape centres in it), `data-keyboard` reads `open` or `tight`, and `floatingKeyboardFoot` with
  `data-sheet-primary` keeps the primary action sticky at the foot while typing. An `overflow: hidden` ancestor defeats
  the sticky foot (use `overflow: clip`), and a fixed-height flex child inside the sheet needs `shrink-0` or it clips
  instead of scrolling.
- **Every layer portals into the container its page provides** (`ui/portal-container.tsx`; `portal-container.test.ts`
  refuses a radix `.Portal` that does not ask). Nothing in the product provides one, so a layer lands on
  `document.body`; the lab's `Frame` provides its own body, so a production page drawn in a frame opens its layers
  inside the page, never over the lab.
- **A submenu stays in its `Portal`**: inside the scrolling, transform-animated `Content`, the transformed ancestor
  becomes the containing block for fixed descendants, so an unportalled submenu opened mid-close keeps a real box and
  paints nothing. Two levels read simpler, so a branch that wants a third is a group of its own under its name
  (guidance, not a fence: `Sub` nests as deep as Radix allows).

## Toasts

One `Toaster` (`ui/sonner.tsx`) in the root layout: top centre, clear of every fixed-bottom control, and always
expanded, since a phone has no hover to open sonner's pile. Its offset cannot read `--mkt-header-h`, which is scoped
to `[data-mkt]`, a sibling scope.

- ★ **A toast published from a mount effect on a full page load is never seen**: the root layout draws `<Toaster />`
  after `{children}`, effects run in tree order, and sonner shows a toast only to a Toaster subscribed when it is
  published (it keeps a history and replays nothing). Say it a beat later, from a timer that outlives the effect (Strict
  Mode runs the effect twice, so a timer cancelled on cleanup loses a word taken once): `drive-flag.tsx`'s return word
  and the boom probe's crash are the two that met it, and a client navigation, with the Toaster already there, hides it.
- **An error waits for a press**, since a failure that vanishes unread repeats itself (sonner has no per-type
  duration, so `ui/sonner.tsx` patches `toast.error` once at load).
- **A toast is pressable over an open modal, and a press on one is inside every layer**: an open Radix modal sets
  `pointer-events: none` on the body and reads any press outside it as its cue to close, so without this a toast's
  Undo would close the panel at a desk and go through to the control beneath in a hand. The band takes pointer events
  back itself and is a Radix `DismissableLayer.Branch`, in `ui/sonner.tsx` alone (`sonner.test.tsx` pins both halves).
  A keyboard still cannot reach a toast while a modal holds focus.
- **Every toast is the display, and its state is a light**: its glyph lit in its tier's colour (a success Ready's green,
  a warning the amber, a failure the red, an info Standby's muted grey), and a destructive act that succeeded is a
  success. `ui/sonner.tsx` hands sonner the display's colours
  and runs its dark theme, and globals.css's toast rules say why they sit three attributes deep (sonner appends its
  sheet after ours at runtime), so a check reads the computed colour, not that the rule loaded. The toast's edge light
  and the halo on it and on its buttons are composed there past sonner's own rules for the same reason.
- The only helpers are `showErrorToast` and `showActionError` (`lib/errors/toast.ts`), and the one Undo,
  `showUndoToast` (`shared/undo-toast.ts`): an act that already landed, named on its surface's one toast, whose Undo
  puts the items back first and then reverses on the server. `vitest.setup.ts` mocks sonner globally for the component
  project (a unit test mocks it itself); `vi.unmock("sonner")` is the escape.

## The arrival choreography ("Calm + 700ms")

The guest's arrival is a sanctioned exception to the 300ms ceiling, because it happens once (the reel reveal and
marketing's reveal are the others): the entry sheet enters on the Sheet's edge clock after a beat, while everything
repeated stays fast ([guest-flow.md](guest-flow.md) holds the acts). Its attributes (`data-arrive`, the step handoffs,
`data-unlock-success`, `data-reveal` behind `[data-reveal-curtain]`) are `@starting-style` with reduced-motion fades;
the timings live in `use-arrival-beat.ts` and `use-success-hold.ts`. The door's beats (the text reveal,
`[data-door-line]` in `door.css`, and the success check in `door/lit.css`) take the same exception; the check writes the
house bounce inline, since `--mkt-ease-pop` lives on `[data-mkt]`.

## Errors: the taxonomy and the boundaries

- **Every failure code is in one union**, `ErrorCode` (`src/lib/errors/`); each route's result union fits inside it,
  and `codes.test.ts` fails the build on a code without copy. A failure is `{ ok: false, code, message? }`, surfaced by
  `showActionError` / `showErrorToast` (the producer's message, then `FALLBACK_MESSAGES[code]`, then a default), in plain
  language with no internals.
- **Every route group's `error.tsx` draws the shared `RouteError`**, tagged `render:<area>` in Sentry, showing a help
  line and the `digest` as the support handle. ★ **It never renders `error.message`**: that is the security invariant
  (an error's message can carry internals, a client-side one unredacted).
- **Try again is Next's `unstable_retry`** (the router's refresh with the reset, `TryAgain`) on every crash screen,
  `global-error`'s included, since a bare `reset` re-renders the payload that crashed (`route-error.test.tsx`).
- **The root `error.tsx`** (`render:root`) catches a crash in a group's own layout, which no group boundary can;
  `global-error.tsx` (`render:global`), dependency-free (its own html, inline styles), covers the root layout's death.
  Two failures, told apart by area in Sentry, never by the stack.
- **`captureError` lives in the crash wrappers only**, never in `NotFoundScreen`, where it would file every real 404.
- **Verify the chain on a production build** with the gated `/design/lab/tools/boom` probe (dev shows the overlay): bare,
  it crashes the page into the root `error.tsx`; `?boundary=global` crashes the root layout itself into
  `global-error.tsx`, by a toast whose element throws, which the layout's own `<Toaster />` draws beside `{children}`
  (`root-layout-crash.tsx`; the toast waits a beat after mount, since the Toaster subscribes after the page's effect).
- The 404 pages are [marketing-content.md](marketing-content.md)'s.

## The craft guidance stack

The craft defaults for UI work are the in-repo skills in `.agents/skills/`: `emil-design-eng` for every UI change
(motion by frequency, press feedback, custom easing, `@starting-style` entrances, reduced motion), `transitions-dev`
for a transition's recipe while building, and `transitions-polish` for tuning motion that already ships. They are
defaults: depart from one on purpose and say why.

The lab and production are both provisional: a specimen is often an early prototype of future UI and a shipped surface
sometimes a minimal stand-in, so a minimal production surface is no evidence against a specimen. A proposal that does
not fit its surface means the placement is wrong, or the surface is provisional and will grow into it (design the two
together in its round), or the surface should change on its own merits, argued from what it should be and never from
what the effect needs. Which one is usually roadmap knowledge: ask.

## The /design lab

The lab (`src/app/(dev)/design/`) renders on the real tokens; a board is one folder in `sandbox/` (its spec, its
board, its own sheet and scenes), found by the registry and the board route and retired by deleting it.

- ★ **A page-level gate cannot close the lab, because the shell layout has already rendered the nav** (every component,
  board and track by name), and a layout cannot read `searchParams`: a keyless request would answer 200 with the nav in
  the flight payload. So `src/proxy.ts` runs `designGateOpen` on every `/design` request (a refusal rewrites to a real
  404) and forwards the key as `x-design-key`; the pages still call `requireDesignKey`. Never wrap the shell's page in
  Suspense (its `notFound()` would answer 200), and never read the key there with `useSearchParams`. The gate lives
  outside the lab (`src/lib/design-gate/`), because production depends on it; `pnpm lab:smoke --production` proves it.
- **No keyless request may leave the lab's tab**: Next fetches the route tree of every prefetched URL that has a query
  again without it, every lab URL has `?key=`, and the gate 404s the keyless one, a console error per link on a
  production build (dev never prefetches). The lab's own links say `prefetch={false}` (`LabLink`, the step, the doc
  reader; `_shell/prefetch-policy.test.ts` scans for one that does not). A link a board draws cannot be switched off
  from the frame (`next/link` reads no context of ours, and a null router would break `useRouter()` in every production
  component beside it), so the shell's `PrefetchGuard` answers a keyless prefetch of a `/design` URL with the gate's
  own 404 before a request exists; a scene route outside the shell group is its own document and mounts the guard
  itself.
- **Two Tailwind entries, one theme**: globals.css excludes the lab and `docs/` from its scan (`@source not`), and
  `design.css` compiles the lab's utilities while `@reference`-ing theme.css, so the lab compiles nothing if it
  references globals.css, and a theme set's values stay in globals.css (theme.css holds only the variant and
  `@theme`).
- **The lab's utilities sit in the `utilities.lab` sub-layer**, or its unprefixed `grid-cols-1` would beat a production
  section's `lg:grid-cols-12` and every real section on a board would lay out as its phone version. A board overrides
  production through its own sheet or `cn()`.
- **A breakpoint prefix inside a board's `Stage` reads the real window, not the canvas**, so a board silently reviews
  the wrong layout: board markup keys off the `mode` prop, and phone chrome is judged in an iframe at 375.
- **`design.css` declares no keyframes**: keyframe names are document-global, and a lab one would shadow production's
  on every `/design` visit.
- **A lab rule's `:has()` styles only its own element**: production's `group-has-*` utilities are on every lab page,
  and with them a `:has()` in an earlier compound (`.a:has(b) .c`) makes Chrome restyle `.a`'s whole subtree on any
  insertion beneath it. A `:has()` in a rule's subject re-matches that element alone and hands its children the answer
  as an inherited custom property (`--lab-wide-toc`); `design-css.test.ts` holds the sheet to it.
- **A portalled `Frame` is a window of its own** (`frame-window.tsx`): a link or a form pressed in it goes nowhere; its
  scene mounts once the frame's copied sheets have loaded; the media hooks read the frame's window
  (`MediaWindowProvider`), so a frame at 375 draws the phone's branch; a layer opens inside it, its scroll lock and
  focus guards on the frame's body; and it carries its own `GlowFilter`. Still the lab's: a direct `window.matchMedia`
  in production, radix's focus trap, an `IntersectionObserver` with no root (its root is the lab's viewport, so the
  hub's cards row folds into its pills wherever its frame stands: a board draws the resting row from its parts), and
  history (a place popup drawn open at a hand's width costs the tab's Back one press); and a frame's elements wear the
  frame's own prototypes, so production's `instanceof HTMLElement` answers false there.
- **A frame takes its pane's theme and its option's pause** (`frame-theme.ts`, `frame-pause.ts`). A portalled scene
  wears the class of the nearest `.dark` or `.surface-paper` above its frame (the page's with none) and follows it while
  open, so the Specimen's light and dark split draws it once in each; a routed frame keeps its site's own provider's
  theme. A frame in a hidden option holds still: the step's `data-paused` on a view cannot reach a document of its own,
  so `Frame` mirrors it into the one it holds, routed or portalled and on every new document. The root wears
  `data-lab-paused`, one adopted rule freezes every CSS animation under it, and its video and audio stop (one that starts
  while hidden is stopped as it starts) and start again only if the frame stopped them. A loop in script is the frame's
  own and reads that mark; a board needs no bridge of its own.
- **The Library draws what answers to the screen in a frame pair** (`library/device-frames.tsx`: a laptop's 1440 zoomed
  to the column and a phone's 375 beside it, each a portalled `Frame`), and four things follow that no frame tells you.
  ★ `lab:smoke` reads server HTML and a frame mounts on the client when the reader nears it, so a scene in a frame is
  never rendered by the crawl: the demo's own test and a real Chrome are its proof. ★ A popup focuses what it opens and a
  frame is a window of its own, so a scene drawn open took the keyboard into the frame as the reader scrolled toward it
  (the arrow keys and the space bar stopped scrolling the page): the frame's body stands inert for the arrival
  (`QuietArrival`), then lets go. ★ `useKeyboardInset` reads the LAB's window, so a field focused in a frame lifts
  nothing: the keyboard is a stand-in that writes the hook's four things (`--kb-inset`, `--vv-h`, `--vv-top`,
  `data-keyboard`) and holds them against the hook's own clearing. ★ Next's dev check for a `fill` image told
  `sizes="100vw"` compares its width with the LAB's window, so a full-bleed plate (`PhotoSection`) is drawn in a frame as
  wide as the window (a phone-wide frame in a laptop's window warns; so does a plate in the Library's column), and an
  image in a frame is never the lab's largest paint (no LCP warning). Two popovers drawn open in one jsdom document
  leave neither standing, so a test draws one screen at a time.

## Gotchas / don't-revert

- **A bare `<code>` element renders in a mono stack with no class at all**, as do `<pre>`, `<kbd>` and `<samp>`:
  Tailwind's preflight gives those four a monospace default, which no `font-mono` grep finds. Give them `font-sans`
  (the `Kbd` atom is the model), and a prose container `prose-code:font-sans`.
- **Two mask layers on one element never intersect in Chrome**: `mask-composite: intersect` composites the last layer
  against transparent black, so the pair resolves to the union. Split the masks across two nested elements.
- **Chrome draws an `outline` or a border width in whole CSS pixels**: 1.5px is drawn 1px at every device scale, so a
  line that must read 1.5px is a `box-shadow` spread.
- **Radix's `Portal` renders its children one commit after it mounts**, so an effect keyed on a dialog opening finds
  no element: the viewer binds its stage and media through callback refs held in state, and keys its effects on those.
- **A Radix radio group is a Tab stop of its own that hands focus to its checked item**, right only while it holds
  nothing but radios: a card that holds a control before the checked one (the door's (i)) loops Shift+Tab back onto the
  checked card and Tab skips those controls. Settings' cards take the group out of the order once a card is chosen and
  make the chosen card's radio the stop (`event-settings/radio-cards.tsx`), and a card chooses on its own press, never
  the group's `onValueChange`, which never reports a press on the card already chosen.
- **A tap never opens a tooltip on an icon control** (`ui/tooltip`'s `TooltipTrigger` refuses a focus a finger or a pen
  began, and its arrow takes no pointer): a touch's compatibility mousedown comes after its pointerup, so Radix opened
  the tooltip on that focus and its arrow slid over the trigger's edge and took the tap. A control whose words are the
  thing asked for (a glyph with no label, a table row's fine print) wears `TapTooltip` instead, the one press model: a
  tap toggles the words, a cursor's click keeps them open (Radix dismisses at the press of its own trigger, so a click
  would blink them), a key toggles, and the rich tooltip mounts after hydration with the words as the `title` until then.
  It reads its face as an element, which a server component hands a client one as a lazy reference (`children.props` is
  undefined: a 500), so it is drawn from a client component, as `GlyphCount`, `RowTip` and the Library's demo are.
- **A full-width `inset-x-0` overlay above a gesture track eats the gesture** across its flanks, killing swipe
  navigation on every viewer at once: the box takes `pointer-events-none`, its controls `pointer-events-auto`.
- **`src/components/ui/*` keeps the shadcn generator's style** (no semicolons, `.prettierignore`d) while app code uses
  semicolons: reformat neither toward the other.
- **Vendored code (`src/components/vendor/*`) is verbatim third-party source**: prettier and the em-dash policy look
  away and eslint relaxes two rules there, so no gate catches a restyle. Compose on it from your own file and mark any
  unavoidable deviation `PARTYREEL:`. The one package is border-beam (MIT), vendored because a hand-port pushed our
  low-chroma five into a palette tuned at the gamut edge.
