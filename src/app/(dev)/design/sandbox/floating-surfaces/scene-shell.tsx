"use client";

import "./board.css";

import { useEffect, useState } from "react";

import type { Ground } from "@/components/lab";

import {
  CINEMA_BG,
  GROUND_CLASSES,
  GROUND_SET,
  type Scene as SceneId,
  type Sub,
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
  direction: Direction;
};

/**
 * ★ THE FIRST PAINT READS THE BOARD'S OWN URL, NOT ONLY THIS FRAME'S SRC
 * (measured on the board, 2026-09-16). The parent seeds a frame's src ONCE, at
 * that frame's first render, and the board's declared state arrives from the
 * URL one render LATER, because `useBoardState` reads it through
 * `useSyncExternalStore`, which hands back the server snapshot first. The
 * parent's correcting `lab:set` is then dispatched at the iframe's load event,
 * which is before THIS document has hydrated and registered its listener, so it
 * lands nowhere: a board opened at ?ground=cinema painted every card on the
 * app's dark under a dock claiming the room, for ever.
 *
 * The frames are same-origin by construction, so the honest fix is to read the
 * board's own URL here, once, while seeding. Only the GROUND is read, and that
 * is what makes it safe to do during render: the ground is applied to <html> by
 * an effect and is not in the rendered tree, so the server's HTML and the
 * client's first render still agree. `direction` is per-frame on this board (a
 * catalog card is its own layer, not the page's pick), the branch rides the src
 * because it changes the markup, and a frame whose ground is the EVIDENCE
 * rather than the page's carries `pin=1` and is left alone.
 */
function pageGround(fallback: Ground, pinned: boolean): Ground {
  if (pinned || typeof window === "undefined") return fallback;
  try {
    const g = new URLSearchParams(window.parent?.location?.search ?? "").get(
      "ground",
    );
    return g && g in GROUND_SET ? (g as Ground) : fallback;
  } catch {
    return fallback; // A frame opened on its own: its own src is the truth.
  }
}

export function SceneShell({
  scene,
  ground,
  direction,
  sub,
  phone,
  rung,
  pinned = false,
}: {
  scene: SceneId;
  ground: Ground;
  direction: Direction;
  sub: Sub;
  phone: boolean;
  rung?: string;
  /** This frame's ground is the EVIDENCE, so it never takes the page's. */
  pinned?: boolean;
}) {
  // Seeded from the URL so the FIRST paint is already on the right ground: the
  // parent's push arrives an effect later, and a frame that flashed cinema
  // before turning paper is a frame that lies for one frame on a board about
  // what a panel looks like over a ground.
  const [pushed, setPushed] = useState<Pushed>(() => ({
    ground: pageGround(ground, pinned),
    direction,
  }));

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
      // The cinema room is painted inline, because a class rule cannot beat an
      // inline custom property and the frame's own style sets one.
      if (g.cinema) root.style.setProperty("--background", CINEMA_BG);
      root.style.colorScheme = want.includes("dark") ? "dark" : "light";
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
        sub={sub}
        phone={phone}
        rung={rung}
      />
    </div>
  );
}
