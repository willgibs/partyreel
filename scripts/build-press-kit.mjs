#!/usr/bin/env node
/**
 * THE BRAND'S FILES: draws every file the brand's marks live in from their two sources, then rebuilds
 * public/press/partyreel-press-kit.zip from the PRESS_KIT manifest.
 *
 * ★ TWO SOURCES, EVERY FILE DRAWN FROM THEM (brand-marks r1's wiring, 2026-10-07). The wordmark is
 * `src/lib/brand/wordmark.ts` (Will's v1 letters and its two cuts) and the icon is `src/lib/brand/ring.ts`
 * (the ember Ring and its cuts by size). This script writes every file a mark is shipped in, so a change to
 * either source is one rerun:
 *   - the icons Next and the browser read: src/app/icon.svg (a tab's cut), src/app/favicon.ico (16, 32, 48
 *     and 256, each its size's cut), src/app/apple-icon.png (180, the tile full bleed: iOS masks it itself)
 *     and the manifest's public/icons/ (192 and 512 in the home screen's corner, and the 512 maskable full
 *     bleed, its ring inside the 80% circle a mask always keeps). Every app bitmap is shown at about 60 points
 *     on a home screen, so each wears the home screen's cut, whatever its pixel size;
 *   - the brand kit for outside tools, kit/logo/ (kit/README.md says what each file is for);
 *   - the press kit, public/press/: the kit's marks and wordmarks, the app icon (the 512).
 * The share card (public/press/partyreel-share-card.png) is the social card's own bytes, `/opengraph-image`
 * saved from a local server; the QR is scripts/build-press-qr.mjs's.
 *
 * `src/lib/brand/marks.test.ts` holds every SVG written here to its source byte for byte, so a source changed
 * without this rerun fails a test that names this script. A PNG is a raster of one of those SVGs (sharp, from
 * Next's own dependency, so the repo gains no package), held by the press kit's own CRC guard below.
 *
 * Why the zip is a committed artifact and not a route handler (2026-08-28, the press-kit round): the zip
 * is a handful of static files that change only when the brand does, so a CDN-served file beats any
 * runtime code. And uploads-and-r2.md ruled AGAINST hand-rolled zip encoders (streaming ZIP64 has silent
 * correctness failure modes that only surface in specific extractors), confining a zip library
 * to the isolated Worker package. So: no encoder, no dependency, no route. The system `zip`
 * writes it here, and src/lib/constants/press-kit.test.ts parses it back and CRC-checks every
 * member against the manifest, so the artifact can never silently drift from the files. After a run, the
 * manifest's `bytes` follow the files: the run prints each press file's size for `PRESS_KIT`.
 *
 * Flags, all load-bearing:
 *   -0  STORE, no compression. The PNGs are already compressed and the SVGs are tiny; keeping
 *       members stored makes the CRC guard a plain read of the source bytes.
 *   -X  drop extra file attributes. NOT cosmetic: every file in public/press/ carries macOS
 *       extended attributes, and without -X the archive gains __MACOSX/._* members that the
 *       drift guard would (correctly) reject.
 *   -j  junk paths, so the archive is flat and a journalist gets loose files, not nested dirs.
 *
 * Not byte-reproducible across runs: -X does not strip mtimes. The guard compares names, sizes
 * and CRCs, never bytes, so that is fine. Do not add a byte-identity assertion.
 *
 * Usage: node scripts/build-press-kit.mjs             draw every mark file, then zip the press kit
 *        node scripts/build-press-kit.mjs --zip-only  zip the press kit as its files stand
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const at = (rel) => join(ROOT, rel);

/* ── 1. THE MARKS ─────────────────────────────────────────────────────────── */

if (!process.argv.includes("--zip-only")) {
  let ring, wordmark, BRAND_FILES;
  try {
    ring = await import(new URL("../src/lib/brand/ring.ts", import.meta.url));
    wordmark = await import(
      new URL("../src/lib/brand/wordmark.ts", import.meta.url)
    );
    ({ BRAND_FILES } = await import(
      new URL("../src/lib/brand/files.ts", import.meta.url)
    ));
  } catch (e) {
    console.error(
      "Couldn't import the brand's TypeScript sources. This script relies on Node's native type\n" +
        "stripping (default since 22.18; repo pins 22.21.1 in .nvmrc). Run `nvm use` or\n" +
        "retry with: node --experimental-strip-types scripts/build-press-kit.mjs",
    );
    throw e;
  }

  // sharp is Next's own image dependency, resolved through Next so the repo gains no package.
  const fromHere = createRequire(import.meta.url);
  const sharp = createRequire(fromHere.resolve("next/package.json"))("sharp");

  /**
   * An SVG document (drawn at its own width) rasterised to `width` by `height`, transparent where it is.
   * ★ SUPERSAMPLED, THEN SCALED DOWN: librsvg drawing a 16px ring straight onto 16 pixels softens the band
   * into a smudge, where drawn at eight times and scaled down (lanczos) it keeps a crisp ring, as a
   * browser's own rasteriser does. About 2048 pixels across is enough at every size.
   */
  const raster = (svg, width, height = width) =>
    sharp(Buffer.from(svg), {
      density: 72 * Math.min(8, Math.max(1, Math.round(2048 / width))),
    })
      .resize(width, height, { fit: "fill" })
      .png({ compressionLevel: 9 })
      .toBuffer();

  /**
   * A favicon.ico of PNG entries (every browser and Windows since Vista read a PNG entry): a 6-byte header, a
   * 16-byte directory entry per image, then the images.
   */
  const ico = (images) => {
    const head = Buffer.alloc(6 + 16 * images.length);
    head.writeUInt16LE(0, 0);
    head.writeUInt16LE(1, 2);
    head.writeUInt16LE(images.length, 4);
    let offset = head.length;
    images.forEach(({ size, png }, i) => {
      const e = 6 + 16 * i;
      head.writeUInt8(size >= 256 ? 0 : size, e);
      head.writeUInt8(size >= 256 ? 0 : size, e + 1);
      head.writeUInt8(0, e + 2);
      head.writeUInt8(0, e + 3);
      head.writeUInt16LE(1, e + 4);
      head.writeUInt16LE(32, e + 6);
      head.writeUInt32LE(png.length, e + 8);
      head.writeUInt32LE(offset, e + 12);
      offset += png.length;
    });
    return Buffer.concat([head, ...images.map((x) => x.png)]);
  };

  const written = [];
  const write = (rel, data) => {
    writeFileSync(at(rel), data);
    written.push(rel);
  };

  // Every SVG file, from the one table the drift test reads too (the press kit's copies among them).
  for (const file of BRAND_FILES) write(file.path, file.svg());
  const svgOf = (path) => BRAND_FILES.find((f) => f.path === path).svg();

  // The favicon: each entry its own size's cut, drawn at that size.
  const icoSizes = [16, 32, 48, 256];
  write(
    "src/app/favicon.ico",
    ico(
      await Promise.all(
        icoSizes.map(async (size) => ({
          size,
          png: await raster(ring.ringSvg({ size, shape: "squircle" }), size),
        })),
      ),
    ),
  );
  // The app's bitmaps: each shown at about 60 points on a home screen, so each wears that cut.
  const home = (size, shape) =>
    raster(ring.ringSvg({ size, cutAt: 60, shape }), size);
  write("src/app/apple-icon.png", await home(180, "square"));
  write("public/icons/icon-192.png", await home(192, "squircle"));
  write("public/icons/icon-512.png", await home(512, "squircle"));
  write("public/icons/icon-512-maskable.png", await home(512, "square"));

  // The brand kit's rasters: the marks at 1024 square, the wordmarks 512 tall, each from its own SVG.
  for (const name of ["mark-dark", "mark-light", "mark-mono"])
    write(
      `kit/logo/partyreel-${name}.png`,
      await raster(svgOf(`kit/logo/partyreel-${name}.svg`), 1024),
    );
  for (const name of ["wordmark-dark", "wordmark-light"]) {
    const w = Math.round(wordmark.WORDMARK_DISPLAY.width * 8);
    write(
      `kit/logo/partyreel-${name}.png`,
      await raster(svgOf(`kit/logo/partyreel-${name}.svg`), w, 512),
    );
  }

  // The press kit carries the brand kit's rasters byte for byte (its SVGs are in the table), and the app icon.
  for (const name of [
    "mark-dark",
    "mark-light",
    "mark-mono",
    "wordmark-dark",
    "wordmark-light",
  ]) {
    copyFileSync(
      at(`kit/logo/partyreel-${name}.png`),
      at(`public/press/partyreel-${name}.png`),
    );
    written.push(`public/press/partyreel-${name}.png`);
  }
  copyFileSync(
    at("public/icons/icon-512.png"),
    at("public/press/partyreel-app-icon.png"),
  );
  written.push("public/press/partyreel-app-icon.png");

  for (const rel of written)
    console.log(`  ${String(statSync(at(rel)).size).padStart(7)}  ${rel}`);
}

/* ── 2. THE PRESS KIT'S ZIP ───────────────────────────────────────────────── */

// The manifest is TypeScript, so read the file paths out of its source rather than importing
// it (its rows are plain literals, and the guard test imports the real module, so a divergence
// between this regex and the manifest fails CI).
const manifest = await import("node:fs").then(({ readFileSync }) =>
  readFileSync(join(ROOT, "src/lib/constants/press.ts"), "utf8"),
);
const files = [...manifest.matchAll(/file:\s*"(\/press\/[^"]+)"/g)].map(
  (m) => m[1],
);
const zipPath = /PRESS_KIT_ZIP\s*=\s*"(\/press\/[^"]+)"/.exec(manifest)?.[1];

if (files.length === 0) throw new Error("No PRESS_KIT files found in press.ts");
if (!zipPath) throw new Error("No PRESS_KIT_ZIP found in press.ts");

const out = join(ROOT, "public", zipPath.replace(/^\//, ""));
const sources = files.map((f) => {
  const abs = join(ROOT, "public", f.replace(/^\//, ""));
  if (!existsSync(abs)) throw new Error(`Missing kit asset: ${f}`);
  return abs;
});

// zip APPENDS to an existing archive, so a stale member would survive a manifest shrink.
if (existsSync(out)) rmSync(out);
execFileSync("zip", ["-0", "-X", "-j", out, ...sources], { stdio: "pipe" });

const total = sources.reduce((sum, f) => sum + statSync(f).size, 0);
console.log(
  `Built ${zipPath}: ${files.length} files, ${statSync(out).size} bytes (${total} uncompressed)`,
);
for (const f of files)
  console.log(
    `  ${f}: ${statSync(join(ROOT, "public", f.replace(/^\//, ""))).size} bytes`,
  );
