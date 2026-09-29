/**
 * THE DOOR: WHAT AN EVENT'S LINK OPENS (event-settings r1, Will 2026-09-29, `join=steps`).
 *
 * Step one is Public, Private or Only me; Private keeps a gate: a password, the host lets each person
 * in, an invite list, or only people already in. So the door is one state of six, and this module is
 * where the six are named and mapped to what the database stores.
 *
 * ★ A GATED ALBUM IS STORED PRIVATE, WITH ITS GATE (migration 20260929120000). `events.visibility`
 * keeps its three values (open, password, private) and `events.gate` refines private into approve,
 * invite or closed, so every reader that has not learned the gate answers a gated album as a private
 * one: the safe side, and what a newcomer at a gate is shown. `doorOf` is the one reading of the pair;
 * nothing else compares `visibility` to 'private' to mean Only me.
 *
 * ★ THE WORDS ARE THE UI'S, THE VALUES THE DATA'S (his brief: "name the enum's values however the data
 * wants"). `open` reads Public, `private` reads Only me; the host-facing words live in
 * `lib/events/visibility-labels.ts`, the one home that words the door everywhere.
 *
 * Pure and client-safe: the settings, the hub, the guest page and the routes all read it.
 */

/** The six doors, open to closed. */
export const DOORS = [
  "open",
  "password",
  "approve",
  "invite",
  "closed",
  "private",
] as const;
export type Door = (typeof DOORS)[number];

/** The gates a Private album keeps beside the password (`public.event_gate`). */
export const DOOR_GATES = ["approve", "invite", "closed"] as const;
export type DoorGate = (typeof DOOR_GATES)[number];

/** Step one's three answers: what the link opens. */
export type DoorStep = "public" | "private" | "only_me";

/** Every gate a Private album can keep, the password first (the order the door page draws them). */
export const PRIVATE_GATES = ["password", "approve", "invite", "closed"] as const;
export type PrivateGate = (typeof PRIVATE_GATES)[number];

export function isDoor(value: unknown): value is Door {
  return typeof value === "string" && (DOORS as readonly string[]).includes(value);
}

function isDoorGate(value: unknown): value is DoorGate {
  return (
    typeof value === "string" && (DOOR_GATES as readonly string[]).includes(value)
  );
}

/**
 * The door a stored pair names. ★ FAILS CLOSED: a visibility this build does not know, or a private
 * album with a gate it does not know, reads as Only me, never as anything a newcomer could walk into.
 */
export function doorOf(visibility: string, gate: string | null | undefined): Door {
  if (visibility === "open") return "open";
  if (visibility === "password") return "password";
  if (visibility === "private" && isDoorGate(gate)) return gate;
  return "private";
}

/** The pair a door is stored as (set_event_door's own mapping, which writes it). */
export function storedDoor(door: Door): {
  visibility: "open" | "password" | "private";
  gate: DoorGate | null;
} {
  if (door === "open" || door === "password") {
    return { visibility: door, gate: null };
  }
  return { visibility: "private", gate: door === "private" ? null : door };
}

/** Step one: Public, Private (any gate, the password included) or Only me. */
export function stepOf(door: Door): DoorStep {
  if (door === "open") return "public";
  if (door === "private") return "only_me";
  return "private";
}

/** The gate a Private door keeps, or null for Public and Only me. */
export function gateOf(door: Door): PrivateGate | null {
  return door === "open" || door === "private" ? null : door;
}

/**
 * ★ A GATE THAT KEYS ON AN ADDRESS HOLDS THE EMAIL STEP ON: letting people in and the invite list both
 * match a confirmed address, so neither can take a typed name (the `events_gate_needs_email` CHECK).
 */
export function holdsEmailOn(door: Door): boolean {
  return door === "approve" || door === "invite";
}

/**
 * Whether the album's contents are behind the door rather than open to the link alone: the password
 * and the three gates. Its guests read through the server's door-checked reads, never the anon album
 * read (which serves an open album only).
 */
export function behindDoor(door: Door): boolean {
  return door !== "open" && door !== "private";
}

/**
 * Where step one lands when the host picks it: Public and Only me are whole doors; Private takes the
 * gate the album already keeps, else the password when one is set (a dormant password comes back), else
 * only people already in (the gate that changes nothing for anyone inside and stops every stranger).
 */
export function doorForStep(
  step: DoorStep,
  current: Door,
  hasPassword: boolean,
): Door {
  if (step === "public") return "open";
  if (step === "only_me") return "private";
  const gate = gateOf(current);
  if (gate) return gate;
  return hasPassword ? "password" : "closed";
}
