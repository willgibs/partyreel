"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * COPYING A LINK, ONCE, FOR EVERY SURFACE THAT DOES IT. The hub copies the
 * event link from three places (the subtle row under the metadata, the
 * mini-modal, the share sheet) and all three owe the same three things: the
 * PERMANENT url on the clipboard, an in-place confirmation rather than a toast
 * (Will's `share` note puts the control under the reader's eye — a toast in the
 * corner is a notification about something already in the centre of it), and a
 * revert after a beat.
 *
 * ★ THE FAILURE ARM IS NOT A LIE. `navigator.clipboard` is refused on an
 * insecure origin and by a denied permission, and a control that flashes
 * "Copied" over a clipboard that never changed is worse than one that does
 * nothing. `failed` lets a caller say so; `copied` is only ever true after the
 * write resolved.
 */
export function useCopyLink(url: string, revertMs = 2000) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A surface can unmount while the revert is pending (the modal closes, the
  // sheet goes). Clearing it keeps the timer from setting state on a dead tree.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(url);
      setFailed(false);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), revertMs);
    } catch {
      setCopied(false);
      setFailed(true);
      timer.current = setTimeout(() => setFailed(false), revertMs);
    }
  }, [url, revertMs]);

  return { copied, failed, copy };
}
