"use client";

import { useState } from "react";

import { RotateCcw } from "lucide-react";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";

import { restoreNowAction } from "./actions";

/**
 * RESTORE NOW, on the backup restore's card (durability-backups.md, "The restore"): the operator's run-now, behind the
 * portal's one confirmation like Run now on the jobs the app starts itself. It asks the backup Worker's door for a pass
 * at once (restore-now.ts); the pass reports on this card, so the toast says only that it began. Unwired (no
 * BACKUP_WORKER_URL), the button stays and is disabled, and the card's line says why: a button that lies is worse
 * than one that waits.
 */
export function RestoreNowControl({ wired }: { wired: boolean }) {
  const [asking, setAsking] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!wired}
        onClick={() => setAsking(true)}
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Restore now
      </Button>
      {wired ? (
        <DestructiveSheet
          open={asking}
          onOpenChange={setAsking}
          title="Run the backup restore now?"
          lede="A pass starts at once and does exactly what its daily one does."
          verb="Restore now"
          touches={[
            "Keys held by the backup alone, copied back into the primary bucket at the same keys",
            "Only keys a live row still names, each asked of the database first",
            "Never over an object that is there: every write refuses one",
            "In a dry run it copies nothing and says what it would",
          ]}
          severity="reversible"
          // Not "Done": the pass can outlive the press, and its card is the authority on what it copied.
          successMessage="Restore started. Refresh in a minute for what it copied."
          onConfirm={() => restoreNowAction()}
        />
      ) : null}
    </>
  );
}
