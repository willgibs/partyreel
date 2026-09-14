"use client";

import "./board.css";

import { useEffect, useState } from "react";

import type { Ground } from "@/components/dev/board";

import {
  GROUND_CLASSES,
  GROUND_SET,
  type Dim,
  type Scene as SceneId,
} from "./constants";
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
 * THE FRAME OWNS ITS OWN GROUND, and the parent asks for a change by firing
 * `flt:set` at this window rather than writing the classes itself. Two reasons,
 * both learned the hard way on this board:
 *   - the ground classes are mutually EXCLUSIVE (globals.css declares `.dark`
 *     after `:root, .surface-paper`, so an element carrying both paints dark),
 *     and next-themes runs in here too: it puts `dark` back on <html> after this
 *     component's effect has already run, and again whenever the lab's theme is
 *     toggled, which broadcasts to every frame through storage;
 *   - so the ground needs a resident owner that re-asserts, and two owners
 *     writing the same class list from either side of the frame boundary is a
 *     fight rather than a fix.
 * The three candidate knobs ride the same event: they are attributes nobody else
 * touches, but one owner is simpler to follow than two.
 */

type Knobs = {
  ground: Ground;
  radius: string;
  entrance: string;
  light: string;
};

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
  const [knobs, setKnobs] = useState<Knobs>({
    ground,
    radius,
    entrance,
    light,
  });

  useEffect(() => {
    const onSet = (e: Event) => {
      const detail = (e as CustomEvent<Partial<Knobs>>).detail;
      if (detail) setKnobs((k) => ({ ...k, ...detail }));
    };
    window.addEventListener("flt:set", onSet);
    return () => window.removeEventListener("flt:set", onSet);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-flt-frame", "");
    const g = GROUND_SET[knobs.ground];
    const want = g.className.split(" ");
    const apply = () => {
      const stale = GROUND_CLASSES.filter(
        (c) => root.classList.contains(c) && !want.includes(c),
      );
      const missing = want.filter((c) => !root.classList.contains(c));
      // The guard is what keeps our own write from re-entering the observer.
      if (stale.length) root.classList.remove(...stale);
      if (missing.length) root.classList.add(...missing);
      if (g.mkt) root.setAttribute("data-mkt", "");
      else root.removeAttribute("data-mkt");
      root.style.removeProperty("--background");
      if (g.bg) root.style.setProperty("--background", g.bg);
      root.style.colorScheme = want.includes("dark") ? "dark" : "light";
      root.setAttribute("data-flt-radius", knobs.radius);
      root.setAttribute("data-flt-entrance", knobs.entrance);
      root.setAttribute("data-flt-light", knobs.light);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [knobs]);

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
