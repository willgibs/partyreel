/**
 * THE QUEUE CONSUMER'S LAST WORD (drive-export.md, "A poison lane pauses its connection, never loops"): a lane that
 * throws on its last attempt says so to the app before it goes to the dead-letter queue, and ★ its word names its
 * Queue message, so the app counts one death a message however often the word arrives. Earlier attempts say nothing.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import worker from "./index";
import { verifyWord } from "./protocol";

const SECRET = "drive-vector-secret";
const CONNECTION = "33333333-4444-4555-8666-777777777777";

/** A lane whose slice throws: the app cannot answer, and the queue will not take the lane back. */
function setup(attempts: number) {
  const posted: { path: string; body: string }[] = [];
  vi.stubGlobal(
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      posted.push({ path: url.pathname, body: String(init?.body ?? "") });
      if (url.pathname.endsWith("/lanefail"))
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      return new Response("down", { status: 503 });
    },
  );
  const message = {
    id: "5f0c1a7e9b2d4c6e8a1b3c5d7e9f0a2b",
    timestamp: new Date(),
    attempts,
    body: { v: 1 as const, connectionId: CONNECTION },
    ack: vi.fn(),
    retry: vi.fn(),
  };
  const env = {
    PRIMARY: {} as R2Bucket,
    DRIVE_QUEUE: {
      sendBatch: async () => {
        throw new Error("the queue would not take it");
      },
    } as unknown as Queue<{ v: 1; connectionId: string }>,
    DRIVE_MODE: "on",
    DRIVE_APP_URL: "https://app.test",
    DRIVE_WORKER_SECRET: SECRET,
  };
  const batch = { messages: [message] } as unknown as MessageBatch<{
    v: 1;
    connectionId: string;
  }>;
  return { posted, message, env, batch };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a lane's last word", () => {
  it("★ names its Queue message, then the lane goes to the dead letters", async () => {
    const { posted, message, env, batch } = setup(4);
    await worker.queue(batch, env as never);
    const said = posted.filter(
      (p) => p.path === "/api/internal/drive/lanefail",
    );
    expect(said).toHaveLength(1);
    const verdict = await verifyWord(SECRET, said[0]!.body, Date.now());
    expect(verdict).toMatchObject({
      ok: true,
      word: {
        kind: "lanefail",
        connectionId: CONNECTION,
        messageId: message.id,
      },
    });
    expect(message.retry).toHaveBeenCalledTimes(1);
    expect(message.ack).not.toHaveBeenCalled();
  });

  it("says nothing on an attempt that is not the last", async () => {
    const { posted, message, env, batch } = setup(2);
    await worker.queue(batch, env as never);
    expect(posted.some((p) => p.path.endsWith("/lanefail"))).toBe(false);
    expect(message.retry).toHaveBeenCalledTimes(1);
  });
});
