"use client";

import "./seed.css";

import type { CSSProperties } from "react";

import { edgeBand } from "@/components/app/event-feed/event-hub-head-edge";
import { background, blendMode, orbFor } from "@/lib/avatar/gradient";

import { alpha, seedLight } from "./light";

/**
 * A PARTY'S OWN COLOUR WHERE IT HAS NO PHOTOGRAPH YET: the cover's ground
 * before the first photograph, drawn from the party's seed (`seedFor(events.id)`
 * in production; a fixture's string here), three ways (the `atmosphere`
 * decision).
 *
 *  - `house`, today: nothing of the board's. `EventHead` stands every cover on
 *    the house light (`HouseLight`, the coral ember), so an empty cover draws
 *    no ground of its own and the house shows.
 *  - `lamp`, Aperture's: the seed as a LAMP IN THE ROOM, production's own
 *    hashvatar orb (`orbFor` and the mesh, the face's very look), defined and
 *    whole, its light glowing round it in the dark from where the orb's own
 *    light sits; never fog (brand r2's creative director: a soft smudge in a
 *    well reads as an image that failed to load), so the orb is a thing and
 *    the light its glow. Quiet enough that the first photograph is plainly
 *    the brighter thing.
 *  - `field`: the seed's mesh spread under the whole cover, one hue at
 *    several depths edge to edge, dimmed into the room so the words read.
 *
 * ★ THE ROOM ON BOTH THEMES: a cover is the room (`EventHead` is `dark`), so
 * none of this ever touches a paper page.
 */

export type SeedWay = "house" | "lamp" | "field";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** The cover's ground for a party with no photograph: the seed's lamp or its field (the house needs none). */
export function SeedGround({
  seed,
  way,
  side,
}: {
  seed: string;
  way: SeedWay;
  /** The guest's album cover (a phone's first screen) or the host's hub head (a band). */
  side: "album" | "hub";
}) {
  if (way === "house") return null;
  if (way === "field") return <SeedField seed={seed} />;
  return <SeedLamp seed={seed} side={side} />;
}

/** THE LAMP: the seed's orb, whole, its light round it in the room's dark. */
function SeedLamp({ seed, side }: { seed: string; side: "album" | "hub" }) {
  const o = orbFor(seed);
  const l = seedLight(seed);
  const vars: Vars = {
    "--pr-lamp-lit": l.lit,
    "--pr-lamp-body": l.body,
    "--pr-lamp-deep": l.deep,
    "--pr-lamp-wide": alpha(l.body, 34),
    "--pr-lamp-near": alpha(l.lit, 62),
  };
  return (
    <div
      aria-hidden
      data-pr-seed="lamp"
      data-pr-side={side}
      className="pr-seed absolute inset-0"
      style={vars}
    >
      <span className="pr-seed-room" />
      <span className="pr-seed-lamp">
        <span className="pr-seed-glow" />
        <span
          className="pr-seed-orb"
          style={{
            backgroundImage: background(o, "mesh"),
            backgroundBlendMode: blendMode("mesh"),
          }}
        />
      </span>
      <span className="pr-seed-scrim" />
    </div>
  );
}

/** THE FIELD: the seed's mesh, the whole cover, dimmed into the room. */
function SeedField({ seed }: { seed: string }) {
  const o = orbFor(seed);
  return (
    <div aria-hidden data-pr-seed="field" className="pr-seed absolute inset-0">
      <span
        className="pr-seed-field"
        style={{
          backgroundImage: background(o, "mesh"),
          backgroundBlendMode: blendMode("mesh"),
        }}
      />
      <span className="pr-seed-scrim" />
    </div>
  );
}

/**
 * THE HUB'S SEAM IN THE SEED'S LIGHT: where production's `HubLight` falls back
 * to the house's dusk for a cover with no photograph, a party lit by its seed
 * lights its Seam with it too (one source a screen): the seed's hue across the
 * edge at a few depths, drawn with production's own band (`edgeBand`) in the
 * Seam's own markup and sheet (`event-hub-head-seam.css`).
 */
export function SeedSeam({ seed }: { seed: string }) {
  const h = orbFor(seed).hue;
  const hues = [h + 8, h + 4, h, h - 4, h - 8, h - 14].map(
    (x) => (x + 360) % 360,
  );
  const light = { hues, c: 0.14 };
  return (
    <div aria-hidden data-hub-light="seed" className="hub-seam hub-light">
      <div className="dark hub-light-field">
        <div className="hub-light-slot" data-rest="">
          <div className="hub-light-lit">
            <div
              className="hub-light-glow"
              style={{ background: edgeBand(light, "glow") }}
            />
            <div
              className="hub-light-line"
              style={{ background: edgeBand(light, "line") }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
