"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  unblockAction,
  unfollowAction,
} from "@/app/(app)/account/social-actions";
import { Button } from "@/components/ui/button";

// The two row actions of the /account Connections card. The LISTS render
// server-side (avatar URLs + names resolve in the RSC); only these buttons
// hydrate. Both actions revalidate /account, so the row disappears on success
// without any client bookkeeping.

export function UnfollowButton({
  profileId,
  displayName,
}: {
  profileId: string;
  displayName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await unfollowAction(profileId);
          if (!result.ok) toast.error(result.message);
          else toast.success(`Unfollowed ${displayName ?? "them"}.`);
        })
      }
    >
      {pending ? "Unfollowing…" : "Unfollow"}
    </Button>
  );
}

export function UnblockButton({
  profileId,
  displayName,
}: {
  profileId: string;
  displayName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await unblockAction(profileId);
          if (!result.ok) toast.error(result.message);
          else toast.success(`Unblocked ${displayName ?? "them"}.`);
        })
      }
    >
      {pending ? "Unblocking…" : "Unblock"}
    </Button>
  );
}
