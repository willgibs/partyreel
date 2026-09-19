import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it, vi } from "vitest";

/**
 * THE SURFACE RULES (the admin split, 2026-09-18).
 *
 * `src/lib/surface` is the single home for "which surface does this deployment serve", and the
 * proxy, the admin seam and the purge cron all decide from it. Everything in it is pure, so the
 * whole rule set is asserted here with no request, no Supabase client and no dev server: this file
 * is the reason the rules can be trusted before the second Vercel project exists.
 *
 * Three things are pinned:
 *   1. the predicates, per surface, including the segment boundary a naive `startsWith` gets wrong;
 *   2. every path FAMILY on every surface, so adding a route means deciding where it lives rather
 *      than discovering it on the admin host;
 *   3. that the three call sites still call in. A surface rule nobody applies is not a rule, and
 *      the outer 404 is the only thing standing between the admin host and the rest of the app.
 *
 * env.ts is mocked so a test can ask about a surface it is not running on; the module reads
 * `env.NEXT_PUBLIC_SURFACE` through a getter, so flipping `mockSurface.value` flips `surface()`.
 */

const mockSurface = vi.hoisted(() => ({
  value: undefined as "app" | "admin" | undefined,
}));

vi.mock("@/lib/env", () => ({
  env: {
    get NEXT_PUBLIC_SURFACE() {
      return mockSurface.value;
    },
  },
}));

const {
  decideBySurface,
  isAdminPortalPath,
  isAdminSurfacePath,
  servesAdmin,
  servesApp,
  surface,
  SURFACE_404_PATH,
} = await import("./index");

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Every path family the tree serves, labelled with the surface that owns it. */
const ADMIN_ONLY = [
  "/admin",
  "/admin/",
  "/admin/jobs",
  "/admin/forensics/export",
];
const SHARED = ["/", "/login", "/login/", "/auth/callback", "/robots.txt"];
const ADMIN_ALSO_SERVES = ["/api/cron/purge", "/api/design-gate"];
const APP_ONLY = [
  "/pricing",
  "/features",
  "/help/getting-started",
  "/dashboard",
  "/dashboard/abc",
  "/account",
  "/welcome",
  "/e/0123456789abcdef0123456789abcdef",
  "/u/some-slug",
  "/design",
  "/design/library",
  "/api/guests",
  "/api/r2/presign-upload",
  "/api/stripe/webhook",
  "/api/internal/job-run",
  "/api/export/host",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/llms.txt",
  // The substring trap: a real marketing-style path that merely starts with the portal's letters.
  "/administrators",
];

describe("surface predicates", () => {
  it("reads the flag, and treats unset as both surfaces", () => {
    mockSurface.value = undefined;
    expect(surface()).toBeUndefined();
    expect(servesAdmin()).toBe(true);
    expect(servesApp()).toBe(true);

    mockSurface.value = "admin";
    expect(surface()).toBe("admin");
    expect(servesAdmin()).toBe(true);
    expect(servesApp()).toBe(false);

    mockSurface.value = "app";
    expect(surface()).toBe("app");
    expect(servesAdmin()).toBe(false);
    expect(servesApp()).toBe(true);

    mockSurface.value = undefined;
  });

  it("matches the portal by SEGMENT, never by substring", () => {
    expect(isAdminPortalPath("/admin")).toBe(true);
    expect(isAdminPortalPath("/admin/jobs")).toBe(true);
    expect(isAdminPortalPath("/administrators")).toBe(false);
    expect(isAdminPortalPath("/x/admin")).toBe(false);

    expect(isAdminSurfacePath("/login")).toBe(true);
    expect(isAdminSurfacePath("/logins")).toBe(false);
    expect(isAdminSurfacePath("/auth/callback")).toBe(true);
    expect(isAdminSurfacePath("/authors")).toBe(false);
  });
});

describe("the admin surface serves only the portal and what signing into it needs", () => {
  for (const path of [...ADMIN_ONLY, ...SHARED, ...ADMIN_ALSO_SERVES]) {
    it(`serves ${path}`, () => {
      expect(decideBySurface(path, "admin")).toBe("serve");
    });
  }
  for (const path of APP_ONLY) {
    it(`404s ${path}`, () => {
      expect(decideBySurface(path, "admin")).toBe("not-found");
    });
  }
});

describe("the app surface serves everything except the portal", () => {
  for (const path of ADMIN_ONLY) {
    it(`404s ${path}`, () => {
      expect(decideBySurface(path, "app")).toBe("not-found");
    });
  }
  for (const path of [...SHARED, ...ADMIN_ALSO_SERVES, ...APP_ONLY]) {
    it(`serves ${path}`, () => {
      expect(decideBySurface(path, "app")).toBe("serve");
    });
  }
});

describe("unset serves both surfaces, exactly as before the split", () => {
  for (const path of [
    ...ADMIN_ONLY,
    ...SHARED,
    ...ADMIN_ALSO_SERVES,
    ...APP_ONLY,
  ]) {
    it(`serves ${path}`, () => {
      expect(decideBySurface(path, undefined)).toBe("serve");
    });
  }
});

describe("the 404 sentinel", () => {
  it("is a path no route serves, so the rewrite renders a real not-found", () => {
    const appDir = join(ROOT, "src", "app");
    const routes = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const full = join(dir, entry.name);
        // Route GROUPS and private folders contribute no URL segment.
        const segments = relative(appDir, full)
          .split(/[/\\]/)
          .filter((s) => !s.startsWith("(") && !s.startsWith("_"));
        routes.add(`/${segments.join("/")}`);
        walk(full);
      }
    };
    walk(appDir);
    expect(routes.size).toBeGreaterThan(20);
    expect(routes.has(SURFACE_404_PATH)).toBe(false);
  });

  it("is itself refused on the admin surface, so it cannot become a back door", () => {
    expect(decideBySurface(SURFACE_404_PATH, "admin")).toBe("not-found");
  });
});

describe("the rules are actually applied", () => {
  it("the proxy runs the surface decision before anything else and rewrites to the sentinel", () => {
    const proxy = read("src/proxy.ts");
    expect(proxy).toContain('from "@/lib/surface"');
    expect(proxy).toContain("decideBySurface(pathname, currentSurface)");
    expect(proxy).toContain("SURFACE_404_PATH");
    // Before the lab gate and before the root redirect: a refused path reaches no other rule.
    expect(proxy.indexOf("decideBySurface")).toBeLessThan(
      proxy.indexOf("designGateOpen(key)"),
    );
    expect(proxy.indexOf("decideBySurface")).toBeLessThan(
      proxy.indexOf("NextResponse.redirect"),
    );
  });

  it("the admin seam keeps the surface check as belt and braces", () => {
    const seam = read("src/lib/auth/admin-context.ts");
    expect(seam).toContain('import { servesAdmin } from "@/lib/surface"');
    expect(seam).toContain("if (!servesAdmin()) notFound()");
  });

  it("the root 404 answers the admin host as the portal, with no new route", () => {
    // Will, `admin-404=portal` (2026-09-19). A refused path on the admin
    // deployment is REWRITTEN to the sentinel, so the root not-found is what
    // renders it, and the fix had to happen there: a new route would have to
    // join the allow-list, which is the one thing the sentinel exists to avoid.
    const notFound = read("src/app/not-found.tsx");
    expect(notFound).toContain('from "@/lib/surface"');
    expect(notFound).toContain('surface() === "admin"');
    expect(notFound).toContain("AdminNotFoundScreen");
  });

  it("the purge cron runs on the app surface only", () => {
    const cron = read("src/app/api/cron/purge/route.ts");
    expect(cron).toContain('import { servesApp } from "@/lib/surface"');
    expect(cron).toContain("if (!servesApp())");
    // The guard must precede the admin client, the heartbeat and every sweep.
    expect(cron.indexOf("if (!servesApp())")).toBeLessThan(
      cron.indexOf("const admin = createAdminClient()"),
    );
    expect(cron.indexOf("if (!servesApp())")).toBeLessThan(
      cron.indexOf("startJobRun("),
    );
  });
});
