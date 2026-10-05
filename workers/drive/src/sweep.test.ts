/** THE SWEEP: the app's answer enqueued as lanes (at most three a connection), nothing when switched off or unheard. */
import { describe, expect, it } from "vitest";

import type { AppClient } from "./app-client";
import type { LaneMessage } from "./lane";
import { sweep } from "./sweep";

const app = (answer: Awaited<ReturnType<AppClient["sweep"]>>): AppClient => ({
  lease: async () => ({ state: "idle" }),
  report: async () => ({ state: "ok" }),
  check: async () => ({ state: "ok" }),
  laneFail: async () => true,
  sweep: async () => answer,
});

describe("the sweep", () => {
  it("enqueues the lanes the app answers, at most three a connection", async () => {
    const sent: LaneMessage[] = [];
    const n = await sweep({
      app: app({ kick: [{ connectionId: "a", lanes: 2 }, { connectionId: "b", lanes: 9 }] }),
      mode: "on",
      depths: { queue_backlog: 0 },
      enqueue: async (m) => void sent.push(...m),
    });
    expect(n).toBe(5);
    expect(sent.filter((m) => m.connectionId === "b")).toHaveLength(3);
  });

  it("enqueues nothing switched off, or when the app cannot answer", async () => {
    const sent: LaneMessage[] = [];
    await sweep({ app: app({ kick: [{ connectionId: "a", lanes: 3 }] }), mode: "off", depths: {}, enqueue: async (m) => void sent.push(...m) });
    await sweep({ app: app({ state: "unreachable", status: 0 }), mode: "on", depths: {}, enqueue: async (m) => void sent.push(...m) });
    expect(sent).toEqual([]);
  });
});
