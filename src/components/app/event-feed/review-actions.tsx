"use client";

import { Check, EyeOff, ListChecks, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type ReviewTriage } from "./use-review-triage";

// The pending-review control cluster, authored ONCE and rendered in two places (DRY): inline in
// the ReviewSection header (the at-top surface) AND inside the contextual floating action bar (the
// scroll companion) — the same "action follows you on scroll" pattern the floating Add uses. Two
// faces:
//   • browse → [Select] [Approve all]. Approve all is the FAST primary path (most moderation is a
//     quick scroll-then-approve); Select opens deliberate triage so the "All" scroll never selects.
//   • select → Select all · N · [Hide] [Approve] [Cancel], driving the optimistic bulk run.
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

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={selectAll}
      >
        {allSelected ? "Clear" : "All"}
      </Button>
      <span className="px-0.5 text-xs tabular-nums text-muted-foreground">
        {selected.size}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || selected.size === 0}
        onClick={() => run("hide", [...selected])}
      >
        <EyeOff className="text-warning" /> Hide
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={busy || selected.size === 0}
        onClick={() => run("approve", [...selected])}
      >
        <Check /> Approve
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Cancel selection"
        disabled={busy}
        onClick={exitSelect}
      >
        <X />
      </Button>
    </div>
  );
}
