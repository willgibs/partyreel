"use server";

import { contactTopicLabel } from "@/lib/constants/contact";
import { contactFormEmail } from "@/lib/email/templates";
import {
  type PublicFormResult,
  submitPublicForm,
} from "@/lib/security/public-form-submit";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";

export type ContactResult = PublicFormResult;

/**
 * /contact's Server Function: the public forms' one pipeline (`public-form-submit.ts`: validate, the
 * honeypot, the rate gate, the row, the best-effort notification), with what is this form's own. The row
 * lands in the deny-all `contact_submissions`, which `/admin/support` reads.
 */
export async function submitContactForm(
  input: ContactInput,
): Promise<ContactResult> {
  return submitPublicForm(
    {
      kind: "contact",
      schema: contactSchema,
      plural: "messages",
      insert: (admin, data, userAgent) =>
        admin
          .from("contact_submissions")
          .insert({
            name: data.name,
            email: data.email,
            subject: data.subject?.trim() || null,
            message: data.message,
            topic: data.topic,
            source: "marketing_contact",
            user_agent: userAgent,
          })
          .select("id")
          .single(),
      notify: (data) => ({
        kind: "contact_form",
        mail: contactFormEmail({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          topic: contactTopicLabel(data.topic) ?? undefined,
        }),
      }),
    },
    input,
  );
}
