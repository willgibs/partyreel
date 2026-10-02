import { HOUSE_HUES } from "@/lib/guest/door-light";

import { leafAngle, lightOf, motionOf, timeOf } from "./scene";

/**
 * WHAT EACH FRAME SAYS UNDER IT, READ OFF ITS OWN DOCUMENT (never computed
 * from the option's name: if an option's words and its caption disagree, the
 * caption is the truth).
 */

/** What the doorway's opening holds, found by its marks. */
function openingOf(way: Element, win: Window): string {
  const state = way.getAttribute("data-door-way");
  if (state === "ajar") return "the door ajar, nothing of the album behind it";
  if (state === "shut") return "the door shut, its light under it";
  const room = way.querySelector(".door-way-room");
  const mini = room?.querySelector<HTMLElement>(".ld-mini");
  if (mini) {
    const k = Number.parseFloat(win.getComputedStyle(mini).scale) || 1;
    const n = mini.querySelectorAll("[data-ld-shows='photo']").length;
    return `the opening holds the album's own photographs (${n} in its rows) at ${Math.round(k * 100)}% of their size`;
  }
  const photos =
    room?.querySelectorAll(".ld-photo [data-ld-shows='photo']").length ?? 0;
  if (photos > 0)
    return `the opening holds ${photos} photograph${photos === 1 ? "" : "s"}, the album's newest`;
  return "the opening holds the party's light alone";
}

/** The album's photographs on the frame's first screen, past the door. */
function albumOf(scene: HTMLElement, win: Window): string {
  const tiles = Array.from(
    scene.querySelectorAll<HTMLElement>("[data-ld-album] [data-ld-tile]"),
  );
  const seen = tiles.filter((t) => {
    const r = t.getBoundingClientRect();
    return r.height > 0 && r.top < win.innerHeight;
  }).length;
  return `the album, ${seen} of its photographs on the first screen`;
}

/**
 * Where `one`'s photograph came to rest, against the album's first tile: the
 * difference is the measure of whether it landed on the photograph it is.
 */
function landingOf(scene: HTMLElement): string | null {
  const fly = scene.querySelector<HTMLElement>(".ld-fly");
  const tile = scene.querySelector<HTMLElement>(
    "[data-ld-album] [data-ld-tile='0']",
  );
  if (!fly || !tile) return null;
  const a = fly.getBoundingClientRect();
  const b = tile.getBoundingClientRect();
  const off = Math.max(
    Math.abs(a.left - b.left),
    Math.abs(a.top - b.top),
    Math.abs(a.width - b.width),
    Math.abs(a.height - b.height),
  );
  const same =
    fly.querySelector("img")?.getAttribute("src") === tile.getAttribute("src");
  return `the photograph from the door ${same ? "is" : "is not"} the album's first, landed within ${Math.round(off)}px of its tile`;
}

/** THE CAPTION UNDER A MOMENT'S FRAME. */
export function measureReveal(root: HTMLElement, win: Window): string | null {
  const scene = root.querySelector<HTMLElement>("[data-ld-scene]");
  if (!scene || !scene.hasAttribute("data-ld-measured")) return null;
  const phase = scene.getAttribute("data-ld-phase");
  const reveal = scene.getAttribute("data-ld-scene");
  const way = scene.querySelector("[data-ld-stage] .door-way");
  if (!way) return null;
  const parts: string[] = [];
  const timeline = scene.getAttribute("data-ld-timeline");
  if (timeline) parts.push(timeline);
  if (phase === "in") {
    parts.push(albumOf(scene, win));
    if (reveal === "one") {
      const landed = landingOf(scene);
      if (landed) parts.push(landed);
    }
  } else if (phase === "mid") {
    if (reveal === "through") {
      const camera = scene.querySelector(".ld-camera");
      const k = camera
        ? Number.parseFloat(win.getComputedStyle(camera).scale) || 1
        : 1;
      parts.push(`the camera ${Math.round(k * 10) / 10} times closer`);
    } else if (reveal === "one") {
      parts.push("the photograph part-way to its place in the album");
    } else {
      parts.push("the light part-way out of the doorway");
    }
  } else {
    parts.push(openingOf(way, win));
    const angle = leafAngle(way.querySelector(".door-way-leaf"), win);
    if (angle !== null) parts.push(`the leaf at ${angle}°`);
    parts.push(lightOf(scene, HOUSE_HUES));
  }
  return `Measured: ${parts.join("; ")}.`;
}

/** THE CAPTION UNDER A DOOR AT REST. */
export function measureIdle(root: HTMLElement): string | null {
  const idle = root.querySelector("[data-ld-idle]");
  const way = root.querySelector("[data-door-way]");
  if (!idle || !way) return null;
  const state = way.getAttribute("data-door-way");
  return `Measured: the door ${state}; ${motionOf(root)}; ${lightOf(root, HOUSE_HUES)}.`;
}

/** THE CAPTION UNDER ONE LOOP IN STILLS. */
export function measureStrip(root: HTMLElement, win: Window): string | null {
  const cells = Array.from(
    root.querySelectorAll<HTMLElement>("[data-ld-strip-at]"),
  );
  const idle = root.querySelector<HTMLElement>("[data-ld-idle]");
  if (!cells.length || !idle) return null;
  const loop = win.getComputedStyle(idle).getPropertyValue("--ld-loop").trim();
  const ms = loop.endsWith("ms")
    ? Number.parseFloat(loop)
    : Number.parseFloat(loop) * 1000;
  if (!ms) return null;
  const at = cells.map((c) =>
    timeOf(Number(c.getAttribute("data-ld-strip-at")) * ms),
  );
  return `Measured: ${cells.length} moments of one ${timeOf(ms)} loop, at ${at.join(", ")}.`;
}
