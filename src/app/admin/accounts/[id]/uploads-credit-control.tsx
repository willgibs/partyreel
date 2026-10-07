"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

import { creditUploadsAsOperatorAction } from "@/app/admin/accounts/actions";
import {
  creditMegabytes,
  UPLOADS_CREDIT_REASON_MAX,
  type CreditUnit,
} from "@/app/admin/accounts/uploads-credit";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEGABYTE } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

/**
 * What the sheet promises before it runs, one line each (the portal's confirmation lists what an act reaches). Exported
 * for its test. `until` is the window's own words ("the end of this month", "her soonest live pass's end").
 */
export function creditTouches(bytes: number, until: string): string[] {
  return [
    `Adds ${formatBytes(bytes)} to her uploads allowance until ${until}; her plan's own number does not change`,
    "Lifts the refusal of new uploads, hers and her guests', while the credit lasts",
    "Edits no count and no file: the ledger the spend watch reads and her stored files stay exactly as they are",
    "Is logged in the operator log with your reason and your name, ends with its window and has no undo",
  ];
}

/**
 * THE OPERATOR'S UPLOADS CREDIT (crumbs-92, Will's yes to X6): an amount, then the portal's one confirmation, whose
 * required note is the reason. The amount is whole MB or GB; the real bound is the database's (one more of her plan's
 * allowance in all), and `room` is what is left of it, said here so nobody presses to learn it.
 *
 * ★ A KEY PER SHEET: it is minted as the sheet opens and rides every attempt of that sheet, so a double press, or a
 * retry after an answer was lost, is one credit (`grant_uploads_credit` answers a key it already made). A failed
 * attempt leaves the sheet open on the same key; a closed sheet starts the next one afresh.
 */
export function UploadsCreditControl({
  userId,
  who,
  room,
  until,
}: {
  userId: string;
  /** Her name for the sheet's lede. */
  who: string;
  /** What a new credit may still add, in bytes: the plan's allowance less the credits she holds. */
  room: number;
  /** When it ends, in the window's own words. */
  until: string;
}) {
  const amountId = useId();
  const hintId = useId();
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<CreditUnit>("MB");
  const [open, setOpen] = useState(false);
  // What the open sheet is for, fixed when it opened: its amount and its key, whatever the field says after.
  const [pressed, setPressed] = useState<{
    megabytes: number;
    key: string;
  } | null>(null);

  const parsed = creditMegabytes(amount, unit);
  const bytes = parsed.ok ? parsed.megabytes * MEGABYTE : 0;
  const tooMuch = parsed.ok && bytes > room;
  const problem =
    amount.trim() === ""
      ? null
      : !parsed.ok
        ? parsed.message
        : tooMuch
          ? `At most ${formatBytes(room)} more fits.`
          : null;
  const ready = parsed.ok && !tooMuch;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={amountId}>Credit her uploads</Label>
          <div className="flex gap-2">
            <Input
              id={amountId}
              value={amount}
              inputMode="numeric"
              autoComplete="off"
              placeholder="100"
              aria-describedby={hintId}
              aria-invalid={problem ? true : undefined}
              className="w-28"
              onChange={(event) => setAmount(event.target.value)}
            />
            <select
              aria-label="Unit"
              value={unit}
              className="h-8 focus-halo rounded-lg field-well px-2 py-1 text-base outline-none md:text-sm"
              onChange={(event) => setUnit(event.target.value as CreditUnit)}
            >
              <option value="MB">MB</option>
              <option value="GB">GB</option>
            </select>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!ready}
          onClick={() => {
            if (!parsed.ok) return;
            setPressed({
              megabytes: parsed.megabytes,
              key: crypto.randomUUID(),
            });
            setOpen(true);
          }}
        >
          <Plus /> Credit…
        </Button>
      </div>
      <p
        id={hintId}
        className={
          problem
            ? "text-caption text-destructive"
            : "text-caption text-muted-foreground"
        }
      >
        {problem ??
          `Up to ${formatBytes(room)} more fits. It ends with the window, ${until}.`}
      </p>
      {pressed ? (
        <DestructiveSheet
          open={open}
          onOpenChange={setOpen}
          title="Credit her uploads?"
          lede={`Gives ${who} ${formatBytes(pressed.megabytes * MEGABYTE)} more uploads until ${until}.`}
          verb="Credit uploads"
          working="Crediting"
          touches={creditTouches(pressed.megabytes * MEGABYTE, until)}
          severity="reversible"
          note={{
            label: "Why",
            required: true,
            maxLength: UPLOADS_CREDIT_REASON_MAX,
            placeholder: "She wrote in: her guests were refused at the line.",
            hint: "Kept in the operator log with your name and the time.",
          }}
          successMessage="Credited. Her Uploads card shows it."
          onConfirm={async (_typed, note) => {
            const result = await creditUploadsAsOperatorAction(
              userId,
              pressed.megabytes,
              note,
              pressed.key,
            );
            // Credited: the field starts clean, so the next press is a new credit and not the last one again.
            if (result.ok) setAmount("");
            return result;
          }}
        />
      ) : null}
    </div>
  );
}
