/**
 * THE REPORTER'S ANSWER ROUTE (admin-triage r2, `proof=confirm`): the link in the Ask for proof mail is the
 * capability, and the route is no oracle. A token of the wrong shape is refused without a read; the write is
 * keyed by the token's HASH, never the token; a used, a closed and an unknown link answer the same 404.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  answerProof: vi.fn(),
  gateAllowed: true,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mutations/report", () => ({
  answerProof: state.answerProof,
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: () => {},
  captureWarning: () => {},
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: async () => ({
    allowed: state.gateAllowed,
    retryAfterSec: 30,
  }),
  recordAbuseEvent: async () => {},
}));
vi.mock("@/lib/security/unlock-rate-limit", () => ({
  clientIp: () => "203.0.113.9",
}));

const { POST } = await import("./route");
const { proofTokenHash } = await import("@/lib/reports/proof-token");

const TOKEN = "a".repeat(64);

function post(body: unknown): Request {
  return new Request("https://partyreel.com/api/reports/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  state.gateAllowed = true;
  state.answerProof.mockReset();
  state.answerProof.mockResolvedValue({ ok: true });
});

describe("the reporter's answer", () => {
  it("★ writes her answer by the token's hash, never the token itself", async () => {
    const res = await POST(
      post({ token: TOKEN, answer: "  The one of the toast.  " }),
    );
    expect(res.status).toBe(200);
    expect(state.answerProof).toHaveBeenCalledWith({
      tokenHash: proofTokenHash(TOKEN),
      answer: "The one of the toast.",
    });
    expect(JSON.stringify(state.answerProof.mock.calls)).not.toContain(TOKEN);
  });

  it("★ answers a used, a closed and an unknown link the same, and a malformed one without a read", async () => {
    state.answerProof.mockResolvedValue({ ok: false, code: "gone" });
    const gone = await POST(post({ token: TOKEN, answer: "Here it is." }));
    const malformed = await POST(
      post({ token: "../../admin", answer: "Here it is." }),
    );
    expect(gone.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(await gone.json()).toEqual(await malformed.json());
    expect(state.answerProof).toHaveBeenCalledTimes(1);
  });

  it("asks for words, and keeps them under the report's own cap", async () => {
    expect((await POST(post({ token: TOKEN, answer: "   " }))).status).toBe(
      400,
    );
    expect(
      (await POST(post({ token: TOKEN, answer: "x".repeat(2001) }))).status,
    ).toBe(400);
    expect(state.answerProof).not.toHaveBeenCalled();
  });

  it("refuses a burst from one network, and says a failed write in words", async () => {
    state.gateAllowed = false;
    expect(
      (await POST(post({ token: TOKEN, answer: "Here it is." }))).status,
    ).toBe(429);
    state.gateAllowed = true;
    state.answerProof.mockResolvedValue({ ok: false, code: "unknown" });
    expect(
      (await POST(post({ token: TOKEN, answer: "Here it is." }))).status,
    ).toBe(500);
  });
});
