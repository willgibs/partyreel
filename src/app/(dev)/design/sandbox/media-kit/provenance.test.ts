import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { STAND_INS } from "./kit";

/**
 * THE STAGED BATCH'S PROVENANCE PIN (the media-kit track, 2026-09-14).
 *
 * The batch is a proposal, not a shipped byte, but it is the thing the whole
 * round argues about, so it gets the same treatment the real manifest gets in
 * marketing-media.test.ts: both directions pinned, and a license line that has
 * to be TRUE rather than merely non-empty.
 *
 * The board reads kit.ts and a human reads provenance.json beside the files.
 * That is two copies of one fact, which is exactly how a provenance record goes
 * quietly wrong, so this test makes the duplication an invariant instead: every
 * field a reviewer would rule on has to match in both places, every file has to
 * exist, and nothing may sit in the directory without a record.
 *
 * When the ruling lands this whole directory leaves with the board. If a
 * licensed frame is carried forward it moves into public/marketing/ under
 * MARKETING_IMAGES, where marketing-media.test.ts takes over.
 */

const DIR = join(process.cwd(), "public", "design", "media-kit");
const RECORD = join(DIR, "provenance.json");

type Record = {
  replaces: string;
  file: string;
  subject: string;
  author: string;
  sourceUrl: string;
  retrieved: string;
  license: string;
  caution: string | null;
  bytes: number;
};

const provenance = JSON.parse(readFileSync(RECORD, "utf8")) as {
  files: Record[];
};
const byStandIn = new Map(provenance.files.map((r) => [r.replaces, r]));

// The board's own cap. A candidate is a web-sized proof, not a master: anything
// heavier is a master that slipped in, and the lab should not serve those.
const MAX_BYTES = 300 * 1024;

describe("the staged candidate batch", () => {
  it("every staged file exists and is under the board's size cap", () => {
    for (const r of provenance.files) {
      const path = join(DIR, r.file);
      expect(existsSync(path), r.file).toBe(true);
      expect(statSync(path).size, r.file).toBeLessThanOrEqual(MAX_BYTES);
    }
  });

  it("every file in the directory has a provenance record (no orphans)", () => {
    const recorded = new Set(provenance.files.map((r) => r.file));
    for (const name of readdirSync(DIR)) {
      if (name === "provenance.json" || name.startsWith(".")) continue;
      expect(recorded.has(name), `orphan: ${name}`).toBe(true);
    }
  });

  it("every candidate on the board matches its provenance record", () => {
    for (const standIn of STAND_INS) {
      const candidate = standIn.licensed;
      if (!candidate) continue;
      const record = byStandIn.get(standIn.id);
      expect(record, `no provenance record for ${standIn.id}`).toBeDefined();
      if (!record) continue;
      expect(candidate.file, standIn.id).toBe(record.file);
      expect(candidate.subject, standIn.id).toBe(record.subject);
      expect(candidate.author, standIn.id).toBe(record.author);
      expect(candidate.sourceUrl, standIn.id).toBe(record.sourceUrl);
      expect(candidate.retrieved, standIn.id).toBe(record.retrieved);
      expect(candidate.caution ?? null, standIn.id).toBe(record.caution);
    }
  });

  it("every record names an author, a source and a retrieval date", () => {
    // The three fields the proposed rule makes required (spec section 1.2).
    for (const r of provenance.files) {
      expect(r.author.trim().length, r.file).toBeGreaterThan(0);
      expect(r.sourceUrl.startsWith("https://"), r.file).toBe(true);
      expect(r.retrieved, r.file).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every record is CC0, which is the only license this batch was cut under", () => {
    for (const r of provenance.files) {
      expect(r.license, r.file).toMatch(/^CC0 1\.0/);
    }
  });

  it("a staged candidate replaces a real stand-in", () => {
    const ids = new Set(STAND_INS.map((s) => s.id));
    for (const r of provenance.files) {
      expect(ids.has(r.replaces), `${r.file} replaces nothing`).toBe(true);
    }
  });
});
