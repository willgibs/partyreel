"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { finishClaimsAction } from "@/app/(app)/dashboard/claims-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClaimableEventRow } from "@/lib/db/queries/claims";
import { formatEventDate } from "@/lib/utils";

type Decision = "claim" | "disown";

function namesLabel(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `Added as ${names[0]}`;
  if (names.length === 2) return `Added as ${names[0]} and ${names[1]}`;
  return `Added as ${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function formatUploadTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function metaLine(row: ClaimableEventRow): string {
  return [
    row.eventDate ? formatEventDate(row.eventDate) : null,
    namesLabel(row.names),
    `${row.uploadCount} photo${row.uploadCount === 1 ? "" : "s"}`,
    row.lastUploadAt ? `last added ${formatUploadTimestamp(row.lastUploadAt)}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function totalPhotos(list: ClaimableEventRow[]): number {
  return list.reduce((sum, r) => sum + r.uploadCount, 0);
}

/**
 * The confirm-delete title, pluralised for every count (pinned in
 * claims-card.test.tsx for all four forms below). The count is of uploads of
 * EITHER type (the RPC's `upload_count` never splits photos from videos), so
 * one upload reads "photo or video" (never "photo", which would lie when
 * the one upload is a video) and several read "photos and videos"; one event
 * reads "this event", several name the count.
 */
function confirmDeleteTitle(photos: number, events: number): string {
  const photoPhrase =
    photos === 1 ? "1 photo or video" : `${photos} photos and videos`;
  const eventPhrase = events === 1 ? "this event" : `these ${events} events`;
  return `Permanently delete the ${photoPhrase} added under your email at ${eventPhrase}?`;
}

/**
 * THE CLAIM TICKET (the guest identity round, 2026-09-22; rulings.md "guest
 * identity: name only, unconfirmed email, verified account"). Rendered only
 * when `rows` is non-empty — a confirmed caller with events waiting under the
 * email on their account, from before it was confirmed.
 *
 * Deliberately plain: this is wave 1's wiring of a ruled model, not the
 * ticket's real shape (rulings.md: "The flows around the claim ticket ...
 * go to one identity-flows board once the foundation is on the tree"). One
 * card, one decision per EVENT (never per guest row: `getMyClaimableGuestRows`
 * already grouped rows that share an event), two ways to finish:
 *
 *   - "Claim all" is a SHORTCUT that bypasses the per-row picks entirely and
 *     sends the RPC `null` ("every row of mine"), which needs no confirmation
 *     because nothing is being removed.
 *   - "Finish" reads the per-row picks: anything left NOT explicitly claimed
 *     (marked "Not mine", or simply never touched) is what Will's ruling
 *     calls "the guest effectively requesting 'get rid of that'" — so when
 *     that set is non-empty, a confirmation names the events and the count
 *     before anything is written; when every row was explicitly claimed,
 *     Finish commits at once.
 *
 * Nothing here is optimistic: this writes real deletions, so every commit
 * waits for the server and either toasts success and hides (the parent page
 * revalidates behind it) or toasts the failure and leaves the picks standing
 * so the guest can retry.
 */
export function ClaimsCard({ rows }: { rows: ClaimableEventRow[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0 || finished) return null;

  const claimedRows = rows.filter((r) => decisions[r.eventId] === "claim");
  const leftoverRows = rows.filter((r) => decisions[r.eventId] !== "claim");

  function decide(eventId: string, next: Decision) {
    setDecisions((prev) => {
      const copy = { ...prev };
      if (copy[eventId] === next) delete copy[eventId];
      else copy[eventId] = next;
      return copy;
    });
  }

  function runFinish(
    claimIds: string[] | null,
    disownIds: string[],
    photosClaimed: number,
  ) {
    startTransition(async () => {
      const result = await finishClaimsAction({ claimIds, disownIds });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (photosClaimed > 0) {
        toast.success(
          `Added ${photosClaimed} photo${photosClaimed === 1 ? "" : "s"} to your account.`,
        );
      } else {
        toast.success("Done. Nothing was added to your account.");
      }
      setFinished(true);
    });
  }

  function handleClaimAll() {
    runFinish(null, [], totalPhotos(rows));
  }

  function handleFinish() {
    if (leftoverRows.length > 0) {
      setConfirmOpen(true);
      return;
    }
    runFinish(
      claimedRows.map((r) => r.eventId),
      [],
      totalPhotos(claimedRows),
    );
  }

  function confirmFinish() {
    setConfirmOpen(false);
    runFinish(
      claimedRows.map((r) => r.eventId),
      leftoverRows.map((r) => r.eventId),
      totalPhotos(claimedRows),
    );
  }

  const leftoverPhotos = totalPhotos(leftoverRows);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              Photos waiting for you
            </span>
          </CardTitle>
          <CardDescription>
            Added at events with the email on this account, before it was
            confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {rows.map((row) => {
              const decision = decisions[row.eventId];
              return (
                <li
                  key={row.eventId}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.eventName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {metaLine(row)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={decision === "claim" ? "default" : "outline"}
                      aria-pressed={decision === "claim"}
                      disabled={isPending}
                      onClick={() => decide(row.eventId, "claim")}
                    >
                      Claim
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={decision === "disown" ? "destructive" : "ghost"}
                      aria-pressed={decision === "disown"}
                      disabled={isPending}
                      onClick={() => decide(row.eventId, "disown")}
                    >
                      Not mine
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleClaimAll}
          >
            Claim all
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={handleFinish}
          >
            Finish
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDeleteTitle(leftoverPhotos, leftoverRows.length)}
            </DialogTitle>
            <DialogDescription>
              {leftoverRows.map((r) => r.eventName).join(", ")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Go back</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={confirmFinish}
            >
              Delete and finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
