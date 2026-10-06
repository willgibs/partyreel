/**
 * THE CAPTURE TIME'S SQL FACTS (lane `capture-time`, 20261005200000; Will's X7), pinned LATEST-WINS across the whole
 * migration set (`liveFunction`: a body is its last definition), so a later file that drops a clause fails here, and
 * the two writers' wires held to their functions' own signatures. What they hold:
 *   1. THE COLUMN: `media.captured_at`, a nullable timestamptz, finite by CHECK; the host reads it (her album's
 *      manifest, on her RLS client) and no client role writes it.
 *   2. THE WRITERS: `create_media*` take `p_captured_at` LAST, defaulted, so a deployed call that never names it lands
 *      on the default; it is written in the one insert. ★ THE BOUNDS ARE NOT HERE: they have one home,
 *      `src/lib/media/capture-time.ts`, asked on the server before the call, so no body compares it to anything.
 *   3. THE READERS: the change log carries it as each change's twelfth element and the Drive lease as each item's key.
 *   4. THE WIRES: each wrapper names `p_captured_at` only when there is one (the default applies otherwise, against a
 *      database before the file too), and names no argument its function lacks.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  allMigrations,
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";

const rpc = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: (...args: unknown[]) => rpc(...args) }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));

const { createMedia } = await import("@/lib/db/mutations/guest");
const { createMediaAsHost } = await import("@/lib/db/mutations/host-media");

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
const FILE = "20261005200000_capture_time.sql";
const code = () =>
  executableMigrations()
    .map(({ sql }) => sql)
    .join(" ");
const own = () => executableMigrations().find((m) => m.file === FILE)!.sql;

describe("1. the column", () => {
  it("is a nullable timestamptz with no default, finite by CHECK", () => {
    expect(own()).toContain(
      "alter table public.media add column captured_at timestamptz;",
    );
    expect(own()).toContain(
      "alter table public.media add constraint media_captured_at_finite check (isfinite(captured_at));",
    );
    expect(code()).not.toMatch(
      /drop constraint (if exists )?media_captured_at_finite/,
    );
  });

  it("the host reads it, and no client role ever writes it", () => {
    expect(own()).toContain(
      "grant select (captured_at) on public.media to authenticated;",
    );
    expect(code()).not.toMatch(
      /grant [^;]*\b(insert|update)\b[^;]*\(([^)]*\bcaptured_at\b[^)]*)\) on public\.media/,
    );
    expect(code()).not.toMatch(
      /grant [^;]*\([^)]*\bcaptured_at\b[^)]*\) on public\.media to [^;]*\banon\b/,
    );
  });

  it("says what it is, where the bounds live", () => {
    expect(collapse(allMigrations())).toContain(
      "comment on column public.media.captured_at is",
    );
  });
});

describe("2. the writers", () => {
  it.each(["create_media", "create_media_as_host"])(
    "%s takes p_captured_at last, defaulted, and writes it in its one insert",
    (name) => {
      const fn = liveFunction(name);
      expect(fn.file).toBe(FILE);
      expect(fn.params).toMatch(/, p_captured_at timestamptz default null$/);
      expect(fn.code).toContain(
        "phone_key, phone_bytes, captured_at ) values (",
      );
      expect(fn.code).toContain("p_phone_key, p_phone_bytes, p_captured_at );");
      expect(fn.code.match(/insert into public\.media \(/g)).toHaveLength(1);
    },
  );

  it.each(["create_media", "create_media_as_host"])(
    "★ %s compares the capture time to nothing: the bounds have one home, on the server, before the call",
    (name) => {
      const body = liveFunction(name).code;
      expect(body.match(/p_captured_at/g)).toHaveLength(2); // its declaration and its one write
      expect(body).not.toMatch(/captured_at\s*[<>]/);
    },
  );

  it.each([
    [
      "create_media",
      "text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz",
    ],
    [
      "create_media_as_host",
      "uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean, text, bigint, timestamptz",
    ],
  ])(
    "%s stays the service role's alone, restated in its file",
    (name, types) => {
      expect(own()).toContain(
        `revoke execute on function public.${name}(${types}) from public, anon, authenticated;`,
      );
      expect(own()).toContain(
        `grant execute on function public.${name}(${types}) to service_role;`,
      );
      expect(code()).not.toMatch(
        new RegExp(
          `grant execute on function public\\.${name}\\(${types.replace(/[().]/g, "\\$&")}\\) to [^;]*\\b(?:anon|authenticated|public)\\b`,
        ),
      );
    },
  );
});

describe("3. the readers", () => {
  it("the change log carries each change's capture time in microseconds, its twelfth element, last", () => {
    expect(liveFunction("album_changes_since").code).toContain(
      "case when p_scope = 'host' then m.guest_id end, (extract(epoch from m.captured_at) * 1000000)::bigint) order by c.v, c.media_id",
    );
  });

  it("the Drive lease carries each item's", () => {
    expect(liveFunction("cloud_export_lease").code).toContain(
      "'created_at', m.created_at, 'captured_at', m.captured_at,",
    );
  });
});

/** A function's arguments as the migrations declare them, and whether each must be sent (it has no default). */
function declared(fn: string): { arg: string; required: boolean }[] {
  return liveFunction(fn)
    .params.split(/,\s*(?=p_)/)
    .filter((part) => part.trim() !== "")
    .map((part) => ({
      arg: part.trim().split(/\s+/)[0]!,
      required: !/\bdefault\b/i.test(part),
    }));
}

/** The last call's function and the JSON body PostgREST receives for it (an `undefined` is no key). */
function sent(): { fn: string; body: Record<string, unknown> } {
  const [fn, args] = rpc.mock.calls.at(-1)!;
  return { fn, body: JSON.parse(JSON.stringify(args ?? {})) };
}

describe("4. the wires", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({
      data: { media_id: "m", status: "approved" },
      error: null,
    });
  });

  const guest = (capturedAt?: string | null) =>
    createMedia({
      sessionToken: "t",
      mediaId: "00000000-0000-4000-8000-000000000001",
      type: "photo",
      originalKey: "events/e/photo/m/original.jpg",
      fileSizeBytes: 1000,
      capturedAt,
    });
  const host = (capturedAt?: string | null) =>
    createMediaAsHost({
      hostId: "00000000-0000-4000-8000-000000000002",
      eventId: "00000000-0000-4000-8000-000000000003",
      mediaId: "00000000-0000-4000-8000-000000000001",
      type: "photo",
      originalKey: "events/e/photo/m/original.jpg",
      fileSizeBytes: 1000,
      capturedAt,
    });

  it.each([
    ["create_media", guest],
    ["create_media_as_host", host],
  ] as const)(
    "★ %s names p_captured_at when there is one, and leaves it out otherwise",
    async (fn, call) => {
      await call("2026-10-04T01:14:05.000Z");
      expect(sent()).toMatchObject({
        fn,
        body: { p_captured_at: "2026-10-04T01:14:05.000Z" },
      });
      for (const none of [null, undefined]) {
        await call(none);
        expect(sent().body).not.toHaveProperty("p_captured_at");
      }
      // Every key it sends is an argument its function has, and every argument with no default is sent.
      await call("2026-10-04T01:14:05.000Z");
      const args = declared(fn);
      for (const key of Object.keys(sent().body)) {
        expect(
          args.map((a) => a.arg),
          key,
        ).toContain(key);
      }
      for (const { arg, required } of args) {
        if (required) expect(Object.keys(sent().body), arg).toContain(arg);
      }
    },
  );
});
