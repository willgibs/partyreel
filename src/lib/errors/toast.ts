/**
 * Error-to-toast helpers (client side). The ONE way new code surfaces a
 * failed action: pass the result (or code), get consistent sonner copy with
 * the taxonomy's fallbacks. Existing toast.error call sites migrate to these
 * surface-by-surface in their owning phases.
 */
import { toast } from "sonner";

import { messageFor } from "./codes";

/** Show the standard error toast for a code, with optional producer copy. */
export function showErrorToast(code: string, message?: string): void {
  toast.error(messageFor(code, message));
}

/**
 * Show the right toast for any `{ ok: false, code, message? }` result arm
 * (the canonical failure shape across mutations, actions, and API routes).
 * Accepts the loose shape so every existing per-file result type fits.
 */
export function showActionError(result: {
  ok: false;
  code: string;
  message?: string;
}): void {
  showErrorToast(result.code, result.message);
}
