import type { Metadata } from "next";

import type { Ground } from "@/components/lab";
import { requireDesignKey } from "@/lib/design-gate/server";

import {
  DIMS,
  GROUNDS,
  SCENES,
  SUBS,
  type Dim,
  type Scene,
  type Sub,
} from "./constants";
import { DIRECTIONS, type Direction } from "./directions";
import { SceneShell } from "./scene-shell";

/**
 * THE FLOATING-SURFACES SCENE ROUTE, the board's viewport.
 *
 * It exists because of one fact about the family this board judges: every radix
 * panel portals its content to `globalThis.document.body`. Inside a div that
 * means the panel escapes the ground it is supposed to be judged on, escapes any
 * zoom, and escapes the canvas (`position: fixed` resolving against the browser
 * viewport, so a "375" bottom sheet spans 1440). Verified on the board,
 * 2026-09-14.
 *
 * A document of its own is the only fix that keeps the primitives untouched: the
 * board mounts this page in the kit's `Frame`, laid out at exactly 1440x930 or
 * 375x760, where `globalThis.document` IS the frame, `fixed` means the canvas,
 * `sm:` resolves at the canvas width (both sheet and dialog branch on it, and so
 * does the guest entry shell, which is a drawer below 640 and a dialog above)
 * and prefers-reduced-motion still applies.
 *
 * ★ THE PARAMS ARE ONLY WHAT A RELOAD IS FOR. The candidate CSS arrives from the
 * parent as an adopted stylesheet and the ground, ramp, direction and replay
 * arrive as `lab:set`, so the three knob params round four carried are gone: a
 * change to any of those must not reload two dozen documents. What is left is
 * what the scene is, and the ground triple that seeds the first paint.
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
    <SceneShell
      scene={pick<Scene>(SCENES, one(params, "scene"), "menu")}
      ground={pick<Ground>(GROUNDS, one(params, "ground"), "app-dark")}
      direction={pick<Direction>(DIRECTIONS, one(params, "direction"), "today")}
      sub={pick<Sub>(SUBS, one(params, "sub"), "keep")}
      phone={one(params, "w") === "375"}
      dim={pick<Dim>(DIMS, one(params, "dim"), "radius")}
      rung={one(params, "rung")}
      pinned={one(params, "pin") === "1"}
    />
  );
}
