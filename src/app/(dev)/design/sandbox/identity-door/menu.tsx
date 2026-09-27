"use client";

import { LogIn, Pencil } from "lucide-react";

import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { PRIYA } from "./fixtures";
import { Lamp } from "./lit";

/**
 * HER MENU, OPEN, quoted from `guest-name-menu.tsx` as production draws it
 * (the round-two board had drifted to Mail icons and a larger label):
 * `DropdownMenuContent` at `w-60`, the label's own `text-xs` at 70 percent
 * over "Unverified" (or "Email not confirmed" once this device put an address
 * on her row), his card reading "Save this event for later" with its one act,
 * then Change name and Log in. Lit dresses the card's edge (his pick,
 * `guest-door` wiring it); nothing else here moves on any ask, because every
 * word in it is his (round one) or `voice-guest`'s ("Confirm your email").
 *
 * ★ A MENU'S ROWS ARE CONTROLS, SO THEIR GLYPHS ARE TODAY'S UNDER EVERY
 * `icons` ANSWER, and no light reaches them (the design system: light never
 * goes on the most-used controls).
 */
function MenuRow({
  icon: Icon,
  children,
}: {
  icon: typeof Pencil;
  children: React.ReactNode;
}) {
  return (
    <div
      data-door-menu-row
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-sm text-foreground",
        floatingRow,
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {children}
    </div>
  );
}

export function NameMenu({
  emailed,
  wide = false,
}: {
  emailed: boolean;
  wide?: boolean;
}) {
  return (
    <div
      data-door-menu
      className={cn(
        "absolute top-14 z-50 w-60 overflow-hidden p-1",
        wide ? "right-5" : "right-3",
        floatingPanel,
      )}
    >
      <div className="flex flex-col gap-0.5 px-2 pt-0.5 pb-1 text-xs text-foreground opacity-70">
        <span className="truncate leading-tight font-medium">{PRIYA.name}</span>
        <span
          data-door-status
          className="truncate text-xs leading-tight font-normal text-muted-foreground"
        >
          {emailed ? "Email not confirmed" : UNVERIFIED_LABEL}
        </span>
      </div>
      <div
        data-door-card
        className="relative isolate m-1 overflow-hidden rounded-md bg-muted/60 p-3"
      >
        <Lamp edge="card" />
        <p className="relative z-10 text-reading text-pretty text-foreground">
          Save this event for later
        </p>
        <div
          data-door-card-action
          className={cn(
            "relative z-10 mt-2 flex h-8 items-center justify-center bg-primary px-2 text-sm font-medium text-primary-foreground",
            floatingRow,
          )}
        >
          {emailed ? "Confirm your email" : "Add your email"}
        </div>
        {emailed && (
          <p className="relative z-10 mt-1 py-1 text-center text-xs text-muted-foreground">
            Change or remove it
          </p>
        )}
      </div>
      <MenuRow icon={Pencil}>Change name</MenuRow>
      <div className="-mx-1 my-1 h-px bg-border" />
      <MenuRow icon={LogIn}>Log in</MenuRow>
    </div>
  );
}
