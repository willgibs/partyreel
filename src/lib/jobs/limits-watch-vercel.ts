/**
 * THE VERCEL READINGS (admin-observability.md, "Plan limits"): one `GET /v2/usage?type=requests` of the team's last 30
 * days, answered as daily buckets, and four of the Hobby meters read out of it: function invocations, Fast Data
 * Transfer, CDN requests, and Active CPU, which Hobby's API never answers (that is Observability Plus) and so is
 * ESTIMATED from the calls at a calibrated CPU a call (`limits-watch-limits.ts`). It is `usher/kit/vercel-usage.mjs`'s
 * own call, taken by the cron so no agent has to remember to run a script.
 *
 * ★ THE TOKEN CAN DEPLOY AND DELETE, so this file calls exactly one path with one GET and nothing else, takes the
 * token as an argument (it reads no env), and never prints a response body or the token: an error says only the HTTP
 * status. Vercel has no read-only token; admin-observability.md, "Plan limits" says why one is held in the app's env at all.
 *
 * ★ A READING IT CANNOT TRUST IS NO READING: a day whose numbers are not counts, an empty answer (a team with a
 * deployment cron calls functions every day) and a refused token are each a failed read that says why, never a zero.
 */
import {
  VERCEL_CPU_SECONDS_PER_CALL,
  VERCEL_TEAM_ID,
} from "@/lib/jobs/limits-watch-limits";
import {
  dayKey,
  type DayValue,
  type MeterTaken,
} from "@/lib/jobs/limits-watch";

const MS_DAY = 24 * 60 * 60 * 1000;
const USAGE_HOST = "https://api.vercel.com";

/** The four meters this one call answers. */
export type VercelMeterId =
  | "vercel_active_cpu"
  | "vercel_invocations"
  | "vercel_fast_data"
  | "vercel_cdn_requests";

export const VERCEL_METERS: readonly VercelMeterId[] = [
  "vercel_active_cpu",
  "vercel_invocations",
  "vercel_fast_data",
  "vercel_cdn_requests",
];

/** The fields of a day's row the meters are built from. */
const FIELDS = [
  "function_invocation_successful_count",
  "function_invocation_error_count",
  "function_invocation_timeout_count",
  "request_hit_count",
  "request_miss_count",
  "bandwidth_outgoing_bytes",
  "bandwidth_incoming_bytes",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The usage answer, read into the four meters' daily series (ascending, gap-free to `nowMs`'s UTC day: a day the API
 * lists no row for had no traffic, and reads as zero). The API clips the oldest day to the hour the window opens,
 * and the newest is today, partial: the rate leaves it out (`limits-watch.ts`).
 */
export function parseVercelUsage(
  json: unknown,
  nowMs: number,
):
  | { ok: true; meters: Record<VercelMeterId, MeterTaken> }
  | { ok: false; why: string } {
  if (!isRecord(json) || !Array.isArray(json.data)) {
    return { ok: false, why: "the usage API's answer held no days" };
  }
  if (json.data.length === 0) {
    return { ok: false, why: "the usage API answered no days at all" };
  }
  const byDay = new Map<string, Record<(typeof FIELDS)[number], number>>();
  for (const row of json.data) {
    if (!isRecord(row) || typeof row.date !== "string") {
      return { ok: false, why: "a usage day had no date" };
    }
    const at = Date.parse(row.date);
    if (!Number.isFinite(at)) {
      return {
        ok: false,
        why: `a usage day's date was unreadable (${row.date.slice(0, 24)})`,
      };
    }
    const values = {} as Record<(typeof FIELDS)[number], number>;
    for (const field of FIELDS) {
      const n = row[field];
      if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
        return {
          ok: false,
          why: `the usage API's ${field} was not a count on ${dayKey(at)}`,
        };
      }
      values[field] = n;
    }
    byDay.set(dayKey(at), values);
  }

  const first = [...byDay.keys()].sort()[0];
  const today = dayKey(nowMs);
  const calls: DayValue[] = [];
  const bytes: DayValue[] = [];
  const requests: DayValue[] = [];
  const cpu: DayValue[] = [];
  for (
    let at = Date.parse(`${first}T00:00:00Z`);
    dayKey(at) <= today;
    at += MS_DAY
  ) {
    const day = dayKey(at);
    const v = byDay.get(day);
    const n =
      (v?.function_invocation_successful_count ?? 0) +
      (v?.function_invocation_error_count ?? 0) +
      (v?.function_invocation_timeout_count ?? 0);
    calls.push({ day, value: n });
    cpu.push({ day, value: n * VERCEL_CPU_SECONDS_PER_CALL });
    // Fast Data Transfer counts the request and the response: both directions.
    bytes.push({
      day,
      value:
        (v?.bandwidth_outgoing_bytes ?? 0) + (v?.bandwidth_incoming_bytes ?? 0),
    });
    requests.push({
      day,
      value: (v?.request_hit_count ?? 0) + (v?.request_miss_count ?? 0),
    });
  }
  return {
    ok: true,
    meters: {
      vercel_active_cpu: { kind: "days", days: cpu },
      vercel_invocations: { kind: "days", days: calls },
      vercel_fast_data: { kind: "days", days: bytes },
      vercel_cdn_requests: { kind: "days", days: requests },
    },
  };
}

/** What a refused or failed call says, by its HTTP status alone. */
function statusWords(status: number): string {
  if (status === 401 || status === 403) {
    return `Vercel refused the token (HTTP ${status}): mint a new VERCEL_USAGE_TOKEN`;
  }
  if (status === 429) return "Vercel rate-limited the read (HTTP 429)";
  return `Vercel's usage API answered HTTP ${status}`;
}

/**
 * Take the four Vercel meters. Never throws: with no token they are a gap that names the variable (`needs`, the
 * a deliberate gap that does not fail the run), and anything else that goes wrong is a failed read of all
 * four, with its words.
 */
export async function readVercelUsage(
  token: string | undefined,
  nowMs: number,
  doFetch: typeof fetch = fetch,
): Promise<Record<VercelMeterId, MeterTaken>> {
  const all = (taken: MeterTaken) =>
    Object.fromEntries(VERCEL_METERS.map((id) => [id, taken])) as Record<
      VercelMeterId,
      MeterTaken
    >;
  if (!token) {
    return all({
      kind: "none",
      cause: "needs",
      why: "Not wired: set VERCEL_USAGE_TOKEN in the app's env (Plan limits, admin-observability.md)",
    });
  }
  const url = new URL("/v2/usage", USAGE_HOST);
  url.searchParams.set("type", "requests");
  url.searchParams.set("from", new Date(nowMs - 30 * MS_DAY).toISOString());
  url.searchParams.set("to", new Date(nowMs).toISOString());
  url.searchParams.set("teamId", VERCEL_TEAM_ID);
  try {
    const res = await doFetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status !== 200) {
      return all({
        kind: "none",
        cause: "failed",
        why: statusWords(res.status),
      });
    }
    const parsed = parseVercelUsage(await res.json(), nowMs);
    if (!parsed.ok) {
      return all({ kind: "none", cause: "failed", why: parsed.why });
    }
    return parsed.meters;
  } catch (e) {
    // A network error or a timeout: the message, never the URL (it names the team) or the token.
    const why = e instanceof Error ? e.message : String(e);
    return all({
      kind: "none",
      cause: "failed",
      why: `Vercel's usage API could not be read: ${why.slice(0, 120)}`,
    });
  }
}
