"use client";

import dynamic from "next/dynamic";
import { Ban } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * BLOCK, AS A PERSON'S LOOK CARRIES IT (Will, event-safety `entry=all`: "When a guest name is clicked
 * in the lightbox or guest room with the intention of learning more about that user/profile, making
 * this screen open into a block-heavy view feels far less social, more administrative. Block should be
 * a minor, more subtle action when opening a user preview").
 *
 * So the look stays social (the face, the name, the page and Follow lead it) and Block is its last,
 * quietest line: small muted text under a hairline, the destructive ink only under the pointer, for
 * the host alone (the surfaces pass it only to the host). Pressing it opens the one block screen
 * (`BlockConfirm`), which is where the act and its weight live.
 */
export function BlockLookAction({
  onPress,
  className,
}: {
  onPress: () => void;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-border/60 pt-2", className)}>
      <button
        type="button"
        onClick={onPress}
        data-block-look=""
        className={cn(
          "-mx-1 flex items-center gap-1.5 rounded-sm px-1 py-1 text-xs text-muted-foreground outline-none",
          "transition-colors duration-150 ease-emphasis hover:text-destructive focus-visible:text-destructive focus-halo",
        )}
      >
        <Ban className="size-3.5" aria-hidden />
        Block from this event
      </button>
    </div>
  );
}

/**
 * The block screen, split from every bundle that only ever shows a look (the guest album's list and
 * its viewer credit carry the look too, and never a Block): it loads the first time a host presses
 * Block, and stays mounted after, so it closes with its own exit.
 */
export const LazyBlockConfirm = dynamic(
  () => import("./block-confirm").then((m) => m.BlockConfirm),
  { ssr: false },
);
