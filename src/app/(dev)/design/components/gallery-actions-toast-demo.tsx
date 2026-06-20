"use client";

import { EyeOff, Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Interactive feedback demo for the gallery-action model (3c.2 lab shaping).
 * Static mocks can't fire a toast, so this lets Will FEEL the Like + Hide
 * confirmations and lock the copy. Per Will (2026-06-20): Like should reframe
 * the heart as building YOUR collection (not a social "I like your photo"
 * ping); Hide should reassure it hides for ALL guests (so a host doesn't
 * over-delete to be safe). The real Toaster is mounted in the root layout, so
 * these fire live. Imperative onClick => a client island (the lab convention
 * for interactive reference, see reference/interactive-demos.tsx).
 */
export function GalleryActionsToastDemo() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Added to your likes")}
        >
          <Heart className="size-4 fill-current text-like" /> Like
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Hidden from everyone")}
        >
          <EyeOff className="size-4 text-warning" /> Hide &middot; &ldquo;from
          everyone&rdquo;
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Hidden from public view")}
        >
          <EyeOff className="size-4 text-warning" /> Hide &middot; &ldquo;from
          public view&rdquo;
        </Button>
      </div>
      <p className="max-w-xl text-xs text-muted-foreground">
        Tap each to feel the toast and lock the wording. In production the Hide
        toast can fire wherever a host hides (the tile hover row AND the
        lightbox) or the lightbox only, your call. Like fires anywhere a host or
        guest likes.
      </p>
    </div>
  );
}
