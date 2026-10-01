import type { UseFormRegisterReturn } from "react-hook-form";

/**
 * THE PUBLIC FORMS' HONEYPOT (its name and its reason: `lib/validation/public-form.ts`): an input no
 * person sees, reaches or hears (not displayed, out of the tab order, hidden from assistive technology),
 * which a bot that fills every field fills. The Server Function answers that submission as a success and
 * stores nothing (`public-form-submit.ts`).
 */
export function HoneypotField({
  registration,
}: {
  registration: UseFormRegisterReturn;
}) {
  return (
    <input
      type="text"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="hidden"
      {...registration}
    />
  );
}
