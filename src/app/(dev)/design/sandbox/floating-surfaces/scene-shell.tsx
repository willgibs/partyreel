"use client";

import "./board.css";

import { useEffect, useState } from "react";

import type { Ground } from "@/components/lab";

import {
  GROUND_CLASSES,
  GROUND_SET,
  RAMP_CINEMA_BG,
  type Dim,
  type Ramp,
  type Scene as SceneId,
  type Side,
} from "./constants";
import type { Direction } from "./directions";
import { Scene } from "./scenes";

/**
 * WHAT LIVES INSIDE A FRAME (the migration wave, 2026-09-15; round four's
 * `frame-page.tsx`, minus everything the kit now does).
 *
 * The board mounts this route in the kit's `Frame`, an iframe laid out at a real
 * 1440 or 375 viewport, because every radix panel portals to
 * `globalThis.document.body` and would otherwise leave the ground, the zoom and
 * the canvas it is being judged on.
 *
 * ★ THE CANDIDATE NO LONGER COMES FROM IN HERE. Round four rebuilt the CSS from
 * six URL params inside this document; the kit's Frame writes the parent's exact
 * paste into this realm as an adopted stylesheet, so a `<style>` block, a memo
 * and three params went with it. What could not go is the part that is not CSS:
 *
 * ★ THE FRAME OWNS ITS OWN GROUND, and the parent asks for a change by pushing
 * `lab:set` rather than writing the classes across the boundary. Two reasons,
 * both learned on this board: the ground classes are mutually EXCLUSIVE
 * (globals.css declares `.dark` after `:root, .surface-paper`, so an element
 * carrying both paints dark), and next-themes runs in here too, putting `dark`
 * back on <html> after this component's effect has run and again whenever the
 * lab's theme is toggled, which broadcasts to every frame through storage. So
 * the ground needs a resident owner that re-asserts; two owners writing one
 * class list from either side of a frame boundary is a fight, not a fix.
 *
 * The direction rides the same event because it changes ANATOMY as well as
 * material (a header row, an icon rail, a field), which is React state rather
 * than a paste, and the replay rides it as one number the scenes compare.
 */

type Pushed = {
  ground: Ground;
  ramp: Ramp;
  direction: Direction;
};

export function SceneShell({
  scene,
  ground,
  ramp,
  direction,
  phone,
  dim,
  variant,
  side,
  rung,
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
}) {
  // Seeded from the URL so the FIRST paint is already on the right ground: the
  // parent's push arrives an effect later, and a frame that flashed cinema
  // before turning paper is a frame that lies for one frame on a board about
  // what a panel looks like over a ground.
  const [pushed, setPushed] = useState<Pushed>({ ground, ramp, direction });

  useEffect(() => {
    const onSet = (e: Event) => {
      const detail = (e as CustomEvent<Partial<Pushed>>).detail;
      if (!detail) return;
      // ★ BAIL OUT WHEN NOTHING MOVED. `push` is re-dispatched on every load and
      // on every render of the parent, so a blind `{...k, ...detail}` would
      // re-render the whole scene each time the board's own state changed
      // anywhere else on the page.
      setPushed((k) =>
        (detail.ground ?? k.ground) === k.ground &&
        (detail.ramp ?? k.ramp) === k.ramp &&
        (detail.direction ?? k.direction) === k.direction
          ? k
          : { ...k, ...detail },
      );
    };
    window.addEventListener("lab:set", onSet);
    return () => window.removeEventListener("lab:set", onSet);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-flt-frame", "");
    root.setAttribute("data-flt-scene", scene);
    const g = GROUND_SET[pushed.ground];
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
        root.style.setProperty("--background", RAMP_CINEMA_BG[pushed.ramp]);
      }
      root.style.colorScheme = want.includes("dark") ? "dark" : "light";
      root.setAttribute("data-flt-ramp", pushed.ramp);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [pushed, scene]);

  return (
    <div className="flt-cover bg-background text-foreground">
      <Scene
        scene={scene}
        direction={pushed.direction}
        phone={phone}
        dim={dim}
        variant={variant}
        side={side}
        rung={rung}
      />
    </div>
  );
}
