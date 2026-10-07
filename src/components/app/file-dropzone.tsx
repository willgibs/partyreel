"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * THE HOST'S MANUAL ADD: the box at the head of her upload panel (`host-upload.tsx`, its one caller), a tap target
 * over a hidden multi-file input that also takes a drop at a desk. It lived in `guest/` from when the guest's upload
 * drew it; every Add on the guest page now opens the intent sheet (`guest/upload/intent-sheet.tsx`: Take a photo, or
 * Choose from your album), so it is the host's alone and lives beside the panel it serves (crumbs-91). No dropzone
 * primitive is in the registry: this is intentionally minimal.
 *
 * ★ ITS HINT IS WORDED FOR THE DEVICE IN HAND, BY CSS ALONE. A phone has no drag and a desk clicks rather than taps,
 * so a coarse pointer reads "Tap to choose" and any other "Click to choose, or drag them here" (the one line said "Tap
 * to choose, or drag them here", half wrong on either). Both lines are in the markup and the pointer's media query
 * shows one (`pointer-coarse:`), so the server's first paint is already the right one, where a read of the pointer at
 * render would paint one device's words everywhere and swap them after hydration. The line not shown is
 * `display: none`, so a screen reader hears only the one on screen.
 */
export function FileDropzone({
  onFiles,
  disabled,
  allowVideos,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  /**
   * Whether her plan takes video: when false the native picker offers images only, so she cannot even select one.
   * Required, since a plan's fact is never a default; a dropped video is the presign's to refuse, in its own words.
   */
  allowVideos: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    // A disabled box takes no files, whichever way they come.
    if (disabled || !list || list.length === 0) return;
    onFiles(Array.from(list));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full focus-halo cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-[transform,border-color,background-color] duration-150 ease-emphasis outline-none active:scale-[0.99]",
        dragging && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-background text-primary">
        <ImagePlus className="size-6" />
      </div>
      <p className="text-sm font-medium">
        {allowVideos ? "Add photos & videos" : "Add photos"}
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="pointer-coarse:hidden">
          Click to choose, or drag them here
        </span>
        <span className="hidden pointer-coarse:inline">Tap to choose</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={allowVideos ? "image/*,video/*" : "image/*"}
        multiple
        hidden
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset so re-selecting the same file fires onChange again.
          e.target.value = "";
        }}
      />
    </div>
  );
}
