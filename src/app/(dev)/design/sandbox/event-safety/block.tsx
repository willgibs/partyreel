"use client";

import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { EVENT, type Person } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE BLOCK'S WAY BACK. The block itself (the sheet that says what leaves,
 * the toast that undoes it, the menu row that asks a second time in place)
 * moved to the `popups` board with its question (2026-09-27), where it is
 * drawn as one of the confirmations every surface rule is judged on. What
 * stays is letting someone back in, which `restore` still asks.
 */

/**
 * THE WAY BACK, AS A CONFIRM (`ui/dialog.tsx`, centred, quoted): letting
 * someone back in, with whatever an option says about the uploads the block
 * removed. `body` is that option's sentence and control.
 */
export function UnblockDialog({
  screen,
  person,
  body,
  primary,
}: {
  screen: ScreenId;
  person: Person;
  body: ReactNode;
  primary: string;
}) {
  return (
    <>
      <div className="es-scrim" />
      <div
        className={cn("es-dialog", floatingPanel)}
        data-screen={screen}
        data-es-dialog
      >
        <div className="flex flex-col gap-2">
          <p className="font-heading text-card-title leading-none font-medium">
            {`Let ${person.name} back in?`}
          </p>
          <p className="text-sm text-muted-foreground">
            {`They can join ${EVENT.name} and add photos again.`}
          </p>
        </div>
        {body}
        <div className="es-dialog-foot">
          <Button variant="outline" tabIndex={-1}>
            Cancel
          </Button>
          <Button tabIndex={-1} data-es-reach>
            {primary}
          </Button>
        </div>
      </div>
    </>
  );
}
