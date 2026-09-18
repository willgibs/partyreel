"use client";

import { useEffect, useState } from "react";

import { LAB_CSS_GENERATION } from "./lab-css-generation";
import { useLabPrefs } from "./lab-prefs";

/**
 * Applies the lab's reading preferences to <html> (`data-lab-fit`,
 * `data-lab-sidebar`) so design.css can lift a wide page's max-width and tuck
 * the sidebar away on a board. Mounted once by the shell layout.
 *
 * ★ AND IT PROVES THE STYLESHEET IS THE CURRENT ONE (the revamp, 2026-09-16).
 * `next dev` names CSS chunks by path, so a browser can keep an old copy of
 * design.css after the file changed; Will's held one from before the shell
 * grid existed, and the lab collapsed into one column with nothing erroring.
 * design.css writes `--lab-css-generation` on `.lab-shell`; after mount this
 * reads it back, and a missing or older number (or a shell body that does not
 * compute to `grid`, the zero-maintenance backstop) is a stale sheet. In
 * development the page reloads itself ONCE (a sessionStorage flag keyed by
 * the generation stops a loop); everywhere else, and after that one reload,
 * a notice says what to do. The strip is styled inline because the very
 * stylesheet it reports on may be the stale one.
 */

const RELOAD_FLAG = "partyreel.lab.css-reload";

/** What the page's stylesheet says its generation is; null when it says nothing. */
export function readLabCssGeneration(): number | null {
  const shell = document.querySelector(".lab-shell");
  if (!shell) return null;
  const raw = getComputedStyle(shell).getPropertyValue("--lab-css-generation");
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** True when the shell is on the page and its stylesheet is missing or old. */
export function labStylesheetIsStale(): boolean {
  const shell = document.querySelector(".lab-shell");
  if (!shell) return false;
  const generation = readLabCssGeneration();
  if (generation === null || generation < LAB_CSS_GENERATION) return true;
  const body = shell.querySelector(".lab-shell-body");
  return body !== null && getComputedStyle(body).display !== "grid";
}

export function LabChrome({
  autoReload = process.env.NODE_ENV === "development",
}: {
  /** Reload once on a stale sheet (development); otherwise only the notice. */
  autoReload?: boolean;
} = {}) {
  const { fit, sidebar } = useLabPrefs();
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-lab-fit", fit);
    html.setAttribute("data-lab-sidebar", sidebar);
    return () => {
      html.removeAttribute("data-lab-fit");
      html.removeAttribute("data-lab-sidebar");
    };
  }, [fit, sidebar]);

  useEffect(() => {
    const flag = String(LAB_CSS_GENERATION);
    const check = () => {
      if (!labStylesheetIsStale()) {
        try {
          sessionStorage.removeItem(RELOAD_FLAG);
        } catch {
          // A blocked store changes nothing: fresh is fresh.
        }
        setStale(false);
        return;
      }
      let reloaded = false;
      try {
        reloaded = sessionStorage.getItem(RELOAD_FLAG) === flag;
      } catch {
        // No store: treat as already reloaded, so the notice shows rather
        // than a reload that could never be remembered.
        reloaded = true;
      }
      if (autoReload && !reloaded) {
        try {
          sessionStorage.setItem(RELOAD_FLAG, flag);
        } catch {
          // Unreachable: a blocked store set `reloaded` above.
        }
        window.location.reload();
        return;
      }
      setStale(true);
    };
    // One frame, so the stylesheet has been applied before it is read.
    const raf = requestAnimationFrame(check);
    // A back/forward-cache restore is the other way an old sheet comes back.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) check();
    };
    window.addEventListener("pageshow", onShow);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pageshow", onShow);
    };
  }, [autoReload]);

  if (!stale) return null;
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: "var(--lab-topbar-h, 48px)",
        zIndex: 60,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px 16px",
        padding: "10px 16px",
        background: "#b91c1c",
        color: "#ffffff",
        font: "500 14px/1.4 var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <span>
        Your browser, or the dev server, is holding an old copy of the
        lab&rsquo;s stylesheet, so this page is laid out wrong. Reload it, or
        hold Shift while reloading. If it comes back, the server&rsquo;s own
        cache is stale: stop it, delete <code>.next/dev</code>, start it again.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          padding: "4px 10px",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: "6px",
          background: "transparent",
          color: "inherit",
          font: "inherit",
          cursor: "pointer",
        }}
      >
        Reload
      </button>
    </div>
  );
}
