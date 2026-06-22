"use client";

import {
  Clapperboard,
  Eye,
  EyeOff,
  Heart,
  ListChecks,
  Trash2,
  X,
} from "lucide-react";

import { useHostSelection } from "@/components/app/host-selection-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// The GALLERY album bulk-select controls (the analog of review-actions.tsx). Two pieces, both reading
// the shared HostSelectionProvider:
//   • GallerySelectButton → the browse affordance in the Gallery section header ("Select" → enter mode).
//   • GalleryBulkBar      → the select-mode cluster in the floating action bar:
//         All/Clear · N · Add to reel · Like · Hide|Show · Delete (count-named confirm) · Cancel
//     ordered like the per-tile row (reel → like → hide/show → delete, danger last), each in its state
//     color (--reel / --like / --warning / --destructive). The actions are icon-only so the four fit the
//     375px bar; the Delete confirm names the count.

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
        variant="ghost"
        size="icon-sm"
        aria-label="Add to reel"
        title="Add to reel"
        disabled={busy || none}
        onClick={() => run("reel")}
      >
        <Clapperboard className="text-reel" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Like"
        title="Like"
        disabled={busy || none}
        onClick={() => run("like")}
      >
        <Heart className="text-like" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={hideLabel}
        title={hideLabel}
        disabled={busy || none}
        onClick={() => run(hideLabel === "Show" ? "show" : "hide")}
      >
        {hideLabel === "Show" ? (
          <Eye className="text-warning" />
        ) : (
          <EyeOff className="text-warning" />
        )}
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete"
            title="Delete"
            disabled={busy || none}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{removeTitle}</DialogTitle>
            <DialogDescription>
              They disappear from the album right away and are permanently
              deleted after a short grace period. Guests won&rsquo;t see them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={() => run("delete")}>
                Remove
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
