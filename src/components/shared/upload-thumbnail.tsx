"use client";

import { useEffect, useState } from "react";

import { videoPosterSrc } from "@/lib/media/poster";

// Square preview of a queued upload, shared by the guest + host upload lists so a guest
// picking from their camera roll gets instant visual confirmation they grabbed the right
// shot. The lazy useState initializer creates the blob URL synchronously on mount (ready for
// the first render, no placeholder flash); the effect only revokes it on unmount (avoids the
// setState-in-effect lint). A 0-byte / corrupt file decodes to a broken element, so onError
// hides it and the slot collapses cleanly (such a file fails presign anyway, so this is purely
// cosmetic) — applied to BOTH the image and the video for parity. Videos use the shared
// videoPosterSrc() #t=0.1 fragment so iOS Safari paints a frame instead of solid black.
export function UploadThumbnail({ file }: { file: File }) {
  const [src] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  if (file.type.startsWith("video/")) {
    return (
      <video
        src={videoPosterSrc(src)}
        className="size-10 shrink-0 rounded-tile object-cover"
        preload="metadata"
        muted
        playsInline
        onError={(e) => e.currentTarget.classList.add("hidden")}
      />
    );
  }

  // blob: URLs can't go through next/image (no configured hostname).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="size-10 shrink-0 rounded-tile object-cover"
      onError={(e) => e.currentTarget.classList.add("hidden")}
    />
  );
}
