"use client";

import { useCallback, useState } from "react";

import type { Plan } from "@/lib/constants/tiers";

import { AccountGround, DashboardGround } from "./ground";
import { usePress } from "./parts";
import { PlanSheet } from "./plan-sheet";
import { PricesFor, type PricesOption } from "./prices";
import { SizeList } from "./storage-list";

/**
 * ONE FRAME'S WORLD: the page she opened the plan from, the plan with this
 * option's six prices in it, and, once she asks, the list stacked over it.
 * Every press is local and live: a price that fits shows its "Opening…" beat,
 * the size that cannot hold what she stores flips in place, and "See what's
 * using space" opens the list, whose strip counts down as she selects.
 *
 * Keyed by everything that shapes it (the board does), so a new option or a
 * new screen starts fresh rather than mid-press.
 */
export function PlanWorld({
  option,
  desk,
  door,
  refused = null,
}: {
  option: PricesOption;
  desk: boolean;
  /** Where the plan was opened from: the Plan card, or the storage meter. */
  door: "account" | "dashboard";
  /** A frame that opens with this price already tapped, and refused. */
  refused?: Plan | null;
}) {
  const press = usePress(refused);
  const [listFor, setListFor] = useState<Plan | null>(null);
  const Ground = door === "account" ? AccountGround : DashboardGround;

  // ★ LIVE A FRAME AFTER IT MOUNTS (host-storage.css, "the flip"): only what
  // a press brings in arrives on `@starting-style`, never the frame's first
  // paint. Written on the node, not in state: nothing re-renders for it.
  const live = useCallback((el: HTMLDivElement | null) => {
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    win.requestAnimationFrame(() =>
      win.requestAnimationFrame(() => {
        el.dataset.hsLive = "";
      }),
    );
  }, []);

  return (
    <div ref={live} className="min-h-full">
      <Ground>
        <PlanSheet desk={desk}>
          <PricesFor option={option} press={press} onSeeSpace={setListFor} />
        </PlanSheet>
        {listFor && (
          <SizeList
            desk={desk}
            target={listFor}
            onClose={() => setListFor(null)}
          />
        )}
      </Ground>
    </div>
  );
}
