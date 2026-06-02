"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AVATAR_OUTPUT_SIZE,
  AVATAR_WEBP_QUALITY,
  computeCropRect,
} from "@/lib/media/avatar-crop";

// On-screen sizes (CSS px). BOX is the draggable area; FRAME is the circular crop window
// centred in it (= computeCropRect's `viewport`). Kept FIXED so the pointer math is exact —
// 288 fits inside the dialog on phones >= 360px wide. The OUTPUT is always AVATAR_OUTPUT_SIZE
// (512), so the on-screen size doesn't affect quality.
const BOX_PX = 288;
const FRAME_PX = 224;
const MAX_ZOOM = 3;

type Point = { x: number; y: number };

// Displayed image size at a given zoom: cover-fit so the SHORTER edge fills the frame, then * zoom.
function displayedSize(
  bmp: ImageBitmap,
  zoom: number,
): { dW: number; dH: number } {
  const minEdge = Math.min(bmp.width, bmp.height);
  const scale = (FRAME_PX / minEdge) * zoom;
  return { dW: bmp.width * scale, dH: bmp.height * scale };
}

// Keep the image covering the frame: the pan can't expose an edge of the circle.
function clampOffset(off: Point, dW: number, dH: number): Point {
  const maxX = Math.max(0, (dW - FRAME_PX) / 2);
  const maxY = Math.max(0, (dH - FRAME_PX) / 2);
  return {
    x: Math.min(Math.max(off.x, -maxX), maxX),
    y: Math.min(Math.max(off.y, -maxY), maxY),
  };
}

// Interactive avatar cropper. The dialog is open whenever `file` is non-null. The stateful body
// is KEYED by the file (CropperBody below), so picking a new photo remounts it with fresh state
// — the React "reset state via key" pattern, which avoids resetting transform state inside an
// effect. The pure pan/zoom→source-px math lives in lib/media/avatar-crop (computeCropRect).
export function AvatarCropper({
  file,
  onCancel,
  onCropped,
  saving,
}: {
  file: File | null;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
  /** True while the parent uploads the cropped blob (locks the controls). */
  saving: boolean;
}) {
  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        // Esc / overlay click closes only when we're not mid-upload.
        if (!open && !saving) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
          <DialogDescription>
            Drag to reposition, and zoom to frame it.
          </DialogDescription>
        </DialogHeader>
        {file && (
          <CropperBody
            key={`${file.name}:${file.size}:${file.lastModified}`}
            file={file}
            saving={saving}
            onCancel={onCancel}
            onCropped={onCropped}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CropperBody({
  file,
  saving,
  onCancel,
  onCropped,
}: {
  file: File;
  saving: boolean;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ id: number; start: Point; origin: Point } | null>(
    null,
  );
  // Read the latest onCancel from the decode catch without making it an effect dependency.
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  // Decode the picked file into an EXIF-oriented ImageBitmap (set async, in .then — no
  // synchronous setState in the effect body). Initial state is already the reset state, since
  // a new file remounts this component (see the key above).
  useEffect(() => {
    let cancelled = false;
    let created: ImageBitmap | null = null;
    createImageBitmap(file, { imageOrientation: "from-image" })
      .then((bmp) => {
        if (cancelled) {
          bmp.close();
          return;
        }
        created = bmp;
        setBitmap(bmp);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Couldn't read that image. Try a JPG or PNG.");
        onCancelRef.current();
      });
    return () => {
      cancelled = true;
      created?.close();
    };
  }, [file]);

  // Live preview: draw the image panned/zoomed within the box. The circular dim overlay (in JSX)
  // shows the crop frame; this canvas shows the underlying image so you can see what's outside it.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { dW, dH } = displayedSize(bitmap, zoom);
    ctx.clearRect(0, 0, BOX_PX, BOX_PX);
    ctx.drawImage(
      bitmap,
      (BOX_PX - dW) / 2 + offset.x,
      (BOX_PX - dH) / 2 + offset.y,
      dW,
      dH,
    );
  }, [bitmap, zoom, offset]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!bitmap || saving) return;
      (e.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = {
        id: e.pointerId,
        start: { x: e.clientX, y: e.clientY },
        origin: offset,
      };
    },
    [bitmap, saving, offset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== e.pointerId || !bitmap) return;
      const { dW, dH } = displayedSize(bitmap, zoom);
      setOffset(
        clampOffset(
          {
            x: drag.origin.x + (e.clientX - drag.start.x),
            y: drag.origin.y + (e.clientY - drag.start.y),
          },
          dW,
          dH,
        ),
      );
    },
    [bitmap, zoom],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  function onZoomChange(next: number) {
    setZoom(next);
    if (!bitmap) return;
    const { dW, dH } = displayedSize(bitmap, next);
    setOffset((o) => clampOffset(o, dW, dH));
  }

  function handleSave() {
    if (!bitmap) return;
    const { sx, sy, side } = computeCropRect({
      srcW: bitmap.width,
      srcH: bitmap.height,
      viewport: FRAME_PX,
      zoom,
      offsetX: offset.x,
      offsetY: offset.y,
    });
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Couldn't process that image.");
      return;
    }
    ctx.drawImage(
      bitmap,
      sx,
      sy,
      side,
      side,
      0,
      0,
      AVATAR_OUTPUT_SIZE,
      AVATAR_OUTPUT_SIZE,
    );
    canvas.toBlob(
      (blob) => {
        if (blob) onCropped(blob);
        else toast.error("Couldn't process that image.");
      },
      "image/webp",
      AVATAR_WEBP_QUALITY,
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative touch-none overflow-hidden rounded-lg bg-muted"
          style={{ width: BOX_PX, height: BOX_PX }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <canvas
            ref={canvasRef}
            width={BOX_PX}
            height={BOX_PX}
            className="block size-full cursor-grab active:cursor-grabbing"
          />
          {/* Circular crop frame: a centred ring with a huge spread shadow dimming outside it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/70"
            style={{
              width: FRAME_PX,
              height: FRAME_PX,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
            }}
          />
          {!bitmap && (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
        </div>

        <label className="flex w-full items-center gap-3 text-xs text-muted-foreground">
          Zoom
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!bitmap || saving}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-primary"
            aria-label="Zoom"
          />
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!bitmap || saving}>
          {saving ? "Saving…" : "Save photo"}
        </Button>
      </DialogFooter>
    </>
  );
}
