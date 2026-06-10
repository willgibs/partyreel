/**
 * Pure step-derivation for the guest entry modal (`entry-modal.tsx`). Kept separate + pure so it is
 * unit-testable and has no client/server imports.
 *
 * The modal's CURRENT step is always `steps[0]`: completed gates drop from `gateSteps` server-side
 * after a `router.refresh()`, and the welcome drops once it's been seen (a client localStorage flag).
 */
import type { GalleryAccess } from "@/lib/events/gallery-access";

export type EntryStep = "welcome" | "password" | "account";
// The gate steps the SERVER computes (ordered: password BEFORE account); the welcome is client-state.
export type GateStep = "password" | "account";

/**
 * Derive the ordered steps + whether the modal should auto-open on load.
 *
 * - Owner / demo: never (the host previewing isn't a guest; the demo is always `full`).
 * - `autoOpen` for the welcome (first visit) or a `password` gate (it IS the gated page - nothing to
 *   browse behind it). An `account`-only gate does NOT auto-open on a return visit: the guest browses
 *   the teaser and opens it from the "See all" caption (the soft-paywall lure).
 */
export function computeEntry(input: {
  gateSteps: GateStep[];
  welcomeSeen: boolean;
  isOwner: boolean;
  isDemo: boolean;
}): { steps: EntryStep[]; autoOpen: boolean } {
  const { gateSteps, welcomeSeen, isOwner, isDemo } = input;
  if (isOwner || isDemo) return { steps: [], autoOpen: false };
  const steps: EntryStep[] = [
    ...(welcomeSeen ? [] : (["welcome"] as const)),
    ...gateSteps,
  ];
  const autoOpen = steps[0] === "welcome" || steps[0] === "password";
  return { steps, autoOpen };
}

/**
 * The current gate for a resolved access level. `access` already encodes the NEXT unsatisfied gate and
 * progresses as each is satisfied (`none` -> password not unlocked; after unlock -> `teaser` if an
 * account is also required; `full` once in). So at most ONE gate is current at a time, and the
 * password-before-account ordering falls out of the access progression. Owner/demo resolve to `full`.
 */
export function gateStepsForAccess(access: GalleryAccess): GateStep[] {
  if (access === "none") return ["password"];
  if (access === "teaser") return ["account"];
  return [];
}
