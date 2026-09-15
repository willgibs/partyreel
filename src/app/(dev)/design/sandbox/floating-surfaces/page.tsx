import type { Metadata } from "next";

import type { Ground } from "@/components/dev/board";
import { requireDesignKey } from "@/lib/design-gate/server";

import {
  DIMS,
  GROUNDS,
  RAMPS,
  SCENES,
  SIDES,
  type Dim,
  type Ramp,
  type Scene,
  type Side,
} from "./constants";
import { DIRECTIONS, type Direction } from "./directions";
import { FramePage } from "./frame-page";

/**
 * THE FLOATING-SURFACES SCENE ROUTE, the board's viewport.
 *
 * It exists because of one fact about the family this board judges: every radix
 * panel portals its content to `globalThis.document.body`. Inside the shell's
 * zoom-fitted Stage that means the panel escapes the ground it is supposed to be
 * judged on, escapes the zoom (drawing at 1.0 beside a trigger at 0.65) and
 * escapes the canvas (`position: fixed` resolving against the browser viewport,
 * so a "375" bottom sheet spans 1440). Verified on the board, 2026-09-14.
 *
 * A document of its own is the only fix that keeps the primitives untouched: the
 * board mounts this page in an iframe laid out at exactly 1440x930 or 375x760,
 * where `globalThis.document` IS the frame, `fixed` means the canvas, `sm:`
 * resolves at the canvas width (both sheet and dialog branch on it, and so does
 * the guest entry shell, which is a drawer below 640 and a dialog above) and
 * prefers-reduced-motion still applies.
 *
 * Gated like every lab route, and never linked: the board builds the URL with
 * the key it was opened with.
 */

export const metadata: Metadata = {
  title: "Floating surfaces scene",
  robots: { index: false, follow: false },
};

function one(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  return typeof v === "string" ? v : undefined;
}

function pick<T extends string>(
  allowed: readonly string[],
  value: string | undefined,
  fallback: T,
): T {
  return allowed.includes(value ?? "") ? (value as T) : fallback;
}

export default async function FloatingSurfacesScenePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const params = await searchParams;

  return (
    <FramePage
      scene={pick<Scene>(SCENES, one(params, "scene"), "family")}
      ground={pick<Ground>(GROUNDS, one(params, "ground"), "cinema")}
      ramp={pick<Ramp>(RAMPS, one(params, "ramp"), "today")}
      direction={pick<Direction>(DIRECTIONS, one(params, "direction"), "today")}
      phone={one(params, "w") === "375"}
      dim={pick<Dim>(DIMS, one(params, "dim"), "radius")}
      variant={one(params, "variant") === "drawer" ? "drawer" : "sheet"}
      side={
        SIDES.includes((one(params, "side") ?? "") as Side)
          ? (one(params, "side") as Side)
          : undefined
      }
      rung={one(params, "rung")}
      compact={one(params, "compact") === "1"}
      radius={one(params, "radius") ?? "off"}
      entrance={one(params, "entrance") ?? "off"}
      light={one(params, "light") ?? "off"}
    />
  );
}
