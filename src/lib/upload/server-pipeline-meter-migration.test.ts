/**
 * THE PRESIGN COUNTS: THE SQL FACTS (lane `upload-meter`, 20261003210500), pinned LATEST-WINS across the whole
 * migration set the way `src/lib/db/migration-guards.test.ts` pins its own: each pin reads CODE (comments stripped,
 * whitespace collapsed), a body is its last definition and a grant its file's, so a later file that drops a clause
 * fails here. The lane's own file, beside the meter's call (`server-pipeline-meter.ts`).
 *
 * What they hold:
 *   1. THE METER: `meter_upload` counts the declared bytes and the item under the host's one lock, after the breaker,
 *      the month (today's inequality on today's allowance) and the storage it must fit, and is the service role's alone.
 *   2. ONE WRITER: no other winning body writes the ledger, and `create_media*` neither check nor count the month.
 *   3. THE BREAKERS: an account's uploads a clock hour (20,000) and its creations a day (100), the second on a creation
 *      alone, after the plan's own limit, in words the create action reads.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const FILE = "20261003210500_upload_meter.sql";

const collapse = (sql: string) => sql.replace(/\s+/g, " ");
const strip = (sql: string) => sql.replace(/--[^\n]*/g, "");

function files(): { file: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8"),
    }));
}

/** Every function's winning definition: the last create across the set, with the file it won in. */
function winning(): Map<string, { body: string; file: string }> {
  const out = new Map<string, { body: string; file: string }>();
  for (const { file, sql } of files()) {
    const code = strip(sql);
    const re = /create (?:or replace )?function public\.([a-z_0-9]+)\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const rest = code.slice(m.index);
      const opener = rest.match(/\bas (\$[a-z_]*\$)/);
      if (!opener) continue;
      const tag = opener[1];
      const start = m.index + opener.index! + opener[0].length;
      const close = code.indexOf(`${tag};`, start);
      out.set(m[1]!, {
        body: collapse(code.slice(m.index, close + tag.length + 1)),
        file,
      });
    }
  }
  return out;
}

const WINNING = winning();
function latest(name: string): { body: string; file: string } {
  const found = WINNING.get(name);
  expect(found, `${name} defined nowhere`).toBeDefined();
  return found!;
}
const fileSql = () =>
  collapse(strip(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8")));
const everything = () =>
  files()
    .map(({ sql }) => collapse(strip(sql)))
    .join(" ");

describe("1. the meter", () => {
  it("is this file's, one signature: an event, a type and the declared bytes, a definer with an empty search_path", () => {
    const { body, file } = latest("meter_upload");
    expect(file).toBe(FILE);
    expect(body).toContain(
      "create function public.meter_upload( p_event_id uuid, p_type public.media_type, p_bytes bigint ) returns jsonb language plpgsql security definer set search_path = '' as $$",
    );
  });

  it("★ takes the host's profiles lock FIRST and alone, before it reads the month, and never locks the event row", () => {
    const body = latest("meter_upload").body;
    const lock = body.indexOf(
      "select * into v_profile from public.profiles where id = v_event.host_id for update;",
    );
    expect(lock).toBeGreaterThan(-1);
    expect(lock).toBeLessThan(
      body.indexOf("select * into v_ledger from public.storage_ledger"),
    );
    expect(
      body.match(/\bfor (update|share|no key update|key share)\b/g),
    ).toEqual(["for update"]);
    expect(body).toContain(
      "select * into v_event from public.events where id = p_event_id and deleted_at is null;",
    );
  });

  it("★ refuses in one order (the breaker, the month, the room), and only then counts", () => {
    const body = latest("meter_upload").body;
    const at = (needle: string) => {
      const i = body.indexOf(needle);
      expect(i, needle).toBeGreaterThan(-1);
      return i;
    };
    const breaker = at(
      "if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then",
    );
    const month = at(
      "if v_ingress_cap is not null and coalesce(v_ledger.cumulative_bytes, 0) + p_bytes > v_ingress_cap then return jsonb_build_object('ok', false, 'reason', 'monthly');",
    );
    const room = at(
      "if v_cap is not null and public.host_active_bytes(v_event.host_id) + p_bytes > v_cap + (v_cap / 10) then return jsonb_build_object('ok', false, 'reason', 'storage');",
    );
    const count = at("insert into public.storage_ledger as l (");
    expect(breaker).toBeLessThan(month);
    expect(month).toBeLessThan(room);
    expect(room).toBeLessThan(count);
  });

  it("★ reads the month's allowance exactly as the complete read it: the same cap, the same line, the same key", () => {
    const body = latest("meter_upload").body;
    expect(body).toContain(
      "v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);",
    );
    expect(body).toContain("v_period text := to_char(now(), 'YYYY-MM');");
    // The room is the complete's too: the cap and its 10% write headroom (capWithWriteHeadroom).
    expect(body).toContain(
      "v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);",
    );
    // And the previous file's complete read the month on the same function and the same strict line.
    const before = collapse(
      strip(
        readFileSync(
          join(MIGRATIONS_DIR, "20261003110000_phone_copy.sql"),
          "utf8",
        ),
      ),
    );
    expect(before).toContain(
      "if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_ingress_cap then raise exception 'Monthly upload limit reached for this plan.'",
    );
  });

  it("counts the declared bytes and the item, and the hour's tally (a new hour starting again at one)", () => {
    const body = latest("meter_upload").body;
    expect(body).toContain(
      "insert into public.storage_ledger as l ( host_id, period, cumulative_bytes, photo_count, video_count, hour_started_at, hour_uploads ) values ( v_event.host_id, v_period, p_bytes, case when p_type = 'photo' then 1 else 0 end, case when p_type = 'video' then 1 else 0 end, v_hour, 1 ) on conflict (host_id, period) do update set cumulative_bytes = l.cumulative_bytes + excluded.cumulative_bytes, photo_count = l.photo_count + excluded.photo_count, video_count = l.video_count + excluded.video_count, hour_uploads = case when l.hour_started_at = excluded.hour_started_at then l.hour_uploads + 1 else 1 end, hour_started_at = excluded.hour_started_at, updated_at = now();",
    );
    expect(body).toContain(
      "v_hour timestamptz := pg_catalog.date_trunc('hour', now(), 'UTC');",
    );
  });

  it("refuses a caller's mistake, and its ceiling mirrors MAX_UPLOAD_BYTES", () => {
    const body = latest("meter_upload").body;
    expect(body).toContain(
      "if p_event_id is null or p_type is null or p_bytes is null or p_bytes < 1 or p_bytes > c_max_upload_bytes then",
    );
    const m = body.match(
      /c_max_upload_bytes constant bigint := (\d+)::bigint \* 1024 \* 1024 \* 1024;/,
    );
    expect(m).not.toBeNull();
    expect(Number(m![1]) * 1024 ** 3).toBe(MAX_UPLOAD_BYTES);
  });

  it("is the service role's alone, here and in every file", () => {
    const sql = fileSql();
    expect(sql).toContain(
      "revoke execute on function public.meter_upload(uuid, public.media_type, bigint) from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.meter_upload(uuid, public.media_type, bigint) to service_role;",
    );
    expect(everything()).not.toMatch(
      /grant execute on function public\.meter_upload\([^)]*\) to [^;]*\b(?:anon|authenticated|public)\b/,
    );
  });

  it("the hour's two columns ride the month's row, which no client role reads", () => {
    const sql = fileSql();
    expect(sql).toContain(
      "alter table public.storage_ledger add column hour_started_at timestamptz, add column hour_uploads integer not null default 0;",
    );
    expect(sql).toContain(
      "add constraint storage_ledger_hour_uploads_nonneg check (hour_uploads >= 0);",
    );
    expect(everything()).not.toMatch(
      /grant [^;]* on (table )?public\.storage_ledger to [^;]*\b(?:anon|authenticated)\b/,
    );
  });
});

describe("2. one writer", () => {
  it("★ no winning body but meter_upload writes the ledger: a file counts once, at its presign", () => {
    const writers = [...WINNING]
      .filter(([, { body }]) =>
        /\b(insert into|update|delete from) public\.storage_ledger\b/.test(
          body,
        ),
      )
      .map(([name]) => name);
    expect(writers).toEqual(["meter_upload"]);
  });

  it.each(["create_media", "create_media_as_host"])(
    "★ %s neither checks nor counts the month, and still binds the room and the physical meter on the HEAD's size",
    (name) => {
      const { body, file } = latest(name);
      expect(file).toBe(FILE);
      expect(body).not.toMatch(
        /storage_ledger|monthly_ingress_cap|v_month_bytes/,
      );
      expect(body).not.toContain("Monthly upload limit");
      expect(body).toContain(
        "if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then raise exception 'Storage capacity exceeded for this plan.'",
      );
      expect(body).toContain(
        "set storage_used_bytes = storage_used_bytes + p_file_size_bytes where id = v_event.host_id;",
      );
    },
  );

  it("the readers of the month still read the row the meter writes (the advisories and the gate)", () => {
    for (const name of [
      "get_upload_context",
      "get_host_upload_context",
      "get_upload_gate",
    ]) {
      expect(latest(name).body, name).toContain(
        "v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);",
      );
    }
  });
});

describe("3. the breakers", () => {
  it("★ an account's uploads a clock hour: 20,000, far past any party", () => {
    expect(latest("meter_upload").body).toContain(
      "c_uploads_an_hour constant integer := 20000;",
    );
  });

  it("★ an account's creations a day: 100, on a creation alone, after the plan's own limit", () => {
    const { body, file } = latest("enforce_event_limit");
    expect(file).toBe(FILE);
    expect(body).toContain("c_events_a_day constant integer := 100;");
    const plan = body.indexOf(
      "raise exception 'Event limit reached for the % plan (max % event(s)). Delete an event or upgrade.', v_tier, v_max",
    );
    const breaker = body.indexOf(
      "if tg_op = 'INSERT' then select count(*) into v_count from public.events where host_id = new.host_id and created_at > now() - interval '24 hours'; if v_count >= c_events_a_day then raise exception 'You''ve created a lot of events today. Try again tomorrow.' using errcode = 'check_violation'; end if; end if;",
    );
    expect(plan).toBeGreaterThan(-1);
    expect(breaker).toBeGreaterThan(plan);
    expect(body).toContain(
      "perform 1 from public.profiles where id = new.host_id for update;",
    );
    expect(fileSql()).toContain(
      "revoke execute on function public.enforce_event_limit() from public, anon, authenticated;",
    );
  });

  it("a deleted event still counts, because created_at is no client's to write", () => {
    expect(everything()).not.toMatch(
      /grant insert \([^)]*\bcreated_at\b[^)]*\) on public\.events/,
    );
  });

  it("★ the create action reads the breaker's own words, ahead of the plan limit's sentence", () => {
    const ts = collapse(
      readFileSync(join(ROOT, "src/lib/db/mutations/events.ts"), "utf8"),
    );
    const marker = ts.match(/const EVENTS_TODAY = "([^"]+)";/);
    expect(marker, "events.ts names the breaker's marker").not.toBeNull();
    expect(
      "You've created a lot of events today. Try again tomorrow.",
    ).toContain(marker![1]);
    expect(ts.indexOf("if (breakerRefusal(error))")).toBeGreaterThan(-1);
    expect(ts.indexOf("if (breakerRefusal(error))")).toBeLessThan(
      ts.indexOf(
        'code: "limit_reached", message: "You\'ve reached the event limit for your plan."',
      ),
    );
  });
});
