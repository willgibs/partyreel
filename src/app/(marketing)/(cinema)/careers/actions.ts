"use server";

import { headers } from "next/headers";

import { getJob } from "@/lib/constants/careers";
import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { sendOnce } from "@/lib/email/send";
import { applicationReceivedEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env";
import { checkPublicFormRate } from "@/lib/security/public-form-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { careerSchema, type CareerInput } from "@/lib/validation/careers";

// Failure arm carries a taxonomy code (slice 4 proof adoption); the client
// resolves copy via showActionError, so `message` is only for overrides.
export type CareerResult =
  | { ok: true }
  | {
      ok: false;
      code: "validation" | "not_found" | "send_failed" | "rate_limited";
      message?: string;
    };

export async function submitApplication(
  roleSlug: string,
  input: CareerInput,
): Promise<CareerResult> {
  const parsed = careerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation" };
  }
  const data = parsed.data;

  // Honeypot: real applicants leave this hidden field empty. Drop bots silently. Checked BEFORE the
  // limiter so a bot caught here (which costs us nothing) never spends a real applicant's budget on
  // a shared office address.
  if (data.website && data.website.trim() !== "") {
    return { ok: true };
  }

  const role = getJob(roleSlug);
  if (!role) {
    return {
      ok: false,
      code: "not_found",
      message: "That role is no longer open.",
    };
  }

  const requestHeaders = await headers();

  // The rate gate (QA #14), FAILING CLOSED for the same reason as /contact: unauthenticated, one
  // service-role insert plus one Resend send per accepted application, and no capability token
  // behind it to hold the line if the counter goes dark.
  const gate = await checkPublicFormRate("careers", requestHeaders);
  if (!gate.allowed) {
    return {
      ok: false,
      code: "rate_limited",
      message:
        gate.reason === "rate_limited"
          ? "That is a lot of applications from this network. Please try again in a bit."
          : "We could not accept that just now. Please try again in a minute.",
    };
  }

  const admin = createAdminClient();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) ?? null;

  // DB row is authoritative (deny-all table, service-role admin client).
  const { data: row, error } = await admin
    .from("job_applications")
    .insert({
      role_slug: roleSlug,
      name: data.name,
      email: data.email,
      links: data.links?.trim() || null,
      message: data.message,
      source: "marketing_careers",
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("job_applications insert failed:", error);
    return { ok: false, code: "send_failed" };
  }

  // Best-effort notification — never blocks the success response.
  try {
    const to = serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL;
    const { subject, html } = applicationReceivedEmail({
      role: role.title,
      name: data.name,
      email: data.email,
      links: data.links,
      message: data.message,
    });
    await sendOnce({
      kind: "job_application",
      dedupeKey: row.id,
      to,
      subject,
      html,
      replyTo: data.email,
    });
  } catch (err) {
    console.error("job_application email failed (row still saved):", err);
  }

  return { ok: true };
}
