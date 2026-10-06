"use client";

import { RelationToggle } from "@/components/social/relation-toggle";

/**
 * THE FOLLOW FACE of the one relation control (`relation-toggle.tsx`, whose header is the contract:
 * the flip at once, a landed follow kept as the button's own, a refusal sprung back with the server's
 * words, the page re-read by the Server Function rather than by hand). Rendered ONLY for a signed-in,
 * non-self, non-blocked viewer (the SERVER decides all three; this never re-checks). Under a
 * just-created block the action still reports ok while writing nothing (the block-silent contract),
 * and the profile's re-render hides this button entirely.
 *
 * ★ THE QUIETER FOLLOW (`quiet`; his guest-capture note: "Follow doesn't have to be pushed as hard as
 * a feature relative to uploads/verifications/etc.", and `identity-claims` r2's `next=both`, "a small
 * Follow beside" Open album): a small ghost button in the muted ink, beside what matters more, never
 * the filled one a profile page leads with. `name` says who where nothing beside the button does
 * ("Follow Tom").
 */
export function FollowButton({
  profileId,
  initialFollowing,
  quiet = false,
  size,
  name,
}: {
  profileId: string;
  initialFollowing: boolean;
  quiet?: boolean;
  /** The button's size; the quiet one defaults to `sm`, the page's to the default. */
  size?: "xs" | "sm" | "default";
  /** Whom it follows, said in the button, where no row beside it names them. */
  name?: string;
}) {
  return (
    <RelationToggle
      relation="follow"
      profileId={profileId}
      on={initialFollowing}
      quiet={quiet}
      size={size}
      label={name}
    />
  );
}
