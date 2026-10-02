/**
 * THE WORKER'S REPORTS, AS THE APP VERIFIES THEM (`report.ts`), and where the app asks for them.
 *
 * `VECTOR` is pinned in the Worker's suite too (`workers/export/src/report.test.ts`): it signs with Web
 * Crypto, this verifies with node:crypto, and the one string both hold equal is the contract.
 */
import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  REPORT_FRESH_MS,
  reportAddressFor,
  signReport,
  verifyReport,
  type WorkerReport,
} from "@/lib/export/report";

const VECTOR_SECRET = "report-vector-secret";
const VECTOR_REPORT: WorkerReport = {
  v: 1,
  kind: "end",
  jti: "0123456789abcdef0123456789abcdef",
  at: 1_900_000_000_000,
  outcome: "short",
  files: 2,
  missing: ["66666666-7777-4888-9999-aaaaaaaaaaaa"],
};
const VECTOR =
  "eyJ2IjoxLCJraW5kIjoiZW5kIiwianRpIjoiMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYiLCJhdCI6MTkwMDAwMDAwMDAwMCwib3V0Y29tZSI6InNob3J0IiwiZmlsZXMiOjIsIm1pc3NpbmciOlsiNjY2NjY2NjYtNzc3Ny00ODg4LTk5OTktYWFhYWFhYWFhYWFhIl19.7bc74e4e5c3848821899a01ca86f47acb2d436e6966742baafe68a539d08ed44";
const NOW = VECTOR_REPORT.at;

describe("a report from the Worker", () => {
  it("verifies the pinned vector, and signs it byte for byte", () => {
    expect(verifyReport(VECTOR_SECRET, VECTOR, NOW)).toEqual({
      ok: true,
      report: VECTOR_REPORT,
    });
    expect(signReport(VECTOR_SECRET, VECTOR_REPORT)).toBe(VECTOR);
  });

  it("★ is never a token, and a token is never a report", () => {
    const [body] = VECTOR.split(".");
    // A token's MAC (over the bare body) on a report's body: refused.
    const asToken = `${body}.${createHmac("sha256", VECTOR_SECRET).update(body).digest("hex")}`;
    expect(verifyReport(VECTOR_SECRET, asToken, NOW)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it.each([
    ["another secret", "not-the-secret", VECTOR],
    ["a flipped MAC", VECTOR_SECRET, VECTOR.slice(0, -1) + "0"],
  ])("refuses %s", (_, secret, wire) => {
    expect(verifyReport(secret, wire, NOW)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it.each([
    ["nothing", ""],
    ["no MAC", "abc"],
    ["two dots", "a.b.c"],
  ])("refuses %s as malformed", (_, wire) => {
    expect(verifyReport(VECTOR_SECRET, wire, NOW)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("refuses a signed body that is no report: an unknown kind, a bad nonce, a check with neither count nor error", () => {
    for (const report of [
      { ...VECTOR_REPORT, kind: "launch" },
      { ...VECTOR_REPORT, jti: "not-a-nonce" },
      { ...VECTOR_REPORT, missing: ["../../etc"] },
      { v: 1, kind: "check", jti: VECTOR_REPORT.jti, at: NOW, items: 3 },
      { v: 1, kind: "check", jti: VECTOR_REPORT.jti, at: NOW, items: 3, found: 4 },
      { v: 2, kind: "start", jti: VECTOR_REPORT.jti, at: NOW },
    ]) {
      const wire = signReport(VECTOR_SECRET, report as WorkerReport);
      expect(verifyReport(VECTOR_SECRET, wire, NOW)).toEqual({
        ok: false,
        reason: "malformed",
      });
    }
  });

  it("★ refuses one older or newer than five minutes, so a captured report cannot be replayed later", () => {
    expect(verifyReport(VECTOR_SECRET, VECTOR, NOW + REPORT_FRESH_MS).ok).toBe(
      true,
    );
    expect(verifyReport(VECTOR_SECRET, VECTOR, NOW + REPORT_FRESH_MS + 1)).toEqual(
      { ok: false, reason: "stale" },
    );
    expect(verifyReport(VECTOR_SECRET, VECTOR, NOW - REPORT_FRESH_MS - 1)).toEqual(
      { ok: false, reason: "stale" },
    );
  });
});

describe("where the app asks for reports", () => {
  const WORKER = "https://partyreel-export.partyreel-team.workers.dev";

  it("asks at its own origin, so a report returns to the deployment that minted the token", () => {
    expect(reportAddressFor("https://partyreel.com", WORKER)).toBe(
      "https://partyreel.com/api/export/report",
    );
    expect(
      reportAddressFor(
        "https://partyreel-git-launch-prep-partyreel.vercel.app",
        WORKER,
      ),
    ).toBe(
      "https://partyreel-git-launch-prep-partyreel.vercel.app/api/export/report",
    );
  });

  it("asks nothing where the Worker could never reach it: a laptop behind a deployed Worker", () => {
    expect(reportAddressFor("http://localhost:3132", WORKER)).toBeNull();
    expect(reportAddressFor("http://127.0.0.1:3132", WORKER)).toBeNull();
  });

  it("asks a local Worker (a lane's wrangler dev) at the local app", () => {
    expect(
      reportAddressFor("http://localhost:3132", "http://localhost:8787"),
    ).toBe("http://localhost:3132/api/export/report");
  });

  it("never asks in the clear, nor from what is no origin", () => {
    expect(reportAddressFor("http://partyreel.com", WORKER)).toBeNull();
    expect(reportAddressFor("not a url", WORKER)).toBeNull();
  });
});
