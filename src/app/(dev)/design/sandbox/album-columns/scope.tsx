"use client";

import { useState } from "react";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import {
  TILE_SIZE_LABEL,
  TILE_SIZES,
  type TileSize,
} from "@/lib/shared/tile-size-cookie";
import { cn } from "@/lib/utils";

export type ScopeOption = "shared" | "split" | "shared-defaults";

/** A quarter-scale reading of the real steps (180/240/300 -> 60/80/100), so
 *  the two cards fit side by side and still show the same three sizes moving. */
const SCALE = 1 / 3;

function MiniAlbum({ size, count = 4 }: { size: TileSize; count?: number }) {
  const px = Math.round(size * SCALE);
  return (
    <div className="flex flex-wrap gap-1" style={{ width: px * 2 + 4 }}>
      {GALLERY_ITEMS.slice(0, count).map((item) => (
        <div
          key={item.id}
          className="pointer-events-none overflow-hidden bg-black/10"
          style={{ width: px, height: px, borderRadius: "var(--radius-tile)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a tiny illustrative thumbnail, not a tile in the reviewable album */}
          <img
            src={item.previewUrl ?? item.url}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function SizeButtons({
  value,
  onChange,
  label,
}: {
  value: TileSize;
  onChange: (v: TileSize) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {TILE_SIZES.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors active:scale-95 motion-reduce:active:scale-100",
            value === s
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {TILE_SIZE_LABEL[s][0]}
        </button>
      ))}
    </div>
  );
}

function RoleCard({
  role,
  value,
  onChange,
}: {
  role: "Hosting" | "Guesting";
  value: TileSize;
  onChange: (v: TileSize) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{role}</span>
        <SizeButtons value={value} onChange={onChange} label={`${role} tile size`} />
      </div>
      <MiniAlbum size={value} />
      <span className="text-[11px] text-muted-foreground">
        {TILE_SIZE_LABEL[value]}
      </span>
    </div>
  );
}

/** Press any button on either card and watch what moves: one value for
 *  "shared", two independent ones for "split", and "shared-defaults" starts
 *  the two apart but LOCKS them together the moment either is first touched
 *  (still one cookie once written). */
export function ScopeShowcase({ option }: { option: ScopeOption }) {
  const [shared, setShared] = useState<TileSize>(240);
  const [touched, setTouched] = useState(false);
  const [host, setHost] = useState<TileSize>(180);
  const [guest, setGuest] = useState<TileSize>(300);

  if (option === "split") {
    return (
      <div className="grid grid-cols-2 gap-3 bg-background p-4 text-foreground">
        <RoleCard role="Hosting" value={host} onChange={setHost} />
        <RoleCard role="Guesting" value={guest} onChange={setGuest} />
      </div>
    );
  }

  if (option === "shared-defaults") {
    // A different untouched pair than "split"'s (180/300), so the two read as
    // two different pictures before either card is ever pressed.
    const hostVal = touched ? shared : 180;
    const guestVal = touched ? shared : 240;
    const set = (v: TileSize) => {
      setTouched(true);
      setShared(v);
    };
    return (
      <div className="grid grid-cols-2 gap-3 bg-background p-4 text-foreground">
        <RoleCard role="Hosting" value={hostVal} onChange={set} />
        <RoleCard role="Guesting" value={guestVal} onChange={set} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 bg-background p-4 text-foreground">
      <RoleCard role="Hosting" value={shared} onChange={setShared} />
      <RoleCard role="Guesting" value={shared} onChange={setShared} />
    </div>
  );
}
