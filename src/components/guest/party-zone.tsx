"use client";

/**
 * THE PARTY'S ZONE, FOR WORDS ONLY (crumbs-85): the guest page hands its album's zone (`events.time_zone`) to everything
 * that says a develop time, so a far party's guest reads it in both clocks ("Sun, Oct 4 at 9 am in Bali, 6 pm yours",
 * `developsWhen`). ★ NEVER THE ORDER: the album turns on its own state, her close or the develop's instant
 * (`albumOwnSort`, AY1), and no zone is read for it; this is the place a time is named in, nothing else. Null where
 * the page names none (a lock hides where the party is, the demo is everywhere), and every time is then her own clock,
 * as before.
 *
 * A context rather than a prop through the album's twenty files: the slot, the camera (in its portal), her tracker and
 * the failure sheet each say a develop time, and each reads it here.
 */
import { createContext, use } from "react";

export const PartyZoneContext = createContext<string | null>(null);

/** The party's zone for words, or null: her own clock. */
export function usePartyZone(): string | null {
  return use(PartyZoneContext);
}
