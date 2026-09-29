/**
 * THE CARD'S READ ASKS AS NOBODY (build 17's red-team: the card drew a per-viewer answer behind a
 * public cache). It goes through the one resolver, `get_event_by_qr_token`, on the client with no
 * identity, so no session can mask the event (a block) or unredact it (its host), and it draws a name
 * only where the event itself is not private.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: () => ({ rpc }),
}));

const { getEventCardName } = await import("@/lib/db/queries/event-card");

function row(visibility: "open" | "password" | "private", name: string | null) {
  return { data: [{ visibility, name }], error: null };
}

beforeEach(() => {
  rpc.mockReset();
});

describe("getEventCardName", () => {
  it("asks the one resolver by the address it was given (a token or a slug)", async () => {
    rpc.mockResolvedValue(row("open", "Maya's 30th"));
    await getEventCardName("mayas-30th");
    expect(rpc).toHaveBeenCalledWith("get_event_by_qr_token", {
      p_qr_token: "mayas-30th",
    });
  });

  it("names an open or a password event", async () => {
    rpc.mockResolvedValue(row("open", "Maya's 30th"));
    expect(await getEventCardName("t")).toBe("Maya's 30th");
    rpc.mockResolvedValue(row("password", "Maya's 30th"));
    expect(await getEventCardName("t")).toBe("Maya's 30th");
  });

  it("names nothing for a private, unknown, deleted or nameless event", async () => {
    // The belt: even a private row that came back named draws nothing.
    rpc.mockResolvedValue(row("private", "Maya's 30th"));
    expect(await getEventCardName("t")).toBeNull();
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await getEventCardName("t")).toBeNull();
    rpc.mockResolvedValue(row("open", "   "));
    expect(await getEventCardName("t")).toBeNull();
  });

  it("throws on a failed read, so no guess is ever cached for everyone", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(getEventCardName("t")).rejects.toThrow("boom");
  });

  it("★ never reaches for the request's identity: no session client, no cookies", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/db/queries/event-card.ts"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    expect(source).toContain('from "@/lib/supabase/anon"');
    for (const identity of [
      "@/lib/supabase/server",
      "@/lib/supabase/admin",
      "next/headers",
      "closed-door",
    ]) {
      expect(source, identity).not.toContain(identity);
    }
  });
});
