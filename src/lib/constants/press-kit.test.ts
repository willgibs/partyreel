import { readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { crc32 } from "node:zlib";

import qrcode from "qrcode-generator";
import { describe, expect, it } from "vitest";

import {
  PRESS_FACTS,
  PRESS_KIT,
  PRESS_KIT_BYTES,
  PRESS_KIT_ZIP,
  formatKitBytes,
} from "./press";

/**
 * THE KIT DRIFT GUARD. The press kit is a COMMITTED zip (scripts/build-press-kit.mjs, see its
 * header for why an artifact beats a route). A committed artifact's one failure mode is going
 * stale: someone swaps a mark, forgets the script, and journalists download last month's logo
 * forever with nothing failing anywhere. So this parses the archive back and compares every
 * member against the manifest and the files on disk.
 *
 * ★ PARSING a zip, never writing one (ADR-0018 ruled out hand-rolled encoders): a parse bug
 * fails loudly here instead of silently in someone's extractor, and the CRCs are self-validating
 * against zip's own output.
 *
 * ★ Iterate PRESS_KIT, never glob public/press/ — the zip LIVES in that directory and a glob
 * would match itself.
 *
 * Never assert byte-identical rebuilds: `zip -X` does not strip mtimes.
 */

const ROOT = process.cwd();
const abs = (sitePath: string) =>
  join(ROOT, "public", sitePath.replace(/^\//, ""));

type ZipMember = { name: string; crc: number; size: number; method: number };

/** Read the central directory (the authoritative index; local headers can lie). */
function readCentralDirectory(zip: Buffer): ZipMember[] {
  const EOCD_SIG = 0x06054b50;
  const CD_SIG = 0x02014b50;
  // The EOCD is last, but a trailing comment can push it back up to 64KB.
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0 && i >= zip.length - 22 - 0xffff; i--) {
    if (zip.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("No EOCD found: not a zip archive");

  const count = zip.readUInt16LE(eocd + 10);
  let at = zip.readUInt32LE(eocd + 16);
  const members: ZipMember[] = [];
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(at) !== CD_SIG) {
      throw new Error(`Bad central-directory signature at entry ${i}`);
    }
    const nameLen = zip.readUInt16LE(at + 28);
    const extraLen = zip.readUInt16LE(at + 30);
    const commentLen = zip.readUInt16LE(at + 32);
    members.push({
      method: zip.readUInt16LE(at + 10),
      crc: zip.readUInt32LE(at + 16),
      size: zip.readUInt32LE(at + 24),
      name: zip.toString("utf8", at + 46, at + 46 + nameLen),
    });
    at += 46 + nameLen + extraLen + commentLen;
  }
  return members;
}

const members = readCentralDirectory(readFileSync(abs(PRESS_KIT_ZIP)));

describe("the press kit manifest", () => {
  it("pins each asset's real byte size (client components print it without an fs.stat)", () => {
    for (const asset of PRESS_KIT) {
      expect(statSync(abs(asset.file)).size, asset.file).toBe(asset.bytes);
    }
  });

  it("has a unique id and a unique file per asset", () => {
    expect(new Set(PRESS_KIT.map((a) => a.id)).size).toBe(PRESS_KIT.length);
    expect(new Set(PRESS_KIT.map((a) => a.file)).size).toBe(PRESS_KIT.length);
  });

  it("derives the display total from the manifest", () => {
    expect(PRESS_KIT_BYTES).toBe(
      PRESS_KIT.reduce((sum, a) => sum + a.bytes, 0),
    );
    expect(formatKitBytes(PRESS_KIT_BYTES)).toMatch(/^\d+(\.\d)? (KB|MB)$/);
  });
});

describe("the committed press-kit zip", () => {
  it("contains exactly the manifest's files, flat and with no macOS resource forks", () => {
    // A missing -X would add __MACOSX/._* members; a stale rebuild would leave orphans.
    expect(members.map((m) => m.name).sort()).toEqual(
      PRESS_KIT.map((a) => basename(a.file)).sort(),
    );
  });

  it("stores every member uncompressed, byte-for-byte identical to the source file", () => {
    for (const asset of PRESS_KIT) {
      const name = basename(asset.file);
      const member = members.find((m) => m.name === name);
      expect(member, `${name} missing from the zip`).toBeDefined();
      const source = readFileSync(abs(asset.file));
      // method 0 = STORE. crc32 is the canonical IEEE CRC-32 the zip format uses.
      expect(member!.method, `${name} is not stored`).toBe(0);
      expect(member!.size, `${name} size`).toBe(source.length);
      expect(
        member!.crc >>> 0,
        `${name} is STALE: rerun scripts/build-press-kit.mjs`,
      ).toBe(crc32(source) >>> 0);
    }
  });
});

describe("the downloadable QR", () => {
  it("still encodes the site URL, with its quiet zone", () => {
    // The one kit asset whose CONTENT can be wrong while the file is perfectly valid:
    // a domain change, or a rebuild the script never got, ships a printable code
    // pointing somewhere else, and the CRC guard above would happily pass it. So
    // regenerate from constants/site.ts (source-read, same reason as the fact-sheet
    // pin below) and compare the path data. Parameters mirror footer-qr.tsx exactly,
    // which is the whole point: what a journalist prints and what the page renders
    // must be the same code.
    const site = readFileSync(join(ROOT, "src/lib/constants/site.ts"), "utf8");
    const url =
      /SITE_URL_FALLBACK\s*=\s*"([^"]+)"/.exec(site)?.[1] ??
      /"(https:\/\/[^"]*partyreel\.com)"/.exec(site)?.[1];
    expect(url, "no site URL found in constants/site.ts").toBeTruthy();

    const QUIET_ZONE = 4;
    const qr = qrcode(0, "M");
    qr.addData(url!);
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col))
          d += `M${col + QUIET_ZONE},${row + QUIET_ZONE}h1v1h-1z`;
      }
    }

    const svg = readFileSync(abs("/press/partyreel-qr.svg"), "utf8");
    expect(
      / d="([^"]+)"/.exec(svg)?.[1],
      "the press QR is STALE: rerun scripts/build-press-qr.mjs",
    ).toBe(d);
    // A code with no quiet zone is unscannable the moment it lands on a coloured
    // page, and that failure only shows up in print.
    expect(svg).toContain(
      `viewBox="0 0 ${count + QUIET_ZONE * 2} ${count + QUIET_ZONE * 2}"`,
    );
  });
});

describe("the press fact sheet", () => {
  it("mirrors constants/site.ts without importing it (site.ts pulls in eager env parsing)", () => {
    // Source-text pin, the footer-contract.test.ts house pattern: importing site.ts here would
    // drag lib/env.ts into the node test graph, where `env` throws without NEXT_PUBLIC_*.
    const site = readFileSync(join(ROOT, "src/lib/constants/site.ts"), "utf8");
    const email = PRESS_FACTS.find((f) => f.label === "Press contact")?.value;
    const domain = PRESS_FACTS.find((f) => f.label === "Website")?.value;
    expect(site).toContain(`SUPPORT_EMAIL = "${email}"`);
    expect(site).toMatch(
      new RegExp(`https://(www\\.)?${domain!.replace(".", "\\.")}`),
    );
  });

  it("uses no pipes (buildLlmsFullTxt renders these as markdown table rows)", () => {
    for (const { label, value } of PRESS_FACTS) {
      expect(`${label}${value}`).not.toContain("|");
    }
  });
});
