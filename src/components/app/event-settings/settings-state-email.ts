/**
 * THE EMAIL STEP A GATE HELD ON, AND HER OWN CHOICE BEFORE IT (crumbs-87, the gap audit's MEDIUM).
 *
 * Letting each person in and the invite list both match a confirmed address, so choosing either holds "An email first"
 * on (`events_gate_needs_email`, `set_event_door`), and the row says so while it stands: "On while you let each person in".
 * The database keeps no memory of what she had chosen, so a host with names only who tried a gate and went back to
 * Public found the switch still on, and the name-only guests already in met "Confirm your email to see everything".
 * "While" is a promise the page makes, so the page keeps it: when the door answers that a gate turned the step on
 * from off (`emailHeld`), this notes it, and when the door later leaves that gate the provider gives her choice back
 * (`settings-state.tsx`).
 *
 * ★ WHERE IT LIVES, AND WHY NOT THE DATABASE. It is noted on this device (`localStorage`, as every per-event mark here
 * is: `pr_develop:<eventId>`), beside a note for this page's life when storage is refused, so it survives a reload or a
 * phone's discarded tab and never reaches another device. A host who held the gate on her phone and leaves it on her
 * laptop gets today's behaviour (the switch stays on, live, one tap from off), never a wrong one: this only ever
 * gives back a choice the same device saw her make. The complete answer is the database remembering (a column the
 * gate sets when it turns the step on, and the door's own RPC and the password's both giving it back at one trigger),
 * which is a migration and so its own lane's.
 *
 * ★ HER OWN WORD ENDS IT: touching the switch herself forgets the note (`settings-state.tsx`'s `saveEvent`), and giving
 * her choice back consumes it. Nothing else does, a move from one gate to another least of all: the first gate's hold is
 * still standing then, the database answers that it turned nothing on (the step is already on), and that answer says
 * nothing about what she had before the first.
 *
 * Pure, bar the storage: the provider calls it from a handler or an effect, never a render.
 */
import type { Door } from "@/lib/event/door/door";

const KEY = (eventId: string) => `pr_email_off:${eventId}`;

/** This page's life, for a browser that refuses storage (a private window): the note holds until a reload. */
const noted = new Set<string>();

/** The gate turned "An email first" on from off: she had names only before it. */
export function rememberEmailWasOff(eventId: string): void {
  noted.add(eventId);
  try {
    localStorage.setItem(KEY(eventId), "1");
  } catch {
    // Storage refused: the note holds for this page's life, which is the visit a gate is usually tried in.
  }
}

/** Whether a gate turned the step on from off, as this device saw it. */
export function emailWasOff(eventId: string): boolean {
  if (noted.has(eventId)) return true;
  try {
    return localStorage.getItem(KEY(eventId)) === "1";
  } catch {
    return false;
  }
}

/** Her choice is back, or she made a new one, or the hold never turned it on: nothing to give back. */
export function forgetEmailWasOff(eventId: string): void {
  noted.delete(eventId);
  try {
    localStorage.removeItem(KEY(eventId));
  } catch {
    // Storage refused: the page's own note is gone, which is all there was.
  }
}

/**
 * Why it was on, in the row's own words (`door-page.tsx`'s "On while you let each person in" and "On while your invite
 * list is the way in"), said of the door that held it and is gone.
 */
export function emailHeldWhile(door: Door): string {
  return door === "invite"
    ? "while your invite list was the way in"
    : "while you let each person in";
}
