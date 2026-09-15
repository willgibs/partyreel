"use client";

import { useEffect } from "react";

import { useLabPrefs } from "./lab-prefs";

/**
 * Applies the lab's reading preferences to <html> (`data-lab-fit`,
 * `data-lab-sidebar`) so design.css can lift a wide page's max-width and tuck
 * the sidebar away on a board. Mounted once by the shell layout; the shell's
 * top bar carries the control that brings the sidebar back, so this renders
 * nothing of its own.
 */
export function LabChrome() {
  const { fit, sidebar } = useLabPrefs();
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-lab-fit", fit);
    html.setAttribute("data-lab-sidebar", sidebar);
    return () => {
      html.removeAttribute("data-lab-fit");
      html.removeAttribute("data-lab-sidebar");
    };
  }, [fit, sidebar]);
  return null;
}
