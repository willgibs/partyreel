"use client"

import * as React from "react"

/**
 * WHERE A LAYER PORTALS (lab-sitting, 2026-10-01): every radix `Portal` in the
 * product reads its container here.
 *
 * Nothing in the product provides one, so every layer lands where radix puts
 * it by default, on `document.body`, exactly as before. The one provider is
 * the design lab's `Frame`: a production page drawn into a frame is the lab's
 * React tree in the frame's document, and radix's default `document` is the
 * lab's, so a popup, a menu or a tooltip opened over the lab, at the lab's
 * coordinates, rather than inside the page it belongs to. The frame hands its
 * own body here, and the layer opens where the page is.
 *
 * `portal-container.test.ts` holds every `.Portal` in the product to it.
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null)

export const PortalContainerProvider = PortalContainerContext.Provider

/** The element a layer portals into; undefined is radix's own default, the body. */
export function usePortalContainer(): HTMLElement | undefined {
  return React.useContext(PortalContainerContext) ?? undefined
}
