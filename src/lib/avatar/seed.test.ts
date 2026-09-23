// @contract-for: src/lib/avatar/seed.ts
import { randomUUID } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

// seed.ts is `server-only` (node:crypto at call time); the unit project has
// no react-server condition, so the real package is never installed (same
// pattern as docs/review/ledger.test.ts).
vi.mock("server-only", () => ({}));

import { orbFor } from "./gradient";
import { seedFor } from "./seed";

/**
 * `seedFor`'S CONTRACT: deterministic, one-way, and — fed real account ids —
 * never a colour concentration. The generator's own contract (gradient.test.ts)
 * covers `orbFor` in isolation; this covers the PRODUCTION PATH a real id
 * actually walks (id -> seedFor -> orbFor), which is the path a bug in the
 * hashing step would actually show up on.
 */

describe("seedFor", () => {
  it("is deterministic: the same id hashes the same way every time", () => {
    const id = randomUUID();
    expect(seedFor(id)).toBe(seedFor(id));
  });

  it("gives every id its own hash", () => {
    const a = randomUUID();
    const b = randomUUID();
    expect(seedFor(a)).not.toBe(seedFor(b));
  });

  it("is a sha-256 hex digest: 64 lowercase hex characters", () => {
    expect(seedFor(randomUUID())).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never returns or contains the id it was given", () => {
    const id = randomUUID();
    const seed = seedFor(id);
    expect(seed).not.toBe(id);
    expect(seed).not.toContain(id);
  });
});

/**
 * THE VARIETY GUARANTEE, ON THE PRODUCTION PATH (Will, the sixth
 * batch: "We should ensure the account ID randomness leads to a variety
 * across the color wheel and can't lead to a high concentration of one to
 * two colors"). A thousand real UUIDs, hashed the way `seedFor` actually
 * hashes them, fed to the generator the way every surface actually feeds it —
 * so a concentration introduced by the extra hashing step (not just by
 * `orbFor` itself) would fail here.
 */
describe("a thousand real accounts, seeded through seedFor", () => {
  it("fills every 30 degree bucket and never concentrates in one or two", () => {
    const ids = Array.from({ length: 1000 }, () => randomUUID());
    const buckets = new Array(12).fill(0);
    for (const id of ids) {
      const hue = orbFor(seedFor(id)).hue;
      buckets[Math.floor(hue / 30) % 12] += 1;
    }
    const mean = ids.length / buckets.length;
    for (const [i, n] of buckets.entries()) {
      expect(n, `bucket ${i * 30}-${i * 30 + 30} holds ${n}`).toBeGreaterThan(
        mean * 0.4,
      );
      expect(
        n,
        `bucket ${i * 30}-${i * 30 + 30} holds ${n}, over twice the ${mean.toFixed(0)} mean`,
      ).toBeLessThan(mean * 2);
    }
  });
});
