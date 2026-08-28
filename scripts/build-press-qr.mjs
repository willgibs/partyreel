#!/usr/bin/env node
/**
 * Generates the downloadable press QR at public/press/partyreel-qr.{svg,png}.
 *
 * Why a committed file and not just the on-page island: a journalist laying out a print
 * piece needs the CODE ITSELF, and a printed code that resolves to partyreel.com is the
 * one press asset that works in their own medium. The page renders the same value live
 * (FooterQr, server-rendered, zero client JS) so what you see is what you download.
 *
 * Mirrors footer-qr.tsx exactly: error correction "M", a REAL 4-module quiet zone baked
 * into the viewBox (the spec minimum; without it the code is unscannable the moment
 * someone drops it onto a colored page), one <path> of 1-unit squares, crispEdges so
 * antialiasing leaves no seams between adjacent modules.
 *
 * The PNG is rasterized with macOS qlmanage, which pads to a square canvas. That is fine
 * and in fact wanted here, because the source is already square.
 *
 * Usage: node scripts/build-press-qr.mjs
 */

import { execFileSync } from "node:child_process";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import qrcode from "qrcode-generator";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_SVG = join(ROOT, "public/press/partyreel-qr.svg");
const OUT_PNG = join(ROOT, "public/press/partyreel-qr.png");
const PNG_SIZE = 1024;
const QUIET_ZONE = 4;

// The apex, read from constants/site.ts rather than hardcoded so the asset cannot drift
// from the site's own identity. Not imported: this runs on bare node with no transpiler.
const site = readFileSync(join(ROOT, "src/lib/constants/site.ts"), "utf8");
const value = /SITE_URL_FALLBACK\s*=\s*"([^"]+)"|"(https:\/\/[^"]*partyreel\.com)"/.exec(
  site,
)?.slice(1).find(Boolean);
if (!value) throw new Error("Could not read the site URL from constants/site.ts");

const qr = qrcode(0, "M");
qr.addData(value);
qr.make();

const count = qr.getModuleCount();
const span = count + QUIET_ZONE * 2;
let d = "";
for (let row = 0; row < count; row++) {
  for (let col = 0; col < count; col++) {
    if (qr.isDark(row, col)) d += `M${col + QUIET_ZONE},${row + QUIET_ZONE}h1v1h-1z`;
  }
}

writeFileSync(
  OUT_SVG,
  `<svg width="1024" height="1024" viewBox="0 0 ${span} ${span}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect width="${span}" height="${span}" fill="#ffffff"/>
  <path d="${d}" fill="#101010"/>
</svg>
`,
);

rmSync(OUT_PNG, { force: true });
execFileSync(
  "qlmanage",
  ["-t", "-s", String(PNG_SIZE), "-o", dirname(OUT_PNG), OUT_SVG],
  { stdio: "pipe" },
);
renameSync(`${OUT_PNG.replace(/\.png$/, "")}.svg.png`, OUT_PNG);

console.log(`Built the press QR for ${value} (svg + ${PNG_SIZE}px png)`);
