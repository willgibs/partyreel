import type { CSSProperties } from "react";

import { Glow } from "@/components/shared/glow";
import { SectionLight } from "@/components/marketing/system/section-light";

import type { GalleryEntry } from "@/app/(dev)/design/gallery/entry";

/**
 * THE ONE COMPONENT ON THE FOUNDATIONS PAGE. Everything else here is a token,
 * not a component, so the page keeps its own hand-written swatch and specimen
 * sections; Glow is the exception, because the engine IS the light token set
 * made visible and belongs beside the lamps it reads.
 *
 * Its family is "foundations" rather than "patterns" even though the file sits
 * in src/components/shared: `family` names the page that MOUNTS the specimen,
 * which is what the design-rules collector records as its route.
 *
 * ★ THE ENTRY KEEPS THE ID `glow` AND SPEAKS THE WORD `Aurora`. The id is a
 * URL (/design/library/glow) and the code identifiers do not move; what moved
 * is the vocabulary. Will named the coloured light the AURORA and kept three
 * forms of it (2026-09-17), so the entry presents the family rather than the
 * primitive: one live specimen per kept form, each on a dark ground, because
 * the fourth ruling of that round was that none of them goes on a light one.
 *
 * ★ EVERY SPECIMEN HERE CARRIES ITS OWN `dark`, and that is not decoration. The
 * Foundations page follows the root next-themes theme, and the field's fence
 * keys off a `.dark` ancestor exactly as theme.css's dark variant does. A
 * specimen on `bg-gallery` alone is a dark-LOOKING box on a light ground, so
 * the field would correctly paint nothing there and the entry would show an
 * empty frame to every reviewer in light mode. The lab's own Stage grounds
 * itself the same way.
 */
export const FOUNDATION_ENTRIES: GalleryEntry[] = [
  {
    id: "glow",
    title: "Aurora",
    badge: "updated",
    family: "foundations",
    section: "Light",
    lede: "The coloured light of the house, in three kept forms: the SEAM, a band where two grounds meet; the THROW, cast from a point on an object; the FIELD, a whole chapter lit at its own edges. Two marks are kept beside them: the BLOOM, a one-time glow that rests lit, and the HALO, which lights an object from behind and never wraps a button. One engine, the same five hues, one clock. Never on a light ground, and composed for each place rather than stamped.",
    play: "glow",
    variants: [
      {
        prop: "shape",
        source: "prop",
        options: ["seam", "throw", "sweep", "bloom", "halo"],
        note: "The recipe, and the only required prop. Two of the five are Aurora forms (the seam, the throw); the field is mounted by SectionLight. A bloom is a one-time glow that settles to a resting light and never to nothing (kept). A halo lights an OBJECT from behind, a plate or a frame, and never a button (kept, in those words). A sweep travels and is still open on the light board.",
      },
      {
        prop: "drive",
        source: "prop",
        fallback: "mask",
        options: ["mask", "transform", "scalar"],
        note: "Which mechanic moves the light: the shipped mask, a compositor transform (what the field takes, since a chapter-scale mask repaints every frame), or no clock at all so JavaScript can set the target.",
      },
      {
        prop: "edge",
        source: "declared",
        fallback: "false",
        options: ["false", "true"],
        note: "The phase-locked edge beam, off by default.",
      },
    ],
    specimens: [
      {
        // THE SEAM, on a real boundary. The footer's own composition: the light
        // and the hairline are SIBLINGS, the parent is the positioning context,
        // and the content comes after the lamp and is positioned, so the light
        // stays behind it without a z-index anywhere.
        label: "The seam",
        hint: 'shape="seam" · a band where two grounds meet · the footer\'s own lamp',
        bleed: true,
        node: (
          <div className="dark">
            <div className="h-16 bg-muted" />
            <div className="surface-ink relative isolate bg-background">
              <Glow
                shape="seam"
                vars={{
                  "--glw-h": "210px",
                  "--glw-dur": "var(--spill-cadence)",
                }}
              />
              <div data-glw-seamline aria-hidden />
              <div className="relative px-8 py-16 text-sm text-muted-foreground">
                The ink slab, lit from the cut above it.
              </div>
            </div>
          </div>
        ),
      },
      {
        // THE THROW, under a plate on open dark. The field sits OUTSIDE the
        // plate (-inset-16) because the light comes from under it: a lamp whose
        // box IS the object is clipped to the object and hidden behind it,
        // since [data-glw] is inset-0 and overflow-hidden. Reach is a fraction
        // of the FULL field, so it stays low enough for the falloff to complete
        // inside the expanded box rather than rendering a rounded square.
        label: "The throw",
        hint: 'shape="throw" · cast from a point on the object · --glw-from-y is the vector',
        node: (
          <div className="dark flex justify-center bg-background p-10">
            <div className="relative isolate" style={{ width: 168 }}>
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-16"
              >
                <Glow
                  shape="throw"
                  vars={{
                    "--glw-from-x": "50%",
                    "--glw-from-y": "72%",
                    "--glw-reach": "72%",
                    "--glw-strength": "0.5",
                    "--glw-base": "0.5",
                    "--glw-blur": "22px",
                    "--glw-dur": "var(--spill-cadence)",
                  }}
                />
              </div>
              <div className="relative rounded-2xl bg-white p-5">
                <div className="aspect-square rounded-xl bg-gallery" />
              </div>
            </div>
          </div>
        ),
      },
      {
        // THE FIELD, at chapter scale, through the component that owns it. The
        // copy sits in the clean band BETWEEN the two lamps, which is the half
        // of the grammar that is easiest to get wrong: a fill behind everything
        // puts the copy in the light instead.
        label: "The field",
        hint: "<SectionLight placement> · composed for the place · 24s, three laps of the lamp clock",
        bleed: true,
        node: (
          <div className="dark bg-background">
            <SectionLight placement="both">
              <div className="mx-auto max-w-md px-8 py-28 text-center">
                <h3 className="text-2xl font-semibold text-foreground">
                  A chapter, lit at its own edges
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Two bands, the bottom one the top one flipped on its own axis,
                  with the copy in the clean band between them.
                </p>
              </div>
            </SectionLight>
          </div>
        ),
      },
      {
        // THE BLOOM, kept 2026-09-17: a one-time glow that RESTS LIT. The QR
        // plate's shipped lamp is this recipe (qr-hero.tsx); the base is what
        // the ignition decays to, so the object stays lit after the moment.
        label: "The bloom",
        hint: 'shape="bloom" · one run on arrival, resting at --glw-base · the QR plate ships it',
        node: (
          <div className="dark flex justify-center bg-background p-10">
            <div className="relative isolate" style={{ width: 168 }}>
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-20 -z-10"
              >
                <Glow
                  shape="bloom"
                  vars={{
                    "--glw-from-x": "50%",
                    "--glw-from-y": "50%",
                    "--glw-reach": "60%",
                    "--glw-strength": "0.95",
                    "--glw-base": "0.34",
                    "--glw-blur": "26px",
                  }}
                />
              </div>
              <div className="relative rounded-2xl bg-white p-5">
                <div className="aspect-square rounded-xl bg-gallery" />
              </div>
            </div>
          </div>
        ),
      },
      {
        // THE HALO, kept 2026-09-17 with its fence in Will's words: "Do not
        // like as a button wrapper, only to light objects from behind." So the
        // specimen is an OBJECT (a dark frame), the wash sits on it clipped to
        // its own corner, and its face stays clean. There is no button usage.
        label: "The halo",
        hint: 'shape="halo" · an object lit from behind, its face clean · never a button',
        node: (
          <div className="dark flex justify-center bg-background p-10">
            <div
              className="relative isolate overflow-hidden rounded-2xl border bg-card"
              style={
                {
                  width: 220,
                  height: 148,
                  "--glw-radius": "var(--radius-2xl)",
                } as CSSProperties
              }
            >
              <Glow
                shape="halo"
                vars={{
                  "--glw-blur": "14px",
                  "--glw-core": "30%",
                  "--glw-strength": "0.9",
                  "--glw-base": "0.7",
                  "--glw-dur": "var(--spill-cadence)",
                }}
              />
              <div className="relative flex size-full items-center justify-center text-xs text-muted-foreground">
                A frame, lit from behind
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "The engine's knobs",
        hint: "--glw-* · defaults in globals.css's engine block",
        node: (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
              {[
                "--glw-base",
                "--glw-strength",
                "--glw-dur",
                "--glw-blur",
                "--glw-scale",
                "--glw-h",
                "--glw-core",
                "--glw-core-blur",
                "--glw-from-x",
                "--glw-from-y",
                "--glw-reach",
                "--glw-radius",
              ].map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tune through the vars prop, never a className: the engine sizes
              itself to its positioned parent. The two clocks are tokens, not
              numbers: --spill-cadence is every lamp&apos;s, and
              --aurora-cadence is three laps of it for a field.
            </p>
          </>
        ),
      },
    ],
  },
];
