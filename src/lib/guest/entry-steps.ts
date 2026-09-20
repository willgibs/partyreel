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
 * - Owner: never (the host previewing their own event isn't a guest).
 * - The DEMO is a guest like any other now (Will, `arrival=role`, the sixth
 *   batch, 2026-09-20: "the demo welcome feels more correct for this generic
 *   guest welcome"). It always resolves `full` access, so `gateSteps` is
 *   already `[]` by construction (`gateStepsForAccess` below) — the demo
 *   simply falls out of the SAME welcome-then-gate machinery as a public
 *   event, one step (`welcome`) and no gate behind it. `entry-modal.tsx`
 *   reads its own `isDemo` prop to swap that step's COPY (a role, not an
 *   invitation); nothing here needs to know the difference.
 * - `autoOpen` for the welcome (first visit, the demo included) or a `password` gate (it IS the gated
 *   page - nothing to browse behind it). An `account`-only gate does NOT auto-open on a return visit:
 *   the guest browses the teaser and opens it from the "See all" caption (the soft-paywall lure).
 */
export function computeEntry(input: {
  gateSteps: GateStep[];
  welcomeSeen: boolean;
  isOwner: boolean;
}): { steps: EntryStep[]; autoOpen: boolean } {
  const { gateSteps, welcomeSeen, isOwner } = input;
  if (isOwner) return { steps: [], autoOpen: false };
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
 * password-before-account ordering falls out of the access progression. Owner/demo both resolve to
 * `full` (an owner is gated out of the modal entirely upstream; the demo takes the welcome step above).
 */
export function gateStepsForAccess(access: GalleryAccess): GateStep[] {
  if (access === "none") return ["password"];
  if (access === "teaser") return ["account"];
  return [];
}
