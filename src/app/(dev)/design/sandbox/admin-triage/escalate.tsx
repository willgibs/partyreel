"use client";

import { Copy, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ConfirmLook } from "./confirm";
import {
  AUDIT,
  HOLDS,
  OPEN_REPORTS,
  type ReportRow,
  UPLOADER,
} from "./fixtures";
import { StateChip } from "./shell";

/**
 * THE ONE ACT ON THIS BOARD THAT IS PERFORMED UNDER PRESSURE.
 *
 * The runbook (docs/systems/trust-safety-forensics.md) is six steps, and step
 * two is "the media id and a reason". Today the report card renders no id
 * at all, so an operator reading a report at midnight has to leave it, find the
 * same frame in /admin/albums, read a UUID off that surface and retype it into
 * a free-text field on a third one. Thirty-six characters, typed once, with a
 * legal preservation duty on the other end of them.
 *
 * ★ THE DOCTRINE IS DRAWN, NOT DESIGNED AROUND. A hold means the item is never
 * hard-deleted by any purge path, the original and a JSON evidence snapshot are
 * copied to the segregated preservation prefix, and `restore_media` refuses the
 * row afterwards with copy deliberately vague enough that the host cannot learn
 * a hold exists. Every option below says those consequences in the same words;
 * what differs is only how the id gets there.
 */

export type EscalateShape = "retype" | "copy" | "door";

export const escalateOf = (v: string | undefined): EscalateShape =>
  v === "retype" || v === "copy" || v === "door" ? v : "door";

/* ── What the card carries ───────────────────────────────────────────────── */

/**
 * The strip the `copy` and `door` answers hang on the report. It is the only
 * thing on this board that puts a raw id on screen, which is safe here and
 * nowhere else: `/admin/reports` is operator-internal behind `requireAdmin` and
 * AAL2, and a media id is not a capability (the object itself is reached only
 * through a server-side presign).
 */
export function IdStrip({
  shape,
  row,
}: {
  shape: EscalateShape;
  /** The report the ids belong to. The first draft read OPEN_REPORTS[0]
   *  whatever it was drawn on, so every card in the queue carried the first
   *  report's media id: a picture that was simply false. */
  row: ReportRow;
}) {
  if (shape === "retype") return null;

  if (shape === "copy")
    return (
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
          <span className="opacity-70">report</span>
          <span className="tabular-nums">{row.id.slice(0, 8)}</span>
          <Copy className="size-3" />
        </span>
        <span className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
          <span className="opacity-70">media</span>
          <span className="tabular-nums">{row.media?.id}</span>
          <Copy className="size-3" />
        </span>
      </div>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm">
        <ShieldAlert className="size-3.5" />
        Hold for forensics
      </Button>
      <span className="text-[11px] text-muted-foreground">
        Sets the hold, preserves the evidence and keeps this report open.
      </span>
    </div>
  );
}

/* ── Where the id has to land ────────────────────────────────────────────── */

function Field({
  label,
  value,
  placeholder,
  filled,
}: {
  label: string;
  value?: string;
  placeholder: string;
  filled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">{label}</p>
      <div
        className={cn(
          "rounded-md border bg-background px-3 py-2 text-sm",
          filled ? "tabular-nums" : "text-muted-foreground",
        )}
      >
        {filled ? value : placeholder}
      </div>
    </div>
  );
}

/**
 * `/admin/forensics` as it ships: a coverage line, two free-text inputs and a
 * holds table. Drawn as a panel rather than a page, and labelled as the other
 * surface it is, because the question is the DISTANCE between the report and
 * this form rather than what this form looks like.
 */
export function ForensicsPanel({ shape }: { shape: EscalateShape }) {
  const row = OPEN_REPORTS[0];
  const pasted = shape === "copy";
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <p className="text-sm font-medium">
          Forensics, a second surface
          <span className="ml-2 font-normal text-muted-foreground">
            /admin/forensics
          </span>
        </p>
        <StateChip level="held">1 active hold</StateChip>
      </div>
      <div className="grid grid-cols-2 gap-5 px-4 py-4">
        <div className="space-y-3">
          <Field
            label="Media id"
            placeholder="the media row UUID (from a report or /admin/albums)"
            value={row.media?.id}
            filled={pasted}
          />
          <Field
            label="Hold reason"
            placeholder="e.g. report #123, CyberTipline filing"
            value={`report ${row.id.slice(0, 8)}`}
            filled={pasted}
          />
          <Button type="button" size="sm" disabled={!pasted}>
            Set hold and preserve
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium">Active legal holds</p>
            {HOLDS.map((h) => (
              <div
                key={h.mediaId}
                className="flex items-center gap-2 border-b py-1.5 text-xs last:border-b-0"
              >
                <span className="tabular-nums">{h.mediaId.slice(0, 8)}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {h.event}
                </span>
                <span className="text-muted-foreground">{h.since}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium">Audit trail</p>
            {AUDIT.map((a) => (
              <div
                key={`${a.when}-${a.what}`}
                className="flex items-center gap-2 py-1 text-xs text-muted-foreground"
              >
                <span className="tabular-nums">{a.on}</span>
                <span className="min-w-0 flex-1 truncate">{a.what}</span>
                <span>{a.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * THE DOOR, DRAWN OPEN, AS THE PORTAL'S ONE CONFIRM (the production refresh,
 * 2026-09-28). The first draft drew a bespoke preserve panel, "a sheet of its
 * own", which never held: setting a hold is an inline form on
 * /admin/forensics (`PreserveForm`), and only Release hold opens the confirm, a
 * centred dialog since 3e7952e3. So the door opens THAT confirm, filled in from
 * the report: what the hold touches, with the runbook's step 2 in it (preserve
 * the surrounding context, what else this guest sent to this album, because
 * commingled content is part of the preservation duty), and the reason on the
 * record, which the confirm carries through the same proposed `note` the
 * verdict's Remove uses.
 *
 * ★ "THEIR OTHER ALBUM" LEFT WITH THE BESPOKE PANEL. It crossed events by the
 * address a guest typed at the door, which nobody proved. The runbook's
 * context stops at the event; crossing events is the forensic record's work
 * (the device id), read on /admin/forensics, never a one-click scope here.
 */
export function HoldSheet() {
  const row = OPEN_REPORTS[0];
  return (
    <ConfirmLook
      title="Hold and preserve this photo?"
      lede="It stays out of every purge until the hold is released from Forensics."
      touches={[
        `This photo in ${row.event}, and the ${UPLOADER.inThisEvent} others this guest sent there`,
        "Each original and its forensic record, copied to the preservation store",
        "Nothing tells anyone it is held: the host is sent nothing",
      ]}
      verb="Set hold and preserve"
      severity="reversible"
      note={{
        label: "Reason, on the record",
        required: true,
        value: `report ${row.id.slice(0, 8)}, CyberTipline filing`,
        placeholder: "e.g. report #123, CyberTipline filing",
      }}
    />
  );
}
