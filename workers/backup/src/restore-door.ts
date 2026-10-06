/**
 * THE WORKER'S ONE DOOR: Restore now (durability-backups.md, "The restore"). The app cannot start a Cloudflare job,
 * so this is the one place it asks: `POST /restore` with the internal-jobs bearer (`PRUNE_API_SECRET`, the secret the
 * Worker already holds for the app's confirm route and heartbeat, so the door adds none), sent by the operator's
 * Restore now on /admin/jobs behind AAL2 (src/app/admin/jobs/restore-now.ts). It starts nothing itself: it asks the
 * prune's Durable Object for a pass (restore-schedule.ts), which runs as the object's alarm and reports on the
 * restore's own card like any scheduled pass.
 *
 * Every other path is a 404 and every other caller a 401, so the door says nothing to anyone without the bearer.
 * What a press could do even with it is copy back keys a live row still names into places nothing is stored, the
 * app answering which, so the door is strictly smaller than the confirm route the same secret already guards.
 */
import { restoreModeOf } from "./restore-run";
import type { RestoreRequestState, RestoreTrigger } from "./restore-schedule";

export type DoorEnv = { PRUNE_API_SECRET?: string; RESTORE_MODE?: string };

/** Ask the Durable Object for a pass; null when the Worker has no binding to it. */
export type DoorAsk =
  | ((trigger: RestoreTrigger) => Promise<{ state: RestoreRequestState }>)
  | null;

export const RESTORE_DOOR_PATH = "/restore";

export async function handleRestoreDoor(
  request: Request,
  env: DoorEnv,
  ask: DoorAsk,
): Promise<Response> {
  if (new URL(request.url).pathname !== RESTORE_DOOR_PATH) {
    return new Response("Not found", { status: 404 });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "POST" },
    });
  }
  const secret = env.PRUNE_API_SECRET;
  // Fail closed: a door with no secret to check is a door anyone could open.
  if (!secret) return answer(503, { started: false, reason: "unconfigured" });
  if (!bearerMatches(request.headers.get("authorization"), secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (restoreModeOf(env.RESTORE_MODE) === "off") {
    return answer(409, { started: false, reason: "off" });
  }
  if (!ask) return answer(503, { started: false, reason: "unbound" });
  try {
    const { state } = await ask("manual");
    return answer(202, { started: true, state });
  } catch (err) {
    console.error("restore door: the Durable Object did not answer", {
      err: String(err).slice(0, 200),
    });
    return answer(503, { started: false, reason: "unavailable" });
  }
}

/**
 * The bearer, compared in time that says nothing of where it differs or how long it is: every byte of the expected
 * value is read whatever came in.
 */
export function bearerMatches(header: string | null, secret: string): boolean {
  const got = new TextEncoder().encode(header ?? "");
  const want = new TextEncoder().encode(`Bearer ${secret}`);
  let diff = got.length === want.length ? 0 : 1;
  for (let i = 0; i < want.length; i++) diff |= (got[i] ?? 0) ^ want[i];
  return diff === 0;
}

function answer(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
