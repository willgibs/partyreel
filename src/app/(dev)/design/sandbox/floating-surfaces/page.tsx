import type { Metadata } from "next";

import type { Ground } from "@/components/dev/board";
import { requireDesignKey } from "@/lib/design-gate/server";

import { DIMS, GROUNDS, SCENES, type Dim, type Scene } from "./constants";
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
 * resolves at the canvas width (both sheet and dialog branch on it) and
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

export default async function FloatingSurfacesScenePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const params = await searchParams;

  const sceneParam = one(params, "scene");
  const scene: Scene = (SCENES as readonly string[]).includes(sceneParam ?? "")
    ? (sceneParam as Scene)
    : "family";

  const groundParam = one(params, "ground");
  const ground: Ground = (GROUNDS as readonly string[]).includes(
    groundParam ?? "",
  )
    ? (groundParam as Ground)
    : "cinema";

  const dimParam = one(params, "dim");
  const dim: Dim = (DIMS as readonly string[]).includes(dimParam ?? "")
    ? (dimParam as Dim)
    : "radius";

  return (
    <FramePage
      scene={scene}
      ground={ground}
      phone={one(params, "w") === "375"}
      dim={dim}
      variant={one(params, "variant") === "drawer" ? "drawer" : "sheet"}
      rung={one(params, "rung")}
      radius={one(params, "radius") ?? "off"}
      entrance={one(params, "entrance") ?? "off"}
      light={one(params, "light") ?? "off"}
    />
  );
}
