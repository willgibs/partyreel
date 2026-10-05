/**
 * THE LOCAL WALK'S CONFIG STAYS THE DEPLOYED ONE (wrangler.walk.jsonc): the same entry, queues, cron and limits, so a
 * walk on the desk build exercises what deploys; only the bucket's `remote` (the real one, from a laptop), the app it
 * leases from (the desk build) and the name differ.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readJsonc(file: string): Record<string, unknown> {
  const text = readFileSync(join(__dirname, "..", file), "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(text) as Record<string, unknown>;
}

describe("wrangler.walk.jsonc", () => {
  const deployed = readJsonc("wrangler.jsonc");
  const walk = readJsonc("wrangler.walk.jsonc");

  it("runs the same Worker the same way", () => {
    for (const key of [
      "main",
      "compatibility_date",
      "queues",
      "triggers",
      "limits",
    ]) {
      expect(walk[key], key).toEqual(deployed[key]);
    }
    expect((walk.vars as Record<string, string>).DRIVE_MODE).toBe(
      (deployed.vars as Record<string, string>).DRIVE_MODE,
    );
  });

  it("reads the real bucket from the laptop, leases from the desk build, and is never the deployed name", () => {
    const [bucket] = walk.r2_buckets as {
      binding: string;
      bucket_name: string;
      remote?: boolean;
    }[];
    const [real] = deployed.r2_buckets as {
      binding: string;
      bucket_name: string;
      remote?: boolean;
    }[];
    expect(bucket).toEqual({ ...real, remote: true });
    expect(real!.remote).toBeUndefined();
    expect((walk.vars as Record<string, string>).DRIVE_APP_URL).toBe(
      "http://localhost:3000",
    );
    expect(walk.name).not.toBe(deployed.name);
  });
});
