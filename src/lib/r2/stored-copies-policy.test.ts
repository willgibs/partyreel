import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * NOTHING IS EVER ORPHANED IN R2: the static guard of the third stored copy (take-home-wiring, 2026-10-03).
 *
 * A photograph now owns three objects (`r2/keys.ts`' `MediaVariant`): its original, the tile's preview and the
 * phone-size copy. A purge that deletes a row's objects from the two keys it always knew would leave the phone
 * copy under a row that is gone, and nothing else deletes it while the row stands (the orphan sweep keys on the
 * row's id). So this walks the code that ships (`src/**` but tests, the generated types and the test fakes;
 * `scripts/*.mjs`; the Workers' sources) and the migrations' winning function bodies, and refuses:
 *
 *  A. A PURGE THAT CAN FORGET A COPY: code that deletes R2 objects (a `deleteR2Objects(` call, the SDK's
 *     `DeleteObjectsCommand`, or `reclaimMedia(`) names the third copy itself (`phone_key`), or reaches the
 *     keys through `mediaKeysOf` / `MEDIA_KEY_COLUMNS` (`lifecycle/reclaim.ts`: the one home of "every object a
 *     row owns"), or is listed in `DELETES_BY_LISTING` with why it cannot forget one.
 *  B. A READER OF `preview_key` THAT NEVER NAMES `phone_key` (or the app's `phoneKey`): every reader of the
 *     stored copies knows the third,
 *     or is listed in `DISPLAY_ONLY` with why it never needs it (a tile, a cover, a picture: it draws, it never
 *     deletes). A listed file that starts deleting fails, and so does a listed file that no longer reads
 *     `preview_key` (the list cannot outlive its reasons).
 *  C. THE SAME IN SQL: the winning definition of every function that reads `preview_key` names `phone_key`, or is
 *     listed in `SQL_DISPLAY_ONLY` with why. Drops count: a function dropped later is gone.
 *
 * It reads CODE: comments are trivia to the TypeScript scanner (and stripped from the SQL), so a comment that
 * names a column never stands in for reading it.
 */

const ROOT = process.cwd();

/** Code that deletes objects without a row's keys: it lists the bucket, so a third copy is just another key. */
const DELETES_BY_LISTING: Readonly<Record<string, string>> = {
  "src/lib/r2/delete.ts":
    "the R2 delete helper itself: it deletes the keys it is handed and reads no row",
  "src/lib/lifecycle/sweeps/orphans.ts":
    "the orphan sweep lists `events/` and deletes an object whose row is gone, by the id every variant's key carries (`parseMediaIdFromKey`)",
};

/** Readers of `preview_key` that draw it and never delete: the third copy is nothing to them. */
const DISPLAY_ONLY: Readonly<Record<string, string>> = {
  "src/app/(dev)/design/album-scale/host-surface.tsx":
    "a lab fixture's stand-in row, never a stored object",
  "src/app/api/events/[eventId]/bin/media/route.ts":
    "the bin's tiles: a link a window, never a delete (Delete permanently is `purgeMediaNow`)",
  "src/app/api/guests/mine/route.ts":
    "her tracker's pictures of her own held and sealed items: the preview, else the original",
  "src/lib/dashboard/card-facts.ts": "the dashboard cards' covers",
  "src/lib/db/mutations/guest-media.ts":
    "her own uploads' pictures for her tracker (`readOwnUploads`)",
  "src/lib/db/queries/album-guest.ts":
    "the guest album's manifest flag and its links' keys (tile, view, attachment)",
  "src/lib/db/queries/album-host.ts":
    "the host album's manifest flag and its links' keys",
  "src/lib/db/queries/dashboard.ts": "the dashboard's stills",
  "src/lib/db/queries/events.ts":
    "the live reel's filter: a photo, or a clip with a picture",
  "src/lib/db/queries/guest-events-admin.ts":
    "the reel's and her sealed shots' pictures",
  "src/lib/db/queries/guest-events.ts": "the guest gallery's rows, for tiles",
  "src/lib/db/queries/media.ts":
    "the host's column list (`MEDIA_HOST_COLUMNS`, pinned to her SELECT grant, which holds no phone column) and the hub's tiles",
  "src/lib/db/queries/my-likes.ts": "the Likes feed's tiles",
  "src/lib/db/queries/my-uploads.ts": "the Uploads feed's tiles",
  "src/lib/db/queries/reports.ts": "the operator's report pictures",
  "src/lib/db/queries/storage-list.ts":
    "the storage page's tiles (its Delete removes; the purge sweeps later)",
  "src/lib/event/bin.ts": "a bin entry's has-a-picture flag",
  "src/lib/event/gallery-items.ts": "the hub's grid items",
  "src/lib/event/host-album.server.ts": "the host album's first paint",
  "src/lib/events/album-guest-links.ts":
    "the guest album's links by id: tile, view and attachment",
  "src/lib/events/album-host-links.ts": "the host album's links by id",
  "src/lib/r2/grid-items.ts":
    "every guest-facing grid item: tile, original and Save's attachment",
  "src/lib/reel/clip-hidden-action.ts": "a hidden clip's picture in the reel",
};

/** SQL readers of `preview_key` that hand a picture out and delete nothing. */
const SQL_DISPLAY_ONLY: Readonly<Record<string, string>> = {
  album_changes_since: "the paged album's manifest: has-a-picture, never a key",
  event_covers: "the dashboard's covers",
  event_stills: "the dashboard cards' stills",
  get_event_media_by_qr_token: "the guest gallery's rows, for tiles",
  get_my_likes: "the Likes feed",
  get_my_uploads: "the Uploads feed",
  list_guest_rows_by_email: "a claim's preview pictures",
};

/* ─────────────────────────────── the walk ─────────────────────────────── */

const SKIP =
  /\.test\.tsx?$|\.d\.ts$|^src\/lib\/db\/types\.ts$|^src\/lib\/db\/testing\/|\/milestone-\d+\/|\/testing\//;

function filesUnder(dir: string, keep: (rel: string) => boolean): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).replace(/\\/g, "/")}`)
    .filter((rel) => !rel.includes("node_modules") && keep(rel))
    .sort();
}

const SOURCES = [
  ...filesUnder("src", (rel) => /\.tsx?$/.test(rel) && !SKIP.test(rel)),
  ...filesUnder("scripts", (rel) => rel.endsWith(".mjs")),
  ...filesUnder(
    "workers",
    (rel) => /\/src\/.*\.ts$/.test(rel) && !SKIP.test(rel),
  ),
];

/**
 * A file's CODE as the scanner reads it: every token's text but the trivia (comments and whitespace), so a word
 * inside a string (a select list) counts and a word inside a comment never does.
 */
function codeOf(rel: string): string {
  const text = readFileSync(join(ROOT, rel), "utf8");
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    /* skipTrivia */ true,
    rel.endsWith(".tsx") ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    text,
  );
  const out: string[] = [];
  for (
    let token = scanner.scan();
    token !== ts.SyntaxKind.EndOfFileToken;
    token = scanner.scan()
  ) {
    out.push(scanner.getTokenText());
  }
  return out.join(" ");
}

const CODE = new Map(SOURCES.map((rel) => [rel, codeOf(rel)]));

const DELETES =
  /\bdeleteR2Objects\s*\(|\bDeleteObjectsCommand\b|\breclaimMedia\s*\(/;
// `copyOf` (`export/build-manifest.ts`) is the take-home's one home of a row's copy at a size.
const KNOWS_THE_THIRD =
  /\bphone_key\b|\bphoneKey\b|\bMEDIA_KEY_COLUMNS\b|\bmediaKeysOf\b|\bcopyOf\b/;
const READS_PREVIEW = /\bpreview_key\b/;

/* ───────────────────────────── the migrations ──────────────────────────── */

/** Every public function's winning body after the whole set, drops replayed (`row-cap-policy.test.ts`' reading). */
function winningBodies(): Map<string, string> {
  const dir = join(ROOT, "supabase/migrations");
  const live = new Map<string, string>();
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(join(dir, file), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/--[^\n]*/g, "");
    const statement =
      /\b(create(?:\s+or\s+replace)?|drop)\s+function\s+(?:if\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(/gi;
    for (const m of sql.matchAll(statement)) {
      const name = m[2].toLowerCase();
      if (m[1].toLowerCase() === "drop") {
        live.delete(name);
        continue;
      }
      const rest = sql.slice(m.index);
      const opener = /\bas\s+(\$[a-z_]*\$)/i.exec(rest);
      if (!opener) continue;
      const start = opener.index + opener[0].length;
      const close = rest.indexOf(opener[1], start);
      live.set(name, rest.slice(0, close === -1 ? undefined : close));
    }
  }
  return live;
}

/* ─────────────────────────────── the rules ─────────────────────────────── */

describe("A. every purge deletes every stored copy", () => {
  it("found the purges it means to hold (the census is not empty)", () => {
    const purges = [...CODE].filter(([, code]) => DELETES.test(code));
    expect(purges.map(([rel]) => rel)).toEqual(
      expect.arrayContaining([
        "src/lib/lifecycle/reclaim.ts",
        "src/lib/db/mutations/media.ts",
        "scripts/seed-demo-event.mjs",
      ]),
    );
  });

  it("names the phone copy, or deletes through the one home of a row's keys, or deletes by listing", () => {
    const offenders = [...CODE]
      .filter(
        ([rel, code]) => DELETES.test(code) && !(rel in DELETES_BY_LISTING),
      )
      .filter(([, code]) => !KNOWS_THE_THIRD.test(code))
      .map(([rel]) => rel);
    expect(
      offenders,
      "a purge that reads a row's keys must read phone_key too (use MEDIA_KEY_COLUMNS and mediaKeysOf)",
    ).toEqual([]);
  });

  it("every deletes-by-listing entry still deletes", () => {
    for (const rel of Object.keys(DELETES_BY_LISTING)) {
      expect(CODE.has(rel), `${rel} is gone: drop its entry`).toBe(true);
      expect(DELETES.test(CODE.get(rel)!), `${rel} no longer deletes`).toBe(
        true,
      );
    }
  });
});

describe("B. every reader of preview_key knows the phone copy, or only draws", () => {
  it("names phone_key, or is display-only with its reason", () => {
    const offenders = [...CODE]
      .filter(([, code]) => READS_PREVIEW.test(code))
      .filter(([, code]) => !KNOWS_THE_THIRD.test(code))
      .filter(([rel]) => !(rel in DISPLAY_ONLY))
      .map(([rel]) => rel);
    expect(
      offenders,
      "a new reader of the stored copies: read phone_key beside preview_key, or list it in DISPLAY_ONLY with why it never deletes",
    ).toEqual([]);
  });

  it("a display-only reader never deletes, and still reads preview_key", () => {
    for (const rel of Object.keys(DISPLAY_ONLY)) {
      const code = CODE.get(rel);
      expect(code, `${rel} is gone: drop its entry`).toBeDefined();
      expect(DELETES.test(code!), `${rel} deletes now: it is a purge`).toBe(
        false,
      );
      expect(
        READS_PREVIEW.test(code!),
        `${rel} no longer reads preview_key: drop its entry`,
      ).toBe(true);
    }
  });
});

describe("C. in SQL too", () => {
  const bodies = winningBodies();

  it("the writers record the phone copy beside the preview (create_media and create_media_as_host)", () => {
    for (const name of ["create_media", "create_media_as_host"]) {
      expect(bodies.get(name), name).toMatch(/\bphone_key\b/);
    }
  });

  it("every function that reads preview_key names phone_key, or is display-only with its reason", () => {
    const offenders = [...bodies]
      .filter(([, body]) => /\bpreview_key\b/.test(body))
      .filter(([, body]) => !/\bphone_key\b/.test(body))
      .filter(([name]) => !(name in SQL_DISPLAY_ONLY))
      .map(([name]) => name);
    expect(offenders).toEqual([]);
  });

  it("every SQL display-only entry still reads preview_key, and deletes nothing", () => {
    for (const name of Object.keys(SQL_DISPLAY_ONLY)) {
      const body = bodies.get(name);
      expect(body, `${name} is gone: drop its entry`).toBeDefined();
      expect(/\bpreview_key\b/.test(body!), name).toBe(true);
      expect(/\bdelete\s+from\s+public\.media\b/i.test(body!), name).toBe(
        false,
      );
    }
  });
});
