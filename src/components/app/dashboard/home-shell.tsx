"use client";

import type { ReactNode } from "react";
import { startTransition } from "react";

import { noteEventOpenedAction } from "@/app/(app)/dashboard/actions";
import { OPEN_STAMP_GAP_MS, openedIdOf } from "@/lib/dashboard/opened";

/** When this tab last stamped each event: one tab's own clock, so a press, a back and a press is one open. */
const stamped = new Map<string, number>();

/**
 * THE PAGE'S ROOT, AND THE ONE LISTENER THAT KNOWS WHICH EVENT SHE OPENED (host-dashboard r3): wide like the
 * album (`data-app-wide` drops the shell's 1280 cap and takes the album's gutter, and every grid below grows its
 * columns with the window), and every press on a link into an event (the stage, a week card, a tile, a row, a
 * Recent cover, an act) stamps it as opened, which is what the Recent row and the Last opened order read
 * (`events.host_opened_at`).
 *
 * ★ A PRESS NEVER WAITS FOR ITS STAMP. The navigation is Next's, and a navigation takes priority over a pending
 * Server Function (its client state is discarded, the request is already out and still lands), so the stamp rides
 * beside the press, in a transition, and a failed one costs one Recent order, never the press (the server says it
 * once, where failures are read). One listener on the root and not a handler on every link: the tile, the row, the
 * week card and the stage's acts are each their own component, and a link added later is counted without a line.
 */
export function HomeShell({ children }: { children: ReactNode }) {
  function stamp(event: React.MouseEvent<HTMLElement>) {
    const link = (event.target as Element).closest?.("a[href]");
    const id = openedIdOf(link?.getAttribute("href"));
    if (!id) return;
    const now = Date.now();
    if (now - (stamped.get(id) ?? 0) < OPEN_STAMP_GAP_MS) return;
    stamped.set(id, now);
    startTransition(async () => {
      try {
        await noteEventOpenedAction(id);
      } catch {
        // Best effort: the next press stamps it again.
      }
    });
  }

  return (
    <div
      data-app-wide
      data-home=""
      className="space-y-7 lg:space-y-9"
      onClickCapture={stamp}
      // A middle press opens the event in a tab of its own: an open too (a modified click is a click already).
      onAuxClickCapture={(event) => {
        if (event.button === 1) stamp(event);
      }}
    >
      {children}
    </div>
  );
}
