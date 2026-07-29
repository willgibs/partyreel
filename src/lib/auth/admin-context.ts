/**
 * The SINGLE authorization seam for the admin/operations portal. Every admin
 * page, layout, server action, and route handler funnels through here — callers
 * NEVER read `profiles.is_admin` (or, later, a role) directly.
 *
 * Why one seam: today an admin is just a normal account with `is_admin = true`
 * (service-role-write-only). When a real team arrives we'll swap this resolution
 * for a `staff_members` + role-enum model and add per-surface permissions to
 * `AdminContext` — and because nothing reads `is_admin` outside this file, that
 * change stays local. (See docs/ROADMAP "Future RBAC".)
 *
 * Security model (mirrors the rest of the app): getUser() re-validates the JWT
 * (never getSession()); RLS / the service-role boundary is the real authority; the
 * proxy is not. The portal additionally requires AAL2 (a verified TOTP factor) for
 * any write — MFA is the perimeter for a surface that can see billing + all data.
 */
import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import type { ActionResult } from "@/app/(app)/dashboard/actions";
import { isAdminHost } from "@/lib/auth/admin-host";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AdminAal = "aal1" | "aal2";

export type AdminContext = {
  userId: string;
  email: string | null;
  /**
   * TODAY always true (derived from `profiles.is_admin`). FUTURE seam: resolve a
   * role + permissions HERE and widen this type; callers read the context, never
   * `is_admin`, so the swap is local to this file.
   */
  isAdmin: true;
  /** The session's current assurance level (aal2 == MFA-verified). */
  aal: AdminAal;
  /** A verified TOTP factor exists, so the session can step up to aal2. */
  mfaEnrolled: boolean;
};

type AdminGate =
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "ok"; ctx: AdminContext };

/**
 * In production the portal renders ONLY on the admin host; the apex 404s `/admin`
 * so its existence never leaks. Dev (NEXT_PUBLIC_ADMIN_HOST unset) skips the guard
 * so `/admin` is reachable on localhost for pure-UI work.
 */
async function assertAdminHost(): Promise<void> {
  if (!env.NEXT_PUBLIC_ADMIN_HOST) return;
  const host = (await headers()).get("host");
  if (!isAdminHost(host)) notFound();
}

async function readGate(): Promise<AdminGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };

  // DELIBERATE SWALLOW (fail CLOSED, x2): this is the admin gate. An unreadable
  // is_admin / AAL must deny, never admit, so "no row" and "read failed" both
  // land on `forbidden` / aal1. Never convert these to mustQuery-and-default.
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { status: "forbidden" };

  // currentLevel = the session's AAL; nextLevel === 'aal2' means a verified TOTP
  // factor exists (so the gate shows "step up" vs "enroll").
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const current: AdminAal = aal?.currentLevel === "aal2" ? "aal2" : "aal1";
  const mfaEnrolled = aal?.nextLevel === "aal2" || current === "aal2";

  return {
    status: "ok",
    ctx: {
      userId: user.id,
      email: user.email ?? null,
      isAdmin: true,
      aal: current,
      mfaEnrolled,
    },
  };
}

/**
 * Pages / layouts. Host-guards, then: anonymous → redirect to login (the subdomain
 * already implies an admin area exists, so a login prompt leaks nothing), non-admin
 * → notFound() (a logged-in non-admin can't even confirm the route). AAL is NOT
 * enforced here — the layout inspects `ctx.aal` to render the enroll/step-up gate,
 * and sensitive pages should `if (ctx.aal !== "aal2") return null` before fetching.
 */
export async function requireAdmin(): Promise<AdminContext> {
  await assertAdminHost();
  const gate = await readGate();
  if (gate.status === "anonymous") redirect("/login?next=/admin");
  if (gate.status === "forbidden") notFound();
  return gate.ctx;
}

const NOT_AUTHORIZED: ActionResult = {
  ok: false,
  code: "unauthorized",
  message: "Not authorized.",
};

// MFA-verified (AAL2) is required for any write. A logged-in admin at AAL1 IS
// authorized, just not stepped up — give them a distinct nudge, not a flat 404.
const MFA_REQUIRED: ActionResult = {
  ok: false,
  code: "unauthorized",
  message: "Verify your second factor, then try again.",
};

/**
 * Server actions / route handlers. Re-checks auth AND requires AAL2, returning a
 * ready-to-return ActionResult on failure (not redirect/notFound), so call sites
 * stay `const auth = await requireAdminAction(); if (!auth.ok) return auth.result;`.
 * An action is its own entry point — the layout gate is not enough.
 */
export async function requireAdminAction(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; result: ActionResult }
> {
  const gate = await readGate();
  if (gate.status !== "ok") return { ok: false, result: NOT_AUTHORIZED };
  if (gate.ctx.aal !== "aal2") return { ok: false, result: MFA_REQUIRED };
  return { ok: true, ctx: gate.ctx };
}
