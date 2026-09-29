/**
 * THE CLIENT WITH NO IDENTITY holds no session and reads no cookie: the publishable key alone, so
 * what it reads is what a signed-out visitor reads (the share card's read, `db/queries/event-card.ts`).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn((..._args: unknown[]) => ({})),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.test",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  },
}));

const { createAnonClient } = await import("@/lib/supabase/anon");

describe("createAnonClient", () => {
  it("is the publishable key with no session to keep or refresh", () => {
    createAnonClient();
    const [url, key, options] = createClient.mock.calls[0] as [
      string,
      string,
      { auth: Record<string, unknown>; global: { fetch: unknown } },
    ];
    expect(url).toBe("https://project.supabase.test");
    expect(key).toBe("sb_publishable_test");
    expect(options.auth).toEqual({
      autoRefreshToken: false,
      persistSession: false,
    });
    expect(typeof options.global.fetch).toBe("function");
  });

  it("never reads the request: no cookies, no secret key", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/supabase/anon.ts"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    for (const identity of [
      "next/headers",
      "cookies",
      "SUPABASE_SECRET_KEY",
      "@supabase/ssr",
    ]) {
      expect(source, identity).not.toContain(identity);
    }
  });
});
