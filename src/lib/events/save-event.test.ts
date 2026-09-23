import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE SAVE EVERY CONFIRMING DOOR PROMISES (the offer card, the Unverified mark,
 * the name menu). What is pinned is the intent's life: written before a door
 * that may leave the page, finished by exactly one reader on the way back, put
 * back when the save fails, and never a throw on blocked storage.
 */

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ rpc }) }));

import {
  completePendingSave,
  markPendingSave,
  pendingSaveKey,
  saveEvent,
} from "./save-event";

class FakeStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const EVENT = { eventId: "evt-1", qrToken: "tok-1" };
const KEY = "pr_pending_save_evt-1";

beforeEach(() => {
  vi.stubGlobal("localStorage", new FakeStorage());
  rpc.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saving an event", () => {
  it("keeps the offer card's own intent key, so an intent already written still lands", () => {
    expect(pendingSaveKey("evt-1")).toBe(KEY);
  });

  it("saves by the event's token and clears the intent once it lands", async () => {
    markPendingSave("evt-1");
    rpc.mockResolvedValue({ data: "evt-1", error: null });
    await expect(saveEvent(EVENT)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("save_event", { p_qr_token: "tok-1" });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("reports a refusal or an error as not saved, and keeps the intent", async () => {
    markPendingSave("evt-1");
    rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(saveEvent(EVENT)).resolves.toBe(false);
    rpc.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    await expect(saveEvent(EVENT)).resolves.toBe(false);
    expect(localStorage.getItem(KEY)).toBe("1");
  });
});

describe("finishing a save after a redirect sign-in", () => {
  it("does nothing when no door asked", async () => {
    await expect(completePendingSave(EVENT)).resolves.toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("is finished by exactly one reader, however many are mounted", async () => {
    markPendingSave("evt-1");
    rpc.mockResolvedValue({ data: "evt-1", error: null });
    const results = await Promise.all([
      completePendingSave(EVENT),
      completePendingSave(EVENT),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("puts the intent back when the save fails, so the next visit tries again", async () => {
    markPendingSave("evt-1");
    rpc.mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(completePendingSave(EVENT)).resolves.toBe(false);
    expect(localStorage.getItem(KEY)).toBe("1");
  });

  it("never throws on blocked storage", async () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    });
    expect(() => markPendingSave("evt-1")).not.toThrow();
    await expect(completePendingSave(EVENT)).resolves.toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
