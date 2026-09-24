import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const DIR = join(process.cwd(), "src", "app", "(guest)", "u", "[slug]");
const sections = readFileSync(join(DIR, "owner-sections.tsx"), "utf8");
const page = readFileSync(join(DIR, "page.tsx"), "utf8");

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
    const allowed = ["getMyUploadCards", "getMyLikeCards", "getMyFollowing"];
    const called = [...sections.matchAll(/\bawait\s+(get[A-Za-z]+)\(/g)].map(
      (m) => m[1],
    );
    const readers = [...sections.matchAll(/\b(get[A-Z][A-Za-z]*)\(\)/g)].map(
      (m) => m[1],
    );
    for (const fn of [...called, ...readers]) {
      expect(allowed, `${fn} is not an auth.uid()-scoped read`).toContain(fn);
    }
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

describe("the route's 404 still decides before anything streams", () => {
  it("has no loading.tsx, ever", () => {
    // ★ MEASURED, NOT ASSUMED (profiles-social.md). A loading file wraps the
    // whole route in Suspense, so Next flushes the shell before the page runs
    // and a dead handle answers 200 instead of 404 — a public page that
    // soft-404s teaches search engines that every dead handle is real. The
    // owner mode streams behind its OWN in-page boundary for exactly this.
    expect(existsSync(join(DIR, "loading.tsx"))).toBe(false);
    expect(page).toContain("notFound()");
    expect(page).toContain("<Suspense");
  });
});
