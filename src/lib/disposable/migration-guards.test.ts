/**
 * THE DEVELOP AND THE CAMERA'S SQL FACTS (lane `disposable-foundation`, 20261002200000), pinned LATEST-WINS across the
 * whole migration set the way `src/lib/db/migration-guards.test.ts` pins its own: each pin reads CODE (comments
 * stripped, whitespace collapsed), a body is its last definition and a grant its file's, so a later file that drops a
 * clause fails here. The lane's own file, because other lanes write migrations beside this one.
 *
 * What they hold:
 *   1. THE ONE PREDICATE in every SQL home a guest's view reaches (the leak matrix's SQL half; its behaviour is the
 *      lane's rolled-back check, live and on the stand-in).
 *   2. THE ALBUM'S VERSIONS LEARN THE SEAL AND WHAT WAITS without a waiting id ever riding the guest's log: `album_bits`,
 *      the triggers watching `sealed_until`, the stamp writing an album_version only for what a guest sees, the
 *      doorbell on the same bits.
 *   3. DEVELOP IS A WRITE, a host's save of the develop time rewrites its rows in the same save, nothing seals a row a
 *      guest may have seen, and no upload locks the event row.
 *   4. THE ROLL (live shots, after the host's profiles lock and under its own advisory lock), its ceiling in its own
 *      ledger, a withdrawn camera shot's fast purge, the camera video's two bounds, the seal decided at insert.
 *   5. THE READS that answer the develop time, the capture and the roll, and who may call what.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const FILE = "20261002200000_disposable_foundation.sql";

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

/** The winning definition of `public.<name>(`: the last create across the set, with the file it won in. */
function latest(name: string): { body: string; file: string } {
  let found: { body: string; file: string } | null = null;
  for (const { file, sql } of files()) {
    const code = strip(sql);
    const re = new RegExp(
      `create (?:or replace )?function public\\.${name}\\(`,
      "g",
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const rest = code.slice(m.index);
      const opener = rest.match(/\bas (\$[a-z_]*\$)/);
      if (!opener) continue;
      const tag = opener[1];
      const start = m.index + opener.index! + opener[0].length;
      const close = code.indexOf(`${tag};`, start);
      found = {
        body: collapse(code.slice(m.index, close + tag.length + 1)),
        file,
      };
    }
  }
  expect(found, `${name} defined nowhere`).not.toBeNull();
  return found!;
}

const code = (name: string) => latest(name).body;
const fileSql = () =>
  collapse(strip(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8")));
const everything = () =>
  files()
    .map(({ sql }) => collapse(strip(sql)))
    .join(" ");

/** The predicate's visible half, as every home writes it; the host's exemption follows it in one of three spellings. */
const VISIBLE = "m.sealed_until is null or m.sealed_until <= now() or ";
const HOST_ASKS = [
  "e.host_id = (select auth.uid())",
  "exists (select 1 from public.events e where e.id = m.event_id and e.host_id = (select auth.uid()))",
  "v_event.host_id = (select auth.uid())",
];

describe("1. the one predicate in every SQL home a guest's view reaches", () => {
  const HOMES = [
    "get_event_media_by_qr_token",
    "event_covers",
    "event_stills",
    "event_card_stats",
    "like_media",
    "create_report",
    "get_public_profile",
    "album_changes_since",
  ];

  it.each(HOMES)(
    "%s carries it, the host exempt where her own session asks",
    (name) => {
      const body = code(name);
      expect(body).toContain(VISIBLE);
      const after = body.slice(body.indexOf(VISIBLE) + VISIBLE.length);
      expect(HOST_ASKS.some((spelling) => after.startsWith(spelling))).toBe(
        true,
      );
    },
  );

  it("★ the guest album's count and what waits read the predicate and its negation, one statement (one snapshot)", () => {
    const reader = code("album_changes_since");
    expect(reader).toContain(
      "when p_scope = 'album' then ( select count(*) from public.media m join public.events e on e.id = m.event_id where m.event_id = p_event_id and m.status = 'approved' and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid())))",
    );
    // What waits: the held rows and the brief's own sealed predicate, as written, per minute, as numbers.
    expect(reader).toContain(
      "where m.event_id = p_event_id and (m.status = 'pending' or (m.status = 'approved' and m.sealed_until > now() and e.host_id is distinct from (select auth.uid()))) group by 1",
    );
    expect(reader).toContain(
      "'waiting', case when p_scope = 'album' then ( select jsonb_build_object( 'count', coalesce(sum(x.n), 0)::bigint, 'minutes', coalesce(jsonb_agg(jsonb_build_array(x.at, x.n) order by x.at), '[]'::jsonb))",
    );
    expect(reader).not.toContain("'sealed'");
    // The host's count is every approved item (she is exempt), and no waiting facts come back to her scope.
    expect(reader).toContain(
      "when p_scope = 'host' then ( select count(*) from public.media m where m.event_id = p_event_id and m.status = 'approved')",
    );
    expect(reader).toContain(
      " language sql stable security invoker set search_path = ''",
    );
  });

  it("the open album RPC keeps its gates and its keyset around the predicate (the index still walks in display order)", () => {
    expect(code("get_event_media_by_qr_token")).toContain(
      "where m.event_id = ( select e.id from public.events e where e.qr_token = p_qr_token and e.visibility = 'open' and e.deleted_at is null ) and m.status = 'approved' and (m.sealed_until is null or m.sealed_until <= now() or exists (select 1 from public.events e where e.id = m.event_id and e.host_id = (select auth.uid()))) and (p_before_created_at is null",
    );
  });

  it("a report names a sealed shot as it names a foreign one (no existence oracle)", () => {
    expect(code("create_report")).toContain(
      "select * into v_media from public.media m where m.id = p_media_id and m.event_id = v_event.id and (m.sealed_until is null or m.sealed_until <= now() or v_event.host_id = (select auth.uid())); if not found then raise exception 'Reported media does not belong to this event.'",
    );
  });

  it("the public profile's attended arm and its private mirror both leave a sealed upload out, word for word", () => {
    const body = code("get_public_profile");
    const arm =
      "join public.media m on m.guest_id = g.id and m.status = 'approved' where g.event_id = e.id and g.user_id = p.id and g.verified_at is not null and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))";
    expect(body.split(arm).length - 1).toBe(2);
  });
});

describe("2. the album's versions learn the seal and what waits, and no waiting id rides the guest's log", () => {
  it("album_bits: the host's bit is album_scope's; +2 what a guest sees; +4 what waits (held, or approved and sealed)", () => {
    const body = code("album_bits");
    expect(body).toContain(
      "select (public.album_scope(p_was, p_is) & 1) + case when (p_was is not distinct from 'approved' and not coalesce(p_was_sealed, false)) <> (p_is is not distinct from 'approved' and not coalesce(p_is_sealed, false)) then 2 else 0 end + case when (p_was is not distinct from 'pending' or (p_was is not distinct from 'approved' and coalesce(p_was_sealed, false))) <> (p_is is not distinct from 'pending' or (p_is is not distinct from 'approved' and coalesce(p_is_sealed, false))) then 4 else 0 end;",
    );
    expect(body).toContain(" language sql immutable set search_path = ''");
  });

  it("the note notes the guest album for either guest bit, and touches no table", () => {
    const note = code("album_note_media");
    expect(note).toContain(
      "v_scope := public.album_bits(old.status, old.sealed_until is not null, new.status, new.sealed_until is not null);",
    );
    expect(note).toContain(
      "if v_scope & 6 <> 0 then perform public.album_remember('a', v_event);",
    );
    expect(note).not.toMatch(/\b(insert into|update public\.|delete from)\b/);
  });

  it("★ the stamp writes an album_version only for what a guest sees (bit 2): a waiting row's stays null, and so does its tombstone's", () => {
    const stamp = code("album_stamp_media");
    expect(stamp).toContain(
      "v_scope := public.album_bits(old.status, old.sealed_until is not null, new.status, new.sealed_until is not null);",
    );
    expect(stamp).toContain(
      "select v_event, v_media, s.version, case when v_scope & 2 = 2 then s.album_max end from public.album_state s",
    );
  });

  it("the triggers watch the seal, the note before the stamp by name, the stamp deferred to commit", () => {
    const sql = fileSql();
    expect(sql).toContain(
      "create trigger media_album_note after insert or update of status, sealed_until or delete on public.media for each row execute function public.album_note_media();",
    );
    expect(sql).toContain(
      "create constraint trigger media_album_stamp after insert or update of status, sealed_until or delete on public.media deferrable initially deferred for each row execute function public.album_stamp_media();",
    );
    expect(
      sql.indexOf("drop trigger media_album_note on public.media;"),
    ).toBeLessThan(sql.indexOf("create trigger media_album_note"));
  });

  it("★ the doorbell rings on the album's own bits (what a guest sees, what waits), and holds for a write that rings once", () => {
    const bell = code("notify_gallery_change");
    expect(bell).toContain(
      "if coalesce(pg_catalog.current_setting('partyreel.doorbell_hold', true), '') = 'on' then return null; end if;",
    );
    expect(bell).toContain(
      "v_bits := public.album_bits(old.status, old.sealed_until is not null, new.status, new.sealed_until is not null);",
    );
    expect(bell).toContain("if v_bits & 6 = 0 then return null; end if;");
    expect(bell).toContain("exception when others then null;");
  });
});

describe("3. develop is a write, a save rewrites in the same save, and nothing seals what a guest may have seen", () => {
  it("develop_rows: no time ahead opens every sealed row; a time ahead moves them, opens the past, seals the held", () => {
    const pass = code("develop_rows");
    expect(pass).toContain(
      "if p_event.develops_at is null or p_event.develops_at <= now() then if p_skip_locked then update public.media m set sealed_until = null where m.id in (select s.id from public.media s where s.event_id = p_event.id and s.sealed_until is not null for update skip locked); else update public.media m set sealed_until = null where m.event_id = p_event.id and m.sealed_until is not null; end if;",
    );
    expect(pass).toContain(
      "update public.media m set sealed_until = case when m.sealed_until <= now() then null else p_event.develops_at end where m.event_id = p_event.id and (m.sealed_until < p_event.develops_at or m.sealed_until > p_event.develops_at);",
    );
    expect(pass).toContain(
      "update public.media m set sealed_until = p_event.develops_at where m.event_id = p_event.id and m.status = 'pending' and m.sealed_until is null;",
    );
    const hold = pass.indexOf(
      "set_config('partyreel.doorbell_hold', 'on', true)",
    );
    const release = pass.indexOf(
      "set_config('partyreel.doorbell_hold', '', true)",
    );
    expect(hold).toBeGreaterThan(-1);
    expect(release).toBeGreaterThan(hold);
    // It never writes a status, so it never stamps let_in_at.
    expect(pass).not.toMatch(
      /set status|status =\s*'(approved|hidden|removed)'/,
    );
    expect(pass).toContain(
      " language plpgsql security invoker set search_path = ''",
    );
  });

  it("develop_due asks seal_disagrees, runs the one pass waiting on its rows, and rings once", () => {
    const develop = code("develop_due");
    expect(develop).toContain(
      "if not found or not public.seal_disagrees(v_event) then return 0; end if; v_n := public.develop_rows(v_event, false); if v_n > 0 then perform public.album_doorbell(p_event_id); end if;",
    );
  });

  it("★ a save of develops_at rewrites its rows in the same save, skipping a row another writer holds, and rings once", () => {
    expect(code("events_develops_rewrite")).toContain(
      "begin perform public.develop_rows(new, true); perform public.album_doorbell(new.id); return null; end;",
    );
    expect(code("events_develops_rewrite")).toContain(
      " security definer set search_path = ''",
    );
    expect(fileSql()).toContain(
      "create trigger events_develops_rewrite after update of develops_at on public.events for each row when (old.develops_at is distinct from new.develops_at) execute function public.events_develops_rewrite();",
    );
  });

  it("★ no upload and no develop takes the event row's lock (a measured deadlock cycle with restores, purges and takedowns)", () => {
    for (const name of [
      "develop_due",
      "develop_due_sweep",
      "develop_rows",
      "create_media",
      "create_media_as_host",
    ]) {
      expect(code(name), name).not.toMatch(
        /\bfrom public\.events\b[^;]*\bfor (share|update|no key update|key share)\b/,
      );
    }
  });

  it("★ no writer seals a row a guest may have seen: each update of sealed_until clears it, moves a sealed row, or seals a held one", () => {
    const writes = [
      ...everything().matchAll(
        /update public\.media m? ?set sealed_until = ([^;]*?) where ([^;]*);/g,
      ),
    ];
    expect(writes.length).toBeGreaterThan(0);
    for (const [, value, where] of writes) {
      const clears = value.trim() === "null";
      const movesSealed =
        where.includes("sealed_until is not null") ||
        /sealed_until < p_event\.develops_at or [ms]\.sealed_until > p_event\.develops_at/.test(
          where,
        );
      const sealsHeld =
        /status = 'pending' and [ms]\.sealed_until is null/.test(where);
      expect(
        clears || movesSealed || sealsHeld,
        `an update that could seal a visible row: set sealed_until = ${value} where ${where}`,
      ).toBe(true);
      if (!clears && !sealsHeld)
        expect(value).toContain("when m.sealed_until <= now() then null");
    }
  });

  it("seal_disagrees: two bounded probes under a develop time ahead, any sealed row otherwise", () => {
    expect(code("seal_disagrees")).toContain(
      "select case when p_event.develops_at is null or p_event.develops_at <= now() then exists (select 1 from public.media m where m.event_id = p_event.id and m.sealed_until is not null) else exists (select 1 from public.media m where m.event_id = p_event.id and m.sealed_until < p_event.develops_at) or exists (select 1 from public.media m where m.event_id = p_event.id and m.sealed_until > p_event.develops_at) end;",
    );
    expect(fileSql()).toContain(
      "create index media_sealed_idx on public.media (event_id, sealed_until) where sealed_until is not null;",
    );
  });

  it("the sweep develops the disagreeing albums in event-id order, a clamped batch a call", () => {
    const sweep = code("develop_due_sweep");
    expect(sweep).toContain(
      "v_limit constant integer := least(greatest(coalesce(p_limit, 50), 1), 500);",
    );
    expect(sweep).toContain(
      "and public.seal_disagrees(e) order by e.id limit v_limit loop v_developed := v_developed + public.develop_due(v_event);",
    );
    expect(fileSql()).toContain(
      "insert into public.ops_flags (key, enabled) values ('develop_rolls_enabled', true) on conflict (key) do nothing;",
    );
  });

  it("★ the event's own stamps: the roll follows the capture, Develop now is the database's clock, the period stamps itself", () => {
    const stamp = code("events_reveal_stamp");
    expect(stamp).toContain(
      "if new.capture = 'camera' then new.roll_size := coalesce(new.roll_size, 24); else new.roll_size := null; end if;",
    );
    expect(stamp).toContain(
      "and new.develops_at < now() + interval '1 minute' then new.develops_at := now(); end if;",
    );
    expect(stamp).toContain(
      "if tg_op = 'INSERT' then new.sealed_from := case when new.capture = 'camera' or new.develops_at > now() then now() end; elsif (new.develops_at > now() and (old.develops_at is null or old.develops_at <= now())) or (new.capture = 'camera' and old.capture is distinct from 'camera') then new.sealed_from := now(); elsif new.capture <> 'camera' and new.develops_at is null then new.sealed_from := null; else new.sealed_from := old.sealed_from; end if;",
    );
    expect(fileSql()).toContain(
      "create trigger events_reveal_stamp before insert or update of capture, roll_size, develops_at on public.events for each row execute function public.events_reveal_stamp();",
    );
  });

  it("the CHECKs: a capture by name, a roll with the camera and only it, at most 24, a finite develop, a camera's period", () => {
    const sql = fileSql();
    for (const check of [
      "add constraint events_capture_known check (capture in ('upload', 'camera'))",
      "add constraint events_roll_size_follows_capture check ((capture = 'camera') = (roll_size is not null))",
      "add constraint events_roll_size_range check (roll_size between 1 and 24)",
      "add constraint events_develops_at_finite check (develops_at is null or isfinite(develops_at))",
      "add constraint events_camera_has_period check (capture <> 'camera' or sealed_from is not null)",
      "add constraint media_sealed_until_finite check (sealed_until is null or isfinite(sealed_until))",
    ]) {
      expect(sql).toContain(check);
    }
    // A text under a CHECK, never an enum value a transaction cannot use.
    expect(sql).toContain("add column capture text not null default 'upload'");
    expect(sql).not.toMatch(/create type public\.\w+ as enum/);
    expect(sql).not.toMatch(/alter type public\.\w+ add value/);
  });
});

describe("4. the roll, its ceiling, the fast purge, the camera video, the seal at insert", () => {
  it("★ create_media counts the roll AFTER the host's profiles lock and under its own advisory lock, then the ceiling", () => {
    const body = code("create_media");
    const lock = body.indexOf(
      "from public.profiles where id = v_event.host_id for update;",
    );
    const advisory = body.indexOf(
      "perform pg_catalog.pg_advisory_xact_lock( pg_catalog.hashtextextended('roll:' || coalesce(v_guest.user_id, v_guest.id)::text, 0));",
    );
    const count = body.indexOf(
      "select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_guest.id, v_guest.user_id) r;",
    );
    const roll = body.indexOf(
      "if v_live >= v_event.roll_size then raise exception 'You''ve taken all % shots on your roll.', v_event.roll_size",
    );
    const ceiling = body.indexOf(
      "if v_taken >= v_event.roll_size * c_roll_retakes then raise exception 'You''ve used every retake this roll allows.'",
    );
    expect(lock).toBeGreaterThan(-1);
    expect(advisory).toBeGreaterThan(lock);
    expect(count).toBeGreaterThan(advisory);
    expect(roll).toBeGreaterThan(count);
    expect(ceiling).toBeGreaterThan(roll);
    expect(body).toContain("if v_event.capture = 'camera' then");
  });

  it("★ guest_roll: LIVE shots since the period (a removed one frees its frame), and every shot taken from the ledger", () => {
    const roll = code("guest_roll");
    expect(roll).toContain(
      "with hers as ( select g.id from public.guests g where g.event_id = p_event.id and (g.id = p_guest_id or (p_user_id is not null and g.user_id = p_user_id)) )",
    );
    expect(roll).toContain(
      "(select count(*)::integer from public.media m where m.event_id = p_event.id and m.created_at >= p_event.sealed_from and m.status <> 'removed' and m.guest_id in (select h.id from hers h))",
    );
    expect(roll).toContain(
      "(select coalesce(sum(c.taken), 0)::integer from public.camera_rolls c where c.sealed_from = p_event.sealed_from and c.guest_id in (select h.id from hers h));",
    );
  });

  it("★ the ledger counts each shot after it lands, in the same transaction and under the same locks", () => {
    const body = code("create_media");
    const insert = body.indexOf("insert into public.media (");
    const ledger = body.indexOf(
      "if v_event.capture = 'camera' then insert into public.camera_rolls as c (guest_id, sealed_from, taken) values (v_guest.id, v_event.sealed_from, 1) on conflict (guest_id, sealed_from) do update set taken = c.taken + 1; end if;",
    );
    expect(insert).toBeGreaterThan(-1);
    expect(ledger).toBeGreaterThan(insert);
    // Its only writer: no other body names it in a write.
    const writers =
      everything().match(
        /(insert into|update|delete from) public\.camera_rolls/g,
      ) ?? [];
    expect([...new Set(writers)]).toEqual(["insert into public.camera_rolls"]); // a file replacing create_media restates it
  });

  // ★ RESHAPED ON PURPOSE (trash-in-storage, 20261003220000; scar kept: a camera shot she withdraws purges tonight, and
  // a hold or a report still keeps it). The rule widened from the camera's shots to every guest's own withdrawal: her
  // Deleted counts in the host's storage now and a withdrawal is in none of the host's figures, so 30 days of it would
  // be storage nobody is counted for. Every other removal keeps its 30 days.
  it("★ a shot she withdraws purges tonight, a camera's or any album's; every other removal keeps its 30 days, and a hold or a report still keeps it", () => {
    const purge = code("set_media_purge_at");
    expect(purge).toContain(
      "if new.status = 'removed' then new.purge_at := coalesce(new.removed_at, now()) + interval '30 days'; if new.removed_by_uploader then new.purge_at := coalesce(new.removed_at, now()); end if; else new.purge_at := null; end if;",
    );
    // The purge's own guards are untouched by this lane.
    expect(latest("purge_media_rows").file).not.toBe(FILE);
    expect(latest("kept_media_ids").file).not.toBe(FILE);
  });

  // ★ RESHAPED ON PURPOSE (camera-clip, 20261004120000; scar kept: a camera video is bounded by its bytes and, where it
  // says one, its length, each refused in the words the guest wrapper routes by; reason dropped: the numbers typed in
  // the sentences and the grace folded into one literal). The sentences are formatted from the constants now, so the
  // check and its words are one literal; the constants' values are `roll.test.ts`'s, read beside the TypeScript ones.
  it("a camera video is bounded by its bytes and, where it says one, its length", () => {
    const body = code("create_media");
    expect(body).toContain(
      "if p_type = 'video' and p_file_size_bytes > c_camera_video_bytes then raise exception using message = format('This video exceeds the %s MB a camera shot can be.', c_camera_video_bytes / (1024 * 1024)), errcode = 'check_violation';",
    );
    expect(body).toContain(
      "if p_type = 'video' and p_duration_seconds > c_camera_video_seconds + c_camera_video_grace then raise exception using message = format('This video is longer than the %s seconds a camera shot can be.', c_camera_video_seconds), errcode = 'check_violation';",
    );
  });

  it.each(["create_media", "create_media_as_host"])(
    "%s seals a row to the develop time while it is ahead, whatever the capture, and says so",
    (name) => {
      const body = code(name);
      expect(body).toContain(
        "if v_event.develops_at > now() then v_sealed_until := v_event.develops_at; end if;",
      );
      expect(body).toContain(
        "return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);",
      );
    },
  );

  it("the host's own uploads are no roll's, no ceiling's and no camera video's", () => {
    const body = code("create_media_as_host");
    expect(body).not.toContain("guest_roll");
    expect(body).not.toContain("camera_rolls");
    expect(body).not.toContain("c_camera_video");
  });
});

describe("5. the reads, and who may call what", () => {
  it("get_event_by_qr_token answers develop_due, the develop time, the capture and the roll's size after the cap, unredacted", () => {
    // ★ Reshaped on purpose by event-dates (20261003120000), which carries this body verbatim and appends a range's
    // last day after the roll: the four still follow the host's cap, unredacted, and only the end comes after them.
    const { body, file } = latest("get_event_by_qr_token");
    expect(file).toBe("20261003120000_event_end_date.sql");
    expect(body).toContain(
      "max_upload_bytes bigint, develop_due boolean, develops_at timestamptz, capture text, roll_size integer, event_end_date date) language sql stable security definer set search_path to ''",
    );
    expect(body).toContain(
      "e.max_upload_bytes, public.seal_disagrees(e), e.develops_at, e.capture, e.roll_size, case when r.hide_meta then null else e.event_end_date end from public.events e",
    );
  });

  it.each(["get_upload_context", "get_upload_gate"])(
    "%s answers the roll, {used, cap, taken, ceiling}, null for free uploads",
    (name) => {
      expect(code(name)).toContain(
        "'roll', case when v_event.capture = 'camera' then jsonb_build_object( 'used', v_live, 'cap', v_event.roll_size, 'taken', v_taken, 'ceiling', v_event.roll_size * c_roll_retakes) end",
      );
    },
  );

  it("develop_due and its sweep are the service role's; the helpers the owner's alone; the trigger functions no client's", () => {
    const sql = fileSql();
    for (const fn of ["develop_due(uuid)", "develop_due_sweep(integer)"]) {
      expect(sql).toContain(
        `revoke all on function public.${fn} from public, anon, authenticated; grant execute on function public.${fn} to service_role;`,
      );
    }
    for (const fn of [
      "album_bits(public.media_status, boolean, public.media_status, boolean)",
      "album_doorbell(uuid)",
      "guest_roll(public.events, uuid, uuid)",
      "seal_disagrees(public.events)",
      "develop_rows(public.events, boolean)",
    ]) {
      expect(sql).toContain(
        `revoke all on function public.${fn} from public, anon, authenticated, service_role;`,
      );
    }
    for (const fn of ["events_reveal_stamp()", "events_develops_rewrite()"]) {
      expect(sql).toContain(
        `revoke all on function public.${fn} from public, anon, authenticated;`,
      );
    }
    expect(sql).toContain(
      "revoke execute on function public.set_media_purge_at() from public, anon, authenticated;",
    );
    expect(everything()).not.toMatch(
      /grant execute on function public\.(develop_due|develop_due_sweep|develop_rows|album_bits|album_doorbell|guest_roll|seal_disagrees|events_reveal_stamp|events_develops_rewrite)\([^)]*\) to [^;]*\b(anon|authenticated|public)\b/,
    );
  });

  it("★ the column grants are ADDITIVE (a table-level revoke would take every other column's grant with it)", () => {
    const sql = fileSql();
    expect(sql).toContain(
      "grant insert (capture, roll_size, develops_at), update (capture, roll_size, develops_at) on public.events to authenticated;",
    );
    expect(sql).toContain(
      "grant select (sealed_until) on public.media to authenticated;",
    );
    expect(sql).not.toMatch(
      /revoke [^;]* on (table )?public\.(events|media)\b/,
    );
    // sealed_from and sealed_until are no client's to write, and no anon's to read.
    expect(everything()).not.toMatch(
      /grant (insert|update)[^;]*\b(sealed_from|sealed_until)\b/,
    );
    expect(sql).not.toMatch(
      /grant [^;]*\b(sealed_from|sealed_until)\b[^;]* to [^;]*\banon\b/,
    );
  });

  it("★ the ledger is deny-all: RLS on, no policy, the service role's SELECT alone", () => {
    const sql = fileSql();
    expect(sql).toContain(
      "alter table public.camera_rolls enable row level security;",
    );
    expect(sql).toContain(
      "revoke all on table public.camera_rolls from public, anon, authenticated, service_role; grant select on table public.camera_rolls to service_role;",
    );
    expect(everything()).not.toMatch(
      /create policy [^;]* on public\.camera_rolls/,
    );
    expect(everything()).not.toMatch(
      /grant [^;]* on (table )?public\.camera_rolls to [^;]*\b(anon|authenticated)\b/,
    );
  });
});
