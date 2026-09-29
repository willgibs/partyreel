/**
 * THE FEEDBACK BEACON'S ONE INSERT PATH (help-center r1 `feedback=beacon`): one row a click, behind
 * a rate limit that fails closed, and nothing a caller can read back. The SQL half (deny-all, no
 * client grant, the summary service-role only) is pinned beside the write
 * (`db/mutations/article-feedback.test.ts`) and was proved rolled back on the live schema.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isHelpArticleSlug: vi.fn((slug: string) =>
    ["an-upload-wont-finish", "you-cant-sign-in"].includes(slug),
  ),
  recordArticleFeedback: vi.fn(
    async (_input: { slug: string; helpful: boolean }) =>
      ({ ok: true }) as
        | { ok: true }
        | { ok: false; code: string | null; message: string },
  ),
  abuseHashes: vi.fn((ip: string, kind: string, scope: string) => ({
    ipHash: `ip:${ip}`,
    scopeHash: `scope:${kind}:${scope}`,
  })),
  checkAbuseRate: vi.fn(async () => ({ allowed: true, retryAfterSec: 0 })),
  recordAbuseEvent: vi.fn(async () => {}),
  recordSignalFailure: vi.fn(async () => {}),
  captureWarning: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/help", () => ({
  isHelpArticleSlug: mocks.isHelpArticleSlug,
}));
vi.mock("@/lib/db/mutations/article-feedback", () => ({
  recordArticleFeedback: mocks.recordArticleFeedback,
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: mocks.abuseHashes,
  checkAbuseRate: mocks.checkAbuseRate,
  recordAbuseEvent: mocks.recordAbuseEvent,
}));
vi.mock("@/lib/jobs/failure-log", () => ({
  recordSignalFailure: mocks.recordSignalFailure,
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: mocks.captureWarning,
  captureError: vi.fn(),
}));

const route = await import("./route");
const { ABUSE_LIMITS, abuseRateDecision } =
  await import("@/lib/security/abuse-rate-limit");

function post(
  body: unknown,
  headers: Record<string, string> = { "content-type": "application/json" },
): Request {
  return new Request("http://localhost/api/help/feedback", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkAbuseRate.mockResolvedValue({ allowed: true, retryAfterSec: 0 });
  mocks.recordArticleFeedback.mockResolvedValue({ ok: true });
});

describe("POST /api/help/feedback: the insert", () => {
  it("writes one row a click, the slug and the answer and nothing else", async () => {
    const res = await route.POST(
      post({ slug: "an-upload-wont-finish", helpful: false }),
    );
    expect(res.status).toBe(204);
    expect(mocks.recordArticleFeedback).toHaveBeenCalledTimes(1);
    expect(mocks.recordArticleFeedback).toHaveBeenCalledWith({
      slug: "an-upload-wont-finish",
      helpful: false,
    });
  });

  it("counts the click against the limiter before the write it authorizes", async () => {
    const order: string[] = [];
    mocks.recordAbuseEvent.mockImplementation(async () => {
      order.push("counted");
    });
    mocks.recordArticleFeedback.mockImplementation(async () => {
      order.push("written");
      return { ok: true };
    });
    await route.POST(post({ slug: "you-cant-sign-in", helpful: true }));
    expect(order).toEqual(["counted", "written"]);
  });
});

describe("POST /api/help/feedback: the rate limit", () => {
  it("scopes the limiter to (IP, article), the first forwarded address", async () => {
    await route.POST(post({ slug: "you-cant-sign-in", helpful: true }));
    expect(mocks.abuseHashes).toHaveBeenCalledWith(
      "203.0.113.7",
      "help_feedback",
      "you-cant-sign-in",
    );
    expect(mocks.checkAbuseRate).toHaveBeenCalledWith(
      "help_feedback",
      "ip:203.0.113.7",
      "scope:help_feedback:you-cant-sign-in",
    );
  });

  it("refuses past the limit with Retry-After, and writes nothing", async () => {
    mocks.checkAbuseRate.mockResolvedValue({
      allowed: false,
      retryAfterSec: 3600,
    });
    const res = await route.POST(
      post({ slug: "you-cant-sign-in", helpful: false }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("3600");
    expect(mocks.recordAbuseEvent).not.toHaveBeenCalled();
    expect(mocks.recordArticleFeedback).not.toHaveBeenCalled();
  });

  it("fails CLOSED when the limiter cannot answer, and says so in the beacon's signal", async () => {
    mocks.checkAbuseRate.mockRejectedValue(new Error("action_rate down"));
    const res = await route.POST(
      post({ slug: "you-cant-sign-in", helpful: true }),
    );
    expect(res.status).toBe(503);
    expect(mocks.recordArticleFeedback).not.toHaveBeenCalled();
    expect(mocks.recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({ job: "help_feedback" }),
    );
  });

  it("fails CLOSED when the limiter's secret is unset (the hash throws)", async () => {
    mocks.abuseHashes.mockImplementationOnce(() => {
      throw new Error("UNLOCK_COOKIE_SECRET unset");
    });
    const res = await route.POST(
      post({ slug: "you-cant-sign-in", helpful: true }),
    );
    expect(res.status).toBe(503);
    expect(mocks.recordArticleFeedback).not.toHaveBeenCalled();
  });
});

describe("the help_feedback limits", () => {
  it("lets a venue's crowd rate one article, and stops the eleventh click an hour from one address", () => {
    const cfg = ABUSE_LIMITS.help_feedback;
    expect(cfg.scopeWindowMin).toBe(60);
    expect(
      abuseRateDecision("help_feedback", 1, cfg.scopeMax - 1).allowed,
    ).toBe(true);
    expect(abuseRateDecision("help_feedback", 1, cfg.scopeMax)).toEqual({
      allowed: false,
      retryAfterSec: cfg.scopeWindowMin * 60,
    });
  });

  it("reads one address rating forty distinct articles in an hour as stuffing", () => {
    const cfg = ABUSE_LIMITS.help_feedback;
    expect(Number.isFinite(cfg.breadthMax)).toBe(true);
    expect(
      abuseRateDecision("help_feedback", cfg.breadthMax - 1, 0).allowed,
    ).toBe(true);
    expect(abuseRateDecision("help_feedback", cfg.breadthMax, 0).allowed).toBe(
      false,
    );
  });
});

describe("POST /api/help/feedback: nothing comes back", () => {
  it("answers every outcome with a bare status and no body", async () => {
    const outcomes: Response[] = [];
    outcomes.push(
      await route.POST(post({ slug: "you-cant-sign-in", helpful: true })),
    );
    mocks.recordArticleFeedback.mockResolvedValueOnce({
      ok: false,
      code: "PGRST205",
      message: "table not in the schema cache",
    });
    outcomes.push(
      await route.POST(post({ slug: "you-cant-sign-in", helpful: true })),
    );
    mocks.checkAbuseRate.mockResolvedValueOnce({
      allowed: false,
      retryAfterSec: 60,
    });
    outcomes.push(
      await route.POST(post({ slug: "you-cant-sign-in", helpful: true })),
    );
    outcomes.push(
      await route.POST(post({ slug: "nope-not-here", helpful: true })),
    );
    outcomes.push(await route.POST(post("{not json")));
    expect(outcomes.map((r) => r.status)).toEqual([204, 503, 429, 404, 400]);
    for (const res of outcomes) {
      expect(await res.text()).toBe("");
      expect(res.headers.get("content-type")).toBeNull();
    }
  });

  it("has no way to read: POST is the route's only method", () => {
    expect(Object.keys(route).sort()).toEqual(["POST"]);
  });

  it("records a failed write in the beacon's signal, with the operation and never the body", async () => {
    mocks.recordArticleFeedback.mockResolvedValueOnce({
      ok: false,
      code: "42501",
      message: "permission denied for table article_feedback",
    });
    const res = await route.POST(
      post({ slug: "an-upload-wont-finish", helpful: true }),
    );
    expect(res.status).toBe(503);
    expect(mocks.recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        job: "help_feedback",
        operation: "article_feedback insert",
      }),
    );
  });
});

describe("POST /api/help/feedback: refusing what is not a click on a real article", () => {
  it("refuses a body that is not JSON by type (the cross-site simple request)", async () => {
    const res = await route.POST(
      post(JSON.stringify({ slug: "you-cant-sign-in", helpful: true }), {
        "content-type": "text/plain;charset=UTF-8",
      }),
    );
    expect(res.status).toBe(415);
    expect(mocks.checkAbuseRate).not.toHaveBeenCalled();
    expect(mocks.recordArticleFeedback).not.toHaveBeenCalled();
  });

  it.each([
    ["a broken body", "{not json"],
    ["a third key", { slug: "you-cant-sign-in", helpful: true, note: "hi" }],
    ["a stringly answer", { slug: "you-cant-sign-in", helpful: "yes" }],
    ["no answer", { slug: "you-cant-sign-in" }],
    ["a path for a slug", { slug: "../../etc/passwd", helpful: true }],
    ["an uppercase slug", { slug: "You-Cant-Sign-In", helpful: true }],
    ["a slug past 120", { slug: "a".repeat(121), helpful: true }],
  ])("refuses %s with 400 before the limiter", async (_name, body) => {
    const res = await route.POST(post(body));
    expect(res.status).toBe(400);
    expect(mocks.checkAbuseRate).not.toHaveBeenCalled();
    expect(mocks.recordArticleFeedback).not.toHaveBeenCalled();
  });

  it("refuses a well-formed slug the catalog does not hold with 404", async () => {
    const res = await route.POST(
      post({ slug: "an-article-that-never-was", helpful: true }),
    );
    expect(res.status).toBe(404);
    expect(mocks.checkAbuseRate).not.toHaveBeenCalled();
    expect(mocks.recordArticleFeedback).not.toHaveBeenCalled();
  });
});
