"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";

/**
 * ONE CONFIRMATION FOR EVERY DESTRUCTIVE ACT, SIZED TO THE DAMAGE
 * (`destructive=sheet`, Will 2026-09-20; its surface moved by `popups` r1).
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
 * ★ IT IS A CONFIRMATION, SO IT OPENS AS ONE (`popups` r1, `confirm=dialog`,
 * Will 2026-09-27: "These are all rarer destructive actions, so a focused
 * confirmation over an undo is far more helpful"). A centred dialog at every
 * width, `md` because it lists what it touches, and keyboard-safe where an
 * address is typed. The names `DestructiveSheet` and `GuardedSwitch` stay:
 * their callers live in `src/app/admin/`, and a rename is one line each for
 * the next lane there.
 *
 * ★ THE TYPED CONFIRMATION IS A SECOND LOCK, NEVER THE LOCK. Every server
 * action behind this re-verifies for itself (the account delete compares the
 * typed string against the row it is about to delete, server-side, and
 * `requireAdminAction` asserts AAL2 before any of it). A client that skipped
 * this panel entirely would still be refused; the panel exists so an operator
 * does not make the mistake, not to stop an attacker making it.
 *
 * ★ A CONFIRM CAN CARRY ONE NOTE (admin-triage r1, `verdict=note` and
 * `escalate=door`, Will 2026-09-28). A line typed INTO the confirm, never a
 * second form beside it: a report's Remove leaves its optional note on the
 * record, and a hold from a report states its reason there, filled in. One
 * prop at the source, so any destructive act in the portal can leave a reason.
 * A required note holds the verb exactly as an unmatched typed identifier does.
 */
export type ConfirmNote = {
  label: string;
  /** Required = the verb waits for a line; optional says so beside the label. */
  required?: boolean;
  /** What the field starts with (a hold's reason is filled in from its report). */
  defaultValue?: string;
  placeholder?: string;
  /** One quiet line under the field: who reads it, where it is kept. */
  hint?: string;
  maxLength?: number;
};

/**
 * ONE OPTION A CONFIRM CAN CARRY (admin-triage r2, the hold rebuilt on Will's word, 2026-09-29): a switch in the
 * panel whose state changes what the act reaches, like a hold's "Take it down too", ON by default. So "What this
 * touches" and the toast can each be a function of it, and the act is handed its state.
 */
export type ConfirmOption = {
  label: string;
  /** One quiet line under it: what unticking it means. */
  hint?: string;
  defaultChecked?: boolean;
};

export type DestructiveSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** One sentence: what happens, in the operator's own terms. */
  lede: string;
  /** The confirm button's words. A verb, never "OK". */
  verb: string;
  /**
   * What the confirm says while the act runs ("Deleting", "Removing"), under the working arc: the
   * key stays busy and focusable, never off (Button's `working`). "Working" when not given.
   */
  working?: string;
  /** Everything this act reaches, one line each. Never empty. With an `option`, it may read the option's state. */
  touches: string[] | ((optionOn: boolean) => string[]);
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
  /** A line the act leaves on its record (see the header). */
  note?: ConfirmNote;
  /** A switch whose state changes what the act reaches (`ConfirmOption`). */
  option?: ConfirmOption;
  /**
   * ★ IT IS HANDED WHAT WAS ACTUALLY TYPED, and a permanent act must pass that
   * on rather than the string it was expecting. The account delete's server
   * guard compares the confirmation against the row it is about to delete; a
   * client that "helpfully" sent the correct identifier every time would turn
   * that guard into a tautology and leave only this panel between an operator
   * and the wrong account. The note arrives trimmed, "" when none was written.
   */
  onConfirm: (
    typed: string,
    note: string,
    optionOn: boolean,
  ) => Promise<ActionResult>;
  successMessage: string | ((optionOn: boolean) => string);
};

export function DestructiveSheet(props: DestructiveSheetProps) {
  return (
    <Popup open={props.open} onOpenChange={props.onOpenChange}>
      <PopupContent kind="confirm" size="md" data-severity={props.severity}>
        {/*
          ★ THE BODY IS A CHILD OF THE PANEL, AND THAT IS WHAT CLEARS THE FIELD.
          A half-typed confirmation must not survive the panel closing:
          reopening it and finding the button already armed is the opposite of
          what typing is for. Radix unmounts a closed popup's content, so state
          that lives in here is gone the moment the panel is, with no reset
          effect (a setState inside an effect, and one that misses whenever a
          parent closes the popup by setting its own state directly).
        */}
        <ConfirmBody {...props} />
      </PopupContent>
    </Popup>
  );
}

function ConfirmBody({
  onOpenChange,
  title,
  lede,
  verb,
  working = "Working",
  touches,
  severity,
  confirmText,
  note,
  option,
  onConfirm,
  successMessage,
}: Omit<DestructiveSheetProps, "open">) {
  const [typed, setTyped] = useState("");
  const [optionOn, setOptionOn] = useState(option?.defaultChecked ?? false);
  const optionId = useId();
  const reached = typeof touches === "function" ? touches(optionOn) : touches;
  // Seeded once per opening: the body unmounts with the panel, so a reopened
  // confirm starts from the caller's value again, never from a half-edit.
  const [noteText, setNoteText] = useState(note?.defaultValue ?? "");
  const [pending, startTransition] = useTransition();
  const fieldId = useId();
  const noteId = useId();
  const noteHintId = useId();

  const needsTyping = severity === "permanent" && Boolean(confirmText);
  const matched =
    !needsTyping ||
    typed.trim().toLowerCase() === (confirmText ?? "").trim().toLowerCase();
  const noteMissing = Boolean(note?.required) && noteText.trim().length === 0;

  function confirm() {
    if (!matched || noteMissing || pending) return;
    startTransition(async () => {
      const result = await onConfirm(
        typed.trim(),
        note ? noteText.trim() : "",
        optionOn,
      );
      if (!result.ok) {
        toast.error(result.message ?? "That did not go through.");
        return;
      }
      toast.success(
        typeof successMessage === "function"
          ? successMessage(optionOn)
          : successMessage,
      );
      onOpenChange(false);
    });
  }

  return (
    <>
      <PopupHeader title={title} description={lede} />

      <PopupBody>
        <div className="rounded-md border bg-muted/50 px-3 py-2.5">
          <p className="mb-1.5 text-label font-medium text-muted-foreground uppercase">
            What this touches
          </p>
          <ul data-slot="destructive-touches" className="space-y-1">
            {reached.map((touch) => (
              <li key={touch} className="flex gap-2 text-caption">
                <span aria-hidden className="text-muted-foreground">
                  -
                </span>
                <span>{touch}</span>
              </li>
            ))}
          </ul>
        </div>

        {option ? (
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor={optionId}>{option.label}</Label>
              {option.hint ? (
                <p className="text-caption text-muted-foreground">
                  {option.hint}
                </p>
              ) : null}
            </div>
            <Switch
              id={optionId}
              checked={optionOn}
              onCheckedChange={setOptionOn}
              disabled={pending}
            />
          </div>
        ) : null}

        {note ? (
          <div className="mt-4 space-y-1.5">
            <Label htmlFor={noteId}>
              {note.label}{" "}
              <span className="font-normal text-muted-foreground">
                {note.required ? "(required)" : "(optional)"}
              </span>
            </Label>
            <Textarea
              id={noteId}
              rows={2}
              value={noteText}
              placeholder={note.placeholder}
              maxLength={note.maxLength}
              aria-describedby={note.hint ? noteHintId : undefined}
              className="min-h-0 resize-none"
              onChange={(event) => setNoteText(event.target.value)}
            />
            {note.hint ? (
              <p id={noteHintId} className="text-caption text-muted-foreground">
                {note.hint}
              </p>
            ) : null}
          </div>
        ) : null}

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
      </PopupBody>

      <PopupFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant={severity === "permanent" ? "destructive" : "default"}
          onClick={confirm}
          working={pending}
          workingLabel={working}
          disabled={!matched || noteMissing}
        >
          {verb}
        </Button>
      </PopupFooter>
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
  sheet: {
    title: string;
    lede: string;
    verb: string;
    working?: string;
    touches: string[];
  };
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
        working={sheet.working}
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
