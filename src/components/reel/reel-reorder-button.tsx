"use client";

import { Check, ListOrdered } from "lucide-react";

import { useReelReorder } from "@/components/reel/reel-reorder-provider";
import { Button } from "@/components/ui/button";

// The Reel section header's action (mirrors the gallery's Select button): "Reorder" enters drag mode,
// "Done" exits. size="sm" (h-7) so the shared FeedSectionHeader's min-h-7 row never bounces.
export function ReelReorderButton() {
  const reorder = useReelReorder();
  if (!reorder) return null;

  return reorder.reorderMode ? (
    <Button type="button" size="sm" onClick={reorder.exit}>
      <Check /> Done
    </Button>
  ) : (
    <Button type="button" variant="outline" size="sm" onClick={reorder.enter}>
      <ListOrdered /> Reorder
    </Button>
  );
}
