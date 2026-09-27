"use client";

import { Button } from "@/components/ui/button";
import {
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * THE BIN'S FINAL DELETE, SAID ONCE: the confirm behind Delete permanently,
 * opened from the bin's tile pane at a desk and from its viewer at every width
 * (each wraps its own trigger in a `Dialog` around this content). It skips the
 * window, so it names the window it skips, read off the constant.
 *
 * ★ A CONFIRMATION, NAMED AS ONE (`popups` r1, `confirm=dialog`). Its
 * content is the Popup's, which rides the same Radix Dialog root the two
 * callers wrap it in (a `Dialog` or a `Popup`), so neither changes.
 *
 * ★ A MODULE OF ITS OWN, not the capsule's: the bin's grid imports it for its
 * pane, and an import of `actions.tsx` would pull the viewer's capsule, which
 * loads lazily with the viewer (`media-lightbox.lazy.tsx`), into the hub's
 * first-load JS.
 */
export function PurgeConfirmContent({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <PopupContent kind="confirm">
      <PopupHeader
        title="Delete permanently?"
        description={
          <>
            This skips the {RECENTLY_DELETED_WINDOW_DAYS}-day recovery window
            and deletes the file for good. It can&rsquo;t be undone.
          </>
        }
      />
      <PopupFooter>
        <PopupClose asChild>
          <Button variant="outline">Cancel</Button>
        </PopupClose>
        <PopupClose asChild>
          <Button variant="destructive" disabled={disabled} onClick={onConfirm}>
            Delete permanently
          </Button>
        </PopupClose>
      </PopupFooter>
    </PopupContent>
  );
}
