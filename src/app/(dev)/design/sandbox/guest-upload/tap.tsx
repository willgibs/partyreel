"use client";

import { Camera, Images, ImageUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import { EVENT } from "./fixtures";

/**
 * THE INSTANT AFTER "ADD PHOTOS".
 *
 * Today there is exactly one hidden input on the page (`guest-upload.tsx`):
 * `accept="image/*,video/*"`, `multiple`, and NO `capture`. Every Add
 * affordance clicks it, and from there the operating system decides: its own
 * chooser opens with the camera and the library both in it. Nothing on the page
 * ever says "take one now" as a different act from "send one you already have",
 * which at a party is the difference between the photograph that exists and the
 * photograph that does not exist yet.
 *
 * `capture` is the one line of code under this decision. With it, the input
 * opens the camera directly; without it, the chooser. It cannot be both on one
 * input, which is why naming the two intents means having two of them.
 */

export type TapShape = "os" | "sheet" | "split";

export const tapOf = (v: string | undefined): TapShape =>
  v === "sheet" ? "sheet" : v === "split" ? "split" : "os";

/**
 * THE SYSTEM'S OWN CHOOSER, DRAWN AS A STAND-IN AND NOTHING MORE.
 *
 * ★ IT IS DELIBERATELY NOT A REPLICA. This surface belongs to the phone, not to
 * us: its corners, its type, its order and its words change with the OS and the
 * locale, and a careful copy of one vendor's sheet would be a picture of
 * something we do not control being judged as if we did. What IS under decision
 * is how much screen it takes, that its words are the system's rather than the
 * host's, and that today it is the only thing between a tap and a file. So it
 * is drawn as a labelled placeholder at about the height iOS gives it.
 */
export function SystemChooser() {
  return (
    <div
      data-gu-surface
      className="fixed inset-x-3 bottom-3 z-50 rounded-[14px] border border-dashed border-foreground/25 bg-muted/95 p-3"
    >
      <p className="pb-2 text-center text-[11px] tracking-wide text-faint uppercase">
        The phone&rsquo;s own chooser
      </p>
      <div className="space-y-px overflow-hidden rounded-[10px]">
        {["Photo Library", "Take Photo or Video", "Choose File"].map((row) => (
          <div
            key={row}
            className="bg-background/80 px-4 py-3 text-center text-[17px] text-muted-foreground"
          >
            {row}
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-[10px] bg-background/80 px-4 py-3 text-center text-[17px] font-medium text-muted-foreground">
        Cancel
      </div>
    </div>
  );
}

/** Our own sheet, naming the two intents in the host's language rather than the phone's. */
export function IntentSheet() {
  return (
    <div data-gu-surface className="gu-sheet">
      <div aria-hidden className="gu-handle" />
      <p className="pb-1 text-center text-[15px] font-medium">Add photos</p>
      <p className="pb-4 text-center text-[13px] text-muted-foreground">
        Everything you add joins {EVENT.host}&rsquo;s album.
      </p>
      <div className="space-y-2">
        <Button type="button" size="cta" className="w-full justify-start">
          <Camera /> Take a photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="cta"
          className="w-full justify-start"
        >
          <Images /> Choose from your album
        </Button>
      </div>
    </div>
  );
}

/** The action block's primary, as shipped: one button, and the system decides. */
export function OneAdd() {
  return (
    <Button type="button" size="lg" className="w-full">
      <ImageUp /> Add photos
    </Button>
  );
}

/**
 * Two affordances on the page and no sheet at all: the camera input and the
 * library input, each one tap from where the guest is already looking.
 */
export function SplitAdd() {
  return (
    <div className="space-y-2">
      <Button type="button" size="lg" className="w-full">
        <Camera /> Take a photo
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="w-full text-muted-foreground"
      >
        <Images /> Choose from your album
      </Button>
    </div>
  );
}
