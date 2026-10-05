/**
 * THE MIGRATION READER READS THE SET THE WAY THE DATABASE APPLIED IT (crumbs-77). `migrations.ts` is the one reader
 * the SQL guard tests stand on, so what it can get wrong is pinned here: what a statement is (a comment, a string and
 * a function body hold `create function` and `;` without being one), what one overload is (a name and its argument
 * types, in whatever spelling each file used), and that a drop takes exactly what it names. The last block runs it
 * over the real set and holds it to the files' own history: every file applied cleanly once, so a replay that
 * disagrees with that (a drop that finds nothing, a create over a function it holds live) is a reader bug.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  allMigrations,
  executableMigrations,
  executableSql,
  liveFunction,
  liveFunctions,
  MIGRATIONS_DIR,
  readMigrations,
  realReplay,
  replayFunctions,
  stripComments,
} from "@/lib/db/testing/migrations";

/** Files named `1.sql`, `2.sql`, ... in the order given. */
const files = (...sqls: string[]) =>
  sqls.map((sql, i) => ({ file: `${i + 1}.sql`, sql }));
const replay = (...sqls: string[]) => replayFunctions(files(...sqls));
/** What stands after the files, as `name(types)`, in the order each was last written. */
const standing = (...sqls: string[]) =>
  replay(...sqls).live.map((f) => `${f.name}(${f.types.join(",")})`);

const BODY = "returns jsonb language sql as $$ select 1 $$;";

describe("a function is its name and its argument types", () => {
  it("replaces on the same types and adds an overload on other ones", () => {
    const set = replay(
      `create function public.f(p_x int) ${BODY}`,
      `create or replace function public.f(p_x integer) returns jsonb language sql as $$ select 2 $$;`,
      `create function public.f(p_x int, p_y text) ${BODY}`,
    );
    expect(set.live.map((f) => [f.file, f.types])).toEqual([
      ["2.sql", ["integer"]],
      ["3.sql", ["integer", "text"]],
    ]);
    expect(set.live[0].raw).toContain("select 2");
  });

  it("a drop takes exactly the overload it names", () => {
    expect(
      standing(
        `create function public.f(p_x int) ${BODY} create function public.f(p_x int, p_y text) ${BODY}`,
        `drop function public.f(integer);`,
      ),
    ).toEqual(["f(integer,text)"]);
  });

  it.each([
    ["p_a int", "integer"],
    ["p_a int4", "integer"],
    ["p_a bool", "boolean"],
    ["p_a bigint default 5", "int8"],
    ["p_a int = 5", "int"],
    ["p_a timestamptz", "timestamp with time zone"],
    ["p_a timestamp with time zone default null", "timestamptz"],
    ["p_a double precision", "float8"],
    ["p_a numeric(10, 2)", "numeric"],
    ["p_a numeric (10,2)", "decimal"],
    ["p_a character varying(10)", "varchar"],
    ["p_a uuid[]", "uuid array"],
    ["p_a uuid []", "uuid[]"],
    ["p_a text[][]", "text[]"],
    ["p_a public.tier_type", "tier_type"],
    [`p_a "public"."tier_type"`, "public.tier_type"],
    ["in p_a int", "int"],
    ["p_a int, out p_b text", "int"],
    ["p_a int, variadic p_b text[]", "integer, text[]"],
  ])(
    "`%s` is the overload `drop function public.f(%s)` names",
    (made, named) => {
      expect(
        standing(
          `create function public.f(${made}) ${BODY}`,
          `drop function public.f(${named});`,
        ),
      ).toEqual([]);
    },
  );

  it("a drop that names other types takes nothing, and is said to have taken nothing", () => {
    const set = replay(
      `create function public.f(p_x int) ${BODY}`,
      `drop function public.f(text);`,
      `drop function if exists public.g(uuid);`,
    );
    expect(set.live).toHaveLength(1);
    expect(set.strayDrops.map((d) => [d.file, d.ifExists])).toEqual([
      ["2.sql", false],
      ["3.sql", true],
    ]);
  });

  it("a function dropped and made again stands again, from the later file", () => {
    const set = replay(
      `create function public.f() ${BODY}`,
      `drop function public.f();`,
      `create function public.f() ${BODY}`,
    );
    expect(set.live.map((f) => f.file)).toEqual(["3.sql"]);
    expect(set.drops).toEqual([{ name: "f", types: [], file: "2.sql" }]);
  });

  it("the order is the order each was last written in", () => {
    expect(
      standing(
        `create function public.a() ${BODY} create function public.b() ${BODY}`,
        `create or replace function public.a() ${BODY}`,
      ),
    ).toEqual(["b()", "a()"]);
  });

  it("a create over a function already standing, with no `or replace`, is a conflict the replay reports", () => {
    const set = replay(
      `create function public.f(p_x int) ${BODY}`,
      `create function public.f(p_x integer) ${BODY}`,
      `create function public.f(p_x text) ${BODY}`,
    );
    expect(set.conflicts).toEqual([
      { file: "2.sql", name: "f", types: ["integer"] },
    ]);
  });
});

describe("what a drop may say", () => {
  it("names several functions, with a cascade", () => {
    expect(
      standing(
        `create function public.a(p uuid) ${BODY} create function public.b() ${BODY} create function public.c() ${BODY}`,
        `drop function if exists public.a(uuid), public.b() cascade;`,
      ),
    ).toEqual(["c()"]);
  });

  it("names a function with no list: the one overload there is, and nothing when there are two", () => {
    expect(
      standing(`create function public.f() ${BODY}`, `drop function public.f;`),
    ).toEqual([]);
    const set = replay(
      `create function public.f() ${BODY} create function public.f(p int) ${BODY}`,
      `drop function public.f;`,
    );
    expect(set.live).toHaveLength(2);
    expect(set.strayDrops).toHaveLength(1);
  });

  it("names its arguments as a create does, with a mode and a name", () => {
    expect(
      standing(
        `create function public.f(p_x int, p_y text default 'a') ${BODY}`,
        `drop function public.f(p_x int, in p_y text);`,
      ),
    ).toEqual([]);
  });
});

describe("whose function it is", () => {
  it("reads a bare name and a quoted one as public, and leaves every other schema alone", () => {
    expect(
      standing(
        `create function a() ${BODY} create function "b"() ${BODY} create function private.c() ${BODY} create function "public"."d"() ${BODY}`,
        `drop function private.c();`,
      ),
    ).toEqual(["a()", "b()", "d()"]);
  });

  it("does not read a drop of another schema's function as a drop of ours", () => {
    expect(
      standing(
        `create function public.f() ${BODY}`,
        `drop function private.f();`,
      ),
    ).toEqual(["f()"]);
  });
});

describe("what is no statement", () => {
  it("a create or a drop in a comment, a string or a body is neither", () => {
    expect(
      standing(
        `-- create function public.a() ${BODY}\n` +
          `/* create function public.b() ${BODY}\n   /* nested */ create function public.c() ${BODY} */\n` +
          `select 'create function public.d() ${BODY}';\n` +
          `do $do$ begin execute 'create function public.e() ${BODY}'; end $do$;\n` +
          `create function public.kept() ${BODY}`,
        `-- drop function public.kept();\n/* drop function public.kept(); */ select 'drop function public.kept();';`,
      ),
    ).toEqual(["kept()"]);
  });

  it("a `;` in a string or a default does not split a statement, and a `--` in a string is no comment", () => {
    const set = replay(
      `create function public.f(p_a text default 'x;y', p_b int default 1) returns text language sql as $$ select '--' $$;\n` +
        `select '--'; create function public.g(p_c text default '--') ${BODY}`,
    );
    expect(set.live.map((f) => f.name)).toEqual(["f", "g"]);
    expect(set.live[0].types).toEqual(["text", "integer"]);
  });

  it("an escaped quote stays inside its string", () => {
    expect(
      standing(
        `select 'it''s; create function public.no() ${BODY}'; create function public.yes() ${BODY}`,
      ),
    ).toEqual(["yes()"]);
  });

  it("a `$1` is a parameter and not a body, and a tag nests inside another", () => {
    expect(
      standing(
        `prepare p as select $1; create function public.f() returns text language sql as $a$ select $b$ $$ $b$ $a$;`,
      ),
    ).toEqual(["f()"]);
  });

  it("says which file and line an unclosed string, name, comment or body is in", () => {
    for (const [sql, what] of [
      [`select 1;\nselect 'open`, /^2\.sql: the string opened at line 2/],
      [`select "open`, /quoted name opened at line 1/],
      [`select 1;\n\n/* open /* nested */`, /block comment opened at line 3/],
      [
        `select 1;\ncreate function public.f() ${BODY.replace("$$ select 1 $$", "$q$ select 1")}`,
        /\$q\$ body opened at line 2/,
      ],
    ] as const) {
      expect(() => replay("-- fine\n", sql)).toThrow(what);
    }
    // The file's own name is the one thrown.
    expect(() => replay("-- fine", "select 'open")).toThrow(/^2\.sql: /);
  });
});

describe("what a definition says", () => {
  const set = replay(
    [
      "-- the first line, a quote ' that is only a comment",
      "create or replace function public.page(",
      "  p_event uuid,   -- the album",
      "  p_before timestamptz default null,",
      "  p_limit integer default null /* the page */",
      ")",
      "returns table(",
      "  id uuid,",
      "  created_at timestamptz",
      ")",
      "language sql",
      "stable",
      "as $$",
      "  select 1 -- a body comment",
      "  /* and another */;",
      "$$;",
      "",
      "revoke all on function public.page(uuid, timestamptz, integer) from public;",
    ].join("\n"),
  );
  const page = set.live[0];

  it("keeps the statement as written, its comments too, and the file around it", () => {
    expect(page.raw.startsWith("create or replace function public.page(")).toBe(
      true,
    );
    expect(page.raw.endsWith("$$;")).toBe(true);
    expect(page.raw).toContain("-- a body comment");
    expect(page.fileSql).toContain("revoke all on function public.page");
  });

  it("reads it as code: no comment anywhere, whitespace collapsed", () => {
    expect(page.code).toBe(
      "create or replace function public.page( p_event uuid, p_before timestamptz default null, p_limit integer default null ) returns table( id uuid, created_at timestamptz ) language sql stable as $$ select 1 ; $$;",
    );
    expect(page.params).toBe(
      "p_event uuid, p_before timestamptz default null, p_limit integer default null",
    );
  });

  it("says what it returns", () => {
    expect(page.returns).toBe("table( id uuid, created_at timestamptz )");
    const returns = (clause: string) =>
      replay(`create function public.f() returns ${clause} as $$ $$;`).live[0]
        .returns;
    expect(returns("jsonb language plpgsql")).toBe("jsonb");
    expect(returns("setof uuid language sql")).toBe("setof uuid");
    expect(returns("table (a int, b text) language sql")).toBe(
      "table (a int, b text)",
    );
    expect(returns("trigger language plpgsql")).toBe("trigger");
    expect(returns("double precision immutable")).toBe("double precision");
  });
});

describe("the comment stripper", () => {
  it("blanks line and block comments, never a `--` in a string, and keeps every offset and line", () => {
    const sql = "a -- b\n'--' /* c\nd */ e";
    const stripped = stripComments(sql);
    expect(stripped).toHaveLength(sql.length);
    expect(stripped.split("\n")).toHaveLength(3);
    expect(executableSql(sql)).toBe("a '--' e");
  });

  it("keeps an escaped quote in its string and a doubled double quote in its name", () => {
    expect(
      executableSql(`select 'it''s -- kept', "a""--b" -- gone`).trim(),
    ).toBe(`select 'it''s -- kept', "a""--b"`);
  });

  it("reads a function body's comments as comments too", () => {
    expect(
      executableSql("create function f() as $$ select 1; -- gone\n$$;"),
    ).toBe("create function f() as $$ select 1; $$;");
  });

  it("falls back to `--` to the end of the line for a body that is no SQL", () => {
    expect(
      executableSql("comment on table t is $$ it's -- gone\nkept $$;"),
    ).toBe("comment on table t is $$ it's kept $$;");
  });
});

describe("the real set", () => {
  const real = realReplay();

  it("is read in the order the database applied it, the three recovered files among them", () => {
    const names = readMigrations().map((m) => m.file);
    expect(names.length).toBeGreaterThan(150);
    expect(names).toEqual([...names].sort());
    expect(names.every((n) => /^\d{14}_[a-z0-9_]+\.sql$/.test(n))).toBe(true);
    for (const recovered of RECOVERED) expect(names).toContain(recovered.file);
    expect(allMigrations()).toContain("create function public.tier_limits(");
    expect(executableMigrations()).toHaveLength(names.length);
  });

  it("replays the way the files say it went: every strict drop took a function, no create met one it held", () => {
    expect(real.conflicts).toEqual([]);
    // An `if exists` drop that finds nothing is harmless, and the two here are known: the legacy upsert_reel_config
    // overload, dropped by its own file (20260703002403) and again, as belt and braces, by the file that restates it.
    expect(
      real.strayDrops.filter((d) => !d.ifExists),
      "a drop without `if exists` found no function: the replay and the database disagree",
    ).toEqual([]);
    expect(
      real.strayDrops.map((d) => d.file),
      "an `if exists` drop found nothing: harmless, but say why here",
    ).toEqual([
      "20260707120000_reel_caps_ingress_multiplier.sql",
      "20260708022629_reel_caps_ingress_multiplier_parity_reapply.sql",
    ]);
    expect(
      real.live.length,
      "the scan found too few functions",
    ).toBeGreaterThan(100);
    expect(real.drops.length).toBeGreaterThan(50);
  });

  it("leaves each name one function: the guards read a name's winning definition", () => {
    const seen = new Set<string>();
    const twice = real.live
      .filter((f) => seen.size === seen.add(f.name).size)
      .map((f) => `${f.name}(${f.types.join(", ")})`);
    expect(twice, "two overloads of one name are live").toEqual([]);
  });

  it("knows what the set drops: a dropped function is not live, and says which file took it", () => {
    for (const gone of [
      "get_saved_events",
      "save_event",
      "get_event_reel_by_qr_token",
      "upsert_reel_config",
    ]) {
      expect(
        liveFunctions().some((f) => f.name === gone),
        gone,
      ).toBe(false);
    }
    expect(() => liveFunction("get_saved_events")).toThrow(
      /20260923130000_drop_saves\.sql drops it/,
    );
    expect(() => liveFunction("not_a_function")).toThrow(/defined nowhere/);
  });

  it("answers a name with the last file that wrote it, and with its whole file for the grants", () => {
    const tierLimits = liveFunction("tier_limits");
    expect(tierLimits.file).toBe("20261004100000_ladder_a.sql");
    expect(tierLimits.fileSql).toContain("create function public.tier_limits(");
    expect(tierLimits.types).toEqual(["tier_type"]);
    expect(
      liveFunction("create_media").file >= "20261003110000_phone_copy.sql",
    ).toBe(true);
  });
});

/**
 * The three migrations that were applied through the Supabase MCP and never committed, recovered from the ledger
 * (`supabase_migrations.schema_migrations`, `statements[1]`) as the file their recorded version and name make. The
 * ledger holds each as one statement with no trailing newline, so a byte for byte file has none either: an editor
 * that adds one, or a formatter, makes it a different file from the one that was applied. `md5` is the ledger's
 * `md5(statements[1])`.
 */
const RECOVERED = [
  {
    file: "20260702213427_reel_style_catalog.sql",
    bytes: 3127,
    md5: "ac0a02f5fd19fa040d0d4689134c8710",
  },
  {
    file: "20260703002403_reel_style_catalog_drop_legacy_overload.sql",
    bytes: 380,
    md5: "a22d5ac5ad80dd0f7b6862a8dfb50b20",
  },
  {
    file: "20260708022629_reel_caps_ingress_multiplier_parity_reapply.sql",
    bytes: 21095,
    md5: "e2e0b086d21835ce60f282abc317c739",
  },
];

describe("the recovered migrations", () => {
  it.each(RECOVERED)(
    "$file is the file the ledger holds, byte for byte",
    ({ file, bytes, md5 }) => {
      const text = readFileSync(join(MIGRATIONS_DIR, file));
      expect(text.length).toBe(bytes);
      expect(createHash("md5").update(text).digest("hex")).toBe(md5);
    },
  );
});
