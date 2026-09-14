# Light, shadow and lamp: the doctrine, as proposed

> **ROLE:** the light exploration's proposal (the review wave, 2026-09-14; `lp/light`, integrated
> `ae03a94`), kept here so it outlives the track manifest: the draft doctrine that replaces the
> source-and-direction law, and what goes and what stays. **NOT LAW** until ruled; bibles 10 and 11
> inherit it and it lands in `design-system.md` (SPILL's laws, BEAM's laws, the registers, the
> elevation contract) at the ruling. The board is `/design/c/light` while it stands, four parts with
> anchors `#lgt-a` to `#lgt-d`; the three things the system does not have yet (the dark shadow
> family, the lit face's paper half, the aurora's grain) live in its sheet under the `lgt-` prefix.

**The asks on the board:** depth in dark (the cue set for stacked media cards, a layer over content
and a flat card); lamps without media (the section aurora, yes or no, and its register on cinema and
on paper); the cadence (8s or 11s); the publish beat's violet; the lit surface (`[data-lit]`: adopt,
adapt or drop). Look at part B first (the aurora at accent on cinema, then on paper: the answer to
"what is the aurora", the only part that proposes a new thing), then part A's stacked-photographs row
(the whole case for letting a shadow back into dark).

**The departures flagged on the board:**

- Part A proposes a shadow family in DARK (--lgt-lift, --lgt-float, board.css). The elevation contract still reads 'Dark: NO shadows anywhere' and --shadow-float is zeroed in .dark; bible 10's rewrite anticipates this, the values are new.
- Part A moves the ring lift into the contract. It has 77 uses across the app and appears in no document; naming it makes a fourth technique official.
- Part B lets a section retune --lamp-* for everything inside it. The engine already documents the hook and bible 3 still holds (light, never UI), but a per-chapter temperature is a new licence and it is the aurora's whole identity claim.
- Part B candidate C is the fill globals.css warns against by name ('a seam is a band, not a fill'). On the board so the warning can be tested rather than quoted.
- Part B proposes a hand-tuned paper five, replacing SPILL_REGISTER.paper's single flat row. design-system.md calls that an open design task; this is a proposal for it.
- Part D changes a ratified beat: the publish flourish's oklch(0.62 0.2 300) becomes the lamp set's 305, and the beat decays to a base instead of returning to nothing.
- Part B ships a grain layer over the aurora. An 8-bit gradient at that size bands; the grain is the fix and it is currently a generated stand-in.

### The draft doctrine (for `design-system.md` at the ruling)

**LIGHT.** One doctrine in three jobs, decided by what the light is DOING rather than by the mode or by
what kind of thing is emitting. **SEPARATE** is achromatic and static: it says one object is in front of
another (today's elevation contract, moved inside the light doctrine instead of sitting beside it).
**FILL** is chromatic, slow and always behind content: it gives a room a temperature (spill, and the
aurora it grows into). **MARK** is chromatic, bounded, and ends when its state ends (the beam, and a
moment's beat). A surface takes at most one job at a time and a view carries at most one MARK. The
identity claim underneath: light is where our colour lives, so the five hues are the whole palette of
all three jobs and nothing else on the site is allowed colour (bible 3, unchanged and now load-bearing
for three jobs instead of one).

**SHADOW.** One family, two sizes, one alpha ramp per ground. **LIFT** separates two objects of the same
lightness that overlap (two photographs, a card over a card). **FLOAT** detaches a layer from content
that keeps living behind it (menu, dialog, sheet, toast). A flat surface with nothing behind it and
nothing over it takes neither, in either mode, and keeps its step and its hairline. The geometry is
`--shadow-float`'s, unchanged (blur = 2x offset, a single top source); `float` is that geometry at
double the offsets. What changes per ground is only the ALPHA, because a shadow has to be darker than
what it falls on and 6 percent of black over `oklch(0.14)` is arithmetically invisible: that is why
"dark has no shadows" read as true for so long, and it was never the real rule. Proposed values are in
the board's sheet. The **RING** (`ring-1 ring-foreground/5` on surfaces, `/10` on media frames, 77 uses
and in no document) is the fourth SEPARATE technique and is now named: it states an edge without
implying height. The **LIT FACE** (an inset hairline plus a 1px lip) is not elevation at all, it is
material: it belongs to a face that is catching light (a media frame, a screen, a plate), and on paper
it reads off the bottom edge instead of the top, because a ground changes what light means.

**LAMP.** A lamp needs a **PLACE**, not an object: an edge, a boundary, a screen, a plate, a horizon.
That replaces "name the lamp, and if you cannot point at the object emitting there is no spill", and it
reaches every verdict the old law reached (a pill's rim is not a place, a nav panel is not a place, a
skeleton is an absence) while admitting the footer seam, which the old law forbade and which is the
model Will named. The rest of SPILL stands as written: DIRECTION (every lamp declares its vector; the
container mask is origin-anchored, so there is no even-rim mode), COLOUR (real media where it exists,
the house five where it does not, never a house token and never a state colour), FALLOFF (base and band
always ship together, because a swept layer rests off-layer and the base is how a reduced-motion
arrival still arrives). BEAM's four laws stand. Scarcity stays a DISTANCE, roughly a viewport of unlit
page between lamps, and it governs LAMPS only, never the field. The four-question LampCard stands with
question one restated: what place is the light entering from? The cadence is a lamp's, not the
system's: one register for a lamp (the board recommends the engine's own 8s) and a multiple of it for
the aurora, so `--spill-cadence` stays one token and gains a sibling.

**THE AURORA.** The aurora is the FILL job at chapter scale: the house light itself, at rest, in a
section that has no media. It is three things, and it is not a lamp. A **REGISTER**: a low base with a
band near zero, so it reads as the room having a temperature rather than as something glowing, and
higher numbers on paper than on cinema, because a tint has far less contrast with a near-white page
than with a near-black room. A **PLACEMENT GRAMMAR**: the chapter's own boundaries, its top edge and
its bottom edge, never its middle, never centred on a card or a control, and never a fill; the copy
lives in the clean band between the two. A **MOTION**: a drift several times slower than a lamp's,
because a field the size of a chapter moving at a lamp's clock reads as a screensaver. Its **COLOUR**
is the house five narrowed to a temperature by the section itself, through the engine's own documented
ancestor hook (`--lamp-*` is inherited and `[data-glw]` reads it, so a section retuning it recolours
every lamp inside it): a temperature is five of the five, re-ordered, never a sixth hue. On paper the
five take the paper register, hand-tuned per hue rather than one flat L/C row. This is how marketing
carries colour of its own where there is no media (bible 1) without growing a second palette.

**What goes.** "If you cannot point at the object emitting, there is no spill" (replaced by the place).
"One depth technique per mode" and "Dark: NO shadows anywhere" (replaced by one cue per relationship).
"Never a violet reel glow" as an absolute (replaced by: light never takes its colour from a meaning, but
a moment may lean the five toward the nearest hue, so 300 becomes 305).

**What stays.** The lamp set is light, never UI. Direction, colour, falloff. BEAM's four laws. Scarcity
as a distance. The four-question LampCard. Every animation inside the reduced-motion block, and every
lamp's rest state designed, which is the argument that decides part D on its own: the shipped publish
beat declares nothing outside its animation, so a visitor who asked for less motion is told nothing at
all when their reel goes live.
