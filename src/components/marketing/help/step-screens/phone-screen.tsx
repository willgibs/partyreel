"use client";

import dynamic from "next/dynamic";

import { PhoneDocument } from "./phone-document";
import { PHONE_SCREENS, type PhoneScreenId } from "./registry";

/**
 * A phone screen in a step's slot: the phone renders at once, at its final size, and the door's
 * pieces arrive only once the reader nears it (their chunk loads when `PhoneDocument` makes its
 * document, never with the article). A how-to with no phone screens never loads them at all.
 */
const DoorScreen = dynamic(
  () => import("./door-screens").then((mod) => mod.DoorScreen),
  { ssr: false },
);

export function PhoneScreen({ id }: { id: PhoneScreenId }) {
  return (
    <div data-step-screen={id} className="shrink-0">
      <PhoneDocument label={PHONE_SCREENS[id]}>
        <DoorScreen id={id} />
      </PhoneDocument>
    </div>
  );
}
