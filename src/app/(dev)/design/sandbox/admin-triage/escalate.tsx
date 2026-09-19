"use client";

import { Copy, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
 * The runbook (docs/systems/trust-safety-forensics.md) is five steps, and step
 * two is "paste the media id and a reason". Today the report card renders no id
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
 * The door, drawn OPEN, because a panel nobody can see is an option nobody can
 * judge. It says what the act touches before it happens, which is the same
 * grammar the `admin` board recommends for every destructive control, and it
 * carries the runbook's own step 2: preserve the surrounding context, not one
 * frame, because commingled content is part of the preservation duty.
 */
export function HoldSheet() {
  const row = OPEN_REPORTS[0];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/25 backdrop-blur-[1px]">
      <section className="mt-20 w-[560px] overflow-hidden rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b px-5 py-3">
          <ShieldAlert className="size-4" />
          <p className="text-sm font-medium">Hold and preserve this item</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5 text-xs">
            <p className="font-medium">What this touches</p>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <p className="flex justify-between py-0.5">
                <span className="text-muted-foreground">This frame</span>
                <span className="tabular-nums">{row.media?.id}</span>
              </p>
              <p className="flex justify-between py-0.5">
                <span className="text-muted-foreground">
                  Everything else this guest sent to this album
                </span>
                <span className="tabular-nums">
                  {UPLOADER.inThisEvent} items
                </span>
              </p>
              <p className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Their other album</span>
                <span className="tabular-nums">
                  {UPLOADER.acrossEvents} events
                </span>
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">Reason, on the record</p>
            <div className="rounded-md border bg-background px-3 py-2 text-sm">
              report {row.id.slice(0, 8)}, CyberTipline filing
              <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-foreground align-text-bottom" />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Held media is never hard deleted by any purge. The original and its
            forensic record are copied to the preservation store, which is
            emptied only by hand. The host is told nothing, and cannot restore
            it.
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm">
              Set the hold and preserve
            </Button>
            <Button type="button" variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
