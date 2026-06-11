import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, Heart, Share, X } from "lucide-react";

import { EVENT_NAME, PORTRAIT_PHOTO } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the lightbox chrome, the most-used full-screen surface in the
 * product. Always the dark gallery tokens (ADR-0010) in every variant; what
 * varies is where controls and attribution live around the photo.
 */
export function LightboxVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Pinned chrome"
        rationale="Bars top and bottom, always visible: zero discovery cost, every control one glance away. The photo shares the room."
        framed={false}
      >
        <Stage>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <p className="text-[11px] text-gallery-muted">14 of 128</p>
            <X className="size-4 text-gallery-muted" />
          </div>
          <Media />
          <div className="flex items-center justify-between px-3.5 py-3">
            <p className="text-[11px] text-gallery-muted">Photo by Dana</p>
            <ActionRow />
          </div>
        </Stage>
      </Variant>

      <Variant
        n={2}
        name="Floating pill"
        rationale="The photo runs edge to edge; one floating pill carries the actions. Lighter chrome, controls stay thumb-reach."
        framed={false}
      >
        <Stage>
          <div className="absolute inset-0">
            <Image
              src={PORTRAIT_PHOTO}
              alt=""
              fill
              sizes="360px"
              className="object-cover"
            />
          </div>
          <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
            <X className="size-3.5 text-white" />
          </span>
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5">
            <p className="text-[10px] text-white/75">Photo by Dana · 14 of 128</p>
            <div className="flex items-center gap-4 rounded-full bg-black/55 px-4 py-2 backdrop-blur-sm">
              <ActionRow light />
            </div>
          </div>
        </Stage>
      </Variant>

      <Variant
        n={3}
        name="Immersive auto-hide"
        rationale="Chrome appears on tap and gets out of the way: the purest photo experience, one learned gesture as the price."
        framed={false}
      >
        <Stage>
          <div className="absolute inset-0">
            <Image
              src={PORTRAIT_PHOTO}
              alt=""
              fill
              sizes="360px"
              className="object-cover"
            />
          </div>
          {/* The hidden-state mock: chrome ghosted to communicate auto-hide. */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3.5 py-2.5 opacity-35">
            <p className="text-[11px] text-white">14 of 128</p>
            <X className="size-4 text-white" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3.5 py-3 opacity-35">
            <p className="text-[11px] text-white">Photo by Dana</p>
            <ActionRow light />
          </div>
          <span className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-[10px] text-white/85 backdrop-blur-sm">
            Tap to show controls
          </span>
        </Stage>
      </Variant>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex h-[420px] flex-col overflow-hidden rounded-[var(--radius)] bg-gallery text-gallery-foreground"
    >
      {children}
    </div>
  );
}

function Media() {
  return (
    <div className="relative mx-auto flex w-full flex-1 items-center justify-center px-10">
      <ChevronLeft className="absolute left-2.5 size-4 text-gallery-muted" />
      <div className="relative h-[290px] w-full max-w-[200px] overflow-hidden rounded-md">
        <Image
          src={PORTRAIT_PHOTO}
          alt=""
          fill
          sizes="200px"
          className="object-cover"
        />
      </div>
      <ChevronRight className="absolute right-2.5 size-4 text-gallery-muted" />
      <span className="sr-only">{EVENT_NAME}</span>
    </div>
  );
}

function ActionRow({ light = false }: { light?: boolean }) {
  const muted = light ? "text-white/80" : "text-gallery-muted";
  return (
    <div className="flex items-center gap-4">
      <span className={`flex items-center gap-1.5 text-[11px] ${light ? "text-white" : ""}`}>
        <Heart
          className="size-4"
          style={{ color: "var(--dir-like)" }}
          fill="currentColor"
        />
        12
      </span>
      <Download className={`size-4 ${muted}`} />
      <Share className={`size-4 ${muted}`} />
    </div>
  );
}
