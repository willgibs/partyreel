/**
 * Guest join form schema. The REQUIRED fields depend on the event's `require_*`
 * flags, so the schema is built per-event. The server RPC (`create_guest`) is the
 * authority; this drives client-side UX. Output type is uniform regardless of
 * flags so the form can type it statically.
 */
import { z } from "zod";

export type JoinValues = { display_name: string; email: string };

export function buildJoinSchema(
  requireDisplayName: boolean,
  requireEmail: boolean,
) {
  return z
    .object({
      display_name: z.string().trim().max(80),
      email: z.string().trim(),
    })
    .superRefine((val, ctx) => {
      if (requireDisplayName && val.display_name.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["display_name"],
          message: "Add your name so people know it's you.",
        });
      }
      if (val.email.length > 0 && !z.email().safeParse(val.email).success) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Enter a valid email.",
        });
      }
      if (requireEmail && val.email.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Enter your email to join.",
        });
      }
    });
}
