"use server";

import { getJob } from "@/lib/constants/careers";
import { applicationReceivedEmail } from "@/lib/email/templates";
import {
  type PublicFormResult,
  submitPublicForm,
} from "@/lib/security/public-form-submit";
import { careerSchema, type CareerInput } from "@/lib/validation/careers";

export type CareerResult = PublicFormResult<"not_found">;

/**
 * A job application's Server Function: the public forms' one pipeline (`public-form-submit.ts`:
 * validate, the honeypot, the rate gate, the row, the best-effort notification), with what is this
 * form's own: a role that has closed is refused before the limiter spends anything, and the row lands in
 * the deny-all `job_applications`, which `/admin/applicants` reads.
 */
export async function submitApplication(
  roleSlug: string,
  input: CareerInput,
): Promise<CareerResult> {
  // Read once, before the pipeline: the refusal and the notification name the same role.
  const role = getJob(roleSlug);
  return submitPublicForm(
    {
      kind: "careers",
      schema: careerSchema,
      plural: "applications",
      refuse: () =>
        role
          ? null
          : {
              code: "not_found" as const,
              message: "That role is no longer open.",
            },
      insert: (admin, data, userAgent) =>
        admin
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
          .single(),
      notify: (data) => ({
        kind: "job_application",
        mail: applicationReceivedEmail({
          // `refuse` has already turned away a role that is gone.
          role: role?.title ?? roleSlug,
          name: data.name,
          email: data.email,
          links: data.links,
          message: data.message,
        }),
      }),
    },
    input,
  );
}
