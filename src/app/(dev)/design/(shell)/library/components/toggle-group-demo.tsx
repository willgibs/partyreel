"use client";

import { useState } from "react";

import { DisplayMenu } from "@/components/app/dashboard/display-menu";
import { DISPLAY_DEFAULT, type Display } from "@/lib/dashboard/display";
import type { EventsFilter } from "@/lib/dashboard/events-view";

/**
 * THE DASHBOARD'S DISPLAY MENU, THE REAL ONE, OVER A STATE OF ITS OWN (`ToggleGroup`'s two heaviest callers: the layout
 * tiles and the sort, whose and when pills are all `ToggleGroup type="single"`).
 *
 * The menu is controlled (`display`, `onChange`), so the specimen is the state a page would hold: every press changes it
 * at once, the badge on the button counts what is set, and Reset undoes it. Nothing is stored (the dashboard keeps her
 * choices on her account; this keeps them until the page is left). The counts and the years are the menu's own inputs, a
 * host with a year of events behind her.
 */

const COUNTS: Record<EventsFilter, number> = {
  all: 14,
  hosting: 9,
  guest: 5,
  deleted: 1,
};
const YEARS = ["2026", "2025"] as const;

export function DisplayMenuDemo() {
  const [display, setDisplay] = useState<Display>(DISPLAY_DEFAULT);
  return (
    <div className="flex justify-end">
      <DisplayMenu
        display={display}
        onChange={setDisplay}
        counts={COUNTS}
        years={YEARS}
      />
    </div>
  );
}
