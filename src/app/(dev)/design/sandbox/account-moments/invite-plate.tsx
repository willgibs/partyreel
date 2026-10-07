"use client";

import "./invite-plate.css";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useId, useState } from "react";

import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import {
  chromaOf,
  edgeBand,
  type EdgeLight,
  HOUSE_LIGHT,
  intensityOf,
  unOlive,
} from "@/components/app/event-feed/event-hub-head-edge";
import { Button } from "@/components/ui/button";
import { css, fitChroma, orbFor } from "@/lib/avatar/gradient";
import { srgbToOklch } from "@/lib/shared/sampled-palette";

import { PRIYA, type Still, UPLOADS } from "./fixtures";

/**
 * THE PLATE: ONE LIT PLATE, THE WAY TO SHARE HER PAGE (the `invite` ask's
 * `plate`, Aperture's own answer). Her page is paper; the invitation is the one
 * piece of the room it holds, a dark plate with her own photographs' light
 * inside it, and in that dark the words and the way on to the setup. The most
 * beautiful thing on her page is the way to share it.
 *
 * ★ THE LIGHT IS HERS: her six photographs read as one strip, their colour
 * families weighed by how much of her light each carries, the heaviest the
 * key and the heaviest a quarter turn from it the answer (a key and its fill,
 * as a photographer lights: two hues, never a spectrum). With no photograph to
 * read it is her seed (her avatar's own hue), and with no seed the house ember
 * (`HOUSE_LIGHT`): Afterglow's ladder, in code.
 *
 * ★ DRAWN AS THE HUB'S SEAM, BY APERTURE'S RULE: born at the plate's top edge
 * and spent inside it, so on paper no glow, tint or wash ever touches the page
 * (the footer's slab is the same construction). The words and the key stand
 * past the light's reach: nothing pressed stands in the light.
 *
 * ★ NEVER SAYS SHE IS PUBLIC. The words invite and promise ("Your page, when
 * you're ready", "Nothing is public until you finish"), the key leads to the
 * setup (`PROFILE_SETUP_PATH`), which claims her handle last, at Finish: the
 * consent act. Nothing here publishes. ("Share your page", this take's first
 * title, read as a share-link action right under "Only you can see this
 * page"; the `window` take says these same words, so the board's question is
 * the form, never the copy.)
 *
 * ★ A COMPACT OBJECT, NEVER A BANNER: a short light, the plate only as tall as
 * its words, and the phone's proportion kept at a desk (`invite-plate.css`).
 *
 * ★ STILL AT REST: the light arrives once, as her photographs are read, and
 * rests lit; under reduced motion it is simply lit (`invite-plate.css`).
 */

/**
 * What lights the plate, and where it came from (her photographs, then her
 * seed, then the house): the Seam's own light (`edge`, its glow and its lit
 * edge), the hues its body falls through (`fall`, sixth for sixth), and the
 * strength of its right-hand pool (`fill`: 1 where that pool is the key's
 * own, less where it is the answer).
 */
export type Lit = {
  edge: EdgeLight;
  fall: readonly number[];
  fill: number;
  from: "photographs" | "seed" | "house";
};

/** How wide each photograph is read: the sampler's own 32px. */
const CELL = 32;

/** A family's reach: hues within it are one colour (production's `threeAtMost` reach). */
const FAMILY = 40;

/** How far the answer stands from the key: a quarter turn, so the two read as two lights, never a blend. */
const ANSWER = 90;

/** The least share of her light an answer carries: a hue she barely photographed is not her light. */
const ANSWER_SHARE = 0.1;

/**
 * ★ A FILL IS LIT BY ITS SHARE, NEVER AS BRIGHT AS ITS KEY: half strength,
 * and the rest only as her photographs carry it (an answer as heavy as its key
 * would reach `FILL_MOST`). Hers carry a fifth as much blue as amber, so her
 * blue is a cool kiss at the right, never a second spotlight.
 */
const FILL_LEAST = 0.5;
const FILL_MOST = 0.85;

/**
 * How far a gold light's body drifts as it falls: half a family's reach at
 * most, so the fall is still the key's own colour (`FAMILY`), only deeper.
 */
const FALL = 20;

/** The hue every warm light's fall drifts away from. */
const YELLOW = 95;

/**
 * THE BODY'S REGISTER: Afterglow's Bloom in the room (the deck's `room`,
 * quoted, never retuned here), a step deeper and richer than the Seam's own
 * glow, with the yellows lifted so a gold light stays gold.
 */
const BODY = { l: 0.72, lift: 0.09, c: 0.15, floor: 0.13 } as const;

const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

const angle = (x: number, y: number) =>
  ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

/** How far a hue sits toward yellow, 0 to 1 (production's `yellowness`, which the edge module keeps to itself). */
const yellowness = (h: number) =>
  Math.max(0, Math.cos(((gap(h, YELLOW) / 70) * Math.PI) / 2));

/**
 * ★ A WARM LIGHT'S FALL DRIFTS AWAY FROM YELLOW, AS FAR AS IT IS YELLOW.
 * Light whose alpha alone falls goes brown in the dark (a dim amber IS brown:
 * v1 of this plate, and round one's stain by another route); a candle's fall
 * reddens, so a warm body falls through the key's own deeper neighbour (her
 * amber through the peach of her roses), still inside its family. A dim blue
 * is still blue, so a cool light keeps its hue: pushing it on toward violet
 * would invent a colour (her party night's blue stays her blue).
 */
function deepen(h: number): number {
  const step = FALL * yellowness(h);
  return (h + (h < YELLOW ? -step : step) + 360) % 360;
}

/** A colour family of her photographs: its hue (the chroma-weighted mean) and its weight. */
type Family = { hue: number; weight: number };

/**
 * HER COLOUR FAMILIES, heaviest first: every midtone pixel's hue in 15°
 * buckets weighted by its chroma (the sampler's own reading,
 * `pickSpillHues`), the buckets gathered heaviest first into families within
 * `FAMILY`. A bucket joins a family by its own hue, so a family is a colour
 * she photographed, never an average of two.
 */
function familiesOf(px: Uint8ClampedArray): Family[] {
  const buckets = Array.from({ length: 24 }, () => ({ x: 0, y: 0, w: 0 }));
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const { l, c, h } = srgbToOklch(px[i], px[i + 1], px[i + 2]);
    // Near-black and near-white have no hue of their own; a grey's is noise.
    if (l < 0.18 || l > 0.95 || c < 0.02) continue;
    const b = buckets[Math.min(23, Math.floor(h / 15))];
    const r = (h * Math.PI) / 180;
    b.w += c;
    b.x += c * Math.cos(r);
    b.y += c * Math.sin(r);
  }
  const families: { x: number; y: number; w: number }[] = [];
  for (const b of buckets.filter((b) => b.w > 0).sort((a, b) => b.w - a.w)) {
    const hue = angle(b.x, b.y);
    const near = families.find((f) => gap(angle(f.x, f.y), hue) < FAMILY);
    if (near) {
      near.x += b.x;
      near.y += b.y;
      near.w += b.w;
    } else families.push({ ...b });
  }
  return families
    .map((f) => ({ hue: angle(f.x, f.y), weight: f.w }))
    .sort((a, b) => b.weight - a.weight);
}

/** A light of one hue: the key alone, along the whole edge. */
function single(hue: number, c: number, from: Lit["from"]): Lit {
  return {
    edge: { hues: Array(6).fill(hue), c },
    fall: Array(6).fill(deepen(hue)),
    fill: 1,
    from,
  };
}

/**
 * THE LIGHT FROM HER FAMILIES: the key along the edge from the left (where
 * Afterglow's key always stands), its answer over the last third. Six sixths,
 * the Seam's own count: the pools stand at a quarter, the middle and four
 * fifths, so the key lights two of them and the answer one.
 */
function lightOf(families: readonly Family[], c: number): Lit | null {
  const [key] = families;
  if (!key) return null;
  const total = families.reduce((sum, f) => sum + f.weight, 0);
  const answer = families.find(
    (f) => gap(f.hue, key.hue) >= ANSWER && f.weight / total >= ANSWER_SHARE,
  );
  if (!answer) return single(key.hue, c, "photographs");
  const sixths = [key, key, key, key, answer, answer];
  return {
    edge: { hues: sixths.map((f) => f.hue), c },
    fall: sixths.map((f) => deepen(f.hue)),
    fill: Math.min(
      FILL_MOST,
      FILL_LEAST + FILL_LEAST * (answer.weight / key.weight),
    ),
    from: "photographs",
  };
}

/**
 * One photograph, decoded: a stand-in still the page already shows below
 * (same-origin and cached, so the canvas stays clean and the read is a cache
 * hit or a revalidation at most). ★ SAME-ORIGIN STAND-INS ONLY: her real
 * uploads are presigned R2 previews, which taint a canvas read this way (no
 * `crossOrigin`); wired, this is the sampler's URL form's loader
 * (`decodeImage`, CORS-clean and `no-store`) handed each upload's
 * `previewUrl`, about 16KB a photograph (sampled-palette.ts).
 */
function load(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

/** Her photographs as one strip, `CELL` a photograph, or null where none could be read. */
async function readStrip(srcs: readonly string[]) {
  const imgs = (
    await Promise.all(srcs.map((src) => load(src).catch(() => null)))
  ).filter((img): img is HTMLImageElement => img !== null);
  if (!imgs.length) return null;
  const canvas = document.createElement("canvas");
  canvas.width = CELL * imgs.length;
  canvas.height = CELL;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  imgs.forEach((img, i) => ctx.drawImage(img, i * CELL, 0, CELL, CELL));
  return ctx.getImageData(0, 0, canvas.width, CELL).data;
}

/** Afterglow's ladder: her photographs' light, then her seed's, then the house's. */
async function readLight(srcs: readonly string[], seed: string): Promise<Lit> {
  const px = await readStrip(srcs).catch(() => null);
  const own = px ? lightOf(familiesOf(px), chromaOf(intensityOf(px))) : null;
  if (own) return own;
  // Her avatar's own hue, at the room's full strength.
  if (seed) return single(orbFor(seed).hue, 0.15, "seed");
  return {
    edge: HOUSE_LIGHT,
    fall: HOUSE_LIGHT.hues.map(deepen),
    fill: 1,
    from: "house",
  };
}

/** Her light, read once a set of photographs changes (the `window` take's plate wears it too). */
export function useHerLight(
  stills: readonly Still[],
  seed: string,
): Lit | null {
  const [lit, setLit] = useState<Lit | null>(null);
  const key = stills.map((s) => s.src).join("|");
  useEffect(() => {
    let gone = false;
    void readLight(key ? key.split("|") : [], seed).then((next) => {
      if (!gone) setLit(next);
    });
    return () => {
      gone = true;
    };
  }, [key, seed]);
  return lit;
}

/** The body's band, left to right: each sixth's fall at the centre of its share, blended in oklab (`edgeBand`'s way). */
function bodyBand(fall: readonly number[], c: number): string {
  const stops = fall.map((h, i) => {
    const hue = unOlive(h);
    const tone = fitChroma({
      l: Math.min(0.95, BODY.l + BODY.lift * yellowness(hue)),
      c: Math.min(BODY.c, Math.max(BODY.floor, c)),
      h: hue,
    });
    return `${css(tone)} ${(((i + 0.5) / fall.length) * 100).toFixed(1)}%`;
  });
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}

/** The Seam, in her light: its body, its glow at the edge, and the edge itself lit. */
export function Seam({ lit }: { lit: Lit | null }) {
  return (
    <div
      aria-hidden
      className="ip-light"
      data-plate-light={lit?.from ?? "reading"}
      data-hues={lit ? lit.edge.hues.map(Math.round).join(" ") : undefined}
      style={{ "--ip-fill": lit?.fill ?? 1 } as CSSProperties}
    >
      {lit ? (
        <div className="ip-lit">
          <div
            className="ip-body"
            style={{ background: bodyBand(lit.fall, lit.edge.c) }}
          />
          <div
            className="ip-glow"
            style={{ background: edgeBand(lit.edge, "glow") }}
          />
          <div
            className="ip-line"
            style={{ background: edgeBand(lit.edge, "line") }}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * IN THE ROOM THE LIT EDGE ALSO TOUCHES THE PAGE, softly: a lit edge gives
 * light both ways, and on the room's near-black that spill reads as light.
 * On paper it is never drawn (`invite-plate.css`: Aperture's one rule), and
 * it is spent well before the private line above.
 */
function Spill({ lit }: { lit: Lit | null }) {
  if (!lit) return null;
  return (
    <div
      aria-hidden
      className="ip-spill"
      style={{ background: edgeBand(lit.edge, "glow") }}
    />
  );
}

export function PlateInvite({
  stills = UPLOADS,
}: {
  /** Her photographs, whose light the plate wears (the board's Photos knob). */
  stills?: readonly Still[];
}) {
  const lit = useHerLight(stills, PRIYA.seed);
  const title = useId();
  return (
    // Arrives a beat after her head (`ProfileHead` is the first), on the
    // page's own arrival; the light then ignites inside it once it is read.
    <div
      data-arrive
      style={{ "--arrive-i": 1 } as CSSProperties}
      className="ip-wrap mt-6"
    >
      <Spill lit={lit} />
      <section
        aria-labelledby={title}
        className="dark ip-plate rounded-2xl text-foreground"
      >
        <Seam lit={lit} />
        <div className="min-w-0">
          <h2 id={title} className="font-heading text-subsection text-balance">
            Your page, when you&rsquo;re ready
          </h2>
          <p className="mt-1 text-working text-muted-foreground">
            Nothing is public until you finish.
          </p>
        </div>
        <Button asChild size="lg" className="ip-key">
          <Link href={PROFILE_SETUP_PATH}>
            Choose what shows
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  );
}
