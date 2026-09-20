"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * ONE SHEET FOR EVERY DESTRUCTIVE ACT, SIZED TO THE DAMAGE
 * (`destructive=sheet`, Will 2026-09-20).
 *
 * The portal had four grammars and the severity did not line up with the
 * friction: deleting an account made you retype an address, removing a photo
 * opened a plain dialog, releasing a legal hold armed in place, and pausing the
 * purge sweep, which stops storage being reclaimed platform-wide, was a bare
 * switch with no confirmation at all. The cheapest click in the portal was one
 * of its more expensive mistakes.
 *
 * So there is one panel, and what varies is what it SAYS. Every act lists what
 * it touches before it happens, because only a panel can say "18 events, 40 GB
 * a day, two events under legal hold", and only the permanent one makes you
 * type. That last rule is the whole of the sizing: typing is friction worth
 * paying exactly where nothing comes back.
 *
 * ★ IT IS THE PRODUCT'S ONE RESPONSIVE SHEET, NOT A SECOND PANEL. `responsive`
 * on `ui/sheet.tsx` (`settings=sheet`, his words: "we likely want to apply this
 * sheet concept everywhere"), so it is a side panel at a desk and a bottom
 * sheet in a hand, on the family's corner, clock and light.
 *
 * ★ THE TYPED CONFIRMATION IS A SECOND LOCK, NEVER THE LOCK. Every server
 * action behind this re-verifies for itself (the account delete compares the
 * typed string against the row it is about to delete, server-side, and
 * `requireAdminAction` asserts AAL2 before any of it). A client that skipped
 * this panel entirely would still be refused; the panel exists so an operator
 * does not make the mistake, not to stop an attacker making it.
 */
export function DestructiveSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** One sentence: what happens, in the operator's own terms. */
  lede: string;
  /** The confirm button's words. A verb, never "OK". */
  verb: string;
  /** Everything this act reaches, one line each. Never empty. */
  touches: string[];
  /**
   * `permanent` = nothing comes back, so the operator types `confirmText`.
   * `reversible` = there is a way back, so there is nothing to type.
   */
  severity: "reversible" | "permanent";
  /**
   * The string an operator must type. Only a `permanent` act may ask for one,
   * and only where there is a specific WRONG THING to get wrong: an account's
   * address identifies the row, so typing it is a wrong-row guard. A permanent
   * act with nothing to identify (deleting one announcement you are looking at)
   * is still permanent, still red, and asks for no typing, because friction
   * with nothing to check is friction people learn to type through.
   */
  confirmText?: string;
  /**
   * ★ IT IS HANDED WHAT WAS ACTUALLY TYPED, and a permanent act must pass that
   * on rather than the string it was expecting. The account delete's server
   * guard compares the confirmation against the row it is about to delete; a
   * client that "helpfully" sent the correct identifier every time would turn
   * that guard into a tautology and leave only this panel between an operator
   * and the wrong account.
   */
  onConfirm: (typed: string) => Promise<ActionResult>;
  successMessage: string;
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        responsive
        data-severity={props.severity}
        className="gap-0 overflow-y-auto"
      >
        {/*
          ★ THE BODY IS A CHILD OF THE PANEL, AND THAT IS WHAT CLEARS THE FIELD.
          A half-typed confirmation must not survive the panel closing:
          reopening it and finding the button already armed is the opposite of
          what typing is for. Radix unmounts a closed sheet's content, so state
          that lives in here is gone the moment the panel is, with no reset
          effect (a setState inside an effect, and one that misses whenever a
          parent closes the sheet by setting its own state directly).
        */}
        <SheetBody {...props} />
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  onOpenChange,
  title,
  lede,
  verb,
  touches,
  severity,
  confirmText,
  onConfirm,
  successMessage,
}: {
  onOpenChange: (open: boolean) => void;
  title: string;
  lede: string;
  verb: string;
  touches: string[];
  severity: "reversible" | "permanent";
  confirmText?: string;
  onConfirm: (typed: string) => Promise<ActionResult>;
  successMessage: string;
}) {
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const fieldId = useId();

  const needsTyping = severity === "permanent" && Boolean(confirmText);
  const matched =
    !needsTyping ||
    typed.trim().toLowerCase() === (confirmText ?? "").trim().toLowerCase();

  function confirm() {
    if (!matched || pending) return;
    startTransition(async () => {
      const result = await onConfirm(typed.trim());
      if (!result.ok) {
        toast.error(result.message ?? "That did not go through.");
        return;
      }
      toast.success(successMessage);
      onOpenChange(false);
    });
  }

  return (
    <>
      <SheetHeader className="gap-2">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{lede}</SheetDescription>
      </SheetHeader>

      <div className="px-4">
        <div className="rounded-md border bg-muted/50 px-3 py-2.5">
          <p className="mb-1.5 text-label font-medium text-muted-foreground uppercase">
            What this touches
          </p>
          <ul data-slot="destructive-touches" className="space-y-1">
            {touches.map((touch) => (
              <li key={touch} className="flex gap-2 text-caption">
                <span aria-hidden className="text-muted-foreground">
                  -
                </span>
                <span>{touch}</span>
              </li>
            ))}
          </ul>
        </div>

        {needsTyping ? (
          <div className="mt-4 space-y-1.5">
            <Label htmlFor={fieldId}>
              Type{" "}
              <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground tabular-nums">
                {confirmText}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id={fieldId}
              value={typed}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      <SheetFooter className="flex-row justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant={severity === "permanent" ? "destructive" : "default"}
          size="sm"
          onClick={confirm}
          disabled={!matched || pending}
        >
          {pending ? "Working" : verb}
        </Button>
      </SheetFooter>
    </>
  );
}

/**
 * A KILL SWITCH THAT ASKS ON ITS WAY OFF (`destructive=sheet`, applied to the
 * three bare switches the board found).
 *
 * Pausing downloads, pausing reel renders and pausing a backend job were the
 * cheapest clicks in the portal and three of its more expensive mistakes: one
 * stray tap on the purge sweep stops storage being reclaimed platform-wide
 * until somebody notices. Turning something back ON is free and stays a plain
 * tap, because the damage is entirely on the OFF edge and friction in both
 * directions is friction nobody reads.
 *
 * ★ THE SWITCH DOES NOT MOVE UNTIL THE SERVER SAYS SO, on the way off. The
 * optimistic flip these three shipped with is right for a toggle that cannot
 * fail and wrong for one guarded by a panel: a switch that snaps off the
 * instant you press Confirm, then snaps back when the action is refused, has
 * already told you the wrong thing.
 */
export function GuardedSwitch({
  enabled,
  label,
  description,
  ariaLabel,
  sheet,
  onToggle,
  onMessage,
  offMessage,
}: {
  enabled: boolean;
  /** A stable feature name; the switch carries the state, never the label. */
  label: string;
  /** What is true right now, in a line, given the state. */
  description: string;
  ariaLabel: string;
  sheet: { title: string; lede: string; verb: string; touches: string[] };
  onToggle: (next: boolean) => Promise<ActionResult>;
  onMessage: string;
  offMessage: string;
}) {
  const [on, setOn] = useState(enabled);
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function turnOn() {
    setOn(true);
    startTransition(async () => {
      const result = await onToggle(true);
      if (!result.ok) {
        setOn(false);
        toast.error(result.message ?? "Couldn't update the setting.");
        return;
      }
      toast.success(onMessage);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-working font-medium">{label}</p>
          <p className="text-caption text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={on}
          onCheckedChange={(next) => (next ? turnOn() : setAsking(true))}
          disabled={pending}
          aria-label={ariaLabel}
        />
      </div>
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title={sheet.title}
        lede={sheet.lede}
        verb={sheet.verb}
        touches={sheet.touches}
        severity="reversible"
        successMessage={offMessage}
        onConfirm={async () => {
          const result = await onToggle(false);
          if (result.ok) setOn(false);
          return result;
        }}
      />
    </>
  );
}
