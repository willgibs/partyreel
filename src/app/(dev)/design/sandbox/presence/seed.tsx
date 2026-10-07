"use client";

import "./seed.css";

import type { CSSProperties } from "react";

import { edgeBand } from "@/components/app/event-feed/event-hub-head-edge";
import { background, blendMode, type Orb } from "@/lib/avatar/gradient";

import { orbOf, type Palette } from "./face";
import { alpha, lampColor } from "./light";

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
 *    whole, its light glowing round it in the dark; never fog (brand r2's
 *    creative director: a soft smudge in a well reads as an image that failed
 *    to load), so the orb is a thing and the light its glow.
 *    ★ LAMP-SIZED, NEVER A PLANET: brand r2's lamp filled a card's small well;
 *    scaled to a cover, the same proportions made a moon or a giant avatar.
 *    So the orb stays the size of a lamp (a little under the name's height),
 *    hung up in the room clear of the words, and its light is what fills the
 *    cover: a bloom spent within an orb's width of the glass, then the room
 *    faintly lit round it, falling off as light does, so the first
 *    photograph is plainly the brighter thing.
 *  - `field`: the seed's mesh spread under the whole cover, one hue at
 *    several depths edge to edge, dimmed into the room so the words read
 *    (`seed.css` says how: by its own lightness, never a veil).
 *
 * ★ THE ROOM ON BOTH THEMES: a cover is the room (`EventHead` is `dark`), so
 * none of this ever touches a paper page. ★ STILL: a seed is never animated
 * (seed-avatar r2), so the lamp hangs still until a photograph arrives.
 *
 * ★ ONE LIGHT A SCREEN, ON THE HUB TOO (the creative director's pass): the
 * hub's one light is its Seam, so there the lamp hangs no orb and the Seam
 * alone carries the seed (`SeedSeam`); on a guest's album the lamp's light
 * pools behind the name, a lamp lighting the room the words stand in.
 * ★ THE SEED'S COLOUR FOLLOWS THE COLOUR ANSWER (`orbOf`): drawn from the
 * ember's arc where a party's faces are, the whole wheel otherwise.
 */

export type SeedWay = "house" | "lamp" | "field";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** The cover's ground for a party with no photograph: the seed's lamp or its field (the house needs none). */
export function SeedGround({
  seed,
  way,
  side,
  palette = "wheel",
}: {
  seed: string;
  way: SeedWay;
  /** The guest's album cover (a phone's first screen) or the host's hub head (a band). */
  side: "album" | "hub";
  /** The faces' palette, which the party's seed follows. */
  palette?: Palette;
}) {
  if (way === "house") return null;
  const o = orbOf(seed, palette);
  if (way === "field") return <SeedField orb={o} />;
  // The hub's one light is its Seam: the room stands dark over it, no orb.
  if (side === "hub")
    return (
      <div
        aria-hidden
        data-pr-seed="lamp"
        data-pr-side="hub"
        className="pr-seed absolute inset-0"
      >
        <span className="pr-seed-room" />
      </div>
    );
  return <SeedLamp orb={o} side={side} />;
}

/** A seed's light at three depths in the room's register, from its orb (`light.ts`'s `lampColor`). */
function lightOf(o: Orb) {
  return {
    lit: lampColor({ h: o.hue, w: 1, dl: 0.07 }),
    body: lampColor({ h: o.hue, w: 1 }),
    deep: lampColor({ h: (o.hue + 348) % 360, w: 1, dl: -0.07 }),
  };
}

/**
 * THE LAMP: the seed's orb, whole, its light round it in the room's dark. Its
 * light is the seed's own three depths in the room's register (`lightOf`):
 * the bloom in its lit tone, the room in its body.
 */
function SeedLamp({ orb: o, side }: { orb: Orb; side: "album" | "hub" }) {
  const l = lightOf(o);
  const vars: Vars = {
    // The glass lit from within: the orb's own mesh lifted toward its light (screened), its core where its light sits.
    "--pr-orb-lift": alpha(l.body, 34),
    "--pr-orb-core": alpha(l.lit, 58),
    "--pr-orb-x": `${o.light.x.toFixed(0)}%`,
    "--pr-orb-y": `${o.light.y.toFixed(0)}%`,
    // ★ The bloom starts dimmer than the glass it leaves, so the orb is the brightest thing in the room (a bloom brighter
    // than the orb's shadowed side drew an eclipse, a dark ball in a ring), then is spent within about an orb's width.
    "--pr-bloom-0": alpha(l.body, 36),
    "--pr-bloom-1": alpha(l.body, 16),
    "--pr-bloom-2": alpha(l.body, 6),
    "--pr-bloom-3": alpha(l.deep, 2),
    // The room it lights: low, wide, falling off as light does (each stop about half the last).
    "--pr-pool-0": alpha(l.body, 40),
    "--pr-pool-1": alpha(l.body, 24),
    "--pr-pool-2": alpha(l.deep, 11),
    "--pr-pool-3": alpha(l.deep, 4),
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
        <span className="pr-seed-pool" />
        <span className="pr-seed-bloom" />
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
function SeedField({ orb: o }: { orb: Orb }) {
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
export function SeedSeam({
  seed,
  palette = "wheel",
}: {
  seed: string;
  palette?: Palette;
}) {
  const h = orbOf(seed, palette).hue;
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
