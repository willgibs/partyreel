import { useEffect } from "react";

/**
 * Guards a HARD navigation (reload, tab close, typing a new URL) while there are
 * unsaved changes: registers a `beforeunload` handler only while `dirty`, and tears
 * it down the moment the form is clean (or the component unmounts). The browser shows
 * its own native "leave site?" prompt - the copy and buttons are not customizable.
 *
 * SCOPE: this covers HARD navigations only. SOFT (client-side) navigation away from
 * the settings page is guarded separately, at the back-link (onNavigate -> a confirm
 * Dialog, in settings-with-guard.tsx). Out of scope BY DESIGN: every other app-shell
 * link and the browser BACK button (popstate) - see the wrapper.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      // preventDefault + assigning returnValue is the cross-browser incantation that
      // triggers the native confirmation. The string is ignored by modern browsers.
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
