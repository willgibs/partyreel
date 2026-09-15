"use client";

import { ENGINE_DRIVE_FIX, LIGHT_CANDIDATES } from "./candidates";
import { Part, Paste } from "./shared";

/**
 * THE DOCTRINE AS A DIFF (round two, 2026-09-14).
 *
 * Round one wrote the replacement doctrine into the track manifest's Record and
 * the spec, in prose, in its own shape. That left the Orchestrator a
 * translation job at the ruling: read four paragraphs, find the four places
 * they land in a 900-line system doc, and rewrite each in the doc's own voice
 * and table shapes. A translation at landing time is where a ruled decision
 * turns back into an interpretation.
 *
 * So this is the same doctrine in design-system.md's OWN shape: the exact
 * markdown that replaces each block, headed by the block it replaces and the
 * line that stands there today. Rule, paste, done. Nothing here is new
 * thinking; every claim is argued on a stage above it, and each block names
 * which part of the board carries the argument.
 *
 * ★ THE TWO HALVES ARE DIFFERENT KINDS OF THING AND ARE KEPT APART. The prose
 * lands in design-system.md at the ruling. The CSS blocks land in globals.css,
 * and they are the same bytes the "Apply to the site" buttons hand the browser
 * (candidates.ts is the one source), so a value cannot drift between what Will
 * walked and what gets written down.
 */

const REPLACEMENTS: {
  id: string;
  /** The heading in design-system.md this block lands under. */
  where: string;
  /** What stands there today, quoted short enough to recognise. */
  today: string;
  /** Which part of the board argues it. */
  argued: string;
  markdown: string;
}[] = [
  {
    id: "spill",
    where: 'Light: SPILL, BEAM, and the lamp set > "SPILL\'s four laws"',
    today:
      'Law 1 reads "Source. Name the lamp. If you cannot point at the object emitting, there is no spill", and the "Under exploration" paragraph under the table points here.',
    argued: "Part B, the model and the four candidates",
    markdown: `**SPILL's four laws**

| # | Law | What it kills |
| --- | --- | --- |
| 1 | **Place.** Name the place the light enters from: an edge, a boundary, a screen, a plate, a horizon. A lamp needs a place, not an object. | Decorative glow on cards, rims and controls; "anything that could use some life". A rim is not a place, a pill is not a place, a skeleton is an absence |
| 2 | **Direction.** Spill has a vector; every instance declares where it comes from. | Even rims, concentric halos, premium pill treatments |
| 3 | **Colour of the lit thing.** Real media where it exists, the lamp set where it does not. **Never a house token, never a state colour.** A moment that wants a hue leans the five toward the nearest of them; it never takes a colour from a meaning. | The glow becoming a second brand palette. Amber storage warnings |
| 4 | **Falloff.** Fades with distance, never draws an edge, sits behind content, always warped, always an always-on base under any travelling band. | The paused-state invisibility trap |

Law 1 replaced "Source. Name the lamp" at the light ruling. The old law reached the right verdict on
every case it was written for and one it was not: the footer's seam is the house light entering at
the boundary between two grounds, with nothing emitting, and it is the lamp the system is calibrated
against. A place reaches all of the old verdicts and admits the seam.

**The four-question LampCard** stands, with question one restated: **Place** (what is the light
entering from?) · **Direction** (from where?) · **Colour** (sampled from what, or the lamp set?) ·
**Admitted by** (which law lets this in?).`,
  },
  {
    id: "beam",
    where: 'Light: SPILL, BEAM, and the lamp set > "BEAM\'s four laws"',
    today:
      "The four laws stand unchanged; what is missing is the sentence that says how the three jobs relate, and the NEVER list still names violet reel glows as an absolute.",
    argued: "Part D, the publish beat",
    markdown: `**BEAM's four laws:** 1 it marks the object that is currently the LIVE SUBJECT (working, awaiting,
uploading, publishing, live). 2 One subject per view. 3 **It ends when the state ends** (a beam is a
state, never a decoration, and that is the whole difference between a live object and a pretty
border). 4 One standing exception, named so it stays an exception rather than a precedent: a premium
object at rest (Get Pro, whose card already carries stacked photographs).

**A beat is a beam's short form and obeys the same four laws**, including the fourth: it decays to a
base rather than to nothing, so the object that just went live is lit while it is live, and a visitor
with reduced motion is told the same thing without the motion. A beat that declares nothing outside
its own animation says nothing at all to that visitor, which is what the publish flourish did until
the light ruling.

**NEVER:** nav panels and dropdowns (no lamp, and the frequency doctrine forbids theater on the
most-used controls) · the storage meter near its cap and upload errors/retry (the moment spill can
mean "warning" it is a state colour and the system is decoration; failure is \`--destructive\`, full
stop) · generic skeletons (a skeleton is an absence; spill needs a presence) · every CtaBand (the
every-section-gets-a-version failure under another name) · the admin portal.`,
  },
  {
    id: "registers",
    where:
      "Light: SPILL, BEAM, and the lamp set > The lamp set, and its three registers",
    today:
      'The Paper row says "Uniform L/C today, so a hand-tuned paper five is still an open design task", and there is no register for a field at chapter scale.',
    argued: "Part B, the paper five and the register toggle",
    markdown: `### The lamp set, and its four registers

The five HUES are the identity constant: **25 coral, 85 amber, 155 green, 255 blue, 305 violet**.
What varies per surface is the REGISTER, not the hue.

| Register | Values live in | For |
| --- | --- | --- |
| **Ambient** | \`--lamp-1..5\`, [globals.css](../../src/app/globals.css) | Light falling on things: spill, the confetti canvas. Hand-tuned per hue (85 needs a higher L than 305 to read equally bright), which is why it is not one flat L/C row |
| **Paper** | \`--lamp-1..5\` under \`.surface-paper\`, [globals.css](../../src/app/globals.css) | The house five on a near-white ground, hand-tuned per hue for the same reason the ambient set is: 85 and 155 go dirty against white long before 255 and 305 do. Until the light ruling nothing re-declared the set on paper, so a media-less lamp on the paper chapter was wearing colours picked for a near-black room |
| **Sampled paper** | \`SPILL_REGISTER.paper\`, [sampled-palette.ts](../../src/lib/shared/sampled-palette.ts) | Light sampled FROM media, re-registered for a near-white ground. Uniform L/C by construction: the hues come from the photograph, so there is no fixed five to hand-tune |
| **Live** | the \`partyreel\` entry in the vendored [border-beam styles.ts](../../src/components/vendor/border-beam/styles.ts) | The beam. Same five hues, raised to the chroma a gamut-edge gradient needs, **generated by \`glow-contrast.ts\`'s \`oklchToSrgb\`**, hue held exactly. It is a DERIVED register, not a second palette. It cannot be a \`var()\`: that file regex-parses \`rgb()\` strings to compute alpha variants, so a token would silently break it. Pinned by \`border-beam-vendor.test.ts\` instead |

**The field register is not a fourth set of hues, it is a pair of knobs.** An aurora takes the
ambient or the paper five and drops the engine's base and band (the accent register, one chapter on a
page carrying the light; the identity register, every chapter carrying it, which is only survivable
much lower). Paper takes HIGHER numbers than cinema for the same presence, not lower: a tint at
l 0.88 against a near-white page has far less contrast with its ground than the same tint has against
oklch(0.11).`,
  },
  {
    id: "aurora",
    where:
      "Light: SPILL, BEAM, and the lamp set > a new subsection after the registers",
    today: 'The word "aurora" appears nowhere in src/ or docs/.',
    argued: "Part B, the four candidates on the real chapters",
    markdown: `### The aurora

The aurora is the house light itself, at rest, in a chapter that has no media. It is not a lamp, and
it is three things.

A **REGISTER**: a low base with a band near zero, so it reads as the room having a temperature rather
than as something glowing.

A **PLACEMENT GRAMMAR**: the chapter's own boundaries, its top edge and its bottom edge. Never its
middle, never centred on a card or a control, and never a fill. The copy lives in the clean band
between the two, and that band is what makes it a light rather than a wash. The middle is the failure
mode worth naming, because it is the one a wiring round reaches for: the same light at the same
register, placed at the centre, puts the copy inside the light instead of between two of them.

A **MOTION**: a drift several times slower than a lamp's, because a field the size of a chapter
moving at a lamp's clock reads as a screensaver, and on the CHEAP DRIVE, because a field is the one
place where the two drives differ in cost rather than in taste. \`[data-glw-drive="transform"]\`
moves the comet on the compositor; the default \`mask\` drive repaints a filtered layer of roughly
1500 by 360 css pixels every frame, twice per chapter. Moving the field to the transform drive takes
one line of the engine with it, and it is a law 4 fix rather than a feature: \`glw-drift-x\` runs
from \`translate: 32% 0\`, so its unanimated state is translate 0, the comet parked dead centre at
full strength, which is what a reduced-motion visitor would get. Declare that from-keyframe outside
the no-preference block, exactly as the mask drive declares its resting \`mask-position\`.
The cadence is a lamp's property, not the system's:
\`--spill-cadence\` is the lamp's clock, at whatever number the cadence ruling lands on, and the
aurora takes a MULTIPLE of it under a name of its own,
\`--aurora-cadence: calc(var(--spill-cadence) * 3)\`. Three laps, so the ratio survives the lamp's
ruling: 33s against today's 11s, 24s against the engine's 8s. The one thing it must never be is
\`--spill-cadence\` re-tuned to the field's number, which would slow every shipped lamp, the footer
seam first.

Its **COLOUR** is the house five, narrowed to a temperature by the chapter itself through the
engine's own documented ancestor hook (\`--lamp-*\` is inherited and \`[data-glw]\` reads it, so a
section re-tuning it recolours every lamp inside it). A temperature is five of the five, re-ordered;
never a sixth hue. This is how marketing carries colour of its own where there is no media (bible 1)
without growing a second palette.

**Scarcity still governs lamps, never the field.** Roughly a viewport of unlit page between lamps; an
aurora is the room those lamps are in.

An aurora at this alpha across a box this large BANDS in 8 bits, and the engine's turbulence warp
displaces colour without adding entropy, so the steps survive it. A grain tile is part of the
treatment, not a polish pass, and it is sized in DEVICE pixels: a tile laid out at its own pixel size
is doubled on a 2x screen, the dither becomes a mottle, and the band comes back on exactly the
screens most people are looking at.`,
  },
  {
    id: "elevation",
    where: "Elevation contract (one depth technique per mode)",
    today:
      'The section is per MODE: "Light: exactly one shadow family, floating layer only" and "Dark: depth is light first ... --shadow-float still resolves to a zero shadow in .dark until the light exploration writes shadow, lamp and light as one system".',
    argued: "Part A, both matrices",
    markdown: `## Elevation contract (the cue is the relationship, not the mode)

Depth is SEPARATE, the achromatic and static job of the light doctrine, and it lives here rather than
beside it. Four techniques, and which one applies is decided by the relationship between two objects,
never by the mode. The mode was never the right axis: two photographs overlapping are the same
lightness in both modes, and a menu over scrolling content has to detach in both.

| Relationship | Technique |
| --- | --- |
| A surface that is simply a different plane from the page | **The surface step.** bg 0.14 to card 0.21 to popover 0.23+ in dark, the paper steps in light. Lighter is closer |
| An edge that needs stating without implying height | **The ring.** \`ring-1 ring-foreground/5\` on surfaces, \`/10\` on media frames. 77 uses and, until the light ruling, in no document |
| Two objects of the same lightness, one in front of the other, or a media card sitting on a ground of its own lightness | **LIFT.** \`--shadow-lift\`: two overlapping photographs, a card over a card, the dashboard's event cards (a photograph with no surface step and no hairline between it and the page) |
| A layer over content that keeps living behind it | **FLOAT.** \`--shadow-layer\`: menu, dialog, sheet, popover, tooltip, toast |
| A flat surface with nothing behind it and nothing over it | **Neither shadow**, in either mode. Its step and its hairline, unchanged. A shadow here is a smudge |

**One geometry, two sizes, one alpha ramp per ground.** \`--shadow-lift\` is \`--shadow-float\`'s
shipped geometry unchanged (blur = 2x offset, a single top source) and, on a light ground, its shipped
alphas to the byte: paper was already tuned and does not move. \`--shadow-layer\` is the same geometry
at double the offsets. What changes per ground is only the ALPHA, because a shadow has to be darker
than what it falls on: 6 percent of black over oklch(0.11) is arithmetically invisible, which is why
"dark has no shadows" read as true for so long. It was never the real rule.

★ **Zeroing a shadow token still takes the INVISIBLE value** \`0 0 0 0 oklch(0 0 0 / 0)\`, never
\`none\`: Tailwind composes \`--tw-shadow\` into one comma-separated \`box-shadow\` beside the ring
slots, and a \`none\` in that list invalidates the whole declaration, taking any ring on the element
with it. The same arithmetic is why a candidate block writes \`--tw-shadow\` rather than
\`box-shadow\` on a ringed primitive.

**The LIT FACE is not elevation at all.** An inset hairline plus a 1px lip describes the MATERIAL of a
face that is catching light, and it belongs to the three surfaces that have one: a media frame, a
screen, a plate. On paper the lip reads off the bottom edge rather than the top, because a ground
changes what light means, unless the face carries its own ground: \`bg-gallery\` is declared identical
in light and dark, so it is a dark screen on a near-white page and keeps the dark form. It never
lands on a card, a panel or a control, which is the line that keeps it from becoming a fifth depth
technique.

- Components use the \`shadow-float\` utility for LIFT and \`shadow-layer\` for FLOAT; a raw
  \`shadow-md/lg\` on a primitive is a call site the light ruling re-points, not a second family.
- The dark translucent card ships WITHOUT blanket backdrop-blur (alpha composites fine; blur only
  where a surface sits over media).
- **This is also bible 15's fifth line.** The floating-layer contract's "one light, by ground" asks
  the same question for one family (lighter is closer, a soft shadow, or a lit edge); FLOAT is that
  ruling, with values, and the floating contract inherits it rather than answering it twice.`,
  },
  {
    id: "frame",
    where: "Light: SPILL, BEAM, and the lamp set > the opening paragraph",
    today:
      '"Two siblings, and picking the wrong one is the usual mistake. SPILL is light falling FROM a lit thing onto what is near it. BEAM is an object lit BECAUSE IT IS the live subject."',
    argued: "The board's opening, and the shape of all four parts",
    markdown: `Three jobs, decided by what the light is DOING rather than by the mode or by what kind of thing is
emitting. **SEPARATE** is achromatic and static: it says one object is in front of another (the
elevation contract, which is part of this doctrine and not a section beside it). **FILL** is
chromatic, slow and always behind content: it gives a room a temperature (SPILL, and the aurora it
grows into). **MARK** is chromatic, bounded, and ends when its state ends (BEAM, and a moment's
beat). A surface takes at most one job at a time and a view carries at most one MARK.

The identity claim underneath: light is where our colour lives, so the five hues are the whole
palette of all three jobs and nothing else on the site is allowed colour (bible 3, unchanged, and now
load-bearing for three jobs instead of one).`,
  },
];

const GOES = [
  '"If you cannot point at the object emitting, there is no spill" (replaced by the place).',
  '"One depth technique per mode" and "Dark: NO shadows anywhere" (replaced by one cue per relationship).',
  '"Never a violet reel glow" as an absolute (replaced by: light never takes its colour from a meaning, but a moment may lean the five toward the nearest hue, so 300 becomes 305).',
  'The Paper register\'s "a hand-tuned paper five is still an open design task" (done; the row now points at globals.css).',
];

const STAYS = [
  "The lamp set is light, never UI (bible 3), and the fence in globals-theme-contract.test.ts.",
  "Direction, colour and falloff, word for word.",
  "BEAM's four laws, and the standing Get Pro exception.",
  "Scarcity as a distance, roughly a viewport of unlit page between lamps.",
  "The four-question LampCard, with question one restated as the place.",
  "Every animation inside the reduced-motion block, and every lamp's rest state designed.",
];

export function DoctrinePart({ rules }: { rules: string[] }) {
  return (
    <Part
      n="E"
      title="The ruling, as a paste"
      rules={rules}
      lede={
        <>
          <p>
            The doctrine in design-system.md{"'"}s own shape rather than in the
            board{"'"}s: the exact markdown that replaces each block, headed by
            the block it lands under and the line that stands there today. A
            ruling is a few words and the Orchestrator pastes rather than
            rewrites, which is the difference between landing a decision and
            re-interpreting it.
          </p>
          <p>
            Nothing here is new thinking. Every block names the part of the
            board that argues it, and the CSS below is the same bytes the apply
            buttons hand the browser, so a value cannot drift between what you
            walked and what gets written down.
          </p>
          <p>
            Each block opens on its first lines and expands on the button beside
            it. Copy takes the whole thing either way, open or closed.
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-8">
        {REPLACEMENTS.map((r) => (
          <div key={r.id} className="flex flex-col gap-2">
            <div className="max-w-3xl space-y-1">
              <p className="text-[12px] font-medium">{r.where}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium">Today:</span> {r.today}
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium">Argued on:</span> {r.argued}
              </p>
            </div>
            <Paste label="The replacement" css={r.markdown} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 pt-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-[13px] font-semibold">What goes</h3>
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            {GOES.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-[13px] font-semibold">What stays</h3>
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            {STAYS.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <div className="max-w-3xl space-y-1">
          <h3 className="text-[13px] font-semibold">
            The CSS, for globals.css
          </h3>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            The same four blocks the apply buttons above hand the site. The
            token names are the doctrine{"'"}s, lift and layer; re-pointing the
            38 shadow-float call sites and the roughly 30 raw Tailwind shadows
            is the wiring round{"'"}s sweep. Until it runs, the old token
            aliases the new one on the light grounds, where the two are the same
            bytes and nothing moves. On the dark grounds it keeps its zero by
            contract, so the surfaces that take a shadow in dark are named one
            by one instead: aliasing the old token there would hand a shadow to
            all 26 of its consumers, flat surfaces included, which is not what
            any of this proposes. The fifth block is the engine{"'"}s own, and
            it is the one line the aurora{"'"}s drive takes with it.
          </p>
        </div>
        {LIGHT_CANDIDATES.map((c) => (
          <Paste key={c.label} label={c.label} css={c.css} />
        ))}
        <Paste
          label="Light: the engine's one line (the transform drive's rest state)"
          css={ENGINE_DRIVE_FIX}
        />
      </div>
    </Part>
  );
}
