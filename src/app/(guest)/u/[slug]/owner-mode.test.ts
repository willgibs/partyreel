import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * THE OWNER MODE'S GATE.
 *
 * `/u/[slug]` is a PUBLIC, INDEXABLE page that anonymous strangers read all
 * day, and three private feeds hang off it (a person's own photos, likes and
 * connections belong on their own profile page). The gate is therefore worth
 * a guard that cannot be refactored away by accident.
 *
 * It is a SOURCE guard rather than a render test on purpose: `OwnerSections`
 * is an async Server Component reading three RPCs, so a render test would be
 * mostly mocks, and mocks cannot answer the question that matters — which is
 * not "does it hide?" but "could it ever show the WRONG PERSON'S media?".
 * That question is answered by the shape of the code: the component takes no
 * identity, so there is no id it could be handed. The same technique the
 * profiles-social migration guard uses next door.
 */

/**
 * THE NAMES A FILE TAKES FROM THE DATA LAYER, whatever they are called: `@/lib/db/` holds every query and
 * `@/lib/supabase/` the clients (CLAUDE.md: no SQL in components), so the import is the one place a read cannot hide,
 * and `get*` is a habit, not a rule. A name is the export's, so an alias cannot rename a reader past the list; a
 * namespace or a default import takes the whole module and reads as `*` or `default`, which no list names; a type is
 * no read.
 */
function dataLayerNames(source: string): string[] {
  const file = ts.createSourceFile(
    "owner-sections.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const names: string[] = [];
  file.forEachChild((node) => {
    if (!ts.isImportDeclaration(node)) return;
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    if (!/^@\/lib\/(?:db|supabase)\//.test(node.moduleSpecifier.text)) return;
    const clause = node.importClause;
    if (!clause || clause.isTypeOnly) return;
    if (clause.name) names.push("default");
    const bound = clause.namedBindings;
    if (bound && ts.isNamespaceImport(bound)) names.push("*");
    else if (bound)
      for (const element of bound.elements)
        if (!element.isTypeOnly)
          names.push((element.propertyName ?? element.name).text);
  });
  return names;
}

const DIR = join(process.cwd(), "src", "app", "(guest)", "u", "[slug]");
const sections = readFileSync(join(DIR, "owner-sections.tsx"), "utf8");
const page = readFileSync(join(DIR, "page.tsx"), "utf8");
// /me (crumbs-46): the same sections at an address that needs no handle, in the (app) group.
const ME_DIR = join(process.cwd(), "src", "app", "(app)", "me");
const mePage = readFileSync(join(ME_DIR, "page.tsx"), "utf8");

/** The reads the owner mode makes, each for the caller alone (the test of that name says why). */
const ALLOWED = ["getMyUploadCards", "getMyLikeCards", "getMyFollowing"];

describe("the scan of a file's reads sees what it says it does", () => {
  it("names a reader whatever it is called, by its export, and ignores a type", () => {
    const names = dataLayerNames(`
      import { getMyFollowing, listEvents as hosted, type EventRow } from "@/lib/db/queries/events";
      import {
        fetchProfileUploads,
      } from "@/lib/db/queries/profile";
      import { createClient } from "@/lib/supabase/server";
      import { withAvatarUrls } from "@/lib/social/cards";
      import type { Cards } from "@/lib/db/queries/social";
    `);
    expect(names).toEqual([
      "getMyFollowing",
      "listEvents",
      "fetchProfileUploads",
      "createClient",
    ]);
  });

  it("reads a namespace or a default import as the whole module, which no list names", () => {
    expect(
      dataLayerNames(`
        import * as events from "@/lib/db/queries/events";
        import everything from "@/lib/db/queries/all";
      `),
    ).toEqual(["*", "default"]);
  });

  it("finds the real file's three reads by their imports alone, so the scan is not vacuous", () => {
    expect(dataLayerNames(sections).sort()).toEqual(
      ["getMyFollowing", "getMyLikeCards", "getMyUploadCards"].sort(),
    );
  });
});

describe("the owner mode cannot be pointed at somebody else", () => {
  it("takes no identity at all", () => {
    // ★ THE WHOLE GUARD. `export async function OwnerSections()` with an empty
    // parameter list means there is no profile id, no slug and no viewer to
    // pass in, so a future caller cannot wire it to the page owner by mistake.
    // If a prop is ever genuinely needed, this test failing is the moment to
    // re-prove the gate rather than the moment to widen the signature.
    expect(sections).toMatch(/export async function OwnerSections\(\)/);
  });

  it("reads only auth.uid()-scoped sources", () => {
    // Every read below answers for the CALLER: get_my_uploads and get_my_likes
    // are authenticated auth.uid() RPCs, and getMyFollowing is an owner-RLS
    // select. So even if the page's isSelf check were wrong, the worst this
    // could render is the VIEWER'S OWN media on somebody else's page — never
    // the page owner's. A gate you can only fail safely.
    const called = [...sections.matchAll(/\bawait\s+(get[A-Za-z]+)\(/g)].map(
      (m) => m[1],
    );
    const readers = [...sections.matchAll(/\b(get[A-Z][A-Za-z]*)\(\)/g)].map(
      (m) => m[1],
    );
    for (const fn of [...called, ...readers]) {
      expect(ALLOWED, `${fn} is not an auth.uid()-scoped read`).toContain(fn);
    }
  });

  it("★ sees a reader whatever it is called, and the list names exactly the reads made", () => {
    // The two scans above see `get*` calls and nothing else, so a read named any other way (`listEvents`, an
    // owner-RLS read) passed them unseen, allowed or not. The import closes that: every name taken from the data
    // layer is a read, and an exact list cannot outlive a read it names (a name nobody calls would allow it back
    // unseen). A read that is fine to add goes into ALLOWED here: the moment the header above calls re-proving the gate.
    const seen = new Set([
      ...dataLayerNames(sections),
      ...[...sections.matchAll(/\b(get[A-Z][A-Za-z]*)\(/g)].map((m) => m[1]),
    ]);
    expect(
      [...seen].sort(),
      "owner-sections.tsx reads something ALLOWED does not name, or ALLOWED names a read it no longer makes: a new read is added to the list here once it answers for the caller alone, and a gone one is dropped",
    ).toEqual([...ALLOWED].sort());
  });

  it("renders only for the person themselves", () => {
    // The page's own half of the gate: OwnerSections appears exactly once, and
    // under isSelf. A visitor's render carries none of it and costs zero extra
    // queries, because nothing below is constructed.
    expect(page.match(/<OwnerSections/g) ?? []).toHaveLength(1);
    const guard = page.slice(0, page.indexOf("<OwnerSections"));
    expect(guard.slice(-400)).toContain("isSelf &&");
  });
});

describe("/me draws the same owner mode for an account with no handle, and names nobody else", () => {
  // Will's answer A to crumbs-44's question. There is no `isSelf` to get wrong here: the address has no segment, so
  // there is no person it could be pointed at, and the sections answer for the caller as they do on the profile.
  it("takes no params, no search params and no identity", () => {
    expect(mePage).toMatch(/export default async function MePage\(\)/);
    expect(mePage).not.toMatch(/\bparams\b|searchParams/);
  });

  it("draws the sections once, with no props, after a handle has sent her on", () => {
    expect(mePage.match(/<OwnerSections\b/g) ?? []).toHaveLength(1);
    expect(mePage).toContain("<OwnerSections />");
    // A page that exists is where the owner mode lives (with its public half): the redirect decides first.
    const sentOn = mePage.indexOf("redirect(`/u/${profile.slug}`)");
    expect(sentOn).toBeGreaterThan(-1);
    expect(sentOn).toBeLessThan(mePage.indexOf("<OwnerSections"));
  });

  it("reads no one else's profile: the public RPC and the relation reads are never imported here", () => {
    expect(mePage).not.toMatch(
      /getPublicProfile|isFollowing|hasBlocked|isBlockedEitherWay/,
    );
  });

  it("stands behind its own layout, the name gate (name-gate.test.ts reads it)", () => {
    expect(existsSync(join(ME_DIR, "layout.tsx"))).toBe(true);
  });

  it("has no loading.tsx either: a handle that exists must redirect before anything streams", () => {
    expect(existsSync(join(ME_DIR, "loading.tsx"))).toBe(false);
  });
});

describe("the route's 404 still decides before anything streams", () => {
  it("has no loading.tsx, ever, and draws a dead handle's not-found before any boundary", () => {
    // ★ MEASURED, NOT ASSUMED (profiles-social.md). A loading file wraps the
    // whole route in Suspense, so Next flushes a skeleton before the page runs:
    // when the page threw `notFound()` a dead handle answered 200 instead of
    // 404 — a public page that soft-404s teaches search engines that every dead
    // handle is real. Reshaped by stale-link, which dropped the thrown
    // `notFound()` (served as a white error shell): the 404 status is the
    // proxy's no longer (a soft 404 since gone-link-soft), so the scar this keeps is the order, the
    // not-found drawn at the top where the RPC is, before the owner mode and the
    // card grid stream behind their OWN in-page boundaries.
    expect(existsSync(join(DIR, "loading.tsx"))).toBe(false);
    const notFound = page.indexOf("return <ProfileNotFoundScreen />");
    expect(notFound).toBeGreaterThan(-1);
    expect(notFound).toBeLessThan(page.indexOf("<Suspense"));
  });
});
