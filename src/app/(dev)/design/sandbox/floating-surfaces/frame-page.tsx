"use client";

import "./board.css";

import { useEffect } from "react";

import type { Ground } from "@/components/dev/board";

import { GROUND_SET, type Dim, type Scene as SceneId } from "./constants";
import { Scene } from "./scenes";

/**
 * WHAT LOADS INSIDE A FRAME. The board mounts this route in an <iframe> sized to
 * a real 1440 or 375 viewport; see frame.tsx for why a floating surface cannot
 * be judged in the shell's zoom-fitted Stage.
 *
 * Two jobs only: paint the ground on this document's <html> (so a panel that
 * portals to THIS body inherits cinema, paper or ink rather than the lab page's
 * theme), and cover the lab layout's nav, which every route under /design
 * inherits and which has no stable hook of its own to hide.
 *
 * The ground and the three candidate knobs are plain attributes on <html>, so
 * after the first paint the parent board changes them by reaching straight into
 * `contentDocument` (same origin) and the frame never reloads. Only the props
 * that change the RENDER (the scene, the width, the ladder's dimension) ride the
 * URL, and changing one of those is a deliberate reload.
 */

export function FramePage({
  scene,
  ground,
  phone,
  dim,
  variant,
  rung,
  radius,
  entrance,
  light,
}: {
  scene: SceneId;
  ground: Ground;
  phone: boolean;
  dim: Dim;
  variant: "sheet" | "drawer";
  rung?: string;
  radius: string;
  entrance: string;
  light: string;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-flt-frame", "");
    const g = GROUND_SET[ground];
    // The lab layout's own classes stay: only the ground set is ours to add.
    root.classList.add(...g.className.split(" "));
    if (g.mkt) root.setAttribute("data-mkt", "");
    if (g.bg) root.style.setProperty("--background", g.bg);
    if (g.className.includes("dark")) root.style.colorScheme = "dark";
    root.setAttribute("data-flt-radius", radius);
    root.setAttribute("data-flt-entrance", entrance);
    root.setAttribute("data-flt-light", light);
    // First paint only: from here the parent owns these attributes, so this
    // effect deliberately does not re-run on a knob change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flt-cover bg-background text-foreground">
      <Scene
        scene={scene}
        phone={phone}
        dim={dim}
        variant={variant}
        rung={rung}
      />
    </div>
  );
}
