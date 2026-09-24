"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { cn } from "@/lib/utils";

// Mobile-first picker: a tappable area wrapping a hidden file input. On phones the
// native input opens the camera/library; on desktop it also accepts drag-and-drop.
// (No dropzone primitive in the registry — this is intentionally minimal.)
export function FileDropzone({
  onFiles,
  disabled,
  // When false (a free host's event), restrict the native picker to images
  // so the host can't even select a video. Guests always leave this true — they never
  // learn the host's tier, so a guest's video is rejected at presign instead (the
  // event-framed "photos only" message). Default true preserves the guest behavior.
  allowVideos = true,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  allowVideos?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
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
        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-[transform,border-color,background-color] duration-150 ease-emphasis outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99]",
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
        Tap to choose, or drag them here
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
