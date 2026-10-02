"use client";

import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { PortalContainerProvider } from "@/components/ui/portal-container";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import type { GroundId } from "../model";

/**
 * A GROUND OF ITS OWN: paper or the room, as a subtree, with everything that
 * opens inside it (a menu, a popover, a tooltip, a toast) opening in that
 * ground too.
 *
 * ★ TWO GROUNDS IN ONE DOCUMENT. A sheet draws paper and the room side by
 * side, so a ground cannot be the document's theme: it is `.surface-paper`
 * or `.dark` on a subtree (the theme sets' own classes), and the subtree hands
 * every portal its own box (`PortalContainerProvider`, the floating-layer
 * contract's container) and mounts a Toaster of its own, keyed by the ground,
 * so a toast raised on paper lands on paper. The root layout's Toaster takes
 * only toasts with no toaster named, so it never shows these.
 */

export const toasterOf = (g: GroundId) => `identity-${g}`;

/** A toast raised on a ground and held up for the picture. */
export function useHeldToast(g: GroundId, words: string, on = true) {
  useEffect(() => {
    if (!on) return;
    let id: string | number | undefined;
    // ★ A BEAT LATE, ON PURPOSE: the ground's Toaster subscribes in its own
    // effect, which runs after this one, and a toast raised first is dropped.
    const t = window.setTimeout(() => {
      id = toast(words, {
        toasterId: toasterOf(g),
        duration: Infinity,
        action: { label: "Undo", onClick: () => {} },
      });
    }, 350);
    return () => {
      window.clearTimeout(t);
      if (id !== undefined) toast.dismiss(id);
    };
  }, [g, words, on]);
}

export function Ground({
  g,
  side,
  className,
  children,
}: {
  g: GroundId;
  /** Where the ground's toasts stand: its own half of a desk's frame. */
  side?: "left" | "right";
  className?: string;
  children: ReactNode;
}) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  return (
    <div
      data-ground={g}
      data-ground-side={side}
      className={cn(
        g === "room" ? "dark" : "surface-paper",
        "relative min-w-0 bg-background text-foreground",
        className,
      )}
    >
      {box ? (
        <PortalContainerProvider value={box}>
          {children}
          <Toaster id={toasterOf(g)} />
        </PortalContainerProvider>
      ) : null}
      <div ref={setBox} data-ground-portals="" />
    </div>
  );
}

/**
 * The toasters of a desk's two grounds, each over its own half (sonner pins a
 * toaster to the viewport's centre, which is the seam between the halves).
 */
export const GROUND_TOASTS = `
[data-ground] [data-sonner-toaster][data-y-position="top"] { top: 54px !important; }
[data-ground-side="left"] [data-sonner-toaster][data-x-position="center"] { left: 25% !important; }
[data-ground-side="right"] [data-sonner-toaster][data-x-position="center"] { left: 75% !important; }
`;

/** The band a sheet keeps clear under its title for the toast it holds up. */
export const TOAST_BAND = 70;
