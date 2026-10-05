import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { liveFunctions } from "@/lib/db/testing/migrations";

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
 * It reads CODE, so a comment that names a column never stands in for reading it. ★ The TypeScript is PARSED, not
 * scanned (`codeOf`): only the parser knows where a template's text resumes after a `${}`, a regular expression from
 * a division and JSX text from code, and a bare scanner that meets one loses its place and reads the rest of the file
 * inverted, comments as code. The SQL is `testing/migrations.ts`' replay, comments gone.
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
  "src/lib/db/queries/moderation.ts": "the operator's Albums tiles",
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
 * A source's CODE as the parser reads it: the file is parsed and walked token by token, and every token's text counts
 * (so a word inside a string, a select list or a template's text does) but a comment never does, nor the JSDoc the
 * parser hangs on a declaration. ★ A BARE SCANNER IS NOT A READER: `ts.createScanner` knows no context, so after the
 * first template literal with a `${}` in it (it takes the text after the `}` for code and the closing backtick for
 * an opening one) or a regular expression holding a backtick, it reads the rest of the file inverted, the comments in
 * what it takes for a string: a comment naming `preview_key` then fails the policy for a file that never reads it, and
 * one naming `phone_key` excuses a purge that forgets it.
 */
function codeOfText(rel: string, text: string): string {
  const kind = rel.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : rel.endsWith(".mjs")
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const file = ts.createSourceFile(
    rel,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    kind,
  );
  const out: string[] = [];
  const walk = (node: ts.Node) => {
    const children = node.getChildren(file);
    if (children.length === 0) {
      // A token (or an empty list between two parens, whose text is nothing).
      const token = node.getText(file);
      if (token !== "") out.push(token);
      return;
    }
    for (const child of children) if (!ts.isJSDoc(child)) walk(child);
  };
  walk(file);
  return out.join(" ");
}

const codeOf = (rel: string) =>
  codeOfText(rel, readFileSync(join(ROOT, rel), "utf8"));

const CODE = new Map(SOURCES.map((rel) => [rel, codeOf(rel)]));

const DELETES =
  /\bdeleteR2Objects\s*\(|\bDeleteObjectsCommand\b|\breclaimMedia\s*\(/;
// `copyOf` (`export/build-manifest.ts`) is the take-home's one home of a row's copy at a size.
const KNOWS_THE_THIRD =
  /\bphone_key\b|\bphoneKey\b|\bMEDIA_KEY_COLUMNS\b|\bmediaKeysOf\b|\bcopyOf\b/;
const READS_PREVIEW = /\bpreview_key\b/;

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
  // Every `public` function standing after the whole set, as code (comments gone), one entry per overload: the reader
  // is `testing/migrations.ts`' (creates and drops replayed in file order), so a function a later file drops is gone
  // and a name two overloads share is two bodies, each held to the rules below.
  const live = liveFunctions();
  const standing = (name: string) => live.filter((fn) => fn.name === name);

  it("the writers record the phone copy beside the preview (create_media and create_media_as_host)", () => {
    for (const name of ["create_media", "create_media_as_host"]) {
      const writers = standing(name);
      expect(writers.length, `${name} is not live`).toBeGreaterThan(0);
      for (const writer of writers) {
        expect(writer.code, name).toMatch(/\bphone_key\b/);
      }
    }
  });

  it("every function that reads preview_key names phone_key, or is display-only with its reason", () => {
    const offenders = live
      .filter((fn) => /\bpreview_key\b/.test(fn.code))
      .filter((fn) => !/\bphone_key\b/.test(fn.code))
      .filter((fn) => !(fn.name in SQL_DISPLAY_ONLY))
      .map((fn) => fn.name);
    expect(offenders).toEqual([]);
  });

  it("every SQL display-only entry still reads preview_key, and deletes nothing", () => {
    for (const name of Object.keys(SQL_DISPLAY_ONLY)) {
      const defs = standing(name);
      expect(defs.length, `${name} is gone: drop its entry`).toBeGreaterThan(0);
      expect(
        defs.some((fn) => /\bpreview_key\b/.test(fn.code)),
        name,
      ).toBe(true);
      expect(
        defs.some((fn) => /\bdelete\s+from\s+public\.media\b/i.test(fn.code)),
        name,
      ).toBe(false);
    }
  });
});

/**
 * THE READER'S OWN CONTRACT (a policy that reads code is only as good as its idea of code): a comment is never a
 * token, whatever the text before it holds, and a word in a string, a template's text or a call still is one. The
 * sources below are ones a bare scanner reads wrong (a template with a `${}`, nested, then a comment; a regular
 * expression holding a backtick), beside the plain cases any reader gets right.
 */
describe("the reader reads code, never a comment (a parse, not a scan)", () => {
  const COMMENTS =
    "// names preview_key and phone_key\n/* and deleteR2Objects( */\n";
  const seesNothingOfTheComments = (code: string) => {
    expect(READS_PREVIEW.test(code), code).toBe(false);
    expect(KNOWS_THE_THIRD.test(code), code).toBe(false);
    expect(DELETES.test(code), code).toBe(false);
  };

  it("a comment after a template literal with a substitution is no code", () => {
    const code = codeOfText(
      "a.ts",
      `const a = \`x \${y} z\`;\n${COMMENTS}const b = 1;\n`,
    );
    seesNothingOfTheComments(code);
    expect(code).toContain("const b = 1");
  });

  it("nor after templates nested in a substitution, or several in a row", () => {
    const code = codeOfText(
      "a.ts",
      `const a = \`a \${\`b \${c} d\`} e \${f}\`;\nconst g = \`h \${i}\`;\n${COMMENTS}const b = 1;\n`,
    );
    seesNothingOfTheComments(code);
    expect(code).toContain("const b = 1");
  });

  it("nor after a regular expression holding a backtick", () => {
    const code = codeOfText(
      "a.ts",
      `const r = /\`/g;\n${COMMENTS}const b = 1;\n`,
    );
    seesNothingOfTheComments(code);
    expect(code).toContain("const b = 1");
  });

  it("nor is the JSDoc the parser hangs on a declaration, in a .tsx or an .mjs either", () => {
    for (const name of ["a.ts", "a.tsx", "a.mjs"]) {
      const code = codeOfText(
        name,
        `/**\n * names preview_key and phone_key, and calls reclaimMedia(\n */\nexport function f() { return \`\${1}\`; }\n${COMMENTS}`,
      );
      seesNothingOfTheComments(code);
      expect(code, name).toContain("export function f");
    }
  });

  it("a word in code still counts: an identifier, a select list, a template's text, a call", () => {
    expect(
      READS_PREVIEW.test(codeOfText("a.ts", `const s = "id, preview_key";`)),
    ).toBe(true);
    // Both sides of a substitution are the template's text.
    expect(
      READS_PREVIEW.test(codeOfText("a.ts", "const s = `${a}, preview_key`;")),
    ).toBe(true);
    expect(
      KNOWS_THE_THIRD.test(
        codeOfText("a.ts", "const s = `id, ${a} phone_key`;"),
      ),
    ).toBe(true);
    expect(
      KNOWS_THE_THIRD.test(codeOfText("a.ts", "const k = row.phoneKey;")),
    ).toBe(true);
    expect(
      DELETES.test(codeOfText("a.mjs", "await deleteR2Objects(keys);")),
    ).toBe(true);
    expect(
      DELETES.test(codeOfText("a.tsx", "const n = await reclaimMedia (ids);")),
    ).toBe(true);
    expect(
      DELETES.test(
        codeOfText("a.ts", "new DeleteObjectsCommand({ Bucket: b });"),
      ),
    ).toBe(true);
  });
});
