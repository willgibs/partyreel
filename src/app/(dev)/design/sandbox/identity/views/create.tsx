"use client";

import type { createEventInWizard } from "@/app/(app)/dashboard/actions";
import { CreateEventWizard } from "@/components/app/create-event-wizard";

import { EVENT, NAME } from "../fixtures";

import { useInUse } from "./in-use";
import { busy, byText } from "./pins";
import { typeInto } from "./type-into";

/**
 * CREATE'S FOOT, WORKING: production's Create, the dark room of its own
 * (create-wizard r1 to r3, dark in both themes), walked the real way to its
 * last step (her name typed, Continue, the album's style, Continue) and caught
 * as its foot's one key works: Create event, the wizard's one real wait
 * (Continue moves on at once, so a working Continue would be a picture of a
 * wait that never happens). Its Server Action is handed a stand-in that
 * answers after a round trip and makes nothing, as the wizard's own `create`
 * prop allows a specimen to.
 *
 * ★ THE NAME IS NOT A FIELD IN A BOX (create-wizard's `asks=one`: "One field on
 * a rule, never in a box"), so the scene hands it no field atom
 * (`scene/adopt.ts`): Create carries the key at its foot, in the room.
 */

/** The stand-in Create: a round trip's wait, then Maya's event, made nowhere. */
const createNowhere: typeof createEventInWizard = (input) =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          ok: true,
          event: {
            id: EVENT.id,
            name: input.name,
            qr_token: EVENT.qr_token,
            qr_style: input.qr_style ?? "classic",
          },
        }),
      600,
    ),
  );

const foot = (words: string) => byText<HTMLButtonElement>("button", words);

/** Her name typed, then on through the style to the look, and Create event working. */
const TO_THE_FOOT: readonly (readonly [number, () => void])[] = [
  [
    700,
    () => {
      const field = document.querySelector<HTMLInputElement>(
        "[data-room-name-input]",
      );
      if (field) typeInto(field, NAME);
    },
  ],
  [1000, () => foot("Continue")?.click()],
  [1700, () => foot("Continue")?.click()],
  [2500, () => busy(foot("Create event"), "Creating your event")],
];

export function CreateScreen() {
  useInUse(TO_THE_FOOT);
  return (
    <CreateEventWizard
      siteUrl="https://partyreel.com"
      planName="Event Pass"
      tier="event_pass"
      atCap={false}
      maxEvents={null}
      cappedEvents={[]}
      storagePct={33}
      create={createNowhere}
    />
  );
}
