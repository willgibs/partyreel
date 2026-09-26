import { useEffect } from "react";

/**
 * Guards a HARD navigation (reload, tab close, typing a new URL) while there are
 * unsaved changes: registers a `beforeunload` handler only while `dirty`, and tears
 * it down the moment the form is clean (or the component unmounts). The browser shows
 * its own native "leave site?" prompt - the copy and buttons are not customizable.
 *
 * SCOPE: this covers HARD navigations only. The SOFT ways out of the settings sheet
 * (its scrim, Escape and close button) are guarded by the sheet itself, with a confirm
 * Dialog (event-settings-sheet.tsx).
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
