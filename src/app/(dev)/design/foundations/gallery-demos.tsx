import { Glow } from "@/components/shared/glow";

import type { GalleryEntry } from "../gallery/entry";

/**
 * THE ONE COMPONENT ON THE FOUNDATIONS PAGE. Everything else here is a token,
 * not a component, so the page keeps its own hand-written swatch and specimen
 * sections; Glow is the exception, because the engine IS the light token set
 * made visible and belongs beside the lamps it reads.
 *
 * Its family is "foundations" rather than "patterns" even though the file sits
 * in src/components/shared: `family` names the page that MOUNTS the specimen,
 * which is what the design-rules collector records as its route.
 */
export const FOUNDATION_ENTRIES: GalleryEntry[] = [
  {
    id: "glow",
    family: "foundations",
    section: "Light",
    play: "glow",
    variants: [
      {
        prop: "shape",
        source: "prop",
        options: ["seam", "throw", "sweep", "bloom", "halo"],
        note: "The recipe, and the only required prop. A seam hangs off an edge, a throw lands on a surface, a sweep travels, a bloom is a one-shot and a halo rings the object.",
      },
      {
        prop: "drive",
        source: "prop",
        fallback: "mask",
        options: ["mask", "transform", "scalar"],
        note: "Which mechanic moves the light: the shipped mask, a compositor transform, or no clock at all so JavaScript can set the target.",
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
        label: "A seam on the ink slab",
        hint: "shape=seam · the footer's light",
        node: (
          <div className="relative h-40 overflow-hidden rounded-lg bg-gallery">
            <Glow shape="seam" />
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
              itself to its positioned parent.
            </p>
          </>
        ),
      },
    ],
  },
];
