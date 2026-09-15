"use client";

import { useEffect } from "react";

import { setLabPref, useLabPrefs } from "./lab-prefs";

/**
 * Applies the lab's reading preferences to <html> (`data-lab-fit`,
 * `data-lab-bleed`) so design.css can lift a board page's max-width and tuck
 * the sidebar away, and shows the one control a board without a dock still
 * needs: the pill that brings the sidebar back. Mounted once by the lab layout.
 */
export function LabChrome() {
  const { fit, bleed } = useLabPrefs();
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-lab-fit", fit);
    if (bleed) html.setAttribute("data-lab-bleed", "");
    else html.removeAttribute("data-lab-bleed");
    return () => {
      html.removeAttribute("data-lab-fit");
      html.removeAttribute("data-lab-bleed");
    };
  }, [fit, bleed]);
  if (!bleed) return null;
  return (
    <button
      type="button"
      onClick={() => setLabPref("bleed", false)}
      className="lab-sidebar-pill fixed top-2 left-2 z-40 hidden rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
    >
      Sidebar
    </button>
  );
}
