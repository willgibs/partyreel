"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ShieldOff, UserRoundX } from "lucide-react";
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

/**
 * The quiet overflow on /u/[slug] for a signed-in, non-self viewer: Block (with
 * a confirm naming exactly what it does, profiles-social.md point 5) or Unblock. Blocking
 * is PRIVATE: the other side is never notified and can't see it, so the copy
 * says so. After a block the page refresh hides the follow button (the server's
 * blocked-either-way gate) while the profile itself stays public-by-existence.
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
  const [pending, startTransition] = useTransition();
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
        <DropdownMenuContent align="end">
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
