"use client";

import { Check, CircleX, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BulkBar, type BulkBarAction } from "./bulk-bar";
import { type ReviewTriage } from "./use-review-triage";

// The review room's control cluster, in the header's action slot. Two faces:
//   • browse → [Select] [Approve all]. Approve all is the FAST primary path (most moderation is a
//     quick scroll-then-approve); Select opens deliberate triage so the "All" scroll never selects.
//   • select → the shared BulkBar (`app-vocabulary` r1, `bulk-toolbar=icon`): Select all · N ·
//     Reject · Approve · Cancel, icons with instant sliding tooltips, GalleryBulkBar's sibling.
//
// ★ REJECT AT THE DOOR, HIDE IN THE ALBUM (host-curation `verb=reject`, Will: "Reject offers a clear
// yes/no decision to new uploads ... Hide gives no option to reject, which inherently accepts
// everything"). Refusing an upload nobody has seen is Reject here; taking down a photograph that is
// in the album stays Hide there. The row lands exactly where it did (hidden, dimmed in the host's
// album, where Show approves it); only the word the host is told changed. Its mark is the one the
// guest's own tracker wears on the same upload's refused row (`upload-tracker.tsx`).
export function ReviewActions({ triage }: { triage: ReviewTriage }) {
  const {
    selectMode,
    selected,
    allSelected,
    busy,
    pending,
    selectAll,
    enterSelect,
    exitSelect,
    run,
    approveAll,
  } = triage;

  if (!selectMode) {
    const empty = pending.length === 0;
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || empty}
          onClick={() => enterSelect()}
        >
          <ListChecks /> Select
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy || empty}
          onClick={approveAll}
        >
          <Check /> Approve all
        </Button>
      </div>
    );
  }

  const none = selected.size === 0;
  const actions: BulkBarAction[] = [
    {
      id: "reject",
      label: "Reject",
      icon: CircleX,
      color: "warning",
      disabled: busy || none,
      onRun: () => void run("reject", [...selected]),
    },
    {
      id: "approve",
      label: "Approve",
      icon: Check,
      disabled: busy || none,
      onRun: () => void run("approve", [...selected]),
    },
  ];

  return (
    <BulkBar
      count={selected.size}
      allSelected={allSelected}
      busy={busy}
      onSelectAll={selectAll}
      onCancel={exitSelect}
      actions={actions}
    />
  );
}
