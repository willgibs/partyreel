/**
 * THE REPORT'S WIRE FORMAT, AND WHERE A REPORT MAY GO (`report.ts`).
 *
 * The vector below is pinned in the app's suite too (`src/lib/export/report.test.ts`): the Worker signs
 * with Web Crypto and the app verifies with node:crypto, so one string held equal on both sides is
 * what keeps the two halves of one contract from drifting.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { reportAddress, sendReport, signReport, type Report } from "./report";
import { hmacHex } from "./testing/sign";

const VECTOR_SECRET = "report-vector-secret";
const VECTOR_REPORT: Report = {
  v: 1,
  kind: "end",
  jti: "0123456789abcdef0123456789abcdef",
  at: 1_900_000_000_000,
  outcome: "short",
  files: 2,
  missing: ["66666666-7777-4888-9999-aaaaaaaaaaaa"],
};
/** The signed string, as both halves must produce and accept it. */
const VECTOR =
  "eyJ2IjoxLCJraW5kIjoiZW5kIiwianRpIjoiMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYiLCJhdCI6MTkwMDAwMDAwMDAwMCwib3V0Y29tZSI6InNob3J0IiwiZmlsZXMiOjIsIm1pc3NpbmciOlsiNjY2NjY2NjYtNzc3Ny00ODg4LTk5OTktYWFhYWFhYWFhYWFhIl19.7bc74e4e5c3848821899a01ca86f47acb2d436e6966742baafe68a539d08ed44";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a signed report", () => {
  it("is the pinned vector, byte for byte", async () => {
    expect(await signReport(VECTOR_SECRET, VECTOR_REPORT)).toBe(VECTOR);
  });

  it("★ is MACed in its own domain, so it can never pass as a token", async () => {
    const signed = await signReport(VECTOR_SECRET, VECTOR_REPORT);
    const [body, mac] = signed.split(".");
    // A token's MAC is over its bare body; a report's is over "report:" and the body.
    const asToken = await hmacHex(VECTOR_SECRET, body);
    expect(mac).not.toBe(asToken);
    expect(body).not.toContain(":");
  });
});

describe("where a report may go", () => {
  it("takes the app's report path over https, or plain http to a local host", () => {
    expect(reportAddress("https://partyreel.com/api/export/report")).toBe(
      "https://partyreel.com/api/export/report",
    );
    expect(reportAddress("http://localhost:3132/api/export/report")).toBe(
      "http://localhost:3132/api/export/report",
    );
    expect(reportAddress("http://app.localhost:3132/api/export/report")).toBe(
      "http://app.localhost:3132/api/export/report",
    );
  });

  it.each([
    ["no address", undefined],
    ["not a string", 42],
    ["not a URL", "report me"],
    ["plain http to the world", "http://partyreel.com/api/export/report"],
    ["another path", "https://partyreel.com/api/export/host"],
    ["a query", "https://partyreel.com/api/export/report?x=1"],
    ["credentials", "https://user:pw@partyreel.com/api/export/report"],
    ["another scheme", "ftp://partyreel.com/api/export/report"],
  ])("is no ask at all for %s", (_, raw) => {
    expect(reportAddress(raw)).toBeNull();
  });
});

describe("sending one", () => {
  it("posts the signed text, follows no redirect, and says whether the app took it", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(null, { status: 204 });
      }),
    );
    const taken = await sendReport(
      "https://partyreel.com/api/export/report",
      VECTOR_SECRET,
      VECTOR_REPORT,
    );
    expect(taken).toBe(true);
    expect(calls[0].init).toMatchObject({
      method: "POST",
      body: VECTOR,
      redirect: "manual",
    });
  });

  it("never throws: a refusal, a failure or no secret is a false and a log line", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 401 })),
    );
    expect(
      await sendReport(
        "https://a.example/api/export/report",
        "s",
        VECTOR_REPORT,
      ),
    ).toBe(false);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    expect(
      await sendReport(
        "https://a.example/api/export/report",
        "s",
        VECTOR_REPORT,
      ),
    ).toBe(false);
    expect(
      await sendReport(
        "https://a.example/api/export/report",
        undefined,
        VECTOR_REPORT,
      ),
    ).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
