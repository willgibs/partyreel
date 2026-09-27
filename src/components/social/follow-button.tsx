"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  followProfileAction,
  unfollowProfileAction,
} from "@/app/(guest)/u/[slug]/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The follow control. Rendered ONLY for a signed-in, non-self, non-blocked
 * viewer (the SERVER decides all three; this component never re-checks).
 * Optimistic flip (a follow is the page's highest-frequency act: instant, no
 * spinner), reconciled by router.refresh() on settle. Under a just-created
 * block the action still reports ok while writing nothing (the block-silent
 * contract) — the refresh then hides this button entirely.
 *
 * ★ A FOLLOW THAT LANDED STAYS FOLLOWED. The optimistic flip lasts only while
 * its action runs, and falls back to the settled answer after it: that answer
 * is the server's (`initialFollowing`, re-read by the refresh) on /u/[slug],
 * but on the moment card and a claimed event's row nothing re-reads it, so a
 * Follow that succeeded used to spring back to "Follow" as its action ended.
 * The settled answer is this button's own once an action lands, and a changed
 * `initialFollowing` from the server still wins.
 *
 * ★ THE QUIETER FOLLOW (`quiet`; his guest-capture note: "Follow doesn't have
 * to be pushed as hard as a feature relative to uploads/verifications/etc.",
 * and `identity-claims` r2's `next=both`, "a small Follow beside" Open album):
 * a small ghost button in the muted ink, beside what matters more, never the
 * filled one a profile page leads with. `name` says who where nothing beside
 * the button does ("Follow Tom").
 */
export function FollowButton({
  profileId,
  slug,
  initialFollowing,
  quiet = false,
  size,
  name,
}: {
  profileId: string;
  slug: string;
  initialFollowing: boolean;
  quiet?: boolean;
  /** The button's size; the quiet one defaults to `sm`, the page's to the default. */
  size?: "xs" | "sm" | "default";
  /** Whom it follows, said in the button, where no row beside it names them. */
  name?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settled, setSettled] = useState(initialFollowing);
  const [serverSaid, setServerSaid] = useState(initialFollowing);
  if (initialFollowing !== serverSaid) {
    setServerSaid(initialFollowing);
    setSettled(initialFollowing);
  }
  const [following, setFollowing] = useOptimistic(settled);

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
      setSettled(next);
      router.refresh();
    });
  }

  const label = following ? "Following" : "Follow";
  return (
    <Button
      type="button"
      variant={quiet ? "ghost" : following ? "outline" : "default"}
      size={size ?? (quiet ? "sm" : "default")}
      onClick={toggle}
      aria-pressed={following}
      className={cn(quiet && "text-muted-foreground")}
    >
      {following ? <UserCheck /> : <UserPlus />}
      {name ? `${label} ${name}` : label}
    </Button>
  );
}
