import ts from "typescript";
import { describe, expect, it } from "vitest";

import { read, sources } from "@/testing/source-tree";

/**
 * GUEST MEDIA IS NEVER BILLED BY VERCEL (take-home-wiring, 2026-10-03; Will's rule the night of build 45: "every
 * single image action matters", and guest media must never be billed by Vercel). Every byte a guest adds goes to R2
 * on a presigned PUT and comes back on a presigned GET (uploads-and-r2.md), so the only ways Vercel could start
 * billing for it are the three this refuses, in the code that ships:
 *
 *  A. THE IMAGE OPTIMIZER FED FROM ANYWHERE: `images.remotePatterns`, `images.domains` or a custom `loader` in
 *     `next.config.ts`. Without them `next/image` optimizes only this app's own files (`public/`), and refuses a
 *     remote URL outright; with one, a presigned R2 URL becomes a billed transformation per photograph per size.
 *  B. `next/image` FED A PRESIGNED OR USER URL: a `src` built from a link (`url`, `previewUrl`, `downloadUrl`, a
 *     presign, an avatar's address) or a file that imports the presigner. A guest photograph is an `<img>` (the
 *     album's `MediaTile`), never `next/image`.
 *  C. R2 BYTES STREAMED THROUGH A FUNCTION: a read is a URL signed by hand in `src/lib/r2/sigv4.ts`, which holds no
 *     client and sends nothing, so `GetObjectCommand` appears nowhere in `src/`, and nothing there reads an object's
 *     body (`transformToWebStream`, `transformToByteArray`, `transformToString`). A zip streams on the export
 *     Worker, never here.
 *
 * Each rule's detector is proved against a source that breaks it (the "refuses" cases), so a detector that went
 * blind fails here too.
 */

/** A source's tokens' text, comments and whitespace skipped (the TypeScript scanner's trivia). */
function codeOf(text: string, jsx: boolean): string {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    jsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    text,
  );
  const out: string[] = [];
  for (
    let t = scanner.scan();
    t !== ts.SyntaxKind.EndOfFileToken;
    t = scanner.scan()
  ) {
    out.push(scanner.getTokenText());
  }
  return out.join(" ");
}

/* ── A. the config ──────────────────────────────────────────────────────── */

/** What the image optimizer may be fed from outside this app: none of these may appear in the config. */
export function configOffences(configText: string): string[] {
  const code = codeOf(configText, false);
  return ["remotePatterns", "domains", "loaderFile", "loader"].filter((word) =>
    new RegExp(`\\b${word}\\b`).test(code),
  );
}

/* ── B. next/image ──────────────────────────────────────────────────────── */

/** A link's own words: a src built from any of them is a presigned or user URL. */
const USER_URL =
  /\b(url|previewUrl|downloadUrl|signedUrl|avatarUrl|avatar_url|tileUrl|viewUrl|photoUrl)\b|presign/i;

/** Modules that hand out presigned URLs: a file that imports one never imports next/image too. */
const PRESIGNERS = ["@/lib/r2/presign", "@/lib/r2/grid-items"];

/** Every `next/image` element whose src reads a link, and every presigner a next/image file imports. */
export function nextImageOffences(rel: string, text: string): string[] {
  const file = ts.createSourceFile(
    rel,
    text,
    ts.ScriptTarget.Latest,
    true,
    rel.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  let imageName: string | null = null;
  const imports: string[] = [];
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const from = statement.moduleSpecifier.text;
    imports.push(from);
    if (
      (from === "next/image" || from === "next/legacy/image") &&
      statement.importClause?.name
    ) {
      imageName = statement.importClause.name.text;
    }
  }
  if (!imageName) return [];
  const offences = imports
    .filter((from) =>
      PRESIGNERS.some((p) => from === p || from.startsWith(`${p}/`)),
    )
    .map((from) => `${rel}: imports ${from} beside next/image`);
  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      node.tagName.getText(file) === imageName
    ) {
      for (const attr of node.attributes.properties) {
        if (
          ts.isJsxAttribute(attr) &&
          attr.name.getText(file) === "src" &&
          attr.initializer
        ) {
          const src = attr.initializer.getText(file);
          if (USER_URL.test(src)) {
            const { line } = file.getLineAndCharacterOfPosition(
              attr.getStart(file),
            );
            offences.push(`${rel}:${line + 1}: <${imageName} src=${src}>`);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return offences;
}

/* ── C. R2 bytes through a function ─────────────────────────────────────── */

const READS_A_BODY = /\btransformTo(WebStream|ByteArray|String)\b/;

/** `GetObjectCommand` anywhere (a read is signed by hand), or sent; an object body read anywhere. */
export function streamOffences(rel: string, text: string): string[] {
  const code = codeOf(text, rel.endsWith(".tsx"));
  const offences: string[] = [];
  if (/\bGetObjectCommand\b/.test(code)) {
    offences.push(
      `${rel}: GetObjectCommand (a read is a URL signed in src/lib/r2/sigv4.ts)`,
    );
  }
  if (/\.\s*send\s*\(\s*new\s+GetObjectCommand\b/.test(code)) {
    offences.push(
      `${rel}: sends a GetObjectCommand (a byte read through a function)`,
    );
  }
  if (READS_A_BODY.test(code)) offences.push(`${rel}: reads an object's body`);
  return offences;
}

/* ── the rules, over the code that ships ────────────────────────────────── */

const FILES = sources().map((rel) => ({ rel, text: read(rel) }));

describe("A. the image optimizer reads this app's own files alone", () => {
  it("next.config names no remote pattern, domain or loader", () => {
    expect(configOffences(read("next.config.ts"))).toEqual([]);
  });

  it("refuses each way of feeding it from outside (the detector is not blind)", () => {
    expect(
      configOffences(
        `export default { images: { remotePatterns: [{ hostname: "x.r2.cloudflarestorage.com" }] } };`,
      ),
    ).toEqual(["remotePatterns"]);
    expect(
      configOffences(`export default { images: { domains: ["r2.dev"] } };`),
    ).toEqual(["domains"]);
    expect(
      configOffences(
        `export default { images: { loader: "custom", loaderFile: "./l.ts" } };`,
      ),
    ).toEqual(["loaderFile", "loader"]);
    // A comment that names one is no config.
    expect(
      configOffences(`// remotePatterns are refused\nexport default {};`),
    ).toEqual([]);
  });
});

describe("B. next/image is never fed a presigned or user URL", () => {
  it("found the next/image files it holds (the census is not empty)", () => {
    const users = FILES.filter(({ text }) =>
      /from ["']next\/image["']/.test(text),
    );
    expect(users.length).toBeGreaterThan(10);
  });

  it("no next/image src reads a link, and no next/image file imports a presigner", () => {
    // Only a file that imports next/image can offend, so only those are parsed.
    expect(
      FILES.filter(({ text }) => /next\/(?:legacy\/)?image/.test(text)).flatMap(
        ({ rel, text }) => nextImageOffences(rel, text),
      ),
    ).toEqual([]);
  });

  it("refuses a link's src and a presigner beside it (the detector is not blind)", () => {
    const source = `import Image from "next/image";
import { presignDownload } from "@/lib/r2/presign";
export const A = ({ item }) => <Image src={item.url} alt="" width={1} height={1} />;
export const B = ({ item }) => <Image src={item.previewUrl ?? item.url} alt="" fill />;
export const C = ({ face }) => <Image alt="" src={face.avatarUrl} width={1} height={1} />;
export const D = () => <Image src="/marketing/still.jpg" alt="" width={1} height={1} />;
export const E = ({ frame }) => <Image src={frame.src} alt="" width={1} height={1} />;`;
    const found = nextImageOffences("src/x.tsx", source);
    expect(found).toHaveLength(4);
    expect(found[0]).toContain("@/lib/r2/presign");
    expect(found.slice(1).map((o) => o.split(": ")[1])).toEqual([
      "<Image src={item.url}>",
      "<Image src={item.previewUrl ?? item.url}>",
      "<Image src={face.avatarUrl}>",
    ]);
    // Renamed on import, it is still next/image.
    expect(
      nextImageOffences(
        "src/y.tsx",
        `import Pic from "next/image";\nexport const F = ({ m }) => <Pic src={m.downloadUrl} alt="" />;`,
      ),
    ).toHaveLength(1);
  });
});

describe("C. no function streams R2 bytes", () => {
  it("no GetObjectCommand in src, none sent, and no body is read", () => {
    // Each offence spells its word, so only a file that holds one is tokenized.
    expect(
      FILES.filter(({ text }) =>
        /GetObjectCommand|transformTo/.test(text),
      ).flatMap(({ rel, text }) => streamOffences(rel, text)),
    ).toEqual([]);
  });

  it("the presigner signs its reads by hand, and the signer holds no client and sends nothing", () => {
    const presign = read("src/lib/r2/presign.ts");
    expect(presign).toMatch(/getPresigner\(\)\(\{\s*method:\s*"GET",/);
    const signer = codeOf(read("src/lib/r2/sigv4.ts"), false);
    expect(signer).toMatch(/\bcreateHmac\b/);
    expect(signer).not.toMatch(
      /\bfetch\b|\.\s*send\b|\bS3Client\b|@aws-sdk|"node:(https?|net|tls)"/,
    );
  });

  it("refuses a read through a function (the detector is not blind)", () => {
    expect(
      streamOffences(
        "src/app/api/media/[id]/route.ts",
        `import { GetObjectCommand } from "@aws-sdk/client-s3";
const out = await client.send(new GetObjectCommand({ Bucket, Key }));
return new Response(out.Body.transformToWebStream());`,
      ),
    ).toEqual([
      "src/app/api/media/[id]/route.ts: GetObjectCommand (a read is a URL signed in src/lib/r2/sigv4.ts)",
      "src/app/api/media/[id]/route.ts: sends a GetObjectCommand (a byte read through a function)",
      "src/app/api/media/[id]/route.ts: reads an object's body",
    ]);
    // A comment naming it is not code.
    expect(
      streamOffences(
        "src/z.ts",
        "// GetObjectCommand is the presigner's alone",
      ),
    ).toEqual([]);
  });
});
