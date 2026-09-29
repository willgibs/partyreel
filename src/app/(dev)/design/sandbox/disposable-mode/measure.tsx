"use client";

import { useEffect, useRef, useState } from "react";

import { DOCK_PILL } from "@/components/lab";

/**
 * THE MEASURE: a real phone's camera, as the album's own camera would take a
 * shot on it, against the photo its camera app takes (the manifest's ask:
 * "the viewfinder's real capture size on an iPhone and an Android"). The
 * "full size" promise rides on it.
 *
 * ★ A LAB INSTRUMENT, NOT A PREVIEW. It lives in the board's dock (so it is
 * on the whole board and on every step's stage head), asks the camera only
 * when pressed, runs on the reader's own device and sends nothing anywhere:
 * the line it prints is copied by hand.
 *
 * What it reads, in the order the album's camera would meet it:
 *  1. the stream it is given when it asks for the phone's largest frame
 *     (`width` 4032 and `height` 3024 as ideals, the rear camera): the
 *     track's settings, and its capabilities where the browser reports them;
 *  2. the shot: that frame drawn whole onto a canvas and encoded as the page
 *     would send it (JPEG at 0.92), and, where the browser has ImageCapture
 *     (Android's Chrome; Safari 27 does not), a real photo from `takePhoto`
 *     at its largest;
 *  3. the camera app's own photo, through the file input's `capture` (the
 *     phone's own camera, the "phone" option round one did not pick).
 */

type Read = { w: number; h: number; bytes: number; type?: string };

const mp = (r: Read) => (r.w * r.h) / 1e6;
const said = (r: Read | null | "none") =>
  r === null
    ? "not yet"
    : r === "none"
      ? "none (no ImageCapture)"
      : `${r.w}x${r.h} (${mp(r).toFixed(1)} MP, ${(r.bytes / 1024 / 1024).toFixed(1)} MB${r.type ? `, ${r.type}` : ""})`;

/** The phone and the browser, in the words a line needs. */
function device(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua)
    ? `iOS ${(/OS (\d+)_/.exec(ua) ?? [])[1] ?? "?"}`
    : /Android (\d+)/.test(ua)
      ? `Android ${(/Android (\d+)/.exec(ua) ?? [])[1]}`
      : /Mac OS X/.test(ua)
        ? "macOS"
        : "other";
  const browser = /CriOS\/(\d+)/.test(ua)
    ? `Chrome ${(/CriOS\/(\d+)/.exec(ua) ?? [])[1]} (WebKit)`
    : /Chrome\/(\d+)/.test(ua)
      ? `Chrome ${(/Chrome\/(\d+)/.exec(ua) ?? [])[1]}`
      : /Version\/(\d+)/.test(ua)
        ? `Safari ${(/Version\/(\d+)/.exec(ua) ?? [])[1]}`
        : "a browser";
  return `${os}, ${browser}`;
}

async function measureBlob(blob: Blob): Promise<Read> {
  const bmp = await createImageBitmap(blob);
  const r = { w: bmp.width, h: bmp.height, bytes: blob.size, type: blob.type };
  bmp.close();
  return r;
}

function Panel({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<string | null>(null);
  const [frame, setFrame] = useState<Read | null>(null);
  const [photo, setPhoto] = useState<Read | null | "none">(null);
  const [app, setApp] = useState<Read | null>(null);

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function open() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 4032 },
          height: { ideal: 3024 },
        },
      });
      stream.current = s;
      const t = s.getVideoTracks()[0];
      const set = t.getSettings();
      const caps =
        typeof t.getCapabilities === "function" ? t.getCapabilities() : null;
      setTrack(
        `${set.width}x${set.height} at ${Math.round(set.frameRate ?? 0)} fps` +
          (caps?.width?.max
            ? `; the most it offers: ${caps.width.max}x${caps.height?.max}`
            : ""),
      );
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => {});
      }
    } catch (e) {
      setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
    }
  }

  async function shoot() {
    const v = video.current;
    const s = stream.current;
    if (!v || !s) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>((r) =>
      c.toBlob(r, "image/jpeg", 0.92),
    );
    if (blob) setFrame(await measureBlob(blob));
    if (!("ImageCapture" in window)) {
      setPhoto("none");
      return;
    }
    try {
      const ic = new ImageCapture(s.getVideoTracks()[0]);
      const caps = await ic.getPhotoCapabilities();
      const shot = await ic.takePhoto({
        imageWidth: caps.imageWidth?.max,
        imageHeight: caps.imageHeight?.max,
      });
      setPhoto(await measureBlob(shot));
    } catch (e) {
      setError(e instanceof Error ? `takePhoto: ${e.message}` : String(e));
      setPhoto("none");
    }
  }

  async function fromApp(file: File | undefined) {
    if (!file) return;
    try {
      setApp(await measureBlob(file));
    } catch {
      // A HEIC the browser cannot decode still has a size and a type.
      setApp({ w: 0, h: 0, bytes: file.size, type: file.type });
    }
  }

  const line = `${device()} · live frame ${said(frame)} · takePhoto ${said(photo)} · camera app ${said(app)} · track ${track ?? "not opened"}`;

  return (
    <div
      role="dialog"
      aria-label="Measure a phone's camera"
      className="fixed inset-x-3 top-20 z-50 max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-popover p-4 text-sm text-popover-foreground shadow-layer sm:right-6 sm:left-auto sm:w-[26rem]"
      data-dm-measure
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">A phone&rsquo;s real capture size</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open this board on the phone, open the camera, take a frame, then
            one photo in the camera app. Nothing leaves the phone.
          </p>
        </div>
        <button type="button" className={DOCK_PILL} onClick={onClose}>
          Close
        </button>
      </div>
      <video
        ref={video}
        playsInline
        muted
        className="mt-3 aspect-[3/4] w-40 rounded-md bg-black object-cover"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={DOCK_PILL} onClick={open}>
          1. Open the camera
        </button>
        <button type="button" className={DOCK_PILL} onClick={shoot}>
          2. Take a frame
        </button>
        <button
          type="button"
          className={DOCK_PILL}
          onClick={() => input.current?.click()}
        >
          3. The camera app&rsquo;s photo
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void fromApp(e.currentTarget.files?.[0])}
        />
      </div>
      <dl className="mt-3 space-y-1 text-xs">
        <div>
          <dt className="inline text-muted-foreground">The stream: </dt>
          <dd className="inline">{track ?? "not opened"}</dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">
            A frame, as the page shoots:{" "}
          </dt>
          <dd className="inline">{said(frame)}</dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">takePhoto: </dt>
          <dd className="inline">{said(photo)}</dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">The camera app: </dt>
          <dd className="inline">{said(app)}</dd>
        </div>
      </dl>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <p
        className="mt-3 rounded-md bg-muted p-2 text-xs break-words select-all"
        data-dm-measure-line
      >
        {line}
      </p>
    </div>
  );
}

/** The dock's button: the panel opens on a press and asks for nothing until then. */
export function MeasureButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={DOCK_PILL} onClick={() => setOpen(true)}>
        Measure a phone
      </button>
      {open && <Panel onClose={() => setOpen(false)} />}
    </>
  );
}
