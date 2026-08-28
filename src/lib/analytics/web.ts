"use client";

/**
 * The client half of marketing web analytics (the pure taxonomy lives in
 * ./events.ts; the mount is components/marketing/system/web-analytics.tsx).
 *
 * Everything here must be SILENT-SAFE: analytics may never break the page.
 * track() can be reached with no script present (dev, surfaces without the
 * marketing island, Hobby-plan custom-event limits) and @vercel/analytics
 * throws on SSR in development by design, so every vendor call is wrapped.
 */

import { track as vendorTrack } from "@vercel/analytics";

import type { WebEvent, WebEventProps } from "./events";

/**
 * The per-browser opt-out: any value under this localStorage key mutes BOTH
 * Web Analytics and Speed Insights on that device (wired through beforeSend on
 * both components). Used by the red-team browser profiles so test traffic never
 * pollutes the tiny pre-launch numbers; humans can paste
 * `localStorage.setItem("pr-no-track", "1")` in the console for the same effect.
 */
export const NO_TRACK_KEY = "pr-no-track";

export function track(event: WebEvent, props?: WebEventProps): void {
  try {
    vendorTrack(event, props);
  } catch {
    // Swallow by contract (see the module header).
  }
}

/**
 * beforeSend for BOTH <Analytics> and <SpeedInsights>: drop everything when the
 * opt-out flag is set. Generic + structural so one function satisfies both
 * packages' event types; storage failures (SSR, privacy modes) default to
 * sending, since the flag is a testing convenience, not a consent gate.
 */
export function beforeSendDrop<E>(event: E): E | null {
  try {
    if (window.localStorage.getItem(NO_TRACK_KEY) !== null) return null;
  } catch {
    // No window/storage here: treat as not opted out.
  }
  return event;
}
