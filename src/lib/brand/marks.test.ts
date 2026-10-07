import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BRAND_FILES } from "./files";

/**
 * EVERY FILE A MARK IS SHIPPED IN IS ITS SOURCE'S DRAWING, NOW. The wordmark
 * and the Ring each have one home (`wordmark.ts`, `ring.ts`), and
 * `scripts/build-press-kit.mjs` draws every file from them: the favicon and
 * the app icons, the brand kit and the press kit. A file is a copy, and a
 * copy's one failure is going stale silently (a source retuned, the script
 * never rerun, the tab and the press kit still wearing last month's mark), so
 * every SVG is held to its source byte for byte, and every raster's size and
 * shape is checked where it is read.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel));

/** A PNG's width and height, from its header. */
const pngSize = (png: Buffer) => {
  expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

describe("the brand's files", () => {
  it.each(BRAND_FILES.map((f) => [f.path, f] as const))(
    "%s is its source's drawing",
    (path, file) => {
      expect(
        read(path).toString("utf8"),
        `${path} is stale: rerun node scripts/build-press-kit.mjs`,
      ).toBe(file.svg());
    },
  );

  it("ships the favicon as four PNG entries, 16 to 256, each its own size's cut", () => {
    const ico = read("src/app/favicon.ico");
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes: number[] = [];
    for (let i = 0; i < count; i++) {
      const e = 6 + 16 * i;
      const size = ico.readUInt8(e) || 256;
      const png = ico.subarray(
        ico.readUInt32LE(e + 12),
        ico.readUInt32LE(e + 12) + ico.readUInt32LE(e + 8),
      );
      expect(pngSize(png)).toEqual([size, size]);
      sizes.push(size);
    }
    expect(sizes).toEqual([16, 32, 48, 256]);
  });

  it("ships the app icons at the sizes the manifest and iOS name", () => {
    expect(pngSize(read("src/app/apple-icon.png"))).toEqual([180, 180]);
    expect(pngSize(read("public/icons/icon-192.png"))).toEqual([192, 192]);
    expect(pngSize(read("public/icons/icon-512.png"))).toEqual([512, 512]);
    expect(pngSize(read("public/icons/icon-512-maskable.png"))).toEqual([
      512, 512,
    ]);
    const manifest = readFileSync(join(ROOT, "src/app/manifest.ts"), "utf8");
    for (const icon of [
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/icon-512-maskable.png",
    ])
      expect(manifest).toContain(icon);
  });

  it("ships the press kit's rasters as the brand kit's, byte for byte", () => {
    for (const name of [
      "mark-dark",
      "mark-light",
      "mark-mono",
      "wordmark-dark",
      "wordmark-light",
    ])
      expect(
        read(`public/press/partyreel-${name}.png`).equals(
          read(`kit/logo/partyreel-${name}.png`),
        ),
        `${name}.png: rerun node scripts/build-press-kit.mjs`,
      ).toBe(true);
    expect(
      read("public/press/partyreel-app-icon.png").equals(
        read("public/icons/icon-512.png"),
      ),
    ).toBe(true);
  });
});
