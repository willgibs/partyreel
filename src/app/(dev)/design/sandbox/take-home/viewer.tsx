"use client";

import type { CSSProperties } from "react";
import {
  CopyCheck,
  CopyPlus,
  Download,
  Flag,
  Heart,
  Link2,
  Share2,
  X,
} from "lucide-react";

import {
  LIGHTBOX_ACTION,
  ProgressGlyph,
} from "@/components/shared/media-lightbox-parts/actions";
import { FaceCredit } from "@/components/shared/media-lightbox-parts/credit";
import { formatCount } from "@/lib/format/count";
import { GLASS, GLASS_BEHIND, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { photoAt } from "./fixtures";
import { SCREENS, type ScreenId } from "./scene";

/**
 * THE VIEWER AS BUILT, OVER THE ALBUM (`media-lightbox.tsx`), and the one
 * thing a way home adds to it.
 *
 * Production's chrome, at its own measures (`media-lightbox-parts/geometry.ts`):
 * the album blurred at half brightness behind (`GLASS_BEHIND`, on its own
 * element), the photograph fitted between 64 px of chrome above and 68 below
 * (plus the filmstrip's 54 at a desk), the neighbours' slivers at the edges (28
 * px and an 8 px gap in a hand, 96 and 64 at a desk), the face-led credit top
 * left (`FaceCredit`, the real component), the close top right, and the
 * floating capsule at the foot: Like, Save, Share, Copy link and Report for a
 * guest on someone else's photograph.
 *
 * ★ THE CAPSULE IS QUOTED, ITS ATOMS ARE NOT: its glyphs wear production's
 * `LIGHTBOX_ACTION` and its wait production's `ProgressGlyph` (a ring with a
 * stop), because the real capsule's like renders nothing without a likes
 * store and its Save reads the viewer's held originals.
 */

const CHROME = { top: 64, bottom: 68, filmstrip: 54 } as const;

const PEEK: Record<ScreenId, { peek: number; gap: number }> = {
  "375": { peek: 28, gap: 8 },
  "1440": { peek: 96, gap: 64 },
};

/** The photograph's box: the stage less the chrome and the slivers, fitted to its own ratio. */
function fit(screen: ScreenId, ratio: number) {
  const { w, h } = SCREENS[screen];
  const { peek, gap } = PEEK[screen];
  const roomW = w - 2 * (peek + gap);
  const roomH =
    h - CHROME.top - CHROME.bottom - (screen === "1440" ? CHROME.filmstrip : 0);
  const width = Math.min(roomW, roomH * ratio);
  return { width, height: width / ratio };
}

/** Whose photograph it is (Ruby confirmed her email, so her name stands plain). */
const CREDITED = {
  id: "th-viewed",
  type: "photo" as const,
  url: "",
  uploaderName: "Ruby",
  isHost: false,
  isVerified: true,
  uploaderFace: null,
};

export type Gather = { count: number; active: boolean };

/**
 * ONE PHOTOGRAPH IN THE VIEWER. `gather` adds the tray's glyph to the capsule
 * (its count on its shoulder once she has gathered any); `saving` draws Save's
 * wait in production's own ring (0 to 1); `act` names which control the
 * caption measures.
 */
export function Viewer({
  screen,
  index,
  gather,
  saving,
  act = "save",
}: {
  screen: ScreenId;
  index: number;
  gather?: Gather;
  saving?: number;
  act?: "save" | "gather";
}) {
  const photo = photoAt(index);
  const ratio = photo.w / photo.h;
  const box = fit(screen, ratio);
  const { w, h } = SCREENS[screen];
  const { peek } = PEEK[screen];
  const stripH = screen === "1440" ? CHROME.filmstrip : 0;
  const top =
    CHROME.top + (h - CHROME.top - CHROME.bottom - stripH - box.height) / 2;
  // The neighbours show as slivers at the stage's edges, the gap of dark
  // between each and the photograph (`peekMetrics`).
  const pictures = [
    { p: photoAt(index + 17), left: 0, width: peek },
    { p: photo, left: (w - box.width) / 2, width: box.width },
    { p: photoAt(index + 1), left: w - peek, width: peek },
  ];
  return (
    <div data-th-viewer="" className="fixed inset-0 z-50">
      <div aria-hidden className={cn("absolute inset-0", GLASS_BEHIND)} />
      {pictures.map(({ p, left, width }, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the photograph and its neighbours
        <img
          key={i}
          src={p.src}
          alt=""
          draggable={false}
          className="absolute object-cover"
          style={{ left, top, width, height: box.height } as CSSProperties}
        />
      ))}
      <div className="absolute top-2.5 left-2.5 flex max-w-[calc(100%-4rem)]">
        <FaceCredit item={CREDITED} viewerIsHost={false} isOwn={false} />
      </div>
      <span
        aria-label="Close"
        className={cn(
          "absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full text-white",
          GLASS,
        )}
      >
        <X className={cn("size-4", GLASS_MARK_LIT)} />
      </span>
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-2"
        style={{ bottom: 16 + stripH }}
      >
        <Capsule gather={gather} saving={saving} act={act} />
      </div>
      {screen === "1440" && <Filmstrip index={index} />}
    </div>
  );
}

/** The capsule, quoted: the enjoy group a guest has on someone else's photograph. */
function Capsule({
  gather,
  saving,
  act,
}: {
  gather?: Gather;
  saving?: number;
  act: "save" | "gather";
}) {
  return (
    <div
      className={cn(
        "flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-full px-4 py-2.5 sm:gap-4 sm:px-5",
        GLASS,
      )}
    >
      <span
        aria-label="Like"
        className={cn(LIGHTBOX_ACTION, "hover:text-like")}
      >
        <Heart className="size-5" />
      </span>
      <span
        data-th-act={act === "save" ? "" : undefined}
        aria-label={
          saving !== undefined ? "Preparing to save. Tap to stop." : "Save"
        }
        className={cn(LIGHTBOX_ACTION, "hover:text-save")}
      >
        {saving !== undefined ? (
          <ProgressGlyph fraction={saving} />
        ) : (
          <Download className="size-5" />
        )}
      </span>
      {gather && (
        // THE TRAY'S GLYPH, beside Save: gather this photograph to take home later. Active, it wears
        // the save blue as a /25 fill (design-system.md: an icon takes its colour while active), and
        // its shoulder carries how many she has gathered.
        <span
          data-th-act={act === "gather" ? "" : undefined}
          aria-label={
            gather.active
              ? `In your tray, ${formatCount(gather.count)} photos`
              : "Add to your tray"
          }
          className={cn(
            LIGHTBOX_ACTION,
            "hover:text-save",
            gather.active && "text-save",
          )}
        >
          {gather.active ? (
            <CopyCheck className="size-5 fill-save/25" />
          ) : (
            <CopyPlus className="size-5" />
          )}
          {gather.count > 0 && (
            <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-save px-1 text-[10px] font-semibold text-save-foreground tabular-nums">
              {formatCount(gather.count)}
            </span>
          )}
        </span>
      )}
      <span
        aria-label="Share"
        className={cn(LIGHTBOX_ACTION, "hover:text-save")}
      >
        <Share2 className="size-5" />
      </span>
      <span
        aria-label="Copy link"
        className={cn(LIGHTBOX_ACTION, "hover:text-save")}
      >
        <Link2 className="size-5" />
      </span>
      <span
        aria-label="Report this photo"
        className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
      >
        <Flag className="size-5" />
      </span>
    </div>
  );
}

/** The desk's filmstrip (`filmstrip.tsx`), quoted: seven frames each side, the current one lifted. */
function Filmstrip({ index }: { index: number }) {
  const FRAME = 30;
  return (
    <div
      className="absolute inset-x-0 flex justify-center"
      style={{ bottom: 12 }}
    >
      <div className="relative h-11" style={{ width: 15 * FRAME }}>
        {Array.from({ length: 15 }, (_, k) => k - 7).map((d) => (
          <span
            key={d}
            className={cn(
              "absolute bottom-0 left-1/2 -ml-3 h-9 w-6 overflow-hidden rounded-[3px] bg-white/10",
              d === 0 ? "opacity-100 ring-2 ring-white" : "opacity-45",
            )}
            style={{
              transform: `translateX(${d * FRAME}px) scale(${d === 0 ? 1.12 : 1})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, a filmstrip frame */}
            <img
              src={photoAt(index + d + 18).src}
              alt=""
              draggable={false}
              className="size-full object-cover"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
