"use client";

import { useState } from "react";

import { Wrench } from "lucide-react";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";

import { rebuildStorageSumsAction } from "./actions";

/**
 * REBUILD, beside each host the storage sums' check names (storage-sums-signal): the operator's fix, behind the
 * portal's one confirmation like every control here. It names her (her address where her profile has one), says what
 * it rewrites, and that she is checked again at once; the card is the authority on what moved, so the toast only says
 * it ran. Reversible, so nothing to type: her sums are the database's own reckoning of her items, made again from them.
 */
export function StorageSumsRebuild({
  hostId,
  name,
}: {
  hostId: string;
  /** Who she is on the card: her address, else her id. */
  name: string;
}) {
  const [asking, setAsking] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setAsking(true)}
        aria-label={`Rebuild the storage sums of ${name}`}
      >
        <Wrench className="size-3.5" aria-hidden />
        Rebuild
      </Button>
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title={`Rebuild the storage sums of ${name}?`}
        lede="Her sums are made again from her items, under her lock: what her plan's meter, every upload's cap check and her size list read."
        verb="Rebuild"
        working="Rebuilding"
        touches={[
          "Her rows in event_storage_sums and host_storage_sums, dropped and made again from her media; nothing else of hers is written",
          "Her uploads wait on her lock for the moment it takes, then go on",
          "She is checked against the walk at once, and the card keeps what moved",
        ]}
        severity="reversible"
        // Not "fixed": the check after it is the authority, and the card says whether she reads at parity.
        successMessage="Rebuilt and checked again: the card says what moved."
        onConfirm={() => rebuildStorageSumsAction(hostId)}
      />
    </>
  );
}
