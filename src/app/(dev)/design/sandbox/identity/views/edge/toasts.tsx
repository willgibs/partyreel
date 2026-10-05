"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import type { ScreenProps } from "../screen-props";

import { HubPage } from "./hub";

/**
 * TOASTS WHILE UPLOADING, OVER THE ALBUM (the carried call `toast-light`, A2:
 * a toast says its state with a lit glyph): Maya is adding her photographer's
 * batch while the night's arrivals wait on her, so three toasts stand at the
 * top of her hub, the newest first, as production's one Toaster stacks them
 * (`ui/sonner.tsx`: top centre, always expanded, three at most):
 *  - a batch in progress, its spinner the loading glyph;
 *  - five approved, its check lit green, with the Undo every verdict carries
 *    (`undo-toast.ts`'s shape, Review's own words, its window held open);
 *  - two that did not go, its glyph lit red, staying until it is closed (the
 *    Toaster's patched `toast.error`).
 *
 * ★ PRODUCTION'S `toast`, NOTHING DRAWN: each is raised the way the hub raises
 * one, a beat after the page settles (a Toaster subscribes in its own effect),
 * and held up for the picture. ★ The upload's two lines are placeholders: a
 * host's batch reports in the album's own queue today (`host-upload.tsx`), so
 * its words are judged for size and wrapping, the failure's heading in the
 * guest's failure sheet's form ("N of SENT didn't upload").
 */

const HELD = { duration: Infinity } as const;

function useUploadToasts() {
  useEffect(() => {
    const ids: (string | number)[] = [];
    const t = window.setTimeout(() => {
      ids.push(
        toast.error("2 of 12 didn’t upload", {
          ...HELD,
          description: "IMG_2041.HEIC and IMG_2044.HEIC. Try them again.",
        }),
      );
      ids.push(
        toast.success("Approved 5 photos", {
          ...HELD,
          action: { label: "Undo", onClick: () => {} },
        }),
      );
      ids.push(
        toast.loading("Uploading 4 of 12", {
          ...HELD,
          description: "They land in the album as each one finishes.",
        }),
      );
    }, 450);
    return () => {
      window.clearTimeout(t);
      ids.forEach((id) => toast.dismiss(id));
    };
  }, []);
}

export function ToastsScreen({ w }: ScreenProps) {
  useUploadToasts();
  return <HubPage w={w} />;
}
