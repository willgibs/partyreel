"use client";

import { useInUse } from "../in-use";
import type { ScreenProps } from "../screen-props";

import { HubPage } from "./hub";

/**
 * A DELETE CONFIRM OVER THE HUB (the carried call `veil`, A3: "heavy on
 * paper?"): Maya is clearing three photographs out of the album, selecting,
 * and has pressed the bar's Delete, so production's confirm stands over her
 * hub with its half-black veil: "Remove 3 items?", Cancel and Remove.
 *
 * ★ THE CONFIRM IS THE BULK BAR'S OWN (`bulk-bar.tsx`: `<PopupContent
 * kind="confirm">`, centred at both widths by the one table), opened the real
 * way, by a press on Delete once the page has settled; Remove runs nothing.
 * It is the confirm every removal in the product wears (an event's Delete in
 * Settings is the same element, stacked over the panel).
 */

/** The bar's Delete, found the way a test finds it: by its name. */
const deleteKey = () =>
  document.querySelector<HTMLButtonElement>('button[aria-label="Delete"]');

const PRESS_DELETE: readonly (readonly [number, () => void])[] = [
  // The bar's tooltips mount a tick after hydration; the press waits for them.
  [700, () => deleteKey()?.click()],
];

export function ConfirmScreen({ w }: ScreenProps) {
  useInUse(PRESS_DELETE);
  return <HubPage w={w} selecting />;
}
