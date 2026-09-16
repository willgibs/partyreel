import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANDIDATE_BASIS,
  CANDIDATE_CLAUSE,
  CANDIDATE_LICENSE,
  CANDIDATE_RETRIEVED,
  CANDIDATES,
} from "./candidates";

/**
 * THE STAGED BATCH'S PROVENANCE PIN (the media-kit track; round two widened it).
 *
 * The batch is a proposal, not a shipped byte, but it is what the round argues
 * about, so it gets the treatment the real manifest gets in
 * marketing-media.test.ts: both directions pinned, and a provenance line that has
 * to be TRUE rather than merely non-empty.
 *
 * ★ THIS TEST IS THE PROPOSAL, EXECUTED. Spec section 1.2 asks that `author`,
 * `sourceUrl`, `license`, `clause`, `retrieved` and `people` become required on a
 * manifest entry, and 1.3 asks that the test assert the SHAPE rather than the
 * emptiness. Everything below is that assertion, running against 24 records, so
 * the rule is something Will can see working before he rules on it.
 *
 * A human reads provenance.json beside the files and this module holds the same
 * records. That is two copies of one fact, which is exactly how a provenance
 * record goes quietly wrong, so the duplication is an invariant instead.
 *
 * ★ IT OUTLIVED THE BOARD SECTION THAT RENDERED IT (round six, 2026-09-16).
 * The catalog dropped the staged batch, because a batch of exact picks is the
 * one thing Will's round-four note asked this track to stop returning. The
 * SUITE stays, and so do the 22 files under public/design/media-kit/, because
 * ask 1 claims the rule is already a passing suite rather than a proposal, and
 * the claim has to keep being true while the ask is open.
 *
 * When the ruling lands this directory leaves with the board. A frame carried
 * forward moves into public/marketing/ under MARKETING_IMAGES, where
 * marketing-media.test.ts takes over.
 */

const DIR = join(process.cwd(), "public", "design", "media-kit");
const RECORD = join(DIR, "provenance.json");

type Row = {
  key: string;
  file: string;
  subject: string;
  author: string;
  source: string;
  sourceUrl: string;
  upstream: string | null;
  license: string;
  licenseUrl: string;
  clause: string;
  basis: string;
  created: string;
  retrieved: string;
  people: string;
  caution: string | null;
  width: number;
  height: number;
  bytes: number;
  staged: number;
};

const provenance = JSON.parse(readFileSync(RECORD, "utf8")) as { files: Row[] };
const byKey = new Map(provenance.files.map((r) => [r.key, r]));

// A candidate is a web-sized proof, not a master: anything heavier is a master
// that slipped in, and the lab should not serve those.
const MAX_BYTES = 300 * 1024;

describe("the staged candidate batch", () => {
  it("every staged file exists, is under the size cap, and is 1200 px on the long edge", () => {
    for (const c of CANDIDATES) {
      const path = join(DIR, c.file);
      expect(existsSync(path), c.file).toBe(true);
      expect(statSync(path).size, c.file).toBe(c.bytes);
      expect(c.bytes, c.file).toBeLessThanOrEqual(MAX_BYTES);
      expect(Math.max(c.width, c.height), c.file).toBeLessThanOrEqual(1200);
    }
  });

  it("every file in the directory has a record, and every record a file (no orphans)", () => {
    const named = new Set(CANDIDATES.map((c) => c.file));
    for (const name of readdirSync(DIR)) {
      if (name === "provenance.json" || name.startsWith(".")) continue;
      expect(named.has(name), `orphan on disk: ${name}`).toBe(true);
    }
    expect(provenance.files.length).toBe(CANDIDATES.length);
  });

  it("candidates.ts and provenance.json agree field by field", () => {
    for (const c of CANDIDATES) {
      const r = byKey.get(c.key);
      expect(r, `no provenance record for ${c.key}`).toBeDefined();
      if (!r) continue;
      expect(r.file, c.key).toBe(c.file);
      expect(r.subject, c.key).toBe(c.subject);
      expect(r.author, c.key).toBe(c.author);
      expect(r.sourceUrl, c.key).toBe(c.sourceUrl);
      expect(r.upstream, c.key).toBe(c.upstream);
      expect(r.created, c.key).toBe(c.created);
      expect(r.people, c.key).toBe(c.people);
      expect(r.caution, c.key).toBe(c.caution);
      expect(r.width, c.key).toBe(c.width);
      expect(r.height, c.key).toBe(c.height);
      expect(r.bytes, c.key).toBe(c.bytes);
      expect(r.staged, c.key).toBe(c.staged);
    }
  });

  it("every record carries all six fields the rule makes required", () => {
    // spec 1.2: author, sourceUrl, license, clause, retrieved, people.
    for (const r of provenance.files) {
      expect(r.author.trim().length, r.file).toBeGreaterThan(0);
      expect(r.sourceUrl.startsWith("https://"), r.file).toBe(true);
      expect(r.license, r.file).toBe(CANDIDATE_LICENSE);
      expect(r.clause, r.file).toBe(CANDIDATE_CLAUSE);
      expect(r.basis, r.file).toBe(CANDIDATE_BASIS);
      expect(r.retrieved, r.file).toBe(CANDIDATE_RETRIEVED);
      expect(["none", "unidentifiable", "identifiable"], r.file).toContain(
        r.people,
      );
      expect(r.created, r.file).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every file predates 5 June 2017, which is the whole basis of the batch", () => {
    // Unsplash replaced CC0 with its own license that day, and Commons applies
    // the Unsplash template only to what came before it (spec 4.2). A record
    // created after it is not CC0 whatever the file page says.
    for (const r of provenance.files) {
      expect(r.created < "2017-06-05", `${r.file} created ${r.created}`).toBe(
        true,
      );
    }
  });

  it("a frame with an identifiable face carries a caution, without exception", () => {
    // Rule 1.4: no free tier supplies a model release, so an identifiable face
    // cannot ship on a page that makes a claim. The board must never show one
    // without saying so.
    for (const c of CANDIDATES) {
      if (c.people !== "identifiable") continue;
      expect(c.caution, `${c.key} has a face and no caution`).toBeTruthy();
    }
  });
});
