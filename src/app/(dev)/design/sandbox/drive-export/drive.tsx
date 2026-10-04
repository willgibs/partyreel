"use client";

import { ChevronRight, Film, Folder, Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { EVENT, FILES, photoAt, SHORT_IDS } from "./fixtures";
import type { ScreenId } from "./knobs";

/**
 * HER DRIVE'S FOLDER, AS A NEUTRAL STAND-IN: never Google's look (no mark, no
 * chrome of theirs), a plain list in our own atoms carrying only what is ours,
 * the folder's path and the files' names, sizes and the time each reached the
 * album (`modifiedTime`, which a send sets). Sorted by name, as a folder opens.
 */

export type Naming = "when-who" | "by-guest" | "zip";

type Row = {
  name: string;
  size: string;
  when: string;
  folder?: boolean;
  clip?: boolean;
};

const sizeOf = (mb: number) => `${mb.toFixed(1)} MB`;
const whenOf = (at: string) => {
  const [, time] = at.split(" ");
  const [hh, mm] = time!.split(".");
  return `${at.startsWith("2026-09-13") ? "13" : "12"} Sep 2026, ${hh}:${mm}`;
};

function rowsFor(naming: Naming): {
  path: string[];
  rows: Row[];
  inner?: { path: string[]; rows: Row[] };
} {
  if (naming === "when-who") {
    return {
      path: ["My Drive", "Partyreel", EVENT.folder],
      rows: FILES.map((f) => ({
        name: `${f.at} · ${f.who}${"second" in f ? " (2)" : ""}.${f.ext}`,
        size: sizeOf(f.bytes),
        when: whenOf(f.at),
        clip: f.kind === "clip",
      })),
    };
  }
  if (naming === "zip") {
    const rows = FILES.map((f, i) => ({
      name: `${EVENT.slug}-${SHORT_IDS[i]}.${f.ext}`,
      size: sizeOf(f.bytes),
      when: whenOf(f.at),
      clip: f.kind === "clip",
    }));
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return { path: ["My Drive", "Partyreel", EVENT.name], rows };
  }
  const guests = ["Ade", "Jo", "Maya", "Priya", "Sam", "Theo"];
  return {
    path: ["My Drive", "Partyreel", EVENT.name],
    rows: [
      ...guests.map((g) => ({ name: g, size: "", when: "", folder: true })),
      { name: "and 25 more guests' folders", size: "", when: "", folder: true },
    ],
    inner: {
      path: ["My Drive", "Partyreel", EVENT.name, "Priya"],
      rows: FILES.filter((f) => f.who === "Priya").map((f) => ({
        name: `${f.at}${"second" in f ? " (2)" : ""}.${f.ext}`,
        size: sizeOf(f.bytes),
        when: whenOf(f.at),
      })),
    },
  };
}

function Path({ parts }: { parts: string[] }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
      {parts.map((p, i) => (
        <span key={p} className="flex min-w-0 items-center gap-1">
          {i > 0 ? (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          ) : null}
          <span
            className={cn(
              "truncate",
              i === parts.length - 1 ? "font-medium" : "text-muted-foreground",
            )}
          >
            {p}
          </span>
        </span>
      ))}
    </span>
  );
}

function List({
  rows,
  desk,
  read,
}: {
  rows: Row[];
  desk: boolean;
  read: string;
}) {
  return (
    <ul
      data-dx-read={read}
      className="divide-y divide-border/60 rounded-float bg-card ring-1 ring-foreground/10"
    >
      {rows.map((r) => (
        <li key={r.name} className="flex items-center gap-3 px-3 py-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {r.folder ? (
              <Folder className="size-4" />
            ) : r.clip ? (
              <Film className="size-4" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
          {desk && r.when ? (
            <span className="w-44 shrink-0 text-xs text-muted-foreground tabular-nums">
              {r.when}
            </span>
          ) : null}
          {r.size ? (
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {r.size}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * THE SAME FOLDER AS A GRID OF PICTURES, as a file browser's grid view shows
 * one: a name under each, cut to one line, which is where a long name pays.
 */
function Grid({ rows, desk }: { rows: Row[]; desk: boolean }) {
  const files = rows.filter((r) => !r.folder).slice(0, desk ? 6 : 4);
  return (
    <ul
      data-dx-read="the grid's names"
      className={cn("grid gap-3", desk ? "grid-cols-6" : "grid-cols-2")}
    >
      {files.map((r, i) => (
        <li
          key={r.name}
          className="flex min-w-0 flex-col gap-1.5 rounded-float bg-card p-1.5 ring-1 ring-foreground/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the file's picture */}
          <img
            src={photoAt(i + 1).src}
            alt=""
            className="aspect-[4/3] w-full rounded-[calc(var(--radius-float)-4px)] object-cover"
          />
          <span className="truncate px-1 pb-0.5 text-xs">{r.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function DriveFolder({
  naming,
  screen,
}: {
  naming: Naming;
  screen: ScreenId;
}) {
  const desk = screen === "1440";
  const { path, rows, inner } = rowsFor(naming);
  return (
    <div className="flex min-h-screen flex-col gap-4 bg-background p-4 text-foreground sm:p-8">
      <span className="text-label font-semibold text-muted-foreground uppercase">
        Her Google Drive · a stand-in
      </span>
      <div
        className={cn(
          "grid gap-6",
          desk && inner ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <Path parts={path} />
          <List rows={rows} desk={desk && !inner} read="the album's folder" />
          {inner ? null : <Grid rows={rows} desk={desk} />}
        </div>
        {inner ? (
          <div className="flex min-w-0 flex-col gap-3">
            <Path parts={inner.path} />
            <List rows={inner.rows} desk={desk} read="Priya's folder" />
            <Grid rows={inner.rows} desk={false} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
