"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import { DOCK_PILL } from "@/components/lab";

import type { LitStill } from "./fixtures";

/**
 * TRY YOUR PHOTOS: the look judged on photographs of the reader's own (his r2
 * `save` note asked for "a live preview ... or some examples of how it's being
 * used"). The board's twelve party photographs are the default; this swaps in
 * any the reader picks, on the phone the camera roll, at a desk a folder (the
 * fixtures folder beside the repo is one), and every frame of the look's
 * decision redraws in them.
 *
 * ★ A LAB INSTRUMENT, NOT A PREVIEW, AND NOTHING LEAVES THE DEVICE. The files
 * become object URLs in this tab and nothing else: no upload, no storage, no
 * request. They live until the tab closes or Use the party set lets them go.
 *
 * ★ ONE STORE FOR THE DOCK AND THE FRAMES. A portalled frame renders in the
 * board's own React tree, so the frames read the same module store the dock
 * writes, with no message between documents.
 */

let tried: readonly LitStill[] = [];
const listeners = new Set<() => void>();

function set(next: readonly LitStill[]) {
  for (const s of tried) URL.revokeObjectURL(s.src);
  tried = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The reader's own photographs, or none: the frames fall back to the set. */
export function useTriedPhotos(): readonly LitStill[] {
  return useSyncExternalStore(
    subscribe,
    () => tried,
    () => tried,
  );
}

/** A file, read into a still: its size off the decoded picture, its name for its light. */
async function stillOf(file: File, i: number): Promise<LitStill | null> {
  const src = URL.createObjectURL(file);
  try {
    const bmp = await createImageBitmap(file);
    const still = {
      id: `tried-${i}`,
      src,
      width: bmp.width,
      height: bmp.height,
      light: file.name.replace(/\.[^.]+$/, ""),
    };
    bmp.close();
    return still;
  } catch {
    // A picture this browser cannot decode (a HEIC outside Safari): left out, and said.
    URL.revokeObjectURL(src);
    return null;
  }
}

export function TryPhotos() {
  const input = useRef<HTMLInputElement | null>(null);
  const mine = useTriedPhotos();
  const [skipped, setSkipped] = useState(0);
  async function take(files: FileList | null) {
    if (!files?.length) return;
    const read = await Promise.all([...files].slice(0, 24).map(stillOf));
    const ok = read.filter((s): s is LitStill => s !== null);
    setSkipped(read.length - ok.length);
    if (ok.length) set(ok);
  }
  return (
    <>
      <button
        type="button"
        className={DOCK_PILL}
        onClick={() => input.current?.click()}
        title="The look's frames redraw in photographs of yours. Nothing leaves this device."
      >
        {mine.length
          ? `Your ${mine.length} photo${mine.length === 1 ? "" : "s"}${skipped ? ` (${skipped} unreadable here)` : ""}`
          : "Try your photos"}
      </button>
      {mine.length > 0 && (
        <button
          type="button"
          className={DOCK_PILL}
          onClick={() => {
            setSkipped(0);
            set([]);
          }}
        >
          Use the party set
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void take(e.currentTarget.files);
          e.currentTarget.value = "";
        }}
      />
    </>
  );
}
