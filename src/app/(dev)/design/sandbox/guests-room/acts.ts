import type { DoorActs } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import type { InviteActs } from "@/app/(app)/dashboard/[eventId]/guests/invited-section";

import { INVITED } from "./fixtures";

/**
 * THE ROOM'S ACTS, ANSWERING AND CHANGING NOTHING: each one answers after a
 * round trip, as the Library's do, so a press in a frame reads as production's
 * press and writes nothing anywhere.
 */
const answered = <T>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 320));

export const INERT_DOOR: DoorActs = {
  letIn: async () => answered({ ok: true as const, admitted: 1 }),
  decline: async () => answered({ ok: true as const, blockId: "gr-block" }),
  letBackIn: async () =>
    answered({ ok: true as const, restored: 0, noRoom: 0, admitted: 1 }),
};

export const INERT_INVITES: InviteActs = {
  add: async (input) => {
    const emails = (input as { emails?: string[] }).emails ?? [];
    return answered({
      ok: true as const,
      result: {
        added: emails.length,
        already: 0,
        invalid: 0,
        overCap: 0,
        total: INVITED.length + emails.length,
        admitted: 0,
      },
    });
  },
  remove: async () => answered({ ok: true as const }),
};
