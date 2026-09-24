/**
 * AN IN-MEMORY POSTGREST THAT CLAMPS AT 1,000, exactly as the platform does (the 1,000-row round,
 * 2026-09-23). Test support only: nothing under `src/app` or `src/components` may import it.
 *
 * WHY IT EXISTS: a hand-rolled builder stub answers whatever the test hands it, so a read that
 * PostgREST would cut at 1,000 rows passes its test with 2,500. This fake keeps the platform's two
 * silent failures in the loop:
 *
 *  - EVERY READ IS CLAMPED AT `MAX_ROWS`, a table read and a set-returning RPC alike, whatever
 *    `.limit()` asked for and with no error, the way PostgREST answers. A 2,500-row fixture read
 *    back whole proves the code pages; a read that comes back with 1,000 proves it does not.
 *    WRITES ARE NOT CLAMPED (measured live: a PATCH returning 1,040 rows returned all 1,040).
 *  - A REQUEST WHOSE URL PASSES `urlLengthLimit` (default 8,000 characters, postgrest-js's own
 *    `urlLengthLimit`) never runs: it resolves the way postgrest-js resolves a failed fetch
 *    (`error.message` "TypeError: fetch failed", `status` 0, no data). The URL is built the way
 *    postgrest-js builds it (`URLSearchParams`, the deduped and quoted `in.(...)` list), so an
 *    unchunked `.in("id", ids)` fails here where it would fail live, and a chunked one passes.
 *
 * It records every request (`fake.requests`: the table or function, the method, the filters, the
 * limit and offset, the URL and its length, whether it failed, how many rows it returned), so a
 * test proves completeness and chunking in one fixture.
 *
 * WHAT IT SPEAKS. Tables: `select(columns, { count, head })`, `insert`, `upsert` (`onConflict`,
 * `ignoreDuplicates`), `update`, `delete`, and a trailing `.select()` for the written rows. Filters:
 * `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `is`, `not(col, op, value)`,
 * `filter(col, "not.is", null)`, `match`, and `or` with nested `and()`/`or()` (the composite cursor
 * `created_at.lt.<c>,and(created_at.eq.<c>,id.lt.<id>)` included; a malformed tree answers
 * PostgREST's PGRST100). Modifiers: multi-column `order` (ascending, `nullsFirst`, Postgres's
 * default nulls placement otherwise), `limit`, `range`, `single`, `maybeSingle`, `throwOnError`.
 * `rpc(name, args)` answers from a registered handler: an array is a set of rows (filtered,
 * ordered and clamped like a table), anything else a scalar. Comparisons follow SQL's three-valued
 * logic, so `.neq("status", "removed")` drops a NULL status the way Postgres does.
 *
 * FIXTURE RULES. A row is a plain object. An embedded resource (`guests!media_guest_id_fkey(...)`,
 * `events!inner(host_id)`) is read from the row's property of that relation's name, whole; a
 * dotted filter (`events.host_id`) reads a to-one embed; `!inner` drops a row whose embed is null.
 * Values compare as JavaScript values, strings by code unit, so timestamps in a fixture share ONE
 * format: the raw string Postgres returns (`2026-09-23T12:00:00.123456+00:00`), never a `Date`.
 *
 *     const fake = createFakePostgrest({ tables: { media: album(2500) } });
 *     vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => asSupabase(fake) }));
 *     // ...the code under test reads the album...
 *     expect(rows).toHaveLength(2500);
 *     expect(fake.requests.every((r) => !r.failed)).toBe(true);
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { MAX_ROWS } from "@/lib/db/read-all";
import type { Database } from "@/lib/db/types";

/** A row: a plain object, embeds held whole under their relation's name. */
export type FakeRow = Record<string, unknown>;

/** The error a PostgREST response carries: a plain object, never an `Error` (as the real one). */
export type FakePostgrestError = {
  message: string;
  details: string;
  hint: string;
  code: string;
};

/** What every request resolves to, the shape postgrest-js resolves. */
export type FakeResponse = {
  data: unknown;
  error: FakePostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
};

/** A filter as the fake recorded it: the column, the operator (`not.` when negated), the value. */
export type FakeFilter = { column: string; op: string; value: unknown };

/** One request, as the fake recorded it. */
export type FakeRequest = {
  target: "table" | "rpc";
  name: string;
  method: "GET" | "HEAD" | "POST" | "PATCH" | "DELETE";
  filters: FakeFilter[];
  limit: number | null;
  offset: number | null;
  url: string;
  urlLength: number;
  /** The URL passed `urlLengthLimit`, so the request resolved as a failed fetch and never ran. */
  failed: boolean;
  /** How many rows it answered with: 0 for a head, a failure, an error or a scalar. */
  returned: number;
};

/** A registered function: an array is a set of rows, anything else one scalar answer. */
export type FakeRpcHandler = (args: Record<string, unknown>) => unknown;

/** Thrown by a handler to answer a PostgREST error with a code (`P0001` for a raise, say). */
export class FakeRpcError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FakeRpcError";
  }
}

export type FakePostgrestOptions = {
  tables?: Record<string, FakeRow[]>;
  rpc?: Record<string, FakeRpcHandler>;
  /** The URL length past which a request fails as a fetch would. Default 8,000. */
  urlLengthLimit?: number;
  /** Where the URL length is measured from. Default this project's REST origin. */
  baseUrl?: string;
  /** Who `auth.getUser()` answers with. Default nobody. */
  user?: { id: string; email?: string } | null;
};

export type FakePostgrest = {
  from(table: string): FakeTable;
  rpc(
    fn: string,
    args?: Record<string, unknown>,
    options?: { head?: boolean; get?: boolean; count?: string },
  ): FakeQuery;
  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email?: string } | null };
      error: null;
    }>;
  };
  /** The live tables: seed them, and read what a write left. */
  tables: Record<string, FakeRow[]>;
  /** The registered functions. */
  functions: Record<string, FakeRpcHandler>;
  /** Every request, in order. */
  requests: FakeRequest[];
  user: { id: string; email?: string } | null;
};

const DEFAULT_URL_LENGTH_LIMIT = 8000;
const DEFAULT_BASE_URL = "https://ddafaemglzmuekbtjwzn.supabase.co";

/** Build the fake. Its tables are the object passed in, so a test can seed and inspect them. */
export function createFakePostgrest(
  options: FakePostgrestOptions = {},
): FakePostgrest {
  const fake: FakePostgrest = {
    tables: options.tables ?? {},
    functions: options.rpc ?? {},
    requests: [],
    user: options.user ?? null,
    from: (table) => new FakeTable(context, table),
    rpc: (fn, args = {}, rpcOptions = {}) => {
      const method = rpcOptions.head ? "HEAD" : rpcOptions.get ? "GET" : "POST";
      const url = new URL(`${context.baseUrl}/rest/v1/rpc/${fn}`);
      if (method !== "POST") {
        for (const [name, value] of Object.entries(args)) {
          if (value === undefined) continue;
          url.searchParams.append(
            name,
            Array.isArray(value) ? `{${value.join(",")}}` : `${value}`,
          );
        }
      }
      return new FakeQuery(context, {
        target: "rpc",
        name: fn,
        method,
        url,
        count: rpcOptions.count ?? null,
        head: Boolean(rpcOptions.head),
        args,
      });
    },
    auth: {
      getUser: async () => ({ data: { user: fake.user }, error: null }),
    },
  };
  const context: FakeContext = {
    fake,
    urlLengthLimit: options.urlLengthLimit ?? DEFAULT_URL_LENGTH_LIMIT,
    baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, ""),
  };
  return fake;
}

/**
 * The one cast: the fake, typed as the client the code under test expects. Everything the code
 * calls is answered at runtime by the fake; anything it does not speak throws a TypeError naming
 * the method, which is the signal to teach it one more word.
 */
export function asSupabase(fake: FakePostgrest): SupabaseClient<Database> {
  return fake as unknown as SupabaseClient<Database>;
}

/* ─────────────────────────────── internals ─────────────────────────────── */

type FakeContext = {
  fake: FakePostgrest;
  urlLengthLimit: number;
  baseUrl: string;
};

type Op =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "in"
  | "is";
const OPS = new Set<string>([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "in",
  "is",
]);

/** A filter the fake can evaluate: one comparison, or an and/or group of them. */
type Condition =
  | { kind: "cmp"; column: string; op: Op; value: unknown; negate: boolean }
  | { kind: "group"; mode: "and" | "or"; negate: boolean; terms: Condition[] };

type Mutation =
  | { type: "insert"; values: FakeRow[] }
  | {
      type: "upsert";
      values: FakeRow[];
      onConflict: string[];
      ignoreDuplicates: boolean;
    }
  | { type: "update"; values: FakeRow }
  | { type: "delete" };

type QueryInit = {
  target: "table" | "rpc";
  name: string;
  method: FakeRequest["method"];
  url: URL;
  count: string | null;
  head: boolean;
  columns?: string | null;
  mutation?: Mutation;
  args?: Record<string, unknown>;
};

class FakeTable {
  constructor(
    private readonly context: FakeContext,
    private readonly table: string,
  ) {}

  private url(): URL {
    return new URL(`${this.context.baseUrl}/rest/v1/${this.table}`);
  }

  select(
    columns = "*",
    options: { count?: string; head?: boolean } = {},
  ): FakeQuery {
    const url = this.url();
    url.searchParams.set("select", stripWhitespace(columns));
    return new FakeQuery(this.context, {
      target: "table",
      name: this.table,
      method: options.head ? "HEAD" : "GET",
      url,
      count: options.count ?? null,
      head: Boolean(options.head),
      columns,
    });
  }

  insert(
    values: FakeRow | FakeRow[],
    options: { count?: string } = {},
  ): FakeQuery {
    return this.write(
      "POST",
      { type: "insert", values: rowsOf(values) },
      options.count,
    );
  }

  upsert(
    values: FakeRow | FakeRow[],
    options: {
      onConflict?: string;
      ignoreDuplicates?: boolean;
      count?: string;
    } = {},
  ): FakeQuery {
    const query = this.write(
      "POST",
      {
        type: "upsert",
        values: rowsOf(values),
        onConflict: (options.onConflict ?? "id")
          .split(",")
          .map((c) => c.trim()),
        ignoreDuplicates: Boolean(options.ignoreDuplicates),
      },
      options.count,
    );
    return query;
  }

  update(values: FakeRow, options: { count?: string } = {}): FakeQuery {
    return this.write("PATCH", { type: "update", values }, options.count);
  }

  delete(options: { count?: string } = {}): FakeQuery {
    return this.write("DELETE", { type: "delete" }, options.count);
  }

  private write(
    method: FakeRequest["method"],
    mutation: Mutation,
    count?: string,
  ): FakeQuery {
    return new FakeQuery(this.context, {
      target: "table",
      name: this.table,
      method,
      url: this.url(),
      count: count ?? null,
      head: false,
      columns: null,
      mutation,
    });
  }
}

/** The builder: every method mutates it in place and returns it, as postgrest-js's builders do. */
class FakeQuery implements PromiseLike<FakeResponse> {
  private readonly conditions: Condition[] = [];
  private readonly recorded: FakeFilter[] = [];
  private readonly orders: {
    column: string;
    ascending: boolean;
    nullsFirst?: boolean;
  }[] = [];
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private shape: "many" | "single" | "maybe" = "many";
  private returning = false;
  private rejectOnError = false;
  private parseError: FakePostgrestError | null = null;
  private columns: string | null;

  constructor(
    private readonly context: FakeContext,
    private readonly init: QueryInit,
  ) {
    this.columns = init.columns ?? null;
  }

  /* ── filters ── */

  eq(column: string, value: unknown): this {
    return this.compare(column, "eq", value);
  }
  neq(column: string, value: unknown): this {
    return this.compare(column, "neq", value);
  }
  gt(column: string, value: unknown): this {
    return this.compare(column, "gt", value);
  }
  gte(column: string, value: unknown): this {
    return this.compare(column, "gte", value);
  }
  lt(column: string, value: unknown): this {
    return this.compare(column, "lt", value);
  }
  lte(column: string, value: unknown): this {
    return this.compare(column, "lte", value);
  }
  like(column: string, pattern: string): this {
    return this.compare(column, "like", pattern);
  }
  ilike(column: string, pattern: string): this {
    return this.compare(column, "ilike", pattern);
  }
  is(column: string, value: null | boolean): this {
    return this.compare(column, "is", value);
  }

  in(column: string, values: readonly unknown[]): this {
    const unique = Array.from(new Set(values));
    this.init.url.searchParams.append(column, `in.(${inList(unique)})`);
    this.recorded.push({ column, op: "in", value: unique });
    this.conditions.push({
      kind: "cmp",
      column,
      op: "in",
      value: unique,
      negate: false,
    });
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    this.init.url.searchParams.append(column, `not.${operator}.${value}`);
    this.recorded.push({ column, op: `not.${operator}`, value });
    this.pushParsed(column, operator, value, true);
    return this;
  }

  filter(column: string, operator: string, value: unknown): this {
    this.init.url.searchParams.append(column, `${operator}.${value}`);
    this.recorded.push({ column, op: operator, value });
    const negate = operator.startsWith("not.");
    this.pushParsed(
      column,
      negate ? operator.slice(4) : operator,
      value,
      negate,
    );
    return this;
  }

  match(query: Record<string, unknown>): this {
    for (const [column, value] of Object.entries(query)) this.eq(column, value);
    return this;
  }

  or(
    filters: string,
    options: { referencedTable?: string; foreignTable?: string } = {},
  ): this {
    const referenced = options.referencedTable ?? options.foreignTable;
    this.init.url.searchParams.append(
      referenced ? `${referenced}.or` : "or",
      `(${filters})`,
    );
    this.recorded.push({
      column: referenced ? `${referenced}.or` : "or",
      op: "or",
      value: filters,
    });
    if (referenced) return this;
    const tree = parseLogicTree(filters);
    if (tree === null) {
      this.parseError = {
        code: "PGRST100",
        message: `"failed to parse logic tree ((${filters}))" (line 1, column 1)`,
        details: "unexpected input",
        hint: "",
      };
    } else {
      this.conditions.push({
        kind: "group",
        mode: "or",
        negate: false,
        terms: tree,
      });
    }
    return this;
  }

  /* ── modifiers ── */

  select(columns = "*"): this {
    this.columns = columns;
    this.returning = true;
    this.init.url.searchParams.set("select", stripWhitespace(columns));
    return this;
  }

  order(
    column: string,
    options: {
      ascending?: boolean;
      nullsFirst?: boolean;
      referencedTable?: string;
      foreignTable?: string;
    } = {},
  ): this {
    const { ascending = true, nullsFirst } = options;
    const referenced = options.referencedTable ?? options.foreignTable;
    const key = referenced ? `${referenced}.order` : "order";
    const existing = this.init.url.searchParams.get(key);
    const nulls =
      nullsFirst === undefined ? "" : nullsFirst ? ".nullsfirst" : ".nullslast";
    this.init.url.searchParams.set(
      key,
      `${existing ? `${existing},` : ""}${column}.${ascending ? "asc" : "desc"}${nulls}`,
    );
    if (!referenced) this.orders.push({ column, ascending, nullsFirst });
    return this;
  }

  limit(
    count: number,
    options: { referencedTable?: string; foreignTable?: string } = {},
  ): this {
    const referenced = options.referencedTable ?? options.foreignTable;
    this.init.url.searchParams.set(
      referenced ? `${referenced}.limit` : "limit",
      `${count}`,
    );
    if (!referenced) this.limitCount = count;
    return this;
  }

  range(
    from: number,
    to: number,
    options: { referencedTable?: string; foreignTable?: string } = {},
  ): this {
    const referenced = options.referencedTable ?? options.foreignTable;
    this.init.url.searchParams.set(
      referenced ? `${referenced}.offset` : "offset",
      `${from}`,
    );
    this.init.url.searchParams.set(
      referenced ? `${referenced}.limit` : "limit",
      `${to - from + 1}`,
    );
    if (!referenced) {
      this.offsetCount = from;
      this.limitCount = to - from + 1;
    }
    return this;
  }

  single(): this {
    this.shape = "single";
    return this;
  }

  maybeSingle(): this {
    this.shape = "maybe";
    return this;
  }

  throwOnError(): this {
    this.rejectOnError = true;
    return this;
  }

  /** Type-level only in postgrest-js; nothing to do here. */
  returns(): this {
    return this;
  }
  overrideTypes(): this {
    return this;
  }
  abortSignal(): this {
    return this;
  }

  then<A = FakeResponse, B = never>(
    onfulfilled?: ((value: FakeResponse) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return new Promise<FakeResponse>((resolve, reject) => {
      const response = this.run();
      if (this.rejectOnError && response.error) {
        reject(
          Object.assign(new Error(response.error.message), response.error),
        );
      } else {
        resolve(response);
      }
    }).then(onfulfilled, onrejected);
  }

  /* ── execution ── */

  private compare(column: string, op: Op, value: unknown): this {
    this.init.url.searchParams.append(column, `${op}.${value}`);
    this.recorded.push({ column, op, value });
    this.conditions.push({ kind: "cmp", column, op, value, negate: false });
    return this;
  }

  /** A `not()` / `filter()` operator with its URL-string value, as PostgREST would read it. */
  private pushParsed(
    column: string,
    operator: string,
    value: unknown,
    negate: boolean,
  ): void {
    if (!OPS.has(operator)) {
      this.parseError = {
        code: "PGRST100",
        message: `"failed to parse filter (${operator}.${value})" (line 1, column 1)`,
        details: "unexpected operator",
        hint: "",
      };
      return;
    }
    const parsed =
      operator === "in"
        ? Array.isArray(value)
          ? value
          : parseInValue(String(value))
        : operator === "is"
          ? isValue(value)
          : value;
    this.conditions.push({
      kind: "cmp",
      column,
      op: operator as Op,
      value: parsed,
      negate,
    });
  }

  private run(): FakeResponse {
    const url = this.init.url.toString();
    const request: FakeRequest = {
      target: this.init.target,
      name: this.init.name,
      method: this.init.method,
      filters: [...this.recorded],
      limit: this.limitCount,
      offset: this.offsetCount,
      url,
      urlLength: url.length,
      failed: url.length > this.context.urlLengthLimit,
      returned: 0,
    };
    this.context.fake.requests.push(request);
    if (request.failed)
      return failedFetch(url.length, this.context.urlLengthLimit);
    if (this.parseError) return failure(this.parseError, 400, "Bad Request");

    let rows: FakeRow[] | null;
    let scalar: unknown = undefined;
    if (this.init.target === "rpc") {
      const handler = this.context.fake.functions[this.init.name];
      if (!handler) {
        return failure(
          {
            code: "PGRST202",
            message: `Could not find the function public.${this.init.name} in the schema cache`,
            details: "",
            hint: "",
          },
          404,
          "Not Found",
        );
      }
      try {
        const answer = handler(this.init.args ?? {});
        rows = Array.isArray(answer) ? (answer as FakeRow[]) : null;
        if (rows === null) scalar = answer;
      } catch (error) {
        return failure(
          {
            code: error instanceof FakeRpcError ? error.code : "P0001",
            message: error instanceof Error ? error.message : String(error),
            details: "",
            hint: "",
          },
          400,
          "Bad Request",
        );
      }
    } else {
      const table = this.context.fake.tables[this.init.name];
      if (!table) {
        return failure(
          {
            code: "PGRST205",
            message: `Could not find the table 'public.${this.init.name}' in the schema cache`,
            details: "",
            hint: "",
          },
          404,
          "Not Found",
        );
      }
      if (this.init.mutation)
        return this.write(table, this.init.mutation, request);
      rows = table;
    }

    if (rows === null)
      return {
        data: scalar,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      };

    const items = parseSelect(this.columns ?? "*");
    const matching = rows.filter((row) => this.keeps(row, items));
    const count = this.init.count ? matching.length : null;
    const ordered =
      this.orders.length > 0
        ? [...matching].sort((a, b) => this.byOrder(a, b))
        : matching;
    const start = this.offsetCount ?? 0;
    // ★ THE CLAMP: PostgREST answers at most max_rows rows, whatever the limit asked for.
    const take = Math.min(this.limitCount ?? MAX_ROWS, MAX_ROWS);
    const page = ordered
      .slice(start, start + take)
      .map((row) => project(row, items));
    if (this.init.head)
      return { data: null, error: null, count, status: 200, statusText: "OK" };
    return this.shaped(page, count, request);
  }

  private write(
    table: FakeRow[],
    mutation: Mutation,
    request: FakeRequest,
  ): FakeResponse {
    const affected: FakeRow[] = [];
    if (mutation.type === "insert") {
      for (const value of mutation.values) {
        const row = { ...value };
        table.push(row);
        affected.push(row);
      }
    } else if (mutation.type === "upsert") {
      for (const value of mutation.values) {
        const existing = table.find((row) =>
          mutation.onConflict.every((column) => row[column] === value[column]),
        );
        if (existing) {
          if (mutation.ignoreDuplicates) continue;
          Object.assign(existing, value);
          affected.push(existing);
        } else {
          const row = { ...value };
          table.push(row);
          affected.push(row);
        }
      }
    } else {
      const items = parseSelect("*");
      const hits = table.filter((row) => this.keeps(row, items));
      if (mutation.type === "update") {
        for (const row of hits) Object.assign(row, mutation.values);
      } else {
        for (const row of hits) table.splice(table.indexOf(row), 1);
      }
      affected.push(...hits);
    }
    const count = this.init.count ? affected.length : null;
    const created = mutation.type === "insert" || mutation.type === "upsert";
    if (!this.returning) {
      return {
        data: null,
        error: null,
        count,
        status: created ? 201 : 204,
        statusText: created ? "Created" : "No Content",
      };
    }
    // Writes are NOT clamped: every written row comes back, as it does live.
    const items = parseSelect(this.columns ?? "*");
    return this.shaped(
      affected.map((row) => project(row, items)),
      count,
      request,
      created ? 201 : 200,
    );
  }

  private shaped(
    rows: FakeRow[],
    count: number | null,
    request: FakeRequest,
    status = 200,
  ): FakeResponse {
    if (this.shape === "many") {
      request.returned = rows.length;
      return {
        data: rows,
        error: null,
        count,
        status,
        statusText: status === 201 ? "Created" : "OK",
      };
    }
    if (rows.length === 1) {
      request.returned = 1;
      return { data: rows[0], error: null, count, status, statusText: "OK" };
    }
    if (rows.length === 0 && this.shape === "maybe") {
      return { data: null, error: null, count, status, statusText: "OK" };
    }
    return failure(
      {
        code: "PGRST116",
        message: "JSON object requested, multiple (or no) rows returned",
        details: `The result contains ${rows.length} rows`,
        hint: "",
      },
      406,
      "Not Acceptable",
    );
  }

  /** Does a row survive the `!inner` embeds and every filter? SQL's NULL is not a match. */
  private keeps(row: FakeRow, items: SelectItem[]): boolean {
    for (const item of items) {
      if (item === "*" || !item.inner) continue;
      const embed = row[item.source] ?? row[item.key];
      if (
        embed === null ||
        embed === undefined ||
        (Array.isArray(embed) && embed.length === 0)
      )
        return false;
    }
    return this.conditions.every(
      (condition) => evaluate(condition, row) === true,
    );
  }

  private byOrder(a: FakeRow, b: FakeRow): number {
    for (const { column, ascending, nullsFirst } of this.orders) {
      const va = valueAt(a, column);
      const vb = valueAt(b, column);
      const aNull = va === null || va === undefined;
      const bNull = vb === null || vb === undefined;
      if (aNull && bNull) continue;
      // Postgres: ASC puts nulls last, DESC puts them first, unless told otherwise.
      const first = nullsFirst ?? !ascending;
      if (aNull) return first ? -1 : 1;
      if (bNull) return first ? 1 : -1;
      const order = compareValues(va, vb);
      if (order !== 0) return ascending ? order : -order;
    }
    return 0;
  }
}

/* ─────────────────────────────── helpers ─────────────────────────────── */

function rowsOf(values: FakeRow | FakeRow[]): FakeRow[] {
  return Array.isArray(values) ? values : [values];
}

/** postgrest-js strips unquoted whitespace from a column list before it rides the URL. */
function stripWhitespace(columns: string): string {
  let quoted = false;
  let out = "";
  for (const c of columns) {
    if (/\s/.test(c) && !quoted) continue;
    if (c === '"') quoted = !quoted;
    out += c;
  }
  return out;
}

/** An `in.(...)` list as postgrest-js writes it: a value holding `,()` is double-quoted. */
function inList(values: readonly unknown[]): string {
  return values
    .map((v) => (typeof v === "string" && /[,()]/.test(v) ? `"${v}"` : `${v}`))
    .join(",");
}

/** The failed-fetch shape postgrest-js resolves when the request never completes. */
function failedFetch(length: number, limit: number): FakeResponse {
  return {
    data: null,
    error: {
      message: "TypeError: fetch failed",
      details: `The request URL is ${length} characters, past the ${limit}-character limit.`,
      hint: `Your request URL is ${length} characters, which may exceed server limits. If filtering with large arrays (e.g., .in('id', [many IDs])), chunk the list (inChunks) or pass it to an RPC.`,
      code: "",
    },
    count: null,
    status: 0,
    statusText: "",
  };
}

function failure(
  error: FakePostgrestError,
  status: number,
  statusText: string,
): FakeResponse {
  return { data: null, error, count: null, status, statusText };
}

type SelectItem =
  | "*"
  | { key: string; source: string; embed: boolean; inner: boolean };

/** A select list, top level only: `*`, `col`, `alias:col`, `col::cast`, `rel!hint!inner(...)`. */
function parseSelect(columns: string): SelectItem[] {
  return splitTopLevel(stripWhitespace(columns)).map((part): SelectItem => {
    if (part === "*") return "*";
    let rest = part;
    let alias: string | null = null;
    const aliased = /^([A-Za-z_][A-Za-z0-9_]*):(?!:)/.exec(rest);
    if (aliased) {
      alias = aliased[1];
      rest = rest.slice(aliased[0].length);
    }
    const paren = rest.indexOf("(");
    const head = paren === -1 ? rest : rest.slice(0, paren);
    const [named, ...hints] = head.split("!");
    const source = named.split("::")[0].split("->")[0];
    return {
      key: alias ?? source,
      source,
      embed: paren !== -1,
      inner: hints.includes("inner"),
    };
  });
}

/** A row cut to its select list. A column the fixture lacks reads as NULL, as a nullable one would. */
function project(row: FakeRow, items: SelectItem[]): FakeRow {
  const out: FakeRow = items.includes("*") ? { ...row } : {};
  for (const item of items) {
    if (item === "*") continue;
    const value =
      row[item.source] !== undefined ? row[item.source] : row[item.key];
    out[item.key] = value === undefined ? null : value;
  }
  return out;
}

/** Split on commas outside parentheses and double quotes. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\" && quoted && i + 1 < text.length) {
      current += c + text[++i];
      continue;
    }
    if (c === '"') quoted = !quoted;
    else if (!quoted && c === "(") depth++;
    else if (!quoted && c === ")") depth--;
    if (c === "," && depth === 0 && !quoted) {
      parts.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current !== "" || parts.length > 0) parts.push(current);
  return parts;
}

/**
 * A PostgREST logic tree's terms (the text inside `or=(...)`): `col.op.value`, `col.not.op.value`,
 * and nested `and(...)`, `or(...)`, `not.and(...)`, `not.or(...)`. Null when it does not parse.
 */
function parseLogicTree(text: string): Condition[] | null {
  const terms: Condition[] = [];
  for (const raw of splitTopLevel(text)) {
    const term = raw.trim();
    const group = /^(not\.)?(and|or)\(([\s\S]*)\)$/.exec(term);
    if (group) {
      const inner = parseLogicTree(group[3]);
      if (inner === null) return null;
      terms.push({
        kind: "group",
        mode: group[2] as "and" | "or",
        negate: Boolean(group[1]),
        terms: inner,
      });
      continue;
    }
    const cmp = /^([A-Za-z_][A-Za-z0-9_]*)\.(not\.)?([a-z]+)\.([\s\S]*)$/.exec(
      term,
    );
    if (!cmp || !OPS.has(cmp[3])) return null;
    const op = cmp[3] as Op;
    const value =
      op === "in"
        ? parseInValue(cmp[4])
        : op === "is"
          ? isValue(cmp[4])
          : unquote(cmp[4]);
    if (value === undefined) return null;
    terms.push({
      kind: "cmp",
      column: cmp[1],
      op,
      value,
      negate: Boolean(cmp[2]),
    });
  }
  return terms.length > 0 ? terms : null;
}

/** `(a,b,"c,d")` as a list. */
function parseInValue(text: string): unknown[] | undefined {
  const m = /^\(([\s\S]*)\)$/.exec(text.trim());
  if (!m) return undefined;
  return m[1] === "" ? [] : splitTopLevel(m[1]).map(unquote);
}

function unquote(text: string): string {
  return /^"[\s\S]*"$/.test(text)
    ? text.slice(1, -1).replace(/\\([\s\S])/g, "$1")
    : text;
}

/** `is.null`, `is.true`, `is.false`, from a URL string or the JS value itself. */
function isValue(value: unknown): null | boolean | undefined {
  if (value === null || value === "null") return null;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

/** A column, or a dotted path through a to-one embed (`events.host_id`). */
function valueAt(row: FakeRow, column: string): unknown {
  let value: unknown = row;
  for (const key of column.split(".")) {
    if (
      value === null ||
      value === undefined ||
      typeof value !== "object" ||
      Array.isArray(value)
    )
      return undefined;
    value = (value as FakeRow)[key];
  }
  return value;
}

/** SQL's three-valued logic: true, false, or NULL (unknown), which no filter keeps. */
function evaluate(condition: Condition, row: FakeRow): boolean | null {
  let result: boolean | null;
  if (condition.kind === "group") {
    const results = condition.terms.map((term) => evaluate(term, row));
    if (condition.mode === "and") {
      result = results.includes(false)
        ? false
        : results.includes(null)
          ? null
          : true;
    } else {
      result = results.includes(true)
        ? true
        : results.includes(null)
          ? null
          : false;
    }
  } else {
    result = test(
      condition.op,
      valueAt(row, condition.column),
      condition.value,
    );
  }
  return condition.negate && result !== null ? !result : result;
}

function test(op: Op, actual: unknown, expected: unknown): boolean | null {
  if (op === "is") {
    const want = isValue(expected);
    return want === null
      ? actual === null || actual === undefined
      : actual === want;
  }
  if (actual === null || actual === undefined) return null;
  if (op === "in") {
    const list = Array.isArray(expected) ? expected : [];
    return list.some(
      (value) => compareValues(actual, coerce(actual, value)) === 0,
    );
  }
  const value = coerce(actual, expected);
  if (value === null || value === undefined) return null;
  if (op === "like" || op === "ilike") {
    const pattern = String(expected)
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/[%*]/g, "[\\s\\S]*")
      .replace(/_/g, "[\\s\\S]");
    return new RegExp(`^${pattern}$`, op === "ilike" ? "i" : "").test(
      String(actual),
    );
  }
  const order = compareValues(actual, value);
  switch (op) {
    case "eq":
      return order === 0;
    case "neq":
      return order !== 0;
    case "gt":
      return order > 0;
    case "gte":
      return order >= 0;
    case "lt":
      return order < 0;
    case "lte":
      return order <= 0;
  }
}

/** A filter value read against the row's own type, the way a URL string is cast by Postgres. */
function coerce(actual: unknown, value: unknown): unknown {
  if (
    typeof actual === "number" &&
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  if (typeof actual === "boolean" && (value === "true" || value === "false"))
    return value === "true";
  if (
    typeof actual === "string" &&
    (typeof value === "number" || typeof value === "boolean")
  )
    return String(value);
  return value;
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean")
    return Number(a) - Number(b);
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}
