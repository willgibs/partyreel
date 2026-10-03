/**
 * THE PHONE-SIZE COPY'S SQL FACTS (lane `take-home-wiring`, 20261003110000), pinned LATEST-WINS across the whole
 * migration set the way `src/lib/db/migration-guards.test.ts` pins its own: each pin reads CODE (comments stripped,
 * whitespace collapsed), a body is its last definition and a grant its file's, so a later file that drops a clause
 * fails here. The lane's own file, beside the code it guards (`preview-size.ts`, the complete seam).
 *
 * What they hold:
 *   1. THE COLUMNS AND WHAT A ROW MAY HOLD: both or neither, a photograph's alone, its key its own, its bytes within
 *      4 MiB and half the original, and no client role holding either.
 *   2. THE WRITERS: `create_media*` take the pair LAST, defaulted (old callers land on the defaults), check it beside
 *      the preview key in one sentence both wrappers read as bad_key, and record it in the same insert.
 *   3. NEVER METERED: the ledger, `storage_used_bytes` and the caps read `p_file_size_bytes` alone.
 *   4. WHO MAY CALL THEM: the service role, the grants restated in the file that replaced them.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MAX_PHONE_BYTES } from "@/lib/media/preview-size";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const FILE = "20261003110000_phone_copy.sql";

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

const fileSql = () =>
  collapse(strip(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8")));
const everything = () =>
  files()
    .map(({ sql }) => collapse(strip(sql)))
    .join(" ");

const WRITERS = ["create_media", "create_media_as_host"] as const;

describe("1. the columns, and what a row may hold in them", () => {
  it("adds the pair, nullable, with no default", () => {
    expect(fileSql()).toContain(
      "alter table public.media add column phone_key text, add column phone_bytes bigint;",
    );
  });

  it("holds both or neither, a photograph's own key, and the two caps, on the row itself", () => {
    const sql = fileSql();
    expect(sql).toContain(
      "add constraint media_phone_copy_pair check ((phone_key is null) = (phone_bytes is null))",
    );
    expect(sql).toContain(
      "add constraint media_phone_copy_key check ( phone_key is null or (type = 'photo' and phone_key = 'events/' || event_id::text || '/photo/' || id::text || '/phone.jpg') )",
    );
    expect(sql).toContain(
      `add constraint media_phone_copy_bytes check ( phone_bytes is null or (phone_bytes > 0 and phone_bytes <= ${MAX_PHONE_BYTES} and phone_bytes * 2 <= file_size_bytes) )`,
    );
  });

  it("no client role is ever granted either column, and nothing drops a CHECK", () => {
    const sql = everything();
    expect(sql).not.toMatch(
      /grant [^;]*\(([^)]*\b(phone_key|phone_bytes)\b[^)]*)\) on public\.media/,
    );
    expect(sql).not.toMatch(/drop constraint (if exists )?media_phone_copy/);
  });
});

describe("2. the writers record it in the same insert, after their own check", () => {
  it.each(WRITERS)(
    "%s takes the pair last, both defaulted, so a caller without them lands on the defaults",
    (name) => {
      expect(latest(name).body).toContain(
        "p_reel_eligible boolean default true, p_phone_key text default null, p_phone_bytes bigint default null ) returns jsonb language plpgsql security definer set search_path = ''",
      );
    },
  );

  it.each(WRITERS)(
    "%s refuses half a pair, a clip's copy, a key not its own, and either cap, in one bad_key sentence",
    (name) => {
      const body = latest(name).body;
      expect(body).toContain(
        "if p_phone_key is not null or p_phone_bytes is not null then if p_phone_key is null or p_phone_bytes is null or p_type <> 'photo' or p_phone_key <> 'events/' || v_event.id::text || '/photo/' || p_media_id::text || '/phone.jpg' or p_phone_bytes <= 0 or p_phone_bytes > c_max_phone_bytes or p_phone_bytes * 2 > p_file_size_bytes then raise exception 'Phone copy does not belong to this upload.' using errcode = 'check_violation'; end if; end if;",
      );
      // The check sits beside the preview key's, before any lock or write.
      expect(
        body.indexOf("Preview key does not belong to this event."),
      ).toBeLessThan(
        body.indexOf("Phone copy does not belong to this upload."),
      );
      expect(
        body.indexOf("Phone copy does not belong to this upload."),
      ).toBeLessThan(body.indexOf("for update;"));
    },
  );

  it.each(WRITERS)("%s's ceiling mirrors MAX_PHONE_BYTES", (name) => {
    const m = latest(name).body.match(
      /c_max_phone_bytes constant bigint := (\d+)::bigint \* 1024 \* 1024;/,
    );
    expect(m, name).not.toBeNull();
    expect(Number(m![1]) * 1024 * 1024).toBe(MAX_PHONE_BYTES);
  });

  it.each(WRITERS)("%s writes the pair in its one insert, last", (name) => {
    const body = latest(name).body;
    expect(body).toContain(
      "status, reel_eligible, sealed_until, phone_key, phone_bytes ) values (",
    );
    expect(body).toContain(
      "coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes );",
    );
    expect(body.match(/insert into public\.media \(/g)).toHaveLength(1);
  });

  it("both wrappers read the sentence as bad_key", () => {
    for (const rel of [
      "src/lib/db/mutations/guest.ts",
      "src/lib/db/mutations/host-media.ts",
    ]) {
      const ts = collapse(readFileSync(join(ROOT, rel), "utf8"));
      expect(ts, rel).toContain(
        'if (m.includes("does not belong")) { return { ok: false, code: "bad_key",',
      );
    }
    // And the sentence carries no word an earlier branch reads first.
    const sentence = "phone copy does not belong to this upload.";
    for (const word of [
      "event is private",
      "verified email",
      "roll",
      "not accepting",
      "no longer exists",
    ]) {
      expect(sentence).not.toContain(word);
    }
  });
});

describe("3. never metered", () => {
  // ★ RESHAPED ON PURPOSE by upload-meter (20261003210500; scar kept: storage_used_bytes and the cap read the
  // original's bytes alone, and the copy's bytes reach no meter): the monthly ledger is no writer's here any more.
  // The presign's `meter_upload` counts the original's DECLARED bytes, and never a copy's, before any URL exists.
  it.each(WRITERS)(
    "%s meters the original alone: storage_used_bytes and the cap read p_file_size_bytes, the month is the presign's",
    (name) => {
      const body = latest(name).body;
      expect(body).toContain(
        "set storage_used_bytes = storage_used_bytes + p_file_size_bytes where id = v_event.host_id;",
      );
      expect(body).not.toContain("storage_ledger");
      expect(body).toContain(
        "if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then",
      );
      // The copy's bytes appear in its check and its insert, and nowhere a meter reads.
      const uses = body.match(/p_phone_bytes/g) ?? [];
      expect(uses).toHaveLength(7);
      expect(body).not.toMatch(/storage_used_bytes[^;]*p_phone_bytes/);
      expect(body).not.toMatch(/storage_ledger[^;]*p_phone_bytes/);
    },
  );

  it("the purge and the meters read no phone column", () => {
    for (const name of [
      "purge_media_rows",
      "host_active_bytes",
      "host_storage_summary",
    ]) {
      expect(latest(name).body, name).not.toMatch(/\bphone_(key|bytes)\b/);
    }
  });
});

describe("4. who may call them", () => {
  // ★ RESHAPED ON PURPOSE by upload-meter (20261003210500; scar kept: this file drops each old signature before it
  // creates the new, and the signature with the pair is the service role's alone): a later file replaces both bodies
  // in place, so the grants are read in whichever file wins, which must restate them, as every replace restates them.
  it("drops each old signature before creating the new one, in this file", () => {
    const sql = fileSql();
    const shapes = {
      create_media:
        "text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean",
      create_media_as_host:
        "uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean",
    };
    for (const [name, before] of Object.entries(shapes)) {
      const dropped = sql.indexOf(`drop function public.${name}(${before});`);
      expect(dropped, name).toBeGreaterThan(-1);
      expect(dropped).toBeLessThan(
        sql.indexOf(`create function public.${name}(`),
      );
      // The new signature: the old one, then the copy's two (`p_phone_key`, `p_phone_bytes`).
      const after = `${before}, text, bigint`;
      expect(sql).toContain(
        `revoke execute on function public.${name}(${after}) from public, anon, authenticated;`,
      );
      expect(sql).toContain(
        `grant execute on function public.${name}(${after}) to service_role;`,
      );
      const winner = collapse(
        strip(readFileSync(join(MIGRATIONS_DIR, latest(name).file), "utf8")),
      );
      expect(winner, latest(name).file).toContain(
        `revoke execute on function public.${name}(${after}) from public, anon, authenticated;`,
      );
      expect(winner, latest(name).file).toContain(
        `grant execute on function public.${name}(${after}) to service_role;`,
      );
      expect(everything()).not.toMatch(
        new RegExp(
          `grant execute on function public\\.${name}\\(${after.replace(/[()[\].]/g, "\\$&")}\\) to [^;]*\\b(?:anon|authenticated|public)\\b`,
        ),
      );
    }
  });
});
