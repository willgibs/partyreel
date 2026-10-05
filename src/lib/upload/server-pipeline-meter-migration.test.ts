/**
 * THE PRESIGN'S METER AND TWO BREAKERS: THE SQL FACTS (lane `upload-meter`, 20261003210500, reworked on the Advisor's
 * Q19), pinned LATEST-WINS across the whole migration set the way `src/lib/db/migration-guards.test.ts` pins its own:
 * each pin reads CODE (comments stripped, whitespace collapsed), a body is its last definition and a grant its file's,
 * so a later file that drops a clause fails here. The lane's own file, beside the meter's call
 * (`server-pipeline-meter.ts`).
 *
 * What they hold:
 *   1. THE METER: `meter_upload` refuses past the hour's breaker, the uploads line (the completes' own question,
 *      `uploads_refused`: her plan's allowance over its window, or a lapsed pass; billing-integrity) and the room, and
 *      tallies the hour in one atomic upsert; it counts NOTHING of the month and takes no profiles lock; it is the
 *      service role's alone.
 *   2. THE MONTH IS THE COMPLETE'S: `create_media*` are 20261003110000's, untouched, still the only writers of the
 *      month's bytes and items; the meter writes the hour's columns alone.
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
  // ★ Reshaped by trash-in-storage (20261003220000; scar kept: one signature, a definer with an empty search_path):
  // a later file replaces the body in place (`create or replace`, this signature untouched) and restates the grants.
  it("is this file's, one signature: an event, a type and the declared bytes, a definer with an empty search_path", () => {
    const { body, file } = latest("meter_upload");
    expect(file >= FILE, file).toBe(true);
    expect(fileSql()).toContain("create function public.meter_upload(");
    expect(body).toMatch(
      /^create (or replace )?function public\.meter_upload\( p_event_id uuid, p_type public\.media_type, p_bytes bigint \) returns jsonb language plpgsql security definer set search_path = '' as \$\$/,
    );
  });

  it("★ takes no row lock at all: with no month to spend, its reads are plain and its one write is its own upsert", () => {
    const body = latest("meter_upload").body;
    expect(body).not.toMatch(/\bfor (update|share|no key update|key share)\b/);
    expect(body).toContain(
      "select e.host_id into v_host from public.events e where e.id = p_event_id and e.deleted_at is null;",
    );
    // trash-in-storage reads her setting in the same plain read (Make room from Deleted).
    expect(body).toContain(
      "select p.tier, p.storage_cap_bytes, p.make_room_from_deleted into v_tier, v_storage_cap, v_make_room from public.profiles p where p.id = v_host;",
    );
  });

  it("★ refuses in one order (the breaker's early read, the month, the room), and only then tallies the hour", () => {
    const body = latest("meter_upload").body;
    const at = (needle: string) => {
      const i = body.indexOf(needle);
      expect(i, needle).toBeGreaterThan(-1);
      return i;
    };
    const breaker = at(
      "if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then",
    );
    // ★ Reshaped by Ladder A (20261004100000; scar kept: the allowance is read here, in this order, as the complete
    // holds it, and refused under the wire's 'monthly'): her plan's own number over its window, a month or a pass's year.
    // ★ And by billing-integrity (20261005181000; same scar): read through the completes' own question, one home.
    const month = at(
      "if public.uploads_refused(v_host, v_tier, v_storage_cap, p_bytes) then return jsonb_build_object('ok', false, 'reason', 'monthly');",
    );
    // trash-in-storage: the room is the line an upload meets (`host_room_used`), refused with its numbers.
    const room = at(
      "v_used := public.host_room_used(v_host); if v_used + p_bytes > v_cap + (v_cap / 10) then",
    );
    expect(body.indexOf("'reason', 'storage'", room)).toBeGreaterThan(room);
    const tally = at("insert into public.storage_ledger as l (");
    expect(breaker).toBeLessThan(month);
    expect(month).toBeLessThan(room);
    expect(room).toBeLessThan(tally);
  });

  // ★ Reshaped by Ladder A (20261004100000; scar kept: one allowance, one window, one strict line on both sides): the
  // allowance is each plan's own number (`upload_allowance`) over its window (`uploads_used`: the month's ledger, or a
  // pass's year on the pass), where it was 3x the cap over the month's row alone. ★ And by billing-integrity
  // (20261005181000; same scar, and billing-locks' lapsed pass with it): the meter and both completes ask ONE function,
  // `uploads_refused`, the meter with the declared bytes and the completes with the HEAD's, so the line cannot be held
  // two ways; where each restated the predicate and a parity pin held the copies together.
  it("★ asks the completes' own question: the same function, her plan's same figures, the meter's declared bytes", () => {
    const body = latest("meter_upload").body;
    expect(body).toContain(
      "if public.uploads_refused(v_host, v_tier, v_storage_cap, p_bytes) then return jsonb_build_object('ok', false, 'reason', 'monthly'); end if;",
    );
    expect(body).toContain("v_period text := to_char(now(), 'YYYY-MM');");
    expect(body).toContain(
      "v_cap := coalesce(v_storage_cap, (select l.default_storage_cap_bytes from public.tier_limits(v_tier) l));",
    );
    // Nothing of the line restated here: no allowance or window of its own, no lapsed predicate of its own.
    expect(body).not.toMatch(
      /public\.upload_allowance\(|public\.uploads_used\(|event_passes/,
    );
    for (const name of ["create_media", "create_media_as_host"]) {
      const complete = latest(name).body;
      expect(complete, name).toContain(
        "if public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, p_file_size_bytes) then raise exception 'Upload limit reached for this plan.'",
      );
      // trash-in-storage: the complete holds everything she keeps, Deleted making room where her setting lets it.
      expect(complete, name).toContain(
        "if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10) then raise exception 'Storage capacity exceeded for this plan.'",
      );
    }
  });

  // ★ billing-locks (20261005130000): until the nightly recompute moved a lapsed pass holder to Free, the meter admitted
  // her upload, its bytes went up, and the complete refused them (the Advisor's Q26 F1). ★ Reshaped by billing-integrity
  // (20261005181000; scar kept: refused before a byte moves, in the allowance's words, after the breaker and before the
  // room, with no lock): the lapsed pass is `pass_lapsed`, asked inside `uploads_refused`, the very call the completes
  // make, so no predicate is restated here to drift from theirs.
  it("★ refuses a lapsed pass as both completes do: through their own question, after the breaker and before the room", () => {
    const body = latest("meter_upload").body;
    const line = body.indexOf(
      "if public.uploads_refused(v_host, v_tier, v_storage_cap, p_bytes) then",
    );
    const breaker = body.indexOf(
      "if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then",
    );
    const room = body.indexOf("v_used := public.host_room_used(v_host);");
    expect(line).toBeGreaterThan(breaker);
    expect(breaker).toBeGreaterThan(-1);
    expect(room).toBeGreaterThan(line);
    const one = latest("uploads_refused").body;
    expect(one).toContain("or public.pass_lapsed(p_host_id, p_tier)");
  });

  it("★ the hour's tally is one upsert, atomic on its row: its WHERE refuses the 20,001st even past a raced early read", () => {
    const body = latest("meter_upload").body;
    expect(body).toContain(
      "insert into public.storage_ledger as l (host_id, period, hour_started_at, hour_uploads) values (v_host, v_period, v_hour, 1) on conflict (host_id, period) do update set hour_uploads = case when l.hour_started_at = excluded.hour_started_at then l.hour_uploads + 1 else 1 end, hour_started_at = excluded.hour_started_at where l.hour_started_at is distinct from excluded.hour_started_at or l.hour_uploads < c_uploads_an_hour returning l.hour_uploads into v_tallied;",
    );
    expect(body).toContain(
      "if v_tallied is null then return jsonb_build_object( 'ok', false, 'reason', 'hourly',",
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

describe("2. the month is the complete's", () => {
  // ★ Reshaped by trash-in-storage (scar kept: this file never touches a complete): 20261003220000 replaces both in
  // place for the cap, so the pin is that the winner is any file but this one.
  it.each(["create_media", "create_media_as_host"])(
    "★ %s is untouched by this file",
    (name) => {
      expect(latest(name).file).not.toBe(FILE);
      expect(fileSql()).not.toContain(`function public.${name}(`);
    },
  );

  it("★ the month's bytes and items have two writers, the completes; the meter writes the hour's columns alone", () => {
    const monthWriters = [...WINNING]
      .filter(([, { body }]) =>
        /\binsert into public\.storage_ledger \(host_id, period, cumulative_bytes\b/.test(
          body,
        ),
      )
      .map(([name]) => name)
      .sort();
    expect(monthWriters).toEqual(["create_media", "create_media_as_host"]);
    const meter = latest("meter_upload").body;
    expect(meter).not.toMatch(
      /\b(cumulative_bytes|photo_count|video_count)\s*=/,
    );
    expect(meter).not.toMatch(
      /insert into public\.storage_ledger[^;]*\b(cumulative_bytes|photo_count|video_count)\b[^;]*values/,
    );
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
