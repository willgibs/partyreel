/**
 * PARTYREEL'S SEND TO GOOGLE DRIVE WORKER (drive-export.md). Three entry points, one Worker:
 *
 *   fetch      POST /kick: the app's signed word, "add N lanes for this connection" (at most three, at most once a
 *              minute per connection: the app counts). Anything else is a 404.
 *   queue      one lane a message: a slice of sending (`lane.ts`), then ack, or a fresh message for the next slice.
 *              On a lane's last attempt it says so first (`/api/internal/drive/lanefail`), then throws into the
 *              dead-letter queue: its connection pauses itself at three a day, a poison lane never loops.
 *   scheduled  the sweep, every five minutes (`sweep.ts`).
 *
 * It holds no database credential, no refresh token and no key: the app is the oracle. It reads R2 (originals only,
 * never a write) and talks to Google with an hour of `drive.file` access a lease hands it, sealed.
 *
 * ★ THE ENTRY MODULE EXPORTS ITS HANDLER ALONE (workerd refuses to start on any other named export: the export Worker's
 * own rule).
 */
import { appClient } from "./app-client";
import { driveAdapter } from "./google-drive";
import { runSlice, type LaneMessage } from "./lane";
import { log } from "./log";
import { readKick, verifyWord } from "./protocol";
import { readQueueDepths } from "./queue-metrics";
import { sweep } from "./sweep";
import type { Bucket } from "./transfer";

type Env = {
  /** The live `partyreel` bucket, read only in use. */
  PRIMARY: R2Bucket;
  /** The lanes' queue: a producer binding (lanes are sent back and kicked) and its depth. */
  DRIVE_QUEUE?: Queue<LaneMessage>;
  /** Its dead-letter queue: only ever asked its depth. */
  DRIVE_DLQ?: Queue;
  /** "off" (and a redeploy) ends every lane at once and sends nothing; anything else is on. */
  DRIVE_MODE?: string;
  /** The app every lane leases from and reports to. */
  DRIVE_APP_URL?: string;
  /** Equal to the app's: every word between the two is signed with it. */
  DRIVE_WORKER_SECRET?: string;
};

/** The queue consumer's retries (wrangler.jsonc): the attempt after the last retry is the lane's last. */
const MAX_RETRIES = 3;

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

function wiring(env: Env) {
  let spent = 0;
  const counted: typeof fetch = (input, init) => {
    spent++;
    return fetch(input, init);
  };
  const bucket: Bucket = {
    async head(key) {
      spent++;
      const object = await env.PRIMARY.head(key);
      if (!object) return null;
      return { size: object.size, md5: object.checksums.md5 ? hex(object.checksums.md5) : null };
    },
    async read(key, range) {
      spent++;
      const object = await env.PRIMARY.get(key, range ? { range } : undefined);
      return object ? object.body : null;
    },
  };
  return {
    app: appClient(env, counted),
    drive: driveAdapter(counted),
    bucket,
    spent: () => spent,
  };
}

async function enqueue(env: Env, messages: LaneMessage[], delaySeconds?: number): Promise<void> {
  if (!env.DRIVE_QUEUE || messages.length === 0) return;
  await env.DRIVE_QUEUE.sendBatch(
    messages.map((body) => ({ body, ...(delaySeconds ? { delaySeconds } : {}) })),
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/kick") return new Response("Not found", { status: 404 });
    if (!env.DRIVE_WORKER_SECRET) return new Response("Not configured", { status: 503 });
    const verdict = await verifyWord(env.DRIVE_WORKER_SECRET, (await request.text()).trim(), Date.now());
    const kick = verdict.ok ? readKick(verdict.word) : null;
    if (!kick) return new Response("Refused", { status: verdict.ok ? 400 : 401 });
    if (env.DRIVE_MODE === "off") return new Response("Switched off", { status: 503 });
    await enqueue(
      env,
      Array.from({ length: kick.lanes }, () => ({ v: 1 as const, connectionId: kick.connectionId })),
    );
    log("drive-kick", { connectionId: kick.connectionId, lanes: kick.lanes });
    return new Response(null, { status: 202 });
  },

  async queue(batch: MessageBatch<LaneMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const body = message.body;
      if (!body || body.v !== 1 || typeof body.connectionId !== "string") {
        log("drive-error", { what: "a message that is no lane", id: message.id });
        message.ack();
        continue;
      }
      if (env.DRIVE_MODE === "off" || !env.DRIVE_WORKER_SECRET) {
        message.ack();
        continue;
      }
      const w = wiring(env);
      try {
        await runSlice(
          {
            app: w.app,
            drive: w.drive,
            bucket: w.bucket,
            secret: env.DRIVE_WORKER_SECRET,
            requeue: (m, delay) => enqueue(env, [m], delay),
            fixedLength: (stream, length) => stream.pipeThrough(new FixedLengthStream(length)),
            md5Of: async (stream) => {
              const digest = new crypto.DigestStream("MD5");
              await stream.pipeTo(digest);
              return hex(await digest.digest);
            },
            now: Date.now,
            sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
            random: Math.random,
            spent: w.spent,
          },
          body,
        );
        message.ack();
      } catch (e) {
        const error = String(e).slice(0, 300);
        log("drive-error", { what: "a lane threw", connectionId: body.connectionId, attempt: message.attempts, error });
        // ★ The last attempt says so before it throws, so the app counts the connection's dead lanes.
        if (message.attempts > MAX_RETRIES) await w.app.laneFail(body.connectionId, error).catch(() => false);
        message.retry();
      }
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const depths = await readQueueDepths(env);
        await sweep({
          app: appClient(env),
          mode: env.DRIVE_MODE === "off" ? "off" : "on",
          depths,
          enqueue: (messages) => enqueue(env, messages),
        });
      })().catch((e) => log("drive-error", { what: "the sweep threw", error: String(e).slice(0, 300) })),
    );
  },
} satisfies ExportedHandler<Env, LaneMessage>;
