/**
 * THE VERCEL READINGS, red first: the real shape of `GET /v2/usage?type=requests` read into four meters (calls,
 * both directions of bandwidth, hits plus misses, and the CPU estimated from the calls), a missing token a gap that
 * names its variable, a refused token a failed read that says only the status, and an answer it cannot trust no
 * reading at all, never a zero.
 */
import { describe, expect, it, vi } from "vitest";

import { dayKey } from "@/lib/jobs/limits-watch";
import { VERCEL_CPU_SECONDS_PER_CALL } from "@/lib/jobs/limits-watch-limits";
import {
  parseVercelUsage,
  readVercelUsage,
} from "@/lib/jobs/limits-watch-vercel";

const NOW = Date.parse("2026-10-04T16:52:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

/** A day's row as the API answers it (2026-10-04's real keys), with the counts the meters read. */
function row(date: string, over: Record<string, unknown> = {}) {
  return {
    date: `${date}T00:00:00.000Z`,
    first_event: `${date}T00:00:00.000Z`,
    last_event: `${date}T23:00:00.000Z`,
    request_hit_count: 100,
    request_miss_count: 50,
    monitoring_metric_count: 90,
    bandwidth_outgoing_bytes: 1_000_000,
    bandwidth_incoming_bytes: 20_000,
    function_execution_successful_gb_hours: 0.5,
    function_execution_error_gb_hours: 0,
    function_execution_timeout_gb_hours: 0,
    function_invocation_successful_count: 1_000,
    function_invocation_error_count: 5,
    function_invocation_throttle_count: 0,
    function_invocation_timeout_count: 1,
    breakdown: { requests: [{ name: "partyreel", percent: 97 }] },
    previous: null,
    ...over,
  };
}

const answer = {
  granularity: "day",
  lastUpdate: "2026-10-04T16:52:05.446Z",
  data: [
    row("2026-10-02"),
    row("2026-10-03", { request_hit_count: 300 }),
    row("2026-10-04"),
  ],
};

function taken(json: unknown) {
  const parsed = parseVercelUsage(json, NOW);
  if (!parsed.ok) throw new Error(parsed.why);
  return parsed.meters;
}

describe("the usage answer, read into four meters", () => {
  it("sums a day's calls (successful, errored, timed out), bandwidth both ways, and hits plus misses", () => {
    const m = taken(answer);
    const day = (id: keyof typeof m, i: number) => {
      const t = m[id];
      if (t.kind !== "days") throw new Error("not a series");
      return t.days[i];
    };
    expect(day("vercel_invocations", 0)).toEqual({
      day: "2026-10-02",
      value: 1_006,
    });
    expect(day("vercel_fast_data", 0)).toEqual({
      day: "2026-10-02",
      value: 1_020_000,
    });
    expect(day("vercel_cdn_requests", 0)).toEqual({
      day: "2026-10-02",
      value: 150,
    });
    expect(day("vercel_cdn_requests", 1)).toEqual({
      day: "2026-10-03",
      value: 350,
    });
  });

  it("★ estimates Active CPU from the calls at the calibrated CPU a call, and names no CPU the API did not give", () => {
    const m = taken(answer);
    const cpu = m.vercel_active_cpu;
    if (cpu.kind !== "days") throw new Error("not a series");
    expect(cpu.days[0].value).toBeCloseTo(
      1_006 * VERCEL_CPU_SECONDS_PER_CALL,
      9,
    );
    expect(VERCEL_CPU_SECONDS_PER_CALL).toBe(0.044);
  });

  it("fills a day the API lists no row for as no traffic, to today, ascending and gap-free", () => {
    const m = taken({ data: [row("2026-10-01"), row("2026-10-04")] });
    const t = m.vercel_invocations;
    if (t.kind !== "days") throw new Error("not a series");
    expect(t.days.map((d) => d.day)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(t.days.map((d) => d.value)).toEqual([1_006, 0, 0, 1_006]);
  });

  it("runs on to today when the newest listed day is older", () => {
    const m = taken({ data: [row("2026-10-02")] });
    const t = m.vercel_cdn_requests;
    if (t.kind !== "days") throw new Error("not a series");
    expect(t.days.at(-1)?.day).toBe(dayKey(NOW));
  });

  it("★ is no reading at all, with its words, when it cannot be trusted", () => {
    const why = (json: unknown) => {
      const p = parseVercelUsage(json, NOW);
      return p.ok ? null : p.why;
    };
    expect(why(null)).toMatch(/held no days/);
    expect(why({ data: [] })).toMatch(/no days at all/);
    expect(why({ data: [{ ...row("2026-10-04"), date: "nope" }] })).toMatch(
      /unreadable/,
    );
    expect(
      why({ data: [row("2026-10-04", { request_miss_count: "many" })] }),
    ).toMatch(/request_miss_count was not a count on 2026-10-04/);
    expect(
      why({ data: [row("2026-10-04", { bandwidth_incoming_bytes: -1 })] }),
    ).toMatch(/bandwidth_incoming_bytes/);
    const missingField = row("2026-10-04") as Record<string, unknown>;
    delete missingField.request_hit_count;
    expect(why({ data: [missingField] })).toMatch(/request_hit_count/);
  });
});

describe("taking the readings", () => {
  const meterIds = [
    "vercel_active_cpu",
    "vercel_invocations",
    "vercel_fast_data",
    "vercel_cdn_requests",
  ] as const;

  it("is a gap that names the variable, never a call, with no token", async () => {
    const doFetch = vi.fn();
    const m = await readVercelUsage(
      undefined,
      NOW,
      doFetch as unknown as typeof fetch,
    );
    expect(doFetch).not.toHaveBeenCalled();
    for (const id of meterIds) {
      expect(m[id]).toMatchObject({ kind: "none", cause: "needs" });
      expect(m[id].kind === "none" && m[id].why).toMatch(/VERCEL_USAGE_TOKEN/);
    }
  });

  it("asks for exactly the team's 30 days, one GET with the token, and reads the answer", async () => {
    const doFetch = vi.fn(
      async () => new Response(JSON.stringify(answer), { status: 200 }),
    );
    const m = await readVercelUsage(
      "tok_secret",
      NOW,
      doFetch as unknown as typeof fetch,
    );
    expect(doFetch).toHaveBeenCalledTimes(1);
    const [url, init] = doFetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.origin + url.pathname).toBe("https://api.vercel.com/v2/usage");
    expect(url.searchParams.get("type")).toBe("requests");
    expect(url.searchParams.get("from")).toBe(
      new Date(NOW - 30 * DAY).toISOString(),
    );
    expect(url.searchParams.get("to")).toBe(new Date(NOW).toISOString());
    expect(url.searchParams.get("teamId")).toMatch(/^team_/);
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok_secret",
    );
    expect(m.vercel_invocations.kind).toBe("days");
  });

  it("★ says only the status when the token is refused, never the body or the token", async () => {
    const doFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: { message: "secret details tok_secret" } }),
          { status: 403 },
        ),
    );
    const m = await readVercelUsage(
      "tok_secret",
      NOW,
      doFetch as unknown as typeof fetch,
    );
    for (const id of meterIds) {
      const t = m[id];
      expect(t).toMatchObject({ kind: "none", cause: "failed" });
      if (t.kind !== "none") continue;
      expect(t.why).toBe(
        "Vercel refused the token (HTTP 403): mint a new VERCEL_USAGE_TOKEN",
      );
      expect(t.why).not.toMatch(/secret|tok_/);
    }
  });

  it("fails the read, with the status, on a rate limit and on a server error", async () => {
    const at = async (status: number) => {
      const doFetch = vi.fn(async () => new Response("{}", { status }));
      const m = await readVercelUsage(
        "t",
        NOW,
        doFetch as unknown as typeof fetch,
      );
      const t = m.vercel_invocations;
      return t.kind === "none" ? t.why : "";
    };
    expect(await at(429)).toMatch(/rate-limited.*429/);
    expect(await at(500)).toBe("Vercel's usage API answered HTTP 500");
  });

  it("fails the read, with its words, when the network does", async () => {
    const doFetch = vi.fn(async () => {
      throw new Error("fetch failed");
    });
    const m = await readVercelUsage(
      "t",
      NOW,
      doFetch as unknown as typeof fetch,
    );
    expect(m.vercel_cdn_requests).toEqual({
      kind: "none",
      cause: "failed",
      why: "Vercel's usage API could not be read: fetch failed",
    });
  });

  it("fails the read when a 200 answers what cannot be trusted", async () => {
    const doFetch = vi.fn(
      async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    const m = await readVercelUsage(
      "t",
      NOW,
      doFetch as unknown as typeof fetch,
    );
    expect(m.vercel_fast_data).toMatchObject({ kind: "none", cause: "failed" });
  });
});
