import { z } from "zod";

/**
 * THE PUBLIC FORMS' ONE CONTRACT, ITS FIELDS HALF (/contact and a job application; the write half is
 * `lib/security/public-form-submit.ts`). Both forms ask who you are and what you have to say, and both
 * carry the same hidden field a bot fills, so those live here once and each form's schema adds its own
 * (the contact topic and subject, the application's work links).
 *
 * Shared by each client form (through zodResolver) and its Server Function, which validates again: the
 * client is never trusted.
 */

/**
 * ★ THE HONEYPOT IS NAMED FOR NOTHING REAL. It is a hidden input a person never sees and a bot that
 * fills every field fills; a submission that carries it is answered as a success and stored nowhere.
 * It used to be `website`, which is a real field: a password manager's identity item and a browser's
 * contact card both carry one, so an autofill could fill it for a real person and their note vanished
 * behind a success screen. `lantern` names no autofill category.
 */
export const HONEYPOT_FIELD = "lantern";

/** Whether a parsed submission filled the honeypot (whitespace is no fill: a person never typed it). */
export function isHoneypotFilled(data: { [HONEYPOT_FIELD]?: string }) {
  return (data[HONEYPOT_FIELD] ?? "").trim() !== "";
}

/** The fields every public form asks, with the same words for the same mistakes. */
export const publicFormFields = {
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(100, "Name is too long (100 characters max)."),
  email: z.email("Please enter a valid email address."),
  [HONEYPOT_FIELD]: z.string().optional(),
};

/** The free-text note at a form's heart: at least a line, at most 5,000 characters. */
export function noteField(tooShort: string) {
  return z
    .string()
    .trim()
    .min(10, tooShort)
    .max(5000, "Message is too long (5,000 characters max).");
}
