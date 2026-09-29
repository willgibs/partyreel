#!/usr/bin/env node
/**
 * Rebuilds public/email/wordmark-v1.png, the wordmark every Partyreel mail wears at its head (Will,
 * `emails` r1 `brand=wordmark`).
 *
 * WHY A PNG AND NOT THE SVG EVERY OTHER DOOR INLINES: mail clients differ on SVG (caniemail,
 * 2026-09-16: Outlook for Windows through 2016 and Outlook for Mac 2016 draw none; Gmail rasterises
 * it), and a hosted PNG draws everywhere. It is made at 2x for high-density screens, and the
 * template declares its 1x size (`WORDMARK` in src/lib/email/templates.ts, pinned against this
 * file's pixels by templates.test.ts), so a client that blocks images still holds the space.
 *
 * WHY A WHITE PLATE AND NOT A TRANSPARENT MARK: the mails declare light only (`dark=light`), but
 * Outlook and some Gmail builds invert a light mail regardless, and they never invert an image, so
 * ink on a transparent PNG would vanish onto the inverted ground. On its own white plate the mark
 * reads on any ground. The plate is the card's own white, so in a light reading it is invisible; the
 * template insets the image by the plate's padding so the ink, not the plate, lines up with the
 * heading.
 *
 * THE MARK IS NEVER REDRAWN (kit/README.md): this reads the kit's own file (its one path, which is
 * `WORDMARK_PATH` byte for byte) and only scales and places it. A new mark ships as wordmark-v2.png
 * beside this one, so a mail already in an inbox keeps the mark it was sent with.
 *
 * Usage: node scripts/build-email-wordmark.mjs (sharp comes from Next's own dependency; no new
 * package). pngquant, when installed, shrinks the file afterwards.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The kit's ink-on-light wordmark: its viewBox and its single path. */
const kit = readFileSync(
  join(ROOT, "kit/logo/partyreel-wordmark-dark.svg"),
  "utf8",
);
const path = / d="([^"]+)"/.exec(kit)?.[1];
const ink = /fill="(#[0-9a-fA-F]{6})"/.exec(kit)?.[1];
const viewBox = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(kit);
if (!path || !ink || !viewBox)
  throw new Error("kit wordmark: path, fill or viewBox not found");
const [markW, markH] = [Number(viewBox[1]), Number(viewBox[2])];

// The geometry, in CSS pixels. The ink is the app header's own height (`Logo`'s h-5.5, 22px); the
// plate's padding and corner are the kit's card radius (8px).
const SCALE = 2;
const INK_H = 22;
const PAD = 8;
const RADIUS = 8;

const inkW = (INK_H * markW) / markH;
const plateW = Math.ceil(inkW + 2 * PAD); // 122
const plateH = INK_H + 2 * PAD; // 38
const s = SCALE;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${plateW * s}" height="${plateH * s}" viewBox="0 0 ${plateW * s} ${plateH * s}">
  <rect width="${plateW * s}" height="${plateH * s}" rx="${RADIUS * s}" fill="#ffffff"/>
  <g transform="translate(${PAD * s} ${PAD * s}) scale(${(INK_H * s) / markH})"><path d="${path}" fill="${ink}"/></g>
</svg>`;

// sharp is Next's own image dependency, resolved through Next so the repo gains no package.
const fromHere = createRequire(import.meta.url);
const sharp = createRequire(fromHere.resolve("next/package.json"))("sharp");

const out = join(ROOT, "public/email/wordmark-v1.png");
const png = await sharp(Buffer.from(svg), { density: 72 })
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(out, png);

try {
  execFileSync(
    "pngquant",
    ["--force", "--skip-if-larger", "--quality=90-100", "--output", out, out],
    {
      stdio: "pipe",
    },
  );
} catch {
  // pngquant is an optimisation only; the sharp output is already a valid, exact file.
}

console.log(
  `wrote ${out.replace(`${ROOT}/`, "")}: ${plateW * s}x${plateH * s} px (${plateW}x${plateH} at 1x), ${statSync(out).size} bytes`,
);
