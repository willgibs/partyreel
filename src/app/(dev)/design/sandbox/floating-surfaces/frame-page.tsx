"use client";

import "./board.css";

import { useEffect, useMemo, useState } from "react";

import type { Ground } from "@/components/dev/board";

import {
  contractCss,
  rungCss,
  type EntranceRung,
  type LightRung,
  type RadiusRung,
} from "./candidates";
import { directionCss, type Direction } from "./directions";
import {
  GROUND_CLASSES,
  GROUND_SET,
  RAMP_CINEMA_BG,
  RUNGS,
  type Dim,
  type Ramp,
  type Scene as SceneId,
  type Side,
} from "./constants";
import { Scene } from "./scenes";

/**
 * WHAT LOADS INSIDE A FRAME. The board mounts this route in an <iframe> sized to
 * a real 1440 or 375 viewport; see frame.tsx for why a floating surface cannot
 * be judged in the shell's zoom-fitted Stage.
 *
 * Three jobs. Paint the ground on this document's <html> (so a panel that
 * portals to THIS body inherits cinema, paper or ink rather than the lab page's
 * theme), cover the lab layout's nav, and render the candidate blocks: the
 * knobs frame-wide, plus one panel-scoped block per rung the scene needs.
 *
 * ROUND TWO: those blocks are the SAME strings the board hands the site through
 * setCandidateCss (candidates.ts builds all three scopes from one table), so
 * what a frame shows and what a ruling pastes cannot drift apart.
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
 * The knobs ride the same event: they are attributes nobody else touches, but
 * one owner is simpler to follow than two.
 */

type Knobs = {
  ground: Ground;
  ramp: Ramp;
  /** Round four's page-wide switch. It rides the same event as the grounds
   *  rather than the URL, so flipping direction on the dock re-renders every
   *  frame in place instead of reloading eighteen documents. */
  direction: Direction;
  radius: string;
  entrance: string;
  light: string;
};

export function FramePage({
  scene,
  ground,
  ramp,
  direction,
  phone,
  dim,
  variant,
  side,
  rung,
  compact,
  radius,
  entrance,
  light,
}: {
  scene: SceneId;
  ground: Ground;
  ramp: Ramp;
  direction: Direction;
  phone: boolean;
  dim: Dim;
  variant: "sheet" | "drawer";
  side?: Side;
  rung?: string;
  compact?: boolean;
  radius: string;
  entrance: string;
  light: string;
}) {
  const [knobs, setKnobs] = useState<Knobs>({
    ground,
    ramp,
    direction,
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
    root.setAttribute("data-flt-scene", scene);
    root.setAttribute("data-flt-direction", knobs.direction);
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
      // The cinema room is painted inline, so the ramp has to hand it the
      // matching value: a class rule cannot beat an inline custom property.
      if (g.cinema) {
        root.style.setProperty("--background", RAMP_CINEMA_BG[knobs.ramp]);
      }
      root.style.colorScheme = want.includes("dark") ? "dark" : "light";
      root.setAttribute("data-flt-ramp", knobs.ramp);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [knobs, scene]);

  /** The knobs, frame-wide, plus every rung this scene renders. A ladder needs
   *  all of its dimension's rungs at once; every other scene needs at most the
   *  one it was given. */
  const css = useMemo(() => {
    const rungs =
      scene === "ladder" ? RUNGS[dim].map((r) => r.id) : rung ? [rung] : [];
    return [
      directionCss(knobs.direction, "frame"),
      contractCss(
        {
          radius: knobs.radius as RadiusRung | "off",
          entrance: knobs.entrance as EntranceRung | "off",
          light: knobs.light as LightRung | "off",
        },
        "frame",
      ),
      ...rungs.map(rungCss),
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [
    scene,
    dim,
    rung,
    knobs.direction,
    knobs.radius,
    knobs.entrance,
    knobs.light,
  ]);

  return (
    <div className="flt-cover bg-background text-foreground">
      {/* Rendered in the body rather than hoisted: a plain <style> still comes
          after every stylesheet link in the head, which is the whole reason the
          candidate wins at equal specificity, and the board needs it to change
          with the knobs rather than be deduplicated by React's hoisting. */}
      <style>{css}</style>
      <Scene
        scene={scene}
        direction={knobs.direction}
        phone={phone}
        dim={dim}
        variant={variant}
        side={side}
        rung={rung}
        compact={compact}
      />
    </div>
  );
}
