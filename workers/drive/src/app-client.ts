/**
 * THE WORKER'S LINE TO THE APP: every word signed (`protocol.ts`), posted as text to the app's internal routes on
 * DRIVE_APP_URL, each with a ceiling (the app answers in well under a second; a hung call must not hold a lane).
 * Anything but a 2xx JSON answer is `unreachable`, which a lane treats as "the app cannot answer": it backs off and
 * tries again (a fresh message 60 s on), never guesses.
 */
import {
  APP_PATHS,
  DRIVE_PROTOCOL_VERSION,
  signWord,
  type CheckResult,
  type Finding,
  type LeaseAnswer,
  type ReportItem,
} from "./protocol";

export type Unreachable = { state: "unreachable"; status: number };

export type ReportAnswer = { state: "ok" | "stop" };

export type SweepAnswer = { kick: { connectionId: string; lanes: number }[] };

export type AppClient = {
  lease(connectionId: string): Promise<LeaseAnswer | Unreachable>;
  report(input: {
    lease: string;
    items: ReportItem[];
    finding?: Finding;
    done?: boolean;
  }): Promise<ReportAnswer | Unreachable>;
  check(input: {
    lease: string;
    results: CheckResult[];
    duplicates?: number;
    finding?: "folder_gone";
  }): Promise<ReportAnswer | Unreachable>;
  laneFail(connectionId: string, error: string): Promise<boolean>;
  sweep(input: {
    mode: "on" | "off";
    depths: Record<string, number>;
  }): Promise<SweepAnswer | Unreachable>;
};

export type AppEnv = { DRIVE_APP_URL?: string; DRIVE_WORKER_SECRET?: string };

/** Each call's ceiling. */
export const APP_TIMEOUT_MS = 20_000;

export function appClient(
  env: AppEnv,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): AppClient {
  async function post(
    path: string,
    payload: Record<string, unknown>,
  ): Promise<unknown | Unreachable> {
    if (!env.DRIVE_APP_URL || !env.DRIVE_WORKER_SECRET)
      return { state: "unreachable", status: 0 };
    try {
      const body = await signWord(env.DRIVE_WORKER_SECRET, {
        v: DRIVE_PROTOCOL_VERSION,
        at: now(),
        ...payload,
      });
      const res = await fetchImpl(new URL(path, env.DRIVE_APP_URL).toString(), {
        method: "POST",
        headers: { "content-type": "text/plain;charset=UTF-8" },
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(APP_TIMEOUT_MS),
      });
      if (res.status < 200 || res.status >= 300) {
        await res.body?.cancel();
        return { state: "unreachable", status: res.status };
      }
      return await res.json();
    } catch {
      return { state: "unreachable", status: 0 };
    }
  }

  const isUnreachable = (v: unknown): v is Unreachable =>
    typeof v === "object" &&
    v !== null &&
    (v as { state?: unknown }).state === "unreachable";

  return {
    async lease(connectionId) {
      const answer = await post(APP_PATHS.lease, {
        kind: "lease",
        connectionId,
      });
      if (isUnreachable(answer)) return answer;
      const state = (answer as { state?: unknown })?.state;
      if (
        state === "work" ||
        state === "check" ||
        state === "throttled" ||
        state === "wait" ||
        state === "paused" ||
        state === "stopped" ||
        state === "idle"
      ) {
        return answer as LeaseAnswer;
      }
      return { state: "unreachable", status: 200 };
    },
    async report(input) {
      const answer = await post(APP_PATHS.report, {
        kind: "report",
        lease: input.lease,
        items: input.items,
        ...(input.finding ? { finding: input.finding } : {}),
        ...(input.done ? { done: true } : {}),
      });
      if (isUnreachable(answer)) return answer;
      return {
        state: (answer as { state?: unknown })?.state === "ok" ? "ok" : "stop",
      };
    },
    async check(input) {
      const answer = await post(APP_PATHS.check, {
        kind: "check",
        lease: input.lease,
        results: input.results,
        ...(input.duplicates !== undefined
          ? { duplicates: input.duplicates }
          : {}),
        ...(input.finding ? { finding: input.finding } : {}),
      });
      if (isUnreachable(answer)) return answer;
      return {
        state: (answer as { state?: unknown })?.state === "ok" ? "ok" : "stop",
      };
    },
    async laneFail(connectionId, error) {
      const answer = await post(APP_PATHS.lanefail, {
        kind: "lanefail",
        connectionId,
        error: error.slice(0, 300),
      });
      return !isUnreachable(answer);
    },
    async sweep(input) {
      const answer = await post(APP_PATHS.sweep, {
        kind: "sweep",
        mode: input.mode,
        depths: input.depths,
      });
      if (isUnreachable(answer)) return answer;
      const kick = (answer as { kick?: unknown })?.kick;
      return {
        kick: Array.isArray(kick)
          ? kick.filter(
              (k): k is { connectionId: string; lanes: number } =>
                typeof k === "object" &&
                k !== null &&
                typeof (k as { connectionId?: unknown }).connectionId ===
                  "string" &&
                typeof (k as { lanes?: unknown }).lanes === "number",
            )
          : [],
      };
    },
  };
}
