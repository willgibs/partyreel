"use client";

/**
 * WHAT THE TAP OPENS: a choice of our own, which keeps the focus on the two
 * ways to add and carries one custom design across every operating system.
 *
 * Every Add in the guest page — the row under the event's name, the dock, the
 * empty album's own CTA — opens THIS. Two rows name the two acts the phone's
 * own chooser never distinguishes, and at a party the one that matters most has
 * not been taken yet.
 *
 * ★ IT IS A QUICK CHOICE, SO IT OPENS AS ONE (`popups` r1, `choices=menu`, Will
 * 2026-09-27): at a desk a menu under the Add she pressed, like any menu; in a
 * hand the two rows rise to her thumb as the phone's own chooser does, Cancel
 * beneath (`ui/responsive-menu.tsx`). A row is the act: Take a photo opens the
 * camera, there is no Next.
 *
 * ★ HER PICKS ARE REVIEWED IN A CONFIRMATION, since the menu that asked is gone
 * by the time the picker hands them back: "Send these 3?" is the app asking
 * before it acts, a centred dialog sized to list them (`confirm`, `md`). Taking
 * the last one out goes back to the two rows, as it always has.
 *
 * ★ THE `.click()` IS SYNCHRONOUS WITH THE TAP, AND THAT IS NOT A STYLE CHOICE.
 * Safari only opens a file picker inside the gesture that asked for it, so ONE
 * `await` anywhere between the row's `onClick` and `input.click()` silently
 * drops the picker on iOS and the guest taps a button that does nothing. That is
 * why both inputs are mounted here and clicked directly rather than, say, minted
 * on demand or reached through a promise.
 *
 * ★ AND BOTH INPUTS LIVE IN THE PAGE, NEVER IN THE MENU. A menu's content
 * unmounts the moment a row closes it, and an input that unmounts before the
 * picker hands its files back never fires `change`: the picks would vanish. So
 * the inputs sit beside the menu, in the page, where they outlive it; a Radix
 * layer's `aria-hidden` and focus trap are no bar to a programmatic `.click()`
 * (the one thing the rows do to them), which is what the old home inside the
 * sheet's content was guarding against. The `.click()` itself still runs
 * inside the row's own tap.
 *
 * ★ TWO INPUTS, BECAUSE `capture` CANNOT BE BOTH. With `capture` the input opens
 * the camera directly; without it, the chooser. The camera row therefore takes a
 * PHOTOGRAPH and only a photograph: iOS ignores `multiple` under `capture`
 * anyway, and Android shows a Camera/Camcorder chooser the moment video is
 * accepted, which is a third decision in front of a guest who has already made
 * two. The album row takes both kinds, many at a time.
 *
 * ★ NO FIELD IS EVER TYPED IN HERE, so no keyboard rises into it.
 */
import { useRef, useState } from "react";
import { Camera, Images } from "lucide-react";

import { ReviewStep, type Pick } from "@/components/guest/upload/review-step";
import { uploadTermsLine } from "@/components/guest/upload/upload-terms";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
} from "@/components/ui/responsive-menu";
import { formatCount } from "@/lib/format/count";

/**
 * ★ THE BODY IS ITS OWN EXPORT. The guest door's UPLOAD step asks for the first photograph
 * INSIDE the entry sheet, and a Radix dialog `aria-hidden`s everything outside itself: an input
 * parked in the page would be inert while the door is open, and a second sheet over the first is
 * two things to dismiss in the dark at a party. So the two inputs, the two rows, the terms line and
 * the review swap live in `UploadIntentBody`, which the album's sheet wraps and the door's step
 * renders directly. The Safari-synchronous `.click()` rule travels with it unchanged, because the
 * inputs travel with it.
 *
 * The body owns no open state and no header: whoever mounts it owns the surface, and asks for the
 * heading with `headingFor(picks.length)` so the sheet's title and the step's own heading say the
 * same words without either one importing the other's shell.
 */
export function uploadIntentHeading(pickCount: number): {
  title: string;
  description: string;
  reviewing: boolean;
} {
  if (pickCount === 0) {
    return { title: "Add photos", description: "", reviewing: false };
  }
  return {
    title:
      pickCount === 1
        ? "Send this one?"
        : `Send these ${formatCount(pickCount)}?`,
    description: "Tap the cross on anything you did not mean to pick.",
    reviewing: true,
  };
}

export function UploadIntentBody({
  picks,
  onPicks,
  onSend,
  capBytes,
  acceptsVideo = true,
  /** The door's step replaces the two rows' footer with its own (a skip, or the held line). */
  footer,
  className,
}: {
  picks: readonly Pick[];
  onPicks: (picks: Pick[]) => void;
  onSend: (files: File[]) => void;
  capBytes?: number | null;
  /**
   * Whether this album takes a video from a guest (`accepts_video`: the host's Videos switch on a
   * plan that takes video). Off, the album's picker offers photographs alone and the line names only
   * them, so a guest is never handed a video the album would refuse after it flew.
   */
  acceptsVideo?: boolean;
  footer?: React.ReactNode;
  className?: string;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  const take = (input: HTMLInputElement) => {
    const files = Array.from(input.files ?? []);
    // Reset so re-picking the same file fires change again (a guest who
    // removed a pick and wants it back after all).
    input.value = "";
    if (files.length === 0) return;
    onPicks(files.map((file) => ({ id: crypto.randomUUID(), file })));
  };

  const reviewing = picks.length > 0;

  return (
    <div className={className}>
      {/* The two inputs, mounted whichever step is showing, so a row's tap
          never waits on a render before it can click one. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => take(e.currentTarget)}
      />
      <input
        ref={albumRef}
        type="file"
        accept={acceptsVideo ? "image/*,video/*" : "image/*"}
        multiple
        hidden
        onChange={(e) => take(e.currentTarget)}
      />

      {reviewing ? (
        <ReviewStep
          picks={picks}
          capBytes={capBytes}
          acceptsVideo={acceptsVideo}
          onRemove={(id) => onPicks(picks.filter((p) => p.id !== id))}
          onSend={() => onSend(picks.map((p) => p.file))}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="cta"
            className="w-full justify-start active:scale-[0.99] motion-reduce:active:scale-100"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera /> Take a photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="cta"
            className="w-full justify-start active:scale-[0.99] motion-reduce:active:scale-100"
            onClick={() => albumRef.current?.click()}
          >
            <Images /> Choose from your album
          </Button>
          {/* The facts of the act, quietly, under the two doors into it. */}
          <p
            data-upload-terms
            className="pt-1 text-center text-reading text-muted-foreground"
          >
            {uploadTermsLine(capBytes, acceptsVideo)}
          </p>
          {footer}
        </div>
      )}
    </div>
  );
}

/** Whatever the picker handed back, as picks (each its own identity: a File is not a key). */
function takePicks(input: HTMLInputElement): Pick[] {
  const files = Array.from(input.files ?? []);
  // Reset so re-picking the same file fires change again (a guest who removed
  // a pick and wants it back after all).
  input.value = "";
  return files.map((file) => ({ id: crypto.randomUUID(), file }));
}

export function UploadIntentSheet({
  open,
  onOpenChange,
  hostName,
  onSend,
  capBytes,
  acceptsVideo = true,
}: {
  /** The two rows: the choice itself. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The host's display name, so the choice says whose album this joins. */
  hostName: string;
  /** The kept picks, once the guest has reviewed them. */
  onSend: (files: File[]) => void;
  /** The host's own per-event cap once the RPC returns it (upload-terms.ts). */
  capBytes?: number | null;
  /** Whether this album takes a video from a guest (the body's own note). */
  acceptsVideo?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const heading = uploadIntentHeading(picks.length);

  const took = (input: HTMLInputElement) => {
    const next = takePicks(input);
    if (next.length === 0) return;
    setPicks(next);
    setReviewing(true);
  };

  return (
    <>
      {/* The two inputs, in the page where they outlive the menu (see the head
          comment), mounted always so a row's tap never waits on a render
          before it can click one. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => took(e.currentTarget)}
      />
      <input
        ref={albumRef}
        type="file"
        accept={acceptsVideo ? "image/*,video/*" : "image/*"}
        multiple
        hidden
        onChange={(e) => took(e.currentTarget)}
      />

      <ResponsiveMenu
        open={open}
        onOpenChange={onOpenChange}
        anchor="pressed"
        title={`Everything you add joins ${hostName}’s album.`}
        className="w-80"
      >
        <ResponsiveMenuItem
          icon={<Camera />}
          onSelect={() => cameraRef.current?.click()}
        >
          Take a photo
        </ResponsiveMenuItem>
        <ResponsiveMenuItem
          icon={<Images />}
          onSelect={() => albumRef.current?.click()}
        >
          Choose from your album
        </ResponsiveMenuItem>
        {/* The facts of the act, quietly, under the two doors into it. */}
        <ResponsiveMenuNote data-upload-terms>
          {uploadTermsLine(capBytes, acceptsVideo)}
        </ResponsiveMenuNote>
      </ResponsiveMenu>

      <Popup
        open={reviewing}
        onOpenChange={(next) => {
          if (!next) setReviewing(false);
        }}
      >
        <PopupContent
          kind="confirm"
          size="md"
          onAnimationEnd={(e) => {
            /**
             * The picks die with the review, but only once it has ACTUALLY
             * closed: clearing them in the same tick as the close would empty
             * the grid (and turn the title back to "Add photos") while the
             * dialog is still visibly playing its exit. `e.target ===
             * e.currentTarget` skips a bubbled animation from a child;
             * `!reviewing` skips the entrance's own end.
             */
            if (e.target === e.currentTarget && !reviewing) setPicks([]);
          }}
        >
          <PopupHeader
            title={heading.title}
            description={heading.description}
          />
          <PopupBody>
            <ReviewStep
              picks={picks}
              capBytes={capBytes}
              acceptsVideo={acceptsVideo}
              onRemove={(id) => {
                const kept = picks.filter((p) => p.id !== id);
                // ★ REMOVING THE LAST ONE GOES BACK, IT DOES NOT SEND NOTHING:
                // the review closes (its last pick stays drawn through the
                // exit, then goes with it) and the two rows are asked again.
                if (kept.length === 0) {
                  setReviewing(false);
                  onOpenChange(true);
                  return;
                }
                setPicks(kept);
              }}
              onSend={() => {
                setReviewing(false);
                onSend(picks.map((p) => p.file));
              }}
            />
          </PopupBody>
        </PopupContent>
      </Popup>
    </>
  );
}
