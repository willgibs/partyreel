"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import type { NavGroup } from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

/**
 * A collapsed footer group (the ink slab's only client island).
 *
 * Rides the ratified .mkt-acc recipe (marketing.css chapter 2, 21-accordion):
 * the grid-rows 0fr/1fr height tween plus the scaleY chevron flip. Two of that
 * recipe's documented traps apply here and are handled:
 *
 *  1. PADDING LIVES ON THE <ul>, never on .mkt-acc-panel-inner. A padded 0fr
 *     track never fully closes, so the group would leave a residual strip.
 *
 *  2. `inert` WHEN CLOSED IS LOAD-BEARING, not polish. -inner is `overflow:
 *     hidden`, not `clip`, so a clipped link stays focusable: tabbing into it
 *     scrolls the hidden box and drops focus somewhere invisible. The FAQ
 *     accordion never hit this because its panels hold only a <p>. House idiom
 *     is `cond || undefined` (reel-reveal.tsx), never `inert={false}`.
 *
 * Focus needs no restoration on close: the only control that closes the panel is
 * the trigger itself, so focus is already on it when `inert` lands.
 *
 * The hub link renders as the panel's leading row rather than making the trigger
 * both a link and a button (two roles on one control is an a11y trap). Same
 * idiom the mobile nav sheet already uses for its group headers.
 *
 * This island NEVER mounts on the root 404: that boundary renders outside
 * (marketing), so marketing.css and [data-mkt] are both absent and every .mkt-*
 * selector would fail to match, leaving a permanently open "collapsed" group.
 * MarketingFooter's `disclosure={false}` renders those groups flat instead.
 */
export function FooterDisclosure({
  group,
  linkClassName,
}: {
  group: NavGroup;
  /** The column's shared link styling, so nested rows match their siblings. */
  linkClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const buttonId = `${baseId}-trigger`;

  return (
    <li className="mkt-acc" data-open={open ? "true" : "false"}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          linkClassName,
          "flex w-full cursor-pointer items-center justify-between gap-2 text-left",
        )}
      >
        {group.label}
        <span className="mkt-acc-chevron" aria-hidden>
          <ChevronDown className="size-3.5" />
        </span>
      </button>
      <div id={panelId} className="mkt-acc-panel" inert={!open || undefined}>
        <div className="mkt-acc-panel-inner">
          {/* Padding on the list, NOT on -inner (see the trap note above). */}
          <ul className="flex flex-col gap-y-2.5 pt-2.5">
            {group.href && (
              <li>
                <Link href={group.href} className={linkClassName}>
                  All {group.label.toLowerCase()}
                </Link>
              </li>
            )}
            {group.children.map((child) => (
              <li key={child.href}>
                <Link href={child.href} className={linkClassName}>
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
