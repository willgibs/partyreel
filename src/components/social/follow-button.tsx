"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  followProfileAction,
  unfollowProfileAction,
} from "@/app/(guest)/u/[slug]/actions";
import { Button } from "@/components/ui/button";

/**
 * The /u/[slug] follow control. Rendered ONLY for a signed-in, non-self,
 * non-blocked viewer (the SERVER decides all three; this component never
 * re-checks). Optimistic flip (a follow is the page's highest-frequency act:
 * instant, no spinner), reconciled by router.refresh() on settle. Under a
 * just-created block the action still reports ok while writing nothing (the
 * block-silent contract) — the refresh then hides this button entirely.
 */
export function FollowButton({
  profileId,
  slug,
  initialFollowing,
}: {
  profileId: string;
  slug: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useOptimistic(initialFollowing);

  function toggle() {
    if (pending) return;
    startTransition(async () => {
      const next = !following;
      setFollowing(next);
      const result = next
        ? await followProfileAction(profileId, slug)
        : await unfollowProfileAction(profileId, slug);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      onClick={toggle}
      aria-pressed={following}
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
