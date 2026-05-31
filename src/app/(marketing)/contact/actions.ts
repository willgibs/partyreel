"use server";

import { headers } from "next/headers";

import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { sendOnce } from "@/lib/email/send";
import { contactFormEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitContactForm(
  input: ContactInput,
): Promise<ContactResult> {
  // Re-validate server-side — never trust the client.
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const data = parsed.data;

  // Honeypot: real users leave this hidden field empty. Pretend success, store nothing.
  if (data.website && data.website.trim() !== "") {
    return { ok: true };
  }

  const admin = createAdminClient();
  const userAgent = (await headers()).get("user-agent")?.slice(0, 500) ?? null;

  // The DB row is AUTHORITATIVE — written via the service-role admin client into the
  // deny-all contact_submissions table.
  const { data: row, error } = await admin
    .from("contact_submissions")
    .insert({
      name: data.name,
      email: data.email,
      subject: data.subject?.trim() || null,
      message: data.message,
      source: "marketing_contact",
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("contact_submissions insert failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Best-effort notification — a missing/unconfigured/failed email must NEVER cost the
  // user their message (the row above is already saved). dedupeKey = the row id makes a
  // double-submit idempotent.
  try {
    const to = serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL;
    const { subject, html } = contactFormEmail({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });
    await sendOnce({
      kind: "contact_form",
      dedupeKey: row.id,
      to,
      subject,
      html,
      replyTo: data.email,
    });
  } catch (err) {
    console.error("contact_form email failed (row still saved):", err);
  }

  return { ok: true };
}
