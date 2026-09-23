"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, MoreHorizontal, ShieldOff, UserRoundX } from "lucide-react";
import { toast } from "sonner";

import {
  blockProfileAction,
  unblockProfileAction,
} from "@/app/(guest)/u/[slug]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * The menu on /u/[slug] for a signed-in, non-self viewer: report this person,
 * or block them.
 *
 * ★ TWO ROWS, BECAUSE SOMEONE WHO WANTS TO BLOCK USUALLY WANTS TO TELL SOMEBODY
 * (Will, `block=report`, 2026-09-19: "This establishes a more scalable
 * pattern/menu for other usage as well"). Blocking is a private act between two
 * people and changes nothing for anyone else; reporting is how a person reaches
 * the operator. Offering only the first told everybody that Partyreel had
 * nowhere to take a complaint about a person, which was true until this round
 * and is not any more: the row writes a real row into the same queue that holds
 * reported photographs (/admin/reports).
 *
 * Blocking is PRIVATE: the other side is never notified and can't see it, so
 * the confirm copy says so (unchanged, profiles-social.md point 5). After a
 * block the refresh hides the follow button (the server's blocked-either-way
 * gate) while the profile itself stays public-by-existence, and THIS MENU STAYS
 * VISIBLE under a block in either direction: a menu that vanished would tell
 * the other side they had been blocked, which is the one thing a block promises
 * it will not do.
 */
export function ProfileActionsMenu({
  profileId,
  slug,
  displayName,
  blocked,
}: {
  profileId: string;
  slug: string;
  displayName: string | null;
  /** Whether *I* currently block this profile (drives Block vs Unblock). */
  blocked: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [reporting, startReport] = useTransition();
  const name = displayName ?? "this person";

  function runBlock() {
    startTransition(async () => {
      const result = await blockProfileAction(profileId, slug);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setConfirmOpen(false);
      toast.success(`Blocked ${name}.`);
      router.refresh();
    });
  }

  function runUnblock() {
    startTransition(async () => {
      const result = await unblockProfileAction(profileId, slug);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Unblocked ${name}.`);
      router.refresh();
    });
  }

  // The same endpoint and the same shape as a reported photograph, with a
  // person in place of the album: one queue, one rate limit, one status
  // machine. The route re-verifies the signed-in viewer, so nothing sent from
  // here is trusted.
  function runReport() {
    startReport(async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile_id: profileId,
            reason: reason.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const message =
            data && typeof data === "object" && "message" in data
              ? String((data as { message: unknown }).message)
              : "Please try again.";
          throw new Error(message);
        }
        setReportOpen(false);
        setReason("");
        toast.success("Thanks. Your report has been sent for review.");
      } catch (err) {
        toast.error("Couldn't send your report.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="More options"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        {/* Two rows, and still no title row or footer rail: Card's parts are for
            a menu with something to say, and each of these is one verb. The
            destructive variant is the whole signal on the block, and each row's
            dialog is where the act is actually explained. */}
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag /> Report this person
          </DropdownMenuItem>
          {blocked ? (
            <DropdownMenuItem onSelect={runUnblock} disabled={pending}>
              <ShieldOff /> Unblock
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              <UserRoundX /> Block
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {name}?</DialogTitle>
            <DialogDescription>
              Tell us what&rsquo;s wrong and our team will review it. They
              won&rsquo;t be told who reported them. Reporting someone
              doesn&rsquo;t block them, and it doesn&rsquo;t change what you see.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="profile-report-reason">
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="profile-report-reason"
              rows={4}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What's the problem here?"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportOpen(false)}
              disabled={reporting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={runReport} disabled={reporting}>
              {reporting ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {name}?</DialogTitle>
            <DialogDescription>
              You&rsquo;ll stop following each other, and neither of you can
              follow the other again while the block is on. They won&rsquo;t be
              notified, and they can&rsquo;t see that you blocked them. You can
              undo this anytime from your account settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={runBlock}
              disabled={pending}
            >
              {pending ? "Blocking…" : "Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
