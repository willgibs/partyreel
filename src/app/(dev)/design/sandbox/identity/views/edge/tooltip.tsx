"use client";

import { useInUse } from "../in-use";
import type { ScreenProps } from "../screen-props";

import { HubPage } from "./hub";

/**
 * A TOOLTIP AT A DESK: Maya, selecting three photographs on her hub, rests her
 * pointer on the bar's Download, and its label stands over the key, the
 * display's capsule with its diamond (`TooltipSlide`, the bulk bar's sliding
 * tooltip: `ui/tooltip.tsx`'s own composition). Drawn at a laptop whatever
 * the width asked (a tap opens no tooltip: `TooltipTrigger`'s own rule).
 *
 * ★ OPENED THE WAY A CURSOR OPENS IT: a mouse's pointer moving over the key
 * once the page has settled (Radix opens a tooltip on the trigger's
 * pointermove), never a focus, so no focus mark is drawn that no person saw.
 */

const downloadKey = () =>
  document.querySelector<HTMLButtonElement>('button[aria-label="Download"]');

const HOVER_DOWNLOAD: readonly (readonly [number, () => void])[] = [
  [
    800,
    () =>
      downloadKey()?.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          pointerType: "mouse",
        }),
      ),
  ],
];

export function TooltipScreen({ w }: ScreenProps) {
  useInUse(HOVER_DOWNLOAD);
  return <HubPage w={w} selecting />;
}
