/**
 * STOPPING ONE UPLOAD ASKS FIRST AND SAYS IT WAS CANCELLED, AS THE DOWNLOADS DO (upload-cancel, E6). What is held: the
 * x's question has Keep going first and goes away without a trace; the other answer stops the file and the ending is
 * neutral (never an error) with a Try again that sends it again; a stop that came too late says nothing; a question
 * whose file left is withdrawn, and a press after that is nothing; and the words are the downloads' own.
 */
import { describe, expect, it, vi } from "vitest";

import type { ToastView } from "@/components/app/export/export-walk";
import { DONE_MS, WALK_COPY } from "@/lib/export/walk";
import {
  askToStop,
  STOP_COPY,
  withdrawStopQuestion,
  type StopResult,
} from "@/lib/upload/stop-upload";

/** A toast port that keeps what each id last said. */
function port() {
  const shown = new Map<string, ToastView>();
  const log: string[] = [];
  return {
    shown,
    log,
    port: {
      show: (id: string, view: ToastView) => {
        shown.set(id, view);
        log.push(`show ${id} ${view.tone}`);
      },
      dismiss: (id: string) => {
        shown.delete(id);
        log.push(`dismiss ${id}`);
      },
    },
  };
}

type Confirm = Extract<ToastView, { tone: "confirm" }>;
type Cancelled = Extract<ToastView, { tone: "cancelled" }>;
const confirmOf = (p: ReturnType<typeof port>, id: string) =>
  p.shown.get(id) as Confirm;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("the question", () => {
  it("★ says the words the downloads say: Keep going first, then Stop upload", () => {
    const p = port();
    askToStop({ port: p.port, id: "q1", stop: async () => null });
    const asked = confirmOf(p, "q1");
    expect(asked.tone).toBe("confirm");
    expect(asked.title).toBe("Stop this upload?");
    expect(asked.actions.map((a) => a.label)).toEqual([
      WALK_COPY.keepGoing,
      "Stop upload",
    ]);
    withdrawStopQuestion(p.port, "q1");
  });

  it("Keep going takes the question down and stops nothing", async () => {
    const p = port();
    const stop = vi.fn(async (): Promise<StopResult> => null);
    askToStop({ port: p.port, id: "q2", stop });
    confirmOf(p, "q2").actions[0]!.run();
    await flush();
    expect(stop).not.toHaveBeenCalled();
    expect(p.shown.has("q2")).toBe(false);
  });

  it("a second press while the question stands asks nothing twice", () => {
    const p = port();
    askToStop({ port: p.port, id: "q3", stop: async () => null });
    askToStop({ port: p.port, id: "q3", stop: async () => null });
    expect(p.log.filter((l) => l.startsWith("show"))).toHaveLength(1);
    withdrawStopQuestion(p.port, "q3");
  });
});

describe("a confirmed stop", () => {
  it("★ says Upload cancelled. neutrally, with a Try again that sends the file again and takes the toast down", async () => {
    const p = port();
    const tryAgain = vi.fn();
    askToStop({ port: p.port, id: "q4", stop: async () => tryAgain });
    confirmOf(p, "q4").actions[1]!.run();
    await flush();
    const told = p.shown.get("q4") as Cancelled;
    expect(told.tone).toBe("cancelled");
    expect(told.title).toBe("Upload cancelled.");
    expect(told.duration).toBe(DONE_MS.cancelled);
    expect(told.close.label).toBe(WALK_COPY.dismiss);
    expect(told.action?.label).toBe(WALK_COPY.tryAgain);
    told.action!.run();
    expect(tryAgain).toHaveBeenCalledTimes(1);
    expect(p.shown.has("q4")).toBe(false);
  });

  it("its Dismiss only puts the toast away", async () => {
    const p = port();
    const tryAgain = vi.fn();
    askToStop({ port: p.port, id: "q5", stop: async () => tryAgain });
    confirmOf(p, "q5").actions[1]!.run();
    await flush();
    (p.shown.get("q5") as Cancelled).close.run();
    expect(p.shown.has("q5")).toBe(false);
    expect(tryAgain).not.toHaveBeenCalled();
  });

  it("too late (it landed first): the question goes and nothing is said", async () => {
    const p = port();
    askToStop({ port: p.port, id: "q6", stop: async () => null });
    confirmOf(p, "q6").actions[1]!.run();
    await flush();
    expect(p.shown.has("q6")).toBe(false);
    expect(p.log.filter((l) => l.startsWith("show"))).toEqual([
      "show q6 confirm",
    ]);
  });

  it("a stop that throws is told as too late, never as a cancel", async () => {
    const p = port();
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    askToStop({
      port: p.port,
      id: "q7",
      stop: async () => {
        throw new Error("boom");
      },
    });
    confirmOf(p, "q7").actions[1]!.run();
    await flush();
    expect(p.shown.has("q7")).toBe(false);
    quiet.mockRestore();
  });

  it("a double press on Stop upload stops once", async () => {
    const p = port();
    const stop = vi.fn(async (): Promise<StopResult> => () => {});
    askToStop({ port: p.port, id: "q8", stop });
    const answer = confirmOf(p, "q8").actions[1]!;
    answer.run();
    answer.run();
    await flush();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe("a question whose file left", () => {
  it("★ is withdrawn, and its Stop upload pressed after that is nothing", async () => {
    const p = port();
    const stop = vi.fn(async (): Promise<StopResult> => () => {});
    askToStop({ port: p.port, id: "q9", stop });
    const stale = confirmOf(p, "q9").actions[1]!;
    withdrawStopQuestion(p.port, "q9");
    expect(p.shown.has("q9")).toBe(false);
    stale.run();
    await flush();
    expect(stop).not.toHaveBeenCalled();
    expect(p.shown.has("q9")).toBe(false);
  });

  it("the file leaving after the answer does not take down the ending the answer is drawing", async () => {
    const p = port();
    askToStop({ port: p.port, id: "q10", stop: async () => () => {} });
    confirmOf(p, "q10").actions[1]!.run();
    // The queue lets the file go (the tile unmounts) before the ending is drawn.
    withdrawStopQuestion(p.port, "q10");
    await flush();
    expect(p.shown.get("q10")?.tone).toBe("cancelled");
  });
});

describe("the words", () => {
  it("are the downloads' own where they are the same word", () => {
    expect(STOP_COPY.keepGoing).toBe(WALK_COPY.keepGoing);
    expect(STOP_COPY.tryAgain).toBe(WALK_COPY.tryAgain);
    expect(STOP_COPY.dismiss).toBe(WALK_COPY.dismiss);
  });
});
