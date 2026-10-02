/**
 * THE PUBLIC FORMS' ONE CONTRACT, ITS WRITE HALF (/contact and a job application; the fields half is
 * `lib/validation/public-form.ts`). The two Server Functions were parallel copies of one pipeline, and a
 * fix to either had to be remembered in the other; now each names only what is its own (its schema, its
 * table's row, its notification) and this runs the steps in their one order:
 *
 *   1. VALIDATE again on the server: the client is never trusted.
 *   2. THE HONEYPOT, before anything is spent: a filled one answers success and stores nothing, so a bot
 *      learns nothing, and it never spends the rate budget of a real person sharing its office address.
 *   3. The form's own refusal, if it has one (a role that has closed), still before the limiter.
 *   4. THE RATE GATE, which fails closed (`public-form-limit.ts` says why these two forms alone do).
 *   5. THE ROW, on the service-role client into the form's deny-all table: authoritative.
 *   6. THE NOTIFICATION, best effort: `sendOnce` keyed on the row's id (a double submit notifies once),
 *      replying to the sender; a missing key, an unset inbox or a failed send is logged and swallowed,
 *      never changing what the visitor sees, because the row is already saved.
 *
 * No anon RPC and no anon grant sit behind either form, so neither adds an anon-executable surface.
 */
import "server-only";

import { headers } from "next/headers";
import type { z } from "zod";

import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { sendOnce } from "@/lib/email/send";
import type { Mail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env";
import {
  checkPublicFormRate,
  type PublicFormKind,
} from "@/lib/security/public-form-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/validation/public-form";

/** What a public form's Server Function answers: the failure arm carries a taxonomy code, and the
 *  client resolves its copy through `showActionError`, so `message` is only an override. */
export type PublicFormResult<Refusal extends string = never> =
  | { ok: true }
  | {
      ok: false;
      code: "validation" | "send_failed" | "rate_limited" | Refusal;
      message?: string;
    };

/** The parsed fields every public form carries (`publicFormFields`). */
type PublicFields = { name: string; email: string; [HONEYPOT_FIELD]?: string };

type AdminClient = ReturnType<typeof createAdminClient>;

export type PublicFormSpec<
  Schema extends z.ZodType<PublicFields>,
  Refusal extends string,
> = {
  /** The limiter's bucket. */
  kind: PublicFormKind;
  schema: Schema;
  /** What the limiter's refusal calls one submission, plural ("messages", "applications"). */
  plural: string;
  /** The form's own refusal, decided before the limiter spends anything. */
  refuse?: (
    data: z.infer<Schema>,
  ) => { code: Refusal; message?: string } | null;
  /** The row, written into the form's deny-all table; the insert's own answer. */
  insert: (
    admin: AdminClient,
    data: z.infer<Schema>,
    userAgent: string | null,
  ) => PromiseLike<{ data: { id: string } | null; error: unknown }>;
  /** The notification: its `sendOnce` kind, and the mail. */
  notify: (data: z.infer<Schema>) => { kind: string; mail: Mail };
};

export async function submitPublicForm<
  Schema extends z.ZodType<PublicFields>,
  Refusal extends string = never,
>(
  spec: PublicFormSpec<Schema, Refusal>,
  input: unknown,
): Promise<PublicFormResult<Refusal>> {
  const parsed = spec.schema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  const data = parsed.data;

  if (isHoneypotFilled(data)) return { ok: true };

  const refusal = spec.refuse?.(data);
  if (refusal) return { ok: false, ...refusal };

  const requestHeaders = await headers();
  const gate = await checkPublicFormRate(spec.kind, requestHeaders);
  if (!gate.allowed) {
    return {
      ok: false,
      code: "rate_limited",
      message:
        gate.reason === "rate_limited"
          ? `That is a lot of ${spec.plural} from this network. Please try again in a bit.`
          : "We could not accept that just now. Please try again in a minute.",
    };
  }

  const admin = createAdminClient();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) ?? null;
  const { data: row, error } = await spec.insert(admin, data, userAgent);
  if (error || !row) {
    console.error(`public form "${spec.kind}" insert failed:`, error);
    return { ok: false, code: "send_failed" };
  }

  try {
    const { kind, mail } = spec.notify(data);
    await sendOnce({
      kind,
      dedupeKey: row.id,
      to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: data.email,
    });
  } catch (err) {
    console.error(
      `public form "${spec.kind}" email failed (row still saved):`,
      err,
    );
  }

  return { ok: true };
}
