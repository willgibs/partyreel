"use client";

import { Clapperboard, Download, Eye, EyeOff, Heart, ListChecks, Trash2 } from "lucide-react";

import { useHostSelection } from "@/components/app/host-selection-provider";
import { Button } from "@/components/ui/button";
import { BulkBar, type BulkBarAction } from "./bulk-bar";

// The GALLERY album bulk-select controls (the analog of review-actions.tsx). Two pieces, both reading
// the shared HostSelectionProvider:
//   • GallerySelectButton → the browse affordance in the Gallery section header ("Select" → enter mode).
//   • GalleryBulkBar      → the select-mode cluster, the shared BulkBar (`app-vocabulary` r1,
//         `bulk-toolbar=icon`): All/Clear · N · Add to reel · Like · Hide|Show · Download · Delete
//         (count-named confirm) · Cancel, ordered like the per-tile row (reel → like → hide/show →
//         download, danger last), each in its state color (--reel / --like / --warning / --save /
//         --destructive), icons with instant sliding tooltips.

export function GallerySelectButton() {
  const selection = useHostSelection();
  if (!selection) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => selection.enterSelect()}
    >
      <ListChecks /> Select
    </Button>
  );
}

export function GalleryBulkBar() {
  const selection = useHostSelection();
  if (!selection) return null;

  const { selected, allSelected, busy, hideLabel, selectAll, exitSelect, run } =
    selection;
  const none = selected.size === 0;
  const removeTitle =
    selected.size === 1 ? "Remove 1 item?" : `Remove ${selected.size} items?`;

  const actions: BulkBarAction[] = [
    {
      id: "reel",
      label: "Add to reel",
      icon: Clapperboard,
      color: "reel",
      disabled: busy || none,
      onRun: () => run("reel"),
    },
    {
      id: "like",
      label: "Like",
      icon: Heart,
      color: "like",
      disabled: busy || none,
      onRun: () => run("like"),
    },
    {
      id: "hide",
      label: hideLabel,
      icon: hideLabel === "Show" ? Eye : EyeOff,
      color: "warning",
      disabled: busy || none,
      onRun: () => run(hideLabel === "Show" ? "show" : "hide"),
    },
    {
      id: "download",
      label: "Download",
      icon: Download,
      color: "save",
      disabled: busy || none,
      onRun: () => run("download"),
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      color: "destructive",
      disabled: busy || none,
      onRun: () => run("delete"),
      confirm: {
        title: removeTitle,
        description:
          "They disappear from the album right away and are permanently deleted after a short grace period. Guests won’t see them.",
        confirmLabel: "Remove",
      },
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
