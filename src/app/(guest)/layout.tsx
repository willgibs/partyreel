// Layout for the guest-facing token route (/e/[token] — the single event link, guest-flow.md).
// Mobile-first: guests arrive on a phone via a scanned QR, so the canvas is a single narrow
// column with no host chrome (the event page renders its own auth-aware header — see
// guest-header.tsx: logged-out → "Start for free", logged-in → account menu).
import type { Viewport } from "next";

import { AppDesignIsland } from "@/components/dev/app-design-island";

/**
 * ★ ANDROID RESIZES THE PAGE AROUND ITS KEYBOARD (door-flow). With
 * `interactive-widget=resizes-content` Chrome shrinks the layout viewport when
 * the keyboard opens, so the door's bottom sheet (and every other guest sheet)
 * already sits above it and `use-keyboard-inset.ts` measures nothing to lift.
 * iOS Safari ignores the key today; there the same formula does the lifting,
 * and it cancels out wherever this key works. Merged over the root layout's
 * viewport (its theme colour and the device-width default stand).
 */
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {children}
      {/* Key-gated (server-validated ?key=), inert for every guest: a board's
          candidate block and the rounding knobs reach the guest surface too,
          so a sitting is judged on the demo album. */}
      <AppDesignIsland />
    </div>
  );
}
