"use client";

import { type ReactNode, useEffect, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import { PortalContainerProvider } from "@/components/ui/portal-container";

import type { Still } from "./fixtures";
import { type Ground, PHONE } from "./knobs";

/**
 * THE FRAMES EVERY PREVIEW DRAWS IN: a phone, 375 wide, 1:1 in the kit's
 * `Frame` (a same-origin iframe), so the album lays out at a phone's own width
 * and a fixed layer (the foot's shutter, a stand-in, a sheet) stands in the
 * frame's own screen.
 *
 * ★ ON THE GROUND THE QUESTION ASKS FOR, whatever the lab wears: the frame
 * stands in a pane of that ground (`frame-theme.ts`: the nearest `.dark` or
 * `.surface-paper` above a frame is its ground), and its layers portal into
 * the scene's own ground rather than the frame's body.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (`Measured`): what the
 * send says, where her photographs are, what the camera counts. If a caption
 * and the words above a frame disagree, the caption is the truth.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  h = PHONE.h,
  ground = "room",
  title,
  measure,
  children,
}: {
  id: string;
  h?: number;
  ground?: Ground;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const [measured, setMeasured] = useState("measuring");
  return (
    <div className={ground === "room" ? "dark" : "surface-paper"}>
      <Fit w={PHONE.w}>
        <Frame
          id={`${id}-${ground}`}
          w={PHONE.w}
          h={h}
          title={title}
          caption={measured}
        >
          <Measured
            probe={measure}
            deps={[id, ground]}
            onMeasure={setMeasured}
            timers={[400, 1200, 2400, 4000]}
            className="min-h-full"
          >
            <GroundRoot ground={ground}>{children}</GroundRoot>
          </Measured>
        </Frame>
      </Fit>
    </div>
  );
}

/** The scene's own ground, and the element its layers portal into. */
function GroundRoot({
  ground,
  children,
}: {
  ground: Ground;
  children: ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setEl}
      data-ns-ground={ground}
      className={`${ground === "room" ? "dark" : "surface-paper"} relative min-h-screen bg-background text-foreground`}
    >
      <PortalContainerProvider value={el}>{children}</PortalContainerProvider>
    </div>
  );
}

/**
 * ONE OPTION'S FRAMES, left to right as the night runs; the stage wraps a row
 * of frames to the room it has, so they are as large as it allows.
 */
export function Story({
  children,
  under,
}: {
  children: ReactNode;
  /** A lab drawing under the frames (the night's beats), never the product's. */
  under?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start gap-6">{children}</div>
      {under}
    </div>
  );
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/** A first element matching, in the frame's whole document. */
export const find = (root: HTMLElement, selector: string) =>
  root.ownerDocument.querySelector<HTMLElement>(selector);

export const findAll = (root: HTMLElement, selector: string) => [
  ...root.ownerDocument.querySelectorAll<HTMLElement>(selector),
];

/** Joins a caption's parts, or says it is not settled yet when one is missing. */
export const parts = (...bits: (string | null | undefined | false)[]) =>
  bits.some((b) => b === null) ? null : bits.filter(Boolean).join("; ");

/** Whether an element is in the frame's view, at least partly. */
export function inView(el: HTMLElement | null, win: Window): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < win.innerHeight && r.height > 0 && r.width > 0;
}

/* ── a photograph as a File ────────────────────────────────────────────── */

/** Stills already read into Files, by their source and name, so a second frame never reads one again. */
const FILES = new Map<string, Promise<File>>();

/**
 * A STILL AS THE FILE HER PHONE WOULD HAND THE PAGE: production's failure list
 * draws each row from the File itself (`usePickUrls` mints its own URL), so a
 * File with no bytes would draw the named stand-in instead of her photograph.
 * Read once from the local still; null until it has been.
 */
export function useStillFile(s: Still, name: string): File | null {
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    let live = true;
    const key = `${s.src}|${name}`;
    let read = FILES.get(key);
    if (!read) {
      read = fetch(s.src)
        .then((r) => r.blob())
        .then((b) => new File([b], name, { type: "image/jpeg" }));
      FILES.set(key, read);
    }
    void read.then((f) => {
      if (live) setFile(f);
    });
    return () => {
      live = false;
    };
  }, [s.src, name]);
  return file;
}

/** A File that only names its kind (the stack draws its picture from the still's own address). */
export const namedFile = (name: string) =>
  new File([], name, { type: "image/jpeg" });
