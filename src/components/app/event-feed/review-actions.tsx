"use client";

import { Check, EyeOff, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BulkBar, type BulkBarAction } from "./bulk-bar";
import { type ReviewTriage } from "./use-review-triage";

// The pending-review control cluster, authored ONCE and rendered in two places (DRY): inline in
// the ReviewSection header (the at-top surface) AND inside the contextual floating action bar (the
// scroll companion) — the same "action follows you on scroll" pattern the floating Add uses. Two
// faces:
//   • browse → [Select] [Approve all]. Approve all is the FAST primary path (most moderation is a
//     quick scroll-then-approve); Select opens deliberate triage so the "All" scroll never selects.
//   • select → the shared BulkBar (`app-vocabulary` r1, `bulk-toolbar=icon`): Select all · N ·
//     Hide · Approve · Cancel, icons with instant sliding tooltips, GalleryBulkBar's sibling.
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
      id: "hide",
      label: "Hide",
      icon: EyeOff,
      color: "warning",
      disabled: busy || none,
      onRun: () => run("hide", [...selected]),
    },
    {
      id: "approve",
      label: "Approve",
      icon: Check,
      disabled: busy || none,
      onRun: () => run("approve", [...selected]),
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
