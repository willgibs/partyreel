#!/usr/bin/env node
/**
 * Rebuilds public/press/partyreel-press-kit.zip from the PRESS_KIT manifest.
 *
 * Why a committed artifact and not a route handler (2026-08-28, the press-kit round): the zip
 * is a handful of static files that change only when the brand does, so a CDN-served file beats any
 * runtime code. And ADR-0018 ruled AGAINST hand-rolled zip encoders (streaming ZIP64 has silent
 * correctness failure modes that only surface in specific extractors), confining a zip library
 * to the isolated Worker package. So: no encoder, no dependency, no route. The system `zip`
 * writes it here, and src/lib/constants/press-kit.test.ts parses it back and CRC-checks every
 * member against the manifest, so the artifact can never silently drift from the files.
 *
 * THE LOGO CHANGES BEFORE LAUNCH. That is the whole reason this is a script: swap the files in
 * public/press/, edit PRESS_KIT, rerun this. Nothing else moves.
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
 * Usage: node scripts/build-press-kit.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The manifest is TypeScript, so read the file paths out of its source rather than importing
// it (this script runs on bare node, with no transpiler and no tsx dependency). The guard test
// imports the real module, so a divergence between this regex and the manifest fails CI.
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
