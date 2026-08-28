"use client";

/**
 * The single marketing analytics island: Vercel Web Analytics + Speed Insights
 * plus the delegated [data-track] click listener. Mounted ONCE in the
 * (marketing) group layout, so it persists across every marketing navigation
 * and never exists on the app/guest/admin surfaces (that placement IS the
 * scoping mechanism: data-track attributes on shared components only ever fire
 * here). Both vendor components get the same beforeSendDrop opt-out guard.
 *
 * The listener runs in the CAPTURE phase: Radix-based chrome (mega panel, the
 * mobile sheet) can stop propagation in the bubble phase and would swallow
 * clicks before a bubble listener saw them. Reading the nearest [data-track]
 * ancestor keeps instrumentation declarative (see lib/analytics/events.ts).
 * Known accepted gap: middle-click opens fire auxclick, not click.
 */

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";

import {
  WEB_EVENTS,
  type WebEvent,
  type WebEventProps,
} from "@/lib/analytics/events";
import { beforeSendDrop, track } from "@/lib/analytics/web";

function isWebEvent(value: string): value is WebEvent {
  return (WEB_EVENTS as readonly string[]).includes(value);
}

export function WebAnalytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const name = el.dataset.track;
      if (!name || !isWebEvent(name)) return;
      // data-track-cta -> dataset.trackCta -> prop "cta" (single-word keys only).
      const props: WebEventProps = {};
      for (const [key, value] of Object.entries(el.dataset)) {
        if (key !== "track" && key.startsWith("track") && value !== undefined) {
          props[key.charAt(5).toLowerCase() + key.slice(6)] = value;
        }
      }
      track(name, Object.keys(props).length > 0 ? props : undefined);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <>
      <Analytics beforeSend={beforeSendDrop} />
      <SpeedInsights beforeSend={beforeSendDrop} />
    </>
  );
}
