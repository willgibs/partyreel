"use client";

/**
 * THE BEAT BETWEEN THE PICKER AND THE ALBUM: a guest previews the photos before
 * they upload, to catch an accidental selection.
 *
 * A guest clearing the night off a camera roll picks twelve and two of them are
 * a screenshot and the inside of a pocket. Without this step those go to the
 * host's album and stay there — the only way back is to find them again in a
 * grid of sixty and use Remove, which an anonymous guest can only do from the
 * device that sent them. One screen, one tap per mistake, and nothing has been
 * sent yet.
 *
 * ★ IT IS THE SAME SHEET, NOT A SECOND SURFACE. The picker returns into the
 * sheet the guest is already standing in (`intent-sheet.tsx` swaps the step),
 * so the act reads as one act. A dialog opening on top of a dialog at a party,
 * on a phone, in the dark, is two things to dismiss.
 *
 * ★ REMOVING THE LAST ONE GOES BACK, IT DOES NOT SEND NOTHING. The parent owns
 * that (`onEmpty`), because "there is nothing left to review" is a step change,
 * not a button state.
 */
import { X } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { uploadTermsLine } from "@/components/guest/upload/upload-terms";
import { usePickUrls } from "@/components/guest/upload/use-pick-urls";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";

/** A picked file with an identity of its own: a File is not a key, and two
 *  photographs off a camera roll can share a name, a size and a timestamp. */
export type Pick = { id: string; file: File };

export function ReviewStep({
  picks,
  onRemove,
  onSend,
  capBytes,
}: {
  picks: readonly Pick[];
  onRemove: (id: string) => void;
  onSend: () => void;
  /** The host's own per-event cap once the RPC returns it (upload-terms.ts). */
  capBytes?: number | null;
}) {
  // The sheet's own blob ledger: one owner, minting and revoking in one effect
  // (see use-pick-urls.ts for the StrictMode failure that shape exists to kill).
  const urls = usePickUrls(picks);
  return (
    <div className="flex flex-col gap-4">
      {/* The list scrolls, never the sheet: Send and the line under it stay
          reachable whether a guest picked three or thirty. The padding is the
          room the remove buttons OVERHANG into — without it they push the grid
          past its own box and the list grows a sideways scrollbar. */}
      <ul
        data-review-picks
        className="grid max-h-[38vh] grid-cols-4 gap-2 overflow-y-auto p-1.5 sm:grid-cols-5"
      >
        {picks.map((pick) => (
          <li key={pick.id} className="relative">
            <PickPreview
              file={pick.file}
              url={urls.get(pick.id)}
              className="aspect-square w-full"
            />
            <button
              type="button"
              onClick={() => onRemove(pick.id)}
              // The target is the corner of a small tile in a hand, so the
              // button is bigger than the glyph it draws and overhangs the
              // tile's own edge rather than eating into the photograph.
              className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-layer transition-transform duration-150 ease-emphasis active:scale-[0.88] motion-reduce:active:scale-100"
            >
              <X className="size-3.5" strokeWidth={2.5} aria-hidden />
              <span className="sr-only">Remove {pick.file.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="cta"
          className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
          onClick={onSend}
        >
          Send {formatCount(picks.length)}
        </Button>
        {/* The facts, under the button that acts on them, at the reading rung
            like every other sentence this act says. */}
        <p
          data-upload-terms
          className="text-center text-reading text-muted-foreground"
        >
          {uploadTermsLine(capBytes)}
        </p>
      </div>
    </div>
  );
}
