"use client";

import type { createEventInWizard } from "@/app/(app)/dashboard/actions";
import { CreateEventWizard } from "@/components/app/create-event-wizard";

import { EVENT, NAME } from "../fixtures";

import { useInUse } from "./in-use";
import { busy, byText, pin } from "./pins";
import type { ScreenProps } from "./screen-props";
import { typeInto } from "./type-into";

/**
 * CREATE'S STEPS: production's Create, the dark room of its own (create-wizard
 * r1 and r2, dark in both themes), with its Server Action handed a stand-in
 * that answers after a real round trip and makes nothing, as the wizard's own
 * `create` prop allows a specimen to.
 *
 * Caught in the trait's moment: the name typed and Continue held down (a
 * press) or reached by the keyboard (a focus); the code's look chosen (a
 * selection, the four swatches) with Create event at the foot (a button) or
 * working (loading); the name typed, at rest, for the rest.
 *
 * ★ THE NAME IS NOT A FIELD IN A BOX (create-wizard's `asks=one`: "One field on
 * a rule, never in a box"), so the scene hands it no field atom
 * (`scene/adopt.ts`): the field trait is judged on the other screens, and
 * Create carries the key at its foot, its close and its swatches.
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

const nameField = () =>
  document.querySelector<HTMLInputElement>("[data-room-name-input]");
const foot = (words: string) => byText<HTMLButtonElement>("button", words);

/** Her name typed, as she types it. */
const NAMED: readonly (readonly [number, () => void])[] = [
  [
    700,
    () => {
      const field = nameField();
      if (field) typeInto(field, NAME);
    },
  ],
];

/** On to the look: the name typed and Continue pressed for real. */
const TO_LOOK: readonly (readonly [number, () => void])[] = [
  ...NAMED,
  [1000, () => foot("Continue")?.click()],
];

function createScript(
  moment: ScreenProps["moment"],
): readonly (readonly [number, () => void])[] {
  switch (moment) {
    case "press":
      return [...NAMED, [1100, () => pin(foot("Continue"), "press")]];
    case "focus":
      return [...NAMED, [1100, () => pin(foot("Continue"), "focus")]];
    case "selected":
    case "button":
      return TO_LOOK;
    case "loading":
      return [...TO_LOOK, [1900, () => busy(foot("Create event"))]];
    default:
      return NAMED;
  }
}

export function CreateScreen({ moment }: ScreenProps) {
  useInUse(createScript(moment));
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
