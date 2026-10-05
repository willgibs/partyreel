"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * What the toast draws: a component that throws while it renders. It is the ROOT LAYOUT's `<Toaster />` that
 * renders it, so the throw happens beside the page, never inside it.
 */
function Crash(): never {
  throw new Error(
    "design-lab boundary probe: intentional root-layout crash (not a real failure)",
  );
}

/**
 * THE ROOT LAYOUT'S CRASH, FROM A PAGE (`/design/lab/tools/boom?boundary=global`): the only way a page reaches
 * `global-error.tsx`, which draws when the layout above every page dies.
 *
 * ★ WHY A TOAST. A page's own crash lands on the root `error.tsx`, which wraps `{children}` and nothing beside
 * it. The one thing in `app/layout.tsx` that renders what a page hands it, outside `{children}`, is the
 * `<Toaster />` (sonner draws a custom toast's element inside its own tree), so a toast whose element throws
 * crashes the layout's subtree and no segment boundary sits between it and `global-error`. It is documented
 * API (`toast.custom`), it needs no edit to the layout, and it ships no test hook in a production boundary
 * (the other way in, the root `error.tsx` rethrowing a magic message, would).
 *
 * ★ A BEAT AFTER MOUNT, NEVER IN THE EFFECT ITSELF. The Toaster comes after `{children}` in the layout, and
 * effects run in tree order, so on a hard load this page's effect runs before the Toaster has subscribed to
 * toasts, and a toast published then is dropped unseen. A timer lets the whole commit's effects land first.
 */
export function RootLayoutCrash() {
  useEffect(() => {
    const timer = setTimeout(() => {
      toast.custom(() => <Crash />, { duration: Infinity });
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
