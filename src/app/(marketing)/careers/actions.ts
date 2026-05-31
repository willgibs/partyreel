"use server";

import { headers } from "next/headers";

import { getJob } from "@/lib/constants/careers";
import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { sendOnce } from "@/lib/email/send";
import { applicationReceivedEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { careerSchema, type CareerInput } from "@/lib/validation/careers";

export type CareerResult = { ok: true } | { ok: false; error: string };

export async function submitApplication(
  roleSlug: string,
  input: CareerInput,
): Promise<CareerResult> {
  const parsed = careerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const data = parsed.data;

  // Honeypot: real applicants leave this hidden field empty. Drop bots silently.
  if (data.website && data.website.trim() !== "") {
    return { ok: true };
  }

  const role = getJob(roleSlug);
  if (!role) {
    return { ok: false, error: "That role is no longer open." };
  }

  const admin = createAdminClient();
  const userAgent = (await headers()).get("user-agent")?.slice(0, 500) ?? null;

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
    return { ok: false, error: "Something went wrong. Please try again." };
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
